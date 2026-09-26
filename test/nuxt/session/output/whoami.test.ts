import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Whoami from '~/components/session/output/Whoami.vue'

/**
 * A Profile the real `app/data/profile.ts` cannot supply. Borrowing the real
 * spelling would go green against the unconverted component, which prints
 * exactly that from its own markup — see the map's Notes.
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
    ...overrides,
  }
}

function mount(overrides: Partial<Profile> = {}) {
  return mountSuspended(Whoami, { props: { profile: profile(overrides) } })
}

describe('whoami output', () => {
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

    expect(component.text()).toContain('Keeps bees, badly.')
    expect(component.findAll('p')).toHaveLength(4)
  })

  it('leaves no empty line behind when the Profile has no aside', async () => {
    const withAside = await mount({ aside: 'Keeps bees, badly.' })
    const without = await mount({ aside: undefined })

    expect(withAside.findAll('p')).toHaveLength(4)
    expect(without.findAll('p')).toHaveLength(3)
  })

  it('prints nothing but the Profile it is handed', async () => {
    const component = await mount()

    const text = component.text()
    expect(text).not.toContain('Pavel Padron')
    expect(text).not.toContain('Frontend engineer')
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount()

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })
})
