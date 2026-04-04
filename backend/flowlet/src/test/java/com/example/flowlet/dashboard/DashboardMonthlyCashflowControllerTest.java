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
    void getMonthlyCashflowReturnsIncomeExpenseAndNetByMonth() throws Exception {
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

        CategoryEntity incomeCategory = saveCategory("収入", com.example.flowlet.category.domain.model.CategoryType.INCOME);
        CategoryEntity expenseCategory = saveCategory("支出", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transferCategory = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity incomeSubcategory = saveSubcategory(incomeCategory.getCategoryId(), "給与");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expenseCategory.getCategoryId(), "生活費");
        SubcategoryEntity transferSubcategory = saveSubcategory(transferCategory.getCategoryId(), "口座移動");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 1, 10),
            BigDecimal.valueOf(280000),
            "1月給与",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            expenseCategory.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 1, 12),
            BigDecimal.valueOf(120000),
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
            expenseCategory.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            LocalDate.of(2026, 2, 3),
            BigDecimal.valueOf(30000),
            "生活費",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            LocalDate.of(2026, 3, 5),
            BigDecimal.valueOf(285000),
            "3月給与",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            transferCategory.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_OUT,
            LocalDate.of(2026, 3, 8),
            BigDecimal.valueOf(50000),
            "別口座へ移動",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            transferCategory.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_IN,
            LocalDate.of(2026, 3, 9),
            BigDecimal.valueOf(12000),
            "戻し入れ",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("fromMonth", "2026-01")
                .param("toMonth", "2026-04"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fromMonth").value("2026-01"))
            .andExpect(jsonPath("$.toMonth").value("2026-04"))
            .andExpect(jsonPath("$.months.length()").value(4))
            .andExpect(jsonPath("$.months[0].month").value("2026-01"))
            .andExpect(jsonPath("$.months[0].income").value(280000))
            .andExpect(jsonPath("$.months[0].expense").value(120000))
            .andExpect(jsonPath("$.months[0].net").value(160000))
            .andExpect(jsonPath("$.months[1].month").value("2026-02"))
            .andExpect(jsonPath("$.months[1].income").value(0))
            .andExpect(jsonPath("$.months[1].expense").value(30000))
            .andExpect(jsonPath("$.months[1].net").value(-30000))
            .andExpect(jsonPath("$.months[2].month").value("2026-03"))
            .andExpect(jsonPath("$.months[2].income").value(285000))
            .andExpect(jsonPath("$.months[2].expense").value(0))
            .andExpect(jsonPath("$.months[2].net").value(285000))
            .andExpect(jsonPath("$.months[3].month").value("2026-04"))
            .andExpect(jsonPath("$.months[3].income").value(0))
            .andExpect(jsonPath("$.months[3].expense").value(0))
            .andExpect(jsonPath("$.months[3].net").value(0))
            .andExpect(jsonPath("$.totals.income").value(565000))
            .andExpect(jsonPath("$.totals.expense").value(150000))
            .andExpect(jsonPath("$.totals.net").value(415000));
    }

    @Test
    void getMonthlyCashflowRejectsInvalidMonthFormat() throws Exception {
        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("fromMonth", "2026/01")
                .param("toMonth", "2026-04"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_MONTH_FORMAT"));
    }

    @Test
    void getMonthlyCashflowRejectsReverseMonthRange() throws Exception {
        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("fromMonth", "2026-05")
                .param("toMonth", "2026-04"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_MONTH_RANGE"));
    }

    @Test
    void getMonthlyCashflowRejectsTooLargeMonthRange() throws Exception {
        mockMvc.perform(get("/api/dashboard/monthly-cashflow")
                .param("fromMonth", "2025-01")
                .param("toMonth", "2026-04"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("MONTH_RANGE_TOO_LARGE"));
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
