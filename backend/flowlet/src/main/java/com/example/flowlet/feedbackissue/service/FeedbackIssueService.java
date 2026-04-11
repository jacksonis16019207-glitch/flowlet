package com.example.flowlet.feedbackissue.service;

import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.presentation.feedbackissue.dto.CreateFeedbackIssueRequest;
import com.example.flowlet.presentation.feedbackissue.dto.CreateFeedbackIssueResponse;
import com.example.flowlet.presentation.feedbackissue.dto.FeedbackIssueKind;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.OffsetDateTime;

@Service
public class FeedbackIssueService {

    private final GitHubIssueGateway gitHubIssueGateway;
    private final Clock clock;

    public FeedbackIssueService(GitHubIssueGateway gitHubIssueGateway, Clock clock) {
        this.gitHubIssueGateway = gitHubIssueGateway;
        this.clock = clock;
    }

    public CreateFeedbackIssueResponse create(CreateFeedbackIssueRequest request) {
        FeedbackIssueKind kind = resolveKind(request.getKind());
        String normalizedTitle = request.getTitle().trim();
        String normalizedBody = request.getBody().trim();
        String normalizedPagePath = request.getPagePath().trim();

        CreatedGitHubIssue issue = gitHubIssueGateway.createIssue(
            new CreateGitHubIssueCommand(
                kind.titlePrefix() + " " + normalizedTitle,
                buildIssueBody(kind, normalizedBody, normalizedPagePath),
                kind.issueLabels()
            )
        );

        return new CreateFeedbackIssueResponse(issue.issueNumber(), issue.issueUrl());
    }

    private FeedbackIssueKind resolveKind(String rawValue) {
        try {
            return FeedbackIssueKind.from(rawValue.trim());
        } catch (IllegalArgumentException exception) {
            throw new BusinessRuleException(
                HttpStatus.BAD_REQUEST,
                "INVALID_FEEDBACK_ISSUE_KIND",
                "error.feedbackIssue.invalidKind"
            );
        }
    }

    private String buildIssueBody(FeedbackIssueKind kind, String body, String pagePath) {
        return """
            ## Source
            - 種別: %s
            - 発生ページ: %s
            - 送信日時: %s

            ## 内容
            %s
            """.formatted(
            kind.label(),
            pagePath,
            OffsetDateTime.now(clock),
            body
        );
    }
}
