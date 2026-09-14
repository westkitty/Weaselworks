import type { Cartridge, LaunchSpec, SafeScriptId } from '../types/cartridge'

export type LaunchActionKind = 'open-url' | 'copy-instruction' | 'info'

export interface LaunchAction {
  kind: LaunchActionKind
  label: string
  /** For open-url */
  url?: string
  /** Human-readable instruction to copy */
  instruction: string
  safe: true
}

const SCRIPT_INSTRUCTIONS: Record<SafeScriptId, (path?: string) => string> = {
  'npm-dev': (path) =>
    path
      ? `cd ${JSON.stringify(path)} && npm install && npm run dev`
      : 'cd <project> && npm install && npm run dev',
  'npm-start': (path) =>
    path ? `cd ${JSON.stringify(path)} && npm start` : 'cd <project> && npm start',
  'npm-preview': (path) =>
    path
      ? `cd ${JSON.stringify(path)} && npm run preview`
      : 'cd <project> && npm run preview',
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
 * Strict launch-provider abstraction.
 * Safe types ONLY — never eval, never child_process, never arbitrary shell from manifests.
 */
export function resolveLaunchActions(cart: Cartridge): LaunchAction[] {
  const actions: LaunchAction[] = []
  const launch: LaunchSpec = cart.launch

  if (cart.missing) {
    actions.push({
      kind: 'info',
      label: 'Project missing',
      instruction: `Local path not found: ${cart.localPath ?? '(unknown)'}`,
      safe: true,
    })
    return actions
  }

  switch (launch.method) {
    case 'localhost': {
      if (launch.url && isLocalhostUrl(launch.url)) {
        actions.push({
          kind: 'open-url',
          label: 'Open localhost',
          url: launch.url,
          instruction: `Open in browser: ${launch.url}`,
          safe: true,
        })
      } else {
        actions.push({
          kind: 'info',
          label: 'Invalid localhost URL',
          instruction: 'Manifest localhost URL is missing or not localhost/127.0.0.1.',
          safe: true,
        })
      }
      break
    }
    case 'html': {
      const html = launch.htmlPath ?? 'index.html'
      const fileHint = cart.localPath
        ? `file://${cart.localPath.replace(/\\/g, '/')}/${html}`
        : `Open ${html} from the project folder`
      actions.push({
        kind: 'copy-instruction',
        label: 'Open local HTML',
        instruction: `Open local HTML (file URL / Finder):\n${fileHint}`,
        safe: true,
      })
      break
    }
    case 'directory': {
      const path = cart.localPath ?? '<project path>'
      actions.push({
        kind: 'copy-instruction',
        label: 'Open project folder',
        instruction: `open ${JSON.stringify(path)}\n# or: cd ${JSON.stringify(path)}`,
        safe: true,
      })
      break
    }
    case 'script': {
      const id = launch.scriptId
      if (id && id in SCRIPT_INSTRUCTIONS) {
        actions.push({
          kind: 'copy-instruction',
          label: `Run ${id}`,
          instruction: SCRIPT_INSTRUCTIONS[id](cart.localPath),
          safe: true,
        })
      } else {
        actions.push({
          kind: 'info',
          label: 'Script not allowed',
          instruction: 'Only whitelisted script ids are permitted (npm-dev, npm-start, npm-preview).',
          safe: true,
        })
      }
      break
    }
    default:
      actions.push({
        kind: 'info',
        label: 'Unknown launch method',
        instruction: 'No safe launch method configured.',
        safe: true,
      })
  }

  return actions
}

export function executeSafeLaunch(action: LaunchAction): { opened: boolean; message: string } {
  if (action.kind === 'open-url' && action.url && isLocalhostUrl(action.url)) {
    window.open(action.url, '_blank', 'noopener,noreferrer')
    return { opened: true, message: `Opened ${action.url}` }
  }
  return { opened: false, message: action.instruction }
}
