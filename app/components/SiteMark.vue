<template>
  <svg
    viewBox="0 0 640 640"
    aria-hidden="true"
    focusable="false"
  >
    <!-- The same drawing as public/favicon.svg, kept inline so the cursor can
         blink under the stylesheet's reduced-motion rule.
         test/unit/site-mark.test.ts fails until the two match, and `pnpm
         icons` re-renders the ICO and PNG from the SVG. -->
    <rect width="640" height="640" rx="128" fill="#14171c" />
    <circle cx="276" cy="296" r="120" fill="none" stroke="#e8ebef" stroke-width="56" />
    <line x1="156" y1="176" x2="156" y2="486" stroke="#e8ebef" stroke-width="56" stroke-linecap="round" />
    <rect class="mark-cursor" x="448" y="330" width="72" height="114" rx="6" fill="#f1b464" />
  </svg>
</template>
