/**
 * The site is a terminal session. This composable is its shell: what commands
 * exist, what they print, and how the scrollback behaves. Components render
 * the output; none of them decide what a command means.
 *
 * See docs/adr/0004-the-site-is-a-terminal-session.md.
 */
import type { ThemeChoice } from '#shared/theme'

export type SessionOutput
  = | 'whoami'
    | 'experience'
    | 'recommendations'
    | 'contact'
    | 'colophon'
    | 'help'
    | 'background'
    | 'role-detail'
    | 'unknown'

export interface SessionCommand {
  /** The canonical spelling, as it is echoed and as the palette lists it. */
  cmd: string
  output: SessionOutput
  /** What the palette and the `help` listing say it does. */
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
  /**
   * The Role a `role-detail` entry asked for: its slug, or, where no Role has
   * that slug, the name as typed so Role detail can say what it could not find.
   * Empty on every other output.
   */
  roleName: string
  /** Run by hand, so it prints a line at a time. Seeded entries do not. */
  animate: boolean
}

export const commands: SessionCommand[] = [
  {
    cmd: 'whoami',
    output: 'whoami',
    label: 'who I am',
    think: 260,
  },
  {
    cmd: 'cat ~/about',
    output: 'background',
    label: 'the longer story',
    think: 440,
  },
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
  {
    cmd: 'help',
    output: 'help',
    label: 'this list',
    think: 180,
  },
]

/** Commands that act on the session itself rather than printing anything. */
export interface MetaCommand {
  cmd: string
  label: string
}

export const metaCommands: MetaCommand[] = [
  { cmd: 'reset', label: 'back to how the page loaded' },
  { cmd: 'clear', label: 'empty the scrollback' },
  { cmd: 'theme', label: 'light, dark, or follow the system' },
]

/**
 * `theme` on its own toggles; with a flag it sets that choice. Without the
 * flag, `theme dark` and `theme light` read the way a Visitor would say them.
 */
const THEME_COMMANDS: Record<string, ThemeChoice | 'toggle'> = {
  'theme': 'toggle',
  'theme --light': 'light',
  'theme --dark': 'dark',
  'theme --system': 'system',
  'theme dark': 'dark',
  'theme light': 'light',
}

/** What a visitor is likely to type instead of the canonical spelling. */
export const aliases: Record<string, string> = {
  'about': 'cat ~/about',
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
  'dark': 'theme dark',
  'light': 'theme light',
}

/**
 * Takes the Role as an argument, so it stays out of `commands`: a row per Role
 * would grow the palette with Content.
 */
const ROLE_DETAIL = {
  path: 'cat ~/experience/',
  output: 'role-detail',
  think: 480,
} satisfies Pick<SessionCommand, 'output' | 'think'> & { path: string }

