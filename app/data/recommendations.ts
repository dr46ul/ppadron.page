/**
 * Recommendations are verbatim quotes from former colleagues and managers,
 * taken from LinkedIn and attributed by name, title and company. They never
 * come from freelance clients, and the page says so plainly rather than
 * letting a visitor infer client references.
 *
 * Placeholders below are sized to a realistic LinkedIn recommendation.
 */
export interface Recommendation {
  /** The quote, verbatim. Never paraphrased, never trimmed for fit. */
  quote: string
  name: string
  title: string
  company: string
  /** How this person knows Pavel — the claim the site makes plainly. */
  relationship: string
}

export const recommendations: Recommendation[] = [
  {
    quote:
      '[Verbatim LinkedIn recommendation, pasted unedited. These usually run 45 to 70 words and mention a specific thing the person saw Pavel do, which is the part that makes them worth quoting at all. Around this long.]',
    name: '[Name]',
    title: '[Title]',
    company: '[Company]',
    relationship: 'Worked with Pavel at [Company]',
  },
  {
    quote:
      '[Verbatim LinkedIn recommendation, pasted unedited. These usually run 45 to 70 words and mention a specific thing the person saw Pavel do, which is the part that makes them worth quoting at all.]',
    name: '[Name]',
    title: '[Title]',
    company: '[Company]',
    relationship: 'Managed Pavel at [Company]',
  },
  {
    quote:
      '[Verbatim LinkedIn recommendation, pasted unedited. These usually run 45 to 70 words and mention a specific thing the person saw Pavel do.]',
    name: '[Name]',
    title: '[Title]',
    company: '[Company]',
    relationship: 'Worked with Pavel at [Company]',
  },
]
