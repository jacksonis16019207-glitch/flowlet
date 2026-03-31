package com.example.flowlet.infrastructure.jpa.goalbucket.repository;

import com.example.flowlet.infrastructure.jpa.goalbucket.entity.GoalBucketEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataGoalBucketRepository extends JpaRepository<GoalBucketEntity, Long> {

    boolean existsByAccountIdAndBucketName(Long accountId, String bucketName);
}
