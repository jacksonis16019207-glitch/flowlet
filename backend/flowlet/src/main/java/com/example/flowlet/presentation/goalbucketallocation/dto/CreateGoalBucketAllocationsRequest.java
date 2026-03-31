package com.example.flowlet.presentation.goalbucketallocation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class CreateGoalBucketAllocationsRequest {

    @NotNull(message = "{validation.allocation.accountId.notNull}")
    private Long accountId;

    private Long fromGoalBucketId;

    @NotNull(message = "{validation.allocation.allocationDate.notNull}")
    private LocalDate allocationDate;

    @NotBlank(message = "{validation.allocation.description.notBlank}")
    @Size(max = 100, message = "{validation.transaction.description.size}")
    private String description;

    @Size(max = 500, message = "{validation.transaction.note.size}")
    private String note;

    private UUID linkedTransferGroupId;

    @Valid
    @NotEmpty(message = "{validation.allocation.allocations.notEmpty}")
    private List<AllocationItemRequest> allocations;

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public Long getFromGoalBucketId() { return fromGoalBucketId; }
    public void setFromGoalBucketId(Long fromGoalBucketId) { this.fromGoalBucketId = fromGoalBucketId; }
    public LocalDate getAllocationDate() { return allocationDate; }
    public void setAllocationDate(LocalDate allocationDate) { this.allocationDate = allocationDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public UUID getLinkedTransferGroupId() { return linkedTransferGroupId; }
    public void setLinkedTransferGroupId(UUID linkedTransferGroupId) { this.linkedTransferGroupId = linkedTransferGroupId; }
    public List<AllocationItemRequest> getAllocations() { return allocations; }
    public void setAllocations(List<AllocationItemRequest> allocations) { this.allocations = allocations; }

    public static class AllocationItemRequest {

        @NotNull(message = "{validation.allocation.toGoalBucketId.notNull}")
        private Long toGoalBucketId;

        @NotNull(message = "{validation.transaction.amount.notNull}")
        @DecimalMin(value = "0.01", message = "{validation.transaction.amount.positive}")
        private BigDecimal amount;

        public Long getToGoalBucketId() { return toGoalBucketId; }
        public void setToGoalBucketId(Long toGoalBucketId) { this.toGoalBucketId = toGoalBucketId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
