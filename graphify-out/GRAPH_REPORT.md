# Graph Report - .  (2026-04-18)

## Corpus Check
- Corpus is ~28,620 words - fits in a single context window. You may not need a graph.

## Summary
- 164 nodes · 131 edges · 71 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 1,200 input · 800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Ideal Lap & Sector Dashboard|Ideal Lap & Sector Dashboard]]
- [[_COMMUNITY_Backend Strategy & Pitstop API|Backend Strategy & Pitstop API]]
- [[_COMMUNITY_Telemetry Processing Engine|Telemetry Processing Engine]]
- [[_COMMUNITY_Session Management & Delta API|Session Management & Delta API]]
- [[_COMMUNITY_Error Handling & ErrorBoundary|Error Handling & ErrorBoundary]]
- [[_COMMUNITY_Data Cleaning & Transformation|Data Cleaning & Transformation]]
- [[_COMMUNITY_Agent 3-Layer Architecture Spec|Agent 3-Layer Architecture Spec]]
- [[_COMMUNITY_Ralph Loop & Autonomous Config|Ralph Loop & Autonomous Config]]
- [[_COMMUNITY_Risk Highlighting (Dashboard)|Risk Highlighting (Dashboard)]]
- [[_COMMUNITY_Driver & Session Initialization|Driver & Session Initialization]]
- [[_COMMUNITY_Circuit Geometry & DRS Logic|Circuit Geometry & DRS Logic]]
- [[_COMMUNITY_Corner Analysis & Classification|Corner Analysis & Classification]]
- [[_COMMUNITY_Positional Tracking API|Positional Tracking API]]
- [[_COMMUNITY_Race Control Metadata|Race Control Metadata]]
- [[_COMMUNITY_Pedal & G-Force Analytics|Pedal & G-Force Analytics]]
- [[_COMMUNITY_Corner Detection Heuristics|Corner Detection Heuristics]]
- [[_COMMUNITY_Tire Strategy Analytics|Tire Strategy Analytics]]
- [[_COMMUNITY_Detailed Lap Analysis API|Detailed Lap Analysis API]]
- [[_COMMUNITY_Dirty Air & Traffic Analytics|Dirty Air & Traffic Analytics]]
- [[_COMMUNITY_Lap-by-Lap Comparison API|Lap-by-Lap Comparison API]]
- [[_COMMUNITY_Backend Cache Management|Backend Cache Management]]
- [[_COMMUNITY_Race Calendar & Schedule|Race Calendar & Schedule]]
- [[_COMMUNITY_Prefetching Logic|Prefetching Logic]]
- [[_COMMUNITY_Lap Data Scratches|Lap Data Scratches]]
- [[_COMMUNITY_Track Data Scratches|Track Data Scratches]]
- [[_COMMUNITY_React App Entry|React App Entry]]
- [[_COMMUNITY_Telemetry Visualization|Telemetry Visualization]]
- [[_COMMUNITY_Acceleration Performance|Acceleration Performance]]
- [[_COMMUNITY_Braking Performance UI|Braking Performance UI]]
- [[_COMMUNITY_Corner Performance UI|Corner Performance UI]]
- [[_COMMUNITY_Delta Analysis UI|Delta Analysis UI]]
- [[_COMMUNITY_Lap Data Interaction|Lap Data Interaction]]
- [[_COMMUNITY_Driver Position Tracking UI|Driver Position Tracking UI]]
- [[_COMMUNITY_Flag Timeline UI|Flag Timeline UI]]
- [[_COMMUNITY_Lap Comparison Modal|Lap Comparison Modal]]
- [[_COMMUNITY_Lap Time Distribution|Lap Time Distribution]]
- [[_COMMUNITY_General Purpose Line Chart|General Purpose Line Chart]]
- [[_COMMUNITY_Long Run Analysis UI|Long Run Analysis UI]]
- [[_COMMUNITY_Pedal Behavior UI|Pedal Behavior UI]]
- [[_COMMUNITY_Pitstop Analysis UI|Pitstop Analysis UI]]
- [[_COMMUNITY_Playback Controls UI|Playback Controls UI]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Straight Line Speed UI|Straight Line Speed UI]]
- [[_COMMUNITY_Weather & Track Temperature UI|Weather & Track Temperature UI]]
- [[_COMMUNITY_ThrottleCorner Telemetry UI|Throttle/Corner Telemetry UI]]
- [[_COMMUNITY_Tire Strategy Board|Tire Strategy Board]]
- [[_COMMUNITY_Interactive Track Map|Interactive Track Map]]
- [[_COMMUNITY_Traffic Heatmap UI|Traffic Heatmap UI]]
- [[_COMMUNITY_UI Layout Elements|UI Layout Elements]]
- [[_COMMUNITY_ML Feature Engineering|ML Feature Engineering]]
- [[_COMMUNITY_Race Simulation Engine|Race Simulation Engine]]
- [[_COMMUNITY_Real-time Risk Detection|Real-time Risk Detection]]
- [[_COMMUNITY_Strategy Alert System|Strategy Alert System]]
- [[_COMMUNITY_Undercut Logic Engine|Undercut Logic Engine]]
- [[_COMMUNITY_Frontend Assets & Theming|Frontend Assets & Theming]]
- [[_COMMUNITY_Auto-Push Workflow|Auto-Push Workflow]]
- [[_COMMUNITY_API Testing Utilities|API Testing Utilities]]
- [[_COMMUNITY_Acceleration Scratches|Acceleration Scratches]]
- [[_COMMUNITY_Misc Python Tests|Misc Python Tests]]
- [[_COMMUNITY_FastF1 Integration Tests|FastF1 Integration Tests]]
- [[_COMMUNITY_Phase 2 Logic Tests|Phase 2 Logic Tests]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_Vite Build Configuration|Vite Build Configuration]]
- [[_COMMUNITY_React Rendering Root|React Rendering Root]]
- [[_COMMUNITY_Data Collection Layer|Data Collection Layer]]
- [[_COMMUNITY_Data Processing Core|Data Processing Core]]
- [[_COMMUNITY_ML Strategy Model|ML Strategy Model]]
- [[_COMMUNITY_Pit Strategy Optimizer|Pit Strategy Optimizer]]
- [[_COMMUNITY_Risk Assessment Model|Risk Assessment Model]]
- [[_COMMUNITY_Security & Risk Rules|Security & Risk Rules]]
- [[_COMMUNITY_F1 Telemetry Workspace Core|F1 Telemetry Workspace Core]]

