package com.example.flowlet.presentation.category.dto;

import com.example.flowlet.category.domain.model.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CategoryUpsertRequest {

    @NotBlank(message = "{validation.category.categoryName.notBlank}")
    @Size(max = 100, message = "{validation.category.categoryName.size}")
    private String categoryName;

    @NotNull(message = "{validation.category.categoryType.notNull}")
    private CategoryType categoryType;

    private Integer displayOrder = 0;

    private boolean active = true;

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public CategoryType getCategoryType() {
        return categoryType;
    }

    public void setCategoryType(CategoryType categoryType) {
        this.categoryType = categoryType;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
