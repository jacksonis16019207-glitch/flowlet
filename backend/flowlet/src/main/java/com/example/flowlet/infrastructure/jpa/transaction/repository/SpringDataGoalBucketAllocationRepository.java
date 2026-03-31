package com.example.flowlet.infrastructure.jpa.transaction.repository;

import com.example.flowlet.infrastructure.jpa.transaction.entity.GoalBucketAllocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataGoalBucketAllocationRepository extends JpaRepository<GoalBucketAllocationEntity, Long> {
}
