<script lang="ts" setup>
/**
 * The working line at the foot of the Session. The commands are listed here as
 * chips rather than hidden behind `help`, because a Visitor who does not
 * already know that `help` exists is the Visitor this page is for. The row
 * wraps rather than scrolls for the same reason: on a phone a scrolled-off
 * chip, `mail pavel` among them, is hidden just the same.
 */
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import type { Profile } from '~/data/profile'

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

const prompt = useTemplateRef<HTMLInputElement>('prompt')

// A page may only take Tab when it has something to do with it; otherwise the
// prompt is a keyboard trap (WCAG 2.1.2).
function onTab(event: KeyboardEvent) {
  const completion = props.completion
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || completion === undefined)
    return

  event.preventDefault()
  typed.value = completion
}

defineExpose({ focus: () => prompt.value?.focus() })
</script>

<template>
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
          class="text-muted hover:text-base-content shrink-0 px-1 py-0.5 text-[0.6875rem] whitespace-nowrap"
          :title="command.label"
          :aria-describedby="`meta-hint-${index}`"
          @click="emit('run', command.cmd)"
        >
          {{ command.cmd }}
        </button>
        <span :id="`meta-hint-${index}`" class="sr-only">{{ command.label }}</span>
      </template>
    </div>

    <form
      class="flex items-center gap-2 px-4 py-3 sm:px-6"
      @submit.prevent="emit('run', typed)"
    >
      <label class="sr-only" for="prompt">Run a command</label>
      <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
      <!-- 16px below `sm`: iOS Safari zooms the page on focusing a smaller
           input and does not zoom back out. -->
      <input
        id="prompt"
        ref="prompt"
        v-model="typed"
        class="w-full bg-transparent text-base sm:text-[0.875rem]"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="type a command, or pick one above"
        @keydown.tab="onTab"
        @keydown.up.prevent="emit('recall', 1)"
        @keydown.down.prevent="emit('recall', -1)"
      >
      <span aria-hidden="true" class="caret prompt-caret shrink-0" />

      <span
        data-availability
        class="ml-auto hidden shrink-0 items-center gap-2 pl-4 text-[0.6875rem] tracking-[0.15em] whitespace-nowrap uppercase sm:flex"
        :class="availability.open ? 'text-accent' : 'text-subtle'"
      >
        <span
          aria-hidden="true"
          class="size-1.5"
          :class="availability.open ? 'bg-success' : 'bg-base-300'"
        />
        {{ availability.label }}
      </span>
    </form>
  </div>
</template>
