# Dates are formatted for the Visitor after load

Every date the Session prints — the banner's "Last login" and the Colophon's
© year — is formatted with the platform's `Intl`, in the Visitor's language and
time zone. The prerendered page has no Visitor to ask, so it ships the dates
in English and UTC, with the build's year. Once the page is mounted,
`useVisitorClock` reads the browser and the dates are formatted again.

That reverses two of ADR-0008's consequences. The banner is now rewritten on
the client, which ADR-0008 had rejected, and the © year is the Visitor's
current year rather than the build's. "Last login" is still the build time;
only how it is written changed.

## Considered Options

- **Keep the hand-made English format.** Rejected: it fixed every Visitor to
  English and UTC, whatever their browser said.
- **Format on a per-request render**, from `Accept-Language`. Rejected for
  ADR-0008's reasons, which still hold, and because the request carries no
  time zone.
- **Leave the dates blank until the browser has them.** Rejected: an empty
  first line that pops in is a worse swap than one that changes its wording.
- **Read the browser during hydration.** Not an option: the client would
  render different text from the HTML it was served, and Vue reports the
  mismatch.

## Consequences

**A Visitor outside English and UTC sees the banner change once, after load.**
That is the accepted cost. The fallback is exactly what `Intl` prints for `en`
in `UTC`, so a Visitor who matches it sees nothing move.

**The browser is read in exactly one place.** `useVisitorClock` holds the
language, the time zone and the clock, and swaps them in `onMounted`. Nothing
else reads `navigator` or the time zone to print a date.

**Formats are named, never spelled out at a call site.** `app/utils/date-format.ts`
holds them as `Intl.DateTimeFormatOptions` shaped like vue-i18n's
`datetimeFormats`. When an i18n library arrives, the formats move under each
locale, `formatDate` becomes `d(value, name)`, and the locale comes from the
library's current one instead of the browser, so translated text never sits
beside dates in another language.

**The locale decides the format.** Field order, separators and a 12- or 24-hour
clock follow the Visitor, at the cost of the Unix `last` look the banner had.

**The © year is read once, on mount.** A page left open past midnight on New
Year's Eve keeps the old year; no timer is worth that.

**Output components still see no locale** (ADR-0007). `Terminal` formats the
year and hands the Colophon a finished string.

**Role periods are out of this record.** `'2022 — now'` is Content, and "now" is
a word to translate, not a date to format; it moves with the i18n work.

`test/unit/utils/date-format.test.ts` pins the exact strings, `Terminal`'s tests
pin the swap, and `test/e2e/ssr.test.ts` pins the English and UTC the build
ships. No committed test hydrates, so a mismatch is checked in a browser
against the built `.output`.
