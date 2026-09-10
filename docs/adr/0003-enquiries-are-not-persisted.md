# Enquiries are not persisted

The contact form posts to a Nitro route which sends the Enquiry to Pavel as email via Resend. Nothing is written to a database, a file, or a third-party form service. An Enquiry exists only as the email it is delivered as. If the email API is down or the send throws, the message is lost.

We accepted that failure mode because the volume is a handful of enquiries a month, and adding storage means adding a database to a site that otherwise has no dynamic data, plus a personal-data retention obligation under GDPR for people who are merely asking a question. The mitigation is in the UI rather than the infrastructure: a failed send shows a clear error _and_ reveals the direct email address, so the worst case degrades to what the site would have done with a plain `mailto:` link, rather than to silence.

## Consequences

A lost enquiry is a lost client, and there is no record to recover it from. If enquiry volume ever becomes high enough that this is a real risk, the fix is a persistence layer plus a retention policy — both, not just the first.

This decision is what makes the privacy line under the submit button accurate: "Your message is emailed to me and stored nowhere else." If persistence is ever added, that copy has to change in the same commit.
