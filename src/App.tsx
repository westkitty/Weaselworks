import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadDemoLibrary } from './demo/provider'
import { discoverManifests } from './discovery/discover'
import { collectTags, emptyFilters, filterCartridges, type LibraryFilters } from './lib/filter'
import { mergeLibrary, normalizeDiscovery, normalizeManual } from './normalize/normalize'
import {
  addDiscoveryDir,
  loadPersistence,
  recordOpened,
  removeDiscoveryDir,
  savePersistence,
  toggleFavorite,
} from './persistence/store'
import type { Cartridge, GitMetadata, ManualRegistration, PersistenceState } from './types/cartridge'
import { CartridgeDetail } from './ui/CartridgeDetail'
import { CartridgeGrid } from './ui/CartridgeGrid'
import { CartridgeListView } from './ui/CartridgeList'
import { DiscoverySettingsModal } from './ui/DiscoverySettings'
import { FilterBar } from './ui/FilterBar'
import { ManualRegisterModal } from './ui/ManualRegister'

const DEXTER = '/dexter/stinkweasel-dexter.png'

export default function App() {
  const [persist, setPersist] = useState<PersistenceState>(() => loadPersistence())
  const [filters, setFilters] = useState<LibraryFilters>(() => emptyFilters())
  const [discovered, setDiscovered] = useState<Cartridge[]>([])
  const [registerOpen, setRegisterOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    savePersistence(persist)
  }, [persist])

  // Configured-directory discovery (browser: no FS — empty until helper / future FSA).
  // Still wires the discovery module so dirs are stored and scanned when a lister exists.
  useEffect(() => {
    if (persist.uiPrefs.demoMode) {
      setDiscovered([])
      return
    }
    let cancelled = false
    ;(async () => {
      const results = await discoverManifests({
        configuredDirs: persist.discoveryDirs,
        listManifestCandidates: async () => {
          // Pure SPA: filesystem listing requires user tooling / File System Access.
          // Keep library useful via manual registration + demo.
          return []
        },
      })
      if (cancelled) return
      setDiscovered(results.map(normalizeDiscovery).filter((c): c is Cartridge => c !== null))
    })()
    return () => {
      cancelled = true
    }
  }, [persist.discoveryDirs, persist.uiPrefs.demoMode])

  const demo = useMemo(() => loadDemoLibrary(), [])
  const manual = useMemo(
    () => persist.manualRegistrations.map(normalizeManual),
    [persist.manualRegistrations],
  )

  const library = useMemo(() => {
    const merged = mergeLibrary({
      demo,
      manual,
      discovered,
      favorites: persist.favorites,
      recentlyOpened: persist.recentlyOpened,
      demoMode: persist.uiPrefs.demoMode,
    })
    return merged
  }, [demo, manual, discovered, persist.favorites, persist.recentlyOpened, persist.uiPrefs.demoMode])

  const withGit = useMemo(() => {
    if (persist.uiPrefs.demoMode) {
      return library.map((c) => ({
        ...c,
        git: c.git ?? undefined,
      }))
    }
    return library.map((c) => {
      const snap = c.localPath ? persist.gitSnapshots[c.localPath] : undefined
      if (snap) return { ...c, git: { ...snap, available: true } }
      if (c.git) return c
      return {
        ...c,
        git: {
          available: false,
          reason:
            'Git unavailable in browser. Run node scripts/git-inspect.mjs <path> and paste JSON in Settings.',
        },
      }
    })
  }, [library, persist.gitSnapshots, persist.uiPrefs.demoMode])

  const visible = useMemo(() => filterCartridges(withGit, filters), [withGit, filters])
  const allTags = useMemo(() => collectTags(withGit), [withGit])
  const selected =
    withGit.find((c) => c.id === persist.uiPrefs.selectedId) ??
    visible[0] ??
    null

  function patchPersist(updater: (s: PersistenceState) => PersistenceState) {
    setPersist((s) => updater(s))
  }

  function selectId(id: string) {
    patchPersist((s) => ({
      ...s,
      uiPrefs: { ...s.uiPrefs, selectedId: id },
    }))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img
            className="brand-mascot"
            src={DEXTER}
            alt="Stinkweasel Dexter, Weaselworks mascot"
            width={56}
            height={56}
          />
          <div className="brand-text">
            <h1>Weaselworks</h1>
            <p>Personal software arcade · named after Stinkweasel Dexter</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn"
            aria-pressed={persist.uiPrefs.demoMode}
            onClick={() =>
              patchPersist((s) => ({
                ...s,
                uiPrefs: { ...s.uiPrefs, demoMode: !s.uiPrefs.demoMode },
              }))
            }
          >
            {persist.uiPrefs.demoMode ? 'Demo ON' : 'Demo OFF'}
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={persist.uiPrefs.viewMode === 'grid'}
            onClick={() =>
              patchPersist((s) => ({
                ...s,
                uiPrefs: { ...s.uiPrefs, viewMode: 'grid' },
              }))
            }
          >
            Grid
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={persist.uiPrefs.viewMode === 'list'}
            onClick={() =>
              patchPersist((s) => ({
                ...s,
                uiPrefs: { ...s.uiPrefs, viewMode: 'list' },
              }))
            }
          >
            List
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setRegisterOpen(true)}>
            Register
          </button>
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>
            Discovery
          </button>
        </div>
      </header>

      <FilterBar filters={filters} allTags={allTags} onChange={setFilters} />

      <div className={`main-stage ${selected ? 'has-detail' : ''}`}>
        <section className="library-panel" aria-label="Cartridge library">
          <p className="hint" style={{ marginTop: 0 }}>
            Showing {visible.length}
            <span className="count-pill">of {withGit.length}</span>
            {persist.uiPrefs.demoMode ? ' · demo library' : ' · live registrations'}
            {' · '}
            Arrow keys / WASD move the grid focus
          </p>
          {visible.length === 0 ? (
            <div className="empty-state">
              <img src={DEXTER} alt="" />
              <p>No cartridges match. Try clearing filters or enable Demo mode.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setFilters(emptyFilters())
                  patchPersist((s) => ({
                    ...s,
                    uiPrefs: { ...s.uiPrefs, demoMode: true },
                  }))
                }}
              >
                Reset to demo
              </button>
            </div>
          ) : persist.uiPrefs.viewMode === 'list' ? (
            <CartridgeListView
              items={visible}
              selectedId={selected?.id ?? null}
              onSelect={selectId}
              onToggleFavorite={(id) => patchPersist((s) => toggleFavorite(s, id))}
            />
          ) : (
            <CartridgeGrid
              items={visible}
              selectedId={selected?.id ?? null}
              onSelect={selectId}
              onToggleFavorite={(id) => patchPersist((s) => toggleFavorite(s, id))}
            />
          )}
        </section>

        <CartridgeDetail
          cartridge={selected}
          onClose={() =>
            patchPersist((s) => ({
              ...s,
              uiPrefs: { ...s.uiPrefs, selectedId: null },
            }))
          }
          onToggleFavorite={(id) => patchPersist((s) => toggleFavorite(s, id))}
          onMarkOpened={(id) => patchPersist((s) => recordOpened(s, id))}
        />
      </div>

      <ManualRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={(reg: ManualRegistration) =>
          patchPersist((s) => ({
            ...s,
            manualRegistrations: [...s.manualRegistrations, reg],
            uiPrefs: { ...s.uiPrefs, demoMode: false, selectedId: reg.id },
          }))
        }
      />

      <DiscoverySettingsModal
        open={settingsOpen}
        dirs={persist.discoveryDirs}
        onClose={() => setSettingsOpen(false)}
        onAddDir={(dir) => patchPersist((s) => addDiscoveryDir(s, dir))}
        onRemoveDir={(dir) => patchPersist((s) => removeDiscoveryDir(s, dir))}
        onPasteGit={(path, meta: GitMetadata) =>
          patchPersist((s) => ({
            ...s,
            gitSnapshots: { ...s.gitSnapshots, [path]: meta },
          }))
        }
      />
    </div>
  )
}

