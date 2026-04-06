package com.example.flowlet.dashboard;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardCategoryCashflowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GoalBucketAllocationRepository goalBucketAllocationRepository;

    @Autowired
    private GoalBucketRepository goalBucketRepository;

    @Autowired
    private SpringDataCategoryRepository categoryRepository;

    @Autowired
    private SpringDataSubcategoryRepository subcategoryRepository;

    @BeforeEach
    void setUp() {
        goalBucketAllocationRepository.deleteAll();
        transactionRepository.deleteAll();
        goalBucketRepository.deleteAll();
        subcategoryRepository.deleteAll();
        categoryRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void getCategoryCashflowReturnsIncomeAndExpenseBreakdown() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.valueOf(100000),
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        CategoryEntity salary = saveCategory("給与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 10);
        CategoryEntity bonus = saveCategory("賞与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 20);
        CategoryEntity food = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 10);
        CategoryEntity housing = saveCategory("住居費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 20);
        CategoryEntity transfer = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER, 30);

        SubcategoryEntity salarySubcategory = saveSubcategory(salary.getCategoryId(), "月給");
        SubcategoryEntity bonusSubcategory = saveSubcategory(bonus.getCategoryId(), "賞与");
        SubcategoryEntity foodSubcategory = saveSubcategory(food.getCategoryId(), "外食");
        SubcategoryEntity housingSubcategory = saveSubcategory(housing.getCategoryId(), "家賃");
        SubcategoryEntity transferSubcategory = saveSubcategory(transfer.getCategoryId(), "移動");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            salary.getCategoryId(),
            salarySubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 3, 1),
            BigDecimal.valueOf(280000),
            "給与",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            bonus.getCategoryId(),
            bonusSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 3, 15),
            BigDecimal.valueOf(50000),
            "賞与",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            food.getCategoryId(),
            foodSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 3, 5),
            BigDecimal.valueOf(24000),
            "外食",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            food.getCategoryId(),
            foodSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 4, 5),
            BigDecimal.valueOf(11000),
            "スーパー",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            housing.getCategoryId(),
            housingSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 4, 10),
            BigDecimal.valueOf(72000),
            "家賃",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            transfer.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_OUT,
            LocalDate.of(2026, 4, 12),
            BigDecimal.valueOf(20000),
            "積立",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/dashboard/category-cashflow")
                .param("fromMonth", "2026-03")
                .param("toMonth", "2026-04"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fromMonth").value("2026-03"))
            .andExpect(jsonPath("$.toMonth").value("2026-04"))
            .andExpect(jsonPath("$.incomeCategories.length()").value(2))
            .andExpect(jsonPath("$.incomeCategories[0].categoryName").value("給与"))
            .andExpect(jsonPath("$.incomeCategories[0].amount").value(280000))
            .andExpect(jsonPath("$.incomeCategories[1].categoryName").value("賞与"))
            .andExpect(jsonPath("$.incomeCategories[1].amount").value(50000))
            .andExpect(jsonPath("$.expenseCategories.length()").value(2))
            .andExpect(jsonPath("$.expenseCategories[0].categoryName").value("住居費"))
            .andExpect(jsonPath("$.expenseCategories[0].amount").value(72000))
            .andExpect(jsonPath("$.expenseCategories[1].categoryName").value("食費"))
            .andExpect(jsonPath("$.expenseCategories[1].amount").value(35000))
            .andExpect(jsonPath("$.totals.income").value(330000))
            .andExpect(jsonPath("$.totals.expense").value(107000));
    }

    @Test
    void getCategoryCashflowRejectsInvalidMonthFormat() throws Exception {
        mockMvc.perform(get("/api/dashboard/category-cashflow")
                .param("fromMonth", "2026/03")
                .param("toMonth", "2026-04"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_MONTH_FORMAT"));
    }

    private CategoryEntity saveCategory(
        String name,
        com.example.flowlet.category.domain.model.CategoryType type,
        int displayOrder
    ) {
        CategoryEntity category = new CategoryEntity();
        category.setCategoryName(name);
        category.setCategoryType(type);
        category.setDisplayOrder(displayOrder);
        category.setActive(true);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    private SubcategoryEntity saveSubcategory(Long categoryId, String name) {
        SubcategoryEntity subcategory = new SubcategoryEntity();
        subcategory.setCategoryId(categoryId);
        subcategory.setSubcategoryName(name);
        subcategory.setDisplayOrder(10);
        subcategory.setActive(true);
        subcategory.setCreatedAt(LocalDateTime.now());
        subcategory.setUpdatedAt(LocalDateTime.now());
        return subcategoryRepository.save(subcategory);
    }
}
