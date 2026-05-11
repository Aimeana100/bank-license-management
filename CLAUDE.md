# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Bank Licensing & Compliance Portal for the National Bank of Rwanda (BNR). Financial institutions apply for a banking licence; regulators review and approve. Two separate apps: a NestJS 11 REST API (`backend/`) and a React 19 SPA (`frontend/`).

---

## Commands

### Backend (`backend/`)

```bash
npm run start:dev      # watch mode (port 3000)
npm run build          # compile to dist/
npm run lint           # ESLint --fix
npm run test           # jest (unit, *.spec.ts)
npm run test:watch     # jest watch
npm run test:cov       # coverage
npm run test:e2e       # jest --config ./test/jest-e2e.json
```

### Frontend (`frontend/`)

```bash
npm run dev            # Vite dev server (port 5173)
npm run build          # tsc -b && vite build
npm run lint           # ESLint
npm run preview        # serve the build locally
```

### Database

```bash
docker compose up -d postgres   # start Postgres 16 only
docker compose up               # start Postgres + API + frontend
```

The backend reads `./backend/.env` for all config. Required variables: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `JWT_SECRET`, `JWT_TOKEN_EXPIRES_IN`.

TypeORM `synchronize: true` is on — schema changes apply automatically on startup (dev only).

Swagger UI is available at `http://localhost:3000/docs` when the API is running.

---

## Architecture

### Request flow

```
Browser → Axios (injects Bearer token) → NestJS
          AuthGuard (JWT verify)
          RolesGuard (@Roles decorator)
          Controller → Service → TypeORM / filesystem
                               ↘ AuditService (same transaction)
```

### Backend modules (`backend/src/modules/`)

| Module | Responsibility |
|--------|---------------|
| `auth/` | JWT sign-in/sign-up, `AuthGuard` (Bearer extraction + verify), `RolesGuard` + `@Roles()` decorator. `request.user` is typed as `AuthPayload { id, role }`. |
| `users/` | `User` entity (roles: APPLICANT, REVIEWER, APPROVER, ADMIN). Startup seeders populate test users. |
| `applications/` | Full lifecycle: create, upload, submit, review, approve/reject. State machine lives in `utils/application-state-machine.ts`. Status changes use a pessimistic write lock (`FOR UPDATE`) + audit write in the same transaction. File uploads go to `backend/uploads/` and are served as static assets. |
| `audit/` | Append-only `audit_logs` table. `AuditService.logTransaction()` is called inside the application transaction. `AuditController` exposes `GET /audit` (ADMIN) and `GET /audit/:applicationId` (ADMIN, REVIEWER, APPROVER). DB-level `BEFORE UPDATE/DELETE` triggers make the table truly immutable — see migration `MakeAuditAppendOnly`. |

### Application state machine

Transitions are an explicit allowlist in `application-state-machine.ts`. Anything not in the map is rejected with `400` before any DB write. Enforcement is layered: route guard → service `canRoleChangeToStatus()` → query filter (applicants only see their own records).

```
DRAFT → SUBMITTED → INFO_REQUESTED ⇄ RESUBMITTED
SUBMITTED / RESUBMITTED → REVIEWED → APPROVED | REJECTED (terminal)
```

### Frontend (`frontend/src/`)

| Path | Purpose |
|------|---------|
| `api/` | Thin Axios wrappers (`auth.api.ts`, `applications.api.ts`, `audit.api.ts`). `axios.ts` injects the Bearer token from localStorage. |
| `contexts/AuthContext.tsx` | Provides `user`, `isAuthenticated`, `logout`. Token stored under `AUTH_TOKEN_STORAGE_KEY` in localStorage. |
| `router/AppRouter.tsx` | `ProtectedRoute` (auth check) and `AdminRoute` (ADMIN-only, uses `<Outlet>`). |
| `pages/admin/AuditLogsPage.tsx` | ADMIN-only page at `/admin/audit`: filterable table of all audit logs with expandable before/after state diff. |
| `pages/applications/ApplicationDetailsPage.tsx` | Shows audit trail timeline at the bottom for REVIEWER / APPROVER / ADMIN. |
| `utils/application.util.ts` | Badge class helpers, `getRoleActions()` (what buttons to show per role+status), `ACTION_LABELS`. |
| `types/` | `application.ts`, `audit.ts`, `user.ts` — shared TypeScript interfaces. |

UI components come from shadcn/ui. The design system uses amber as the primary colour throughout.

### Document upload

Four fixed categories from BNR licensing requirements: `ARTICLES_OF_INCORPORATION`, `CERTIFICATE_OF_REGISTRATION`, `FINANCIAL_STATEMENTS`, `PROOF_OF_CAPITAL`. Uploads only allowed when application is `DRAFT` or `INFO_REQUESTED`. Version counter is incremented per `(applicationId, documentCategory)` inside a locked transaction.

---

## Key conventions

- Every protected backend route stacks `@UseGuards(AuthGuard, RolesGuard)` + `@ApiBearerAuth()` + `@Roles(...)` + Swagger decorators — follow this pattern for any new endpoint.
- The `AuditService.logTransaction()` call must always share the same `EntityManager` (pass `manager`) as the status-change write so both commit or both roll back.
- Frontend API functions in `api/` unwrap the `{ data, message }` envelope where needed (see the `unwrap()` helper in `applications.api.ts`).
- Role-aware UI: use `user?.role` from `useAuth()` to conditionally render actions/sections — never hardcode role strings beyond what's already in `utils/application.util.ts`.
