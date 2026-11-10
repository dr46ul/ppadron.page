import { describe, expect, it } from 'vitest'
import { useContactRoute } from './contact-route'

const resend = useContactRoute()

/** `useEnquiry` refuses these before they post, so only a direct `$fetch` reaches the route's own 400. */
describe('the contact route', () => {
  it('refuses a body that is not an Enquiry with a 400', async () => {
    const outcome = await $fetch('/api/contact', {
      method: 'POST',
      body: { name: '' },
    })
      .catch((error: unknown) => error)

    expect(outcome).toMatchObject({ statusCode: 400 })
  })

  it('sends nothing to Resend for a body it refuses', async () => {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { name: '' },
    }).catch(() => {})

    expect(resend).not.toHaveBeenCalled()
  })
})
