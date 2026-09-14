import { describe, expect, it } from 'vitest'
import { createBrowserGitProvider, demoGitProvider, formatGitInspectCommand } from '../inspect'
import { DEMO_GIT } from '../fixtures'

describe('git inspect', () => {
  it('demo fixtures return branch metadata', async () => {
    const meta = await demoGitProvider.inspect(undefined, 'demo-nebula-raiders')
    expect(meta.available).toBe(true)
    expect(meta.branch).toBe('main')
    expect(meta.dirty).toBe(false)
  })

  it('browser provider uses snapshots or unavailable reason', async () => {
    const p = createBrowserGitProvider({
      '/proj': {
        available: true,
        branch: 'feat',
        headShort: 'abc',
        dirty: true,
        lastCommitDate: '2026-01-01T00:00:00.000Z',
      },
    })
    const hit = await p.inspect('/proj', 'x')
    expect(hit.branch).toBe('feat')
    expect(hit.dirty).toBe(true)
    const miss = await p.inspect('/other', 'y')
    expect(miss.available).toBe(false)
    expect(miss.reason).toMatch(/unavailable/i)
  })

  it('formats copyable helper command', () => {
    expect(formatGitInspectCommand('/Users/me/p')).toContain('git-inspect.mjs')
  })

  it('has fixtures for dirty/clean cases', () => {
    expect(DEMO_GIT['demo-pixel-ledger'].dirty).toBe(true)
    expect(DEMO_GIT['demo-nebula-raiders'].dirty).toBe(false)
  })
})
