import { CARTRIDGE_STATUSES, type CartridgeStatus } from '../types/cartridge'
import type { LibraryFilters } from '../lib/filter'

interface Props {
  filters: LibraryFilters
  allTags: string[]
  onChange: (next: LibraryFilters) => void
}

export function FilterBar({ filters, allTags, onChange }: Props) {
  function toggleStatus(s: CartridgeStatus) {
    const has = filters.statuses.includes(s)
    onChange({
      ...filters,
      statuses: has ? filters.statuses.filter((x) => x !== s) : [...filters.statuses, s],
    })
  }

  function toggleTag(t: string) {
    const has = filters.tags.includes(t)
    onChange({
      ...filters,
      tags: has ? filters.tags.filter((x) => x !== t) : [...filters.tags, t],
    })
  }

  return (
    <div className="toolbar" aria-label="Filters">
      <label className="sr-only" htmlFor="ww-search">
        Search cartridges
      </label>
      <input
        id="ww-search"
        type="search"
        placeholder="Search title, tags, path…"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />
      <button
        type="button"
        className="btn"
        aria-pressed={filters.favoritesOnly}
        onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
      >
        ★ Favorites
      </button>
      <button
        type="button"
        className="btn"
        aria-pressed={filters.recentlyOnly}
        onClick={() => onChange({ ...filters, recentlyOnly: !filters.recentlyOnly })}
      >
        Recent
      </button>
      <div className="chip-row" role="group" aria-label="Status filters">
        {CARTRIDGE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            aria-pressed={filters.statuses.includes(s)}
            onClick={() => toggleStatus(s)}
          >
            <span className={`status-light status-${s}`} aria-hidden="true" /> {s}
          </button>
        ))}
      </div>
      {allTags.length > 0 ? (
        <div className="chip-row" role="group" aria-label="Tag filters">
          {allTags.slice(0, 24).map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={filters.tags.includes(t)}
              onClick={() => toggleTag(t)}
            >
              #{t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
