package com.example.flowlet.presentation.goalbucket.controller;

import com.example.flowlet.goalbucket.service.GoalBucketService;
import com.example.flowlet.presentation.goalbucket.dto.CreateGoalBucketRequest;
import com.example.flowlet.presentation.goalbucket.dto.DeleteGoalBucketResponse;
import com.example.flowlet.presentation.goalbucket.dto.GoalBucketResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/goal-buckets")
public class GoalBucketController {

    private final GoalBucketService goalBucketService;

    public GoalBucketController(GoalBucketService goalBucketService) {
        this.goalBucketService = goalBucketService;
    }

    @GetMapping
    public List<GoalBucketResponse> list(
        @RequestParam(required = false) Long accountId,
        @RequestParam(required = false) Boolean activeOnly
    ) {
        return goalBucketService.findAll(accountId, activeOnly);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalBucketResponse create(@Valid @RequestBody CreateGoalBucketRequest request) {
        return goalBucketService.create(request);
    }

    @PutMapping("/{goalBucketId}")
    public GoalBucketResponse update(
        @PathVariable Long goalBucketId,
        @Valid @RequestBody CreateGoalBucketRequest request
    ) {
        return goalBucketService.update(goalBucketId, request);
    }

    @DeleteMapping("/{goalBucketId}")
    public DeleteGoalBucketResponse delete(@PathVariable Long goalBucketId) {
        return goalBucketService.delete(goalBucketId);
    }
}
