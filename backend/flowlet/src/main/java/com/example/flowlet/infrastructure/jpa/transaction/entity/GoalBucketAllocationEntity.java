package com.example.flowlet.infrastructure.jpa.transaction.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "t_goal_bucket_allocation", schema = "flowlet")
public class GoalBucketAllocationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "allocation_id")
    private Long allocationId;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "from_goal_bucket_id")
    private Long fromGoalBucketId;

    @Column(name = "to_goal_bucket_id")
    private Long toGoalBucketId;

    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", nullable = false, length = 100)
    private String description;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "linked_transfer_group_id")
    private UUID linkedTransferGroupId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getAllocationId() { return allocationId; }
    public void setAllocationId(Long allocationId) { this.allocationId = allocationId; }
    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public Long getFromGoalBucketId() { return fromGoalBucketId; }
    public void setFromGoalBucketId(Long fromGoalBucketId) { this.fromGoalBucketId = fromGoalBucketId; }
    public Long getToGoalBucketId() { return toGoalBucketId; }
    public void setToGoalBucketId(Long toGoalBucketId) { this.toGoalBucketId = toGoalBucketId; }
    public LocalDate getAllocationDate() { return allocationDate; }
    public void setAllocationDate(LocalDate allocationDate) { this.allocationDate = allocationDate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public UUID getLinkedTransferGroupId() { return linkedTransferGroupId; }
    public void setLinkedTransferGroupId(UUID linkedTransferGroupId) { this.linkedTransferGroupId = linkedTransferGroupId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
