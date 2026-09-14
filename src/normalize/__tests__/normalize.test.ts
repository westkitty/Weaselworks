import { describe, expect, it } from 'vitest'
import { mergeLibrary, normalizeDiscovery, normalizeFromManifest } from '../normalize'
import { getDemoCartridges } from '../../demo/cartridges'
import type { DiscoveredManifest } from '../../discovery/discover'

describe('normalize + merge', () => {
  it('normalizes manifest into cartridge model', () => {
    const c = normalizeFromManifest(
      {
        schemaVersion: 1,
        id: 'x',
        title: 'X',
        status: 'TOOL',
        projectType: 'utility',
        launch: { method: 'html', htmlPath: 'a.html' },
      },
      { source: 'discovery', localPath: '/p/x' },
    )
    expect(c.status).toBe('TOOL')
    expect(c.launch.method).toBe('html')
  })

  it('marks broken discovery manifests', () => {
    const d: DiscoveredManifest = {
      manifestPath: '/p/b/weaselworks.json',
      projectPath: '/p/b',
      result: { ok: false, errors: ['bad'], warnings: [] },
    }
    const c = normalizeDiscovery(d)
    expect(c?.status).toBe('BROKEN')
    expect(c?.manifestIssues).toContain('bad')
  })

  it('demo library has at least 12 cartridges', () => {
    expect(getDemoCartridges().length).toBeGreaterThanOrEqual(12)
  })

  it('resolves duplicate ids when merging', () => {
    const demo = getDemoCartridges().slice(0, 1)
    const manual = [{ ...demo[0], source: 'manual' as const }]
    const merged = mergeLibrary({
      demo: [],
      manual: [...manual, ...manual],
      discovered: [],
      favorites: [],
      recentlyOpened: [],
      demoMode: false,
    })
    expect(merged[0].id).toBe(demo[0].id)
    expect(merged[1].id).toBe(`${demo[0].id}#2`)
  })

  it('detects missing flag passthrough', () => {
    const demo = getDemoCartridges()
    expect(demo.some((c) => c.missing)).toBe(true)
    expect(demo.some((c) => (c.manifestIssues?.length ?? 0) > 0)).toBe(true)
  })
})
