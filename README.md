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

---

## Running without Docker

You need Node 20+ and a running PostgreSQL instance.

### 1. Configure environment

Copy `backend/.env.example` to `backend/.env` and fill in your local values:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_pg_user
DB_PASSWORD=your_pg_password
DB_NAME=nbr_licensing

JWT_SECRET=your_jwt_secret_here
JWT_TOKEN_EXPIRES_IN=1d
```

### 2. Start the API

```bash
cd backend
npm install
npm run start:dev
```

The API will be available at `http://localhost:5000` and Swagger at `http://localhost:5000/docs`.

### 3. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.