package com.example.flowlet.account.exception;

import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class BusinessRuleException extends BusinessException {

    public BusinessRuleException(HttpStatus status, String errorCode, String messageCode, Object... messageArgs) {
        super(status, errorCode, messageCode, messageArgs);
    }
}
