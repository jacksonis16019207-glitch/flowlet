package com.example.flowlet.application.service;

import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.appsetting.service.AppSettingService;
import com.example.flowlet.category.domain.model.Category;
import com.example.flowlet.category.domain.repository.CategoryRepository;
import com.example.flowlet.dashboard.exception.DashboardRequestException;
import com.example.flowlet.presentation.dashboard.dto.DashboardCategoryCashflowCategoryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardCategoryCashflowResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardCategoryCashflowTotalsResponse;
import com.example.flowlet.shared.time.MonthlyBoundaryService;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class DashboardCategoryCashflowService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AppSettingService appSettingService;
    private final MonthlyBoundaryService monthlyBoundaryService;

    public DashboardCategoryCashflowService(
        TransactionRepository transactionRepository,
        CategoryRepository categoryRepository,
        AppSettingService appSettingService,
        MonthlyBoundaryService monthlyBoundaryService
    ) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.appSettingService = appSettingService;
        this.monthlyBoundaryService = monthlyBoundaryService;
    }

    @Transactional(readOnly = true)
    public DashboardCategoryCashflowResponse getCategoryCashflow(
        String targetMonthValue
    ) {
        YearMonth targetMonth = parseMonth(targetMonthValue, "targetMonth");
        AppSetting appSetting = appSettingService.getCurrentSetting();
        MonthlyBoundaryService.MonthlyPeriod period = monthlyBoundaryService.resolve(appSetting, targetMonth);

        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
            .collect(Collectors.toMap(Category::categoryId, category -> category));

        Map<Long, BigDecimal> incomeTotals = aggregateCategoryTotals(
            period.periodStartDate(),
            period.periodEndDate(),
            transaction -> transaction.transactionType() == TransactionType.INCOME
        );
        Map<Long, BigDecimal> expenseTotals = aggregateCategoryTotals(
            period.periodStartDate(),
            period.periodEndDate(),
            transaction -> transaction.transactionType() == TransactionType.EXPENSE
        );

        List<DashboardCategoryCashflowCategoryResponse> incomeCategories =
            toCategoryResponses(incomeTotals, categoryMap);
        List<DashboardCategoryCashflowCategoryResponse> expenseCategories =
            toCategoryResponses(expenseTotals, categoryMap);

        return new DashboardCategoryCashflowResponse(
            targetMonth.toString(),
            period.periodStartDate().toString(),
            period.periodEndDate().toString(),
            incomeCategories,
            expenseCategories,
            new DashboardCategoryCashflowTotalsResponse(
                sumTotals(incomeTotals),
                sumTotals(expenseTotals)
            )
        );
    }

    private Map<Long, BigDecimal> aggregateCategoryTotals(
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        Predicate<Transaction> predicate
    ) {
        return transactionRepository.findAll().stream()
            .filter(predicate)
            .filter(transaction -> {
                LocalDate transactionDate = transaction.transactionDate();
                return !transactionDate.isBefore(periodStartDate) && !transactionDate.isAfter(periodEndDate);
            })
            .collect(Collectors.toMap(
                Transaction::categoryId,
                Transaction::amount,
                BigDecimal::add
            ));
    }

    private List<DashboardCategoryCashflowCategoryResponse> toCategoryResponses(
        Map<Long, BigDecimal> totals,
        Map<Long, Category> categoryMap
    ) {
        return totals.entrySet().stream()
            .filter(entry -> entry.getValue().compareTo(BigDecimal.ZERO) != 0)
            .sorted(Comparator
                .<Map.Entry<Long, BigDecimal>, BigDecimal>comparing(Map.Entry::getValue)
                .reversed()
                .thenComparing(entry -> {
                    Category category = categoryMap.get(entry.getKey());
                    return category == null ? Integer.MAX_VALUE : category.displayOrder();
                })
                .thenComparing(entry -> {
                    Category category = categoryMap.get(entry.getKey());
                    return category == null ? "" : category.categoryName();
                }))
            .map(entry -> {
                Category category = categoryMap.get(entry.getKey());
                String categoryName = category == null
                    ? "不明なカテゴリ"
                    : category.categoryName();
                return new DashboardCategoryCashflowCategoryResponse(
                    entry.getKey(),
                    categoryName,
                    entry.getValue()
                );
            })
            .toList();
    }

    private BigDecimal sumTotals(Map<Long, BigDecimal> totals) {
        return totals.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private YearMonth parseMonth(String monthValue, String fieldName) {
        try {
            return YearMonth.parse(monthValue);
        } catch (DateTimeParseException exception) {
            throw new DashboardRequestException(
                HttpStatus.BAD_REQUEST,
                "INVALID_MONTH_FORMAT",
                "error.dashboard.invalidMonthFormat",
                fieldName
            );
        }
    }
}
