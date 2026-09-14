import { describe, expect, it } from 'vitest'
import {
  defaultPersistenceState,
  loadPersistence,
  recordOpened,
  savePersistence,
  toggleFavorite,
  PERSISTENCE_SCHEMA_VERSION,
} from '../store'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v))
    },
    removeItem: (k) => {
      map.delete(k)
    },
    key: (i) => [...map.keys()][i] ?? null,
  }
}

describe('persistence', () => {
  it('round-trips schema-versioned state', () => {
    const storage = memoryStorage()
    let state = defaultPersistenceState()
    state = toggleFavorite(state, 'demo-a')
    state = recordOpened(state, 'demo-a', '2026-09-14T12:00:00.000Z')
    savePersistence(state, storage)
    const loaded = loadPersistence(storage)
    expect(loaded.schemaVersion).toBe(PERSISTENCE_SCHEMA_VERSION)
    expect(loaded.favorites).toContain('demo-a')
    expect(loaded.recentlyOpened[0]?.id).toBe('demo-a')
  })

  it('resets on unsupported schema / corrupt JSON', () => {
    const storage = memoryStorage()
    storage.setItem('weaselworks.persistence.v1', '{"schemaVersion":999}')
    expect(loadPersistence(storage).schemaVersion).toBe(PERSISTENCE_SCHEMA_VERSION)
    storage.setItem('weaselworks.persistence.v1', '{nope')
    expect(loadPersistence(storage).favorites).toEqual([])
  })
})
