package com.example.flowlet.goalbucket.service;

import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.goalbucket.exception.AccountNotFoundException;
import com.example.flowlet.goalbucket.exception.GoalBucketAlreadyExistsException;
import com.example.flowlet.presentation.goalbucket.dto.CreateGoalBucketRequest;
import com.example.flowlet.presentation.goalbucket.dto.GoalBucketResponse;
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
    private final Clock clock;

    public GoalBucketService(
        GoalBucketRepository goalBucketRepository,
        AccountRepository accountRepository,
        Clock clock
    ) {
        this.goalBucketRepository = goalBucketRepository;
        this.accountRepository = accountRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<GoalBucketResponse> findAll() {
        return goalBucketRepository.findAll().stream()
            .sorted(Comparator
                .comparing(GoalBucket::createdAt).reversed()
                .thenComparing(GoalBucket::goalBucketId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(GoalBucketResponse::from)
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

        return GoalBucketResponse.from(goalBucketRepository.save(goalBucket));
    }

    @Transactional
    public void deleteAll() {
        goalBucketRepository.deleteAll();
    }
}
