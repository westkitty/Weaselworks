import type { Cartridge } from '../types/cartridge'

interface Props {
  items: Cartridge[]
  onSelect: (id: string) => void
}

export function RecentRail({ items, onSelect }: Props) {
  if (items.length === 0) return null
  return (
    <section className="recent-rail" aria-label="Recently opened">
      <h2 className="rail-title">Recent</h2>
      <ul className="recent-track">
        {items.map((c) => (
          <li key={c.id}>
            <button type="button" className="recent-chip" onClick={() => onSelect(c.id)}>
              <span className={`cart-led status-${c.status}`} aria-hidden="true" />
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
