# Design Document — Bank Licensing & Compliance Portal

## 1. Architecture Overview

The system is a three-tier, role-gated application built for the National Bank of Rwanda (BNR) to manage the full lifecycle of bank licensing applications — from initial submission through regulatory review to final approval or rejection.

```
┌──────────────────────────────────┐
│       Presentation Layer         │  React 19 · TypeScript · Vite
│   Role-aware SPA  (port 5173)    │  TailwindCSS · shadcn/ui · React Router v7
└──────────────┬───────────────────┘
               │  HTTP/JSON  (Axios + Bearer token)
┌──────────────▼───────────────────┐
│       Application Layer          │  NestJS 11  (port 3000)
│  REST API · Auth · Workflow      │  JWT · Guards · State Machine · Multer
│  Audit · Role Enforcement        │  TypeORM · Swagger
└──────────────┬───────────────────┘
               │  TypeORM  (pessimistic locking)
┌──────────────▼───────────────────┐
│         Data Layer               │  PostgreSQL 16
│  Relational DB + Local Storage   │  DB triggers · Local filesystem (uploads/)
└──────────────────────────────────┘
```

Each layer has a single job. The frontend never makes business decisions — it reflects state and sends intent. The API enforces every rule. The database is the last line of defence for data integrity.

---

## 2. Technology Choices

### Why NestJS over plain Express

Express is minimal by design — it gives you an HTTP server and nothing else. That is a strength for small services, but a liability as a codebase grows. Every team ends up inventing their own conventions for dependency injection, module boundaries, configuration, and validation.

NestJS provides those conventions out of the box. Its decorator-based module system (`@Module`, `@Injectable`, `@Controller`) enforces clear ownership of every concern. The built-in dependency injection container means that swapping an implementation — say, replacing the local file store with S3 — requires changing one provider registration, not hunting through function calls. For a compliance domain where auditability and role enforcement need to be airtight, having the framework push you toward explicit, testable structure matters more than saving boilerplate.

Concretely: `AuthGuard`, `RolesGuard`, and the `@Roles()` decorator exist as first-class injectable providers with zero global state. Any controller route can be locked down in two lines. That would require manual middleware chaining in plain Express and would be far easier to misconfigure.

### Why PostgreSQL over a document store

An application moves through states, belongs to a user, has a reviewer, an approver, multiple versioned documents, and an immutable audit trail. All of these are relational by nature — they reference each other by identity, not by embedding.

A document store like MongoDB would force manual join logic into the application layer, make referential integrity optional, and make it harder to enforce the append-only constraint on audit logs at the database level. PostgreSQL gives foreign keys, row-level locking, transactions, and triggers — all of which this system uses. The relational model is not a default choice here; it is the right choice for the data shape.

### Why React over a server-rendered approach

The portal is heavily role-aware: the same route renders entirely different actions depending on whether the logged-in user is an APPLICANT, REVIEWER, APPROVER, or ADMIN. Server rendering would push that conditional logic into templates. A React SPA keeps the role-aware rendering co-located with the API calls that drive it, and allows the UI to update without a full page reload after each status transition — important when a reviewer is working through a queue of applications.

### Why JWT over session cookies

JWT tokens are stateless. The API server holds no session state, which means every instance of the API can validate any token independently. This makes horizontal scaling trivial — no shared session store is needed. The trade-off is that a compromised token cannot be instantly revoked before it expires. For a licensing portal where sessions are short-lived and the threat model is not real-time token hijacking, statelessness wins. A refresh token flow would close this gap and is noted as a future improvement.

---

## 3. Data Model

```
users
  id              uuid PK
  names           varchar
  email           varchar UNIQUE
  password        varchar (bcrypt)
  role            enum: APPLICANT | REVIEWER | APPROVER | ADMIN
  isActive        boolean
  createdAt / updatedAt

applications
  id                    uuid PK
  institutionName       varchar
  institutionType       enum: COMMERCIAL_BANK | MICROFINANCE
                             | INVESTMENT_BANK | INSURANCE
  contactEmail          varchar (indexed)
  businessAddress       text nullable
  registrationNumber    varchar
  proposedCapitalAmount decimal
  applicationStatus     enum (default: DRAFT)
  applicantId           → users.id  FK NOT NULL
  reviewerId            → users.id  FK nullable
  approverId            → users.id  FK nullable
  createdAt / updatedAt

document_upload
  id                uuid PK
  filename          varchar
  filepath          varchar
  mimetype          varchar
  size              integer
  documentCategory  enum: ARTICLES_OF_INCORPORATION
                        | CERTIFICATE_OF_REGISTRATION
                        | FINANCIAL_STATEMENTS
                        | PROOF_OF_CAPITAL
  version           integer  (auto-incremented per applicationId + category)
  applicationId     → applications.id FK
  createdAt

audit_logs
  id            uuid PK
  applicationId → applications.id FK NOT NULL
  actorId       → users.id FK NOT NULL (eager loaded)
  action        varchar
  beforeState   varchar (JSON)
  afterState    varchar (JSON)
  createdAt
  [UPDATE and DELETE blocked by PostgreSQL trigger — see §5]
```

