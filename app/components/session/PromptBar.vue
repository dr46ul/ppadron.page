<script lang="ts" setup>
/**
 * The working line at the foot of the Session: the prompt, and a labelled
 * button that opens every Command in the palette. The Commands are not laid
 * out here, because a bar that shows each one grows with each one added and
 * buries the Session on a phone. The label is the way in for a Visitor who
 * does not know `help` exists. See docs/adr/0012-commands-open-in-a-palette.md.
 */
import type { ThemeChoice } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'

const props = defineProps<{
  commands: SessionCommand[]
  metaCommands: MetaCommand[]
  /** Whether the session would run what was typed. */
  recognises: (typed: string) => boolean
  /** What Tab would turn the prompt into, if anything. */
  completion?: string
}>()

const emit = defineEmits<{
  run: [cmd: string]
  recall: [offset: 1 | -1]
}>()

const typed = defineModel<string>({ required: true })

const theme = defineModel<ThemeChoice>('theme', { required: true })

const paletteOpen = ref(false)

/**
 * The prerendered page cannot know the Visitor's keyboard, so it guesses Apple
 * and corrects itself once mounted.
 */
const modifier = ref('⌘')

function openOnShortcut(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey))
    return

  event.preventDefault()
  paletteOpen.value = true
}

onMounted(() => {
  modifier.value = /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘'
    : 'ctrl'
  document.addEventListener('keydown', openOnShortcut)
})
onBeforeUnmount(() => document.removeEventListener('keydown', openOnShortcut))

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
    <form
      class="session-gutter flex items-baseline gap-2 py-3"
      @submit.prevent="emit('run', typed)"
    >
      <label class="sr-only" for="prompt">Run a command</label>
      <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
      <!-- 16px at every width: iOS Safari zooms the page on focusing a smaller
           input and does not zoom back out. On a phone the commands button
           leaves too little room for the whole hint, so it trails off rather
           than cutting a word in half. -->
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
          placeholder="type a command, or open the list"
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

      <button
        type="button"
        data-commands
        aria-haspopup="dialog"
        class="btn btn-outline btn-accent btn-sm border-edge text-muted hover:border-accent hover:text-accent-content text-meta ml-auto shrink-0 gap-2 self-center px-2.5 font-normal"
        @click.stop="paletteOpen = true"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          class="size-3 fill-none stroke-current stroke-[1.5] [stroke-linecap:square]"
        >
          <path d="M3 4h10M3 8h10M3 12h10" />
        </svg>
        <span data-word class="centre-on-letters">commands</span>
        <span aria-hidden="true" class="flex gap-1 pointer-coarse:hidden">
          <SessionKeyCap data-modifier>{{ modifier }}</SessionKeyCap>
          <SessionKeyCap>K</SessionKeyCap>
        </span>
      </button>
    </form>

    <SessionCommandPalette
      v-model:open="paletteOpen"
      v-model:theme="theme"
      :commands
      :meta-commands
      :recognises
      @run="emit('run', $event)"
    />
  </div>
</template>
