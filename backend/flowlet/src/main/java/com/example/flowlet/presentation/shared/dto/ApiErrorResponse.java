package com.example.flowlet.presentation.shared.dto;

import java.util.List;

public record ApiErrorResponse(
    String code,
    String message,
    List<ApiFieldError> fieldErrors
) {
    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, List.of());
    }

    public static ApiErrorResponse of(String code, String message, List<ApiFieldError> fieldErrors) {
        return new ApiErrorResponse(code, message, List.copyOf(fieldErrors));
    }
}
