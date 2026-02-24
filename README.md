# Game Theory Trainer

Interaktive Lern- und Übungsplattform für Spieltheorie mit React-Frontend und FastAPI-Backend.

## Überblick

Die App kombiniert:
- Konzeptseiten für simultane, sequenzielle und Bayes-Spiele
- interaktive Übungsformate mit sofortigem Feedback
- zufällig generierte Aufgabeninstanzen (didaktisch kontrolliert)

Die Oberfläche ist zweisprachig (`de`/`en`) und für Desktop + Mobile ausgelegt.

## Architektur

- Frontend: React + Vite (`/frontend`)
- Backend: FastAPI (`/backend`)
- API-Kommunikation im Frontend über `/api` und `/healthz`
- Lokales Vite-Proxy-Setup auf `http://localhost:8000`

Wichtige Endpunkte:
- `GET /healthz`
- `POST /api/v1/game-tree/solve`
- `GET/POST /api/v1/exercises/*`
- `GET/POST /api/v1/exercises/bayes/*`

## Inhalte und Übungen

### 1) Simultane Spiele (Normalform)
- Beste Antworten
- strikt/ schwach dominante Strategien
- Nash-Gleichgewichte (rein)
- strikt vs. nicht-strikt
- gemischte Gleichgewichte
- Trembling-Hand-Perfektion
- evolutionär stabile Strategien
- Marktauswahlspiel (vollständig gemischtes Gleichgewicht)

### 2) Spielbäume (sequenzielle Spiele)
- Übung 1: schrittweiser Rückwärtsinduktions-Simulator
- Übung 2: komplexe Bäume mit mehreren Teilspielen und möglichen Mehrfach-SPE

### 3) Bayes-Spiele
- einseitige private Information
- posterior-basierte Auswertung
- Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information

### 4) Besondere Spiele
- Gefangenendilemma
- Feiglingsspiel (Chicken)
- Jagdspiel (Stag Hunt)
- Kampf der Geschlechter
- Ultimatumspiel (simultanisierte Variante)

## Repository-Struktur

- `frontend/` React-App (UI, Interaktionen, Styling)
- `backend/` FastAPI-App (Exercise-Generatoren, Prüflogik, Solver)
- `backend/tests/` API- und Solver-Tests
- `docs/DEPLOY.md` Deploy-Anleitung
- `docker-compose.yml` lokales Stack-Setup (API + Postgres + Redis)
- `render.yaml` Render-Blueprint für Backend-Deploy

## Lokale Entwicklung

### Voraussetzungen

- Python 3.11+
- Node.js 18+
- npm

### Backend starten

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Healthcheck:

```bash
curl http://localhost:8000/healthz
```

### Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Frontend läuft lokal auf:
- `http://localhost:3000`

Hinweis: `vite.config.js` proxied `/api` und `/healthz` auf `http://localhost:8000`.

## Tests

Backend-Tests:

```bash
pytest backend/tests -q
```

## Build

Frontend-Production-Build:

```bash
cd frontend
npm run build
npm run preview
```

## Deployment

Kurzfassung:
- Backend auf Render (über `render.yaml`)
- Frontend auf Vercel (`frontend/` als Root)
- `VITE_API_BASE` im Frontend auf Render-URL setzen
- `CORS_ORIGINS` im Backend passend zur Frontend-Domain setzen

Details: [docs/DEPLOY.md](docs/DEPLOY.md)

## Konfiguration

Backend-Env-Variablen (Auszug):
- `APP_ENV`
- `APP_NAME`
- `APP_PORT`
- `CORS_ORIGINS`
- `CORS_ORIGIN_REGEX`
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`

Defaults sind in `backend/app/config.py` definiert.

## Bekannte Hinweise

- Für sehr kleine Mobile-Displays werden Payoff-Tabellen automatisch skaliert.
- Falls API-Aufrufe fehlschlagen: zuerst `VITE_API_BASE` und `CORS_ORIGINS` prüfen.

## Lizenz

Derzeit keine dedizierte Lizenzdatei im Repository. Bei externer Nutzung bitte vorab klären.
