import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('app/assets/css/main.css', 'utf8')

describe('key cap stylesheet', () => {
  it('draws no cap of its own, the library does', () => {
    expect(css).not.toMatch(/\.key-cap\s*\{/)
  })

  it('still draws the strokes of a glyph, which the library has none of', () => {
    expect(css).toMatch(/\.kbd svg\s*\{/)
  })
})
