import React, { useMemo } from 'react';
import ReactPlot from 'react-plotly.js';
import { useFetch } from '../hooks/useFetch';

const Plot = ReactPlot.default || ReactPlot;

const TemperatureAnalysis = ({ year, round, sessionType }) => {
    const endpoint = `/weather?year=${year}&round=${round}&session_type=${sessionType}`;
    const { data: weatherData, loading, error } = useFetch(endpoint, [year, round, sessionType]);

    if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse">LOADING WEATHER DATA...</div>;
    if (error) return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs">{error}</div>;
    if (!weatherData) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs hover:text-white">NO DATA AVAILABLE YET</div>;

    const traces = useMemo(() => [
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
    ], [weatherData]);

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
