package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataSubcategoryRepository extends JpaRepository<SubcategoryEntity, Long> {
}
