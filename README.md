# Weaselworks

Local-first personal software arcade — a cartridge library for apps, games, experiments, and utilities you build on your machine.

Named after **Stinkweasel Dexter** (grumpy tricolor dog), the Weaselworks mascot.

![Stinkweasel Dexter](public/dexter/stinkweasel-dexter.png)

## Run

```bash
cd ~/Developer/Weaselworks && npm install && npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | `tsc -b` only |
| `npm test` | Vitest unit tests |
| `npm run preview` | Preview production build |

## What it does

- Cartridge library with grid + compact list views  
- Detail view: launch instructions, Git metadata, missing/broken reporting  
- Manual registration + configured-directory discovery (`weaselworks.json`)  
- Search, status filters, tag filters, favorites, recently opened  
- Demo mode (≥12 synthetic cartridges) with **zero filesystem access**  
- Schema-versioned `localStorage` persistence  
- Strict safe launch providers (no arbitrary shell, no `eval`)  
- Keyboard / WASD cartridge grid navigation, responsive tablet layout  
- Optional `scripts/git-inspect.mjs` for read-only Git JSON (you run it; app does not spawn it)

## Manifest

See [docs/SCHEMA.md](docs/SCHEMA.md) for `weaselworks.json` schema, validation rules, and launch security.

## Architecture

| Module | Role |
|--------|------|
| `src/manifest/` | Schema, parse, validate |
| `src/discovery/` | Configured-dir discovery (one level) |
| `src/normalize/` | Manifest/manual/demo → cartridge model |
| `src/git/` | Git inspect abstraction + demo fixtures |
| `src/launch/` | Safe launch providers |
| `src/persistence/` | Schema-versioned localStorage |
| `src/demo/` | Demo cartridge provider |
| `src/ui/` | Library UI |
| `scripts/git-inspect.mjs` | Optional Node Git helper |


## Arcade vs Make backend

Weaselworks is an **arcade shell**: it catalogs and safely launches cartridges (Play URLs, localhost, whitelisted npm scripts). It does **not** embed a game engine.

**Make** is a swappable backend for creating/remixing/packing games:

| Backend | Role today | Launch from arcade |
|---------|------------|--------------------|
| **2D Game Factory** workbench | Create / Remix / Pack 2D Phaser games; publish packs to `westkitty.github.io/2d_Game_Factory/<id>/` | TOOL cart `factory-workbench` + header **Make** button → `npm run app` / `npm run app:dev` in `/Users/andrew/2d_game_factory/2d_Game_Factory` |
| **3D factory** (later) | Same arcade contract; different make-backend | Swap TOOL cart / Make target without changing the arcade shell |

After a successful factory pack + Pages publish, new playables should appear as Weaselworks carts via `src/catalog/fleetPages.ts` seed and/or discovery of `weaselworks.json` under configured factory dirs (`games/`, `demos/`, `proofs/`).

**Deeper / Flit\*** fleet entries stay `legacy-pages` — not factory products.

## Security

- No arbitrary shell from manifests  
- No reading `.env`, keys, SSH, cookies, or browser profiles  
- No telemetry, accounts, or cloud upload  
- Localhost URLs and whitelisted script ids only  

## License

Private / personal — Nun Ya.
