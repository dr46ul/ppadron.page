/**
 * Plays a change to the DOM as motion: measures every landmark, makes the
 * change, measures again, then animates each landmark from where it was back to
 * where it now is (First, Last, Invert, Play).
 *
 * `landmarks` is called on both sides of the change and keyed, so an element
 * Vue replaced still pairs with the one it replaced. A key on only one side has
 * nowhere to come from and is left to the stylesheet.
 *
 * Scaled by height, so text that moves between two sizes grows or shrinks on
 * the way rather than jumping at the end. Only `transform`, so nothing below a
 * landmark is laid out again while it moves.
 */
export async function flip(
  landmarks: () => Map<string, Element>,
  change: () => Promise<void>,
): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return change()

  const before = new Map(
    [
      ...landmarks(),
    ].map(([key, element]) => [
      key,
      element.getBoundingClientRect(),
    ]),
  )

  await change()

  for (const [key, element] of landmarks()) {
    const from = before.get(key)
    if (!from)
      continue
    const to = element.getBoundingClientRect()
    element.animate([
      { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.height / to.height})` },
      { transform: 'none' },
    ], {
      // Moving across the screen rather than entering it, so in-out; under
      // 300ms, as it answers a click.
      duration: 250,
      easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    })
  }
}
