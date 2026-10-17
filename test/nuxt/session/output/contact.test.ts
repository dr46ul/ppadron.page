import type { EnquiryDraft, EnquiryState } from '~/composables/useEnquiry'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Contact from '~/components/session/output/Contact.vue'
import { roleOf } from '../../text-role'

/**
 * A draft and an address the real `app/data/profile.ts` cannot supply, so
 * nothing here can go green off the component's own markup.
 */
function enquiry(overrides: Partial<EnquiryDraft> = {}): EnquiryDraft {
  return {
    name: 'Dagny Vole',
    email: 'dagny@example.test',
    message: 'Our checkout has three states and all of them are wrong.',
    ...overrides,
  }
}

function mount(props: {
  modelValue?: EnquiryDraft
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

/** What the browser will say when the Visitor tries to send. */
function complaint(component: Awaited<ReturnType<typeof mount>>, name: string) {
  return (
    component.find(`[name="${name}"]`).element as
      | HTMLInputElement
      | HTMLTextAreaElement
  ).validationMessage
}

const WHO = 'Tell me who you are.'
const ADDRESS = 'I need an address I can reply to.'
const MORE = 'A little more, please — at least 20 characters.'

function cap(characters: number) {
  return `Keep it to ${characters} characters; the rest can follow by email.`
}

/** `@example.test` is 13 characters, so this is an address exactly `length` long. */
function address(length: number) {
  return `${'a'.repeat(length - 13)}@example.test`
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
    for (const name of ['name', 'email', 'message'])
      expect(component.find(`[name="${name}"]`).attributes('disabled')).toBeDefined()
  })

  it('keeps the send button focusable while it is sending', async () => {
    const component = await mount({ state: 'sending' })
    const button = component.find('button[type="submit"]')

    // A disabled element drops focus to <body>, so the Visitor would lose
    // their place while waiting to hear the result.
    expect(component.find('fieldset').attributes('disabled')).toBeUndefined()
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-disabled')).toBe('true')
  })

  it('does not ask the session to send again while it is sending', async () => {
    const component = await mount({ state: 'sending' })

    await component.find('form').trigger('submit')

    expect(component.emitted('submit')).toBeUndefined()
  })

  it.each(['idle', 'failed'] as const)(
    'leaves the button enabled while %s, when there is something left to send',
    async (state) => {
      const component = await mount({ state })

      expect(
        component.find('button[type="submit"]').attributes('aria-disabled'),
      ).toBeUndefined()
    },
  )

  describe('once it has sent', () => {
    it('says so on the button, which stays focusable but refused', async () => {
      const component = await mount({ state: 'sent' })
      const button = component.find('button[type="submit"]')

      expect(button.text()).toBe('sent')
      expect(button.attributes('disabled')).toBeUndefined()
      expect(button.attributes('aria-disabled')).toBe('true')
    })

    it('does not ask the session to send it again', async () => {
      const component = await mount({ state: 'sent' })

      await component.find('form').trigger('submit')

      expect(component.emitted('submit')).toBeUndefined()
    })

    it('keeps what was sent selectable, but not editable', async () => {
      const component = await mount({ state: 'sent' })

      for (const name of ['name', 'email', 'message']) {
        const control = component.find(`[name="${name}"]`)

        expect(control.attributes('readonly')).toBeDefined()
        expect(control.attributes('disabled')).toBeUndefined()
      }
    })
  })

  it.each(['idle', 'sending', 'failed'] as const)(
    'does not lock the fields read-only while %s',
    async (state) => {
      const component = await mount({ state })

      for (const name of ['name', 'email', 'message'])
        expect(component.find(`[name="${name}"]`).attributes('readonly')).toBeUndefined()
    },
  )

  it.each(['sent', 'failed'] as const)(
    'prints the %s result outside the fieldset',
    async (state) => {
      const component = await mount({ state })

      expect(
        component.find('[role="status"], [role="alert"]').element.closest('fieldset'),
      ).toBeNull()
    },
  )

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

  describe('what it will not send', () => {
    it('has nothing to say about a draft the delivery accepts', async () => {
      const component = await mount()

      for (const name of ['name', 'email', 'message'])
        expect(complaint(component, name)).toBe('')
    })

    it.each([
      ['name', 'missing', { name: '' }, WHO],
      ['name', 'only spaces', { name: '    ' }, WHO],
      ['name', 'one over its cap', { name: 'n'.repeat(201) }, cap(200)],
      ['name', 'one over its cap once spaces are collapsed', { name: `${'n'.repeat(200)}  n` }, cap(200)],
      ['email', 'missing', { email: '' }, ADDRESS],
      ['email', 'only spaces', { email: '   ' }, ADDRESS],
      ['email', 'a@b, which has no domain to reply to', { email: 'a@b' }, ADDRESS],
      ['email', 'one over its cap', { email: address(321) }, cap(320)],
      ['message', 'missing', { message: '' }, MORE],
      ['message', 'one under the floor', { message: 'm'.repeat(19) }, MORE],
      ['message', 'padded with spaces up to the floor', { message: `${'m'.repeat(19)}  ` }, MORE],
      ['message', 'one over its cap', { message: 'm'.repeat(5001) }, cap(5000)],
    ] as const)('refuses the %s field when it is %s', async (name, _, overrides, expected) => {
      const component = await mount({ modelValue: enquiry(overrides) })

      expect(complaint(component, name)).toBe(expected)
    })

    it.each([
      ['name', 'at its cap', { name: 'n'.repeat(200) }],
      ['name', 'at its cap once trimmed', { name: ` ${'n'.repeat(200)} ` }],
      ['email', 'at its cap', { email: address(320) }],
      ['email', 'padded with spaces', { email: ' dagny@example.test ' }],
      ['message', 'exactly at the floor', { message: 'm'.repeat(20) }],
      ['message', 'at its cap', { message: 'm'.repeat(5000) }],
    ] as const)('accepts the %s field when it is %s', async (name, _, overrides) => {
      const component = await mount({ modelValue: enquiry(overrides) })

      expect(complaint(component, name)).toBe('')
    })

    it.each(['josé@example.test', 'a,b@example.test', 'dagny@example.test.'])(
      'leaves the delivery alone to decide that %s is an address',
      async (email) => {
        const component = await mount({ modelValue: enquiry({ email }) })
        const control = component.find('[name="email"]').element as HTMLInputElement

        expect(control.validity.valid).toBe(true)
      },
    )

    it('says nothing about one field because of another', async () => {
      const component = await mount({ modelValue: enquiry({ name: '' }) })

      expect(complaint(component, 'name')).toBe(WHO)
      expect(complaint(component, 'email')).toBe('')
      expect(complaint(component, 'message')).toBe('')
    })

    it('changes its mind as the draft it is handed changes', async () => {
      const component = await mount({ modelValue: enquiry({ name: '' }) })

      await component.setProps({ modelValue: enquiry() })

      expect(complaint(component, 'name')).toBe('')

      await component.setProps({ modelValue: enquiry({ email: 'a@b' }) })

      expect(complaint(component, 'email')).toBe(ADDRESS)
    })
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

  describe('focus', () => {
    /**
     * Focus is a 2px accent underline: the 1px border turns accent and a 1px
     * shadow thickens it without moving the layout. The rectangle is gone from
     * these fields, so this is what a Visitor sees.
     */
    it('thickens a focused field\'s underline to 2px in the accent', async () => {
      const component = await mount()

      for (const name of ['name', 'email', 'message']) {
        const classes = component.find(`[name="${name}"]`).classes()

        expect(classes).toContain('focus:border-accent')
        expect(classes).toContain('focus:shadow-[0_1px_0_var(--color-accent)]')
      }
    })
  })

  it('holds every field at 16px on a phone so iOS does not zoom the page', async () => {
    const component = await mount()

    for (const name of ['name', 'email', 'message']) {
      const classes = component.find(`[name="${name}"]`).classes()

      expect(classes).toContain('text-base')
      expect(classes).toContain('sm:text-[0.875rem]')
    }
  })
})
