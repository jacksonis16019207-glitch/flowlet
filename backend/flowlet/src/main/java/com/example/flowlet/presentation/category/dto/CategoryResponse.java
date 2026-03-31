package com.example.flowlet.presentation.category.dto;

import com.example.flowlet.category.domain.model.Category;
import com.example.flowlet.category.domain.model.CategoryType;

import java.time.LocalDateTime;

public record CategoryResponse(
    Long categoryId,
    String categoryName,
    CategoryType categoryType,
    Integer displayOrder,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
            category.categoryId(),
            category.categoryName(),
            category.categoryType(),
            category.displayOrder(),
            category.active(),
            category.createdAt(),
            category.updatedAt()
        );
    }
}
