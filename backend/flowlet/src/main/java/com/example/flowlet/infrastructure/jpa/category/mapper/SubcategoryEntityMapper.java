package com.example.flowlet.infrastructure.jpa.category.mapper;

import com.example.flowlet.category.domain.model.Subcategory;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;

public final class SubcategoryEntityMapper {

    private SubcategoryEntityMapper() {
    }

    public static Subcategory toDomain(SubcategoryEntity entity) {
        return new Subcategory(
            entity.getSubcategoryId(),
            entity.getCategoryId(),
            entity.getSubcategoryName(),
            entity.getDisplayOrder(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
