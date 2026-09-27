export default {
  // ESLint owns formatting as well as linting — see ADR-0006 — which is why
  // this glob reaches past the source types.
  '**/*.(ts|tsx|js|mjs|vue|css|html|md|json|yaml|yml)': filenames => [
    `npx eslint ${filenames.join(' ')} --fix`,
  ],

  // Project-wide, so it is worth running only when code actually changed.
  '**/*.(ts|tsx|js|mjs|vue)': () => [`npx vue-tsc --noEmit`],
}
