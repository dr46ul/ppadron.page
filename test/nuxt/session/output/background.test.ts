import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Background from '~/components/session/output/Background.vue'
import { roleOf } from '../../text-role'

/** A Profile the real `app/data/profile.ts` cannot supply. */
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
    background: [
      'Learned plumbing from a lighthouse keeper.',
      'Moved inland when the light went automatic.',
    ],
    skills: ['soldering', 'patience', 'flux'],
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
  return mountSuspended(Background, { props: { profile: profile(overrides) } })
}

describe('background output', () => {
  it('prints each paragraph of the story as its own paragraph, in order', async () => {
    const component = await mount()

    const paragraphs = component.findAll('p').map(paragraph => paragraph.text())
    const first = paragraphs.indexOf('Learned plumbing from a lighthouse keeper.')
    expect(first).toBeGreaterThan(-1)
    expect(paragraphs[first + 1]).toBe('Moved inland when the light went automatic.')
  })

  it('joins the skills with a middle dot', async () => {
    const component = await mount({ skills: ['soldering', 'patience', 'flux'] })

    expect(component.text()).toContain('soldering · patience · flux')
  })

  it('prints every field of the education', async () => {
    const component = await mount()

    const text = component.text()
    expect(text).toContain('Licence in Hydraulics')
    expect(text).toContain('Faculty of Water')
    expect(text).toContain('University of Reykjavík · 1991')
  })

  it('reads story, then skills, then education', async () => {
    const component = await mount()

    const text = component.text()
    const positions = [
      'Moved inland',
      'soldering',
      'Licence in Hydraulics',
    ].map(value => text.indexOf(value))
    expect(positions).not.toContain(-1)
    expect(positions).toEqual(positions.toSorted((a, b) => a - b))
  })

  it('prints nothing of the Profile that belongs to whoami or the Colophon', async () => {
    const component = await mount()

    const text = component.text()
    expect(text).not.toContain('Systems plumber')
    expect(text).not.toContain('Unblocks the pipes')
    expect(text).not.toContain('fortran')
    expect(text).not.toContain('Pavel Padron')
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount()

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('empty lists', () => {
    it('still prints the skills and education when the story is empty', async () => {
      const component = await mount({ background: [] })

      expect(component.text()).toContain('soldering')
      expect(component.text()).toContain('Licence in Hydraulics')
    })

    it('labels the skills when there are some, and drops the label with them when there are none', async () => {
      const withSkills = await mount({ skills: ['soldering'] })
      const without = await mount({ skills: [] })

      expect(withSkills.text()).toContain('Skills')
      expect(without.text()).not.toContain('Skills')
      expect(without.text()).toContain('Licence in Hydraulics')
    })
  })

  describe('text roles', () => {
    it('sets the story and degree as prose, the labels as labels, the rest as chrome', async () => {
      const component = await mount()

      expect(roleOf(component, 'p', 'Learned plumbing')).toBe('text-body')
      expect(roleOf(component, 'p', 'Licence in Hydraulics')).toBe('text-body')
      expect(roleOf(component, 'p', 'Skills')).toBe('text-muted')
      expect(roleOf(component, 'p', 'Education')).toBe('text-muted')
      expect(roleOf(component, 'p', 'soldering')).toBe('text-subtle')
      expect(roleOf(component, 'p', 'Faculty of Water')).toBe('text-subtle')
      expect(roleOf(component, 'p', 'University of Reykjavík')).toBe('text-subtle')
    })
  })
})
