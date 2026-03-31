package com.example.flowlet.infrastructure.jpa.transaction.mapper;

import com.example.flowlet.infrastructure.jpa.transaction.entity.GoalBucketAllocationEntity;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;

public final class GoalBucketAllocationEntityMapper {

    private GoalBucketAllocationEntityMapper() {
    }

    public static GoalBucketAllocation toDomain(GoalBucketAllocationEntity entity) {
        return new GoalBucketAllocation(
            entity.getAllocationId(),
            entity.getAccountId(),
            entity.getFromGoalBucketId(),
            entity.getToGoalBucketId(),
            entity.getAllocationDate(),
            entity.getAmount(),
            entity.getDescription(),
            entity.getNote(),
            entity.getLinkedTransferGroupId(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static GoalBucketAllocationEntity toEntity(GoalBucketAllocation allocation) {
        GoalBucketAllocationEntity entity = new GoalBucketAllocationEntity();
        entity.setAllocationId(allocation.allocationId());
        entity.setAccountId(allocation.accountId());
        entity.setFromGoalBucketId(allocation.fromGoalBucketId());
        entity.setToGoalBucketId(allocation.toGoalBucketId());
        entity.setAllocationDate(allocation.allocationDate());
        entity.setAmount(allocation.amount());
        entity.setDescription(allocation.description());
        entity.setNote(allocation.note());
        entity.setLinkedTransferGroupId(allocation.linkedTransferGroupId());
        entity.setCreatedAt(allocation.createdAt());
        entity.setUpdatedAt(allocation.updatedAt());
        return entity;
    }
}
