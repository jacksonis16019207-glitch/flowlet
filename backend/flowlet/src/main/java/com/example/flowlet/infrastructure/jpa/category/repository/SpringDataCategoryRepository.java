package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataCategoryRepository extends JpaRepository<CategoryEntity, Long> {

    Optional<CategoryEntity> findByCategoryTypeAndCategoryName(CategoryType categoryType, String categoryName);
}
