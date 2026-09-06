# ADR 0008 — The repositories stay separate

**Status:** accepted · 2026-09-06
**Applies to:** the whole ecosystem
**Supersedes nothing.** [ADR 0003](0003-four-repositories-not-one.md) made this
choice before the tooling existed; this re-examines it now that it does.

## Context

ADR 0003 chose four repositories and named the cost: a change spanning the
contract is several pull requests that merge one at a time. That was a
prediction. Nine stages of work later there is a measurement, and the question is
whether the prediction held.

**This is a decision, not a migration.** Nothing moves as a result of it.

### What the multi-repo actually cost, measured

One day of work across the five repositories produced **50 pull requests for 31
distinct changes**. Eleven of those changes — **35%** — had to land in two or
more repositories, and **60% of all pull requests existed only because a change
spanned repositories**.

That is the cost, and it is not small. Every one of those eleven was written
once and applied three times, reviewed three times, and merged three times, with
a window in between where the set was inconsistent.

### What is duplicated, measured

| | lines, per repo | react↔next | react↔vue |
| --- | --- | --- | --- |
| realtime core (11 files) | ~1,300 | 0 differing lines | 0 |
| `check-docs.ts` | 178 | 9 | 0 |
| `release.ts` | 223 | 35 | 13 |
| `check-dependency-size.ts` | 83 | 7 | 7 |
| `check-env-example.ts` | 102 | 2 | 0 |
| `check-bundle-budget.ts` | 46 | 8 | 0 |
| `check-automation.ts` | 64 | 4 | 28 |
| `check-tokens.ts` | 60 | 5 | 55 |
| `check-generators.ts` | 164 | **161** | **162** |

Roughly **2,000 lines per frontend that are 95–100% identical**, three times
over. `check-generators.ts` is the outlier and the interesting one: it is
completely different in each, because it asserts each repository's own feature
contract — which is the shape a genuinely framework-specific tool has.

### The rest of the criteria, measured

**Contract synchronisation** costs one CI job per frontend on every server pull
request: 34s, 44s, 50s. It is the mechanism that makes the separation safe, and
it is cheap.

**CI speed**: 191s, 189s, 184s and 80s, in parallel, per repository. A monorepo
would run the affected subset — faster on a one-repo change, and the same or
slower on the 35% that touch several.

**Shared packages: zero**, deliberately, and no workspaces anywhere.

**Release independence**: four Render services, deployed separately. React, Vue
and the server ship Docker images; Next ships on the Node runtime. No release
waits on another.

**Distribution**: a person clones one repository — 4.5–5.6 MB of history, 322–380
files, 37–53 dependencies — and owns it. `create-fredo-app` clones one frontend,
optionally the server, strips the history, and hands it over.

**Standalone usability**: every frontend runs with no backend at all. That is not
a demo mode; it is how the tests run, and a production build refuses to start on
mock data.

**Generators**: [ADR 0002](0002-two-kinds-of-generator.md) split them. The
in-project ones stay per repository because they encode that repository's
conventions; only the project generator is central.

## The three options

### A. Keep the multi-repo

**For.** A person evaluating Vue clones one repository, runs `npm install`, and
has a working application. Every release is independent. Every repository is
readable end to end without a tooling layer between the reader and the code. The
contract check already makes the risky part safe.

**Against.** ~2,000 lines of near-identical tooling per frontend, and a coordinated
change is three pull requests. Nothing enforces that the second and third ever
land — the parity check covers eleven realtime files and the contract tests cover
the API surface; a convention outside both is on whoever changed it.

**Migration cost.** None.

**Maintenance cost.** Real and recurring: 35% of changes, three times each.

**For the user of the boilerplate.** Best available. One clone, one install, no
concept to learn before the code.

**As a portfolio.** The comparison *is* the artefact. Three implementations of one
application against one backend is what makes "this part is architecture, this
part is React" demonstrable rather than asserted.

### B. Shared repository for tooling and contracts only

Publish the near-identical check scripts and the DTO layer as packages; the four
repositories depend on them.

