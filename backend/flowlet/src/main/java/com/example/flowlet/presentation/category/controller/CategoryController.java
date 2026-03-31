package com.example.flowlet.presentation.category.controller;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.category.service.CategoryService;
import com.example.flowlet.presentation.category.dto.CategoryResponse;
import com.example.flowlet.presentation.category.dto.SubcategoryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> listCategories(
        @RequestParam(required = false) CategoryType categoryType,
        @RequestParam(required = false) Boolean activeOnly
    ) {
        return categoryService.findCategories(categoryType, activeOnly);
    }

    @GetMapping("/subcategories")
    public List<SubcategoryResponse> listSubcategories(
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) Boolean activeOnly
    ) {
        return categoryService.findSubcategories(categoryId, activeOnly);
    }
}