**Document categories** are drawn directly from BNR licensing requirements. Every uploaded file must declare its purpose — this is not a generic attachment system. The four categories (Articles of Incorporation, Certificate of Registration, Financial Statements, Proof of Capital) map to the regulatory checklist that a reviewer works through.

---

## 4. Workflow & Security Model

### State machine

The application lifecycle is an explicit allowlist. Any status transition not present in the map is rejected with `400 Bad Request` before any database write occurs.

```
              ┌────────┐
         ┌───►│ DRAFT  │
         │    └───┬────┘
         │        │ submit
         │    ┌───▼──────────┐
         │    │  SUBMITTED   │◄──────────────────┐
         │    └──┬───────┬───┘                   │
         │       │       │ request info          │ resubmit
         │  mark │   ┌───▼──────────────┐        │
         │ reviewed  │  INFO_REQUESTED  ├────────┘
         │       │   └──────────────────┘
         │   ┌───▼──────┐
         │   │ REVIEWED │
         │   └──┬───────┘
         │      │ approver decides
         │  ┌───▼──────┐   ┌──────────┐
         └──│ APPROVED │   │ REJECTED │
            └──────────┘   └──────────┘
```

| From           | Allowed transitions              |
|----------------|----------------------------------|
| DRAFT          | SUBMITTED                        |
| SUBMITTED      | INFO_REQUESTED, REVIEWED         |
| INFO_REQUESTED | RESUBMITTED                      |
| RESUBMITTED    | INFO_REQUESTED, REVIEWED         |
| REVIEWED       | APPROVED, REJECTED               |
| APPROVED       | _(terminal)_                     |
| REJECTED       | _(terminal)_                     |

### Layered enforcement

A single guard at the route level is not enough. A misconfigured decorator, a future refactor, or a new endpoint could silently open a gap. This system enforces role rules at three independent layers:

**Route layer** — `@Roles()` decorator + `RolesGuard` rejects requests before the handler runs. This is the first gate.

**Service layer** — `canRoleChangeToStatus()` validates that the requesting role is allowed to make the specific transition requested, regardless of how the request arrived. This is the second gate and cannot be bypassed by route changes.

**Query layer** — Applicants receive a `.where('applicant.id = :userId')` clause injected at query-build time. They cannot read other applicants' records even if both previous gates were bypassed.

**Structural separation** — `reviewer` and `approver` are separate foreign key columns with separate role-gated endpoints (`PATCH /review`, `PATCH /approve`). A reviewer cannot act as approver on the same application by database design, not just by code convention.

---

## 5. Audit Trail

### The core problem

An audit log only has value if it is tamper-proof. Application-level "append-only" is not enough — a bug, a compromised service account, or a direct database query could modify records. The only way to guarantee immutability is to enforce it below the application layer.

### The solution: database triggers

Two `BEFORE` triggers are installed via migration on the `audit_logs` table:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_update
  BEFORE UPDATE ON audit_logs FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_audit_delete
  BEFORE DELETE ON audit_logs FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();
