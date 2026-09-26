/**
 * The site is a terminal session. This composable is its shell: what commands
 * exist, what they print, and how the scrollback behaves. Components render
 * the output; none of them decide what a command means.
 *
 * See docs/adr/0004-the-site-is-a-terminal-session.md.
 */
export type SessionOutput
  = | 'whoami'
    | 'experience'
    | 'recommendations'
    | 'contact'
    | 'colophon'
    | 'help'
    | 'unknown'

export interface SessionCommand {
  /** The canonical spelling, as it is echoed and as the chips advertise it. */
  cmd: string
  output: SessionOutput
  /** What the chip's title and the `help` listing say it does. */
  label: string
  /**
   * How long the machine appears to spend on it. A constant delay is the tell
   * that there is no machine behind the prompt: `help` is a built-in and
   * answers instantly, reading a file takes a beat, and opening a mail client
   * takes longer than either.
   */
  think: number
}

export interface SessionEntry {
  id: number
  cmd: string
  /** null while the machine is still thinking. */
  output: SessionOutput | null
  /** Run by hand, so it prints a line at a time. Seeded entries do not. */
  animate: boolean
}

/**
 * A draft Enquiry, as it stands before it is sent. The session owns the draft;
 * the form is handed it as a prop and reports a whole new one rather than
 * writing into it.
 */
export interface Enquiry {
  name: string
  email: string
  message: string
}

/** How far a submitted Enquiry has got. */
export type EnquiryState = 'idle' | 'sending' | 'sent' | 'failed'

export const commands: SessionCommand[] = [
  { cmd: 'whoami', output: 'whoami', label: 'who I am', think: 260 },
  {
    cmd: 'ls ~/experience',
    output: 'experience',
    label: 'the work itself',
    think: 380,
  },
  {
    cmd: 'cat ~/recommendations',
    output: 'recommendations',
    label: 'what colleagues say',
    think: 540,
  },
  {
    cmd: 'mail pavel',
    output: 'contact',
    label: 'send me a message',
    think: 660,
  },
  {
    cmd: 'cat ~/colophon',
    output: 'colophon',
    label: 'how this page is built',
    think: 480,
  },
  { cmd: 'help', output: 'help', label: 'this list', think: 180 },
]

/** Commands that act on the session itself rather than printing anything. */
export interface MetaCommand {
  cmd: string
  label: string
}

export const metaCommands: MetaCommand[] = [
  { cmd: 'reset', label: 'back to how the page loaded' },
  { cmd: 'clear', label: 'empty the scrollback' },
]

/** What a visitor is likely to type instead of the canonical spelling. */
export const aliases: Record<string, string> = {
  'about': 'whoami',
  'me': 'whoami',
  'experience': 'ls ~/experience',
  'work': 'ls ~/experience',
  'ls': 'ls ~/experience',
  'recommendations': 'cat ~/recommendations',
  'rec': 'cat ~/recommendations',
  'contact': 'mail pavel',
  'mail': 'mail pavel',
  'email': 'mail pavel',
  'colophon': 'cat ~/colophon',
  'source': 'cat ~/colophon',
  '?': 'help',
  'man': 'help',
  'restart': 'reset',
}

/** What the transcript holds when the page loads, in order. */
const TOUR: SessionOutput[] = [
  'whoami',
  'experience',
  'recommendations',
  'contact',
  'colophon',
]

/**
 * A terminal's scrollback is finite and so is this one. Without a cap the DOM
 * grows without bound as a visitor works through the command chips.
 */
const SCROLLBACK = 14

/** A command that does not exist still has to be looked for. */
const THINK_UNKNOWN = 300

