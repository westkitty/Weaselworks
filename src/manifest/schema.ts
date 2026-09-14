import {
  CARTRIDGE_STATUSES,
  LAUNCH_METHODS,
  PROJECT_TYPES,
  SAFE_SCRIPT_IDS,
  type ManifestDocument,
} from '../types/cartridge'

/** Current weaselworks.json schema version. */
export const MANIFEST_SCHEMA_VERSION = 1

export const SUPPORTED_SCHEMA_VERSIONS = [1] as const

export function isSupportedSchemaVersion(v: unknown): v is number {
  return typeof v === 'number' && (SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(v)
}

export function isCartridgeStatus(v: unknown): boolean {
  return typeof v === 'string' && (CARTRIDGE_STATUSES as readonly string[]).includes(v)
}

export function isProjectType(v: unknown): boolean {
  return typeof v === 'string' && (PROJECT_TYPES as readonly string[]).includes(v)
}

export function isLaunchMethod(v: unknown): boolean {
  return typeof v === 'string' && (LAUNCH_METHODS as readonly string[]).includes(v)
}

export function isSafeScriptId(v: unknown): boolean {
  return typeof v === 'string' && (SAFE_SCRIPT_IDS as readonly string[]).includes(v)
}

export type { ManifestDocument }
