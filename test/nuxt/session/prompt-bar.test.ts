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
  { cmd: 'cat ~/vault', output: 'whoami', label: 'the sealed thing', think: 0 },
  { cmd: 'ls ~/kiln', output: 'experience', label: 'what was fired', think: 0 },
]

const metaCommands: MetaCommand[] = [
  { cmd: 'sweep', label: 'empty the hearth' },
]

function mount(props: {
  modelValue?: string
  completion?: string
  availability?: Profile['availability']
} = {}) {
  return mountSuspended(PromptBar, {
    props: {
      commands,
      metaCommands,
      modelValue: '',
      availability: { open: true, label: 'Free from the equinox' },
      ...props,
    },
  })
}

type Mounted = Awaited<ReturnType<typeof mount>>

function prompt(component: Mounted) {
  return component.find<HTMLInputElement>('#prompt')
}

function chip(component: Mounted, cmd: string) {
  return component.findAll('button').find(button => button.text().trim() === cmd)!
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

      expect(component.findAll('button').map(button => button.text().trim()))
        .toEqual(['cat ~/vault', 'ls ~/kiln', 'sweep'])
    })

    it('wraps onto further rows rather than scrolling a chip out of sight', async () => {
      const component = await mount()
      const row = component.find('[data-prompt-bar] > div')

      expect(row.classes()).toContain('flex-wrap')
      expect(row.classes()).not.toContain('overflow-x-auto')
    })

    it('titles each chip with what it does', async () => {
      const component = await mount()

      for (const command of [...commands, ...metaCommands])
        expect(chip(component, command.cmd).attributes('title')).toBe(command.label)
    })

    it('describes each chip to a keyboard or screen-reader user', async () => {
      const component = await mount()

      // `title` is a pointer-only tooltip; the description is what reaches
      // focus and touch.
      for (const command of [...commands, ...metaCommands]) {
        const id = chip(component, command.cmd).attributes('aria-describedby')!

        expect(component.find(`#${id}`).text()).toBe(command.label)
      }
    })

    it('runs the command a chip names', async () => {
      const component = await mount()

      await chip(component, 'ls ~/kiln').trigger('click')
      await chip(component, 'sweep').trigger('click')

      expect(component.emitted('run')).toEqual([['ls ~/kiln'], ['sweep']])
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

      expect(component.emitted('update:modelValue')).toEqual([['ls']])
    })

    it('runs what the Visitor typed', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await component.find('form').trigger('submit')

      expect(component.emitted('run')).toEqual([['cat ~/vault']])
    })

    it('holds the prompt at 16px on a phone so iOS does not zoom the page', async () => {
      const component = await mount()
      const classes = prompt(component).classes()

      expect(classes).toContain('text-base')
      expect(classes).toContain('sm:text-[0.875rem]')
    })

    it('invites a pick rather than a click', async () => {
      const component = await mount()

      expect(prompt(component).attributes('placeholder')).toBe(
        'type a command, or pick one above',
      )
    })

    it('marks the prompt caret so its focus state can be styled off the input', async () => {
      const component = await mount()
      const caret = component.find('#prompt ~ .caret')

      expect(caret.exists()).toBe(true)
      expect(caret.classes()).toContain('prompt-caret')
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

      expect(component.emitted('recall')).toEqual([[offset]])
      expect(event.defaultPrevented).toBe(true)
    })
  })

  describe('keeping the keyboard free', () => {
    it('takes Tab to fill in the completion it is handed', async () => {
      const component = await mount({ modelValue: 'cat ~/v', completion: 'cat ~/vault' })

      const event = press(component, { key: 'Tab' })

      expect(event.defaultPrevented).toBe(true)
      expect(component.emitted('update:modelValue')).toEqual([['cat ~/vault']])
    })

    it('lets Tab move focus on when there is nothing to complete', async () => {
      const component = await mount({ modelValue: 'zzz' })

      const event = press(component, { key: 'Tab' })

      expect(event.defaultPrevented).toBe(false)
      expect(component.emitted('update:modelValue')).toBeUndefined()
    })

    it.each(['shiftKey', 'ctrlKey', 'altKey', 'metaKey'])(
      'never takes Tab chorded with %s, even with a completion to apply',
      async (modifier) => {
        const component = await mount({ modelValue: 'cat ~/v', completion: 'cat ~/vault' })

        const event = press(component, { key: 'Tab', [modifier]: true })

        expect(event.defaultPrevented).toBe(false)
        expect(component.emitted('update:modelValue')).toBeUndefined()
      },
    )
  })

  describe('the availability', () => {
    it('prints the label it is handed rather than a spelling of its own', async () => {
      const component = await mount()

      expect(availability(component).text()).toBe('Free from the equinox')
      expect(component.text()).not.toContain('Available for freelance')
    })

    it('accents the availability while Pavel is open to work', async () => {
      const component = await mount()

      expect(availability(component).classes()).toContain('text-accent')
      expect(availability(component).classes()).not.toContain('text-subtle')
      expect(availability(component).find('span[aria-hidden="true"]').classes())
        .toContain('bg-success')
    })

    it('mutes the availability once he is not', async () => {
      const component = await mount({
        availability: { open: false, label: 'Booked till spring' },
      })
      const dot = availability(component).find('span[aria-hidden="true"]')

      expect(availability(component).text()).toBe('Booked till spring')
      expect(availability(component).classes()).toContain('text-subtle')
      expect(availability(component).classes()).not.toContain('text-accent')
      expect(dot.classes()).toContain('bg-base-300')
      expect(dot.classes()).not.toContain('bg-success')
    })
  })

  describe('text roles', () => {
    it('sets every chip as a label and the rail they sit on as chrome', async () => {
      const component = await mount()

      // The meta chips are control text too, not a footnote, so they read at
      // the same step as the commands rather than a step below them.
      expect(rolesOf(component, 'button')).toEqual(['text-muted', 'text-muted', 'text-muted'])
      expect(roleOf(component, 'span', 'Run')).toBe('text-subtle')
    })
  })

  describe('edges', () => {
    it('draws every command chip and the bar\'s rule in the control-edge token', async () => {
      const component = await mount()
      const bordered = component.findAll('button').filter(button =>
        button.classes().includes('border'),
      )

      expect(bordered).toHaveLength(commands.length)
      for (const button of bordered) {
        expect(button.classes()).toContain('border-edge')
        expect(button.classes()).not.toContain('border-base-300')
      }
      expect(component.classes()).toContain('border-edge')
      expect(component.classes()).not.toContain('border-base-300')
    })

    it('keeps the chip-row divider on the divider token', async () => {
      const component = await mount()

      expect(component.find('[data-prompt-bar] > div').classes()).toContain('border-base-300')
    })
  })
})
