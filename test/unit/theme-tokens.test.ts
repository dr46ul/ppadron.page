import type { Srgb } from './contrast'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { THEMES } from '../../shared/theme'
import { contrast, mixInSrgb, parseOklchToken } from './contrast'

const css = readFileSync('app/assets/css/main.css', 'utf8')

/** The declarations inside one `@plugin "daisyui/theme" { name: … }` block. */
function themeBlock(name: string) {
  const block = [
    ...css.matchAll(/@plugin\s+"daisyui\/theme"\s*\{([^}]*)\}/g),
  ]
    .map(match => match[1]!)
    .find(body => new RegExp(`name:\\s*'${name}'`).test(body))
  if (!block)
    throw new Error(`no daisyUI theme named ${name}`)
  return block
}

const themes = Object.entries(THEMES).map(([scheme, name]) => {
  const block = themeBlock(name)
  const token = (t: string) => parseOklchToken(block, t)
  const page = token('color-base-100')

  return {
    scheme,
    name,
    block,
    token,
    page,
    // The prompt bar is `bg-base-200/95` over the page, and the chips sit on it.
    bar: mixInSrgb(token('color-base-200'), page, 0.95),
  }
})

/** Text has to read on the page and on the prompt bar the chips sit on. */
function surfaces(theme: (typeof themes)[number]): [string, Srgb][] {
  return [
    ['the page', theme.page],
    ['the prompt bar', theme.bar],
  ]
}

describe.each(themes)('the $scheme theme ($name)', (theme) => {
  it.each([
    'color-base-content',
    'color-body',
    'color-muted',
    'color-subtle',
    'color-accent',
    'color-success',
    'color-error',
  ])('sets %s at the 4.5:1 text needs at every size here', (token) => {
    for (const [, surface] of surfaces(theme))
      expect(contrast(theme.token(token), surface)).toBeGreaterThanOrEqual(4.5)
  })

  /**
   * Paper-white on near-black measured 18:1 and smeared at the edges for
   * readers with astigmatism. The strongest text stays below that glare and
   * still clears AAA's 7:1 with room to spare.
   */
  it('holds its strongest text under the glare of pure white on black', () => {
    const ratio = contrast(theme.token('color-base-content'), theme.page)

    expect(ratio).toBeLessThan(16.5)
    expect(ratio).toBeGreaterThan(12)
  })

  it('steps text back in order: body under content, the quiet roles under body', () => {
    const ratio = (t: string) => contrast(theme.token(t), theme.page)

    expect(ratio('color-body')).toBeLessThan(ratio('color-base-content'))
    expect(ratio('color-muted')).toBeLessThan(ratio('color-body'))
    expect(ratio('color-subtle')).toBeLessThanOrEqual(ratio('color-muted'))
  })

  it('keeps a filled accent button readable', () => {
    expect(contrast(theme.token('color-accent-content'), theme.token('color-accent')))
      .toBeGreaterThanOrEqual(4.5)
  })

  /** WCAG 1.4.11 asks 3:1 of the boundary that identifies a control. */
  it('draws control edges at the 3:1 a boundary needs, and no brighter than a hairline', () => {
    for (const [, surface] of surfaces(theme)) {
      const ratio = contrast(theme.token('color-edge'), surface)

      expect(ratio).toBeGreaterThanOrEqual(3)
      expect(ratio).toBeLessThan(5)
    }
  })

  it('keeps the divider quieter than a control edge', () => {
    expect(contrast(theme.token('color-base-300'), theme.page))
      .toBeLessThan(contrast(theme.token('color-edge'), theme.page))
  })
})

describe('switching theme', () => {
  /** A theme's declarations other than its colours and the plugin's own flags. */
  function nonColour(block: string) {
    return [
      ...block.matchAll(/(--[\w-]+):\s*([^;\s][^;]*);/g),
    ]
      .map(([, name, value]) => `${name}: ${value!.trim()}`)
      .filter(declaration => !declaration.startsWith('--color-'))
  }

  /**
   * The page keeps its typeface, sizes and spacing when the theme changes, so
   * nothing reflows under the Visitor's eyes: a theme is a palette and only a
   * palette.
   */
  it('changes the colours and nothing else', () => {
    const [first, ...rest] = themes.map(theme => nonColour(theme.block))

    for (const other of rest)
      expect(other).toEqual(first)
  })

  it('carries no typeface or type size, so neither can differ by theme', () => {
    for (const theme of themes)
      expect(theme.block).not.toMatch(/--(font|leading|text)-[\w-]*:/)
  })
})

describe('which theme a Visitor who never chose is shown', () => {
  it('is the teletype by default', () => {
    expect(themeBlock(THEMES.light)).toMatch(/default:\s*true/)
    expect(themeBlock(THEMES.dark)).not.toMatch(/default:\s*true/)
  })

  it('is the terminal when the system prefers dark', () => {
    expect(themeBlock(THEMES.dark)).toMatch(/prefersdark:\s*true/)
    expect(themeBlock(THEMES.light)).not.toMatch(/prefersdark:\s*true/)
  })

  it.each(Object.entries(THEMES))('tells the browser %s, so form controls and scrollbars match', (scheme, name) => {
    expect(themeBlock(name)).toMatch(new RegExp(`color-scheme:\\s*${scheme}`))
  })
})
