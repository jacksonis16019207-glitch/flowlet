package com.example.flowlet.application.service;

import com.example.flowlet.dashboard.exception.DashboardRequestException;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowMonthResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowTotalsResponse;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.temporal.ChronoUnit;

@Service
public class DashboardMonthlyCashflowService {

    private static final int MAX_MONTH_RANGE = 12;

    private final TransactionRepository transactionRepository;

    public DashboardMonthlyCashflowService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMonthlyCashflowResponse getMonthlyCashflow(String fromMonthValue, String toMonthValue) {
        YearMonth fromMonth = parseMonth(fromMonthValue, "fromMonth");
        YearMonth toMonth = parseMonth(toMonthValue, "toMonth");

        if (fromMonth.isAfter(toMonth)) {
            throw new DashboardRequestException(
                HttpStatus.BAD_REQUEST,
                "INVALID_MONTH_RANGE",
                "error.dashboard.invalidMonthRange"
            );
        }

        long monthCount = ChronoUnit.MONTHS.between(fromMonth, toMonth) + 1;
        if (monthCount > MAX_MONTH_RANGE) {
            throw new DashboardRequestException(
                HttpStatus.BAD_REQUEST,
                "MONTH_RANGE_TOO_LARGE",
                "error.dashboard.monthRangeTooLarge",
                MAX_MONTH_RANGE
            );
        }

        Map<YearMonth, CashflowAccumulator> cashflowByMonth = createMonthRange(fromMonth, toMonth);
        for (Transaction transaction : transactionRepository.findAll()) {
            YearMonth transactionMonth = YearMonth.from(transaction.transactionDate());
            if (transactionMonth.isBefore(fromMonth) || transactionMonth.isAfter(toMonth)) {
                continue;
            }

            CashflowAccumulator accumulator = cashflowByMonth.get(transactionMonth);
            if (accumulator == null) {
                continue;
            }

            if (transaction.transactionType() == TransactionType.INCOME) {
                accumulator.addIncome(transaction.amount());
            } else if (transaction.transactionType() == TransactionType.EXPENSE) {
                accumulator.addExpense(transaction.amount());
            }
        }

        List<DashboardMonthlyCashflowMonthResponse> months = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Map.Entry<YearMonth, CashflowAccumulator> entry : cashflowByMonth.entrySet()) {
            CashflowAccumulator accumulator = entry.getValue();
            BigDecimal monthIncome = accumulator.income();
            BigDecimal monthExpense = accumulator.expense();
            BigDecimal monthNet = monthIncome.subtract(monthExpense);

            totalIncome = totalIncome.add(monthIncome);
            totalExpense = totalExpense.add(monthExpense);
            months.add(new DashboardMonthlyCashflowMonthResponse(
                entry.getKey().toString(),
                monthIncome,
                monthExpense,
                monthNet
            ));
        }

        return new DashboardMonthlyCashflowResponse(
            fromMonth.toString(),
            toMonth.toString(),
            months,
            new DashboardMonthlyCashflowTotalsResponse(
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense)
            )
        );
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

    private Map<YearMonth, CashflowAccumulator> createMonthRange(YearMonth fromMonth, YearMonth toMonth) {
        Map<YearMonth, CashflowAccumulator> cashflowByMonth = new LinkedHashMap<>();
        YearMonth currentMonth = fromMonth;
        while (!currentMonth.isAfter(toMonth)) {
            cashflowByMonth.put(currentMonth, new CashflowAccumulator());
            currentMonth = currentMonth.plusMonths(1);
        }
        return cashflowByMonth;
    }

    private static final class CashflowAccumulator {
        private BigDecimal income = BigDecimal.ZERO;
        private BigDecimal expense = BigDecimal.ZERO;

        void addIncome(BigDecimal amount) {
            income = income.add(amount);
        }

        void addExpense(BigDecimal amount) {
            expense = expense.add(amount);
        }

        BigDecimal income() {
            return income;
        }

        BigDecimal expense() {
            return expense;
        }
    }
}
