import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  contrast,
  mixInSrgb,
  parseMixShare,
  parseOklchToken,
} from './contrast'

const css = readFileSync('app/assets/css/main.css', 'utf8')

const baseContent = parseOklchToken(css, 'color-base-content')
const base100 = parseOklchToken(css, 'color-base-100')

/**
 * The ratios are the interface audit's, measured against the built page; they
 * are not read back out of the stylesheet, so a token pointed at a different
 * step disagrees with them.
 */
const roles = [
  { token: 'color-body', ratio: 11.63 },
  { token: 'color-muted', ratio: 6.86 },
  { token: 'color-subtle', ratio: 5.07 },
]

describe('text role tokens', () => {
  it.each(roles)('$token renders at $ratio:1 on base-100', ({ token, ratio }) => {
    const share = parseMixShare(css, token)
    const rendered = mixInSrgb(baseContent, base100, share)

    expect(contrast(rendered, base100)).toBeCloseTo(ratio, 2)
  })

  it.each(roles)('$token clears the 4.5:1 every instance needs', ({ token }) => {
    const rendered = mixInSrgb(baseContent, base100, parseMixShare(css, token))

    expect(contrast(rendered, base100)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the control-edge token', () => {
  /**
   * WCAG 1.4.11 asks 3:1 of the boundary that identifies a control. `base-300`
   * measures 1.44:1 and stays a divider, so the stricter role gets a token of
   * its own rather than lightening every rule on the page.
   */
  it('clears the 3:1 a control boundary needs on base-100', () => {
    const edge = parseOklchToken(css, 'color-edge')

    expect(contrast(edge, base100)).toBeGreaterThanOrEqual(3)
  })

  it('stays a hairline rather than a bright rule', () => {
    const edge = parseOklchToken(css, 'color-edge')

    expect(contrast(edge, base100)).toBeLessThan(5)
  })

  it('leaves base-300 alone as the divider', () => {
    const divider = parseOklchToken(css, 'color-base-300')

    expect(contrast(divider, base100)).toBeCloseTo(1.44, 2)
  })
})
