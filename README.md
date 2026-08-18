# WorkPulse AI

A multi-company employee management system: attendance clock-in/out, leave
requests with admin approval, employee profiles, and fully isolated per-company
data.

```
                 WORKPULSE
                    │
        ┌───────────┴───────────┐
        │                       │
   React + Vite             Spring Boot
   Frontend                  Backend
        │                       │
        │                 Spring Security
        │                       │
        │                     JWT
        │                       │
        │                 Role-Based Access
        │                  /           \
        │               ADMIN          USER
        │                 │              │
        └────────────── REST API ────────┘
                                │
                             Database
                         MySQL / PostgreSQL
```

## Repository layout

- **Frontend** (this folder): React 19 + TypeScript + Vite, Tailwind v4,
  shadcn/ui, react-router v7, axios, Framer Motion. The white-and-orange
  neobrutalism UI lives in `src/pages`, reusable UI in `src/components/ui`.
- **Backend**: `backend/` — Spring Boot 3 + Spring Security + JWT REST API,
  JPA entities, PostgreSQL / MySQL / H2 profiles. See `backend/README.md`.

## Running the frontend

```bash
bun install
bun dev
```

The app expects the REST API at `http://localhost:8080/api`. Point it
elsewhere with `VITE_API_URL`.

## Running the backend

```bash
cd backend
mvn spring-boot:run        # default: in-memory H2, zero setup, seeds demo data
# or, for PostgreSQL/MySQL:  docker compose up -d && SPRING_PROFILES_ACTIVE=postgres mvn spring-boot:run
```

See `backend/README.md` for the full API reference and configuration.

## Auth flow

- `POST /api/auth/register` and `POST /api/auth/login` return a JWT, which the
  frontend stores and sends as `Authorization: Bearer <token>`.
- Roles are **ADMIN** (company creator / manager) and **USER** (employee).
  Admin endpoints are guarded by Spring Security method-level
  `@PreAuthorize("hasRole('ADMIN')")` and service-level company checks.
- An admin can add employees by name + email — they're invited instantly and
  join automatically the moment they sign up with that email (no join code
  needed). A join code remains available for self-serve sign-ups.

## Frontend conventions

- Pages live in `src/pages`, reusable UI in `src/components/ui` (shadcn).
- `src/lib/api.ts` is the single REST client — always use it instead of raw
  fetch; it attaches the JWT and handles 401 redirects.
- `src/hooks/use-auth.ts` exposes `useAuth()` for the signed-in user
  (`{ isLoading, isAuthenticated, user, login, register, refresh, signOut }`).
- The `/dashboard` route is protected by `RequireAuth`, which sends signed-out
  users to `/auth?returnTo=<current route>`.
- Always show results with sonner toasts; keep the neobrutalism style: square
  corners, 2px black borders, flat color blocks, `shadow-brutal*`.
