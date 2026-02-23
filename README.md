# Game Theory Trainer

An interactive web app for practicing core concepts of game theory
(Simultaneous and Bayesian games: best responses, dominant strategies, Nash equilibria – including mixed strategies).

https://jakobsar.shinyapps.io/game-theory-trainer/

The app is primarily aimed at students of economics, business administration, and related fields.

---

## Features

- **Introduction to normal-form games**
  - Sets of players
  - Strategy sets
  - Utility functions
  - Representation of payoffs

- **Interactive exercises with random games**
  - Each exercise generates **new payoff values**
  - Automatic **answer checking with feedback**
  - Didactically controlled randomization (no trivial or degenerate cases)

- **Types of exercises**
  1. **Best responses**
  2. **Strictly dominant strategies**
  3. **Strictly & weakly dominant strategies**
  4. **Nash equilibria in pure strategies**
  5. **Strict vs. non-strict Nash equilibria**
  6. **Mixed Nash equilibria (2×2 games)**

---

## Conceptual Coverage

The app covers, among others, the following game-theoretic concepts:

Simultaneous games 
- Best response
- Strictly dominant strategy
- Weakly dominant strategy
- Nash equilibrium (pure)
- Strict Nash equilibrium
- Mixed Nash equilibria
- Indifference conditions

Bayesian games (incomplete information)
- Types and common priors
- Type-dependent payoff matrices
- Expected payoffs under beliefs
- Bayesian Nash equilibrium (introductory level)

---

## Technology

- **Python**
- **Shiny for Python**
- **Bootstrap 5** (Layout & Styling)

---

## Migration Scaffold (React + FastAPI)

The repository now also contains a migration-ready backend scaffold for a modular setup:

- FastAPI backend: `/backend/app/main.py`
- Health endpoint: `GET /healthz`
- Game-tree solver endpoint: `POST /api/v1/game-tree/solve`
- Docker setup: `/backend/Dockerfile`, `/docker-compose.yml`
- CI workflow: `/.github/workflows/backend-ci.yml`
- Migration guide: `/docs/MIGRATION_PLAN.md`

Run locally (without Docker):

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Run with Docker:

```bash
docker compose up --build
```

Frontend (React + Vite):

```bash
cd frontend
npm install
npm run dev
```

Deployment (Vercel + Render):

- Siehe `/docs/DEPLOY.md`

---

## Installation & Launch

### 1. Clone the repository
```bash
git clone https://github.com/DEIN_USERNAME/GameTheoryApp.git
cd GameTheoryApp
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv .venv
```
```bash
source .venv/bin/activate   # macOS / Linux
```
or
```bash
.venv\Scripts\activate      # Windows
```

### 3. Install dependencies

All required packages are listed in the `requirements.txt` file.
Install them using:

```bash
pip install -r requirements.txt
```

### 4. Start the app from the terminal
```bash
shiny run App.py
```
The app will then be available at:
```bash
http://127.0.0.1:8000
```
