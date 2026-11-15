import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '~/app.vue'
import ErrorPage from '~/error.vue'
import { en, es } from './messages'

// The error page can render when the i18n plugin itself failed, so one test
// switches the translator off and the others leave it working.
const translator = vi.hoisted(() => ({ available: true }))

mockNuxtImport('useI18n', original => (...args: unknown[]) => {
  if (!translator.available)
    throw new Error('i18n is not installed')
  return original(...args)
})

describe('app', () => {
  it('mounts the app shell', async () => {
    const component = await mountSuspended(App, { route: '/' })

    expect(component.html()).toBeTruthy()
  })
})

describe('switching language', () => {
  const i18n = () => useNuxtApp().$i18n

  // A Locale's Messages arrive by dynamic import on its first switch, which no
  // faked clock can run out; loaded here, every switch below finds them.
  beforeAll(async () => {
    await i18n().loadLocaleMessages('es')
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(async () => {
    const switched = i18n().setLocale('en')
    await vi.runAllTimersAsync()
    await switched
    vi.useRealTimers()
  })

  /** The whole app at `/`, so the switch crosses the page the router renders. */
  async function mountSession() {
    const component = await mountSuspended(App, { route: '/' })
    const prompt = () => component.get<HTMLInputElement>('#prompt')

    return {
      component,
      prompt,
      echoed: () => component.findAll('[data-entry]').map(entry => entry.find('p').text().replace(/^\$\s*/, '')),
      async run(cmd: string) {
        await prompt().setValue(cmd)
        await prompt().element.form!.requestSubmit()
        await vi.runAllTimersAsync()
        await component.vm.$nextTick()
      },
    }
  }

  it('keeps the Transcript, with each echoed Command where it was', async () => {
    const session = await mountSession()
    await session.run('help')
    const before = session.echoed()

    await session.run('lang es')

    expect({
      path: useRoute().path,
      echoed: session.echoed(),
    })
      .toEqual({ path: '/es', echoed: before })
  })

  it('reprints an echoed Output in the new Locale', async () => {
    const session = await mountSession()
    await session.run('help')

    await session.run('lang es')

    expect(session.component.findAll('[data-entry]').at(-1)!.text()).toContain(es.commands.help)
  })

  it('keeps the prompt history', async () => {
    const session = await mountSession()
    await session.run('help')
    await session.run('lang es')

    const recalled = []
    for (let step = 0; step < 2; step++) {
      await session.prompt().trigger('keydown', { key: 'ArrowUp' })
      recalled.push(session.prompt().element.value)
    }

    expect(recalled).toEqual(['lang es', 'help'])
  })

  it('keeps the Enquiry draft', async () => {
    const session = await mountSession()
    await session.component.get('[name="name"]').setValue('Dagny Vole')

    await session.run('lang es')

    expect(session.component.get<HTMLInputElement>('[name="name"]').element.value).toBe('Dagny Vole')
  })
})

describe('errorPage', () => {
  afterEach(() => {
    translator.available = true
  })

  async function mountNotFound() {
    return mountSuspended(ErrorPage, {
      props: {
        error: createError({
          status: 404,
          statusText: 'Not Found',
          message: 'Not Found',
        }),
      },
    })
  }

  it('renders the error status code', async () => {
    const component = await mountNotFound()

    expect(component.get('h1').text()).toBe('404')
  })

  it('links back home', async () => {
    const component = await mountNotFound()

    expect(component.get('a').attributes('href')).toBe('/')
  })

  it('labels the home link from Messages', async () => {
    const component = await mountNotFound()

    expect(component.get('a').text()).toBe(en.error.home)
  })

  it('labels the home link in English when the translator is unavailable', async () => {
    translator.available = false
    const component = await mountNotFound()

    expect(component.get('a').text()).toBe('Go back home')
  })
})
