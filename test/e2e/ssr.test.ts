import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { beforeAll, describe, expect, it } from 'vitest'

function htmlTag(html: string) {
  return html.match(/<html\b[^>]*>/i)?.[0] ?? ''
}

function htmlAttribute(html: string, name: string) {
  return htmlTag(html).match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1]
}

function titleText(html: string) {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1]
}

function metaContent(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const tag = tags.find(entry =>
    new RegExp(`\\bname="${name}"`, 'i').test(entry),
  )

  return tag?.match(/\bcontent="([^"]*)"/i)?.[1]
}

function charset(html: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const tag = tags.find(entry => /charset/i.test(entry))

  return (
    tag?.match(/charset="([^"]*)"/i)?.[1]
    ?? tag?.match(/charset=([^\s>/]+)/i)?.[1]
  )
}

describe('home page', async () => {
  await setup()

  let html = ''
  let response: Awaited<ReturnType<typeof fetch>>

  beforeAll(async () => {
    response = await fetch('/')
    html = await $fetch<string>('/')
  })

  it('responds with HTML', () => {
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('responds with 200', () => {
    expect(response.status).toBe(200)
  })

  it('sets html lang to en', () => {
    expect(htmlAttribute(html, 'lang')).toBe('en')
  })

  it('sets html data-theme to terminal', () => {
    expect(htmlAttribute(html, 'data-theme')).toBe('terminal')
  })

  it('sets the description meta tag', () => {
    expect(metaContent(html, 'description')).toBe('Pavel Padron\'s portfolio')
  })

  it('sets the charset to utf-8', () => {
    expect(charset(html)?.toLowerCase()).toBe('utf-8')
  })

  it('sets the viewport meta tag', () => {
    expect(metaContent(html, 'viewport')).toBe(
      'width=device-width, initial-scale=1',
    )
  })

  it('renders the document title', () => {
    expect(titleText(html)).toBe('Pavel Padron — Frontend Engineer')
  })
})
