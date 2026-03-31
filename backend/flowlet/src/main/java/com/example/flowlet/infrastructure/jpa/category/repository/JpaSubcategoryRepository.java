package com.example.flowlet.infrastructure.jpa.category.repository;

import com.example.flowlet.category.domain.model.Subcategory;
import com.example.flowlet.category.domain.repository.SubcategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.mapper.SubcategoryEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaSubcategoryRepository implements SubcategoryRepository {

    private final SpringDataSubcategoryRepository springDataSubcategoryRepository;

    public JpaSubcategoryRepository(SpringDataSubcategoryRepository springDataSubcategoryRepository) {
        this.springDataSubcategoryRepository = springDataSubcategoryRepository;
    }

    @Override
    public List<Subcategory> findAll() {
        return springDataSubcategoryRepository.findAll().stream()
            .map(SubcategoryEntityMapper::toDomain)
            .toList();
    }

    @Override
    public Optional<Subcategory> findById(Long subcategoryId) {
        return springDataSubcategoryRepository.findById(subcategoryId)
            .map(SubcategoryEntityMapper::toDomain);
    }
}
