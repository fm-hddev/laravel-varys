# ADR-002 — IPC Electron vs HTTP local

## Statut

Accepted

## Contexte

Le main process Electron doit exposer des données au renderer (liste de processus, logs, broadcasts Reverb, stats de queue). Deux patterns ont été envisagés :

1. **IPC Electron** via `contextBridge` / `ipcMain.handle` / `ipcRenderer.invoke`
2. **HTTP local** : un serveur Express ou Fastify sur `localhost:PORT` consommé par le renderer via `fetch()`

## Décision

**IPC Electron via `contextBridge`** est retenu comme seul mécanisme de communication main ↔ renderer.

Raisons :
1. **Zéro port réseau ouvert** : aucune surface d'attaque réseau. Un serveur HTTP local serait accessible depuis n'importe quel processus sur la machine, y compris depuis des pages web malveillantes (CSRF local).
2. **Zéro CORS** : pas de gestion de headers, d'origines, ou de préflight.
3. **Typé end-to-end** : le contrat IPC est défini dans `@varys/core` (`IpcPayloadMap`). Le renderer et le main process partagent les mêmes types sans code de sérialisation supplémentaire.
4. **Mockable trivialement** : en test, on remplace `contextBridge.exposeInMainWorld` par un mock sans démarrer de serveur.
5. **Streams push** : `webContents.send()` permet au main process de pusher des événements au renderer (log lines, broadcasts) sans polling.

## Conséquences

- **Le renderer n'a pas d'accès direct** à Node.js, au filesystem, ou à Redis. Toute opération système est une invocation IPC explicite.
- **`preload.ts`** est le seul point d'entrée : il expose une API `window.varys.*` strictement typée via `contextBridge.exposeInMainWorld`.
- **Pas de `require()` dans le renderer** : `nodeIntegration: false` est non négociable.
- **Debugging** : les DevTools Electron permettent d'inspecter les messages IPC via `ipcRenderer` override — pas besoin d'un outil externe.
- **Latence** : IPC Electron est synchrone côté sérialisation (structuredClone). Pour des payloads > 1 MB (ex: log buffer massif), préférer la pagination côté main process.
