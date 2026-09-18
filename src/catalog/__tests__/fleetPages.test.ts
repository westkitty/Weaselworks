import { describe, expect, it } from 'vitest'
import { loadFleetPagesLibrary } from '../fleetPages'

describe('fleetPages', () => {
  it('seeds https url launches for playables; allows safe script for Make TOOL', () => {
    const carts = loadFleetPagesLibrary()
    expect(carts.length).toBeGreaterThanOrEqual(40)
    const make = carts.find((c) => c.id === 'factory-workbench')
    expect(make).toBeTruthy()
    expect(make?.status).toBe('TOOL')
    expect(make?.launch.method).toBe('script')
    expect(make?.tags).toContain('make')

    for (const c of carts) {
      if (c.id === 'factory-workbench') continue
      expect(c.launch.method).toBe('url')
      expect(c.launch.url?.startsWith('https://')).toBe(true)
    }

    const factoryPlayables = carts.filter((c) => c.tags.includes('factory') && c.status === 'PLAYABLE')
    expect(factoryPlayables.length).toBeGreaterThanOrEqual(40)
    for (const c of carts.filter((c) => c.tags.includes('legacy-pages'))) {
      expect(c.tags.includes('factory')).toBe(false)
    }
  })
})
