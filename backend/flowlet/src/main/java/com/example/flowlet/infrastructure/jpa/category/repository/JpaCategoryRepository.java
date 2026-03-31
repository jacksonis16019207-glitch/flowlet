package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.category.domain.model.Category;
import com.example.flowlet.category.domain.repository.CategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.mapper.CategoryEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaCategoryRepository implements CategoryRepository {

    private final SpringDataCategoryRepository springDataCategoryRepository;

    public JpaCategoryRepository(SpringDataCategoryRepository springDataCategoryRepository) {
        this.springDataCategoryRepository = springDataCategoryRepository;
    }

    @Override
    public List<Category> findAll() {
        return springDataCategoryRepository.findAll().stream()
            .map(CategoryEntityMapper::toDomain)
            .toList();
    }

    @Override
    public Optional<Category> findById(Long categoryId) {
        return springDataCategoryRepository.findById(categoryId)
            .map(CategoryEntityMapper::toDomain);
    }
}
