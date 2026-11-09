import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('app/assets/css/main.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** The declarations of the first rule whose selector list contains `selector`. */
function declarations(selector: string): string | undefined {
  const rule = [
    ...css.matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].find(([, selectors]) =>
    selectors!.split(',').some(s => s.trim() === selector),
  )
  return rule?.[2]
}

describe('focus on a text control', () => {
  it('finds the stylesheet to check', () => {
    expect(css).toContain(':focus-visible')
  })

  /**
   * A terminal never boxes its input. The rectangle stays for buttons, chips
   * and links, which are boxes already; the text controls carry focus
   * themselves.
   */
  it.each(['input', 'textarea'])('draws no ring around a %s', (tag) => {
    expect(declarations(`${tag}:focus-visible`)).toMatch(/outline:\s*none/)
  })

  it('leaves the ring in place for everything else', () => {
    expect(declarations(':focus-visible')).toMatch(/outline:\s*2px solid var\(--color-accent\)/)
  })
})

describe('the prompt caret', () => {
  const unfocused = declarations('input:not(:focus) ~ .prompt-mirror .prompt-caret')

  /**
   * A terminal draws a solid block when it has focus and a hollow one when it
   * does not. Solid and blinking is the `.caret` the prompt already had, so
   * only the unfocused state needs a rule.
   */
  it('is hollow when the prompt is not focused', () => {
    expect({ background: unfocused, outline: unfocused }).toEqual({
      background: expect.stringMatching(/background:\s*transparent/),
      outline: expect.stringMatching(/box-shadow:\s*inset 0 0 0 1px var\(--color-accent\)/),
    })
  })

  it('stops blinking when the prompt is not focused', () => {
    expect(unfocused).toMatch(/animation:\s*none/)
  })

  it('stays solid and blinking when the prompt is focused', () => {
    const solid = declarations('.caret')

    expect({ background: solid, animation: solid }).toEqual({
      background: expect.stringMatching(/background:\s*var\(--color-accent\)/),
      animation: expect.stringMatching(/animation:\s*caret-blink/),
    })
  })
})

describe('the prompt input', () => {
  it('hides the browser\'s own caret, so the block is the only one', () => {
    expect(declarations('.prompt-input')).toMatch(/caret-color:\s*transparent/)
  })

  it('starts the placeholder one block along while the prompt is empty', () => {
    const width = declarations('.caret')?.match(/width:([^;]+)/)?.[1]?.trim()
    const indent = declarations('.prompt-input:placeholder-shown')?.match(/text-indent:([^;]+)/)?.[1]?.trim()

    expect(indent).toEqual(expect.stringContaining(width ?? 'no caret width'))
  })
})
