import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadDemoLibrary } from './demo/provider'
import { loadFleetPagesLibrary } from './catalog/fleetPages'
import { discoverManifests } from './discovery/discover'
import { type ManifestCandidate } from './discovery/host'
import { collectTags, emptyFilters, filterCartridges, type LibraryFilters } from './lib/filter'
import { mergeLibrary, normalizeDiscovery, normalizeManual } from './normalize/normalize'
import {
  addDiscoveryDir,
  loadPersistence,
  recordOpened,
  removeCollection,
  removeDiscoveryDir,
  savePersistence,
  toggleFavorite,
  upsertCollection,
} from './persistence/store'
import type { Cartridge, GitMetadata, ManualRegistration, PersistenceState } from './types/cartridge'
import { CartridgeDetail } from './ui/CartridgeDetail'
import { CartridgeGrid } from './ui/CartridgeGrid'
import { CartridgeListView } from './ui/CartridgeList'
import { DiscoverySettingsModal } from './ui/DiscoverySettings'
import { FilterBar } from './ui/FilterBar'
import { RecentRail } from './ui/RecentRail'
import { HelpOverlay } from './ui/HelpOverlay'
import { CommandPalette } from './ui/CommandPalette'
import { Onboarding } from './ui/Onboarding'
import { Toast } from './ui/Toast'
import { resolveLaunchActions, executeSafeLaunch } from './launch/providers'
import { CollectionsPanel } from './ui/CollectionsPanel'
import { ManualRegisterModal } from './ui/ManualRegister'

const DEXTER = '/dexter/stinkweasel-dexter.png'

