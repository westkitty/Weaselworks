# Weaselworks manifest schema

File name: `weaselworks.json`  
Current `schemaVersion`: **1**

Manifests describe a cartridge (local app/game/experiment/utility) for the Weaselworks library. Invalid manifests are reported in the UI and **never crash** the library.

## Example

```json
{
  "schemaVersion": 1,
  "id": "nebula-raiders",
  "title": "Nebula Raiders",
  "description": "Twin-stick asteroid brawler",
  "artwork": "art/cover.png",
  "projectType": "game",
  "status": "PLAYABLE",
  "launch": {
    "method": "localhost",
    "url": "http://localhost:5173"
  },
  "platforms": ["web", "mac"],
  "tags": ["arcade", "action"],
  "lastActivity": "2026-09-10T18:22:00.000Z",
  "repo": {
    "url": "https://github.com/example/nebula-raiders",
    "remote": "origin"
  }
}
```

## Fields

| Field | Required | Notes |
|-------|----------|-------|
| `schemaVersion` | yes | Must be `1` |
| `id` | yes | Stable string id **≠** title. Prefer kebab-case. Duplicate ids across the library are resolved as `id#2`, `id#3`, … |
| `title` | yes | Display name |
| `description` | no | Short blurb |
| `artwork` | no | Relative path, `/public` URL, or other image URL |
| `projectType` | no | `game` \| `app` \| `experiment` \| `utility` (default `app`) |
| `status` | no | `PLAYABLE` \| `TOOL` \| `EXPERIMENT` \| `DEVELOPMENT` \| `DORMANT` \| `BROKEN` \| `ARCHIVED` |
| `launch` | no | See launch methods. Default treated as `directory` |
| `platforms` | no | String array |
| `tags` | no | String array |
| `lastActivity` | no | ISO-8601 timestamp |
| `repo` | no | `{ url?, remote? }` |

## Launch methods (safe only)

| `method` | Allowed fields | Behavior in the SPA |
|----------|----------------|---------------------|
| `localhost` | `url` must be `http(s)://localhost`, `127.0.0.1`, or `::1` | `window.open` + copyable instruction |
| `html` | `htmlPath` or `path` (relative HTML) | Copyable `file://` / open instruction |
| `directory` | (none) | Copyable `open "<path>"` / `cd` instruction |
| `script` | `scriptId` ∈ `npm-dev` \| `npm-start` \| `npm-preview` only | Copyable fixed npm command — **never** arbitrary shell |

### Forbidden

- `command`, `shell`, `exec`, `cmd`, `args`, `env` on `launch`
- Remote non-localhost URLs for `localhost` method
- Arbitrary script ids

The browser SPA does **not** spawn processes from manifests.

## Discovery

User configures directories in the UI. For each configured directory, Weaselworks looks for:

1. `weaselworks.json` in that directory, and  
2. `*/weaselworks.json` one level down  

It does **not** recursively crawl `$HOME` or nested trees beyond one child level.

## Persistence (app localStorage)

Key: `weaselworks.persistence.v1`  
`schemaVersion: 1` stores discovery dirs, manual registrations, favorites, recently opened, UI prefs, and optional pasted Git snapshots.

## Git inspect helper

```bash
node scripts/git-inspect.mjs /absolute/path/to/project
```

Prints JSON `{ available, branch, headShort, dirty, lastCommitDate }`. Paste into Discovery settings. The app never executes this for you from untrusted input.
