import type { Role } from '~/data/experience'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Experience from '~/components/session/output/Experience.vue'
import { en } from '../../messages'
import { roleOf } from '../../text-role'

function role(overrides: Partial<Role> = {}): Role {
  return {
    slug: 'acme',
    company: 'Acme',
    title: 'Engineer',
    from: '2022-05',
    to: null,
    summary: 'Built the thing that made the other thing work.',
    account: ['Built the thing, then the other thing.'],
    stack: ['TypeScript', 'Vue', 'Vitest'],
    ...overrides,
  }
}

function mount(roles: Role[]) {
  return mountSuspended(Experience, {
    props: { roles },
  })
}

describe('experience output', () => {
  it('prints every field of every role it is handed', async () => {
    const component = await mount([
      role({
        company: 'Acme',
        title: 'Engineer',
        summary: 'Built the thing that made the other thing work.',
      }),
    ])

    const text = component.text()
    expect([
      'Acme',
      'Engineer',
      `2022 — ${en.period.now}`,
      'Built the thing that made the other thing work.',
    ].filter(field => !text.includes(field))).toEqual([])
  })

  it('joins the head of a role\'s stack with a middle dot', async () => {
    const component = await mount([
      role({
        stack: [
          'TypeScript',
          'Vue',
          'Nuxt',
          'Vitest',
          'Tailwind',
          'daisyUI',
          'pnpm',
        ],
      }),
    ])

    expect(component.text()).toContain('TypeScript · Vue · Nuxt · Vitest · Tailwind')
  })

  it('leaves the rest of the stack to the Role detail', async () => {
    const component = await mount([
      role({
        stack: [
          'TypeScript',
          'Vue',
          'Nuxt',
          'Vitest',
          'Tailwind',
          'daisyUI',
          'pnpm',
        ],
      }),
    ])

    expect(['daisyUI', 'pnpm'].filter(name => component.text().includes(name))).toEqual([])
  })

  it('prints a role whose stack is empty', async () => {
    const component = await mount([
      role({ company: 'Acme', stack: [] }),
    ])

    const text = component.text()
    expect({
      company: text.includes('Acme'),
      techSeparator: text.includes('·'),
    })
      .toEqual({ company: true, techSeparator: false })
  })

  it('keeps the order it was handed', async () => {
    const component = await mount([
      role({ company: 'Newest', from: '2022-01' }),
      role({ company: 'Middle', from: '2019-01' }),
      role({ company: 'Oldest', from: '2016-01' }),
    ])

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('Newest'),
      expect.stringContaining('Middle'),
      expect.stringContaining('Oldest'),
    ])
  })

  it('accents the most recent role and mutes the rest', async () => {
    const component = await mount([
      role({ from: '2022-01' }),
      role({ from: '2019-01' }),
      role({ from: '2016-01' }),
    ])

    expect(component.findAll('time').map(time =>
      ['text-accent', 'text-muted'].filter(colour => time.classes().includes(colour)),
    )).toEqual([
      ['text-accent'],
      ['text-muted'],
      ['text-muted'],
    ])
  })

  it('prints the years of a role that has ended', async () => {
    const component = await mount([
      role({ from: '2013-04', to: '2016-08' }),
    ])

    expect(component.get('time').text()).toBe('2013 — 2016')
  })

  it('gives each role a machine-readable start date', async () => {
    const component = await mount([
      role({ from: '2013-04', to: '2016-08' }),
    ])

    expect(component.get('time').attributes('datetime')).toBe('2013-04')
  })

  it('numbers the roles for the print cascade', async () => {
    const component = await mount([
      role({ from: '2022-01' }),
      role({ from: '2019-01' }),
    ])

    expect(component.findAll('li').map(item => item.attributes('style')))
      .toEqual(['--i: 0;', '--i: 1;'])
  })

  it('still says why there is no projects gallery when it has no roles', async () => {
    const component = await mount([])

    expect({
      text: component.text(),
      items: component.findAll('li').length,
    }).toEqual({
      text: expect.stringContaining(en.experience.ndaNote),
      items: 0,
    })
  })

  describe('opening a role', () => {
    function button(component: Awaited<ReturnType<typeof mount>>, company: string) {
      return component.findAll('button').find(found => found.text().includes(company))!
    }

    it('gives every role a button of its own, reporting its slug', async () => {
      const component = await mount([
        role({ slug: 'kiln-and-ash', company: 'Kiln & Ash', from: '2022-01' }),
        role({ slug: 'kelp-and-tar', company: 'Kelp & Tar', from: '2019-01' }),
      ])

      await button(component, 'Kelp & Tar').trigger('click', { detail: 1 })
      await button(component, 'Kiln & Ash').trigger('click')

      expect(component.emitted('open')).toEqual([
        ['kelp-and-tar'],
        ['kiln-and-ash'],
      ])
    })

    it('names the role in the button and leaves the summary outside it', async () => {
      const component = await mount([
        role({
          company: 'Kiln & Ash',
          title: 'Kiln technician',
          summary: 'Rebuilt the firing schedule.',
        }),
      ])

      const text = component.get('button').text()
      expect({
        company: text.includes('Kiln & Ash'),
        title: text.includes('Kiln technician'),
        summary: text.includes('Rebuilt the firing schedule.'),
      }).toEqual({ company: true, title: true, summary: false })
    })

    it('has nothing to open when it has no roles', async () => {
      const component = await mount([])

      expect(component.findAll('button')).toHaveLength(0)
    })

    it('keeps the click from reaching the session behind it', async () => {
      const component = await mount([
        role(),
      ])
      const behind = vi.fn()
      component.element.parentElement!.addEventListener('click', behind)

      await component.get('button').trigger('click')

      expect(behind).not.toHaveBeenCalled()
    })

    describe('with text selected', () => {
      afterEach(() => {
        window.getSelection()!.removeAllRanges()
      })

      it('stays shut when a pointer drag across the name ends on the button', async () => {
        const component = await mount([
          role(),
        ])
        window.getSelection()!.selectAllChildren(component.get('button').element)

        await component.get('button').trigger('click', { detail: 1 })

        expect(component.emitted('open')).toBeUndefined()
      })

      it('still opens from the keyboard, whose click has no pointer behind it', async () => {
        const component = await mount([
          role({ slug: 'kiln-and-ash' }),
        ])
        window.getSelection()!.selectAllChildren(component.get('p').element)

        await component.get('button').trigger('click', { detail: 0 })

        expect(component.emitted('open')).toEqual([
          ['kiln-and-ash'],
        ])
      })
    })
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount([
      role(),
    ])

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('text roles', () => {
    it('sets the summary as prose, the title as a label, the tech as chrome', async () => {
      const component = await mount([
        role({
          title: 'Kiln technician',
          summary: 'Built the thing that made the other thing work.',
        }),
      ])

      expect({
        summary: roleOf(component, 'p', 'Built the thing that made'),
        title: roleOf(component, 'span', 'Kiln technician'),
        tech: roleOf(component, 'p', 'TypeScript · Vue'),
      }).toEqual({ summary: 'text-body', title: 'text-muted', tech: 'text-subtle' })
    })

    it('sets the NDA note as chrome and leaves the company at full strength', async () => {
      const component = await mount([
        role({ company: 'Kiln & Ash' }),
      ])

      expect({
        note: roleOf(component, 'p', 'under NDA'),
        company: roleOf(component, 'span', 'Kiln & Ash'),
      }).toEqual({ note: 'text-subtle', company: undefined })
    })
  })
})