```

Any `UPDATE` or `DELETE` on `audit_logs` — whether from application code, TypeORM, a migration script, or a direct `psql` session — raises a PostgreSQL exception and is rolled back. The application cannot bypass this even if it tries to.

### Atomicity

The audit write shares the same database transaction as the status change it records. Either both commit or both roll back. This means there is no window where a status has changed but no audit entry exists, and no audit entry for a change that never happened.

---

## 6. Concurrency

### The problem pessimistic locking solves

Without locking, two concurrent requests — say, two reviewers acting on the same application simultaneously — can both read `SUBMITTED`, both pass validation, and both attempt to write `REVIEWED`. The result is a race condition: duplicated transitions, inconsistent state, and an audit trail that no longer reflects reality.

### Pessimistic vs optimistic locking

**Optimistic locking** assumes conflicts are rare. Each row carries a version counter. At write time, the application checks that the version it read is still current. If another writer got there first, the version won't match and the write is retried or rejected. This approach maximises throughput because reads never block.

**Pessimistic locking** assumes conflict must be prevented, not detected after the fact. The row is locked for the duration of the transaction using `SELECT … FOR UPDATE`. Any concurrent writer blocks at the lock acquisition until the first transaction commits.

This system uses **pessimistic locking** for application status changes and document version increments. The reasoning: licensing decisions are low-frequency (a few hundred applications, not millions), high-stakes writes where a duplicate transition is a regulatory problem, not just a user experience issue. The latency cost of serialising writes on the same row is immaterial at this volume. Correctness is the non-negotiable requirement; throughput is not.

The pattern for every status change:

```
1. Begin transaction
2. SELECT … FOR UPDATE   ← block concurrent writers on this row
3. Re-read and validate the current state against the transition map
4. Apply the change
5. Write audit entry in the same transaction
6. Commit
```

---

## 7. Trade-offs

### Local filesystem vs object storage

**Chosen:** Local filesystem with a static asset server.  
**Alternative:** S3-compatible object storage (AWS S3, MinIO).

The local approach means zero infrastructure dependencies beyond the database — the project runs with a single `docker compose up`. The cost is that it does not scale horizontally: two API instances would serve files from different disks. For the current single-instance deployment this is irrelevant. The abstraction boundary (a `DocumentsService` that handles file writes) is already in place, so swapping to S3 is an implementation change, not an architectural one.

### TypeORM `synchronize: true` vs migrations

**Chosen:** `synchronize: true` in development.  
**Alternative:** migration-only schema management.

`synchronize: true` drops and recreates columns automatically when entities change. This eliminates migration friction during development and makes the project easy to run for the first time. The risk — unintended schema changes in production — is real and well-understood. The configuration is environment-aware: turning this off for production is one config change. The append-only migration (`MakeAuditAppendOnly`) demonstrates the project is already using migrations for production-grade concerns.

### Stateless JWT vs session-based authentication

**Chosen:** Stateless JWT with a single access token.  
**Alternative:** Session tokens stored server-side, or JWT with refresh tokens.

Stateless tokens require no server-side session store, which makes the API horizontally scalable without coordination. The trade-off is that a token cannot be invalidated before it expires — if a token is stolen, the attacker has access until the expiry time. A refresh token flow (short-lived access token + long-lived refresh token with a server-side revocation list) would close this gap. For this portal's threat model — internal regulatory staff, not public consumer accounts — the current approach is acceptable. The auth module is isolated enough that adding refresh tokens is an additive change.

### Fixed document categories vs dynamic configuration

**Chosen:** Four hard-coded `DocumentCategory` enum values.  
**Alternative:** A `document_categories` table managed through an admin interface.

The four categories are drawn directly from BNR's published licensing regulation. They are not arbitrary — they are the regulatory checklist. Hard-coding them means the schema enforces the business rule, not just application code. The cost is that adding a fifth category requires a code change and migration. Given that BNR regulations change slowly and deliberately, this trade-off favours correctness over flexibility. Dynamic category management is the right next step once the regulatory requirements stabilise.

### No `UNDER_REVIEW` state

**Chosen:** `SUBMITTED` and `RESUBMITTED` serve as the "pending reviewer action" states.  
**Alternative:** An explicit `UNDER_REVIEW` state set when a reviewer opens an application.

An `UNDER_REVIEW` state would communicate to applicants that their submission has been picked up. The reason it was omitted: it requires reviewer assignment — knowing which reviewer "owns" an application — which is not in scope. Without assignment, `UNDER_REVIEW` would be meaningless because any reviewer could still act on any application. The state machine is deliberately minimal: it models decision points, not administrative housekeeping.

---

## 8. What the system does not yet do (and why)

| Gap | Why it matters | What's needed |
|-----|---------------|---------------|
| **Reviewer assignment** | Currently every reviewer sees every submitted application. Assigning applications to specific reviewers prevents duplicated work and enables workload tracking. | A `reviewerId` assignment step + queue management UI |
| **Email notifications** | Applicants have no way to know their status changed without polling the portal. | A notification service wired into the status-change transaction |
| **Pagination** | `GET /applications` returns all records. At scale, this becomes a performance and UX problem. | Cursor or offset pagination on the list endpoint |
| **Refresh tokens** | A stolen access token grants access until expiry. | Short-lived access token + server-side revocable refresh token |
| **Rate limiting** | The auth endpoints have no brute-force protection. | Per-IP rate limiting on `POST /auth/login` |
| **API versioning** | Breaking changes to the API require coordinated frontend deploys. | `/v1/` prefix + versioning strategy |
