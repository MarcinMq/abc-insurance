# ABC Insurance — System zarządzania ubezpieczeniami

Aplikacja webowa dla towarzystwa ubezpieczeniowego **ABC Insurance**, umożliwiająca klientom zgłaszanie szkód, przeglądanie polis oraz śledzenie statusu roszczeń. Agenci ubezpieczeniowi mogą przeglądać i rozpatrywać szkody, zarządzać polisami klientów oraz obsługiwać kolejkę zgłoszeń.

## Technologie

| Warstwa | Technologia |
|---------|-------------|
| Backend | Django 4.2 + Django REST Framework |
| Autoryzacja | JWT (djangorestframework-simplejwt) |
| Frontend | Angular 17 (standalone components) |
| UI Library | Angular Material |
| Baza danych | PostgreSQL 15 |
| Konteneryzacja | Docker + docker-compose |
| API Docs | drf-spectacular (Swagger UI) |

## Architektura systemu

```
abc-insurance/
├── backend/                    # Django REST API
│   ├── abc_insurance/          # Konfiguracja projektu
│   ├── users/                  # Moduł użytkowników (klient/agent/admin)
│   ├── policies/               # Moduł polis ubezpieczeniowych
│   ├── claims/                 # Moduł zgłoszeń szkód
│   ├── notifications/          # Moduł powiadomień
│   └── fixtures/               # Dane startowe (produkty ubezpieczeniowe)
└── frontend/                   # Angular 17
    └── src/app/
        ├── core/               # Serwisy, interceptory, guards
        ├── features/           # Moduły funkcjonalne
        │   ├── auth/           # Logowanie i rejestracja
        │   ├── dashboard/      # Panel główny
        │   ├── policies/       # Lista i szczegóły polis
        │   ├── claims/         # Lista, szczegóły i formularz szkód
        │   └── agent/          # Kolejka agenta
        └── shared/             # Modele TypeScript
```

## Role i uprawnienia

### Klient (`customer`)
- Rejestracja i logowanie
- Przeglądanie własnych polis ubezpieczeniowych
- Zgłaszanie nowych szkód (formularz wieloetapowy)
- Wysyłanie szkody do rozpatrzenia
- Śledzenie statusu szkody w czasie rzeczywistym
- Dodawanie dokumentów do zgłoszenia szkody
- Otrzymywanie powiadomień o zmianach statusu

### Agent ubezpieczeniowy (`agent`)
- Wszystkie uprawnienia klienta
- Przeglądanie polis i szkód wszystkich klientów
- Kolejka szkód do rozpatrzenia (`/agent/queue`)
- Zmiana statusu szkód (workflow z walidacją)
- Zatwierdzanie/odrzucanie szkód z kwotą i uzasadnieniem
- Zarządzanie statusami polis
- Przypisywanie szkód do agentów

## Workflow statusów szkody

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PAID → CLOSED
                 ↘                → PARTIALLY_APPROVED ↗
                  → ADDITIONAL_INFO → UNDER_REVIEW
                 ↘                → REJECTED → CLOSED
```

## Produkty ubezpieczeniowe (dane startowe)

- OC Komunikacyjne (liability)
- AC Auto Casco (auto)
- Ubezpieczenie Nieruchomości (property)
- Ubezpieczenie Zdrowotne Premium (health)
- Ubezpieczenie na Życie (life)
- Ubezpieczenie Podróżne (travel)

## Uruchomienie z Docker

```bash
# Klonowanie i start
git clone <repo>
cd abc-insurance
docker-compose up --build

# Dostęp
# Frontend:  http://localhost:4200
# Backend API: http://localhost:8000/api/
# Swagger UI:  http://localhost:8000/api/docs/
# Django Admin: http://localhost:8000/admin/
```

## Uruchomienie bez Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Skonfiguruj bazę danych PostgreSQL i utwórz plik .env:
# SECRET_KEY=your-secret-key
# DB_NAME=abc_insurance
# DB_USER=abc_user
# DB_PASSWORD=your_password
# DB_HOST=localhost

python manage.py migrate
python manage.py loaddata fixtures/initial_data.json
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

## Tworzenie użytkowników testowych

```bash
# Klient
python manage.py shell -c "
from users.models import User
User.objects.create_user('klient1', 'klient@abc.pl', 'Haslo123!',
  first_name='Jan', last_name='Kowalski', role='customer')
"

# Agent (wymaga AgentProfile)
python manage.py shell -c "
from users.models import User, AgentProfile
u = User.objects.create_user('agent1', 'agent@abc.pl', 'Haslo123!',
  first_name='Anna', last_name='Nowak', role='agent')
AgentProfile.objects.create(user=u, license_number='AG/2024/001',
  department='Szkody komunikacyjne')
"
```

## Endpointy API (wybrane)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/login/` | Logowanie (JWT) |
| POST | `/api/auth/register/` | Rejestracja klienta |
| GET | `/api/auth/profile/` | Profil zalogowanego |
| GET | `/api/policies/` | Lista polis |
| GET | `/api/policies/products/` | Produkty ubezpieczeniowe |
| PATCH | `/api/policies/{id}/status/` | Zmiana statusu polisy (agent) |
| GET | `/api/claims/` | Lista szkód |
| POST | `/api/claims/` | Utwórz zgłoszenie |
| POST | `/api/claims/{id}/submit/` | Wyślij szkodę do rozpatrzenia |
| PATCH | `/api/claims/{id}/status/` | Zmień status (agent) |
| GET | `/api/claims/queue/` | Kolejka szkód (agent) |
| GET | `/api/notifications/` | Powiadomienia |

Pełna dokumentacja API dostępna pod: `http://localhost:8000/api/docs/`

## Funkcje warte uwagi (portfolio)

- **Workflow statusów** z walidacją dozwolonych przejść po stronie backendu i frontendu
- **Role-based access control** — każda warstwa (model, serializer, view, frontend guard) pilnuje uprawnień
- **JWT z automatycznym odświeżaniem** — interceptor Angular obsługuje 401 i odnawia token
- **Historia zmian statusu** — każda zmiana jest audytowana w `ClaimStatusHistory`
- **Powiadomienia** — automatycznie tworzone przy kluczowych zdarzeniach, polling co 30s
- **Standalone Components** — Angular 17, lazy loading każdej strony
- **Swagger UI** — pełna dokumentacja API generowana automatycznie
