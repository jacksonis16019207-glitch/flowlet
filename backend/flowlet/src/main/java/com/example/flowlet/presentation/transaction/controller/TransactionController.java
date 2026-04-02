package com.example.flowlet.presentation.transaction.controller;

import com.example.flowlet.presentation.transaction.dto.CreateTransactionRequest;
import com.example.flowlet.presentation.transaction.dto.DeleteTransactionResponse;
import com.example.flowlet.presentation.transaction.dto.TransactionResponse;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<TransactionResponse> list(
        @RequestParam(required = false) Long accountId,
        @RequestParam(required = false) TransactionType transactionType,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) Long goalBucketId,
        @RequestParam(required = false) LocalDate dateFrom,
        @RequestParam(required = false) LocalDate dateTo,
        @RequestParam(required = false) Integer limit
    ) {
        return transactionService.findAll(accountId, transactionType, categoryId, goalBucketId, dateFrom, dateTo, limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(@Valid @RequestBody CreateTransactionRequest request) {
        return transactionService.create(request);
    }

    @PutMapping("/{transactionId}")
    public TransactionResponse update(
        @PathVariable Long transactionId,
        @Valid @RequestBody CreateTransactionRequest request
    ) {
        return transactionService.update(transactionId, request);
    }

    @DeleteMapping("/{transactionId}")
    public DeleteTransactionResponse delete(@PathVariable Long transactionId) {
        return transactionService.delete(transactionId);
    }
}
