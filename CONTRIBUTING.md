# Contributing to Varys

## Development Setup

```bash
git clone git@github.com:fm-hddev/laravel-varys.git
cd laravel-varys
npm install
npm run dev
```

## Conventions

### Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`

Examples:
- `feat(core): add ProbeResult type`
- `fix(adapter-docker): handle missing containerId`
- `docs: update ADR-003`

### Branch Naming

- `feat/<description>` — new feature
- `fix/<description>` — bug fix
- `chore/<description>` — maintenance
- `docs/<description>` — documentation only

### Pull Request Process

1. Open a PR against `main`
2. Self-review: pause 24h before merging your own PR
3. Ensure all CI checks pass
4. Squash merge preferred

## Developer Certificate of Origin (DCO)

By contributing, you certify that your contribution is your original work
and that you have the right to submit it under the MIT License.
Include `Signed-off-by: Your Name <email>` in your commit message.

## Code Standards

- No `any` without a justification comment
- No `as unknown as X` without a justification comment
- All public API must be typed
- Tests required for all new adapters
