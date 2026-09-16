import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Terminal from '~/components/session/Terminal.vue'

/**
 * The interactive half of the session, which SSR cannot exercise. Waits are
 * keyed to the per-command think times in useSession.ts: `whoami` is the
 * quickest real command and `mail pavel` the slowest.
 */
const QUICK = 360
const SLOWEST = 760

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
      component.findAll('form').find((form) => form.find('#prompt').exists())!,
    chip: (label: string) =>
      component
        .findAll('button')
        .find((button) => button.text().trim() === label)!,
    async settle(ms = SLOWEST) {
      await sleep(ms)
      await component.vm.$nextTick()
    },
  }
}

describe('session', () => {
  it('prints the whole transcript on load', async () => {
    const { entries } = await mountTerminal()

    expect(entries().length).toBe(5)
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
      await session.settle(QUICK)
    }

    expect(session.entries().length).toBe(14)
    expect(session.component.text()).toMatch(/earlier blocks? dropped/)
  }, 20_000)

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
    await session.settle(QUICK)
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
