import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory())
      return vueFiles(path)
    return path.endsWith('.vue')
      ? [path]
      : []
  })
}

const components = vueFiles('app').map(path => ({
  path,
  source: readFileSync(path, 'utf8'),
}))

describe('focus ring', () => {
  it('finds the components to check', () => {
    expect(components.length).toBeGreaterThan(0)
  })

  /**
   * The ring lives in `@layer base` and a utility lands in `@layer utilities`,
   * which wins at equal specificity: one `outline-none` silently deletes the
   * ring, and nothing in the template says so.
   */
  it.each(components)('$path leaves the ring in main.css alone', ({ source }) => {
    expect(source).not.toMatch(/\boutline-(none|hidden|0)\b/)
  })
})
