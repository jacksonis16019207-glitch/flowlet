package com.example.flowlet.application.service;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.presentation.dashboard.dto.DashboardAccountBalanceSummaryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardBalanceSummaryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardGoalBucketBalanceSummaryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardTotalsResponse;
import com.example.flowlet.shared.util.BalanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardBalanceSummaryService {

    private final AccountRepository accountRepository;
    private final GoalBucketRepository goalBucketRepository;
    private final BalanceCalculator balanceCalculator;

    public DashboardBalanceSummaryService(
        AccountRepository accountRepository,
        GoalBucketRepository goalBucketRepository,
        BalanceCalculator balanceCalculator
    ) {
        this.accountRepository = accountRepository;
        this.goalBucketRepository = goalBucketRepository;
        this.balanceCalculator = balanceCalculator;
    }

    @Transactional(readOnly = true)
    public DashboardBalanceSummaryResponse getSummary() {
        List<Account> activeAccounts = accountRepository.findAll().stream()
            .filter(Account::active)
            .sorted(Comparator
                .comparing(Account::displayOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Account::createdAt, Comparator.reverseOrder())
                .thenComparing(Account::accountId, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();

        Map<Long, Integer> accountOrder = new HashMap<>();
        for (int index = 0; index < activeAccounts.size(); index++) {
            accountOrder.put(activeAccounts.get(index).accountId(), index);
        }

        List<DashboardAccountBalanceSummaryResponse> accountSummaries = activeAccounts.stream()
            .map(this::toAccountSummary)
            .toList();

        List<DashboardGoalBucketBalanceSummaryResponse> goalBucketSummaries = goalBucketRepository.findAll().stream()
            .filter(GoalBucket::active)
            .filter(goalBucket -> accountOrder.containsKey(goalBucket.accountId()))
            .sorted(Comparator
                .comparing((GoalBucket goalBucket) -> accountOrder.get(goalBucket.accountId()))
                .thenComparing(GoalBucket::createdAt, Comparator.reverseOrder())
                .thenComparing(GoalBucket::goalBucketId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toGoalBucketSummary)
            .toList();

        DashboardTotalsResponse totals = new DashboardTotalsResponse(
            accountSummaries.stream()
                .map(DashboardAccountBalanceSummaryResponse::currentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add),
            goalBucketSummaries.stream()
                .map(DashboardGoalBucketBalanceSummaryResponse::currentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add),
            accountSummaries.stream()
                .map(DashboardAccountBalanceSummaryResponse::unallocatedBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );

        return new DashboardBalanceSummaryResponse(accountSummaries, goalBucketSummaries, totals);
    }

    private DashboardAccountBalanceSummaryResponse toAccountSummary(Account account) {
        return new DashboardAccountBalanceSummaryResponse(
            account.accountId(),
            account.providerName(),
            account.accountName(),
            account.accountCategory(),
            account.balanceSide(),
            balanceCalculator.calculateAccountBalance(account.accountId(), account.balanceSide(), account.initialBalance()),
            balanceCalculator.calculateUnallocatedBalance(account.accountId(), account.balanceSide(), account.initialBalance())
        );
    }

    private DashboardGoalBucketBalanceSummaryResponse toGoalBucketSummary(GoalBucket goalBucket) {
        return new DashboardGoalBucketBalanceSummaryResponse(
            goalBucket.goalBucketId(),
            goalBucket.accountId(),
            goalBucket.bucketName(),
            balanceCalculator.calculateGoalBucketBalance(goalBucket.goalBucketId())
        );
    }
}
