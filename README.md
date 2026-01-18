# Game Theory Trainer (Normal-Form Games)

An interactive web app for practicing core concepts of game theory  
(normal-form games, best responses, dominant strategies, Nash equilibria – including mixed strategies).

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

- Best response
- Strictly dominant strategy
- Weakly dominant strategy
- Nash equilibrium (pure)
- Strict Nash equilibrium
- Mixed Nash equilibria
- Indifference conditions

---

## Technology

- **Python**
- **Shiny for Python**
- **Bootstrap 5** (Layout & Styling)

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
