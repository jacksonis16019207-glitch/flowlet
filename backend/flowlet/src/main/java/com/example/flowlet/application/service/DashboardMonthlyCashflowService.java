package com.example.flowlet.application.service;

import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.appsetting.service.AppSettingService;
import com.example.flowlet.dashboard.exception.DashboardRequestException;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowResponse;
import com.example.flowlet.shared.time.MonthlyBoundaryService;
import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;

@Service
public class DashboardMonthlyCashflowService {

    private final TransactionRepository transactionRepository;
    private final AppSettingService appSettingService;
    private final MonthlyBoundaryService monthlyBoundaryService;

    public DashboardMonthlyCashflowService(
        TransactionRepository transactionRepository,
        AppSettingService appSettingService,
        MonthlyBoundaryService monthlyBoundaryService
    ) {
        this.transactionRepository = transactionRepository;
        this.appSettingService = appSettingService;
        this.monthlyBoundaryService = monthlyBoundaryService;
    }

    @Transactional(readOnly = true)
    public DashboardMonthlyCashflowResponse getMonthlyCashflow(String targetMonthValue) {
        AppSetting appSetting = appSettingService.getCurrentSetting();
        MonthlyBoundaryService.MonthlyPeriod period = resolvePeriod(appSetting, targetMonthValue);
        YearMonth targetMonth = period.targetMonth();

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        for (Transaction transaction : transactionRepository.findAll()) {
            LocalDate transactionDate = transaction.transactionDate();
            if (transactionDate.isBefore(period.periodStartDate())
                || transactionDate.isAfter(period.periodEndDate())) {
                continue;
            }

            if (transaction.resolvedCashflowTreatment() == CashflowTreatment.INCOME) {
                totalIncome = totalIncome.add(transaction.amount());
            } else if (transaction.resolvedCashflowTreatment() == CashflowTreatment.EXPENSE) {
                totalExpense = totalExpense.add(transaction.amount());
            }
        }

        return new DashboardMonthlyCashflowResponse(
            targetMonth.toString(),
            period.periodStartDate().toString(),
            period.periodEndDate().toString(),
            totalIncome,
            totalExpense,
            totalIncome.subtract(totalExpense)
        );
    }

    private MonthlyBoundaryService.MonthlyPeriod resolvePeriod(
        AppSetting appSetting,
        String targetMonthValue
    ) {
        if (targetMonthValue == null || targetMonthValue.isBlank()) {
            return monthlyBoundaryService.resolveCurrent(appSetting);
        }

        return monthlyBoundaryService.resolve(appSetting, parseMonth(targetMonthValue, "targetMonth"));
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
