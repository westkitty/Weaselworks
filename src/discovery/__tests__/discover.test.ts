import { describe, expect, it } from 'vitest'
import { discoverManifests, selectManifestPaths } from '../discover'

describe('selectManifestPaths', () => {
  it('selects root and one-level children only', () => {
    const paths = selectManifestPaths('/Users/me/Dev', [
      'weaselworks.json',
      'game-a/weaselworks.json',
      'game-a/nested/weaselworks.json',
      'readme.md',
      'tool-b/weaselworks.json',
    ])
    expect(paths.map((p) => p.relative).sort()).toEqual([
      'game-a/weaselworks.json',
      'tool-b/weaselworks.json',
      'weaselworks.json',
    ])
  })
})

describe('discoverManifests', () => {
  it('validates candidates and reports broken without throwing', async () => {
    const results = await discoverManifests({
      configuredDirs: ['/Users/me/Dev'],
      listManifestCandidates: async () => [
        {
          manifestPath: '/Users/me/Dev/good/weaselworks.json',
          projectPath: '/Users/me/Dev/good',
          jsonText: JSON.stringify({
            schemaVersion: 1,
            id: 'good',
            title: 'Good',
            status: 'PLAYABLE',
            launch: { method: 'directory' },
          }),
        },
        {
          manifestPath: '/Users/me/Dev/bad/weaselworks.json',
          projectPath: '/Users/me/Dev/bad',
          jsonText: '{bad',
        },
      ],
    })
    expect(results).toHaveLength(2)
    expect(results[0].result.ok).toBe(true)
    expect(results[1].result.ok).toBe(false)
  })
})
