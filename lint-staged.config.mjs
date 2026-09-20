export default {
  // ESLint owns formatting as well as linting — see ADR-0006. It formats every
  // type below, including the ones Prettier used to handle on its own.
  '**/*.(ts|tsx|js|mjs|vue|css|html|md|json|yaml|yml)': filenames => [
    `npx eslint ${filenames.join(' ')} --fix`,
  ],

  // Project-wide, so it is worth running only when code actually changed.
  '**/*.(ts|tsx|js|mjs|vue)': () => [`npx vue-tsc --noEmit`],
}
