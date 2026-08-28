import { describe, expect, it } from 'vitest'

describe('unit project', () => {
  it('runs in Node', () => {
    expect(typeof process.versions.node).toBe('string')
  })

  it('does not provide a DOM', () => {
    expect(globalThis).not.toHaveProperty('document')
  })
})
