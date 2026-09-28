<script lang="ts" setup>
import type { MetaCommand, SessionCommand } from '~/composables/useSession'

defineProps<{ commands: SessionCommand[], metaCommands: MetaCommand[] }>()
</script>

<template>
  <div>
    <ul class="flex flex-col gap-1 text-xs">
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

    <p class="text-subtle mt-4 text-xs">
      Tab completes · ↑ ↓ walk the history · plain words work too
      (<span class="text-muted">experience</span>,
      <span class="text-muted">contact</span>).
    </p>
  </div>
</template>
