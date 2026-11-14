/**
 * Profile is the facts about Pavel the site presents: name, headline,
 * location, an introduction, how to reach him, where else to find him, whether
 * he is open for work, and his Background — see CONTEXT.md. There is exactly
 * one Profile, and it is not a Role.
 *
 * A `[bracketed]` string is Content Pavel has yet to supply.
 * `test/unit/content.test.ts` fails while one remains, so none can ship.
 */
export interface Education {
  degree: string
  faculty: string
  institution: string
  year: string
}

export interface Profile {
  /** As Pavel writes it. */
  name: string
  /** Pavel's role, shown small next to the name. */
  headline: string
  /** A sharper hook under the headline. */
  tagline: string
  location: string
  /** Two or three lines. Who Pavel works with and why a client should keep reading. */
  intro: string
  /** An optional second line under the intro, for a detail that does not fit there. */
  aside?: string
  email: string
  availability: {
    /** Whether Pavel is currently open for freelance work. */
    open: boolean
    /** The copy shown alongside the open/closed state. */
    label: string
  }
  links: {
    github: string
    linkedin: string
    repo: string
  }
  /** The tools this site is built with, shown in the Colophon. */
  stack: string[]
  background: string[]
  /** What Pavel is working with now, unlike the site's own `stack`. */
  skills: string[]
  education: Education
}

/**
 * What a Locale writes: the Profile less the technology names, which are the
 * same in every Locale and live in `technology.ts`.
 */
export type ProfileProse = Omit<Profile, 'stack' | 'skills'>
