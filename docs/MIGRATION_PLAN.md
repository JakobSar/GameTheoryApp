# Migration Plan: Shiny -> React + FastAPI

## Zielbild

- Frontend: React (Deployment z. B. Vercel)
- Backend: FastAPI (Deployment z. B. Render/Fly/Cloud Run)
- Persistenz: Managed Postgres
- Optional: Redis fuer Cache/Sessions

## Was im Repo bereits vorbereitet ist

- FastAPI-Backend unter `backend/app`
- API-Endpunkt `POST /api/v1/game-tree/solve` fuer einen ersten Tree-Solver
- Migrierte Altübungen als API:
  - `GET /api/v1/exercises/ex1/new`
  - `POST /api/v1/exercises/ex1/check`
  - `GET /api/v1/exercises/ex2/new`
  - `POST /api/v1/exercises/ex2/check`
- `GET /healthz` fuer Health Checks
- CORS und ENV-Konfiguration
- Dockerfile fuer Backend
- `docker-compose.yml` mit API + Postgres + Redis
- GitHub Actions Workflow fuer Tests + Docker Build

## API-Beispiel

Request:

```json
{
  "game": {
    "root": "n0",
    "players": ["P1", "P2"],
    "nodes": [
      {
        "id": "n0",
        "node_type": "decision",
        "player": "P1",
        "actions": [
          {"id": "a", "label": "Left", "child": "n1"},
          {"id": "b", "label": "Right", "child": "n2"}
        ]
      },
      {"id": "n1", "node_type": "terminal", "payoff": {"by_player": {"P1": 2, "P2": 1}}},
      {"id": "n2", "node_type": "terminal", "payoff": {"by_player": {"P1": 3, "P2": 0}}}
    ]
  }
}
```

Response (Beispiel):

```json
{
  "root_value": {"P1": 3.0, "P2": 0.0},
  "strategy_by_node": {"n0": "b"},
  "steps": [
    {
      "node_id": "n0",
      "player": "P1",
      "chosen_action_id": "b",
      "chosen_action_label": "Right",
      "continuation_payoff": {"P1": 3.0, "P2": 0.0}
    }
  ]
}
```

## Lokal starten

Mit Docker:

```bash
docker compose up --build
```

Ohne Docker:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

## Naechste technische Schritte

1. React-Frontend initialisieren (`frontend/`) und API-Client anbinden.
2. Tree-Builder-UI (Nodes/Edges) mit JSON Export bauen.
3. Bestehende Shiny-Logik schrittweise als API-Endpunkte extrahieren.
4. Auth + DB-Modelle fuer gespeicherte Aufgaben und User-Progress ergaenzen.
