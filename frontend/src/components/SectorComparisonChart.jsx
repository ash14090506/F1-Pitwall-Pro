import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { ChevronLeft, ChevronRight, Activity, Zap } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const SectorComparisonChart = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeSector, setActiveSector] = useState(1); // 1, 2, or 3

    const fetchData = useCallback(async () => {
        if (!year || !round || !sessionType || !selectedDrivers?.length) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/sector_map?year=${year}&round=${round}&session_type=${sessionType}&drivers=${selectedDrivers.join(',')}`);
            if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
            const json = await res.json();
            setData(json.drivers);
        } catch (e) {
            setError(e.message || 'Failed to fetch sector data.');
        } finally {
            setLoading(false);
        }
    }, [year, round, sessionType, selectedDrivers]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const sectorKey = `s${activeSector}`;

    const plotData = useMemo(() => {
        if (!data) return [];
        return data.map(d => {
            const sector = d[sectorKey];
            if (!sector || !sector.distance) return null;
            
            // Normalise distance to start from 0 for this sector
            const startDist = sector.distance[0] || 0;
            const normalizedDist = sector.distance.map(v => v - startDist);

            const tc = d.team_color.startsWith('#') ? d.team_color : `#${d.team_color}`;
            const isBest = d[`${sectorKey}_is_best`];

            return {
                x: normalizedDist,
                y: sector.speed,
                type: 'scattergl',
                mode: 'lines',
                name: d.driver,
                line: {
                    color: tc,
                    width: isBest ? 4 : 2,
                    dash: isBest ? 'solid' : 'dot'
                },
                hovertemplate: `<b>${d.driver}</b><br>Dist: %{x:.0f}m<br>Speed: %{y:.1f} km/h<extra></extra>`
            };
        }).filter(Boolean);
    }, [data, sectorKey]);

    if (!selectedDrivers?.length) return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest">Select drivers to compare sector traces.</div>
    );

    if (loading) return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-blue-400 font-bold text-[10px] tracking-widest uppercase">Isolating Sector {activeSector} Telemetry...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="w-full h-full flex items-center justify-center text-red-500 text-xs font-bold uppercase tracking-widest">{error}</div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-[#0b0d10] overflow-hidden">
            {/* Header / Selector */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2e36] bg-[#16181d]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Activity size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Sector Analysis</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Compare Speed Profiles</p>
                    </div>
                </div>

                <div className="flex items-center bg-[#0b0d10] rounded-lg p-1 border border-[#2b2e36]">
                    {[1, 2, 3].map(s => (
                        <button
                            key={s}
                            onClick={() => setActiveSector(s)}
                            className={`px-6 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeSector === s 
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            Sector {s}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Active Lap</div>
                        <div className="text-xs font-bold text-white uppercase italic">Reference Fastest</div>
                     </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0 relative">
                <Plot
                    data={plotData}
                    layout={{
                        autosize: true,
                        margin: { l: 60, r: 40, t: 40, b: 60 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#94a3b8', family: 'Inter, sans-serif' },
                        hovermode: 'x unified',
                        xaxis: {
                            title: { text: 'Distance into Sector (m)', font: { size: 10, weight: 'bold' } },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#2b2e36',
                            tickfont: { size: 10 }
                        },
                        yaxis: {
                            title: { text: 'Speed (km/h)', font: { size: 10, weight: 'bold' } },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#2b2e36',
                            tickfont: { size: 10 }
                        },
                        legend: {
                            orientation: 'h',
                            y: 1.1,
                            x: 0.5,
                            xanchor: 'center',
                            font: { size: 10 }
                        },
                        annotations: [
                            {
                                xref: 'paper',
                                yref: 'paper',
                                x: 0.02,
                                y: 0.95,
                                text: `<b>SECTOR ${activeSector} PROFILE</b>`,
                                showarrow: false,
                                font: { size: 12, color: '#3b82f6' },
                                align: 'left'
                            }
                        ]
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false, responsive: true }}
                />
                
                {/* Info Overlay */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                    {data && data.filter(d => d[`s${activeSector}_is_best`]).map(d => (
                        <div key={d.driver} className="bg-[#16181d]/90 backdrop-blur-md border border-blue-500/50 p-3 rounded-lg shadow-2xl flex items-center gap-4">
                            <Zap size={16} className="text-blue-400 animate-pulse" />
                            <div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">S{activeSector} Purple Sector</div>
                                <div className="text-sm font-black text-white italic uppercase tracking-tighter">
                                    {d.driver} — {(d[`s${activeSector}_time`]).toFixed(3)}s
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SectorComparisonChart);
