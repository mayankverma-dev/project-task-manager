# PROGRESS.md — Build Status & Decision Log

Update this file at the end of every session. This is the single source of truth for "what's done" and "why we did it this way." The agent must read this before doing anything else.

**Last updated:** _(update this each session)_
**Current phase:** Phase 1 — Foundations
**Status:** Not started

---

## Phase Checklist

Mirrors `docs/PRD.md` Section 10. Check items off as they are *fully* done
per the Definition of Done in `AGENT.md` — not partially.

### Phase 1 — Foundations
- [ ] Repo scaffolding (backend/, frontend/ folders)
- [ ] Docker Compose: Postgres + Redis
- [ ] Drizzle schema written for all tables (see PRD.md Section 5)
- [ ] Drizzle migrations run successfully
- [ ] Express app skeleton (app.js, server.js) with pino-http logging
- [ ] Central error handler + `ApiError` class
- [ ] Shared response envelope helper

### Phase 2 — Auth end-to-end
- [ ] Register / login / logout endpoints
- [ ] Access + refresh token issuance
- [ ] Refresh token rotation + reuse detection
- [ ] Auth middleware
- [ ] Frontend: Redux auth slice, login/register forms (RHF + Zod)
- [ ] Frontend: Axios interceptor for token refresh
- [ ] Frontend: protected routes

### Phase 3 — Workspaces + RBAC
- [ ] Workspace CRUD + invite flow
- [ ] `workspace_members` + role enum
- [ ] `requireRole` middleware
- [ ] Frontend: workspace switcher, `usePermission` hook

### Phase 4 — Projects + Tasks core CRUD
- [ ] Projects CRUD
- [ ] Tasks CRUD
- [ ] Kanban board UI
- [ ] Task form (RHF + Zod)

### Phase 5 — Pagination, search, filter, sort
- [ ] Cursor pagination on tasks list
- [ ] Full-text search (tsvector + GIN index)
- [ ] Filter/sort query params
- [ ] Frontend: filter `useReducer`, URL sync, `useInfiniteScroll`

### Phase 6 — Redis caching
- [ ] Cache-aside on task list + dashboard reads
- [ ] Invalidation wired to every mutation

### Phase 7 — Optimistic UI
- [ ] Drag-and-drop status change (optimistic + rollback)
- [ ] Comment creation (optimistic + rollback)

### Phase 8 — Idempotency + rate limiting
- [ ] Idempotency middleware + `idempotency_keys` table
- [ ] `useIdempotencyKey` hook wired into task creation
- [ ] Rate limiting tiers (auth strict, general relaxed)

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

_(What's actively being worked on right now — update at start/end of each session)_

—

## Next Up

_(What the next session should pick up first)_

—

## Decisions Log

> Append-only. Every non-obvious choice gets one line here so it's never
> re-litigated or done differently in a later session.

| Date | Decision | Reason |
|---|---|---|
| _(example)_ | Refresh tokens stored as opaque random strings, not JWTs | Lets us revoke individual sessions server-side; a JWT refresh token can't be invalidated before expiry without a blocklist |

## Known Issues / Notes for Next Session

_(Anything left rough, any blocker, any "come back to this")_

—
