# Design Document — Bank Licensing & Compliance Portal

## 1. Architecture

The system follows a 3-tier architecture in a client-server deployment.

```
┌──────────────────────────────┐
│      Presentation Layer      │  React 19 · TypeScript · Vite
│  Role-aware SPA (port 5173)  │  TailwindCSS · shadcn/ui · React Router v7
└──────────────┬───────────────┘
               │ HTTP / JSON (Axios)
┌──────────────▼───────────────┐
│      Application Layer       │  NestJS 11 (port 3000)
│  REST API + Auth + Workflow  │  JWT · Role Guards · State Machine
│                              │  Multer · Audit Service · Swagger
└──────────────┬───────────────┘
               │ TypeORM (pessimistic locking)
┌──────────────▼───────────────┐
│         Data Layer           │  PostgreSQL 16
│  Relational DB + Local Files │  DB triggers · Local filesystem (uploads/)
└──────────────────────────────┘
```

### Backend Module Structure

```
src/
├── modules/
│   ├── auth/            # JWT strategy, AuthGuard, RolesGuard, Roles decorator
│   ├── users/           # User entity, CRUD, role management
│   ├── applications/    # Core domain: create, review, approve, upload
│   │   ├── entities/    # Application, DocumentUpload
│   │   ├── dto/         # Input validation per action
│   │   └── utils/       # application-state-machine.ts
│   └── audit/           # AuditLog entity + append-only write service
├── migrations/          # MakeAuditAppendOnly — DB-level trigger
├── seeders/             # Startup seeders for users and applications
└── config/              # Env validation, TypeORM config, Swagger config
```

---

## 2. Data Model

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

