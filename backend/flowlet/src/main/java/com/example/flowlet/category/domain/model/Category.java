package com.example.flowlet.category.domain.model;

import java.time.LocalDateTime;

public record Category(
    Long categoryId,
    String categoryName,
    CategoryType categoryType,
    Integer displayOrder,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
