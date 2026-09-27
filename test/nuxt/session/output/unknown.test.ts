import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Unknown from '~/components/session/output/Unknown.vue'

/**
 * A command the real list cannot supply, so the assertion cannot go green off
 * the component's own markup.
 */
function mount(cmd = 'sudo make me a sandwich') {
  return mountSuspended(Unknown, { props: { cmd } })
}

describe('unknown output', () => {
  it('prints the command it is handed', async () => {
    const component = await mount('xyzzy --twice')

    expect(component.text()).toContain('xyzzy --twice: command not found')
  })

  it('asks for help rather than running it', async () => {
    const component = await mount()

    await component.find('button').trigger('click')

    expect(component.emitted('help')).toHaveLength(1)
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

    expect(component.text()).not.toContain('whoami')
    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })
})