> **Document categories — business context**
> Every uploaded file must be labelled under one of the four required document names above.
> This ensures each file has a clear, reviewable purpose rather than being a nameless attachment.
> The four categories are drawn from the licensing requirements published by the National Bank of Rwanda (BNR):
> [BNR — Regulation establishing licensing requirements and other conditions for deposit-taking institutions](https://www.bnr.rw/documents/Regulation_establishing_licensing_requirements_and_other_conditions_for_deposi_NNeAQyu.pdf)
>
> _Future: category management will be handled through the admin dashboard, allowing categories to be configured without a code change._

audit_logs
  id            uuid PK
  applicationId → applications.id FK NOT NULL
  actorId       → users.id FK NOT NULL (eager loaded)
  action        varchar  (e.g. APPLICATION_STATUS_CHANGED)
  beforeState   varchar
  afterState    varchar
  createdAt
  [UPDATE and DELETE blocked by PostgreSQL trigger — see §6]
```

---

## 3. Workflow State Machine

Application lifecycle is modelled as an explicit allowlist of valid transitions. Any transition not in the map is rejected with `400 Bad Request` before any lock or DB write.

```
              ┌────────┐
         ┌───►│ DRAFT  │
         │    └───┬────┘
         │        │ applicant submits
         │    ┌───▼──────────┐
         │    │  SUBMITTED   │◄──────────────────┐
         │    └──┬───────┬───┘                   │
         │       │       │                       │
         │ mark  │       │ request info          │ resubmit
         │ reviewed      │                       │
         │       │   ┌───▼──────────────┐        │
         │   ┌───▼──┐│  INFO_REQUESTED  │        │
         │   │REVIEW││                  ├────────┘
         │   │  ED  │└──────────────────┘   (applicant resubmits)
         │   └──┬───┘
         │      │ approver decides
         │      │
         │  ┌───▼──────┐   ┌──────────┐
         └──│ APPROVED │   │ REJECTED │
            └──────────┘   └──────────┘
            (terminal)      (terminal)
```

### Transition Table

| From           | Allowed Next                     |
|----------------|----------------------------------|
| DRAFT          | SUBMITTED                        |
| SUBMITTED      | INFO_REQUESTED, REVIEWED         |
| INFO_REQUESTED | RESUBMITTED                      |
| RESUBMITTED    | INFO_REQUESTED, REVIEWED         |
| REVIEWED       | APPROVED, REJECTED               |
| APPROVED       | _(terminal — no exits)_          |
| REJECTED       | _(terminal — no exits)_          |

Implemented in [`backend/src/modules/applications/utils/application-state-machine.ts`](backend/src/modules/applications/utils/application-state-machine.ts).

---

### Enforcement Layers

**Route layer** — `@Roles(...)` decorator + `RolesGuard` rejects before the handler runs.

**Service layer** — `canRoleChangeToStatus()` checks that the requesting role is permitted to move to the target status, independently of the route guard. This prevents any future route misconfig from being exploitable.

**Query layer** — Applicants get a `.where('applicant.id = :userId')` clause injected at query build time; they never receive other applicants' records even if the role check were bypassed.

**Structural separation** — `reviewer` and `approver` are separate FK columns with separate role-gated endpoints (`PATCH /review`, `PATCH /approve`). A reviewer cannot act as approver on the same application by design.



## 4. Non-Negotiable Requirement Mapping

| Requirement                          | Implementation                                                                                    |
|--------------------------------------|---------------------------------------------------------------------------------------------------|
| JWT authentication                   | `AuthGuard` validates Bearer token on every protected route via `@nestjs/jwt`                    |
| Role-based access control            | `@Roles()` + `RolesGuard` at route level; `canRoleChangeToStatus()` at service level            |
| Invalid transitions rejected         | `applicationStatusCanTransition()` allowlist; returns `400` before any DB write                 |
| Concurrent update safety             | `pessimistic_write` lock on the application row acquired inside the transaction before re-reading state |
| Append-only audit log                | PostgreSQL `BEFORE UPDATE / DELETE` triggers raise an exception — no application code can bypass |
| Audit atomicity                      | Audit write shares the same transaction as the status change; both commit or both roll back      |
| Document upload restricted by state  | Upload handler checks `DRAFT` or `INFO_REQUESTED` before writing file or DB record              |
| Document versioning                  | Version counter incremented per `(applicationId, documentCategory)` pair within a locked transaction |
| File size limit (5 MB)               | Multer `limits.fileSize` enforced server-side before handler runs                                |
| Reviewer ≠ Approver                  | Enforced structurally: separate endpoints, separate role guards                |
| Graceful error responses             | NestJS exception filters return structured JSON with HTTP status codes                           |
| Swagger documentation                | All routes decorated with `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`                     |

---

## 5. Audit Trail Design

The `audit_logs` table is protected at the database level by two triggers installed via migration (`MakeAuditAppendOnly`):

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

The constraint holds even if application-level code is compromised. Any attempt to modify or delete an audit record raises a PostgreSQL exception regardless of the caller.

Each log entry records: `actor`, `action`, `beforeState`, `afterState`, `timestamp`, and is linked to both the application and the user who triggered the change.

---

## 6. Concurrency Design

Status changes follow a lock-then-validate pattern to prevent race conditions:

```
1. Begin transaction
2. SELECT … FOR UPDATE (pessimistic_write)  ← blocks concurrent writers on same row
3. Re-validate the state transition against the NOW-locked row
4. Apply status change
5. Write audit log entry within the same transaction
6. Commit
```

Without step 2, two concurrent requests could both read `SUBMITTED`, both pass validation, and both attempt to advance the state — producing duplicate transitions or invalid states. With the lock, the second request blocks at step 2, then fails step 3 after the first commits, and returns `400 Bad Request`.

The same `pessimistic_write` lock is applied to document uploads to prevent duplicate version numbers under concurrent upload requests for the same category.

---

## 7. Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Local filesystem for uploads | Simple to run locally; not horizontally scalable. Production would replace with S3-compatible object storage. |
| `synchronize: true` in TypeORM | Convenient for development and review; must be disabled in production to prevent unintended schema drift. |
| Pessimistic locking | Serializes writes on the same application row, adding latency under contention. Acceptable here — licensing decisions are low-frequency, high-stakes writes where correctness outweighs throughput. |
| No explicit `UNDER_REVIEW` state | `SUBMITTED` and `RESUBMITTED` are handled identically by reviewer logic. Avoids a redundant state at the cost of a slightly non-obvious transition map. |
| Status mapping layer in service | Decouples internal workflow states from client vocabulary. Adds a translation step but lets the state machine and UI evolve independently. |
| Startup seeders | Convenient for reviewers running the project; in production, user provisioning would go through an admin API with its own audit trail. |

---

## 8. Future Improvements

- **Object storage** — Replace local filesystem with S3-compatible storage; store only the object key in the DB.
- **Reviewer assignment** — Explicitly assign submitted applications to specific reviewers rather than exposing all submitted applications to every reviewer.
- **Email / webhook notifications** — Notify applicants on status transitions (e.g. info requested, approved, rejected).
- **Pagination** — Add cursor or offset pagination to `GET /applications` for large datasets.
- **Refresh tokens** — Current implementation uses a single short-lived access token; a refresh token flow would improve security without forcing frequent re-login.
- **Audit log API** — Expose audit history via a read-only endpoint so reviewers and approvers can inspect application history without direct DB access.
- **Rate limiting** — Add per-IP or per-user rate limiting on auth endpoints to mitigate brute-force attacks.
- **Api versioning**
- **User adminstration and frontend pages separation**
- **application document required dynamicity**
