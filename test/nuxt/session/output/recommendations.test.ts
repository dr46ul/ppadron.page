import type { Recommendation } from '~/data/recommendations'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Recommendations from '~/components/session/output/Recommendations.vue'

function recommendation(
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    quote: 'Pavel shipped the migration nobody else would touch.',
    name: 'Alex Rivers',
    title: 'Staff Engineer',
    company: 'Acme',
    relationship: 'Worked with Pavel at Acme',
    ...overrides,
  }
}

function mount(recommendations: Recommendation[]) {
  return mountSuspended(Recommendations, { props: { recommendations } })
}

describe('recommendations output', () => {
  it('prints the quote and its attribution', async () => {
    const component = await mount([
      recommendation({
        quote: 'Pavel shipped the migration nobody else would touch.',
        name: 'Alex Rivers',
        title: 'Staff Engineer',
        company: 'Acme',
      }),
    ])

    const text = component.text()
    expect(text).toContain('Pavel shipped the migration nobody else would touch.')
    expect(text).toContain('Alex Rivers')
    expect(text).toContain('Staff Engineer, Acme')
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
      recommendation({ quote: 'He left the codebase better than he found it.' }),
    ])

    expect(component.get('blockquote').text()).toBe(
      'He left the codebase better than he found it.',
    )
  })

  it('numbers the recommendations for the print cascade', async () => {
    const component = await mount([recommendation(), recommendation()])

    expect(component.findAll('li').map(item => item.attributes('style')))
      .toEqual(['--i: 0;', '--i: 1;'])
  })

  it('still says where these come from when it has none', async () => {
    const component = await mount([])

    expect(component.text()).toContain(
      'Verbatim from LinkedIn. Colleagues and managers, not clients.',
    )
    expect(component.findAll('li')).toHaveLength(0)
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount([recommendation()])

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })
})
