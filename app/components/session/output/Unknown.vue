<script lang="ts" setup>
defineProps<{
  cmd: string
  /** The Command that lists the commands; a name, so it is never translated. */
  helpCommand: string
}>()

/** The session decides what `help` means; this only reports the ask. */
const emit = defineEmits<{ help: [] }>()
</script>

<template>
  <p class="text-error text-meta">
    <i18n-t keypath="unknown.notFound" scope="global">
      <template #cmd>
        {{ cmd }}
      </template>
      <template #help>
        <button
          type="button"
          class="link link-accent"
          @click.stop="emit('help')"
        >
          {{ helpCommand }}
        </button>
      </template>
    </i18n-t>
  </p>
</template>
