import type { EnquiryFailures } from '#shared/enquiry'
import type { EnquiryDraft, EnquiryState } from '~/composables/useEnquiry'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Contact from '~/components/session/output/Contact.vue'
import { en, fill } from '../../messages'
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
  failures?: EnquiryFailures
  email?: string
} = {}) {
  return mountSuspended(Contact, {
    props: {
      modelValue: enquiry(),
      state: 'idle' satisfies EnquiryState,
      failures: {},
      email: 'pavel@example.test',
      ...props,
    },
  })
}

function value(component: Awaited<ReturnType<typeof mount>>, name: string) {
  return component.find<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`).element.value
}

/** What the browser will say when the Visitor tries to send. */
function complaint(component: Awaited<ReturnType<typeof mount>>, name: string) {
  return component.find<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`).element.validationMessage
}

const WHO = en.contact.complaintName
const ADDRESS = en.contact.complaintAddress
const MORE = fill(en.contact.complaintMessage, { min: '20' })

function cap(characters: number) {
  return fill(en.contact.complaintTooLong, {
    limit: characters.toLocaleString('en-US'),
  })
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

    expect({
      name: value(component, 'name'),
      email: value(component, 'email'),
      message: value(component, 'message'),
    }).toEqual({
      name: 'Dagny Vole',
      email: 'dagny@example.test',
      message: 'Our checkout has three states and all of them are wrong.',
    })
  })

  it('reports the whole draft back when a field is typed into', async () => {
    const draft = enquiry({ name: '', email: '', message: 'already typed' })
    const component = await mount({ modelValue: draft })

    await component.find('[name="name"]').setValue('Dagny Vole')

    expect(component.emitted('update:modelValue')).toEqual([
      [
        { name: 'Dagny Vole', email: '', message: 'already typed' },
      ],
    ])
  })

  it('leaves the draft it was handed alone', async () => {
    const draft = enquiry({ name: '' })
    const component = await mount({ modelValue: draft })

    await component.find('[name="name"]').setValue('Dagny Vole')

    expect(draft.name).toBe('')
  })

  it('reports a typed reply-to address', async () => {
    const component = await mount({
      modelValue: enquiry({ email: '' }),
    })

    await component.find('[name="email"]').setValue('dagny@example.test')

    expect(component.emitted('update:modelValue')!.at(-1)).toEqual([
      enquiry({ email: 'dagny@example.test' }),
    ])
  })

  it('reports a typed body', async () => {
    const component = await mount({
      modelValue: enquiry({ message: '' }),
    })

    await component
      .find('[name="message"]')
      .setValue('Our checkout has three states and all of them are wrong.')

    expect(component.emitted('update:modelValue')!.at(-1)).toEqual([
      enquiry(),
    ])
  })

  it('offers to send while the draft is idle', async () => {
    const component = await mount({ state: 'idle' })

    expect({
      button: component.find('button[type="submit"]').text(),
      status: component.find('[role="status"]').exists(),
      alert: component.find('[role="alert"]').exists(),
    }).toEqual({ button: en.contact.send, status: false, alert: false })
  })

  it('draws the send button as the library\'s small outlined accent button, never its disabled one', async () => {
    const component = await mount({ state: 'sending' })
    const classes = component.get('button[type="submit"]').classes()

    expect([
      'btn',
      'btn-outline',
      'btn-accent',
      'btn-sm',
      'btn-disabled',
    ].filter(name => classes.includes(name)))
      .toEqual([
        'btn',
        'btn-outline',
        'btn-accent',
        'btn-sm',
      ])
  })

  it('shows an address as the reply-to placeholder, with its at sign intact', async () => {
    const component = await mount()

    expect(component.get('[name="email"]').attributes('placeholder')).toBe('you@company.com')
  })

  it('says so and takes no more typing while it is sending', async () => {
    const component = await mount({ state: 'sending' })

    expect({
      button: component.find('button[type="submit"]').text(),
      disabled: ['name', 'email', 'message'].map(name => component.find(`[name="${name}"]`).attributes('disabled') !== undefined),
    }).toEqual({
      button: en.contact.sending,
      disabled: [true, true, true],
    })
  })

  it('keeps the send button focusable while it is sending', async () => {
    const component = await mount({ state: 'sending' })
    const button = component.find('button[type="submit"]')

    // A disabled element drops focus to <body>, so the Visitor would lose
    // their place while waiting to hear the result.
    expect({
      fieldsetDisabled: component.find('fieldset').attributes('disabled'),
      buttonDisabled: button.attributes('disabled'),
      ariaDisabled: button.attributes('aria-disabled'),
    }).toEqual({ fieldsetDisabled: undefined, buttonDisabled: undefined, ariaDisabled: 'true' })
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

      expect({
        text: button.text(),
        disabled: button.attributes('disabled'),
        ariaDisabled: button.attributes('aria-disabled'),
      }).toEqual({ text: en.contact.sent, disabled: undefined, ariaDisabled: 'true' })
    })

    it('does not ask the session to send it again', async () => {
      const component = await mount({ state: 'sent' })

      await component.find('form').trigger('submit')

      expect(component.emitted('submit')).toBeUndefined()
    })

    it('keeps what was sent selectable, but not editable', async () => {
      const component = await mount({ state: 'sent' })

      expect(['name', 'email', 'message'].map((name) => {
        const control = component.find(`[name="${name}"]`)
        return {
          readonly: control.attributes('readonly') !== undefined,
          disabled: control.attributes('disabled') !== undefined,
        }
      })).toEqual(Array.from({ length: 3 }, () => ({ readonly: true, disabled: false })))
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

    expect({
      status: component.find('[role="status"]').text(),
      fieldsetDisabled: component.find('fieldset').attributes('disabled'),
      alert: component.find('[role="alert"]').exists(),
    }).toEqual({
      status: expect.stringContaining(en.contact.sentNotice),
      fieldsetDisabled: undefined,
      alert: false,
    })
  })

  it('reveals the address it is handed when a send fails', async () => {
    const component = await mount({
      state: 'failed',
      email: 'pavel@example.test',
    })
    const alert = component.find('[role="alert"]')

    expect({
      missingFromAlert: [
        fill(en.contact.failed, { email: 'pavel@example.test' }),
      ].filter(line => !alert.text().replace(/\s+/g, ' ').includes(line)),
      fieldsetDisabled: component.find('fieldset').attributes('disabled'),
      status: component.find('[role="status"]').exists(),
    }).toEqual({
      missingFromAlert: [],
      fieldsetDisabled: undefined,
      status: false,
    })
  })

  it('asks the session to send once, and does not navigate', async () => {
    const component = await mount()
    const bubbled = vi.fn()
    component.element.parentElement!.addEventListener('submit', bubbled)

    await component.find('form').trigger('submit')

    expect({
      submits: component.emitted('submit')?.length,
      prevented: bubbled.mock.calls.map(([event]) => event.defaultPrevented),
    }).toEqual({
      submits: 1,
      prevented: [true],
    })
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

    expect({
      placeholders: component.findAll('[data-placeholder]').length,
      address: component.text().includes('[direct email]'),
    }).toEqual({ placeholders: 0, address: false })
  })

  describe('what it will not send', () => {
    it('has nothing to say when it is handed no failures', async () => {
      const component = await mount({ failures: {} })

      expect({
        name: complaint(component, 'name'),
        email: complaint(component, 'email'),
        message: complaint(component, 'message'),
      }).toEqual({ name: '', email: '', message: '' })
    })

    it.each([
      ['name', 'missing', WHO],
      [
        'name',
        'too-long',
        cap(200),
      ],
      ['email', 'missing', ADDRESS],
      ['email', 'not-an-address', ADDRESS],
      [
        'email',
        'too-long',
        cap(320),
      ],
      ['message', 'missing', MORE],
      ['message', 'too-short', MORE],
      [
        'message',
        'too-long',
        cap(5000),
      ],
    ] as const)('complains about the %s field when it is %s', async (name, rule, expected) => {
      const component = await mount({
        failures: { [name]: rule },
      })

      expect(complaint(component, name)).toBe(expected)
    })

    it('leaves the delivery alone to decide that an address is one', async () => {
      const component = await mount({
        modelValue: enquiry({ email: 'josé@example.test' }),
        failures: {},
      })
      const control = component.find<HTMLInputElement>('[name="email"]').element

      expect(control.validity.valid).toBe(true)
    })

    it('says nothing about one field because of another', async () => {
      const component = await mount({
        failures: { name: 'missing' },
      })

      expect({
        name: complaint(component, 'name'),
        email: complaint(component, 'email'),
        message: complaint(component, 'message'),
      }).toEqual({ name: WHO, email: '', message: '' })
    })

    it('changes its mind as the failures it is handed change', async () => {
      const component = await mount({
        failures: { name: 'missing' },
      })

      await component.setProps({ failures: {} })
      const nameOnceFixed = complaint(component, 'name')

      await component.setProps({
        failures: { email: 'not-an-address' },
      })

      expect({
        nameOnceFixed,
        emailOnceBroken: complaint(component, 'email'),
      })
        .toEqual({ nameOnceFixed: '', emailOnceBroken: ADDRESS })
    })
  })

  describe('text roles', () => {
    it('sets the lede as a label and the retention note as chrome', async () => {
      const component = await mount()

      expect({
        lede: roleOf(component, 'p', en.contact.lede),
        retention: roleOf(component, 'span', en.contact.retention),
      }).toEqual({ lede: 'text-muted', retention: 'text-subtle' })
    })
  })

  describe('control edges', () => {
    it('underlines every field with the control-edge token, not the divider', async () => {
      const component = await mount()

      expect(['name', 'email', 'message'].map(name =>
        ['border-edge', 'border-base-300'].filter(edge => component.find(`[name="${name}"]`).classes().includes(edge)),
      )).toEqual([
        ['border-edge'],
        ['border-edge'],
        ['border-edge'],
      ])
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

      const focus = ['focus:border-accent', 'focus:shadow-[0_1px_0_var(--color-accent)]']
      expect(['name', 'email', 'message'].map(name =>
        focus.filter(style => component.find(`[name="${name}"]`).classes().includes(style)),
      )).toEqual([focus, focus, focus])
    })
  })

  it('holds every field at 16px at every width, so iOS never zooms the page', async () => {
    const component = await mount()

    expect(['name', 'email', 'message'].map(name =>
      component.find(`[name="${name}"]`).classes().filter(className => className === 'text-base' || className.startsWith('sm:text-')),
    )).toEqual([
      ['text-base'],
      ['text-base'],
      ['text-base'],
    ])
  })
})
