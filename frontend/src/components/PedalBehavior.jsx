import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const PedalBehavior = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [pedalData, setPedalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            setPedalData([]);
            return;
        }

        const fetchBehavior = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/telemetry/pedal_behavior`, {
                    params: {
                        year, round, session_type: sessionType,
                        drivers: selectedDrivers.join(',')
                    }
                });
                setPedalData(res.data.pedal_behavior || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch pedal behavior algorithms.");
            } finally {
                setLoading(false);
            }
        };

        fetchBehavior();
    }, [year, round, sessionType, selectedDrivers.join(',')]);

    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Please select drivers.</div>;
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Aggregating telemetry...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;

    const driversSorted = pedalData.map(d => d.driver);
    const throttleOnly = pedalData.map(d => d.throttle_only);
    const brakeOnly = pedalData.map(d => d.brake_only);
    const trailBraking = pedalData.map(d => d.trail_braking);
    const coasting = pedalData.map(d => d.coasting);

    const traces = [
        {
            x: driversSorted,
            y: throttleOnly,
            name: 'Throttle Only',
            type: 'bar',
            marker: { color: '#22c55e' } // Green
        },
        {
            x: driversSorted,
            y: brakeOnly,
            name: 'Brake Only',
            type: 'bar',
            marker: { color: '#ef4444' } // Red
        },
        {
            x: driversSorted,
            y: trailBraking,
            name: 'Trail Braking',
            type: 'bar',
            marker: { color: '#f59e0b' } // Orange
        },
        {
            x: driversSorted,
            y: coasting,
            name: 'Coasting (Off Pedal)',
            type: 'bar',
            marker: { color: '#94a3b8' } // Gray
        }
    ];

    return (
        <Plot
            data={traces}
            layout={{
                barmode: 'stack',
                autosize: true,
                margin: { l: 50, r: 20, t: 30, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: true,
                legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                xaxis: { 
                    showgrid: false, zeroline: false, tickfont: { color: '#e2e8f0', size: 12, weight: 'bold' }
                },
                yaxis: { 
                    title: { text: "% of Lap Time", font: { size: 12, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' },
                    range: [0, 100]
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default PedalBehavior;
