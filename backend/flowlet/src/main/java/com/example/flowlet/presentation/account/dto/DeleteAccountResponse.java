package com.example.flowlet.presentation.account.dto;

public record DeleteAccountResponse(
    Long accountId,
    String action,
    boolean active
) {
}
