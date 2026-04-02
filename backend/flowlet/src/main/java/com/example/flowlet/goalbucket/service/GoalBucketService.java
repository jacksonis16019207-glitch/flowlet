package com.example.flowlet.goalbucket.service;

import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.goalbucket.exception.AccountNotFoundException;
import com.example.flowlet.goalbucket.exception.GoalBucketAlreadyExistsException;
import com.example.flowlet.infrastructure.jpa.goalbucket.entity.GoalBucketEntity;
import com.example.flowlet.infrastructure.jpa.goalbucket.mapper.GoalBucketEntityMapper;
import com.example.flowlet.infrastructure.jpa.goalbucket.repository.SpringDataGoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataGoalBucketAllocationRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataTransactionRepository;
import com.example.flowlet.presentation.goalbucket.dto.CreateGoalBucketRequest;
import com.example.flowlet.presentation.goalbucket.dto.DeleteGoalBucketResponse;
import com.example.flowlet.presentation.goalbucket.dto.GoalBucketResponse;
import com.example.flowlet.shared.util.BalanceCalculator;
import org.springframework.http.HttpStatus;
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
    private final SpringDataGoalBucketRepository springDataGoalBucketRepository;
    private final SpringDataTransactionRepository springDataTransactionRepository;
    private final SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository;
    private final BalanceCalculator balanceCalculator;
    private final Clock clock;

    public GoalBucketService(
        GoalBucketRepository goalBucketRepository,
        AccountRepository accountRepository,
        SpringDataGoalBucketRepository springDataGoalBucketRepository,
        SpringDataTransactionRepository springDataTransactionRepository,
        SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository,
        BalanceCalculator balanceCalculator,
        Clock clock
    ) {
        this.goalBucketRepository = goalBucketRepository;
        this.accountRepository = accountRepository;
        this.springDataGoalBucketRepository = springDataGoalBucketRepository;
        this.springDataTransactionRepository = springDataTransactionRepository;
        this.springDataGoalBucketAllocationRepository = springDataGoalBucketAllocationRepository;
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
    public GoalBucketResponse update(Long goalBucketId, CreateGoalBucketRequest request) {
        GoalBucketEntity goalBucketEntity = getGoalBucketEntity(goalBucketId);
        String bucketName = request.getBucketName().trim();
        boolean goalBucketInUse = isGoalBucketInUse(goalBucketId);

        if (!accountRepository.existsById(request.getAccountId())) {
            throw new AccountNotFoundException(request.getAccountId());
        }

        if (goalBucketInUse && !goalBucketEntity.getAccountId().equals(request.getAccountId())) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "GOAL_BUCKET_ACCOUNT_CHANGE_NOT_ALLOWED",
                "error.goalBucket.accountChangeNotAllowed",
                goalBucketId
            );
        }

        springDataGoalBucketRepository.findByAccountIdAndBucketName(request.getAccountId(), bucketName)
            .filter(existing -> !existing.getGoalBucketId().equals(goalBucketId))
            .ifPresent(existing -> {
                throw new GoalBucketAlreadyExistsException(request.getAccountId(), bucketName);
            });

        goalBucketEntity.setAccountId(request.getAccountId());
        goalBucketEntity.setBucketName(bucketName);
        goalBucketEntity.setActive(request.isActive());
        goalBucketEntity.setUpdatedAt(LocalDateTime.now(clock));

        GoalBucket savedGoalBucket = GoalBucketEntityMapper.toDomain(springDataGoalBucketRepository.save(goalBucketEntity));
        return GoalBucketResponse.from(savedGoalBucket, balanceCalculator.calculateGoalBucketBalance(savedGoalBucket.goalBucketId()));
    }

    @Transactional
    public DeleteGoalBucketResponse delete(Long goalBucketId) {
        GoalBucketEntity goalBucketEntity = getGoalBucketEntity(goalBucketId);

        if (isGoalBucketInUse(goalBucketId)) {
            goalBucketEntity.setActive(false);
            goalBucketEntity.setUpdatedAt(LocalDateTime.now(clock));
            springDataGoalBucketRepository.save(goalBucketEntity);
            return new DeleteGoalBucketResponse(goalBucketId, "DEACTIVATED", false);
        }

        springDataGoalBucketRepository.delete(goalBucketEntity);
        return new DeleteGoalBucketResponse(goalBucketId, "DELETED", false);
    }

    @Transactional
    public void deleteAll() {
        goalBucketRepository.deleteAll();
    }

    private GoalBucketEntity getGoalBucketEntity(Long goalBucketId) {
        return springDataGoalBucketRepository.findById(goalBucketId)
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "GOAL_BUCKET_NOT_FOUND",
                "error.goalBucket.notFound",
                goalBucketId
            ));
    }

    private boolean isGoalBucketInUse(Long goalBucketId) {
        return springDataTransactionRepository.existsByGoalBucketId(goalBucketId)
            || springDataGoalBucketAllocationRepository.existsByFromGoalBucketId(goalBucketId)
            || springDataGoalBucketAllocationRepository.existsByToGoalBucketId(goalBucketId);
    }
}
