package com.example.flowlet.infrastructure.jpa.transaction.repository;

import com.example.flowlet.infrastructure.jpa.transaction.entity.GoalBucketAllocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataGoalBucketAllocationRepository extends JpaRepository<GoalBucketAllocationEntity, Long> {

    boolean existsByAccountId(Long accountId);

    boolean existsByFromGoalBucketId(Long goalBucketId);

    boolean existsByToGoalBucketId(Long goalBucketId);

    List<GoalBucketAllocationEntity> findByLinkedTransferGroupId(UUID linkedTransferGroupId);
}
