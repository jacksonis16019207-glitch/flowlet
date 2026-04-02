package com.example.flowlet.shared.util;

import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BalanceCalculator {

    private final TransactionRepository transactionRepository;
    private final GoalBucketAllocationRepository goalBucketAllocationRepository;
    private final GoalBucketRepository goalBucketRepository;

    public BalanceCalculator(
        TransactionRepository transactionRepository,
        GoalBucketAllocationRepository goalBucketAllocationRepository,
        GoalBucketRepository goalBucketRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.goalBucketAllocationRepository = goalBucketAllocationRepository;
        this.goalBucketRepository = goalBucketRepository;
    }

    public BigDecimal calculateAccountBalance(Long accountId, BalanceSide balanceSide) {
        return calculateAccountBalance(accountId, balanceSide, BigDecimal.ZERO);
    }

    public BigDecimal calculateAccountBalance(Long accountId, BalanceSide balanceSide, BigDecimal initialBalance) {
        return transactionRepository.findAll().stream()
            .filter(transaction -> transaction.accountId().equals(accountId))
            .map(transaction -> calculateAccountDelta(balanceSide, transaction))
            .reduce(initialBalance, BigDecimal::add);
    }

    public BigDecimal calculateGoalBucketBalance(Long goalBucketId) {
        BigDecimal transactionBalance = transactionRepository.findAll().stream()
            .filter(transaction -> goalBucketId.equals(transaction.goalBucketId()))
            .map(transaction -> calculateGoalBucketTransactionDelta(transaction.transactionType(), transaction.amount()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal allocationBalance = goalBucketAllocationRepository.findAll().stream()
            .map(allocation -> {
                BigDecimal delta = BigDecimal.ZERO;
                if (goalBucketId.equals(allocation.toGoalBucketId())) {
                    delta = delta.add(allocation.amount());
                }
                if (goalBucketId.equals(allocation.fromGoalBucketId())) {
                    delta = delta.subtract(allocation.amount());
                }
                return delta;
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return transactionBalance.add(allocationBalance);
    }

    public BigDecimal calculateUnallocatedBalance(Long accountId, BalanceSide balanceSide) {
        return calculateUnallocatedBalance(accountId, balanceSide, BigDecimal.ZERO);
    }

    public BigDecimal calculateUnallocatedBalance(Long accountId, BalanceSide balanceSide, BigDecimal initialBalance) {
        BigDecimal accountBalance = calculateAccountBalance(accountId, balanceSide, initialBalance);
        BigDecimal allocated = goalBucketRepository.findAll().stream()
            .filter(goalBucket -> goalBucket.accountId().equals(accountId))
            .map(GoalBucket::goalBucketId)
            .map(this::calculateGoalBucketBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return accountBalance.subtract(allocated);
    }

    private BigDecimal calculateAccountDelta(BalanceSide balanceSide, Transaction transaction) {
        return switch (balanceSide) {
            case ASSET -> switch (transaction.transactionType()) {
                case INCOME, TRANSFER_IN -> transaction.amount();
                case EXPENSE, TRANSFER_OUT -> transaction.amount().negate();
            };
            case LIABILITY -> switch (transaction.transactionType()) {
                case INCOME, TRANSFER_IN -> transaction.amount().negate();
                case EXPENSE, TRANSFER_OUT -> transaction.amount();
            };
        };
    }

    private BigDecimal calculateGoalBucketTransactionDelta(TransactionType transactionType, BigDecimal amount) {
        return switch (transactionType) {
            case INCOME, TRANSFER_IN -> amount;
            case EXPENSE, TRANSFER_OUT -> amount.negate();
        };
    }
}
