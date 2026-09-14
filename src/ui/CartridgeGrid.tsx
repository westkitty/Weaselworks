import { useCallback, useEffect, useRef } from 'react'
import type { Cartridge } from '../types/cartridge'
import { CartridgeCard } from './CartridgeCard'

interface Props {
  items: Cartridge[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
}

function columnCount(container: HTMLElement | null): number {
  if (!container) return 1
  const style = getComputedStyle(container)
  const cols = style.gridTemplateColumns.split(' ').filter(Boolean).length
  return Math.max(1, cols)
}

export function CartridgeGrid({ items, selectedId, onSelect, onToggleFavorite }: Props) {
  const listRef = useRef<HTMLUListElement>(null)
  const selectedIndex = Math.max(
    0,
    items.findIndex((c) => c.id === selectedId),
  )

  const focusIndex = useCallback(
    (index: number) => {
      const el = listRef.current?.querySelector<HTMLElement>(
        `[data-grid-index="${index}"]`,
      )
      el?.focus()
      const item = items[index]
      if (item) onSelect(item.id)
    },
    [items, onSelect],
  )

  useEffect(() => {
    const node = listRef.current
    if (!node) return

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target?.hasAttribute('data-grid-index')) return
      const cols = columnCount(node)
      let next = selectedIndex
      const key = e.key.toLowerCase()
      if (key === 'arrowright' || key === 'd') next = Math.min(items.length - 1, selectedIndex + 1)
      else if (key === 'arrowleft' || key === 'a') next = Math.max(0, selectedIndex - 1)
      else if (key === 'arrowdown' || key === 's') next = Math.min(items.length - 1, selectedIndex + cols)
      else if (key === 'arrowup' || key === 'w') next = Math.max(0, selectedIndex - cols)
      else if (key === 'home') next = 0
      else if (key === 'end') next = items.length - 1
      else return
      e.preventDefault()
      focusIndex(next)
    }

    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [focusIndex, items.length, selectedIndex])

  return (
    <ul
      ref={listRef}
      className="cart-grid"
      role="listbox"
      aria-label="Cartridge library"
      aria-activedescendant={selectedId ?? undefined}
    >
      {items.map((c, i) => (
        <CartridgeCard
          key={c.id}
          cartridge={c}
          selected={c.id === selectedId}
          onSelect={() => onSelect(c.id)}
          onToggleFavorite={() => onToggleFavorite(c.id)}
          tabIndex={c.id === selectedId || (selectedId === null && i === 0) ? 0 : -1}
          gridIndex={i}
        />
      ))}
    </ul>
  )
}
