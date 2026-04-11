package com.example.flowlet.presentation.feedbackissue.dto;

public record CreateFeedbackIssueResponse(
    Integer issueNumber,
    String issueUrl
) {
}
