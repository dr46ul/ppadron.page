import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '~/composables/useTheme'

const html = document.documentElement

function systemPrefers(scheme: 'dark' | 'light') {
  const matchMedia = vi.fn((query: string) => ({
    matches: query === `(prefers-color-scheme: ${scheme})`,
  }))
  vi.stubGlobal('matchMedia', matchMedia)
}

describe('useTheme', () => {
  afterEach(() => {
    delete html.dataset.theme
    localStorage.clear()
    clearNuxtState('scheme')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('resolving what the page was painted in', () => {
    it('takes a choice the head script already applied over the system', () => {
      systemPrefers('dark')
      html.dataset.theme = 'teletype'
      const theme = useTheme()

      theme.resolve()

      expect(theme.scheme.value).toBe('light')
    })

    it('follows a light system when nothing was chosen', () => {
      systemPrefers('light')
      const theme = useTheme()

      theme.resolve()

      expect(theme.scheme.value).toBe('light')
    })

    it('follows a dark system when nothing was chosen', () => {
      systemPrefers('dark')
      const theme = useTheme()

      theme.resolve()

      expect(theme.scheme.value).toBe('dark')
    })

    it('leaves the attribute off when following the system', () => {
      systemPrefers('light')

      useTheme().resolve()

      expect(html.dataset.theme).toBeUndefined()
    })

    it('ignores an attribute that is not one of the themes', () => {
      systemPrefers('dark')
      html.dataset.theme = 'dracula'
      const theme = useTheme()

      theme.resolve()

      expect(theme.scheme.value).toBe('dark')
    })
  })

  describe('choosing', () => {
    it('repaints the page in the chosen theme', () => {
      useTheme().set('light')

      expect(html.dataset.theme).toBe('teletype')
    })

    it('keeps the choice for the next visit', () => {
      useTheme().set('light')

      expect(localStorage.getItem('theme')).toBe('teletype')
    })

    it('reports the choice', () => {
      const theme = useTheme()

      theme.set('light')

      expect(theme.scheme.value).toBe('light')
    })

    it('is one state, whoever asks for it', () => {
      useTheme().set('light')

      expect(useTheme().scheme.value).toBe('light')
    })

    it('still repaints when storage refuses the write', () => {
      vi.stubGlobal('localStorage', {
        clear: () => {},
        setItem: () => {
          throw new DOMException('full', 'QuotaExceededError')
        },
      })

      useTheme().set('light')

      expect(html.dataset.theme).toBe('teletype')
    })

    it('toggles from dark to light', () => {
      const theme = useTheme()
      theme.set('dark')

      theme.toggle()

      expect({ scheme: theme.scheme.value, theme: html.dataset.theme })
        .toEqual({ scheme: 'light', theme: 'teletype' })
    })

    it('toggles from light to dark', () => {
      const theme = useTheme()
      theme.set('light')

      theme.toggle()

      expect({ scheme: theme.scheme.value, theme: html.dataset.theme })
        .toEqual({ scheme: 'dark', theme: 'terminal' })
    })
  })

  describe('following the system', () => {
    it('hands the page back to the stylesheet\'s own query', () => {
      const theme = useTheme()
      theme.set('light')

      theme.set('system')

      expect(html.dataset.theme).toBeUndefined()
    })

    it('forgets the theme kept for the next visit', () => {
      const theme = useTheme()
      theme.set('light')

      theme.set('system')

      expect(localStorage.getItem('theme')).toBeNull()
    })

    it('still hands the page back when storage refuses the removal', () => {
      const theme = useTheme()
      theme.set('light')
      vi.stubGlobal('localStorage', {
        clear: () => {},
        removeItem: () => {
          throw new DOMException('denied', 'SecurityError')
        },
      })

      theme.set('system')

      expect(html.dataset.theme).toBeUndefined()
    })

    it('reports the theme the system shows', () => {
      systemPrefers('light')
      const theme = useTheme()
      theme.set('dark')

      theme.set('system')

      expect(theme.scheme.value).toBe('light')
    })

    it('toggles away from the theme the system shows', () => {
      systemPrefers('light')
      const theme = useTheme()
      theme.set('system')

      theme.toggle()

      expect(theme.scheme.value).toBe('dark')
    })
  })

  describe('what was chosen', () => {
    afterEach(() => clearNuxtState('theme'))

    it.each(['light', 'dark', 'system'] as const)('reports %s once it is chosen', (choice) => {
      systemPrefers('dark')
      const theme = useTheme()

      theme.set(choice)

      expect(theme.choice.value).toBe(choice)
    })

    it('reads a choice the head script applied as that choice', () => {
      systemPrefers('dark')
      html.dataset.theme = 'teletype'
      const theme = useTheme()

      theme.resolve()

      expect(theme.choice.value).toBe('light')
    })

    it('reads a page painted by the stylesheet alone as following the system', () => {
      systemPrefers('light')
      const theme = useTheme()
      theme.set('dark')
      delete html.dataset.theme

      theme.resolve()

      expect(theme.choice.value).toBe('system')
    })
  })
})
