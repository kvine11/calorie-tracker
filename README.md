# Calorie Tracker

A personal calorie and macro tracker. React + Vite frontend, Spring Boot 4 API,
Postgres with Flyway migrations, food search through the FatSecret API.

## Run it locally

You need Java 26, Node 22+, and Postgres 16.

**1. Database** — a role and two databases (one for the app, one for tests):

```sh
psql -d postgres -c "CREATE ROLE caltracker_app LOGIN PASSWORD 'choose-one'"
createdb -O caltracker_app caltracker
createdb -O caltracker_app caltracker_test
```

Tables are created by Flyway on first start — nothing else to run.

**2. Configuration** — copy the template and fill in the blanks:

```sh
cp .env.example .env
```

Spring Boot reads `.env` on startup (`DB_PASSWORD`, `FATSECRET_CLIENT_ID`,
`FATSECRET_CLIENT_SECRET`, …). Real environment variables override it.

**3. Backend** — from the repo root:

```sh
./mvnw spring-boot:run     # http://localhost:8080
./mvnw test                # needs the caltracker_test database
```

**4. Frontend** — from `frontend/`:

```sh
npm install
npm run dev                # http://localhost:5173, proxies /api to :8080
```

## API

All errors are `application/problem+json`.

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/meals/date/{yyyy-MM-dd}` | Meals for one day, in the order logged |
| `GET` | `/api/meals?from=&to=` | Meals in an inclusive date range (max 366 days) |
| `GET` | `/api/meals/{id}` | One meal, or `404` |
| `POST` | `/api/meals` | `201` with the saved meal; `400` naming invalid fields |
| `PUT` | `/api/meals/{id}` | `200` with the updated meal — macros rescale to the new calories |
| `DELETE` | `/api/meals/{id}` | `204`, or `404` |
| `GET` | `/api/meals/search?query=` | FatSecret matches; `502` if FatSecret is unavailable |
| `GET` | `/actuator/health` | `UP` when the app and database are reachable |

## Deploying

Nothing is provider-specific. A host needs to supply `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` and
`CORS_ALLOWED_ORIGINS` (the frontend's URL) to the backend, and
`VITE_API_BASE_URL` (the backend's URL) to the frontend build. Flyway migrates
the hosted database on first boot; `/actuator/health` is the health check.
