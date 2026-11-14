import type { Role } from '../data/experience'
import type { Profile } from '../data/profile'
import { roles as enRoles } from '../data/en/experience'
import { profile as enProfile } from '../data/en/profile'
import { profileTechnology, roleTechnology } from '../data/technology'

/**
 * Every Locale that has Content, in the order they were added. A new Locale is
 * one entry here and a folder under `app/data/`; the first entry is the
 * fallback.
 */
export function written() {
  return [
    { code: 'en', profile: enProfile, roles: enRoles },
  ]
}

/**
 * A Locale's Content as the Outputs take it: the prose it wrote and the
 * technology names every Locale shares. A Role the technology table lacks, or
 * lists with another shape, fails `test/unit/content.test.ts`.
 */
export function contents() {
  return written().map(({ code, profile, roles }) => ({
    code,
    profile: {
      ...profile,
      ...profileTechnology,
    } satisfies Profile,
    roles: roles.map((role): Role => {
      const technology = roleTechnology[role.slug]!

      return {
        ...role,
        stack: technology.stack,
        before: role.before && { ...role.before, tech: technology.before! },
        history: role.history?.map((project, projectIndex) => ({
          name: project.name,
          phases: project.phases.map((phase, phaseIndex) => ({
            name: phase.name,
            tech: technology.history![projectIndex]![phaseIndex]!,
          })),
        })),
      }
    }),
  }))
}

/**
 * A Locale code reaches here as a plain string from the route, so it is looked
 * up rather than asserted into the union; one that has no Content prints the
 * first Locale's rather than nothing.
 */
export function contentFor(code: string) {
  const all = contents()
  return all.find(set => set.code === code) ?? all[0]!
}
