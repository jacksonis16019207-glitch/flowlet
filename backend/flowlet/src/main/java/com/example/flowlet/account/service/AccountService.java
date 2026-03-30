package com.example.flowlet.account.service;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.exception.AccountAlreadyExistsException;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.presentation.account.dto.AccountResponse;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final Clock clock;

    public AccountService(AccountRepository accountRepository, Clock clock) {
        this.accountRepository = accountRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> findAll() {
        return accountRepository.findAll().stream()
            .sorted(Comparator
                .comparing(Account::createdAt).reversed()
                .thenComparing(Account::accountId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(AccountResponse::from)
            .toList();
    }

    @Transactional
    public AccountResponse create(CreateAccountRequest request) {
        String bankName = request.getBankName().trim();
        String accountName = request.getAccountName().trim();

        if (accountRepository.existsByBankNameAndAccountNameAndAccountType(bankName, accountName, request.getAccountType())) {
            throw new AccountAlreadyExistsException(bankName, accountName);
        }

        LocalDateTime now = LocalDateTime.now(clock);
        Account account = new Account(
            null,
            bankName,
            accountName,
            request.getAccountType(),
            request.isActive(),
            now,
            now
        );
        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public void deleteAll() {
        accountRepository.deleteAll();
    }
}
