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

        UUID transferGroupId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now(clock);
        List<Transaction> saved = transactionRepository.saveAll(List.of(
            new Transaction(
                null,
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
                now,
                now
            ),
            new Transaction(
                null,
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
                now,
                now
            )
        ));

        List<TransactionResponse> responses = transactionService.toResponses(saved);
        return new TransferResponse(
            transferGroupId,
            request.getTransactionDate(),
            request.getAmount(),
            responses.get(0),
            responses.get(1)
        );
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private CashflowTreatment resolveCashflowTreatment(CashflowTreatment cashflowTreatment) {
        return cashflowTreatment == null ? CashflowTreatment.AUTO : cashflowTreatment;
    }
}
