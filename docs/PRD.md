# Project-Task-Manager — Collaborative Project & Task Management Platform

## A single, complete, production-shaped learning project

---

## 1. Why This Project

Need one domain that is rich enough to naturally require *every* feature to cover in full stack (Nodejs Express, React, PostgreSQL, Redis) with more advance features and professional coding standards. This **Jira/Linear/Trello-style team task manager** does that:

- Multiple users, multiple teams → **RBAC** is unavoidable.
- Task lists that grow → **pagination, search, filter, sort, caching**.
- Drag-and-drop status changes, instant comments → **optimistic UI**.
- Repeated task creation on flaky networks → **idempotency**.
- Multi-tenant workspaces → **auth, sessions, rate limiting**.
- Dashboards → **Redis caching, background jobs**.
- Everything else (shimmer, lazy loading, debouncing) falls out naturally from a real UI with real lists and real forms.

It is scoped enough to finish, and every "advanced" feature has an honest reason to exist rather than being decorative.

---

## 2. Core Concept

**Project-Task-Manager**: Users create **Workspaces** → each Workspace has **Projects** → each Project has **Tasks** (Kanban-style: Todo / In Progress / In Review / Done) → Tasks have **Comments**, **Attachments**, **Assignees**, **Priorities**, **Due Dates**. Workspace members have roles (Owner, Admin, Member, Viewer) that gate what they can do. Users get **real-time notifications** when assigned, mentioned, or commented on.

This is deliberately close to Jira/Linear/Trello because those are the products whose engineering patterns are the industry standard you're trying to learn.

---

## 3. Full Tech Stack Mapping (nothing decorative — every package has a job)

### Backend

| Package | Exact Role |
|---|---|
| Node.js + Express | HTTP server, routing, middleware pipeline |
| Drizzle ORM + Postgres | Schema, migrations, type-safe queries |
| Redis (ioredis) | Cache-aside for reads, rate-limit store, idempotency store, BullMQ backend, pub/sub for WebSocket scaling |
| Zod | Request validation (body/query/params), env variable validation |
| Pino + pino-http | Structured JSON logging, request-id correlation |
| jsonwebtoken | Access + refresh token signing/verification |
| bcrypt / argon2 | Password hashing |
| express-rate-limit + rate-limit-redis | Distributed rate limiting |
| BullMQ | Background jobs (emails, notification digests) |
| ws or socket.io | Real-time task/notification updates |
| multer + sharp (or S3 SDK) | File uploads, avatar/attachment processing |
| helmet, cors, compression | Standard hardening middleware |
| vitest + supertest | Unit + integration testing |

### Frontend

| Package | Exact Role |
|---|---|
| React + Vite + JavaScript | App shell, dev server, build |
| React Router v6 | Routing, protected/role-gated routes, lazy-loaded route chunks |
| TanStack Query | Server state, caching, pagination, infinite scroll, optimistic mutations |
| Axios | HTTP client with interceptors (auth refresh, logging, idempotency headers) |
| Redux Toolkit | Global **session/auth** state, cross-cutting app state (current workspace, permissions) |
| Zustand | Lightweight **UI** state (modals, sidebar, drag state, theme) — deliberately separate from Redux so you learn *when* to use which |
| Context API | Scoped state that doesn't belong globally (Theme provider, WebSocket connection provider) |
| useState / useReducer | Local component state; useReducer specifically for the task filter builder and multi-step forms |
| useRef | Debounce timers, focus management, tracking previous values, uncontrolled inputs |
| useEffect + custom hooks | Data sync, subscriptions, side effects |
| React Hook Form + Zod resolver | All forms (login, register, task create/edit, comments) |
| TailwindCSS + shadcn/ui | Styling system + accessible component primitives |
| sonner | Toast notifications (success/error/loading) |

Custom hooks you will build (all real, all used):
`useAuth`, `usePermission`, `useDebounce`, `useThrottle`, `useInfiniteScroll`, `useWebSocket`, `useLocalStorage`, `useIdempotencyKey`, `useOptimisticTaskUpdate`.

---

## 4. System Architecture

```
                        ┌────────────────────┐
                        │      Frontend       │
                        │  React + Vite (SPA) │
                        └─────────┬───────────┘
                                  │ HTTPS (Axios)
                                  ▼
                     ┌────────────────────────┐
                     │   Express API Gateway   │
                     │  helmet/cors/pino-http  │
                     │  rate-limit middleware  │
                     └───────────┬─────────────┘
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
        ┌────────────┐  ┌───────────────┐  ┌─────────────┐
        │ Controllers │→│   Services     │→│ Repositories │
        └────────────┘  └───────┬───────┘  └──────┬──────┘
                                 │                  │
                     ┌───────────┘                  ▼
                     ▼                        ┌────────────┐
              ┌─────────────┐                 │  Postgres  │
              │    Redis     │                 │ (Drizzle)  │
              │ cache/limit/ │                 └────────────┘
              │ idempotency/ │
              │ BullMQ queue │
              └──────┬───────┘
                     ▼
              ┌─────────────┐
              │  Worker proc │ (BullMQ consumer: emails, digests)
              └─────────────┘

        WebSocket server (attached to Express/HTTP server,
        Redis pub/sub backing for multi-instance scaling)
```

