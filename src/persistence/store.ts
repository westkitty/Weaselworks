import type { PersistenceState, UiPrefs } from '../types/cartridge'

export const PERSISTENCE_SCHEMA_VERSION = 1
export const STORAGE_KEY = 'weaselworks.persistence.v1'

const defaultUiPrefs: UiPrefs = {
  viewMode: 'grid',
  demoMode: true,
  selectedId: null,
  firstRunDone: false,
}

export function defaultPersistenceState(): PersistenceState {
  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    discoveryDirs: ['/Users/andrew/2d_game_factory/2d_Game_Factory/games', '/Users/andrew/2d_game_factory/2d_Game_Factory/demos', '/Users/andrew/2d_game_factory/2d_Game_Factory/proofs', '/Users/andrew/Deeper', '/Users/andrew/Immortals', '/Users/andrew/heliocide_viewer', '/Users/andrew/modern_2d_browser_game_toolkit'],
    manualRegistrations: [],
    favorites: [],
    recentlyOpened: [],
    uiPrefs: { ...defaultUiPrefs },
    gitSnapshots: {},
    playCounts: {},
    collections: [],
  }
}

export function loadPersistence(rawStorage?: Storage | null): PersistenceState {
  const storage = rawStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!storage) return defaultPersistenceState()
  try {
    const text = storage.getItem(STORAGE_KEY)
    if (!text) return defaultPersistenceState()
    const parsed = JSON.parse(text) as Partial<PersistenceState>
    if (parsed.schemaVersion !== PERSISTENCE_SCHEMA_VERSION) {
      // Unsupported / future — start fresh rather than crash
      return defaultPersistenceState()
    }
    return {
      ...defaultPersistenceState(),
      ...parsed,
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      uiPrefs: { ...defaultUiPrefs, ...(parsed.uiPrefs ?? {}) },
      discoveryDirs: Array.isArray(parsed.discoveryDirs) ? parsed.discoveryDirs : [],
      manualRegistrations: Array.isArray(parsed.manualRegistrations)
        ? parsed.manualRegistrations
        : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recentlyOpened: Array.isArray(parsed.recentlyOpened) ? parsed.recentlyOpened : [],
      gitSnapshots:
        parsed.gitSnapshots && typeof parsed.gitSnapshots === 'object'
          ? parsed.gitSnapshots
          : {},
      playCounts:
        parsed.playCounts && typeof parsed.playCounts === 'object' ? parsed.playCounts : {},
    }
  } catch {
    return defaultPersistenceState()
  }
}

export function savePersistence(state: PersistenceState, rawStorage?: Storage | null): void {
  const storage = rawStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!storage) return
  const toSave: PersistenceState = {
    ...state,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Quota / private mode — ignore; library still works in-memory
  }
}

export function toggleFavorite(state: PersistenceState, id: string): PersistenceState {
  const set = new Set(state.favorites)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return { ...state, favorites: [...set] }
}

export function recordOpened(state: PersistenceState, id: string, at = new Date().toISOString()): PersistenceState {
  const rest = state.recentlyOpened.filter((r) => r.id !== id)
  const playCounts = { ...(state.playCounts ?? {}), [id]: ((state.playCounts ?? {})[id] ?? 0) + 1 }
  return {
    ...state,
    recentlyOpened: [{ id, openedAt: at }, ...rest].slice(0, 30),
    playCounts,
  }
}

export function addDiscoveryDir(state: PersistenceState, dir: string): PersistenceState {
  const trimmed = dir.trim()
  if (!trimmed) return state
  if (state.discoveryDirs.includes(trimmed)) return state
  return { ...state, discoveryDirs: [...state.discoveryDirs, trimmed] }
}

export function removeDiscoveryDir(state: PersistenceState, dir: string): PersistenceState {
  return { ...state, discoveryDirs: state.discoveryDirs.filter((d) => d !== dir) }
}

export function upsertCollection(
  state: PersistenceState,
  col: { id: string; name: string; tag: string },
): PersistenceState {
  const rest = state.collections.filter((c) => c.id !== col.id)
  return { ...state, collections: [...rest, col] }
}

export function removeCollection(state: PersistenceState, id: string): PersistenceState {
  return { ...state, collections: state.collections.filter((c) => c.id !== id) }
}
