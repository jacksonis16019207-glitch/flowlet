package com.example.flowlet.infrastructure.jpa.goalbucket.repository;

import com.example.flowlet.infrastructure.jpa.goalbucket.entity.GoalBucketEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataGoalBucketRepository extends JpaRepository<GoalBucketEntity, Long> {

    boolean existsByAccountIdAndBucketName(Long accountId, String bucketName);

    boolean existsByAccountId(Long accountId);

    Optional<GoalBucketEntity> findByAccountIdAndBucketName(Long accountId, String bucketName);
}
