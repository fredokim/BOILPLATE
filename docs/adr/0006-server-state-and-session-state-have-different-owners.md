# ADR 0006 — Server state and session state have different owners

**Status:** accepted · 2026-09-06 (recorded after the fact)
**Applies to:** boilplate-react, boilplate-next, boilplate-vue

## Context

"Which state library" is the wrong question, and asking it produces the usual
answer: one store, everything in it, and a cache reimplemented by hand inside it
— staleness, retry, de-duplication of in-flight requests, invalidation on
mutation. All of that is a cache whether or not it is called one, and a
hand-written one is a cache with bugs.

The real question is what kind of state each thing is.

## Decision

**Two owners, split by who the state belongs to.**

**Server state — anything the backend is the source of truth for — belongs to the
query layer.** React and Next use React Query. It owns fetching, caching,
staleness, retry, and invalidation, because those are properties of *someone
else's* data arriving over a network.

**Session and UI state — anything this tab is the source of truth for — belongs
to the store.** React and Next use Zustand, Vue uses Pinia. In practice this is a
very small amount of state, and the evidence is the file count: React's only
Zustand store is `src/stores/auth.store.ts`, and Next's is `src/stores/ui.store.ts`.

The rule that follows: **a store never holds a copy of a server response.** If it
is in the store and the server also has it, one of them is stale and nothing says
which.

**Vue has no query library at all.** `src/core/api/http-client.ts` is
hand-written, and caching and retry are the application's own. That is a real
divergence, recorded rather than hidden: it is what makes the three-way
comparison honest, since it shows the cost of the decision the other two took.

## Why not the alternatives

**One store for everything.** Reimplements a cache. The parts that look easy —
"just refetch on mount" — are the parts that produce two components fetching the
same endpoint at the same moment.

**The query cache as the only state.** Session state is not a query. An access
token held in a query cache has a staleness policy, a retry policy, and a garbage
collection time, none of which mean anything for a token, and all of which are
one config change from logging the user out.

**Redux.** Not rejected on merit — rejected because the thing it is good at,
predictable transitions over a large shared client-owned state tree, is not what
these applications have. Two stores holding a session and a UI flag do not need
a reducer.

## Trade-offs

**What this costs.** Two mental models in the same codebase, and a boundary
someone has to keep. The failure mode is a component reading a server value out
of the store because it is convenient.

**What it buys.** Server state gets de-duplication, retry with backoff and
invalidation for free and correctly. Session state stays synchronous and simple.

**What is not enforced.** No check fails when a store starts holding a server
response; `CODE_REVIEW_CHECKLIST.md` names it and that is all. This is the
weakest part of the decision and it is stated rather than papered over.

**A related discovery, recorded here because it is the same boundary.** React
Query pauses retries when the tab is hidden — `canContinue()` requires
`focusManager.isFocused()`, so `fetchStatus` becomes `"paused"` and a request
appears to hang forever. That looked exactly like a defect and was reported as
one before it was understood. It is correct behaviour, and it is only surprising
if you think of the query layer as a fetch wrapper rather than as an owner with
its own policy.

## Revisit this when

- Vue's hand-written client grows a cache. At that point it is a query library
  with fewer eyes on it, and TanStack Query for Vue is the obvious answer.
- Client-owned state grows past a handful of stores.
