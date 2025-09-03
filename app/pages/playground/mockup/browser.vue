<script lang="ts" setup>
const url = 'https://ppadron.com'
</script>

<template>
  <div class="flex flex-col items-center gap-6 w-auto m-auto max-w-7xl p-8">
    <BaseSection
      id="browser-mockup-with-border"
      label="browser mockup with border"
    >
      <MockupBrowser :url> Hello! </MockupBrowser>
    </BaseSection>

    <BaseSection
      id="browser-mockup-with-background-color"
      label="browser mockup with background color"
    >
      <MockupBrowser :url borderless class="bg-neutral-content">
        Hello!
      </MockupBrowser>
    </BaseSection>
  </div>
</template>
