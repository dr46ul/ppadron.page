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
  roles: [
    roleFixture(),
  ],
  recommendations: [
    recommendationFixture(),
  ],
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
const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}))
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
    background: ['Learned plumbing from a lighthouse keeper.'],
    skills: ['soldering'],
    education: {
      degree: 'Licence in Hydraulics',
      faculty: 'Faculty of Water',
      institution: 'University of Reykjavík',
      year: '1991',
    },
  }
}

function roleFixture(): Role {
  return {
    slug: 'kiln-and-ash',
    company: 'Kiln & Ash',
    title: 'Kiln technician',
    period: '1998 — 2001',
    exactPeriod: 'Mar 1998 – Jun 2001',
    since: '1998',
    summary: 'Rebuilt the firing schedule so nothing cracked on the way down.',
    tech: ['pyrometry'],
    account: ['Spent three winters learning what cooling too fast does to glaze.'],
    stack: ['pyrometry', 'cone packs'],
  }
}

function recommendationFixture(): Recommendation {
  return {
    quote: ['He rewired the kiln and never once mentioned it afterwards.'],
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
    vi.useFakeTimers({
      now: new Date('2026-03-14T09:05:07Z'),
    })
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

      const text = banner().text()
      expect([
        'Wilhelmina Ashgrove',
        'Systems plumber',
      ].filter(line => !text.includes(line))).toEqual([])
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

      const afterClear = session.banner().exists()

      await session.chip('reset').trigger('click')
      await session.component.vm.$nextTick()

      expect([
        afterClear,
        session.banner().exists(),
      ]).toEqual([false, true])
    })
  })

  describe('the availability', () => {
    it('prints the Profile label rather than a spelling of its own', async () => {
      const { availability, banner, promptBar } = await mountTerminal()

      expect({
        shown: availability().map(shown => shown.text()),
        // Neither place words the availability itself; these two are what
        // they would say if they did.
        bannerOwnSpelling: banner().text().includes('Open for freelance work'),
        promptBarOwnSpelling: promptBar().text().includes('Available for freelance'),
      }).toEqual({
        shown: ['Free from the equinox', 'Free from the equinox'],
        bannerOwnSpelling: false,
        promptBarOwnSpelling: false,
      })
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

      expect(availability().map(shown =>
        ['text-accent', 'text-subtle'].filter(name => shown.classes().includes(name)),
      )).toEqual([
        ['text-accent'],
        ['text-accent'],
      ])
    })

    it('mutes the availability once he is not', async () => {
      data.profile.availability = { open: false, label: 'Booked till spring' }
      const { availability } = await mountTerminal()

      const muted = {
        text: 'Booked till spring',
        colours: ['text-subtle'],
      }
      expect(availability().map(shown => ({
        text: shown.text(),
        colours: ['text-accent', 'text-subtle'].filter(name => shown.classes().includes(name)),
      }))).toEqual([muted, muted])
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
      expect([
        'Pavel Padron',
        'Frontend engineer',
        'Available for freelance',
        'github.com/dr46ul',
      ].filter(line => printed.includes(line))).toEqual([])
    })

    it('hands the Profile to the Whoami output', async () => {
      const { output } = await mountTerminal()
      const whoami = output('whoami').text()

      expect([
        'Wilhelmina Ashgrove',
        'Systems plumber · Reykjavík',
        'Works with teams whose build takes longer than their standup.',
      ].filter(line => !whoami.includes(line))).toEqual([])
    })

    it('hands the Roles to the Experience output', async () => {
      const { output } = await mountTerminal()
      const printed = output('ls ~/experience')

      expect({
        periods: printed.findAll('time[datetime]').map(time => time.text()),
        text: printed.text(),
      }).toEqual({
        periods: ['1998 — 2001'],
        text: expect.stringContaining('Kiln & Ash'),
      })
    })

    it('hands the Recommendations to the Recommendations output', async () => {
      const { output } = await mountTerminal()
      const printed = output('cat ~/recommendations')

      expect(printed.findAll('blockquote').map(quote => quote.text())).toEqual([
        'He rewired the kiln and never once mentioned it afterwards.',
      ])
    })

    it('hands the Profile to the Colophon output', async () => {
      const { output } = await mountTerminal()
      const printed = output('cat ~/colophon')
      const hrefs = printed.findAll('a').map(link => link.attributes('href'))

      expect({
        hrefs,
        text: printed.text(),
      }).toEqual({
        hrefs: expect.arrayContaining([
          'https://example.test/repo-ashgrove',
          'https://example.test/gh-ashgrove',
          'https://example.test/li-ashgrove',
        ]),
        text: expect.stringContaining('duct tape · a longer wrench'),
      })
    })

    it('dates the Colophon by the visit, and the banner by the build', async () => {
      await mountTerminal()
      vi.setSystemTime(new Date('2027-01-01T00:00:01Z'))

      // The second mount is a visit a year after the build, reading the
      // `built-at` state the first one left behind.
      const { banner, output } = await mountTerminal()

      expect({
        colophon: output('cat ~/colophon').text(),
        banner: banner().text(),
      }).toEqual({
        colophon: expect.stringContaining('© 2027'),
        banner: expect.stringContaining('Last login: Sat 14 Mar, 09:05:07 GMT'),
      })
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
      for (const command of [
        ...commands,
        ...metaCommands,
      ])
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

      expect({
        status: contact.find('[role="status"]').text(),
        alert: contact.find('[role="alert"]').exists(),
      }).toEqual({
        status: expect.stringContaining('Sent.'),
        alert: false,
      })
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

      expect({
        button: contact.find('button[type="submit"]').text(),
        readonly: contact.find('[name="name"]').attributes('readonly') !== undefined,
      }).toEqual({ button: 'sent', readonly: true })
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

      const whileThinking = {
        busy: thinking.find('.session-busy').exists(),
        status: thinking.find('[role="status"]').text(),
      }

      await session.settle()

      expect({
        whileThinking,
        busyOnceDone: session.entries().at(-1)!.find('.session-busy').exists(),
      }).toEqual({
        whileThinking: { busy: true, status: 'Working…' },
        busyOnceDone: false,
      })
    })

    it('animates what the visitor ran and nothing that was seeded', async () => {
      const session = await mountTerminal()

      const seeded = session.entries().at(0)!.find('.session-print').exists()

      await session.chip('whoami').trigger('click')
      await session.settle()

      expect({
        seeded,
        ran: session.entries().at(-1)!.find('.session-print').exists(),
      })
        .toEqual({ seeded: false, ran: true })
    })

    it('reports how many blocks the scrollback dropped', async () => {
      const session = await mountTerminal()

      // One over the cap of 14, so exactly one block is dropped.
      for (let i = 0; i < 10; i++) {
        await session.chip('whoami').trigger('click')
        await session.settle()
      }

      const once = session.component.text()

      await session.chip('whoami').trigger('click')
      await session.settle()

      expect({
        once,
        twice: session.component.text(),
      }).toEqual({
        once: expect.stringMatching(/1 earlier block dropped[\s\S]*scrollback is 14/),
        twice: expect.stringContaining('2 earlier blocks dropped'),
      })
    })

    it('says nothing about the scrollback until it drops something', async () => {
      const { component } = await mountTerminal()

      expect(component.text()).not.toMatch(/earlier blocks? dropped/)
    })
  })

  describe('reading a Role', () => {
    it('hands the Role the Command names to the Role detail output', async () => {
      const session = await mountTerminal()
      data.roles.push({
        ...roleFixture(),
        slug: 'kelp-and-tar',
        since: '1994',
        account: ['Dried kelp on the roof until the tar ran out.'],
      })

      await session.run('cat ~/experience/kelp-and-tar')

      const text = session.output('cat ~/experience/kelp-and-tar').text()
      expect({
        named: text.includes('Dried kelp on the roof until the tar ran out.'),
        other: text.includes('Spent three winters'),
      }).toEqual({ named: true, other: false })
    })

    it('resolves the Role whatever case it was typed in', async () => {
      const session = await mountTerminal()

      await session.run('cat ~/experience/KILN-and-ash')

      expect(session.output('cat ~/experience/KILN-and-ash').text())
        .toContain('Spent three winters learning')
    })

    it('says there is no such file for a name no Role has', async () => {
      const session = await mountTerminal()

      await session.run('cat ~/experience/Nowhere-Inc')

      const text = session.output('cat ~/experience/Nowhere-Inc').text()
      expect({
        noSuchFile: text.includes('~/experience/Nowhere-Inc: No such file or directory'),
        notFound: text.includes('command not found'),
      }).toEqual({ noSuchFile: true, notFound: false })
    })

    it('hands the Profile to the Background output', async () => {
      const session = await mountTerminal()

      await session.chip('cat ~/about').trigger('click')
      await session.settle()

      const text = session.output('cat ~/about').text()
      expect([
        'Learned plumbing from a lighthouse keeper.',
        'soldering',
        'University of Reykjavík',
      ].filter(line => !text.includes(line))).toEqual([])
    })

    describe('from the Experience list', () => {
      function row(session: Awaited<ReturnType<typeof mountTerminal>>) {
        return session.output('ls ~/experience').get('button')
      }

      it('runs the same path as typing it: the Command echoes and prints', async () => {
        const session = await mountTerminal()

        await row(session).trigger('click')
        await session.settle()

        const last = session.entries().at(-1)!
        expect({
          echo: last.find('p').text(),
          output: last.text(),
        }).toEqual({
          echo: expect.stringContaining('cat ~/experience/kiln-and-ash'),
          output: expect.stringContaining('Spent three winters learning'),
        })
      })

      it('goes into the history like anything typed', async () => {
        const session = await mountTerminal()

        await row(session).trigger('click')
        await session.settle()

        const prompt = session.component.find<HTMLInputElement>('#prompt')
        await prompt.trigger('keydown', { key: 'ArrowUp' })

        expect(prompt.element.value).toBe('cat ~/experience/kiln-and-ash')
      })

      it('does not raise the on-screen keyboard on a tap', async () => {
        const session = await mountTerminal()
        const focus = vi.spyOn(
          session.component.find<HTMLInputElement>('#prompt').element,
          'focus',
        )

        row(session).element.dispatchEvent(new PointerEvent('click', { bubbles: true, pointerType: 'touch' }))
        await session.settle()

        expect({
          focused: focus.mock.calls.length,
          echo: session.entries().at(-1)!.find('p').text(),
        })
          .toEqual({
            focused: 0,
            echo: expect.stringContaining('cat ~/experience/kiln-and-ash'),
          })
      })
    })
  })

  describe('what it hands the prompt bar', () => {
    it('hands every command and every meta command to the chips', async () => {
      const { promptBar } = await mountTerminal()
      // The chip row only: the theme switch beside the prompt is buttons too.
      const chips = promptBar()
        .findAll('[data-prompt-bar] > div button')
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

    it('offers a chip for the Background, but none per Role', async () => {
      const session = await mountTerminal()
      const chips = session.promptBar().findAll('button').map(button => button.text())

      expect(chips.filter(chip => chip === 'cat ~/about' || chip.includes('kiln-and-ash')))
        .toEqual(['cat ~/about'])
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

        const prevented = press(prompt).defaultPrevented
        await nextTick()

        expect({ prevented, value: prompt.element.value })
          .toEqual({ prevented: true, value: 'recommendations' })
      })

      it('completes the path of a Role it read from the Content', async () => {
        const { component } = await mountTerminal()
        const prompt = component.find<HTMLInputElement>('#prompt')
        await prompt.setValue('cat ~/experience/k')

        press(prompt)
        await nextTick()

        expect(prompt.element.value).toBe('cat ~/experience/kiln-and-ash')
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
      const back = prompt.element.value

      await prompt.trigger('keydown', { key: 'ArrowDown' })

      expect([back, prompt.element.value]).toEqual(['whoami', ''])
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

      expect({
        login: roleOf(banner(), 'p', 'Last login'),
        byline: roleOf(banner(), 'span', 'Wilhelmina Ashgrove, Systems plumber'),
        hint: roleOf(banner(), 'span', 'Everything below is already printed'),
        domain: roleOf(banner(), 'span', 'ppadron.page'),
      }).toEqual({
        login: 'text-subtle',
        byline: 'text-subtle',
        hint: 'text-subtle',
        domain: undefined,
      })
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

  describe('the theme', () => {
    const html = document.documentElement

    function systemPrefers(scheme: 'dark' | 'light') {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === `(prefers-color-scheme: ${scheme})`,
      }))
    }

    function pressed(component: Awaited<ReturnType<typeof mountTerminal>>['component']) {
      return component
        .findAll('[data-scheme-switch] button')
        .filter(button => button.attributes('aria-pressed') === 'true')
        .map(button => button.text().trim())
    }

    afterEach(() => {
      delete html.dataset.theme
      localStorage.clear()
      clearNuxtState('scheme')
      vi.unstubAllGlobals()
    })

    it('shows the theme the system asked for once mounted', async () => {
      systemPrefers('light')
      const { component } = await mountTerminal()
      await component.vm.$nextTick()

      expect(pressed(component)).toEqual(['light'])
    })

    it('shows a theme chosen on an earlier visit once mounted', async () => {
      systemPrefers('dark')
      html.dataset.theme = 'teletype'
      const { component } = await mountTerminal()
      await component.vm.$nextTick()

      expect(pressed(component)).toEqual(['light'])
    })

    it('repaints the page from the switch', async () => {
      systemPrefers('dark')
      const { component } = await mountTerminal()

      await component.find('[data-scheme-switch] button:last-of-type').trigger('click')

      expect({
        theme: html.dataset.theme,
        pressed: pressed(component),
      })
        .toEqual({
          theme: 'teletype',
          pressed: ['light'],
        })
    })

    it('keeps the switch in step with the theme chip', async () => {
      systemPrefers('dark')
      const session = await mountTerminal()

      await session.chip('theme').trigger('click')
      await session.settle()

      expect({
        theme: html.dataset.theme,
        pressed: pressed(session.component),
      })
        .toEqual({
          theme: 'teletype',
          pressed: ['light'],
        })
    })

    it('keeps the switch in step with a theme typed at the prompt', async () => {
      systemPrefers('light')
      const session = await mountTerminal()

      await session.run('dark')

      expect({
        theme: html.dataset.theme,
        pressed: pressed(session.component),
      })
        .toEqual({
          theme: 'terminal',
          pressed: ['dark'],
        })
    })
  })

  describe('the command line over each block', () => {
    function label(block: ReturnType<Awaited<ReturnType<typeof mountTerminal>>['output']>) {
      return block.find('[data-entry-label]')
    }

    it('says what the command does', async () => {
      const { output } = await mountTerminal()

      expect(label(output('ls ~/experience')).text()).toBe('the work itself')
    })

    it('says what an alias resolved to', async () => {
      const session = await mountTerminal()

      await session.run('work')

      expect(label(session.output('work')).text()).toBe('the work itself')
    })

    it('says nothing over a command that does not exist', async () => {
      const session = await mountTerminal()

      await session.run('zzz')

      expect(label(session.output('zzz')).exists()).toBe(false)
    })

    it('keeps the label out of the line the command is echoed on', async () => {
      const { output } = await mountTerminal()

      expect(output('ls ~/experience').find('p').text()).not.toContain('the work itself')
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

      expect({
        mains: component.findAll('main').length,
        inMain: {
          banner: main.find('[data-banner]').exists(),
          transcript: main.find('[data-entry]').exists(),
          promptBar: main.find('[data-prompt-bar]').exists(),
          prompt: main.find('#prompt').exists(),
        },
        onPage: {
          banner: banner().exists(),
          promptBar: promptBar().exists(),
        },
      }).toEqual({
        mains: 1,
        inMain: {
          banner: true,
          transcript: true,
          promptBar: false,
          prompt: false,
        },
        onPage: { banner: true, promptBar: true },
      })
    })

    it('keeps the skip link outside main, pointing at the prompt', async () => {
      const { component } = await mountTerminal()
      const skip = component.find('a[href="#prompt"]')

      expect({
        text: skip.text(),
        inMain: component.find('main').find('a[href="#prompt"]').exists(),
      }).toEqual({ text: 'Skip to the prompt', inMain: false })
    })

    it('titles the page with the name Whoami prints', async () => {
      const { component, entries } = await mountTerminal()

      expect({ printed: entries().length > 0, titles: component.findAll('h1').length })
        .toEqual({ printed: true, titles: 1 })
    })
  })
})
