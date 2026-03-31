package com.example.flowlet.account.service;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.CreditCardProfile;
import com.example.flowlet.account.exception.AccountAlreadyExistsException;
import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.account.domain.repository.CreditCardProfileRepository;
import com.example.flowlet.presentation.account.dto.AccountResponse;
import com.example.flowlet.presentation.account.dto.CreditCardProfileResponse;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest.CreditCardProfileRequest;
import com.example.flowlet.shared.util.BalanceCalculator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final CreditCardProfileRepository creditCardProfileRepository;
    private final BalanceCalculator balanceCalculator;
    private final Clock clock;

    public AccountService(
        AccountRepository accountRepository,
        CreditCardProfileRepository creditCardProfileRepository,
        BalanceCalculator balanceCalculator,
        Clock clock
    ) {
        this.accountRepository = accountRepository;
        this.creditCardProfileRepository = creditCardProfileRepository;
        this.balanceCalculator = balanceCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> findAll(Boolean activeOnly, AccountCategory accountCategory) {
        Map<Long, CreditCardProfile> creditCardProfiles = creditCardProfileRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(CreditCardProfile::accountId, Function.identity()));

        return accountRepository.findAll().stream()
            .filter(account -> activeOnly == null || !activeOnly || account.active())
            .filter(account -> accountCategory == null || account.accountCategory() == accountCategory)
            .sorted(Comparator
                .comparing(Account::displayOrder)
                .thenComparing(Account::createdAt).reversed()
                .thenComparing(Account::accountId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(account -> toResponse(account, creditCardProfiles.get(account.accountId())))
            .toList();
    }

    @Transactional
    public AccountResponse create(CreateAccountRequest request) {
        String providerName = request.getProviderName().trim();
        String accountName = request.getAccountName().trim();

        if (accountRepository.existsByProviderNameAndAccountNameAndAccountCategory(
            providerName,
            accountName,
            request.getAccountCategory()
        )) {
            throw new AccountAlreadyExistsException(providerName, accountName);
        }

        LocalDateTime now = LocalDateTime.now(clock);
        Account account = new Account(
            null,
            providerName,
            accountName,
            request.getAccountCategory(),
            request.getBalanceSide(),
            request.isActive(),
            request.getDisplayOrder() == null ? 0 : request.getDisplayOrder(),
            now,
            now
        );
        Account savedAccount = accountRepository.save(account);
        CreditCardProfile savedCreditCardProfile = saveCreditCardProfileIfNeeded(savedAccount, request.getCreditCardProfile(), now);
        return toResponse(savedAccount, savedCreditCardProfile);
    }

    @Transactional
    public void deleteAll() {
        creditCardProfileRepository.deleteAll();
        accountRepository.deleteAll();
    }

    private CreditCardProfile saveCreditCardProfileIfNeeded(
        Account account,
        CreditCardProfileRequest request,
        LocalDateTime now
    ) {
        if (account.accountCategory() != AccountCategory.CREDIT_CARD) {
            return null;
        }

        if (request == null) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "CREDIT_CARD_PROFILE_REQUIRED",
                "error.account.creditCardProfileRequired"
            );
        }

        if (!accountRepository.existsById(request.getPaymentAccountId())) {
            throw new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "ACCOUNT_NOT_FOUND",
                "error.account.notFound",
                request.getPaymentAccountId()
            );
        }

        if (request.getPaymentAccountId().equals(account.accountId())) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "CREDIT_CARD_PAYMENT_ACCOUNT_INVALID",
                "error.account.creditCardPaymentAccountInvalid"
            );
        }

        return creditCardProfileRepository.save(new CreditCardProfile(
            account.accountId(),
            request.getPaymentAccountId(),
            request.getClosingDay(),
            request.getPaymentDay(),
            request.getPaymentDateAdjustmentRule(),
            now,
            now
        ));
    }

    private AccountResponse toResponse(Account account, CreditCardProfile creditCardProfile) {
        BigDecimal currentBalance = balanceCalculator.calculateAccountBalance(account.accountId(), account.balanceSide());
        BigDecimal unallocatedBalance = balanceCalculator.calculateUnallocatedBalance(account.accountId(), account.balanceSide());
        CreditCardProfileResponse creditCardProfileResponse = creditCardProfile == null
            ? null
            : CreditCardProfileResponse.from(creditCardProfile);
        return AccountResponse.from(account, currentBalance, unallocatedBalance, creditCardProfileResponse);
    }
}
