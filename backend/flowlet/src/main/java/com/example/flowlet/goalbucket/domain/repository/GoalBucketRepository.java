package com.example.flowlet.goalbucket.domain.repository;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;

import java.util.List;

public interface GoalBucketRepository {

    List<GoalBucket> findAll();

    boolean existsByAccountIdAndBucketName(Long accountId, String bucketName);

    GoalBucket save(GoalBucket goalBucket);

    void deleteAll();
}
