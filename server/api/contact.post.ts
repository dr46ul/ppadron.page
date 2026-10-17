import { parseEnquiry } from '#shared/enquiry'

/**
 * The Session's single conversion action: validate the three fields, send one
 * email, store nothing — see docs/adr/0003-enquiries-are-not-persisted.md.
 *
 * Every decision is in `shared/enquiry.ts` and `server/utils`, where a unit
 * test can reach it.
 */
export default defineEventHandler(async (event) => {
  const parsed = parseEnquiry(await readBody(event))

  // The form checks the same schema before it posts, so only a client out of
  // step with it lands here, and its `failed` state reveals the direct address
  // — the right answer to a rejection it cannot explain.
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Not an Enquiry' })

  const config = useRuntimeConfig(event)

  await sendEnquiry(parsed.enquiry, {
    apiKey: config.resendApiKey,
    to: config.enquiryTo,
    from: config.enquiryFrom,
  })

  // The client distinguishes only resolve from reject, so the shape is free.
  return { sent: true }
})