function rolePath(slug: string) {
  return ROLE_DETAIL.path + slug
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
 * grows without bound as a visitor works through the commands.
 */
const SCROLLBACK = 14

/** A command that does not exist still has to be looked for. */
const THINK_UNKNOWN = 300

export function useSession(roleSlugs: string[]) {
  let nextId = 0

  function seed(): SessionEntry[] {
    return TOUR.map(output => ({
      id: nextId++,
      cmd: commands.find(entry => entry.output === output)!.cmd,
      output,
      roleName: '',
      animate: false,
    }))
  }

  const entries = ref<SessionEntry[]>(seed())
  const trimmed = ref(0)

  const input = ref('')
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  const enquiry = useEnquiry()
  const theme = useTheme()

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function scrollBehavior(): ScrollBehavior {
    return reducedMotion()
      ? 'auto'
      : 'smooth'
  }

  /**
   * Follow the output to the foot of the document. The print cascade animates
   * opacity and transform only, so a block occupies its full height the moment
   * it renders — one scroll lands correctly and there is nothing to chase.
   */
  function scrollToEnd() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: scrollBehavior(),
    })
  }

  /**
   * Follow a block that has just printed: to the foot of the page, unless the
   * block is taller than the window, when the foot would leave the Visitor at
   * its end and they would have to scroll back up to find where it starts.
   * Found by the `data-entry` Terminal stamps on each block; with none
   * rendered, there is only the foot to go to.
   */
  function scrollToPrinted(id: number) {
    const block = document.querySelector(`[data-entry="${id}"]`)
    const foot = document.body.scrollHeight - window.innerHeight
    if (block && window.scrollY + block.getBoundingClientRect().top < foot) {
      block.scrollIntoView({
        block: 'start',
        behavior: scrollBehavior(),
      })
      return
    }
    scrollToEnd()
  }

  /** Back to the transcript as it loaded. A reset is not an animation. */
  function reset() {
    entries.value = seed()
    trimmed.value = 0
    history.value = []
    historyIndex.value = -1
    input.value = ''
    enquiry.clear()

    nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  function clear() {
    entries.value = []
    trimmed.value = 0

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

    const themeCommand = THEME_COMMANDS[normalised]
    if (themeCommand === 'toggle') {
      theme.toggle()
      return
    }
    if (themeCommand) {
      theme.set(themeCommand)
      return
    }

    // A right Command with a wrong name gets Role detail's answer, not `unknown`:
    // the Visitor needs a different name, not a different Command.
    const isRolePath = normalised.startsWith(ROLE_DETAIL.path)
    const command = isRolePath
      ? ROLE_DETAIL
      : commands.find(entry => entry.cmd === normalised)
    const output: SessionOutput = command?.output ?? 'unknown'
    const roleName = isRolePath
      ? roleSlugs.find(slug => normalised === rolePath(slug))
      ?? typed.slice(ROLE_DETAIL.path.length)
      : ''

    // The Enquiry form is a singleton. A second copy would be a second form
    // bound to the same state, so typing into one would fill the other.
    if (output === 'contact') {
      entries.value = entries.value.filter(
        existing => existing.output !== 'contact',
      )
      enquiry.open()
    }

    // The echo is instant — the visitor typed it, the machine did not produce it.
    const id = nextId++
    entries.value.push({
      id,
      cmd: typed,
      output: null,
      roleName,
      animate: true,
    })

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
        nextTick(() => scrollToPrinted(id))
      },
      reducedMotion()
        ? 0
        : (command?.think ?? THINK_UNKNOWN),
    )
  }

  function openRole(slug: string) {
    exec(rolePath(slug))
  }

  /**
   * Whether `exec` would run this as something other than `unknown`. A Role
   * path counts only for a Role that exists: its Command is right, but its
   * answer would be that there is no such Role.
   */
  function recognises(raw: string) {
    const typed = raw.trim().toLowerCase()
    const normalised = aliases[typed] ?? typed

    return normalised === 'reset'
      || normalised === 'clear'
      || Object.hasOwn(THEME_COMMANDS, normalised)
      || commands.some(entry => entry.cmd === normalised)
      || roleSlugs.some(slug => rolePath(slug) === normalised)
  }

  /**
   * What Tab would turn the prompt into, over every spelling a visitor might
   * be part-way through. Undefined when it would change nothing, so Tab can be
   * handed back to the browser.
   */
  const completion = computed(() => {
    const typed = input.value.trim().toLowerCase()
    if (!typed)
      return undefined

    const pool = [
      ...commands.map(entry => entry.cmd),
      ...roleSlugs.map(rolePath),
      ...metaCommands.map(entry => entry.cmd),
      ...Object.keys(aliases),
    ]

    const hit = pool.find(entry => entry.startsWith(typed))
    return hit === input.value
      ? undefined
      : hit
  })

  function recall(offset: number) {
    const next = historyIndex.value + offset
    if (next < -1 || next >= history.value.length)
      return

    historyIndex.value = next
    input.value = next === -1
      ? ''
      : history.value[next]!
  }

  return {
    entries,
    trimmed,
    scrollback: SCROLLBACK,
    input,
    exec,
    openRole,
    recognises,
    completion,
    recall,
    enquiry,
  }
}
