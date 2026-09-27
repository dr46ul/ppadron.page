/**
 * Profile is the facts about Pavel the site presents: name, headline,
 * location, an introduction, how to reach him, where else to find him, and
 * whether he is open for work — see CONTEXT.md. There is exactly one
 * Profile, and it is not a Role.
 *
 * `[bracketed]` fields are placeholders and stay that way until Pavel writes
 * the real copy.
 */
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
}

export const profile: Profile = {
  name: 'Pavel Padron',
  headline: 'Frontend engineer',
  tagline:
    '[A sharper one-line hook under the headline — what Pavel is hired for, in about this many characters.]',
  location: '[location]',
  intro:
    '[Two or three lines of introduction. Who Pavel works with, the kind of problem he is hired for, and why a client should keep reading — around 200 characters, which is roughly this long.]',
  email: '[direct email]',
  availability: {
    open: true,
    label: 'Available for freelance',
  },
  links: {
    github: 'https://github.com/dr46ul',
    linkedin: '[LinkedIn]',
    repo: 'https://github.com/dr46ul/ppadron.page',
  },
  stack: ['vue', 'nuxt', 'typescript', 'tailwind', 'daisyui', 'vitest', 'vercel'],
}
