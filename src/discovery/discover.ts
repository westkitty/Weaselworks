import { parseManifestJson } from '../manifest/parse'
import type { ManifestDocument, ValidationResult } from '../types/cartridge'

export interface DiscoveredManifest {
  /** Absolute or display path to weaselworks.json */
  manifestPath: string
  /** Project directory containing the manifest */
  projectPath: string
  result: ValidationResult
  document?: ManifestDocument
}

export interface DiscoveryScanInput {
  /** User-configured root directories (NOT a home crawl). */
  configuredDirs: string[]
  /**
   * Browser-safe file listing callback.
   * For each configured dir, returns entries: either a manifest at the dir root
   * or one level of child project folders that contain weaselworks.json.
   * Implementation is provided by the host (File System Access API, pasted JSON, etc.).
   */
  listManifestCandidates: (
    configuredDir: string,
  ) => Promise<{ manifestPath: string; projectPath: string; jsonText: string }[]>
}

/**
 * Discover manifests only under user-configured directories:
 * - weaselworks.json in the configured dir itself, OR
 * - weaselworks.json in immediate child project folders (one level — not recursive).
 * Malformed manifests are reported, never crash the library.
 */
export async function discoverManifests(
  input: DiscoveryScanInput,
): Promise<DiscoveredManifest[]> {
  const out: DiscoveredManifest[] = []
  const seenPaths = new Set<string>()

  for (const dir of input.configuredDirs) {
    if (!dir || typeof dir !== 'string') continue
    let candidates: { manifestPath: string; projectPath: string; jsonText: string }[] = []
    try {
      candidates = await input.listManifestCandidates(dir)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Discovery failed'
      out.push({
        manifestPath: `${dir}/weaselworks.json`,
        projectPath: dir,
        result: { ok: false, errors: [`Discovery error for ${dir}: ${msg}`], warnings: [] },
      })
      continue
    }

    for (const c of candidates) {
      if (seenPaths.has(c.manifestPath)) continue
      seenPaths.add(c.manifestPath)
      const result = parseManifestJson(c.jsonText)
      out.push({
        manifestPath: c.manifestPath,
        projectPath: c.projectPath,
        result,
        document: result.document,
      })
    }
  }

  return out
}

/**
 * Pure helper: given a flat listing of relative paths under a configured dir,
 * pick only root weaselworks.json and one-level child project/weaselworks.json.
 */
export function selectManifestPaths(
  configuredDir: string,
  relativePaths: string[],
): { manifestPath: string; projectPath: string; relative: string }[] {
  const normDir = configuredDir.replace(/\/+$/, '')
  const results: { manifestPath: string; projectPath: string; relative: string }[] = []

  for (const rel of relativePaths) {
    const n = rel.replace(/\\/g, '/').replace(/^\.\//, '')
    if (n === 'weaselworks.json') {
      results.push({
        relative: n,
        manifestPath: `${normDir}/weaselworks.json`,
        projectPath: normDir,
      })
      continue
    }
    // one level: child/weaselworks.json — not deeper
    const parts = n.split('/')
    if (
      parts.length === 2 &&
      parts[1] === 'weaselworks.json' &&
      parts[0] &&
      !parts[0].includes('..')
    ) {
      const child = parts[0]
      results.push({
        relative: n,
        manifestPath: `${normDir}/${child}/weaselworks.json`,
        projectPath: `${normDir}/${child}`,
      })
    }
  }

  return results
}
