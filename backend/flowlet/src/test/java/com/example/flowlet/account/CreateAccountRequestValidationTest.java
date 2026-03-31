package com.example.flowlet.account;

import com.example.flowlet.presentation.account.dto.CreateAccountRequest;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class CreateAccountRequestValidationTest {

    @Autowired
    private Validator validator;

    @Test
    void resolvesValidationMessagesFromMessagesProperties() {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setBankName("");
        request.setAccountName("a".repeat(101));

        Set<String> messages = validator.validate(request).stream()
            .map(violation -> violation.getMessage())
            .collect(java.util.stream.Collectors.toSet());

        assertThat(messages).contains(
            "銀行名は必須です。",
            "口座名は100文字以内で入力してください。",
            "口座種別は必須です。"
        );
    }
}
