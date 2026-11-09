/**
 * The two themes the Session can be printed in, as `main.css` declares them.
 * A Visitor talks about them as dark and light; the stylesheet and
 * `<html data-theme>` name them after what they are.
 *
 * See docs/adr/0011-a-terminal-and-a-teletype.md.
 */
export type Scheme = 'dark' | 'light'

export const THEMES = {
  dark: 'terminal',
  light: 'teletype',
} as const satisfies Record<Scheme, string>

export const SCHEMES = ['dark', 'light'] as const satisfies Scheme[]

/** Where an explicit choice is kept between visits. */
export const THEME_STORAGE_KEY = 'theme'

/**
 * Runs inline in `<head>`, before first paint, and only for a Visitor who has
 * chosen: anyone else gets no attribute, and the stylesheet's
 * `prefers-color-scheme` query decides without JavaScript. It cannot move into
 * a plugin or a component, which would run after the page has painted in the
 * wrong theme. Storage can refuse to be read (a private window, blocked site
 * data), and the page must still render, so a refusal falls back to the
 * system.
 */
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(Object.values(THEMES))}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`
