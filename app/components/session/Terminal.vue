<script lang="ts" setup>
/**
 * The site, as one terminal session.
 *
 * Two rules the rest of this component follows:
 *
 * 1. The transcript printed on load appears at once and is never animated. A
 *    Visitor must be able to read the whole page by scrolling, and making them
 *    wait for a typewriter is a cost with no return.
 * 2. Everything run by hand prints the way a console prints — the command
 *    echoes instantly because they typed it, the machine thinks for a beat,
 *    then the output lands, a line at a time where it is a list.
 *
 * There is no header bar. A session opens with a login banner, and the chrome
 * lives in the prompt at the foot, which is where a terminal's status line has
 * always been. See docs/adr/0004-the-site-is-a-terminal-session.md.
 */
import { roles } from '~/data/experience'
import { profile } from '~/data/profile'
import { recommendations } from '~/data/recommendations'

// Terminal is the only session consumer: no output component injects it, so
// there is nothing to provide down the tree. See
// docs/adr/0007-output-components-are-pure.md.
const {
  entries,
  trimmed,
  cleared,
  scrollback,
  input,
  exec,
  complete,
  recall,
  contact,
  contactState,
  send,
} = useSession()

const inputEl = ref<HTMLInputElement | null>(null)

// A page may only take Tab when it has something to do with it; otherwise the
// prompt is a keyboard trap (WCAG 2.1.2).
function onTab(event: KeyboardEvent) {
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
    return

  if (complete())
    event.preventDefault()
}

/** Seeded on the server so the banner's timestamp survives hydration. */
const openedAt = useState('session-opened', () => Date.now())

const lastLogin = computed(() => {
  const at = new Date(openedAt.value)
  const pad = (value: number) => String(value).padStart(2, '0')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return [
    days[at.getUTCDay()],
    months[at.getUTCMonth()],
    pad(at.getUTCDate()),
    `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}:${pad(at.getUTCSeconds())}`,
  ].join(' ')
})

/**
 * Clicking the dead space puts the caret back, the way a terminal does. Not
 * over a selection, which a drag or a double-click leaves behind and focusing
 * the input would discard, and not on touch, where it raises the on-screen
 * keyboard over the text just tapped.
 */
