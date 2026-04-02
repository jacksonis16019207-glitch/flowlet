package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataSubcategoryRepository extends JpaRepository<SubcategoryEntity, Long> {

    Optional<SubcategoryEntity> findByCategoryIdAndSubcategoryName(Long categoryId, String subcategoryName);

    List<SubcategoryEntity> findByCategoryId(Long categoryId);
}