export function useSession() {
  let nextId = 0

  function seed(): SessionEntry[] {
    return TOUR.map(output => ({
      id: nextId++,
      cmd: commands.find(entry => entry.output === output)!.cmd,
      output,
      animate: false,
    }))
  }

  const entries = ref<SessionEntry[]>(seed())
  const trimmed = ref(0)
  /** `clear` takes the login banner with it; only `reset` brings it back. */
  const cleared = ref(false)

  const input = ref('')
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  const contact = reactive<Enquiry>({ name: '', email: '', message: '' })
  const contactState = ref<EnquiryState>('idle')

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Follow the output to the foot of the document. The print cascade animates
   * opacity and transform only, so a block occupies its full height the moment
   * it renders — one scroll lands correctly and there is nothing to chase.
   */
  function scrollToEnd() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    })
  }

  /** Back to the transcript as it loaded. A reset is not an animation. */
  function reset() {
    entries.value = seed()
    trimmed.value = 0
    cleared.value = false
    history.value = []
    historyIndex.value = -1
    input.value = ''
    contactState.value = 'idle'
    contact.name = ''
    contact.email = ''
    contact.message = ''

    nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  function clear() {
    entries.value = []
    trimmed.value = 0
    cleared.value = true

    nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  function exec(raw: string) {
    const typed = raw.trim()
    if (!typed)
      return

    const normalised = aliases[typed.toLowerCase()] ?? typed.toLowerCase()

    // A reset leaves no trace of itself, or ↑ would recall the word "reset"
    // into a prompt that is supposed to look untouched.
    if (normalised === 'reset') {
      reset()
      return
    }

    history.value.unshift(typed)
    historyIndex.value = -1
    input.value = ''

    if (normalised === 'clear') {
      clear()
      return
    }

    const command = commands.find(entry => entry.cmd === normalised)
    const output = command?.output ?? 'unknown'

    // The Enquiry form is a singleton. A second copy would be a second form
    // bound to the same state, so typing into one would fill the other.
    if (output === 'contact') {
      entries.value = entries.value.filter(
        existing => existing.output !== 'contact',
      )
      contactState.value = 'idle'
    }

    // The echo is instant — the visitor typed it, the machine did not produce it.
    const id = nextId++
    entries.value.push({ id, cmd: typed, output: null, animate: true })

    const overflow = entries.value.length - SCROLLBACK
    if (overflow > 0) {
      entries.value.splice(0, overflow)
      trimmed.value += overflow
    }

    // Twice: once so the blinking cursor is visible while the machine works,
    // and once when the block itself has landed.
    nextTick(scrollToEnd)

    window.setTimeout(
      () => {
        // Mutate through the array, never through the object that was pushed:
        // a ref hands the template a reactive proxy of each entry, and writing
        // to the raw object behind it notifies nothing.
        const target = entries.value.find(existing => existing.id === id)
        if (!target)
          return

        target.output = output
        nextTick(scrollToEnd)
      },
      reducedMotion() ? 0 : (command?.think ?? THINK_UNKNOWN),
    )
  }

  /** Tab completion over every spelling a visitor might be part-way through. */
  function complete() {
    const typed = input.value.trim().toLowerCase()
    if (!typed)
      return

    const pool = [
      ...commands.map(entry => entry.cmd),
      ...metaCommands.map(entry => entry.cmd),
      ...Object.keys(aliases),
    ]

    const hit = pool.find(entry => entry.startsWith(typed))
    if (hit)
      input.value = hit
  }

  function recall(offset: number) {
    const next = historyIndex.value + offset
    if (next < -1 || next >= history.value.length)
      return

    historyIndex.value = next
    input.value = next === -1 ? '' : history.value[next]!
  }

  async function send() {
    contactState.value = 'sending'

    try {
      await $fetch('/api/contact', { method: 'POST', body: { ...contact } })
      contactState.value = 'sent'
    }
    catch {
      contactState.value = 'failed'
    }
  }

  return {
    entries,
    trimmed,
    cleared,
    scrollback: SCROLLBACK,
    input,
    exec,
    complete,
    recall,
    contact,
    contactState,
    send,
  }
}

/**
 * There is exactly one session on the page, and the Enquiry form lives inside
 * its output rather than beside it — so the shell is provided down the tree
 * rather than threaded through props on every block.
 */
const SessionKey: InjectionKey<ReturnType<typeof useSession>>
  = Symbol('session')

export function provideSession() {
  const session = useSession()
  provide(SessionKey, session)

  return session
}

export function injectSession() {
  const session = inject(SessionKey)
  if (!session)
    throw new Error('injectSession() must be called inside <SessionTerminal>')

  return session
}
