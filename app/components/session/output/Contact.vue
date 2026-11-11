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
import type { EnquiryFailures, EnquiryField, EnquiryRule } from '#shared/enquiry'
import type { EnquiryDraft, EnquiryState } from '~/composables/useEnquiry'
import { FIELDS, LIMITS, MESSAGE_MIN } from '#shared/enquiry'

const props = defineProps<{
  /** The draft `useEnquiry` owns. Reported back whole, never written through. */
  modelValue: EnquiryDraft
  state: EnquiryState
  /** The rules the draft breaks, which `useEnquiry` also refuses to send over. */
  failures: EnquiryFailures
  /** Pavel's own address, revealed when a send fails. */
  email: string
}>()

const emit = defineEmits<{
  'update:modelValue': [draft: EnquiryDraft]
  'submit': []
}>()

/**
 * A keystroke reports a whole new draft rather than writing into the one it
 * was handed — `useEnquiry` owns that object. Each field is named as the form
 * labels it, because `email` on this component is already Pavel's address.
 */
function field(key: EnquiryField) {
  return computed({
    get: () => props.modelValue[key],
    set: (typed: string) => {
      const draft: EnquiryDraft = { ...props.modelValue }
      draft[key] = typed
      emit('update:modelValue', draft)
    },
  })
}

const sending = computed(() => props.state === 'sending')
const sent = computed(() => props.state === 'sent')
const locked = computed(() => sending.value || sent.value)

const LABELS: Partial<Record<EnquiryState, string>> = {
  sending: 'sending…',
  sent: 'sent',
}

/**
 * Not `disabled` on the button: disabling the element that holds focus drops
 * it to <body>, so a second press is refused here instead.
 */
function submit() {
  if (!locked.value)
    emit('submit')
}

const from = field('name')
const replyTo = field('email')
const body = field('message')

/**
 * Every rule a field can break below its cap comes down to one thing the
 * Visitor has to fix, so each field has one complaint and the caps share one.
 */
function complaint(key: EnquiryField, rule: EnquiryRule) {
  if (rule === 'too-long')
    return `Keep it to ${LIMITS[key]} characters; the rest can follow by email.`

  return {
    name: 'Tell me who you are.',
    email: 'I need an address I can reply to.',
    message: `A little more, please — at least ${MESSAGE_MIN} characters.`,
  }[key]
}

const controls = {
  name: useTemplateRef<HTMLInputElement>('name'),
  email: useTemplateRef<HTMLInputElement>('email'),
  message: useTemplateRef<HTMLTextAreaElement>('message'),
} satisfies Record<EnquiryField, unknown>

/**
 * The browser's own validation speaks, but with the delivery's rules, which
 * arrive as `failures` rather than being worked out again here.
 */
watchPostEffect(() => {
  for (const key of FIELDS) {
    const rule = props.failures[key]
    controls[key].value!.setCustomValidity(rule
      ? complaint(key, rule)
      : '')
  }
})
</script>

<template>
  <div>
    <p class="text-prose text-muted mb-5 max-w-prose">
      Tell me what you are building and what is in the way. I answer every
      message myself.
    </p>

    <form class="max-w-xl" @submit.prevent="submit" @click.stop>
      <!-- The fields are 16px at every width: iOS Safari zooms the page on
           focusing a smaller input and does not zoom back out. Once sent they
           are read-only rather than disabled, so the Visitor can still select
           and copy what went. -->
      <fieldset class="flex flex-col gap-4">
        <legend class="sr-only">
          Send an enquiry
        </legend>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">from:</span>
          <input
            ref="name"
            v-model="from"
            class="border-edge focus:border-accent focus:shadow-[0_1px_0_var(--color-accent)] w-full border-b bg-transparent pb-1 text-base"
            type="text"
            name="name"
            autocomplete="name"
            required
            :disabled="sending"
            :readonly="sent"
            placeholder="your name"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">reply-to:</span>
          <!-- Not `type="email"`: its grammar refuses addresses the delivery
               accepts, such as `josé@…`, in the browser's wording rather than
               this form's. `inputmode` keeps the address keyboard. -->
          <input
            ref="email"
            v-model="replyTo"
            class="border-edge focus:border-accent focus:shadow-[0_1px_0_var(--color-accent)] w-full border-b bg-transparent pb-1 text-base"
            type="text"
            inputmode="email"
            autocapitalize="off"
            spellcheck="false"
            name="email"
            autocomplete="email"
            required
            :disabled="sending"
            :readonly="sent"
            placeholder="you@company.com"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">body:</span>
          <textarea
            ref="message"
            v-model="body"
            class="border-edge focus:border-accent focus:shadow-[0_1px_0_var(--color-accent)] h-28 w-full resize-none border-b bg-transparent pb-1 text-base leading-relaxed"
            name="message"
            required
            :disabled="sending"
            :readonly="sent"
            placeholder="what are you building, and what is in the way?"
          />
        </label>

        <div class="flex flex-wrap items-center gap-4 sm:pl-[6.75rem]">
          <!-- The library's button is bold; the Session's type is one weight. -->
          <button
            type="submit"
            :aria-disabled="locked || undefined"
            class="btn btn-outline btn-accent btn-sm px-5 text-meta font-normal tracking-[0.15em] uppercase"
          >
            {{ LABELS[state] ?? 'send' }}
          </button>
          <!-- ADR-0003 makes this line literally true. If persistence is ever
               added, this copy changes in the same commit. -->
          <span class="text-subtle text-meta">stored nowhere else</span>
        </div>
      </fieldset>

      <p
        v-if="state === 'sent'"
        role="status"
        class="text-success text-meta mt-4 sm:pl-[6.75rem]"
      >
        Sent. It is in my inbox and I will reply to the address you gave.
      </p>
      <p
        v-if="state === 'failed'"
        role="alert"
        class="text-error text-meta mt-4 sm:pl-[6.75rem]"
      >
        That did not send, and nothing was saved. Email me at
        <span class="text-accent">{{ email }}</span>
        and the message reaches me all the same.
      </p>
    </form>
  </div>
</template>
