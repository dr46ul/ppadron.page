import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Help from '~/components/session/output/Help.vue'
import { roleOf } from '../../text-role'

function command(overrides: Partial<SessionCommand> = {}): SessionCommand {
  return {
    cmd: 'whoami',
    output: 'whoami',
    label: 'who I am',
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
  it('lists each command it is handed with what it does', async () => {
    const component = await mount([
      command({ cmd: 'cat ~/vault', label: 'the sealed thing' }),
    ])

    const text = component.text()
    expect({
      command: text.includes('cat ~/vault'),
      label: text.includes('the sealed thing'),
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
        command({ cmd: 'cat ~/vault', label: 'the sealed thing' }),
      ],
      [
        { cmd: 'wipe', label: 'start over' },
      ],
    )

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('cat ~/vault'),
      expect.stringMatching(/wipe[\s\S]*start over/),
    ])
  })

  it('numbers the print cascade across both lists', async () => {
    const component = await mount(
      [
        command({ cmd: 'one' }),
        command({ cmd: 'two' }),
      ],
      [
        { cmd: 'wipe', label: 'start over' },
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
      text: expect.stringContaining(
        'Tab completes · up arrow down arrow walk the history · plain words work too '
        + '(experience, contact).',
      ),
    })
  })

  it('draws Tab and both arrows in its closing hint as key caps, read by name', async () => {
    const component = await mount([], [])

    expect(component.findAll('kbd').map(key => key.text())).toEqual(['Tab', 'up arrow', 'down arrow'])
  })

  it('documents the form that opens one Role, whatever Commands it is handed', async () => {
    const component = await mount([], [])

    expect({
      items: component.findAll('li').length,
      text: component.text(),
    }).toEqual({
      items: 0,
      text: expect.stringContaining('cat ~/experience/<role>'),
    })
  })

  describe('text roles', () => {
    it('steps each label back to chrome, leaving the command accented', async () => {
      // Both lists, because a meta command's label is printed by a second `li`
      // that a commands-only mount never renders.
      const component = await mount(
        [
          command({ cmd: 'cat ~/vault', label: 'the sealed thing' }),
        ],
        [
          { cmd: 'reset', label: 'start the session over' },
        ],
      )

      expect({
        label: roleOf(component, 'span', 'the sealed thing'),
        metaLabel: roleOf(component, 'span', 'start the session over'),
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
        hint: roleOf(component, 'p', 'Tab completes'),
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
        gloss: roleOf(component, 'p', 'one role in full'),
        form: roleOf(component, 'code', 'cat ~/experience/<role>'),
      }).toEqual({ gloss: 'text-subtle', form: undefined })
    })
  })
})
