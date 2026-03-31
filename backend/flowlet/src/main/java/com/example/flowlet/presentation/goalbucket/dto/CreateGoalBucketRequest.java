package com.example.flowlet.presentation.goalbucket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateGoalBucketRequest {

    @NotNull(message = "{validation.goalBucket.accountId.notNull}")
    private Long accountId;

    @NotBlank(message = "{validation.goalBucket.bucketName.notBlank}")
    @Size(max = 100, message = "{validation.goalBucket.bucketName.size}")
    private String bucketName;

    private boolean active = true;

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
