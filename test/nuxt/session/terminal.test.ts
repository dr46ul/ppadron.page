import type { Role } from '~/data/experience'
import type { Profile } from '~/data/profile'
import type { Recommendation } from '~/data/recommendations'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Terminal from '~/components/session/Terminal.vue'
import { roleOf } from '../text-role'
import { visitFrom } from '../visit-from'

/**
 * Terminal is the only component that reads `app/data/`, so it takes no props
 * and the data modules are the only seam a wiring test can substitute at.
 *
 * The fixtures below are Content the real `app/data/` cannot supply, so every
 * assertion names a fixture value and checks the real Content has not leaked
 * in. A Terminal that stopped handing an output its prop fails both halves.
 */
const data = vi.hoisted(() => ({
  profile: profileFixture(),
  roles: [roleFixture()],
  recommendations: [recommendationFixture()],
}))

vi.mock('~/data/profile', () => ({ profile: data.profile }))
vi.mock('~/data/experience', () => ({ roles: data.roles }))
vi.mock('~/data/recommendations', () => ({
  recommendations: data.recommendations,
}))

/**
 * Unstubbed, a submit fails because the test runtime mounts none of `server/`,
 * so a failure-path test would pass for that reason alone. Every test that
 * submits an Enquiry names the outcome it wants.
 */
const { post } = vi.hoisted(() => ({ post: vi.fn() }))
mockNuxtImport('$fetch', () => post)

function profileFixture(): Profile {
  return {
    name: 'Wilhelmina Ashgrove',
    headline: 'Systems plumber',
    tagline: 'Unblocks the pipes nobody else will crawl into.',
    location: 'Reykjavík',
    intro: 'Works with teams whose build takes longer than their standup.',
    aside: undefined,
    email: 'wilhelmina@example.test',
    availability: { open: true, label: 'Free from the equinox' },
    links: {
      github: 'https://example.test/gh-ashgrove',
      linkedin: 'https://example.test/li-ashgrove',
      repo: 'https://example.test/repo-ashgrove',
    },
    stack: ['duct tape', 'a longer wrench'],
  }
}

function roleFixture(): Role {
  return {
    company: 'Kiln & Ash',
    title: 'Kiln technician',
    period: '1998 — 2001',
    since: '1998',
    summary: 'Rebuilt the firing schedule so nothing cracked on the way down.',
    tech: ['pyrometry'],
  }
}

function recommendationFixture(): Recommendation {
  return {
    quote: 'He rewired the kiln and never once mentioned it afterwards.',
    name: 'Ingrid Vole',
    title: 'Kiln foreman',
    company: 'Kiln & Ash',
  }
}

/**
 * The machine prints its output behind a per-command think delay, so the clock
 * is faked and run out rather than waited on.
 */
async function mountTerminal() {
  const component = await mountSuspended(Terminal)

  return {
    component,
    entries: () => component.findAll('[data-entry]'),
    /** The login banner, which prints Profile Content of its own. */
    banner: () => component.find('[data-banner]'),
    promptBar: () => component.find('[data-prompt-bar]'),
    /**
     * The availability, which the banner and the prompt bar each print. Both
     * read the one Profile label, so both are asserted together.
     */
    availability: () => component.findAll('[data-availability]'),
    /**
     * The transcript block one command printed. The banner repeats Content
     * that the outputs also print, so a wiring assertion made against the
     * whole page cannot fail — it has to be scoped to the output under test.
     */
    output: (cmd: string) =>
      component
        .findAll('[data-entry]')
        .find(entry => entry.find('p')!.text().endsWith(cmd))!,
    chip: (label: string) =>
      component
        .findAll('button')
        .find(button => button.text().trim() === label)!,
    /**
     * The transcript holds an Enquiry form of its own, so the prompt has to be
     * identified by the input it wraps rather than by document order.
     */
    promptForm: () =>
      component.findAll('form').find(form => form.find('#prompt').exists())!,
    /** The Enquiry form: the only other form on the page. */
    enquiryForm: () =>
      component.findAll('form').find(form => !form.find('#prompt').exists())!,
    async settle() {
      await vi.runAllTimersAsync()
      await component.vm.$nextTick()
    },
    /**
     * A draft the delivery's rules accept, so the outcome under test is the
     * stubbed post's and not the form refusing it.
     */
    async submitEnquiry() {
      await this.chip('mail pavel').trigger('click')
      await this.settle()
      await component.find('[name="name"]').setValue('Dagny Vole')
      await component.find('[name="email"]').setValue('dagny@example.test')
      await component
        .find('[name="message"]')
        .setValue('The kiln wants rewiring before the winter firing.')
      await this.enquiryForm().trigger('submit')
      await this.settle()
    },
    async run(cmd: string) {
      const prompt = component.find<HTMLInputElement>('#prompt')
      await prompt.setValue(cmd)
      await component
        .findAll('form')
        .find(form => form.find('#prompt').exists())!
        .trigger('submit')
      await vi.runAllTimersAsync()
      await component.vm.$nextTick()
    },
  }
}

