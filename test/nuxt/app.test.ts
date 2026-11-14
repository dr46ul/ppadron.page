import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '~/app.vue'
import ErrorPage from '~/error.vue'
import { en } from './messages'

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
