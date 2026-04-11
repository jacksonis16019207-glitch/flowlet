package com.example.flowlet.feedbackissue.service;

import java.util.List;

public record CreateGitHubIssueCommand(
    String title,
    String body,
    List<String> labels
) {
}
