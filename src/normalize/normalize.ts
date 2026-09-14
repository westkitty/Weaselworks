import type {
  Cartridge,
  CartridgeStatus,
  LaunchSpec,
  ManualRegistration,
  ManifestDocument,
  ProjectType,
  SafeScriptId,
} from '../types/cartridge'
import { isSafeScriptId } from '../manifest/schema'
import type { DiscoveredManifest } from '../discovery/discover'

function asStatus(v: string | undefined): CartridgeStatus {
  const allowed: CartridgeStatus[] = [
    'PLAYABLE',
    'TOOL',
    'EXPERIMENT',
    'DEVELOPMENT',
    'DORMANT',
    'BROKEN',
    'ARCHIVED',
  ]
  if (v && (allowed as string[]).includes(v)) return v as CartridgeStatus
  return 'DEVELOPMENT'
}

function asProjectType(v: string | undefined): ProjectType {
  const allowed: ProjectType[] = ['game', 'app', 'experiment', 'utility']
  if (v && (allowed as string[]).includes(v)) return v as ProjectType
  return 'app'
}

function normalizeLaunch(doc: ManifestDocument): LaunchSpec {
  const method = (doc.launch?.method ?? 'directory') as LaunchSpec['method']
  const spec: LaunchSpec = { method }
  if ((method === 'localhost' || method === 'url') && doc.launch?.url) spec.url = doc.launch.url
  if (method === 'html') {
    spec.htmlPath = doc.launch?.htmlPath ?? doc.launch?.path
  }
  if (method === 'script' && doc.launch?.scriptId && isSafeScriptId(doc.launch.scriptId)) {
    spec.scriptId = doc.launch.scriptId as SafeScriptId
  }
  return spec
}

export function normalizeFromManifest(
  doc: ManifestDocument,
  opts: {
    source: Cartridge['source']
    localPath?: string
    missing?: boolean
    manifestIssues?: string[]
  },
): Cartridge {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description ?? '',
    artwork: doc.artwork,
    projectType: asProjectType(doc.projectType),
    status: asStatus(doc.status),
    localPath: opts.localPath,
    launch: normalizeLaunch(doc),
    platforms: doc.platforms ?? ['web'],
    tags: doc.tags ?? [],
    lastActivity: doc.lastActivity,
    repo: doc.repo,
    source: opts.source,
    missing: opts.missing,
    manifestIssues: opts.manifestIssues,
  }
}

export function normalizeManual(reg: ManualRegistration): Cartridge {
  return {
    id: reg.id,
    title: reg.title,
    description: reg.description,
    artwork: reg.artwork,
    projectType: reg.projectType,
    status: reg.status,
    localPath: reg.localPath,
    launch: reg.launch,
    platforms: reg.platforms,
    tags: reg.tags,
    lastActivity: reg.lastActivity ?? reg.registeredAt,
    repo: reg.repo,
    source: 'manual',
    missing: false,
  }
}

export function normalizeDiscovery(d: DiscoveredManifest): Cartridge | null {
  if (d.result.ok && d.document) {
    return normalizeFromManifest(d.document, {
      source: 'discovery',
      localPath: d.projectPath,
      missing: false,
      manifestIssues: d.result.warnings.length ? [...d.result.warnings] : undefined,
    })
  }
  // Broken manifest still appears in library as BROKEN with issues
  const fallbackId = `broken:${d.projectPath}`
  return {
    id: fallbackId,
    title: `Broken manifest @ ${d.projectPath.split('/').pop() ?? d.projectPath}`,
    description: 'This project has a malformed or unsupported weaselworks.json.',
    projectType: 'app',
    status: 'BROKEN',
    localPath: d.projectPath,
    launch: { method: 'directory' },
    platforms: [],
    tags: ['broken-manifest'],
    source: 'discovery',
    missing: false,
    manifestIssues: d.result.errors,
  }
}

/** Merge demo + manual + discovery; apply favorites/recent; resolve duplicate IDs. */
export function mergeLibrary(opts: {
  demo: Cartridge[]
  manual: Cartridge[]
  discovered: Cartridge[]
  fleet?: Cartridge[]
  favorites: string[]
  recentlyOpened: { id: string; openedAt: string }[]
  demoMode: boolean
}): Cartridge[] {
  const recentMap = new Map(opts.recentlyOpened.map((r) => [r.id, r.openedAt]))
  const favSet = new Set(opts.favorites)

  let items: Cartridge[]
  if (opts.demoMode) {
    items = [...opts.demo]
  } else {
    items = [...(opts.fleet ?? []), ...opts.manual, ...opts.discovered]
  }

  // Explicit duplicate handling
  const seen = new Map<string, number>()
  items = items.map((c) => {
    const n = (seen.get(c.id) ?? 0) + 1
    seen.set(c.id, n)
    const base = n === 1 ? c : { ...c, id: `${c.id}#${n}`, manifestIssues: [...(c.manifestIssues ?? []), `Duplicate id resolved as ${c.id}#${n}`] }
    return {
      ...base,
      favorite: favSet.has(base.id) || favSet.has(c.id),
      lastOpenedAt: recentMap.get(base.id) ?? recentMap.get(c.id),
    }
  })

  return items
}
