# BOILPLATE

Shared tooling and decisions for the boilerplate ecosystem: three frontends and
one backend that speak the same contract.

| | |
| --- | --- |
| [`fredokim/boilplate-react`](https://github.com/fredokim/boilplate-react) | React · Vite · React Query · axios |
| [`fredokim/boilplate-next`](https://github.com/fredokim/boilplate-next) | Next.js · App Router · route handlers forward to the backend |
| [`fredokim/boilplate-vue`](https://github.com/fredokim/boilplate-vue) | Vue · Vite · Pinia |
| [`fredokim/boilplate-server`](https://github.com/fredokim/boilplate-server) | NestJS · Prisma · PostgreSQL |

## What lives here

**[`DEVELOPMENT_POLICY.md`](DEVELOPMENT_POLICY.md)** — the rules all four repos
follow, and the ones they deliberately do not share. Node and npm, TypeScript
strictness, lint and format, environment variables, dependency policy, the
contract CI, pull requests.

**[`cli/`](cli/README.md)** — `create-fredo-app`, which generates a project from
those repos. Three frameworks, with or without the backend.

```
cd ~/projects
npx tsx path/to/BOILPLATE/cli/src/index.ts my-app
```

**[`docs/adr/`](docs/adr)** — decisions with the reasoning kept.

- [0001 — The realtime core stays duplicated](docs/adr/0001-realtime-core-stays-duplicated.md)
- [0002 — Two kinds of generator, and only one of them is a CLI](docs/adr/0002-two-kinds-of-generator.md)

**`scripts/check-realtime-parity.ts`** — `npm run realtime:parity` reports where
the three frontends' realtime cores have stopped agreeing. It expects the four
repositories checked out side by side, or `REPO_ROOT` pointing at their parent.

## The Vue app in `src/`

This repository started as a Vue starter and that app is still here. It does not
build: `npm run check` fails with five unresolved `@/` imports. Nothing else in
this repository depends on it, and the two checks above do not touch it. Whether
it becomes the ecosystem's front page or is removed is an open question, not an
oversight.