## God Nodes (most connected - your core abstractions)
1. `get_parsed_session()` - 20 edges
2. `ErrorBoundary` - 5 edges
3. `process_telemetry_data()` - 4 edges
4. `get_fastest_lap_telemetry()` - 4 edges
5. `get_lap_telemetry()` - 4 edges
6. `get_brake_accel_performance()` - 4 edges
7. `get_telemetry_delta()` - 3 edges
8. `get_laps_summary()` - 3 edges
9. `get_weather_data()` - 3 edges
10. `get_pitstop_data()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Execution Layer (L3)` --conceptually_related_to--> `FastAPI + FastF1 Backend`  [INFERRED]
  AGENTS.md → backend/requirements.txt
- `Ralph Loop` --integrates_with--> `CodeRabbit AI Reviewer`  [INFERRED]
  PRD.md → .coderabbit.yaml
- `React + Vite Frontend` --displays--> `Dashboard Hero Asset`  [EXTRACTED]
  frontend/README.md → frontend/src/assets/hero.png

## Hyperedges (group relationships)
- **Pitwall Core Specification** — prd_f1pitwallpro, agents_3layerarch, readme_f1telemetry [INFERRED 0.85]

## Communities

### Community 0 - "Ideal Lap & Sector Dashboard"
Cohesion: 0.2
Nodes (2): formatLapTime(), IdealLapRanking()

### Community 1 - "Backend Strategy & Pitstop API"
Cohesion: 0.25
Nodes (6): get_ideal_lap_ranking(), get_pitstop_data(), get_straight_line_speed(), Retrieve pitstop history for all drivers from laps data., Compute theoretical best lap for every driver by summing best S1+S2+S3., Collect and compare top speed / speed trap data for ALL drivers.

### Community 2 - "Telemetry Processing Engine"
Cohesion: 0.29
Nodes (7): get_brake_accel_performance(), get_fastest_lap_telemetry(), get_lap_telemetry(), process_telemetry_data(), Retrieve telemetry for the fastest lap of a specific driver., Retrieve telemetry for a specific custom lap of a driver., Scatter plot data for braking and acceleration G-forces.

