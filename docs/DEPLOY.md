# Deployment (Vercel + Render)

Diese Konfiguration ist für das aktuelle Repo vorbereitet:

- Frontend: `frontend` auf Vercel
- Backend: `backend` als Docker-Webservice auf Render

---

## 1) Backend auf Render deployen

1. Repo zu GitHub pushen.
2. Auf Render: **New +** -> **Blueprint**.
3. Repository auswählen.
4. Render erkennt `render.yaml` im Root.
5. Service erstellen.

Wichtige Environment-Variable danach in Render setzen:

- `CORS_ORIGINS`
  - Wert z. B.:
  - `https://dein-frontend.vercel.app,http://localhost:3000,http://127.0.0.1:3000`

Nach dem Deploy hast du eine URL wie:

- `https://game-theory-api-xxxx.onrender.com`

Quick test:

- `GET https://...onrender.com/healthz`

---

## 2) Frontend auf Vercel deployen

1. Auf Vercel: **Add New** -> **Project**.
2. GitHub-Repo wählen.
3. **Root Directory** auf `frontend` setzen.
4. Bei Environment Variables hinzufügen:
   - `VITE_API_BASE=https://dein-render-service.onrender.com`
5. Deploy starten.

Die Datei `frontend/vercel.json` ist bereits passend gesetzt.

---

## 3) Nach dem ersten Deploy prüfen

1. Öffne die Vercel-URL.
2. Prüfe:
   - Simultane Entscheidungen
   - Sequenzielle Entscheidungen
   - Bayes-Spiele
   - Normalform-Übungen mit Antwortprüfung
3. Wenn API-Calls fehlschlagen:
   - `VITE_API_BASE` prüfen
   - `CORS_ORIGINS` auf Render prüfen

---

## 4) Optional: eigenes Domain-Setup

- Domain in Vercel verbinden (Frontend).
- API-Subdomain optional via Render Custom Domain (z. B. `api.deinedomain.de`).
- Danach `VITE_API_BASE` auf die API-Domain umstellen.
