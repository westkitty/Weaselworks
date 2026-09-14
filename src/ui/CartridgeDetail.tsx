import type { Cartridge } from '../types/cartridge'
import { resolveLaunchActions, executeSafeLaunch } from '../launch/providers'
import { formatGitInspectCommand } from '../git/inspect'
import { StatusBadge } from './StatusBadge'

interface Props {
  cartridge: Cartridge | null
  onClose: () => void
  onToggleFavorite: (id: string) => void
  onMarkOpened: (id: string) => void
}

export function CartridgeDetail({ cartridge, onClose, onToggleFavorite, onMarkOpened }: Props) {
  if (!cartridge) {
    return (
      <aside className="detail-panel" aria-label="Cartridge detail">
        <div className="empty-state">
          <img src="/dexter/stinkweasel-dexter.png" alt="Stinkweasel Dexter" />
          <p>Select a cartridge to inspect launch options, Git status, and project details.</p>
        </div>
      </aside>
    )
  }

  const actions = resolveLaunchActions(cartridge)
  const git = cartridge.git

  return (
    <aside className="detail-panel" aria-label={`Detail: ${cartridge.title}`}>
      <div className="detail-hero">
        {cartridge.artwork ? (
          <img src={cartridge.artwork} alt="" />
        ) : (
          <div className="art-ph" aria-hidden="true" />
        )}
        <div>
          <h2>{cartridge.title}</h2>
          <p>{cartridge.description}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <StatusBadge status={cartridge.status} />
          </div>
        </div>
      </div>

      <dl className="kv">
        <dt>ID</dt>
        <dd>{cartridge.id}</dd>
        <dt>Type</dt>
        <dd>{cartridge.projectType}</dd>
        <dt>Path</dt>
        <dd>{cartridge.localPath ?? '—'}</dd>
        <dt>Platforms</dt>
        <dd>{cartridge.platforms.join(', ') || '—'}</dd>
        <dt>Tags</dt>
        <dd>{cartridge.tags.join(', ') || '—'}</dd>
        <dt>Last activity</dt>
        <dd>{cartridge.lastActivity ?? '—'}</dd>
        <dt>Source</dt>
        <dd>{cartridge.source}</dd>
        {cartridge.repo?.url ? (
          <>
            <dt>Repo</dt>
            <dd>{cartridge.repo.url}</dd>
          </>
        ) : null}
      </dl>

      {cartridge.missing ? (
        <div className="issue-box" role="status">
          <strong>Missing project</strong>
          <pre>Local path not found: {cartridge.localPath}</pre>
        </div>
      ) : null}

      {cartridge.manifestIssues && cartridge.manifestIssues.length > 0 ? (
        <div className="issue-box" role="alert">
          <strong>Broken / invalid manifest</strong>
          <pre>{cartridge.manifestIssues.join('\n')}</pre>
        </div>
      ) : null}

      <div className="git-box">
        <strong>Git</strong>
        {git?.available ? (
          <dl className="kv" style={{ marginTop: '0.35rem' }}>
            <dt>Branch</dt>
            <dd>{git.branch}</dd>
            <dt>HEAD</dt>
            <dd>{git.headShort}</dd>
            <dt>Working tree</dt>
            <dd>{git.dirty ? 'dirty' : 'clean'}</dd>
            <dt>Last commit</dt>
            <dd>{git.lastCommitDate ?? '—'}</dd>
          </dl>
        ) : (
          <pre>
            {git?.reason ?? 'Git unavailable in browser'}
            {cartridge.localPath
              ? `\n\nOptional helper:\n${formatGitInspectCommand(cartridge.localPath)}`
              : ''}
          </pre>
        )}
      </div>

      <div className="launch-box">
        <strong>Launch (safe)</strong>
        {actions.map((a) => (
          <div key={a.label} style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {a.kind === 'open-url' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onMarkOpened(cartridge.id)
                    executeSafeLaunch(a)
                  }}
                >
                  {a.label}
                </button>
              ) : null}
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  onMarkOpened(cartridge.id)
                  try {
                    await navigator.clipboard.writeText(a.instruction)
                  } catch {
                    /* clipboard may be denied */
                  }
                }}
              >
                Copy instructions
              </button>
            </div>
            <pre>{a.instruction}</pre>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={() => onToggleFavorite(cartridge.id)}>
          {cartridge.favorite ? '★ Favorited' : '☆ Favorite'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  )
}
