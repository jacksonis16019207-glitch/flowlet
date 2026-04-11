package com.example.flowlet.feedbackissue.service;

public record CreatedGitHubIssue(
    Integer issueNumber,
    String issueUrl
) {
}
