import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Colophon from '~/components/session/output/Colophon.vue'
import { roleOf } from '../../text-role'

/**
 * A Profile the real `app/data/profile.ts` cannot supply. Every assertion
 * names a fixture value, so a Colophon that printed links of its own instead
 * of the Profile it was handed could not go green.
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
  return mountSuspended(Colophon, {
    props: {
      profile: profile(overrides),
    },
  })
}

/** The href of every link the Colophon prints, in document order. */
function hrefs(component: Awaited<ReturnType<typeof mount>>) {
  return component.findAll('a').map(link => link.attributes('href'))
}

describe('colophon output', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('links to the repo it is handed', async () => {
    const component = await mount({
      links: {
        github: 'https://example.test/gh-wilhelmina',
        linkedin: 'https://example.test/li-wilhelmina',
        repo: 'https://example.test/the-repo',
      },
    })

    expect(hrefs(component)).toContain('https://example.test/the-repo')
  })

  it('spells the repo link out without its scheme', async () => {
    const component = await mount({
      links: {
        github: 'https://example.test/gh-wilhelmina',
        linkedin: 'https://example.test/li-wilhelmina',
        repo: 'https://example.test/the-repo',
      },
    })

    const text = component.text()
    expect({ bare: text, withScheme: text }).toEqual({
      bare: expect.stringContaining('→ example.test/the-repo'),
      withScheme: expect.not.stringContaining('https://example.test/the-repo'),
    })
  })

  it('draws the repo link as the library\'s accent link, underlined on hover', async () => {
    const component = await mount()

    expect(['link', 'link-accent', 'link-hover'].filter(name => !component.get('a').classes().includes(name)))
      .toEqual([])
  })

  it('joins the stack it is handed with a middle dot', async () => {
    const component = await mount({
      stack: ['fortran', 'cobol', 'apl'],
    })

    expect(component.text()).toContain('fortran · cobol · apl')
  })

  it('leaves the stack line out when the Profile lists nothing', async () => {
    const listed = await mount({
      stack: ['fortran'],
    })
    const empty = await mount({ stack: [] })

    expect({
      listed: listed.findAll('p').length,
      empty: empty.findAll('p').length,
      emptyText: empty.text(),
    }).toEqual({
      listed: 3,
      empty: 2,
      emptyText: expect.stringContaining('this page is the work sample'),
    })
  })

  it('links to the repo alone, leaving the profiles to the footer', async () => {
    const component = await mount()

    expect(hrefs(component)).toEqual(['https://example.test/the-repo'])
  })

  it('opens the repo link without handing over the window', async () => {
    const component = await mount()

    expect(component.find('a').attributes('rel')).toBe('noopener')
  })

  it('leaves the copyright notice to the footer', async () => {
    expect((await mount()).text()).not.toContain('©')
  })

  it('prints nothing but the Profile it is handed', async () => {
    const component = await mount()

    const text = component.text()
    expect(['Pavel Padron', 'dr46ul', 'vue · nuxt'].filter(fact => text.includes(fact)))
      .toEqual([])
  })

  it('keeps a link click from reaching the session behind it', async () => {
    const component = await mount()
    const behind = vi.fn()
    component.element.parentElement!.addEventListener('click', behind)

    for (const link of component.findAll('a'))
      await link.trigger('click')

    expect(behind).not.toHaveBeenCalled()
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount()

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('text roles', () => {
    it('sets the lede as prose and the stack as chrome', async () => {
      const component = await mount()

      expect({
        lede: roleOf(component, 'p', 'No projects gallery'),
        stack: roleOf(component, 'p', 'fortran · cobol'),
      }).toEqual({ lede: 'text-body', stack: 'text-subtle' })
    })
  })
})
