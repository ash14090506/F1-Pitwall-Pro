import React, { useState, useEffect } from 'react';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;

const API_BASE = "http://localhost:8001";

const WhatIfStrategy = ({ year, round, sessionType, selectedDrivers }) => {
  const [targetDriver, setTargetDriver] = useState(selectedDrivers[0] || "");
  const [simPitLap, setSimPitLap] = useState(20);
  const [simCompound, setSimCompound] = useState("HARD");
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-update target driver if selection changes
  useEffect(() => {
    if (selectedDrivers.length > 0 && !selectedDrivers.includes(targetDriver)) {
      setTargetDriver(selectedDrivers[0]);
    }
  }, [selectedDrivers, targetDriver]);

  useEffect(() => {
    if (!targetDriver || !year || !round || !sessionType) return;
    
    // Debounce the fetch to avoid spamming the backend during slider drag
    const timeoutId = setTimeout(() => {
      fetchSimulation();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [targetDriver, simPitLap, simCompound, year, round, sessionType]);

  const fetchSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/simulate_strategy?year=${year}&round=${round}&session_type=${sessionType}&driver=${targetDriver}&sim_pit_lap=${simPitLap}&sim_compound=${simCompound}`);
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!targetDriver) {
    return <div className="module-card">Please select a driver from the top bar to simulate strategy.</div>;
  }

  // Process data for charts
  let positionChartData = [];
  let timeDeltaChartData = [];
  let outcomeSummary = null;

  if (data && data.actual_trace && data.simulated_trace) {
    const actLaps = data.actual_trace.map(t => t.lap);
    const actPos = data.actual_trace.map(t => t.position);
    
    const simLaps = data.simulated_trace.map(t => t.lap);
    const simPos = data.simulated_trace.map(t => t.position);

    positionChartData = [
      {
        x: actLaps,
        y: actPos,
        type: 'scatter',
        mode: 'lines',
        name: 'Actual Position',
        line: { color: '#888888', dash: 'solid', width: 3 }
      },
      {
        x: simLaps,
        y: simPos,
        type: 'scatter',
        mode: 'lines',
        name: 'Simulated Position',
        line: { color: '#e10600', dash: 'dot', width: 4 }
      }
    ];

    // Calculate time difference: (Actual Cumulative Time) - (Simulated Cumulative Time)
    // Positive means Simulated is FASTER (ahead)
    const timeDeltas = [];
    data.simulated_trace.forEach((simEntry) => {
      const actEntry = data.actual_trace.find(a => a.lap === simEntry.lap);
      if (actEntry) {
        // If sim_time < act_time, we gained time (positive delta).
        timeDeltas.push({ lap: simEntry.lap, delta: actEntry.cum_time - simEntry.cum_time });
      }
    });

    timeDeltaChartData = [
      {
        x: timeDeltas.map(t => t.lap),
        y: timeDeltas.map(t => t.delta),
        type: 'bar',
        name: 'Time Gained/Lost (s)',
        marker: {
          color: timeDeltas.map(t => t.delta > 0 ? '#4caf50' : '#f44336')
        }
      }
    ];

    const finalAct = actPos[actPos.length - 1];
    const finalSim = simPos[simPos.length - 1];
    const diff = finalAct - finalSim; // Positive means gained positions
    
    let outcomeClass = "neutral";
    if (diff > 0) outcomeClass = "positive";
    if (diff < 0) outcomeClass = "negative";

    outcomeSummary = (
      <div className="outcome-summary">
        <h3>Simulation Outcome</h3>
        <div className="outcome-stats">
          <div className="stat">
            <span className="label">Actual Finish</span>
            <span className="value">P{finalAct}</span>
          </div>
          <div className="stat">
            <span className="label">Projected Finish</span>
            <span className={`value ${outcomeClass}`}>
              P{finalSim} {diff !== 0 && `(${diff > 0 ? '+' : ''}${diff})`}
            </span>
          </div>
        </div>
        <div className="sim-details">
          Actual Pit Lap: <strong>{data.actual_pit_lap}</strong> | 
          Target Stint 1: <strong>{data.target_s1_compound}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="module-card what-if-strategy">
      <div className="module-header">
        <h2>"What If" Strategy Simulator</h2>
        <div className="controls">
          <select 
            value={targetDriver} 
            onChange={(e) => setTargetDriver(e.target.value)}
            className="f1-select"
          >
            {selectedDrivers.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          
          <select
            value={simCompound}
            onChange={(e) => setSimCompound(e.target.value)}
            className="f1-select"
          >
            <option value="SOFT">Soft</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      <div className="slider-container">
        <label>Pit Stop Lap: <strong>{simPitLap}</strong></label>
        <input 
          type="range" 
          min="1" 
          max={data ? (data.actual_trace.length > 0 ? data.actual_trace[data.actual_trace.length - 1].lap : 60) : 60} 
          value={simPitLap} 
          onChange={(e) => setSimPitLap(parseInt(e.target.value))}
          className="f1-slider"
        />
        <div className="slider-ticks">
          <span>Lap 1</span>
          {data && <span>Lap {data.actual_trace[data.actual_trace.length - 1]?.lap || 'Max'}</span>}
        </div>
      </div>

      {loading && !data && <div className="loader">Running Strategy Simulation...</div>}
      {error && <div className="error-message">Failed to run simulation: {error}</div>}

      {data && (
        <div className="simulation-results">
          {outcomeSummary}
          
          <div className="charts-grid">
            <div className="chart-box">
              <Plot
                data={positionChartData}
                layout={{
                  title: 'Race Position Trace',
                  paper_bgcolor: '#1e1e1e',
                  plot_bgcolor: '#1e1e1e',
                  font: { color: '#ffffff', family: 'Titillium Web' },
                  yaxis: { 
                    title: 'Position', 
                    autorange: 'reversed',
                    gridcolor: '#333333',
                    zeroline: false
                  },
                  xaxis: { 
                    title: 'Lap Number',
                    gridcolor: '#333333'
                  },
                  margin: { l: 40, r: 20, t: 40, b: 40 },
                  legend: { orientation: 'h', y: -0.2 }
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '300px' }}
                config={{ displayModeBar: false }}
              />
            </div>
            <div className="chart-box">
              <Plot
                data={timeDeltaChartData}
                layout={{
                  title: 'Time Gained/Lost vs Actual (Seconds)',
                  paper_bgcolor: '#1e1e1e',
                  plot_bgcolor: '#1e1e1e',
                  font: { color: '#ffffff', family: 'Titillium Web' },
                  yaxis: { 
                    title: 'Seconds (Positive = Faster)',
                    gridcolor: '#333333'
                  },
                  xaxis: { 
                    title: 'Lap Number',
                    gridcolor: '#333333'
                  },
                  margin: { l: 40, r: 20, t: 40, b: 40 }
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '300px' }}
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .what-if-strategy .slider-container {
          background: #2a2a2a;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .what-if-strategy .f1-slider {
          width: 100%;
          margin: 1rem 0;
          cursor: pointer;
        }
        .what-if-strategy .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #888;
        }
        .what-if-strategy .outcome-summary {
          background: #2a2a2a;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #e10600;
        }
        .what-if-strategy .outcome-stats {
          display: flex;
          gap: 2rem;
          margin-top: 1rem;
        }
        .what-if-strategy .stat {
          display: flex;
          flex-direction: column;
        }
        .what-if-strategy .stat .label {
          font-size: 0.85rem;
          color: #888;
          text-transform: uppercase;
        }
        .what-if-strategy .stat .value {
          font-size: 2rem;
          font-weight: 700;
        }
        .what-if-strategy .value.positive { color: #4caf50; }
        .what-if-strategy .value.negative { color: #f44336; }
        .what-if-strategy .value.neutral { color: #ffffff; }
        .what-if-strategy .sim-details {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #aaa;
        }
        .what-if-strategy .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 900px) {
          .what-if-strategy .charts-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .what-if-strategy .chart-box {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #333;
        }
      `}</style>
    </div>
  );
};

export default WhatIfStrategy;
