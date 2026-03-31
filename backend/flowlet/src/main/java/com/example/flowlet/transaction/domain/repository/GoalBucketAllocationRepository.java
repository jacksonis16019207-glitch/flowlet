package com.example.flowlet.transaction.domain.repository;

import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;

import java.util.List;

public interface GoalBucketAllocationRepository {

    List<GoalBucketAllocation> findAll();

    List<GoalBucketAllocation> saveAll(List<GoalBucketAllocation> allocations);

    void deleteAll();
}
