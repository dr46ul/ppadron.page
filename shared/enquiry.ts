import * as z from 'zod/mini'

export type EnquiryRule = 'missing' | 'too-short' | 'too-long' | 'not-an-address'

/**
 * Nothing rate-limits the route, and an uncapped field becomes an uncapped
 * email. 320 is the longest address RFC 5321 allows; the other two are simply
 * more than anyone writing to Pavel needs.
 */
const LIMITS = { name: 200, email: 320, message: 5000 } as const

/** A one-word message is a mistake or a probe, not an Enquiry. */
const MESSAGE_MIN = 20

/**
 * Whether an address is real is not knowable here, and the only test that
 * matters is whether Pavel's reply lands — so a stricter pattern would only
 * reject addresses that work.
 */
const PLAUSIBLE_ADDRESS = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

/**
 * A rule's `error` is its EnquiryRule rather than copy: the wording is
 * Interface copy and belongs to Contact.
 */
function fails(rule: EnquiryRule) {
  return { error: rule }
}

function trim(value: string) {
  return value.trim()
}

/**
 * A required string, normalised before any rule sees it, so a rule measures
 * what would be sent rather than what was typed.
 */
function field(
  normalise: (value: string) => string,
  ...rules: z.core.$ZodCheck<string>[]
) {
  return z.string(fails('missing')).check(
    z.overwrite(normalise),
    z.minLength(1, fails('missing')),
    ...rules,
  )
}

const schema = z.object(
  {
    // Collapsed, not just trimmed: the name goes into the mail's subject, and
    // an interior newline there is a second header line.
    name: field(
      value => value.trim().replace(/\s+/g, ' '),
      z.maxLength(LIMITS.name, fails('too-long')),
    ),
    email: field(
      trim,
      z.maxLength(LIMITS.email, fails('too-long')),
      z.regex(PLAUSIBLE_ADDRESS, fails('not-an-address')),
    ),
    message: field(
      trim,
      z.minLength(MESSAGE_MIN, fails('too-short')),
      z.maxLength(LIMITS.message, fails('too-long')),
    ),
  },
  fails('missing'),
)

export type Enquiry = z.output<typeof schema>

export type EnquiryField = keyof Enquiry

const FIELDS = Object.keys(schema.shape) as EnquiryField[]

/** The first rule each failing field broke. */
export type EnquiryFailures = Partial<Record<EnquiryField, EnquiryRule>>

export type EnquiryParse
  = | { success: true, enquiry: Enquiry }
    | { success: false, failures: EnquiryFailures }

export function parseEnquiry(body: unknown): EnquiryParse {
  const result = schema.safeParse(body)

  if (result.success)
    return { success: true, enquiry: result.data }

  const failures: EnquiryFailures = {}

  // An issue with no path is the body itself not being an object, which leaves
  // every field missing.
  for (const issue of result.error.issues) {
    const fields = issue.path.length ? [issue.path[0] as EnquiryField] : FIELDS

    for (const failed of fields)
      failures[failed] ??= issue.message as EnquiryRule
  }

  return { success: false, failures }
}
