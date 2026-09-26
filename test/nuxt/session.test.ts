import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Terminal from '~/components/session/Terminal.vue'
import { roles } from '~/data/experience'
import { profile } from '~/data/profile'
import { recommendations } from '~/data/recommendations'

/**
 * The interactive half of the session, which SSR cannot exercise. The machine
 * prints its output behind a per-command think delay, so the clock is faked
 * and run out rather than waited on: the tests stay honest about the delay
 * existing without being coupled to how long any one command takes.
 */
async function mountTerminal() {
  const component = await mountSuspended(Terminal)

  return {
    component,
    entries: () => component.findAll('[data-entry]'),
    /**
     * The transcript contains an Enquiry form of its own, so the prompt has to
     * be identified by the input it wraps rather than by document order.
     */
    promptForm: () =>
      component.findAll('form').find(form => form.find('#prompt').exists())!,
    /**
     * The transcript block one command printed. The banner repeats Content of
     * its own (Pavel's name), so a wiring assertion made against the whole
     * page cannot fail — it has to be scoped to the output under test.
     */
    output: (cmd: string) =>
      component
        .findAll('[data-entry]')
        .find(entry => entry.find('p')!.text().endsWith(cmd))!,
    chip: (label: string) =>
      component
        .findAll('button')
        .find(button => button.text().trim() === label)!,
    /** Run out every pending think delay and let the DOM catch up. */
    async settle() {
      await vi.runAllTimersAsync()
      await component.vm.$nextTick()
    },
  }
}

describe('session', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prints the whole transcript on load', async () => {
    const { entries } = await mountTerminal()

    expect(entries().length).toBe(5)
  })

  it('hands the Roles to the Experience output', async () => {
    const { component } = await mountTerminal()
    const printed = component.findAll('time[datetime]')

    expect(printed).toHaveLength(roles.length)
    expect(printed[0]!.text()).toBe(roles[0]!.period)
  })

  it('hands the Profile to the Whoami output', async () => {
    const { output } = await mountTerminal()
    const whoami = output('whoami').text()

    expect(whoami).toContain(profile.name)
    expect(whoami).toContain(`${profile.headline} · ${profile.location}`)
    expect(whoami).toContain(profile.intro)
  })

  it('hands the Profile to the Colophon output', async () => {
    const { component } = await mountTerminal()
    const hrefs = component.findAll('a').map(link => link.attributes('href'))

    expect(hrefs).toContain(profile.links.repo)
    expect(hrefs).toContain(profile.links.github)
    expect(hrefs).toContain(profile.links.linkedin)
    expect(component.text()).toContain(profile.stack.join(' · '))
  })

  it('hands the Recommendations to the Recommendations output', async () => {
    const { component } = await mountTerminal()
    const printed = component.findAll('blockquote')

    expect(printed).toHaveLength(recommendations.length)
    expect(printed[0]!.text()).toBe(recommendations[0]!.quote)
  })

  it('hands the command list to the Help output', async () => {
    const session = await mountTerminal()

    await session.chip('help').trigger('click')
    await session.settle()

    const help = session.entries().at(-1)!
    for (const command of [...commands, ...metaCommands])
      expect(help.text()).toContain(command.label)
  })

  it('prints output after the think delay when a command is run', async () => {
    const session = await mountTerminal()
    const before = session.entries().length

    await session.chip('help').trigger('click')
    await session.component.vm.$nextTick()

    expect(session.entries().length).toBe(before + 1)

    await session.settle()

    expect(session.component.text()).toContain('empty the scrollback')
  })

  it('resolves plain-word aliases', async () => {
    const session = await mountTerminal()

    await session.component.find('#prompt').setValue('work')
    await session.promptForm().trigger('submit')
    await session.settle()

    expect(session.component.text()).not.toContain('command not found')
    expect(session.entries().at(-1)!.text()).toContain('no projects gallery')
  })

  it('reports a command it does not have', async () => {
    const session = await mountTerminal()

    await session.component.find('#prompt').setValue('sudo rm -rf /')
    await session.promptForm().trigger('submit')
    await session.settle()

    expect(session.component.text()).toContain('command not found')
  })

  it('caps the scrollback and reports what it dropped', async () => {
    const session = await mountTerminal()

    for (let i = 0; i < 14; i++) {
      await session.chip('whoami').trigger('click')
      await session.settle()
    }

    expect(session.entries().length).toBe(14)
    expect(session.component.text()).toMatch(/earlier blocks? dropped/)
  })

  it('keeps a single Enquiry form however often it is run', async () => {
    const session = await mountTerminal()

    await session.chip('mail pavel').trigger('click')
    await session.settle()
    await session.chip('mail pavel').trigger('click')
    await session.settle()

    expect(session.component.findAll('input[type="email"]').length).toBe(1)
  })

  it('empties the scrollback and the banner on clear', async () => {
    const session = await mountTerminal()

    await session.chip('clear').trigger('click')
    await session.component.vm.$nextTick()

    expect(session.entries().length).toBe(0)
    expect(session.component.text()).not.toContain('Last login')
  })

  it('puts the page back as it loaded on reset', async () => {
    const session = await mountTerminal()

    await session.chip('clear').trigger('click')
    await session.component.vm.$nextTick()
    await session.chip('reset').trigger('click')
    await session.component.vm.$nextTick()

    expect(session.entries().length).toBe(5)
    expect(session.component.text()).toContain('Last login')
    expect(session.component.text()).not.toMatch(/earlier blocks? dropped/)
  })

  it('leaves no trace of a reset in the history', async () => {
    const session = await mountTerminal()

    await session.chip('whoami').trigger('click')
    await session.settle()
    await session.chip('reset').trigger('click')
    await session.component.vm.$nextTick()

    const prompt = session.component.find('#prompt')
    await prompt.trigger('keydown', { key: 'ArrowUp' })

    expect((prompt.element as HTMLInputElement).value).toBe('')
  })

  it('completes a part-typed command on Tab', async () => {
    const session = await mountTerminal()
    const prompt = session.component.find('#prompt')

    await prompt.setValue('reco')
    await prompt.trigger('keydown', { key: 'Tab' })

    expect((prompt.element as HTMLInputElement).value).toBe('recommendations')
  })
})