export default function App() {
  const [persist, setPersist] = useState<PersistenceState>(() => loadPersistence())
  const [filters, setFilters] = useState<LibraryFilters>(() => emptyFilters())
  const [discovered, setDiscovered] = useState<Cartridge[]>([])
  const [registerOpen, setRegisterOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [discoveryScan, setDiscoveryScan] = useState<ManifestCandidate[]>([])
  const [helpOpen, setHelpOpen] = useState(false)
  const [collectionTag, setCollectionTag] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    savePersistence(persist)
  }, [persist])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setHelpOpen((v) => !v)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setHelpOpen(false)
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!toast) return
    const tmr = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(tmr)
  }, [toast])

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
        listManifestCandidates: async (configuredDir) => {
          // Prefer imported Node/FSA scan results matching this configured dir.
          const matches = discoveryScan.filter(
            (c) =>
              c.projectPath === configuredDir ||
              c.manifestPath.startsWith(configuredDir.replace(/\/+$/, '') + '/') ||
              c.projectPath.startsWith(configuredDir.replace(/\/+$/, '') + '/'),
          )
          return matches
        },
      })
      if (cancelled) return
      setDiscovered(results.map(normalizeDiscovery).filter((c): c is Cartridge => c !== null))
    })()
    return () => {
      cancelled = true
    }
  }, [persist.discoveryDirs, persist.uiPrefs.demoMode, discoveryScan])

  const demo = useMemo(() => loadDemoLibrary(), [])
  const fleet = useMemo(() => loadFleetPagesLibrary(), [])
  const manual = useMemo(
    () => persist.manualRegistrations.map(normalizeManual),
    [persist.manualRegistrations],
  )

  const library = useMemo(() => {
    const merged = mergeLibrary({
      demo,
      manual,
      discovered,
      fleet,
      favorites: persist.favorites,
      recentlyOpened: persist.recentlyOpened,
      demoMode: persist.uiPrefs.demoMode,
    })
    return merged
  }, [demo, fleet, manual, discovered, persist.favorites, persist.recentlyOpened, persist.uiPrefs.demoMode])

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
  const recentItems = useMemo(() => {
    const byId = new Map(withGit.map((c) => [c.id, c]))
    return persist.recentlyOpened
      .map((r) => byId.get(r.id))
      .filter((c): c is (typeof withGit)[number] => !!c)
      .slice(0, 12)
  }, [withGit, persist.recentlyOpened])
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
          <button type="button" className="btn" onClick={() => setHelpOpen(true)} aria-label="Keyboard help">
            ?
          </button>
        </div>
      </header>

      <FilterBar filters={filters} allTags={allTags} onChange={setFilters} />
      <RecentRail items={recentItems} onSelect={selectId} />
      <CollectionsPanel
        collections={persist.collections ?? []}
        activeTag={collectionTag}
        onSelectTag={(tag) => {
          setCollectionTag(tag)
          if (tag) setFilters((f) => ({ ...f, tags: [tag] }))
          else setFilters((f) => ({ ...f, tags: [] }))
        }}
        onUpsert={(col) => patchPersist((s) => upsertCollection(s, col))}
        onRemove={(id) => patchPersist((s) => removeCollection(s, id))}
      />
      {selectedIds.length > 0 ? (
        <div className="bulk-bar" role="region" aria-label="Bulk actions">
          <span>{selectedIds.length} selected</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              patchPersist((s) => {
                let next = s
                for (const id of selectedIds) next = toggleFavorite(next, id)
                return next
              })
              setToast('Toggled favorites')
            }}
          >
            Toggle ★
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSelectedIds([])}>
            Clear
          </button>
        </div>
      ) : null}

      <div className={`tv-bezel main-stage ${selected ? 'has-detail' : ''}`}>
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
              selectedIds={selectedIds}
              onSelect={selectId}
              onToggleSelect={(id) =>
                setSelectedIds((ids) =>
                  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
                )
              }
              onToggleFavorite={(id) => patchPersist((s) => toggleFavorite(s, id))}
            />
          )}
        </section>

        <CartridgeDetail
          cartridge={selected}
          playCount={selected ? (persist.playCounts?.[selected.id] ?? 0) : 0}
          onToast={setToast}
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
        onImportScan={(candidates) => {
          setDiscoveryScan(candidates)
          patchPersist((s) => ({
            ...s,
            uiPrefs: { ...s.uiPrefs, demoMode: false },
          }))
        }}
      />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        cartridges={withGit}
        onClose={() => setPaletteOpen(false)}
        onSelectCart={(id) => {
          selectId(id)
          setToast(`Selected ${id}`)
        }}
        actions={[
          {
            id: 'play',
            label: 'Play selected cartridge',
            run: () => {
              const cart = withGit.find((c) => c.id === persist.uiPrefs.selectedId)
              if (!cart) {
                setToast('Nothing selected')
                return
              }
              const act = resolveLaunchActions(cart).find((a) => a.kind === 'open-url')
              if (act) {
                patchPersist((s) => recordOpened(s, cart.id))
                executeSafeLaunch(act)
                setToast(`Playing ${cart.title}`)
              } else {
                setToast('No https/localhost Play action')
              }
            },
          },
          {
            id: 'demo',
            label: persist.uiPrefs.demoMode ? 'Turn Demo OFF' : 'Turn Demo ON',
            run: () =>
              patchPersist((s) => ({
                ...s,
                uiPrefs: { ...s.uiPrefs, demoMode: !s.uiPrefs.demoMode },
              })),
          },
          {
            id: 'register',
            label: 'Register cartridge',
            run: () => setRegisterOpen(true),
          },
          {
            id: 'discovery',
            label: 'Open discovery',
            run: () => setSettingsOpen(true),
          },
          {
            id: 'rescan',
            label: 'Rescan discovery (clear import cache)',
            run: () => {
              setDiscoveryScan([])
              setToast('Discovery cache cleared — re-import JSON')
            },
          },
        ]}
      />
      <Onboarding
        open={!persist.uiPrefs.firstRunDone}
        onDone={() =>
          patchPersist((s) => ({
            ...s,
            uiPrefs: { ...s.uiPrefs, firstRunDone: true },
          }))
        }
      />
      <Toast message={toast} />
    </div>
  )
}

