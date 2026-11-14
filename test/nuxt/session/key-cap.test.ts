import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import KeyCap from '~/components/session/KeyCap.vue'
import { en } from '../messages'
import { missingClasses } from '../missing-classes'

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

  it('is the library\'s small key cap', async () => {
    const component = await mountSuspended(KeyCap, {
      slots: {
        default: () => 'esc',
      },
    })

    expect(missingClasses(component.classes(), ['kbd', 'kbd-sm'])).toEqual([])
  })

  it('keeps a glyph key square and its edge even', async () => {
    const component = await mountSuspended(KeyCap, {
      props: { glyph: 'up' },
    })

    expect(missingClasses(component.classes(), ['px-0', 'border-b'])).toEqual([])
  })

  it('centres a named key on its letters', async () => {
    const component = await mountSuspended(KeyCap, {
      slots: {
        default: () => 'esc',
      },
    })

    expect(component.get('span').classes()).toContain('centre-on-letters')
  })

  it('names a glyph key to a screen reader', async () => {
    const names = await Promise.all((['up', 'down', 'enter'] as const).map(async (glyph) => {
      const component = await mountSuspended(KeyCap, {
        props: { glyph },
      })
      return component.get('.sr-only').text()
    }))

    expect(names).toEqual([en.keys.up, en.keys.down, en.keys.enter])
  })
})
