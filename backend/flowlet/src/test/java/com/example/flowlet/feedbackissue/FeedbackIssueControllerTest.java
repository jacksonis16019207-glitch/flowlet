package com.example.flowlet.feedbackissue;

import com.example.flowlet.account.exception.BusinessRuleException;
import com.example.flowlet.feedbackissue.service.CreateGitHubIssueCommand;
import com.example.flowlet.feedbackissue.service.CreatedGitHubIssue;
import com.example.flowlet.feedbackissue.service.GitHubIssueGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FeedbackIssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void postFeedbackIssueCreatesGitHubIssue() throws Exception {
        mockMvc.perform(post("/api/feedback-issues")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "kind":"FEATURE_REQUEST",
                      "title":"Settings から要望を送りたい",
                      "body":"本番環境からそのまま起票したいです。",
                      "pagePath":"settings/general"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.issueNumber").value(321))
            .andExpect(jsonPath("$.issueUrl").value("https://github.com/jacksonis16019207-glitch/flowlet/issues/321"));
    }

    @Test
    void postFeedbackIssueValidatesBlankTitle() throws Exception {
        mockMvc.perform(post("/api/feedback-issues")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "kind":"FEATURE_REQUEST",
                      "title":" ",
                      "body":"本番環境からそのまま起票したいです。",
                      "pagePath":"settings/general"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void postFeedbackIssueReturnsBadRequestForInvalidKind() throws Exception {
        mockMvc.perform(post("/api/feedback-issues")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "kind":"UNKNOWN",
                      "title":"種別の確認",
                      "body":"不正な種別です。",
                      "pagePath":"settings/general"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_FEEDBACK_ISSUE_KIND"));
    }

    @Test
    void postFeedbackIssueReturnsBadGatewayWhenGithubCreationFails() throws Exception {
        mockMvc.perform(post("/api/feedback-issues")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "kind":"BUG_REPORT",
                      "title":"fail to create",
                      "body":"GitHub 側のエラーを再現します。",
                      "pagePath":"settings/general"
                    }
                    """))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("FEEDBACK_ISSUE_CREATE_FAILED"));
    }

    @TestConfiguration
    static class TestGitHubIssueGatewayConfiguration {

        @Bean
        @Primary
        GitHubIssueGateway testGitHubIssueGateway() {
            return this::createFakeIssue;
        }

        private CreatedGitHubIssue createFakeIssue(CreateGitHubIssueCommand command) {
            if (command.title().contains("fail")) {
                throw new BusinessRuleException(
                    HttpStatus.BAD_GATEWAY,
                    "FEEDBACK_ISSUE_CREATE_FAILED",
                    "error.feedbackIssue.createFailed"
                );
            }

            return new CreatedGitHubIssue(
                321,
                "https://github.com/jacksonis16019207-glitch/flowlet/issues/321"
            );
        }
    }
}
