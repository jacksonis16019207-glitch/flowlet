package com.example.flowlet.presentation.category.dto;

import com.example.flowlet.category.domain.model.Subcategory;

import java.time.LocalDateTime;

public record SubcategoryResponse(
    Long subcategoryId,
    Long categoryId,
    String subcategoryName,
    Integer displayOrder,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static SubcategoryResponse from(Subcategory subcategory) {
        return new SubcategoryResponse(
            subcategory.subcategoryId(),
            subcategory.categoryId(),
            subcategory.subcategoryName(),
            subcategory.displayOrder(),
            subcategory.active(),
            subcategory.createdAt(),
            subcategory.updatedAt()
        );
    }
}
