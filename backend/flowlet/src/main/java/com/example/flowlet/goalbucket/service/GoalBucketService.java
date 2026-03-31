package com.example.flowlet.goalbucket.service;

import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.goalbucket.exception.AccountNotFoundException;
import com.example.flowlet.goalbucket.exception.GoalBucketAlreadyExistsException;
import com.example.flowlet.presentation.goalbucket.dto.CreateGoalBucketRequest;
import com.example.flowlet.presentation.goalbucket.dto.GoalBucketResponse;
import com.example.flowlet.shared.util.BalanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class GoalBucketService {

    private final GoalBucketRepository goalBucketRepository;
    private final AccountRepository accountRepository;
    private final BalanceCalculator balanceCalculator;
    private final Clock clock;

    public GoalBucketService(
        GoalBucketRepository goalBucketRepository,
        AccountRepository accountRepository,
        BalanceCalculator balanceCalculator,
        Clock clock
    ) {
        this.goalBucketRepository = goalBucketRepository;
        this.accountRepository = accountRepository;
        this.balanceCalculator = balanceCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<GoalBucketResponse> findAll(Long accountId, Boolean activeOnly) {
        return goalBucketRepository.findAll().stream()
            .filter(goalBucket -> accountId == null || goalBucket.accountId().equals(accountId))
            .filter(goalBucket -> activeOnly == null || !activeOnly || goalBucket.active())
            .sorted(Comparator
                .comparing(GoalBucket::createdAt).reversed()
                .thenComparing(GoalBucket::goalBucketId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(goalBucket -> GoalBucketResponse.from(
                goalBucket,
                balanceCalculator.calculateGoalBucketBalance(goalBucket.goalBucketId())
            ))
            .toList();
    }

    @Transactional
    public GoalBucketResponse create(CreateGoalBucketRequest request) {
        Long accountId = request.getAccountId();
        String bucketName = request.getBucketName().trim();

        if (!accountRepository.existsById(accountId)) {
            throw new AccountNotFoundException(accountId);
        }

        if (goalBucketRepository.existsByAccountIdAndBucketName(accountId, bucketName)) {
            throw new GoalBucketAlreadyExistsException(accountId, bucketName);
        }

        LocalDateTime now = LocalDateTime.now(clock);
        GoalBucket goalBucket = new GoalBucket(
            null,
            accountId,
            bucketName,
            request.isActive(),
            now,
            now
        );

        GoalBucket savedGoalBucket = goalBucketRepository.save(goalBucket);
        return GoalBucketResponse.from(savedGoalBucket, balanceCalculator.calculateGoalBucketBalance(savedGoalBucket.goalBucketId()));
    }

    @Transactional
    public void deleteAll() {
        goalBucketRepository.deleteAll();
    }
}
