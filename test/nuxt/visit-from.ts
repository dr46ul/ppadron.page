import { vi } from 'vitest'

/**
 * Where the Visitor is, as their browser reports it. Left alone, the time zone
 * is the machine's own, and a date would read differently on a laptop and in
 * CI. Node re-reads `TZ` whenever it changes, so stubbing it moves the zone
 * `Intl` resolves to. Undo with `vi.restoreAllMocks()` and `vi.unstubAllEnvs()`.
 */
export function visitFrom(languages: string[], timeZone: string) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)
  vi.stubEnv('TZ', timeZone)
}
