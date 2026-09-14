#!/usr/bin/env node
/**
 * Optional read-only Git inspect helper for Weaselworks.
 * Usage: node scripts/git-inspect.mjs <absolute-or-relative-path>
 * Prints a single JSON object to stdout. Does NOT execute anything from manifests.
 * Reads ONE path from argv only.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const target = process.argv[2]
if (!target) {
  console.error('Usage: node scripts/git-inspect.mjs <path>')
  process.exit(2)
}

const cwd = resolve(target)
if (!existsSync(cwd)) {
  console.log(JSON.stringify({ available: false, reason: 'Path does not exist' }))
  process.exit(0)
}

function git(args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

try {
  git(['rev-parse', '--is-inside-work-tree'])
} catch {
  console.log(JSON.stringify({ available: false, reason: 'Not a git repository' }))
  process.exit(0)
}

try {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
  const headShort = git(['rev-parse', '--short', 'HEAD'])
  const status = git(['status', '--porcelain'])
  const dirty = status.length > 0
  let lastCommitDate
  try {
    lastCommitDate = git(['log', '-1', '--format=%cI'])
  } catch {
    lastCommitDate = undefined
  }
  console.log(
    JSON.stringify({
      available: true,
      branch,
      headShort,
      dirty,
      lastCommitDate: lastCommitDate || undefined,
    }),
  )
} catch (e) {
  const msg = e instanceof Error ? e.message : 'git inspect failed'
  console.log(JSON.stringify({ available: false, reason: msg }))
}
