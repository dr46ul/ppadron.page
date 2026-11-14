import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Unknown from '~/components/session/output/Unknown.vue'
import { en } from '../../messages'

/**
 * A command the real list cannot supply, so the assertion cannot go green off
 * the component's own markup.
 */
function mount(cmd = 'sudo make me a sandwich', helpCommand = 'help') {
  return mountSuspended(Unknown, {
    props: { cmd, helpCommand },
  })
}

describe('unknown output', () => {
  it('prints the command it is handed', async () => {
    const component = await mount('xyzzy --twice')

    expect(component.text()).toBe(
      en.unknown.notFound.replace('{cmd}', 'xyzzy --twice').replace('{help}', 'help'),
    )
  })

  it('offers the help command it is handed', async () => {
    const component = await mount('xyzzy', 'assist')

    expect(component.get('button').text()).toBe('assist')
  })

  it('asks for help rather than running it', async () => {
    const component = await mount()

    await component.find('button').trigger('click')

    expect(component.emitted('help')).toHaveLength(1)
  })

  it('offers help as a button drawn like an accent link', async () => {
    const component = await mount()
    const help = component.get('button')

    expect({
      tag: help.element.tagName,
      drawn: ['link', 'link-accent'].filter(name => help.classes().includes(name)),
    }).toEqual({
      tag: 'BUTTON',
      drawn: ['link', 'link-accent'],
    })
  })

  it('keeps the help click from reaching the session behind it', async () => {
    const component = await mount()
    const behind = vi.fn()
    component.element.parentElement!.addEventListener('click', behind)

    await component.find('button').trigger('click')

    expect(behind).not.toHaveBeenCalled()
  })

  it('prints no command of its own', async () => {
    const component = await mount()

    expect({
      namesACommand: component.text().includes('whoami'),
      placeholders: component.findAll('[data-placeholder]').length,
    }).toEqual({ namesACommand: false, placeholders: 0 })
  })
})
