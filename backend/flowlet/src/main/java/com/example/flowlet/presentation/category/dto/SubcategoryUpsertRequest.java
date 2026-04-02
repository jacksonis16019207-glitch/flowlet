package com.example.flowlet.presentation.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubcategoryUpsertRequest {

    @NotNull(message = "{validation.subcategory.categoryId.notNull}")
    private Long categoryId;

    @NotBlank(message = "{validation.subcategory.subcategoryName.notBlank}")
    @Size(max = 100, message = "{validation.subcategory.subcategoryName.size}")
    private String subcategoryName;

    private Integer displayOrder = 0;

    private boolean active = true;

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getSubcategoryName() {
        return subcategoryName;
    }

    public void setSubcategoryName(String subcategoryName) {
        this.subcategoryName = subcategoryName;
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