**Layering rule (backend):** Controller (parses req, calls service, shapes response) → Service (business logic, orchestrates repositories + cache) → Repository (Drizzle queries only, no business logic). This is the layering used in most real Node backends and it's what makes the codebase testable.

---

## 5. Database Schema (Drizzle / Postgres)

```
users
  id (uuid, pk)
  name
  email (unique)
  password_hash
  avatar_url
  refresh_token_version (int, default 0)   -- bump to invalidate all sessions
  created_at, updated_at

workspaces
  id (uuid, pk)
  name
  slug (unique)
  owner_id (fk -> users.id)
  created_at

workspace_members
  id (uuid, pk)
  workspace_id (fk)
  user_id (fk)
  role (enum: owner | admin | member | viewer)
  joined_at
  unique(workspace_id, user_id)

projects
  id (uuid, pk)
  workspace_id (fk)
  name
  description
  created_by (fk -> users.id)
  created_at

tasks
  id (uuid, pk)
  project_id (fk)
  title
  description
  status (enum: todo | in_progress | in_review | done)
  priority (enum: low | medium | high | urgent)
  assignee_id (fk -> users.id, nullable)
  due_date (nullable)
  position (float)         -- for drag-and-drop ordering
  created_by (fk)
  created_at, updated_at

comments
  id (uuid, pk)
  task_id (fk)
  user_id (fk)
  body
  created_at, updated_at

attachments
  id (uuid, pk)
  task_id (fk)
  url, filename, mime_type, size
  uploaded_by (fk)
  created_at

activity_logs
  id (uuid, pk)
  workspace_id (fk)
  entity_type, entity_id
  action (e.g. "task.status_changed")
  actor_id (fk)
  metadata (jsonb)
  created_at

notifications
  id (uuid, pk)
  user_id (fk)
  type (e.g. "assigned" | "mentioned" | "commented")
  payload (jsonb)
  read_at (nullable)
  created_at

refresh_tokens
  id (uuid, pk)
  user_id (fk)
  token_hash
  user_agent, ip
  expires_at
  revoked_at (nullable)
  replaced_by_id (nullable, fk -> self)   -- for rotation/reuse detection
  created_at

idempotency_keys
  id (uuid, pk)
  key (the client-supplied Idempotency-Key)
  user_id (fk)
  endpoint
  request_hash              -- hash of request body, to detect key reuse with different payload
  response_status
  response_body (jsonb)
  created_at, expires_at
  unique(user_id, key, endpoint)
```

Indexes to add deliberately (for learning): `tasks(project_id, status)`, `tasks(project_id, position)`, Postgres full-text/trigram index on `tasks(title, description)` for search, `activity_logs(workspace_id, created_at)` for feeds.

---

## 6. Feature-by-Feature Implementation Spec

### 6.1 Authentication (Access + Refresh Tokens)
- On login: issue **access token** (JWT, 15 min, sent in response body, held in memory/Redux — never localStorage) and **refresh token** (opaque random string, hashed and stored in `refresh_tokens`, set as `httpOnly, Secure, SameSite=Strict` cookie, 7–30 days).
- `POST /auth/refresh`: verifies cookie token against hash in DB, **rotates** it (issues new token, marks old as `revoked_at`, links via `replaced_by_id`), issues new access token. If a revoked token is presented again → reuse detected → revoke entire token family, force re-login (this is the real-world pattern, not a toy).
- Axios response interceptor: on 401, calls `/auth/refresh` once, retries original request; if refresh fails, logs out and redirects.
- Logout: revoke refresh token, clear cookie.

### 6.2 RBAC
- Roles scoped **per workspace**: `owner > admin > member > viewer`.
- Backend: `requireRole(minRole)` middleware reads `workspace_members` for the authenticated user + `:workspaceId` param, compares role rank, 403s if insufficient.
- Frontend: `usePermission(action)` hook reads the current workspace membership from Redux and returns booleans (`canEditTask`, `canInviteMember`, etc.) to conditionally render/disable UI — but the backend check is the source of truth, frontend is only UX.

### 6.3 Redis Caching
- Cache-aside pattern for expensive/frequent reads: workspace dashboard stats, task list per project+filter combination.
- Key scheme: `cache:project:{projectId}:tasks:{hash of query params}`.
- On any task mutation (create/update/delete/status change), invalidate by deleting all keys matching `cache:project:{projectId}:tasks:*` (via `SCAN`, not `KEYS`, in production style).
- TTL as a safety net (e.g. 60s) even if invalidation is correct, to bound staleness.

