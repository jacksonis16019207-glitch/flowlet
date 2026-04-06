package com.example.flowlet.shared.time;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.Set;

@Component
public class JapanHolidayService {

    public boolean isHoliday(LocalDate date) {
        return getHolidays(date.getYear()).contains(date);
    }

    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return dayOfWeek != DayOfWeek.SATURDAY
            && dayOfWeek != DayOfWeek.SUNDAY
            && !isHoliday(date);
    }

    private Set<LocalDate> getHolidays(int year) {
        Set<LocalDate> holidays = new HashSet<>();

        holidays.add(LocalDate.of(year, Month.JANUARY, 1));
        holidays.add(nthMonday(year, Month.JANUARY, 2));
        holidays.add(LocalDate.of(year, Month.FEBRUARY, 11));
        if (year >= 2020) {
            holidays.add(LocalDate.of(year, Month.FEBRUARY, 23));
        }
        holidays.add(vernalEquinoxDay(year));
        holidays.add(LocalDate.of(year, Month.APRIL, 29));
        holidays.add(LocalDate.of(year, Month.MAY, 3));
        holidays.add(LocalDate.of(year, Month.MAY, 4));
        holidays.add(LocalDate.of(year, Month.MAY, 5));
        holidays.add(nthMonday(year, Month.JULY, 3));
        if (year >= 2016) {
            holidays.add(LocalDate.of(year, Month.AUGUST, 11));
        }
        holidays.add(nthMonday(year, Month.SEPTEMBER, 3));
        holidays.add(autumnalEquinoxDay(year));
        holidays.add(nthMonday(year, Month.OCTOBER, 2));
        holidays.add(LocalDate.of(year, Month.NOVEMBER, 3));
        holidays.add(LocalDate.of(year, Month.NOVEMBER, 23));

        applyCitizensHoliday(year, holidays);
        applySubstituteHolidays(year, holidays);

        return holidays;
    }

    private void applyCitizensHoliday(int year, Set<LocalDate> holidays) {
        LocalDate date = LocalDate.of(year, Month.JANUARY, 2);
        LocalDate lastDate = LocalDate.of(year, Month.DECEMBER, 30);
        while (!date.isAfter(lastDate)) {
            if (!holidays.contains(date)
                && holidays.contains(date.minusDays(1))
                && holidays.contains(date.plusDays(1))) {
                holidays.add(date);
            }
            date = date.plusDays(1);
        }
    }

    private void applySubstituteHolidays(int year, Set<LocalDate> holidays) {
        Set<LocalDate> originalHolidays = new HashSet<>(holidays);
        for (LocalDate holiday : originalHolidays) {
            if (holiday.getDayOfWeek() != DayOfWeek.SUNDAY) {
                continue;
            }
            LocalDate substitute = holiday.plusDays(1);
            while (holidays.contains(substitute)) {
                substitute = substitute.plusDays(1);
            }
            if (substitute.getYear() == year) {
                holidays.add(substitute);
            }
        }
    }

    private LocalDate nthMonday(int year, Month month, int week) {
        LocalDate firstDay = LocalDate.of(year, month, 1);
        int shift = (DayOfWeek.MONDAY.getValue() - firstDay.getDayOfWeek().getValue() + 7) % 7;
        return firstDay.plusDays(shift + ((long) week - 1L) * 7L);
    }

    private LocalDate vernalEquinoxDay(int year) {
        int day = (int) Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((double) (year - 1980) / 4));
        return LocalDate.of(year, Month.MARCH, day);
    }

    private LocalDate autumnalEquinoxDay(int year) {
        int day = (int) Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((double) (year - 1980) / 4));
        return LocalDate.of(year, Month.SEPTEMBER, day);
    }
}
