import type { PaymentDateAdjustmentRule } from '@/features/account/types/account'
import type { AppSetting } from '@/features/appSetting/types/appSetting'

export type MonthlyPeriod = {
  targetMonth: string
  periodStartDate: string
  periodEndDate: string
}

export function resolveContainingMonth(appSetting: AppSetting, date: Date) {
  const currentMonth = formatYearMonth(date.getFullYear(), date.getMonth() + 1)
  const currentPeriod = resolveMonthlyPeriod(appSetting, currentMonth)
  const dateLabel = formatDateInput(date)
  if (contains(currentPeriod, dateLabel)) {
    return currentMonth
  }

  const previousMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  const previousMonth = formatYearMonth(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth() + 1,
  )
  const previousPeriod = resolveMonthlyPeriod(appSetting, previousMonth)
  if (contains(previousPeriod, dateLabel)) {
    return previousMonth
  }

  const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  const nextMonth = formatYearMonth(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth() + 1,
  )
  const nextPeriod = resolveMonthlyPeriod(appSetting, nextMonth)
  if (contains(nextPeriod, dateLabel)) {
    return nextMonth
  }

  return currentMonth
}

export function resolveMonthlyPeriod(
  appSetting: AppSetting,
  monthLabel: string,
): MonthlyPeriod {
  const [year, month] = monthLabel.split('-').map(Number)
  const periodStartDate = adjustMonthBoundary(
    new Date(year, month - 1, clampDayToMonth(year, month, appSetting.monthStartDay)),
    appSetting.monthStartAdjustmentRule,
  )
  const nextMonthDate = new Date(year, month, 1)
  const nextMonth = formatYearMonth(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth() + 1,
  )
  const [nextYear, nextMonthNumber] = nextMonth.split('-').map(Number)
  const nextPeriodStartDate = adjustMonthBoundary(
    new Date(
      nextYear,
      nextMonthNumber - 1,
      clampDayToMonth(nextYear, nextMonthNumber, appSetting.monthStartDay),
    ),
    appSetting.monthStartAdjustmentRule,
  )

  return {
    targetMonth: monthLabel,
    periodStartDate: formatDateInput(periodStartDate),
    periodEndDate: formatDateInput(
      new Date(
        nextPeriodStartDate.getFullYear(),
        nextPeriodStartDate.getMonth(),
        nextPeriodStartDate.getDate() - 1,
      ),
    ),
  }
}

function contains(period: MonthlyPeriod, dateLabel: string) {
  return dateLabel >= period.periodStartDate && dateLabel <= period.periodEndDate
}

function adjustMonthBoundary(date: Date, rule: PaymentDateAdjustmentRule) {
  const adjusted = new Date(date)
  if (rule === 'NONE') {
    return adjusted
  }

  while (!isJapanBusinessDay(adjusted)) {
    adjusted.setDate(adjusted.getDate() + (rule === 'NEXT_BUSINESS_DAY' ? 1 : -1))
  }

  return adjusted
}

const japanHolidayCache = new Map<number, Set<string>>()

function isJapanBusinessDay(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6 && !isJapanHoliday(date)
}

function isJapanHoliday(date: Date) {
  return getJapanHolidays(date.getFullYear()).has(formatDateInput(date))
}

function getJapanHolidays(year: number) {
  const cached = japanHolidayCache.get(year)
  if (cached) {
    return cached
  }

  const holidays = new Set<string>()
  const addHoliday = (month: number, day: number) => {
    holidays.add(formatYearMonthDate(year, month, day))
  }

  addHoliday(1, 1)
  addHolidayDate(holidays, getNthMonday(year, 1, 2))
  addHoliday(2, 11)
  if (year >= 2020) {
    addHoliday(2, 23)
  }
  addHolidayDate(holidays, getVernalEquinoxDay(year))
  addHoliday(4, 29)
  addHoliday(5, 3)
  addHoliday(5, 4)
  addHoliday(5, 5)
  addHolidayDate(holidays, getNthMonday(year, 7, 3))
  if (year >= 2016) {
    addHoliday(8, 11)
  }
  addHolidayDate(holidays, getNthMonday(year, 9, 3))
  addHolidayDate(holidays, getAutumnalEquinoxDay(year))
  addHolidayDate(holidays, getNthMonday(year, 10, 2))
  addHoliday(11, 3)
  addHoliday(11, 23)

  applyCitizensHolidays(year, holidays)
  applySubstituteHolidays(year, holidays)

  japanHolidayCache.set(year, holidays)
  return holidays
}

function addHolidayDate(holidays: Set<string>, date: Date) {
  holidays.add(formatDateInput(date))
}

function applyCitizensHolidays(year: number, holidays: Set<string>) {
  const date = new Date(year, 0, 2)
  const lastDate = new Date(year, 11, 30)
  while (date <= lastDate) {
    const current = formatDateInput(date)
    const previous = formatDateInput(
      new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
    )
    const next = formatDateInput(
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    )
    if (!holidays.has(current) && holidays.has(previous) && holidays.has(next)) {
      holidays.add(current)
    }
    date.setDate(date.getDate() + 1)
  }
}

function applySubstituteHolidays(year: number, holidays: Set<string>) {
  const originalHolidays = [...holidays]
  for (const holiday of originalHolidays) {
    const date = parseDateLabel(holiday)
    if (date.getDay() !== 0) {
      continue
    }

    const substitute = new Date(date)
    substitute.setDate(substitute.getDate() + 1)
    while (holidays.has(formatDateInput(substitute))) {
      substitute.setDate(substitute.getDate() + 1)
    }
    if (substitute.getFullYear() === year) {
      holidays.add(formatDateInput(substitute))
    }
  }
}

function getNthMonday(year: number, month: number, week: number) {
  const firstDay = new Date(year, month - 1, 1)
  const shift = (8 - firstDay.getDay()) % 7
  return new Date(year, month - 1, 1 + shift + (week - 1) * 7)
}

function getVernalEquinoxDay(year: number) {
  const day = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
  return new Date(year, 2, day)
}

function getAutumnalEquinoxDay(year: number) {
  const day = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
  return new Date(year, 8, day)
}

function formatYearMonthDate(year: number, month: number, day: number) {
  return `${formatYearMonth(year, month)}-${String(day).padStart(2, '0')}`
}

function parseDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function clampDayToMonth(year: number, month: number, day: number) {
  return Math.min(day, new Date(year, month, 0).getDate())
}

function formatYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}
