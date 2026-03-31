package com.example.flowlet.category.domain.repository;

import com.example.flowlet.category.domain.model.Subcategory;

import java.util.List;
import java.util.Optional;

public interface SubcategoryRepository {

    List<Subcategory> findAll();

    Optional<Subcategory> findById(Long subcategoryId);
}
