import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { $fetch, fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'
import { parse as parsePayload } from 'devalue'
import { Window } from 'happy-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import { roles } from '../../app/data/en/experience'
import { profile } from '../../app/data/en/profile'
import { recommendations } from '../../app/data/recommendations'
import en from '../../i18n/locales/en.json'
import { themeScript } from '../../shared/theme'

/**
 * This project asserts only what only the server render can prove: the
 * document shell, the response, and that the real `app/data` Content reaches
 * the HTML a Visitor is served before any JavaScript runs.
 *
 * It also owns the one thing only a built server can prove about
 * `/api/contact`: that the route is served at that path at all. Everything the
 * route decides is proved in `test/unit`.
 *
 * And it owns the one thing only the build can prove about `/`: that it ships
 * as a file. A prerendered page and one rendered per request return the same
 * HTML, so that is read off the build output rather than a response.
 *
 * Per-block wiring and per-field Content belong to `test/nuxt`, which mocks
 * the three data modules and so can never prove that join — the e2e project
 * cannot mock them, which is exactly what makes it the seam for this.
 * See docs/agents/testing.md.
 */

/**
 * A parser, not a browser: the fetched HTML is read as a document so an
 * assertion can be scoped to one region and compare decoded text rather than
 * escaped markup. Script and stylesheet loading stays off — nothing here
 * needs the page to run.
 */
function parse(html: string) {
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  })

  window.document.write(html)

  return window.document
}

await setup()

