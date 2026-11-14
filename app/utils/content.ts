import { roles as enRoles } from '../data/en/experience'
import { profile as enProfile } from '../data/en/profile'

/**
 * Every Locale that has Content, in the order they were added. A new Locale is
 * one entry here and a folder under `app/data/`; the first entry is the
 * fallback.
 */
export const contents = [
  { code: 'en', profile: enProfile, roles: enRoles },
]

/**
 * A Locale code reaches here as a plain string from the route, so it is looked
 * up rather than asserted into the union; one that has no Content prints the
 * first Locale's rather than nothing.
 */
export function contentFor(code: string) {
  return contents.find(set => set.code === code) ?? contents[0]!
}
