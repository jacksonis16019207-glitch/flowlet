package com.example.flowlet.presentation.transfer.dto;

import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateTransferRequest {

    @NotNull(message = "{validation.transfer.fromAccountId.notNull}")
    private Long fromAccountId;

    @NotNull(message = "{validation.transfer.toAccountId.notNull}")
    private Long toAccountId;

    private Long fromGoalBucketId;

    @NotNull(message = "{validation.transfer.categoryId.notNull}")
    private Long categoryId;

    private Long subcategoryId;

    @NotNull(message = "{validation.transfer.transactionDate.notNull}")
    private LocalDate transactionDate;

    private CashflowTreatment outgoingCashflowTreatment;

    private CashflowTreatment incomingCashflowTreatment;

    @NotNull(message = "{validation.transfer.amount.notNull}")
    @DecimalMin(value = "0.01", message = "{validation.transaction.amount.positive}")
    private BigDecimal amount;

    @NotBlank(message = "{validation.transaction.description.notBlank}")
    @Size(max = 100, message = "{validation.transaction.description.size}")
    private String description;

    @Size(max = 500, message = "{validation.transaction.note.size}")
    private String note;

    public Long getFromAccountId() { return fromAccountId; }
    public void setFromAccountId(Long fromAccountId) { this.fromAccountId = fromAccountId; }
    public Long getToAccountId() { return toAccountId; }
    public void setToAccountId(Long toAccountId) { this.toAccountId = toAccountId; }
    public Long getFromGoalBucketId() { return fromGoalBucketId; }
    public void setFromGoalBucketId(Long fromGoalBucketId) { this.fromGoalBucketId = fromGoalBucketId; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Long getSubcategoryId() { return subcategoryId; }
    public void setSubcategoryId(Long subcategoryId) { this.subcategoryId = subcategoryId; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    public CashflowTreatment getOutgoingCashflowTreatment() { return outgoingCashflowTreatment; }
    public void setOutgoingCashflowTreatment(CashflowTreatment outgoingCashflowTreatment) { this.outgoingCashflowTreatment = outgoingCashflowTreatment; }
    public CashflowTreatment getIncomingCashflowTreatment() { return incomingCashflowTreatment; }
    public void setIncomingCashflowTreatment(CashflowTreatment incomingCashflowTreatment) { this.incomingCashflowTreatment = incomingCashflowTreatment; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
