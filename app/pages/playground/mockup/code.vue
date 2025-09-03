<template>
  <div class="flex flex-col items-center gap-6 w-auto m-auto max-w-7xl p-8">
    <BaseSection
      id="mockup-code-with-line-prefix"
      label="mockup code with line prefix"
    >
      <MockupCode>
        <pre data-prefix="$"><code>npm i daisyui</code></pre>
      </MockupCode>
    </BaseSection>

    <BaseSection id="multi-line" label="multi line">
      <MockupCode>
        <pre data-prefix="$"><code>npm i daisyui</code></pre>
        <pre
          data-prefix=">"
          class="text-warning"
        ><code>installing...</code></pre>
        <pre data-prefix=">" class="text-success"><code>Done!</code></pre>
      </MockupCode>
    </BaseSection>

    <BaseSection id="highlighted-line" label="highlighted line">
      <MockupCode>
        <pre data-prefix="1"><code>npm i daisyui</code></pre>
        <pre data-prefix="2"><code>installing...</code></pre>
        <pre
          data-prefix="3"
          class="bg-warning text-warning-content"
        ><code>Error!</code></pre>
      </MockupCode>
    </BaseSection>

    <BaseSection id="long-line-will-scroll" label="long line will scroll">
      <MockupCode>
        <pre data-prefix="~">
          <code>Magnam dolore beatae necessitatibus nemopsum itaque sit. Et porro quae qui et et dolore ratione.</code>
        </pre>
      </MockupCode>
    </BaseSection>

    <BaseSection id="without-prefix" label="without prefix">
      <MockupCode>
        <pre><code>without prefix</code></pre>
      </MockupCode>
    </BaseSection>

    <BaseSection id="with-color" label="with color">
      <MockupCode class="bg-primary text-primary-content">
        <pre><code>can be any color</code></pre>
      </MockupCode>
    </BaseSection>
  </div>
</template>
