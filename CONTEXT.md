# ppadron.page

Pavel Padron's presentation website: a single-page site whose job is to convince a prospective freelance client that Pavel can do the work, and to get them to send an email. It replaces the previous site at the same address.

The repository is named `ppadron.com` for historical reasons; the site's only domain is **ppadron.page**, hosted on Vercel. `ppadron.com` is not owned and should not appear in copy, metadata, or links.

## Language

### Audience and intent

**Visitor**:
A prospective freelance client evaluating Pavel for a project. The site's entire content hierarchy is ordered by what this person needs to decide.
_Avoid_: User, recruiter, hiring manager

**Contact**:
The single conversion action: the visitor sends Pavel a message through the contact form, which is delivered to him as email. There is no booking flow and no CRM.
_Avoid_: CTA, lead, conversion

**Enquiry**:
One submitted contact form: who is writing, how to reach them, and what they want. An Enquiry exists only as the email it is delivered as; nothing is stored.
_Avoid_: Lead, submission, ticket, message

### Interface

**Session**:
The page itself. A terminal session that opens with a login banner, prints its
content as command output, and keeps a working prompt at the foot. There are no
sections to navigate to — see `docs/adr/0004-the-site-is-a-terminal-session.md`.
_Avoid_: Page, layout, theme

**Command**:
One thing a Visitor can run, canonically spelled (`ls ~/experience`) and
reachable by alias (`experience`, `work`). Each one prints exactly one kind of
output. Adding content means adding a Command, not a page section.
_Avoid_: Link, route, nav item

**Transcript**:
The scrollback: every Command echoed with its output, most recent last. It is
seeded on load with the full tour so the page can be read without typing, and
capped so it cannot grow without bound.
_Avoid_: Feed, log, history

### Proof surfaces

**Experience**:
The roles Pavel has held as an employee or contractor, ordered most recent first, each described by what he built rather than by what he was employed as. This is the site's primary proof surface and the only place professional work is described.
_Avoid_: Work, Portfolio, Projects, Career, Employment history

**Role**:
One entry in Experience: a company, a title, a date range, a description of the work done, and the technologies used.
_Avoid_: Job, position, gig

**Recommendation**:
A verbatim quote from a former colleague or manager, taken from Pavel's LinkedIn profile and attributed by name, title, and company. Recommendations come from people Pavel worked alongside, never from freelance clients, and the site says so plainly rather than letting a visitor infer client references.
_Avoid_: Testimonial, review, endorsement, reference

### Retired terms

**Work** (retired):
The old site carried an empty "Work — coming soon" section alongside Experience. The two were never meaningfully distinct: Pavel's publishable work _is_ the work he did in his Experience roles, and his freelance projects are either under NDA or not worth showing. There is one proof surface, and it is Experience. Do not reintroduce a Work section.

**Pavel's Portfolio** (retired):
The old site listed the portfolio site itself as a company in the Experience list. A project is not an employer. The site is its own work sample; it does not need a Role.
