<script lang="ts" setup>
import { MockupWindow } from '#components'
</script>

<template>
  <div class="flex flex-col items-center gap-6 w-auto m-auto max-w-7xl p-8">
    <BaseSection
      id="window-mockup-with-border"
      label="window mockup with border"
    >
      <MockupWindow> Hello! </MockupWindow>
    </BaseSection>

    <BaseSection
      id="window-mockup-with-background-color"
      label="window mockup with background color"
    >
      <MockupWindow class="bg-neutral-content"> Hello! </MockupWindow>
    </BaseSection>
  </div>
</template>
