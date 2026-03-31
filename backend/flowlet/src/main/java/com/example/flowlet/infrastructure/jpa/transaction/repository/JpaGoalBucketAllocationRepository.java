package com.example.flowlet.infrastructure.jpa.transaction.repository;

import com.example.flowlet.infrastructure.jpa.transaction.mapper.GoalBucketAllocationEntityMapper;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JpaGoalBucketAllocationRepository implements GoalBucketAllocationRepository {

    private final SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository;

    public JpaGoalBucketAllocationRepository(SpringDataGoalBucketAllocationRepository springDataGoalBucketAllocationRepository) {
        this.springDataGoalBucketAllocationRepository = springDataGoalBucketAllocationRepository;
    }

    @Override
    public List<GoalBucketAllocation> findAll() {
        return springDataGoalBucketAllocationRepository.findAll().stream()
            .map(GoalBucketAllocationEntityMapper::toDomain)
            .toList();
    }

    @Override
    public List<GoalBucketAllocation> saveAll(List<GoalBucketAllocation> allocations) {
        return springDataGoalBucketAllocationRepository.saveAll(
            allocations.stream().map(GoalBucketAllocationEntityMapper::toEntity).toList()
        ).stream()
            .map(GoalBucketAllocationEntityMapper::toDomain)
            .toList();
    }

    @Override
    public void deleteAll() {
        springDataGoalBucketAllocationRepository.deleteAll();
    }
}
