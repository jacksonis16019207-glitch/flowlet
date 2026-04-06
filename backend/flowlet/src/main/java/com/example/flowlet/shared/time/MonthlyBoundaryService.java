package com.example.flowlet.shared.time;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import com.example.flowlet.appsetting.domain.model.AppSetting;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;

@Component
public class MonthlyBoundaryService {

    private final JapanHolidayService japanHolidayService;
    private final Clock clock;

    public MonthlyBoundaryService(JapanHolidayService japanHolidayService, Clock clock) {
        this.japanHolidayService = japanHolidayService;
        this.clock = clock;
    }

    public MonthlyPeriod resolve(AppSetting appSetting, YearMonth targetMonth) {
        LocalDate periodStartDate = adjust(
            targetMonth.atDay(Math.min(appSetting.monthStartDay(), targetMonth.lengthOfMonth())),
            appSetting.monthStartAdjustmentRule()
        );
        YearMonth nextMonth = targetMonth.plusMonths(1);
        LocalDate nextPeriodStartDate = adjust(
            nextMonth.atDay(Math.min(appSetting.monthStartDay(), nextMonth.lengthOfMonth())),
            appSetting.monthStartAdjustmentRule()
        );
        return new MonthlyPeriod(targetMonth, periodStartDate, nextPeriodStartDate.minusDays(1));
    }

    public MonthlyPeriod resolveCurrent(AppSetting appSetting) {
        return resolveContaining(appSetting, LocalDate.now(clock));
    }

    public MonthlyPeriod resolveContaining(AppSetting appSetting, LocalDate date) {
        YearMonth baseMonth = YearMonth.from(date);
        MonthlyPeriod currentPeriod = resolve(appSetting, baseMonth);
        if (contains(currentPeriod, date)) {
            return currentPeriod;
        }

        MonthlyPeriod previousPeriod = resolve(appSetting, baseMonth.minusMonths(1));
        if (contains(previousPeriod, date)) {
            return previousPeriod;
        }

        MonthlyPeriod nextPeriod = resolve(appSetting, baseMonth.plusMonths(1));
        if (contains(nextPeriod, date)) {
            return nextPeriod;
        }

        return currentPeriod;
    }

    private boolean contains(MonthlyPeriod period, LocalDate date) {
        return !date.isBefore(period.periodStartDate()) && !date.isAfter(period.periodEndDate());
    }

    private LocalDate adjust(LocalDate date, PaymentDateAdjustmentRule rule) {
        if (rule == PaymentDateAdjustmentRule.NONE) {
            return date;
        }

        LocalDate adjusted = date;
        while (!japanHolidayService.isBusinessDay(adjusted)) {
            adjusted = rule == PaymentDateAdjustmentRule.NEXT_BUSINESS_DAY
                ? adjusted.plusDays(1)
                : adjusted.minusDays(1);
        }
        return adjusted;
    }

    public record MonthlyPeriod(
        YearMonth targetMonth,
        LocalDate periodStartDate,
        LocalDate periodEndDate
    ) {
    }
}