### Community 3 - "Session Management & Delta API"
Cohesion: 0.29
Nodes (7): get_long_run_analysis(), get_parsed_session(), get_telemetry_delta(), get_weather_data(), Retrieve time and speed delta between a reference driver and a comparison driver, Retrieve environmental weather data over the session time., Calculates Fuel-Corrected Lap Time (Estimated 0.05s/lap weight shed).

### Community 4 - "Error Handling & ErrorBoundary"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 5 - "Data Cleaning & Transformation"
Cohesion: 0.33
Nodes (0): 

### Community 6 - "Agent 3-Layer Architecture Spec"
Cohesion: 0.33
Nodes (6): 3-Layer Architecture, Directive Layer (L1), Execution Layer (L3), Orchestration Layer (L2), Self-Annealing Loop, FastAPI + FastF1 Backend

### Community 7 - "Ralph Loop & Autonomous Config"
Cohesion: 0.67
Nodes (3): CodeRabbit AI Reviewer, F1 Pitwall Pro, Ralph Loop

### Community 8 - "Risk Highlighting (Dashboard)"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Driver & Session Initialization"
Cohesion: 1.0
Nodes (2): get_drivers(), Get the drivers that participated in a specific session, and pre-warm telemetry

### Community 10 - "Circuit Geometry & DRS Logic"
Cohesion: 1.0
Nodes (2): get_circuit_data(), Retrieve circuit geometry and markers (DRS, Corners).

### Community 11 - "Corner Analysis & Classification"
Cohesion: 1.0
Nodes (2): get_corner_classification(), Classify corners into low/medium/high speed and compute avg min apex speed per c

### Community 12 - "Positional Tracking API"
Cohesion: 1.0
Nodes (2): get_positions_data(), Retrieve lap-by-lap track positions for positional chart.

### Community 13 - "Race Control Metadata"
Cohesion: 1.0
Nodes (2): get_race_control_messages(), Retrieve flags and race control messages.

### Community 14 - "Pedal & G-Force Analytics"
Cohesion: 1.0
Nodes (2): get_pedal_behavior(), Compute Throttle Only, Brake Only, Trail Braking, and Coasting percentages.

### Community 15 - "Corner Detection Heuristics"
Cohesion: 1.0
Nodes (2): get_corners_heuristic(), Algorithm defining 'Corners' by speed drops < 160km/h + brake.

### Community 16 - "Tire Strategy Analytics"
Cohesion: 1.0
Nodes (2): get_tire_strategy(), Retrieve tire stint strategies for visual whiteboard.

### Community 17 - "Detailed Lap Analysis API"
Cohesion: 1.0
Nodes (2): get_laps_data(), Retrieve detailed lap data for selected drivers (Detailed Lap Data & Box Plot).

### Community 18 - "Dirty Air & Traffic Analytics"
Cohesion: 1.0
Nodes (2): get_traffic_data(), Retrieve dirty air / traffic metrics.

### Community 19 - "Lap-by-Lap Comparison API"
Cohesion: 1.0
Nodes (2): get_laps_summary(), Retrieve Lap-by-Lap data for comparison.

### Community 20 - "Backend Cache Management"
Cohesion: 1.0
Nodes (2): clear_backend_memory(), Clear all RAM-locked session variables to force re-parsing of any stuck datasets

### Community 21 - "Race Calendar & Schedule"
Cohesion: 1.0
Nodes (2): get_races(), Get the event schedule for a given year.

### Community 22 - "Prefetching Logic"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Lap Data Scratches"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Track Data Scratches"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "React App Entry"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Telemetry Visualization"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Acceleration Performance"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Braking Performance UI"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Corner Performance UI"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Delta Analysis UI"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Lap Data Interaction"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Driver Position Tracking UI"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Flag Timeline UI"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Lap Comparison Modal"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Lap Time Distribution"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "General Purpose Line Chart"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Long Run Analysis UI"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Pedal Behavior UI"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Pitstop Analysis UI"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Playback Controls UI"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Sidebar Navigation"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Straight Line Speed UI"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Weather & Track Temperature UI"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Throttle/Corner Telemetry UI"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Tire Strategy Board"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Interactive Track Map"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Traffic Heatmap UI"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "UI Layout Elements"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "ML Feature Engineering"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Race Simulation Engine"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Real-time Risk Detection"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Strategy Alert System"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Undercut Logic Engine"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Frontend Assets & Theming"
Cohesion: 1.0
Nodes (2): React + Vite Frontend, Dashboard Hero Asset

