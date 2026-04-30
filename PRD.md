# F1 PITWALL PRO — Product Requirements Document (PRD)
# Ralph Loop Autonomous Agent Specification
# ==========================================
# This file is the single source of truth for the Ralph Loop agent.
# The agent holds NO memory between iterations — it reads THIS file
# and progress.txt on every loop to decide what to work on next.
#
# STATUS LEGEND:
#   [ ] = Not started
#   [/] = In progress
#   [x] = Completed & verified
#   [!] = Blocked / needs human input
#
# PRIORITY: P0 = Critical, P1 = High, P2 = Medium, P3 = Nice-to-have

---

## 🏗️ Project Context

**Project**: F1 Pitwall Pro — Professional F1 Telemetry Analysis Workstation  
**Stack**: Vite + React 19 + TailwindCSS v4 + Plotly.js (frontend) | FastAPI + FastF1 + Pandas (backend)  
**Frontend Dir**: `frontend/src/` — Components in `frontend/src/components/`  
**Backend Dir**: `backend/app.py` (single-file FastAPI server)  
**API Base**: `http://127.0.0.1:8001/api`  
**Styling**: TailwindCSS v4 utility classes + custom CSS in `index.css`  
**Chart Library**: `react-plotly.js` (Plotly wrapper)  
**Icons**: `lucide-react`  
**Data Source**: FastF1 Python library (caches F1 Live Timing data)  

### Design Language
- Dark theme: `#0b0d10` (desktop), `#16181d` (panel), `#1b1d24` (menubar)
- Borders: `#2b2e36`
- Text: `#e2e8f0` (main), `#94a3b8` (muted)
- Accent: Blue (`#3b82f6`)
- Team colors from FastF1 `driver.TeamColor`
- Compound colors: SOFT=`#ff3333`, MEDIUM=`#ffd700`, HARD=`#ffffff`, INTERMEDIATE=`#39b54a`, WET=`#0072c6`
- All charts use dark transparent backgrounds
- WindowCard pattern for all modules (title bar + content + optional close)

### Architecture Pattern
1. **Backend**: Add a new `@app.get("/api/...")` endpoint in `backend/app.py`
2. **Frontend Component**: Create a new `.jsx` file in `frontend/src/components/`
3. **Wire into App.jsx**: Import component, add to `renderModalContent()` switch, add to Sidebar
4. **Sidebar**: Add entry in `Sidebar.jsx` under appropriate section

### Existing Implemented Modules
These are DONE. Do NOT re-implement:
- [x] Speed / Brake / Throttle / Gear / RPM / DRS line charts (main grid)
- [x] Track Map with driver position markers
- [x] Playback Controls (distance scrubber)
- [x] Temperature & Weather Analysis
- [x] Pitstop Analysis (team summary + detailed log)
- [x] Accident & Flags Timeline (race control messages)
- [x] Tire Strategy Grid (stint bar visualization)
- [x] Driver Run Position (position vs lap chart)
- [x] Traffic Heatmap (dirty air percentage)
- [x] Delta Analysis (time delta + speed delta between 2 drivers)
- [x] G-G Acceleration Chart (friction circle)
- [x] Detailed Lap Data Matrix (table with sector times)
- [x] Lap Time Box Plot
- [x] Pedal Behavior Analysis (throttle/brake/trail/coast stacked bar)
- [x] Throttle Corner Analysis (throttle vs detected corners)
- [x] Long Run Analysis (fuel-corrected FP2 stint degradation)
- [x] Ideal Lap Ranking & Sector Comparison (dual-panel)
- [x] Lap-by-Lap Comparison Modal

---

## 📋 TASKS — Phase 1: Missing Core Modules (P0)

