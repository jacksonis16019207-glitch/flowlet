package com.example.flowlet.shared.time;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import com.example.flowlet.appsetting.domain.model.AppSetting;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class MonthlyBoundaryServiceTest {

    @Test
    void resolveCurrentReturnsCurrentMonthWhenTodayIsInsideCurrentPeriod() {
        MonthlyBoundaryService service = new MonthlyBoundaryService(
            new JapanHolidayService(),
            fixedClock("2026-04-15T00:00:00+09:00")
        );

        MonthlyBoundaryService.MonthlyPeriod period = service.resolveCurrent(appSetting(1, PaymentDateAdjustmentRule.NONE));

        assertThat(period.targetMonth().toString()).isEqualTo("2026-04");
        assertThat(period.periodStartDate().toString()).isEqualTo("2026-04-01");
        assertThat(period.periodEndDate().toString()).isEqualTo("2026-04-30");
    }

    @Test
    void resolveCurrentReturnsPreviousMonthWhenTodayBelongsToPreviousPeriod() {
        MonthlyBoundaryService service = new MonthlyBoundaryService(
            new JapanHolidayService(),
            fixedClock("2026-04-10T00:00:00+09:00")
        );

        MonthlyBoundaryService.MonthlyPeriod period = service.resolveCurrent(appSetting(26, PaymentDateAdjustmentRule.NONE));

        assertThat(period.targetMonth().toString()).isEqualTo("2026-03");
        assertThat(period.periodStartDate().toString()).isEqualTo("2026-03-26");
        assertThat(period.periodEndDate().toString()).isEqualTo("2026-04-25");
    }

    @Test
    void resolveCurrentReturnsNextMonthWhenAdjustedNextPeriodAlreadyContainsToday() {
        MonthlyBoundaryService service = new MonthlyBoundaryService(
            new JapanHolidayService(),
            fixedClock("2026-01-30T00:00:00+09:00")
        );

        MonthlyBoundaryService.MonthlyPeriod period = service.resolveCurrent(
            appSetting(1, PaymentDateAdjustmentRule.PREVIOUS_BUSINESS_DAY)
        );

        assertThat(period.targetMonth().toString()).isEqualTo("2026-02");
        assertThat(period.periodStartDate().toString()).isEqualTo("2026-01-30");
        assertThat(period.periodEndDate().toString()).isEqualTo("2026-02-26");
    }

    private Clock fixedClock(String dateTime) {
        return Clock.fixed(
            ZonedDateTime.parse(dateTime).toInstant(),
            ZoneId.of("Asia/Tokyo")
        );
    }

    private AppSetting appSetting(int monthStartDay, PaymentDateAdjustmentRule adjustmentRule) {
        LocalDateTime now = LocalDateTime.of(2026, 4, 11, 0, 0);
        return new AppSetting(1L, monthStartDay, adjustmentRule, now, now);
    }
}
