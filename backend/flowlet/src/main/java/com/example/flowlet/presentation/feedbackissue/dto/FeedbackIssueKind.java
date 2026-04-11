package com.example.flowlet.presentation.feedbackissue.dto;

import java.util.List;

public enum FeedbackIssueKind {
    FEATURE_REQUEST("要望", "[Feedback]", List.of("type:feature", "from:feedback")),
    BUG_REPORT("不具合", "[Bug]", List.of("type:bug", "from:feedback"));

    private final String label;
    private final String titlePrefix;
    private final List<String> issueLabels;

    FeedbackIssueKind(String label, String titlePrefix, List<String> issueLabels) {
        this.label = label;
        this.titlePrefix = titlePrefix;
        this.issueLabels = issueLabels;
    }

    public String label() {
        return label;
    }

    public String titlePrefix() {
        return titlePrefix;
    }

    public List<String> issueLabels() {
        return issueLabels;
    }

    public static FeedbackIssueKind from(String rawValue) {
        for (FeedbackIssueKind value : values()) {
            if (value.name().equals(rawValue)) {
                return value;
            }
        }

        throw new IllegalArgumentException(rawValue);
    }
}
