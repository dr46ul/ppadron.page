import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import KeyCap from '~/components/session/KeyCap.vue'

describe('key cap', () => {
  it('draws the arrow keys and return as glyphs', async () => {
    const drawn = await Promise.all((['up', 'down', 'enter'] as const).map(async (glyph) => {
      const component = await mountSuspended(KeyCap, {
        props: { glyph },
      })
      return component.find('path').attributes('d')
    }))

    expect(drawn).toEqual([
      'M8 13V3M4 7l4-4 4 4',
      'M8 3v10M4 9l4 4 4-4',
      'M13 3v6H3M6 6 3 9l3 3',
    ])
  })

  it('prints a key with no glyph by its name', async () => {
    const component = await mountSuspended(KeyCap, {
      slots: {
        default: () => 'esc',
      },
    })

    expect({
      text: component.text(),
      glyph: component.find('svg').exists(),
    })
      .toEqual({ text: 'esc', glyph: false })
  })

  it('is marked up as a key', async () => {
    const component = await mountSuspended(KeyCap, {
      props: { glyph: 'up' },
    })

    expect(component.element.tagName).toBe('KBD')
  })
})
