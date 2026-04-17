# ADR-005 — Support multi-driver base de données (MySQL / PostgreSQL / SQLite)

## Statut

Accepted

## Contexte

`@varys/adapter-laravel-queue` doit lire les jobs en attente, en cours, et échoués depuis la base de données Laravel. La valeur de `DB_CONNECTION` dans `.env` peut être :
- `mysql` → driver `mysql2`
- `pgsql` → driver `pg`
- `sqlite` → driver `better-sqlite3`

Ces trois drivers ont des APIs différentes, des dépendances binaires distinctes (better-sqlite3 nécessite une compilation native), et des types de données légèrement différents.

Deux approches ont été évaluées :
1. **Bundler les trois drivers** : inclure `mysql2`, `pg`, et `better-sqlite3` comme dépendances directes, charger le bon au runtime.
2. **Chargement conditionnel** : `require()` dynamique selon `DB_CONNECTION`, les drivers non utilisés ne sont pas chargés.

## Décision

**Chargement conditionnel via `require()` dynamique** selon la valeur de `DB_CONNECTION` lue depuis `ProjectContext`.

```typescript
// Pseudo-code — implémentation dans LaravelQueueAdapter
function getDriver(connection: 'mysql' | 'pgsql' | 'sqlite') {
  switch (connection) {
    case 'mysql':   return require('mysql2/promise');
    case 'pgsql':   return require('pg');
    case 'sqlite':  return require('better-sqlite3');
  }
}
```

Les trois drivers restent listés dans `devDependencies` de l'adapter (pour les tests), mais seul le driver actif est chargé en mémoire à l'exécution.

## Conséquences

- **Un seul driver en mémoire** : pas de surcharge mémoire inutile. L'utilisateur avec MySQL ne charge pas `pg` ni `better-sqlite3`.
- **Bundle Electron plus léger** : Electron Forge n'inclut que les modules effectivement `require()`-és au runtime (via `@electron-forge/plugin-webpack` ou `@electron-forge/plugin-vite` avec analyse statique désactivée pour les requires dynamiques).
- **Tests séparés par driver** : `LaravelQueueAdapter.mysql.test.ts`, `LaravelQueueAdapter.pg.test.ts`, `LaravelQueueAdapter.sqlite.test.ts` — chacun avec son propre Testcontainer (ou SQLite `:memory:`).
- **`require()` peut échouer** : si `DB_CONNECTION=mysql` mais que `mysql2` n'est pas installé, l'erreur est capturée dans `probe()` et retournée comme `{ available: false, reason: "mysql2 not found" }`. L'utilisateur voit un message clair dans l'UI.
- **Pas d'`import` statique** : les imports statiques (`import mysql from 'mysql2'`) seraient bundlés inconditionnellement. On utilise `require()` explicitement, avec un commentaire justificatif (`// dynamic require — see ADR-005`).
- **TypeScript** : les types des trois drivers sont dans `devDependencies` (`@types/pg`, etc.). Le code utilise des types locaux pour l'interface interne afin d'éviter la dépendance aux types externes dans le contrat public.
