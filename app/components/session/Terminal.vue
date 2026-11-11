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
import type { SessionOutput } from '~/composables/useSession'
import { commands, metaCommands } from '~/composables/useSession'
import { roles } from '~/data/experience'
import { profile } from '~/data/profile'
import { recommendations } from '~/data/recommendations'

// Terminal is the only session consumer: no output component injects it, so
// there is nothing to provide down the tree. See
// docs/adr/0007-output-components-are-pure.md.
const {
  entries,
  trimmed,
  scrollback,
  input,
  exec,
  openRole,
  completion,
  recall,
  enquiry,
} = useSession(roles.map(role => role.slug))

const promptBar = useTemplateRef('promptBar')

const theme = useTheme()
onMounted(theme.resolve)

const scheme = computed({
  get: () => theme.scheme.value,
  set: theme.set,
})

/** What the chip for a block's command says it does, over the block itself. */
function labelOf(output: SessionOutput | null) {
  return commands.find(command => command.output === output)?.label
}

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
    class="text-machine flex min-h-screen flex-col"
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

    <main class="session-gutter flex-1 py-10">
      <!-- A session opens with a login banner, not a header. `clear` leaves it:
           it says who this is, which an emptied page would otherwise not. -->
      <div
        data-banner
        class="border-base-300 mb-[4.5rem] border-b pb-6"
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
            · {{ entries.length > 0
              ? 'Everything below is already printed — read on, or run a command.'
              : 'Run a command.' }}
          </span>
        </p>
      </div>

      <!-- Plain text in reading order rather than a live region: `clear` is
           the Visitor's own action and focus stays on the prompt. -->
      <p v-if="entries.length === 0" data-empty-hint class="text-subtle">
        Scrollback cleared. Run <span class="text-accent">help</span> for what
        there is, or <span class="text-accent">whoami</span> to start.
      </p>

      <p v-if="trimmed > 0" class="text-subtle text-meta mb-10">
        [ {{ trimmed }} earlier {{ trimmed === 1 ? 'block' : 'blocks' }} dropped
        — scrollback is {{ scrollback }} ]
      </p>

      <div>
        <div
          v-for="entry in entries"
          :key="entry.id"
          :data-entry="entry.id"
          class="mb-[4.5rem] scroll-mt-10 last:mb-0"
        >
          <!-- Ruled across like a section header, because on a page read top
               to bottom that is what each command is. -->
          <div class="flex items-baseline gap-3">
            <p class="flex gap-2">
              <span aria-hidden="true" class="text-accent select-none">$</span>
              <span class="font-medium">{{ entry.cmd }}</span>
            </p>
            <span aria-hidden="true" class="bg-base-300 h-px min-w-6 flex-1 self-center max-sm:hidden" />
            <span
              v-if="labelOf(entry.output)"
              data-entry-label
              class="text-subtle text-meta whitespace-nowrap max-sm:hidden"
            >{{ labelOf(entry.output) }}</span>
          </div>

          <!-- The beat between the command and its output. -->
          <p v-if="entry.output === null" class="mt-5">
            <span aria-hidden="true" class="caret session-busy" />
            <span class="sr-only" role="status">Working…</span>
          </p>

          <div
            v-else
            class="mt-5"
            :class="entry.animate && 'session-print'"
          >
            <SessionOutputWhoami
              v-if="entry.output === 'whoami'"
              :profile
            />
            <SessionOutputExperience
              v-else-if="entry.output === 'experience'"
              :roles
              @open="openRole"
            />
            <SessionOutputRoleDetail
              v-else-if="entry.output === 'role-detail'"
              :role-name="entry.roleName"
              :role="roles.find(role => role.slug === entry.roleName)"
            />
            <SessionOutputBackground
              v-else-if="entry.output === 'background'"
              :profile
            />
            <SessionOutputRecommendations
              v-else-if="entry.output === 'recommendations'"
              :recommendations
            />
            <SessionOutputContact
              v-else-if="entry.output === 'contact'"
              :model-value="enquiry.draft"
              :state="enquiry.state"
              :failures="enquiry.failures"
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
      v-model:scheme="scheme"
      :commands
      :meta-commands
      :availability="profile.availability"
      :completion
      @run="exec"
      @recall="recall"
    />
  </div>
</template>
