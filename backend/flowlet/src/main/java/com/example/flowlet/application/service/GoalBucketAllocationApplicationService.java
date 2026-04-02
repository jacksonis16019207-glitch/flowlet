package com.example.flowlet.application.service;

import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.transaction.entity.GoalBucketAllocationEntity;
import com.example.flowlet.infrastructure.jpa.transaction.mapper.GoalBucketAllocationEntityMapper;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataGoalBucketAllocationRepository;
import com.example.flowlet.presentation.goalbucketallocation.dto.CreateGoalBucketAllocationsRequest;
import com.example.flowlet.presentation.goalbucketallocation.dto.DeleteGoalBucketAllocationResponse;
import com.example.flowlet.presentation.goalbucketallocation.dto.GoalBucketAllocationBatchResponse;
import com.example.flowlet.presentation.goalbucketallocation.dto.GoalBucketAllocationResponse;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

@Service
public class GoalBucketAllocationApplicationService {

    private final GoalBucketAllocationRepository goalBucketAllocationRepository;
    private final GoalBucketRepository goalBucketRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository;
    private final Clock clock;

    public GoalBucketAllocationApplicationService(
        GoalBucketAllocationRepository goalBucketAllocationRepository,
        GoalBucketRepository goalBucketRepository,
        AccountRepository accountRepository,
        TransactionRepository transactionRepository,
        SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository,
        Clock clock
    ) {
        this.goalBucketAllocationRepository = goalBucketAllocationRepository;
        this.goalBucketRepository = goalBucketRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.springDataGoalBucketAllocationRepository = springDataGoalBucketAllocationRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<GoalBucketAllocationResponse> findAll(
        Long accountId,
        Long fromGoalBucketId,
        Long toGoalBucketId,
        LocalDate dateFrom,
        LocalDate dateTo,
        UUID linkedTransferGroupId
    ) {
        Map<Long, GoalBucket> goalBucketMap = goalBucketRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(GoalBucket::goalBucketId, Function.identity()));

        return goalBucketAllocationRepository.findAll().stream()
            .filter(allocation -> accountId == null || allocation.accountId().equals(accountId))
            .filter(allocation -> fromGoalBucketId == null || fromGoalBucketId.equals(allocation.fromGoalBucketId()))
            .filter(allocation -> toGoalBucketId == null || toGoalBucketId.equals(allocation.toGoalBucketId()))
            .filter(allocation -> dateFrom == null || !allocation.allocationDate().isBefore(dateFrom))
            .filter(allocation -> dateTo == null || !allocation.allocationDate().isAfter(dateTo))
            .filter(allocation -> linkedTransferGroupId == null || linkedTransferGroupId.equals(allocation.linkedTransferGroupId()))
            .sorted(java.util.Comparator.comparing(GoalBucketAllocation::allocationDate).reversed()
                .thenComparing(GoalBucketAllocation::allocationId, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
            .map(allocation -> GoalBucketAllocationResponse.from(
                allocation,
                allocation.fromGoalBucketId() == null ? null : goalBucketMap.get(allocation.fromGoalBucketId()).bucketName(),
                allocation.toGoalBucketId() == null ? null : goalBucketMap.get(allocation.toGoalBucketId()).bucketName()
            ))
            .toList();
    }

    @Transactional
    public GoalBucketAllocationBatchResponse create(CreateGoalBucketAllocationsRequest request) {
        if (!accountRepository.existsById(request.getAccountId())) {
            throw new BusinessRuleException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "error.account.notFound", request.getAccountId());
        }

        GoalBucket fromGoalBucket = null;
        if (request.getFromGoalBucketId() != null) {
            fromGoalBucket = goalBucketRepository.findById(request.getFromGoalBucketId())
                .orElseThrow(() -> new BusinessRuleException(
                    HttpStatus.NOT_FOUND,
                    "GOAL_BUCKET_NOT_FOUND",
                    "error.goalBucket.notFound",
                    request.getFromGoalBucketId()
                ));
            if (!fromGoalBucket.accountId().equals(request.getAccountId())) {
                throw new BusinessRuleException(HttpStatus.CONFLICT, "GOAL_BUCKET_ACCOUNT_MISMATCH", "error.transaction.goalBucketAccountMismatch");
            }
        }

        validateLinkedTransfer(request.getLinkedTransferGroupId(), request.getAccountId());

        Map<Long, GoalBucket> goalBucketMap = goalBucketRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(GoalBucket::goalBucketId, Function.identity()));
        Set<Long> destinations = new HashSet<>();
        LocalDateTime now = LocalDateTime.now(clock);

        List<GoalBucketAllocation> saved = goalBucketAllocationRepository.saveAll(
            request.getAllocations().stream()
                .map(item -> {
                    GoalBucket toGoalBucket = goalBucketMap.get(item.getToGoalBucketId());
                    if (toGoalBucket == null) {
                        throw new BusinessRuleException(
                            HttpStatus.NOT_FOUND,
                            "GOAL_BUCKET_NOT_FOUND",
                            "error.goalBucket.notFound",
                            item.getToGoalBucketId()
                        );
                    }
                    if (!toGoalBucket.accountId().equals(request.getAccountId())) {
                        throw new BusinessRuleException(HttpStatus.CONFLICT, "GOAL_BUCKET_ACCOUNT_MISMATCH", "error.transaction.goalBucketAccountMismatch");
                    }
                    if (!destinations.add(item.getToGoalBucketId())) {
                        throw new BusinessRuleException(
                            HttpStatus.CONFLICT,
                            "DUPLICATE_ALLOCATION_DESTINATION",
                            "error.allocation.duplicateDestination"
                        );
                    }
                    if (request.getFromGoalBucketId() != null && request.getFromGoalBucketId().equals(item.getToGoalBucketId())) {
                        throw new BusinessRuleException(
                            HttpStatus.CONFLICT,
                            "DUPLICATE_ALLOCATION_DESTINATION",
                            "error.allocation.sameFromAndTo"
                        );
                    }
                    return new GoalBucketAllocation(
                        null,
                        request.getAccountId(),
                        request.getFromGoalBucketId(),
                        item.getToGoalBucketId(),
                        request.getAllocationDate(),
                        item.getAmount(),
                        request.getDescription().trim(),
                        normalizeNote(request.getNote()),
                        request.getLinkedTransferGroupId(),
                        now,
                        now
                    );
                })
                .toList()
        );

        List<GoalBucketAllocationResponse> responses = saved.stream()
            .map(allocation -> GoalBucketAllocationResponse.from(
                allocation,
                allocation.fromGoalBucketId() == null ? null : goalBucketMap.get(allocation.fromGoalBucketId()).bucketName(),
                allocation.toGoalBucketId() == null ? null : goalBucketMap.get(allocation.toGoalBucketId()).bucketName()
            ))
            .toList();

        return new GoalBucketAllocationBatchResponse(
            request.getAccountId(),
            request.getFromGoalBucketId(),
            request.getAllocationDate(),
            request.getDescription().trim(),
            normalizeNote(request.getNote()),
            request.getLinkedTransferGroupId(),
            responses
        );
    }

