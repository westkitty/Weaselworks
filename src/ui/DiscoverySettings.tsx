import { useId, useState } from 'react'
import type { GitMetadata } from '../types/cartridge'

interface Props {
  open: boolean
  dirs: string[]
  onClose: () => void
  onAddDir: (dir: string) => void
  onRemoveDir: (dir: string) => void
  onPasteGit: (path: string, meta: GitMetadata) => void
}

export function DiscoverySettingsModal({
  open,
  dirs,
  onClose,
  onAddDir,
  onRemoveDir,
  onPasteGit,
}: Props) {
  const titleId = useId()
  const [dir, setDir] = useState('')
  const [gitPath, setGitPath] = useState('')
  const [gitJson, setGitJson] = useState('')
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
              placeholder="/Users/you/Developer"
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
