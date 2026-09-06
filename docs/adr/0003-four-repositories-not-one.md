# ADR 0003 — Four repositories, not one

**Status:** accepted · 2026-09-06 (recorded after the fact)
**Applies to:** the whole ecosystem

## Context

The backend began as `react-boilerplate/server/`. When the Vue and Next
boilerplates were built against the same API, that address stopped being true:
two of the three consumers had to reach into a third repository to find the thing
they depended on, and the one that owned it had no reason to treat the other two
as customers.

The choice at that point was a monorepo, a single repository with three frontends
side by side, or four repositories.

## Decision

**Four repositories.** The server was extracted from `react-boilerplate/server/`
**with its history** and lives at `boilplate-server`; each frontend is its own
repository and reaches the backend over HTTP.

## Why not the alternatives

**A monorepo** is the obvious answer and the wrong one here, for a reason
specific to what these repositories are. A boilerplate exists to be cloned. A
person evaluating Vue clones the Vue one and runs it; in a monorepo they clone
four projects, three of which are noise, and the install is everyone's
dependencies at once. The thing that makes a monorepo good — one version of
everything, one install, atomic cross-project changes — is the thing that makes
a boilerplate unusable.

**One repository with three frontends** has the same problem with none of the
monorepo tooling that would make it bearable.

## Trade-offs, stated plainly

**What this costs.** A change that spans the contract is three or four pull
requests instead of one, and they merge one at a time, so there is a window where
the set is inconsistent. Nothing enforces that the second and third ever land.

**What was built to pay for it.** The cost is real, so it is measured rather than
hoped away:

- the server's CI runs all three frontends' contract tests against the
  specification a pull request *would* produce, so a breaking change fails in the
  repository that caused it — see [ADR 0004](0004-openapi-is-the-contract.md);
- `npm run realtime:parity` reports when the duplicated realtime core stops
  agreeing — see [ADR 0001](0001-realtime-core-stays-duplicated.md);
- `DEVELOPMENT_POLICY.md` is the one place the shared baseline is written down,
  because four copies of a convention drift and one document does not.

**What is still unpaid.** Nothing checks that a coordinated change landed
everywhere. The parity check catches it for eleven realtime files and the
contract tests catch it for the API surface; a shared convention outside both is
on whoever changed it.

## Revisit this when

- The frontends stop being independently clonable — if running one usefully
  requires the others, the reason for the split is gone.
- The number of repositories that must change together grows past four.
  [Stage 10](../../README.md) re-examines the monorepo question deliberately
  rather than by drift.
