# ADR 0005 — The WebSocket contract is typed frames and validated payloads

**Status:** accepted · 2026-09-06
**Applies to:** the whole ecosystem

## Context

[ADR 0004](0004-openapi-is-the-contract.md) covers REST. It does not cover the
two sockets — chat at `/api/live` and topology at `/api/topology` — and OpenAPI
has no vocabulary for them.

So the sockets had no contract at all, and the code said so out loud. From
`topologyEvent.ts` on the server, since the gateway was written:

> Getting a field name wrong here does not fail a build — it makes every event
> look like an unknown entity and the graph quietly stops updating.

Nothing was checking. Both gateways sent `Record<string, unknown>`; all three
clients did `parsed as ServerMessage` and handed the result to a store that
de-duplicates on `eventId` and orders on `sequence` — two fields it had no
assurance were even present. Meanwhile every HTTP response beside them was
validated against a DTO. The socket carried the same domain objects and was
trusted because it was a socket.

The published contract was worse than silent: `TopologyReplayDto.events` was
typed `unknown[]`, so the one object three frontends order and de-duplicate on
appeared in the specification as "an array of anything".

## Decision

Four parts, none of them a schema registry.

**1. Typed frame unions on the server.** `chatProtocol.ts` and
`topologyProtocol.ts` declare each frame as a discriminated union, and `send()`
takes that union instead of `Record<string, unknown>`. Writing them found
undocumented fields — `joined` carries `nextCursor: number | null` and
`latestSequence`, which appeared in no document anywhere.

**2. The event enters the published contract.** `TopologyEventDto` replaced
`@ApiProperty({ type: [Object] }) events!: unknown[]`, so the seven fields the
clients depend on are in `openapi.json` and covered by ADR 0004's checks.

**3. Every frame is validated on arrival, in all three clients.** Chat reuses
`ChatMessageResponseDto` — the same class the history endpoint validates
against, so the two paths cannot drift into disagreeing about the same message.
Topology uses a hand-written validator instead, because the event is a
discriminated union and *the pairing* is what matters: a `NODE_STATUS_CHANGED`
carrying `metrics`, or a status this graph has no meaning for, is precisely the
"payload applied to the wrong table" the server's comment warned about. A flat
DTO cannot express that.

**4. Close codes are shared and mean what their HTTP cousins mean.**
`REALTIME_CLOSE` in `closeCodes.ts` is used by both gateways: 4401
unauthenticated, 4403 forbidden, 4400 protocol, 4429 rate-limited, 4408 slow
consumer. The 4000–4999 range is reserved for the application by RFC 6455, and
the last three digits match the HTTP status on purpose, so a client that learns
what 4429 means on one socket does not have to find out again on the other.

## Why not the alternatives

**AsyncAPI.** The right shape of answer, and too much machinery for two sockets
with nine frame types between them. It would add a generator, a second
specification to keep in sync with the code, and a second drift check — to
describe something a fifty-line discriminated union already describes, in the
language the code is written in.

**Reusing DTOs for topology too.** Tried and rejected in the writing.
`class-validator` on a flat DTO can say `payload` is an object; it cannot say
that *this* `type` implies *that* `payload`, which is the only interesting
question.

**Validating with `validate()` rather than `validateSync()`.** Rejected:
`validate()` returns a promise, and awaiting one per frame lets two frames finish
in the wrong order. Ordering is the one thing the store cannot repair on its own.

## Trade-offs

**What this costs.** A validator per client per socket, six in total, and they
are not generated from anything. A new frame type is six edits plus the server.

**What it buys.** A malformed or misrouted frame is dropped with a reason instead
of entering a store that will not recover. An unknown frame type is *ignored*
rather than fatal — a server that has learned a new frame is ahead of this
client, not broken — and a malformed one is not trusted either.

**What is not covered.** Nothing generates the client validators from the server
types, so the two can disagree. Only the topology event's shape is in
`openapi.json`; the frame envelopes are not.

## Revisit this when

- The frame count grows past what a person will read in one sitting. Nine is
  fine; thirty is a generator.
- A fourth frontend appears — three hand-written validators is a demonstration,
  four is a chore.
