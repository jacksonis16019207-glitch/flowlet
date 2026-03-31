package com.example.flowlet.category.domain.repository;

import com.example.flowlet.category.domain.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {

    List<Category> findAll();

    Optional<Category> findById(Long categoryId);
}
