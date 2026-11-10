import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError, defineEventHandler, readBody } from 'h3'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import { sendEnquiry } from '../../server/utils/send-enquiry'

/**
 * The real contact route is the endpoint and only the `fetch` to Resend is
 * stubbed, so a test cannot pass on a stub it forgot to install. Call it at the
 * top level of a test file; it answers 200 unless a test says otherwise.
 */
type Resend = ReturnType<typeof vi.fn<typeof fetch>>

export function useContactRoute() {
  const resend: Resend = vi.fn<typeof fetch>()

  beforeAll(async () => {
    // The route's first line runs at import, so `defineEventHandler` must exist
    // before it loads.
    vi.stubGlobal('defineEventHandler', defineEventHandler)

    const { default: route } = await import('../../server/api/contact.post')
    registerEndpoint('/api/contact', route)
  })

  beforeEach(() => {
    // The nuxt runtime has none of Nitro's server auto-imports. These are looked
    // up as the route runs, and a file's own `vi.unstubAllGlobals()` would take
    // them away, so they are put back before every test.
    vi.stubGlobal('readBody', readBody)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('sendEnquiry', sendEnquiry)

    resend.mockReset()
    resend.mockImplementation(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', resend)

    // Empty in the test runtime, and `sendEnquiry` refuses an unconfigured
    // delivery.
    Object.assign(useRuntimeConfig(), {
      resendApiKey: 'test-key',
      enquiryTo: 'pavel@example.test',
      enquiryFrom: 'enquiries@example.test',
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  return resend
}

export function emails(resend: Resend) {
  return resend.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))
}

/**
 * A send that has been submitted has not necessarily reached Resend yet: it
 * crosses the route first.
 */
export function arrived(resend: Resend) {
  return vi.waitUntil(() => resend.mock.calls.length > 0)
}
