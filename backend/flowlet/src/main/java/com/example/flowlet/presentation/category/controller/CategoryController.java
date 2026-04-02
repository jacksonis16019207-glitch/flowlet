package com.example.flowlet.presentation.category.controller;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.category.service.CategoryService;
import com.example.flowlet.presentation.category.dto.CategoryResponse;
import com.example.flowlet.presentation.category.dto.CategoryUpsertRequest;
import com.example.flowlet.presentation.category.dto.DeleteCategoryResponse;
import com.example.flowlet.presentation.category.dto.DeleteSubcategoryResponse;
import com.example.flowlet.presentation.category.dto.SubcategoryUpsertRequest;
import com.example.flowlet.presentation.category.dto.SubcategoryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryUpsertRequest request) {
        return categoryService.createCategory(request);
    }

    @PutMapping("/categories/{categoryId}")
    public CategoryResponse updateCategory(
        @PathVariable Long categoryId,
        @Valid @RequestBody CategoryUpsertRequest request
    ) {
        return categoryService.updateCategory(categoryId, request);
    }

    @DeleteMapping("/categories/{categoryId}")
    public DeleteCategoryResponse deleteCategory(@PathVariable Long categoryId) {
        return categoryService.deleteCategory(categoryId);
    }

    @PostMapping("/subcategories")
    @ResponseStatus(HttpStatus.CREATED)
    public SubcategoryResponse createSubcategory(@Valid @RequestBody SubcategoryUpsertRequest request) {
        return categoryService.createSubcategory(request);
    }

    @PutMapping("/subcategories/{subcategoryId}")
    public SubcategoryResponse updateSubcategory(
        @PathVariable Long subcategoryId,
        @Valid @RequestBody SubcategoryUpsertRequest request
    ) {
        return categoryService.updateSubcategory(subcategoryId, request);
    }

    @DeleteMapping("/subcategories/{subcategoryId}")
    public DeleteSubcategoryResponse deleteSubcategory(@PathVariable Long subcategoryId) {
        return categoryService.deleteSubcategory(subcategoryId);
    }
}
