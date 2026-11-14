import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Footer from '~/components/session/Footer.vue'
import { en, fill } from '../messages'
import { missingClasses } from '../missing-classes'
import { roleOf } from '../text-role'

/**
 * A Profile the real `app/data/profile.ts` cannot supply, so a Footer that
 * printed a name or links of its own could not go green.
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

function mount(overrides: Partial<Profile> = {}, year = '2031') {
  return mountSuspended(Footer, {
    props: {
      profile: profile(overrides),
      year,
    },
  })
}

describe('session footer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('signs the notice with the name it is handed', async () => {
    const component = await mount({ name: 'Dagny Vole' })

    expect(component.find('p').text()).toBe(fill(en.footer.copyright, { year: '2031', name: 'Dagny Vole' }))
  })

  it('links to both profiles it is handed, and not to the repo', async () => {
    const component = await mount()

    expect(component.findAll('a').map(link => link.attributes('href'))).toEqual([
      'https://example.test/gh-wilhelmina',
      'https://example.test/li-wilhelmina',
    ])
  })

  it('draws both profiles as plain links that underline on hover, with the site\'s accent ring', async () => {
    const component = await mount()
    const wanted = ['link', 'link-hover', 'focus-visible:outline-accent']

    expect(component.findAll('a').map(link => missingClasses(link.classes(), wanted)))
      .toEqual([[], []])
  })

  it('opens every link without handing over the window', async () => {
    const component = await mount()

    expect(component.findAll('a').map(link => link.attributes('rel')))
      .toEqual(['noopener', 'noopener'])
  })

  it('dates the notice by the year it is handed, not by the clock', async () => {
    vi.setSystemTime(new Date('2033-06-01T00:00:00Z'))

    expect([
      (await mount({}, '2031')).text(),
      (await mount({}, '2032')).text(),
    ]).toEqual([
      expect.stringContaining(fill(en.footer.copyright, { year: '2031', name: 'Wilhelmina Ashgrove' })),
      expect.stringContaining(fill(en.footer.copyright, { year: '2032', name: 'Wilhelmina Ashgrove' })),
    ])
  })

  it('prints the year in the digits it is handed', async () => {
    expect((await mount({}, '٢٠٢٦')).text()).toContain(fill(en.footer.copyright, { year: '٢٠٢٦', name: 'Wilhelmina Ashgrove' }))
  })

  it('prints nothing but the Profile it is handed', async () => {
    const text = (await mount()).text()

    expect(['Pavel Padron', 'dr46ul'].filter(fact => text.includes(fact)))
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

  it('sets the notice as chrome', async () => {
    expect(roleOf(await mount(), 'p', '©')).toBe('text-subtle')
  })
})
