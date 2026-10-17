# Same-name `v-bind` uses the shorthand

When a prop is bound to a variable of the same name, write the argument alone.
The value is noise: it repeats the name the reader has already read, and it is
the part a rename forgets to update.

```vue
<!-- ✅ -->
<SessionOutputColophon :profile />
<SessionOutputHelp :commands :meta-commands />

<!-- ❌ -->
<SessionOutputColophon :profile="profile" />
<SessionOutputHelp :commands="commands" :meta-commands="metaCommands" />
```

Vue camelises the argument, so a kebab-case prop still reaches its camelCase
variable: `:meta-commands` binds `metaCommands`. Nothing else changes — a value
that is not a bare identifier of the same name (`:email="profile.email"`,
`:state="enquiry.state"`, `:class="entry.animate && 'session-print'"`) stays
written out.

Enforced by `vue/v-bind-style` with `sameNameShorthand: 'always'` in
`eslint.config.js`, and autofixable with `pnpm lint:fix`.

Severity:

- ❌ HIGH — a same-name binding written out in full. `pnpm lint` fails, so the
  branch does not merge.
