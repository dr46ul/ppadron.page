import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { Window } from 'happy-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import { roles } from '../../app/data/experience'
import { profile } from '../../app/data/profile'
import { recommendations } from '../../app/data/recommendations'

/**
 * This project asserts only what only the server render can prove: the
 * document shell, the response, and that the real `app/data` Content reaches
 * the HTML a Visitor is served before any JavaScript runs.
 *
 * It also owns the one thing only a built server can prove about
 * `/api/contact`: that the route is served at that path at all. Everything the
 * route decides is proved in `test/unit`.
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

  /**
   * The transcript block one command printed, found by the command it echoes
   * rather than by its `data-entry` id — the ids are just TOUR's order, and
   * that order is TOUR's to change. Mirrors `output(cmd)` in
   * test/nuxt/session/terminal.test.ts.
   */
  function entry(cmd: string) {
    return [...page.querySelectorAll('[data-entry]')].find(block =>
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

  it('sets html data-theme to terminal', () => {
    expect(page.documentElement.getAttribute('data-theme')).toBe('terminal')
  })

  it('sets the description meta tag', () => {
    expect(meta('description')).toBe('Pavel Padron\'s portfolio')
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
    expect(page.title).toBe('Pavel Padron — Frontend Engineer')
  })

  /**
   * One assertion per seam — the banner, then each of the three data modules
   * in the transcript block that consumes it. Every expected value is read
   * from the module rather than spelled out, so the placeholders can be
   * replaced without touching this file.
   *
   * Each one is scoped to its region. A whole-page assertion here cannot
   * fail: `profile.name` is in the document title and the description, and
   * `'[Company]'` is a field of both `roles` and `recommendations`.
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

    it('prints the Roles in the experience block', () => {
      expect(entry('ls ~/experience')?.textContent).toContain(roles[0]!.period)
    })

    /**
     * The quote, because it is what a Recommendation is — and because every
     * other field this block prints (`name`, `title`, `company`) is a
     * placeholder shared with `roles`, so there is no real-copy field to
     * anchor on here.
     */
    it('prints the Recommendations in the recommendations block', () => {
      expect(entry('cat ~/recommendations')?.textContent).toContain(
        recommendations[0]!.quote,
      )
    })
  })
})

/**
 * The rejection path only, and deliberately: a valid Enquiry posted here would
 * be delivered for real the moment a credential exists in `.env.local`. A body
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
