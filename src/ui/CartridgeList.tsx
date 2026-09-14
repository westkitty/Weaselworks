import type { Cartridge } from '../types/cartridge'
import { StatusBadge } from './StatusBadge'

interface Props {
  items: Cartridge[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export function CartridgeListView({ items, selectedId, onSelect, onToggleFavorite }: Props) {
  return (
    <ul className="cart-list" role="listbox" aria-label="Cartridge list">
      {items.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className="cart-row"
            role="option"
            aria-selected={selectedId === c.id}
            onClick={() => onSelect(c.id)}
          >
            {c.artwork ? (
              <img className="thumb" src={c.artwork} alt="" />
            ) : (
              <span className="thumb" aria-hidden="true" />
            )}
            <span>
              <strong>{c.title}</strong>
              <br />
              <StatusBadge status={c.status} />
              <span className="count-pill">{c.tags.slice(0, 3).join(' · ')}</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label={c.favorite ? 'Remove favorite' : 'Add favorite'}
              aria-pressed={!!c.favorite}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(c.id)
              }}
            >
              {c.favorite ? '★' : '☆'}
            </button>
          </button>
        </li>
      ))}
    </ul>
  )
}
