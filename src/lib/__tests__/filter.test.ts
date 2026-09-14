import { describe, expect, it } from 'vitest'
import { emptyFilters, filterCartridges, searchCartridges } from '../filter'
import { getDemoCartridges } from '../../demo/cartridges'

describe('search and filters', () => {
  const demo = getDemoCartridges()

  it('searches by title/tags', () => {
    const hits = searchCartridges(demo, 'stinkweasel')
    expect(hits.some((c) => c.id === 'demo-stinkweasel-simulator')).toBe(true)
  })

  it('filters by status', () => {
    const f = { ...emptyFilters(), statuses: ['DORMANT' as const] }
    const hits = filterCartridges(demo, f)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((c) => c.status === 'DORMANT')).toBe(true)
  })

  it('filters favorites', () => {
    const withFav = demo.map((c, i) => (i === 0 ? { ...c, favorite: true } : c))
    const hits = filterCartridges(withFav, { ...emptyFilters(), favoritesOnly: true })
    expect(hits).toHaveLength(1)
  })

  it('filters recently opened', () => {
    const withRecent = demo.map((c, i) =>
      i < 2 ? { ...c, lastOpenedAt: `2026-09-0${i + 1}T00:00:00.000Z` } : c,
    )
    const hits = filterCartridges(withRecent, { ...emptyFilters(), recentlyOnly: true })
    expect(hits).toHaveLength(2)
    expect(hits[0].lastOpenedAt! >= hits[1].lastOpenedAt!).toBe(true)
  })

  it('filters by tag', () => {
    const hits = filterCartridges(demo, { ...emptyFilters(), tags: ['dexter'] })
    expect(hits.length).toBeGreaterThanOrEqual(2)
    expect(hits.every((c) => c.tags.includes('dexter'))).toBe(true)
  })
})
