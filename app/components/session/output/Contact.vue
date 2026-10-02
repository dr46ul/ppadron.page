<script lang="ts" setup>
/**
 * The single conversion action. An Enquiry exists only as the email it is
 * delivered as — see docs/adr/0003-enquiries-are-not-persisted.md, which is
 * also why the failure path reveals the direct address rather than just
 * apologising.
 *
 * Rendered as command output, so it is a mail client's header block rather
 * than a card: labelled fields on one axis, the body beneath them.
 */
import type { Enquiry, EnquiryState } from '~/composables/useSession'

const props = defineProps<{
  /** The draft the session owns. Reported back whole, never written through. */
  modelValue: Enquiry
  state: EnquiryState
  /** Pavel's own address, revealed when a send fails. */
  email: string
}>()

const emit = defineEmits<{
  'update:modelValue': [enquiry: Enquiry]
  'submit': []
}>()

/**
 * A keystroke reports a whole new draft rather than writing into the one it
 * was handed — the session owns that object. Each field is named as the form
 * labels it, because `email` on this component is already Pavel's address.
 */
function field(key: keyof Enquiry) {
  return computed({
    get: () => props.modelValue[key],
    set: (typed: string) => {
      const draft: Enquiry = { ...props.modelValue }
      draft[key] = typed
      emit('update:modelValue', draft)
    },
  })
}

const from = field('name')
const replyTo = field('email')
const body = field('message')
</script>

<template>
  <div>
    <p class="text-muted mb-5 max-w-prose">
      Tell me what you are building and what is in the way. I answer every
      message myself.
    </p>

    <form class="max-w-xl" @submit.prevent="emit('submit')" @click.stop>
      <fieldset class="flex flex-col gap-4" :disabled="state === 'sending'">
        <legend class="sr-only">
          Send an enquiry
        </legend>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-xs">from:</span>
          <input
            v-model="from"
            class="border-base-300 focus:border-accent w-full border-b bg-transparent pb-1"
            type="text"
            name="name"
            autocomplete="name"
            required
            placeholder="your name"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-xs">reply-to:</span>
          <input
            v-model="replyTo"
            class="border-base-300 focus:border-accent w-full border-b bg-transparent pb-1"
            type="email"
            name="email"
            autocomplete="email"
            required
            placeholder="you@company.com"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-xs">body:</span>
          <textarea
            v-model="body"
            class="border-base-300 focus:border-accent h-28 w-full resize-none border-b bg-transparent pb-1 leading-relaxed"
            name="message"
            required
            minlength="20"
            placeholder="what are you building, and what is in the way?"
          />
        </label>

        <div class="flex flex-wrap items-center gap-4 sm:pl-[6.75rem]">
          <button
            type="submit"
            class="border-accent text-accent hover:bg-accent hover:text-accent-content border px-5 py-1.5 text-xs tracking-[0.15em] uppercase"
          >
            {{ state === 'sending' ? 'sending…' : 'send' }}
          </button>
          <!-- ADR-0003 makes this line literally true. If persistence is ever
               added, this copy changes in the same commit. -->
          <span class="text-subtle text-xs">stored nowhere else</span>
        </div>

        <p
          v-if="state === 'sent'"
          role="status"
          class="text-success text-xs sm:pl-[6.75rem]"
        >
          Sent. It is in my inbox and I will reply to the address you gave.
        </p>
        <p
          v-if="state === 'failed'"
          role="alert"
          class="text-error text-xs sm:pl-[6.75rem]"
        >
          That did not send, and nothing was saved. Email me at
          <span class="text-accent">{{ email }}</span>
          and the message reaches me all the same.
        </p>
      </fieldset>
    </form>
  </div>
</template>
