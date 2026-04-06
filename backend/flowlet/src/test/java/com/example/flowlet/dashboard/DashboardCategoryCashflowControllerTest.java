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
import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardCategoryCashflowControllerTest {

    private static final ZoneId APP_ZONE_ID = ZoneId.of("Asia/Tokyo");
    private static final Instant FIXED_INSTANT = Instant.parse("2026-04-07T00:00:00Z");

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
    void getCategoryCashflowReturnsIncomeAndExpenseBreakdownWithinConfiguredPeriod() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        appSettingRepository.save(new AppSetting(
            1L,
            23,
            PaymentDateAdjustmentRule.PREVIOUS_BUSINESS_DAY,
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

        CategoryEntity salary = saveCategory("給与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 10);
        CategoryEntity bonus = saveCategory("賞与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 20);
        CategoryEntity food = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 10);
        CategoryEntity housing = saveCategory("住居費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 20);

        SubcategoryEntity salarySubcategory = saveSubcategory(salary.getCategoryId(), "月次");
        SubcategoryEntity bonusSubcategory = saveSubcategory(bonus.getCategoryId(), "特別");
        SubcategoryEntity foodSubcategory = saveSubcategory(food.getCategoryId(), "日常");
        SubcategoryEntity housingSubcategory = saveSubcategory(housing.getCategoryId(), "家賃");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            salary.getCategoryId(),
            salarySubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 2, 20),
            BigDecimal.valueOf(280000),
            "salary",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            bonus.getCategoryId(),
            bonusSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 3, 5),
            BigDecimal.valueOf(50000),
            "bonus",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            food.getCategoryId(),
            foodSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 3, 10),
            BigDecimal.valueOf(35000),
            "food",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            housing.getCategoryId(),
            housingSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 3, 22),
            BigDecimal.valueOf(72000),
            "housing",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            housing.getCategoryId(),
            housingSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 3, 23),
            BigDecimal.valueOf(11111),
            "next period",
            null,
            null,
            now,
            now
        ));

        mockMvc.perform(get("/api/dashboard/category-cashflow")
                .param("targetMonth", "2026-02"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetMonth").value("2026-02"))
            .andExpect(jsonPath("$.periodStartDate").value("2026-02-20"))
            .andExpect(jsonPath("$.periodEndDate").value("2026-03-22"))
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
    void getCategoryCashflowReflectsCashflowTreatmentOverrides() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        appSettingRepository.save(new AppSetting(
            1L,
            1,
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
        Account savings = accountRepository.save(new Account(
            null,
            "MUFG",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.valueOf(50000),
            true,
            20,
            now,
            now
        ));

        CategoryEntity salary = saveCategory("給与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 10);
        CategoryEntity food = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 20);
        CategoryEntity transfer = saveCategory("口座振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER, 30);
        SubcategoryEntity salarySubcategory = saveSubcategory(salary.getCategoryId(), "基本給");
        SubcategoryEntity foodSubcategory = saveSubcategory(food.getCategoryId(), "外食");
        SubcategoryEntity transferSubcategory = saveSubcategory(transfer.getCategoryId(), "資金移動");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            salary.getCategoryId(),
            salarySubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.IGNORE,
            LocalDate.of(2026, 2, 1),
            BigDecimal.valueOf(100000),
            "ignored salary",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            food.getCategoryId(),
            foodSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.INCOME,
            LocalDate.of(2026, 2, 2),
            BigDecimal.valueOf(4000),
            "expense as income",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            savings.accountId(),
            null,
            transfer.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_IN,
            CashflowTreatment.INCOME,
            LocalDate.of(2026, 2, 3),
            BigDecimal.valueOf(25000),
            "transfer as income",
            null,
            java.util.UUID.randomUUID(),
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            transfer.getCategoryId(),
            transferSubcategory.getSubcategoryId(),
            TransactionType.TRANSFER_OUT,
            CashflowTreatment.EXPENSE,
            LocalDate.of(2026, 2, 3),
            BigDecimal.valueOf(25000),
            "transfer as expense",
            null,
            java.util.UUID.randomUUID(),
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            food.getCategoryId(),
            foodSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 2, 4),
            BigDecimal.valueOf(7000),
            "normal expense",
            null,
            null,
            now,
            now
        ));

        mockMvc.perform(get("/api/dashboard/category-cashflow")
                .param("targetMonth", "2026-02"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.incomeCategories.length()").value(2))
            .andExpect(jsonPath("$.incomeCategories[0].categoryName").value("口座振替"))
            .andExpect(jsonPath("$.incomeCategories[0].amount").value(25000))
            .andExpect(jsonPath("$.incomeCategories[1].categoryName").value("食費"))
            .andExpect(jsonPath("$.incomeCategories[1].amount").value(4000))
            .andExpect(jsonPath("$.expenseCategories.length()").value(2))
            .andExpect(jsonPath("$.expenseCategories[0].categoryName").value("口座振替"))
            .andExpect(jsonPath("$.expenseCategories[0].amount").value(25000))
            .andExpect(jsonPath("$.expenseCategories[1].categoryName").value("食費"))
            .andExpect(jsonPath("$.expenseCategories[1].amount").value(7000))
            .andExpect(jsonPath("$.totals.income").value(29000))
            .andExpect(jsonPath("$.totals.expense").value(32000));
    }

    @Test
    void getCategoryCashflowUsesCurrentPeriodWhenTargetMonthIsOmitted() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        appSettingRepository.save(new AppSetting(
            1L,
            10,
            PaymentDateAdjustmentRule.NONE,
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

        CategoryEntity income = saveCategory("給与", com.example.flowlet.category.domain.model.CategoryType.INCOME, 10);
        CategoryEntity expense = saveCategory("生活費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE, 20);
        SubcategoryEntity incomeSubcategory = saveSubcategory(income.getCategoryId(), "本業");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expense.getCategoryId(), "日用品");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            income.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 3, 25),
            BigDecimal.valueOf(200000),
            "salary",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            expense.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 7),
            BigDecimal.valueOf(50000),
            "expense",
            null,
            null,
            now,
            now
        ));
        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            expense.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 10),
            BigDecimal.valueOf(99999),
            "next period",
            null,
            null,
            now,
            now
        ));

        mockMvc.perform(get("/api/dashboard/category-cashflow"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetMonth").value("2026-03"))
            .andExpect(jsonPath("$.periodStartDate").value("2026-03-10"))
            .andExpect(jsonPath("$.periodEndDate").value("2026-04-09"))
            .andExpect(jsonPath("$.incomeCategories.length()").value(1))
            .andExpect(jsonPath("$.incomeCategories[0].categoryName").value("給与"))
            .andExpect(jsonPath("$.incomeCategories[0].amount").value(200000))
            .andExpect(jsonPath("$.expenseCategories.length()").value(1))
            .andExpect(jsonPath("$.expenseCategories[0].categoryName").value("生活費"))
            .andExpect(jsonPath("$.expenseCategories[0].amount").value(50000))
            .andExpect(jsonPath("$.totals.income").value(200000))
            .andExpect(jsonPath("$.totals.expense").value(50000));
    }

    @Test
    void getCategoryCashflowRejectsInvalidMonthFormat() throws Exception {
        mockMvc.perform(get("/api/dashboard/category-cashflow")
                .param("targetMonth", "2026/03"))
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

    @TestConfiguration
    static class TestClockConfiguration {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_INSTANT, APP_ZONE_ID);
        }
    }
}
