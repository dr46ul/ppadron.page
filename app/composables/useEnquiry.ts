import type { EnquiryField } from '#shared/enquiry'
import { parseEnquiry } from '#shared/enquiry'

export type EnquiryDraft = Record<EnquiryField, string>

/** How far a submitted Enquiry has got. */
export type EnquiryState = 'idle' | 'sending' | 'sent' | 'failed'

/**
 * The Enquiry draft, how far it has got, and the one way to send it. Handed
 * out read-only, so nothing but these functions writes to either.
 */
function blank(): EnquiryDraft {
  return { name: '', email: '', message: '' }
}

export function useEnquiry() {
  const draft = reactive(blank())
  const state = ref<EnquiryState>('idle')

  /**
   * Bumped by `clear`, so a send still on its way when the draft is thrown
   * away cannot land afterwards and lock an empty form as `sent`.
   */
  let attempt = 0

  function edit(next: EnquiryDraft) {
    Object.assign(draft, next)
  }

  async function submit() {
    if (state.value === 'sending' || state.value === 'sent')
      return

    const parsed = parseEnquiry(draft)
    if (!parsed.success)
      return

    const current = ++attempt
    const settle = (outcome: EnquiryState) => {
      if (current === attempt)
        state.value = outcome
    }

    state.value = 'sending'

    try {
      await $fetch('/api/contact', { method: 'POST', body: parsed.enquiry })
      settle('sent')
    }
    catch {
      settle('failed')
    }
  }

  function clear() {
    attempt++
    edit(blank())
    state.value = 'idle'
  }

  /**
   * What `mail pavel` does to a form that is already open. A draft that went
   * is done with, and one that did not is the Visitor's to finish — but a send
   * on its way is left alone, or the form would offer to send it a second time.
   */
  function open() {
    if (state.value === 'sent')
      clear()
    else if (state.value === 'failed')
      state.value = 'idle'
  }

  return readonly({
    draft,
    state,
    edit,
    submit,
    clear,
    open,
  })
}
