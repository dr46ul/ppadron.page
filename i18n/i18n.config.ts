/**
 * Every date the Session prints goes through one of these named formats,
 * never through `Intl` options at the call site. A Locale's dates differ only
 * in its language, so each Locale takes the same formats.
 */
const dateFormats = {
  lastLogin: {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  },
  year: { year: 'numeric' },
  monthYear: { month: 'short', year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export default defineI18nConfig(() => ({
  datetimeFormats: {
    en: dateFormats,
    es: dateFormats,
  },
}))
