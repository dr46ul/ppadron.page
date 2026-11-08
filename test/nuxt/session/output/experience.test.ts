import type { Role } from '~/data/experience'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Experience from '~/components/session/output/Experience.vue'
import { roleOf } from '../../text-role'

function role(overrides: Partial<Role> = {}): Role {
  return {
    company: 'Acme',
    title: 'Engineer',
    period: '2022 — now',
    since: '2022',
    summary: 'Built the thing that made the other thing work.',
    tech: ['TypeScript', 'Vue'],
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
        period: '2022 — now',
        summary: 'Built the thing that made the other thing work.',
      }),
    ])

    const text = component.text()
    expect(text).toContain('Acme')
    expect(text).toContain('Engineer')
    expect(text).toContain('2022 — now')
    expect(text).toContain('Built the thing that made the other thing work.')
  })

  it('joins the tech of a role with a middle dot', async () => {
    const component = await mount([
      role({
        tech: ['TypeScript', 'Vue', 'Nuxt'],
      }),
    ])

    expect(component.text()).toContain('TypeScript · Vue · Nuxt')
  })

  it('prints a role whose tech list is empty', async () => {
    const component = await mount([
      role({ company: 'Acme', tech: [] }),
    ])

    expect(component.text()).toContain('Acme')
    expect(component.text()).not.toContain('·')
  })

  it('keeps the order it was handed', async () => {
    const component = await mount([
      role({ company: 'Newest', since: '2022' }),
      role({ company: 'Middle', since: '2019' }),
      role({ company: 'Oldest', since: '2016' }),
    ])

    expect(component.findAll('li').map(item => item.text())).toEqual([
      expect.stringContaining('Newest'),
      expect.stringContaining('Middle'),
      expect.stringContaining('Oldest'),
    ])
  })

  it('accents the most recent role and mutes the rest', async () => {
    const component = await mount([
      role({ since: '2022' }),
      role({ since: '2019' }),
      role({ since: '2016' }),
    ])

    const [first, ...rest] = component.findAll('time')
    expect(first!.classes()).toContain('text-accent')
    for (const other of rest) {
      expect(other!.classes()).not.toContain('text-accent')
      expect(other!.classes()).toContain('text-muted')
    }
  })

  it('gives each role a machine-readable start date', async () => {
    const component = await mount([
      role({ since: '2013', period: '2013 — 2016' }),
    ])

    expect(component.get('time').attributes('datetime')).toBe('2013')
  })

  it('numbers the roles for the print cascade', async () => {
    const component = await mount([
      role({ since: '2022' }),
      role({ since: '2019' }),
    ])

    expect(component.findAll('li').map(item => item.attributes('style')))
      .toEqual(['--i: 0;', '--i: 1;'])
  })

  it('still says why there is no projects gallery when it has no roles', async () => {
    const component = await mount([])

    expect(component.text()).toContain(
      'Freelance client work is under NDA, so there is no projects gallery.',
    )
    expect(component.findAll('li')).toHaveLength(0)
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
          tech: ['TypeScript', 'Vue'],
        }),
      ])

      expect(roleOf(component, 'p', 'Built the thing that made')).toBe('text-body')
      expect(roleOf(component, 'span', 'Kiln technician')).toBe('text-muted')
      expect(roleOf(component, 'p', 'TypeScript · Vue')).toBe('text-subtle')
    })

    it('sets the NDA note as chrome and leaves the company at full strength', async () => {
      const component = await mount([
        role({ company: 'Kiln & Ash' }),
      ])

      expect(roleOf(component, 'p', 'under NDA')).toBe('text-subtle')
      expect(roleOf(component, 'span', 'Kiln & Ash')).toBeUndefined()
    })
  })
})
