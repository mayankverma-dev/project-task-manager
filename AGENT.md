# AGENT.md — Read This First, Every Session

You are working on **Project-Task-Manager**, a collaborative project/task management app.
This file is the entry point. Before writing any code, read in this order:

1. `AGENT.md` (this file)
2. `PROGRESS.md` — current phase, what's done, what's next, past decisions
3. `docs/PRD.md` — full product spec, architecture, schema, feature specs
4. `docs/API_DESIGN.md` — exact API shapes, endpoints, error codes
5. `docs/CONVENTIONS.md` — file templates, naming, helpers you must reuse

Do not start implementing until you've read the relevant docs for the task at hand.

---

## Golden Rules

1. **Never invent a new structure, helper, or response shape if one already
   exists.** Check `docs/CONVENTIONS.md` and the existing codebase first.
   If a `apiResponse()` helper exists, use it — don't write a new one.
2. **Follow the build order in `PRD.md` Section 10.** Don't jump ahead to a
   later phase (e.g. real-time) before the current phase is fully working.
3. **A feature is not done until it matches the "Definition of Done" below.**
   No partial implementations, no `// TODO: add validation later`.
4. **Every module follows the exact file template in `CONVENTIONS.md`.**
   Same file names, same layering (controller → service → repository), every
   time, for every domain (auth, workspaces, projects, tasks, comments...).
5. **Tech stack is fixed** — see PRD.md Section 3. Do not swap a library for
   an alternative (e.g. don't add react-query devtools' competitor, don't
   swap Zustand for another state lib) without it being logged as a decision
   in `PROGRESS.md`.
6. **Update `PROGRESS.md` at the end of every work session** — check off
   what got done, note what's next, log any non-obvious decision you made
   and why. This is the memory across sessions. If it's not written down,
   the next session will not know it happened.
7. **Ask before restructuring.** If something in the existing structure
   seems wrong, flag it and propose a change — don't silently refactor
   around it.

---

## Definition of Done (applies to every backend feature)

- [ ] Zod validator for all inputs (body/query/params)
- [ ] Business logic in a service, not in the controller
- [ ] DB access only in a repository, using Drizzle
- [ ] Errors thrown as `ApiError` and caught by the central error handler
- [ ] Success responses use the shared response envelope (`docs/API_DESIGN.md`)
- [ ] Logged via the shared pino logger, not `console.log`
- [ ] RBAC-checked if the route touches workspace-scoped data
- [ ] Rate-limited if it's a mutating or auth-sensitive route
- [ ] Basic test (unit for service, or integration via supertest) added

## Definition of Done (applies to every frontend feature)

- [ ] Server state goes through TanStack Query (never raw `useEffect` + `fetch`)
- [ ] Forms use React Hook Form + Zod resolver
- [ ] Loading state uses a skeleton component matching the real content shape,
      never a generic spinner
- [ ] Errors show a sonner toast with a real message, not swallowed
- [ ] New route is lazy-loaded (`React.lazy` + `Suspense`)
- [ ] Uses shadcn/ui + Tailwind, no ad-hoc inline styles

---

## Session Workflow (do this every time)

1. Read `PROGRESS.md` → find current phase and next unchecked item.
2. Read the relevant section of `PRD.md` and `API_DESIGN.md` for that item.
3. Implement it fully per the Definition of Done above.
4. Run/describe how it was tested.
5. Update `PROGRESS.md`: check off the item, add any decisions made, note
   what the next session should pick up.
6. Summarize what changed in plain language at the end of your response.

Do not treat this project as "start fresh each time." It is one continuous
build — always continue from `PROGRESS.md`, never restart or re-decide
things already decided.
