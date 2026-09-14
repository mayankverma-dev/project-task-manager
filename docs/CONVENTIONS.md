# CONVENTIONS.md — How Every Module Must Be Built

The point of this file: every domain (auth, workspaces, tasks, comments...)
should look like it was built by the same person on the same day, not
reinvented per session. Copy the template below for every new module.

---

## Backend Module Template

Every domain under `src/modules/<name>/` has exactly these files:

```
<name>.routes.js        # wires routes to controller, applies middleware
<name>.controller.js     # parses req, calls service, returns via response helper
<name>.service.js        # business logic, calls repository + cache
<name>.repository.js     # Drizzle queries only, no business logic
<name>.validators.js      # Zod schemas for this module's inputs
```

No other file names, no variations (not `<name>Controller.js`, not
`<name>.handlers.js`). If a module needs more, that means it should
probably be split into two modules, not given extra file types.

### Shared Helpers (write once, reuse everywhere — never re-implement)

Located in `src/utils/`:

- `ApiError` class — `new ApiError(statusCode, code, message, details?)`,
  thrown from services/controllers, caught by the central error handler.
- `apiResponse(data, meta?)` — wraps every success response in the envelope
  from `API_DESIGN.md`. Every controller uses this, nothing returns raw JSON.
- `asyncHandler(fn)` — wraps async route handlers so thrown errors reach the
  central error handler without a try/catch in every controller.
- `logger` (pino instance) — imported wherever logging is needed. Never
  `console.log` in application code.
- `cache.js` — `getOrSetCache(key, ttl, fetchFn)` cache-aside helper, and
  `invalidateCache(pattern)`. All Redis caching goes through these two
  functions, not ad-hoc `redis.get`/`redis.set` calls scattered around.

### Middleware (applied in `<name>.routes.js`, in this order)

```
router.post('/',
  authenticate,              // verifies access token
  requireRole('member'),      // RBAC check, if workspace-scoped
  rateLimiter('mutating'),     // if mutating/auth-sensitive
  idempotency,                 // if it's a create-type POST
  validate(createTaskSchema),   // zod validation
  asyncHandler(controller.create)
)
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| DB tables | snake_case, plural | `workspace_members` |
| DB columns | snake_case | `created_at` |
| React components | PascalCase, one per file | `TaskCard.jsx` |
| React hooks | camelCase, `use` prefix | `useTasks.js` |
| Zustand stores | `<name>.store.js` | `ui.store.js` |
| Redux slices | `<name>Slice.js` | `authSlice.js` |
| Zod schemas | colocated with the form/module, `<name>Schema` | `createTaskSchema` |
| Branches | `phase-<n>/<short-desc>` | `phase-4/task-kanban-board` |

---

## Frontend Conventions

- One folder per feature under `src/features/<name>/`, containing its own
  `components/`, `hooks/`, and (if needed) Redux slice — mirrors the
  backend module boundary 1:1.
- **Server state → TanStack Query only.** Custom hook per resource
  (`useTasks`, `useCreateTask`, `useTaskComments`), never manual
  `useEffect` + `fetch`/`axios` in a component.
- **Global session state → Redux Toolkit.** Currently: auth user, current
  workspace + role. Don't add new Redux slices for things that are really
  UI state.
- **UI-only state → Zustand.** Modals, sidebar collapse, drag state, theme.
  If it doesn't need to survive a refresh or isn't shared across unrelated
  parts of the tree, it probably belongs in local `useState` instead of
  Zustand — don't default to global state.
- **Forms → React Hook Form + Zod resolver**, always. Zod schema lives next
  to the form component or in `lib/zodSchemas/` if shared with the backend
  shape.
- Every list/detail view that fetches data has a matching `<Thing>Skeleton`
  component — build the skeleton in the same PR as the real component.
- Axios instance lives in `src/api/axiosInstance.js` — one instance, with
  the interceptors, reused by every resource's api functions. Don't create
  a second axios instance anywhere.

---

## Do Not

- Do not add a new state management library beyond Redux Toolkit + Zustand
  + Context + TanStack Query. If something doesn't fit, it's a sign you're
  using the wrong one of the four for the job — check this file, don't add
  a fifth.
- Do not bypass the service layer and query Drizzle directly from a
  controller.
- Do not invent a new response shape "just for this one endpoint." Every
  response goes through `apiResponse()`.
- Do not skip Zod validation because "the frontend already validates it."
  Backend validation is mandatory regardless of frontend state.
- Do not use `console.log`. Use the shared `logger`.
- Do not mark something done in `PROGRESS.md` unless it meets the
  Definition of Done in `AGENT.md`.
