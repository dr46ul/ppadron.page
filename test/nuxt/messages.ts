import type enJson from '~~/i18n/locales/en.json'
import enFile from '~~/i18n/locales/en.json?raw'
import esFile from '~~/i18n/locales/es.json?raw'

/**
 * Each Locale's Messages, so an assertion names the Message rather than
 * spelling its copy and a copy edit touches the file alone. Parsed from the raw
 * file because the module compiles a plain JSON import. Lint holds every Locale
 * to English's keys, so Spanish takes English's type.
 */
export const en: typeof enJson = JSON.parse(enFile)
export const es: typeof enJson = JSON.parse(esFile)

/** The form of a two-form plural Message the Visitor reads for a count. */
export function plural(message: string, count: number, params: Record<string, string> = {}) {
  const forms = message.split(' | ')
  return fill(forms[count === 1
    ? 0
    : 1]!, {
    ...params,
    n: String(count),
  })
}

/** A Message with its named parameters filled in, as the visitor reads it. */
export function fill(message: string, params: Record<string, string>) {
  return message.replace(/\{(\w+)\}/g, (_, name: string) => params[name] ?? '')
}

/**
 * A paragraph's text with each element it holds written as `[tag:text]`, so the
 * order of words and elements reads as one string beside the Message.
 */
export function markElements(paragraph: Element) {
  return [...paragraph.childNodes]
    .map(node => node instanceof Element
      ? `[${node.tagName.toLowerCase()}:${node.textContent?.trim()}]`
      : node.textContent)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

type Code = 'en' | 'es'

/** One value per Locale, from that Locale's Messages: what a test expects. */
export function byLocale<T>(make: (locale: typeof en) => T): Record<Code, T> {
  return {
    en: make(en),
    es: make(es),
  }
}

/**
 * A Locale's Messages arrive by dynamic import on its first switch, which no
 * faked clock can run out. Loaded first, every switch after finds them.
 */
export function loadSpanish() {
  return useNuxtApp().$i18n.loadLocaleMessages('es')
}

/**
 * What `read` finds with the Session in each Locale in turn, for a component
 * already mounted, so a test compares every Locale in one object. Back in
 * English afterwards, whatever `read` did.
 */
export async function inEachLocale<T>(read: () => T): Promise<Record<Code, T>> {
  const i18n = useNuxtApp().$i18n
  await loadSpanish()

  async function readIn(code: Code) {
    i18n.locale.value = code
    await nextTick()
    return read()
  }

  try {
    return { en: await readIn('en'), es: await readIn('es') }
  }
  finally {
    i18n.locale.value = 'en'
  }
}
