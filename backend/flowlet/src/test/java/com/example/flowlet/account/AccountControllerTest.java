package com.example.flowlet.account;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountType;
import com.example.flowlet.account.domain.repository.AccountRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @BeforeEach
    void setUp() {
        accountRepository.deleteAll();
    }

    @Test
    void postAccountsCreatesAnAccount() throws Exception {
        String request = """
            {"bankName":"MUFG","accountName":"Main Account","accountType":"CHECKING","active":true}
            """;

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.bankName").value("MUFG"))
            .andExpect(jsonPath("$.accountName").value("Main Account"))
            .andExpect(jsonPath("$.accountType").value("CHECKING"))
            .andExpect(jsonPath("$.active").value(true))
            .andExpect(jsonPath("$.createdAt").value("2026-03-31T10:23:45"));
    }

    @Test
    void postAccountsReturnsValidationErrors() throws Exception {
        String request = """
            {"bankName":"","accountName":"%s","active":true}
            """.formatted("a".repeat(101));

        mockMvc.perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.message").value("入力内容に誤りがあります。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"bankName\")].message").value("銀行名は必須です。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"accountName\")].message").value("口座名は100文字以内で入力してください。"))
            .andExpect(jsonPath("$.fieldErrors[?(@.field == \"accountType\")].message").value("口座種別は必須です。"));
    }

    @Test
    void postAccountsReturnsConflictWhenAccountAlreadyExists() throws Exception {
        accountRepository.save(new Account(
            null,
            "MUFG",
            "Main Account",
            AccountType.CHECKING,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        String request = """
            {"bankName":"MUFG","accountName":"Main Account","accountType":"CHECKING","active":true}
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
            AccountType.SAVINGS,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/accounts"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].bankName").value("SBI"))
            .andExpect(jsonPath("$[0].accountName").value("Hyper Savings"))
            .andExpect(jsonPath("$[0].accountType").value("SAVINGS"));
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
