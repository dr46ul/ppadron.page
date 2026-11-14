<script lang="ts" setup>
import type { MetaCommand, SessionCommand } from '~/composables/useSession'

defineProps<{ commands: SessionCommand[], metaCommands: MetaCommand[] }>()

/** Commands and words the prompt accepts: identifiers, so no Locale touches them. */
const roleForm = 'cat ~/experience/<role>'
const plainWords = { experience: 'experience', contact: 'contact' }
</script>

<template>
  <div>
    <ul class="flex flex-col gap-1 text-meta">
      <li
        v-for="(command, index) in commands"
        :key="command.cmd"
        :style="{ '--i': index }"
        class="grid max-w-md gap-x-4 sm:grid-cols-[13rem_1fr]"
      >
        <span class="text-accent">{{ command.cmd }}</span>
        <span class="text-subtle">{{ command.label }}</span>
      </li>
      <li
        v-for="(command, index) in metaCommands"
        :key="command.cmd"
        :style="{ '--i': commands.length + index }"
        class="grid max-w-md gap-x-4 sm:grid-cols-[13rem_1fr]"
      >
        <span class="text-accent">{{ command.cmd }}</span>
        <span class="text-subtle">{{ command.label }}</span>
      </li>
    </ul>

    <!-- Interface copy, not a prop: the form does not change when Pavel's Roles
         do, and `commands` is what the palette lists, which it must stay out of. -->
    <p class="text-subtle mt-4 text-meta">
      <i18n-t keypath="help.roleForm" scope="global">
        <template #form>
          <code class="text-accent">{{ roleForm }}</code>
        </template>
      </i18n-t>
    </p>

    <p class="text-subtle mt-1 text-meta">
      <i18n-t keypath="help.hint" scope="global">
        <template #tab>
          <SessionKeyCap>Tab</SessionKeyCap>
        </template>
        <template #up>
          <SessionKeyCap glyph="up" />
        </template>
        <template #down>
          <SessionKeyCap glyph="down" />
        </template>
        <template #experience>
          <span class="text-muted">{{ plainWords.experience }}</span>
        </template>
        <template #contact>
          <span class="text-muted">{{ plainWords.contact }}</span>
        </template>
      </i18n-t>
    </p>
  </div>
</template>