**For.** Removes most of the measured duplication. The four files that are
0–9 lines apart become one file. A fix to `check-docs.ts` becomes one commit.

**Against, and this is decisive.** It breaks the thing the boilerplates are for.
A cloned repository would depend on a registry entry that must be published and
maintained forever, and the code a reader most needs to see — how a response is
validated, what a gate actually checks — would live somewhere else. The
`DEVELOPMENT_POLICY.md` rejection of shared config packages is the same argument
and it does not weaken when the package contains scripts instead of config.

It also does not remove the coordinated-change cost it is bought for. Of the
eleven cross-repo changes measured, most were *behaviour* — chat ordering,
socket validation, the connection state — not tooling. A shared tooling package
would have collapsed three or four of the eleven, not eleven.

**Migration cost.** A new repository, a publish pipeline, version ranges in four
consumers, and a release process for the shared package. Weeks, and permanent.

**Maintenance cost.** Lower for tooling, higher overall: a version to bump in four
places, and a broken publish that breaks four repositories at once.

**For the user.** Worse. `npm install` now reaches a registry for code that used
to be in the clone.

**As a portfolio.** Neutral to negative. It hides the tooling that is some of the
most interesting work.

### C. One pnpm/Turborepo monorepo

**For.** Every measured cost disappears at once: one pull request per change, one
install, one CI run over the affected subset, no duplication, atomic
cross-repository changes. On the numbers alone this is the winner.

**Against.** The numbers are not alone. A boilerplate exists to be cloned, and a
monorepo cannot be cloned in parts. A person evaluating Vue would clone four
projects, install everyone's dependencies, and read past three applications they
did not ask for. The property that makes a monorepo good — one version of
everything — is the property that makes a boilerplate unusable.

Deployment also stops being simple. Four Render services from one repository
means four build filters and four root directories, and a change to the React
app triggers evaluation of all four.

**Migration cost.** High. Four histories to combine or abandon, four CI workflows
to rewrite, four Render services to reconfigure, the parity and contract checks
to redesign, and `create-fredo-app` to rewrite entirely — it clones repositories,
and there would be none to clone.

**Maintenance cost.** Lowest of the three, genuinely.

**For the user.** Worst. This is the whole argument.

**As a portfolio.** Loses the demonstration. Three implementations in one
repository share a `node_modules`, a lint config and a tsconfig, so "the same
architecture survives three frameworks" stops being provable — of course it
survives, they are the same project.

## Decision

**A. Keep the multi-repo.**

Not because the cost is low — it is measured, and 35% of changes needing three
pull requests is a real tax. It is that **B does not remove enough of it to be
worth what it breaks, and C removes all of it by destroying the thing being
built.**

These repositories are not four services that happen to be separate. They are
four artefacts whose entire purpose is to be cloned individually and owned. Every
argument for consolidation is an argument about the cost to *us*, and every
argument against is about the value to *whoever clones one*. The second is the
point of the project.

The duplication is paid for rather than wished away:

- `realtime:parity` fails when the eleven identical files stop agreeing.
- The contract tests fail when a DTO stops matching the published spec, and the
  server's CI runs all three frontends' contract tests against the specification
  a pull request would produce.
- `DEVELOPMENT_POLICY.md` is the one place the shared baseline is written, so
  four copies of a convention have one source.

## Revisit this when

Any of these becomes true. They are stated as thresholds so the next answer is
also a measurement rather than a mood:

- **A fifth frontend.** Three copies is a demonstration; five is a chore, and
  the duplication scales linearly while the demonstration does not.
- **Cross-repo changes exceed half of all changes** over a sustained period. At
  35% the tax is payable; past 50% the multi-repo is mostly overhead.
- **The frontends stop being independently clonable.** If running one usefully
  requires another, the reason for the split is already gone.
- **A coordinated change lands incompletely and reaches production.** The checks
  exist to prevent this; if one gets through, the process is the problem and the
  tooling cannot fix it.

None of them is true today, and "monorepos are what people do now" is not on the
list.
