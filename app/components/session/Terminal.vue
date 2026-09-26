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
 *    then the output lands a line at a time.
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

/** Clicking the dead space puts the caret back, the way a terminal does. */
function focusPrompt() {
  inputEl.value?.focus()
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col text-[0.875rem] leading-[1.7]"
    @click="focusPrompt"
  >
    <a
      href="#prompt"
      class="border-accent text-accent bg-base-100 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:border focus:px-4 focus:py-2"
    >
      Skip to the prompt
    </a>

    <div class="flex-1 px-4 py-8 sm:px-6">
      <!-- A session opens with a login banner, not a header. `clear` takes it
           with the rest of the scrollback; only `reset` brings it back. -->
      <div
        v-if="!cleared"
        data-banner
        class="border-base-300 mb-12 border-b pb-6 text-[0.8125rem]"
      >
        <p class="text-base-content/35">
          Last login: {{ lastLogin }} UTC on ttys002
        </p>
        <p class="mt-3">
          <span class="font-semibold">ppadron.page</span>
          <span class="text-base-content/35">
            — {{ profile.name }}, {{ profile.headline }}</span>
        </p>
        <!-- Whether Pavel is open is the Profile's to say, and so is how it is
             worded; `open` decides only whether the line is accented. -->
        <p class="mt-1">
          <span
            data-availability
            :class="
              profile.availability.open ? 'text-accent' : 'text-base-content/35'
            "
          >{{ profile.availability.label }}</span>
          <!-- The label is the Profile's, and may or may not end in a full
               stop, so the separator is this component's to supply. -->
          <span class="text-base-content/35">
            · Everything below is already printed — read on, or run a command.
          </span>
        </p>
      </div>

      <p v-if="trimmed > 0" class="text-base-content/25 mb-10 text-xs">
        [ {{ trimmed }} earlier {{ trimmed === 1 ? 'block' : 'blocks' }} dropped
        — scrollback is {{ scrollback }} ]
      </p>

      <div aria-live="polite">
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
            <span class="sr-only">Working…</span>
          </p>

          <div
            v-else
            class="mt-3 pl-[1.1rem]"
            :class="entry.animate && 'session-print'"
          >
            <SessionOutputWhoami
              v-if="entry.output === 'whoami'"
              :profile="profile"
            />
            <SessionOutputExperience
              v-else-if="entry.output === 'experience'"
              :roles="roles"
            />
            <SessionOutputRecommendations
              v-else-if="entry.output === 'recommendations'"
              :recommendations="recommendations"
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
              :profile="profile"
            />
            <SessionOutputHelp
              v-else-if="entry.output === 'help'"
              :commands="commands"
              :meta-commands="metaCommands"
            />
            <SessionOutputUnknown
              v-else
              :cmd="entry.cmd"
              @help="exec('help')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- The prompt bar. The commands are listed here as chips rather than
         hidden behind `help`, because a Visitor who does not already know that
         `help` exists is the Visitor this page is for. -->
    <div
      data-prompt-bar
      class="border-base-300 bg-base-100/95 sticky bottom-0 z-20 border-t backdrop-blur-sm"
    >
      <div
        class="border-base-300 flex items-center gap-2 overflow-x-auto border-b px-4 py-2 sm:px-6"
        @click.stop
      >
        <span
          class="text-base-content/30 shrink-0 text-[0.625rem] tracking-[0.2em] uppercase"
        >
          Run
        </span>
        <button
          v-for="command in commands"
          :key="command.cmd"
          type="button"
          class="border-base-300 text-base-content/60 hover:border-accent hover:text-accent shrink-0 border px-2 py-0.5 text-[0.6875rem] whitespace-nowrap"
          :title="command.label"
          @click="exec(command.cmd)"
        >
          {{ command.cmd }}
        </button>

        <span aria-hidden="true" class="bg-base-300 mx-1 h-4 w-px shrink-0" />

        <button
          v-for="command in metaCommands"
          :key="command.cmd"
          type="button"
          class="text-base-content/35 hover:text-base-content shrink-0 px-1 py-0.5 text-[0.6875rem] whitespace-nowrap"
          :title="command.label"
          @click="exec(command.cmd)"
        >
          {{ command.cmd }}
        </button>
      </div>

      <form
        class="flex items-center gap-2 px-4 py-3 sm:px-6"
        @submit.prevent="exec(input)"
      >
        <label class="sr-only" for="prompt">Run a command</label>
        <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
        <input
          id="prompt"
          ref="inputEl"
          v-model="input"
          class="w-full bg-transparent outline-none"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="type a command, or click one above"
          @keydown.tab.prevent="complete"
          @keydown.up.prevent="recall(1)"
          @keydown.down.prevent="recall(-1)"
        >
        <span aria-hidden="true" class="caret shrink-0" />

        <span
          data-availability
          class="ml-auto hidden shrink-0 items-center gap-2 pl-4 text-[0.6875rem] tracking-[0.15em] whitespace-nowrap uppercase sm:flex"
          :class="
            profile.availability.open ? 'text-accent' : 'text-base-content/35'
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
