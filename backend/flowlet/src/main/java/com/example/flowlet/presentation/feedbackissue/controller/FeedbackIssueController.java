package com.example.flowlet.presentation.feedbackissue.controller;

import com.example.flowlet.feedbackissue.service.FeedbackIssueService;
import com.example.flowlet.presentation.feedbackissue.dto.CreateFeedbackIssueRequest;
import com.example.flowlet.presentation.feedbackissue.dto.CreateFeedbackIssueResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback-issues")
public class FeedbackIssueController {

    private final FeedbackIssueService feedbackIssueService;

    public FeedbackIssueController(FeedbackIssueService feedbackIssueService) {
        this.feedbackIssueService = feedbackIssueService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateFeedbackIssueResponse create(@Valid @RequestBody CreateFeedbackIssueRequest request) {
        return feedbackIssueService.create(request);
    }
}
