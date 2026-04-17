# ADR-004 — Testcontainers pour les tests d'intégration des adapters

## Statut

Accepted

## Contexte

Certains adapters Varys communiquent avec des services externes :
- `@varys/adapter-reverb-redis` → Redis (PSUBSCRIBE)
- `@varys/adapter-laravel-queue` → MySQL, PostgreSQL, ou SQLite (selon `DB_CONNECTION`)

Deux approches pour tester ces adapters :
1. **Mocks** : remplacer ioredis / mysql2 / pg par des fakes en mémoire
2. **Conteneurs réels** : démarrer Redis, MySQL, PostgreSQL via Docker pour chaque run de test

Les mocks ont causé des régressions par le passé : un mock qui passe ne garantit pas que le vrai driver se comporte de la même façon (format de requête, gestion des transactions, encodage des colonnes).

## Décision

**Testcontainers** (`@testcontainers/redis`, `@testcontainers/mysql`, `@testcontainers/postgresql`) est utilisé pour les tests d'intégration des adapters Redis et DB.

Chaque test démarre un conteneur éphémère, exécute les cas de test contre le vrai service, puis détruit le conteneur.

Les adapters qui n'utilisent pas de service externe (`child_process`, filesystem) continuent d'utiliser des mocks `vi.mock`.

## Conséquences

- **CI ~5–10 min par PR** : Docker doit être disponible dans l'environnement CI. Accepté — c'est un outil de développement desktop, pas un microservice à déployer en masse.
- **Prérequis local** : Docker doit tourner sur la machine du développeur pour lancer `npm run test --workspace=adapters/reverb-redis`.
- **Isolation des drivers** : les tests MySQL et PostgreSQL sont dans des suites séparées (`*.mysql.test.ts`, `*.pg.test.ts`) pour permettre l'exécution partielle.
- **Pas de Testcontainers pour les adapters shell** : `DockerAdapter`, `ArtisanProcessAdapter`, `ViteProcessAdapter` sont testés avec `vi.mock('child_process')`. Démarrer un conteneur Docker pour tester un shell-out `docker ps` serait circulaire.
- **SQLite** : `better-sqlite3` n'a pas besoin de Testcontainers — une base SQLite en mémoire (`:memory:`) suffit.
- **Stabilité** : les images Docker utilisées sont épinglées à une version mineure (`redis:7.2`, `mysql:8.0`, `postgres:16`) pour éviter les régressions d'image.