function focusPrompt(event: MouseEvent) {
  if ((event as PointerEvent).pointerType === 'touch')
    return
  if (window.getSelection()!.toString())
    return
  inputEl.value?.focus()
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col text-[0.875rem] leading-[1.7]"
    @click="focusPrompt"
  >
    <!-- Skips past the Transcript to the prompt, not past navigation to the
         content: the prompt is the control, and the Transcript is already
         printed. -->
    <a
      href="#prompt"
      class="border-accent text-accent bg-base-100 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:border focus:px-4 focus:py-2"
    >
      Skip to the prompt
    </a>

    <main class="flex-1 px-4 py-8 sm:px-6">
      <!-- A session opens with a login banner, not a header. `clear` takes it
           with the rest of the scrollback; only `reset` brings it back. -->
      <div
        v-if="!cleared"
        data-banner
        class="border-base-300 mb-12 border-b pb-6 text-[0.8125rem]"
      >
        <p class="text-subtle">
          Last login: {{ lastLogin }} UTC on ttys002
        </p>
        <p class="mt-3">
          <span class="font-semibold">ppadron.page</span>
          <span class="text-subtle">
            — {{ profile.name }}, {{ profile.headline }}</span>
        </p>
        <!-- Whether Pavel is open is the Profile's to say, and so is how it is
             worded; `open` decides only whether the line is accented. -->
        <p class="mt-1">
          <span
            data-availability
            :class="
              profile.availability.open ? 'text-accent' : 'text-subtle'
            "
          >{{ profile.availability.label }}</span>
          <!-- The label is the Profile's, and may or may not end in a full
               stop, so the separator is this component's to supply. -->
          <span class="text-subtle">
            · Everything below is already printed — read on, or run a command.
          </span>
        </p>
      </div>

      <p v-if="trimmed > 0" class="text-subtle mb-10 text-xs">
        [ {{ trimmed }} earlier {{ trimmed === 1 ? 'block' : 'blocks' }} dropped
        — scrollback is {{ scrollback }} ]
      </p>

      <div>
        <div
          v-for="entry in entries"
          :key="entry.id"
          :data-entry="entry.id"
          class="mb-10 last:mb-0"
        >
          <p class="flex gap-2">
            <span aria-hidden="true" class="text-accent select-none">$</span>
            <span class="font-medium">{{ entry.cmd }}</span>
          </p>

          <!-- The beat between the command and its output. -->
          <p v-if="entry.output === null" class="mt-3 pl-[1.1rem]">
            <span aria-hidden="true" class="caret session-busy" />
            <span class="sr-only" role="status">Working…</span>
          </p>

          <div
            v-else
            class="mt-3 pl-[1.1rem]"
            :class="entry.animate && 'session-print'"
          >
            <SessionOutputWhoami
              v-if="entry.output === 'whoami'"
              :profile
            />
            <SessionOutputExperience
              v-else-if="entry.output === 'experience'"
              :roles
            />
            <SessionOutputRecommendations
              v-else-if="entry.output === 'recommendations'"
              :recommendations
            />
            <!-- The draft is the session's, so the form is handed a copy and
                 its report is written back here. -->
            <SessionOutputContact
              v-else-if="entry.output === 'contact'"
              :model-value="contact"
              :state="contactState"
              :email="profile.email"
              @update:model-value="Object.assign(contact, $event)"
              @submit="send"
            />
            <SessionOutputColophon
              v-else-if="entry.output === 'colophon'"
              :profile
            />
            <SessionOutputHelp
              v-else-if="entry.output === 'help'"
              :commands
              :meta-commands
            />
            <SessionOutputUnknown
              v-else
              :cmd="entry.cmd"
              @help="exec('help')"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- The prompt bar. The commands are listed here as chips rather than
         hidden behind `help`, because a Visitor who does not already know that
         `help` exists is the Visitor this page is for. The row wraps rather
         than scrolls for the same reason: on a phone a scrolled-off chip,
         `mail pavel` among them, is hidden just the same. -->
    <div
      data-prompt-bar
      class="border-edge bg-base-100/95 sticky bottom-0 z-20 border-t backdrop-blur-sm"
    >
      <div
        class="border-base-300 flex flex-wrap items-center gap-2 border-b px-4 py-2 sm:px-6"
        @click.stop
      >
        <span
          class="text-subtle shrink-0 text-[0.625rem] tracking-[0.2em] uppercase"
        >
          Run
        </span>
        <template v-for="(command, index) in commands" :key="command.cmd">
          <button
            type="button"
            class="border-edge text-muted hover:border-accent hover:text-accent shrink-0 border px-2 py-0.5 text-[0.6875rem] whitespace-nowrap"
            :title="command.label"
            :aria-describedby="`chip-hint-${index}`"
            @click="exec(command.cmd)"
          >
            {{ command.cmd }}
          </button>
          <span :id="`chip-hint-${index}`" class="sr-only">{{ command.label }}</span>
        </template>

        <span aria-hidden="true" class="bg-base-300 mx-1 h-4 w-px shrink-0" />

        <template v-for="(command, index) in metaCommands" :key="command.cmd">
          <button
            type="button"
            class="text-muted hover:text-base-content shrink-0 px-1 py-0.5 text-[0.6875rem] whitespace-nowrap"
            :title="command.label"
            :aria-describedby="`meta-hint-${index}`"
            @click="exec(command.cmd)"
          >
            {{ command.cmd }}
          </button>
          <span :id="`meta-hint-${index}`" class="sr-only">{{ command.label }}</span>
        </template>
      </div>

      <form
        class="flex items-center gap-2 px-4 py-3 sm:px-6"
        @submit.prevent="exec(input)"
      >
        <label class="sr-only" for="prompt">Run a command</label>
        <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
        <!-- 16px below `sm`: iOS Safari zooms the page on focusing a smaller
             input and does not zoom back out. -->
        <input
          id="prompt"
          ref="inputEl"
          v-model="input"
          class="w-full bg-transparent text-base sm:text-[0.875rem]"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="type a command, or pick one above"
          @keydown.tab="onTab"
          @keydown.up.prevent="recall(1)"
          @keydown.down.prevent="recall(-1)"
        >
        <span aria-hidden="true" class="caret shrink-0" />

        <span
          data-availability
          class="ml-auto hidden shrink-0 items-center gap-2 pl-4 text-[0.6875rem] tracking-[0.15em] whitespace-nowrap uppercase sm:flex"
          :class="
            profile.availability.open ? 'text-accent' : 'text-subtle'
          "
        >
          <span
            aria-hidden="true"
            class="size-1.5"
            :class="profile.availability.open ? 'bg-success' : 'bg-base-300'"
          />
          {{ profile.availability.label }}
        </span>
      </form>
    </div>
  </div>
</template>
