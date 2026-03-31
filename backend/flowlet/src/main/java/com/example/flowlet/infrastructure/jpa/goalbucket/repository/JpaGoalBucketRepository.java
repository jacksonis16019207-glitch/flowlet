package com.example.flowlet.infrastructure.jpa.goalbucket.repository;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.goalbucket.entity.GoalBucketEntity;
import com.example.flowlet.infrastructure.jpa.goalbucket.mapper.GoalBucketEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JpaGoalBucketRepository implements GoalBucketRepository {

    private final SpringDataGoalBucketRepository springDataGoalBucketRepository;

    public JpaGoalBucketRepository(SpringDataGoalBucketRepository springDataGoalBucketRepository) {
        this.springDataGoalBucketRepository = springDataGoalBucketRepository;
    }

    @Override
    public List<GoalBucket> findAll() {
        return springDataGoalBucketRepository.findAll().stream()
            .map(GoalBucketEntityMapper::toDomain)
            .toList();
    }

    @Override
    public boolean existsByAccountIdAndBucketName(Long accountId, String bucketName) {
        return springDataGoalBucketRepository.existsByAccountIdAndBucketName(accountId, bucketName);
    }

    @Override
    public GoalBucket save(GoalBucket goalBucket) {
        GoalBucketEntity savedEntity = springDataGoalBucketRepository.save(GoalBucketEntityMapper.toEntity(goalBucket));
        return GoalBucketEntityMapper.toDomain(savedEntity);
    }

    @Override
    public void deleteAll() {
        springDataGoalBucketRepository.deleteAll();
    }
}
