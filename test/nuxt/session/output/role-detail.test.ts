import type { Role } from '~/data/experience'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import RoleDetail from '~/components/session/output/RoleDetail.vue'
import { roleOf } from '../../text-role'

/** A Role the real `app/data/experience.ts` cannot supply. */
function role(overrides: Partial<Role> = {}): Role {
  return {
    slug: 'kiln-and-ash',
    company: 'Kiln & Ash',
    title: 'Kiln technician',
    period: '2011 — 2013',
    exactPeriod: 'Feb 2011 – Sep 2013',
    since: '2011',
    summary: 'The short summary only the Experience list prints.',
    tech: ['AtAGlanceOnly'],
    account: ['Fired the first batch.', 'Rebuilt the flue.'],
    stack: ['Clay', 'Glaze', 'Cone 10'],
    ...overrides,
  }
}

function mount(overrides: Partial<Role> = {}) {
  return mountSuspended(RoleDetail, {
    props: { roleName: 'kiln-and-ash', role: role(overrides) },
  })
}

describe('role detail output', () => {
  it('prints the company, the title and the exact period', async () => {
    const component = await mount()

    const text = component.text()
    expect(text).toContain('Kiln & Ash')
    expect(text).toContain('Kiln technician')
    expect(text).toContain('Feb 2011 – Sep 2013')
  })

  it('gives the period a machine-readable start date', async () => {
    const component = await mount({ since: '2011' })

    expect(component.get('time').attributes('datetime')).toBe('2011')
  })

  it('prints each paragraph of the account as its own paragraph, in order', async () => {
    const component = await mount({
      account: ['Fired the first batch.', 'Rebuilt the flue.'],
    })

    const paragraphs = component.findAll('p').map(paragraph => paragraph.text())
    expect(paragraphs.indexOf('Fired the first batch.')).toBeGreaterThan(-1)
    expect(paragraphs.indexOf('Rebuilt the flue.')).toBe(
      paragraphs.indexOf('Fired the first batch.') + 1,
    )
  })

  it('joins the full stack with a middle dot', async () => {
    const component = await mount({ stack: ['Clay', 'Glaze', 'Cone 10'] })

    expect(component.text()).toContain('Clay · Glaze · Cone 10')
  })

  it('prints the full stack rather than the short list and summary the Experience list has', async () => {
    const component = await mount()

    const text = component.text()
    expect(text).not.toContain('AtAGlanceOnly')
    expect(text).not.toContain('The short summary only')
    expect(text).not.toContain('2011 — 2013')
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
          { name: 'Wood fired', tech: ['Oak', 'Ash'] },
          { name: 'Gas fired', tech: ['Propane'] },
        ],
      },
      {
        name: 'South Kiln',
        phases: [{ name: 'Electric', tech: ['Elements', 'Relays'] }],
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
      expect(positions).not.toContain(-1)
      expect(positions).toEqual(positions.toSorted((a, b) => a - b))
    })

    it('sets the history between the account and the stack', async () => {
      const component = await mount({
        account: ['Rebuilt the flue.'],
        history,
        stack: ['Clay'],
      })

      const text = component.text()
      expect(text.indexOf('Rebuilt the flue.')).toBeLessThan(text.indexOf('North Kiln'))
      expect(text.indexOf('Elements · Relays')).toBeLessThan(text.lastIndexOf('Clay'))
    })

    it('leaves nothing behind when the Role has no history', async () => {
      const without = await mount({ history: undefined })
      const empty = await mount({ history: [] })

      expect(without.html()).toBe(empty.html())
      expect(without.text()).not.toContain('North Kiln')
    })

    it('still names a project whose phases are empty', async () => {
      const component = await mount({
        history: [{ name: 'North Kiln', phases: [] }],
      })

      expect(component.text()).toContain('North Kiln')
    })

    it('still names a phase whose tech is empty', async () => {
      const component = await mount({
        history: [{ name: 'North Kiln', phases: [{ name: 'Wood fired', tech: [] }] }],
        stack: [],
      })

      expect(component.text()).toContain('Wood fired')
      expect(component.text()).not.toContain('·')
    })
  })

  describe('empty lists', () => {
    it('prints a Role with no account', async () => {
      const component = await mount({ account: [] })

      expect(component.text()).toContain('Kiln & Ash')
      expect(component.text()).not.toContain('Fired the first batch.')
    })

    it('labels the stack when there is one, and drops the label with it when there is not', async () => {
      const withStack = await mount({ stack: ['Clay'] })
      const without = await mount({ stack: [] })

      expect(withStack.text()).toContain('Tech stack')
      expect(without.text()).toContain('Kiln & Ash')
      expect(without.text()).not.toContain('Tech stack')
    })
  })

  describe('no such file', () => {
    function mountMissing(roleName = 'ghost-corp') {
      return mountSuspended(RoleDetail, { props: { roleName } })
    }

    it('names the path the Visitor asked for', async () => {
      const component = await mountMissing('ghost-corp')

      expect(component.text()).toContain(
        'cat: ~/experience/ghost-corp: No such file or directory',
      )
    })

    it('points at the list of Roles', async () => {
      const component = await mountMissing()

      expect(component.text()).toContain('ls ~/experience')
    })

    it('prints only that line, in the voice of an error', async () => {
      const component = await mountMissing()

      expect(component.classes()).toContain('text-error')
      expect(component.find('time').exists()).toBe(false)
      expect(component.text()).not.toContain('Tech stack')
    })

    it('does not print the form when a Role is handed in', async () => {
      const component = await mount()

      expect(component.text()).not.toContain('No such file')
      expect(component.text()).not.toContain('ls ~/experience')
    })
  })

  describe('text roles', () => {
    it('sets the account as prose, the title and period as labels, the stack as chrome', async () => {
      const component = await mount({
        history: [{ name: 'North Kiln', phases: [{ name: 'Wood fired', tech: ['Oak'] }] }],
      })

      expect(roleOf(component, 'p', 'Fired the first batch.')).toBe('text-body')
      expect(roleOf(component, 'span', 'Kiln technician')).toBe('text-muted')
      expect(roleOf(component, 'time', 'Feb 2011')).toBe('text-muted')
      expect(roleOf(component, 'p', 'Clay · Glaze')).toBe('text-subtle')
      expect(roleOf(component, 'p', 'North Kiln')).toBe('text-muted')
      expect(roleOf(component, 'span', 'Wood fired')).toBe('text-muted')
      expect(roleOf(component, 'span', 'Oak')).toBe('text-subtle')
    })

    it('leaves the company at full strength', async () => {
      const component = await mount()

      expect(roleOf(component, 'span', 'Kiln & Ash')).toBeUndefined()
    })
  })
})
