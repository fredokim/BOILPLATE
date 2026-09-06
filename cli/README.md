# create-fredo-app

Generates a project from the React, Next, Vue and NestJS boilerplates.

```
cd ~/projects
npx tsx path/to/BOILPLATE/cli/src/index.ts my-app
```

Answer two questions, or skip them:

```
create-fredo-app my-app --framework react --backend nest --yes
create-fredo-app my-app --framework vue --backend none --yes --verify
```

| Option | |
| --- | --- |
| `--framework` | `react` · `next` · `vue` |
| `--backend` | `nest` · `none` |
| `--ref` | branch or tag to take the templates from (default `main`) |
| `--verify` | run `install`, `typecheck`, `test` and `build` in what was generated |
| `--yes` | do not prompt; requires `--framework` and `--backend` |

## What you get

With a backend, two packages side by side:

```
my-app/
  frontend/   the chosen framework, package name "my-app"
  server/     NestJS + Prisma, package name "my-app-server"
```

Without one, the frontend *is* the project — no `frontend/` directory wrapping an
otherwise empty one.

No git history is copied and no repository is initialised. Run `git init` when
you are ready.

## What it fills in

`package.json`'s `name`, and the environment files:

- **React and Vue** get `.env` with `VITE_DATA_MODE=server` and
  `VITE_API_TARGET` pointing at the local server. With `--backend none` no file
  is written at all — every variable is optional and the commented defaults run
  the app on MSW.
- **Next** gets `.env.local` with an unprefixed `BACKEND_URL`. No
  `NEXT_PUBLIC_`: the browser must not call the backend directly or the
  `sameSite=lax` refresh cookie would not travel, so the route handlers forward.
- **The server** gets `.env` with a generated `JWT_SECRET` — it ships empty with
  no fallback, so this is the difference between a project that starts and one
  that does not — a generated seed password, and `CORS_ORIGINS` set to the dev
  origin of whichever framework was chosen (5173 for Vite, 3000 for Next).

Edits are targeted at named keys in named files. Never a search and replace over
the tree: that would hit import paths and lockfile URLs, and would miss Vue,
whose package is called `boilplate` rather than `vue-boilerplate`.

## What it does not do

Choosing individual features. Auth, the dashboard, realtime topology and live
chat are in every generated project. Removing one cleanly means its routes, its
tests, its navigation entries, its mock handlers and its store wiring — a
half-removed feature produces a project that does not build, so this offers no
switch rather than a switch that quietly does nothing.

`--backend nest --database none` is refused for the same reason: the server's
Prisma schema and its config validation both require PostgreSQL.

[ADR 0002](../docs/adr/0002-two-kinds-of-generator.md) has the reasoning, and the
survey of the in-project `generate:*` scripts that this one is deliberately not.

## Development

```
npm install
npm run check     # typecheck + tests
```

Tests use `node:test` and the CLI has no runtime dependencies at all — it is run
once, by `npx`, on a machine that has just met it.
