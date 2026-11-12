# Content lives in typed modules in the repository

The Profile, the Roles and the Recommendations are TypeScript modules in
`app/data/`. A change to Content is a commit: reviewed, type-checked and deployed
like any other change. There is no database, no headless CMS and no Nuxt Content.

The question came up when the previous site's text moved in and Content grew from
short placeholder fields to about 2,600 words. That is still about a dozen small
records, edited by one author a few times a year.

ADR-0004 and ADR-0007 already put Content in `app/data/` and let only `Terminal`
read it. This record is why it stays there now that there is more of it.

## Considered Options

- **A database read at runtime.** Rejected: the fetch breaks the prerendered page
  of ADR-0008, which has already rejected ISR, and it adds a service to run and
  pay for.
- **A headless CMS read at build time.** Rejected: it keeps the page prerendered,
  but adds an external service and a rebuild hook, all so that one author can
  edit without a commit a few times a year.
- **Nuxt Content.** Rejected: it adds a module and a query layer for about a dozen
  small records, and the Outputs would still take the same props.

## Consequences

**The data modules can't fail in any other test.** Every other test mocks them or
reads a value back from them, and they sit outside the coverage gate, so
`test/unit/content.test.ts` holds the rules a data edit could break: no
`[bracketed]` placeholder, Roles in order, no shared `since` or slug, every slug
a valid path segment.

**All Content ships in the client bundle**, because `Terminal` imports it, though
Background and Role detail print only when run. They are not in the prerendered
HTML either, so the Role summaries are what search engines index.

**Translation is the trigger to reopen this.** If long prose becomes painful to
translate once i18n lands, moving it to per-locale files is the next step. That
doesn't need a database either. _Reopened by
[ADR-0015](./0015-content-is-typed-modules-per-locale.md): Content is one set of
typed modules per Locale, and the Recommendations stay one shared module._
