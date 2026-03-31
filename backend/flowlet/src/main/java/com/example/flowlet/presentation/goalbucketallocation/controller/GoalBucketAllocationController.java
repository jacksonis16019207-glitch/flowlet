package com.example.flowlet.presentation.goalbucketallocation.controller;

import com.example.flowlet.application.service.GoalBucketAllocationApplicationService;
import com.example.flowlet.presentation.goalbucketallocation.dto.CreateGoalBucketAllocationsRequest;
import com.example.flowlet.presentation.goalbucketallocation.dto.GoalBucketAllocationBatchResponse;
import com.example.flowlet.presentation.goalbucketallocation.dto.GoalBucketAllocationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goal-bucket-allocations")
public class GoalBucketAllocationController {

    private final GoalBucketAllocationApplicationService goalBucketAllocationApplicationService;

    public GoalBucketAllocationController(GoalBucketAllocationApplicationService goalBucketAllocationApplicationService) {
        this.goalBucketAllocationApplicationService = goalBucketAllocationApplicationService;
    }

    @GetMapping
    public List<GoalBucketAllocationResponse> list(
        @RequestParam(required = false) Long accountId,
        @RequestParam(required = false) Long fromGoalBucketId,
        @RequestParam(required = false) Long toGoalBucketId,
        @RequestParam(required = false) LocalDate dateFrom,
        @RequestParam(required = false) LocalDate dateTo,
        @RequestParam(required = false) UUID linkedTransferGroupId
    ) {
        return goalBucketAllocationApplicationService.findAll(
            accountId,
            fromGoalBucketId,
            toGoalBucketId,
            dateFrom,
            dateTo,
            linkedTransferGroupId
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalBucketAllocationBatchResponse create(@Valid @RequestBody CreateGoalBucketAllocationsRequest request) {
        return goalBucketAllocationApplicationService.create(request);
    }
}
