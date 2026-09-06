# ADR 0001 — The realtime core stays duplicated

**Status:** accepted · 2026-09-06
**Applies to:** boilplate-react, boilplate-next, boilplate-vue

## Context

Stage 5 of the refactor asked three questions in a row: what realtime logic is
shareable across the three frontends, whether a framework-independent transport
core could be split out from framework-specific adapters, and how to leave the
structure ready for extraction without extracting anything.

The first two turned out to be answerable by measurement rather than by design.

**What is shared.** Eleven files, roughly 1,300 lines, exist in all three repos:

| | |
| --- | --- |
| `chat/realtime/chatController.ts` | backoff with jitter, cold vs. warm reconnect base, `waitForServer` gating, hidden-tab flush cadence, `suspend`/`resume`, connection-state fan-out |
| `chat/realtime/chatStore.ts` | dedup on `id`, ordering on `sequence`, retention, pending buffer, flush batching, diagnostics |
| `chat/realtime/chatTransport.ts`, `chat/realtime/types.ts` | the interfaces and the connection-state vocabulary |
| `chat/realtime/mockChatTransport.ts` | the demo-mode transport |
| `visual-graph/realtime/controller.ts` | the same controller, plus snapshot resync |
| `visual-graph/realtime/runtimeStore.ts` | dedup on `eventId`, ordering on `sequence`, snapshot/delta merge |
| `visual-graph/realtime/transport.ts`, `types.ts`, `mockTransport.ts` | as above |
| `visual-graph/realtime/serverTopologyFrame.ts` | the frame validator |

Normalise line endings and quote style — both settled per-repo conventions — and
**all eleven are character-for-character identical in all three repos.** They were
not quite, when first measured: an em dash in one repo where two had `--`,
`Unsubscribe` in one signature where two wrote `() => void`, two fields declared
in a different order. Nothing that changes behaviour, and nothing that anything
would have caught.

**Where the framework boundary is.** Not one of those eleven files imports React,
Vue, Next, Pinia, or a query library. They import `setTimeout`, `setInterval`,
their own siblings, and — in four of them — a type-only `../model/chatMessage`.
The framework appears in exactly one file per feature, one directory up:
`useTopologyRealtime.ts` and the chat hook, each about a hundred lines of
subscribe-and-render for its own framework.

So the split the question asked us to assess is not a design problem. It already
exists, as a directory boundary. It is simply not a package boundary.

## Decision

**Do not extract a package. Check that the copies stay identical instead.**

`DEVELOPMENT_POLICY.md` already rejected shared config packages, and the same
reasoning applies with more force here. These repos exist to be cloned and run
by someone evaluating one framework. A `@fredo/realtime-core` dependency means
that person cannot read the code that matters without leaving the repo, cannot
change it without publishing, and cannot run the repo at all if the registry is
unreachable. The duplication is not an accident the architecture is working
around — it is the demonstration: the same design, transplanted three times,
arriving at the same file.

What was missing is not a package. It is anything that notices when the three
copies stop agreeing. `npm run realtime:parity` in this repo is that: it reads
the eleven files from all three checkouts, normalises line endings and quotes,
and reports any file whose three copies do not match.

It runs here rather than in each frontend's CI. A coordinated change lands as
three PRs that merge one at a time, so a per-repo gate would be red for the
second and third by design, and a gate that is expected to fail is one people
learn to ignore. Running it centrally — on push, on PR, and nightly — means it
is red for exactly as long as the set is genuinely inconsistent.

The list of shared files is explicit rather than a directory sweep.
`serverChatTransport.ts` and `serverTopologySource.ts` sit in the same folders
and are deliberately absent: they speak to each repo's own HTTP client and token
storage, so they differ for a reason. A sweep would have to carry an exclusion
list, and exclusion lists rot silently.

## Consequences

- A change to realtime behaviour is three commits, not one. That was already
  true; it is now visible when only one or two of them land.
- The eleven files are now a stated contract. Adding a twelfth means adding it to
  `scripts/check-realtime-parity.ts`, which is the moment to ask whether it
  belongs in all three at all.
- The cosmetic differences were normalised so the baseline is zero. Type-level
  and comment-level only — no behaviour changed — done specifically so a
  divergence report means something.

## Revisit this when

- A fourth frontend is added. Three copies is a demonstration; four is a chore.
- Any of the eleven files needs to diverge for a real reason. That is the signal
  the shared core has a framework-shaped seam in it after all, and the file
  should leave the list with a note rather than be forced back into agreement.
- The realtime core grows past what a reader will read. The argument for
  duplication is that the code is right there and legible; it stops holding when
  "right there" is four thousand lines.
