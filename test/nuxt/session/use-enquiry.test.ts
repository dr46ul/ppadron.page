import { describe, expect, it } from 'vitest'
import { arrived, emails, useContactRoute } from '../contact-route'

const resend = useContactRoute()

/** A draft the delivery's rules accept, as a Visitor might type it. */
function draft(overrides: Partial<EnquiryDraft> = {}): EnquiryDraft {
  return {
    name: '  Dana   Okafor ',
    email: ' dana@example.test ',
    message: '  Our checkout has three states and all of them are wrong.  ',
    ...overrides,
  }
}

describe('useEnquiry', () => {
  it('opens on an empty draft that nobody has sent', () => {
    const enquiry = useEnquiry()

    expect({ draft: enquiry.draft, state: enquiry.state })
      .toEqual({
        draft: { name: '', email: '', message: '' },
        state: 'idle',
      })
  })

  describe('failures', () => {
    it('is empty for a draft the delivery accepts', () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())

      expect(enquiry.failures).toEqual({})
    })

    it('names the first rule each field breaks', () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft({ name: '', email: 'dana@', message: 'hi' }))

      expect(enquiry.failures).toEqual({
        name: 'missing',
        email: 'not-an-address',
        message: 'too-short',
      })
    })

    it('follows the draft as it is edited', () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft({ message: 'hi' }))
      const before = Object.keys(enquiry.failures)
      enquiry.edit(draft())

      expect([
        before,
        Object.keys(enquiry.failures),
      ]).toEqual([
        ['message'],
        [],
      ])
    })
  })

  describe('submit', () => {
    it('posts the draft as the delivery will read it, not as it was typed', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())
      await enquiry.submit()

      expect(emails(resend)).toEqual([
        expect.objectContaining({
          reply_to: 'dana@example.test',
          subject: 'Enquiry from Dana Okafor',
          text: 'Dana Okafor <dana@example.test>\n\nOur checkout has three states and all of them are wrong.\n',
        }),
      ])
    })

    it('refuses a draft the delivery would refuse, without asking it', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft({ message: 'hi' }))
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 0, state: 'idle' })
    })

    it('leaves a failed send failed when the draft is refused', async () => {
      const enquiry = useEnquiry()
      resend.mockRejectedValue(new Error('offline'))

      enquiry.edit(draft())
      await enquiry.submit()
      enquiry.edit(draft({ email: 'dana@' }))
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 1, state: 'failed' })
    })

    it('reports that it is sending before it knows the outcome', async () => {
      const enquiry = useEnquiry()
      let deliver: () => void
      resend.mockReturnValue(
        new Promise<Response>((resolve) => {
          deliver = () => resolve(new Response('{}'))
        }),
      )

      enquiry.edit(draft())
      const sending = enquiry.submit()

      const states = [enquiry.state]

      deliver!()
      await sending

      expect([...states, enquiry.state]).toEqual(['sending', 'sent'])
    })

    it('reports a delivery that failed', async () => {
      const enquiry = useEnquiry()
      resend.mockRejectedValue(new Error('offline'))

      enquiry.edit(draft())
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 1, state: 'failed' })
    })

    it('reports a delivery that Resend refused', async () => {
      const enquiry = useEnquiry()
      resend.mockResolvedValue(new Response('invalid sender', { status: 422 }))

      enquiry.edit(draft())
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 1, state: 'failed' })
    })

    it('tries again after a delivery that failed', async () => {
      const enquiry = useEnquiry()
      resend.mockRejectedValueOnce(new Error('offline'))

      enquiry.edit(draft())
      await enquiry.submit()
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 2, state: 'sent' })
    })

    it('sends a copy, so later typing cannot change what was sent', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())
      await enquiry.submit()
      enquiry.edit(draft({ message: 'typed afterwards, and long enough to pass' }))

      expect(emails(resend)[0].text).toContain(
        'Our checkout has three states and all of them are wrong.',
      )
    })

    it('does not send an Enquiry that has already gone', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())
      await enquiry.submit()
      await enquiry.submit()

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 1, state: 'sent' })
    })

    it('does not send a second copy while the first is on its way', async () => {
      const enquiry = useEnquiry()
      resend.mockReturnValue(new Promise(() => {}))

      enquiry.edit(draft())
      void enquiry.submit()
      await enquiry.submit()
      await arrived(resend)

      expect({ sends: resend.mock.calls.length, state: enquiry.state })
        .toEqual({ sends: 1, state: 'sending' })
    })
  })

  describe('clear', () => {
    it('throws away the draft and how far it got', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())
      await enquiry.submit()
      enquiry.clear()

      expect({ draft: enquiry.draft, state: enquiry.state })
        .toEqual({
          draft: { name: '', email: '', message: '' },
          state: 'idle',
        })
    })

    it.each([
      [
        'delivered',
        () => new Response('{}'),
      ],
      [
        'failed',
        () => Promise.reject(new Error('offline')),
      ],
    ])(
      'is not undone by a send that was on its way and then %s',
      async (_, outcome) => {
        const enquiry = useEnquiry()
        let settle: () => void
        resend.mockReturnValue(
          new Promise<void>((resolve) => {
            settle = resolve
          }).then(outcome),
        )

        enquiry.edit(draft())
        const sending = enquiry.submit()
        enquiry.clear()
        settle!()
        await sending

        expect(enquiry.state).toBe('idle')
      },
    )
  })

  describe('open', () => {
    it('starts a clean slate once the last Enquiry has gone', async () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft())
      await enquiry.submit()
      enquiry.open()

      expect({ draft: enquiry.draft, state: enquiry.state })
        .toEqual({
          draft: { name: '', email: '', message: '' },
          state: 'idle',
        })
    })

    it('keeps a draft that has not been sent', () => {
      const enquiry = useEnquiry()

      enquiry.edit(draft({ message: 'half a thought' }))
      enquiry.open()

      expect({ message: enquiry.draft.message, state: enquiry.state })
        .toEqual({ message: 'half a thought', state: 'idle' })
    })

    it('keeps a draft that failed to send, and offers to send it again', async () => {
      const enquiry = useEnquiry()
      resend.mockRejectedValue(new Error('offline'))

      enquiry.edit(draft())
      await enquiry.submit()
      enquiry.open()

      expect({ draft: enquiry.draft, state: enquiry.state })
        .toEqual({
          draft: draft(),
          state: 'idle',
        })
    })

    it('leaves a send that is on its way to finish', () => {
      const enquiry = useEnquiry()
      resend.mockReturnValue(new Promise(() => {}))

      enquiry.edit(draft())
      void enquiry.submit()
      enquiry.open()

      expect({ draft: enquiry.draft, state: enquiry.state })
        .toEqual({
          draft: draft(),
          state: 'sending',
        })
    })
  })
})
