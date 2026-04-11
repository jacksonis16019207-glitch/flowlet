package com.example.flowlet.presentation.feedbackissue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateFeedbackIssueRequest {

    @NotBlank(message = "{validation.feedbackIssue.kind.notBlank}")
    @Size(max = 40, message = "{validation.feedbackIssue.kind.size}")
    private String kind;

    @NotBlank(message = "{validation.feedbackIssue.title.notBlank}")
    @Size(max = 120, message = "{validation.feedbackIssue.title.size}")
    private String title;

    @NotBlank(message = "{validation.feedbackIssue.body.notBlank}")
    @Size(max = 4000, message = "{validation.feedbackIssue.body.size}")
    private String body;

    @NotBlank(message = "{validation.feedbackIssue.pagePath.notBlank}")
    @Size(max = 120, message = "{validation.feedbackIssue.pagePath.size}")
    private String pagePath;

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getPagePath() {
        return pagePath;
    }

    public void setPagePath(String pagePath) {
        this.pagePath = pagePath;
    }
}
