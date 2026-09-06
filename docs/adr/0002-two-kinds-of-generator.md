# ADR 0002 — Two kinds of generator, and only one of them is a CLI

**Status:** accepted · 2026-09-06
**Applies to:** BOILPLATE, boilplate-react, boilplate-next, boilplate-vue

## Context

Stage 6 asked what the existing generators are, and what a generator for whole
projects would look like. The first question came first on purpose: the
instruction was not to throw the existing ones away.

**What is there.** Each frontend ships a set of `generate:*` scripts, run through
one dispatcher:

| Script | React | Next | Vue |
| --- | --- | --- | --- |
| `generate` (dispatcher) | 68 | 68 | 68 |
| `generate:feature` | 230 | 138 | 323 |
| `generate:page` | 45 | 44 | 40 |
| `generate:form` | 35 | 35 | 31 |
| `generate:layout` | 31 | 34 | 30 |
| `generate:contract` | 29 | 29 | 29 |
| `generate:component` | — | — | 207 |
| `generate:api` | — | — | 141 |

They are already checked: `check:generators` runs each one and compares what it
produced against `FEATURE_CONTRACT.md`, and it is in every repo's `check:ci`. It
replaced a version that asserted four generator *files existed* without running
any of them.

Every one of these writes into a project that already exists. They know the
repository's own conventions — where a route file goes, what a feature must
contain for the router's glob to see it, which three files move together when a
feature has an API. None of that survives being made generic.

## Decision

**Split them by what they take as input, not by what they emit.**

**A — in-project code generators.** Everything in the table above. They stay in
each framework repository, unchanged, and stay tested by that repository's
`check:generators`. There is nothing to extract: a Vue feature generator that
also had to know React's conventions would be worse at both.

**B — the new-project generator.** `create-fredo-app`, in `cli/` in this
repository. It takes no existing project, so it belongs to no repository, and
putting it in one of the three would make the other two look secondary.

They were only ever grouped by sharing the word "generate".

### Why `cli/` here rather than a fifth repository

This repository already holds `DEVELOPMENT_POLICY.md`, ADR 0001, and the
realtime parity check — it is the ecosystem's tooling repository in practice, and
stage 7 makes that explicit. `cli/` has its own `package.json` because its
dependencies have nothing to do with the Vue app that shares the directory, and
because `npm create` needs a package actually named `create-fredo-app`. That is
one extra package in one repository, not a monorepo: no workspaces, no shared
tooling, no cross-package imports.

### What the MVP implements, and what it refuses

Three frameworks, with or without the NestJS backend. Six combinations, covering
the four the stage named.

PostgreSQL is not a separate question. The server's Prisma client is generated
from a Postgres schema and its config validation requires `DATABASE_URL`, so
"NestJS without a database" is not a project that starts — the CLI says that
instead of offering it.

**Choosing individual features is designed and not built.** Auth, the dashboard,
realtime topology and live chat are all in every generated project. Removing one
means its routes, its tests, its navigation entries, its mock handlers and its
store wiring, and a half-removed feature produces a project that does not build.
`--help` says so. A switch that silently does nothing would be worse than the
absence of a switch.

### Substitution is targeted, never a search and replace

Named keys in named files: the `name` field in each `package.json`, and specific
variables in the generated `.env`. Not a rewrite of "react-boilerplate" across a
tree — that would also hit import paths, a lockfile's resolved URLs, and
comments, and it would miss Vue entirely, whose package is called `boilplate`.

The one substitution that matters most is `JWT_SECRET`. The server ships it empty
with no fallback, on purpose, so a generated project does not start until
something fills it. That something is the CLI rather than a line in a README.

### Generated projects carry no history

`git clone --depth 1`, then the `.git` directory is removed and no new repository
is initialised. A generated project's first `git log` should not be a record of
someone else's decisions.

## Consequences

- `--verify` runs `install`, `typecheck`, `test` and `build` in what was
  generated. Off by default because it is two installs and several minutes; run
  in CI, where a generator whose output does not build is caught by the only
  thing that can catch it.
- The templates are cloned from GitHub rather than vendored. A vendored copy is
  stale the next day and has no way to know it — it would generate last month's
  boilerplate and report success.
- Adding a fourth framework means a row in `FRONTEND_TEMPLATES` and a CI matrix
  entry. Adding feature selection means a real removal implementation per
  framework, and `--verify` is what would prove it worked.
