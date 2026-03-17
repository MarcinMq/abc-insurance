# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ABC Insurance — full-stack insurance claims management system (UI in Polish).
- **Backend**: Django 4.2 + DRF + PostgreSQL 15
- **Frontend**: Angular 17 standalone components + Angular Material
- **Infra**: Docker Compose (3 services: db, backend, frontend)

---

## Commands

### Start / Stop

```bash
# Start all services (builds if needed)
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker logs abc_insurance_frontend --follow
docker logs abc_insurance_backend --follow
```

### Backend (Django)

```bash
# Run inside container
docker exec abc_insurance_backend python manage.py <command>

# Or directly (with venv activated from backend/)
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Create demo users (run after first migration)
docker exec abc_insurance_backend python manage.py shell -c "
from users.models import User, AgentProfile
u = User.objects.create_user('klient', 'klient@example.com', 'Haslo123!', role='customer', first_name='Jan', last_name='Kowalski')
a = User.objects.create_user('agent', 'agent@example.com', 'Haslo123!', role='agent', first_name='Anna', last_name='Nowak')
AgentProfile.objects.create(user=a, license_number='AG001', department='Szkody')
"
```

### Frontend (Angular)

```bash
# Run inside container (already handled by docker-compose command)
# Or locally:
cd frontend
npm install
npx ng serve --host 0.0.0.0 --poll 10000 --no-live-reload
```

### API Docs

Swagger UI available at: `http://localhost:8000/api/docs/`

---

## Architecture

### Backend Structure

```
backend/
├── abc_insurance/       # Django project (settings, urls, wsgi)
├── users/               # Auth, roles, JWT customization
├── policies/            # Insurance products & customer policies
├── claims/              # Claim submissions & workflow
├── notifications/       # Event notifications
└── fixtures/            # Initial product seed data
```

**Role system** — `User.role` has three values: `customer`, `agent`, `admin`. Permission classes in `users/permissions.py`:
- `IsAgent` — agents and admins only
- `IsOwnerOrAgent` — claim/policy owner or any agent
- `IsAgentOrAdmin` — agents or admins

**Claim workflow** — enforced by `ALLOWED_TRANSITIONS` dict in `claims/models.py`. The `can_transition_to()` method validates moves before they are saved. Status history is written to `ClaimStatusHistory` on every transition.

**JWT** — Custom claims added via `CustomTokenObtainPairSerializer` (users/serializers.py): `role`, `full_name`, `email` are embedded in the token. Access: 1h, Refresh: 7d with rotation + blacklist.

**API routing** — All under `/api/`. Key endpoints:
- `POST /api/auth/login/` → returns `{access, refresh, user}`
- `POST /api/auth/token/refresh/` → returns `{access}`
- `GET/PATCH /api/auth/profile/`
- `GET/POST /api/claims/` · `POST /api/claims/{id}/submit/` · `PATCH /api/claims/{id}/change-status/`
- `GET /api/claims/queue/` — agent-only pending claims
- `GET/POST /api/policies/`

### Frontend Structure

```
src/app/
├── core/
│   ├── guards/           # authGuard, guestGuard, agentGuard
│   ├── interceptors/     # auth.interceptor.ts — JWT injection + 401 → refresh retry
│   └── services/         # auth, policy, claim, notification services
├── features/             # Lazy-loaded route modules
│   ├── auth/             # login, register
│   ├── dashboard/        # Overview with Chart.js doughnut
│   ├── policies/         # policy-list, policy-detail
│   ├── claims/           # claim-list, claim-form (3-step), claim-detail
│   └── agent/            # agent-queue
└── shared/
    └── models/           # TypeScript interfaces: User, Policy, Claim, Notification
```

**Auth flow** — `AuthService` stores tokens in `localStorage` (`abc_access`, `abc_refresh`). `currentUser$` is a `BehaviorSubject<User|null>` derived from decoding the JWT on init. `isLoggedIn$` is mapped from it (use this in templates, not `isLoggedIn()` method, to avoid calling it on every change-detection cycle). `loadUserProfile()` only emits to the subject if data actually changed.

**Interceptor** — `auth.interceptor.ts` attaches `Authorization: Bearer` to every request. On 401, it queues concurrent requests while refreshing the token, then retries them all. On refresh failure, it calls `auth.logout()`.

**Notifications** — `NotificationService.startPolling()` polls every 60s using `interval()` + `takeUntil(stopPolling$)`. Call `stopPolling()` on logout. Polling is started in `AppComponent.ngOnInit()`.

**Forms** — All form inputs use custom-styled native HTML (`<input>`, `<select>`, `<textarea>`) wrapped in CSS `.input-wrap` / `.select-wrap` divs. **Do not use `mat-form-field` with `matSuffix`/`matPrefix`** — Angular Material MDC renders them as separate DOM containers which breaks layout.

**Icons** — `mat-icon` uses Material Icons loaded from Google Fonts. Arrow icons (`arrow_forward`) have been replaced with the Unicode character `→` to avoid font-loading flicker. Keep this pattern for any new arrow/directional icons.

### Docker Compose

Backend container auto-runs `makemigrations` + `migrate` + `loaddata fixtures/initial_data.json` + `runserver` on every start. The fixture seeds 6 `InsuranceProduct` records.

Frontend runs `npm install` then `ng serve --poll 10000 --no-live-reload`. The `--no-live-reload` prevents phantom browser refreshes caused by Docker volume polling false positives on Windows hosts.

### Environment Variables (backend)

| Variable | Value (dev) |
|---|---|
| `DB_HOST` | `db` (Docker service name) |
| `DB_NAME` | `abc_insurance` |
| `DB_USER` | `abc_user` |
| `DB_PASSWORD` | `abc_password_2024` |
| `DEBUG` | `True` |
| `SECRET_KEY` | dev key in docker-compose |

### CSS / Styling

Global CSS variables and utility classes are in `frontend/src/styles.scss`. Component styles are inline within each component's `styles: []` array. Key variables: `--primary`, `--border`, `--surface-2`, `--shadow-sm`, `--text-muted`. Animations: `fadeInUp`, `shimmer` (skeleton loaders), `float`.
