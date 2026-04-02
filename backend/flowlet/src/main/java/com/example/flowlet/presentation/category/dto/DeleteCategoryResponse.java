package com.example.flowlet.presentation.category.dto;

public record DeleteCategoryResponse(
    Long categoryId,
    String action,
    boolean active
) {
}
