package com.example.flowlet.transaction.service;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.category.domain.model.Category;
import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.category.domain.model.Subcategory;
import com.example.flowlet.category.domain.repository.CategoryRepository;
import com.example.flowlet.category.domain.repository.SubcategoryRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.transaction.entity.TransactionEntity;
import com.example.flowlet.infrastructure.jpa.transaction.mapper.TransactionEntityMapper;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataGoalBucketAllocationRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataTransactionRepository;
import com.example.flowlet.presentation.transaction.dto.CreateTransactionRequest;
import com.example.flowlet.presentation.transaction.dto.DeleteTransactionResponse;
import com.example.flowlet.presentation.transaction.dto.TransactionResponse;
import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final GoalBucketRepository goalBucketRepository;
    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final SpringDataTransactionRepository springDataTransactionRepository;
    private final SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository;
    private final Clock clock;

    public TransactionService(
        TransactionRepository transactionRepository,
        AccountRepository accountRepository,
        GoalBucketRepository goalBucketRepository,
        CategoryRepository categoryRepository,
        SubcategoryRepository subcategoryRepository,
        SpringDataTransactionRepository springDataTransactionRepository,
        SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository,
        Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.goalBucketRepository = goalBucketRepository;
        this.categoryRepository = categoryRepository;
        this.subcategoryRepository = subcategoryRepository;
        this.springDataTransactionRepository = springDataTransactionRepository;
        this.springDataGoalBucketAllocationRepository = springDataGoalBucketAllocationRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> findAll(
        Long accountId,
        TransactionType transactionType,
        Long categoryId,
        Long goalBucketId,
        LocalDate dateFrom,
        LocalDate dateTo,
        Integer limit
    ) {
        List<Transaction> transactions = transactionRepository.findAll().stream()
            .filter(transaction -> accountId == null || transaction.accountId().equals(accountId))
            .filter(transaction -> transactionType == null || transaction.transactionType() == transactionType)
            .filter(transaction -> categoryId == null || transaction.categoryId().equals(categoryId))
            .filter(transaction -> goalBucketId == null || goalBucketId.equals(transaction.goalBucketId()))
            .filter(transaction -> dateFrom == null || !transaction.transactionDate().isBefore(dateFrom))
            .filter(transaction -> dateTo == null || !transaction.transactionDate().isAfter(dateTo))
            .sorted(Comparator.comparing(Transaction::transactionDate).reversed()
                .thenComparing(Transaction::transactionId, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();

        if (limit != null && limit > 0 && transactions.size() > limit) {
            transactions = transactions.subList(0, limit);
        }

        return toResponses(transactions);
    }

    @Transactional
    public TransactionResponse create(CreateTransactionRequest request) {
        if (request.getTransactionType() != TransactionType.INCOME && request.getTransactionType() != TransactionType.EXPENSE) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "TRANSACTION_TYPE_NOT_ALLOWED", "error.transaction.transactionTypeNotAllowed");
        }

        validateTransactionReferences(
            request.getAccountId(),
            request.getGoalBucketId(),
            request.getCategoryId(),
            request.getSubcategoryId(),
            request.getTransactionType()
        );

        LocalDateTime now = LocalDateTime.now(clock);
        Transaction saved = transactionRepository.save(new Transaction(
            null,
            request.getAccountId(),
            request.getGoalBucketId(),
            request.getCategoryId(),
            request.getSubcategoryId(),
            request.getTransactionType(),
            resolveCashflowTreatment(request.getCashflowTreatment()),
            request.getTransactionDate(),
            request.getAmount(),
            request.getDescription().trim(),
            normalizeNote(request.getNote()),
            null,
            now,
            now
        ));
        return toResponses(List.of(saved)).getFirst();
    }

    @Transactional
    public TransactionResponse update(Long transactionId, CreateTransactionRequest request) {
        TransactionEntity transactionEntity = getTransactionEntity(transactionId);

        if (transactionEntity.getTransferGroupId() != null) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_TRANSACTION_UPDATE_NOT_ALLOWED",
                "error.transaction.transferTransactionUpdateNotAllowed",
                transactionId
            );
        }

        if (request.getTransactionType() != TransactionType.INCOME && request.getTransactionType() != TransactionType.EXPENSE) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "TRANSACTION_TYPE_NOT_ALLOWED", "error.transaction.transactionTypeNotAllowed");
        }

        validateTransactionReferences(
            request.getAccountId(),
            request.getGoalBucketId(),
            request.getCategoryId(),
            request.getSubcategoryId(),
            request.getTransactionType()
        );

        Transaction updated = new Transaction(
            transactionEntity.getTransactionId(),
            request.getAccountId(),
            request.getGoalBucketId(),
            request.getCategoryId(),
            request.getSubcategoryId(),
            request.getTransactionType(),
            resolveCashflowTreatment(request.getCashflowTreatment()),
            request.getTransactionDate(),
            request.getAmount(),
            request.getDescription().trim(),
            normalizeNote(request.getNote()),
            null,
            transactionEntity.getCreatedAt(),
            LocalDateTime.now(clock)
        );

        return toResponses(List.of(
            TransactionEntityMapper.toDomain(
                springDataTransactionRepository.save(TransactionEntityMapper.toEntity(updated))
            )
        )).getFirst();
    }

    @Transactional
    public DeleteTransactionResponse delete(Long transactionId) {
        TransactionEntity transactionEntity = getTransactionEntity(transactionId);

        if (transactionEntity.getTransferGroupId() != null) {
            List<Long> deletedAllocationIds = springDataGoalBucketAllocationRepository
                .findByLinkedTransferGroupId(transactionEntity.getTransferGroupId())
                .stream()
                .map(allocation -> allocation.getAllocationId())
                .toList();
            springDataGoalBucketAllocationRepository.deleteAll(
                springDataGoalBucketAllocationRepository.findByLinkedTransferGroupId(transactionEntity.getTransferGroupId())
            );

            List<TransactionEntity> transferTransactions = springDataTransactionRepository.findByTransferGroupId(
                transactionEntity.getTransferGroupId()
            );
            List<Long> deletedTransactionIds = transferTransactions.stream()
                .map(TransactionEntity::getTransactionId)
                .toList();
            springDataTransactionRepository.deleteAll(transferTransactions);

            return new DeleteTransactionResponse(
                transactionId,
                "DELETED_TRANSFER_GROUP",
                transactionEntity.getTransferGroupId(),
                deletedTransactionIds,
                deletedAllocationIds
            );
        }

        springDataTransactionRepository.delete(transactionEntity);
        return new DeleteTransactionResponse(
            transactionId,
            "DELETED",
            null,
            List.of(transactionId),
            List.of()
        );
    }

    public void validateTransactionReferences(
        Long accountId,
        Long goalBucketId,
        Long categoryId,
        Long subcategoryId,
        TransactionType transactionType
    ) {
        if (!accountRepository.existsById(accountId)) {
            throw new BusinessRuleException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "error.account.notFound", accountId);
        }

        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new BusinessRuleException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "error.category.notFound", categoryId));
        if (category.categoryType() != expectedCategoryType(transactionType)) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "CATEGORY_TYPE_MISMATCH",
                "error.transaction.categoryTypeMismatch",
                transactionType,
                category.categoryType()
            );
        }

        if (subcategoryId != null) {
            Subcategory subcategory = subcategoryRepository.findById(subcategoryId)
                .orElseThrow(() -> new BusinessRuleException(HttpStatus.NOT_FOUND, "SUBCATEGORY_NOT_FOUND", "error.subcategory.notFound", subcategoryId));
            if (!subcategory.categoryId().equals(categoryId)) {
                throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "SUBCATEGORY_CATEGORY_MISMATCH",
                    "error.transaction.subcategoryCategoryMismatch"
                );
            }
        }

        if (transactionType == TransactionType.TRANSFER_IN && goalBucketId != null) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_GOAL_BUCKET_NOT_ALLOWED",
                "error.transaction.transferInGoalBucketNotAllowed"
            );
        }

        if (goalBucketId != null) {
            GoalBucket goalBucket = goalBucketRepository.findById(goalBucketId)
                .orElseThrow(() -> new BusinessRuleException(HttpStatus.NOT_FOUND, "GOAL_BUCKET_NOT_FOUND", "error.goalBucket.notFound", goalBucketId));
            if (!goalBucket.accountId().equals(accountId)) {
                throw new BusinessRuleException(HttpStatus.CONFLICT, "GOAL_BUCKET_ACCOUNT_MISMATCH", "error.transaction.goalBucketAccountMismatch");
            }
        }
    }

    public List<TransactionResponse> toResponses(List<Transaction> transactions) {
        Map<Long, Account> accountMap = accountRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(Account::accountId, Function.identity()));
        Map<Long, GoalBucket> goalBucketMap = goalBucketRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(GoalBucket::goalBucketId, Function.identity()));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(Category::categoryId, Function.identity()));
        Map<Long, Subcategory> subcategoryMap = subcategoryRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(Subcategory::subcategoryId, Function.identity()));

        return transactions.stream()
            .map(transaction -> {
                Account account = accountMap.get(transaction.accountId());
                GoalBucket goalBucket = transaction.goalBucketId() == null ? null : goalBucketMap.get(transaction.goalBucketId());
                Category category = categoryMap.get(transaction.categoryId());
                Subcategory subcategory = transaction.subcategoryId() == null ? null : subcategoryMap.get(transaction.subcategoryId());
                return TransactionResponse.from(
                    transaction,
                    account == null ? null : account.accountName(),
                    goalBucket == null ? null : goalBucket.bucketName(),
                    category == null ? null : category.categoryName(),
                    subcategory == null ? null : subcategory.subcategoryName()
                );
            })
            .toList();
    }

    private CategoryType expectedCategoryType(TransactionType transactionType) {
        return switch (transactionType) {
            case INCOME -> CategoryType.INCOME;
            case EXPENSE -> CategoryType.EXPENSE;
            case TRANSFER_OUT, TRANSFER_IN -> CategoryType.TRANSFER;
        };
    }

    private CashflowTreatment resolveCashflowTreatment(CashflowTreatment cashflowTreatment) {
        return cashflowTreatment == null ? CashflowTreatment.AUTO : cashflowTreatment;
    }

    private String normalizeNote(String note) {
        if (note == null || note.isBlank()) {
            return null;
        }
        return note.trim();
    }

    private TransactionEntity getTransactionEntity(Long transactionId) {
        return springDataTransactionRepository.findById(transactionId)
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "TRANSACTION_NOT_FOUND",
                "error.transaction.notFound",
                transactionId
            ));
    }
}
