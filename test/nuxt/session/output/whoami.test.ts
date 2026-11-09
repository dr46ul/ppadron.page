import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Whoami from '~/components/session/output/Whoami.vue'
import { roleOf } from '../../text-role'

/**
 * A Profile the real `app/data/profile.ts` cannot supply. Every assertion
 * names a fixture value, so a Whoami that printed copy of its own instead of
 * the Profile it was handed could not go green.
 */
function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'Wilhelmina Ashgrove',
    headline: 'Systems plumber',
    tagline: 'Unblocks the pipes nobody else will crawl into.',
    location: 'Reykjavík',
    intro: 'Works with teams whose build takes longer than their standup.',
    email: 'wilhelmina@example.test',
    availability: { open: false, label: 'Booked until spring' },
    links: {
      github: 'https://example.test/gh-wilhelmina',
      linkedin: 'https://example.test/li-wilhelmina',
      repo: 'https://example.test/the-repo',
    },
    stack: ['fortran', 'cobol'],
    background: ['Learned plumbing from a lighthouse keeper.'],
    skills: ['soldering'],
    education: {
      degree: 'Licence in Hydraulics',
      faculty: 'Faculty of Water',
      institution: 'University of Reykjavík',
      year: '1991',
    },
    ...overrides,
  }
}

function mount(overrides: Partial<Profile> = {}) {
  return mountSuspended(Whoami, {
    props: {
      profile: profile(overrides),
    },
  })
}

describe('whoami output', () => {
  it('prints the name as the page title, in the name step', async () => {
    const component = await mount({ name: 'Wilhelmina Ashgrove' })
    const title = component.find('h1')

    expect({
      text: title.text(),
      classes: title.classes(),
    }).toEqual({
      text: 'Wilhelmina Ashgrove',
      classes: expect.arrayContaining(['text-name', 'font-semibold']),
    })
  })

  it('gives the page no other heading, so the outline stops at the title', async () => {
    const component = await mount()

    expect(component.findAll('h2, h3, h4, h5, h6')).toHaveLength(0)
  })

  it('prints the name it is handed', async () => {
    const component = await mount({ name: 'Wilhelmina Ashgrove' })

    expect(component.text()).toContain('Wilhelmina Ashgrove')
  })

  it('sets the headline against the location on one line', async () => {
    const component = await mount({
      headline: 'Systems plumber',
      location: 'Reykjavík',
    })

    expect(component.text()).toContain('Systems plumber · Reykjavík')
  })

  it('prints the tagline it is handed', async () => {
    const component = await mount({
      tagline: 'Unblocks the pipes nobody else will crawl into.',
    })

    expect(component.text()).toContain(
      'Unblocks the pipes nobody else will crawl into.',
    )
  })

  it('sets the tagline between the headline and the intro', async () => {
    const component = await mount({
      headline: 'Systems plumber',
      location: 'Reykjavík',
      tagline: 'Unblocks the pipes nobody else will crawl into.',
      intro: 'Works with teams whose build takes longer than their standup.',
    })

    expect(component.findAll('h1, p').map(paragraph => paragraph.text())).toEqual([
      'Wilhelmina Ashgrove',
      'Systems plumber · Reykjavík',
      'Unblocks the pipes nobody else will crawl into.',
      'Works with teams whose build takes longer than their standup.',
    ])
  })

  it('prints the intro', async () => {
    const component = await mount({
      intro: 'Works with teams whose build takes longer than their standup.',
    })

    expect(component.text()).toContain(
      'Works with teams whose build takes longer than their standup.',
    )
  })

  it('prints the personal aside when the Profile has one', async () => {
    const component = await mount({
      aside: 'Keeps bees, badly.',
    })

    expect({
      text: component.text(),
      lines: component.findAll('h1, p').length,
    }).toEqual({
      text: expect.stringContaining('Keeps bees, badly.'),
      lines: 5,
    })
  })

  it('leaves no empty line behind when the Profile has no aside', async () => {
    const withAside = await mount({ aside: 'Keeps bees, badly.' })
    const without = await mount({ aside: undefined })

    // The delta is the assertion: exactly one paragraph goes, and the count it
    // goes from is not this test's business.
    expect(without.findAll('p')).toHaveLength(
      withAside.findAll('p').length - 1,
    )
  })

  it('prints nothing but the Profile it is handed', async () => {
    const component = await mount()

    const text = component.text()
    expect(['Pavel Padron', 'Frontend engineer'].filter(fact => text.includes(fact)))
      .toEqual([])
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount()

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('text roles', () => {
    it('steps the byline and the aside back to chrome, and the intro to prose', async () => {
      const component = await mount({ aside: 'Keeps bees, badly.' })

      expect({
        byline: roleOf(component, 'p', 'Systems plumber · Reykjavík'),
        aside: roleOf(component, 'p', 'Keeps bees, badly.'),
        intro: roleOf(component, 'p', 'Works with teams whose build'),
      }).toEqual({ byline: 'text-subtle', aside: 'text-subtle', intro: 'text-body' })
    })

    it('leaves the tagline and the name at full strength', async () => {
      const component = await mount()

      // Full strength is the absence of a step, which is the emphasis device
      // the tagline depends on: it carries more weight than the intro below it.
      expect({
        tagline: roleOf(component, 'p', 'Unblocks the pipes'),
        name: roleOf(component, 'h1', 'Wilhelmina Ashgrove'),
      }).toEqual({ tagline: undefined, name: undefined })
    })
  })
})
