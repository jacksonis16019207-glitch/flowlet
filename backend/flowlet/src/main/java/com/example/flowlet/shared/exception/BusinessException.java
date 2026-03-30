package com.example.flowlet.shared.exception;

import org.springframework.http.HttpStatus;

public abstract class BusinessException extends RuntimeException {

    private final String errorCode;
    private final String messageCode;
    private final Object[] messageArgs;
    private final HttpStatus status;

    protected BusinessException(HttpStatus status, String errorCode, String messageCode, Object... messageArgs) {
        super(messageCode);
        this.status = status;
        this.errorCode = errorCode;
        this.messageCode = messageCode;
        this.messageArgs = messageArgs;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getMessageCode() {
        return messageCode;
    }

    public Object[] getMessageArgs() {
        return messageArgs;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
