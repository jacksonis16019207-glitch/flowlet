package com.example.flowlet.transaction;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private GoalBucketRepository goalBucketRepository;

    @Autowired
    private SpringDataCategoryRepository categoryRepository;

    @Autowired
    private SpringDataSubcategoryRepository subcategoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GoalBucketAllocationRepository goalBucketAllocationRepository;

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
    void createsTransactionTransferAndAllocation() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        GoalBucket travel = goalBucketRepository.save(new GoalBucket(
            null,
            savings.accountId(),
            "Travel",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        CategoryEntity expense = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transfer = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity dine = saveSubcategory(expense.getCategoryId(), "外食");
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "口座間移動");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"goalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionType":"EXPENSE","transactionDate":"2026-04-01","amount":2800,"description":"ホテル朝食","note":"出張"}
                    """.formatted(main.accountId(), expense.getCategoryId(), dine.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.transactionType").value("EXPENSE"))
            .andExpect(jsonPath("$.categoryName").value("食費"));

        String transferResponse = mockMvc.perform(post("/api/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fromAccountId":%d,"toAccountId":%d,"fromGoalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionDate":"2026-04-02","amount":50000,"description":"旅行用口座へ振替","note":"4月積立"}
                    """.formatted(main.accountId(), savings.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.outgoingTransaction.transactionType").value("TRANSFER_OUT"))
            .andExpect(jsonPath("$.incomingTransaction.transactionType").value("TRANSFER_IN"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String transferGroupId = com.jayway.jsonpath.JsonPath.read(transferResponse, "$.transferGroupId");

        mockMvc.perform(post("/api/goal-bucket-allocations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-02","description":"4月積立","note":"旅行","linkedTransferGroupId":"%s","allocations":[{"toGoalBucketId":%d,"amount":30000}]}
                    """.formatted(savings.accountId(), transferGroupId, travel.goalBucketId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.allocations[0].toGoalBucketName").value("Travel"));
    }

    private CategoryEntity saveCategory(String name, com.example.flowlet.category.domain.model.CategoryType type) {
        CategoryEntity category = new CategoryEntity();
        category.setCategoryName(name);
        category.setCategoryType(type);
        category.setDisplayOrder(10);
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