### Community 55 - "Auto-Push Workflow"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "API Testing Utilities"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Acceleration Scratches"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Misc Python Tests"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "FastF1 Integration Tests"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Phase 2 Logic Tests"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "ESLint Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Vite Build Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "React Rendering Root"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Data Collection Layer"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Data Processing Core"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "ML Strategy Model"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Pit Strategy Optimizer"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Risk Assessment Model"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Security & Risk Rules"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "F1 Telemetry Workspace Core"
Cohesion: 1.0
Nodes (1): F1 Telemetry Workspace

## Knowledge Gaps
- **30 isolated node(s):** `Get the event schedule for a given year.`, `Get the drivers that participated in a specific session, and pre-warm telemetry`, `Retrieve telemetry for the fastest lap of a specific driver.`, `Retrieve telemetry for a specific custom lap of a driver.`, `Retrieve time and speed delta between a reference driver and a comparison driver` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Risk Highlighting (Dashboard)`** (2 nodes): `dashboard.py`, `highlight_risk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Driver & Session Initialization`** (2 nodes): `get_drivers()`, `Get the drivers that participated in a specific session, and pre-warm telemetry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Circuit Geometry & DRS Logic`** (2 nodes): `get_circuit_data()`, `Retrieve circuit geometry and markers (DRS, Corners).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Corner Analysis & Classification`** (2 nodes): `get_corner_classification()`, `Classify corners into low/medium/high speed and compute avg min apex speed per c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Positional Tracking API`** (2 nodes): `get_positions_data()`, `Retrieve lap-by-lap track positions for positional chart.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Race Control Metadata`** (2 nodes): `get_race_control_messages()`, `Retrieve flags and race control messages.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pedal & G-Force Analytics`** (2 nodes): `get_pedal_behavior()`, `Compute Throttle Only, Brake Only, Trail Braking, and Coasting percentages.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Corner Detection Heuristics`** (2 nodes): `get_corners_heuristic()`, `Algorithm defining 'Corners' by speed drops < 160km/h + brake.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tire Strategy Analytics`** (2 nodes): `get_tire_strategy()`, `Retrieve tire stint strategies for visual whiteboard.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Detailed Lap Analysis API`** (2 nodes): `get_laps_data()`, `Retrieve detailed lap data for selected drivers (Detailed Lap Data & Box Plot).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dirty Air & Traffic Analytics`** (2 nodes): `get_traffic_data()`, `Retrieve dirty air / traffic metrics.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lap-by-Lap Comparison API`** (2 nodes): `get_laps_summary()`, `Retrieve Lap-by-Lap data for comparison.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Cache Management`** (2 nodes): `clear_backend_memory()`, `Clear all RAM-locked session variables to force re-parsing of any stuck datasets`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Race Calendar & Schedule`** (2 nodes): `get_races()`, `Get the event schedule for a given year.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prefetching Logic`** (2 nodes): `prefetch_cache.py`, `prefetch_season()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lap Data Scratches`** (2 nodes): `scratch_laps.py`, `test()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Track Data Scratches`** (2 nodes): `scratch_track.py`, `test()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React App Entry`** (2 nodes): `App()`, `App.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Telemetry Visualization`** (2 nodes): `TelemetryChart.jsx`, `TelemetryChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Acceleration Performance`** (2 nodes): `AccelerationChart()`, `AccelerationChart.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Braking Performance UI`** (2 nodes): `BrakeAccelPerformance()`, `BrakeAccelPerformance.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Corner Performance UI`** (2 nodes): `CornerClassification()`, `CornerClassification.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Delta Analysis UI`** (2 nodes): `DeltaAnalysis()`, `DeltaAnalysis.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lap Data Interaction`** (2 nodes): `DetailedLapData()`, `DetailedLapData.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Driver Position Tracking UI`** (2 nodes): `DriverPositionChart()`, `DriverPositionChart.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flag Timeline UI`** (2 nodes): `FlagsTimeline()`, `FlagsTimeline.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lap Comparison Modal`** (2 nodes): `LapComparisonModal.jsx`, `LapComparisonModal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lap Time Distribution`** (2 nodes): `LapTimeBoxPlot.jsx`, `LapTimeBoxPlot()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Purpose Line Chart`** (2 nodes): `LineChart.jsx`, `LineChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Long Run Analysis UI`** (2 nodes): `LongRunAnalysis.jsx`, `LongRunAnalysis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pedal Behavior UI`** (2 nodes): `PedalBehavior.jsx`, `PedalBehavior()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pitstop Analysis UI`** (2 nodes): `PitstopAnalysis.jsx`, `PitstopAnalysis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Playback Controls UI`** (2 nodes): `PlaybackControls.jsx`, `PlaybackControls()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Navigation`** (2 nodes): `Sidebar.jsx`, `Sidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Straight Line Speed UI`** (2 nodes): `StraightLineSpeed.jsx`, `StraightLineSpeed()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Weather & Track Temperature UI`** (2 nodes): `TemperatureAnalysis.jsx`, `TemperatureAnalysis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Throttle/Corner Telemetry UI`** (2 nodes): `ThrottleCornerAnalysis.jsx`, `ThrottleCornerAnalysis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tire Strategy Board`** (2 nodes): `TireStrategyGrid.jsx`, `TireStrategyGrid()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Interactive Track Map`** (2 nodes): `TrackMap.jsx`, `TrackMap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Traffic Heatmap UI`** (2 nodes): `TrafficHeatmap.jsx`, `TrafficHeatmap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UI Layout Elements`** (2 nodes): `WindowCard.jsx`, `WindowCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ML Feature Engineering`** (2 nodes): `engineer_features()`, `feature_engineering.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Race Simulation Engine`** (2 nodes): `simulate_race()`, `race_simulator.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Real-time Risk Detection`** (2 nodes): `detect_risk()`, `risk_detection.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Strategy Alert System`** (2 nodes): `strategy_alerts.py`, `generate_alerts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Undercut Logic Engine`** (2 nodes): `undercut_detection.py`, `detect_undercut()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Assets & Theming`** (2 nodes): `React + Vite Frontend`, `Dashboard Hero Asset`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auto-Push Workflow`** (1 nodes): `auto_push.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Testing Utilities`** (1 nodes): `test_api.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Acceleration Scratches`** (1 nodes): `scratch_accel.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Python Tests`** (1 nodes): `scratch_test.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FastF1 Integration Tests`** (1 nodes): `test_fastf1.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phase 2 Logic Tests`** (1 nodes): `test_phase2.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Configuration`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build Configuration`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Rendering Root`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Data Collection Layer`** (1 nodes): `data_collection.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Data Processing Core`** (1 nodes): `data_processing.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ML Strategy Model`** (1 nodes): `ml_model.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pit Strategy Optimizer`** (1 nodes): `pit_optimizer.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Risk Assessment Model`** (1 nodes): `risk_model.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Security & Risk Rules`** (1 nodes): `risk_rules.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `F1 Telemetry Workspace Core`** (1 nodes): `F1 Telemetry Workspace`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_parsed_session()` connect `Session Management & Delta API` to `Backend Strategy & Pitstop API`, `Telemetry Processing Engine`, `Circuit Geometry & DRS Logic`, `Corner Analysis & Classification`, `Positional Tracking API`, `Race Control Metadata`, `Pedal & G-Force Analytics`, `Corner Detection Heuristics`, `Tire Strategy Analytics`, `Detailed Lap Analysis API`, `Dirty Air & Traffic Analytics`, `Lap-by-Lap Comparison API`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `get_fastest_lap_telemetry()` connect `Telemetry Processing Engine` to `Backend Strategy & Pitstop API`, `Session Management & Delta API`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `get_lap_telemetry()` connect `Telemetry Processing Engine` to `Backend Strategy & Pitstop API`, `Session Management & Delta API`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `Get the event schedule for a given year.`, `Get the drivers that participated in a specific session, and pre-warm telemetry`, `Retrieve telemetry for the fastest lap of a specific driver.` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._