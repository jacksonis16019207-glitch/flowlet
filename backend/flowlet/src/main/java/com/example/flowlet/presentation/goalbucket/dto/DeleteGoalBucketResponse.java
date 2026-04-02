package com.example.flowlet.presentation.goalbucket.dto;

public record DeleteGoalBucketResponse(
    Long goalBucketId,
    String action,
    boolean active
) {
}
