import React, { useState, useEffect, useMemo } from 'react';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

/* ── Compound palette ─────────────────────────────────────────────── */
const COMPOUND = {
  SOFT:         { color: '#ff2031', bg: 'rgba(255,32,49,0.9)',   text: '#fff', letter: 'S' },
  MEDIUM:       { color: '#ffd12e', bg: 'rgba(255,209,46,0.9)',  text: '#000', letter: 'M' },
  HARD:         { color: '#e8e8e8', bg: 'rgba(220,220,220,0.9)', text: '#000', letter: 'H' },
  INTERMEDIATE: { color: '#43b02a', bg: 'rgba(67,176,42,0.9)',   text: '#fff', letter: 'I' },
  WET:          { color: '#006aff', bg: 'rgba(0,106,255,0.9)',   text: '#fff', letter: 'W' },
  UNKNOWN:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.9)', text: '#fff', letter: '?' },
};

function compound(name = '') {
  const u = name.toUpperCase();
  for (const [key, val] of Object.entries(COMPOUND)) {
    if (u.includes(key)) return val;
  }
  return COMPOUND.UNKNOWN;
}

const PitStrategyGantt = ({ year, round, sessionType, allDrivers }) => {
  const [stints,   setStints]   = useState([]);
  const [pitstops, setPitstops] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [highlight, setHighlight] = useState(null);   // highlighted driver

  useEffect(() => {
    if (!year || !round || !sessionType) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/tire_strategy?year=${year}&round=${round}&session_type=${sessionType}`).then(r => r.json()),
      fetch(`${API_BASE}/pitstops?year=${year}&round=${round}&session_type=${sessionType}`).then(r => r.json()),
    ])
      .then(([tireRes, pitRes]) => {
        setStints(tireRes.driver_stints || []);
        setPitstops(pitRes.pitstops || []);
      })
      .catch(() => setError('Failed to fetch strategy data.'))
      .finally(() => setLoading(false));
  }, [year, round, sessionType]);

  // Pit loss map: driver → array of { lap, loss }
  const pitLossMap = useMemo(() => {
    const m = {};
    pitstops.forEach(p => {
      if (!m[p.driver]) m[p.driver] = [];
      m[p.driver].push({ lap: p.lap, loss: p.pit_loss });
    });
    return m;
  }, [pitstops]);

  // Driver color map
  const drvColorMap = useMemo(() => {
    const m = {};
    if (allDrivers) {
      allDrivers.forEach(d => {
        m[d.abbreviation] = d.team_color
          ? (d.team_color.startsWith('#') ? d.team_color : `#${d.team_color}`)
          : '#6b7280';
      });
    }
    return m;
  }, [allDrivers]);

  // Sorted drivers (by total laps desc = finishing order proxy)
  const sortedDrivers = useMemo(() => {
    return [...stints].sort((a, b) => {
      const maxA = Math.max(...a.stints.map(s => s.end_lap));
      const maxB = Math.max(...b.stints.map(s => s.end_lap));
      return maxB - maxA;
    });
  }, [stints]);

  // Max lap across all stints
  const maxLap = useMemo(() => {
    let m = 1;
    stints.forEach(d => d.stints.forEach(s => { if (s.end_lap > m) m = s.end_lap; }));
    return m;
  }, [stints]);

  // Build Plotly horizontal bar traces
  const { traces, layout } = useMemo(() => {
    if (!sortedDrivers.length) return { traces: [], layout: {} };

    const driverNames = sortedDrivers.map(d => d.driver);
    const allTraces = [];

    // One trace per compound type so legend is clean
    const compoundTraces = {};

    sortedDrivers.forEach(({ driver, stints: dStints }) => {
      const drvY = driver;
      const opacity = highlight && highlight !== driver ? 0.3 : 1.0;

      dStints.forEach(stint => {
        const c = compound(stint.compound);
        const key = stint.compound.toUpperCase().includes('SOFT') ? 'SOFT'
          : stint.compound.toUpperCase().includes('MEDIUM') ? 'MEDIUM'
          : stint.compound.toUpperCase().includes('HARD') ? 'HARD'
          : stint.compound.toUpperCase().includes('INTERMEDIATE') ? 'INTERMEDIATE'
          : stint.compound.toUpperCase().includes('WET') ? 'WET'
          : 'UNKNOWN';

        if (!compoundTraces[key]) {
          compoundTraces[key] = {
            type: 'bar',
            orientation: 'h',
            name: key.charAt(0) + key.slice(1).toLowerCase(),
            marker: { color: c.bg, line: { color: c.color, width: 1.5 } },
            x: [], y: [], base: [],
            text: [], textposition: 'inside',
            insidetextanchor: 'middle',
            hovertemplate: '<b>%{customdata[0]}</b><br>Compound: %{customdata[1]}<br>Laps: %{customdata[2]}–%{customdata[3]} (%{x} laps)<br>Tyre Age: %{customdata[4]} laps<extra></extra>',
            customdata: [],
            legendgroup: key,
            showlegend: true,
            textfont: { color: c.text, size: 9.5, family: 'Inter, monospace' },
          };
        }

        const lapCount = stint.end_lap - stint.start_lap + 1;
        const label = lapCount >= 3 ? `${c.letter}·${lapCount}` : c.letter;

        compoundTraces[key].x.push(lapCount);
        compoundTraces[key].y.push(drvY);
        compoundTraces[key].base.push(stint.start_lap - 1);
        compoundTraces[key].text.push(label);
        compoundTraces[key].customdata.push([
          driver,
          stint.compound,
          stint.start_lap,
          stint.end_lap,
          stint.fresh_tyre ? `Fresh (0)` : `Used`,
        ]);
      });
    });

    Object.values(compoundTraces).forEach(t => allTraces.push(t));

    // Pit stop markers as scatter
    const pitX = [], pitY = [], pitText = [], pitColors = [];
    sortedDrivers.forEach(({ driver }) => {
      const stops = pitLossMap[driver] || [];
      stops.forEach(({ lap, loss }) => {
        pitX.push(lap);
        pitY.push(driver);
        pitText.push(`Pit Lap ${lap}<br>Loss: ${loss.toFixed(2)}s`);
        pitColors.push(drvColorMap[driver] || '#6b7280');
      });
    });

    if (pitX.length) {
      allTraces.push({
        type: 'scatter',
        mode: 'markers+text',
        x: pitX, y: pitY,
        marker: { symbol: 'triangle-down', size: 12, color: pitColors, line: { color: '#fff', width: 1 } },
        text: pitX.map(l => `Pit`),
        textposition: 'top center',
        textfont: { size: 8, color: '#94a3b8' },
        hovertemplate: '%{customdata}<extra></extra>',
        customdata: pitText,
        name: 'Pit Stop',
        showlegend: true,
        legendgroup: 'pits',
      });
    }

    const lyt = {
      autosize: true,
      barmode: 'stack',
      margin: { l: 55, r: 30, t: 24, b: 44 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor:  'rgba(11,13,16,1)',
      showlegend: true,
      legend: {
        orientation: 'h', x: 0.5, y: -0.08, xanchor: 'center',
        font: { color: '#94a3b8', size: 10 }, bgcolor: 'rgba(0,0,0,0)',
      },
      hovermode: 'closest',
      hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0', size: 11 } },
      xaxis: {
        title: { text: 'Lap', font: { color: '#64748b', size: 11 } },
        range: [0, maxLap + 1],
        showgrid: true, gridcolor: '#2b2e36', zeroline: false,
        tickfont: { color: '#64748b' },
      },
      yaxis: {
        autorange: 'reversed',
        showgrid: false, zeroline: false,
        tickfont: { color: '#e2e8f0', size: 11, family: 'Inter, monospace' },
        // color driver labels by team
        tickvals: driverNames,
        ticktext: driverNames.map(d => `<span style="color:${drvColorMap[d] || '#e2e8f0'}">${d}</span>`),
      },
      bargap: 0.35,
    };

    return { traces: allTraces, layout: lyt };
  }, [sortedDrivers, pitLossMap, maxLap, drvColorMap, highlight]);

  // Summary stats table
  const summaryRows = useMemo(() => {
    return sortedDrivers.map(({ driver, stints: dStints }) => {
      const stops = pitLossMap[driver] || [];
      const totalLoss = stops.reduce((s, p) => s + p.pit_loss, 0);
      const avgLoss = stops.length ? totalLoss / stops.length : 0;
      const compounds = dStints.map(s => compound(s.compound).letter).join('→');
      const totalLaps = Math.max(...dStints.map(s => s.end_lap));
      return { driver, stops: stops.length, avgLoss, compounds, totalLaps };
    });
  }, [sortedDrivers, pitLossMap]);

  if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">Loading Strategy Data...</div>;
  if (error)   return <div className="w-full h-full flex items-center justify-center text-red-500 text-xs font-bold">{error}</div>;
  if (!stints.length) return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No strategy data available for this session.</div>;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0b0d10' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2b2e36] shrink-0">
        <div>
          <span className="text-white font-bold text-sm tracking-widest uppercase">Pit Strategy Gantt</span>
          <span className="ml-3 text-gray-500 text-[11px]">{year} · Round {round} · {sessionType}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wider">
          {Object.entries(COMPOUND).filter(([k]) => k !== 'UNKNOWN').map(([name, c]) => (
            <span key={name} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c.bg, border: `1px solid ${c.color}` }} />
              {name.charAt(0) + name.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Main layout: Gantt + Summary side panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Gantt chart */}
        <div className="flex-1 min-w-0 min-h-0">
          <Plot
            data={traces}
            layout={layout}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>

        {/* Side summary panel */}
        <div className="w-52 shrink-0 border-l border-[#2b2e36] bg-[#16181d] flex flex-col overflow-hidden">
          <div className="text-[10px] font-bold uppercase text-gray-500 tracking-widest px-3 py-2 border-b border-[#2b2e36]">
            Strategy Summary
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-[#2b2e36] bg-[#1b1d24] text-gray-500 text-[10px] uppercase">
                  <th className="p-1.5 text-left">Driver</th>
                  <th className="p-1.5 text-center">Stops</th>
                  <th className="p-1.5 text-right">Avg Loss</th>
                  <th className="p-1.5 text-right">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(row => (
                  <tr
                    key={row.driver}
                    className="border-b border-[#2b2e36]/30 cursor-pointer transition-colors"
                    style={{ background: highlight === row.driver ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                    onMouseEnter={() => setHighlight(row.driver)}
                    onMouseLeave={() => setHighlight(null)}
                  >
                    <td className="p-1.5 font-bold" style={{ color: drvColorMap[row.driver] || '#e2e8f0' }}>{row.driver}</td>
                    <td className="p-1.5 text-center text-blue-400 font-mono">{row.stops}</td>
                    <td className="p-1.5 text-right font-mono" style={{ color: row.avgLoss > 22 ? '#f87171' : row.avgLoss > 19 ? '#fbbf24' : '#34d399' }}>
                      {row.stops > 0 ? `${row.avgLoss.toFixed(1)}s` : '—'}
                    </td>
                    <td className="p-1.5 text-right font-bold tracking-wider text-[10px] text-gray-300">{row.compounds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compound legend footer */}
          <div className="border-t border-[#2b2e36] px-3 py-2 text-[9px] text-gray-600 uppercase tracking-widest">
            ▼ Pit marker = pit stop lap
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PitStrategyGantt);
