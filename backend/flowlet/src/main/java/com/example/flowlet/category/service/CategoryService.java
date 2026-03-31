package com.example.flowlet.category.service;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.category.domain.repository.CategoryRepository;
import com.example.flowlet.category.domain.repository.SubcategoryRepository;
import com.example.flowlet.presentation.category.dto.CategoryResponse;
import com.example.flowlet.presentation.category.dto.SubcategoryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;

    public CategoryService(CategoryRepository categoryRepository, SubcategoryRepository subcategoryRepository) {
        this.categoryRepository = categoryRepository;
        this.subcategoryRepository = subcategoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findCategories(CategoryType categoryType, Boolean activeOnly) {
        return categoryRepository.findAll().stream()
            .filter(category -> categoryType == null || category.categoryType() == categoryType)
            .filter(category -> activeOnly == null || !activeOnly || category.active())
            .sorted(Comparator.comparing((com.example.flowlet.category.domain.model.Category category) -> category.displayOrder())
                .thenComparing(com.example.flowlet.category.domain.model.Category::categoryId))
            .map(CategoryResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<SubcategoryResponse> findSubcategories(Long categoryId, Boolean activeOnly) {
        return subcategoryRepository.findAll().stream()
            .filter(subcategory -> categoryId == null || subcategory.categoryId().equals(categoryId))
            .filter(subcategory -> activeOnly == null || !activeOnly || subcategory.active())
            .sorted(Comparator.comparing((com.example.flowlet.category.domain.model.Subcategory subcategory) -> subcategory.displayOrder())
                .thenComparing(com.example.flowlet.category.domain.model.Subcategory::subcategoryId))
            .map(SubcategoryResponse::from)
            .toList();
    }
}
