# ABC Insurance

Aplikacja webowa fullstack do zarządzania polisami ubezpieczeniowymi i szkodami. Zbudowana w Django REST Framework i Angular 17.

## Stack Technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Backend | Python 3.11, Django 4.2, Django REST Framework |
| Autoryzacja | JWT (djangorestframework-simplejwt) — access 1h, refresh 7d z rotacją i blacklistą |
| Frontend | Angular 17 (standalone components, signals, lazy loading) |
| Stylowanie | Tailwind CSS |
| Baza danych | PostgreSQL 15 |
| Konteneryzacja | Docker + Docker Compose |
| Dokumentacja API | drf-spectacular (Swagger UI) |

## Funkcjonalności

### Klient
- Rejestracja i logowanie
- Przeglądanie własnych polis ubezpieczeniowych
- Zgłaszanie szkód przez wieloetapowy formularz
- Śledzenie statusu szkody w czasie rzeczywistym
- Otrzymywanie powiadomień o zmianach statusu

### Agent
- Przeglądanie wszystkich klientów, polis i szkód
- Przetwarzanie kolejki szkód (`/agent/queue`)
- Zatwierdzanie / odrzucanie / żądanie dodatkowych informacji
- Zarządzanie statusami polis
- Przypisywanie szkód do agentów

### Administrator
- Pełny panel administracyjny (`/admin`) z zarządzaniem użytkownikami
- Tworzenie nowych użytkowników (agenci, klienci, administratorzy)
- Zmiana ról użytkowników w czasie rzeczywistym
- Przegląd systemowy: szkody według statusu, ostatnia aktywność
- Dostęp do Django Admin pod `/admin/` (panel backendowy Django)

## Workflow Statusów Szkód

```
draft → submitted → under_review → approved → paid → closed
                                 ↘ partially_approved ↗
                                 ↘ additional_info → under_review
                  ↘ rejected → closed
```

Każde przejście jest walidowane po stronie serwera. Każda zmiana jest zapisywana w `ClaimStatusHistory`.

## Struktura Projektu

```
abc-insurance/
├── backend/
│   ├── abc_insurance/      # Ustawienia Django i URLs
│   ├── users/              # Autoryzacja, role, JWT, zarządzanie użytkownikami
│   ├── policies/           # Produkty ubezpieczeniowe i polisy klientów
│   ├── claims/             # Szkody z workflow statusów
│   ├── notifications/      # Powiadomienia oparte na eventach
│   └── fixtures/           # Dane początkowe - 6 produktów ubezpieczeniowych
├── frontend/
│   └── src/app/
│       ├── core/           # Serwisy, interceptory, guardy, modele
│       └── features/       # auth, dashboard, policies, claims, agent, admin, landing
├── docker-compose.yml
└── start.bat               # Launcher lokalnego dev (Windows)
```

## Szybki Start z Docker

**⚠️ Ostrzeżenie bezpieczeństwa:** Przed wdrożeniem na produkcję:
1. Zmień `SECRET_KEY` w `docker-compose.yml` na losowy ciąg znaków
2. Ustaw `DEBUG=False` w środowisku backendu
3. Zaktualizuj dane dostępowe do bazy danych
4. Prawidłowo skonfiguruj originy CORS

```bash
git clone <url-repo>
cd abc-insurance
docker-compose up --build
```

| Serwis | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000/api/ |
| Swagger UI | http://localhost:8000/api/docs/ |
| Django Admin | http://localhost:8000/admin/ |

## Lokalne Uruchomienie (bez Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements-local.txt

# SQLite (bez potrzeby PostgreSQL):
set USE_SQLITE=True

python manage.py migrate
python manage.py loaddata fixtures/initial_data.json
python manage.py seed_demo_data
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Alternatywnie: start.bat (Windows)

Automatyczne uruchomienie backendu i frontendu w osobnych oknach:

```bash
start.bat
```

## Konta Demo

| Rola | Nazwa użytkownika | Hasło |
|------|-------------------|-------|
| Klient | `klient` | `Haslo123!` |
| Agent | `agent` | `Haslo123!` |
| Admin | `admin` | `Haslo123!` |

> Uruchom `python manage.py seed_demo_data` aby utworzyć konta demo i przykładowe polisy.

## Referencja API (wybrane endpointy)

