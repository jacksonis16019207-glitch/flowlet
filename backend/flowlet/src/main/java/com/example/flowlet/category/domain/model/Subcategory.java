package com.example.flowlet.category.domain.model;

import java.time.LocalDateTime;

public record Subcategory(
    Long subcategoryId,
    Long categoryId,
    String subcategoryName,
    Integer displayOrder,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
