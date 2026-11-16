import { describe, expect, it } from 'vitest'
import { recommendations } from '../../app/data/recommendations'
import { roleTechnology } from '../../app/data/technology'
import { contents, written } from '../../app/utils/content'

/**
 * The real Content. Every other test mocks it or reads a value back from it, and
 * the coverage gate leaves it out, so a bad data edit can only fail here.
 */

interface Found {
  path: string
  value: string
}

function stringsIn(value: unknown, path: string): Found[] {
  if (typeof value === 'string') {
    return [
      { path, value },
    ]
  }

  if (typeof value !== 'object' || value === null)
    return []

  return Object.entries(value).flatMap(([key, child]) =>
    stringsIn(child, `${path}.${key}`),
  )
}

const [reference] = contents()

describe.each(contents())('content in $code', ({ profile, roles }) => {
  it('holds no [bracketed] placeholder', () => {
    const paths = [
      ...stringsIn(profile, 'profile'),
      ...stringsIn(roles, 'roles'),
      ...stringsIn(recommendations, 'recommendations'),
    ]
      .filter(({ value }) => /\[[^\]]*\]/.test(value))
      .map(({ path }) => path)

    expect(paths, `placeholders left in:\n  ${paths.join('\n  ')}`).toEqual([])
  })

  it('has the same Roles, in the same order, as the first Locale', () => {
    expect(roles.map(role => role.slug)).toEqual(reference!.roles.map(role => role.slug))
  })

  it('has the same Role dates as the first Locale', () => {
    expect(roles.map(role => [role.from, role.to])).toEqual(
      reference!.roles.map(role => [role.from, role.to]),
    )
  })

  describe('roles', () => {
    it('are ordered most recent first', () => {
      const starts = roles.map(role => role.from)

      expect(starts).toEqual([...starts].sort().reverse())
    })

    it('do not share a start', () => {
      const starts = roles.map(role => role.from)

      expect(starts).toEqual([
        ...new Set(starts),
      ])
    })

    it('do not share a slug', () => {
      const slugs = roles.map(role => role.slug)

      expect(slugs).toEqual([
        ...new Set(slugs),
      ])
    })

    // Lowercase only: a typed path is matched case-insensitively, so a capital
    // here could never be reached as written.
    it('have slugs that are valid path segments', () => {
      const invalid = roles
        .map(role => role.slug)
        .filter(slug => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))

      expect(invalid).toEqual([])
    })
  })
})

describe.each(written())('technology for the Roles of $code', ({ roles }) => {
  it('is shaped like the Roles it belongs to', () => {
    const technologyShape = roles.map(({ slug }) => ({
      slug,
      history: roleTechnology[slug]?.history?.map(project => project.length),
    }))

    expect(technologyShape).toEqual(roles.map(role => ({
      slug: role.slug,
      history: role.history?.map(project => project.phases.length),
    })))
  })
})
