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
  completion,
  recall,
  enquiry,
} = useSession(roles.map(role => role.slug))

const promptBar = useTemplateRef('promptBar')

/**
 * The page is prerendered (ADR-0008), so this is when it was built, and the
 * banner's "Last login" is the last deploy on purpose: the last time anyone
 * logged in to this machine. It rides the payload, so hydration keeps it
 * rather than reading the Visitor's clock.
 */
const builtAt = useState('built-at', () => Date.now())
const visitedAt = useVisitedAt(builtAt.value)
const dateContext = useDateContext()

const lastLogin = computed(() =>
  formatDate(builtAt.value, 'lastLogin', dateContext.value),
)

/** The Visitor's year, not the build's, so the notice is never out of date between deploys. */
const year = computed(() => formatDate(visitedAt.value, 'year', dateContext.value))

/**
 * Clicking the dead space puts the caret back, the way a terminal does. Not
 * over a selection, which a drag or a double-click leaves behind and focusing
 * the input would discard, and not on touch, where it raises the on-screen
 * keyboard over the text just tapped.
 */
function focusPrompt(event: MouseEvent) {
  if (event instanceof PointerEvent && event.pointerType === 'touch')
    return
  if (window.getSelection()!.toString())
    return
  promptBar.value?.focus()
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
          Last login: {{ lastLogin }} on ttys002
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
            <SessionOutputContact
              v-else-if="entry.output === 'contact'"
              :model-value="enquiry.draft"
              :state="enquiry.state"
              :email="profile.email"
              @update:model-value="enquiry.edit"
              @submit="enquiry.submit"
            />
            <SessionOutputColophon
              v-else-if="entry.output === 'colophon'"
              :profile
              :year
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

    <SessionPromptBar
      ref="promptBar"
      v-model="input"
      :commands
      :meta-commands
      :availability="profile.availability"
      :completion
      @run="exec"
      @recall="recall"
    />
  </div>
</template>
