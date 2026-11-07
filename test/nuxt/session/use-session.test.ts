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

/** Slugs the real Content does not have: `useSession` only knows what it is handed. */
const SLUGS = ['kiln-and-ash', 'kelp-and-tar']

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
      const session = useSession(SLUGS)
      const before = session.entries.value.length

      session.exec('')

      expect(session.entries.value.length).toBe(before)
    })

    it('ignores whitespace on its own', () => {
      const session = useSession(SLUGS)
      const before = session.entries.value.length

      session.exec('   \t  ')

      expect(session.entries.value.length).toBe(before)
    })

    it('echoes the command before it has any output', () => {
      const session = useSession(SLUGS)

      session.exec('help')

      expect(session.entries.value.at(-1)).toMatchObject({
        cmd: 'help',
        output: null,
        animate: true,
      })
    })

    it('prints what a canonical command asks for', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/colophon')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('colophon')
    })

    it('resolves an alias whatever case it is typed in', async () => {
      const session = useSession(SLUGS)

      session.exec('WoRk')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('experience')
    })

    it('echoes what the visitor typed, not what it resolved to', async () => {
      const session = useSession(SLUGS)

      session.exec('work')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.cmd).toBe('work')
    })

    it('resolves a canonical command typed in the wrong case', async () => {
      const session = useSession(SLUGS)

      session.exec('HELP')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('help')
    })

    it('looks for a command it does not have before reporting it', async () => {
      const session = useSession(SLUGS)

      session.exec('sudo rm -rf /')
      await vi.advanceTimersByTimeAsync(299)

      expect(session.entries.value.at(-1)!.output).toBeNull()

      await vi.advanceTimersByTimeAsync(1)

      expect(session.entries.value.at(-1)!.output).toBe('unknown')
    })
  })

  describe('reading one Role', () => {
    it('prints Role detail and records which Role it printed', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/experience/kelp-and-tar')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)).toMatchObject({
        cmd: 'cat ~/experience/kelp-and-tar',
        output: 'role-detail',
        slug: 'kelp-and-tar',
      })
    })

    it('finds the Role whatever case it is typed in, and echoes it as typed', async () => {
      const session = useSession(SLUGS)

      session.exec('CAT ~/Experience/KILN-and-Ash')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)).toMatchObject({
        cmd: 'CAT ~/Experience/KILN-and-Ash',
        output: 'role-detail',
        slug: 'kiln-and-ash',
      })
    })

    it('hands an unknown name on as typed, for Role detail to say it has no such file', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/experience/Nowhere-Inc')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)).toMatchObject({
        output: 'role-detail',
        slug: 'Nowhere-Inc',
      })
    })

    it('treats a missing name as an unknown one, not as an unknown command', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/experience/')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)).toMatchObject({
        output: 'role-detail',
        slug: '',
      })
    })

    it('holds no Role until a path names one', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/colophon')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.slug).toBeUndefined()
    })

    it.each([
      ['a directory rather than a file', 'cat ~/experience'],
      ['a path that only starts the same', 'cat ~/experienced/kiln-and-ash'],
      ['another program', 'rm ~/experience/kiln-and-ash'],
    ])('leaves %s to the unknown output', async (_, cmd) => {
      const session = useSession(SLUGS)

      session.exec(cmd)
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('unknown')
    })

    it('reads a file for as long as the other Commands that read one', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/experience/kiln-and-ash')
      await vi.advanceTimersByTimeAsync(479)

      expect(session.entries.value.at(-1)!.output).toBeNull()

      await vi.advanceTimersByTimeAsync(1)

      expect(session.entries.value.at(-1)!.output).toBe('role-detail')
    })

    it('prints a Role again when it is asked for again, up to the cap', async () => {
      const session = useSession(SLUGS)

      for (let i = 0; i < 12; i++) {
        session.exec('cat ~/experience/kiln-and-ash')
        await vi.runAllTimersAsync()
      }

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(session.trimmed.value).toBe(3)
      expect(session.entries.value.at(-1)).toMatchObject({
        output: 'role-detail',
        slug: 'kiln-and-ash',
      })
    })

    it('stays out of the tour after a reset', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/experience/kiln-and-ash')
      await vi.runAllTimersAsync()
      session.exec('reset')

      expect(session.entries.value.map(entry => entry.output)).not.toContain('role-detail')
      expect(session.entries.value.every(entry => entry.slug === undefined)).toBe(true)
    })
  })

  describe('reading the Background', () => {
    it('prints it', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/about')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('background')
    })

    it('is what `about` means now', async () => {
      const session = useSession(SLUGS)

      session.exec('about')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('background')
    })

    it('leaves `me` on whoami', async () => {
      const session = useSession(SLUGS)

      session.exec('me')
      await vi.runAllTimersAsync()

      expect(session.entries.value.at(-1)!.output).toBe('whoami')
    })

    it('reads a file for as long as the other Commands that read one', async () => {
      const session = useSession(SLUGS)

      session.exec('cat ~/about')
      await vi.advanceTimersByTimeAsync(439)

      expect(session.entries.value.at(-1)!.output).toBeNull()

      await vi.advanceTimersByTimeAsync(1)

      expect(session.entries.value.at(-1)!.output).toBe('background')
    })
  })

  describe('the seeded transcript', () => {
    it('opens with the whole tour already printed', () => {
      const session = useSession(SLUGS)

      expect(session.entries.value.map(entry => entry.output)).toEqual([
        'whoami',
        'experience',
        'recommendations',
        'contact',
        'colophon',
      ])
    })

    it('does not animate what the visitor did not run', () => {
      const session = useSession(SLUGS)

      expect(session.entries.value.every(entry => !entry.animate)).toBe(true)
    })

    it('echoes each seeded command by its canonical spelling', () => {
      const session = useSession(SLUGS)

      expect(session.entries.value.map(entry => entry.cmd)).toEqual([
        'whoami',
        'ls ~/experience',
        'cat ~/recommendations',
        'mail pavel',
        'cat ~/colophon',
      ])
    })

    it('opens with the banner showing and nothing dropped', () => {
      const session = useSession(SLUGS)

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
      const session = useSession(SLUGS)

      await overflow(session, 9)

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(session.trimmed.value).toBe(0)
    })

    it('holds at the cap and counts what it dropped', async () => {
      const session = useSession(SLUGS)

      await overflow(session, 12)

      expect(session.entries.value.length).toBe(session.scrollback)
      expect(session.trimmed.value).toBe(3)
    })

    it('drops the oldest block first', async () => {
      const session = useSession(SLUGS)

      await overflow(session, 12)

      // Three gone means the transcript now opens on the fourth seeded block.
      expect(session.entries.value[0]!.cmd).toBe('mail pavel')
    })
  })

  describe('clear', () => {
    it('empties the scrollback and takes the banner with it', () => {
      const session = useSession(SLUGS)

      session.exec('clear')

      expect(session.entries.value).toEqual([])
      expect(session.cleared.value).toBe(true)
    })

    it('forgets how many blocks were dropped', async () => {
      const session = useSession(SLUGS)

      for (let i = 0; i < 12; i++) {
        session.exec('help')
        await vi.runAllTimersAsync()
      }
      session.exec('clear')

      expect(session.trimmed.value).toBe(0)
    })

    it('leaves itself in the history', () => {
      const session = useSession(SLUGS)

      session.exec('clear')
      session.recall(1)

      expect(session.input.value).toBe('clear')
    })
  })

  describe('reset', () => {
    it('puts the transcript back as it loaded', async () => {
      const session = useSession(SLUGS)

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
      const session = useSession(SLUGS)

      for (let i = 0; i < 12; i++) {
        session.exec('help')
        await vi.runAllTimersAsync()
      }
      session.exec('reset')

      expect(session.trimmed.value).toBe(0)
    })

    it('leaves no trace of itself in the history', () => {
      const session = useSession(SLUGS)

      session.exec('whoami')
      session.exec('reset')
      session.recall(1)

      expect(session.input.value).toBe('')
    })

    it('empties a part-typed prompt', () => {
      const session = useSession(SLUGS)

      session.input.value = 'sudo '
      session.exec('reset')

      expect(session.input.value).toBe('')
    })

    it('is reachable by alias', () => {
      const session = useSession(SLUGS)

      session.exec('clear')
      session.exec('restart')

      expect(session.cleared.value).toBe(false)
      expect(session.entries.value.length).toBe(5)
    })

    it('throws away the Enquiry draft and its state', async () => {
      const session = useSession(SLUGS)

      session.enquiry.edit(enquiry())
      await session.enquiry.submit()
      session.exec('reset')

      expect(session.enquiry.draft).toEqual({ name: '', email: '', message: '' })
      expect(session.enquiry.state).toBe('idle')
    })
  })

  describe('the enquiry form', () => {
    it('stays a singleton however often it is run', async () => {
      const session = useSession(SLUGS)

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
      const session = useSession(SLUGS)

      session.enquiry.edit(enquiry())
      await session.enquiry.submit()

      expect(session.enquiry.state).toBe('sent')

      session.exec('mail pavel')

      expect(session.enquiry.draft).toEqual({ name: '', email: '', message: '' })
      expect(session.enquiry.state).toBe('idle')
    })

    it('keeps what the visitor had already typed', async () => {
      const session = useSession(SLUGS)

      session.enquiry.edit(enquiry({ message: 'half a thought' }))
      session.exec('mail pavel')
      await vi.runAllTimersAsync()

      expect(session.enquiry.draft.message).toBe('half a thought')
    })
  })

  describe('completion', () => {
    it.each([
      ['an empty prompt', ''],
      ['whitespace', '  '],
      ['text that matches nothing', 'zzz'],
      ['a prompt already complete', 'whoami'],
    ])('has nothing to offer for %s', (_, typed) => {
      const session = useSession(SLUGS)
      session.input.value = typed

      expect(session.completion.value).toBeUndefined()
    })

    it('offers an alias', () => {
      const session = useSession(SLUGS)
      session.input.value = 'reco'

      expect(session.completion.value).toBe('recommendations')
    })

    it('completes whatever case it was part-typed in', () => {
      const session = useSession(SLUGS)
      session.input.value = 'RECO'

      expect(session.completion.value).toBe('recommendations')
    })

    it('offers a case-fix, because it would change the prompt', () => {
      const session = useSession(SLUGS)
      session.input.value = 'WHOAMI'

      expect(session.completion.value).toBe('whoami')
    })

    it('offers a canonical spelling, spaces and all', () => {
      const session = useSession(SLUGS)
      session.input.value = 'cat ~/r'

      expect(session.completion.value).toBe('cat ~/recommendations')
    })

    it('offers a meta command', () => {
      const session = useSession(SLUGS)
      session.input.value = 'res'

      expect(session.completion.value).toBe('reset')
    })

    it('prefers a canonical spelling to a meta command or an alias', () => {
      const session = useSession(SLUGS)
      session.input.value = 'c'

      // `clear` and `contact` start with c too, but a completion should teach
      // the real spelling rather than the shortcut.
      expect(session.completion.value).toBe('cat ~/about')
    })

    it.each([
      ['cat ~/experience/ki', 'cat ~/experience/kiln-and-ash'],
      ['cat ~/experience/ke', 'cat ~/experience/kelp-and-tar'],
      ['CAT ~/EXPERIENCE/KE', 'cat ~/experience/kelp-and-tar'],
    ])('completes %s to the full path of its Role', (typed, path) => {
      const session = useSession(SLUGS)
      session.input.value = typed

      expect(session.completion.value).toBe(path)
    })

    it('offers the first Role for a bare directory', () => {
      const session = useSession(SLUGS)
      session.input.value = 'cat ~/experience/'

      expect(session.completion.value).toBe('cat ~/experience/kiln-and-ash')
    })

    it('has nothing to offer for a Role path already complete', () => {
      const session = useSession(SLUGS)
      session.input.value = 'cat ~/experience/kiln-and-ash'

      expect(session.completion.value).toBeUndefined()
    })

    it('has nothing to offer for a Role it was not handed', () => {
      const session = useSession(SLUGS)
      session.input.value = 'cat ~/experience/z'

      expect(session.completion.value).toBeUndefined()
    })

    it('still completes the other files once Roles are in the pool', () => {
      const session = useSession(SLUGS)
      session.input.value = 'cat ~/a'

      expect(session.completion.value).toBe('cat ~/about')
    })

    it('follows the prompt as it is typed', () => {
      const session = useSession(SLUGS)
      session.input.value = 'reco'
      session.input.value = 'res'

      expect(session.completion.value).toBe('reset')
    })

    it('leaves the prompt alone until it is applied', () => {
      const session = useSession(SLUGS)
      session.input.value = 'reco'

      expect(session.completion.value).toBe('recommendations')
      expect(session.input.value).toBe('reco')
    })
  })

  describe('recall', () => {
    function withHistory() {
      const session = useSession(SLUGS)
      session.exec('whoami')
      session.exec('help')

      return session
    }

    it('has nothing to recall on a fresh session', () => {
      const session = useSession(SLUGS)

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
      const session = useSession(SLUGS)
      prefersReducedMotion(true)

      // Even `help`, the quickest command, normally takes a beat.
      session.exec('help')
      await vi.advanceTimersByTimeAsync(0)

      expect(session.entries.value.at(-1)!.output).toBe('help')
    })

    it('asks the visitor, rather than assuming', () => {
      const session = useSession(SLUGS)
      const matchMedia = prefersReducedMotion(true)

      session.exec('help')

      expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    })

    it('jumps to the foot of the output instead of gliding', async () => {
      const session = useSession(SLUGS)
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
      const session = useSession(SLUGS)
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
      const session = useSession(SLUGS)

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
