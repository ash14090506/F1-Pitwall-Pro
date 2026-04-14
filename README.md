# 🏎️ F1 Pitwall Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![FastF1](https://img.shields.io/badge/FastF1-3.0+-E10600)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?logo=tailwind-css&logoColor=white)

**F1 Pitwall Pro** is an advanced, multidocument web framework designed for high-performance Formula 1 telemetry analysis. It integrates a sleek, desktop-like UI environment within the browser to provide real-time strategic insights, temporal driver tracking, and deep dive statistical comparisons across historical F1 events.

---

## ⚡ Core Features

- **Multi-Document Interface (MDI):** Interactive, draggable, and stackable window cards allowing engineers to monitor limitless concurrent data vectors on a single screen.
- **Synchronized Telemetry Playback Engine:** A global temporal playback slider that aligns all independent analysis windows (Speed, RPM, Gear, Throttle, Brake pressure) to the precise distance marker across multiple drivers simultaneously.
- **Dynamic Track Overlay:** Granular scatter-plot visual representations of the race circuit with dynamic marker-tails, calculating multi-car relative positions simultaneously.
- **Resilient Memory Caching:** The custom Python `FastF1` backend is bulletproofed against F1 Live Timing API throttles and securely buffers active Grand Prix data arrays deep in memory to achieve instantaneous UX plotting velocities.
- **Custom Error Boundaries:** Aggressive asynchronous DOM recovery barriers and native remote cache-clearance triggers for ultimate performance stability.

---

## 🛠️ Technology Stack

### Frontend (User Interface)
- **React.js (Vite):** Core interface construction and component state lifecycle.
- **Tailwind CSS:** Fully customized, high-density brutalist data engineering aesthetics (`#0b0d10` deep-dark UI patterns).
- **Plotly.js (via react-plotly):** Mathematical charting algorithms rendering the vast fast-streaming float arrays flawlessly.
- **Lucide React:** Minified UI iconography.

### Backend (Telemetry Processing Engine)
- **Python 3.10+ / FastAPI:** High-throughput JSON microservices handling intense algorithmic requests from the browser.
- **FastF1 & Pandas:** Under-the-hood F1 database querying, fetching millions of raw sensor traces and orchestrating telemetry time-alignments seamlessly.
- **Async Threading:** Secure background loading parameters to maintain responsive interfaces while fetching 50MB+ car tracking traces.

---

## 🚀 Installation & Directives

### 1. Backend Spin-Up (Python)
First, ensure that your device has Python installed, then map the dependencies:
```bash
# Navigate to the workspace (Assuming standard layout)
cd backend

# Install the heavy computational dependencies
pip install -r requirements.txt

# Ignite the FastAPI Engine (Must be running on PORT 8001)
python app.py
```

### 2. Frontend Launch (Vite/React)
In a secondary terminal window, activate the visual layer:
```bash
cd frontend

# Map Node parameters
npm install

# Deploy to local hot-reload server
npm run dev
```

---

## 🔧 Architecture & Commands

- **Data Slicing Mechanisms:** `App.jsx` handles core logic looping down the `x`/`distance` values and injecting them into the `TrackMap.jsx` and `LineChart.jsx` dependencies dynamically aligned with the native `<PlaybackControls />`.
- **System Hard-Reset:** If the F1 Live Timing network fails mid-race download, use the **`Analysis > Clear Telemetry Cache`** file menu operation. This pushes a REST execution packet automatically to the python backend to dump its locked threading memory array and force a fresh fetch loop!

---

*This application assumes connection to active internet pipelines to securely stream telemetry metadata natively off external Formula 1 telemetry provider nodes.*
