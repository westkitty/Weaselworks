import { describe, expect, it } from 'vitest'
import { parseManifestJson, findDuplicateIds, resolveDuplicateIds } from '../parse'
import { validateManifest } from '../validate'
import { MANIFEST_SCHEMA_VERSION } from '../schema'

const valid = {
  schemaVersion: MANIFEST_SCHEMA_VERSION,
  id: 'my-game',
  title: 'My Game',
  description: 'Fun',
  projectType: 'game',
  status: 'PLAYABLE',
  launch: { method: 'localhost', url: 'http://localhost:5173' },
  platforms: ['web'],
  tags: ['arcade'],
}

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const r = validateManifest(valid)
    expect(r.ok).toBe(true)
    expect(r.document?.id).toBe('my-game')
  })

  it('rejects malformed non-object', () => {
    expect(validateManifest(null).ok).toBe(false)
    expect(validateManifest('nope').ok).toBe(false)
  })

  it('rejects unsupported schema version', () => {
    const r = validateManifest({ ...valid, schemaVersion: 99 })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.includes('Unsupported'))).toBe(true)
  })

  it('rejects missing id/title', () => {
    const r = validateManifest({ schemaVersion: 1 })
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/id/)
    expect(r.errors.join(' ')).toMatch(/title/)
  })

  it('rejects arbitrary shell launch keys', () => {
    const r = validateManifest({
      ...valid,
      launch: { method: 'directory', command: 'rm -rf /' },
    })
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/command/)
  })

  it('rejects non-localhost URLs', () => {
    const r = validateManifest({
      ...valid,
      launch: { method: 'localhost', url: 'https://evil.example' },
    })
    expect(r.ok).toBe(false)
  })

  it('rejects non-whitelisted script ids', () => {
    const r = validateManifest({
      ...valid,
      launch: { method: 'script', scriptId: 'curl-pipe' },
    })
    expect(r.ok).toBe(false)
  })
})

describe('parseManifestJson', () => {
  it('handles malformed JSON without throwing', () => {
    const r = parseManifestJson('{not json')
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/Malformed JSON/)
  })

  it('parses valid JSON', () => {
    const r = parseManifestJson(JSON.stringify(valid))
    expect(r.ok).toBe(true)
  })
})

describe('duplicate IDs', () => {
  it('finds duplicates', () => {
    const d = findDuplicateIds(['a', 'b', 'a', 'c', 'a'])
    expect(d.get('a')).toBe(3)
    expect(d.has('b')).toBe(false)
  })

  it('resolves duplicates explicitly', () => {
    const resolved = resolveDuplicateIds([
      { id: 'x', n: 1 },
      { id: 'x', n: 2 },
      { id: 'y', n: 3 },
    ])
    expect(resolved.map((r) => r.id)).toEqual(['x', 'x#2', 'y'])
  })
})

it('accepts https url launch', () => {
  const r = validateManifest({
    schemaVersion: 1,
    id: 'pages-game',
    title: 'Pages Game',
    launch: { method: 'url', url: 'https://westkitty.github.io/2d_Game_Factory/qa-image-game/' },
  })
  expect(r.ok).toBe(true)
})

it('rejects http for url launch', () => {
  const r = validateManifest({
    schemaVersion: 1,
    id: 'bad-pages',
    title: 'Bad',
    launch: { method: 'url', url: 'http://example.com/game/' },
  })
  expect(r.ok).toBe(false)
})
