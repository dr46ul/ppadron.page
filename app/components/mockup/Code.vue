<script lang="ts" setup>
interface MockupCodeLineObject {
  content: string
  prefix?: string
  class?: string
}

defineProps<{
  lines?: MockupCodeLineObject[]
  hidePrefix?: boolean
}>()
</script>

<template>
  <div class="mockup-code w-full">
    <slot>
      <template v-for="line in lines" :key="line">
        <MockupCodeLine :prefix="line.prefix" :class="line.class" :hide-prefix>
          {{ line.content }}
        </MockupCodeLine>
      </template>
    </slot>
  </div>
</template>
