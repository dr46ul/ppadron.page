import type { MonthDate, Role } from '~/data/experience'

type Dates = Pick<Role, 'from' | 'to'>

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
  function write(date: MonthDate | null, key: 'year' | 'monthYear') {
    if (date === null)
      return t('period.now')
    return d(new Date(date), { key, timeZone: 'UTC' })
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
