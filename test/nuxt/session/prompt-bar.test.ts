import type { Scheme } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import type { Profile } from '~/data/profile'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import PromptBar from '~/components/session/PromptBar.vue'
import { roleOf, rolesOf } from '../text-role'

/**
 * Commands and an availability the real Content cannot supply, so nothing here
 * can go green off the component's own markup or the real command list.
 */
const commands: SessionCommand[] = [
  {
    cmd: 'cat ~/vault',
    output: 'whoami',
    label: 'the sealed thing',
    think: 0,
  },
  {
    cmd: 'ls ~/kiln',
    output: 'experience',
    label: 'what was fired',
    think: 0,
  },
]

const metaCommands: MetaCommand[] = [
  { cmd: 'sweep', label: 'empty the hearth' },
]

function mount(props: {
  modelValue?: string
  completion?: string
  availability?: Profile['availability']
  scheme?: Scheme
} = {}) {
  return mountSuspended(PromptBar, {
    props: {
      commands,
      metaCommands,
      modelValue: '',
      availability: { open: true, label: 'Free from the equinox' },
      scheme: 'dark',
      ...props,
    },
  })
}

type Mounted = Awaited<ReturnType<typeof mount>>

function prompt(component: Mounted) {
  return component.find<HTMLInputElement>('#prompt')
}

/** The chip row's buttons, and not the theme switch beside the prompt. */
const CHIPS = '[data-prompt-bar] > div button'

function chip(component: Mounted, cmd: string) {
  return component.findAll(CHIPS).find(button => button.text().trim() === cmd)!
}

/** The dark / light switch beside the prompt. */
function schemeSwitch(component: Mounted) {
  return component.find('[data-scheme-switch]')
}

function schemeButton(component: Mounted, scheme: Scheme) {
  return schemeSwitch(component).findAll('button').find(button => button.text().trim() === scheme)!
}

/** The availability tag, beside the prompt. */
function availability(component: Mounted) {
  return component.find('[data-availability]')
}

/** A real keydown, so whether it was cancelled can be read back. */
function press(component: Mounted, init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  })
  prompt(component).element.dispatchEvent(event)
  return event
}

