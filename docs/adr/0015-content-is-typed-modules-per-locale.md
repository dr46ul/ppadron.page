# Content is typed modules per Locale

The Profile and the Experience are one set of TypeScript modules per Locale
under `app/data/`, each typed by the interfaces the English modules already
use. The Recommendations stay a single module, shared by every Locale.
`Terminal` chooses the set for the Session's Locale and hands it down.

This reopens ADR-0010, as its last paragraph anticipated. That record kept
Content in the repository as typed modules, and this one still does. What
changes is that each Locale gets its own set, and the Messages hold none of it.

## Considered Options

- **Content in the Message files.** Rejected: the Message files are untyped
  JSON, so a missing field would become a lint finding rather than a compile
  error. Long first-person prose would also sit flattened into keys. The one
  gain, a translation platform being able to see it, does not apply, because
  no platform is wired in.
- **Translate only the Interface copy.** Rejected: Spanish Interface copy around
  English prose reads as unfinished. The prose is the proof a Visitor came for.
- **Translate the Recommendations.** Rejected: a Recommendation is a verbatim
  quote, and a translation of it is not what its author wrote. They print in
  English in every Locale, attribution included. The provenance line is a
  Message, and in Spanish it says that the quotes are shown in their original
  English.

## Consequences

**A missing translation is a compile error.** A Locale's Profile is a
`Profile` and its Roles are `RoleEntry`s. A field left out fails the type
check, not the page.

**The Content rules hold for every Locale.** `test/unit/content.test.ts` checks
each Locale, so a translated Experience cannot drop a Role, change a slug or
reorder the list. Every Locale also has the same Roles with the same slugs, so
`cat ~/experience/<slug>` names the same Role in every Locale.

**Only prose is translated.** Summaries, accounts, phase names and the
Background are translated. Company names, people's names and technology names
are not. Job titles stay as written in English by default.

**A Role's dates become machine dates.** Periods are already built from a
Role's start and end, but those are English month names. Stored as machine
dates and printed through a named date format, with "now" as a Message, they
are written once and read in every Locale.

**How a Locale's Content reaches the client is not decided here.** ADR-0010
put all Content in the client bundle. If `Terminal` imports every Locale's
modules, every Visitor downloads every Locale. Whether that is acceptable, or
Content is loaded per Locale instead, depends on a bundle measurement no one has
made yet.

**A third Locale is translation work, not engineering:** a Message file, a set
of Content modules and one entry in the module's config.
