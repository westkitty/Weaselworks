import type { ManifestDocument, ValidationResult } from '../types/cartridge'
import {
  isCartridgeStatus,
  isLaunchMethod,
  isProjectType,
  isSafeScriptId,
  isSupportedSchemaVersion,
  MANIFEST_SCHEMA_VERSION,
} from './schema'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
  } catch {
    return false
  }
}

/**
 * Validate a parsed weaselworks.json document.
 * Never throws — returns structured errors. Malformed input never crashes the library.
 */
export function validateManifest(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (raw === null || raw === undefined) {
    return { ok: false, errors: ['Manifest is empty'], warnings }
  }

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Manifest must be a JSON object'], warnings }
  }

  if (!('schemaVersion' in raw)) {
    errors.push('Missing schemaVersion')
  } else if (typeof raw.schemaVersion !== 'number') {
    errors.push('schemaVersion must be a number')
  } else if (!isSupportedSchemaVersion(raw.schemaVersion)) {
    errors.push(
      `Unsupported schemaVersion ${String(raw.schemaVersion)} (supported: ${MANIFEST_SCHEMA_VERSION})`,
    )
  }

  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    errors.push('id is required and must be a non-empty string (stable id ≠ title)')
  } else if (/\s/.test(raw.id)) {
    warnings.push('id contains whitespace; prefer kebab-case or similar')
  }

  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    errors.push('title is required and must be a non-empty string')
  }

  if (raw.description !== undefined && typeof raw.description !== 'string') {
    errors.push('description must be a string when present')
  }

  if (raw.artwork !== undefined && typeof raw.artwork !== 'string') {
    errors.push('artwork must be a string when present')
  }

  if (raw.projectType !== undefined && !isProjectType(raw.projectType)) {
    errors.push(`projectType must be one of: game, app, experiment, utility`)
  }

  if (raw.status !== undefined && !isCartridgeStatus(raw.status)) {
    errors.push(
      'status must be one of: PLAYABLE | TOOL | EXPERIMENT | DEVELOPMENT | DORMANT | BROKEN | ARCHIVED',
    )
  }

  if (raw.platforms !== undefined) {
    if (!Array.isArray(raw.platforms) || !raw.platforms.every((p) => typeof p === 'string')) {
      errors.push('platforms must be an array of strings')
    }
  }

  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags) || !raw.tags.every((t) => typeof t === 'string')) {
      errors.push('tags must be an array of strings')
    }
  }

  if (raw.lastActivity !== undefined && typeof raw.lastActivity !== 'string') {
    errors.push('lastActivity must be an ISO date string when present')
  }

  if (raw.repo !== undefined) {
    if (!isPlainObject(raw.repo)) {
      errors.push('repo must be an object when present')
    } else {
      if (raw.repo.url !== undefined && typeof raw.repo.url !== 'string') {
        errors.push('repo.url must be a string')
      }
      if (raw.repo.remote !== undefined && typeof raw.repo.remote !== 'string') {
        errors.push('repo.remote must be a string')
      }
    }
  }

  if (raw.launch !== undefined) {
    if (!isPlainObject(raw.launch)) {
      errors.push('launch must be an object when present')
    } else {
      const method = raw.launch.method
      if (method !== undefined && !isLaunchMethod(method)) {
        errors.push('launch.method must be one of: localhost | html | directory | script | url')
      }

      // Reject dangerous keys that look like arbitrary shell
      for (const forbidden of ['command', 'shell', 'exec', 'cmd', 'args', 'env']) {
        if (forbidden in raw.launch) {
          errors.push(`launch.${forbidden} is not allowed (arbitrary shell blocked)`)
        }
      }

      if (method === 'localhost') {
        const url = raw.launch.url
        if (typeof url !== 'string' || !isLocalhostUrl(url)) {
          errors.push('launch.url must be an http(s) localhost / 127.0.0.1 URL')
        }
      }

      if (method === 'html') {
        const htmlPath = (raw.launch.htmlPath ?? raw.launch.path) as unknown
        if (typeof htmlPath !== 'string' || htmlPath.trim() === '') {
          errors.push('launch.htmlPath (or path) is required for html launch')
        } else if (htmlPath.includes('..') || htmlPath.startsWith('/')) {
          // relative only — avoid path traversal hints in manifest
          warnings.push('htmlPath should be a relative path within the project')
        }
      }

      if (method === 'url') {
        const url = raw.launch.url
        if (typeof url !== 'string' || !isHttpsUrl(url)) {
          errors.push('launch.url must be an https URL for url launch')
        }
      }

      if (method === 'script') {
        if (!isSafeScriptId(raw.launch.scriptId)) {
          errors.push(
            'launch.scriptId must be a whitelisted id: npm-dev | npm-start | npm-preview',
          )
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings }
  }

  const launchRaw = isPlainObject(raw.launch) ? raw.launch : undefined
  const document: ManifestDocument = {
    schemaVersion: raw.schemaVersion as number,
    id: (raw.id as string).trim(),
    title: (raw.title as string).trim(),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    artwork: typeof raw.artwork === 'string' ? raw.artwork : undefined,
    projectType: typeof raw.projectType === 'string' ? raw.projectType : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    launch: launchRaw
      ? {
          method: typeof launchRaw.method === 'string' ? launchRaw.method : undefined,
          url: typeof launchRaw.url === 'string' ? launchRaw.url : undefined,
          htmlPath:
            typeof launchRaw.htmlPath === 'string'
              ? launchRaw.htmlPath
              : typeof launchRaw.path === 'string'
                ? launchRaw.path
                : undefined,
          path: typeof launchRaw.path === 'string' ? launchRaw.path : undefined,
          scriptId: typeof launchRaw.scriptId === 'string' ? launchRaw.scriptId : undefined,
        }
      : undefined,
    platforms: Array.isArray(raw.platforms) ? (raw.platforms as string[]) : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
    lastActivity: typeof raw.lastActivity === 'string' ? raw.lastActivity : undefined,
    repo: isPlainObject(raw.repo)
      ? {
          url: typeof raw.repo.url === 'string' ? raw.repo.url : undefined,
          remote: typeof raw.repo.remote === 'string' ? raw.repo.remote : undefined,
        }
      : undefined,
  }

  return { ok: true, errors: [], warnings, document }
}
