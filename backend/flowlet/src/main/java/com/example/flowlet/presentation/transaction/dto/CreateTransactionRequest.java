package com.example.flowlet.presentation.transaction.dto;

import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateTransactionRequest {

    @NotNull(message = "{validation.transaction.accountId.notNull}")
    private Long accountId;

    private Long goalBucketId;

    @NotNull(message = "{validation.transaction.categoryId.notNull}")
    private Long categoryId;

    private Long subcategoryId;

    @NotNull(message = "{validation.transaction.transactionType.notNull}")
    private TransactionType transactionType;

    @NotNull(message = "{validation.transaction.transactionDate.notNull}")
    private LocalDate transactionDate;

    private CashflowTreatment cashflowTreatment;

    @NotNull(message = "{validation.transaction.amount.notNull}")
    @DecimalMin(value = "0.01", message = "{validation.transaction.amount.positive}")
    private BigDecimal amount;

    @NotBlank(message = "{validation.transaction.description.notBlank}")
    @Size(max = 100, message = "{validation.transaction.description.size}")
    private String description;

    @Size(max = 500, message = "{validation.transaction.note.size}")
    private String note;

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public Long getGoalBucketId() { return goalBucketId; }
    public void setGoalBucketId(Long goalBucketId) { this.goalBucketId = goalBucketId; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Long getSubcategoryId() { return subcategoryId; }
    public void setSubcategoryId(Long subcategoryId) { this.subcategoryId = subcategoryId; }
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    public CashflowTreatment getCashflowTreatment() { return cashflowTreatment; }
    public void setCashflowTreatment(CashflowTreatment cashflowTreatment) { this.cashflowTreatment = cashflowTreatment; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
