package com.example.flowlet.dashboard.exception;

import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class DashboardRequestException extends BusinessException {

    public DashboardRequestException(HttpStatus status, String errorCode, String messageCode, Object... messageArgs) {
        super(status, errorCode, messageCode, messageArgs);
    }
}
