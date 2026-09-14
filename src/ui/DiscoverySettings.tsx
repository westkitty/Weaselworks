import { useId, useState } from 'react'
import {
  listCandidatesFromDirectoryHandle,
  parseDiscoveryScanJson,
  type ManifestCandidate,
} from '../discovery/host'
import type { GitMetadata } from '../types/cartridge'

interface Props {
  open: boolean
  dirs: string[]
  onClose: () => void
  onAddDir: (dir: string) => void
  onRemoveDir: (dir: string) => void
  onPasteGit: (path: string, meta: GitMetadata) => void
  onImportScan: (candidates: ManifestCandidate[]) => void
}

export function DiscoverySettingsModal({
  open,
  dirs,
  onClose,
  onAddDir,
  onRemoveDir,
  onPasteGit,
  onImportScan,
}: Props) {
  const titleId = useId()
  const [dir, setDir] = useState('')
  const [gitPath, setGitPath] = useState('')
  const [gitJson, setGitJson] = useState('')
  const [scanJson, setScanJson] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>Discovery & Git</h2>
        <p className="hint">
          Configure directories only — Weaselworks looks for <code>weaselworks.json</code> in each
          dir and one level of children. Never crawls your home folder.
        </p>

        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault()
            onAddDir(dir)
            setDir('')
          }}
        >
          <label>
            Add discovery directory
            <input
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              placeholder="/Users/andrew/2d_game_factory/2d_Game_Factory/games"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Add directory
          </button>
        </form>

        <ul className="cart-list" style={{ marginTop: '0.75rem' }}>
          {dirs.length === 0 ? <li className="hint">No directories configured.</li> : null}
          {dirs.map((d) => (
            <li key={d} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <code style={{ flex: 1 }}>{d}</code>
              <button type="button" className="btn btn-ghost" onClick={() => onRemoveDir(d)}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <hr style={{ borderColor: '#3a2f4d', margin: '1rem 0' }} />

        <p className="hint">
          Import scan from{' '}
          <code>node scripts/discover-manifests.mjs &lt;dir&gt;</code> (recommended on Mac), or pick a
          folder in Chromium via File System Access.
        </p>
        <div className="form-grid">
          <label>
            Paste discovery JSON
            <textarea rows={5} value={scanJson} onChange={(e) => setScanJson(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setMsg(null)
              try {
                const candidates = parseDiscoveryScanJson(scanJson)
                onImportScan(candidates)
                setMsg(`Imported ${candidates.length} manifest(s)`)
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'Invalid discovery JSON')
              }
            }}
          >
            Import discovery JSON
          </button>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              setMsg(null)
              const w = window as Window & {
                showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>
              }
              if (!w.showDirectoryPicker) {
                setMsg('File System Access not available in this browser — paste discovery JSON instead.')
                return
              }
              try {
                const handle = await w.showDirectoryPicker()
                const label = handle.name || 'picked-folder'
                const candidates = await listCandidatesFromDirectoryHandle(handle, label)
                onImportScan(candidates)
                onAddDir(label)
                setMsg(`Picked folder · ${candidates.length} manifest(s)`)
              } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return
                setMsg(err instanceof Error ? err.message : 'Folder pick failed')
              }
            }}
          >
            Pick folder (File System Access)
          </button>
        </div>

        <hr style={{ borderColor: '#3a2f4d', margin: '1rem 0' }} />

        <p className="hint">
          Optional: paste JSON from <code>node scripts/git-inspect.mjs &lt;path&gt;</code>. The app
          never spawns git itself.
        </p>
        <div className="form-grid">
          <label>
            Project path
            <input value={gitPath} onChange={(e) => setGitPath(e.target.value)} />
          </label>
          <label>
            Git inspect JSON
            <textarea rows={4} value={gitJson} onChange={(e) => setGitJson(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setMsg(null)
              try {
                const meta = JSON.parse(gitJson) as GitMetadata
                if (!gitPath.trim()) {
                  setMsg('Path required')
                  return
                }
                onPasteGit(gitPath.trim(), meta)
                setMsg('Git snapshot saved')
                setGitJson('')
              } catch {
                setMsg('Invalid JSON')
              }
            }}
          >
            Save Git snapshot
          </button>
          {msg ? <p role="status">{msg}</p> : null}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
