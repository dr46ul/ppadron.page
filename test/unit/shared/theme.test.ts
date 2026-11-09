import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { themeScript } from '../../../shared/theme'

/**
 * The script runs in the browser's `<head>`, before anything else on the page,
 * so it is run here the same way: as source, against a document and a storage
 * it finds as globals, with nothing imported.
 */
function boot(storage: Pick<Storage, 'getItem'> | (() => never)) {
  const dataset: Record<string, string> = {}
  const document = {
    documentElement: { dataset },
  }
  const localStorage = typeof storage === 'function'
    ? Object.defineProperty({}, 'getItem', { get: storage })
    : storage

  runInNewContext(themeScript, { document, localStorage })

  return dataset.theme
}

function saved(value: string | null) {
  return {
    getItem: (key: string) => (key === 'theme'
      ? value
      : null),
  }
}

describe('the head script', () => {
  it('applies a saved light choice before the page paints', () => {
    expect(boot(saved('teletype'))).toBe('teletype')
  })

  it('applies a saved dark choice before the page paints', () => {
    expect(boot(saved('terminal'))).toBe('terminal')
  })

  /**
   * No attribute is what lets the stylesheet's `prefers-color-scheme` query
   * pick, so a Visitor who never chose follows their system.
   */
  it('leaves the theme to the system when nothing was saved', () => {
    expect(boot(saved(null))).toBeUndefined()
  })

  it('ignores a saved value that is not one of the themes', () => {
    expect(boot(saved('dracula'))).toBeUndefined()
  })

  it('leaves the theme to the system when storage refuses to be read', () => {
    expect(boot(() => {
      throw new DOMException('denied', 'SecurityError')
    })).toBeUndefined()
  })
})
