import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import App from '~/app.vue'
import ErrorPage from '~/error.vue'

describe('App', () => {
  it('mounts the app shell', async () => {
    const component = await mountSuspended(App, { route: '/' })

    expect(component.html()).toBeTruthy()
  })
})

describe('ErrorPage', () => {
  async function mountNotFound() {
    return mountSuspended(ErrorPage, {
      props: {
        error: {
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'Not Found',
        },
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

  it('labels the home link', async () => {
    const component = await mountNotFound()

    expect(component.get('a').text()).toContain('Go back home')
  })
})
