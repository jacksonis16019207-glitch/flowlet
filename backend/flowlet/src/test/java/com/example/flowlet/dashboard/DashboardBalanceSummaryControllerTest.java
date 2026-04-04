package com.example.flowlet.dashboard;

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
class DashboardBalanceSummaryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private GoalBucketRepository goalBucketRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GoalBucketAllocationRepository goalBucketAllocationRepository;

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
    void getBalanceSummaryReturnsActiveAccountsGoalBucketsAndTotals() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.valueOf(100000),
            true,
            10,
            LocalDateTime.of(2026, 4, 1, 10, 0),
            LocalDateTime.of(2026, 4, 1, 10, 0)
        ));
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.valueOf(50000),
            true,
            20,
            LocalDateTime.of(2026, 4, 2, 10, 0),
            LocalDateTime.of(2026, 4, 2, 10, 0)
        ));
        accountRepository.save(new Account(
            null,
            "JCB",
            "Inactive",
            AccountCategory.CREDIT_CARD,
            BalanceSide.LIABILITY,
            BigDecimal.valueOf(10000),
            false,
            5,
            LocalDateTime.of(2026, 4, 3, 10, 0),
            LocalDateTime.of(2026, 4, 3, 10, 0)
        ));

        GoalBucket travel = goalBucketRepository.save(new GoalBucket(
            null,
            main.accountId(),
            "Travel",
            true,
            LocalDateTime.of(2026, 4, 3, 10, 0),
            LocalDateTime.of(2026, 4, 3, 10, 0)
        ));
        GoalBucket emergency = goalBucketRepository.save(new GoalBucket(
            null,
            main.accountId(),
            "Emergency",
            true,
            LocalDateTime.of(2026, 4, 4, 10, 0),
            LocalDateTime.of(2026, 4, 4, 10, 0)
        ));
        goalBucketRepository.save(new GoalBucket(
            null,
            savings.accountId(),
            "Hidden",
            false,
            LocalDateTime.of(2026, 4, 5, 10, 0),
            LocalDateTime.of(2026, 4, 5, 10, 0)
        ));

        CategoryEntity incomeCategory = saveCategory("収入", com.example.flowlet.category.domain.model.CategoryType.INCOME);
        CategoryEntity expenseCategory = saveCategory("支出", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transferCategory = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity incomeSubcategory = saveSubcategory(incomeCategory.getCategoryId(), "給与");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expenseCategory.getCategoryId(), "生活費");
        SubcategoryEntity transferSubcategory = saveSubcategory(transferCategory.getCategoryId(), "積立");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 4, 1),
            BigDecimal.valueOf(20000),
            "給料",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            travel.goalBucketId(),
            transferCategory.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_OUT,
            LocalDate.of(2026, 4, 2),
            BigDecimal.valueOf(10000),
            "旅行積立",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            savings.accountId(),
            null,
            expenseCategory.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 4, 3),
            BigDecimal.valueOf(5000),
            "引き出し",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        goalBucketAllocationRepository.saveAll(java.util.List.of(
            new GoalBucketAllocation(
                null,
                main.accountId(),
                null,
                emergency.goalBucketId(),
                LocalDate.of(2026, 4, 4),
                BigDecimal.valueOf(15000),
                "防衛資金へ配分",
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
            )
        ));

        mockMvc.perform(get("/api/dashboard/balance-summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accounts.length()").value(2))
            .andExpect(jsonPath("$.accounts[0].accountId").value(main.accountId()))
            .andExpect(jsonPath("$.accounts[0].accountName").value("Main"))
            .andExpect(jsonPath("$.accounts[0].currentBalance").value(110000))
            .andExpect(jsonPath("$.accounts[0].unallocatedBalance").value(105000))
            .andExpect(jsonPath("$.accounts[1].accountId").value(savings.accountId()))
            .andExpect(jsonPath("$.accounts[1].currentBalance").value(45000))
            .andExpect(jsonPath("$.accounts[1].unallocatedBalance").value(45000))
            .andExpect(jsonPath("$.goalBuckets.length()").value(2))
            .andExpect(jsonPath("$.goalBuckets[0].goalBucketId").value(emergency.goalBucketId()))
            .andExpect(jsonPath("$.goalBuckets[0].bucketName").value("Emergency"))
            .andExpect(jsonPath("$.goalBuckets[0].currentBalance").value(15000))
            .andExpect(jsonPath("$.goalBuckets[1].goalBucketId").value(travel.goalBucketId()))
            .andExpect(jsonPath("$.goalBuckets[1].bucketName").value("Travel"))
            .andExpect(jsonPath("$.goalBuckets[1].currentBalance").value(-10000))
            .andExpect(jsonPath("$.totals.accountCurrentBalance").value(155000))
            .andExpect(jsonPath("$.totals.goalBucketCurrentBalance").value(5000))
            .andExpect(jsonPath("$.totals.unallocatedBalance").value(150000));
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
