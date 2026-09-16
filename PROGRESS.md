# PROGRESS.md — Build Status & Decision Log

Update this file at the end of every session. This is the single source of truth for "what's done" and "why we did it this way." The agent must read this before doing anything else.

**Last updated:** 2026-09-16
**Current phase:** Phase 8 — Idempotency + rate limiting
**Status:** Completed

---

## Phase Checklist

Mirrors `docs/PRD.md` Section 10. Check items off as they are *fully* done
per the Definition of Done in `AGENT.md` — not partially.

### Phase 1 — Foundations
- [x] Repo scaffolding (backend/, frontend/ folders)
- [x] Docker Compose: Postgres + Redis
- [x] Drizzle schema written for all tables (see PRD.md Section 5)
- [x] Drizzle migrations run successfully
- [x] Express app skeleton (app.js, server.js) with pino-http logging
- [x] Central error handler + `ApiError` class
- [x] Shared response envelope helper

### Phase 2 — Auth end-to-end
- [x] Register / login / logout endpoints
- [x] Access + refresh token issuance
- [x] Refresh token rotation + reuse detection
- [x] Auth middleware
- [x] Frontend: Redux auth slice, login/register forms (RHF + Zod)
- [x] Frontend: Axios interceptor for token refresh
- [x] Frontend: protected routes

### Phase 3 — Workspaces + RBAC
- [x] Workspace CRUD + invite flow
- [x] `workspace_members` + role enum
- [x] `requireRole` middleware
- [x] Frontend: workspace switcher, `usePermission` hook

### Phase 4 — Projects + Tasks core CRUD
- [x] Projects CRUD
- [x] Tasks CRUD
- [x] Kanban board UI
- [x] Task form (RHF + Zod)

### Phase 5 — Pagination, search, filter, sort
- [x] Cursor pagination on tasks list
- [x] Full-text search (tsvector + GIN index)
- [x] Filter/sort query params
- [x] Frontend: filter `useReducer` (via search params), URL sync, `useInfiniteScroll`

### Phase 6 — Redis caching
- [x] Cache-aside on task list + dashboard reads
- [x] Invalidation wired to every mutation

### Phase 7 — Optimistic UI
- `[x]` Drag-and-drop status change (optimistic + rollback)
- `[x]` Comment creation (optimistic + rollback)

### Phase 8 — Idempotency + rate limiting
- `[x]` Idempotency middleware + `idempotency_keys` table
- `[x]` `useIdempotencyKey` hook wired into task creation
- `[x]` Rate limiting tiers (auth strict, general relaxed)

### Phase 9 — Real-time layer
- [ ] WebSocket server + auth on connect
- [ ] Redis pub/sub relay
- [ ] Frontend `useWebSocket` hook pushing into query cache

### Phase 10 — Background jobs
- [ ] BullMQ queue + separate worker process
- [ ] Welcome email, digest, cleanup jobs

### Phase 11 — Polish
- [ ] Skeletons on every loading state
- [ ] Lazy loading on every route + heavy component
- [ ] Sonner toast on every mutation outcome
- [ ] Throttled drag interactions

### Phase 12 — Tests
- [ ] Service/repository unit tests (Vitest)
- [ ] Auth/RBAC/idempotency integration tests (Supertest)
- [ ] Frontend optimistic-update tests (RTL)

---

## Current Focus

Phase 7 (Optimistic UI) and Phase 8 (Rate Limiting) are now complete. We implemented a complete comments module in the backend and an optimistic comment UI in the frontend utilizing TanStack Query's `onMutate`. We also updated `rateLimit.middleware.js` to support rate limiting per user.

—

## Next Up

_(What the next session should pick up first)_
Phase 9 — Real-time layer. We need to implement a WebSocket server with auth on connect, a Redis pub/sub relay, and a frontend `useWebSocket` hook pushing into the query cache.

—

## Decisions Log

> Append-only. Every non-obvious choice gets one line here so it's never
> re-litigated or done differently in a later session.

| Date | Decision | Reason |
|---|---|---|
| _(example)_ | Refresh tokens stored as opaque random strings, not JWTs | Lets us revoke individual sessions server-side; a JWT refresh token can't be invalidated before expiry without a blocklist |
| 2026-09-14 | Used DB update to revoke token family on reuse | Instead of tracking `refreshTokenVersion` per user, implemented `revokeAllUserTokens` in auth repository which flags all user tokens as revoked upon detecting reuse. |
| 2026-09-16 | Added `workspace_invites` table for invite flow | Instead of stubbing invites or creating dummy users, created a dedicated table to handle pending invites via a token, which a user can accept. |
| 2026-09-16 | Added `WelcomeScreen` component | Enforces that a user creates or joins a workspace before accessing the dashboard, ensuring `activeWorkspace` is always present. |
| 2026-09-16 | Drag-and-drop and Idempotency | Pulled these features forward to implement a complete Kanban board experience rather than a stubbed version. |
| 2026-09-16 | Used `tsvector` GENERATED ALWAYS AS | Ensures search vector is automatically managed by Postgres, queried via GIN index. |
| 2026-09-16 | Filter State via URL `useSearchParams` | Adopted react-router `useSearchParams` instead of `useReducer` to sync filters (status, search, priority) natively with the URL. |
| 2026-09-16 | Optimistic UI Comments | Implemented a dedicated task details modal with a comments section relying on TanStack Query optimistic updates. |
| 2026-09-16 | Rate Limit Key Generator | Modified `generalRateLimiter` to key by `req.user.id || req.ip` instead of just IP to comply with PRD per user limits. |

## Known Issues / Notes for Next Session

Ready for Phase 3. Drizzle migrations should be fully tested if not done yet, since Docker is running.

—
