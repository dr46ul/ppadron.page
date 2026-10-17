import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `useSession()` holds no component state, so every test here calls it
 * directly rather than reaching it through `Terminal`'s DOM — no component is
 * mounted in this file. `Terminal`'s own tests cover the wiring.
 */

/**
 * `$fetch` is an auto-import, not a global, so `vi.stubGlobal` cannot reach the
 * binding the composable holds: the real request goes out and a test asserting
 * `failed` passes because it genuinely failed.
 */
const { post } = vi.hoisted(() => ({ post: vi.fn() }))
mockNuxtImport('$fetch', () => post)

/** A draft the delivery's rules accept, so a send gets as far as `sent`. */
function enquiry(overrides: Partial<EnquiryDraft> = {}): EnquiryDraft {
  return {
    name: 'Dana',
    email: 'dana@example.test',
    message: 'Can you help with a checkout that loses carts?',
    ...overrides,
  }
}

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    post.mockReset()
    post.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('exec', () => {
    it('ignores an empty command', () => {
      const session = useSession()
      const before = session.entries.value.length

      session.exec('')

      expect(session.entries.value.length).toBe(before)
    })

    it('ignores whitespace on its own', () => {
      const session = useSession()
      const before = session.entries.value.length

      session.exec('   \t  ')

      expect(session.entries.value.length).toBe(before)
    })

    it('echoes the command before it has any output', () => {
      const session = useSession()

      session.exec('help')

      expect(session.entries.value.at(-1)).toMatchObject({
        cmd: 'help',
        output: null,
        animate: true,
      })
    })

    it('prints what a canonical command asks for', async () => {
      const session = useSession()

      session.exec('cat ~/colophon')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('colophon')
    })

    it('resolves an alias whatever case it is typed in', async () => {
      const session = useSession()

      session.exec('WoRk')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('experience')
    })

    it('echoes what the visitor typed, not what it resolved to', async () => {
      const session = useSession()

      session.exec('work')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.cmd).toBe('work')
    })

    it('resolves a canonical command typed in the wrong case', async () => {
      const session = useSession()

      session.exec('HELP')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('help')
    })

    it('looks for a command it does not have before reporting it', async () => {
      const session = useSession()

      session.exec('sudo rm -rf /')
      await vi.advanceTimersByTimeAsync(299)

      expect(session.entries.value.at(-1)!.output).toBeNull()

      await vi.advanceTimersByTimeAsync(1)

      expect(session.entries.value.at(-1)!.output).toBe('unknown')
    })
  })

  describe('the seeded transcript', () => {
    it('opens with the whole tour already printed', () => {
      const session = useSession()

      expect(session.entries.value.map(entry => entry.output)).toEqual([
        'whoami',
        'experience',
        'recommendations',
        'contact',
        'colophon',
      ])
    })

    it('does not animate what the visitor did not run', () => {
      const session = useSession()

      expect(session.entries.value.every(entry => !entry.animate)).toBe(true)
    })

    it('echoes each seeded command by its canonical spelling', () => {
      const session = useSession()

      expect(session.entries.value.map(entry => entry.cmd)).toEqual([
        'whoami',
        'ls ~/experience',
        'cat ~/recommendations',
        'mail pavel',
        'cat ~/colophon',
      ])
    })

    it('opens with the banner showing and nothing dropped', () => {
      const session = useSession()

      expect(session.cleared.value).toBe(false)
      expect(session.trimmed.value).toBe(0)
    })
  })

  describe('the scrollback cap', () => {
    /** `mail pavel` would filter the seeded form out and move the arithmetic. */
    async function overflow(session: ReturnType<typeof useSession>, runs: number) {
      for (let i = 0; i < runs; i++) {
        session.exec('help')
        await vi.runAllTimersAsync()
      }
    }

    it('grows up to the cap without dropping anything', async () => {
      const session = useSession()

      await overflow(session, 9)

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(session.trimmed.value).toBe(0)
    })

    it('holds at the cap and counts what it dropped', async () => {
      const session = useSession()

      await overflow(session, 12)

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(session.trimmed.value).toBe(3)
    })

    it('drops the oldest block first', async () => {
      const session = useSession()

      await overflow(session, 12)

      // Three gone means the transcript now opens on the fourth seeded block.
      expect(session.entries.value[0]!.cmd).toBe('mail pavel')
    })
  })

  describe('clear', () => {
    it('empties the scrollback and takes the banner with it', () => {
      const session = useSession()

      session.exec('clear')

      expect(session.entries.value).toEqual([])
      expect(session.cleared.value).toBe(true)
    })

    it('forgets how many blocks were dropped', async () => {
      const session = useSession()

      for (let i = 0; i < 12; i++) {
        session.exec('help')
        await vi.runAllTimersAsync()
      }
      session.exec('clear')

      expect(session.trimmed.value).toBe(0)
    })

    it('leaves itself in the history', () => {
      const session = useSession()

      session.exec('clear')
      session.recall(1)

      expect(session.input.value).toBe('clear')
    })
  })

  describe('reset', () => {
    it('puts the transcript back as it loaded', async () => {
      const session = useSession()

      session.exec('help')
      await vi.runAllTimersAsync()
      session.exec('clear')
      session.exec('reset')

      expect(session.entries.value.map(entry => entry.output)).toEqual([
        'whoami',
        'experience',
        'recommendations',
        'contact',
        'colophon',
      ])
      expect(session.cleared.value).toBe(false)
    })

    it('forgets how many blocks were dropped', async () => {
      const session = useSession()

      for (let i = 0; i < 12; i++) {
        session.exec('help')
        await vi.runAllTimersAsync()
      }
      session.exec('reset')

      expect(session.trimmed.value).toBe(0)
    })

    it('leaves no trace of itself in the history', () => {
      const session = useSession()

      session.exec('whoami')
      session.exec('reset')
      session.recall(1)

      expect(session.input.value).toBe('')
    })

    it('empties a part-typed prompt', () => {
      const session = useSession()

      session.input.value = 'sudo '
      session.exec('reset')

      expect(session.input.value).toBe('')
    })

    it('is reachable by alias', () => {
      const session = useSession()

      session.exec('clear')
      session.exec('restart')

      expect(session.cleared.value).toBe(false)
      expect(session.entries.value.length).toBe(5)
    })

    it('throws away the Enquiry draft and its state', async () => {
      const session = useSession()

      session.enquiry.edit(enquiry())
      await session.enquiry.submit()
      session.exec('reset')

      expect(session.enquiry.draft).toEqual({ name: '', email: '', message: '' })
      expect(session.enquiry.state).toBe('idle')
    })
  })

  describe('the enquiry form', () => {
    it('stays a singleton however often it is run', async () => {
      const session = useSession()

      session.exec('mail pavel')
      await vi.runAllTimersAsync()
      session.exec('contact')
      await vi.runAllTimersAsync()

      const forms = session.entries.value.filter(
        entry => entry.output === 'contact',
      )

      expect(forms.length).toBe(1)
    })

    it('reopens on a clean slate after a sent Enquiry', async () => {
      const session = useSession()

      session.enquiry.edit(enquiry())
      await session.enquiry.submit()

      expect(session.enquiry.state).toBe('sent')

      session.exec('mail pavel')

      expect(session.enquiry.draft).toEqual({ name: '', email: '', message: '' })
      expect(session.enquiry.state).toBe('idle')
    })

    it('keeps what the visitor had already typed', async () => {
      const session = useSession()

      session.enquiry.edit(enquiry({ message: 'half a thought' }))
      session.exec('mail pavel')
      await vi.runAllTimersAsync()

      expect(session.enquiry.draft.message).toBe('half a thought')
    })
  })

  describe('complete', () => {
    it('has nothing to complete from an empty prompt', () => {
      const session = useSession()

      session.complete()

      expect(session.input.value).toBe('')
    })

    it('has nothing to complete from whitespace', () => {
      const session = useSession()
      session.input.value = '  '

      session.complete()

      expect(session.input.value).toBe('  ')
    })

    it('leaves a prompt it cannot complete alone', () => {
      const session = useSession()
      session.input.value = 'zzz'

      session.complete()

      expect(session.input.value).toBe('zzz')
    })

    it('fills in an alias', () => {
      const session = useSession()
      session.input.value = 'reco'

      session.complete()

      expect(session.input.value).toBe('recommendations')
    })

    it('completes whatever case it was part-typed in', () => {
      const session = useSession()
      session.input.value = 'RECO'

      session.complete()

      expect(session.input.value).toBe('recommendations')
    })

    it('fills in a canonical spelling, spaces and all', () => {
      const session = useSession()
      session.input.value = 'cat ~/r'

      session.complete()

      expect(session.input.value).toBe('cat ~/recommendations')
    })

    it('fills in a meta command', () => {
      const session = useSession()
      session.input.value = 'res'

      session.complete()

      expect(session.input.value).toBe('reset')
    })

    it('prefers a canonical spelling to a meta command or an alias', () => {
      const session = useSession()
      session.input.value = 'c'

      session.complete()

      // `clear` and `contact` start with c too, but a completion should teach
      // the real spelling rather than the shortcut.
      expect(session.input.value).toBe('cat ~/recommendations')
    })

    describe('reporting whether it took the Tab', () => {
      it.each([
        ['an empty prompt', ''],
        ['whitespace', '  '],
        ['text that matches nothing', 'zzz'],
        ['a prompt already complete', 'whoami'],
      ])('reports nothing applied for %s', (_, typed) => {
        const session = useSession()
        session.input.value = typed

        expect(session.complete()).toBe(false)
      })

      it('reports a completion it applied', () => {
        const session = useSession()
        session.input.value = 'reco'

        expect(session.complete()).toBe(true)
      })

      it('reports a case-fix as applied, because the prompt did change', () => {
        const session = useSession()
        session.input.value = 'WHOAMI'

        expect(session.complete()).toBe(true)
        expect(session.input.value).toBe('whoami')
      })
    })
  })

  describe('recall', () => {
    function withHistory() {
      const session = useSession()
      session.exec('whoami')
      session.exec('help')

      return session
    }

    it('has nothing to recall on a fresh session', () => {
      const session = useSession()

      session.recall(1)

      expect(session.input.value).toBe('')
    })

    it('walks back through the history, most recent first', () => {
      const session = withHistory()

      session.recall(1)

      expect(session.input.value).toBe('help')

      session.recall(1)

      expect(session.input.value).toBe('whoami')
    })

    it('stops at the oldest command', () => {
      const session = withHistory()

      session.recall(1)
      session.recall(1)
      session.recall(1)

      expect(session.input.value).toBe('whoami')
    })

    it('walks forward to an empty prompt again', () => {
      const session = withHistory()

      session.recall(1)
      session.recall(1)
      session.recall(-1)

      expect(session.input.value).toBe('help')

      session.recall(-1)

      expect(session.input.value).toBe('')
    })

    it('stops at the empty prompt rather than wrapping round', () => {
      const session = withHistory()

      session.recall(-1)

      expect(session.input.value).toBe('')

      session.recall(1)

      expect(session.input.value).toBe('help')
    })
  })

  describe('reduced motion', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    function prefersReducedMotion(reduce: boolean) {
      const matchMedia = vi.fn(() => ({ matches: reduce }))
      vi.stubGlobal('matchMedia', matchMedia)

      return matchMedia
    }

    it('prints without a think delay', async () => {
      const session = useSession()
      prefersReducedMotion(true)

      // Even `help`, the quickest command, normally takes a beat.
      session.exec('help')
      await vi.advanceTimersByTimeAsync(0)

      expect(session.entries.value.at(-1)!.output).toBe('help')
    })

    it('asks the visitor, rather than assuming', () => {
      const session = useSession()
      const matchMedia = prefersReducedMotion(true)

      session.exec('help')

      expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    })

    it('jumps to the foot of the output instead of gliding', async () => {
      const session = useSession()
      prefersReducedMotion(true)
      const scrollTo = vi.fn()
      vi.stubGlobal('scrollTo', scrollTo)

      session.exec('help')
      await vi.runAllTimersAsync()

      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'auto' }),
      )
    })

    it('glides when the visitor has not asked it not to', async () => {
      const session = useSession()
      prefersReducedMotion(false)
      const scrollTo = vi.fn()
      vi.stubGlobal('scrollTo', scrollTo)

      session.exec('help')
      await vi.runAllTimersAsync()

      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      )
    })
  })

  describe('a block dropped while the machine is still thinking', () => {
    it('prints nothing and does not fall over', async () => {
      const session = useSession()

      // Fifteen: enough overflow to drop the slow command before its timer fires.
      session.exec('cat ~/recommendations')
      for (let i = 0; i < 15; i++)
        session.exec('help')

      await vi.runAllTimersAsync()

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(
        session.entries.value.some(entry => entry.output === 'recommendations'),
      ).toBe(false)
    })
  })
})