### TASK 1.1: Straight Line Speed Analysis [ ]
**Priority**: P0  
**Reference**: PITWALL Section 5.1  
**Description**: Collect and compare top speed / speed trap data at key straight-line endpoints for ALL drivers.  

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/straight_line_speed?year=&round=&session_type=`
- For each driver, find their fastest lap, extract telemetry, identify the top speed point(s)
- Also use `SpeedST` (speed trap) from lap data if available
- Return: `{ "drivers": [{ "driver": "VER", "top_speed": 340.2, "speed_trap": 338.5, "team_color": "#0000FF" }] }`
- Sort by top_speed descending

**Frontend** (`frontend/src/components/StraightLineSpeed.jsx`):
- Horizontal bar chart using Plotly showing top speed per driver
- Bars colored by team color
- Tooltip showing exact speed values
- Title: "Straight Line Speed Analysis"

**Sidebar**: Add under a new section "Speed & Corner Analysis"  
**App.jsx**: Add case in `renderModalContent()`, import component  

**Acceptance Criteria**:
- [ ] Backend endpoint returns valid data for any race/session
- [ ] Bar chart renders with team-colored bars
- [ ] Sorted by fastest → slowest
- [ ] Accessible from sidebar click

---

### TASK 1.2: Brake & Acceleration Performance [ ]
**Priority**: P0  
**Reference**: PITWALL Section 5.2  
**Description**: Scatter plots analyzing deceleration and acceleration G-forces.  

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/brake_accel_performance?year=&round=&session_type=&drivers=`
- For each driver, get fastest lap telemetry
- Compute: max braking G (min of Lon_Accel), max acceleration G (max of Lon_Accel), max lateral G
- Identify heavy braking zones (consecutive Lon_Accel < -2.0G) with entry/exit speeds
- Return per-driver stats + braking zone details

**Frontend** (`frontend/src/components/BrakeAccelPerformance.jsx`):
- Scatter plot: X = max braking G, Y = max acceleration G for each driver
- Points colored by team color, labeled with driver abbreviation
- Second sub-chart: braking zone comparison (entry speed vs deceleration distance)
- Dark theme styling consistent with existing components

**Sidebar**: Add under "Speed & Corner Analysis"  
**Acceptance Criteria**:
- [ ] Scatter plot renders correctly with labeled driver points
- [ ] Braking zone sub-chart is functional
- [ ] Tooltip shows exact G values

---

### TASK 1.3: Corner Performance Classification [ ]
**Priority**: P0  
**Reference**: PITWALL Section 5.3  
**Description**: Classify corners by speed into low/medium/high categories and compute average minimum apex speed.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/corner_classification?year=&round=&session_type=&drivers=`
- Use circuit_info corners + telemetry to get min speed at each corner
- Classify: Low-speed (<120 km/h), Medium (120-180), High-speed (>180)
- For each driver, compute average min speed per category
- Return: categorized corner data

**Frontend** (`frontend/src/components/CornerClassification.jsx`):
- Grouped bar chart: categories on X-axis, avg min speed on Y-axis, grouped by driver
- Color-coded by team
- Corner list table showing each corner's classification

**Sidebar**: Add under "Speed & Corner Analysis"  
**Acceptance Criteria**:
- [ ] Corners correctly classified by speed threshold
- [ ] Grouped bar chart renders
- [ ] Corner table shows details

---

## 📋 TASKS — Phase 2: AI Prediction Models (P1)

### TASK 2.1: FP3-to-Qualifying Prediction [ ]
**Priority**: P1  
**Reference**: PITWALL Section 6  
**Description**: Use FP3 practice lap times to predict qualifying performance.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/predict/qualifying?year=&round=`
- Load FP3 session data
- For each driver: get best lap, apply fuel correction (~1.5s for FP3 fuel load)
- Apply compound correction: SOFT=0s, MEDIUM=+0.6s, HARD=+1.2s
- Rank drivers by predicted qualifying time
- Return: `{ "predictions": [{ "driver": "VER", "fp3_best": 92.5, "predicted_quali": 91.0, "compound_used": "MEDIUM" }] }`

**Frontend** (`frontend/src/components/QualiPrediction.jsx`):
- Table showing FP3 time → predicted quali time → actual quali time (if Q data available)
- Accuracy metric (MAE) if comparing to actual
- Color-coded rows by team

**Sidebar**: Add under new section "AI Predictions"  
**Acceptance Criteria**:
- [ ] Prediction endpoint works with fuel + compound corrections
- [ ] Table displays predictions with team colors
- [ ] Shows accuracy when actual qualifying data is available

---

