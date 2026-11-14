import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useDateContext } from '~/composables/useDateContext'
import { visitFrom } from './visit-from'

const builtAt = Date.UTC(2026, 2, 14, 9, 5, 7)

/**
 * A component that prints the banner's date in the time zone the composable
 * holds, and keeps the zone it held when setup ran — the only moment before
 * mount a test can see, since `mountSuspended` resolves with the component
 * already mounted. The translator is the app's own, taken outside the
 * component so the bare apps of the hydration test can format through it too.
 */
function probe() {
  const { d } = useNuxtApp().$i18n
  const seen: { atSetup?: string } = {}
  const Probe = defineComponent({
    setup() {
      const timeZone = useDateContext()
      seen.atSetup = timeZone.value

      return () => h('p', d(builtAt, { key: 'lastLogin', timeZone: timeZone.value }))
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

  it('holds the build\'s UTC until the page is mounted', async () => {
    visitFrom('Europe/Berlin')
    const { Probe, seen } = probe()
    await mountSuspended(Probe)

    expect(seen.atSetup).toBe('UTC')
  })

  it('takes the Visitor\'s time zone once mounted, in the Session\'s Locale', async () => {
    visitFrom('Asia/Tokyo')
    const { Probe } = probe()

    expect((await mountSuspended(Probe)).text()).toBe('Sat, Mar 14, 06:05:07 PM GMT+9')
  })

  it('never reads the browser\'s language list', async () => {
    visitFrom('Europe/Berlin')
    const languages = vi.spyOn(navigator, 'languages', 'get')
    await mountSuspended(probe().Probe)

    expect(languages).not.toHaveBeenCalled()
  })

  /**
   * The build is played by a server render on a machine in UTC, then the
   * Visitor's browser, in Berlin, hydrates what it served. Reading the browser
   * before mount would render Berlin's time over UTC's here.
   */
  it('hydrates over the prerendered HTML without a mismatch', async () => {
    visitFrom('UTC')
    const html = await renderToString(createSSRApp(probe().Probe))

    visitFrom('Europe/Berlin')
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
    expect({ mismatches, text: root.textContent }).toEqual({
      mismatches: [],
      text: 'Sat, Mar 14, 10:05:07 AM GMT+1',
    })
    app.unmount()
  })
})
