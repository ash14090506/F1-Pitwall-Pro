import React, { useState, useEffect } from 'react';
import ReactPlot from 'react-plotly.js';
import axios from 'axios';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const TrackMap = ({ telemetryData, playbackIndex, allDrivers, year, round, sessionType }) => {
    const [circuitInfo, setCircuitInfo] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        const fetchCircuit = async () => {
            try {
                const res = await axios.get(`${API_BASE}/circuit_info?year=${year}&round=${round}&session_type=${sessionType}`);
                setCircuitInfo(res.data);
            } catch (err) {
                console.error("No circuit info available for overlay", err);
            }
        };
        fetchCircuit();
    }, [year, round, sessionType]);

    if (!telemetryData || telemetryData.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs tracking-widest uppercase">Waiting for telemetry...</div>;
    }

    const firstValidTelemetry = telemetryData.find(d => d.telemetry && d.telemetry.x && d.telemetry.y);

    if (!firstValidTelemetry) {
        return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold tracking-widest text-xs">X/Y Geometry not available for this session</div>;
    }

    // Filter out None values in case X/Y aren't fully available
    const baseX = firstValidTelemetry.telemetry.x.filter(v => v !== null);
    const baseY = firstValidTelemetry.telemetry.y.filter(v => v !== null);

    if (baseX.length === 0 || baseY.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold tracking-widest text-xs">X/Y Geometry not available for this session</div>;
    }

    const traces = [];
    
    // Background circuit path trace
    traces.push({
        x: baseX,
        y: baseY,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#334155', width: 6 }, // Faint Slate color for the full track
        hoverinfo: 'none',
        name: 'Circuit Overview',
        showlegend: false
    });

    const fallbackColors = ['#00D2BE', '#0000FF', '#FF0000', '#FFA500', '#00FF00', '#FF00FF'];

    // Dynamic Markers based on playback interval
    if (playbackIndex !== undefined) {
        telemetryData.forEach((data, index) => {
            const { telemetry, driver } = data;
            if (!telemetry.x || !telemetry.y || playbackIndex >= telemetry.x.length) return;

            let color = fallbackColors[index % fallbackColors.length];
            if (allDrivers) {
                const drvInfo = allDrivers.find(d => d.abbreviation === driver);
                if (drvInfo && drvInfo.team_color) {
                    color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
                }
            }

            // Draw a trailing tail (last 10 positions)
            const tailLen = 15;
            const startIdx = Math.max(0, playbackIndex - tailLen);
            traces.push({
                x: telemetry.x.slice(startIdx, playbackIndex + 1),
                y: telemetry.y.slice(startIdx, playbackIndex + 1),
                type: 'scatter',
                mode: 'lines+markers',
                name: driver,
                line: { color: color, width: 2 },
                marker: { 
                     color: color, 
                     size: [ ...Array(Math.max(1, playbackIndex - startIdx + 1)).fill(0).slice(0, -1), 12 ], // Dot on last position
                     line: { color: '#ffffff', width: 2 } 
                },
                hovertemplate: `<span style="font-weight:900">${driver}</span><br>GPS X: %{x:.0f}<br>GPS Y: %{y:.0f}<extra></extra>`
            });
        });
    }

    // Overlay Circuit Data (Corners)
    if (circuitInfo && circuitInfo.corners && circuitInfo.corners.length > 0) {
        const cX = circuitInfo.corners.map(c => c.x);
        const cY = circuitInfo.corners.map(c => c.y);
        const labels = circuitInfo.corners.map(c => c.letter ? `${c.number}${c.letter}` : c.number);
        
        traces.push({
            x: cX,
            y: cY,
            type: 'scatter',
            mode: 'text',
            text: labels,
            textposition: 'top center',
            textfont: {
                family: 'monospace',
                size: 14,
                color: '#e2e8f0', // Bright white-slate
                weight: 'bold'
            },
            name: 'Corners',
            hoverinfo: 'none',
            showlegend: false
        });
    }

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 20, r: 20, t: 20, b: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: false,
                xaxis: { 
                    visible: false,
                    scaleanchor: 'y',
                    scaleratio: 1,
                    showgrid: false
                },
                yaxis: { 
                    visible: false,
                    showgrid: false
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default TrackMap;
