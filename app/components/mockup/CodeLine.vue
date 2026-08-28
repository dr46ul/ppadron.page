<script lang="ts" setup>
withDefaults(
  defineProps<{
    prefix?: string
    hidePrefix?: boolean
  }>(),
  {
    prefix: '>',
    hidePrefix: false,
  },
)
</script>

<template>
  <pre
    :data-prefix="hidePrefix ? undefined : prefix"
  ><code><slot /></code></pre>
</template>
