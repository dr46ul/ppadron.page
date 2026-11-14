import { describe, expect, it } from 'vitest'

const builtAt = Date.UTC(2026, 2, 14, 9, 5, 7)

function d(at: number, key: string, timeZone: string) {
  return useNuxtApp().$i18n.d(at, { key, timeZone })
}

describe('the named date formats', () => {
  it('print the last login in English', () => {
    expect({
      utc: d(builtAt, 'lastLogin', 'UTC'),
      newYork: d(builtAt, 'lastLogin', 'America/New_York'),
      berlin: d(builtAt, 'lastLogin', 'Europe/Berlin'),
    }).toEqual({
      utc: 'Sat, Mar 14, 09:05:07 AM UTC',
      newYork: 'Sat, Mar 14, 05:05:07 AM EDT',
      berlin: 'Sat, Mar 14, 10:05:07 AM GMT+1',
    })
  })

  it('take the year from the time zone, not from UTC', () => {
    const newYearsEve = Date.UTC(2026, 11, 31, 23, 30)

    expect({
      utc: d(newYearsEve, 'year', 'UTC'),
      tokyo: d(newYearsEve, 'year', 'Asia/Tokyo'),
    }).toEqual({ utc: '2026', tokyo: '2027' })
  })

  it('print a month with its year', () => {
    expect(d(Date.UTC(2023, 5), 'monthYear', 'UTC')).toBe('Jun 2023')
  })
})
