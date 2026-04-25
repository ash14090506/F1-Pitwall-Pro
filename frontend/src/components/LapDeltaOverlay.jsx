import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

/* ── color helpers ───────────────────────────────────────────────── */
function deltaToColor(delta, maxAbs = 0.5) {
  const t = Math.max(-1, Math.min(1, delta / maxAbs));   // -1 (comp faster) → +1 (comp slower)
  if (t <= 0) {
    // green (comp faster)
    const g = Math.round(255 * (1 + t));
    return `rgb(0,${g},0)`;
  } else {
    // red (comp slower)
    const r = Math.round(255 * t);
    return `rgb(${r + 120},0,0)`;
  }
}

/* ── SVG track-map renderer ──────────────────────────────────────── */
function DeltaTrackMap({ data, refDriver, compDriver, refColor, compColor }) {
  const { x, y, delta_time } = data;
  if (!x?.length) return null;

  // Normalise into [0,1] SVG space
  const W = 680, H = 420, PAD = 30;
  const minX = Math.min(...x), maxX = Math.max(...x);
  const minY = Math.min(...y), maxY = Math.max(...y);
  const scaleX = (W - PAD * 2) / (maxX - minX || 1);
  const scaleY = (H - PAD * 2) / (maxY - minY || 1);
  const scale  = Math.min(scaleX, scaleY);
  const offX   = PAD + ((W - PAD * 2) - (maxX - minX) * scale) / 2;
  const offY   = PAD + ((H - PAD * 2) - (maxY - minY) * scale) / 2;

  const px = i => offX + (x[i] - minX) * scale;
  const py = i => H - (offY + (y[i] - minY) * scale); // flip Y

  const maxAbs = Math.max(...delta_time.map(Math.abs), 0.1);

  // Build coloured segments (thin line segments between adjacent points)
  const segments = [];
  for (let i = 0; i < x.length - 1; i++) {
    segments.push(
      <line
        key={i}
        x1={px(i)} y1={py(i)}
        x2={px(i + 1)} y2={py(i + 1)}
        stroke={deltaToColor(delta_time[i], maxAbs)}
        strokeWidth="4"
        strokeLinecap="round"
      />
    );
  }

  // Legend bar
  const LEGEND_STOPS = 20;
  const legendItems = Array.from({ length: LEGEND_STOPS }, (_, i) => {
    const t = -1 + (2 * i) / (LEGEND_STOPS - 1);
    return deltaToColor(t * maxAbs, maxAbs);
  });

  const fmtDelta = v => (v > 0 ? '+' : '') + v.toFixed(3) + 's';
  const minDelta = Math.min(...delta_time);
  const maxDelta = Math.max(...delta_time);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0d10' }}>
      {/* Driver header */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>
        <span style={{ color: refColor }}>{refDriver} <span style={{ color: '#6b7280', fontWeight: 400 }}>REF</span></span>
        <span style={{ color: '#6b7280' }}>vs</span>
        <span style={{ color: compColor }}>{compDriver} <span style={{ color: '#6b7280', fontWeight: 400 }}>COMP</span></span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', maxHeight: '60%' }}>
        {segments}
      </svg>

      {/* Gradient legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 11 }}>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmtDelta(minDelta)}</span>
        <div style={{ display: 'flex', height: 10, width: 200, borderRadius: 4, overflow: 'hidden' }}>
          {legendItems.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>{fmtDelta(maxDelta)}</span>
      </div>
      <div style={{ color: '#6b7280', fontSize: 10, marginTop: 4 }}>
        Green = {compDriver} faster · Red = {compDriver} slower
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
const LapDeltaOverlay = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
  const [refDriver,  setRefDriver]  = useState('');
  const [compDriver, setCompDriver] = useState('');
  const [deltaData,  setDeltaData]  = useState(null);
  const [trackData,  setTrackData]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [viewMode,   setViewMode]   = useState('chart'); // 'chart' | 'track'

  // Initialise pickers whenever selected drivers change
  useEffect(() => {
    if (selectedDrivers?.length >= 1) setRefDriver(prev => prev || selectedDrivers[0]);
    if (selectedDrivers?.length >= 2) setCompDriver(prev => prev || selectedDrivers[1]);
  }, [selectedDrivers]);

  const fetchDelta = useCallback(async () => {
    if (!refDriver || !compDriver || refDriver === compDriver) return;
    setLoading(true);
    setError(null);
    setDeltaData(null);
    setTrackData(null);
    try {
      const params = `year=${year}&round=${round}&session_type=${sessionType}&ref_driver=${refDriver}&comp_driver=${compDriver}`;
      const [chartRes, trackRes] = await Promise.all([
        fetch(`${API_BASE}/telemetry/delta?${params}`),
        fetch(`${API_BASE}/telemetry/delta_track?${params}`),
      ]);
      if (!chartRes.ok) throw new Error((await chartRes.json()).detail || 'Failed to fetch delta');
      if (!trackRes.ok) throw new Error((await trackRes.json()).detail || 'Failed to fetch track delta');
      const [chart, track] = await Promise.all([chartRes.json(), trackRes.json()]);
      setDeltaData(chart);
      setTrackData(track);
    } catch (err) {
      setError(err.message || 'Failed to fetch delta data.');
    } finally {
      setLoading(false);
    }
  }, [year, round, sessionType, refDriver, compDriver]);

  // Driver colour helper
  const driverColor = useCallback((abbrev) => {
    if (!allDrivers) return '#94a3b8';
    const info = allDrivers.find(d => d.abbreviation === abbrev);
    if (!info?.team_color) return '#94a3b8';
    return info.team_color.startsWith('#') ? info.team_color : `#${info.team_color}`;
  }, [allDrivers]);

  // Build Plotly traces for chart view
  const { traces, layout } = useMemo(() => {
    if (!deltaData) return { traces: [], layout: {} };
    const { delta } = deltaData;
    const dist      = delta.distance;
    const dt        = delta.delta_time;
    const refColor  = driverColor(deltaData.ref_driver);
    const compColor = driverColor(deltaData.comp_driver);

    const positive = dt.map(v => (v > 0 ? v : null));
    const negative = dt.map(v => (v < 0 ? v : null));

    const baseTrace = {
      x: dist,
      mode: 'lines',
      type: 'scatter',
      hovertemplate: '%{x:.0f}m  Δ%{y:+.3f}s<extra></extra>',
    };

    const deltaTraces = [
      {
        ...baseTrace, y: positive,
        name: `${deltaData.comp_driver} slower`,
        line: { color: '#ef4444', width: 2 },
        fill: 'tozeroy', fillcolor: 'rgba(239,68,68,0.12)',
      },
      {
        ...baseTrace, y: negative,
        name: `${deltaData.comp_driver} faster`,
        line: { color: '#22c55e', width: 2 },
        fill: 'tozeroy', fillcolor: 'rgba(34,197,94,0.12)',
      },
    ];

    const speedTraces = [
      {
        x: dist, y: delta.ref_speed, mode: 'lines', type: 'scatter',
        name: `${deltaData.ref_driver} speed`, yaxis: 'y2',
        line: { color: refColor, width: 1.5 }, opacity: 0.5, hoverinfo: 'skip',
      },
      {
        x: dist, y: delta.comp_speed, mode: 'lines', type: 'scatter',
        name: `${deltaData.comp_driver} speed`, yaxis: 'y2',
        line: { color: compColor, width: 1.5, dash: 'dash' }, opacity: 0.5, hoverinfo: 'skip',
      },
    ];

    const lyt = {
      autosize: true,
      margin: { l: 55, r: 55, t: 16, b: 40 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor:  'rgba(0,0,0,0)',
      showlegend: true,
      legend: { orientation: 'h', y: -0.18, x: 0.5, xanchor: 'center', font: { color: '#94a3b8', size: 10 } },
      hovermode: 'x unified',
      hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0', size: 11 } },
      shapes: [{ type: 'line', x0: 0, x1: dist[dist.length - 1] || 5000, y0: 0, y1: 0, yref: 'y', line: { color: '#94a3b8', width: 1, dash: 'dot' } }],
      xaxis: { title: { text: 'Distance (m)', font: { color: '#64748b', size: 11 } }, showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' } },
      yaxis: { title: { text: `Δ Time (s)  [+ = ${deltaData.comp_driver} slower]`, font: { color: '#64748b', size: 10 } }, showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' }, tickformat: '+.2f' },
      yaxis2: { title: { text: 'Speed (km/h)', font: { color: '#64748b', size: 10 } }, overlaying: 'y', side: 'right', showgrid: false, zeroline: false, tickfont: { color: '#475569' }, range: [0, 380] },
    };

    return { traces: [...deltaTraces, ...speedTraces], layout: lyt };
  }, [deltaData, driverColor]);

  if (!selectedDrivers?.length) return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Select at least 2 drivers then click Update Analysis.</div>
  );

  const refColor  = driverColor(refDriver);
  const compColor = driverColor(compDriver);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls row */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-1 text-xs shrink-0 flex-wrap">
        <span className="text-gray-500 font-semibold uppercase tracking-widest">Reference:</span>
        <select value={refDriver} onChange={e => setRefDriver(e.target.value)} className="toolbar-select">
          {selectedDrivers.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <span className="text-gray-500 font-semibold uppercase tracking-widest">vs.</span>
        <select value={compDriver} onChange={e => setCompDriver(e.target.value)} className="toolbar-select">
          {selectedDrivers.filter(d => d !== refDriver).map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <button
          onClick={fetchDelta}
          disabled={loading || !refDriver || !compDriver || refDriver === compDriver}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-1 rounded-sm font-semibold text-[11px] transition-colors"
        >
          {loading ? 'Computing...' : 'Load Delta'}
        </button>

        {/* View toggle */}
        {deltaData && (
          <div className="flex items-center gap-1 ml-2">
            {[['chart', 'Chart'], ['track', 'Track Map']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-2 py-0.5 rounded-sm border text-[11px] font-semibold transition-colors ${
                  viewMode === key
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'border-[#2b2e36] text-gray-400 hover:border-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {deltaData && (
          <div className="ml-auto flex items-center gap-4 text-[11px] font-mono">
            <span className="text-green-400">▲ Green = {deltaData.comp_driver} faster</span>
            <span className="text-red-400">▼ Red = {deltaData.comp_driver} slower</span>
          </div>
        )}
      </div>

      {error && <div className="px-4 py-1 text-red-400 text-xs font-medium">{error}</div>}

      {loading && (
        <div className="flex-1 flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">
          Interpolating Telemetry Delta...
        </div>
      )}

      {/* Chart view */}
      {!loading && viewMode === 'chart' && traces.length > 0 && (
        <div className="flex-1 min-h-0">
          <Plot data={traces} layout={layout} useResizeHandler style={{ width: '100%', height: '100%' }} config={{ displayModeBar: false, responsive: true }} />
        </div>
      )}

      {/* Track map view */}
      {!loading && viewMode === 'track' && trackData && (
        <div className="flex-1 min-h-0">
          <DeltaTrackMap data={trackData} refDriver={refDriver} compDriver={compDriver} refColor={refColor} compColor={compColor} />
        </div>
      )}

      {/* Empty state */}
      {!loading && !deltaData && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
          Select drivers and click <strong className="text-blue-400 mx-1">Load Delta</strong> to compute fastest-lap gap.
        </div>
      )}
    </div>
  );
};

export default React.memo(LapDeltaOverlay);