| Metoda | Endpoint | Dostęp |
|--------|----------|--------|
| POST | `/api/auth/login/` | Publiczny |
| POST | `/api/auth/register/` | Publiczny |
| GET | `/api/auth/profile/` | Uwierzytelniony |
| GET | `/api/policies/` | Uwierzytelniony |
| GET | `/api/policies/products/` | Uwierzytelniony |
| PATCH | `/api/policies/{id}/status/` | Agent |
| GET | `/api/claims/` | Uwierzytelniony |
| POST | `/api/claims/` | Uwierzytelniony |
| POST | `/api/claims/{id}/submit/` | Właściciel |
| PATCH | `/api/claims/{id}/status/` | Agent |
| GET | `/api/claims/queue/` | Agent |
| GET | `/api/notifications/` | Uwierzytelniony |
| GET | `/api/auth/admin/users/` | Admin |
| POST | `/api/auth/admin/users/` | Admin |
| PATCH | `/api/auth/admin/users/{id}/role/` | Admin |

Pełna interaktywna dokumentacja: `http://localhost:8000/api/docs/`

## Zmienne Środowiskowe

Zmienne środowiskowe backendu (utwórz `backend/.env` z `backend/.env.example`):

| Zmienna | Domyślna | Opis |
|---------|----------|------|
| `SECRET_KEY` | - | **Wymagane** Klucz tajny Django (zmień w produkcji!) |
| `DEBUG` | `True` | Tryb debugowania (ustaw na `False` w produkcji) |
| `USE_SQLITE` | `False` | Użyj SQLite zamiast PostgreSQL |
| `DB_NAME` | `abc_insurance` | Nazwa bazy PostgreSQL |
| `DB_USER` | `abc_user` | Użytkownik PostgreSQL |
| `DB_PASSWORD` | - | Hasło PostgreSQL |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | - | Dozwolone originy CORS (oddzielone przecinkami) |

## Checklista Wdrożenia Produkcyjnego

- [ ] Zmień `SECRET_KEY` na losowy ciąg 50+ znaków
- [ ] Ustaw `DEBUG=False`
- [ ] Zaktualizuj dane dostępowe do bazy (silne hasła)
- [ ] Skonfiguruj `CORS_ALLOWED_ORIGINS` z domeną frontendu
- [ ] Skonfiguruj certyfikaty SSL/TLS (HTTPS)
- [ ] Skonfiguruj backend email dla powiadomień
- [ ] Ustaw kopie zapasowe PostgreSQL
- [ ] Przejrzyj i zaktualizuj `ALLOWED_HOSTS` w ustawieniach Django
- [ ] Rozważ użycie plików `.env` specyficznych dla środowiska

## Kategorie Produktów Ubezpieczeniowych

System wspiera 6 kategorii ubezpieczeń:

| Kategoria | Opis |
|-----------|------|
| `auto` | Ubezpieczenia komunikacyjne (OC, AC, Assistance) |
| `property` | Nieruchomości (domy, mieszkania, wyposażenie) |
| `health` | Zdrowotne (prywatna opieka medyczna, hospitalizacja) |
| `life` | Na życie (ochrona finansowa dla bliskich) |
| `travel` | Podróżne (koszty leczenia, bagaż, odwołanie lotu) |
| `liability` | OC zawodowe (odpowiedzialność cywilna dla firm i freelancerów) |

## Efekty Wizualne Landing Page

Landing page zawiera ponad 20 zaawansowanych efektów wizualnych:

- 🎨 **Particle system** z animowanymi połączeniami
- ✨ **Custom cursor** z efektem trailing
- 💫 **Magnetic buttons** reagujące na kursor
- 🌊 **Ripple effect** przy kliknięciach
- 🎭 **3D tilt cards** z efektem perspektywy
- 📊 **Progress rings** z animacją wypełnienia
- 🔄 **Horizontal scroll section** z drag & drop
- 🌈 **Mesh gradient** animowany w tle
- 🎬 **Scroll-snap sections** dla płynnej nawigacji
- 💎 **Glassmorphism** na elementach UI
- ⚡ **Floating animations** na ikonach
- 🔆 **Card shine effect** przy hover
- 🎯 **Scale parallax** reagujący na scroll
- 📝 **Text reveal animations** z fade-in
- 🌟 **Glow effects** na przyciskach

## Licencja

Ten projekt został stworzony jako demonstracja umiejętności fullstack development.
