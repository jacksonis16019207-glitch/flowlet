package com.example.flowlet.infrastructure.jpa.category.mapper;

import com.example.flowlet.category.domain.model.Category;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;

public final class CategoryEntityMapper {

    private CategoryEntityMapper() {
    }

    public static Category toDomain(CategoryEntity entity) {
        return new Category(
            entity.getCategoryId(),
            entity.getCategoryName(),
            entity.getCategoryType(),
            entity.getDisplayOrder(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
