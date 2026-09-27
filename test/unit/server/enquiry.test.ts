import { describe, expect, it } from 'vitest'
import { parseEnquiry } from '../../../server/utils/enquiry'

/** A body that is an Enquiry, which each test varies one field of. */
function body(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Dana Whitfield',
    email: 'dana@whitfield.example',
    message: 'I need a frontend engineer for a six week engagement.',
    ...overrides,
  }
}

describe('parseEnquiry', () => {
  it('returns the Enquiry a Visitor submitted', () => {
    expect(parseEnquiry(body())).toEqual({
      name: 'Dana Whitfield',
      email: 'dana@whitfield.example',
      message: 'I need a frontend engineer for a six week engagement.',
    })
  })

  it.each([undefined, null, 'a string', 42, []])(
    'refuses a body that is not an object: %o',
    (notABody) => {
      expect(parseEnquiry(notABody)).toBeUndefined()
    },
  )

  it.each(['name', 'email', 'message'])('refuses a body with no %s', (field) => {
    const incomplete = body()
    delete (incomplete as Record<string, unknown>)[field]

    expect(parseEnquiry(incomplete)).toBeUndefined()
  })

  it.each([undefined, null, 42, {}, ['a']])(
    'refuses a field that is not a string: %o',
    (notAString) => {
      expect(parseEnquiry(body({ name: notAString }))).toBeUndefined()
      expect(parseEnquiry(body({ email: notAString }))).toBeUndefined()
      expect(parseEnquiry(body({ message: notAString }))).toBeUndefined()
    },
  )

  it('trims each field, so no padding reaches the email', () => {
    expect(
      parseEnquiry(
        body({
          name: '  Dana Whitfield\n',
          email: ' dana@whitfield.example ',
          message: '\t I need a frontend engineer for a six week engagement. ',
        }),
      ),
    ).toEqual({
      name: 'Dana Whitfield',
      email: 'dana@whitfield.example',
      message: 'I need a frontend engineer for a six week engagement.',
    })
  })

  it.each(['name', 'email', 'message'])(
    'refuses a %s that is only whitespace',
    (field) => {
      expect(parseEnquiry(body({ [field]: '   ' }))).toBeUndefined()
    },
  )

  it.each([
    'dana',
    'dana@',
    '@whitfield.example',
    'dana@whitfield',
    'dana whitfield@example.com',
    'dana@@whitfield.example',
  ])('refuses an address a reply could not reach: %s', (email) => {
    expect(parseEnquiry(body({ email }))).toBeUndefined()
  })

  it.each([
    'dana@whitfield.example',
    'dana.whitfield+site@agency.co.uk',
    'o\'dana@whitfield.example',
  ])('accepts a plausible address: %s', (email) => {
    expect(parseEnquiry(body({ email }))?.email).toBe(email)
  })

  it('refuses a message one character under the form\'s own minimum', () => {
    expect(parseEnquiry(body({ message: 'x'.repeat(19) }))).toBeUndefined()
  })

  it('accepts a message exactly at that minimum', () => {
    expect(parseEnquiry(body({ message: 'x'.repeat(20) }))?.message).toHaveLength(20)
  })

  /** An address of an exact length that is still a plausible one. */
  function address(length: number) {
    const domain = '@whitfield.example'

    return 'x'.repeat(length - domain.length) + domain
  }

  it.each([
    ['name', 'x'.repeat(200)],
    ['email', address(320)],
    ['message', 'x'.repeat(5000)],
  ])('accepts a %s exactly at its cap', (field, value) => {
    expect(parseEnquiry(body({ [field]: value }))).toBeDefined()
  })

  it.each([
    ['name', 'x'.repeat(201)],
    ['email', address(321)],
    ['message', 'x'.repeat(5001)],
  ])('refuses a %s one character over its cap', (field, value) => {
    expect(parseEnquiry(body({ [field]: value }))).toBeUndefined()
  })
})
