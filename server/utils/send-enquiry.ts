import type { Enquiry } from '#shared/enquiry'

export interface EnquiryDelivery {
  apiKey: string
  to: string
  from: string
}

const RESEND_EMAILS = 'https://api.resend.com/emails'

export async function sendEnquiry(
  enquiry: Enquiry,
  delivery: EnquiryDelivery,
): Promise<void> {
  if (!delivery.apiKey || !delivery.to || !delivery.from)
    throw new Error('Enquiry delivery is not configured')

  const response = await fetch(RESEND_EMAILS, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${delivery.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: delivery.from,
      to: delivery.to,
      reply_to: enquiry.email,
      subject: `Enquiry from ${enquiry.name}`,
      // `reply_to` alone would leave the address invisible in most clients,
      // and it is the only way back to the Visitor if a reply bounces.
      text: `${enquiry.name} <${enquiry.email}>\n\n${enquiry.message}\n`,
    }),
  })

  // Throwing is the contract the client depends on: `submit()` in useEnquiry.ts
  // distinguishes only resolve from reject, and a rejected send is what reveals
  // the direct address (docs/adr/0003-enquiries-are-not-persisted.md).
  if (!response.ok)
    throw new Error(`Resend refused the Enquiry: ${await response.text()}`)
}
