# Bank Licensing & Compliance Portal

A regulatory workflow system for a national central bank to digitize licensing applications for banks and financial institutions.

For architecture, data model, state machine, and design decisions see [DESIGN.md](./DESIGN.md).

---

## Running with Docker Compose

A single `docker compose up` from the project root starts PostgreSQL, the NestJS API, and the React frontend.

### 1. Configure environment

Create `.env` at the **project root** (next to `docker-compose.yml`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nbr_licensing

PORT=5000

JWT_SECRET=your_jwt_secret_here
JWT_TOKEN_EXPIRES_IN=1d
```

> **Local dev without Docker:** also copy this file to `backend/.env` so NestJS can read it directly.

### 2. Start the full stack

```bash
docker compose up --build
```

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | `http://localhost:5173`        |
| API      | `http://localhost:5000`        |
| Swagger  | `http://localhost:5000/docs`   |

Migrations and seeds run automatically on startup.

### 3. Seeded credentials

Password for all accounts: `Password@123`

| Role      | Email                  |
|-----------|------------------------|
| APPLICANT | applicant@license.test |
| REVIEWER  | reviewer@license.test  |
| APPROVER  | approver@license.test  |
| ADMIN     | admin@license.test     |

### 4. Run tests

```bash
cd backend
npm test
```