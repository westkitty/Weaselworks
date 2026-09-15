import { describe, expect, it } from 'vitest'
import { loadFleetPagesLibrary } from '../fleetPages'

describe('fleetPages', () => {
  it('seeds https url launches only', () => {
    const carts = loadFleetPagesLibrary()
    expect(carts.length).toBeGreaterThanOrEqual(20)
    for (const c of carts) {
      expect(c.launch.method).toBe('url')
      expect(c.launch.url?.startsWith('https://')).toBe(true)
    }
  })
})
