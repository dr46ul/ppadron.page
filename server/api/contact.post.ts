/**
 * The Session's single conversion action: validate the three fields, send one
 * email, store nothing — see docs/adr/0003-enquiries-are-not-persisted.md.
 *
 * Every decision is in `server/utils`, where a unit test can reach it.
 */
export default defineEventHandler(async (event) => {
  const enquiry = parseEnquiry(await readBody(event))

  // The form's own `required`, `type="email"` and `minlength` are the first
  // line, so a body that fails here did not come from the form. The client has
  // one `failed` state and no per-field errors, so it reveals the direct
  // address — the right answer to a rejection it cannot explain.
  if (!enquiry)
    throw createError({ statusCode: 400, statusMessage: 'Not an Enquiry' })

  const config = useRuntimeConfig(event)

  await sendEnquiry(enquiry, {
    apiKey: config.resendApiKey,
    to: config.enquiryTo,
    from: config.enquiryFrom,
  })

  // The client distinguishes only resolve from reject, so the shape is free.
  return { sent: true }
})
