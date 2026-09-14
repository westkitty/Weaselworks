#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir || dir.includes('..')) {
  console.error('Usage: node scripts/discover-manifests.mjs <configured-dir>')
  process.exit(1)
}
const root = path.resolve(dir)
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('Not a directory:', root)
  process.exit(1)
}

function readCandidate(manifestPath, projectPath) {
  const jsonText = fs.readFileSync(manifestPath, 'utf8')
  return { manifestPath, projectPath, jsonText }
}

const out = []
const rootManifest = path.join(root, 'weaselworks.json')
if (fs.existsSync(rootManifest) && fs.statSync(rootManifest).isFile()) {
  out.push(readCandidate(rootManifest, root))
}
for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
  if (!ent.isDirectory() || ent.name.startsWith('.')) continue
  const projectPath = path.join(root, ent.name)
  const manifestPath = path.join(projectPath, 'weaselworks.json')
  if (fs.existsSync(manifestPath) && fs.statSync(manifestPath).isFile()) {
    out.push(readCandidate(manifestPath, projectPath))
  }
}
process.stdout.write(JSON.stringify(out, null, 2) + '\n')
