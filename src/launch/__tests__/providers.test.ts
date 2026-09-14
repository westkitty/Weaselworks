import { describe, expect, it } from 'vitest'
import { resolveLaunchActions } from '../providers'
import type { Cartridge } from '../../types/cartridge'

function base(over: Partial<Cartridge>): Cartridge {
  return {
    id: 't',
    title: 'T',
    description: '',
    projectType: 'app',
    status: 'PLAYABLE',
    launch: { method: 'directory' },
    platforms: ['web'],
    tags: [],
    source: 'demo',
    ...over,
  }
}

describe('launch providers', () => {
  it('opens only localhost URLs', () => {
    const actions = resolveLaunchActions(
      base({ launch: { method: 'localhost', url: 'http://localhost:5173' } }),
    )
    expect(actions.some((a) => a.kind === 'open-url')).toBe(true)
  })

  it('never treats arbitrary script as executable shell', () => {
    const actions = resolveLaunchActions(
      base({
        launch: { method: 'script', scriptId: undefined },
        localPath: '/tmp/x',
      }),
    )
    expect(actions[0].kind).toBe('info')
    expect(actions[0].instruction).toMatch(/whitelisted/i)
  })

  it('returns copyable instructions for directory', () => {
    const actions = resolveLaunchActions(
      base({ launch: { method: 'directory' }, localPath: '/Users/me/proj' }),
    )
    expect(actions[0].kind).toBe('copy-instruction')
    expect(actions[0].instruction).toContain('/Users/me/proj')
  })

  it('reports missing projects', () => {
    const actions = resolveLaunchActions(base({ missing: true, localPath: '/gone' }))
    expect(actions[0].instruction).toMatch(/not found/i)
  })
})
