# Outputs read the translator for their own copy

An Output, and the Prompt bar, may read the translator for its own Interface
copy. Content still arrives as props from `Terminal`, already in the Session's
Locale. Dates are formatted in the Session's Locale, and only the time zone is
read from the browser after load.

This amends two records. ADR-0007 says an Output's interface is "its props and
emits, and nothing else". The translator is a new ambient dependency for every
Output, so that is no longer true to the letter. ADR-0009 formats dates in the
Visitor's language and says "Output components still see no locale". Its
formats and its time zone stay. The language a date is written in becomes the
page's, and an Output can now read the Locale.

## Considered Options

- **Interface copy as props from `Terminal`.** Rejected: `Terminal` would hold
  every component's words, and every Output's interface would grow by every
  sentence it prints. ADR-0007 already keeps Interface copy in the component
  that speaks it, and that is the half of the rule this record keeps.
- **Keep the date language from the browser.** Rejected: on `/es`, a Visitor
  whose browser prefers English would see Spanish copy beside English dates.
  The Locale is the language the Visitor chose, and the dates follow it.

## Consequences

**The rule ADR-0007 protects still holds for Content and the session.** An
Output does not import `app/data/`, does not call `useSession()`, and does not
choose Content by Locale. `Terminal` chooses the Locale's Content and hands it
down. Only an Output's own sentences come from the translator.

**A test that mounts an Output never fakes the translator,** as it never fakes
a session. The `nuxt` test environment provides the real one, and a test reads
the expected copy from the Message file rather than asserting the key.

**`pickLocale` and the browser's language list go away.** `useDateContext`
returns only the time zone, and the calls become
`d(value, { key: name, timeZone })` with the named formats under each Locale.

**The prerendered page ships dates in its own Locale and UTC.** `/es` ships
Spanish dates, not English ones. A Visitor outside UTC still sees the banner
change once after load, as ADR-0009 accepted.

**This record changes the language a date is written in, not who writes it.**
Today `Terminal` formats the dates and hands finished strings down. Whether an
Output that can now read the Locale should format its own is left open.
