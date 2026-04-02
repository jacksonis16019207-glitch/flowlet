package com.example.flowlet.presentation.category.dto;

public record DeleteSubcategoryResponse(
    Long subcategoryId,
    String action,
    boolean active
) {
}
