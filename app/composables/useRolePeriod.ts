import type { MonthDate, Year } from '~/data/experience'

interface Dates {
  from: Year | MonthDate
  to: Year | MonthDate | null
}

/**
 * A Role's dates as the Session's Locale writes them. The year range's Message
 * takes an em dash and the month range's an en dash on purpose: the Experience
 * column and Role detail have always been set that way.
 */
export function useRolePeriod() {
  const { d, t } = useI18n()

  /**
   * A stored month is its first instant in UTC, so it is printed in UTC: in
   * the Visitor's zone, anywhere west of it, that instant is the month before.
   */
  function write(date: Year | MonthDate | null, key: 'year' | 'monthYear') {
    if (date === null)
      return t('period.now')
    const [year, month = '01'] = date.split('-')
    return d(Date.UTC(Number(year), Number(month) - 1), { key, timeZone: 'UTC' })
  }

  return {
    years: ({ from, to }: Dates) => t('period.years', {
      from: write(from, 'year'),
      to: write(to, 'year'),
    }),
    months: ({ from, to }: Dates) => t('period.months', {
      from: write(from, 'monthYear'),
      to: write(to, 'monthYear'),
    }),
  }
}
