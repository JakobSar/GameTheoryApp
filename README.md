# Game Theory Trainer (Normalformspiele)

Eine interaktive Web-App zum Üben zentraler Konzepte der Spieltheorie  
(Normalformspiele, beste Antworten, dominante Strategien, Nash-Gleichgewichte – auch gemischt).

Die App richtet sich insbesondere an Studierende der Volkswirtschaftslehre, Wirtschaftswissenschaften und verwandter Fächer.

---

## Features

- **Einführung in Normalformspiele**
  - Spielermengen
  - Strategiemengen
  - Nutzenfunktionen
  - Darstellung von Auszahlungen

- **Interaktive Übungen mit Zufallsspielen**
  - Jede Übung erzeugt **neue Nutzenwerte**
  - Automatische **Antwortprüfung mit Feedback**
  - Didaktisch kontrollierte Zufallslogik (keine trivialen oder degenerierten Fälle)

- **Übungstypen**
  1. **Beste Antworten**
  2. **Strikt dominante Strategien**
  3. **Strikt & schwach dominante Strategien**
  4. **Nash-Gleichgewichte in reinen Strategien**
  5. **Strikte vs. nicht-strikte Nash-Gleichgewichte**
  6. **Gemischte Nash-Gleichgewichte (2×2-Spiele)**

---

## Inhaltliche Konzepte

Die App deckt u. a. folgende spieltheoretische Konzepte ab:

- Beste Antwort
- Strikt dominante Strategie
- Schwach dominante Strategie
- Nash-Gleichgewicht (rein)
- Striktes Nash-Gleichgewicht
- Gemischte Nash-Gleichgewichte
- Indifferenzbedingungen

---

## Technologie

- **Python**
- **Shiny for Python**
- **Bootstrap 5** (Layout & Styling)

---

## Installation & Start

### 1. Repository klonen
```bash
git clone https://github.com/DEIN_USERNAME/GameTheoryApp.git
cd GameTheoryApp

### 2. Virtuelle Umgebung erstellen (empfohlen)
python -m venv .venv
source .venv/bin/activate   # macOS / Linux
# oder
.venv\Scripts\activate      # Windows
