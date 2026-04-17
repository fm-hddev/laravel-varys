# ADR-001 — Electron vs Tauri

## Statut

Accepted

## Contexte

Varys est une application desktop multi-plateforme (macOS, Windows, Linux) qui doit :
- Exécuter des shell-outs (`docker ps`, `ps aux`, `artisan`), accéder au filesystem local et à Redis
- Être contributable par la communauté Laravel, majoritairement familière avec JavaScript/TypeScript
- Proposer une interface graphique riche (tableaux de bord temps réel, streaming de logs)
- Être distribuée en binaire auto-contenu

Deux candidats principaux ont été évalués : **Electron** (Node.js + Chromium) et **Tauri** (Rust + WebView natif).

## Décision

**Electron** est retenu comme runtime desktop.

Raisons :
1. **Compétences disponibles** : l'équipe core et les contributeurs potentiels maîtrisent TypeScript/Node.js. Tauri nécessite Rust pour tout ce qui touche au main process — barrière à l'entrée trop haute pour les contributions communautaires.
2. **Maturité et écosystème** : Electron est stable depuis 2013, dispose d'un écosystème npm massif, et est utilisé en production par VS Code, Slack, Discord.
3. **IPC natif type-safe** : `contextBridge` + `ipcMain`/`ipcRenderer` permettent un contrat IPC versionné dans `@varys/core`, sans port réseau ouvert.
4. **Shell-out et fs** : Node.js `child_process` et `fs` sont directement disponibles dans le main process, sans bindings Rust intermédiaires.
5. **Electron Forge** : packaging et distribution multi-plateforme sans configuration complexe.

## Conséquences

- **Binaire ~150–200 MB** : acceptable pour un outil de développement desktop. Non acceptable pour un SDK mobile — hors scope.
- **Sécurité** : `nodeIntegration: false` et `contextIsolation: true` obligatoires dans toutes les `BrowserWindow`. Le renderer n'a pas d'accès direct à Node.js — toutes les opérations système passent par IPC.
- **Sandbox** : `sandbox: true` activé ; chaque API système exposée au renderer est explicitement déclarée dans `preload.ts`.
- **Mises à jour** : `electron-updater` pour les auto-updates. Signature de code requise pour macOS et Windows (setup manuel hors scope de la v1).
