<script lang="ts" setup>
/**
 * The working line at the foot of the Session. The commands are listed here as
 * chips rather than hidden behind `help`, because a Visitor who does not
 * already know that `help` exists is the Visitor this page is for. The row
 * wraps rather than scrolls for the same reason: on a phone a scrolled-off
 * chip, `mail pavel` among them, is hidden just the same.
 */
import type { Scheme } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import type { Profile } from '~/data/profile'
import { SCHEMES } from '#shared/theme'

const props = defineProps<{
  commands: SessionCommand[]
  metaCommands: MetaCommand[]
  availability: Profile['availability']
  /** What Tab would turn the prompt into, if anything. */
  completion?: string
}>()

const emit = defineEmits<{
  run: [cmd: string]
  recall: [offset: 1 | -1]
}>()

const typed = defineModel<string>({ required: true })

const scheme = defineModel<Scheme>('scheme', { required: true })

const prompt = useTemplateRef<HTMLInputElement>('prompt')

/** `null` until the input has reported one, which puts the block at the end. */
const insertion = ref<number | null>(null)

const scrolled = ref(0)

const beforeCaret = computed(() => typed.value.slice(0, insertion.value ?? undefined))

const underCaret = computed(() => typed.value.charAt(beforeCaret.value.length))

/**
 * Reads where the block belongs off the input: the end of the selection that
 * moves, which is where a terminal draws it, less however far a command too
 * long for the prompt has scrolled.
 */
function followCaret() {
  const input = prompt.value!
  insertion.value = input.selectionDirection === 'backward'
    ? input.selectionStart
    : input.selectionEnd
  scrolled.value = input.scrollLeft
}

// Not every browser reports the jump to the end when the value is set from
// code, as Tab completion and history recall do. Post-flush, because the
// input's value and selection only move once Vue has patched it.
watch(typed, followCaret, { flush: 'post' })

onMounted(() => document.addEventListener('selectionchange', followCaret))
onBeforeUnmount(() => document.removeEventListener('selectionchange', followCaret))

// A page may only take Tab when it has something to do with it; otherwise the
// prompt is a keyboard trap (WCAG 2.1.2).
function onTab(event: KeyboardEvent) {
  const completion = props.completion
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || completion === undefined)
    return

  event.preventDefault()
  typed.value = completion
}

defineExpose({
  focus: () => prompt.value?.focus(),
})
</script>

<template>
  <div
    data-prompt-bar
    class="border-edge bg-base-200/95 sticky bottom-0 z-20 border-t backdrop-blur-sm"
  >
    <div
      class="session-gutter border-base-300 flex flex-wrap items-center gap-2 border-b py-2.5"
      @click.stop
    >
      <span
        class="text-subtle text-label shrink-0 tracking-[0.2em] uppercase"
      >
        Run
      </span>
      <template v-for="(command, index) in commands" :key="command.cmd">
        <button
          type="button"
          class="border-edge text-muted hover:border-accent hover:text-accent text-meta min-h-8 shrink-0 border px-2.5 py-1 whitespace-nowrap"
          :title="command.label"
          :aria-describedby="`chip-hint-${index}`"
          @click="emit('run', command.cmd)"
        >
          {{ command.cmd }}
        </button>
        <span :id="`chip-hint-${index}`" class="sr-only">{{ command.label }}</span>
      </template>

      <span aria-hidden="true" class="bg-base-300 mx-1 h-4 w-px shrink-0" />

      <template v-for="(command, index) in metaCommands" :key="command.cmd">
        <button
          type="button"
          class="text-muted hover:text-base-content text-meta min-h-8 shrink-0 px-1.5 py-1 whitespace-nowrap"
          :title="command.label"
          :aria-describedby="`meta-hint-${index}`"
          @click="emit('run', command.cmd)"
        >
          {{ command.cmd }}
        </button>
        <span :id="`meta-hint-${index}`" class="sr-only">{{ command.label }}</span>
      </template>
    </div>

    <!-- On one baseline rather than centred: the prompt, the theme switch and
         the availability are three sizes, and centring their boxes leaves the
         smaller words riding high of the prompt's. -->
    <form
      class="session-gutter flex items-baseline gap-2 py-3"
      @submit.prevent="emit('run', typed)"
    >
      <label class="sr-only" for="prompt">Run a command</label>
      <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
      <!-- 16px at every width: iOS Safari zooms the page on focusing a smaller
           input and does not zoom back out. On a phone the theme switch leaves
           too little room for the whole hint, so it trails off rather than
           cutting a word in half. -->
      <div class="relative w-full min-w-0">
        <input
          id="prompt"
          ref="prompt"
          v-model="typed"
          class="prompt-input block w-full bg-transparent text-base text-ellipsis"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="type a command, or pick one above"
          @keydown.tab="onTab"
          @keydown.up.prevent="emit('recall', 1)"
          @keydown.down.prevent="emit('recall', -1)"
          @scroll="followCaret"
        >
        <!-- Unclipped on purpose: the text in it is invisible, and the block
             may overhang the prompt's right edge as a terminal's does. -->
        <div
          data-caret-mirror
          aria-hidden="true"
          class="prompt-mirror pointer-events-none absolute inset-y-0 left-0 flex items-center text-base whitespace-pre"
          :style="{ translate: `${-scrolled}px 0` }"
        >
          <span data-before-caret class="invisible">{{ beforeCaret }}</span>
          <span class="caret prompt-caret shrink-0">{{ underCaret }}</span>
        </div>
      </div>

      <div
        data-scheme-switch
        role="group"
        aria-label="Theme"
        class="text-meta ml-auto flex shrink-0 items-center gap-0.5 pl-4"
        @click.stop
      >
        <template v-for="(option, index) in SCHEMES" :key="option">
          <span v-if="index > 0" aria-hidden="true" class="text-subtle">/</span>
          <button
            type="button"
            class="min-h-8 px-1"
            :class="scheme === option ? 'text-accent' : 'text-muted hover:text-base-content'"
            :aria-pressed="scheme === option"
            @click="scheme = option"
          >
            {{ option }}
          </button>
        </template>
      </div>

      <span
        data-availability
        class="text-label hidden shrink-0 items-baseline gap-2 pl-4 tracking-[0.15em] whitespace-nowrap uppercase sm:flex"
        :class="availability.open ? 'text-accent' : 'text-subtle'"
      >
        <!-- Centred off the baseline, so the tag's baseline is its words'
             rather than the bottom of a dot with none. -->
        <span
          aria-hidden="true"
          class="size-1.5 self-center"
          :class="availability.open ? 'bg-success' : 'bg-base-300'"
        />
        {{ availability.label }}
      </span>
    </form>
  </div>
</template>
