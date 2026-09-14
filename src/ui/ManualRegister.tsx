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
  const [step, setStep] = useState(0)

  if (!open) return null

  function update<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onArtFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Artwork must be an image file')
      return
    }
    if (file.size > 1_500_000) {
      setError('Artwork must be under 1.5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') update('artwork', reader.result)
    }
    reader.readAsDataURL(file)
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

    let launch: ManualRegistration['launch']
    if (form.method === 'localhost') {
      launch = { method: 'localhost', url: form.url.trim() }
    } else if (form.method === 'url') {
      launch = { method: 'url', url: form.url.trim() }
    } else if (form.method === 'html') {
      launch = { method: 'html', htmlPath: form.htmlPath.trim() || 'index.html' }
    } else if (form.method === 'script') {
      launch = { method: 'script', scriptId: form.scriptId }
    } else {
      launch = { method: 'directory' }
    }

    if (launch.method === 'localhost') {
      try {
        const u = new URL(launch.url ?? '')
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

    if (launch.method === 'url') {
      try {
        const u = new URL(launch.url ?? '')
        if (u.protocol !== 'https:') {
          setError('url launch requires https://')
          return
        }
      } catch {
        setError('Invalid https URL')
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
    setStep(0)
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
        <h2 id={titleId}>Register cartridge · step {step + 1}/3</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          {step === 0 ? (
            <>
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
                  rows={3}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
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
                Type
                <select
                  value={form.projectType}
                  onChange={(e) => update('projectType', e.target.value as ProjectType)}
                >
                  {PROJECT_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <label>
                Launch method
                <select
                  value={form.method}
                  onChange={(e) => update('method', e.target.value as LaunchMethod)}
                >
                  <option value="directory">directory</option>
                  <option value="html">html</option>
                  <option value="localhost">localhost</option>
                  <option value="url">url (https Pages)</option>
                  <option value="script">script</option>
                </select>
              </label>
              {(form.method === 'localhost' || form.method === 'url') && (
                <label>
                  URL
                  <input
                    value={form.url}
                    onChange={(e) => update('url', e.target.value)}
                    placeholder={
                      form.method === 'url'
                        ? 'https://westkitty.github.io/...'
                        : 'http://localhost:5173'
                    }
                  />
                </label>
              )}
              {form.method === 'html' && (
                <label>
                  HTML path
                  <input
                    value={form.htmlPath}
                    onChange={(e) => update('htmlPath', e.target.value)}
                    placeholder="index.html"
                  />
                </label>
              )}
              {form.method === 'script' && (
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
              )}
              <label>
                Local path
                <input value={form.localPath} onChange={(e) => update('localPath', e.target.value)} />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label>
                Artwork URL or data
                <input
                  value={form.artwork.startsWith('data:') ? '' : form.artwork}
                  onChange={(e) => update('artwork', e.target.value)}
                  placeholder="https://… or upload below"
                />
              </label>
              <label>
                Upload art (≤1.5MB)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onArtFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {form.artwork ? (
                <img
                  src={form.artwork}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : null}
              <label>
                Platforms (comma)
                <input value={form.platforms} onChange={(e) => update('platforms', e.target.value)} />
              </label>
              <label>
                Tags (comma)
                <input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
              </label>
            </>
          ) : null}

          {error ? (
            <p role="alert" style={{ color: '#ff8a9a' }}>
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            {step > 0 ? (
              <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : null}
            {step < 2 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                Register
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