### 6.4 Pagination
- Task lists inside a project: **cursor-based** pagination (`?cursor=<lastPosition>&limit=20`) — powers TanStack Query's `useInfiniteQuery` for infinite scroll in the Kanban/list view.
- Admin-style tables (workspace members list, activity log): **offset-based** (`?page=1&pageSize=20`) — simpler, fine for bounded lists, teaches the trade-off between the two approaches.

### 6.5 Search, Filtering, Sorting
- `GET /projects/:id/tasks?search=&status=&priority=&assignee=&sortBy=&sortOrder=`
- Search: Postgres full-text search (`tsvector` column + GIN index) on title/description.
- All filters combine as AND conditions built dynamically in the repository layer via Drizzle's query builder.
- Frontend: filter state lives in a `useReducer` (filter builder) synced to the URL query string (so filtered views are shareable/bookmarkable), which becomes the TanStack Query key.

### 6.6 Throttling & Debouncing (frontend)
- **Debounce**: the task search box — `useDebounce(searchTerm, 400ms)` before it feeds the query key, so you're not firing a request per keystroke.
- **Throttle**: a `useThrottle` hook on high-frequency events — e.g. drag-move position updates while reordering a Kanban column (update local UI every event, but throttle the "save new position" network call to once per 300ms).

### 6.7 Lazy Loading & Code Splitting
- Every route is `React.lazy(() => import(...))` wrapped in `<Suspense>` with a route-level shimmer fallback.
- Heavy components (rich text editor for task descriptions, charts on the dashboard) are also lazy-loaded independent of route.

### 6.8 Shimmer / Skeleton UI
- shadcn/ui-styled skeleton components matching the exact shape of the real content (task card skeleton, comment skeleton, dashboard stat skeleton) shown while TanStack Query's `isLoading` is true — never a generic spinner for list content.

### 6.9 Optimistic UI
- Two concrete flows:
  1. **Task status change (drag-and-drop)**: on drop, immediately update the TanStack Query cache (`onMutate`), fire the PATCH request, roll back via `onError` if it fails, and show a sonner error toast.
  2. **Adding a comment**: comment appears instantly (marked "sending…"), replaced with the server-confirmed version on success, removed with an error toast on failure.

### 6.10 Idempotency
- Any mutating POST that could be retried by a flaky client (task creation, invite-member) requires a client-generated `Idempotency-Key` header (UUID, generated once per user action via `useIdempotencyKey`, persisted for the lifetime of that form submission attempt including retries).
- Backend middleware: look up `(user_id, key, endpoint)` in `idempotency_keys`. If found and request body hash matches → return the stored response (no re-execution). If found with a different body hash → 409 conflict. If not found → execute, store the response, return it.

### 6.11 Rate Limiting
- Redis-backed sliding window via `rate-limit-redis`, applied in tiers:
  - Auth endpoints (`/auth/login`, `/auth/register`): strict, e.g. 5 requests / 10 min per IP.
  - General authenticated API: generous, e.g. 300 requests / 15 min per user.
  - Distributed correctly (works across multiple backend instances since the store is Redis, not in-memory).

### 6.12 Real-Time Updates
- WebSocket server attached to the Express HTTP server. On connect, client authenticates with the access token, joins a room per workspace (`workspace:{id}`).
- Backend publishes events (`task.updated`, `comment.created`, `notification.new`) to Redis pub/sub; the WebSocket layer subscribes and relays to connected clients in that workspace room (this is the pattern that lets you later scale to multiple backend instances).
- Frontend `useWebSocket` hook maintains the connection and pushes incoming events into the TanStack Query cache directly (`queryClient.setQueryData`) so other users' changes appear live.

### 6.13 Background Jobs
- BullMQ queue backed by Redis. Jobs: welcome email on register, digest email of unread notifications, cleanup of expired idempotency keys / expired refresh tokens.
- Runs as a **separate worker process** (`worker.js`), not inside the API process — this is the real-world separation you're meant to learn.

### 6.14 File Uploads
- Multer for multipart parsing, `sharp` to generate a resized avatar/thumbnail, store on disk locally for dev (swap-in-ready interface for S3 later — but implemented as a real local disk store now, not a stub).

---

## 7. API Design Conventions

