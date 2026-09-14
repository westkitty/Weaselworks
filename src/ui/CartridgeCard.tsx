import type { Cartridge } from '../types/cartridge'
import { StatusBadge } from './StatusBadge'

interface Props {
  cartridge: Cartridge
  selected: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  tabIndex: number
  gridIndex: number
}

export function CartridgeCard({
  cartridge,
  selected,
  onSelect,
  onToggleFavorite,
  tabIndex,
  gridIndex,
}: Props) {
  const initial = cartridge.title.trim().charAt(0).toUpperCase() || '?'
  const stateClass = [
    'cart-card',
    'cart-plastic',
    selected ? 'is-selected' : '',
    cartridge.favorite ? 'is-favorite' : '',
    cartridge.missing ? 'is-missing' : '',
    cartridge.status === 'BROKEN' || (cartridge.manifestIssues?.length ?? 0) > 0 ? 'is-broken' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li>
      <div
        role="option"
        aria-selected={selected}
        aria-label={`${cartridge.title}, ${cartridge.status}`}
        className={stateClass}
        tabIndex={tabIndex}
        data-grid-index={gridIndex}
        data-status={cartridge.status}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <span className={`cart-led status-${cartridge.status}`} aria-hidden="true" />
        <button
          type="button"
          className="fav-star"
          aria-label={cartridge.favorite ? 'Remove favorite' : 'Add favorite'}
          aria-pressed={!!cartridge.favorite}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          {cartridge.favorite ? '★' : '☆'}
        </button>
        <div className="cart-art box-art" aria-hidden="true">
          {cartridge.artwork ? (
            <img src={cartridge.artwork} alt="" />
          ) : (
            <span className="cart-art-fallback">{initial}</span>
          )}
        </div>
        <h3 className="cart-title">{cartridge.title}</h3>
        <div className="cart-meta">
          <StatusBadge status={cartridge.status} />
          {cartridge.missing ? <span className="tag-warn">missing</span> : null}
        </div>
      </div>
    </li>
  )
}
