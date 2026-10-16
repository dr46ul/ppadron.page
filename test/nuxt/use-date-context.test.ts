import type { DateContext } from '~/utils/date-format'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useDateContext } from '~/composables/useDateContext'
import { formatDate } from '~/utils/date-format'
import { visitFrom } from './visit-from'

const builtAt = Date.UTC(2026, 2, 14, 9, 5, 7)

/**
 * A component that prints the banner's date through the composable, and keeps
 * what it held when setup ran — the only moment before mount a test can see,
 * since `mountSuspended` resolves with the component already mounted.
 */
function probe() {
  const seen: { atSetup?: DateContext } = {}
  const Probe = defineComponent({
    setup() {
      const context = useDateContext()
      seen.atSetup = { ...context.value }

      return () => h('p', formatDate(builtAt, 'lastLogin', context.value))
    },
  })

  return { Probe, seen }
}

describe('useDateContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    document.body.innerHTML = ''
  })

  it('holds the build\'s English and UTC until the page is mounted', async () => {
    visitFrom(['de-DE'], 'Europe/Berlin')
    const { Probe, seen } = probe()
    await mountSuspended(Probe)

    expect(seen.atSetup).toEqual({ locale: 'en', timeZone: 'UTC' })
  })

  it('takes the Visitor\'s language and time zone once mounted', async () => {
    visitFrom(['de-DE', 'en'], 'Europe/Berlin')
    const { Probe } = probe()

    expect((await mountSuspended(Probe)).text()).toBe('Sa., 14. März, 10:05:07 MEZ')
  })

  it('keeps the Visitor\'s time zone when none of their languages will do', async () => {
    visitFrom(['en_US', 'zz'], 'Asia/Tokyo')
    const { Probe } = probe()

    expect((await mountSuspended(Probe)).text()).toBe('Sat, Mar 14, 06:05:07 PM GMT+9')
  })

  /**
   * The build is played by a server render on a machine in English and UTC,
   * then the Visitor's browser, in German and Berlin, hydrates what it served.
   * Reading the browser before mount would render German over English here.
   */
  it('hydrates over the prerendered HTML without a mismatch', async () => {
    visitFrom(['en'], 'UTC')
    const html = await renderToString(createSSRApp(probe().Probe))

    visitFrom(['de-DE'], 'Europe/Berlin')
    const logged = [
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ]
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    const app = createSSRApp(probe().Probe)
    app.mount(root)
    await nextTick()

    const mismatches = logged
      .flatMap(spy => spy.mock.calls)
      .filter(args => String(args[0]).includes('Hydration'))
    expect(mismatches).toEqual([])
    expect(root.textContent).toBe('Sa., 14. März, 10:05:07 MEZ')
    app.unmount()
  })
})