- All routes under `/api/v1/...`
- Standard success shape: `{ "data": ..., "meta": {...} }`
- Standard error shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`
- Every mutating input validated by a Zod schema in a `validate(schema)` middleware **before** it reaches the controller.
- Every request gets a `request-id` (via pino-http), returned in response headers, included in all logs for that request — this is how you trace a request end-to-end in production.

---

## 8. Folder Structure

### Backend
```
backend/
  src/
    config/            # env loading + zod validation, redis client, db client
    db/
      schema/           # drizzle table definitions, one file per domain
      migrations/
    modules/
      auth/
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validators.js
        auth.routes.js
      workspaces/
      projects/
      tasks/
      comments/
      notifications/
    middlewares/
      auth.middleware.js
      rbac.middleware.js
      rateLimit.middleware.js
      idempotency.middleware.js
      validate.middleware.js
      errorHandler.middleware.js
    sockets/
      index.js
      handlers/
    jobs/
      queue.js
      workers/
    utils/
    app.js              # express app assembly
    server.js            # http server + socket bootstrap
    worker.js             # separate BullMQ worker entrypoint
  tests/
    unit/
    integration/
  drizzle.config.js
  .env.example
```

### Frontend
```
frontend/
  src/
    api/                 # axios instance + per-resource api functions
    app/
      store.js            # Redux Toolkit store
      queryClient.js       # TanStack Query client config
    features/
      auth/
        components/
        hooks/
        authSlice.js       # Redux Toolkit slice
      workspaces/
      projects/
      tasks/
        components/
          TaskCard.jsx
          TaskCardSkeleton.jsx
          KanbanBoard.jsx
        hooks/
          useTasks.js        # TanStack Query hooks
          useOptimisticTaskUpdate.js
      notifications/
    stores/               # Zustand stores (ui.store.js, theme.store.js)
    context/               # ThemeContext, WebSocketContext
    hooks/                 # shared custom hooks (useDebounce, useThrottle, etc.)
    components/ui/         # shadcn/ui components
    routes/
      index.jsx             # route definitions with lazy() + role guards
    lib/
      zodSchemas/
```

---

## 9. Security Checklist (built in from day one, not retrofitted)

- Passwords hashed with argon2/bcrypt, never logged.
- Access tokens short-lived; refresh tokens rotated with reuse detection.
- All Zod-validated input; no raw `req.body` reaches a query.
- Drizzle parametrized queries only (no string-concatenated SQL).
- `helmet` for headers, strict CORS allow-list, cookies `httpOnly + Secure + SameSite`.
- Rate limiting on all endpoints, stricter on auth.
- RBAC enforced server-side on every mutating route, never trusted from the client.
- Centralized error handler that never leaks stack traces in production responses (but full detail goes to pino logs).

---

## 10. Build Order (complete at every step — nothing left half-built)

This is a sequence, not a set of optional milestones — each phase should be a fully working slice before moving to the next.

1. **Foundations**: repo scaffolding, Docker Compose (Postgres + Redis), Drizzle schema + migrations, Express app skeleton with pino-http logging and centralized error handling.
2. **Auth end-to-end**: register/login/refresh/logout on backend; Redux auth slice, protected routes, Axios interceptor refresh flow on frontend.
3. **Workspaces + RBAC**: create/invite/roles backend; workspace switcher UI, permission-gated actions.
4. **Projects + Tasks core CRUD**: full REST + Drizzle repositories; Kanban board UI with shadcn/ui, React Hook Form + Zod for the task form.
5. **Pagination, search, filter, sort**: cursor pagination + full-text search on backend; filter-builder `useReducer`, URL-synced state, `useInfiniteScroll` on frontend.
6. **Redis caching**: cache-aside for task lists and dashboard, invalidation on writes.
7. **Optimistic UI**: drag-and-drop status changes and comments wired to TanStack Query optimistic mutations.
8. **Idempotency + rate limiting**: middleware on backend; `useIdempotencyKey` hook wired into task creation and invite flows on frontend.
9. **Real-time layer**: WebSocket server + Redis pub/sub; `useWebSocket` hook pushing live updates into the query cache.
10. **Background jobs**: BullMQ worker process for emails/digests/cleanup.
11. **Polish pass**: shimmer skeletons everywhere loading states exist, lazy-loaded routes/heavy components, sonner toasts on every mutation outcome, throttled drag interactions.
12. **Tests**: Vitest unit tests for services/repositories, Supertest integration tests for auth/RBAC/idempotency, React Testing Library tests for the optimistic-update flows.

---

## 11. What You'll Be Able to Say You Understand After This

- The real difference between Redux Toolkit, Zustand, and Context — and why a serious app uses more than one.
- Why access/refresh tokens are rotated, not just issued once.
- How caching invalidation actually gets wired to mutations, not just "add Redis."
- Why idempotency keys exist and where they belong in the middleware chain.
- The service/repository split and why it makes testing possible.
- How optimistic UI, rollback, and cache updates fit together in TanStack Query.
- How rate limiting and caching both lean on Redis but solve different problems.
- How a WebSocket layer scales past one server via pub/sub.

This is the same shape of system used at companies running Linear/Jira/Asana-style products — scoped down, but not simplified in a way that hides the real patterns.
