import type { Role } from '~/data/experience'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RoleDetail from '~/components/session/output/RoleDetail.vue'
import { en, fill } from '../../messages'
import { roleOf } from '../../text-role'
import { visitFrom } from '../../visit-from'

/** A Role the real `app/data/experience.ts` cannot supply. */
function role(overrides: Partial<Role> = {}): Role {
  return {
    slug: 'kiln-and-ash',
    company: 'Kiln & Ash',
    title: 'Kiln technician',
    from: '2011-02',
    to: '2013-09',
    summary: 'The short summary only the Experience list prints.',
    account: ['Fired the first batch.', 'Rebuilt the flue.'],
    stack: ['Clay', 'Glaze', 'Cone 10'],
    ...overrides,
  }
}

function mount(overrides: Partial<Role> = {}) {
  return mountSuspended(RoleDetail, {
    props: {
      roleName: 'kiln-and-ash',
      role: role(overrides),
    },
  })
}

describe('role detail output', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prints the company, the title and the exact period', async () => {
    const component = await mount()

    const text = component.text()
    expect(['Kiln & Ash', 'Kiln technician', 'Feb 2011 – Sep 2013'].filter(field => !text.includes(field)))
      .toEqual([])
  })

  it('runs a Role still held to now', async () => {
    const component = await mount({ from: '2023-06', to: null })

    expect(component.get('time').text()).toBe(`Jun 2023 – ${en.period.now}`)
  })

  /**
   * A month is stored as its first instant in UTC, which west of UTC is still
   * the month before.
   */
  it('prints the stored months for a Visitor west of UTC', async () => {
    visitFrom('America/Los_Angeles')
    const component = await mount({ from: '2011-02', to: '2013-09' })

    expect(component.get('time').text()).toBe('Feb 2011 – Sep 2013')
  })

  it('gives the period a machine-readable start date', async () => {
    const component = await mount({ from: '2011-02' })

    expect(component.get('time').attributes('datetime')).toBe('2011-02')
  })

  it('prints each paragraph of the account as its own paragraph, in order', async () => {
    const component = await mount({
      account: ['Fired the first batch.', 'Rebuilt the flue.'],
    })

    const paragraphs = component.findAll('p').map(paragraph => paragraph.text())
    const first = paragraphs.indexOf('Fired the first batch.')
    expect(paragraphs.slice(first, first + 2)).toEqual([
      'Fired the first batch.',
      'Rebuilt the flue.',
    ])
  })

  it('joins the full stack with a middle dot', async () => {
    const component = await mount({
      stack: ['Clay', 'Glaze', 'Cone 10'],
    })

    expect(component.text()).toContain('Clay · Glaze · Cone 10')
  })

  it('prints the full stack rather than the short list and summary the Experience list has', async () => {
    const component = await mount()

    const text = component.text()
    expect(['The short summary only', '2011 — 2013'].filter(field => text.includes(field)))
      .toEqual([])
  })

  it('holds no placeholder markers of its own', async () => {
    const component = await mount()

    expect(component.findAll('[data-placeholder]')).toHaveLength(0)
  })

  describe('phased history', () => {
    const history = [
      {
        name: 'North Kiln',
        phases: [
          {
            name: 'Wood fired',
            tech: ['Oak', 'Ash'],
          },
          {
            name: 'Gas fired',
            tech: ['Propane'],
          },
        ],
      },
      {
        name: 'South Kiln',
        phases: [
          {
            name: 'Electric',
            tech: ['Elements', 'Relays'],
          },
        ],
      },
    ]

    it('prints every project, with each phase beside its tech, in order', async () => {
      const component = await mount({ history })

      const text = component.text()
      const printed = [
        'North Kiln',
        'Wood fired',
        'Oak · Ash',
        'Gas fired',
        'Propane',
        'South Kiln',
        'Electric',
        'Elements · Relays',
      ]
      const positions = printed.map(value => text.indexOf(value))
      const found = positions.filter(position => position > -1)
      expect(positions).toEqual(found.toSorted((a, b) => a - b))
    })

    it('sets the history between the account and the stack', async () => {
      const component = await mount({
        account: ['Rebuilt the flue.'],
        history,
        stack: ['Clay'],
      })

      const text = component.text()
      expect({
        afterTheAccount: text.indexOf('Rebuilt the flue.') < text.indexOf('North Kiln'),
        beforeTheStack: text.indexOf('Elements · Relays') < text.lastIndexOf('Clay'),
      }).toEqual({ afterTheAccount: true, beforeTheStack: true })
    })

    it('leaves nothing behind when the Role has no history', async () => {
      const without = await mount({ history: undefined })
      const empty = await mount({ history: [] })

      expect({
        html: without.html(),
        project: without.text().includes('North Kiln'),
      })
        .toEqual({
          html: empty.html(),
          project: false,
        })
    })

    it('still names a project whose phases are empty', async () => {
      const component = await mount({
        history: [
          { name: 'North Kiln', phases: [] },
        ],
      })

      expect(component.text()).toContain('North Kiln')
    })

    it('still names a phase whose tech is empty', async () => {
      const component = await mount({
        history: [
          {
            name: 'North Kiln',
            phases: [
              { name: 'Wood fired', tech: [] },
            ],
          },
        ],
        stack: [],
      })

      const text = component.text()
      expect({
        phase: text.includes('Wood fired'),
        techSeparator: text.includes('·'),
      })
        .toEqual({ phase: true, techSeparator: false })
    })
  })

  describe('empty lists', () => {
    it('prints a Role with no account', async () => {
      const component = await mount({ account: [] })

      const text = component.text()
      expect({
        company: text.includes('Kiln & Ash'),
        account: text.includes('Fired the first batch.'),
      })
        .toEqual({ company: true, account: false })
    })

    it('labels the stack when there is one, and drops the label with it when there is not', async () => {
      const withStack = await mount({
        stack: ['Clay'],
      })
      const without = await mount({ stack: [] })

      expect({
        labelledWithStack: withStack.text().includes(en.roleDetail.techStack),
        companyWithout: without.text().includes('Kiln & Ash'),
        labelledWithout: without.text().includes(en.roleDetail.techStack),
      }).toEqual({ labelledWithStack: true, companyWithout: true, labelledWithout: false })
    })
  })

  describe('no such file', () => {
    function mountMissing(roleName = 'ghost-corp') {
      return mountSuspended(RoleDetail, {
        props: { roleName },
      })
    }

    it('names the path the Visitor asked for', async () => {
      const component = await mountMissing('ghost-corp')

      expect(component.text()).toContain(
        fill(en.roleDetail.notFound, { role: 'ghost-corp', list: 'ls ~/experience' }),
      )
    })

    it('points at the list of Roles', async () => {
      const component = await mountMissing()

      expect(component.text()).toContain('ls ~/experience')
    })

    it('prints only that line, in the voice of an error', async () => {
      const component = await mountMissing()

      expect({
        error: component.classes().includes('text-error'),
        period: component.find('time').exists(),
        stack: component.text().includes(en.roleDetail.techStack),
      }).toEqual({ error: true, period: false, stack: false })
    })

    it('does not print the form when a Role is handed in', async () => {
      const component = await mount()

      const text = component.text()
      expect([
        fill(en.roleDetail.notFound, { role: 'ghost-corp', list: 'ls ~/experience' }),
        'ls ~/experience',
      ].filter(line => text.includes(line))).toEqual([])
    })
  })

  describe('text roles', () => {
    it('sets the account as prose, the title and period as labels, the stack as chrome', async () => {
      const component = await mount({
        history: [
          {
            name: 'North Kiln',
            phases: [
              {
                name: 'Wood fired',
                tech: ['Oak'],
              },
            ],
          },
        ],
      })

      expect({
        account: roleOf(component, 'p', 'Fired the first batch.'),
        title: roleOf(component, 'span', 'Kiln technician'),
        period: roleOf(component, 'time', 'Feb 2011'),
        stack: roleOf(component, 'p', 'Clay · Glaze'),
        project: roleOf(component, 'p', 'North Kiln'),
        phase: roleOf(component, 'span', 'Wood fired'),
        phaseTech: roleOf(component, 'span', 'Oak'),
      }).toEqual({
        account: 'text-body',
        title: 'text-muted',
        period: 'text-muted',
        stack: 'text-subtle',
        project: 'text-muted',
        phase: 'text-muted',
        phaseTech: 'text-subtle',
      })
    })

    it('leaves the company at full strength', async () => {
      const component = await mount()

      expect(roleOf(component, 'span', 'Kiln & Ash')).toBeUndefined()
    })
  })
})
