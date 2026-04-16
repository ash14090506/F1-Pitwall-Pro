import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const ThrottleCornerAnalysis = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [cornerData, setCornerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            setCornerData([]);
            return;
        }

        const fetchCorners = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/telemetry/corners`, {
                    params: {
                        year, round, session_type: sessionType,
                        drivers: selectedDrivers.join(',')
                    }
                });
                setCornerData(res.data.corner_throttle || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch corner algorithm data.");
            } finally {
                setLoading(false);
            }
        };

        fetchCorners();
    }, [year, round, sessionType, selectedDrivers.join(',')]);

    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Please select drivers.</div>;
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Mapping track topology heuristically...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;

    const traces = cornerData.map((data, index) => {
        const { driver, corners } = data;
        let color = '#3b82f6';
        
        if (allDrivers) {
            const drvInfo = allDrivers.find(d => d.abbreviation === driver);
            if (drvInfo && drvInfo.team_color) {
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }
        
        return {
            x: corners.map((_, i) => `Corner ${i+1}`),
            y: corners.map(c => c.avg_throttle),
            type: 'scatter',
            mode: 'lines+markers',
            name: driver,
            marker: { color: color, size: 8 },
            line: { color: color, width: 2, shape: 'spline' },
            hovertemplate: '<b>%{x}</b><br>Avg Throttle: %{y:.1f}%<br>Min Speed: %{customdata:.0f} km/h',
            customdata: corners.map(c => c.min_speed)
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
                showlegend: true,
                legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                xaxis: { 
                    title: { text: "Detected Low-Speed Corners", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#e2e8f0', size: 10 }
                },
                yaxis: { 
                    title: { text: "Avg Throttle Application (%)", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' },
                    range: [0, 105]
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default ThrottleCornerAnalysis;
