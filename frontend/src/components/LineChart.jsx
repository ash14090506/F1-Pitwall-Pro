import React from 'react';
import ReactPlot from 'react-plotly.js';

// Safely extract the default export due to Vite/CommonJS interop quirks with react-plotly.js
const Plot = ReactPlot.default || ReactPlot;

const LineChart = ({ title, dataKey, yLabel, telemetryData, maxVal, allDrivers, playbackIndex, fixedXMax, hoverDistance, onHoverChange }) => {
    // If no data, render skeleton
    if (!telemetryData || telemetryData.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Waiting for telemetry...</div>;
    }

    const key = dataKey || title.toLowerCase();
    const fallbackColors = ['#00D2BE', '#0000FF', '#FF0000', '#FFA500', '#00FF00', '#FF00FF'];
    
    const usedColors = {};

    const traces = telemetryData.map((data, index) => {
        const { telemetry, driver } = data;
        let color = fallbackColors[index % fallbackColors.length];
        
        if (allDrivers) {
            const drvInfo = allDrivers.find(d => d.abbreviation === driver);
            if (drvInfo && drvInfo.team_color) {
                // team_color from fastf1 is often a hex string without hash
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }
        
        // Visually differentiate teammates (who share the same color)
        let dashStyle = 'solid';
        if (usedColors[color]) {
            dashStyle = usedColors[color] === 1 ? 'dash' : 'dot';
            usedColors[color]++;
        } else {
            usedColors[color] = 1;
        }

        return {
            x: telemetry.distance.slice(0, playbackIndex !== undefined ? playbackIndex + 1 : undefined),
            y: telemetry[key].slice(0, playbackIndex !== undefined ? playbackIndex + 1 : undefined),
            type: 'scatter',
            mode: 'lines',
            name: driver,
            line: { color: color, width: 2, dash: dashStyle },
            hovertemplate: '%{x}m<br>%{y}'
        };
    });

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 40, r: 10, t: 10, b: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: true,
                legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                hovermode: 'x unified',
                hoverlabel: {
                    bgcolor: '#16181d',
                    bordercolor: '#2b2e36',
                    font: { color: '#e2e8f0', size: 12 }
                },
                xaxis: { 
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' },
                    spikemode: 'across', spikethickness: 1, spikecolor: '#94a3b8',
                    range: fixedXMax ? [0, fixedXMax] : undefined
                },
                yaxis: { 
                    title: { text: yLabel, font: { size: 10, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' },
                    range: maxVal ? [0, maxVal] : undefined
                },
                shapes: hoverDistance !== undefined && hoverDistance !== null ? [
                    {
                        type: 'line',
                        x0: hoverDistance,
                        x1: hoverDistance,
                        y0: 0,
                        y1: 1,
                        yref: 'paper',
                        line: {
                            color: 'rgba(239, 68, 68, 0.8)',
                            width: 1,
                            dash: 'dash'
                        }
                    }
                ] : []
            }}
            onHover={(e) => {
                if (e.points && e.points.length > 0 && onHoverChange) {
                    onHoverChange(e.points[0].x);
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default LineChart;
