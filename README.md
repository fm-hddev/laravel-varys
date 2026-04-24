# Varys

> "I have little birds everywhere, even in the North." — Varys, Master of Whisperers

[![CI](https://github.com/fm-hddev/laravel-varys/actions/workflows/ci.yml/badge.svg)](https://github.com/fm-hddev/laravel-varys/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Bundle < 200KB](https://img.shields.io/badge/bundle-%3C200KB-green)
![Node 20+](https://img.shields.io/badge/node-20%2B-blue)
![macOS unsigned](https://img.shields.io/badge/macOS-unsigned%20%E2%80%94%20xattr%20-cr%20required-orange?logo=apple)

**Varys** is a macOS desktop app that gives Laravel developers a real-time view of their local stack: processes, Reverb broadcast events, queues, and logs — in a single window, without modifying the Laravel app.

<!-- GIF demo coming soon -->
![Processes](assets/screenshots/processes.png)
![Events](assets/screenshots/events.png)
![Queues](assets/screenshots/queues.png)
![Failed Job](assets/screenshots/failed_job.png)
![Logs](assets/screenshots/logs.png)

---

## Features

| View | What you see |
|------|-------------|
| **Processes** | Docker containers + Artisan commands + Vite — with live log tailing per process |
| **Events** | Real-time Reverb broadcasts via Redis pub/sub — pause, filter, inspect payloads |
| **Queues** | Pending / processing / failed counters per queue, multi-driver (MySQL, PG, SQLite, Redis) |
| **Logs** | Live tail of `storage/logs/*.log` with level filtering (DEBUG / INFO / WARNING / ERROR / CRITICAL) |

---

## Installation

### macOS

Download the latest `.dmg` from the [Releases](https://github.com/fm-hddev/laravel-varys/releases) page, open it and drag **Varys.app** to your Applications folder.

> **⚠️ Gatekeeper warning — "cannot be opened because the developer cannot be verified"**
>
> Varys is not yet notarized with an Apple Developer certificate.
> Run this once in Terminal after installation:
>
> ```bash
> xattr -cr /Applications/Varys.app
> ```
>
> This removes the quarantine flag Apple sets on downloaded binaries.
> No system permissions are modified — you can verify with `xattr -l /Applications/Varys.app` (should return empty).

Then launch Varys normally from your Applications folder or Spotlight.

### Linux

Download the `.deb` (Debian/Ubuntu) or `.AppImage` from the Releases page.

```bash
# .deb
sudo dpkg -i varys_*.deb

# AppImage
chmod +x Varys-*.AppImage && ./Varys-*.AppImage
```

### Windows

Download the `.exe` installer from the Releases page and run it.
Windows SmartScreen may prompt — click **"More info → Run anyway"**.

---

## Getting Started (3 steps)

1. Open Varys → click **"Select Laravel project"** → pick your project folder
2. Varys probes your stack (Docker, Redis, DB, logs) and shows a health report
3. Click **"Continue"** → monitor processes, events, queues, and logs in real time

---

## Requirements

| Requirement | Details |
|---|---|
| macOS | 13 Ventura or later |
| Node.js | 20+ (dev only) |
| Laravel project | `.env` file at project root |
| Redis | Required for Reverb events view (`REVERB_SCALING_ENABLED=true`) |
| Docker | Optional — detected automatically for the Processes view |

---

## Architecture

```
packages/
  core/       — domain types + IPC channel contracts
  main/       — Electron main process (ConfigStore, AdapterRegistry, IPC handlers)
  renderer/   — React 19 + Tailwind v4 + Zustand + React Query

adapters/
  dotenv/           — reads .env → ProjectContext
  docker/           — Docker process monitoring
  artisan-process/  — artisan + php processes via ps
  vite-process/     — Vite dev server detection
  log-file/         — log file tailing (chokidar)
  laravel-queue/    — queue stats (MySQL/PG/SQLite/Redis)
  reverb-redis/     — Reverb broadcast capture via Redis SUBSCRIBE
  varys-agent/      — HTTP adapter for future enriched data (not yet published)
```

Each data source is behind a `DataSourceAdapter` interface — fully independent, testable, and opt-in.

→ See [docs/adr/](docs/adr/) for architecture decision records.
→ See [docs/performance.md](docs/performance.md) for performance budgets.

---

## Contributing

→ [CONTRIBUTING.md](CONTRIBUTING.md) — setup, commit conventions, code standards.

---

## License

MIT — Copyright (c) 2026 Frédéric Moras
