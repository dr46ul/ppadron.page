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
        <span class="text-base-content/50">{{ command.label }}</span>
      </li>
      <li
        v-for="(command, index) in metaCommands"
        :key="command.cmd"
        :style="{ '--i': commands.length + index }"
        class="grid max-w-md gap-x-4 sm:grid-cols-[13rem_1fr]"
      >
        <span class="text-accent">{{ command.cmd }}</span>
        <span class="text-base-content/50">{{ command.label }}</span>
      </li>
    </ul>

    <p class="text-base-content/35 mt-4 text-xs">
      Tab completes · ↑ ↓ walk the history · plain words work too
      (<span class="text-base-content/55">experience</span>,
      <span class="text-base-content/55">contact</span>).
    </p>
  </div>
</template>
