import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;

const API_BASE = 'http://127.0.0.1:8001/api';

const StraightLineSpeed = ({ year, round, sessionType, allDrivers }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('top_speed'); // 'top_speed' or 'speed_trap'

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        setLoading(true);
        setError(null);
        axios.get(`${API_BASE}/straight_line_speed?year=${year}&round=${round}&session_type=${sessionType}`)
            .then(res => { setData(res.data.drivers); setLoading(false); })
            .catch(err => { setError(err.response?.data?.detail || 'Failed to fetch speed data'); setLoading(false); });
    }, [year, round, sessionType]);

    if (loading) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading straight line speed data...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No speed data available</div>;

    const filtered = data.filter(d => {
        const val = mode === 'top_speed' ? d.top_speed : d.speed_trap;
        return val !== null && val !== undefined;
    });

    const sorted = [...filtered].sort((a, b) => {
        const va = mode === 'top_speed' ? a.top_speed : a.speed_trap;
        const vb = mode === 'top_speed' ? b.top_speed : b.speed_trap;
        return va - vb; // Ascending for horizontal bar (bottom = fastest visual)
    });

    const drivers = sorted.map(d => d.driver);
    const values = sorted.map(d => mode === 'top_speed' ? d.top_speed : d.speed_trap);
    const colors = sorted.map(d => `#${d.team_color}`);
    const minSpeed = Math.min(...values);

    return (
        <div className="h-full w-full flex flex-col bg-[#0b0d10]">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2b2e36]">
                <button
                    onClick={() => setMode('top_speed')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${mode === 'top_speed' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    Top Speed (Telemetry)
                </button>
                <button
                    onClick={() => setMode('speed_trap')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${mode === 'speed_trap' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    Speed Trap (Official)
                </button>
                <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">
                    {sorted.length} Drivers
                </span>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                <Plot
                    data={[{
                        type: 'bar',
                        orientation: 'h',
                        y: drivers,
                        x: values,
                        marker: {
                            color: colors,
                            line: { color: colors.map(c => c + '80'), width: 1 }
                        },
                        text: values.map(v => `${v.toFixed(1)} km/h`),
                        textposition: 'outside',
                        textfont: { color: '#e2e8f0', size: 10 },
                        hovertemplate: '<b>%{y}</b><br>%{x:.1f} km/h<extra></extra>',
                    }]}
                    layout={{
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { color: '#94a3b8', size: 11 },
                        margin: { l: 60, r: 80, t: 10, b: 30 },
                        xaxis: {
                            title: { text: 'Speed (km/h)', font: { size: 10 } },
                            gridcolor: '#1e293b',
                            zeroline: false,
                            range: [Math.max(minSpeed - 15, 0), Math.max(...values) + 10],
                        },
                        yaxis: {
                            gridcolor: '#1e293b',
                            tickfont: { size: 11, color: '#e2e8f0' },
                        },
                        bargap: 0.25,
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                />
            </div>
        </div>
    );
};

export default StraightLineSpeed;
