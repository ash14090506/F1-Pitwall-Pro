# 🏎️ F1 Pitwall Pro

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![FastF1](https://img.shields.io/badge/FastF1-3.0+-E10600?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**F1 Pitwall Pro** is an elite, multi-document web framework designed for high-performance Formula 1 telemetry analysis. It integrates a sleek, desktop-class UI within the browser to provide real-time strategic insights, temporal driver tracking, and deep-dive statistical comparisons across historical F1 events.

Built for race engineers, data scientists, and hardcore enthusiasts, this suite processes raw car sensor traces into actionable race-winning intelligence.

---

## ⚡ Core Architecture

- **Multi-Document Interface (MDI):** Interactive, draggable, and stackable window cards allowing engineers to monitor limitless concurrent data vectors on a single screen.
- **Synchronized Telemetry Playback Engine:** A global temporal playback slider that aligns all independent analysis windows (Speed, RPM, Gear, Throttle, Brake pressure) to the precise distance marker across multiple drivers simultaneously.
- **Dynamic Track Overlay:** Granular scatter-plot visual representations of the race circuit with dynamic marker-tails, calculating multi-car relative positions simultaneously.
- **Resilient Memory Caching:** Custom Python `FastF1` backend is bulletproofed against F1 Live Timing API throttles and securely buffers active Grand Prix data arrays deep in memory to achieve instantaneous UX plotting velocities.

---

## 🏁 The 8-Pillar Analytics Suite

F1 Pitwall Pro is meticulously organized into 8 overarching analysis categories, mirroring true trackside engineering environments.

### 🟣 1. Historical Analysis
Analyze macro-trends and legacy data from completed sessions.
* **Temperature Analysis:** Track surface and ambient temperature impacts.
* **Track Analysis:** Circuit characteristics and corner mappings.
* **Pitstop Analysis:** Box time efficiency and stationary duration tracking.
* **Accident & Flags Analysis:** SC/VSC and Red Flag historical deployments.
* **Tire Strategy Analysis:** Stint lengths, compound choices, and degradation.
* **Driver Run Position:** Race grid progression charting.
* **Traffic Analysis:** Heatmaps of dirty air and traffic density.

### 🟢 2. Main Telemetry Analysis
The core 6-grid engineering dashboard for raw sensor output.
* **Main Telemetry Dashboard:** Speed, RPM, Gear, Throttle, Brake, DRS traces.
* **Channel-Specific Analysis:** Isolate and expand individual sensor channels.
* **Delta Analysis:** Micro-sector time difference comparisons between drivers.
* **Lap-by-Lap Comparison:** Overlay and scrub through entire stint histories.

### 🩵 3. Lap Data & Long Run
FP2 race-pace simulations and consistency metrics.
* **Detailed Lap Data:** Comprehensive lap-by-lap breakdown matrix.
* **Lap Time Box Plot:** Visualizing driver consistency and stint volatility.
* **Throttle Corner Analysis:** Mapping on-throttle application points per corner.
* **Pedal Behavior Analysis:** Pre-apex and post-apex pedal mapping.
* **Long Run Analysis:** Fuel-corrected race pace and tire degradation modeling.

### 🟠 4. Ideal Lap Analysis
Reconstruct theoretical limits.
* **Sector Reconstruction:** Aggregating the absolute best micro-sectors across a session to calculate a driver's theoretical "perfect lap" limit.

### 🩷 5. Performance Evaluation
Deep-dive car characteristic benchmarking.
* **Straight Line Speed:** Trap speed analysis and aerodynamic drag profiling.
* **Brake & Accel Performance:** Longitudinal G-force and braking efficiency.
* **Corner Classification:** Slow, Medium, and High-speed corner performance profiling.

### 🔵 6. AI Prediction Models
Machine learning driven race forecasting.
* **Qualifying & Race Predictions:** Algorithmic gap-prediction utilizing FP data to forecast Qualifying pace and Race finishing distributions.

### 🟡 7. Multi-Season Analysis
Year-over-year circuit evolution.
* **Historical Track Map:** 4-year historical plotting of incident hotspots.
* **Season Start Reaction:** 0-50 km/h acceleration distributions to map driver reaction consistency across the entire calendar.

### 🔴 8. Live Timing & Strategy (Planned)
*The future frontier for real-time race weekend integration.*
* **Core Monitoring:** Ranking Tower, Circle Map, Track & Weather.
* **Strategy & Prescription:** Driver Strategy, Battle Insight, Chase Strategy, Pit Window.
* **Telemetry & Performance:** Real-time Traces, Live Sector Comparisons.
* **History & Stats:** Live Traffic Timeline, Lap Time Distributions.

---

## 🛠️ Technology Stack

### Frontend (Visual Layer)
* **React.js (Vite):** Core interface construction and component state lifecycle.
* **Tailwind CSS:** Fully customized, high-density brutalist data engineering aesthetics (`#0b0d10` deep-dark UI patterns).
* **Plotly.js:** Mathematical charting algorithms rendering vast float arrays flawlessly.
* **Lucide React:** Minified, razor-sharp UI iconography.

### Backend (Telemetry Engine)
* **Python 3.10+ / FastAPI:** High-throughput JSON microservices handling intense algorithmic requests from the browser.
* **FastF1 & Pandas:** Under-the-hood F1 database querying, fetching millions of raw sensor traces and orchestrating temporal alignments seamlessly.
* **Async Threading:** Secure background loading parameters to maintain responsive interfaces while fetching 50MB+ car tracking traces.

---

## 🚀 Installation & Directives

### 1. Backend Spin-Up (Python)
First, ensure your device has Python installed, then map the dependencies:
```bash
# Navigate to the workspace
cd backend

# Install computational dependencies
pip install -r requirements.txt

# Ignite the FastAPI Engine (Runs on PORT 8001)
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

- **Data Slicing Mechanisms:** `App.jsx` handles core logic, looping down the `distance` arrays and injecting them into the `TrackMap.jsx` and `LineChart.jsx` dependencies dynamically aligned with the native `<PlaybackControls />`.
- **System Hard-Reset:** If the F1 Live Timing network fails mid-download, use the **`Analysis > Clear Telemetry Cache`** file menu operation. This pushes a REST execution packet to the python backend to dump its locked threading memory and force a fresh fetch loop.

---

*This application assumes connection to active internet pipelines to securely stream telemetry metadata natively off external Formula 1 telemetry provider nodes.*
