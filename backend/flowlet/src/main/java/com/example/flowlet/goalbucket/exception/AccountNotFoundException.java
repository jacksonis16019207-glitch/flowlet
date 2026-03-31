package com.example.flowlet.goalbucket.exception;

import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class AccountNotFoundException extends BusinessException {

    public AccountNotFoundException(Long accountId) {
        super(
            HttpStatus.NOT_FOUND,
            "ACCOUNT_NOT_FOUND",
            "error.goalBucket.accountNotFound",
            accountId
        );
    }
}
