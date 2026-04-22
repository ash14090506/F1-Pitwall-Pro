import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

export default function HistoricalTrackMap({ year, round }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/historical_track_map?year=${year}&round=${round}`);
                setData(res.data);
            } catch (err) {
                setError("Error fetching historical track map data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, round]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="mb-4">Fetching up to 4 years of telemetry...</div>
            <div className="text-xs text-gray-500">FastF1 may take a minute to download new sessions to cache.</div>
        </div>
    );
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;
    if (!data || !data.track_map) return null;

    const mapTrace = {
        x: data.track_map.x,
        y: data.track_map.y,
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'white', width: 2 },
        marker: {
            color: data.track_map.speed,
            colorscale: 'Jet',
            size: 6,
            showscale: true,
            colorbar: {
                title: 'Speed (km/h)',
                thickness: 15,
                tickfont: { color: '#94a3b8' },
                titlefont: { color: '#94a3b8' }
            }
        },
        hoverinfo: 'text',
        text: data.track_map.speed.map(s => `Speed: ${s} km/h`)
    };

    const distKm = data.track_map.distance.map(d => d / 1000);
    const elevationTrace = {
        x: distKm,
        y: data.track_map.z,
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',
        line: { color: '#3b82f6', width: 2 },
        fillcolor: 'rgba(59, 130, 246, 0.2)',
        hovertemplate: 'Dist: %{x:.2f}km<br>Elev: %{y:.1f}m<extra></extra>'
    };

    const yearlyData = data.yearly_stats || [];
    const top3Data = data.top3_drivers || [];

    // Sum totals
    const totals = { yellow: 0, d_yellow: 0, red: 0, safety: 0, pos: 0 };
    yearlyData.forEach(y => {
        totals.yellow += y.yellow;
        totals.d_yellow += y.d_yellow;
        totals.red += y.red;
        totals.safety += y.safety;
        totals.pos += y.position_changes;
    });

    return (
        <div className="flex h-full w-full bg-[#0b0d10] text-[#e2e8f0] overflow-hidden">
            {/* Left Panel: Charts */}
            <div className="flex-[2] flex flex-col p-4 space-y-4 overflow-y-auto">
                <div className="bg-[#16181d] rounded-lg border border-[#2b2e36] p-2 flex-1 relative min-h-[350px]">
                    <div className="absolute top-2 left-2 px-3 py-1 bg-[#1b1d24] text-xs font-semibold rounded border border-[#2b2e36] text-gray-300 z-10">
                        Historical Track Map
                    </div>
                    <Plot
                        data={[mapTrace]}
                        layout={{
                            autosize: true,
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            margin: { l: 20, r: 20, t: 20, b: 20 },
                            xaxis: { showgrid: false, zeroline: false, showticklabels: false },
                            yaxis: { showgrid: false, zeroline: false, showticklabels: false, scaleanchor: "x", scaleratio: 1 },
                        }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false }}
                    />
                </div>
                
                <div className="bg-[#16181d] rounded-lg border border-[#2b2e36] p-2 h-[220px] relative">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-300 z-10">
                        Circuit - Elevation Change: {data.total_elevation.toFixed(1)}m
                    </div>
                    <Plot
                        data={[elevationTrace]}
                        layout={{
                            autosize: true,
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            margin: { l: 40, r: 20, t: 30, b: 30 },
                            xaxis: { 
                                title: 'Track Distance (km)', 
                                color: '#64748b',
                                gridcolor: '#1e293b',
                                tickfont: { size: 10 }
                            },
                            yaxis: { 
                                title: 'Elevation (m)', 
                                color: '#64748b',
                                gridcolor: '#1e293b',
                                tickfont: { size: 10 }
                            },
                        }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false }}
                    />
                </div>
            </div>

            {/* Right Panel: Stats Tables */}
            <div className="flex-1 bg-[#12141a] border-l border-[#2b2e36] p-4 flex flex-col overflow-y-auto">
                <div className="text-center font-bold text-gray-200 mb-6 bg-[#1b1d24] py-2 border border-[#2b2e36] rounded">
                    Yearly Flags Statistics (2022-2025)
                </div>

                <div className="text-xs font-semibold text-gray-400 mb-2">Yearly Statistics</div>
                <table className="w-full text-center text-xs mb-6 border-collapse">
                    <thead>
                        <tr className="bg-[#1b1d24] border border-[#2b2e36] text-gray-400">
                            <th className="p-1 border border-[#2b2e36]">Year</th>
                            <th className="p-1 border border-[#2b2e36]">Yellow</th>
                            <th className="p-1 border border-[#2b2e36]">D-Yellow</th>
                            <th className="p-1 border border-[#2b2e36]">Red</th>
                            <th className="p-1 border border-[#2b2e36]">Safety</th>
                            <th className="p-1 border border-[#2b2e36]">Pos Δ</th>
                            <th className="p-1 border border-[#2b2e36]">Max Spd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yearlyData.map((row, idx) => (
                            <tr key={idx} className="border border-[#2b2e36] bg-[#0b0d10]">
                                <td className="p-1.5 border border-[#2b2e36]">{row.year}</td>
                                <td className={`p-1.5 border border-[#2b2e36] ${row.yellow > 0 ? 'bg-yellow-900/30 text-yellow-300' : ''}`}>{row.yellow}</td>
                                <td className={`p-1.5 border border-[#2b2e36] ${row.d_yellow > 0 ? 'bg-yellow-700/50 text-yellow-300' : ''}`}>{row.d_yellow}</td>
                                <td className={`p-1.5 border border-[#2b2e36] ${row.red > 0 ? 'bg-red-900/30 text-red-400' : ''}`}>{row.red}</td>
                                <td className={`p-1.5 border border-[#2b2e36] ${row.safety > 0 ? 'bg-purple-900/30 text-purple-300' : ''}`}>{row.safety}</td>
                                <td className={`p-1.5 border border-[#2b2e36] ${row.position_changes > 0 ? 'bg-green-900/20 text-green-400' : ''}`}>{row.position_changes}</td>
                                <td className="p-1.5 border border-[#2b2e36] text-blue-300">{row.max_speed || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="text-xs font-semibold text-gray-400 mb-2">Total (2022-2025)</div>
                <table className="w-full text-center text-xs mb-6 border-collapse">
                    <thead>
                        <tr className="bg-[#1b1d24] border border-[#2b2e36] text-gray-400">
                            <th className="p-1 border border-[#2b2e36]">Type</th>
                            <th className="p-1 border border-[#2b2e36] bg-yellow-900/40 text-yellow-400">Yellow</th>
                            <th className="p-1 border border-[#2b2e36] bg-yellow-700/60 text-yellow-300">D.Yellow</th>
                            <th className="p-1 border border-[#2b2e36] bg-red-900/40 text-red-400">Red</th>
                            <th className="p-1 border border-[#2b2e36] bg-purple-900/40 text-purple-400">Safety</th>
                            <th className="p-1 border border-[#2b2e36] bg-green-900/30 text-green-400">Position Δ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-[#0b0d10]">
                            <td className="p-1.5 border border-[#2b2e36] font-semibold text-gray-300">Total</td>
                            <td className="p-1.5 border border-[#2b2e36]">{totals.yellow}</td>
                            <td className="p-1.5 border border-[#2b2e36]">{totals.d_yellow}</td>
                            <td className="p-1.5 border border-[#2b2e36]">{totals.red}</td>
                            <td className="p-1.5 border border-[#2b2e36]">{totals.safety}</td>
                            <td className="p-1.5 border border-[#2b2e36]">{totals.pos}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="text-xs font-semibold text-gray-400 mb-2">Race Top 3 Drivers (2022-2025)</div>
                <table className="w-full text-center text-xs mb-6 border-collapse">
                    <thead>
                        <tr className="bg-[#1b1d24] border border-[#2b2e36] text-gray-400">
                            <th className="p-1 border border-[#2b2e36]">Year</th>
                            <th className="p-1 border border-[#2b2e36]">P1</th>
                            <th className="p-1 border border-[#2b2e36]">P2</th>
                            <th className="p-1 border border-[#2b2e36]">P3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top3Data.map((row, idx) => (
                            <tr key={idx} className="bg-[#0b0d10]">
                                <td className="p-1.5 border border-[#2b2e36] text-gray-300 font-semibold">{row.year}</td>
                                {[row.p1, row.p2, row.p3].map((drv, i) => (
                                    <td key={i} className="p-0 border border-[#2b2e36]">
                                        {drv ? (
                                            <div className="py-1 flex flex-col items-center justify-center font-bold text-white w-full h-full" style={{ backgroundColor: `#${drv.color}cc` }}>
                                                <span>{drv.name}</span>
                                                <span className="text-[10px] opacity-80 font-normal">({drv.time})</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