describe('prompt bar', () => {
  describe('the chips', () => {
    it('lists every command it is handed as a chip, and every meta command after them', async () => {
      const component = await mount()

      expect(component.findAll(CHIPS).map(button => button.text().trim()))
        .toEqual(['cat ~/vault', 'ls ~/kiln', 'sweep'])
    })

    it('wraps onto further rows rather than scrolling a chip out of sight', async () => {
      const component = await mount()
      const row = component.find('[data-prompt-bar] > div')

      expect(['flex-wrap', 'overflow-x-auto'].filter(name => row.classes().includes(name)))
        .toEqual(['flex-wrap'])
    })

    it('titles each chip with what it does', async () => {
      const component = await mount()

      for (const command of [
        ...commands,
        ...metaCommands,
      ])
        expect(chip(component, command.cmd).attributes('title')).toBe(command.label)
    })

    it('describes each chip to a keyboard or screen-reader user', async () => {
      const component = await mount()

      // `title` is a pointer-only tooltip; the description is what reaches
      // focus and touch.
      for (const command of [
        ...commands,
        ...metaCommands,
      ]) {
        const id = chip(component, command.cmd).attributes('aria-describedby')!

        expect(component.find(`#${id}`).text()).toBe(command.label)
      }
    })

    it('runs the command a chip names', async () => {
      const component = await mount()

      await chip(component, 'ls ~/kiln').trigger('click')
      await chip(component, 'sweep').trigger('click')

      expect(component.emitted('run')).toEqual([
        ['ls ~/kiln'],
        ['sweep'],
      ])
    })

    it('keeps a chip click from reaching the session behind it', async () => {
      const component = await mount()
      const behind = vi.fn()
      component.element.parentElement!.addEventListener('click', behind)

      await chip(component, 'cat ~/vault').trigger('click')

      expect(behind).not.toHaveBeenCalled()
    })
  })

  describe('the prompt', () => {
    it('shows the prompt it is handed', async () => {
      const component = await mount({ modelValue: 'cat ~/va' })

      expect(prompt(component).element.value).toBe('cat ~/va')
    })

    it('reports what the Visitor types', async () => {
      const component = await mount()

      await prompt(component).setValue('ls')

      expect(component.emitted('update:modelValue')).toEqual([
        ['ls'],
      ])
    })

    it('runs what the Visitor typed', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await component.find('form').trigger('submit')

      expect(component.emitted('run')).toEqual([
        ['cat ~/vault'],
      ])
    })

    it('holds the prompt at 16px at every width, so iOS never zooms the page', async () => {
      const component = await mount()
      const classes = prompt(component).classes()

      expect(classes.filter(name => name === 'text-base' || name.startsWith('sm:text-')))
        .toEqual(['text-base'])
    })

    it('invites a pick rather than a click', async () => {
      const component = await mount()

      expect(prompt(component).attributes('placeholder')).toBe(
        'type a command, or pick one above',
      )
    })

    it('marks the prompt caret so its focus state can be styled off the input', async () => {
      const component = await mount()

      expect(component.find('#prompt ~ .caret.prompt-caret').exists()).toBe(true)
    })

    it('puts the caret back on the prompt when asked', async () => {
      const component = await mount()
      const focus = vi.spyOn(prompt(component).element, 'focus')

      component.vm.focus()

      expect(focus).toHaveBeenCalled()
    })
  })

  describe('history', () => {
    it.each([
      ['ArrowUp', 1],
      ['ArrowDown', -1],
    ])('asks to recall on %s, and keeps the caret where it was', async (key, offset) => {
      const component = await mount({ modelValue: 'ls' })

      const event = press(component, { key })

      expect({
        recall: component.emitted('recall'),
        prevented: event.defaultPrevented,
      })
        .toEqual({
          recall: [
            [offset],
          ],
          prevented: true,
        })
    })
  })

  describe('keeping the keyboard free', () => {
    it('takes Tab to fill in the completion it is handed', async () => {
      const component = await mount({ modelValue: 'cat ~/v', completion: 'cat ~/vault' })

      const event = press(component, { key: 'Tab' })

      expect({
        prevented: event.defaultPrevented,
        updates: component.emitted('update:modelValue'),
      })
        .toEqual({
          prevented: true,
          updates: [
            ['cat ~/vault'],
          ],
        })
    })

    it('lets Tab move focus on when there is nothing to complete', async () => {
      const component = await mount({ modelValue: 'zzz' })

      const event = press(component, { key: 'Tab' })

      expect({
        prevented: event.defaultPrevented,
        updates: component.emitted('update:modelValue'),
      })
        .toEqual({ prevented: false, updates: undefined })
    })

    it.each([
      'shiftKey',
      'ctrlKey',
      'altKey',
      'metaKey',
    ])(
      'never takes Tab chorded with %s, even with a completion to apply',
      async (modifier) => {
        const component = await mount({ modelValue: 'cat ~/v', completion: 'cat ~/vault' })

        const event = press(component, { key: 'Tab', [modifier]: true })

        expect({
          prevented: event.defaultPrevented,
          updates: component.emitted('update:modelValue'),
        })
          .toEqual({ prevented: false, updates: undefined })
      },
    )
  })

  describe('the availability', () => {
    it('prints the label it is handed rather than a spelling of its own', async () => {
      const component = await mount()

      expect({
        label: availability(component).text(),
        ownSpelling: component.text().includes('Available for freelance'),
      }).toEqual({ label: 'Free from the equinox', ownSpelling: false })
    })

    it('accents the availability while Pavel is open to work', async () => {
      const component = await mount()

      const dot = availability(component).find('span[aria-hidden="true"]')

      expect({
        label: ['text-accent', 'text-subtle'].filter(name => availability(component).classes().includes(name)),
        dot: ['bg-success', 'bg-base-300'].filter(name => dot.classes().includes(name)),
      }).toEqual({
        label: ['text-accent'],
        dot: ['bg-success'],
      })
    })

    it('mutes the availability once he is not', async () => {
      const component = await mount({
        availability: { open: false, label: 'Booked till spring' },
      })
      const dot = availability(component).find('span[aria-hidden="true"]')

      expect({
        text: availability(component).text(),
        label: ['text-accent', 'text-subtle'].filter(name => availability(component).classes().includes(name)),
        dot: ['bg-success', 'bg-base-300'].filter(name => dot.classes().includes(name)),
      }).toEqual({
        text: 'Booked till spring',
        label: ['text-subtle'],
        dot: ['bg-base-300'],
      })
    })
  })

  describe('the theme switch', () => {
    it('offers dark and light, as one labelled group', async () => {
      const component = await mount()

      expect({
        role: schemeSwitch(component).attributes('role'),
        label: schemeSwitch(component).attributes('aria-label'),
        options: schemeSwitch(component).findAll('button').map(button => button.text().trim()),
      }).toEqual({
        role: 'group',
        label: 'Theme',
        options: ['dark', 'light'],
      })
    })

    it.each(['dark', 'light'] as const)('presses %s while it is the theme showing', async (scheme) => {
      const component = await mount({ scheme })
      const other = scheme === 'dark'
        ? 'light'
        : 'dark'

      expect({
        showing: schemeButton(component, scheme).attributes('aria-pressed'),
        other: schemeButton(component, other).attributes('aria-pressed'),
      }).toEqual({ showing: 'true', other: 'false' })
    })

    it('accents the theme showing and steps the other back', async () => {
      const component = await mount({ scheme: 'light' })

      expect({
        showing: schemeButton(component, 'light').classes().includes('text-accent'),
        other: roleOf(component, '[data-scheme-switch] button', 'dark'),
      }).toEqual({ showing: true, other: 'text-muted' })
    })

    it('reports the theme picked', async () => {
      const component = await mount({ scheme: 'dark' })

      await schemeButton(component, 'light').trigger('click')

      expect(component.emitted('update:scheme')).toEqual([
        ['light'],
      ])
    })

    it('keeps a pick from reaching the session, which would pull focus to the prompt', async () => {
      const component = await mount()
      const behind = vi.fn()
      component.element.parentElement!.addEventListener('click', behind)

      await schemeButton(component, 'light').trigger('click')

      expect(behind).not.toHaveBeenCalled()
    })

    it('stays on screen on a phone, where the availability tag is hidden', async () => {
      const component = await mount()

      expect(schemeSwitch(component).classes()).not.toContain('hidden')
    })
  })

  describe('text roles', () => {
    it('sets every chip as a label and the rail they sit on as chrome', async () => {
      const component = await mount()

      // The meta chips are control text too, not a footnote, so they read at
      // the same step as the commands rather than a step below them.
      expect({
        chips: rolesOf(component, CHIPS),
        rail: roleOf(component, 'span', 'Run'),
      })
        .toEqual({
          chips: ['text-muted', 'text-muted', 'text-muted'],
          rail: 'text-subtle',
        })
    })
  })

  describe('edges', () => {
    it('draws every command chip and the bar\'s rule in the control-edge token', async () => {
      const component = await mount()
      const bordered = component.findAll(CHIPS).filter(button =>
        button.classes().includes('border'),
      )

      const edges = (classes: string[]) =>
        ['border-edge', 'border-base-300'].filter(name => classes.includes(name))

      expect({
        chips: bordered.map(button => edges(button.classes())),
        rule: edges(component.classes()),
      }).toEqual({
        chips: commands.map(() => ['border-edge']),
        rule: ['border-edge'],
      })
    })

    it('keeps the chip-row divider on the divider token', async () => {
      const component = await mount()

      expect(component.find('[data-prompt-bar] > div').classes()).toContain('border-base-300')
    })
  })
})
