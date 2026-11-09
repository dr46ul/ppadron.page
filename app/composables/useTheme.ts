import type { Scheme } from '#shared/theme'
import { SCHEMES, THEME_STORAGE_KEY, THEMES } from '#shared/theme'

/**
 * Which of the two themes the Session is printed in, and the one way to change
 * it. The head script paints a saved choice before Vue exists, so the page
 * already shows the right theme; this only has to learn which one that was,
 * once the page is mounted, and to apply a new choice.
 *
 * See docs/adr/0011-a-terminal-and-a-teletype.md.
 */
export function useTheme() {
  // Dark is a guess the prerendered HTML has to make; `resolve` corrects it on
  // mount, and the stylesheet has already painted the right theme regardless.
  const scheme = useState<Scheme>('scheme', () => 'dark')

  function resolve() {
    const applied = html().dataset.theme
    const chosen = SCHEMES.find(candidate => THEMES[candidate] === applied)

    scheme.value = chosen
      ?? (window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark')
  }

  function set(next: Scheme) {
    scheme.value = next
    html().dataset.theme = THEMES[next]

    // A Visitor whose storage is blocked still gets the theme for this visit.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, THEMES[next])
    }
    catch {}
  }

  function toggle() {
    set(scheme.value === 'dark'
      ? 'light'
      : 'dark')
  }

  return {
    scheme: readonly(scheme),
    resolve,
    set,
    toggle,
  }
}

function html() {
  return document.documentElement
}
