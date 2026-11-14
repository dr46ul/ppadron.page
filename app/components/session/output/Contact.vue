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

const { n, t } = useI18n()

const sending = computed(() => props.state === 'sending')
const sent = computed(() => props.state === 'sent')
const locked = computed(() => sending.value || sent.value)

/** Keyed by the state, with every Message key written out as a literal. */
const labels = computed(() => ({
  idle: t('contact.send'),
  sending: t('contact.sending'),
  sent: t('contact.sent'),
  failed: t('contact.send'),
}) satisfies Record<EnquiryState, string>)

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
  if (rule === 'too-long') {
    return t('contact.complaintTooLong', {
      limit: n(LIMITS[key]),
    })
  }

  return {
    name: t('contact.complaintName'),
    email: t('contact.complaintAddress'),
    message: t('contact.complaintMessage', {
      min: n(MESSAGE_MIN),
    }),
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
      {{ $t('contact.lede') }}
    </p>

    <form class="max-w-xl" @submit.prevent="submit" @click.stop>
      <!-- The fields are 16px at every width: iOS Safari zooms the page on
           focusing a smaller input and does not zoom back out. Once sent they
           are read-only rather than disabled, so the Visitor can still select
           and copy what went. -->
      <fieldset class="flex flex-col gap-4">
        <legend class="sr-only">
          {{ $t('contact.legend') }}
        </legend>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">{{ $t('contact.fromLabel') }}</span>
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
            :placeholder="$t('contact.namePlaceholder')"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">{{ $t('contact.replyToLabel') }}</span>
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
            :placeholder="$t('contact.emailPlaceholder')"
          >
        </label>

        <label class="flex items-baseline gap-3">
          <span class="text-accent w-24 shrink-0 text-meta">{{ $t('contact.bodyLabel') }}</span>
          <textarea
            ref="message"
            v-model="body"
            class="border-edge focus:border-accent focus:shadow-[0_1px_0_var(--color-accent)] h-28 w-full resize-none border-b bg-transparent pb-1 text-base leading-relaxed"
            name="message"
            required
            :disabled="sending"
            :readonly="sent"
            :placeholder="$t('contact.messagePlaceholder')"
          />
        </label>

        <div class="flex flex-wrap items-center gap-4 sm:pl-[6.75rem]">
          <!-- The library's button is bold; the Session's type is one weight. -->
          <button
            type="submit"
            :aria-disabled="locked || undefined"
            class="btn btn-outline btn-accent btn-sm px-5 text-meta font-normal tracking-[0.15em] uppercase"
          >
            {{ labels[state] }}
          </button>
          <!-- ADR-0003 makes this line literally true. If persistence is ever
               added, this copy changes in the same commit. -->
          <span class="text-subtle text-meta">{{ $t('contact.retention') }}</span>
        </div>
      </fieldset>

      <p
        v-if="state === 'sent'"
        role="status"
        class="text-success text-meta mt-4 sm:pl-[6.75rem]"
      >
        {{ $t('contact.sentNotice') }}
      </p>
      <p
        v-if="state === 'failed'"
        role="alert"
        class="text-error text-meta mt-4 sm:pl-[6.75rem]"
      >
        <i18n-t keypath="contact.failed" scope="global">
          <template #email>
            <span class="text-accent">{{ email }}</span>
          </template>
        </i18n-t>
      </p>
    </form>
  </div>
</template>
