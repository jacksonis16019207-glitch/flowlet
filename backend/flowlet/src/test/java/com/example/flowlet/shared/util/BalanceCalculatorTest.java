package com.example.flowlet.shared.util;

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
import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BalanceCalculatorTest {

    @Autowired
    private BalanceCalculator balanceCalculator;

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
    void calculatesAssetAccountGoalBucketAndUnallocatedBalances() {
        Account main = saveAccount("MUFG", "Main", BalanceSide.ASSET, BigDecimal.valueOf(100000), 10);
        GoalBucket travel = saveGoalBucket(main.accountId(), "Travel");
        GoalBucket emergency = saveGoalBucket(main.accountId(), "Emergency");

        CategoryEntity incomeCategory = saveCategory("収入", com.example.flowlet.category.domain.model.CategoryType.INCOME);
        CategoryEntity expenseCategory = saveCategory("支出", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transferCategory = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity incomeSubcategory = saveSubcategory(incomeCategory.getCategoryId(), "給与");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expenseCategory.getCategoryId(), "食費");
        SubcategoryEntity transferSubcategory = saveSubcategory(transferCategory.getCategoryId(), "口座移動");

        transactionRepository.save(new Transaction(
            null,
            main.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 1),
            BigDecimal.valueOf(50000),
            "給料",
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
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 2),
            BigDecimal.valueOf(20000),
            "生活費",
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
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 3),
            BigDecimal.valueOf(10000),
            "旅行積立",
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
            ),
            new GoalBucketAllocation(
                null,
                main.accountId(),
                travel.goalBucketId(),
                emergency.goalBucketId(),
                LocalDate.of(2026, 4, 5),
                BigDecimal.valueOf(3000),
                "旅行から移動",
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
            )
        ));

        assertThat(balanceCalculator.calculateAccountBalance(main.accountId(), main.balanceSide(), main.initialBalance()))
            .isEqualByComparingTo("120000");
        assertThat(balanceCalculator.calculateGoalBucketBalance(travel.goalBucketId()))
            .isEqualByComparingTo("-13000");
        assertThat(balanceCalculator.calculateGoalBucketBalance(emergency.goalBucketId()))
            .isEqualByComparingTo("18000");
        assertThat(balanceCalculator.calculateUnallocatedBalance(main.accountId(), main.balanceSide(), main.initialBalance()))
            .isEqualByComparingTo("115000");
    }

    @Test
    void calculatesLiabilityAccountBalanceWithOppositeSigns() {
        Account card = saveAccount("JCB", "Card", BalanceSide.LIABILITY, BigDecimal.valueOf(30000), 20);
        CategoryEntity incomeCategory = saveCategory("返済", com.example.flowlet.category.domain.model.CategoryType.INCOME);
        CategoryEntity expenseCategory = saveCategory("利用", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        SubcategoryEntity incomeSubcategory = saveSubcategory(incomeCategory.getCategoryId(), "入金");
        SubcategoryEntity expenseSubcategory = saveSubcategory(expenseCategory.getCategoryId(), "買い物");

        transactionRepository.save(new Transaction(
            null,
            card.accountId(),
            null,
            expenseCategory.getCategoryId(),
            expenseSubcategory.getSubcategoryId(),
            TransactionType.EXPENSE,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 1),
            BigDecimal.valueOf(12000),
            "カード利用",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        transactionRepository.save(new Transaction(
            null,
            card.accountId(),
            null,
            incomeCategory.getCategoryId(),
            incomeSubcategory.getSubcategoryId(),
            TransactionType.INCOME,
            CashflowTreatment.AUTO,
            LocalDate.of(2026, 4, 2),
            BigDecimal.valueOf(5000),
            "返済",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        assertThat(balanceCalculator.calculateAccountBalance(card.accountId(), card.balanceSide(), card.initialBalance()))
            .isEqualByComparingTo("37000");
    }

    private Account saveAccount(
        String providerName,
        String accountName,
        BalanceSide balanceSide,
        BigDecimal initialBalance,
        int displayOrder
    ) {
        return accountRepository.save(new Account(
            null,
            providerName,
            accountName,
            AccountCategory.BANK,
            balanceSide,
            initialBalance,
            true,
            displayOrder,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
    }

    private GoalBucket saveGoalBucket(Long accountId, String bucketName) {
        return goalBucketRepository.save(new GoalBucket(
            null,
            accountId,
            bucketName,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
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