### TASK 2.2: Qualifying-to-Race Prediction [ ]
**Priority**: P1  
**Reference**: PITWALL Section 6  
**Description**: Based on qualifying results, simulate likely race finishing positions.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/predict/race?year=&round=`
- Load qualifying results (grid positions)
- Simple position-change model: historically ~30% of positions change during race
- Apply circuit-specific overtaking difficulty (street circuits = low, power circuits = high)
- Return predicted finishing order with confidence intervals

**Frontend** (`frontend/src/components/RacePrediction.jsx`):
- Side-by-side comparison: Grid Position → Predicted Finish → Actual (if race data available)
- Arrow indicators showing predicted gains/losses
- Overall prediction accuracy score

**Sidebar**: Add under "AI Predictions"  
**Acceptance Criteria**:
- [ ] Prediction produces sensible outputs
- [ ] Visual comparison with actual results when available
- [ ] Arrow indicators for position changes

---

## 📋 TASKS — Phase 3: Multi-Season Analysis (P1)

### TASK 3.1: Historical Circuit Flag Statistics [ ]
**Priority**: P1  
**Reference**: PITWALL Section 7.1  
**Description**: Aggregate Yellow/Red/SC/VSC statistics per circuit across 2022-2025 seasons.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/historical/flags?circuit_name=`
- Load race sessions from 2022-2025 for the specified circuit
- Count Yellow, Red, SC, VSC events per year from race_control_messages
- Return year-by-year flag statistics table

**Frontend** (`frontend/src/components/HistoricalFlags.jsx`):
- Table: Rows = Years (2022-2025), Columns = Yellow | Red | SC | VSC | Total
- Summary row showing averages
- Color-coded cells (more incidents = warmer color)
- Combine with existing Track Map if possible

**Sidebar**: Add under new section "Multi-Season Analysis"  
**Acceptance Criteria**:
- [ ] Data correctly aggregated across seasons
- [ ] Table renders with heatmap coloring
- [ ] Works for all circuits on the calendar

---

### TASK 3.2: Season Start Reaction Analysis [ ]
**Priority**: P2  
**Reference**: PITWALL Section 7.2  
**Description**: Analyze drivers' race start performance across the season using 0-50 km/h acceleration.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/historical/starts?year=&driver=`
- For each race in the season, load race telemetry for first lap
- Estimate 0-50 km/h time from standing start telemetry
- Return: per-race start performance array

**Frontend** (`frontend/src/components/StartAnalysis.jsx`):
- Box plot showing start performance distribution per driver
- Median reaction time comparison
- Team-color styled

**Sidebar**: Add under "Multi-Season Analysis"  
**Acceptance Criteria**:
- [ ] Start performance data extracted from race lap 1
- [ ] Box plot renders across multiple races
- [ ] Team colors applied

---

## 📋 TASKS — Phase 4: Enhanced Telemetry Features (P2)

### TASK 4.1: Speed Heatmap on Track Map [ ]
**Priority**: P2  
**Reference**: PITWALL Section 1.2  
**Description**: Overlay a speed-gradient color map onto the existing Track Map.

**Frontend** (`frontend/src/components/TrackMap.jsx` — MODIFY):
- Add a toggle button "Speed Heatmap"
- When enabled, color each track segment by speed value (blue=slow, red=fast)
- Use existing telemetry data's X/Y/Speed arrays
- Interpolate colors along the track path

**Acceptance Criteria**:
- [ ] Toggle appears on Track Map component
- [ ] Speed heatmap renders correctly
- [ ] Color scale legend displayed

---

### TASK 4.2: Sector Comparison Chart [ ]
**Priority**: P2  
**Reference**: PITWALL Telemetry 8.3 - Sector Comparison  
**Description**: Compare two drivers' deltas for a selected sector (S1/S2/S3).

**Backend**: Already have delta endpoint, need sector-specific filtering.  
- Modify or add: `GET /api/telemetry/sector_delta?year=&round=&session_type=&ref_driver=&comp_driver=&sector=1`
- Filter telemetry distance to specific sector boundaries using circuit_info

**Frontend** (`frontend/src/components/SectorComparison.jsx`):
- Dual-line chart showing speed traces within a single sector
- Delta overlay showing where time is gained/lost
- Sector selector (S1/S2/S3) tabs

**Sidebar**: Add under "Driver Performance Analysis"  
**Acceptance Criteria**:
- [ ] Sector boundaries correctly identified
- [ ] Dual-line chart renders per sector
- [ ] Delta accurately computed within sector

---

