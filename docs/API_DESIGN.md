# API_DESIGN.md — Single Source of Truth for the API

Every endpoint the backend implements must match the conventions here
exactly. If a new endpoint doesn't fit an existing pattern below, add the
pattern here first, then implement it — don't implement first and diverge.

---

## Base

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <accessToken>` header for access token;
  refresh token travels only as an `httpOnly` cookie, never in JS-readable
  storage.
- Content type: `application/json` (file uploads: `multipart/form-data`)

## Response Envelope (every response, no exceptions)

Success:
```json
{
  "data": { },
  "meta": { }
}
```
`meta` is omitted if there's nothing to put in it (e.g. no pagination info).

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [ { "field": "email", "issue": "Invalid email" } ]
  }
}
```
`details` is omitted when not applicable.

## Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired access token |
| `FORBIDDEN` | 403 | Valid user, insufficient role |
| `NOT_FOUND` | 404 | Resource doesn't exist or not in scope |
| `CONFLICT` | 409 | Idempotency key reused with different body, or unique constraint |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled — always logged with full stack via pino |

## Pagination Conventions

**Cursor-based** (task lists — used wherever infinite scroll applies):
```
GET /projects/:id/tasks?cursor=<opaque>&limit=20
```
Response `meta`: `{ "nextCursor": "...", "hasMore": true }`

**Offset-based** (bounded admin-style lists — members, activity log):
```
GET /workspaces/:id/members?page=1&pageSize=20
```
Response `meta`: `{ "page": 1, "pageSize": 20, "total": 143 }`

## Filtering & Sorting Convention

```
GET /projects/:id/tasks?search=&status=&priority=&assignee=&sortBy=createdAt&sortOrder=desc
```
All filters are optional query params, combined as AND. `sortBy` is
whitelisted per-endpoint in the validator (never pass raw column names
through unchecked).

## Idempotency Convention

Mutating POSTs that create a resource and could be retried require:
```
Idempotency-Key: <client-generated-uuid>
```
See `PRD.md` Section 6.10 for the full behavior spec.

---

## Endpoint Reference

### Auth (`/api/v1/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | none | rate-limited strict |
| POST | `/login` | none | rate-limited strict |
| POST | `/refresh` | refresh cookie | rotates token |
| POST | `/logout` | access token | revokes refresh token |

### Workspaces (`/api/v1/workspaces`)
| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/` | user | any (becomes owner) |
| GET | `/` | user | member of workspace |
| GET | `/:id` | user | member |
| POST | `/:id/invite` | user | admin+ |
| GET | `/:id/members` | user | member (offset pagination) |
| PATCH | `/:id/members/:userId` | user | admin+ (change role) |

### Projects (`/api/v1/workspaces/:workspaceId/projects`)
| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/` | user | member+ |
| GET | `/` | user | member |
| GET | `/:id` | user | member |
| PATCH | `/:id` | user | admin+ |
| DELETE | `/:id` | user | admin+ |

### Tasks (`/api/v1/projects/:projectId/tasks`)
| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| POST | `/` | user | member+ | requires Idempotency-Key |
| GET | `/` | user | member | cursor pagination, search/filter/sort |
| GET | `/:id` | user | member | |
| PATCH | `/:id` | user | member+ | status change, assignment, etc. |
| DELETE | `/:id` | user | admin+ | |

### Comments (`/api/v1/tasks/:taskId/comments`)
| Method | Path | Auth | Role |
|---|---|---|---|
| POST | `/` | user | member+ |
| GET | `/` | user | member (offset pagination) |
| DELETE | `/:id` | user | author or admin+ |

### Notifications (`/api/v1/notifications`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | user | offset pagination |
| PATCH | `/:id/read` | user | |
| PATCH | `/read-all` | user | |

---

When a new module is added, add its table to this reference **before**
writing the routes, so the shape is decided once, not per-endpoint.
