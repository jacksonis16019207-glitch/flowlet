package com.example.flowlet.account.exception;

import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class AccountAlreadyExistsException extends BusinessException {

    public AccountAlreadyExistsException(String bankName, String accountName) {
        super(
            HttpStatus.CONFLICT,
            "ACCOUNT_ALREADY_EXISTS",
            "error.account.alreadyExists",
            bankName,
            accountName
        );
    }
}
