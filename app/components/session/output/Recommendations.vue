<script lang="ts" setup>
import type { Recommendation } from '~/data/recommendations'

const props = defineProps<{ recommendations: Recommendation[] }>()

/**
 * Positions in `recommendations`, in the order they are printed: the first is
 * quoted in full, the rest are listed. Reading one trades it with the lead
 * rather than reordering the list, so every other row stays where it was.
 */
const order = ref(props.recommendations.map((_, index) => index))

const lead = computed(() => props.recommendations[order.value[0]!])
const rest = computed(() => order.value.slice(1))

/** The Recommendation a swap dropped into the list; `null` until one has. */
const arrived = ref<number | null>(null)

const root = useTemplateRef<HTMLDivElement>('root')
const list = useTemplateRef<HTMLUListElement>('list')

function rows() {
  return [
    ...list.value!.querySelectorAll('button'),
  ]
}

function wordsIn(recommendation: Recommendation) {
  return recommendation.quote.join(' ').trim().split(/\s+/).length
}

/**
 * Everything a swap moves, by `data-flip`. Of the names, only the two trading
 * places: a name in a row that stays already rides along with its row, and
 * moving it as well would carry it twice the distance.
 */
function landmarks(trading: number[]) {
  const names = trading.map(index => `name:${index}`)
  return () => new Map(
    [
      ...root.value!.querySelectorAll('[data-flip]'),
    ]
      .map(element => [
        element.getAttribute('data-flip')!,
        element,
      ] as const)
      .filter(([key]) => !key.startsWith('name:') || names.includes(key)),
  )
}

/**
 * Selecting a name by dragging across it also ends in a click, which is not a
 * request to read. A pointer click has already collapsed any older selection,
 * so one still standing is this gesture's. The keyboard collapses nothing, and
 * its click (detail 0) has to work with text selected anywhere on the page.
 */
async function read(event: MouseEvent, index: number) {
  if (event.detail > 0 && window.getSelection()!.toString())
    return
  const slot = order.value.indexOf(index)
  const replaced = order.value[0]!
  await flip(landmarks([index, replaced]), async () => {
    order.value[slot] = replaced
    order.value[0] = index
    arrived.value = replaced
    await nextTick()
  })
  // The row is a new element now, so focus would otherwise fall to the page
  // and the next ↓ would scroll instead of moving down the list.
  rows()[slot - 1]!.focus({ preventScroll: true })
  // The browser holds the clicked row still while the quote above it grows,
  // so a quote taller than the screen would arrive with its start out of
  // sight above, to be read from the middle. `scroll-mt-20` on the root keeps
  // the command that printed the block in view above it.
  if (root.value!.getBoundingClientRect().top < 0) {
    root.value!.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }
}

const STEPS: Partial<Record<string, (at: number, last: number) => number>> = {
  ArrowDown: at => at + 1,
  ArrowUp: at => at - 1,
  Home: () => 0,
  End: (_, last) => last,
}

/**
 * Only while a row has focus: in the Prompt bar ↑ and ↓ already recall
 * history, and that is what a terminal's arrows are for.
 */
function move(event: KeyboardEvent) {
  const step = STEPS[event.key]
  if (!step)
    return
  event.preventDefault()
  const buttons = rows()
  const last = buttons.length - 1
  const at = buttons.findIndex(button => button === event.target)
  buttons[Math.min(Math.max(step(at, last), 0), last)]!.focus()
}
</script>

<template>
  <div ref="root" class="scroll-mt-20">
    <!-- CONTEXT.md: say plainly where these come from, rather than letting a
         visitor infer client references. -->
    <p class="text-subtle max-w-prose text-meta">
      {{ $t('recommendations.provenance') }}
    </p>

    <!-- Keyed, so a swap mounts it afresh and its lines print in again. -->
    <div
      v-if="lead"
      :key="order[0]"
      data-lead
      aria-live="polite"
      class="border-accent/45 mt-5 max-w-prose border-l-2 pl-4"
      :class="arrived !== null && 'recommendation-arrive'"
    >
      <blockquote class="text-prose text-body flex flex-col gap-2">
        <p
          v-for="(paragraph, paragraphIndex) in lead.quote"
          :key="paragraphIndex"
          :style="{ '--p': paragraphIndex }"
        >
          {{ paragraph }}
        </p>
      </blockquote>
      <p class="text-subtle mt-2 text-meta">
        <span
          :data-flip="`name:${order[0]}`"
          class="text-body inline-block origin-top-left"
        >{{ lead.name }}</span>
        <span
          data-credit
          :style="{ '--p': lead.quote.length }"
        >{{ $t('recommendations.credit', { title: lead.title, company: lead.company }) }}</span>
      </p>
    </div>

    <div v-if="rest.length > 0" class="mt-10 max-w-prose">
      <p data-flip="heading" class="text-subtle text-label tracking-[0.2em] uppercase">
        {{ $t('recommendations.alsoOnFile') }}
      </p>

      <ul ref="list" class="mt-2" @keydown="move">
        <li
          v-for="(index, slot) in rest"
          :key="index"
          :style="{ '--i': slot }"
          :data-flip="`row:${index}`"
          class="border-base-300 border-t border-dashed last:border-b"
          :class="arrived === index && 'recommendation-arrive'"
        >
          <!-- `.stop` because the session behind it would put the caret in the
               prompt and take focus off the list. -->
          <button
            type="button"
            class="group grid w-full grid-cols-[1.5ch_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5 text-left pointer-coarse:min-h-11"
            @click.stop="read($event, index)"
          >
            <span aria-hidden="true" class="recommendation-mark text-subtle group-hover:text-accent group-focus-visible:text-accent" />
            <span class="min-w-0">
              <span class="sr-only">{{ $t('recommendations.read', { name: recommendations[index]!.name }) }}</span>
              <span
                data-name
                aria-hidden="true"
                :data-flip="`name:${index}`"
                class="text-prose group-hover:text-accent inline-block origin-top-left"
              >{{ recommendations[index]!.name }}</span>
              <span data-role class="text-subtle text-meta block">
                {{ $t('recommendations.role', { title: recommendations[index]!.title, company: recommendations[index]!.company }) }}
              </span>
            </span>
            <span data-length class="text-subtle text-label whitespace-nowrap tabular-nums">
              {{ $t('recommendations.words', { n: wordsIn(recommendations[index]!) }, wordsIn(recommendations[index]!)) }}
            </span>
          </button>
        </li>
      </ul>

      <!-- The rows say what they are to a screen reader, and touch has no
           arrows, so the hint is for a sighted keyboard alone. -->
      <p
        data-keys
        aria-hidden="true"
        class="text-subtle text-label mt-4 flex items-center gap-1.5 pointer-coarse:hidden"
      >
        <SessionKeyCap glyph="up" />
        <SessionKeyCap glyph="down" />
        <span class="ml-1">{{ $t('recommendations.keyMove') }}</span>
        <span class="mx-1">·</span>
        <SessionKeyCap glyph="enter" />
        <span class="ml-1">{{ $t('recommendations.keyRead') }}</span>
      </p>
    </div>
  </div>
</template>
