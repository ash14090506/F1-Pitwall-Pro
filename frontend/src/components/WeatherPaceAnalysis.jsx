import React, { useState, useEffect, useMemo } from 'react';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const compoundColors = {
    'SOFT': '#e10600',
    'MEDIUM': '#eeb310',
    'HARD': '#ffffff',
    'INTERMEDIATE': '#43b02a',
    'WET': '#0062ff',
    'UNKNOWN': '#888888'
};

const formatLapTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const WeatherPaceAnalysis = ({ year, round, sessionType }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState("ALL"); // ALL or specific driver abbreviation

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/weather_pace?year=${year}&round=${round}&session_type=${sessionType}`);
                if (!res.ok) {
                    throw new Error(`Failed to load weather pace data: ${res.statusText}`);
                }
                const json = await res.json();
                setData(json.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, round, sessionType]);

    // Extract unique drivers for the dropdown
    const availableDrivers = useMemo(() => {
        const drivers = [...new Set(data.map(d => d.driver))];
        return drivers.sort();
    }, [data]);

    // Process data for the chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const filteredData = selectedFilter === "ALL" 
            ? data 
            : data.filter(d => d.driver === selectedFilter);

        const compounds = [...new Set(filteredData.map(d => d.compound))];
        const traces = [];

        compounds.forEach(compound => {
            const compoundData = filteredData.filter(d => d.compound === compound);
            
            traces.push({
                x: compoundData.map(d => d.track_temp),
                y: compoundData.map(d => d.lap_time),
                text: compoundData.map(d => `Driver: <b>${d.driver}</b><br>Lap: ${d.lap_number}<br>Time: ${formatLapTime(d.lap_time)}<br>Track Temp: ${d.track_temp.toFixed(1)}°C`),
                type: 'scatter',
                mode: 'markers',
                name: compound,
                marker: {
                    color: compoundColors[compound] || compoundColors['UNKNOWN'],
                    size: 8,
                    line: {
                        color: compoundData.map(d => `#${d.team_color}`),
                        width: selectedFilter === "ALL" ? 1 : 2
                    },
                    opacity: 0.8
                },
                hoverinfo: 'text'
            });
        });

        // Add trendlines
        compounds.forEach(compound => {
            const compoundData = filteredData.filter(d => d.compound === compound);
            if (compoundData.length > 3) {
                // Simple linear regression to show trend
                const n = compoundData.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                
                compoundData.forEach(d => {
                    sumX += d.track_temp;
                    sumY += d.lap_time;
                    sumXY += d.track_temp * d.lap_time;
                    sumX2 += d.track_temp * d.track_temp;
                });
                
                const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;
                
                const minX = Math.min(...compoundData.map(d => d.track_temp));
                const maxX = Math.max(...compoundData.map(d => d.track_temp));
                
                traces.push({
                    x: [minX, maxX],
                    y: [slope * minX + intercept, slope * maxX + intercept],
                    type: 'scatter',
                    mode: 'lines',
                    name: `${compound} Trend`,
                    line: {
                        color: compoundColors[compound] || compoundColors['UNKNOWN'],
                        dash: 'dot',
                        width: 2
                    },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
        });

        return traces;
    }, [data, selectedFilter]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0d10] gap-4 h-full">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
                </div>
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest animate-pulse">Correlating Pace & Weather...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500 bg-[#0b0d10]">
                <div className="text-lg font-bold mb-2">Analysis Failed</div>
                <div className="text-sm text-gray-400">{error}</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#0b0d10]">
                <div className="text-sm font-bold">No quicklaps found for this session.</div>
            </div>
        );
    }

    // Determine Y-axis range to filter out extreme outliers if necessary, but Plotly auto-range handles it decently.
    // However, it's better to reverse the Y-axis so faster times (lower seconds) are at the top.
    
    return (
        <div className="flex flex-col h-full bg-[#0b0d10] font-sans">
            <div className="flex items-center justify-between p-4 border-b border-[#2b2e36] bg-[#16181d]">
                <div>
                    <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Weather-Correlated Pace Analysis</h2>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Pace vs Track Temperature Operating Windows</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-400 uppercase">Driver Filter:</label>
                    <select 
                        className="bg-[#0b0d10] border border-[#2b2e36] text-white text-xs font-bold px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                    >
                        <option value="ALL">All Drivers (Macro View)</option>
                        {availableDrivers.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex-1 p-4">
                <Plot
                    data={chartData}
                    layout={{
                        autosize: true,
                        margin: { l: 60, r: 40, t: 20, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        showlegend: true,
                        legend: { 
                            orientation: 'h', 
                            y: 1.05, 
                            x: 0.5, 
                            xanchor: 'center', 
                            font: { color: '#e2e8f0', size: 12 } 
                        },
                        xaxis: { 
                            title: { text: "Track Temperature (°C)", font: { size: 12, color: '#64748b', weight: 'bold' } },
                            showgrid: true, 
                            gridcolor: '#2b2e36', 
                            tickfont: { color: '#e2e8f0' },
                            zeroline: false
                        },
                        yaxis: { 
                            title: { text: "Lap Time (Seconds)", font: { size: 12, color: '#64748b', weight: 'bold' } },
                            showgrid: true, 
                            gridcolor: '#2b2e36', 
                            tickfont: { color: '#e2e8f0' },
                            autorange: 'reversed', // Faster laps at the top
                            zeroline: false
                        },
                        hovermode: 'closest',
                        hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0' } }
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false, responsive: true }}
                />
            </div>
        </div>
    );
};

export default WeatherPaceAnalysis;
