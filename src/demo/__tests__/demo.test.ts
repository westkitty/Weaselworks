import { describe, expect, it } from 'vitest'
import { getDemoCartridges } from '../cartridges'
import { CARTRIDGE_STATUSES } from '../../types/cartridge'

describe('demo library', () => {
  it('has ≥12 cartridges across multiple statuses', () => {
    const carts = getDemoCartridges()
    expect(carts.length).toBeGreaterThanOrEqual(12)
    const statuses = new Set(carts.map((c) => c.status))
    expect(statuses.size).toBeGreaterThanOrEqual(5)
    for (const s of statuses) {
      expect(CARTRIDGE_STATUSES).toContain(s)
    }
  })

  it('includes Dexter-branded artwork cartridges', () => {
    const carts = getDemoCartridges()
    const withDexter = carts.filter((c) => c.artwork?.includes('dexter'))
    expect(withDexter.length).toBeGreaterThanOrEqual(1)
    expect(carts.some((c) => /stinkweasel|dexter/i.test(c.title + c.description))).toBe(true)
  })
})
