<script lang="ts" setup>
/**
 * Every Command and meta command, opened over the Session from the Prompt bar.
 * The Prompt bar shows none of them itself, so this is the way in for a Visitor
 * who does not know `help` exists: what each one does is printed beside it, the
 * way `help` prints it.
 */
import type { ThemeChoice } from '#shared/theme'
import type { MetaCommand, SessionCommand } from '~/composables/useSession'
import { THEME_CHOICES } from '#shared/theme'

const props = defineProps<{
  commands: SessionCommand[]
  metaCommands: MetaCommand[]
  /** Whether the session would run what was typed, listed here or not. */
  recognises: (typed: string) => boolean
}>()

const emit = defineEmits<{
  run: [cmd: string]
}>()

const open = defineModel<boolean>('open', { required: true })

const theme = defineModel<ThemeChoice>('theme', { required: true })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const id = useId()

const query = ref('')

const highlight = ref(0)

const needle = computed(() => query.value.trim().toLowerCase())

function matching<T extends MetaCommand>(list: T[]) {
  return list.filter(command => command.cmd.includes(needle.value))
}

/** While what was typed could still be `theme`, or is `theme` with a flag. */
const themeShown = computed(() =>
  'theme'.includes(needle.value) || needle.value.startsWith('theme'))

const typedRuns = computed(() => props.recognises(query.value.trim()))

const groups = computed(() => {
  const commands = matching(props.commands)
  return [
    { name: 'Commands', commands, offset: 0 },
    {
      name: 'Session',
      commands: matching(props.metaCommands.filter(command => command.cmd !== 'theme')),
      offset: commands.length,
    },
  ]
})

const options = computed(() => groups.value.flatMap(group => group.commands))

watch(query, () => highlight.value = 0)

function optionId(index: number) {
  return `${id}-option-${index}`
}

function move(step: 1 | -1) {
  const count = options.value.length
  highlight.value = (highlight.value + step + count) % count
}

function run(cmd: string) {
  emit('run', cmd)
  open.value = false
}

/** The highlighted row first; failing a row, what was typed, if it is a Command. */
function runHighlighted() {
  const command = options.value[highlight.value]
  if (command)
    run(command.cmd)
  else if (typedRuns.value)
    run(query.value.trim())
}

function show() {
  query.value = ''
  highlight.value = 0
  dialog.value!.showModal()
}

watch(open, (isOpen) => {
  if (isOpen)
    show()
  else
    dialog.value!.close()
}, { flush: 'post' })

