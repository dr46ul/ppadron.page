import { describe, expect, it } from 'vitest'
import { roles } from '../../app/data/en/experience'
import { profile } from '../../app/data/en/profile'
import { contentFor } from '../../app/utils/content'

describe('contentFor', () => {
  it('finds the Content of a Locale in the Locale list', () => {
    expect(contentFor('en')).toEqual({ code: 'en', profile, roles })
  })

  it('falls back to English for a code that is not a Locale', () => {
    expect(contentFor('xx').code).toBe('en')
  })
})
