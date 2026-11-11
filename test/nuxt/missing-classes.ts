/** The wanted classes an element does not carry, so a failure names the ones it lacks. */
export function missingClasses(classes: string[], wanted: string[]) {
  return wanted.filter(name => !classes.includes(name))
}
