/**
 * Experience is the site's only proof surface — see
 * docs/adr/0001-experience-is-the-only-proof-surface.md.
 *
 * Every string below is a labelled placeholder sized to realistic content
 * length so the layout is honest about what it will hold. Nothing here is
 * fabricated experience. Replace the brackets; keep the shape.
 */
export interface Role {
  /** Company name, as the company writes it. */
  company: string
  /** Pavel's title there. Shown small — the summary carries the weight. */
  title: string
  /** Display range, most recent first. */
  period: string
  /** Machine-readable start, for ordering and <time datetime>. */
  since: string
  /** Leads with what was built, never with what he was employed as. */
  summary: string
  tech: string[]
}

export const roles: Role[] = [
  {
    company: '[Company]',
    title: '[Title]',
    period: '2022 — now',
    since: '2022',
    summary:
      '[What was built here, in two or three lines. Lead with the work and the outcome, not the job title — around 180 characters, which is about this long, ending on something concrete.]',
    tech: ['[tech]', '[tech]', '[tech]', '[tech]'],
  },
  {
    company: '[Company]',
    title: '[Title]',
    period: '2019 — 2022',
    since: '2019',
    summary:
      '[What was built here, in two or three lines. Lead with the work and the outcome, not the job title — around 180 characters, which is about this long, ending on something concrete.]',
    tech: ['[tech]', '[tech]', '[tech]'],
  },
  {
    company: '[Company]',
    title: '[Title]',
    period: '2016 — 2019',
    since: '2016',
    summary:
      '[What was built here, in two or three lines. Lead with the work and the outcome, not the job title — around 180 characters, which is about this long, ending on something concrete.]',
    tech: ['[tech]', '[tech]', '[tech]', '[tech]', '[tech]'],
  },
  {
    company: '[Company]',
    title: '[Title]',
    period: '2013 — 2016',
    since: '2013',
    summary:
      '[What was built here, in two or three lines. Lead with the work and the outcome, not the job title — around 180 characters, which is about this long.]',
    tech: ['[tech]', '[tech]', '[tech]'],
  },
]