### TASK 4.3: Top Speed History per Lap [ ]
**Priority**: P2  
**Reference**: PITWALL 8.3 - Top Speed History  
**Description**: Per-lap top speed table with personal best highlighting.

**Backend** (`backend/app.py`):
- New endpoint: `GET /api/top_speed_history?year=&round=&session_type=&drivers=`
- For each lap, extract max speed from telemetry
- Mark personal best speed per driver (purple)

**Frontend** (`frontend/src/components/TopSpeedHistory.jsx`):
- Heatmap-style table: rows=laps, columns=drivers
- Purple text for personal best top speed
- Sortable by lap number

**Sidebar**: Add under "Driver Performance Analysis"  
**Acceptance Criteria**:
- [ ] Table renders with actual per-lap top speeds
- [ ] Personal best correctly marked in purple
- [ ] Works for multiple drivers simultaneously

---

## 📋 TASKS — Phase 5: UI/UX Polish & Missing Pieces (P2)

### TASK 5.1: Welcome Dashboard Page [ ]
**Priority**: P2  
**Reference**: PITWALL Welcome Page  
**Description**: Create a landing dashboard showing season overview when no telemetry is loaded.

**Frontend** (`frontend/src/components/WelcomeDashboard.jsx`):
- Show when `telemetries.length === 0` instead of empty grid
- Three-column layout: Season Progress | Constructor Standings | Driver Standings
- Use FastF1 ergast API or scrape current standings
- Auto-selects current season

**Backend**:
- New endpoint: `GET /api/standings?year=` → returns driver + constructor championship standings

**Acceptance Criteria**:
- [ ] Dashboard shows when no data is loaded
- [ ] Season progress, driver standings, constructor standings displayed
- [ ] Smooth transition when telemetry loads

---

### TASK 5.2: Workspace Save/Load [x]
**Priority**: P3  
**Reference**: PITWALL Workspace Management  
**Description**: Save and restore the current sidebar selection + open modules + driver selections.

**Frontend** (`App.jsx` — MODIFY):
- Save state to localStorage: `activeModal`, `selectedDrivers`, `selectedYear`, `selectedRace`, `selectedSession`
- File menu: "Save Workspace" and "Load Workspace" options
- Auto-restore on page load

**Acceptance Criteria**:
- [ ] State persists across page reloads
- [ ] Save/Load menu items functional
- [ ] All key selections restored

---

### TASK 5.3: Unified Window Close Buttons [ ]
**Priority**: P2  
**Description**: Several modal modules use inconsistent close button styling. Standardize all to use WindowCard's built-in onClose.

**Frontend** (Multiple files):
- Remove manual `✕ CLOSE WINDOW` buttons from:
  - Throttle/Brake Analysis case
  - Steering/Gear Analysis case  
  - DRS & Acceleration case
  - Delta Analysis case
- Instead wrap each in `<WindowCard ... onClose={() => setActiveModal(null)}>` consistently

**Acceptance Criteria**:
- [ ] All modal modules use the same WindowCard close pattern
- [ ] No orphaned close buttons
- [ ] Consistent visual appearance

---

## 📋 TASKS — Phase 6: CodeRabbit Integration (P1)

### TASK 6.1: Setup CodeRabbit for GitHub PR Reviews [ ]
**Priority**: P1  
**Description**: Configure CodeRabbit AI code review bot on the GitHub repository.

**Steps**:
- [ ] Create `.coderabbit.yaml` in project root with review configuration
- [ ] Configure review rules: focus on performance, React best practices, Python type safety
- [ ] Set language preferences: JavaScript/JSX + Python
- [ ] Enable auto-review on all PRs

**File** (`.coderabbit.yaml`):
```yaml
language: en-US
reviews:
  auto_review:
    enabled: true
    drafts: false
  path_filters:
    - "!**/__pycache__/**"
    - "!**/node_modules/**"
    - "!**/data/cache/**"
  tools:
    eslint:
      enabled: true
    ruff:
      enabled: true
chat:
  auto_reply: true
```

**Acceptance Criteria**:
- [ ] `.coderabbit.yaml` exists in project root
- [ ] Configuration targets both Python and JS/JSX files
- [ ] Path filters exclude cache/node_modules

---

## 🔄 Agent Execution Rules

