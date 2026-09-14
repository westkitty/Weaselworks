import { useEffect, useMemo, useState } from 'react'
import type { Cartridge } from '../types/cartridge'

export type PaletteAction = {
  id: string
  label: string
  run: () => void
}

interface Props {
  open: boolean
  cartridges: Cartridge[]
  actions: PaletteAction[]
  onClose: () => void
  onSelectCart: (id: string) => void
}

export function CommandPalette({ open, cartridges, actions, onClose, onSelectCart }: Props) {
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open])
  const items = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const carts = cartridges
      .filter((c) => !qq || c.title.toLowerCase().includes(qq) || c.id.includes(qq))
      .slice(0, 8)
      .map((c) => ({
        id: `cart:${c.id}`,
        label: `Open ${c.title}`,
        run: () => onSelectCart(c.id),
      }))
    const acts = actions.filter((a) => !qq || a.label.toLowerCase().includes(qq))
    return [...acts, ...carts]
  }, [q, cartridges, actions, onSelectCart])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal palette"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="palette-input"
          placeholder="Type a command or cartridge…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter' && items[0]) {
              items[0].run()
              onClose()
            }
          }}
        />
        <ul className="palette-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className="palette-item"
                onClick={() => {
                  it.run()
                  onClose()
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
