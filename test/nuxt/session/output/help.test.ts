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
    expect(text).toContain('cat ~/vault')
    expect(text).toContain('the sealed thing')
    // Nothing it was not handed: the real command list must not leak in.
    expect(text).not.toContain('ls ~/experience')
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
      expect.stringContaining('wipe'),
    ])
    expect(component.text()).toContain('start over')
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

    expect(component.findAll('li')).toHaveLength(0)
    expect(component.text().replace(/\s+/g, ' ')).toContain(
      'Tab completes · ↑ ↓ walk the history · plain words work too '
      + '(experience, contact).',
    )
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

      expect(roleOf(component, 'span', 'the sealed thing')).toBe('text-subtle')
      expect(roleOf(component, 'span', 'start the session over')).toBe('text-subtle')
      expect(roleOf(component, 'span', 'cat ~/vault')).toBeUndefined()
      expect(roleOf(component, 'span', 'reset')).toBeUndefined()
    })

    it('sets the hint as chrome but its examples a step above it', async () => {
      const component = await mount([
        command(),
      ])

      expect(roleOf(component, 'p', 'Tab completes')).toBe('text-subtle')
      // The two plain words are the point of the sentence, so they read above
      // the sentence carrying them.
      expect(roleOf(component, 'span', 'experience')).toBe('text-muted')
      expect(roleOf(component, 'span', 'contact')).toBe('text-muted')
    })
  })
})
