import { useId, useState, type FormEvent } from 'react'
import type { CartridgeStatus, LaunchMethod, ManualRegistration, ProjectType } from '../types/cartridge'
import { CARTRIDGE_STATUSES, PROJECT_TYPES, SAFE_SCRIPT_IDS } from '../types/cartridge'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (reg: ManualRegistration) => void
}

const empty = {
  id: '',
  title: '',
  description: '',
  artwork: '',
  projectType: 'app' as ProjectType,
  status: 'DEVELOPMENT' as CartridgeStatus,
  localPath: '',
  method: 'directory' as LaunchMethod,
  url: '',
  htmlPath: '',
  scriptId: 'npm-dev' as (typeof SAFE_SCRIPT_IDS)[number],
  platforms: 'web',
  tags: '',
}

export function ManualRegisterModal({ open, onClose, onSubmit }: Props) {
  const titleId = useId()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function update<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const id = form.id.trim()
    const title = form.title.trim()
    if (!id || !title) {
      setError('id and title are required')
      return
    }
    if (/\s/.test(id) === false) {
      /* ok */
    }
    const launch =
      form.method === 'localhost'
        ? { method: 'localhost' as const, url: form.url.trim() }
        : form.method === 'html'
          ? { method: 'html' as const, htmlPath: form.htmlPath.trim() || 'index.html' }
          : form.method === 'script'
            ? { method: 'script' as const, scriptId: form.scriptId }
            : { method: 'directory' as const }

    if (launch.method === 'localhost') {
      try {
        const u = new URL(launch.url)
        const host = u.hostname.toLowerCase()
        if (
          (u.protocol !== 'http:' && u.protocol !== 'https:') ||
          !(host === 'localhost' || host === '127.0.0.1' || host === '[::1]')
        ) {
          setError('localhost launch requires http(s)://localhost or 127.0.0.1')
          return
        }
      } catch {
        setError('Invalid localhost URL')
        return
      }
    }

    const reg: ManualRegistration = {
      id,
      title,
      description: form.description.trim(),
      artwork: form.artwork.trim() || undefined,
      projectType: form.projectType,
      status: form.status,
      localPath: form.localPath.trim() || undefined,
      launch,
      platforms: form.platforms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      registeredAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }
    onSubmit(reg)
    setForm(empty)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>Manual registration</h2>
        <p className="hint">Register a local project without a manifest. No shell commands accepted.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Stable id
            <input value={form.id} onChange={(e) => update('id', e.target.value)} required />
          </label>
          <label>
            Title
            <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </label>
          <label>
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </label>
          <label>
            Artwork URL (optional)
            <input
              value={form.artwork}
              onChange={(e) => update('artwork', e.target.value)}
              placeholder="/dexter/stinkweasel-dexter.png"
            />
          </label>
          <label>
            Local path
            <input value={form.localPath} onChange={(e) => update('localPath', e.target.value)} />
          </label>
          <label>
            Project type
            <select
              value={form.projectType}
              onChange={(e) => update('projectType', e.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as CartridgeStatus)}
            >
              {CARTRIDGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Launch method
            <select
              value={form.method}
              onChange={(e) => update('method', e.target.value as LaunchMethod)}
            >
              <option value="directory">directory</option>
              <option value="localhost">localhost</option>
              <option value="html">html</option>
              <option value="script">script (whitelisted)</option>
            </select>
          </label>
          {form.method === 'localhost' ? (
            <label>
              Localhost URL
              <input
                value={form.url}
                onChange={(e) => update('url', e.target.value)}
                placeholder="http://localhost:5173"
              />
            </label>
          ) : null}
          {form.method === 'html' ? (
            <label>
              HTML path
              <input
                value={form.htmlPath}
                onChange={(e) => update('htmlPath', e.target.value)}
                placeholder="index.html"
              />
            </label>
          ) : null}
          {form.method === 'script' ? (
            <label>
              Script id
              <select
                value={form.scriptId}
                onChange={(e) =>
                  update('scriptId', e.target.value as (typeof SAFE_SCRIPT_IDS)[number])
                }
              >
                {SAFE_SCRIPT_IDS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Platforms (comma-separated)
            <input value={form.platforms} onChange={(e) => update('platforms', e.target.value)} />
          </label>
          <label>
            Tags (comma-separated)
            <input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
          </label>
          {error ? (
            <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>
              {error}
            </p>
          ) : null}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
