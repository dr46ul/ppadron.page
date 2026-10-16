import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useVisitedAt } from '~/composables/useVisitedAt'

const builtAt = Date.UTC(2026, 2, 14, 9, 5, 7)
const visit = new Date('2027-01-01T00:00:01Z')

/** Keeps what the composable held when setup ran, before anything mounted. */
function probe() {
  const seen: { atSetup?: number } = {}
  const Probe = defineComponent({
    setup() {
      const visitedAt = useVisitedAt(builtAt)
      seen.atSetup = visitedAt.value

      return () => h('p', visitedAt.value)
    },
  })

  return { Probe, seen }
}

describe('useVisitedAt', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is the build until the page is mounted', async () => {
    vi.useFakeTimers({ now: visit })
    const { Probe, seen } = probe()
    await mountSuspended(Probe)

    expect(seen.atSetup).toBe(builtAt)
  })

  it('is the moment of the visit once mounted', async () => {
    vi.useFakeTimers({ now: visit })
    const { Probe } = probe()

    expect((await mountSuspended(Probe)).text()).toBe(String(visit.getTime()))
  })
})