describe('terminal', () => {
  beforeEach(() => {
    // The banner stamps the session with the time it was built, so the clock
    // is pinned rather than merely faked.
    vi.useFakeTimers({ now: new Date('2026-03-14T09:05:07Z') })
    visitFrom(['en-GB'], 'Europe/London')
    post.mockReset()

    Object.assign(data.profile, profileFixture())
    data.roles.splice(0, data.roles.length, roleFixture())
    data.recommendations.splice(
      0,
      data.recommendations.length,
      recommendationFixture(),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('the login banner', () => {
    it('opens with the Profile name and headline', async () => {
      const { banner } = await mountTerminal()

      expect(banner().text()).toContain('Wilhelmina Ashgrove')
      expect(banner().text()).toContain('Systems plumber')
    })

    it('stamps the session with the time it was built, as the Visitor tells time', async () => {
      visitFrom(['de-DE', 'en'], 'Europe/Berlin')
      const { banner } = await mountTerminal()

      expect(banner().text()).toContain(
        'Last login: Sa., 14. März, 10:05:07 MEZ on ttys002',
      )
    })

    it('names the machine, which is the site and not the Profile', async () => {
      const { banner } = await mountTerminal()

      expect(banner().text()).toContain('ppadron.page')
    })

    it('goes with the scrollback on clear, and comes back on reset', async () => {
      const session = await mountTerminal()

      await session.chip('clear').trigger('click')
      await session.component.vm.$nextTick()

      expect(session.banner().exists()).toBe(false)

      await session.chip('reset').trigger('click')
      await session.component.vm.$nextTick()

      expect(session.banner().exists()).toBe(true)
    })
  })

  describe('the availability', () => {
    it('prints the Profile label rather than a spelling of its own', async () => {
      const { availability, banner, promptBar } = await mountTerminal()

      expect(availability()).toHaveLength(2)
      for (const shown of availability())
        expect(shown.text()).toBe('Free from the equinox')

      // Neither place words the availability itself; these two are what
      // they would say if they did.
      expect(banner().text()).not.toContain('Open for freelance work')
      expect(promptBar().text()).not.toContain('Available for freelance')
    })

    it('separates the label from its own copy, whatever the label ends in', async () => {
      const { banner } = await mountTerminal()

      // The label is Content and may not end in a full stop, so the banner
      // cannot let it run straight into the sentence that follows.
      expect(banner().text()).toContain(
        'Free from the equinox · Everything below is already printed',
      )
    })

    it('accents the availability while Pavel is open to work', async () => {
      const { availability } = await mountTerminal()

      for (const shown of availability()) {
        expect(shown.classes()).toContain('text-accent')
        expect(shown.classes()).not.toContain('text-subtle')
      }
    })

    it('mutes the availability once he is not', async () => {
      data.profile.availability = { open: false, label: 'Booked till spring' }
      const { availability } = await mountTerminal()

      for (const shown of availability()) {
        expect(shown.text()).toBe('Booked till spring')
        expect(shown.classes()).toContain('text-subtle')
        expect(shown.classes()).not.toContain('text-accent')
      }
    })
  })

  describe('what it hands the outputs', () => {
    it('prints the seeded transcript as one block per entry', async () => {
      const { entries } = await mountTerminal()

      expect(entries().length).toBe(5)
    })

    it('keeps no Content of its own', async () => {
      const { component } = await mountTerminal()
      const printed = component.text()

      // Everything the page says about Pavel arrives through `app/data`.
      expect(printed).not.toContain('Pavel Padron')
      expect(printed).not.toContain('Frontend engineer')
      expect(printed).not.toContain('Available for freelance')
      expect(printed).not.toContain('github.com/dr46ul')
    })

    it('hands the Profile to the Whoami output', async () => {
      const { output } = await mountTerminal()
      const whoami = output('whoami').text()

      expect(whoami).toContain('Wilhelmina Ashgrove')
      expect(whoami).toContain('Systems plumber · Reykjavík')
      expect(whoami).toContain(
        'Works with teams whose build takes longer than their standup.',
      )
    })

    it('hands the Roles to the Experience output', async () => {
      const { output } = await mountTerminal()
      const printed = output('ls ~/experience')

      expect(printed.findAll('time[datetime]')).toHaveLength(1)
      expect(printed.find('time[datetime]').text()).toBe('1998 — 2001')
      expect(printed.text()).toContain('Kiln & Ash')
    })

    it('hands the Recommendations to the Recommendations output', async () => {
      const { output } = await mountTerminal()
      const printed = output('cat ~/recommendations')

      expect(printed.findAll('blockquote')).toHaveLength(1)
      expect(printed.find('blockquote').text()).toBe(
        'He rewired the kiln and never once mentioned it afterwards.',
      )
    })

    it('hands the Profile to the Colophon output', async () => {
      const { output } = await mountTerminal()
      const printed = output('cat ~/colophon')
      const hrefs = printed.findAll('a').map(link => link.attributes('href'))

      expect(hrefs).toContain('https://example.test/repo-ashgrove')
      expect(hrefs).toContain('https://example.test/gh-ashgrove')
      expect(hrefs).toContain('https://example.test/li-ashgrove')
      expect(printed.text()).toContain('duct tape · a longer wrench')
    })

    it('dates the Colophon by the visit, and the banner by the build', async () => {
      await mountTerminal()
      vi.setSystemTime(new Date('2027-01-01T00:00:01Z'))

      // The second mount is a visit a year after the build, reading the
      // `built-at` state the first one left behind.
      const { banner, output } = await mountTerminal()

      expect(output('cat ~/colophon').text()).toContain('© 2027')
      expect(banner().text()).toContain('Last login: Sat 14 Mar, 09:05:07 GMT')
    })

    it('dates the Colophon in the Visitor\'s own time zone and digits', async () => {
      vi.setSystemTime(new Date('2026-12-31T23:30:00Z'))
      visitFrom(['ar-EG'], 'Asia/Tokyo')
      const { output } = await mountTerminal()

      expect(output('cat ~/colophon').text()).toContain('© ٢٠٢٧')
    })

    it('hands the command list to the Help output', async () => {
      const session = await mountTerminal()

      await session.chip('help').trigger('click')
      await session.settle()

      const help = session.entries().at(-1)!
      for (const command of [...commands, ...metaCommands])
        expect(help.text()).toContain(command.label)
    })

    it('hands the shared draft to the Contact output', async () => {
      const session = await mountTerminal()

      await session.chip('mail pavel').trigger('click')
      await session.settle()
      await session.component.find('[name="name"]').setValue('Dagny Vole')

      // Running it again replaces the entry, so the form is a fresh instance:
      // the typed name can only come back through the session's own draft.
      await session.chip('mail pavel').trigger('click')
      await session.settle()

      expect(
        session.component.find<HTMLInputElement>('[name="name"]').element.value,
      ).toBe('Dagny Vole')
    })

    it('confirms a sent Enquiry in the Contact output', async () => {
      post.mockResolvedValue({ ok: true })
      const session = await mountTerminal()

      await session.submitEnquiry()

      const contact = session.output('mail pavel')

      expect(contact.find('[role="status"]').text()).toContain('Sent.')
      expect(contact.find('[role="alert"]').exists()).toBe(false)
    })

    it('sends what the Contact output reports, as the delivery will read it', async () => {
      post.mockResolvedValue({ sent: true })
      const session = await mountTerminal()

      await session.chip('mail pavel').trigger('click')
      await session.settle()
      await session.component.find('[name="name"]').setValue('  Dagny   Vole ')
      await session.component.find('[name="email"]').setValue('dagny@example.test')
      await session.component
        .find('[name="message"]')
        .setValue('The kiln wants rewiring before the winter firing.')
      await session.enquiryForm().trigger('submit')
      await session.settle()

      expect(post).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        body: {
          name: 'Dagny Vole',
          email: 'dagny@example.test',
          message: 'The kiln wants rewiring before the winter firing.',
        },
      })
    })

    it('locks the Contact output once its Enquiry has gone', async () => {
      post.mockResolvedValue({ sent: true })
      const session = await mountTerminal()

      await session.submitEnquiry()

      const contact = session.output('mail pavel')

      expect(contact.find('button[type="submit"]').text()).toBe('sent')
      expect(contact.find('[name="name"]').attributes('readonly')).toBeDefined()
    })

    it('hands the Profile address to the Contact output', async () => {
      post.mockRejectedValue(new Error('offline'))
      const session = await mountTerminal()

      await session.submitEnquiry()

      expect(session.component.find('[role="alert"]').text()).toContain(
        'wilhelmina@example.test',
      )
    })

    it('announces the Enquiry result from a single live region', async () => {
      post.mockRejectedValue(new Error('offline'))
      const session = await mountTerminal()

      await session.submitEnquiry()

      // The result's own role is the announcement; a polite region around the
      // Transcript would read it a second time, or not at all.
      expect(
        session.component.find('[role="alert"]').element.closest('[aria-live]'),
      ).toBeNull()
    })

    it('prints the Unknown output for a command it does not have', async () => {
      const session = await mountTerminal()

      await session.run('sudo rm -rf /')

      expect(session.output('sudo rm -rf /').text()).toContain(
        'command not found',
      )
    })

    it('runs help when the Unknown output asks for it', async () => {
      const session = await mountTerminal()

      await session.run('sudo rm -rf /')
      await session.output('sudo rm -rf /').find('button').trigger('click')
      await session.settle()

      expect(session.entries().at(-1)!.text()).toContain('empty the scrollback')
    })
  })

  describe('how it prints a block', () => {
    it('shows a caret while the machine is still thinking', async () => {
      const session = await mountTerminal()

      await session.chip('whoami').trigger('click')
      await session.component.vm.$nextTick()

      const thinking = session.entries().at(-1)!

      expect(thinking.find('.session-busy').exists()).toBe(true)
      expect(thinking.text()).toContain('Working…')
      expect(thinking.find('[role="status"]').text()).toBe('Working…')

      await session.settle()

      expect(session.entries().at(-1)!.find('.session-busy').exists()).toBe(
        false,
      )
    })

    it('animates what the visitor ran and nothing that was seeded', async () => {
      const session = await mountTerminal()

      expect(session.entries().at(0)!.find('.session-print').exists()).toBe(
        false,
      )

      await session.chip('whoami').trigger('click')
      await session.settle()

      expect(session.entries().at(-1)!.find('.session-print').exists()).toBe(
        true,
      )
    })

    it('reports how many blocks the scrollback dropped', async () => {
      const session = await mountTerminal()

      // One over the cap of 14, so exactly one block is dropped.
      for (let i = 0; i < 10; i++) {
        await session.chip('whoami').trigger('click')
        await session.settle()
      }

      expect(session.component.text()).toContain('1 earlier block dropped')
      expect(session.component.text()).toContain('scrollback is 14')

      await session.chip('whoami').trigger('click')
      await session.settle()

      expect(session.component.text()).toContain('2 earlier blocks dropped')
    })

    it('says nothing about the scrollback until it drops something', async () => {
      const { component } = await mountTerminal()

      expect(component.text()).not.toMatch(/earlier blocks? dropped/)
    })
  })

  describe('what it hands the prompt bar', () => {
    it('hands every command and every meta command to the chips', async () => {
      const { promptBar } = await mountTerminal()
      const chips = promptBar()
        .findAll('button')
        .map(button => button.text().trim())

      expect(chips).toEqual([
        ...commands.map(command => command.cmd),
        ...metaCommands.map(command => command.cmd),
      ])
    })

    it('runs the command a chip names', async () => {
      const session = await mountTerminal()

      await session.chip('help').trigger('click')
      await session.settle()

      expect(session.entries().at(-1)!.text()).toContain('this list')
    })

    it('runs what the visitor types at it', async () => {
      const session = await mountTerminal()

      await session.run('help')

      expect(session.output('help').text()).toContain('this list')
    })

    describe('completing on Tab', () => {
      function press(prompt: { element: Element }) {
        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        })
        prompt.element.dispatchEvent(event)
        return event
      }

      it('completes a part-typed command', async () => {
        const { component } = await mountTerminal()
        const prompt = component.find<HTMLInputElement>('#prompt')
        await prompt.setValue('reco')

        expect(press(prompt).defaultPrevented).toBe(true)
        await nextTick()
        expect(prompt.element.value).toBe('recommendations')
      })

      it('moves focus on from a prompt already complete', async () => {
        const { component } = await mountTerminal()
        const prompt = component.find<HTMLInputElement>('#prompt')
        await prompt.setValue('whoami')

        expect(press(prompt).defaultPrevented).toBe(false)
      })
    })

    it('walks back through the history on ArrowUp and forward on ArrowDown', async () => {
      const session = await mountTerminal()

      await session.run('whoami')

      const prompt = session.component.find<HTMLInputElement>('#prompt')

      await prompt.trigger('keydown', { key: 'ArrowUp' })

      expect(prompt.element.value).toBe('whoami')

      await prompt.trigger('keydown', { key: 'ArrowDown' })

      expect(prompt.element.value).toBe('')
    })
  })

  describe('the caret', () => {
    it('goes back to the prompt when the dead space is clicked', async () => {
      const { component } = await mountTerminal()
      const focus = vi.spyOn(
        component.find<HTMLInputElement>('#prompt').element,
        'focus',
      )

      await component.find('[data-entry]').trigger('click')

      expect(focus).toHaveBeenCalled()
    })

    it('leaves the Visitor alone when they have selected text in the transcript', async () => {
      const { component } = await mountTerminal()
      const focus = vi.spyOn(
        component.find<HTMLInputElement>('#prompt').element,
        'focus',
      )
      const selection = window.getSelection()!
      selection.selectAllChildren(component.find('blockquote').element)

      await component.find('[data-entry]').trigger('click')
      selection.removeAllRanges()

      expect(focus).not.toHaveBeenCalled()
    })

    it('does not raise the keyboard when the transcript is tapped on touch', async () => {
      const { component } = await mountTerminal()
      const focus = vi.spyOn(
        component.find<HTMLInputElement>('#prompt').element,
        'focus',
      )

      component
        .find('[data-entry]')
        .element
        .dispatchEvent(new PointerEvent('click', { bubbles: true, pointerType: 'touch' }))

      expect(focus).not.toHaveBeenCalled()
    })

    it('still goes back to the prompt on a mouse click', async () => {
      const { component } = await mountTerminal()
      const focus = vi.spyOn(
        component.find<HTMLInputElement>('#prompt').element,
        'focus',
      )

      component
        .find('[data-entry]')
        .element
        .dispatchEvent(new PointerEvent('click', { bubbles: true, pointerType: 'mouse' }))

      expect(focus).toHaveBeenCalled()
    })

    it('stays put when a chip is clicked, so the page does not jump', async () => {
      const { component, promptBar } = await mountTerminal()
      const focus = vi.spyOn(
        component.find<HTMLInputElement>('#prompt').element,
        'focus',
      )

      await promptBar().find('div').trigger('click')

      expect(focus).not.toHaveBeenCalled()
    })
  })

  describe('text roles', () => {
    it('sets the whole login banner as chrome, bar the domain it is named for', async () => {
      const { banner } = await mountTerminal()

      expect(roleOf(banner(), 'p', 'Last login')).toBe('text-subtle')
      expect(roleOf(banner(), 'span', 'Wilhelmina Ashgrove, Systems plumber')).toBe('text-subtle')
      expect(roleOf(banner(), 'span', 'Everything below is already printed')).toBe('text-subtle')
      expect(roleOf(banner(), 'span', 'ppadron.page')).toBeUndefined()
    })

    it('sets the dropped-blocks notice as chrome', async () => {
      const session = await mountTerminal()

      for (let i = 0; i < 10; i++) {
        await session.chip('whoami').trigger('click')
        await session.settle()
      }

      expect(roleOf(session.component, 'p', 'earlier block dropped')).toBe('text-subtle')
    })
  })

  describe('edges', () => {
    it('keeps the banner rule on the divider token', async () => {
      const { banner } = await mountTerminal()

      expect(banner().classes()).toContain('border-base-300')
    })
  })

  describe('landmarks', () => {
    it('puts the banner and the transcript in main, and the chrome outside it', async () => {
      const { component, banner, promptBar } = await mountTerminal()
      const main = component.find('main')

      expect(component.findAll('main')).toHaveLength(1)
      expect(main.find('[data-banner]').exists()).toBe(true)
      expect(main.find('[data-entry]').exists()).toBe(true)
      expect(main.find('[data-prompt-bar]').exists()).toBe(false)
      expect(main.find('#prompt').exists()).toBe(false)
      expect(banner().exists()).toBe(true)
      expect(promptBar().exists()).toBe(true)
    })

    it('keeps the skip link outside main, pointing at the prompt', async () => {
      const { component } = await mountTerminal()
      const skip = component.find('a[href="#prompt"]')

      expect(skip.text()).toBe('Skip to the prompt')
      expect(component.find('main').find('a[href="#prompt"]').exists()).toBe(false)
    })

    it('titles the page with the name Whoami prints', async () => {
      const { component, entries } = await mountTerminal()

      expect(entries().length).toBeGreaterThan(0)
      expect(component.findAll('h1')).toHaveLength(1)
    })
  })
})
