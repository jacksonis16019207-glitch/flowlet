package com.example.flowlet.transaction;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.goalbucket.domain.model.GoalBucket;
import com.example.flowlet.goalbucket.domain.repository.GoalBucketRepository;
import com.example.flowlet.infrastructure.jpa.category.entity.CategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.entity.SubcategoryEntity;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataCategoryRepository;
import com.example.flowlet.infrastructure.jpa.category.repository.SpringDataSubcategoryRepository;
import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;
import com.example.flowlet.transaction.domain.repository.GoalBucketAllocationRepository;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private GoalBucketRepository goalBucketRepository;

    @Autowired
    private SpringDataCategoryRepository categoryRepository;

    @Autowired
    private SpringDataSubcategoryRepository subcategoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GoalBucketAllocationRepository goalBucketAllocationRepository;

    @BeforeEach
    void setUp() {
        goalBucketAllocationRepository.deleteAll();
        transactionRepository.deleteAll();
        goalBucketRepository.deleteAll();
        subcategoryRepository.deleteAll();
        categoryRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void createsTransactionTransferAndAllocation() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        GoalBucket travel = goalBucketRepository.save(new GoalBucket(
            null,
            savings.accountId(),
            "Travel",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        CategoryEntity expense = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transfer = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity dine = saveSubcategory(expense.getCategoryId(), "外食");
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "口座間移動");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"goalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionType":"EXPENSE","cashflowTreatment":"IGNORE","transactionDate":"2026-04-01","amount":2800,"description":"ホテル朝食","note":"出張"}
                    """.formatted(main.accountId(), expense.getCategoryId(), dine.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.transactionType").value("EXPENSE"))
            .andExpect(jsonPath("$.cashflowTreatment").value("IGNORE"))
            .andExpect(jsonPath("$.categoryName").value("食費"));

        String transferResponse = mockMvc.perform(post("/api/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fromAccountId":%d,"toAccountId":%d,"fromGoalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionDate":"2026-04-02","outgoingCashflowTreatment":"IGNORE","incomingCashflowTreatment":"INCOME","amount":50000,"description":"旅行用口座へ振替","note":"4月積立"}
                    """.formatted(main.accountId(), savings.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.outgoingTransaction.transactionType").value("TRANSFER_OUT"))
            .andExpect(jsonPath("$.outgoingTransaction.cashflowTreatment").value("IGNORE"))
            .andExpect(jsonPath("$.incomingTransaction.transactionType").value("TRANSFER_IN"))
            .andExpect(jsonPath("$.incomingTransaction.cashflowTreatment").value("INCOME"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String transferGroupId = com.jayway.jsonpath.JsonPath.read(transferResponse, "$.transferGroupId");

        mockMvc.perform(post("/api/goal-bucket-allocations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-02","description":"4月積立","note":"旅行","linkedTransferGroupId":"%s","allocations":[{"toGoalBucketId":%d,"amount":30000}]}
                    """.formatted(savings.accountId(), transferGroupId, travel.goalBucketId())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.allocations[0].toGoalBucketName").value("Travel"));
    }

    @Test
    void updatesTransactionAndAllocationAndDeletesTransferGroup() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        GoalBucket travel = goalBucketRepository.save(new GoalBucket(
            null,
            savings.accountId(),
            "Travel",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        CategoryEntity expense = saveCategory("食費", com.example.flowlet.category.domain.model.CategoryType.EXPENSE);
        CategoryEntity transfer = saveCategory("振替", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity meal = saveSubcategory(expense.getCategoryId(), "昼食");
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "口座移動");

        String transactionResponse = mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"goalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionType":"EXPENSE","cashflowTreatment":"AUTO","transactionDate":"2026-04-01","amount":2800,"description":"朝食","note":"初回"}
                    """.formatted(main.accountId(), expense.getCategoryId(), meal.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        Integer transactionId = com.jayway.jsonpath.JsonPath.read(transactionResponse, "$.transactionId");

        mockMvc.perform(put("/api/transactions/{transactionId}", transactionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"goalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionType":"EXPENSE","cashflowTreatment":"INCOME","transactionDate":"2026-04-03","amount":3200,"description":"昼食","note":"更新"}
                    """.formatted(main.accountId(), expense.getCategoryId(), meal.getSubcategoryId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("昼食"))
            .andExpect(jsonPath("$.amount").value(3200))
            .andExpect(jsonPath("$.cashflowTreatment").value("INCOME"));

        String transferResponse = mockMvc.perform(post("/api/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fromAccountId":%d,"toAccountId":%d,"fromGoalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionDate":"2026-04-02","outgoingCashflowTreatment":"EXPENSE","incomingCashflowTreatment":"IGNORE","amount":50000,"description":"振替テスト","note":"4月"}
                    """.formatted(main.accountId(), savings.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        String transferGroupId = com.jayway.jsonpath.JsonPath.read(transferResponse, "$.transferGroupId");
        Integer outgoingTransactionId = com.jayway.jsonpath.JsonPath.read(transferResponse, "$.outgoingTransaction.transactionId");

        String allocationResponse = mockMvc.perform(post("/api/goal-bucket-allocations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-02","description":"配分","note":"メモ","linkedTransferGroupId":"%s","allocations":[{"toGoalBucketId":%d,"amount":30000}]}
                    """.formatted(savings.accountId(), transferGroupId, travel.goalBucketId())))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        Integer allocationId = com.jayway.jsonpath.JsonPath.read(allocationResponse, "$.allocations[0].allocationId");

        mockMvc.perform(put("/api/goal-bucket-allocations/{allocationId}", allocationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-05","description":"配分更新","note":"更新","linkedTransferGroupId":"%s","allocations":[{"toGoalBucketId":%d,"amount":35000}]}
                    """.formatted(savings.accountId(), transferGroupId, travel.goalBucketId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("配分更新"))
            .andExpect(jsonPath("$.amount").value(35000));

        mockMvc.perform(delete("/api/transactions/{transactionId}", outgoingTransactionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.action").value("DELETED_TRANSFER_GROUP"))
            .andExpect(jsonPath("$.deletedTransactionIds.length()").value(2))
            .andExpect(jsonPath("$.deletedAllocationIds.length()").value(1));
    }

    @Test
    void rejectsTransactionWithTransferType() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        CategoryEntity transfer = saveCategory("Transfer", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "Account move");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"goalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionType":"TRANSFER_OUT","transactionDate":"2026-04-01","amount":1000,"description":"invalid type","note":"should fail"}
                    """.formatted(main.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("TRANSACTION_TYPE_NOT_ALLOWED"));
    }

    @Test
    void rejectsTransferWithinSameAccount() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        CategoryEntity transfer = saveCategory("Transfer", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "Account move");

        mockMvc.perform(post("/api/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fromAccountId":%d,"toAccountId":%d,"fromGoalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionDate":"2026-04-02","amount":5000,"description":"same account","note":"should fail"}
                    """.formatted(main.accountId(), main.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("SAME_ACCOUNT_TRANSFER"));
    }

    @Test
    void rejectsAllocationWithDuplicateDestinations() throws Exception {
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        GoalBucket travel = goalBucketRepository.save(new GoalBucket(
            null,
            savings.accountId(),
            "Travel",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        mockMvc.perform(post("/api/goal-bucket-allocations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-02","description":"duplicate destinations","note":"should fail","linkedTransferGroupId":null,"allocations":[{"toGoalBucketId":%d,"amount":1000},{"toGoalBucketId":%d,"amount":2000}]}
                    """.formatted(savings.accountId(), travel.goalBucketId(), travel.goalBucketId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("DUPLICATE_ALLOCATION_DESTINATION"));
    }

    @Test
    void rejectsAllocationWhenLinkedTransferDoesNotBelongToAccount() throws Exception {
        Account main = accountRepository.save(new Account(
            null,
            "SBI",
            "Main",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            10,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Account savings = accountRepository.save(new Account(
            null,
            "SBI",
            "Savings",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            20,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        Account reserve = accountRepository.save(new Account(
            null,
            "SBI",
            "Reserve",
            AccountCategory.BANK,
            BalanceSide.ASSET,
            BigDecimal.ZERO,
            true,
            30,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));
        GoalBucket reserveBucket = goalBucketRepository.save(new GoalBucket(
            null,
            reserve.accountId(),
            "Reserve bucket",
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        ));

        CategoryEntity transfer = saveCategory("Transfer", com.example.flowlet.category.domain.model.CategoryType.TRANSFER);
        SubcategoryEntity transferDetail = saveSubcategory(transfer.getCategoryId(), "Account move");

        String transferResponse = mockMvc.perform(post("/api/transfers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fromAccountId":%d,"toAccountId":%d,"fromGoalBucketId":null,"categoryId":%d,"subcategoryId":%d,"transactionDate":"2026-04-02","amount":50000,"description":"monthly move","note":"linked transfer"}
                    """.formatted(main.accountId(), savings.accountId(), transfer.getCategoryId(), transferDetail.getSubcategoryId())))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        String transferGroupId = com.jayway.jsonpath.JsonPath.read(transferResponse, "$.transferGroupId");

        mockMvc.perform(post("/api/goal-bucket-allocations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"accountId":%d,"fromGoalBucketId":null,"allocationDate":"2026-04-02","description":"wrong account link","note":"should fail","linkedTransferGroupId":"%s","allocations":[{"toGoalBucketId":%d,"amount":30000}]}
                    """.formatted(reserve.accountId(), transferGroupId, reserveBucket.goalBucketId())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("LINKED_TRANSFER_NOT_FOUND"));
    }

    private CategoryEntity saveCategory(String name, com.example.flowlet.category.domain.model.CategoryType type) {
        CategoryEntity category = new CategoryEntity();
        category.setCategoryName(name);
        category.setCategoryType(type);
        category.setDisplayOrder(10);
        category.setActive(true);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    private SubcategoryEntity saveSubcategory(Long categoryId, String name) {
        SubcategoryEntity subcategory = new SubcategoryEntity();
        subcategory.setCategoryId(categoryId);
        subcategory.setSubcategoryName(name);
        subcategory.setDisplayOrder(10);
        subcategory.setActive(true);
        subcategory.setCreatedAt(LocalDateTime.now());
        subcategory.setUpdatedAt(LocalDateTime.now());
        return subcategoryRepository.save(subcategory);
    }
}
