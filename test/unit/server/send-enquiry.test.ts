import type { Enquiry } from '../../../server/utils/enquiry'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEnquiry } from '../../../server/utils/send-enquiry'

const enquiry: Enquiry = {
  name: 'Dana Whitfield',
  email: 'dana@whitfield.example',
  message: 'I need a frontend engineer for a six week engagement.',
}

const delivery = {
  apiKey: 're_test_key',
  to: 'pavel@ppadron.page',
  from: 'enquiries@ppadron.page',
}

/**
 * The real `fetch`, not Nuxt's `$fetch`: this module is a plain function that
 * looks the global up on each call, so a stub genuinely replaces it. The
 * auto-import trap in docs/agents/testing.md does not apply here.
 */
let send: ReturnType<typeof vi.fn>

beforeEach(() => {
  send = vi.fn(async () => new Response('{"id":"1"}', { status: 200 }))
  vi.stubGlobal('fetch', send)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sendEnquiry', () => {
  it('hands the Enquiry to Resend, addressed so a reply reaches the Visitor', async () => {
    await sendEnquiry(enquiry, delivery)

    expect(send).toHaveBeenCalledTimes(1)

    const [url, init] = send.mock.calls[0]!
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer re_test_key')

    expect(JSON.parse(init.body)).toMatchObject({
      from: 'enquiries@ppadron.page',
      to: 'pavel@ppadron.page',
      reply_to: 'dana@whitfield.example',
    })
  })

  it('writes the whole Enquiry into the mail, not just the headers', async () => {
    await sendEnquiry(enquiry, delivery)

    const { subject, text } = JSON.parse(send.mock.calls[0]![1].body)

    expect(subject).toContain('Dana Whitfield')
    expect(text).toContain('Dana Whitfield')
    expect(text).toContain('dana@whitfield.example')
    expect(text).toContain('I need a frontend engineer for a six week engagement.')
  })

  it('throws when Resend refuses the send', async () => {
    send.mockResolvedValue(
      new Response('{"message":"domain not verified"}', { status: 403 }),
    )

    await expect(sendEnquiry(enquiry, delivery)).rejects.toThrow(
      /domain not verified/,
    )
  })

  it('throws when the request itself never lands', async () => {
    send.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(sendEnquiry(enquiry, delivery)).rejects.toThrow(/ECONNREFUSED/)
  })

  it.each(['apiKey', 'to', 'from'])(
    'refuses to send at all with no %s configured',
    async (missing) => {
      await expect(
        sendEnquiry(enquiry, { ...delivery, [missing]: '' }),
      ).rejects.toThrow(/not configured/)

      expect(send).not.toHaveBeenCalled()
    },
  )
})
