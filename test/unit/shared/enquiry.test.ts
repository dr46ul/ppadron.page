import type { EnquiryField } from '../../../shared/enquiry'
import { describe, expect, it } from 'vitest'
import { parseEnquiry } from '../../../shared/enquiry'

/** A body that is an Enquiry, which each test varies one field of. */
function body(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Dana Whitfield',
    email: 'dana@whitfield.example',
    message: 'I need a frontend engineer for a six week engagement.',
    ...overrides,
  }
}

/** The name an Enquiry carries once parsed, if it parsed at all. */
function nameOf(name: string) {
  const parsed = parseEnquiry(body({ name }))

  return parsed.success ? parsed.enquiry.name : undefined
}

describe('parseEnquiry', () => {
  it('returns the Enquiry a Visitor submitted', () => {
    expect(parseEnquiry(body())).toEqual({
      success: true,
      enquiry: {
        name: 'Dana Whitfield',
        email: 'dana@whitfield.example',
        message: 'I need a frontend engineer for a six week engagement.',
      },
    })
  })

  it.each([undefined, null, 'a string', 42, []])(
    'reports every field missing from a body that is not an object: %o',
    (notABody) => {
      expect(parseEnquiry(notABody)).toEqual({
        success: false,
        failures: { name: 'missing', email: 'missing', message: 'missing' },
      })
    },
  )

  it.each(['name', 'email', 'message'] satisfies EnquiryField[])('reports a %s that is absent as missing', (field) => {
    const incomplete: Partial<ReturnType<typeof body>> = body()
    delete incomplete[field]

    expect(parseEnquiry(incomplete)).toEqual({
      success: false,
      failures: { [field]: 'missing' },
    })
  })

  it.each([
    undefined,
    null,
    42,
    {},
    ['a'],
  ])(
    'reports a field that is not a string as missing: %o',
    (notAString) => {
      expect(parseEnquiry(body({ name: notAString, email: notAString, message: notAString }))).toEqual({
        success: false,
        failures: { name: 'missing', email: 'missing', message: 'missing' },
      })
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
      success: true,
      enquiry: {
        name: 'Dana Whitfield',
        email: 'dana@whitfield.example',
        message: 'I need a frontend engineer for a six week engagement.',
      },
    })
  })

  it('collapses whitespace inside the name, which reaches the mail subject', () => {
    expect([
      nameOf('Dana\n\nWhitfield'),
      nameOf('Dana \t Whitfield'),
      // Two runs, so a collapse that stops after the first is caught.
      nameOf('  Dana   Mary\n\nWhitfield '),
    ]).toEqual(['Dana Whitfield', 'Dana Whitfield', 'Dana Mary Whitfield'])
  })

  it('reports a message one character under the form\'s own minimum as too short', () => {
    expect(parseEnquiry(body({
      message: 'x'.repeat(19),
    }))).toEqual({
      success: false,
      failures: { message: 'too-short' },
    })
  })

  it('measures the minimum after trimming, so padding cannot reach it', () => {
    expect(parseEnquiry(body({ message: `${'x'.repeat(19)}     ` }))).toEqual({
      success: false,
      failures: { message: 'too-short' },
    })
  })

  it('accepts a message exactly at that minimum', () => {
    expect(parseEnquiry(body({
      message: 'x'.repeat(20),
    })).success).toBe(true)
  })

  /** An address of an exact length that is still a plausible one. */
  function address(length: number) {
    const domain = '@whitfield.example'

    return 'x'.repeat(length - domain.length) + domain
  }

  it.each([
    [
      'name',
      'x'.repeat(200),
    ],
    [
      'email',
      address(320),
    ],
    [
      'message',
      'x'.repeat(5000),
    ],
  ])('accepts a %s exactly at its cap', (field, value) => {
    expect(parseEnquiry(body({ [field]: value })).success).toBe(true)
  })

  it.each([
    [
      'name',
      'x'.repeat(201),
    ],
    [
      'email',
      address(321),
    ],
    [
      'message',
      'x'.repeat(5001),
    ],
  ])('reports a %s one character over its cap as too long', (field, value) => {
    expect(parseEnquiry(body({ [field]: value }))).toEqual({
      success: false,
      failures: { [field]: 'too-long' },
    })
  })

  it.each([
    'dana',
    'dana@',
    '@whitfield.example',
    'dana@whitfield',
    'a@b',
    'dana whitfield@example.com',
    'dana@@whitfield.example',
  ])('reports an address a reply could not reach: %s', (email) => {
    expect(parseEnquiry(body({ email }))).toEqual({
      success: false,
      failures: { email: 'not-an-address' },
    })
  })

  it.each([
    'dana@whitfield.example',
    'dana.whitfield+site@agency.co.uk',
    'o\'dana@whitfield.example',
  ])('accepts a plausible address: %s', (email) => {
    expect(parseEnquiry(body({ email }))).toEqual({
      success: true,
      enquiry: expect.objectContaining({ email }),
    })
  })

  it.each([
    'josé@example.test',
    'a,b@example.test',
    'dagny@example.test.',
  ])('accepts %s, which a browser\'s own address grammar would refuse', (email) => {
    expect(parseEnquiry(body({ email })).success).toBe(true)
  })

  it.each([
    [
      'name',
      ` ${'x'.repeat(200)} `,
    ],
    [
      'email',
      ` ${address(320)} `,
    ],
    [
      'message',
      ` ${'x'.repeat(5000)} `,
    ],
  ])('measures the cap of a %s after trimming, so padding cannot reach it', (field, value) => {
    expect(parseEnquiry(body({ [field]: value })).success).toBe(true)
  })

  it('measures a name\'s cap after its spaces are collapsed', () => {
    const name = `${'x'.repeat(100)}${' '.repeat(10)}${'x'.repeat(95)}`

    expect(parseEnquiry(body({ name })).success).toBe(true)
  })

  it('reports every field that fails, not just the first', () => {
    expect(
      parseEnquiry({
        name: 'x'.repeat(201),
        email: 'dana',
        message: 'too short',
      }),
    ).toEqual({
      success: false,
      failures: { name: 'too-long', email: 'not-an-address', message: 'too-short' },
    })
  })

  it.each(['name', 'email', 'message'])(
    'reports a %s that is only whitespace as missing',
    (field) => {
      expect(parseEnquiry(body({ [field]: '   ' }))).toEqual({
        success: false,
        failures: { [field]: 'missing' },
      })
    },
  )
})
