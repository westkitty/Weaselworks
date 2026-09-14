import { useState } from 'react'
import type { CollectionDef } from '../types/cartridge'

interface Props {
  collections: CollectionDef[]
  activeTag: string | null
  onSelectTag: (tag: string | null) => void
  onUpsert: (col: CollectionDef) => void
  onRemove: (id: string) => void
}

export function CollectionsPanel({
  collections,
  activeTag,
  onSelectTag,
  onUpsert,
  onRemove,
}: Props) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')

  return (
    <section className="collections-panel" aria-label="Collections">
      <h2 className="rail-title">Collections</h2>
      <div className="chip-row">
        <button
          type="button"
          className="chip"
          aria-pressed={activeTag === null}
          onClick={() => onSelectTag(null)}
        >
          All
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            aria-pressed={activeTag === c.tag}
            onClick={() => onSelectTag(c.tag)}
            title={`Tag #${c.tag}`}
          >
            {c.name}
            <span
              role="button"
              tabIndex={0}
              className="chip-x"
              aria-label={`Remove ${c.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(c.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove(c.id)
                }
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>
      <form
        className="collection-add"
        onSubmit={(e) => {
          e.preventDefault()
          const n = name.trim()
          const t = tag.trim().toLowerCase()
          if (!n || !t) return
          onUpsert({ id: `col-${t}`, name: n, tag: t })
          setName('')
          setTag('')
        }}
      >
        <input
          aria-label="Collection name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          aria-label="Collection tag"
          placeholder="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <button type="submit" className="btn">
          Add
        </button>
      </form>
    </section>
  )
}
