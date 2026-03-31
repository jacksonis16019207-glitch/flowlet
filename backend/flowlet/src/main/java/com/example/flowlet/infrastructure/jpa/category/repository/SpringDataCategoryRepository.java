package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCategoryRepository extends JpaRepository<CategoryEntity, Long> {
}
