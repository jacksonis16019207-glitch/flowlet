package com.example.flowlet.account

import com.example.flowlet.account.domain.model.Account
import com.example.flowlet.account.domain.model.AccountType
import com.example.flowlet.account.domain.repository.AccountRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc

import java.time.LocalDateTime

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles('test')
class AccountControllerTest {

    @Autowired
    MockMvc mockMvc

    @Autowired
    AccountRepository accountRepository

    @BeforeEach
    void setUp() {
        accountRepository.deleteAll()
    }

    @Test
    void postAccountsCreatesAnAccount() {
        def request = '{"bankName":"MUFG","accountName":"Main Account","accountType":"CHECKING","active":true}'

        mockMvc.perform(post('/api/accounts')
            .contentType(MediaType.APPLICATION_JSON)
            .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath('$.bankName').value('MUFG'))
            .andExpect(jsonPath('$.accountName').value('Main Account'))
            .andExpect(jsonPath('$.accountType').value('CHECKING'))
            .andExpect(jsonPath('$.active').value(true))
    }

    @Test
    void getAccountsReturnsCreatedAccounts() {
        accountRepository.save(new Account(
            null,
            'SBI',
            'Hyper Savings',
            AccountType.SAVINGS,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ))

        mockMvc.perform(get('/api/accounts'))
            .andExpect(status().isOk())
            .andExpect(jsonPath('$[0].bankName').value('SBI'))
            .andExpect(jsonPath('$[0].accountName').value('Hyper Savings'))
            .andExpect(jsonPath('$[0].accountType').value('SAVINGS'))
    }
}
