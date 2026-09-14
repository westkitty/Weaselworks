/** Browser/host helpers for discovery — never crawls $HOME. */

export type ManifestCandidate = {
  manifestPath: string
  projectPath: string
  jsonText: string
}

/** Parse JSON produced by `node scripts/discover-manifests.mjs <dir>`. */
export function parseDiscoveryScanJson(text: string): ManifestCandidate[] {
  const data = JSON.parse(text) as unknown
  if (!Array.isArray(data)) throw new Error('Discovery JSON must be an array')
  const out: ManifestCandidate[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (
      typeof o.manifestPath === 'string' &&
      typeof o.projectPath === 'string' &&
      typeof o.jsonText === 'string'
    ) {
      if (o.manifestPath.includes('..') || o.projectPath.includes('..')) continue
      out.push({
        manifestPath: o.manifestPath,
        projectPath: o.projectPath,
        jsonText: o.jsonText,
      })
    }
  }
  return out
}

async function readFileText(file: File): Promise<string> {
  return await file.text()
}

/**
 * File System Access API: given a directory handle for a configured folder,
 * collect weaselworks.json at root and one child level.
 */
export async function listCandidatesFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  configuredDirLabel: string,
): Promise<ManifestCandidate[]> {
  const out: ManifestCandidate[] = []
  try {
    const rootFile = await dirHandle.getFileHandle('weaselworks.json')
    const file = await rootFile.getFile()
    out.push({
      manifestPath: `${configuredDirLabel}/weaselworks.json`,
      projectPath: configuredDirLabel,
      jsonText: await readFileText(file),
    })
  } catch {
    /* no root manifest */
  }
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== 'directory' || name.startsWith('.')) continue
    try {
      const child = handle as FileSystemDirectoryHandle
      const mh = await child.getFileHandle('weaselworks.json')
      const file = await mh.getFile()
      out.push({
        manifestPath: `${configuredDirLabel}/${name}/weaselworks.json`,
        projectPath: `${configuredDirLabel}/${name}`,
        jsonText: await readFileText(file),
      })
    } catch {
      /* skip */
    }
  }
  return out
}
