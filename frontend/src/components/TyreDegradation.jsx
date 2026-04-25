import React, { useState, useEffect, useMemo } from 'react';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const COMPOUND_COLORS = {
  SOFT:         { line: '#ff2031', fill: 'rgba(255,32,49,0.15)' },
  MEDIUM:       { line: '#ffd12e', fill: 'rgba(255,209,46,0.15)' },
  HARD:         { line: '#e8e8e8', fill: 'rgba(200,200,200,0.15)' },
  INTERMEDIATE: { line: '#43b02a', fill: 'rgba(67,176,42,0.15)' },
  WET:          { line: '#006aff', fill: 'rgba(0,106,255,0.15)' },
  UNKNOWN:      { line: '#a78bfa', fill: 'rgba(167,139,250,0.15)' },
};

function getCompoundColor(compound = '') {
  const c = compound.toUpperCase();
  if (c.includes('SOFT'))         return COMPOUND_COLORS.SOFT;
  if (c.includes('MEDIUM'))       return COMPOUND_COLORS.MEDIUM;
  if (c.includes('HARD'))         return COMPOUND_COLORS.HARD;
  if (c.includes('INTERMEDIATE')) return COMPOUND_COLORS.INTERMEDIATE;
  if (c.includes('WET'))          return COMPOUND_COLORS.WET;
  return COMPOUND_COLORS.UNKNOWN;
}

/** Simple linear regression → returns slope in sec/lap */
function calcSlope(lapNums, times) {
  const n = lapNums.length;
  if (n < 2) return null;
  const xm = lapNums.reduce((a, b) => a + b, 0) / n;
  const ym = times.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (lapNums[i] - xm) * (times[i] - ym);
    den += (lapNums[i] - xm) ** 2;
  }
  return den === 0 ? null : num / den; // sec/lap
}

