# ADR 0007 — The refresh token is a cookie, so the browser must see one origin

**Status:** accepted · 2026-09-06 (recorded after the fact)
**Applies to:** the whole ecosystem

## Context

A refresh token is a long-lived credential. Where it is stored decides what an
XSS bug costs.

`localStorage` is readable by any script on the page, so one injected script
takes a credential that outlives the session. Keeping it in memory survives XSS
no better and does not survive a reload. Neither is acceptable for the token that
can mint new access tokens.

## Decision

**The refresh token is an HttpOnly cookie the browser cannot read, and the access
token lives in memory.**

- `rb_refresh`, `HttpOnly`, `sameSite: lax`, `Secure` in production —
  configuration validation *refuses to start* in production with
  `COOKIE_SECURE=false`. It is set on login and rotated on refresh, and **never
  appears in a response body**.
- The access token is short-lived, returned in the body, and held in memory. A
  leaked one expires by itself.
- `JWT_SECRET` has no default and must be at least 32 characters. A fallback
  would ship as a real secret in every deployment that forgot to change it.

**The consequence is architectural, not incidental: `sameSite: lax` means the
cookie does not travel cross-origin, so the browser must see one origin.** That
is a requirement, not a deployment preference, and each repository satisfies it
differently:

- **React and Vue** are static bundles behind Caddy, which reverse-proxies `/api`
  to `{$BACKEND_ORIGIN}`. In development, Vite's dev-server proxy does the same
  through `VITE_API_TARGET`.
- **Next** forwards through its own route handlers under `src/app/api`. This is
  why `BACKEND_URL` has **no** `NEXT_PUBLIC_` prefix: with one, the address would
  be inlined into the browser bundle and the browser *could* call the backend
  directly — which is exactly the cross-origin call the cookie would not survive.

**Refresh is single-flight.** All three repositories have a
`refreshSingleFlight` module, because a page that fires five requests into an
expired token must send one refresh, not five. Five refreshes against a rotating
token means four of them present a token that has already been replaced.

## Why not the alternatives

**Both tokens in `localStorage`.** Simple, works cross-origin, and hands a
persistent credential to any injected script.

**Both tokens in memory.** Loses the session on every reload.

**A bearer refresh token sent cross-origin with CORS.** Possible, and it moves
the credential back into JavaScript's reach, which is the thing being avoided.

**`sameSite: none`.** Would allow the cross-origin call, and requires `Secure`
plus a much wider CSRF surface. `lax` plus one origin is a smaller thing to get
right.

## Trade-offs

**What this costs.** Every deployment needs a proxy, which is real infrastructure
and a real failure mode — the browser reaching the backend directly *works* for
plain requests and silently fails to refresh, which looks like random logouts. It
also puts a second thing in the request path.

**What it buys.** An XSS bug costs an access token with a short lifetime rather
than a credential that can mint new ones indefinitely.

**Where it is enforced.** Production config validation rejects
`COOKIE_SECURE=false`. Next's `assertDataModeMatches` refuses a build where
`BACKEND_URL` is set and `NEXT_PUBLIC_DATA_MODE` is not, because that combination
is a browser building mock transports against a live backend. The Caddy proxy
itself is not checked by anything — a deployment that skips it fails at runtime,
in the way described above.

## Revisit this when

- The frontends and the API must live on genuinely different origins. That is a
  different design, not a config change.
- A refresh-token-rotation replay is detected in practice, which would mean the
  single-flight guard is not enough on its own.
