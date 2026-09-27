# Security Policy

This repository holds the source of [ppadron.page](https://ppadron.page), my personal
website. There are no releases and nothing to install — the only deployment that matters is
the live site, built from `main`. Anything reported against `main` or against the running
site is in scope; older commits are not supported.

## Reporting a Vulnerability

Please report privately, not in a public issue.

Use [GitHub's private vulnerability reporting](https://github.com/dr46ul/ppadron.page/security/advisories/new)
— it opens a draft advisory only the two of us can read. If you would rather not use GitHub,
the contact form on [ppadron.page](https://ppadron.page) reaches me directly; send a way to
reply and I will move the conversation somewhere private.

Helpful in a report: what you did, what happened, and why it matters. A request, a response,
or a short screen recording beats a scanner export.

### What to expect

- **Acknowledgement** within 5 working days.
- **An assessment** — accepted, or declined with the reasoning — within 10 working days.
- **A fix**, if accepted, deployed as soon as it is ready. This is a personal site, so that
  is usually days rather than weeks.
- **Credit** in the advisory and the commit, unless you would rather stay anonymous.

If you have not heard from me in two weeks, assume the message was lost rather than ignored
and ping me again.

### Scope

In scope: this repository's code, the site's contact endpoint, and the site's build and
deployment configuration as it is committed here.

Out of scope: the platforms this site rests on — Vercel, Resend, GitHub, the DNS registrar.
Report those to the vendor; their programs cover them and I cannot fix them. Also out of
scope are findings with no demonstrated impact on this site: missing headers a static page
does not need, absent SPF/DMARC on domains I do not send from, volumetric or
denial-of-service testing, social engineering, and anything that needs a compromised device
or a stolen credential to begin with.

Please do not run denial-of-service tests, mass automated scans, or anything that would send
mail to third parties through the contact form. Test against your own address, keep the
volume low, and stop at the point where you have proved the issue.

### No bounty

I cannot pay for reports. What I can offer is a prompt reply, a public advisory, and credit.
Nothing here is an invitation to break the law, and I will not pursue anyone who reports in
good faith within this scope.
