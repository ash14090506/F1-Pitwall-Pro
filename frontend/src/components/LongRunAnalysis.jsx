import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const LongRunAnalysis = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [longRunData, setLongRunData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            setLongRunData([]);
            return;
        }

        const fetchLongRuns = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/telemetry/long_run`, {
                    params: {
                        year, round, session_type: sessionType,
                        drivers: selectedDrivers.join(',')
                    }
                });
                setLongRunData(res.data.long_runs || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch long run algorithm data.");
            } finally {
                setLoading(false);
            }
        };

        fetchLongRuns();
    }, [year, round, sessionType, selectedDrivers.join(',')]);

    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Please select drivers.</div>;
    }

    if (sessionType !== 'FP2' && sessionType !== 'FP1' && sessionType !== 'FP3' && sessionType !== 'R') {
        return <div className="flex h-full items-center justify-center text-gray-500">Long Run Analysis is best used on Practice Sessions or the Race.</div>;
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Calculating fuel-burn weight offsets...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;

    const traces = [];
    longRunData.forEach((data) => {
        const { driver, laps } = data;
        let color = '#3b82f6';
        
        if (allDrivers) {
            const drvInfo = allDrivers.find(d => d.abbreviation === driver);
            if (drvInfo && drvInfo.team_color) {
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }
        
        // Raw lap time (dotted)
        traces.push({
            x: laps.map(l => l.lap_number),
            y: laps.map(l => l.raw_time),
            type: 'scatter',
            mode: 'lines+markers',
            name: `${driver} (Raw)`,
            marker: { color: color, size: 4 },
            line: { color: color, width: 1, dash: 'dot' },
        });

        // Fuel corrected lap time (solid)
        traces.push({
            x: laps.map(l => l.lap_number),
            y: laps.map(l => l.corrected_time),
            type: 'scatter',
            mode: 'lines+markers',
            name: `${driver} (Tire Deg)`,
            marker: { color: color, size: 6 },
            line: { color: color, width: 2, shape: 'spline' },
        });
    });

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 50, r: 20, t: 30, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: true,
                legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                xaxis: { 
                    title: { text: "Lap Number", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#e2e8f0', size: 10 }
                },
                yaxis: { 
                    title: { text: "Lap Time (Seconds)", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: true, zerolinecolor: '#475569', tickfont: { color: '#64748b' }
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default LongRunAnalysis;
