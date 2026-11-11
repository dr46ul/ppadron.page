import type { Scheme, ThemeChoice } from '#shared/theme'
import { SCHEMES, THEME_STORAGE_KEY, THEMES } from '#shared/theme'

/**
 * Which of the two themes the Session is printed in, what the Visitor chose to
 * get there, and the one way to change it. The head script paints a saved
 * choice before Vue exists, so the page already shows the right theme; this
 * only has to learn which one that was, once the page is mounted, and to apply
 * a new choice.
 *
 * See docs/adr/0011-a-terminal-and-a-teletype.md.
 */
export function useTheme() {
  // Dark is a guess the prerendered HTML has to make; `resolve` corrects it on
  // mount, and the stylesheet has already painted the right theme regardless.
  const scheme = useState<Scheme>('scheme', () => 'dark')
  const choice = useState<ThemeChoice>('theme', () => 'system')

  function resolve() {
    const applied = html().dataset.theme
    const chosen = SCHEMES.find(candidate => THEMES[candidate] === applied)

    choice.value = chosen ?? 'system'
    scheme.value = chosen ?? systemScheme()
  }

  function set(next: ThemeChoice) {
    choice.value = next

    if (next === 'system') {
      scheme.value = systemScheme()
      delete html().dataset.theme
      forget()
      return
    }

    scheme.value = next
    html().dataset.theme = THEMES[next]
    keep(next)
  }

  function toggle() {
    set(scheme.value === 'dark'
      ? 'light'
      : 'dark')
  }

  return {
    scheme: readonly(scheme),
    choice: readonly(choice),
    resolve,
    set,
    toggle,
  }
}

function html() {
  return document.documentElement
}

function systemScheme(): Scheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

// A Visitor whose storage is blocked still gets the theme for this visit.
function keep(scheme: Scheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, THEMES[scheme])
  }
  catch {}
}

function forget() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  }
  catch {}
}
