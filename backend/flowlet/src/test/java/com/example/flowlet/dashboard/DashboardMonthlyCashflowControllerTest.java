package com.example.flowlet.dashboard;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.appsetting.domain.repository.AppSettingRepository;
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
class DashboardMonthlyCashflowControllerTest {

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

    @Autowired
    private AppSettingRepository appSettingRepository;

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
    void getMonthlyCashflowReturnsIncomeExpenseAndNetWithinConfiguredPeriod() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        appSettingRepository.save(new AppSetting(
            1L,
            11,
            PaymentDateAdjustmentRule.NEXT_BUSINESS_DAY,
            now,
            now
        ));

        Account main = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.valueOf(100000),
            true,
            10,
            now,
            now
        ));

        CategoryEntity incomeCategory = saveCategory("収入", com.example.flowlet.category.domain.model.CategoryType.INCOME);
        CategoryEntity expenseCategory = saveCategory("支出", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        SubcategoryEntity incomeSubcategory = saveSubcategory(incomeCategory.getCategoryId(), "給与");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expenseCategory.getCategoryId(), "生活費");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 2, 11),
            BigDecimal.valueOf(90000),
            "holiday excluded",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 2, 12),
            BigDecimal.valueOf(100000),
            "included income",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            expenseCategory.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 3, 10),
            BigDecimal.valueOf(30000),
            "included expense",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 3, 11),
            BigDecimal.valueOf(50000),
            "next period",
            null,
            null,
            now,
            now
        ));

        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("targetMonth", "2026-02"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetMonth").value("2026-02"))
            .andExpect(jsonPath("$.periodStartDate").value("2026-02-12"))
            .andExpect(jsonPath("$.periodEndDate").value("2026-03-10"))
            .andExpect(jsonPath("$.income").value(100000))
            .andExpect(jsonPath("$.expense").value(30000))
            .andExpect(jsonPath("$.net").value(70000));
    }

    @Test
    void getMonthlyCashflowRejectsInvalidMonthFormat() throws Exception {
        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("targetMonth", "2026/02"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_MONTH_FORMAT"));
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
