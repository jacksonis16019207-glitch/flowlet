package com.example.flowlet.account.service;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.CreditCardProfile;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.account.domain.repository.CreditCardProfileRepository;
import com.example.flowlet.account.exception.AccountAlreadyExistsException;
import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import com.example.flowlet.infrastructure.jpa.account.mapper.AccountEntityMapper;
import com.example.flowlet.infrastructure.jpa.account.mapper.CreditCardProfileEntityMapper;
import com.example.flowlet.infrastructure.jpa.account.repository.SpringDataAccountRepository;
import com.example.flowlet.infrastructure.jpa.account.repository.SpringDataCreditCardProfileRepository;
import com.example.flowlet.infrastructure.jpa.goalbucket.repository.SpringDataGoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataGoalBucketAllocationRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataTransactionRepository;
import com.example.flowlet.presentation.account.dto.AccountResponse;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest;
import com.example.flowlet.presentation.account.dto.CreateAccountRequest.CreditCardProfileRequest;
import com.example.flowlet.presentation.account.dto.CreditCardProfileResponse;
import com.example.flowlet.presentation.account.dto.DeleteAccountResponse;
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
    private final SpringDataAccountRepository springDataAccountRepository;
    private final SpringDataCreditCardProfileRepository springDataCreditCardProfileRepository;
    private final SpringDataGoalBucketRepository springDataGoalBucketRepository;
    private final SpringDataTransactionRepository springDataTransactionRepository;
    private final SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository;
    private final BalanceCalculator balanceCalculator;
    private final Clock clock;

    public AccountService(
        AccountRepository accountRepository,
        CreditCardProfileRepository creditCardProfileRepository,
        SpringDataAccountRepository springDataAccountRepository,
        SpringDataCreditCardProfileRepository springDataCreditCardProfileRepository,
        SpringDataGoalBucketRepository springDataGoalBucketRepository,
        SpringDataTransactionRepository springDataTransactionRepository,
        SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository,
        BalanceCalculator balanceCalculator,
        Clock clock
    ) {
        this.accountRepository = accountRepository;
        this.creditCardProfileRepository = creditCardProfileRepository;
        this.springDataAccountRepository = springDataAccountRepository;
        this.springDataCreditCardProfileRepository = springDataCreditCardProfileRepository;
        this.springDataGoalBucketRepository = springDataGoalBucketRepository;
        this.springDataTransactionRepository = springDataTransactionRepository;
        this.springDataGoalBucketAllocationRepository = springDataGoalBucketAllocationRepository;
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
    public AccountResponse update(Long accountId, CreateAccountRequest request) {
        AccountEntity accountEntity = getAccountEntity(accountId);
        String providerName = request.getProviderName().trim();
        String accountName = request.getAccountName().trim();
        boolean accountInUse = isAccountInUse(accountId);

        springDataAccountRepository.findByProviderNameAndAccountNameAndAccountCategory(
                providerName,
                accountName,
                request.getAccountCategory()
            )
            .filter(existing -> !existing.getAccountId().equals(accountId))
            .ifPresent(existing -> {
                throw new AccountAlreadyExistsException(providerName, accountName);
            });

        if (accountInUse && accountEntity.getAccountCategory() != request.getAccountCategory()) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "ACCOUNT_CATEGORY_CHANGE_NOT_ALLOWED",
                "error.account.categoryChangeNotAllowed",
                accountId
            );
        }

        if (accountInUse && accountEntity.getBalanceSide() != request.getBalanceSide()) {
            throw new BusinessRuleException(
                HttpStatus.CONFLICT,
                "ACCOUNT_BALANCE_SIDE_CHANGE_NOT_ALLOWED",
                "error.account.balanceSideChangeNotAllowed",
                accountId
            );
        }

        accountEntity.setProviderName(providerName);
        accountEntity.setAccountName(accountName);
        accountEntity.setAccountCategory(request.getAccountCategory());
        accountEntity.setBalanceSide(request.getBalanceSide());
        accountEntity.setActive(request.isActive());
        accountEntity.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        accountEntity.setUpdatedAt(LocalDateTime.now(clock));

        Account savedAccount = AccountEntityMapper.toDomain(springDataAccountRepository.save(accountEntity));
        CreditCardProfile savedCreditCardProfile = upsertCreditCardProfile(savedAccount, request.getCreditCardProfile());
        return toResponse(savedAccount, savedCreditCardProfile);
    }

    @Transactional
    public DeleteAccountResponse delete(Long accountId) {
        AccountEntity accountEntity = getAccountEntity(accountId);

        if (isAccountInUse(accountId)) {
            accountEntity.setActive(false);
            accountEntity.setUpdatedAt(LocalDateTime.now(clock));
            springDataAccountRepository.save(accountEntity);
            return new DeleteAccountResponse(accountId, "DEACTIVATED", false);
        }

        springDataCreditCardProfileRepository.deleteById(accountId);
        springDataAccountRepository.delete(accountEntity);
        return new DeleteAccountResponse(accountId, "DELETED", false);
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

        validateCreditCardProfile(account, request);

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

    private CreditCardProfile upsertCreditCardProfile(Account account, CreditCardProfileRequest request) {
        CreditCardProfile existingProfile = creditCardProfileRepository.findByAccountId(account.accountId()).orElse(null);

        if (account.accountCategory() != AccountCategory.CREDIT_CARD) {
            if (existingProfile != null) {
                springDataCreditCardProfileRepository.deleteById(account.accountId());
            }
            return null;
        }

        validateCreditCardProfile(account, request);

        LocalDateTime now = LocalDateTime.now(clock);
        CreditCardProfile profile = new CreditCardProfile(
            account.accountId(),
            request.getPaymentAccountId(),
            request.getClosingDay(),
            request.getPaymentDay(),
            request.getPaymentDateAdjustmentRule(),
            existingProfile == null ? now : existingProfile.createdAt(),
            now
        );
        return CreditCardProfileEntityMapper.toDomain(
            springDataCreditCardProfileRepository.save(CreditCardProfileEntityMapper.toEntity(profile))
        );
    }

    private void validateCreditCardProfile(Account account, CreditCardProfileRequest request) {
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
    }

    private AccountResponse toResponse(Account account, CreditCardProfile creditCardProfile) {
        BigDecimal currentBalance = balanceCalculator.calculateAccountBalance(account.accountId(), account.balanceSide());
        BigDecimal unallocatedBalance = balanceCalculator.calculateUnallocatedBalance(account.accountId(), account.balanceSide());
        CreditCardProfileResponse creditCardProfileResponse = creditCardProfile == null
            ? null
            : CreditCardProfileResponse.from(creditCardProfile);
        return AccountResponse.from(account, currentBalance, unallocatedBalance, creditCardProfileResponse);
    }

    private AccountEntity getAccountEntity(Long accountId) {
        return springDataAccountRepository.findById(accountId)
            .orElseThrow(() -> new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "ACCOUNT_NOT_FOUND",
                "error.account.notFound",
                accountId
            ));
    }

    private boolean isAccountInUse(Long accountId) {
        return springDataTransactionRepository.existsByAccountId(accountId)
            || springDataGoalBucketRepository.existsByAccountId(accountId)
            || springDataGoalBucketAllocationRepository.existsByAccountId(accountId)
            || springDataCreditCardProfileRepository.existsByPaymentAccountId(accountId);
    }
}
