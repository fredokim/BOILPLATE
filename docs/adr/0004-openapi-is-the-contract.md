# ADR 0004 — The server's OpenAPI document is the REST contract

**Status:** accepted · 2026-09-06
**Applies to:** the whole ecosystem

## Context

[ADR 0003](0003-four-repositories-not-one.md) put four repositories on the table
and named the cost: a change that spans the contract merges one repository at a
time, and nothing said whether the others still agreed.

What existed instead was three sets of DTO classes, hand-written from reading the
server, validating every response before a view saw it. Careful, and unfalsifiable
— a DTO can be wrong in four different ways and each one fails somewhere far from
the DTO:

- it describes an endpoint the server no longer serves;
- it declares a field the server never sends;
- it requires a field the server marks optional;
- it treats as optional a field the server guarantees.

The third is the one that bites. A response arrives, validation fails, and the
page shows a failure state for a server that answered correctly.

## Decision

**`openapi.json`, generated from the server's decorators, committed to the server
repository, and published at `raw.githubusercontent.com`, is the contract.**

- The server regenerates it on every build and `checkOpenApiDrift` fails when the
  committed file and the code disagree — a byte comparison, not a summary.
- Each frontend has a `dtoConformance` test that reads that document and compares
  **every mapped DTO** to it in the four directions above, plus a coverage ratchet
  so the mapped set cannot quietly shrink.
- Each frontend's `contract:sync` script fetches the document over HTTPS from
  GitHub rather than from a sibling checkout, so a frontend does not need the
  server on disk.
- The server's own CI checks out all three frontends and runs their contract
  tests against the specification the pull request *would* produce.

That last point is what makes it a contract rather than a description: a breaking
change fails in the repository that caused it, before it is merged.

## Why not the alternatives

**Generated client types** (`openapi-typescript` and friends) would remove the
hand-written DTOs entirely. Rejected, for two reasons and one of them is
temporary:

- These DTOs are class-validator classes, and validation is the point. Generated
  TypeScript types vanish at runtime; a response that does not match a type is
  simply wrong data flowing into a view. The DTOs are what stop that.
- `openapi-typescript` still declares `peer typescript@^5.x` and React is on
  TypeScript 6. That is a today problem, not a reason.

**Reading the DTO types rather than the validators.** The conformance test reads
class-validator's metadata storage, not the TypeScript types, because `id!: string`
and `id = ''` are the same type and completely different contracts — the second
lets `plainToInstance` fill a default, so a missing field passes validation. The
types cannot see that. The metadata can.

**A schema registry, or a shared package of DTOs.** Rejected for the reason in
`DEVELOPMENT_POLICY.md`: a boilerplate is cloned and owned, and a DTO package
under someone else's namespace makes the clone not self-contained.

## Trade-offs

**What this costs.** Three copies of every DTO, one per frontend, maintained by
hand. Adding a field to a response means four commits.

**What it buys.** The copies cannot silently disagree with the server, which is
the failure the copies exist to prevent. The check is byte-level in the server
and metadata-level in the frontends; neither can pass by accident.

**What it does not cover.** WebSocket frames are not in the OpenAPI document —
that is [ADR 0005](0005-websocket-contract-by-shared-types.md). Error *semantics*
beyond the envelope shape are documented, not checked.

## Revisit this when

- A frontend moves to TypeScript where generation is available *and* generation
  can produce runtime validators, not just types.
- The number of DTOs makes hand-maintenance the dominant cost. The ratchet in the
  conformance test measures the mapped set, so this is observable rather than a
  feeling.
