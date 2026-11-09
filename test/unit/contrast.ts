/**
 * WCAG contrast for this project's palette, computed from the CSS rather than
 * trusted from a comment. The conversion is oklch → sRGB (D65) → relative
 * luminance, and compositing is `in srgb` because that is the space
 * `color-mix()` is asked for in `main.css`; mixing in oklab lands on a
 * different colour and so a different ratio.
 *
 * Reproduces the interface audit's measured ramp exactly (`/100` 18.10, `/60`
 * 6.86, `/50` 5.07, `/45` 4.31), which is what makes it usable as an oracle.
 */

export type Srgb = [number, number, number]

/** `Array.map` widens a tuple to `number[]`; this keeps it three channels long. */
function mapChannels(colour: Srgb, map: (channel: number, index: 0 | 1 | 2) => number): Srgb {
  const [r, g, b] = colour
  return [
    map(r, 0),
    map(g, 1),
    map(b, 2),
  ]
}

export function oklchToSrgb(l: number, c: number, hDeg: number): Srgb {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const lCube = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCube = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCube = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  const linear: Srgb = [
    4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
    -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
    -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
  ]

  return mapChannels(linear, (u) => {
    const encoded = u <= 0.0031308
      ? 12.92 * u
      : 1.055 * u ** (1 / 2.4) - 0.055
    return Math.min(1, Math.max(0, encoded))
  })
}

export function mixInSrgb(fg: Srgb, bg: Srgb, share: number): Srgb {
  return mapChannels(fg, (c, i) => c * share + bg[i] * (1 - share))
}

export function contrast(a: Srgb, b: Srgb): number {
  const luminance = (colour: Srgb) => {
    const [r, g, bl] = mapChannels(colour, c =>
      c <= 0.04045
        ? c / 12.92
        : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }

  const [lighter, darker] = [
    luminance(a),
    luminance(b),
  ].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

/** The `oklch(L% C H)` literal a token is declared with, as sRGB. */
export function parseOklchToken(css: string, token: string): Srgb {
  const match = css.match(
    new RegExp(`--${token}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`),
  )
  if (!match)
    throw new Error(`no oklch declaration for --${token}`)
  return oklchToSrgb(Number(match[1]) / 100, Number(match[2]), Number(match[3]))
}
