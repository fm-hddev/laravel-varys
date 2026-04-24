# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are managed automatically by [Changesets](https://github.com/changesets/changesets).

## [1.0.3] — 2026-04-20

### Fixed

- **CI build failure** — top-level `await import()` in `renderer/src/main.tsx` rejected by esbuild (target `es2020`/`chrome87`). Wrapped in an async IIFE (`void main()`).

---

## [1.0.1] — 2026-04-20

### Fixed

- **Crash on launch** — `fsevents.node` was resolved to an absolute CI runner path at build time and baked into the bundle, causing "Cannot find module" on any other machine. `fsevents` is now stubbed (chokidar falls back to its pure-JS polling watcher).

---

## [1.0.0] — 2026-04-19

### Added

- **Reverb WebSocket streaming** — broadcasts streamed via WebSocket + Laravel log channel discovery
- **Screenshots** — 5 PNG screenshots in `assets/screenshots/` (processes, events, queues, failed jobs, logs)
- **README** — screenshots displayed, install instructions, getting-started guide, badges

### Changed

- All packages bumped to `1.0.0`
- `main` promoted as default branch (replaces `chore/bootstrap-monorepo`)

### Fixed

- CI pipeline: build order (core → adapters → lint) to resolve type-aware ESLint errors
- IPC channel count updated to 19 after adding overrides channels
- `@varys/*` types resolved from source for local lint/CI alignment

---

## [1.0.0-rc.1] — 2026-04-19

### Added

- **Electron desktop app** for macOS — monitors a local Laravel stack in real time
- **ProcessesView** — Docker containers, Artisan processes, Vite dev server with live log tailing
- **EventsView** — Reverb broadcast events via Redis pub/sub (pause/resume, filters, payload inspector)
- **QueuesView** — Queue stats (pending/processing/failed) per queue, multi-driver (MySQL, PG, SQLite, Redis); failed jobs panel
- **LogsView** — Live tail of `storage/logs/*.log` with level filtering and auto-scroll
- **WelcomeScreen** — Project folder picker, health report, adapter probe on startup
- **SettingsScreen** — Project switcher, adapter enable/disable, health re-probe
- **Adapter pattern** — 8 independent adapters: DotenvAdapter, DockerAdapter, ArtisanProcessAdapter, ViteProcessAdapter, ReverbRedisAdapter, LaravelQueueAdapter, LogFileAdapter, VarysAgentAdapter
- **ConfigStore** — JSON config persistence with atomic writes and corruption recovery
- **AdapterRegistry** — Parallel adapter probe with 2 s timeout per adapter, session ID lifecycle
- **IPC security** — `contextBridge`, `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- **Electron Forge** — `MakerDMG` + `VitePlugin` for macOS DMG build
- **GitHub Actions CI** — lint, typecheck, test (Testcontainers), build renderer, Forge make on `macos-latest`
- **GitHub Actions Release** — tag `v*` triggers DMG build and upload to GitHub Releases
- **ADRs 001–005** — documented architecture decisions (Electron, IPC, Adapter Pattern, Testcontainers, Multi-driver DB)
- **146 tests** — Vitest unit + Testcontainers integration; Playwright E2E structure (requires built app)
- **Bundle** — renderer 118 KB gzip (budget: 2 MB)
