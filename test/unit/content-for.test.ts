import { describe, expect, it } from 'vitest'
import { profileTechnology, roleTechnology } from '../../app/data/technology'
import { contentFor, contents } from '../../app/utils/content'

describe('contentFor', () => {
  it('finds the Content of a Locale in the Locale list', () => {
    expect(contentFor('en')).toEqual(contents()[0])
  })

  it('falls back to English for a code that is not a Locale', () => {
    expect(contentFor('xx').code).toBe('en')
  })

  it('joins the shared technology names onto each Role', () => {
    expect(contentFor('en').roles.map(role => [role.tech, role.stack])).toEqual(
      contentFor('en').roles.map(role => [roleTechnology[role.slug]!.tech, roleTechnology[role.slug]!.stack]),
    )
  })

  it('joins the shared technology names onto the Profile', () => {
    const { profile } = contentFor('en')

    expect({ stack: profile.stack, skills: profile.skills }).toEqual(profileTechnology)
  })

  it('joins the technology of a Role\'s note and phases', () => {
    const roles = contentFor('en').roles
    const technology = roles.map(role => ({
      before: role.before?.tech,
      history: role.history?.map(project => project.phases.map(phase => phase.tech)),
    }))

    expect(technology).toEqual(roles.map(role => ({
      before: roleTechnology[role.slug]!.before,
      history: roleTechnology[role.slug]!.history,
    })))
  })
})