    @Transactional
    public GoalBucketAllocationResponse update(Long allocationId, CreateGoalBucketAllocationsRequest request) {
        if (request.getAllocations().size() != 1) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "ALLOCATION_UPDATE_SINGLE_ITEM_REQUIRED",
                "error.allocation.singleItemRequired"
            );
        }

        GoalBucketAllocationEntity allocationEntity = getAllocationEntity(allocationId);
        CreateGoalBucketAllocationsRequest.AllocationItemRequest item = request.getAllocations().getFirst();
        GoalBucketAllocation savedAllocation = saveSingleAllocation(
            allocationEntity,
            request,
            item.getToGoalBucketId(),
            item.getAmount()
        );
        return toResponse(savedAllocation);
    }

    @Transactional
    public DeleteGoalBucketAllocationResponse delete(Long allocationId) {
        GoalBucketAllocationEntity allocationEntity = getAllocationEntity(allocationId);
        springDataGoalBucketAllocationRepository.delete(allocationEntity);
        return new DeleteGoalBucketAllocationResponse(allocationId, "DELETED");
    }

    private void validateLinkedTransfer(UUID linkedTransferGroupId, Long accountId) {
        if (linkedTransferGroupId == null) {
            return;
        }

        boolean matched = transactionRepository.findAll().stream()
            .anyMatch(transaction -> linkedTransferGroupId.equals(transaction.transferGroupId())
                && transaction.transactionType() == TransactionType.TRANSFER_IN
                && transaction.accountId().equals(accountId));
        if (!matched) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "LINKED_TRANSFER_NOT_FOUND", "error.allocation.linkedTransferNotFound");
        }
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private GoalBucketAllocation saveSingleAllocation(
        GoalBucketAllocationEntity allocationEntity,
        CreateGoalBucketAllocationsRequest request,
        Long toGoalBucketId,
        BigDecimal amount
    ) {
        if (!accountRepository.existsById(request.getAccountId())) {
            throw new BusinessRuleException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "error.account.notFound", request.getAccountId());
        }

        GoalBucket fromGoalBucket = null;
        if (request.getFromGoalBucketId() != null) {
            fromGoalBucket = goalBucketRepository.findById(request.getFromGoalBucketId())
                .orElseThrow(() -> new BusinessRuleException(
                    HttpStatus.NOT_FOUND,
                    "GOAL_BUCKET_NOT_FOUND",
                    "error.goalBucket.notFound",
                    request.getFromGoalBucketId()
                ));
            if (!fromGoalBucket.accountId().equals(request.getAccountId())) {
                throw new BusinessRuleException(HttpStatus.CONFLICT, "GOAL_BUCKET_ACCOUNT_MISMATCH", "error.transaction.goalBucketAccountMismatch");
            }
        }

        GoalBucket toGoalBucket = goalBucketRepository.findById(toGoalBucketId)
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "GOAL_BUCKET_NOT_FOUND",
                "error.goalBucket.notFound",
                toGoalBucketId
            ));
        if (!toGoalBucket.accountId().equals(request.getAccountId())) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "GOAL_BUCKET_ACCOUNT_MISMATCH", "error.transaction.goalBucketAccountMismatch");
        }
        if (request.getFromGoalBucketId() != null && request.getFromGoalBucketId().equals(toGoalBucketId)) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "DUPLICATE_ALLOCATION_DESTINATION",
                "error.allocation.sameFromAndTo"
            );
        }

        validateLinkedTransfer(request.getLinkedTransferGroupId(), request.getAccountId());

        GoalBucketAllocation updatedAllocation = new GoalBucketAllocation(
            allocationEntity.getAllocationId(),
            request.getAccountId(),
            request.getFromGoalBucketId(),
            toGoalBucketId,
            request.getAllocationDate(),
            amount,
            request.getDescription().trim(),
            normalizeNote(request.getNote()),
            request.getLinkedTransferGroupId(),
            allocationEntity.getCreatedAt(),
            LocalDateTime.now(clock)
        );
        return GoalBucketAllocationEntityMapper.toDomain(
            springDataGoalBucketAllocationRepository.save(GoalBucketAllocationEntityMapper.toEntity(updatedAllocation))
        );
    }

    private GoalBucketAllocationResponse toResponse(GoalBucketAllocation allocation) {
        String fromGoalBucketName = allocation.fromGoalBucketId() == null
            ? null
            : goalBucketRepository.findById(allocation.fromGoalBucketId()).map(GoalBucket::bucketName).orElse(null);
        String toGoalBucketName = allocation.toGoalBucketId() == null
            ? null
            : goalBucketRepository.findById(allocation.toGoalBucketId()).map(GoalBucket::bucketName).orElse(null);
        return GoalBucketAllocationResponse.from(allocation, fromGoalBucketName, toGoalBucketName);
    }

    private GoalBucketAllocationEntity getAllocationEntity(Long allocationId) {
        return springDataGoalBucketAllocationRepository.findById(allocationId)
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "ALLOCATION_NOT_FOUND",
                "error.allocation.notFound",
                allocationId
            ));
    }
}
