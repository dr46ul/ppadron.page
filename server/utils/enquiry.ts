/**
 * An Enquiry as the route accepts it. The client has a type of the same name
 * for the draft it holds; this one is deliberately separate, because the route
 * parses unknown input rather than trusting a shape the caller claims.
 */
export interface Enquiry {
  name: string
  email: string
  message: string
}

/**
 * Nothing rate-limits this route, and an uncapped field becomes an uncapped
 * email. 320 is the longest address RFC 5321 allows; the other two are simply
 * more than anyone writing to Pavel needs.
 */
const LIMITS = { name: 200, email: 320, message: 5000 } as const

/**
 * The same floor the form puts on the body (`minlength="20"` in Contact.vue).
 * A one-word message is a mistake or a probe, not an Enquiry.
 */
const MESSAGE_MIN = 20

/**
 * Enough of an address that a reply has somewhere to go: one @, no spaces, and
 * a dot in the domain. Whether the address is real is not knowable here — the
 * only test that matters is whether Pavel's reply lands, so a stricter pattern
 * would only reject addresses that work.
 */
const PLAUSIBLE_ADDRESS = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export function parseEnquiry(body: unknown): Enquiry | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return undefined

  const fields = body as Record<string, unknown>
  const name = fields.name
  const email = fields.email
  const message = fields.message

  if (
    typeof name !== 'string'
    || typeof email !== 'string'
    || typeof message !== 'string'
  ) {
    return undefined
  }

  const enquiry: Enquiry = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
  }

  if (!enquiry.name || enquiry.message.length < MESSAGE_MIN)
    return undefined

  if (
    enquiry.name.length > LIMITS.name
    || enquiry.email.length > LIMITS.email
    || enquiry.message.length > LIMITS.message
  ) {
    return undefined
  }

  if (!PLAUSIBLE_ADDRESS.test(enquiry.email))
    return undefined

  return enquiry
}
