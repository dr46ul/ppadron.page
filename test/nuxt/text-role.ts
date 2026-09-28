/**
 * The role token an element carries, for asserting that a component steps text
 * back by the amount it means to.
 *
 * `test/unit/text-roles.test.ts` bars the raw opacity utility and
 * `test/unit/theme-tokens.test.ts` measures what each role resolves to, so what
 * is left to prove is per-element: that this paragraph is prose and that one is
 * chrome. Swapping two roles is a visible regression no other test can see.
 *
 * Selection is by what an element prints rather than by its position, so an
 * assertion reads as a specification and survives the markup being reordered.
 */

const roles = ['text-body', 'text-muted', 'text-subtle']

interface Element {
  text: () => string
  classes: () => string[]
}

interface Component {
  findAll: (selector: string) => Element[]
}

/**
 * The role on the `selector` element printing `text`, or `undefined` where it
 * carries none — which is how full-strength `base-content` is asserted, since
 * that is the absence of a step rather than a token of its own.
 */
export function roleOf(
  component: Component,
  selector: string,
  text: string,
): string | undefined {
  const matches = component
    .findAll(selector)
    .filter(element => element.text().includes(text))

  if (matches.length === 0)
    throw new Error(`no ${selector} prints ${JSON.stringify(text)}`)

  // Two matches mean the selector is ambiguous, and the assertion would be
  // made against whichever happened to come first.
  if (matches.length > 1)
    throw new Error(`${matches.length} ${selector} print ${JSON.stringify(text)}`)

  return matches[0]!.classes().find(name => roles.includes(name))
}

/** The role on every `selector` element, in document order. */
export function rolesOf(component: Component, selector: string) {
  return component
    .findAll(selector)
    .map(element => element.classes().find(name => roles.includes(name)))
}
