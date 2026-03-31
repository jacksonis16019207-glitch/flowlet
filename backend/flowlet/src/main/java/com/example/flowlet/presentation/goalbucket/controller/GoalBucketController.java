package com.example.flowlet.presentation.goalbucket.controller;

import com.example.flowlet.goalbucket.service.GoalBucketService;
import com.example.flowlet.presentation.goalbucket.dto.CreateGoalBucketRequest;
import com.example.flowlet.presentation.goalbucket.dto.GoalBucketResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public List<GoalBucketResponse> list() {
        return goalBucketService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalBucketResponse create(@Valid @RequestBody CreateGoalBucketRequest request) {
        return goalBucketService.create(request);
    }
}
