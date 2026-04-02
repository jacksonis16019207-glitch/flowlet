package com.example.flowlet.presentation.account.controller;

import com.example.flowlet.account.service.AccountService;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.presentation.account.dto.AccountResponse;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest;
import com.example.flowlet.presentation.account.dto.DeleteAccountResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public List<AccountResponse> list(
        @RequestParam(required = false) Boolean activeOnly,
        @RequestParam(required = false) AccountCategory accountCategory
    ) {
        return accountService.findAll(activeOnly, accountCategory);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody CreateAccountRequest request) {
        return accountService.create(request);
    }

    @PutMapping("/{accountId}")
    public AccountResponse update(@PathVariable Long accountId, @Valid @RequestBody CreateAccountRequest request) {
        return accountService.update(accountId, request);
    }

    @DeleteMapping("/{accountId}")
    public DeleteAccountResponse delete(@PathVariable Long accountId) {
        return accountService.delete(accountId);
    }
}
