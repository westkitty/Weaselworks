/** Canonical app model for a cartridge (demo + real normalize into this). */

export const CARTRIDGE_STATUSES = [
  'PLAYABLE',
  'TOOL',
  'EXPERIMENT',
  'DEVELOPMENT',
  'DORMANT',
  'BROKEN',
  'ARCHIVED',
] as const

export type CartridgeStatus = (typeof CARTRIDGE_STATUSES)[number]

export const PROJECT_TYPES = ['game', 'app', 'experiment', 'utility'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export const LAUNCH_METHODS = ['localhost', 'html', 'directory', 'script', 'url'] as const
export type LaunchMethod = (typeof LAUNCH_METHODS)[number]

/** Whitelisted script ids only — never arbitrary shell. */
export const SAFE_SCRIPT_IDS = ['npm-dev', 'npm-start', 'npm-preview'] as const
export type SafeScriptId = (typeof SAFE_SCRIPT_IDS)[number]

export interface LaunchSpec {
  method: LaunchMethod
  /** http(s) localhost URL when method === 'localhost'; https URL when method === 'url' */
  url?: string
  /** Relative HTML path when method === 'html' */
  htmlPath?: string
  /** Whitelisted script id when method === 'script' */
  scriptId?: SafeScriptId
}

export interface RepoInfo {
  url?: string
  remote?: string
}

export interface GitMetadata {
  available: boolean
  branch?: string
  headShort?: string
  dirty?: boolean
  lastCommitDate?: string
  reason?: string
}

export interface Cartridge {
  id: string
  title: string
  description: string
  artwork?: string
  projectType: ProjectType
  status: CartridgeStatus
  localPath?: string
  launch: LaunchSpec
  platforms: string[]
  tags: string[]
  lastActivity?: string
  repo?: RepoInfo
  /** Source of this cartridge entry */
  source: 'demo' | 'manual' | 'discovery'
  /** True when local path is known missing */
  missing?: boolean
  /** Manifest parse/validation issues (non-fatal) */
  manifestIssues?: string[]
  git?: GitMetadata
  favorite?: boolean
  lastOpenedAt?: string
}

export interface ManifestDocument {
  schemaVersion: number
  id: string
  title: string
  description?: string
  artwork?: string
  projectType?: string
  status?: string
  launch?: {
    method?: string
    url?: string
    htmlPath?: string
    path?: string
    scriptId?: string
  }
  platforms?: string[]
  tags?: string[]
  lastActivity?: string
  repo?: RepoInfo
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  document?: ManifestDocument
}

export interface ManualRegistration {
  id: string
  title: string
  description: string
  artwork?: string
  projectType: ProjectType
  status: CartridgeStatus
  localPath?: string
  launch: LaunchSpec
  platforms: string[]
  tags: string[]
  lastActivity?: string
  repo?: RepoInfo
  registeredAt: string
}

export type ViewMode = 'grid' | 'list'

export interface UiPrefs {
  viewMode: ViewMode
  demoMode: boolean
  selectedId: string | null
}

export interface CollectionDef {
  id: string
  name: string
  /** Tag that membership uses (cartridges with this tag) */
  tag: string
}

export interface PersistenceState {
  schemaVersion: number
  discoveryDirs: string[]
  manualRegistrations: ManualRegistration[]
  favorites: string[]
  recentlyOpened: { id: string; openedAt: string }[]
  uiPrefs: UiPrefs
  /** Optional pasted git inspect JSON keyed by path */
  gitSnapshots: Record<string, GitMetadata>
  /** Open/play counts keyed by cartridge id */
  playCounts: Record<string, number>
  collections: CollectionDef[]
}
