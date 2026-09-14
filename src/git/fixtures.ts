import type { GitMetadata } from '../types/cartridge'

/** Fixture Git metadata for demo cartridges. */
export const DEMO_GIT: Record<string, GitMetadata> = {
  'demo-nebula-raiders': {
    available: true,
    branch: 'main',
    headShort: 'a1b2c3d',
    dirty: false,
    lastCommitDate: '2026-09-10T18:22:00.000Z',
  },
  'demo-pixel-ledger': {
    available: true,
    branch: 'feature/charts',
    headShort: 'e4f5a6b',
    dirty: true,
    lastCommitDate: '2026-09-12T09:01:00.000Z',
  },
  'demo-stinkweasel-simulator': {
    available: true,
    branch: 'main',
    headShort: 'dex7er1',
    dirty: false,
    lastCommitDate: '2026-09-13T14:00:00.000Z',
  },
  'demo-broken-cart': {
    available: false,
    reason: 'Not a git repository',
  },
  'demo-missing-path': {
    available: false,
    reason: 'Path missing',
  },
  'demo-garden-bot': {
    available: true,
    branch: 'develop',
    headShort: '9c8b7a6',
    dirty: true,
    lastCommitDate: '2026-08-20T11:11:00.000Z',
  },
}