const TyreDegradation = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
  const [lapsData,  setLapsData]  = useState([]);
  const [pitstops,  setPitstops]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [metric,    setMetric]    = useState('lap_time_sec');
  const [showPitLines, setShowPitLines] = useState(true);
  const [showSlopes,   setShowSlopes]   = useState(true);

  useEffect(() => {
    if (!year || !round || !sessionType || !selectedDrivers?.length) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/laps?year=${year}&round=${round}&session_type=${sessionType}&drivers=${selectedDrivers.join(',')}`).then(r => r.json()),
      fetch(`${API_BASE}/pitstops?year=${year}&round=${round}&session_type=${sessionType}`).then(r => r.json()),
    ])
      .then(([lapsRes, pitRes]) => {
        setLapsData(lapsRes.laps || []);
        setPitstops(pitRes.pitstops || []);
      })
      .catch(err => setError('Failed to fetch lap/pit data.'))
      .finally(() => setLoading(false));
  }, [year, round, sessionType, selectedDrivers]);

  // Group laps by driver → by stint
  const { traces, annotations } = useMemo(() => {
    if (!lapsData.length) return { traces: [], annotations: [] };

    const fallbackColors = ['#00D2BE', '#0000FF', '#FF0000', '#FFA500'];
    const usedColors = {};
    const byDriver = {};
    lapsData.forEach(lap => {
      if (!byDriver[lap.driver]) byDriver[lap.driver] = [];
      byDriver[lap.driver].push(lap);
    });

    const allTraces = [];
    const allAnnotations = [];

    Object.entries(byDriver).forEach(([driver, laps], dIdx) => {
      let baseColor = fallbackColors[dIdx % fallbackColors.length];
      if (allDrivers) {
        const info = allDrivers.find(d => d.abbreviation === driver);
        if (info?.team_color) baseColor = info.team_color.startsWith('#') ? info.team_color : `#${info.team_color}`;
      }
      let dash = 'solid';
      if (usedColors[baseColor]) { dash = usedColors[baseColor] === 1 ? 'dash' : 'dot'; usedColors[baseColor]++; }
      else usedColors[baseColor] = 1;

      // Group by stint within driver
      const byStint = {};
      laps.filter(l => l[metric] != null).sort((a, b) => a.lap_number - b.lap_number).forEach(lap => {
        // Determine stint from pitstops: lap belongs to stint N if lap > pitLap[N-1]
        const key = lap.compound + '_' + (lap.tyre_life != null ? Math.floor(lap.tyre_life / 30) : '0');
        if (!byStint[key]) byStint[key] = { compound: lap.compound, laps: [] };
        byStint[key].laps.push(lap);
      });

      // Re-split by compound transitions (sequential)
      let currentCompound = null;
      let currentStint = [];
      let stintIdx = 0;

      const flushStint = () => {
        if (!currentStint.length) return;
        const validLaps = currentStint.filter(l => l[metric] != null);
        if (!validLaps.length) return;
        const colors = getCompoundColor(currentCompound);
        const lapNums = validLaps.map(l => l.lap_number);
        const times   = validLaps.map(l => l[metric]);
        const slope   = calcSlope(lapNums, times);

        allTraces.push({
          x: lapNums,
          y: times.map(t => parseFloat(t.toFixed(3))),
          mode: 'lines+markers',
          type: 'scatter',
          name: `${driver} [${(currentCompound || 'UNK').substring(0, 1)}]`,
          legendgroup: driver,
          showlegend: stintIdx === 0,
          line: { color: colors.line, width: 2.5, dash },
          marker: { color: colors.line, size: 5, symbol: 'circle' },
          hovertemplate:
            `<b>${driver}</b><br>` +
            `Lap %{x}<br>` +
            `${metric === 'lap_time_sec' ? 'Lap Time' : 'Sector'}: %{y:.3f}s<br>` +
            `Compound: ${currentCompound}<extra></extra>`,
        });

        // Slope annotation in center of stint
        if (showSlopes && slope !== null && validLaps.length >= 3) {
          const midLap = lapNums[Math.floor(lapNums.length / 2)];
          const midTime = times[Math.floor(times.length / 2)];
          const slopeMs = (slope * 1000).toFixed(0);
          const slopeLabel = slope > 0 ? `+${slopeMs}ms/lap` : `${slopeMs}ms/lap`;
          allAnnotations.push({
            x: midLap, y: midTime,
            text: slopeLabel,
            showarrow: false,
            font: { color: colors.line, size: 9.5, family: 'Inter, monospace' },
            bgcolor: 'rgba(11,13,16,0.7)',
            borderpad: 2,
            yshift: 14,
          });
        }
        stintIdx++;
      };

      laps.filter(l => l[metric] != null).sort((a, b) => a.lap_number - b.lap_number).forEach(lap => {
        if (lap.compound !== currentCompound) { flushStint(); currentCompound = lap.compound; currentStint = []; }
        currentStint.push(lap);
      });
      flushStint();
    });

    return { traces: allTraces, annotations: allAnnotations };
  }, [lapsData, metric, allDrivers, showSlopes]);

  // Pit-stop vertical shapes
  const pitShapes = useMemo(() => {
    if (!showPitLines || !pitstops.length) return [];
    const driverColorMap = {};
    if (allDrivers) {
      allDrivers.forEach(d => {
        if (selectedDrivers.includes(d.abbreviation)) {
          driverColorMap[d.abbreviation] = d.team_color
            ? (d.team_color.startsWith('#') ? d.team_color : `#${d.team_color}`)
            : '#94a3b8';
        }
      });
    }
    const relevant = pitstops.filter(p => selectedDrivers.includes(p.driver));
    return relevant.map(p => ({
      type: 'line',
      x0: p.lap, x1: p.lap,
      y0: 0, y1: 1, yref: 'paper',
      line: { color: driverColorMap[p.driver] || '#6b7280', width: 1.5, dash: 'dashdot' },
    }));
  }, [pitstops, showPitLines, selectedDrivers, allDrivers]);

  if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">Computing Degradation Curves...</div>;
  if (error)   return <div className="w-full h-full flex items-center justify-center text-red-500 text-xs font-bold uppercase">{error}</div>;
  if (!selectedDrivers?.length) return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Select drivers above then click Update Analysis.</div>;
  if (!traces.length) return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No lap data available.</div>;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-1 text-xs shrink-0 flex-wrap">
        <span className="text-gray-500 font-semibold uppercase tracking-widest">Metric:</span>
        {[
          { key: 'lap_time_sec', label: 'Lap Time' },
          { key: 's1_sec', label: 'Sector 1' },
          { key: 's2_sec', label: 'Sector 2' },
          { key: 's3_sec', label: 'Sector 3' },
        ].map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className={`px-2 py-0.5 rounded-sm border text-[11px] font-semibold transition-colors ${metric === m.key ? 'bg-blue-600 border-blue-500 text-white' : 'border-[#2b2e36] text-gray-400 hover:border-gray-400 hover:text-white'}`}>
            {m.label}
          </button>
        ))}

        <span className="text-gray-600 mx-1">|</span>

        {/* Toggle overlays */}
        {[
          { key: 'showPitLines', val: showPitLines, set: setShowPitLines, label: 'Pit Lines' },
          { key: 'showSlopes',   val: showSlopes,   set: setShowSlopes,   label: 'Δ Slope' },
        ].map(({ key, val, set, label }) => (
          <button key={key} onClick={() => set(v => !v)}
            className={`px-2 py-0.5 rounded-sm border text-[11px] font-semibold transition-colors ${val ? 'bg-[#2b2e36] border-gray-500 text-white' : 'border-[#2b2e36] text-gray-600 hover:text-gray-400'}`}>
            {val ? '✓ ' : ''}{label}
          </button>
        ))}

        {/* Compound legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          {Object.entries(COMPOUND_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([name, c]) => (
            <span key={name} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: c.line }} />
              {name.substring(0, 1)}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <Plot
          data={traces}
          layout={{
            autosize: true,
            margin: { l: 55, r: 20, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor:  'rgba(0,0,0,0)',
            showlegend: true,
            legend: { orientation: 'h', y: -0.18, x: 0.5, xanchor: 'center', font: { color: '#94a3b8', size: 10 }, tracegroupgap: 4 },
            hovermode: 'x unified',
            hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0', size: 11 } },
            xaxis: { title: { text: 'Lap', font: { color: '#64748b', size: 11 } }, showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' } },
            yaxis: { title: { text: 'Time (s)', font: { color: '#64748b', size: 11 } }, showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' }, autorange: 'reversed' },
            shapes: pitShapes,
            annotations,
          }}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>
    </div>
  );
};

export default React.memo(TyreDegradation);
