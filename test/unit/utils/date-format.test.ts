import { describe, expect, it } from 'vitest'
import { formatDate, pickLocale } from '../../../app/utils/date-format'

const builtAt = Date.UTC(2026, 2, 14, 9, 5, 7)

describe('formatDate', () => {
  describe.each([
    ['en', 'UTC', 'Sat, Mar 14, 09:05:07 AM UTC', '2026'],
    ['en-US', 'America/New_York', 'Sat, Mar 14, 05:05:07 AM EDT', '2026'],
    ['en-GB', 'Europe/London', 'Sat 14 Mar, 09:05:07 GMT', '2026'],
    ['de-DE', 'Europe/Berlin', 'Sa., 14. März, 10:05:07 MEZ', '2026'],
    ['ar-EG', 'Africa/Cairo', 'السبت، ١٤ مارس، ١١:٠٥:٠٧ ص غرينتش+٢', '٢٠٢٦'],
  ])('for %s in %s', (locale, timeZone, lastLogin, year) => {
    it('prints the last login', () => {
      expect(formatDate(builtAt, 'lastLogin', { locale, timeZone })).toBe(lastLogin)
    })

    it('prints the year', () => {
      expect(formatDate(builtAt, 'year', { locale, timeZone })).toBe(year)
    })
  })

  it('takes the year from the time zone, not from UTC', () => {
    const newYearsEve = Date.UTC(2026, 11, 31, 23, 30)

    expect(formatDate(newYearsEve, 'year', { locale: 'en', timeZone: 'UTC' })).toBe('2026')
    expect(formatDate(newYearsEve, 'year', { locale: 'en', timeZone: 'Asia/Tokyo' })).toBe('2027')
  })
})

describe('pickLocale', () => {
  it('takes the Visitor\'s first language', () => {
    expect(pickLocale(['de-DE', 'en'])).toBe('de-DE')
  })

  it('canonicalises the tag', () => {
    expect(pickLocale(['de-de'])).toBe('de-DE')
  })

  it('skips a malformed tag, which Intl would throw on', () => {
    expect(pickLocale(['en_US', 'fr-FR'])).toBe('fr-FR')
  })

  it('skips a tag Intl does not support', () => {
    expect(pickLocale(['zz', 'pt-BR'])).toBe('pt-BR')
  })

  it('falls back to English when nothing is usable', () => {
    expect(pickLocale(['en_US', 'zz'])).toBe('en')
    expect(pickLocale([])).toBe('en')
  })
})
