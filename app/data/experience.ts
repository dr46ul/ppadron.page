/**
 * Experience is the site's only proof surface — see
 * docs/adr/0001-experience-is-the-only-proof-surface.md.
 *
 * A `[bracketed]` string is Content Pavel has yet to supply.
 * `test/unit/content.test.ts` fails while one remains, so none can ship.
 */
export interface RolePhase {
  name: string
  tech: string[]
}

/** A named project inside a Role whose stack changed while Pavel was on it. */
export interface RoleProject {
  name: string
  phases: RolePhase[]
}

export interface RoleNote {
  /** Years only: the note shares the Experience list's column of years. */
  from: Year
  to: Year
  /** Stands where a Role has its company, for time with no single employer. */
  name: string
  title: string
  summary: string
  tech: string[]
}

export interface Role {
  /** The name in the Role's path, `~/experience/<slug>`. Stable once published. */
  slug: string
  /** Company name, as the company writes it. */
  company: string
  /** Pavel's title there. Shown small — the summary carries the weight. */
  title: string
  /** Roles are listed in descending `from`. */
  from: MonthDate
  /** `null` while Pavel still holds the Role. */
  to: MonthDate | null
  /** Leads with what was built, never with what he was employed as. */
  summary: string
  account: string[]
  /**
   * An entry the Experience list prints under this Role, for time before it
   * that was not a Role. It is not openable and has no slug.
   */
  before?: RoleNote
  history?: RoleProject[]
  stack: string[]
}

/**
 * What a Locale writes for a Role: everything but the technology names, which
 * are the same in every Locale and live in `technology.ts`.
 */
export interface RoleProse extends Omit<Role, 'stack' | 'before' | 'history'> {
  before?: Omit<RoleNote, 'tech'>
  history?: {
    name: string
    phases: Omit<RolePhase, 'tech'>[]
  }[]
}

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

/**
 * Spelled out digit by digit: `${number}` would let a dropped or doubled
 * digit through ('201', '20144').
 */
export type Year = `${'19' | '20'}${Digit}${Digit}`

export type MonthNumber = `0${Exclude<Digit, '0'>}` | '10' | '11' | '12'

/** A month as ISO 8601 writes it, `2023-06`: never words, which belong to a Locale. */
export type MonthDate = `${Year}-${MonthNumber}`
