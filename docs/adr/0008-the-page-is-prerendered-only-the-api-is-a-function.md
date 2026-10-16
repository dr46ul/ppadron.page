# The page is prerendered; only the API is a function

`/` is prerendered at build time and served from the CDN as a file. The only
code that runs per request is `server/api/`, which deploys as a serverless
function through Nitro's hybrid rendering. One route rule in `nuxt.config.ts`
does it: `routeRules: { '/': { prerender: true } }`.

This is the decision ADR-0002 recorded and nothing implemented. The build was
`nuxt build` with no prerender rule, so `.output/public/` held no `index.html`
and Vercel rendered the page on every visit — the trade ADR-0002 had rejected,
while the README, ADR-0002 and the Colophon all told readers the page was
static. This record supersedes ADR-0002, whose theme-script mechanics ADR-0004
had already retired, so the decision no longer sits under a title about a
script that is gone.

## Considered Options

- **Render on demand.** Rejected for ADR-0002's reason, which still holds: a
  serverless render and a possible cold start on every visit, for a page with
  no data that varies by request, on a site whose performance is part of the
  pitch.
- **Incremental static regeneration** (`isr` / `swr` route rules). Rejected:
  near-static TTFB, but Vercel-specific, still a function run after each
  expiry, and a third answer to "what is the page" — bought only to keep the
  banner's timestamp fresh, which is not worth an architecture.

## Consequences

**The banner's "Last login" is the build time, on purpose.** It used to be the
time of the request. Prerendered, it is when the page was last built: the last
time anyone logged in to this machine. It is held in `useState('built-at')`,
so it rides the inline payload and hydration keeps it instead of reading the
Visitor's clock. Rewriting it on the client was rejected — it would visibly
change the first line on the page after load.

**The © year is the build's year**, handed to the Colophon by `Terminal` from
the same state. A clock read in the component would print one year in the
prerendered HTML and patch in another on hydration the first time the site
went a New Year without a deploy. Going a whole year without one leaves the
notice a year behind, which for a year of publication is correct.

**Payload extraction is off.** On a prerendered route Nuxt moves part of the
payload to `_payload.json`, and the client awaits a fetch of it before it
hydrates. That file serves client-side navigation between prerendered pages,
and there is one page, so it was a round trip on every visit for nothing.

**`nuxt generate` must not be used**, and the script is gone from
`package.json`. It emits a fully static site with no function, so
`/api/contact` would 404 and every Enquiry would fail. `nuxt build` with the
route rule is the build.

**Anything per request belongs in `server/api/`.** If the page ever needs data
that varies by visit, that is the trigger to revisit this record, not a reason
to drop the route rule quietly.

**The Colophon and the README describe this record.** Both say the site is a
prerendered page with one function behind the form. If this changes, their
copy changes in the same commit.

`test/e2e/ssr.test.ts` checks that the build produced `public/index.html`. A
response cannot tell a prerendered page from a rendered one, so the build
output is the only place this is visible.
