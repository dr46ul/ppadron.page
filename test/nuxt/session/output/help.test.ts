import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Help from '~/components/session/output/Help.vue'
import { en, fill, markElements } from '../../messages'
import { roleOf } from '../../text-role'

function command(overrides: Partial<SessionCommand> = {}): SessionCommand {
  return {
    cmd: 'whoami',
    output: 'whoami',
    think: 260,
    ...overrides,
  }
}

function mount(commands: SessionCommand[], metaCommands: MetaCommand[] = []) {
  return mountSuspended(Help, {
    props: { commands, metaCommands },
  })
}

describe('help output', () => {
  it('lists each command it is handed with what its Output does', async () => {
    const component = await mount([
      command({ cmd: 'cat ~/vault', output: 'colophon' }),
    ])

    const text = component.text()
    expect({
      command: text.includes('cat ~/vault'),
      label: text.includes(en.commands.colophon),
      // Nothing it was not handed: the real command list must not leak in.
      realCommand: text.includes('ls ~/experience'),
    }).toEqual({ command: true, label: true, realCommand: false })
  })

  it('keeps the order it was handed', async () => {
    const component = await mount([
      command({ cmd: 'first' }),
      command({ cmd: 'second' }),
      command({ cmd: 'third' }),
    ])

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('first'),
      expect.stringContaining('second'),
      expect.stringContaining('third'),
    ])
  })

  it('lists the meta commands after the commands that print', async () => {
    const component = await mount(
      [
        command({ cmd: 'cat ~/vault' }),
      ],
      [
        { cmd: 'clear' },
      ],
    )

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('cat ~/vault'),
      expect.stringContaining(en.commands.clear),
    ])
  })

  it('numbers the print cascade across both lists', async () => {
    const component = await mount(
      [
        command({ cmd: 'one' }),
        command({ cmd: 'two' }),
      ],
      [
        { cmd: 'clear' },
      ],
    )

    expect(component.findAll('li').map(item => item.attributes('style')))
      .toEqual(['--i: 0;', '--i: 1;', '--i: 2;'])
  })

  it('still prints the hint when it is handed nothing at all', async () => {
    const component = await mount([], [])

    expect({
      items: component.findAll('li').length,
      text: component.text().replace(/\s+/g, ' '),
    }).toEqual({
      items: 0,
      text: expect.stringContaining(fill(en.help.hint, {
        tab: 'Tab',
        up: en.keys.up,
        down: en.keys.down,
        experience: 'experience',
        contact: 'contact',
      })),
    })
  })

  it('draws Tab and both arrows in its closing hint as key caps, read by name', async () => {
    const component = await mount([], [])

    expect(component.findAll('kbd').map(key => key.text())).toEqual(['Tab', en.keys.up, en.keys.down])
  })

  it('sets each key cap and plain word inside its hint where the Message puts it', async () => {
    const component = await mount([], [])

    expect(markElements(component.findAll('p')[1]!.element)).toEqual(fill(en.help.hint, {
      tab: '[kbd:Tab]',
      up: `[kbd:${en.keys.up}]`,
      down: `[kbd:${en.keys.down}]`,
      experience: '[span:experience]',
      contact: '[span:contact]',
    }))
  })

  it('sets the Role form inside its gloss where the Message puts it', async () => {
    const component = await mount([], [])

    expect(markElements(component.findAll('p')[0]!.element))
      .toEqual(fill(en.help.roleForm, { form: '[code:cat ~/experience/<role>]' }))
  })

  it('documents the form that opens one Role, whatever Commands it is handed', async () => {
    const component = await mount([], [])

    expect({
      items: component.findAll('li').length,
      text: component.text(),
    }).toEqual({
      items: 0,
      text: expect.stringContaining(fill(en.help.roleForm, { form: 'cat ~/experience/<role>' })),
    })
  })

  describe('text roles', () => {
    it('steps each label back to chrome, leaving the command accented', async () => {
      // Both lists, because a meta command's label is printed by a second `li`
      // that a commands-only mount never renders.
      const component = await mount(
        [
          command({ cmd: 'cat ~/vault', output: 'colophon' }),
        ],
        [
          { cmd: 'reset' },
        ],
      )

      expect({
        label: roleOf(component, 'span', en.commands.colophon),
        metaLabel: roleOf(component, 'span', en.commands.reset),
        command: roleOf(component, 'span', 'cat ~/vault'),
        metaCommand: roleOf(component, 'span', 'reset'),
      }).toEqual({
        label: 'text-subtle',
        metaLabel: 'text-subtle',
        command: undefined,
        metaCommand: undefined,
      })
    })

    it('sets the hint as chrome but its examples a step above it', async () => {
      const component = await mount([
        command(),
      ])

      expect({
        hint: roleOf(component, 'p', en.help.hint.split('{down}')[1]!.split('·')[0]!.trim()),
        // The two plain words are the point of the sentence, so they read above
        // the sentence carrying them.
        experience: roleOf(component, 'span', 'experience'),
        contact: roleOf(component, 'span', 'contact'),
      }).toEqual({ hint: 'text-subtle', experience: 'text-muted', contact: 'text-muted' })
    })

    it('accents the Role form like a command, and sets its gloss as chrome', async () => {
      const component = await mount([
        command(),
      ])

      expect({
        gloss: roleOf(component, 'p', fill(en.help.roleForm, { form: 'cat ~/experience/<role>' })),
        form: roleOf(component, 'code', 'cat ~/experience/<role>'),
      }).toEqual({ gloss: 'text-subtle', form: undefined })
    })
  })
})
