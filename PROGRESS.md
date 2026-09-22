# PROGRESS.md — Build Status & Decision Log

Update this file at the end of every session. This is the single source of truth for "what's done" and "why we did it this way." The agent must read this before doing anything else.

**Last updated:** 2026-09-16
**Current phase:** Phase 11 — Polish
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
- `[x]` WebSocket server + auth on connect
- `[x]` Redis pub/sub relay
- `[x]` Frontend `useWebSocket` hook pushing into query cache

### Phase 10 — Background jobs
- [x] BullMQ queue + separate worker process
- [x] Welcome email, digest, cleanup jobs

### Phase 11 — Polish
- [x] Skeletons on every loading state
- [x] Lazy loading on every route + heavy component
- [x] Sonner toast on every mutation outcome
- [x] Throttled drag interactions

### Phase 12 — Tests
- [ ] Service/repository unit tests (Vitest)
- [ ] Auth/RBAC/idempotency integration tests (Supertest)
- [ ] Frontend optimistic-update tests (RTL)

---

## Current Focus

Phase 11 (Polish) is now complete. Built and wired shimmer skeleton components (`TaskCardSkeleton`, `CommentSkeleton`, `KanbanBoardSkeleton`, `MemberRowSkeleton`, `DashboardStatSkeleton`, `ProjectListSkeleton`) plus a two-pane `PageLoadingSkeleton` route fallback. Converted `WorkspaceDashboard` and `WorkspaceMembers` to `React.lazy()` — the build now emits 7 separate lazy chunks. Added `useThrottle` + `useThrottledCallback` hook from scratch; wired into `KanbanBoard.onDragEnd` at 300ms. Added missing sonner toasts to `useOptimisticTaskUpdate` (success + error), `useCreateComment` (success), and confirmed `AcceptInviteScreen` already covered. Build passes cleanly: 2100 modules, 0 errors.

**Recent Backend Additions:** 
Fully implemented the previously missing `attachments` and `notifications` backend modules, adding routes, controllers, services, repositories, and Multer-based local storage handling. Fixed a role-checking bug in the comments controller to ensure proper authorization for comment deletion.

—

## Next Up

_(What the next session should pick up first)_
Phase 12 — Tests. Vitest unit tests for services/repositories, Supertest integration tests for auth/RBAC/idempotency, React Testing Library tests for the optimistic-update flows.

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
| 2026-09-16 | Real-time Cache Invalidations | Instead of manual `setQueryData` array manipulations for cursor paginated queries on WebSocket events, opted for `invalidateQueries` to ensure cache safety and correctness while retaining instant "live" updates. |
| 2026-09-16 | Dedicated IORedis connections for BullMQ | BullMQ prohibits sharing a Redis connection with cache/pub-sub. Created `src/config/bullmq.js` factory that produces a fresh `IORedis` instance (with `maxRetriesPerRequest: null`) per Queue/Worker. |
| 2026-09-16 | Digest cron fans out from a single job | Instead of enqueuing per-user digest jobs, a single `notification_digest_cron` job queries all users with unread 24h notifications and sends each email sequentially. Avoids queue flooding. |
| 2026-09-16 | Nodemailer fail-open in dev | If SMTP env vars are absent, `mailer.js` logs a warning and skips the send instead of throwing. Worker process never crashes due to missing email config. |
| 2026-09-16 | welcome_email enqueue is best-effort | Wrapped `emailQueue.add()` in try/catch in `auth.service.register()` so a Redis outage never surfaces as a 500 on the register endpoint. |
| 2026-09-16 | Workspace invite email via BullMQ | Added `workspace_invite_email` job to emailWorker. `workspacesService.inviteMember()` now enqueues the job (best-effort) after creating the DB invite. Controller no longer returns the raw token — invite link is delivered via real email. |
| 2026-09-16 | Local Skeleton primitive instead of shadcn | `src/components/ui/` didn't exist and shadcn's Skeleton isn't in package.json. Created a minimal local `Skeleton` base component matching the shadcn pattern; avoids installing a full shadcn setup just for one primitive. |
| 2026-09-16 | useThrottledCallback leading-edge only | For drag-and-drop, leading-edge throttle gives instant feedback on the first drop; subsequent drops within 300ms are dropped. Trailing-edge would delay the visual confirmation unnecessarily. |
| 2026-09-16 | WorkspaceDashboard + WorkspaceMembers converted to lazy | These were the only two route-level components still eagerly imported. Build now emits 7 separate lazy chunks. WelcomeScreen already lazy from a prior session. |
| 2026-09-16 | useOptimisticTaskUpdate toast is low-noise | Success toast is brief ("Task updated.") rather than verbose. Drag-and-drop happens frequently; a long toast would be distracting. Error toast is explicit ("Failed to move task — changes rolled back.") so users understand the rollback. |
| 2026-09-22 | Implemented Attachments and Notifications Backend | The DB schema had tables for `attachments`, `notifications`, and `activity_logs`, but no logic existed. Created endpoints, services, repositories, and used `multer` for local file storage in the `uploads/` directory, exposing it statically. |
| 2026-09-22 | Fixed Comments Deletion Authorization | Standard members couldn't delete comments because `req.user.role` was checked instead of the correct `req.userRole` provided by the RBAC middleware. Corrected the controller logic. |
## Known Issues / Notes for Next Session

Ready for Phase 3. Drizzle migrations should be fully tested if not done yet, since Docker is running.

—
