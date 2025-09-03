export default {
  '**/*.(ts|tsx|js|vue)': (filenames) => [
    `npx vue-tsc --noEmit`,
    `npx eslint ${filenames.join(' ')} --fix`,
    `npx prettier --ignore-unknown --write ${filenames.join(' ')}`,
  ],

  '**/*.(html|css|vue|md|json)': (filenames) => [
    `npx prettier --ignore-unknown --write ${filenames.join(' ')}`,
  ],
}
