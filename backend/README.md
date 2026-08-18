# WorkPulse AI — Backend

Spring Boot 3 + Spring Security + JWT REST API for WorkPulse AI. Each company's
data is isolated by the authenticated user's `companyId`, and admin-only
endpoints are guarded with `@PreAuthorize("hasRole('ADMIN')")` (method-level
security) plus service-level checks.

```
POST   /api/auth/register          Create an account (claims invited accounts too)
POST   /api/auth/login             Log in -> { token, user }
GET    /api/auth/me                Current user profile

POST   /api/companies              Create a company (caller becomes ADMIN)
POST   /api/companies/join         Join a company with its code (becomes USER)
GET    /api/companies/me           Your company (name + join code)
GET    /api/companies/members      Company roster (member)
POST   /api/companies/members      Add employee by name + email (ADMIN)

POST   /api/attendance/clock-in    { date: "YYYY-MM-DD" }
POST   /api/attendance/clock-out   { date: "YYYY-MM-DD" }
GET    /api/attendance/my          Your history
GET    /api/attendance/day?date=   Company punches for one day (member)
GET    /api/attendance/member/{id} One employee's history (ADMIN)

POST   /api/leaves                 Apply for leave
GET    /api/leaves/my              Your requests
GET    /api/leaves                 All requests with employee names (ADMIN)
POST   /api/leaves/{id}/review     { status: "approved"|"rejected", note? } (ADMIN)
GET    /api/leaves/member/{id}     One employee's leave history (ADMIN)
```

Errors are returned as `{ "error": "human readable message" }` with the right
HTTP status.

## Requirements

- Java 21
- Maven 3.9+ (or open the `backend/` folder in IntelliJ IDEA, which bundles Maven)
- Docker (for the default PostgreSQL profile) — or no database at all if you
  run with `SPRING_PROFILES_ACTIVE=dev` (in-memory H2)

## Quick start (PostgreSQL via Docker — default)

The backend runs on PostgreSQL by default. You only need Docker + Java 21 + Maven:

```bash
cd backend
docker compose up -d          # starts postgres (container: workpulse-postgres)
mvn spring-boot:run
```

The API is now at `http://localhost:8080/api`. On first run it seeds a demo
company:

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Admin   | demo@workpulse.ai  | password123 |
| Employee| demo2@workpulse.ai | password123 |

The frontend (React + Vite) talks to this API. Run it with `bun dev` from the
repo root and open the preview; set `VITE_API_URL` if your backend is not on
`localhost:8080`.

No Docker? Use the zero-setup in-memory H2 profile instead:

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

## PostgreSQL or MySQL

The `postgres` profile is the default. To point the app at MySQL instead:

```bash
docker compose up -d mysql
SPRING_PROFILES_ACTIVE=mysql mvn spring-boot:run
```

To use an existing Postgres server (no Docker), create a database and user,
then run:

```bash
DB_URL=jdbc:postgresql://localhost:5432/workpulse \
DB_USER=workpulse DB_PASSWORD=yourpassword \
mvn spring-boot:run
```

Tables are created automatically (`ddl-auto: update`). To start fresh, drop
the database or the `attendance`/`leave_requests`/`users`/`companies` tables.

## Verifying the queries against PostgreSQL and MySQL

Once a database container is up, a self-contained script creates the schema
(mirroring the JPA entities), seeds data, and runs every query the
repositories generate plus constraint checks:

PostgreSQL (default):

```bash
docker compose up -d postgres
docker exec -i workpulse-postgres psql -U workpulse -d workpulse \
  < backend/sql/verify-postgres.sql
```

MySQL:

```bash
docker compose up -d mysql
docker exec -i workpulse-mysql mysql -uworkpulse -pworkpulse workpulse \
  < backend/sql/verify-mysql.sql
```

Every check prints `PASS`; any failure raises an error and stops the script.
The scripts only touch rows owned by the `verify-*@example.com` markers, so
they are safe to run repeatedly and never touch the demo data.

## Configuration (environment variables)

| Variable             | Default                                          | Purpose                          |
|----------------------|--------------------------------------------------|----------------------------------|
| `SPRING_PROFILES_ACTIVE` | `postgres`                                    | `postgres` (default) \| `dev` \| `mysql` |
| `JWT_SECRET`         | dev-only value                                   | JWT signing secret (≥32 chars)   |
| `JWT_EXPIRATION_MS`  | `86400000`                                       | Token lifetime                   |
| `CORS_ORIGINS`       | `*`                                              | Allowed frontend origins, comma separated |
| `FRONTEND_URL`       | `http://localhost:5173`                          | Base URL used in invite emails   |
| `MAIL_HOST` etc.     | unset                                            | SMTP for invite emails (see below) |
| `SEED_DEMO`          | `true`                                           | Seed demo data when DB is empty  |

### Invite emails (optional)

When an admin adds an employee, WorkPulse tries to email them a sign-up link.
Emails require SMTP. Set these in your environment (or `application.yml`):

```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=you@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="WorkPulse AI <you@gmail.com>"
```

If SMTP isn't configured the add still succeeds — the email is simply skipped
(and a warning is logged).

## Running the tests

```bash
mvn test
```

Tests are pinned to the in-memory H2 `dev` profile with `@ActiveProfiles("dev")`,
so they run without Docker or a database.

## Project layout

```
src/main/java/com/workpulse/app/
  config/     Spring Security, JWT filter/service, demo seeder
  controller/ REST endpoints
  domain/     JPA entities + enums
  dto/        Request/response records
  exception/  ApiException + global JSON error handler
  repository/ Spring Data repositories
  security/   CurrentUser guards (company scoping)
  service/    Business logic (auth, companies, attendance, leaves, email)
```
