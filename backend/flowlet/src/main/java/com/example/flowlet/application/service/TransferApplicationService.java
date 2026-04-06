package com.example.flowlet.application.service;

import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.presentation.transaction.dto.TransactionResponse;
import com.example.flowlet.presentation.transfer.dto.CreateTransferRequest;
import com.example.flowlet.presentation.transfer.dto.TransferResponse;
import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import com.example.flowlet.transaction.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TransferApplicationService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final Clock clock;

    public TransferApplicationService(
        TransactionRepository transactionRepository,
        TransactionService transactionService,
        Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.clock = clock;
    }

    @Transactional
    public TransferResponse create(CreateTransferRequest request) {
        validateTransferRequest(request);
        UUID transferGroupId = UUID.randomUUID();
        List<Transaction> saved = saveTransferTransactions(
            transferGroupId,
            request,
            null,
            null
        );
        return toResponse(transferGroupId, request, saved);
    }

    @Transactional
    public TransferResponse update(UUID transferGroupId, CreateTransferRequest request) {
        validateTransferRequest(request);

        List<Transaction> existingTransactions = transactionRepository.findAll().stream()
            .filter(transaction -> transferGroupId.equals(transaction.transferGroupId()))
            .sorted(Comparator.comparing(Transaction::transactionId))
            .toList();
        if (existingTransactions.size() != 2) {
            throw new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "TRANSFER_NOT_FOUND",
                "error.transaction.notFound",
                transferGroupId
            );
        }

        Transaction existingOutgoing = existingTransactions.stream()
            .filter(transaction -> transaction.transactionType() == TransactionType.TRANSFER_OUT)
            .findFirst()
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_GROUP_INVALID",
                "error.transaction.transferTransactionUpdateNotAllowed",
                transferGroupId
            ));
        Transaction existingIncoming = existingTransactions.stream()
            .filter(transaction -> transaction.transactionType() == TransactionType.TRANSFER_IN)
            .findFirst()
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_GROUP_INVALID",
                "error.transaction.transferTransactionUpdateNotAllowed",
                transferGroupId
            ));

        List<Transaction> saved = saveTransferTransactions(
            transferGroupId,
            request,
            existingOutgoing,
            existingIncoming
        );
        return toResponse(transferGroupId, request, saved);
    }

    private void validateTransferRequest(CreateTransferRequest request) {
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "SAME_ACCOUNT_TRANSFER", "error.transfer.sameAccount");
        }

        transactionService.validateTransactionReferences(
            request.getFromAccountId(),
            request.getFromGoalBucketId(),
            request.getCategoryId(),
            request.getSubcategoryId(),
            TransactionType.TRANSFER_OUT
        );
        transactionService.validateTransactionReferences(
            request.getToAccountId(),
            null,
            request.getCategoryId(),
            request.getSubcategoryId(),
            TransactionType.TRANSFER_IN
        );
    }

    private List<Transaction> saveTransferTransactions(
        UUID transferGroupId,
        CreateTransferRequest request,
        Transaction existingOutgoing,
        Transaction existingIncoming
    ) {
        LocalDateTime now = LocalDateTime.now(clock);
        return transactionRepository.saveAll(List.of(
            new Transaction(
                existingOutgoing == null ? null : existingOutgoing.transactionId(),
                request.getFromAccountId(),
                request.getFromGoalBucketId(),
                request.getCategoryId(),
                request.getSubcategoryId(),
                TransactionType.TRANSFER_OUT,
                resolveCashflowTreatment(request.getOutgoingCashflowTreatment()),
                request.getTransactionDate(),
                request.getAmount(),
                request.getDescription().trim(),
                normalizeNote(request.getNote()),
                transferGroupId,
                existingOutgoing == null ? now : existingOutgoing.createdAt(),
                now
            ),
            new Transaction(
                existingIncoming == null ? null : existingIncoming.transactionId(),
                request.getToAccountId(),
                null,
                request.getCategoryId(),
                request.getSubcategoryId(),
                TransactionType.TRANSFER_IN,
                resolveCashflowTreatment(request.getIncomingCashflowTreatment()),
                request.getTransactionDate(),
                request.getAmount(),
                request.getDescription().trim(),
                normalizeNote(request.getNote()),
                transferGroupId,
                existingIncoming == null ? now : existingIncoming.createdAt(),
                now
            )
        ));
    }

    private TransferResponse toResponse(
        UUID transferGroupId,
        CreateTransferRequest request,
        List<Transaction> savedTransactions
    ) {
        List<TransactionResponse> responses = transactionService.toResponses(savedTransactions);
        TransactionResponse outgoingTransaction = responses.stream()
            .filter(transaction -> transaction.transactionType() == TransactionType.TRANSFER_OUT)
            .findFirst()
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_GROUP_INVALID",
                "error.transaction.transferTransactionUpdateNotAllowed",
                transferGroupId
            ));
        TransactionResponse incomingTransaction = responses.stream()
            .filter(transaction -> transaction.transactionType() == TransactionType.TRANSFER_IN)
            .findFirst()
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.CONFLICT,
                "TRANSFER_GROUP_INVALID",
                "error.transaction.transferTransactionUpdateNotAllowed",
                transferGroupId
            ));
        return new TransferResponse(
            transferGroupId,
            request.getTransactionDate(),
            request.getAmount(),
            outgoingTransaction,
            incomingTransaction
        );
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private CashflowTreatment resolveCashflowTreatment(CashflowTreatment cashflowTreatment) {
        return cashflowTreatment == null ? CashflowTreatment.AUTO : cashflowTreatment;
    }
}
