import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const LapTimeBoxPlot = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [laps, setLaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            setLaps([]);
            return;
        }

        const fetchLaps = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/laps`, {
                    params: {
                        year, round, session_type: sessionType,
                        drivers: selectedDrivers.join(',')
                    }
                });
                setLaps(res.data.laps || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch lap data.");
            } finally {
                setLoading(false);
            }
        };

        fetchLaps();
    }, [year, round, sessionType, selectedDrivers.join(',')]);

    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Please select drivers.</div>;
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Processing lap distributions...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;

    const traces = selectedDrivers.map((driver) => {
        const drvLaps = laps.filter(l => l.driver === driver && l.lap_time_sec);
        
        let color = '#3b82f6';
        if (allDrivers) {
            const drvInfo = allDrivers.find(d => d.abbreviation === driver);
            if (drvInfo && drvInfo.team_color) {
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }

        return {
            y: drvLaps.map(l => l.lap_time_sec),
            type: 'box',
            name: driver,
            marker: { color: color },
            boxpoints: 'outliers', // only show outlier points
            line: { width: 2 }
        };
    });

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 50, r: 20, t: 30, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: false,
                xaxis: { 
                    showgrid: false, zeroline: false, tickfont: { color: '#e2e8f0', size: 12, weight: 'bold' }
                },
                yaxis: { 
                    title: { text: "Lap Time (Seconds)", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' }
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default LapTimeBoxPlot;
