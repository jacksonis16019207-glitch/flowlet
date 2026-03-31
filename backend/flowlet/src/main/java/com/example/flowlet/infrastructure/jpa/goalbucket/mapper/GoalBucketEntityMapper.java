package com.example.flowlet.infrastructure.jpa.goalbucket.mapper;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.infrastructure.jpa.goalbucket.entity.GoalBucketEntity;

public final class GoalBucketEntityMapper {

    private GoalBucketEntityMapper() {
    }

    public static GoalBucket toDomain(GoalBucketEntity entity) {
        return new GoalBucket(
            entity.getGoalBucketId(),
            entity.getAccountId(),
            entity.getBucketName(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static GoalBucketEntity toEntity(GoalBucket goalBucket) {
        GoalBucketEntity entity = new GoalBucketEntity();
        entity.setGoalBucketId(goalBucket.goalBucketId());
        entity.setAccountId(goalBucket.accountId());
        entity.setBucketName(goalBucket.bucketName());
        entity.setActive(goalBucket.active());
        entity.setCreatedAt(goalBucket.createdAt());
        entity.setUpdatedAt(goalBucket.updatedAt());
        return entity;
    }
}
