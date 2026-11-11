import { afterEach, describe, expect, it, vi } from 'vitest'
import { flip } from '~/utils/flip'

/** An element that reports `before` until the change has run, then `after`. */
function landmark(before: DOMRectInit, after: DOMRectInit) {
  const element = document.createElement('div')
  vi.spyOn(element, 'getBoundingClientRect')
    .mockReturnValueOnce(DOMRect.fromRect(before))
    .mockReturnValue(DOMRect.fromRect(after))
  const animate = vi.spyOn(element, 'animate')
  return { element, animate }
}

function prefersReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: matches && query === '(prefers-reduced-motion: reduce)' }))
}

describe('flip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('plays each landmark from where it was to where the change put it', async () => {
    prefersReducedMotion(false)
    const { element, animate } = landmark(
      {
        x: 40,
        y: 300,
        width: 100,
        height: 28,
      },
      { x: 20, y: 100, width: 80, height: 14 },
    )

    await flip(() => new Map([
      ['name', element],
    ]), async () => {})

    expect(animate.mock.calls).toEqual([
      [
        [
          { transform: 'translate(20px, 200px) scale(2)' },
          { transform: 'none' },
        ],
        { duration: 250, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
      ],
    ])
  })

  it('leaves alone a landmark that was not there before the change', async () => {
    prefersReducedMotion(false)
    const { element, animate } = landmark(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 50, width: 10, height: 10 },
    )
    let arrived = false

    await flip(() => new Map(arrived
      ? [
          ['row', element],
        ]
      : []), async () => {
      arrived = true
    })

    expect(animate).not.toHaveBeenCalled()
  })

  it('measures the second time only once the change has finished', async () => {
    prefersReducedMotion(false)
    const element = document.createElement('div')
    const measuredAt: string[] = []
    let state = 'before'
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => {
      measuredAt.push(state)
      return DOMRect.fromRect({ height: 10 })
    })
    vi.spyOn(element, 'animate')

    await flip(() => new Map([
      ['row', element],
    ]), async () => {
      await Promise.resolve()
      state = 'after'
    })

    expect(measuredAt).toEqual(['before', 'after'])
  })

  it('only makes the change when the Visitor prefers reduced motion', async () => {
    prefersReducedMotion(true)
    const { element, animate } = landmark(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 50, width: 10, height: 10 },
    )
    const change = vi.fn(async () => {})

    await flip(() => new Map([
      ['row', element],
    ]), change)

    expect({ changed: change.mock.calls.length, animated: animate.mock.calls.length })
      .toEqual({ changed: 1, animated: 0 })
  })
})
