package com.example.flowlet.category.service;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.category.domain.repository.CategoryRepository;
import com.example.flowlet.category.domain.repository.SubcategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.mapper.CategoryEntityMapper;
import com.example.flowlet.infrastructure.jpa.category.mapper.SubcategoryEntityMapper;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import com.example.flowlet.infrastructure.jpa.transaction.repository.SpringDataTransactionRepository;
import com.example.flowlet.presentation.category.dto.CategoryResponse;
import com.example.flowlet.presentation.category.dto.CategoryUpsertRequest;
import com.example.flowlet.presentation.category.dto.DeleteCategoryResponse;
import com.example.flowlet.presentation.category.dto.DeleteSubcategoryResponse;
import com.example.flowlet.presentation.category.dto.SubcategoryUpsertRequest;
import com.example.flowlet.presentation.category.dto.SubcategoryResponse;
import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final SpringDataCategoryRepository springDataCategoryRepository;
    private final SpringDataSubcategoryRepository springDataSubcategoryRepository;
    private final SpringDataTransactionRepository springDataTransactionRepository;
    private final Clock clock;

    public CategoryService(
        CategoryRepository categoryRepository,
        SubcategoryRepository subcategoryRepository,
        SpringDataCategoryRepository springDataCategoryRepository,
        SpringDataSubcategoryRepository springDataSubcategoryRepository,
        SpringDataTransactionRepository springDataTransactionRepository,
        Clock clock
    ) {
        this.categoryRepository = categoryRepository;
        this.subcategoryRepository = subcategoryRepository;
        this.springDataCategoryRepository = springDataCategoryRepository;
        this.springDataSubcategoryRepository = springDataSubcategoryRepository;
        this.springDataTransactionRepository = springDataTransactionRepository;
        this.clock = clock;
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

    @Transactional
    public CategoryResponse createCategory(CategoryUpsertRequest request) {
        String categoryName = request.getCategoryName().trim();

        if (springDataCategoryRepository.findByCategoryTypeAndCategoryName(request.getCategoryType(), categoryName).isPresent()) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "CATEGORY_ALREADY_EXISTS",
                "error.category.alreadyExists",
                request.getCategoryType(),
                categoryName
            ) {
            };
        }

        LocalDateTime now = LocalDateTime.now(clock);
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setCategoryName(categoryName);
        categoryEntity.setCategoryType(request.getCategoryType());
        categoryEntity.setDisplayOrder(defaultDisplayOrder(request.getDisplayOrder()));
        categoryEntity.setActive(request.isActive());
        categoryEntity.setCreatedAt(now);
        categoryEntity.setUpdatedAt(now);
        return CategoryResponse.from(CategoryEntityMapper.toDomain(springDataCategoryRepository.save(categoryEntity)));
    }

    @Transactional
    public CategoryResponse updateCategory(Long categoryId, CategoryUpsertRequest request) {
        CategoryEntity categoryEntity = getCategoryEntity(categoryId);
        String categoryName = request.getCategoryName().trim();
        boolean categoryInUse = springDataTransactionRepository.existsByCategoryId(categoryId);

        if (categoryInUse && categoryEntity.getCategoryType() != request.getCategoryType()) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "CATEGORY_TYPE_CHANGE_NOT_ALLOWED",
                "error.category.typeChangeNotAllowed",
                categoryId
            ) {
            };
        }

        springDataCategoryRepository.findByCategoryTypeAndCategoryName(request.getCategoryType(), categoryName)
            .filter(existing -> !existing.getCategoryId().equals(categoryId))
            .ifPresent(existing -> {
                throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "CATEGORY_ALREADY_EXISTS",
                    "error.category.alreadyExists",
                    request.getCategoryType(),
                    categoryName
                ) {
                };
            });

        categoryEntity.setCategoryName(categoryName);
        categoryEntity.setCategoryType(request.getCategoryType());
        categoryEntity.setDisplayOrder(defaultDisplayOrder(request.getDisplayOrder()));
        categoryEntity.setActive(request.isActive());
        categoryEntity.setUpdatedAt(LocalDateTime.now(clock));
        return CategoryResponse.from(CategoryEntityMapper.toDomain(springDataCategoryRepository.save(categoryEntity)));
    }

    @Transactional
    public DeleteCategoryResponse deleteCategory(Long categoryId) {
        CategoryEntity categoryEntity = getCategoryEntity(categoryId);

        if (springDataTransactionRepository.existsByCategoryId(categoryId)) {
            LocalDateTime now = LocalDateTime.now(clock);
            categoryEntity.setActive(false);
            categoryEntity.setUpdatedAt(now);
            springDataCategoryRepository.save(categoryEntity);

            List<SubcategoryEntity> subcategoryEntities = springDataSubcategoryRepository.findByCategoryId(categoryId);
            subcategoryEntities.forEach(subcategoryEntity -> {
                subcategoryEntity.setActive(false);
                subcategoryEntity.setUpdatedAt(now);
            });
            springDataSubcategoryRepository.saveAll(subcategoryEntities);

            return new DeleteCategoryResponse(categoryId, "DEACTIVATED", false);
        }

        springDataSubcategoryRepository.deleteAll(springDataSubcategoryRepository.findByCategoryId(categoryId));
        springDataCategoryRepository.delete(categoryEntity);
        return new DeleteCategoryResponse(categoryId, "DELETED", false);
    }

    @Transactional
    public SubcategoryResponse createSubcategory(SubcategoryUpsertRequest request) {
        CategoryEntity parentCategory = getCategoryEntity(request.getCategoryId());
        String subcategoryName = request.getSubcategoryName().trim();

        if (springDataSubcategoryRepository.findByCategoryIdAndSubcategoryName(request.getCategoryId(), subcategoryName).isPresent()) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "SUBCATEGORY_ALREADY_EXISTS",
                "error.subcategory.alreadyExists",
                request.getCategoryId(),
                subcategoryName
            ) {
            };
        }

        LocalDateTime now = LocalDateTime.now(clock);
        SubcategoryEntity subcategoryEntity = new SubcategoryEntity();
        subcategoryEntity.setCategoryId(parentCategory.getCategoryId());
        subcategoryEntity.setSubcategoryName(subcategoryName);
        subcategoryEntity.setDisplayOrder(defaultDisplayOrder(request.getDisplayOrder()));
        subcategoryEntity.setActive(request.isActive());
        subcategoryEntity.setCreatedAt(now);
        subcategoryEntity.setUpdatedAt(now);
        return SubcategoryResponse.from(SubcategoryEntityMapper.toDomain(springDataSubcategoryRepository.save(subcategoryEntity)));
    }

    @Transactional
    public SubcategoryResponse updateSubcategory(Long subcategoryId, SubcategoryUpsertRequest request) {
        SubcategoryEntity subcategoryEntity = getSubcategoryEntity(subcategoryId);
        getCategoryEntity(request.getCategoryId());
        String subcategoryName = request.getSubcategoryName().trim();
        boolean subcategoryInUse = springDataTransactionRepository.existsBySubcategoryId(subcategoryId);

        if (subcategoryInUse && !subcategoryEntity.getCategoryId().equals(request.getCategoryId())) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "SUBCATEGORY_CATEGORY_CHANGE_NOT_ALLOWED",
                "error.subcategory.categoryChangeNotAllowed",
                subcategoryId
            ) {
            };
        }

        springDataSubcategoryRepository.findByCategoryIdAndSubcategoryName(request.getCategoryId(), subcategoryName)
            .filter(existing -> !existing.getSubcategoryId().equals(subcategoryId))
            .ifPresent(existing -> {
                throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "SUBCATEGORY_ALREADY_EXISTS",
                    "error.subcategory.alreadyExists",
                    request.getCategoryId(),
                    subcategoryName
                ) {
                };
            });

        subcategoryEntity.setCategoryId(request.getCategoryId());
        subcategoryEntity.setSubcategoryName(subcategoryName);
        subcategoryEntity.setDisplayOrder(defaultDisplayOrder(request.getDisplayOrder()));
        subcategoryEntity.setActive(request.isActive());
        subcategoryEntity.setUpdatedAt(LocalDateTime.now(clock));
        return SubcategoryResponse.from(SubcategoryEntityMapper.toDomain(springDataSubcategoryRepository.save(subcategoryEntity)));
    }

    @Transactional
    public DeleteSubcategoryResponse deleteSubcategory(Long subcategoryId) {
        SubcategoryEntity subcategoryEntity = getSubcategoryEntity(subcategoryId);

        if (springDataTransactionRepository.existsBySubcategoryId(subcategoryId)) {
            subcategoryEntity.setActive(false);
            subcategoryEntity.setUpdatedAt(LocalDateTime.now(clock));
            springDataSubcategoryRepository.save(subcategoryEntity);
            return new DeleteSubcategoryResponse(subcategoryId, "DEACTIVATED", false);
        }

        springDataSubcategoryRepository.delete(subcategoryEntity);
        return new DeleteSubcategoryResponse(subcategoryId, "DELETED", false);
    }

    private CategoryEntity getCategoryEntity(Long categoryId) {
        return springDataCategoryRepository.findById(categoryId)
            .orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND,
                "CATEGORY_NOT_FOUND",
                "error.category.notFound",
                categoryId
            ) {
            });
    }

    private SubcategoryEntity getSubcategoryEntity(Long subcategoryId) {
        return springDataSubcategoryRepository.findById(subcategoryId)
            .orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND,
                "SUBCATEGORY_NOT_FOUND",
                "error.subcategory.notFound",
                subcategoryId
            ) {
            });
    }

    private int defaultDisplayOrder(Integer displayOrder) {
        return displayOrder == null ? 0 : displayOrder;
    }
}
