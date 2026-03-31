package com.example.flowlet.category;

import com.example.flowlet.category.domain.model.CategoryType;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataCategoryRepository categoryRepository;

    @Autowired
    private SpringDataSubcategoryRepository subcategoryRepository;

    @BeforeEach
    void setUp() {
        subcategoryRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void getCategoriesAndSubcategoriesReturnsSeededMasterData() throws Exception {
        CategoryEntity category = new CategoryEntity();
        category.setCategoryName("食費");
        category.setCategoryType(CategoryType.EXPENSE);
        category.setDisplayOrder(10);
        category.setActive(true);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        category = categoryRepository.save(category);

        SubcategoryEntity subcategory = new SubcategoryEntity();
        subcategory.setCategoryId(category.getCategoryId());
        subcategory.setSubcategoryName("外食");
        subcategory.setDisplayOrder(10);
        subcategory.setActive(true);
        subcategory.setCreatedAt(LocalDateTime.now());
        subcategory.setUpdatedAt(LocalDateTime.now());
        subcategoryRepository.save(subcategory);

        mockMvc.perform(get("/api/categories").queryParam("categoryType", "EXPENSE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].categoryName").value("食費"));

        mockMvc.perform(get("/api/subcategories").queryParam("categoryId", String.valueOf(category.getCategoryId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].subcategoryName").value("外食"));
    }
}
