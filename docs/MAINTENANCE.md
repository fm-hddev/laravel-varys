# Protocole de Maintenance et de Mise à Jour — Varys

Référence opérationnelle pour toute modification du projet. À lire avant de toucher au code.

---

## 1. Créer un nouvel élément

### Nouvel adapter

1. Créer le dossier `adapters/<nom>/` avec `src/index.ts`, `package.json`, `tsconfig.json` (copier un adapter existant comme base).
2. Implémenter l'interface `Adapter` définie dans `packages/core/src/`.
3. Déclarer la dépendance dans `packages/main/package.json` : `"@varys/adapter-<nom>": "*"`.
4. Enregistrer l'adapter dans `AdapterRegistry` (dans `packages/main/src/`).
5. Écrire les tests dans `adapters/<nom>/src/__tests__/`.
6. Si l'adapter nécessite une décision d'architecture non triviale → créer un ADR dans `docs/adr/` (incrémenter le numéro).

### Nouvelle vue (renderer)

1. Créer le composant dans `packages/renderer/src/views/`.
2. Ajouter la route dans le router (`packages/renderer/src/main.tsx` ou équivalent).
3. Exposer les données nécessaires via IPC : déclarer le handler dans `packages/main/src/` et le bridge dans `packages/main/src/preload.ts`.
4. Typer le contrat IPC dans `packages/core/src/` si partagé.

### Nouveau package workspace

1. Créer le dossier sous `packages/<nom>/` ou `adapters/<nom>/`.
2. Ajouter un `package.json` avec `"name": "@varys/<nom>"`.
3. Vérifier que `tsconfig.base.json` à la racine couvre bien le nouveau package.
4. Installer : `npm install` à la racine pour mettre à jour `package-lock.json`.

---

## 2. Modifier du code existant

### Règle générale

- Modifier uniquement ce qui est demandé. Ne pas "améliorer" le code adjacent.
- Si la modification touche un contrat IPC ou un type partagé (`packages/core`), vérifier tous les consommateurs (main + renderer + adapters).
- Si la modification touche `packages/core` → rebuild obligatoire avant de tester main ou renderer (voir §3).

### Modifier un adapter

- Respecter l'interface `Adapter` — ne pas casser la signature de `probe()`, `start()`, `stop()`.
- Toute modification de comportement observable → mettre à jour ou ajouter les tests correspondants.

### Modifier la config Forge (`forge.config.ts`)

- Tester localement avec `npm run package` (plus rapide que `make`) avant de pousser.
- Ne pas changer `appBundleId` sans raison — cela casse les préférences utilisateur macOS existantes.

---

## 3. Quand rebuilder

| Situation | Commande |
|---|---|
| Modification dans `packages/core` | `npm run build --workspace=packages/core` |
| Modification dans un adapter | `npm run build --workspace=adapters/<nom>` |
| Modification dans `packages/renderer` | `npm run build --workspace=packages/renderer` |
| Tout rebuilder (CI-like) | `npm run build --workspaces --if-present` |
| Build DMG complet (release) | `npm run make --workspace=packages/main` |
| Vérifier le build Electron sans créer de DMG | `npm run package --workspace=packages/main` |

**En développement** (`npm run dev`), Forge + Vite font le watch automatiquement — pas besoin de rebuild manuel sauf pour `packages/core` et les adapters qui ne sont pas en mode watch.

---

## 4. Checklist de fin de modification

À exécuter dans cet ordre avant tout commit :

```bash
# 1. Lint (0 warning toléré)
npm run lint

# 2. Typecheck tous les packages
npm run typecheck

# 3. Tests unitaires + intégration
npm run test --workspaces --if-present

# 4. Build complet (détecte les erreurs de résolution de modules)
npm run build --workspaces --if-present
```

Si l'un de ces checks échoue → corriger avant de commiter. Le hook pre-commit (`husky`) bloque sur lint + typecheck, mais les tests et le build ne sont vérifiés qu'en CI.

### Format du commit

```
<type>(<scope>): <description courte>
```

Types valides : `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`

Exemples :
```
feat(adapter-docker): add container restart support
fix(core): handle undefined projectPath in ConfigStore
docs: add MAINTENANCE protocol
```

---

## 5. Processus de mise à jour (release)

### Pré-release / RC

```bash
# Bump de version manuel dans packages/core/package.json et packages/main/package.json
# Puis commit :
git commit -m "chore: bump version to X.Y.Z-rc.N"

# Entrée CHANGELOG.md à mettre à jour manuellement (format Keep a Changelog)
git commit -m "docs: update CHANGELOG for X.Y.Z-rc.N"
```

### Release stable

```bash
# 1. S'assurer d'être sur main, CI verte
git checkout main
git pull

# 2. Créer et pousser le tag — déclenche le workflow Release (DMG → GitHub Releases)
git tag vX.Y.Z
git push origin vX.Y.Z
```

Le workflow `.github/workflows/release.yml` prend en charge :
- Build des adapters et core
- `electron-forge make` → génère le DMG
- Upload du DMG sur GitHub Releases

### Mise à jour des dépendances npm

```bash
# Vérifier les outdated
npm outdated

# Mettre à jour une dépendance spécifique (préférer ciblé plutôt que --workspaces)
npm update <package> --workspace=packages/<nom>

# Après toute mise à jour de dépendance : relancer la checklist complète (§4)
```

> Attention : `electron` et `vite` ont des contraintes de compatibilité croisée avec `@electron-forge/plugin-vite`. Tester un upgrade majeur sur une branche dédiée.

---

## 6. Décisions d'architecture (ADRs)

Créer un ADR dans `docs/adr/` quand :
- On change la structure de communication IPC
- On ajoute ou supprime un adapter de la liste officielle
- On change le système de build ou de packaging
- On adopte une nouvelle dépendance structurante (ORM, state manager, etc.)

Format : copier `docs/adr/001-electron-vs-tauri.md`, incrémenter le numéro, remplir les sections Status / Context / Decision / Consequences.
