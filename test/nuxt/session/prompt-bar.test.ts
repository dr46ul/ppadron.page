import type { ThemeChoice } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CommandPalette from '~/components/session/CommandPalette.vue'
import PromptBar from '~/components/session/PromptBar.vue'

/**
 * Commands the real Content cannot supply, so nothing here can go green off
 * the component's own markup or the real command list.
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

function recognises(typed: string) {
  return typed === 'kiln --hot'
}

function mount(props: {
  modelValue?: string
  completion?: string
  theme?: ThemeChoice
} = {}) {
  return mountSuspended(PromptBar, {
    attachTo: document.body,
    props: {
      commands,
      metaCommands,
      recognises,
      modelValue: '',
      theme: 'system',
      ...props,
    },
  })
}

type Mounted = Awaited<ReturnType<typeof mount>>

function prompt(component: Mounted) {
  return component.find<HTMLInputElement>('#prompt')
}

/**
 * The text the block caret is set after. It is laid out in the prompt's own
 * font, so its width is how far along the prompt the block is drawn.
 */
function beforeCaret(component: Mounted) {
  return component.find('[data-before-caret]').element.textContent
}

function underCaret(component: Mounted) {
  return component.find('.prompt-caret').element.textContent
}

/**
 * Puts the insertion point where an arrow key or a click would. A browser then
 * fires `selectionchange`; happy-dom does not, so it is fired here.
 */
async function moveInsertion(component: Mounted, start: number, end = start, direction: 'forward' | 'backward' = 'forward') {
  prompt(component).element.setSelectionRange(start, end, direction)
  document.dispatchEvent(new Event('selectionchange'))
  await nextTick()
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

/** A shortcut pressed with focus anywhere, so it reaches the document. */
function chord(init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  })
  document.body.dispatchEvent(event)
  return event
}

function commandsButton(component: Mounted) {
  return component.find('[data-commands]')
}

function palette(component: Mounted) {
  return component.findComponent(CommandPalette)
}

function isOpen(component: Mounted) {
  return palette(component).find<HTMLDialogElement>('dialog').element.open
}

// Each one listens on the document for the shortcut, so one left mounted would
// answer a chord meant for the next.
enableAutoUnmount(afterEach)

