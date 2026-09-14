import type { Cartridge, CartridgeStatus } from '../types/cartridge'

export interface LibraryFilters {
  query: string
  statuses: CartridgeStatus[]
  tags: string[]
  favoritesOnly: boolean
  recentlyOnly: boolean
}

export function emptyFilters(): LibraryFilters {
  return {
    query: '',
    statuses: [],
    tags: [],
    favoritesOnly: false,
    recentlyOnly: false,
  }
}

export function searchCartridges(items: Cartridge[], query: string): Cartridge[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((c) => {
    const hay = [
      c.title,
      c.description,
      c.id,
      c.projectType,
      c.status,
      ...(c.tags ?? []),
      ...(c.platforms ?? []),
      c.localPath ?? '',
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function filterCartridges(items: Cartridge[], filters: LibraryFilters): Cartridge[] {
  let out = items
  out = searchCartridges(out, filters.query)
  if (filters.statuses.length > 0) {
    const set = new Set(filters.statuses)
    out = out.filter((c) => set.has(c.status))
  }
  if (filters.tags.length > 0) {
    out = out.filter((c) => filters.tags.every((t) => c.tags.includes(t)))
  }
  if (filters.favoritesOnly) {
    out = out.filter((c) => c.favorite)
  }
  if (filters.recentlyOnly) {
    out = out.filter((c) => !!c.lastOpenedAt)
    out = [...out].sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))
  }
  return out
}

export function collectTags(items: Cartridge[]): string[] {
  const set = new Set<string>()
  for (const c of items) for (const t of c.tags) set.add(t)
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function sortByActivity(items: Cartridge[]): Cartridge[] {
  return [...items].sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''))
}
