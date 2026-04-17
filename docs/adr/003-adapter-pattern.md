# ADR-003 — Adapter Pattern pour les sources de données

## Statut

Accepted

## Contexte

Varys agrège des données depuis N sources hétérogènes :
- **Docker** : `docker ps --format json`, `docker logs --follow`
- **Artisan** : `php artisan list`, détection via `ps aux`
- **Vite** : détection via `lsof` ou `ps aux`
- **Redis/Reverb** : `PSUBSCRIBE reverb:*` via ioredis
- **Queue** : `mysql2` / `pg` / `better-sqlite3` selon `DB_CONNECTION`
- **Filesystem** : lecture de fichiers `.log` dans `storage/logs/`
- **Varys Agent** : endpoint HTTP optionnel déployé dans le projet Laravel

Ces sources ont des interfaces radicalement différentes, des dépendances distinctes, et des besoins de test différents (mocks shell, Testcontainers, fixtures fichiers).

Il faut aussi permettre à la communauté d'ajouter des sources de données sans modifier le code core.

## Décision

**Le pattern Adapter** est retenu : chaque source de données est encapsulée dans un package npm `@varys/adapter-<nom>` qui implémente l'interface `DataSourceAdapter` définie dans `@varys/core`.

Structure :
```
adapters/
  dotenv/         — @varys/adapter-dotenv
  docker/         — @varys/adapter-docker
  artisan/        — @varys/adapter-artisan
  vite/           — @varys/adapter-vite
  reverb-redis/   — @varys/adapter-reverb-redis
  laravel-queue/  — @varys/adapter-laravel-queue
  log-file/       — @varys/adapter-log-file
  varys-agent/    — @varys/adapter-varys-agent
```

Chaque adapter :
1. Implémente `DataSourceAdapter` de `@varys/core`
2. Déclare ses propres dépendances npm
3. Expose `probe()` pour signaler sa disponibilité
4. Est testable indépendamment (isolation totale)

## Conséquences

- **Isolation** : un adapter cassé n'affecte pas les autres. `probe()` retourne `{ available: false }` si la source est inaccessible — le reste de l'app continue de fonctionner.
- **Extensibilité communautaire** : un tiers peut publier `@community/varys-adapter-forge` sans toucher au monorepo principal.
- **Tests indépendants** : chaque adapter a son propre dossier `__tests__/` et ses fixtures. Les adapters shell utilisent des mocks `child_process`, les adapters Redis/DB utilisent Testcontainers.
- **Registre d'adapters** : l'`AdapterRegistry` (main process, session 4) charge les adapters configurés, appelle `probe()` au démarrage, et délègue les requêtes IPC à l'adapter approprié.
- **Contrat stable** : `DataSourceAdapter` dans `@varys/core` est versionné via Changesets. Tout breaking change déclenche un bump de version majeure.
- **Coût** : chaque nouveau adapter nécessite un `package.json`, un `tsconfig.json`, et des tests. Overhead acceptable pour la maintenabilité.
