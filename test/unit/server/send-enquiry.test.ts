import type { Enquiry } from '../../../shared/enquiry'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEnquiry } from '../../../server/utils/send-enquiry'

const enquiry: Enquiry = {
  name: 'Dana Whitfield',
  email: 'dana@whitfield.example',
  message: 'I need a frontend engineer for a six week engagement.',
}

const delivery = {
  apiKey: 're_test_key',
  to: 'pavel@ppadron.example',
  from: 'enquiries@ppadron.example',
}

/** Why the real `fetch` stubs where `$fetch` does not: docs/agents/testing.md. */
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

    expect(send.mock.calls.map(([url, init]) => ({
      url,
      method: init.method,
      authorization: init.headers.Authorization,
      body: JSON.parse(init.body),
    }))).toEqual([
      {
        url: 'https://api.resend.com/emails',
        method: 'POST',
        authorization: 'Bearer re_test_key',
        body: expect.objectContaining({
          from: 'enquiries@ppadron.example',
          to: 'pavel@ppadron.example',
          reply_to: 'dana@whitfield.example',
        }),
      },
    ])
  })

  it('writes the whole Enquiry into the mail, not just the headers', async () => {
    await sendEnquiry(enquiry, delivery)

    const { subject, text } = JSON.parse(send.mock.calls[0]![1].body)

    expect({
      subject,
      missingFromText: [
        'Dana Whitfield',
        'dana@whitfield.example',
        'I need a frontend engineer for a six week engagement.',
      ].filter(field => !text.includes(field)),
    }).toEqual({
      subject: expect.stringContaining('Dana Whitfield'),
      missingFromText: [],
    })
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
      const outcome = await sendEnquiry(enquiry, { ...delivery, [missing]: '' })
        .then(() => 'sent', (error: Error) => error.message)

      expect({ outcome, sends: send.mock.calls.length }).toEqual({
        outcome: expect.stringMatching(/not configured/),
        sends: 0,
      })
    },
  )
})
