import type { ValidationResult } from '../types/cartridge'
import { validateManifest } from './validate'

/**
 * Parse JSON text into a validated manifest.
 * Never throws for bad JSON / malformed content.
 */
export function parseManifestJson(text: string): ValidationResult {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON'
    return { ok: false, errors: [`Malformed JSON: ${msg}`], warnings: [] }
  }
  return validateManifest(raw)
}

/**
 * Detect duplicate IDs across a list of candidate ids.
 * Returns map of id -> count for ids appearing more than once.
 */
export function findDuplicateIds(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const dupes = new Map<string, number>()
  for (const [id, n] of counts) {
    if (n > 1) dupes.set(id, n)
  }
  return dupes
}

/**
 * Resolve duplicate IDs by suffixing #2, #3, etc. on later occurrences.
 * First occurrence keeps the original id. Stable and explicit.
 */
export function resolveDuplicateIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const n = (seen.get(item.id) ?? 0) + 1
    seen.set(item.id, n)
    if (n === 1) return item
    return { ...item, id: `${item.id}#${n}` }
  })
}
