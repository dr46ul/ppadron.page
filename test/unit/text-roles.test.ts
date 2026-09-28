import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory())
      return vueFiles(path)
    return path.endsWith('.vue') ? [path] : []
  })
}

const components = vueFiles('app/components').map(path => ({
  path,
  source: readFileSync(path, 'utf8'),
}))

describe('text roles', () => {
  it('finds the components to check', () => {
    expect(components.length).toBeGreaterThan(0)
  })

  /**
   * An opacity step is how the improvised ramp got five failing values into the
   * codebase; only a token whose ratio `theme-tokens.test.ts` measures may
   * carry secondary text, so the utility that bypasses it is barred outright.
   */
  it.each(components)('$path sets no text colour by opacity', ({ source }) => {
    expect(source).not.toMatch(/\btext-base-content\/\d+/)
  })

  /**
   * The palette declares no `primary`, `secondary`, `neutral`, `warning` or
   * `info`: they were daisyUI inheritance that rendered no pixels, and a
   * utility naming one now resolves to nothing at all rather than to a colour.
   */
  it.each(components)('$path colours nothing with an undeclared token', ({ source }) => {
    for (const gone of ['primary', 'secondary', 'neutral', 'warning', 'info']) {
      expect(source).not.toMatch(
        new RegExp(`\\b(text|bg|border|ring|fill|stroke|divide)-${gone}\\b`),
      )
    }
  })
})
