import type { MonthYear, RoleEntry, RoleNoteEntry, Year } from '../../app/data/experience'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineRole } from '../../app/data/experience'

function entry(overrides: Partial<RoleEntry> = {}): RoleEntry {
  return {
    slug: 'kiln-and-ash',
    company: 'Kiln & Ash',
    title: 'Kiln technician',
    from: 'Feb 2011',
    to: 'Sep 2013',
    summary: 'Rebuilt the firing schedule.',
    tech: ['Clay'],
    account: ['Fired the first batch.'],
    stack: ['Clay', 'Glaze'],
    ...overrides,
  }
}

function note(overrides: Partial<RoleNoteEntry> = {}): RoleNoteEntry {
  return {
    from: '2008',
    to: '2011',
    name: 'Freelance',
    title: 'Potter',
    summary: 'Threw bowls for several kilns.',
    tech: ['Clay'],
    ...overrides,
  }
}

function dates({ period, exactPeriod, since }: ReturnType<typeof defineRole>) {
  return { period, exactPeriod, since }
}

describe('defineRole', () => {
  it('writes the years, the months and the start of a Role that has ended', () => {
    expect(dates(defineRole(entry({ from: 'Nov 2014', to: 'Mar 2022' })))).toEqual({
      period: '2014 — 2022',
      exactPeriod: 'Nov 2014 – Mar 2022',
      since: '2014',
    })
  })

  it('writes a Role still held as running to now', () => {
    expect(dates(defineRole(entry({ from: 'Jun 2023', to: 'now' })))).toEqual({
      period: '2023 — now',
      exactPeriod: 'Jun 2023 – now',
      since: '2023',
    })
  })

  it('writes the years and the start of the note before a Role', () => {
    const { before } = defineRole(entry({
      before: note({ from: '2011', to: '2014' }),
    }))

    expect(before).toEqual({
      period: '2011 — 2014',
      since: '2011',
      name: 'Freelance',
      title: 'Potter',
      summary: 'Threw bowls for several kilns.',
      tech: ['Clay'],
    })
  })

  it('leaves a Role with no note without one', () => {
    expect(defineRole(entry())).not.toHaveProperty('before')
  })

  it('hands every other field through untouched', () => {
    const { period, exactPeriod, since, ...rest } = defineRole(entry())

    expect(rest).toEqual({
      slug: 'kiln-and-ash',
      company: 'Kiln & Ash',
      title: 'Kiln technician',
      summary: 'Rebuilt the firing schedule.',
      tech: ['Clay'],
      account: ['Fired the first batch.'],
      stack: ['Clay', 'Glaze'],
    })
  })
})

describe('the dates a Role is written with', () => {
  it('take a three-letter month and a four-digit year', () => {
    expectTypeOf<'Jan 2005' | 'Nov 2014' | 'Dec 2039'>().toExtend<MonthYear>()
  })

  it('refuse a date written any other way', () => {
    expectTypeOf<Extract<
      '2014' | 'Nove 2014' | 'nov 2014' | 'Nov 14' | 'Nov 201' | 'Nov 20144' | 'Nov 2O14' | 'Nov  2014',
      MonthYear
    >>().toEqualTypeOf<never>()
  })

  it('take a four-digit year for a note', () => {
    expectTypeOf<'2011' | '1999'>().toExtend<Year>()
  })

  it('refuse a note year written any other way', () => {
    expectTypeOf<Extract<'201' | '20111' | '2O11' | 'Nov 2011' | '2011 ', Year>>().toEqualTypeOf<never>()
  })
})
