# Performance Report — Varys v0.0.0

Date : 2026-04-17

## Budgets

| Métrique | Budget | Mesuré | Statut |
|---|---|---|---|
| Startup time (main → ready-to-show) | < 2 000 ms | N/A — mesure manuelle requise | ⏳ |
| RAM idle (après 10 s) | < 150 MB | N/A — mesure manuelle requise | ⏳ |
| Bundle renderer (gzip total) | < 2 000 KB | ~118 KB | ✅ |
| Probe all adapters (timeout 2 s/adapter) | < 3 000 ms | N/A — mesure sur app réelle requise | ⏳ |

## Bundle renderer (session 7 — 2026-04-17)

Commande : `npm run build --workspace=packages/renderer`

```
dist/index.html                           0.39 kB │ gzip:   0.27 kB
dist/assets/index-LZmjvqT9.css           19.91 kB │ gzip:   4.75 kB
dist/assets/HealthReport-BKTUURdB.js      0.77 kB │ gzip:   0.43 kB
dist/assets/useIpc-xDQobovX.js            1.03 kB │ gzip:   0.34 kB
dist/assets/WelcomeScreen-4J9y2te5.js     2.33 kB │ gzip:   1.05 kB
dist/assets/ProcessesView-IldA9XiI.js     4.62 kB │ gzip:   1.83 kB
dist/assets/LogsView-DrFFfU6U.js          4.81 kB │ gzip:   1.89 kB
dist/assets/SettingsScreen-DIeOOWdv.js    5.06 kB │ gzip:   1.51 kB
dist/assets/EventsView-Ob9SkPXS.js        5.19 kB │ gzip:   1.80 kB
dist/assets/QueuesView-Bb242yCQ.js        5.43 kB │ gzip:   1.52 kB
dist/assets/index-DpJA32a2.js           330.74 kB │ gzip: 104.88 kB
✓ built in 599ms
```

**Total gzip estimé : ~118 KB** — bien sous le budget de 2 MB.

Chaque route est un chunk séparé (code-splitting automatique Vite). La route principale (`index.js`) contient React 19 + React Router v7 + Zustand + React Query (~104 KB gzip).

## Startup time

Instrumentation dans `packages/main/src/index.ts` :
- `t0 = performance.now()` au top du module
- Log `startup_ms=XXX` au `ready-to-show` event

**Mesure manuelle** requise avec `npm run dev --workspace=packages/main`. Lire la sortie console `[varys] startup_ms=`.

Budget : < 2 000 ms. Si dépassé, investiguer :
- Adapter probe trop lent → réduire timeout à 1 000 ms
- `better-sqlite3` lent à charger → asar unpack config

## RAM idle

**Mesure manuelle** avec macOS Activity Monitor après 10 s d'idle sur un projet mock.

Budget : < 150 MB (main + renderer combinés).

## Probe all adapters

La méthode `AdapterRegistry.probeAll()` utilise `Promise.allSettled` avec timeout 2 s par adapter. Durée totale = max(probe_individuel) + overhead.

**Mesure manuelle** : lire les logs pino au démarrage (probe déclenché au `project:health` IPC).
