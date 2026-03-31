package com.example.flowlet.goalbucket.domain.repository;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;

import java.util.List;
import java.util.Optional;

public interface GoalBucketRepository {

    List<GoalBucket> findAll();

    boolean existsById(Long goalBucketId);

    Optional<GoalBucket> findById(Long goalBucketId);

    boolean existsByAccountIdAndBucketName(Long accountId, String bucketName);

    GoalBucket save(GoalBucket goalBucket);

    void deleteAll();
}