describe('home page', () => {
  let page: ReturnType<typeof parse>
  let response: Awaited<ReturnType<typeof fetch>>

  beforeAll(async () => {
    response = await fetch('/')
    page = parse(await $fetch<string>('/'))
  })

  function meta(name: string) {
    return page.querySelector(`meta[name="${name}"]`)?.getAttribute('content')
  }

  function property(name: string) {
    return page.querySelector(`meta[property="${name}"]`)?.getAttribute('content')
  }
  /**
   * The transcript block one command printed, found by the command it echoes
   * rather than by its `data-entry` id — the ids are just TOUR's order, and
   * that order is TOUR's to change. Mirrors `output(cmd)` in
   * test/nuxt/session/terminal.test.ts.
   */
  function entry(cmd: string) {
    return [
      ...page.querySelectorAll('[data-entry]'),
    ].find(block =>
      block.querySelector('p')?.textContent?.endsWith(cmd),
    )
  }

  it('responds with HTML', () => {
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('responds with 200', () => {
    expect(response.status).toBe(200)
  })

  it('sets html lang to en', () => {
    expect(page.documentElement.getAttribute('lang')).toBe('en')
  })

  /**
   * No attribute is what lets the stylesheet's `prefers-color-scheme` query
   * choose, with no JavaScript, for a Visitor who never picked a theme.
   */
  it('leaves the theme to the stylesheet rather than naming one', () => {
    expect(page.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('ships the script that applies a saved theme inline in the head, before first paint', () => {
    const inline = [
      ...page.head.querySelectorAll('script:not([src])'),
    ]

    expect(inline.map(script => script.textContent)).toContain(themeScript)
  })

  it('sets the description meta tag from the Message', () => {
    expect(meta('description')).toBe(en.head.description)
  })
  it('names the canonical link after the site\'s base URL', () => {
    expect(
      page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://ppadron.page')
  })
  it('names the Locale in og:locale', () => {
    expect(property('og:locale')).toBe('en')
  })
  it('repeats the title and description in the og tags', () => {
    expect({
      title: property('og:title'),
      description: property('og:description'),
    }).toEqual({
      title: en.head.title,
      description: en.head.description,
    })
  })
  it('names the page\'s own URL in og:url', () => {
    expect(property('og:url')).toBe('https://ppadron.page')
  })
  it('lists only English among the hreflang alternates', () => {
    expect(
      [
        ...page.querySelectorAll('link[rel="alternate"][hreflang]'),
      ]
        .map(link => link.getAttribute('hreflang')),
    ).toEqual(['x-default', 'en'])
  })

  it('sets the charset to utf-8', () => {
    expect(
      page.querySelector('meta[charset]')?.getAttribute('charset')?.toLowerCase(),
    ).toBe('utf-8')
  })

  it('sets the viewport meta tag', () => {
    expect(meta('viewport')).toBe('width=device-width, initial-scale=1')
  })

  it('renders the document title', () => {
    expect(page.title).toBe(en.head.title)
  })

  function icons() {
    return [
      ...page.head.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]'),
    ]
      .map(link => ({
        rel: link.getAttribute('rel'),
        href: link.getAttribute('href'),
      }))
  }

  it('links the favicon, its vector and the Apple touch icon in the head', () => {
    expect(icons()).toEqual([
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'icon', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ])
  })

  it('serves every icon the head links', async () => {
    const statuses = await Promise.all(
      icons().map(async ({ href }) => [href, (await fetch(href ?? '')).status]),
    )

    expect(statuses).toEqual(icons().map(({ href }) => [href, 200]))
  })

  /**
   * One assertion per seam — the banner, then each of the three data modules
   * in the transcript block that consumes it. Every expected value is read
   * from the module rather than spelled out, so Content can change without
   * touching this file.
   *
   * Each one is scoped to its region. A whole-page assertion here cannot
   * fail: `profile.name` is in the document title and the description, and
   * `'Rogue Fitness'` is a field of both `roles` and `recommendations`.
   */
  describe('server-rendered Content', () => {
    it('prints the availability from the Profile in the login banner', () => {
      expect(page.querySelector('[data-banner]')?.textContent).toContain(
        profile.availability.label,
      )
    })

    it('prints the Profile in the whoami block', () => {
      expect(entry('whoami')?.textContent).toContain(profile.headline)
    })

    it('prints the Roles in the experience block, their years in English', () => {
      const { from, to } = roles[0]!

      expect(entry('ls ~/experience')?.textContent).toContain(
        `${from.slice(0, 4)} — ${to?.slice(0, 4) ?? en.period.now}`,
      )
    })

    /**
     * The quote, because it is what a Recommendation is — its last paragraph,
     * so a render that dropped all but the first fails should the lead ever
     * have several. Then every other name, because the rest are listed rather
     * than quoted, and a list missing one would otherwise go unnoticed.
     */
    it('prints the first Recommendation in full and lists the rest in the recommendations block', () => {
      const [lead, ...rest] = recommendations
      const text = entry('cat ~/recommendations')?.textContent ?? ''

      expect([
        lead!.quote.at(-1)!,
        ...rest.map(({ name }) => name),
      ]
        .filter(line => !text.includes(line))).toEqual([])
    })
  })

  /**
   * The build has no Visitor, so the page ships in English and UTC and the
   * browser re-dates it once mounted. The expected context is spelled out
   * rather than imported, so a change to the fallback fails here.
   */
  describe('prerendered dates', () => {
    let builtAt: number

    /**
     * The build's instant, from the inline payload hydration resumes from.
     * Nuxt serialises it with devalue and its own reactive wrappers, which
     * carry nothing a test needs, so each is unwrapped as it is met.
     */
    beforeAll(() => {
      const unwrap = (value: unknown) => value
      const payload = parsePayload(
        page.querySelector('#__NUXT_DATA__')!.textContent!,
        {
          Reactive: unwrap,
          ShallowReactive: unwrap,
          Ref: unwrap,
          ShallowRef: unwrap,
        },
      )
      builtAt = payload.state['$sbuilt-at']
    })

    it('prints the banner for the build, in English and UTC', () => {
      expect(page.querySelector('[data-banner]')?.textContent).toContain(
        en.banner.lastLogin
          .replace('{date}', new Intl.DateTimeFormat('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
            timeZone: 'UTC',
          }).format(builtAt))
          .replace('{tty}', 'ttys002'),
      )
    })

    it('prints the build\'s year in the notice', () => {
      expect(page.querySelector('footer')?.textContent).toContain(
        en.footer.copyright
          .replace('{year}', String(new Date(builtAt).getUTCFullYear()))
          .replace('{name}', profile.name),
      )
    })
  })
})

describe('the build', () => {
  it('prerenders the page to a static file, per ADR-0008', () => {
    const output = useTestContext().nuxt!.options.nitro.output!.dir!

    expect(existsSync(join(output, 'public/index.html'))).toBe(true)
  })
})

/**
 * The rejection path only, and deliberately: a valid Enquiry posted here would
 * be delivered for real the moment a credential exists in `.env`. A body
 * that is not an Enquiry is refused before delivery is ever reached, so no mail
 * can leave and CI needs no credential.
 */
describe('the contact route', () => {
  async function post(body: unknown) {
    return fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('refuses a body that is not an Enquiry', async () => {
    expect((await post({})).status).toBe(400)
  })

  it('refuses a message under the form\'s own minimum', async () => {
    const response = await post({
      name: 'Dana Whitfield',
      email: 'dana@whitfield.example',
      message: 'too short',
    })

    expect(response.status).toBe(400)
  })
})
