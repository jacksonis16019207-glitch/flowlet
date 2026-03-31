package com.example.flowlet.goalbucket;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountType;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoalBucketControllerTest {

    private static final ZoneId APP_ZONE_ID = ZoneId.of("Asia/Tokyo");
    private static final Instant FIXED_INSTANT = Instant.parse("2026-03-31T01:23:45Z");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private GoalBucketRepository goalBucketRepository;

    @BeforeEach
    void setUp() {
        goalBucketRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void postGoalBucketsCreatesAGoalBucket() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main Account",
            AccountType.CHECKING,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        String request = """
            {"accountId":%d,"bucketName":"Emergency","active":true}
            """.formatted(account.accountId());

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accountId").value(account.accountId()))
            .andExpect(jsonPath("$.bucketName").value("Emergency"))
            .andExpect(jsonPath("$.active").value(true))
            .andExpect(jsonPath("$.createdAt").value("2026-03-31T10:23:45"));
    }

    @Test
    void postGoalBucketsReturnsValidationErrors() throws Exception {
        String request = """
            {"bucketName":"%s","active":true}
            """.formatted("a".repeat(101));

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"accountId\")].message").value("親口座IDは必須です。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"bucketName\")].message").value("目的別口座名は100文字以内で入力してください。"));
    }

    @Test
    void postGoalBucketsReturnsNotFoundWhenAccountDoesNotExist() throws Exception {
        String request = """
            {"accountId":999,"bucketName":"Emergency","active":true}
            """;

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("親口座ID 999 の口座が見つかりません。"))
            .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    @Test
    void postGoalBucketsReturnsConflictWhenGoalBucketAlreadyExists() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main Account",
            AccountType.CHECKING,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"bucketName":"Emergency","active":true}
                    """.formatted(account.accountId())))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"bucketName":"Emergency","active":true}
                    """.formatted(account.accountId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("GOAL_BUCKET_ALREADY_EXISTS"))
            .andExpect(jsonPath("$.message").value("親口座ID %d には目的別口座 Emergency がすでに登録されています。".formatted(account.accountId())))
            .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    @Test
    void getGoalBucketsReturnsCreatedGoalBuckets() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Hyper Savings",
            AccountType.SAVINGS,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(post("/api/goal-buckets")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"bucketName":"Travel","active":true}
                    """.formatted(account.accountId())))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/goal-buckets"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].accountId").value(account.accountId()))
            .andExpect(jsonPath("$[0].bucketName").value("Travel"));
    }

    @TestConfiguration
    static class TestClockConfiguration {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_INSTANT, APP_ZONE_ID);
        }
    }
}
