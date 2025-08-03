export default {
  '**/*.(ts|tsx|js|vue)': (filenames) => [
    `npx vue-tsc --noEmit`,
    `npx eslint ${filenames.join(' ')} --fix`,
    `npx prettier --write ${filenames.join(' ')}`,
  ],

  '**/*.(html|css|vue|md|json)': (filenames) => [
    `npx prettier --write ${filenames.join(' ')}`,
  ],
}
