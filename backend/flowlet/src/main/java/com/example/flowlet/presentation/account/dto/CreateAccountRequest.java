package com.example.flowlet.presentation.account.dto;

import com.example.flowlet.account.domain.model.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAccountRequest {

    @NotBlank(message = "{validation.account.bankName.notBlank}")
    @Size(max = 100, message = "{validation.account.bankName.size}")
    private String bankName;

    @NotBlank(message = "{validation.account.accountName.notBlank}")
    @Size(max = 100, message = "{validation.account.accountName.size}")
    private String accountName;

    @NotNull(message = "{validation.account.accountType.notNull}")
    private AccountType accountType;

    private boolean active = true;

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
