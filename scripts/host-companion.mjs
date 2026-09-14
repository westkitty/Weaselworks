#!/usr/bin/env node
/** Minimal host companion stub — lists discover command + git-inspect; never runs shell from manifests. */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmd = process.argv[2] ?? 'help'
const arg = process.argv[3]

if (cmd === 'discover' && arg) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'discover-manifests.mjs'), arg], {
    encoding: 'utf8',
  })
  process.stdout.write(r.stdout)
  process.stderr.write(r.stderr)
  process.exit(r.status ?? 1)
}
if (cmd === 'git-inspect' && arg) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'git-inspect.mjs'), arg], {
    encoding: 'utf8',
  })
  process.stdout.write(r.stdout)
  process.stderr.write(r.stderr)
  process.exit(r.status ?? 1)
}
if (cmd === 'git-inspect-batch') {
  const paths = process.argv.slice(3)
  const out = {}
  for (const p of paths) {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'git-inspect.mjs'), p], {
      encoding: 'utf8',
    })
    try {
      out[p] = JSON.parse(r.stdout || '{}')
    } catch {
      out[p] = { available: false, reason: r.stderr || 'parse failed' }
    }
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n')
  process.exit(0)
}
console.log(`Usage:
  node scripts/host-companion.mjs discover <dir>
  node scripts/host-companion.mjs git-inspect <path>
  node scripts/host-companion.mjs git-inspect-batch <path> [path...]
`)
