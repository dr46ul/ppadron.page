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
