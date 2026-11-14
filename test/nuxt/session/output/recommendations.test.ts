import type { Recommendation } from '~/data/recommendations'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Recommendations from '~/components/session/output/Recommendations.vue'
import { en, fill, plural } from '../../messages'
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

  it('prints the first in full and lists the rest by name, in the order handed', async () => {
    const component = await mount([
      recommendation({
        name: 'First',
        quote: ['First said this.'],
      }),
      recommendation({
        name: 'Second',
        quote: ['Second said this.'],
      }),
      recommendation({
        name: 'Third',
        quote: ['Third said this.'],
      }),
    ])

    expect({
      quotes: component.findAll('blockquote').map(quote => quote.text()),
      listed: component.findAll('li').map(item => item.get('[data-name]').text()),
    }).toEqual({
      quotes: ['First said this.'],
      listed: ['Second', 'Third'],
    })
  })

  describe('reading another', () => {
    function three() {
      return mount([
        recommendation({
          name: 'First',
          quote: ['First said this.'],
        }),
        recommendation({
          name: 'Second',
          quote: ['Second said this.'],
        }),
        recommendation({
          name: 'Third',
          quote: ['Third said this.'],
        }),
      ])
    }

    function printed(component: Awaited<ReturnType<typeof three>>) {
      return {
        quotes: component.findAll('blockquote').map(quote => quote.text()),
        listed: component.findAll('li').map(item => item.get('[data-name]').text()),
      }
    }

    it('prints the one picked and puts the one it replaces in its place', async () => {
      const component = await three()

      await component.findAll('li button')[1]!.trigger('click')

      expect(printed(component)).toEqual({
        quotes: ['Third said this.'],
        listed: ['Second', 'First'],
      })
    })

    it('keeps the click from reaching the session behind it', async () => {
      const component = await three()
      const behind = vi.fn()
      component.element.parentElement!.addEventListener('click', behind)

      await component.get('li button').trigger('click')

      expect(behind).not.toHaveBeenCalled()
    })

    describe('in motion', () => {
      afterEach(() => {
        vi.restoreAllMocks()
      })

      /**
       * What moved, named by what it prints. happy-dom lays nothing out, so
       * where each one went is `flip`'s to test; this is which ones go.
       */
      async function moved(component: Awaited<ReturnType<typeof three>>, row: number) {
        const animated: string[] = []
        vi.spyOn(Element.prototype, 'animate').mockImplementation(function (this: Element) {
          animated.push(this.matches('li')
            ? `row: ${this.querySelector('[data-name]')!.textContent}`
            : this.textContent!.trim())
          return new Animation()
        })
        await component.findAll('li button')[row]!.trigger('click')
        return animated.sort()
      }

      it('moves the heading, the rows that stay, and the two names that trade places', async () => {
        const component = await three()

        expect(await moved(component, 1)).toEqual([
          en.recommendations.alsoOnFile,
          'First',
          'row: Second',
          'Third',
        ].sort())
      })

      it('prints the quote that arrives, and fades in the row it leaves behind', async () => {
        const component = await three()

        await component.findAll('li button')[1]!.trigger('click')

        expect({
          quote: component.get('[data-lead]').classes('recommendation-arrive'),
          rows: component.findAll('li').map(item => item.classes('recommendation-arrive')),
        }).toEqual({
          quote: true,
          rows: [false, true],
        })
      })

      it('prints nothing in again for the quote the block opened with', async () => {
        const component = await three()

        expect({
          quote: component.get('[data-lead]').classes('recommendation-arrive'),
          rows: component.findAll('li').map(item => item.classes('recommendation-arrive')),
        }).toEqual({
          quote: false,
          rows: [false, false],
        })
      })
    })

    describe('a quote taller than the screen', () => {
      afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
      })

      /** Where the block's top sits once the swap has laid the new quote out. */
      async function swapWithTopAt(top: number) {
        const component = await three()
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ y: top, height: 20 }))
        vi.spyOn(Element.prototype, 'animate').mockReturnValue(new Animation())
        const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
        await component.findAll('li button')[1]!.trigger('click')
        return scrolled.mock.calls
      }

      it('brings the top of the block back into view, so the quote reads from its start', async () => {
        expect(await swapWithTopAt(-600)).toEqual([
          [
            { block: 'start', behavior: 'smooth' },
          ],
        ])
      })

      it('leaves the page where it is while the top of the block is on screen', async () => {
        expect(await swapWithTopAt(0)).toEqual([])
      })

      it('jumps there rather than gliding when the Visitor prefers reduced motion', async () => {
        vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))

        expect(await swapWithTopAt(-600)).toEqual([
          [
            { block: 'start', behavior: 'auto' },
          ],
        ])
      })
    })

    describe('with text selected', () => {
      afterEach(() => {
        window.getSelection()!.removeAllRanges()
      })

      it('stays put when a pointer drag across a name ends on its row', async () => {
        const component = await three()
        window.getSelection()!.selectAllChildren(component.get('li button').element)

        await component.get('li button').trigger('click', { detail: 1 })

        expect(printed(component).quotes).toEqual(['First said this.'])
      })

      it('still reads from the keyboard, whose click has no pointer behind it', async () => {
        const component = await three()
        window.getSelection()!.selectAllChildren(component.get('blockquote').element)

        await component.get('li button').trigger('click', { detail: 0 })

        expect(printed(component).quotes).toEqual(['Second said this.'])
      })
    })
  })

  describe('the keyboard', () => {
    async function four() {
      return mountSuspended(Recommendations, {
        props: {
          recommendations: ['Lead', 'Second', 'Third', 'Fourth'].map(name =>
            recommendation({
              name,
              quote: [`${name} said this.`],
            })),
        },
        attachTo: document.body,
      })
    }

    function focused() {
      return document.activeElement?.querySelector('[data-name]')?.textContent
    }

    async function walk(keys: string[]) {
      const component = await four()
      component.get<HTMLButtonElement>('li button').element.focus()
      const path: (string | null | undefined)[] = []
      for (const key of keys) {
        await component.get('ul').find(':focus').trigger('keydown', { key })
        path.push(focused())
      }
      component.unmount()
      return path
    }

    it('walks the list with the arrows and stops at either end', async () => {
      expect(await walk([
        'ArrowDown',
        'ArrowDown',
        'ArrowDown',
        'ArrowUp',
        'ArrowUp',
        'ArrowUp',
      ]))
        .toEqual([
          'Third',
          'Fourth',
          'Fourth',
          'Third',
          'Second',
          'Second',
        ])
    })

    it('jumps to either end with Home and End', async () => {
      expect(await walk(['End', 'Home'])).toEqual(['Fourth', 'Second'])
    })

    it('takes the arrows from the page, so they move the list rather than scroll it', async () => {
      const component = await four()
      const button = component.get<HTMLButtonElement>('li button').element
      button.focus()
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })

      button.dispatchEvent(event)
      component.unmount()

      expect(event.defaultPrevented).toBe(true)
    })

    it('leaves every other key to the page', async () => {
      const component = await four()
      const button = component.get<HTMLButtonElement>('li button').element
      button.focus()
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })

      button.dispatchEvent(event)
      component.unmount()

      expect(event.defaultPrevented).toBe(false)
    })

    it('stays on the row it read, which now holds the quote it replaced', async () => {
      const component = await four()
      const third = component.findAll<HTMLButtonElement>('li button')[1]!
      third.element.focus()

      await third.trigger('click', { detail: 0 })
      await nextTick()
      const name = focused()
      component.unmount()

      expect(name).toBe('Lead')
    })
  })

  describe('the list', () => {
    function two() {
      return mount([
        recommendation({ name: 'Lead' }),
        recommendation({
          name: 'Second',
          title: 'Lead UI Developer',
          company: 'Kiln & Ash',
          quote: ['One two  three.', '  Four five.'],
        }),
      ])
    }

    it('is headed as the ones also on file', async () => {
      const component = await two()

      expect(component.get('ul').element.previousElementSibling?.textContent?.trim())
        .toBe(en.recommendations.alsoOnFile)
    })

    it('gives each row its name, title, company and the length of its quote', async () => {
      const component = await two()
      const row = component.get('li button')

      expect({
        name: row.get('[data-name]').text(),
        role: row.get('[data-role]').text(),
        length: row.get('[data-length]').text(),
      }).toEqual({
        name: 'Second',
        role: 'Lead UI Developer, Kiln & Ash',
        length: plural(en.recommendations.words, 5),
      })
    })

    it('counts a one-word quote in the singular', async () => {
      const component = await mount([
        recommendation(),
        recommendation({
          quote: ['Superb.'],
        }),
      ])

      expect(component.get('li [data-length]').text()).toBe(plural(en.recommendations.words, 1))
    })

    it('counts a two-word quote in the plural', async () => {
      const count = 2
      const component = await mount([
        recommendation(),
        recommendation({
          quote: [
            Array.from({ length: count }).fill('word').join(' '),
          ],
        }),
      ])

      expect(component.get('li [data-length]').text()).toBe(plural(en.recommendations.words, count))
    })

    it('says what a row does to a screen reader, ahead of what it shows', async () => {
      const component = await two()

      expect(component.get('li button').text()).toMatch(new RegExp(`^${fill(en.recommendations.read, { name: 'Second' })}`))
    })

    it('shows the keys that walk it, kept out of the accessibility tree', async () => {
      const component = await two()
      const hint = component.get('[data-keys]')

      expect({
        hidden: hint.attributes('aria-hidden'),
        words: [en.recommendations.keyMove, en.recommendations.keyRead].filter(word => !hint.text().includes(word)),
      }).toEqual({ hidden: 'true', words: [] })
    })

    it('is not printed when there is only the one quote', async () => {
      const component = await mount([
        recommendation(),
      ])

      expect({
        list: component.find('ul').exists(),
        keys: component.find('[data-keys]').exists(),
        heading: component.text().includes(en.recommendations.alsoOnFile),
      }).toEqual({ list: false, keys: false, heading: false })
    })
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

  it('numbers the listed recommendations for the print cascade', async () => {
    const component = await mount([
      recommendation(),
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
      text: expect.stringContaining(en.recommendations.provenance),
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

    it('sets a row\'s name at full strength and the rest of the list as chrome', async () => {
      const component = await mount([
        recommendation({ name: 'Lead' }),
        recommendation({ name: 'Second', title: 'Lead UI Developer', company: 'Kiln & Ash' }),
      ])

      expect({
        name: roleOf(component, '[data-name]', 'Second'),
        role: roleOf(component, '[data-role]', 'Lead UI Developer'),
        length: roleOf(component, '[data-length]', plural(en.recommendations.words, 5).replace('5 ', '')),
        heading: roleOf(component, 'p', en.recommendations.alsoOnFile),
        keys: roleOf(component, '[data-keys]', en.recommendations.keyMove),
      }).toEqual({
        name: undefined,
        role: 'text-subtle',
        length: 'text-subtle',
        heading: 'text-subtle',
        keys: 'text-subtle',
      })
    })

    it('sets the provenance note as chrome', async () => {
      const component = await mount([
        recommendation(),
      ])

      expect(roleOf(component, 'p', en.recommendations.provenance)).toBe('text-subtle')
    })
  })
})
