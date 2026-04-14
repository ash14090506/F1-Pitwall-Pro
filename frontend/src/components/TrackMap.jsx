import React from 'react';
import ReactPlot from 'react-plotly.js';

// Safely extract the default export due to Vite/CommonJS interop quirks with react-plotly.js
const Plot = ReactPlot.default || ReactPlot;

const TrackMap = ({ telemetryData, playbackIndex, allDrivers }) => {
    if (!telemetryData || telemetryData.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Waiting for telemetry...</div>;
    }

    const firstValidTelemetry = telemetryData.find(d => d.telemetry && d.telemetry.x && d.telemetry.y);

    if (!firstValidTelemetry) {
        return <div className="w-full h-full flex items-center justify-center text-red-500 text-xs">X/Y Geometry not available for this session</div>;
    }

    // Filter out None values in case X/Y aren't fully available
    const baseX = firstValidTelemetry.telemetry.x.filter(v => v !== null);
    const baseY = firstValidTelemetry.telemetry.y.filter(v => v !== null);

    if (baseX.length === 0 || baseY.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-red-500 text-xs">X/Y Geometry not available for this session</div>;
    }

    const traces = [];
    
    // Background circuit path trace
    traces.push({
        x: baseX,
        y: baseY,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#334155', width: 4 }, // Faint Slate color for the full track
        hoverinfo: 'none',
        name: 'Circuit',
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
                     size: [ ...Array(playbackIndex - startIdx).fill(0), 10 ], // Only show marker dot on the very last position
                     line: { color: '#ffffff', width: 1 } 
                },
                hovertemplate: `${driver}<br>X: %{x:.0f}<br>Y: %{y:.0f}<extra></extra>`
            });
        });
    }

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 10, r: 10, t: 10, b: 10 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: false,
                xaxis: { 
                    visible: false,
                    scaleanchor: 'y',
                    scaleratio: 1
                },
                yaxis: { 
                    visible: false
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default TrackMap;
