import type { Recommendation } from '~/data/recommendations'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Recommendations from '~/components/session/output/Recommendations.vue'
import { roleOf } from '../../text-role'

function recommendation(
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    quote: ['Pavel shipped the migration nobody else would touch.'],
    name: 'Alex Rivers',
    title: 'Staff Engineer',
    company: 'Acme',
    ...overrides,
  }
}

function mount(recommendations: Recommendation[]) {
  return mountSuspended(Recommendations, {
    props: { recommendations },
  })
}

describe('recommendations output', () => {
  it('prints the quote and its attribution', async () => {
    const component = await mount([
      recommendation({
        quote: ['Pavel shipped the migration nobody else would touch.'],
        name: 'Alex Rivers',
        title: 'Staff Engineer',
        company: 'Acme',
      }),
    ])

    const text = component.text()
    expect([
      'Pavel shipped the migration nobody else would touch.',
      'Alex Rivers',
      'Staff Engineer, Acme',
    ].filter(line => !text.includes(line))).toEqual([])
  })

  it('keeps the order it was handed', async () => {
    const component = await mount([
      recommendation({ name: 'First' }),
      recommendation({ name: 'Second' }),
      recommendation({ name: 'Third' }),
    ])

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('First'),
      expect.stringContaining('Second'),
      expect.stringContaining('Third'),
    ])
  })

  it('quotes each recommendation as a blockquote', async () => {
    const component = await mount([
      recommendation({
        quote: ['He left the codebase better than he found it.'],
      }),
    ])

    expect(component.get('blockquote').text()).toBe(
      'He left the codebase better than he found it.',
    )
  })

  it('keeps a long quote\'s paragraph breaks inside its one blockquote', async () => {
    const component = await mount([
      recommendation({
        quote: ['He rewrote the build.', 'Then he taught us how it worked.'],
      }),
    ])

    expect(component.findAll('blockquote').map(quote =>
      quote.findAll('p').map(paragraph => paragraph.text()),
    )).toEqual([
      ['He rewrote the build.', 'Then he taught us how it worked.'],
    ])
  })

  it('numbers the recommendations for the print cascade', async () => {
    const component = await mount([
      recommendation(),
      recommendation(),
    ])

    expect(component.findAll('li').map(item => item.attributes('style')))
      .toEqual(['--i: 0;', '--i: 1;'])
  })

  it('still says where these come from when it has none', async () => {
    const component = await mount([])

    expect({
      text: component.text(),
      items: component.findAll('li').length,
    }).toEqual({
      text: expect.stringContaining('Verbatim from LinkedIn. Colleagues and managers, not clients.'),
      items: 0,
    })
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount([
      recommendation(),
    ])

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('text roles', () => {
    it('sets the quote and the name as prose, the rest as chrome', async () => {
      const component = await mount([
        recommendation({
          quote: ['Pavel shipped the migration nobody else would touch.'],
          name: 'Alex Rivers',
          title: 'Staff Engineer',
          company: 'Acme',
        }),
      ])

      expect({
        quote: roleOf(component, 'blockquote', 'Pavel shipped'),
        // The name has to carry out of the attribution line it sits inside, and
        // colour is the only device distinguishing it from the title beside it.
        name: roleOf(component, 'span', 'Alex Rivers'),
        attribution: roleOf(component, 'p', 'Staff Engineer, Acme'),
      }).toEqual({ quote: 'text-body', name: 'text-body', attribution: 'text-subtle' })
    })

    it('sets the provenance note as chrome', async () => {
      const component = await mount([
        recommendation(),
      ])

      expect(roleOf(component, 'p', 'Verbatim from LinkedIn')).toBe('text-subtle')
    })
  })
})
