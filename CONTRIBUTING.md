# Contributing to F1 Pitwall Pro 🏎️

Thanks for your interest in contributing! F1 Pitwall Pro is a high-performance, multi-document Formula 1 telemetry framework. We welcome contributions from the F1 data community — whether you're a race engineer, a data scientist, or a front-end developer.

---

## Architecture Overview

F1 Pitwall Pro uses a **3-layer architecture**:

| Layer | Tech | Responsibility |
|---|---|---|
| **Frontend** | React (Vite) + Plotly.js + Tailwind | UI, MDI window system, playback engine |
| **Backend** | Python + FastAPI | REST API, FastF1 data fetching, caching |
| **Data** | FastF1 + Pandas | F1 session data, telemetry, timing |

The frontend fetches telemetry from `http://localhost:8001/api/*` and renders it into draggable, stackable window cards on the MDI canvas.

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/ash14090506/F1-Pitwall-Pro.git
cd F1-Pitwall-Pro
```

### 2. Start the Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8001
```

> **Note:** The first telemetry fetch for any session downloads data from the F1 API and may take 30–60 seconds. Subsequent fetches use the local cache (~`.cache/fastf1/`).

### 3. Start the Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## How to Add a New Analysis Module

Each analysis pillar follows the same pattern. Here's the checklist:

### Step 1: Backend Endpoint

Add a new route in `backend/app.py`:

```python
@app.get("/api/my_new_analysis")
async def my_new_analysis(year: int, round: int, session_type: str):
    # Load session using FastF1
    session = fastf1.get_session(year, round, session_type)
    session.load()
    # Compute your metrics
    result = { "data": [...] }
    return result
```

### Step 2: Frontend Component

Create `frontend/src/components/MyNewAnalysis.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const API_BASE = 'http://127.0.0.1:8001/api';

const MyNewAnalysis = ({ year, round, sessionType }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE}/my_new_analysis`, {
            params: { year, round, session_type: sessionType }
        }).then(res => setData(res.data));
    }, [year, round, sessionType]);

    if (!data) return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>;

    return (
        <Plot
            data={[{ /* Plotly trace */ }]}
            layout={{ /* Plotly layout */ paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
        />
    );
};

export default MyNewAnalysis;
```

### Step 3: Register in App.jsx

Add a new `case` in the `renderModalContent` switch statement in `frontend/src/App.jsx`:

```jsx
case 'My New Analysis':
    return (
        <WindowCard title="My New Analysis" fullSpan={true} onClose={() => setActiveModal(null)}>
            <MyNewAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} />
        </WindowCard>
    );
```

### Step 4: Add to Sidebar

Add your new module entry in `frontend/src/components/Sidebar.jsx` under the appropriate pillar section.

---

## Code Style

- **JavaScript/React:** Functional components only. Use `useCallback` for event handlers and `useMemo` for expensive computed values.
- **Python:** Follow PEP 8. Use type hints for all function signatures. Keep FastF1 session loading in the route handler — do not duplicate session loads.
- **CSS:** Prefer Tailwind utility classes. Use CSS variables (defined in `index.css`) for theme-aware colors rather than hardcoded hex values.
- **Plotly:** Always set `paper_bgcolor: 'transparent'` and `plot_bgcolor: 'transparent'` so charts respect the MDI window background.

---

## PR Checklist

Before submitting a pull request, make sure:

- [ ] Backend endpoint returns JSON and handles errors gracefully
- [ ] Frontend component shows a loading state and an error state
- [ ] New module appears in the Sidebar under the correct pillar
- [ ] No hardcoded `localhost:8001` — use the `API_BASE` constant
- [ ] No `console.log` statements left in production code
- [ ] The app builds without errors (`npm run build`)

---

## GitHub Topics

This repository uses the following topics for discoverability:

`f1` · `telemetry` · `fastf1` · `motorsport` · `formula1` · `data-visualization` · `react` · `fastapi`

---

## Questions?

Open a [GitHub Issue](https://github.com/ash14090506/F1-Pitwall-Pro/issues) with the `question` label. We're happy to help!
