package com.example.flowlet.feedbackissue.service;

import com.example.flowlet.account.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GitHubIssueGatewayImpl implements GitHubIssueGateway {

    private static final String GITHUB_API_VERSION = "2022-11-28";
    private static final Pattern ISSUE_NUMBER_PATTERN = Pattern.compile("\"number\"\\s*:\\s*(\\d+)");
    private static final Pattern ISSUE_URL_PATTERN = Pattern.compile("\"html_url\"\\s*:\\s*\"([^\"]+)\"");

    private final HttpClient httpClient;
    private final String token;
    private final String repository;

    public GitHubIssueGatewayImpl(
        @Value("${flowlet.github.token:}") String token,
        @Value("${flowlet.github.repository:}") String repository
    ) {
        this.httpClient = HttpClient.newHttpClient();
        this.token = token;
        this.repository = repository;
    }

    @Override
    public CreatedGitHubIssue createIssue(CreateGitHubIssueCommand command) {
        if (token.isBlank() || repository.isBlank()) {
            throw new BusinessRuleException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "FEEDBACK_ISSUE_NOT_CONFIGURED",
                "error.feedbackIssue.notConfigured"
            );
        }

        try {
            String requestBody = buildRequestBody(command);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.github.com/repos/" + repository + "/issues"))
                .header("Accept", "application/vnd.github+json")
                .header("Authorization", "Bearer " + token)
                .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                .header("User-Agent", "flowlet-feedback-issue")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != HttpStatus.CREATED.value()) {
                throw new BusinessRuleException(
                    HttpStatus.BAD_GATEWAY,
                    "FEEDBACK_ISSUE_CREATE_FAILED",
                    "error.feedbackIssue.createFailed"
                );
            }

            return parseCreatedIssue(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BusinessRuleException(
                HttpStatus.BAD_GATEWAY,
                "FEEDBACK_ISSUE_CREATE_FAILED",
                "error.feedbackIssue.createFailed"
            );
        } catch (IOException | IllegalStateException exception) {
            throw new BusinessRuleException(
                HttpStatus.BAD_GATEWAY,
                "FEEDBACK_ISSUE_CREATE_FAILED",
                "error.feedbackIssue.createFailed"
            );
        }
    }

    private String buildRequestBody(CreateGitHubIssueCommand command) {
        String labels = command.labels().stream()
            .map(label -> "\"" + escapeJson(label) + "\"")
            .reduce((left, right) -> left + "," + right)
            .orElse("");

        return """
            {
              "title":"%s",
              "body":"%s",
              "labels":[%s]
            }
            """.formatted(
            escapeJson(command.title()),
            escapeJson(command.body()),
            labels
        );
    }

    private CreatedGitHubIssue parseCreatedIssue(String responseBody) {
        Matcher issueNumberMatcher = ISSUE_NUMBER_PATTERN.matcher(responseBody);
        Matcher issueUrlMatcher = ISSUE_URL_PATTERN.matcher(responseBody);

        if (!issueNumberMatcher.find() || !issueUrlMatcher.find()) {
            throw new IllegalStateException("GitHub issue response is incomplete");
        }

        return new CreatedGitHubIssue(
            Integer.parseInt(issueNumberMatcher.group(1)),
            issueUrlMatcher.group(1)
        );
    }

    private String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }
}
