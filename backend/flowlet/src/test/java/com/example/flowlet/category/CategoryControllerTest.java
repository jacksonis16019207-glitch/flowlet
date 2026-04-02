package com.example.flowlet.category;

import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import com.example.flowlet.infrastructure.jpa.account.repository.SpringDataAccountRepository;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import com.example.flowlet.infrastructure.jpa.transaction.entity.TransactionEntity;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataTransactionRepository;
import com.example.flowlet.transaction.domain.model.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataTransactionRepository transactionRepository;

    @Autowired
    private SpringDataSubcategoryRepository subcategoryRepository;

    @Autowired
    private SpringDataCategoryRepository categoryRepository;

    @Autowired
    private SpringDataAccountRepository accountRepository;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        subcategoryRepository.deleteAll();
        categoryRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void getCategoriesAndSubcategoriesReturnsSeededMasterData() throws Exception {
        CategoryEntity category = saveCategory("食費", CategoryType.EXPENSE, 10, true);
        saveSubcategory(category.getCategoryId(), "外食", 10, true);

        mockMvc.perform(get("/api/categories").queryParam("categoryType", "EXPENSE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].categoryName").value("食費"));

        mockMvc.perform(get("/api/subcategories").queryParam("categoryId", String.valueOf(category.getCategoryId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].subcategoryName").value("外食"));
    }

    @Test
    void createAndUpdateCategoryAndSubcategory() throws Exception {
        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryName":"学び",
                      "categoryType":"EXPENSE",
                      "displayOrder":30,
                      "active":true
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.categoryName").value("学び"))
            .andExpect(jsonPath("$.categoryType").value("EXPENSE"));

        CategoryEntity category = categoryRepository.findByCategoryTypeAndCategoryName(CategoryType.EXPENSE, "学び")
            .orElseThrow();

        mockMvc.perform(put("/api/categories/{categoryId}", category.getCategoryId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryName":"自己投資",
                      "categoryType":"EXPENSE",
                      "displayOrder":40,
                      "active":true
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.categoryName").value("自己投資"))
            .andExpect(jsonPath("$.displayOrder").value(40));

        mockMvc.perform(post("/api/subcategories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryId":%d,
                      "subcategoryName":"書籍",
                      "displayOrder":10,
                      "active":true
                    }
                    """.formatted(category.getCategoryId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.subcategoryName").value("書籍"));

        SubcategoryEntity subcategory = subcategoryRepository.findByCategoryIdAndSubcategoryName(category.getCategoryId(), "書籍")
            .orElseThrow();

        mockMvc.perform(put("/api/subcategories/{subcategoryId}", subcategory.getSubcategoryId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryId":%d,
                      "subcategoryName":"専門書",
                      "displayOrder":20,
                      "active":true
                    }
                    """.formatted(category.getCategoryId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.subcategoryName").value("専門書"))
            .andExpect(jsonPath("$.displayOrder").value(20));
    }

    @Test
    void deleteUnusedCategoryPhysicallyDeletesCategoryAndSubcategories() throws Exception {
        CategoryEntity category = saveCategory("レジャー", CategoryType.EXPENSE, 10, true);
        SubcategoryEntity subcategory = saveSubcategory(category.getCategoryId(), "映画", 10, true);

        mockMvc.perform(delete("/api/categories/{categoryId}", category.getCategoryId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DELETED"))
            .andExpect(jsonPath("$.active").value(false));

        org.assertj.core.api.Assertions.assertThat(categoryRepository.findById(category.getCategoryId())).isEmpty();
        org.assertj.core.api.Assertions.assertThat(subcategoryRepository.findById(subcategory.getSubcategoryId())).isEmpty();
    }

    @Test
    void deleteReferencedCategoryDeactivatesCategoryAndSubcategories() throws Exception {
        AccountEntity account = saveAccount();
        CategoryEntity category = saveCategory("食費", CategoryType.EXPENSE, 10, true);
        CategoryEntity otherCategory = saveCategory("固定費", CategoryType.EXPENSE, 20, true);
        SubcategoryEntity subcategory = saveSubcategory(category.getCategoryId(), "外食", 10, true);
        saveTransaction(account.getAccountId(), category.getCategoryId(), subcategory.getSubcategoryId());

        mockMvc.perform(delete("/api/categories/{categoryId}", category.getCategoryId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DEACTIVATED"))
            .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(put("/api/categories/{categoryId}", category.getCategoryId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryName":"食費",
                      "categoryType":"INCOME",
                      "displayOrder":10,
                      "active":false
                    }
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("CATEGORY_TYPE_CHANGE_NOT_ALLOWED"));

        mockMvc.perform(put("/api/subcategories/{subcategoryId}", subcategory.getSubcategoryId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "categoryId":%d,
                      "subcategoryName":"外食",
                      "displayOrder":10,
                      "active":false
                    }
                    """.formatted(otherCategory.getCategoryId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("SUBCATEGORY_CATEGORY_CHANGE_NOT_ALLOWED"));
    }

    @Test
    void deleteReferencedSubcategoryDeactivatesButUnusedSubcategoryIsDeleted() throws Exception {
        AccountEntity account = saveAccount();
        CategoryEntity category = saveCategory("固定費", CategoryType.EXPENSE, 10, true);
        SubcategoryEntity usedSubcategory = saveSubcategory(category.getCategoryId(), "電気代", 10, true);
        SubcategoryEntity unusedSubcategory = saveSubcategory(category.getCategoryId(), "ガス代", 20, true);
        saveTransaction(account.getAccountId(), category.getCategoryId(), usedSubcategory.getSubcategoryId());

        mockMvc.perform(delete("/api/subcategories/{subcategoryId}", usedSubcategory.getSubcategoryId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DEACTIVATED"));

        mockMvc.perform(delete("/api/subcategories/{subcategoryId}", unusedSubcategory.getSubcategoryId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DELETED"));

        org.assertj.core.api.Assertions.assertThat(subcategoryRepository.findById(usedSubcategory.getSubcategoryId()))
            .get()
            .extracting(SubcategoryEntity::isActive)
            .isEqualTo(false);
        org.assertj.core.api.Assertions.assertThat(subcategoryRepository.findById(unusedSubcategory.getSubcategoryId())).isEmpty();
    }

    private AccountEntity saveAccount() {
        AccountEntity account = new AccountEntity();
        account.setProviderName("テスト銀行");
        account.setAccountName("メイン口座");
        account.setAccountCategory(AccountCategory.BANK);
        account.setBalanceSide(BalanceSide.ASSET);
        account.setActive(true);
        account.setDisplayOrder(10);
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    private CategoryEntity saveCategory(String name, CategoryType type, int displayOrder, boolean active) {
        CategoryEntity category = new CategoryEntity();
        category.setCategoryName(name);
        category.setCategoryType(type);
        category.setDisplayOrder(displayOrder);
        category.setActive(active);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    private SubcategoryEntity saveSubcategory(Long categoryId, String name, int displayOrder, boolean active) {
        SubcategoryEntity subcategory = new SubcategoryEntity();
        subcategory.setCategoryId(categoryId);
        subcategory.setSubcategoryName(name);
        subcategory.setDisplayOrder(displayOrder);
        subcategory.setActive(active);
        subcategory.setCreatedAt(LocalDateTime.now());
        subcategory.setUpdatedAt(LocalDateTime.now());
        return subcategoryRepository.save(subcategory);
    }

    private TransactionEntity saveTransaction(Long accountId, Long categoryId, Long subcategoryId) {
        TransactionEntity transaction = new TransactionEntity();
        transaction.setAccountId(accountId);
        transaction.setGoalBucketId(null);
        transaction.setCategoryId(categoryId);
        transaction.setSubcategoryId(subcategoryId);
        transaction.setTransactionType(TransactionType.EXPENSE);
        transaction.setTransactionDate(LocalDate.of(2026, 4, 1));
        transaction.setAmount(BigDecimal.valueOf(1800));
        transaction.setDescription("テスト取引");
        transaction.setNote("カテゴリ参照中");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());
        return transactionRepository.save(transaction);
    }
}
