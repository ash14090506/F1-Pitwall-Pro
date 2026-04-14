# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 Strategy AI — an F1 race strategy analysis tool with three interfaces:
- **Data pipeline** (`src/`): Python scripts that process historical F1 data into strategy insights
- **Streamlit dashboard** (`app/dashboard.py`): Interactive strategy wall using pre-processed CSV data
- **React frontend** (`frontend/`): Real-time telemetry comparison tool backed by the FastAPI backend
- **FastAPI backend** (`backend/app.py`): Live telemetry API using the FastF1 library

## Architecture

### Data Pipeline (sequential, must run in order)

1. `src/data_cleaning.py` — Reads `data/raw/*.csv`, outputs `data/processed/lap_times_clean.csv`, `pit_stops_clean.csv`, `results_clean.csv`, `races_clean.csv`
2. `src/feature_engineering.py` — Reads cleaned data, outputs `data/processed/lap_features.csv` (merges laps + pits, adds rolling_pace, pace_delta, stint)
3. `src/risk_detection.py` — Reads `lap_features.csv`, outputs `risk_analysis.csv` (classifies laps as LOW/MEDIUM/HIGH risk)
4. `src/undercut_detection.py` — Reads `lap_features.csv`, outputs `undercut_analysis.csv` (flags undercut threats)
5. `src/strategy_alerts.py` — Merges risk + undercut analyses, outputs `strategy_alerts.csv` (final alerts: STAY OUT / PIT WINDOW OPEN / UNDERCUT THREAT / PIT NOW)

Standalone scripts:
- `src/pit_optimizer.py` — Finds optimal pit lap for a single driver
- `src/race_simulator.py` — Simulates no-stop/early/mid/late pit strategies
- `src/ml_model.py` — Trains a RandomForestClassifier to predict pit stops from lap features

### Streamlit Dashboard (`app/dashboard.py`)
Reads `data/processed/strategy_alerts.csv` + `data/raw/` reference CSVs. Displays race strategy wall with risk timelines, lap time charts, and alert indicators.

### FastAPI Backend (`backend/app.py`)
Three endpoints:
- `GET /api/races?year=` — Event schedule
- `GET /api/drivers?year=&round=&session_type=` — Driver list for a session
- `GET /api/telemetry/fastest?year=&round=&session_type=&driver=` — Fastest lap telemetry (speed, throttle, brake, RPM, gear, DRS)

Uses `data/cache/` for FastF1 response caching.

### React Frontend (`frontend/`)
Vite + React + TailwindCSS v4 + Plotly. Two-driver telemetry comparison dashboard. Talks to the backend at `http://127.0.0.1:8000`.

## Commands

### Backend
```bash
# From project root, with venv activated:
source venv/Scripts/activate   # Windows Git Bash
python -m uvicorn backend.app:app --reload --port 8000

# Install backend dependencies:
pip install -r backend/requirements.txt
```

### Data Pipeline
```bash
# Run each stage in order:
python src/data_cleaning.py
python src/feature_engineering.py
python src/risk_detection.py
python src/undercut_detection.py
python src/strategy_alerts.py

# Optional standalone scripts:
python src/pit_optimizer.py
python src/race_simulator.py
python src/ml_model.py
```

### Streamlit Dashboard
```bash
streamlit run app/dashboard.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # ESLint
```

### Python Dependencies
Key packages: `fastf1`, `pandas`, `numpy`, `scikit-learn`, `streamlit`, `matplotlib`, `fastapi`, `uvicorn`

## Key Constants
- Pit lane time loss: `PIT_LOSS = 12` seconds (defined in both `src/race_simulator.py` and `src/pit_optimizer.py`)
- Risk threshold: `pace_delta > 0.7` flags degradation risk; `stint > 18` flags stint risk (`src/risk_detection.py`)
- Undercut threshold: `pace_delta > 0.5` with rival pitted on previous lap (`src/undercut_detection.py`)