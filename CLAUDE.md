# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ABC Insurance — system zarządzania polisami i szkodami ubezpieczeniowymi. UI w języku polskim.
- **Backend**: Django 4.2 + DRF + PostgreSQL 15 (lub SQLite lokalnie)
- **Frontend**: do zbudowania od nowa (backend gotowy)
- **Infra**: Docker Compose (opcjonalnie) lub lokalnie przez `start.bat`

---

## Commands

### Lokalny start (jeden klik)

```bat
start.bat        # uruchamia backend + frontend w osobnych oknach
setup-local.bat  # jednorazowa konfiguracja: venv, migracje, dane demo
```

### Backend

```bash
cd backend
call venv\Scripts\activate.bat      # Windows
pip install -r requirements-local.txt
python manage.py migrate
python manage.py seed_demo_data      # tworzy konta demo + przykładowe polisy
python manage.py runserver
```

Konta demo: `klient / Haslo123!` (customer), `agent / Haslo123!` (agent)

SQLite zamiast PostgreSQL: ustaw `USE_SQLITE=True` w środowisku lub `.env`.

### Docker (opcjonalnie)

```bash
docker-compose up --build -d
docker-compose down
docker logs abc_insurance_backend --follow
```

### API Docs

Swagger UI: `http://localhost:8000/api/docs/`
OpenAPI schema: `http://localhost:8000/api/schema/`

---

## Backend Architecture

```
backend/
├── abc_insurance/   # settings, urls, wsgi
├── users/           # auth, role system, JWT
├── policies/        # produkty ubezpieczeniowe + polisy klientów
│   └── management/commands/seed_demo_data.py
├── claims/          # zgłoszenia szkód + workflow statusów
├── notifications/   # powiadomienia eventowe
└── fixtures/        # initial_data.json — 6 produktów ubezpieczeniowych
```

### Auth & Role System

`User.role` — trzy wartości: `customer`, `agent`, `admin`.

Klasy uprawnień w `users/permissions.py`:
- `IsAgent` — agenci i admini
- `IsOwnerOrAgent` — właściciel zasobu lub agent
- `IsAgentOrAdmin` — agenci lub admini

JWT — `CustomTokenObtainPairSerializer` (users/serializers.py) wstrzykuje do tokena: `role`, `full_name`, `email`. Access: 1h, Refresh: 7d z rotacją i blacklistą.

`POST /api/auth/login/` zwraca `{ access, refresh, user }`.

### API Endpoints

```
POST   /api/auth/login/
POST   /api/auth/token/refresh/
POST   /api/auth/register/
POST   /api/auth/logout/
GET    /api/auth/profile/
PATCH  /api/auth/profile/
POST   /api/auth/change-password/
GET    /api/auth/customers/           # tylko agent/admin

GET    /api/policies/products/        # katalog produktów
GET    /api/policies/
POST   /api/policies/                 # agent
GET    /api/policies/{id}/
PATCH  /api/policies/{id}/status/     # agent
POST   /api/policies/{id}/documents/

GET    /api/claims/queue/             # kolejka do rozpatrzenia (agent)
GET    /api/claims/
POST   /api/claims/
GET    /api/claims/{id}/
POST   /api/claims/{id}/submit/
PATCH  /api/claims/{id}/status/       # agent
PATCH  /api/claims/{id}/assign/       # agent

GET    /api/notifications/
GET    /api/notifications/unread-count/
POST   /api/notifications/mark-all-read/
PATCH  /api/notifications/{id}/read/
```

Wszystkie listy obsługują: filtrowanie (`django-filter`), wyszukiwanie (`SearchFilter`), sortowanie (`OrderingFilter`). Paginacja: 20 wyników/stronę (`?page=N`).

### Claim Workflow

Przejścia statusów zdefiniowane w `ALLOWED_TRANSITIONS` (claims/models.py):

```
draft → submitted → under_review → approved → paid → closed
                                 ↘ partially_approved ↗
                                 ↘ additional_info → under_review
                  ↘ rejected → closed
```

Każde przejście zapisuje wpis w `ClaimStatusHistory`.

### Policy Model

`policy_number` generowany automatycznie: `ABC/YYYY/XXXXXX`. Pola `insured_object` i `coverage_details` to JSONField — przechowują dane pojazdu, adres nieruchomości itp. zależnie od kategorii produktu.

### Kategorie produktów

`auto`, `property`, `health`, `life`, `travel`, `liability`

---

## Environment Variables (backend)

| Zmienna | Dev default |
|---|---|
| `USE_SQLITE` | `False` (użyj `True` lokalnie bez PostgreSQL) |
| `DB_HOST` | `localhost` |
| `DB_NAME` | `abc_insurance` |
| `DB_USER` | `abc_user` |
| `DB_PASSWORD` | `abc_password_2024` |
| `DEBUG` | `True` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` |
