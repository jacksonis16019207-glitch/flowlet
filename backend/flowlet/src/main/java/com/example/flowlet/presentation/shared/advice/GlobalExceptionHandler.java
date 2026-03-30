package com.example.flowlet.presentation.shared.advice;

import com.example.flowlet.presentation.shared.dto.ApiErrorResponse;
import com.example.flowlet.presentation.shared.dto.ApiFieldError;
import com.example.flowlet.shared.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
        MethodArgumentNotValidException exception,
        HttpServletRequest request
    ) {
        List<ApiFieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
            .sorted(Comparator.comparing(FieldError::getField))
            .map(fieldError -> new ApiFieldError(fieldError.getField(), fieldError.getDefaultMessage()))
            .toList();

        return ResponseEntity.badRequest().body(
            ApiErrorResponse.of(
                "VALIDATION_ERROR",
                resolveMessage("error.validation.failed"),
                fieldErrors
            )
        );
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(
        BusinessException exception,
        HttpServletRequest request
    ) {
        return ResponseEntity.status(exception.getStatus()).body(
            ApiErrorResponse.of(
                exception.getErrorCode(),
                resolveMessage(exception.getMessageCode(), exception.getMessageArgs())
            )
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(Exception exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiErrorResponse.of(
                "INTERNAL_SERVER_ERROR",
                resolveMessage("error.internalServer")
            )
        );
    }

    private String resolveMessage(String code, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(code, args, locale);
    }
}
