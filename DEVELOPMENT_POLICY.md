# Development policy

Four repositories, kept separate on purpose:

| Repository | What it is |
| --- | --- |
| [boilplate-react](https://github.com/fredokim/boilplate-react) | React + Vite frontend boilerplate |
| [boilplate-next](https://github.com/fredokim/boilplate-next) | Next.js App Router boilerplate |
| [boilplate-vue](https://github.com/fredokim/boilplate-vue) | Vue 3 + Vite boilerplate |
| [boilplate-server](https://github.com/fredokim/boilplate-server) | NestJS backend the three share |

This document is the one place the shared baseline is written down. It records
what is deliberately the same, what is deliberately different, and — where the
two have drifted apart by accident — what closing the gap would cost.

---

## Duplicated code that must stay duplicated

The three frontends each carry their own copy of the realtime core — eleven
files, about 1,300 lines, identical in all three once line endings and quote
style are normalised. That is deliberate, and [ADR 0001](docs/adr/0001-realtime-core-stays-duplicated.md)
is the reasoning.

`npm run realtime:parity` in this repo reports any of those eleven files whose
three copies have stopped agreeing. It runs in this repo's CI rather than in each
frontend's, because a coordinated change lands as three PRs and a per-repo gate
would be red for the second and third by design.

A change to realtime behaviour is three commits. Land all three.

---

## No shared config packages

The obvious move is a `@fredo/eslint-config`, a `@fredo/tsconfig`, a
`@fredo/tooling-config`. These repositories will not have them.

A boilerplate is something a person clones and then owns. The moment its lint
rules live in a package under someone else's namespace, the clone is not
self-contained: it either depends on a registry entry that must be published and
maintained forever, or it does not build. The abstraction that would save four
files from drifting apart is the same abstraction that makes each of them less
useful for its only purpose.

So the configuration is duplicated on purpose, and this document is what keeps it
honest instead. Four small files that agree because someone checked beats one
package that four repositories cannot run without.

---

## Node and the package manager

**Node 22.** Declared as `engines: { node: ">=22" }` in all four, matching what CI
pins and what the Render blueprints set. It was previously written down in CI and
in `render.yaml` and nowhere a developer would look.

**npm**, with the lockfile committed and `npm ci` in CI.

No `packageManager` field. Corepack would then enforce an exact npm version, and
a mismatch fails the install of a repository whose whole purpose is to be cloned
and run. The lockfile already pins what matters.

---

## TypeScript

Versions differ, and one of them is deliberate:

| Repository | Declared | Installed |
| --- | --- | --- |
| react | `~6.0.2` | 6.0.3 |
| next | `^5` | 5.9.3 |
| vue | `~5.8.3` | 5.8.3 |
| server | `^5.7.2` | 5.9.3 |

React is on TypeScript 6 and the other three are on 5. That is not drift to
correct on a schedule: a major upgrade is its own piece of work, done when there
is a reason. It does have a cost worth knowing — `openapi-typescript` still
declares `peer typescript@^5.x`, so React cannot use it today while the others
could.

**The policy is that the range is stated with intent.** `~6.0.2` is a pin, `^5` is
not; a repository that means to hold a version says so with a tilde.

### Compiler strictness

The measured baseline, resolved through `extends` with `tsc --showConfig`:

| Option | react | next | vue | server |
| --- | --- | --- | --- | --- |
| `strict` | ✓ | ✓ | ✓ | ✓ |
| `noImplicitOverride` | ✓ | ✓ | ✓ | ✓ |
| `noUncheckedIndexedAccess` | ✓ | ✓ | ✓ | ✓ |
| `noUnusedLocals` | ✓ | ✓ | ✓ | ✓ |
| `exactOptionalPropertyTypes` | ✓ | ✓ | — | — |

Everything except the last row is the baseline, and every repository meets it.

`exactOptionalPropertyTypes` is the open gap, and it is priced rather than
promised: **62 errors** in Vue, **6** in the server. Both were measured with a
forced full typecheck, not inferred. Adopting it is a real change to real code and
belongs in its own pass, not in a policy document that would otherwise be claiming
a standard nobody meets.

Two options were adopted while writing this because they cost nothing —
`noImplicitOverride` in Vue and `noUnusedLocals` in Next both typechecked clean
the moment they were turned on. A rule a repository already follows should be
written down, or the next person is free to break it.

---

## ESLint and Prettier

**ESLint 9 flat config** (`eslint.config.js` / `.mjs`) everywhere. React is on
ESLint 10; the others are on 9.

The Vue repository also carried an `eslintrc.json` — the legacy format, inherited
from the Vue scaffold this repository started as, referenced by nothing and not
even discoverable by ESLint without the leading dot. It has been deleted. Dead
configuration is worse than none: the next person to change lint rules has to
work out which of the two files is real.

**Prettier is not a shared standard.** Only the Vue repository has it; the other
three format through ESLint alone. Adding it to all four would be adopting a tool
three of them are not asking for.

This repository has no lint configuration, because it has no application code —
two scripts and a CLI, all covered by `tsc --noEmit`. A flat config here would be
one more file claiming to enforce something.

---

## Environment variables

The prefix is decided by the build tool, not by preference:

| Repository | Browser-visible | Server-only |
| --- | --- | --- |
| react, vue | `VITE_*` | — |
| next | `NEXT_PUBLIC_*` | unprefixed (`BACKEND_URL`) |
| server | — | unprefixed |

**Every variable a repository reads is declared in its `.env.example`**, with a
comment saying what it is for. This is a rule because it was broken in all three
frontends at once: React and Vue had no `.env.example` at all while reading five
variables each, and Next's existed but was matched by `.env*` in `.gitignore` —
present for whoever wrote it and absent for everyone who cloned it.

Next's `BACKEND_URL` deliberately has no `NEXT_PUBLIC_` prefix. The browser must
not call the backend directly: the refresh cookie is `sameSite=lax` and would not
travel. See that repository's `.env.example`.

---

## Dependency and security updates

**`npm audit --audit-level=moderate` on every CI run.** React and Vue run it
against the full tree.

Next and the server narrow it to `--omit=dev`, and both say why in the workflow:
a dev-tree advisory with no upstream fix that cannot reach a deployed artefact.
That is the policy — **the narrow scope requires a named reason in the file**, not
a preference. Two repositories passing at the wider setting is not drift to
"align" downward; lowering them to match would be giving up a check that works.

Each frontend also has a `DEPENDENCY_STRATEGY.md` recording which packages are
kept, which are avoided, and which may be replaced under what conditions. Those
are per-repository because the answers are: `axios` matters to React's
interceptor architecture in a way it does not to Next's route handlers.

---

## Contract and CI

The server owns the HTTP contract. Its `openapi.json` is generated, drift-checked
against the code, and published on `main`; the frontends commit a copy and check
their DTOs against it.

`contract-compatibility` in the server's CI runs each frontend's contract tests
against the spec a pull request would produce, so a breaking change is caught
before merge rather than after deploy. It compares conformance, never bytes: an
additive change makes the committed copies differ while breaking nothing, and a
check that failed on that would be one everyone learns to ignore.

Each repository keeps its own full pipeline. One command runs it: `check:ci` in
the frontends, `check` in the server. That the names differ is drift, and a small
one; unifying them is queued behind the release-gate work rather than done here.

---

## Pull requests

The three frontends carry a `.github/PULL_REQUEST_TEMPLATE.md`; the server does
not yet.

Commit messages say **why**, not what — the diff already says what. A commit that
changes a gate says what it caught, and a commit that adds one says what it was
confirmed to fail against. Several checks in these repositories were green for
weeks while proving nothing, and the habit of writing down the failure is what
stops that repeating.
