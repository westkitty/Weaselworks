import type { GitMetadata } from '../types/cartridge'
import { DEMO_GIT } from './fixtures'

export interface GitInspectProvider {
  inspect(localPath: string | undefined, cartridgeId: string): Promise<GitMetadata>
}

/** Demo provider — returns fixture metadata by cartridge id. */
export const demoGitProvider: GitInspectProvider = {
  async inspect(_path, cartridgeId) {
    return DEMO_GIT[cartridgeId] ?? {
      available: true,
      branch: 'main',
      headShort: 'demo000',
      dirty: false,
      lastCommitDate: '2026-09-01T12:00:00.000Z',
    }
  },
}

/**
 * Browser provider — uses optional pasted snapshots from persistence,
 * otherwise reports Git unavailable (SPA cannot spawn git).
 */
export function createBrowserGitProvider(
  snapshots: Record<string, GitMetadata>,
): GitInspectProvider {
  return {
    async inspect(localPath, _cartridgeId) {
      if (localPath && snapshots[localPath]) {
        return { ...snapshots[localPath], available: true }
      }
      return {
        available: false,
        reason:
          'Git unavailable in browser. Run: node scripts/git-inspect.mjs <path> and paste the JSON in Settings.',
      }
    },
  }
}

export function formatGitInspectCommand(localPath: string): string {
  return `node scripts/git-inspect.mjs ${JSON.stringify(localPath)}`
}