describe('prompt bar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('the commands button', () => {
    it('says what it opens', async () => {
      const component = await mount()

      expect({
        text: commandsButton(component).find('[data-word]').text(),
        popup: commandsButton(component).attributes('aria-haspopup'),
      }).toEqual({ text: 'commands', popup: 'dialog' })
    })

    it('opens the palette', async () => {
      const component = await mount()

      await commandsButton(component).trigger('click')

      expect(isOpen(component)).toBe(true)
    })

    it('keeps its click from reaching the session, which would pull focus to the prompt', async () => {
      const component = await mount()
      const behind = vi.fn()
      document.body.addEventListener('click', behind)

      await commandsButton(component).trigger('click')
      document.body.removeEventListener('click', behind)

      expect(behind).not.toHaveBeenCalled()
    })
  })

  describe('the shortcut', () => {
    it.each(['metaKey', 'ctrlKey'])('opens the palette on K with %s, and keeps the browser from taking it', async (modifier) => {
      const component = await mount()

      const event = chord({ key: 'k', [modifier]: true })
      await nextTick()

      expect({
        open: isOpen(component),
        prevented: event.defaultPrevented,
      })
        .toEqual({ open: true, prevented: true })
    })

    it.each([
      [
        'K alone',
        { key: 'k' },
      ],
      [
        'another key with the modifier',
        { key: 'j', metaKey: true },
      ],
    ])('leaves %s alone', async (_, init) => {
      const component = await mount()

      const event = chord(init)
      await nextTick()

      expect({
        open: isOpen(component),
        prevented: event.defaultPrevented,
      })
        .toEqual({ open: false, prevented: false })
    })

    it('stops listening once the prompt bar is gone', async () => {
      const component = await mount()
      component.unmount()

      const event = chord({ key: 'k', metaKey: true })

      expect(event.defaultPrevented).toBe(false)
    })

    it.each([
      ['an Apple device', 'MacIntel', '⌘'],
      ['anything else', 'Win32', 'ctrl'],
    ])('names the modifier the way %s labels it', async (_, platform, named) => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform)
      const component = await mount()

      expect(commandsButton(component).find('[data-modifier]').text()).toBe(named)
    })
  })

  describe('the palette', () => {
    it('lets it shut, so the button can open it again', async () => {
      const component = await mount()
      await commandsButton(component).trigger('click')

      palette(component).find<HTMLDialogElement>('dialog').element.close()
      await nextTick()
      await commandsButton(component).trigger('click')

      expect(isOpen(component)).toBe(true)
    })

    it('hands it every command and meta command', async () => {
      const component = await mount()

      expect({
        commands: palette(component).props('commands'),
        metaCommands: palette(component).props('metaCommands'),
      }).toEqual({ commands, metaCommands })
    })

    it('hands it what the session would run', async () => {
      const component = await mount()

      expect(palette(component).props('recognises')).toBe(recognises)
    })

    it('runs the command picked in it', async () => {
      const component = await mount()

      palette(component).vm.$emit('run', 'ls ~/kiln')

      expect(component.emitted('run')).toEqual([
        ['ls ~/kiln'],
      ])
    })

    it('shows it the theme chosen', async () => {
      const component = await mount({ theme: 'dark' })

      expect(palette(component).props('theme')).toBe('dark')
    })

    it('reports a theme chosen in it', async () => {
      const component = await mount()

      palette(component).vm.$emit('update:theme', 'light')

      expect(component.emitted('update:theme')).toEqual([
        ['light'],
      ])
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

    it('points at the list for a Visitor with nothing to type', async () => {
      const component = await mount()

      expect(prompt(component).attributes('placeholder')).toBe(
        'type a command, or open the list',
      )
    })

    it('marks the prompt caret so its focus state can be styled off the input', async () => {
      const component = await mount()

      expect(component.find('#prompt ~ .prompt-mirror .caret.prompt-caret').exists()).toBe(true)
    })

    it('puts the caret back on the prompt when asked', async () => {
      const component = await mount()
      const focus = vi.spyOn(prompt(component).element, 'focus')

      component.vm.focus()

      expect(focus).toHaveBeenCalled()
    })
  })

  describe('the caret', () => {
    it('marks the prompt so its own caret can be hidden behind the block', async () => {
      const component = await mount()

      expect(prompt(component).classes()).toContain('prompt-input')
    })

    it('sets the prompt as a block, so the line the block is centred on is the prompt\'s own', async () => {
      const component = await mount()

      expect(prompt(component).classes()).toContain('block')
    })

    it('sits at the start of an empty prompt', async () => {
      const component = await mount()

      expect(beforeCaret(component)).toBe('')
    })

    it('sits after the last character of the prompt it is handed', async () => {
      const component = await mount({ modelValue: 'cat ~/va' })

      expect(beforeCaret(component)).toBe('cat ~/va')
    })

    it('moves to the insertion point when the Visitor moves it', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await moveInsertion(component, 3)

      expect(beforeCaret(component)).toBe('cat')
    })

    it('carries the letter it sits on, so the block can draw it inverted', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await moveInsertion(component, 8)

      expect(underCaret(component)).toBe('u')
    })

    it('carries nothing after the last character', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      expect(underCaret(component)).toBe('')
    })

    it('goes to the end of a command filled in for the Visitor', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })
      await moveInsertion(component, 3)

      await component.setProps({ modelValue: 'ls ~/kiln' })

      expect(beforeCaret(component)).toBe('ls ~/kiln')
    })

    it('sits on the end of a selection the Visitor is extending leftward', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await moveInsertion(component, 3, 11, 'backward')

      expect(beforeCaret(component)).toBe('cat')
    })

    it('sits on the end of a selection the Visitor is extending rightward', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })

      await moveInsertion(component, 0, 3)

      expect(beforeCaret(component)).toBe('cat')
    })

    it('scrolls with a command too long for the prompt', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })
      prompt(component).element.scrollLeft = 40

      await moveInsertion(component, 11)

      expect(component.find('[data-caret-mirror]').attributes('style')).toContain('translate: -40px 0')
    })

    it('scrolls with the prompt when the Visitor scrolls it without moving the insertion point', async () => {
      const component = await mount({ modelValue: 'cat ~/vault' })
      prompt(component).element.scrollLeft = 40

      await prompt(component).trigger('scroll')

      expect(component.find('[data-caret-mirror]').attributes('style')).toContain('translate: -40px 0')
    })

    it('stops following the page\'s selection once the prompt bar is gone', async () => {
      const component = await mount()
      const errors: unknown[] = []
      const report = (event: ErrorEvent) => errors.push(event.error)
      window.addEventListener('error', report)

      try {
        component.unmount()
        document.dispatchEvent(new Event('selectionchange'))
      }
      finally {
        window.removeEventListener('error', report)
      }

      expect(errors).toEqual([])
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

  describe('edges', () => {
    it('draws the bar\'s rule and the commands button in the control-edge token', async () => {
      const component = await mount()
      const edges = (classes: string[]) =>
        ['border-edge', 'border-base-300'].filter(name => classes.includes(name))

      expect({
        rule: edges(component.find('[data-prompt-bar]').classes()),
        button: edges(commandsButton(component).classes()),
      }).toEqual({
        rule: ['border-edge'],
        button: ['border-edge'],
      })
    })
  })
})
