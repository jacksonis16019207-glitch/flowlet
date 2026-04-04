package com.example.flowlet.goalbucket;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import java.math.BigDecimal;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Autowired
    private GoalBucketAllocationRepository goalBucketAllocationRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @BeforeEach
    void setUp() {
        goalBucketAllocationRepository.deleteAll();
        transactionRepository.deleteAll();
        goalBucketRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void postGoalBucketsCreatesAGoalBucket() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "MUFG",
            "Main Account",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
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
    void getGoalBucketsReturnsCreatedGoalBuckets() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Hyper Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
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

    @Test
    void putGoalBucketsUpdatesAGoalBucket() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Long goalBucketId = goalBucketRepository.save(new com.example.flowlet.goalbucket.domain.model.GoalBucket(
            null,
            account.accountId(),
            "Travel",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        )).goalBucketId();

        mockMvc.perform(put("/api/goal-buckets/{goalBucketId}", goalBucketId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"bucketName":"Trip","active":false}
                    """.formatted(account.accountId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bucketName").value("Trip"))
            .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void deleteGoalBucketsDeactivatesReferencedGoalBucket() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        com.example.flowlet.goalbucket.domain.model.GoalBucket goalBucket = goalBucketRepository.save(
            new com.example.flowlet.goalbucket.domain.model.GoalBucket(
                null,
                account.accountId(),
                "Travel",
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
            )
        );
        goalBucketAllocationRepository.saveAll(java.util.List.of(new GoalBucketAllocation(
            null,
            account.accountId(),
            null,
            goalBucket.goalBucketId(),
            java.time.LocalDate.parse("2026-04-01"),
            java.math.BigDecimal.valueOf(1000),
            "Seed",
            null,
            null,
            LocalDateTime.now(),
            LocalDateTime.now()
        )));

        mockMvc.perform(delete("/api/goal-buckets/{goalBucketId}", goalBucket.goalBucketId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DEACTIVATED"))
            .andExpect(jsonPath("$.active").value(false));

        org.assertj.core.api.Assertions.assertThat(goalBucketRepository.findById(goalBucket.goalBucketId()))
            .get()
            .extracting(com.example.flowlet.goalbucket.domain.model.GoalBucket::active)
            .isEqualTo(false);
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
