import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, Zap, Trophy, Clock, ChevronLeft, Info, Activity, Gauge } from 'lucide-react';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

// Helper for HSL/Hex team colors
const tc = (color) => color ? (color.startsWith('#') ? color : `#${color}`) : '#888';

const CornerAnalysisMode = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCorner, setSelectedCorner] = useState(null);
  const [hoveredCorner, setHoveredCorner] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    if (!year || !round || !sessionType) return;
    const drvStr = selectedDrivers?.length > 0 
      ? selectedDrivers.join(',') 
      : allDrivers?.slice(0, 3).map(d => d.abbreviation).join(',');
    
    if (!drvStr) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/corner_analysis?year=${year}&round=${round}&session_type=${sessionType}&drivers=${drvStr}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load corner analysis');
    } finally {
      setLoading(false);
    }
  }, [year, round, sessionType, selectedDrivers, allDrivers]);

  useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

  // -- Track Map Logic --
  const mapData = useMemo(() => {
    if (!data?.track_x?.length) return null;
    const minX = Math.min(...data.track_x);
    const maxX = Math.max(...data.track_x);
    const minY = Math.min(...data.track_y);
    const maxY = Math.max(...data.track_y);
    return { minX, maxX, minY, maxY };
  }, [data]);

  const renderTrackMap = () => {
    if (!mapData) return null;
    const { minX, maxX, minY, maxY } = mapData;
    const W = 600, H = 400, PAD = 40;
    const scale = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
    const tx = (x) => PAD + (x - minX) * scale;
    const ty = (y) => H - (PAD + (y - minY) * scale);

    const pathD = data.track_x.map((x, i) => `${i === 0 ? 'M' : 'L'} ${tx(x)} ${ty(data.track_y[i])}`).join(' ');

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <path d={pathD} fill="none" stroke="#1e293b" strokeWidth="4" strokeLinejoin="round" />
        {data.corner_list.map(c => {
          const pos = data.corner_positions[c.number];
          if (!pos) return null;
          const isSelected = selectedCorner === c.number;
          const isHovered = hoveredCorner === c.number;
          const best = data.global_best[c.number];
          const color = best?.apex_speed < 120 ? '#ef4444' : best?.apex_speed < 180 ? '#f59e0b' : '#22c55e';

          return (
            <g key={c.number} 
               className="cursor-pointer transition-all duration-200"
               onMouseEnter={() => setHoveredCorner(c.number)}
               onMouseLeave={() => setHoveredCorner(null)}
               onClick={() => setSelectedCorner(c.number)}
            >
              <circle 
                cx={tx(pos.x)} cy={ty(pos.y)} 
                r={isSelected || isHovered ? 8 : 5} 
                fill={color} 
                className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                stroke="#fff" strokeWidth={isSelected ? 2 : 0}
              />
              {(isSelected || isHovered) && (
                <text x={tx(pos.x)} y={ty(pos.y) - 15} textAnchor="middle" className="text-[10px] font-bold fill-white">
                  T{c.number}{c.letter}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // -- Drill-down Content --
  const renderDrillDown = () => {
    if (!selectedCorner || !data) return null;
    const cornerInfo = data.corner_list.find(c => c.number === selectedCorner);
    
    // Telemetry for all drivers at this corner
    const traces = [];
    const brakeTraces = [];
    const throttleTraces = [];
    const gearTraces = [];

    data.drivers.forEach(d => {
      const c = d.corners.find(x => x.corner_number === selectedCorner);
      if (!c) return;
      const color = tc(d.team_color);
      
      traces.push({
        x: c.seg_dist, y: c.seg_speed, name: d.driver, type: 'scatter', mode: 'lines',
        line: { color, width: 2.5 },
        hovertemplate: `<b>${d.driver}</b><br>Speed: %{y:.1f} km/h<br>Dist: %{x:.0f}m<extra></extra>`
      });

      brakeTraces.push({
        x: c.seg_dist, y: c.seg_brake, name: d.driver, type: 'scatter', mode: 'lines',
        line: { color, width: 2, dash: 'dot' },
        fill: 'tozeroy', fillcolor: `${color}10`
      });

      throttleTraces.push({
        x: c.seg_dist, y: c.seg_throttle, name: d.driver, type: 'scatter', mode: 'lines',
        line: { color, width: 2 },
      });

      gearTraces.push({
        x: c.seg_dist, y: c.seg_gear, name: d.driver, type: 'scatter', mode: 'lines',
        line: { color, width: 2, shape: 'hv' },
      });
    });

    const layoutBase = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'rgba(30,41,59,0.2)',
      font: { color: '#94a3b8', size: 10 },
      margin: { l: 40, r: 10, t: 30, b: 30 },
      xaxis: { gridcolor: '#334155', zeroline: false },
      yaxis: { gridcolor: '#334155', zeroline: false },
      showlegend: false,
    };

    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-white/5">
          <button 
            onClick={() => setSelectedCorner(null)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 flex items-center gap-2 font-bold text-sm"
          >
            <ChevronLeft size={16} /> Back to Overview
          </button>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter">CORNER {selectedCorner}{cornerInfo?.letter}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{data.drivers.length} Drivers Analyzed</p>
          </div>
          <div className="ml-auto flex gap-4">
             {data.drivers.map(d => {
               const c = d.corners.find(x => x.corner_number === selectedCorner);
               return (
                 <div key={d.driver} className="text-right">
                    <p className="text-[9px] font-bold" style={{ color: tc(d.team_color) }}>{d.driver}</p>
                    <p className="text-sm font-mono text-white font-bold">{c?.apex_speed?.toFixed(1)} <span className="text-[10px] text-gray-500">km/h</span></p>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div className="bg-[#111827] rounded-xl border border-white/5 p-2 h-[300px]">
            <p className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-widest flex items-center gap-2">
              <Gauge size={12} className="text-blue-400" /> Speed Profile (Apex Comparison)
            </p>
            <Plot data={traces} layout={{ ...layoutBase, yaxis: { ...layoutBase.yaxis, title: 'Speed (km/h)' } }} style={{ width: '100%', height: '100%' }} config={{ responsive: true, displayModeBar: false }} />
          </div>
          <div className="bg-[#111827] rounded-xl border border-white/5 p-2 h-[300px]">
            <p className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="text-red-400" /> Braking Pressure & Modulation
            </p>
            <Plot data={brakeTraces} layout={{ ...layoutBase, yaxis: { ...layoutBase.yaxis, title: 'Brake %', range: [-5, 105] } }} style={{ width: '100%', height: '100%' }} config={{ responsive: true, displayModeBar: false }} />
          </div>
          <div className="bg-[#111827] rounded-xl border border-white/5 p-2 h-[300px]">
            <p className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-green-400" /> Throttle Application (Exit Phase)
            </p>
            <Plot data={throttleTraces} layout={{ ...layoutBase, yaxis: { ...layoutBase.yaxis, title: 'Throttle %', range: [-5, 105] } }} style={{ width: '100%', height: '100%' }} config={{ responsive: true, displayModeBar: false }} />
          </div>
          <div className="bg-[#111827] rounded-xl border border-white/5 p-2 h-[300px]">
            <p className="text-[10px] font-bold text-gray-500 px-2 uppercase tracking-widest flex items-center gap-2">
              <Gauge size={12} className="text-purple-400" /> Gear Selection & RPM Range
            </p>
            <Plot data={gearTraces} layout={{ ...layoutBase, yaxis: { ...layoutBase.yaxis, title: 'Gear', range: [0, 9], dtick: 1 } }} style={{ width: '100%', height: '100%' }} config={{ responsive: true, displayModeBar: false }} />
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="flex flex-1 min-h-0">
      {/* Left: Map */}
      <div className="flex-1 flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="text-blue-400" /> Interactive Track Analysis
          </h3>
          <span className="text-[10px] text-gray-600">Click a corner to analyze telemetry</span>
        </div>
        <div className="flex-1 p-8">
          {renderTrackMap()}
        </div>
      </div>

      {/* Right: Corner Grid */}
      <div className="w-[450px] flex flex-col bg-[#0d1117] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Corner Classification</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {data.corner_list.map(c => {
            const best = data.global_best[c.number];
            const isHovered = hoveredCorner === c.number;
            const catColor = best?.apex_speed < 120 ? 'text-red-400' : best?.apex_speed < 180 ? 'text-orange-400' : 'text-green-400';
            const catBg = best?.apex_speed < 120 ? 'bg-red-400/10' : best?.apex_speed < 180 ? 'bg-orange-400/10' : 'bg-green-400/10';

            return (
              <div 
                key={c.number}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${isHovered ? 'bg-white/10 border-blue-500/50 scale-[1.02]' : 'bg-white/5 border-white/5'}`}
                onMouseEnter={() => setHoveredCorner(c.number)}
                onMouseLeave={() => setHoveredCorner(null)}
                onClick={() => setSelectedCorner(c.number)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white italic">T{c.number}{c.letter}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${catBg} ${catColor}`}>
                      {best?.apex_speed < 120 ? 'LOW' : best?.apex_speed < 180 ? 'MED' : 'HIGH'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-mono">Best Apex</span>
                    <p className="text-sm font-black text-white font-mono">{best?.apex_speed.toFixed(1)} <span className="text-[10px] text-gray-600">km/h</span></p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <Clock size={10} /> Braking Zone
                    </p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-white font-bold">{best?.driver}</span>
                       <Zap size={10} className="text-yellow-400" />
                    </div>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <Zap size={10} /> Throttle Pickup
                    </p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-white font-bold">{best?.driver}</span>
                       <Trophy size={10} className="text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0d10] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
      </div>
      <p className="text-xs font-black text-blue-500 uppercase tracking-widest animate-pulse">Scanning Track Geometry...</p>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0d10] p-8 text-center">
      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
        <Info className="text-red-500" />
      </div>
      <h3 className="text-white font-bold mb-1">Analysis Failed</h3>
      <p className="text-gray-500 text-xs max-w-xs">{error}</p>
      <button onClick={fetchAnalysis} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-colors">Try Again</button>
    </div>
  );

  if (!data) return null;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0d10] overflow-hidden">
      {selectedCorner ? renderDrillDown() : renderOverview()}
    </div>
  );
};

export default CornerAnalysisMode;
