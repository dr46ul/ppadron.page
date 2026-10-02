import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('app/assets/css/main.css', 'utf8')

describe('session print', () => {
  it('finds the stylesheet to check', () => {
    expect(css).toContain('.session-print')
  })

  /**
   * `.session-print` wraps an Output's single root, so `> *:nth-child(n)` can
   * only ever match the first child. The stagger comes from the `--i` the list
   * Outputs set on their own items.
   */
  it('indexes no stagger off the position of the Output root', () => {
    expect(css).not.toMatch(/\.session-print\s*>\s*\*:nth-child/)
  })
})
