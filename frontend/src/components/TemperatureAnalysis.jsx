import React, { useState, useEffect } from 'react';
import ReactPlot from 'react-plotly.js';
import axios from 'axios';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const TemperatureAnalysis = ({ year, round, sessionType }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/weather?year=${year}&round=${round}&session_type=${sessionType}`);
                setWeatherData(res.data);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError("Failed to fetch weather data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [year, round, sessionType]);

    if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse">LOADING WEATHER DATA...</div>;
    if (error) return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs">{error}</div>;
    if (!weatherData) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs hover:text-white">NO DATA AVAILABLE YET</div>;

    const traces = [
        {
            x: weatherData.time,
            y: weatherData.track_temp,
            type: 'scatter',
            mode: 'lines',
            name: 'Track Temp (°C)',
            line: { color: '#ef4444', width: 2 },
            yaxis: 'y1'
        },
        {
            x: weatherData.time,
            y: weatherData.air_temp,
            type: 'scatter',
            mode: 'lines',
            name: 'Air Temp (°C)',
            line: { color: '#3b82f6', width: 2 },
            yaxis: 'y1'
        },
        {
            x: weatherData.time,
            y: weatherData.humidity,
            type: 'scatter',
            mode: 'lines',
            name: 'Humidity (%)',
            line: { color: '#10b981', width: 2, dash: 'dot' },
            yaxis: 'y2'
        },
        {
            x: weatherData.time,
            y: weatherData.rainfall,
            type: 'scatter',
            mode: 'lines',
            name: 'Rainfall',
            line: { color: '#8b5cf6', width: 2, dash: 'dash' },
            yaxis: 'y2'
        }
    ];

    return (
        <div className="h-full w-full bg-[#0b0d10] relative font-sans">
            <Plot
                data={traces}
                layout={{
                    autosize: true,
                    margin: { l: 40, r: 40, t: 30, b: 30 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    showlegend: true,
                    legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                    hovermode: 'x unified',
                    hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0' } },
                    xaxis: { 
                        title: { text: "Time (s)", font: { size: 10, color: '#64748b' } },
                        showgrid: true, gridcolor: '#2b2e36', tickfont: { color: '#64748b' }
                    },
                    yaxis: { 
                        title: { text: "Temperature (°C)", font: { size: 10, color: '#64748b' } },
                        showgrid: true, gridcolor: '#2b2e36', tickfont: { color: '#64748b' },
                        side: 'left'
                    },
                    yaxis2: {
                        title: { text: "Humidity (%) / Rain", font: { size: 10, color: '#64748b' } },
                        showgrid: false, tickfont: { color: '#64748b' },
                        side: 'right',
                        overlaying: 'y'
                    }
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};

export default TemperatureAnalysis;
