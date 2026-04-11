package com.example.flowlet.feedbackissue.service;

public interface GitHubIssueGateway {

    CreatedGitHubIssue createIssue(CreateGitHubIssueCommand command);
}
