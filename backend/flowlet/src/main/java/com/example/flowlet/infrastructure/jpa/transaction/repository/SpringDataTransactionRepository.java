package com.example.flowlet.infrastructure.jpa.transaction.repository;

import com.example.flowlet.infrastructure.jpa.transaction.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataTransactionRepository extends JpaRepository<TransactionEntity, Long> {

    boolean existsByCategoryId(Long categoryId);

    boolean existsBySubcategoryId(Long subcategoryId);

    boolean existsByAccountId(Long accountId);

    boolean existsByGoalBucketId(Long goalBucketId);

    List<TransactionEntity> findByTransferGroupId(UUID transferGroupId);
}
