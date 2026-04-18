import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const API_BASE = 'http://127.0.0.1:8001/api';

const CATEGORY_COLORS = {
    Low: '#ef4444',
    Medium: '#f59e0b',
    High: '#22c55e',
};

const CornerClassification = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('chart'); // 'chart' or 'table'

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        const drvStr = selectedDrivers?.length > 0
            ? selectedDrivers.join(',')
            : allDrivers?.slice(0, 5).map(d => d.abbreviation).join(',');
        if (!drvStr) return;

        setLoading(true);
        setError(null);
        axios.get(`${API_BASE}/corner_classification?year=${year}&round=${round}&session_type=${sessionType}&drivers=${drvStr}`)
            .then(res => { setData(res.data); setLoading(false); })
            .catch(err => { setError(err.response?.data?.detail || 'Failed to load corner data'); setLoading(false); });
    }, [year, round, sessionType, selectedDrivers, allDrivers]);

    if (loading) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Classifying corners...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;
    if (!data || !data.classification || data.classification.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No corner data available</div>;

    const categories = ['Low', 'Medium', 'High'];

    const renderChart = () => {
        const traces = data.classification.map(d => ({
            type: 'bar',
            name: d.driver,
            x: categories,
            y: [d.avg_low, d.avg_medium, d.avg_high].map(v => v || 0),
            marker: {
                color: `#${d.team_color}`,
                opacity: 0.85,
                line: { width: 1, color: `#${d.team_color}40` },
            },
            hovertemplate: categories.map((cat, i) => {
                const val = [d.avg_low, d.avg_medium, d.avg_high][i];
                return `<b>${d.driver}</b><br>${cat}-Speed Corners<br>Avg Min Speed: ${val ? val.toFixed(1) : 'N/A'} km/h<extra></extra>`;
            }),
        }));

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
                        title: { text: 'Corner Speed Category', font: { size: 11 } },
                        gridcolor: '#1e293b',
                        tickfont: { size: 12, color: '#e2e8f0' },
                    },
                    yaxis: {
                        title: { text: 'Avg. Minimum Apex Speed (km/h)', font: { size: 11 } },
                        gridcolor: '#1e293b',
                        zeroline: false,
                    },
                    legend: { font: { color: '#e2e8f0', size: 10 }, bgcolor: 'transparent', orientation: 'h', y: 1.05 },
                    bargap: 0.2,
                    bargroupgap: 0.05,
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
            />
        );
    };

    const renderTable = () => {
        // Build a corner-by-corner table for the first driver
        const firstDriver = data.classification[0];
        if (!firstDriver) return null;

        return (
            <div className="overflow-auto h-full">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-[#2b2e36] text-gray-400">
                            <th className="text-left px-3 py-2">Corner</th>
                            <th className="text-left px-3 py-2">Category</th>
                            {data.classification.map(d => (
                                <th key={d.driver} className="text-center px-3 py-2">
                                    <span style={{ color: `#${d.team_color}` }}>{d.driver}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {firstDriver.corners.map((corner, i) => (
                            <tr key={i} className="border-b border-[#1e293b] hover:bg-[#1b1d24] transition-colors">
                                <td className="px-3 py-1.5 text-gray-200 font-semibold">T{corner.corner_number}</td>
                                <td className="px-3 py-1.5">
                                    <span
                                        className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold"
                                        style={{
                                            background: CATEGORY_COLORS[corner.category] + '20',
                                            color: CATEGORY_COLORS[corner.category],
                                        }}
                                    >
                                        {corner.category}
                                    </span>
                                </td>
                                {data.classification.map(d => {
                                    const c = d.corners.find(x => x.corner_number === corner.corner_number);
                                    return (
                                        <td key={d.driver} className="text-center px-3 py-1.5 text-gray-300">
                                            {c ? `${c.min_speed.toFixed(1)}` : '–'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Category Averages Summary */}
                <div className="border-t border-[#2b2e36] mt-2 pt-3 px-3 pb-2">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Category Averages (km/h)</div>
                    <div className="grid grid-cols-3 gap-3">
                        {categories.map(cat => (
                            <div key={cat} className="bg-[#1b1d24] rounded p-2">
                                <div className="text-[10px] font-bold mb-1" style={{ color: CATEGORY_COLORS[cat] }}>
                                    {cat}-Speed Corners
                                </div>
                                {data.classification.map(d => {
                                    const val = cat === 'Low' ? d.avg_low : cat === 'Medium' ? d.avg_medium : d.avg_high;
                                    return (
                                        <div key={d.driver} className="flex justify-between text-[10px] py-0.5">
                                            <span style={{ color: `#${d.team_color}` }}>{d.driver}</span>
                                            <span className="text-gray-300 font-mono">{val ? val.toFixed(1) : '–'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#0b0d10]">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2b2e36]">
                <button
                    onClick={() => setView('chart')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${view === 'chart' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    Category Comparison
                </button>
                <button
                    onClick={() => setView('table')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-[#1b1d24] text-gray-400 hover:text-white'}`}
                >
                    Corner Detail Table
                </button>
                <span className="ml-auto text-[10px] text-gray-500 font-mono">
                    {data.corner_count} corners classified
                </span>
            </div>

            <div className="flex-1 min-h-0">
                {view === 'chart' ? renderChart() : renderTable()}
            </div>
        </div>
    );
};

export default CornerClassification;
