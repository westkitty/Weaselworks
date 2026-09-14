import { describe, expect, it } from 'vitest'
import { parseDiscoveryScanJson } from '../host'

describe('parseDiscoveryScanJson', () => {
  it('parses candidates', () => {
    const text = JSON.stringify([
      {
        manifestPath: '/games/a/weaselworks.json',
        projectPath: '/games/a',
        jsonText: '{}',
      },
    ])
    expect(parseDiscoveryScanJson(text)).toHaveLength(1)
  })

  it('skips path traversal', () => {
    const text = JSON.stringify([
      {
        manifestPath: '/games/../etc/weaselworks.json',
        projectPath: '/games/../etc',
        jsonText: '{}',
      },
    ])
    expect(parseDiscoveryScanJson(text)).toHaveLength(0)
  })
})
