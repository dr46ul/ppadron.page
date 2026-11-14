import type { ThemeChoice } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import CommandPalette from '~/components/session/CommandPalette.vue'
import { en, fill } from '../messages'

/**
 * Commands the real Content cannot supply, so nothing here can go green off the
 * component's own markup or the real command list.
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
  { cmd: 'theme', label: 'choose the glaze' },
]

/** What the session would run, standing in for its own rules. */
function recognises(typed: string) {
  return typed === 'kiln --hot'
}

function mount(props: { open?: boolean, theme?: ThemeChoice } = {}) {
  return mountSuspended(CommandPalette, {
    props: {
      commands,
      metaCommands,
      recognises,
      open: true,
      theme: 'system',
      ...props,
    },
  })
}

type Mounted = Awaited<ReturnType<typeof mount>>

function options(component: Mounted) {
  return component.findAll('[role="option"]')
}

function find(component: Mounted) {
  return component.find<HTMLInputElement>('[role="combobox"]')
}

function highlighted(component: Mounted) {
  return options(component).map(option => option.attributes('aria-selected'))
}

async function press(component: Mounted, key: string) {
  await find(component).trigger('keydown', { key })
}

describe('command palette', () => {
  describe('opening', () => {
    it('shows itself as a modal while open', async () => {
      const component = await mount()

      expect(component.find<HTMLDialogElement>('dialog').element.open).toBe(true)
    })

    it('stays shut until asked', async () => {
      const component = await mount({ open: false })

      expect(component.find<HTMLDialogElement>('dialog').element.open).toBe(false)
    })

    it('opens once asked', async () => {
      const component = await mount({ open: false })

      await component.setProps({ open: true })

      expect(component.find<HTMLDialogElement>('dialog').element.open).toBe(true)
    })

    it('shuts once told to', async () => {
      const component = await mount()

      await component.setProps({ open: false })

      expect(component.find<HTMLDialogElement>('dialog').element.open).toBe(false)
    })
  })

  describe('finding', () => {
    it('labels its find field and ties it to the list', async () => {
      const component = await mount()
      const field = find(component)

      expect({
        label: field.attributes('aria-label'),
        controls: component.find(`#${field.attributes('aria-controls')}`).attributes('role'),
      }).toEqual({ label: en.palette.search, controls: 'listbox' })
    })

    it('narrows the list to commands whose name holds what was typed, whatever its case', async () => {
      const component = await mount()

      await find(component).setValue('KILN')

      expect(options(component).map(option => option.find('[data-cmd]').text()))
        .toEqual(['ls ~/kiln'])
    })

    it('never matches on what a command does', async () => {
      const component = await mount()

      await find(component).setValue('fired')

      expect(options(component).length).toBe(0)
    })

    it.each(['', 'THE', 'theme --kiln'])('keeps the theme row while `%s` could still be the theme', async (typed) => {
      const component = await mount()

      await find(component).setValue(typed)

      expect(component.find(`[role="group"][aria-label="${en.palette.theme}"]`).exists()).toBe(true)
    })

    it('drops the theme row once the query cannot be the theme', async () => {
      const component = await mount()

      await find(component).setValue('re')

      expect(component.find(`[role="group"][aria-label="${en.palette.theme}"]`).exists()).toBe(false)
    })

    it('says so when nothing matches', async () => {
      const component = await mount()

      await find(component).setValue('porcelain')

      expect({
        options: options(component).length,
        said: component.find('[data-none]').text(),
      }).toEqual({ options: 0, said: en.palette.nothing })
    })

    it('starts every opening with nothing typed', async () => {
      const component = await mount()
      await find(component).setValue('kiln')

      await component.setProps({ open: false })
      await component.setProps({ open: true })

      expect(find(component).element.value).toBe('')
    })
  })

  describe('the highlight', () => {
    it('starts on the first match', async () => {
      const component = await mount()

      expect(highlighted(component)).toEqual(['true', 'false', 'false'])
    })

    it('names the highlighted option to a screen reader from the field', async () => {
      const component = await mount()
      await press(component, 'ArrowDown')

      expect(find(component).attributes('aria-activedescendant')).toBe(options(component)[1]!.attributes('id'))
    })

    it('moves down with ↓', async () => {
      const component = await mount()

      await press(component, 'ArrowDown')

      expect(highlighted(component)).toEqual(['false', 'true', 'false'])
    })

    it('wraps from the last to the first', async () => {
      const component = await mount()

      for (const _ of [1, 2, 3])
        await press(component, 'ArrowDown')

      expect(highlighted(component)).toEqual(['true', 'false', 'false'])
    })

    it('wraps up from the first to the last with ↑', async () => {
      const component = await mount()

      await press(component, 'ArrowUp')

      expect(highlighted(component)).toEqual(['false', 'false', 'true'])
    })

    it('goes back to the first match as the list narrows', async () => {
      const component = await mount()
      await press(component, 'ArrowDown')

      await find(component).setValue('l')

      expect(highlighted(component)).toEqual(['true', 'false'])
    })

    it('keeps the caret where it is on ↓ and ↑', async () => {
      const component = await mount()
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })

      find(component).element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })
  })

  describe('running', () => {
    it('runs the highlighted command on Enter, and closes', async () => {
      const component = await mount()
      await press(component, 'ArrowDown')

      await press(component, 'Enter')

      expect({
        run: component.emitted('run'),
        open: component.emitted('update:open'),
      })
        .toEqual({
          run: [
            ['ls ~/kiln'],
          ],
          open: [
            [false],
          ],
        })
    })

    it('runs a command typed in full on Enter when no row lists it but the session knows it', async () => {
      const component = await mount()
      await find(component).setValue(' kiln --hot ')

      await press(component, 'Enter')

      expect({
        run: component.emitted('run'),
        open: component.emitted('update:open'),
      })
        .toEqual({
          run: [
            ['kiln --hot'],
          ],
          open: [
            [false],
          ],
        })
    })

    it('says Enter will run a command it does not list but knows', async () => {
      const component = await mount()

      await find(component).setValue('kiln --hot')

      expect(component.find('[data-none]').text()).toBe(fill(en.palette.runTyped, { typed: 'kiln --hot' }))
    })

    it('runs nothing on Enter when nothing matches and the session does not know it', async () => {
      const component = await mount()
      await find(component).setValue('porcelain')

      await press(component, 'Enter')

      expect(component.emitted('run')).toBeUndefined()
    })

    it('runs a command clicked, and closes', async () => {
      const component = await mount()

      await options(component)[2]!.trigger('click')

      expect({
        run: component.emitted('run'),
        open: component.emitted('update:open'),
      })
        .toEqual({
          run: [
            ['sweep'],
          ],
          open: [
            [false],
          ],
        })
    })
  })

  describe('the theme', () => {
    function themeButtons(component: Mounted) {
      return component.find(`[role="group"][aria-label="${en.palette.theme}"]`).findAll('button')
    }

    it('offers light, dark and the system as one labelled group', async () => {
      const component = await mount()

      expect(themeButtons(component).map(button => button.text().trim()))
        .toEqual([en.palette.themeChoice.light, en.palette.themeChoice.dark, en.palette.themeChoice.system])
    })

    it('marks the choice in use', async () => {
      const component = await mount({ theme: 'dark' })

      expect(themeButtons(component).map(button => button.attributes('aria-pressed')))
        .toEqual(['false', 'true', 'false'])
    })

    it('reports the choice picked, and stays open to show it', async () => {
      const component = await mount({ theme: 'dark' })

      await themeButtons(component)[2]!.trigger('click')

      expect({
        theme: component.emitted('update:theme'),
        open: component.emitted('update:open'),
      })
        .toEqual({
          theme: [
            ['system'],
          ],
          open: undefined,
        })
    })
  })

  describe('the keys', () => {
    it('closes from its esc key', async () => {
      const component = await mount()

      await component.find(`button[aria-label="${en.palette.close}"]`).trigger('click')

      expect(component.emitted('update:open')).toEqual([
        [false],
      ])
    })

    it('hints at the keys to a sighted keyboard user alone', async () => {
      const component = await mount()
      const hint = component.find('[data-keys]')

      expect({
        hidden: hint.attributes('aria-hidden'),
        touch: hint.classes('pointer-coarse:hidden'),
      })
        .toEqual({ hidden: 'true', touch: true })
    })
  })

  describe('closing', () => {
    it('reports a close the browser made itself, as Escape does', async () => {
      const component = await mount()

      component.find<HTMLDialogElement>('dialog').element.close()

      expect(component.emitted('update:open')).toEqual([
        [false],
      ])
    })

    it('shows the close button\'s hover accent on its key cap, which sets its own colour', async () => {
      const component = await mount()

      expect(component.get(`button[aria-label="${en.palette.close}"] kbd`).classes()).toContain('group-hover:text-accent')
    })

    it('is the library\'s modal, its panel the box', async () => {
      const component = await mount()
      const dialog = component.get('dialog')

      expect({
        modal: dialog.classes().includes('modal'),
        box: dialog.get('.modal-box').find('[role="listbox"]').exists(),
      }).toEqual({ modal: true, box: true })
    })

    // happy-dom does not submit a dialog-method form, so this asserts what the
    // markup promises and the close itself is confirmed in a browser.
    it('backs the dialog with a dialog-method form holding one button', async () => {
      const component = await mount()
      const backdrop = component.get('form.modal-backdrop')

      expect({
        method: backdrop.attributes('method'),
        buttons: backdrop.findAll('button').length,
      }).toEqual({ method: 'dialog', buttons: 1 })
    })

    it('keeps the backdrop\'s button out of the tab order and away from assistive technology', async () => {
      const component = await mount()
      const button = component.get('form.modal-backdrop button')

      expect({
        tabindex: button.attributes('tabindex'),
        hidden: button.attributes('aria-hidden'),
      }).toEqual({ tabindex: '-1', hidden: 'true' })
    })

    it('stays open on a click inside it', async () => {
      const component = await mount()

      await component.find('[role="listbox"]').trigger('click')

      expect(component.emitted('update:open')).toBeUndefined()
    })

    it('keeps a click from reaching the session behind it', async () => {
      const component = await mount()
      const behind = vi.fn()
      component.element.parentElement!.addEventListener('click', behind)

      await component.find('[role="listbox"]').trigger('click')

      expect(behind).not.toHaveBeenCalled()
    })
  })

  describe('the list', () => {
    it('lists every command it is handed, then every meta command but the theme', async () => {
      const component = await mount()

      expect(options(component).map(option => option.find('[data-cmd]').text()))
        .toEqual(['cat ~/vault', 'ls ~/kiln', 'sweep'])
    })

    it('says what each one does', async () => {
      const component = await mount()

      expect(options(component).map(option => option.find('[data-label]').text()))
        .toEqual(['the sealed thing', 'what was fired', 'empty the hearth'])
    })
  })
})