onMounted(() => {
  if (open.value)
    show()
})
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Commands"
    class="modal bg-base-100/70 backdrop-blur-[2px]"
    @close="open = false"
    @click.stop
  >
    <!-- `.stop` on the dialog keeps a click in the palette from reaching the
         Session behind it, which refocuses the prompt. -->
    <!-- The modal box caps its width and pads itself; the palette sizes its own
         box and lets each row pad itself so the row highlight runs edge to edge. -->
    <div class="modal-box bg-base-200 text-base-content border-edge max-h-[min(40rem,calc(100dvh-3rem))] w-[min(36rem,calc(100vw-2rem))] max-w-none flex flex-col border p-0 shadow-2xl">
      <div class="border-base-300 flex items-baseline gap-2 border-b px-4 py-3">
        <span aria-hidden="true" class="text-accent shrink-0 select-none">$</span>
        <!-- 16px for the same reason as the prompt: iOS zooms a smaller input. -->
        <input
          v-model="query"
          role="combobox"
          aria-label="Find a command"
          aria-autocomplete="list"
          aria-expanded="true"
          :aria-controls="`${id}-list`"
          :aria-activedescendant="options.length ? optionId(highlight) : undefined"
          class="placeholder:text-subtle min-w-0 flex-1 bg-transparent text-base"
          type="text"
          autofocus
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="find a command"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="runHighlighted"
        >
        <!-- The library's kbd sets its own colour, so the cap needs its own hover. -->
        <button
          type="button"
          aria-label="Close"
          class="group text-muted hover:text-accent shrink-0 self-center"
          @click="open = false"
        >
          <SessionKeyCap class="group-hover:text-accent">
            esc
          </SessionKeyCap>
        </button>
      </div>

      <div
        :id="`${id}-list`"
        role="listbox"
        aria-label="Commands"
        class="min-h-0 flex-1 overflow-y-auto py-2"
      >
        <template v-for="group in groups" :key="group.name">
          <div
            v-if="group.commands.length"
            role="group"
            :aria-labelledby="`${id}-${group.name}`"
          >
            <p
              :id="`${id}-${group.name}`"
              class="text-subtle text-label px-4 pt-2 pb-1 tracking-[0.2em] uppercase"
            >
              {{ group.name }}
            </p>
            <div
              v-for="(command, index) in group.commands"
              :id="optionId(group.offset + index)"
              :key="command.cmd"
              role="option"
              :aria-selected="highlight === group.offset + index"
              class="flex cursor-pointer items-baseline gap-3 px-4 py-1.5"
              :class="highlight === group.offset + index ? 'bg-base-300' : 'hover:bg-base-300/60'"
              @click="run(command.cmd)"
            >
              <span
                data-cmd
                class="shrink-0 whitespace-nowrap"
                :class="highlight === group.offset + index && 'text-accent'"
              >{{ command.cmd }}</span>
              <span aria-hidden="true" class="bg-base-300 h-px min-w-3 flex-1 self-center" />
              <span data-label class="text-subtle text-meta truncate">{{ command.label }}</span>
            </div>
          </div>
        </template>

        <p v-if="!options.length" data-none class="text-subtle text-meta px-4 py-2">
          <template v-if="typedRuns">
            Enter runs <span class="text-accent">{{ query.trim() }}</span>.
          </template>
          <template v-else>
            Nothing matches.
          </template>
        </p>
      </div>

      <!-- Outside the list: a setting changed in place rather than a command
         run, so picking one leaves the palette open on the theme it shows. -->
      <div
        v-if="themeShown"
        role="group"
        aria-label="Theme"
        class="border-base-300 text-meta flex items-baseline gap-3 border-t px-4 py-2.5"
      >
        <span class="text-machine shrink-0">theme</span>
        <span aria-hidden="true" class="bg-base-300 h-px min-w-3 flex-1 self-center" />
        <span class="flex shrink-0 items-baseline gap-0.5">
          <template v-for="(choice, index) in THEME_CHOICES" :key="choice">
            <span v-if="index > 0" aria-hidden="true" class="text-subtle">/</span>
            <button
              type="button"
              class="min-h-8 px-1"
              :class="theme === choice ? 'text-accent' : 'text-muted hover:text-base-content'"
              :aria-pressed="theme === choice"
              @click="theme = choice"
            >
              {{ choice }}
            </button>
          </template>
        </span>
      </div>

      <p
        data-keys
        aria-hidden="true"
        class="border-base-300 text-subtle text-label flex items-center gap-1.5 border-t px-4 py-2 pointer-coarse:hidden"
      >
        <SessionKeyCap glyph="up" />
        <SessionKeyCap glyph="down" />
        <span class="ml-1">move</span>
        <span class="mx-1">·</span>
        <SessionKeyCap glyph="enter" />
        <span class="ml-1">run</span>
        <span class="mx-1">·</span>
        <SessionKeyCap>esc</SessionKeyCap>
        <span class="ml-1">close</span>
      </p>
    </div>

    <!-- Escape and the Close button already serve the keyboard and the screen
         reader, so this click target stays out of both. -->
    <form method="dialog" class="modal-backdrop">
      <button tabindex="-1" aria-hidden="true">
        close
      </button>
    </form>
  </dialog>
</template>