1. **Read this file FIRST** on every loop iteration
2. **Read `progress.txt`** to see what was done in previous iterations
3. **Pick the FIRST incomplete `[ ]` task** in priority order (P0 → P1 → P2 → P3)
4. **Complete ONE task per iteration** — do not skip ahead
5. **After completing a task**: Update progress.txt with what you did, files changed, and verification results
6. **Verify your work**: Run `npm run build` for frontend changes, test endpoints manually
7. **Mark task `[x]` in progress.txt** when verified
8. **If blocked**: Mark `[!]` in progress.txt with reason, skip to next task
9. **Never modify this PRD.md** — it is the immutable specification

## 🧪 Verification Commands

```bash
# Frontend build check
cd frontend && npm run build

# Backend syntax check  
cd backend && python -c "import app"

# Start backend for manual testing
cd backend && python -m uvicorn app:app --reload --port 8001

# Start frontend dev server
cd frontend && npm run dev
```

## 📁 File Structure Reference

```
f1_strategy_ai/
├── PRD.md                          ← THIS FILE (Ralph Loop spec)
├── progress.txt                    ← Agent progress tracking
├── CLAUDE.md                       ← Project conventions
├── backend/
│   ├── app.py                      ← FastAPI server (ALL endpoints)
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx                 ← Main app + modal routing
│       ├── index.css               ← Global styles
│       ├── App.css
│       └── components/
│           ├── Sidebar.jsx         ← Module tree navigation
│           ├── WindowCard.jsx      ← Reusable panel wrapper
│           ├── LineChart.jsx       ← Generic telemetry line chart
│           ├── TrackMap.jsx
│           ├── DeltaAnalysis.jsx
│           ├── DetailedLapData.jsx
│           ├── DriverPositionChart.jsx
│           ├── FlagsTimeline.jsx
│           ├── IdealLapRanking.jsx
│           ├── LapComparisonModal.jsx
│           ├── LapTimeBoxPlot.jsx
│           ├── LongRunAnalysis.jsx
│           ├── PedalBehavior.jsx
│           ├── PitstopAnalysis.jsx
│           ├── PlaybackControls.jsx
│           ├── TemperatureAnalysis.jsx
│           ├── ThrottleCornerAnalysis.jsx
│           ├── TireStrategyGrid.jsx
│           ├── TrafficHeatmap.jsx
│           ├── AccelerationChart.jsx
│           └── ErrorBoundary.jsx
└── data/
    └── cache/                      ← FastF1 response cache

## 📋 TASKS — Phase 7: Replay & Visual Enhancements (P2)
(Ported from f1-race-replay)

### TASK 7.1: Simulated Safety Car Visualization [x]
**Priority**: P2  
**Description**: Visualize the Safety Car during track status code 4 (SC deployed).
- **Backend**: Update telemetry logic to simulate SC position ~500m ahead of race leader. Include 3 phases: deploying, on_track, returning.
- **Frontend**: Update `TrackMap.jsx` to render the SC with pulsing animations and phase-specific labels.

### TASK 7.2: Live Leaderboard with Driver Status [x]
**Priority**: P2  
**Description**: A persistent live leaderboard to show live order, tyre compounds, and retirement status.
- **Frontend**: Create `LiveLeaderboard.jsx` hook into playback state. Show "OUT" for retired drivers.

### TASK 7.3: Enhanced Playback Controls & Shortcuts [x]
**Priority**: P2  
**Description**: Add playback speed multipliers and keyboard shortcuts.
- **Frontend**: Update `PlaybackControls.jsx` with speed controls (0.5x, 1x, 2x, 4x) and keyboard listeners (Space=Pause, Arrows=Skip/Speed).

### TASK 7.4: Qualifying & Sprint Session Support [x]
**Priority**: P2  
**Description**: Support specific session types with tailored telemetry views.
- **Backend**: Ensure endpoints handle non-race sessions properly.
- **Frontend**: Update `WelcomeDashboard.jsx` to allow session selection and dynamically hide irrelevant modules (e.g. Pitstop Analysis).

### TASK 7.5: Floating Insights Menu / Custom Workspaces [x]
**Priority**: P3  
**Description**: Allow users to pop out custom telemetry windows or use a floating insights menu.
- **Frontend**: Implement custom workspace saving/loading or a floating widget to spawn analysis windows during replay.```
