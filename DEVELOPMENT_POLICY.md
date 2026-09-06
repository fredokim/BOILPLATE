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

## Documentation

**One layout, four repositories.** Everything except the README lives under
`docs/`, sorted by what it is for rather than what it is about:

| | |
| --- | --- |
| `docs/architecture/` | what the boundaries are and why |
| `docs/api/` | the contract with the backend |
| `docs/development/` | how to work in the repository |
| `docs/deployment/` | how it runs in production |
| `docs/history/` | records of a past state, kept rather than maintained |

A guide that belongs beside the code it describes stays there — Vue's atomic
components, stores and analytics folders each have their own README, and moving
those into `docs/` would separate them from the thing a reader is looking at.

**Two rules the check enforces, and one it does not.**

`check:docs` fails when a relative Markdown link does not resolve, and when a
document cannot be reached by following links from the README. The second is the
one that mattered: before it, each frontend had twenty-two documents in its root
that linked to each other zero times, listed in the README as backticked
filenames. Every one was unreachable, and "is this still true?" had no reader.

What it deliberately does not check is what a document *says*. `check:ai` used to
assert that `AI_WORKFLOW.md` contained the string "Developer-Owned Decisions", so
renaming that heading to something clearer failed CI while replacing the
section's contents with nonsense passed. It also asserted that `package.json`
contained `"check:ai"` — a check whose remaining job was to notice its own
removal. It is deleted in all three frontends. **A check that pins prose makes
documentation worse and calls it quality.**

**Historical documents are exempt from reachability, not from links.** A record
of a past layout is supposed to describe that layout, and holding it to today's
paths would destroy the thing it is for. It should still not offer a link that
goes nowhere. Anything outside `docs/history/` opts out with
`<!-- doc-check: historical -->`, which is a deliberate act rather than an entry
in a list somewhere else.

### Consolidation candidates

Recorded rather than acted on, because merging documents is a judgement about
audience and the overlap below is real but not total.

**The boundary rules are stated three times in every frontend.**
`AI_DEVELOPMENT_GUIDE.md` states them as instructions to an implementer,
`CODE_REVIEW_CHECKLIST.md` as questions for a reviewer, and `CONTRIBUTING.md` as
steps for a contributor. Same rules, three phrasings, and until this stage no
links between them — so they could drift apart without anyone noticing. The
candidate is one rules document that the other two link into for their own
framing.

**`AI_WORKFLOW.md` and `AI_DEVELOPMENT_GUIDE.md` overlap on where AI may draft
and where the developer decides.** The first is the policy, the second is the
implementation rules; the boundary between them is not obvious from either.

**`DESIGN_RATIONALE.md` and `ARCHITECTURE.md` both explain why the boundaries
are where they are**, the first as narrative and the second as rules. Keeping
both is defensible; keeping both without cross-links was not, and they are
linked now.

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

## The release gate

**`npm run release` in each repository answers one question: is this ready to
ship.** It runs every gate, names each one, and prints a summary. `--quick`
skips the heavy ones for the local loop.

It adds no checking. Every gate was already an npm script; what it adds is an
order, a name, and a report — and it is the same list CI runs, so the two cannot
drift into disagreeing about what green means. They already had: React's CI ran
fourteen steps while `check:ci` chained thirteen, and `check:tokens`,
`check:docs` and `check:generators` were in the chain and not in the workflow.
The token gate and the generator gate never ran on a pull request.

**It does not stop at the first failure.** A `&&` chain does, and buries which
of thirteen commands it was in several hundred lines of output. That is not
hypothetical — moving the documents into `docs/` broke `check:deps`, and the
chain printed a table of package sizes and an accusation about `hls.js` with no
hint that the ninth step was the one that failed. One run should tell you
everything that is wrong.

**A skipped gate is a result, not a pass.** A gate whose tool is missing —
Docker, a database, a browser — reports `skipped` with the reason and the
summary refuses to say "ready". Reporting readiness from a run where four gates
never executed is the failure this whole ecosystem is built against.

### The lists are not the same, deliberately

| | react | next | vue | server |
| --- | --- | --- | --- | --- |
| bundle budget, Storybook | ✓ | ✓ | ✓ | — |
| generated design tokens | ✓ | ✓ | ✓ + SCSS | — |
| OpenAPI drift | — | — | — | ✓ |
| Prisma schema and migrations | — | — | — | ✓ |
| production image | ✓ | — | ✓ | ✓ |

Next has no image gate because it deploys on Render's Node runtime rather than
from a Dockerfile, so there is no image to build; the equivalent question —
whether `npm run start` serves the application and whether the backend's address
stayed out of the client bundle — is its `runtime` job in CI. Forcing the four
to run the same gates would mean checking things that do not exist, or dropping
the ones that matter most.

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
