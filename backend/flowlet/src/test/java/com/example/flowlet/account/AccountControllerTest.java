package com.example.flowlet.account;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AccountControllerTest {

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
    void postAccountsCreatesAnAccount() throws Exception {
        String request = """
            {"providerName":"MUFG","accountName":"Main Account","accountCategory":"BANK","balanceSide":"ASSET","active":true,"displayOrder":10}
            """;

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.providerName").value("MUFG"))
            .andExpect(jsonPath("$.accountName").value("Main Account"))
            .andExpect(jsonPath("$.accountCategory").value("BANK"))
            .andExpect(jsonPath("$.balanceSide").value("ASSET"))
            .andExpect(jsonPath("$.displayOrder").value(10))
            .andExpect(jsonPath("$.createdAt").value("2026-03-31T10:23:45"));
    }

    @Test
    void postAccountsReturnsValidationErrors() throws Exception {
        String request = """
            {"providerName":"","accountName":"%s","active":true}
            """.formatted("a".repeat(101));

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.message").value("入力内容に誤りがあります。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"providerName\")].message").value("提供元名は必須です。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"accountName\")].message").value("口座名は100文字以内で入力してください。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"accountCategory\")].message").value("口座区分は必須です。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"balanceSide\")].message").value("残高区分は必須です。"));
    }

    @Test
    void postAccountsReturnsConflictWhenAccountAlreadyExists() throws Exception {
        accountRepository.save(new Account(
            null,
            "MUFG",
            "Main Account",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        String request = """
            {"providerName":"MUFG","accountName":"Main Account","accountCategory":"BANK","balanceSide":"ASSET","active":true,"displayOrder":10}
            """;

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("ACCOUNT_ALREADY_EXISTS"))
            .andExpect(jsonPath("$.message").value("MUFG / Main Account の口座はすでに登録されています。"))
            .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    @Test
    void getAccountsReturnsCreatedAccounts() throws Exception {
        accountRepository.save(new Account(
            null,
            "SBI",
            "Hyper Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].providerName").value("SBI"))
            .andExpect(jsonPath("$[0].accountName").value("Hyper Savings"))
            .andExpect(jsonPath("$[0].accountCategory").value("BANK"));
    }

    @Test
    void putAccountsUpdatesAnAccount() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(put("/api/accounts/{accountId}", account.accountId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"providerName":"住信SBI","accountName":"Main Updated","accountCategory":"BANK","balanceSide":"ASSET","active":true,"displayOrder":30}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.providerName").value("住信SBI"))
            .andExpect(jsonPath("$.accountName").value("Main Updated"))
            .andExpect(jsonPath("$.displayOrder").value(30));
    }

    @Test
    void deleteAccountsDeactivatesReferencedAccount() throws Exception {
        Account account = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        goalBucketRepository.save(new GoalBucket(
            null,
            account.accountId(),
            "Emergency",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(delete("/api/accounts/{accountId}", account.accountId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DEACTIVATED"))
            .andExpect(jsonPath("$.active").value(false));

        org.assertj.core.api.Assertions.assertThat(accountRepository.findById(account.accountId()))
            .get()
            .extracting(Account::active)
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
