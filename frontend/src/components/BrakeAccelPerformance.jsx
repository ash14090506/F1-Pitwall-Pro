import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';
const Plot = ReactPlot.default || ReactPlot;

const API_BASE = 'http://127.0.0.1:8001/api';

const BrakeAccelPerformance = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('scatter'); // 'scatter' or 'zones'

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        const drvStr = selectedDrivers?.length > 0
            ? selectedDrivers.join(',')
            : allDrivers?.map(d => d.abbreviation).join(',');
        if (!drvStr) return;

        setLoading(true);
        setError(null);
        axios.get(`${API_BASE}/brake_accel_performance?year=${year}&round=${round}&session_type=${sessionType}&drivers=${drvStr}`)
            .then(res => { setData(res.data.performance); setLoading(false); })
            .catch(err => { setError(err.response?.data?.detail || 'Failed to fetch brake/accel data'); setLoading(false); });
    }, [year, round, sessionType, selectedDrivers, allDrivers]);

    if (loading) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Analyzing G-force data...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No performance data available</div>;

    const renderScatter = () => {
        const traces = data.map(d => ({
            type: 'scatter',
            mode: 'markers+text',
            name: d.driver,
            x: [Math.abs(d.max_braking_g)],
            y: [d.max_accel_g],
            text: [d.driver],
            textposition: 'top center',
            textfont: { color: '#e2e8f0', size: 10, family: 'monospace' },
            marker: {
                size: 14,
                color: `#${d.team_color}`,
                line: { width: 2, color: `#${d.team_color}80` },
                symbol: 'circle',
            },
            hovertemplate: `<b>${d.driver}</b><br>Braking: %{x:.2f}G<br>Accel: %{y:.2f}G<br>Lateral: ${d.max_lat_g.toFixed(2)}G<extra></extra>`,
        }));

        return (
            <Plot
                data={traces}
                layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#94a3b8', size: 10 },
                    margin: { l: 60, r: 20, t: 20, b: 50 },
                    xaxis: {
                        title: { text: 'Peak Braking G-Force (|G|)', font: { size: 11 } },
                        gridcolor: '#1e293b',
                        zeroline: false,
                    },
                    yaxis: {
                        title: { text: 'Peak Acceleration G-Force', font: { size: 11 } },
                        gridcolor: '#1e293b',
                        zeroline: false,
                    },
                    showlegend: false,
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
            />
        );
    };

    const renderZones = () => {
        // Build braking zone comparison bars
        const allZones = [];
        data.forEach(d => {
            d.braking_zones.forEach((z, i) => {
                allZones.push({
                    driver: d.driver,
                    zone: `Z${i + 1} (${z.entry_speed.toFixed(0)}→${z.exit_speed.toFixed(0)})`,
                    speed_reduction: z.speed_reduction,
                    peak_decel: Math.abs(z.peak_decel_g),
                    color: `#${d.team_color}`,
                });
            });
        });

        // Group by driver for comparison
        const traces = data.map(d => {
            const zones = d.braking_zones.slice(0, 6);
            return {
                type: 'bar',
                name: d.driver,
                x: zones.map((z, i) => `Zone ${i + 1}`),
                y: zones.map(z => z.speed_reduction),
                marker: { color: `#${d.team_color}`, opacity: 0.85 },
                hovertemplate: zones.map(z =>
                    `<b>${d.driver}</b><br>Entry: ${z.entry_speed.toFixed(0)} km/h<br>Exit: ${z.exit_speed.toFixed(0)} km/h<br>Δ Speed: ${z.speed_reduction.toFixed(1)} km/h<br>Peak: ${Math.abs(z.peak_decel_g).toFixed(2)}G<extra></extra>`
                ),
            };
        });

        return (
            <Plot
                data={traces}
                layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#94a3b8', size: 10 },
                    margin: { l: 60, r: 20, t: 20, b: 50 },
                    barmode: 'group',
                    xaxis: {
                        title: { text: 'Braking Zone', font: { size: 11 } },
                        gridcolor: '#1e293b',
                    },
                    yaxis: {
                        title: { text: 'Speed Reduction (km/h)', font: { size: 11 } },
                        gridcolor: '#1e293b',
                        zeroline: false,
                    },
                    legend: { font: { color: '#e2e8f0', size: 10 }, bgcolor: 'transparent', orientation: 'h', y: 1.05 },
                    bargap: 0.15,
                    bargroupgap: 0.05,
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
            />
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#0b0d10]">
            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2b2e36]">
                <button
                    onClick={() => setTab('scatter')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${tab === 'scatter' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    G-Force Scatter Plot
                </button>
                <button
                    onClick={() => setTab('zones')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${tab === 'zones' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    Braking Zone Comparison
                </button>

                {/* Stats Summary */}
                <div className="ml-auto flex gap-4 text-[10px] text-gray-500 font-mono">
                    {data.slice(0, 3).map(d => (
                        <span key={d.driver}>
                            <span className="font-bold" style={{ color: `#${d.team_color}` }}>{d.driver}</span>
                            {' '}Brk:{Math.abs(d.max_braking_g).toFixed(1)}G Acc:{d.max_accel_g.toFixed(1)}G
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {tab === 'scatter' ? renderScatter() : renderZones()}
            </div>
        </div>
    );
};

export default BrakeAccelPerformance;
