import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Every drawn shape in a file, its attributes sorted, `class` left out as styling rather than drawing. */
function shapes(path: string) {
  return [
    ...readFileSync(path, 'utf8').matchAll(/<(rect|circle|line|path|polygon|ellipse)\b([^>]*?)\/?>/g),
  ]
    .map(([, tag, attributes]) => [
      tag,
      ...[
        ...attributes!.matchAll(/([\w-]+)="([^"]*)"/g),
      ]
        .filter(([, name]) => name !== 'class')
        .map(([, name, value]) => `${name}=${value}`)
        .sort(),
    ].join(' '))
}

describe('the site mark', () => {
  it('draws the same shapes inline as the favicon it was rendered from', () => {
    expect(shapes('app/components/SiteMark.vue')).toEqual(shapes('public/favicon.svg'))
  })
})
