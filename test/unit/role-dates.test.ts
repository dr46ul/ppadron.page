import type { MonthDate, Year } from '../../app/data/experience'
import { describe, expectTypeOf, it } from 'vitest'

describe('the dates a Role is written with', () => {
  it('take a four-digit year and a two-digit month', () => {
    expectTypeOf<'2005-01' | '2014-11' | '2039-12'>().toExtend<MonthDate>()
  })

  it('refuse a date written any other way', () => {
    expectTypeOf<Extract<
      '2014' | 'Nov 2014' | '2014-1' | '2014-00' | '2014-13' | '14-11' | '201-11' | '2O14-11' | '2014/11',
      MonthDate
    >>().toEqualTypeOf<never>()
  })

  it('take a four-digit year for a note', () => {
    expectTypeOf<'2011' | '1999'>().toExtend<Year>()
  })

  it('refuse a note year written any other way', () => {
    expectTypeOf<Extract<'201' | '20111' | '2O11' | 'Nov 2011' | '2011 ', Year>>().toEqualTypeOf<never>()
  })
})
