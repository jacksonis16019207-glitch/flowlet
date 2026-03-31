package com.example.flowlet.goalbucket.exception;

import com.example.flowlet.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class GoalBucketAlreadyExistsException extends BusinessException {

    public GoalBucketAlreadyExistsException(Long accountId, String bucketName) {
        super(
            HttpStatus.CONFLICT,
            "GOAL_BUCKET_ALREADY_EXISTS",
            "error.goalBucket.alreadyExists",
            accountId,
            bucketName
        );
    }
}
