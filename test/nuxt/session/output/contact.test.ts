import type { Enquiry, EnquiryState } from '~/composables/useSession'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Contact from '~/components/session/output/Contact.vue'
import { roleOf } from '../../text-role'

/**
 * A draft and an address the real `app/data/profile.ts` cannot supply, so
 * nothing here can go green off the component's own markup.
 */
function enquiry(overrides: Partial<Enquiry> = {}): Enquiry {
  return {
    name: 'Dagny Vole',
    email: 'dagny@example.test',
    message: 'Our checkout has three states and all of them are wrong.',
    ...overrides,
  }
}

function mount(props: {
  modelValue?: Enquiry
  state?: EnquiryState
  email?: string
} = {}) {
  return mountSuspended(Contact, {
    props: {
      modelValue: enquiry(),
      state: 'idle' as EnquiryState,
      email: 'pavel@example.test',
      ...props,
    },
  })
}

function value(component: Awaited<ReturnType<typeof mount>>, name: string) {
  return (
    component.find(`[name="${name}"]`).element as
      | HTMLInputElement
      | HTMLTextAreaElement
  ).value
}

describe('contact output', () => {
  it('shows the draft it is handed', async () => {
    const component = await mount({
      modelValue: enquiry({
        name: 'Dagny Vole',
        email: 'dagny@example.test',
        message: 'Our checkout has three states and all of them are wrong.',
      }),
    })

    expect(value(component, 'name')).toBe('Dagny Vole')
    expect(value(component, 'email')).toBe('dagny@example.test')
    expect(value(component, 'message')).toBe(
      'Our checkout has three states and all of them are wrong.',
    )
  })

  it('reports the whole draft back when a field is typed into', async () => {
    const draft = enquiry({ name: '', email: '', message: 'already typed' })
    const component = await mount({ modelValue: draft })

    await component.find('[name="name"]').setValue('Dagny Vole')

    expect(component.emitted('update:modelValue')).toEqual([
      [{ name: 'Dagny Vole', email: '', message: 'already typed' }],
    ])
  })

  it('leaves the draft it was handed alone', async () => {
    const draft = enquiry({ name: '' })
    const component = await mount({ modelValue: draft })

    await component.find('[name="name"]').setValue('Dagny Vole')

    expect(draft.name).toBe('')
  })

  it('reports a typed reply-to address', async () => {
    const component = await mount({ modelValue: enquiry({ email: '' }) })

    await component.find('[name="email"]').setValue('dagny@example.test')

    expect(component.emitted('update:modelValue')!.at(-1)).toEqual([
      enquiry({ email: 'dagny@example.test' }),
    ])
  })

  it('reports a typed body', async () => {
    const component = await mount({ modelValue: enquiry({ message: '' }) })

    await component
      .find('[name="message"]')
      .setValue('Our checkout has three states and all of them are wrong.')

    expect(component.emitted('update:modelValue')!.at(-1)).toEqual([enquiry()])
  })

  it('offers to send while the draft is idle', async () => {
    const component = await mount({ state: 'idle' })

    expect(component.find('button[type="submit"]').text()).toBe('send')
    expect(component.find('[role="status"]').exists()).toBe(false)
    expect(component.find('[role="alert"]').exists()).toBe(false)
  })

  it('says so and takes no more typing while it is sending', async () => {
    const component = await mount({ state: 'sending' })

    expect(component.find('button[type="submit"]').text()).toBe('sending…')
    expect(component.find('fieldset').attributes('disabled')).toBeDefined()
  })

  it('confirms a sent Enquiry to a screen reader', async () => {
    const component = await mount({ state: 'sent' })

    expect(component.find('[role="status"]').text()).toContain(
      'It is in my inbox',
    )
    expect(component.find('fieldset').attributes('disabled')).toBeUndefined()
    expect(component.find('[role="alert"]').exists()).toBe(false)
  })

  it('reveals the address it is handed when a send fails', async () => {
    const component = await mount({
      state: 'failed',
      email: 'pavel@example.test',
    })
    const alert = component.find('[role="alert"]')

    expect(alert.text()).toContain('nothing was saved')
    expect(alert.text()).toContain('pavel@example.test')
    expect(component.find('fieldset').attributes('disabled')).toBeUndefined()
    expect(component.find('[role="status"]').exists()).toBe(false)
  })

  it('asks the session to send once, and does not navigate', async () => {
    const component = await mount()
    const bubbled = vi.fn()
    component.element.parentElement!.addEventListener('submit', bubbled)

    await component.find('form').trigger('submit')

    expect(component.emitted('submit')).toHaveLength(1)
    expect(bubbled.mock.calls[0]![0].defaultPrevented).toBe(true)
  })

  it('keeps a click in the form from reaching the session behind it', async () => {
    const component = await mount()
    const behind = vi.fn()
    component.element.parentElement!.addEventListener('click', behind)

    await component.find('[name="name"]').trigger('click')

    expect(behind).not.toHaveBeenCalled()
  })

  it('holds no address and no placeholder of its own', async () => {
    const component = await mount({ state: 'failed', email: 'pavel@example.test' })

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
    expect(component.text()).not.toContain('[direct email]')
  })

  describe('text roles', () => {
    it('sets the lede as a label and the retention note as chrome', async () => {
      const component = await mount()

      expect(roleOf(component, 'p', 'Tell me what you are building')).toBe('text-muted')
      expect(roleOf(component, 'span', 'stored nowhere else')).toBe('text-subtle')
    })
  })

  describe('control edges', () => {
    it('underlines every field with the control-edge token, not the divider', async () => {
      const component = await mount()

      for (const name of ['name', 'email', 'message']) {
        const classes = component.find(`[name="${name}"]`).classes()

        expect(classes).toContain('border-edge')
        expect(classes).not.toContain('border-base-300')
      }
    })
  })
})
