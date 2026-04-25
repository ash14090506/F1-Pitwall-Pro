import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;
import { Activity, Zap, TrendingDown, TrendingUp, Info } from 'lucide-react';
import WindowCard from './WindowCard';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const SectorComparisonChart = ({ year, round, sessionType, selectedDrivers, allDrivers, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeSector, setActiveSector] = useState(1);
    const [userRefDriver, setUserRefDriver] = useState(null);

    const refDriver = selectedDrivers.includes(userRefDriver) ? userRefDriver : (selectedDrivers.length > 0 ? selectedDrivers[0] : null);
    const compDriver = selectedDrivers.find(d => d !== refDriver) || (selectedDrivers.length > 1 ? selectedDrivers[1] : null);

    const fetchData = useCallback(async () => {
        if (!year || !round || !sessionType || !refDriver || !compDriver) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/telemetry/sector_delta?year=${year}&round=${round}&session_type=${sessionType}&ref_driver=${refDriver}&comp_driver=${compDriver}&sector=${activeSector}`);
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e.message || 'Failed to fetch sector delta.');
        } finally {
            setLoading(false);
        }
    }, [year, round, sessionType, refDriver, compDriver, activeSector]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const plotData = useMemo(() => {
        if (!data || !data.data) return [];
        
        const refInfo = allDrivers?.find(d => d.abbreviation === data.ref_driver);
        const compInfo = allDrivers?.find(d => d.abbreviation === data.comp_driver);
        
        const refColor = refInfo?.team_color ? (refInfo.team_color.startsWith('#') ? refInfo.team_color : `#${refInfo.team_color}`) : '#ffffff';
        const compColor = compInfo?.team_color ? (compInfo.team_color.startsWith('#') ? compInfo.team_color : `#${compInfo.team_color}`) : '#3b82f6';

        return [
            // Speed Traces (Subplot 1)
            {
                x: data.data.distance,
                y: data.data.ref_speed,
                name: data.ref_driver,
                type: 'scattergl',
                mode: 'lines',
                line: { color: refColor, width: 3 },
                yaxis: 'y1',
                hovertemplate: `<b>${data.ref_driver}</b>: %{y:.1f} km/h<extra></extra>`
            },
            {
                x: data.data.distance,
                y: data.data.comp_speed,
                name: data.comp_driver,
                type: 'scattergl',
                mode: 'lines',
                line: { color: compColor, width: 2, dash: 'dot' },
                yaxis: 'y1',
                hovertemplate: `<b>${data.comp_driver}</b>: %{y:.1f} km/h<extra></extra>`
            },
            // Time Delta Trace (Subplot 2)
            {
                x: data.data.distance,
                y: data.data.delta_time,
                name: 'Time Delta',
                type: 'scattergl',
                mode: 'lines',
                fill: 'tozeroy',
                fillcolor: 'rgba(59, 130, 246, 0.1)',
                line: { color: '#3b82f6', width: 2 },
                yaxis: 'y2',
                hovertemplate: `<b>Delta</b>: %{y:+.3f}s<extra></extra>`
            }
        ];
    }, [data, allDrivers]);

    if (!selectedDrivers || selectedDrivers.length < 2) return (
        <WindowCard title="Sector Analysis Comparison" fullSpan={true} onClose={onClose}>
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                <Info size={32} className="text-blue-500/50" />
                <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase tracking-widest">Two Drivers Required</p>
                    <p className="text-xs max-w-xs mt-1">Please select at least two drivers in the main toolbar to compare sector-specific deltas.</p>
                </div>
            </div>
        </WindowCard>
    );

    return (
        <WindowCard title={`Sector ${activeSector} Performance Comparison: ${refDriver} vs ${compDriver}`} fullSpan={true} onClose={onClose}>
            <div className="w-full h-full flex flex-col bg-[#0b0d10] overflow-hidden">
                {/* Header / Selector */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-[#2b2e36] bg-[#16181d]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#0b0d10] rounded-lg p-1 border border-[#2b2e36]">
                            {[1, 2, 3].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveSector(s)}
                                    className={`px-6 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeSector === s 
                                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    Sector {s}
                                </button>
                            ))}
                        </div>
                        
                        <div className="h-6 w-px bg-[#2b2e36]" />
                        
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ref:</span>
                            <select 
                                value={refDriver} 
                                onChange={e => setUserRefDriver(e.target.value)}
                                className="bg-[#0b0d10] border border-[#2b2e36] text-white text-[10px] font-bold px-2 py-1 rounded outline-none"
                            >
                                {selectedDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {data && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">End of Sector Delta</div>
                                    <div className={`text-sm font-black italic uppercase ${data.data.delta_time[data.data.delta_time.length - 1] < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {data.data.delta_time[data.data.delta_time.length - 1] < 0 ? <TrendingDown size={14} className="inline mr-1" /> : <TrendingUp size={14} className="inline mr-1" />}
                                        {Math.abs(data.data.delta_time[data.data.delta_time.length - 1]).toFixed(3)}s
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative">
                    {loading ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Synchronizing Telemetry...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-[10px] font-black uppercase tracking-widest">
                            {error}
                        </div>
                    ) : data && (
                        <Plot
                            data={plotData}
                            layout={{
                                autosize: true,
                                margin: { l: 60, r: 40, t: 20, b: 40 },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: '#94a3b8', family: 'Inter, sans-serif' },
                                hovermode: 'x unified',
                                grid: { rows: 2, columns: 1, pattern: 'independent', roworder: 'top to bottom' },
                                xaxis: {
                                    title: { text: 'Distance into Sector (m)', font: { size: 9, weight: 'bold' } },
                                    gridcolor: '#1b1d24',
                                    zeroline: false,
                                    tickfont: { size: 9 },
                                    anchor: 'y2'
                                },
                                yaxis: {
                                    title: { text: 'Speed (km/h)', font: { size: 9, weight: 'bold' } },
                                    gridcolor: '#1b1d24',
                                    zeroline: false,
                                    tickfont: { size: 9 },
                                    domain: [0.45, 1]
                                },
                                yaxis2: {
                                    title: { text: 'Delta (s)', font: { size: 9, weight: 'bold' } },
                                    gridcolor: '#1b1d24',
                                    zeroline: true,
                                    zerolinecolor: '#2b2e36',
                                    tickfont: { size: 9 },
                                    domain: [0, 0.35],
                                    autorange: 'reversed' // Negative (faster) at top
                                },
                                legend: {
                                    orientation: 'h',
                                    y: 1.08,
                                    x: 0.5,
                                    xanchor: 'center',
                                    font: { size: 9 }
                                },
                                shapes: [
                                    {
                                        type: 'line',
                                        xref: 'paper',
                                        yref: 'paper',
                                        x0: 0,
                                        y0: 0.4,
                                        x1: 1,
                                        y1: 0.4,
                                        line: { color: '#2b2e36', width: 1, dash: 'dot' }
                                    }
                                ]
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            config={{ displayModeBar: false, responsive: true }}
                        />
                    )}
                </div>
                
                <div className="px-6 py-2 border-t border-[#2b2e36] bg-[#16181d] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Time Gained</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Time Lost</span>
                        </div>
                    </div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase italic">
                        * Comparison based on each driver's fastest lap in session
                    </div>
                </div>
            </div>
        </WindowCard>
    );
};

export default React.memo(SectorComparisonChart);
