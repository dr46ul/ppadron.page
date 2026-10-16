/**
 * Every date the Session prints goes through a named format here, never
 * through `Intl` options at the call site. The formats are shaped as vue-i18n
 * `datetimeFormats` entries, so adopting it copies them over unchanged.
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
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateFormat = keyof typeof dateFormats

/** The language and time zone a date is written for. */
export interface DateContext {
  locale: string
  timeZone: string
}

/**
 * What the page is prerendered in: the build has no Visitor, so it prints the
 * page's own language in UTC until the browser says otherwise.
 */
export const buildDateContext: DateContext = { locale: 'en', timeZone: 'UTC' }

export function formatDate(at: number, format: DateFormat, { locale, timeZone }: DateContext) {
  return new Intl.DateTimeFormat(locale, { ...dateFormats[format], timeZone }).format(at)
}

/** The first of the Visitor's languages that `Intl` can format in. */
export function pickLocale(languages: readonly string[]) {
  for (const tag of languages) {
    try {
      const [supported] = Intl.DateTimeFormat.supportedLocalesOf(tag)
      if (supported)
        return supported
    }
    catch {
      // A malformed tag such as `en_US` throws a RangeError rather than being
      // left out, and the next language may still be usable.
    }
  }

  return buildDateContext.locale
}
