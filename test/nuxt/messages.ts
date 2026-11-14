import type enJson from '~~/i18n/locales/en.json'
import enFile from '~~/i18n/locales/en.json?raw'

/**
 * The English Messages, so an assertion names the Message rather than spelling
 * its copy and a copy edit touches the file alone. Parsed from the raw file
 * because the module compiles a plain JSON import.
 */
export const en: typeof enJson = JSON.parse(enFile)

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
