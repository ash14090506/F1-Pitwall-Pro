import React from 'react';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;

const AccelerationChart = ({ telemetryData, allDrivers }) => {
    if (!telemetryData || telemetryData.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Waiting for telemetry...</div>;
    }

    const fallbackColors = ['#00D2BE', '#0000FF', '#FF0000', '#FFA500', '#00FF00', '#FF00FF'];
    
    // Process traces for G-G diagram (Lat vs Lon Accel)
    const traces = telemetryData.map((data, index) => {
        const { telemetry, driver } = data;
        let color = fallbackColors[index % fallbackColors.length];
        
        if (allDrivers) {
            const drvInfo = allDrivers.find(d => d.abbreviation === driver);
            if (drvInfo && drvInfo.team_color) {
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }
        
        return {
            x: telemetry.lat_accel,
            y: telemetry.lon_accel,
            type: 'scatter',
            mode: 'markers',
            name: driver,
            marker: { color: color, size: 4, opacity: 0.6 },
            hovertemplate: 'Lat(G): %{x:.2f}<br>Lon(G): %{y:.2f}'
        };
    });

    return (
        <Plot
            data={traces}
            layout={{
                autosize: true,
                margin: { l: 40, r: 10, t: 10, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: true,
                legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
                hovermode: 'closest',
                hoverlabel: {
                    bgcolor: '#16181d',
                    bordercolor: '#2b2e36',
                    font: { color: '#e2e8f0', size: 12 }
                },
                xaxis: { 
                    title: { text: "Lateral Accel (G)", font: { size: 10, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: true, zerolinecolor: '#475569', tickfont: { color: '#64748b' },
                    range: [-6, 6]
                },
                yaxis: { 
                    title: { text: "Longitudinal Accel (G)", font: { size: 10, color: '#64748b' } },
                    showgrid: true, gridcolor: '#2b2e36', zeroline: true, zerolinecolor: '#475569', tickfont: { color: '#64748b' },
                    range: [-6, 3]
                }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false, responsive: true }}
        />
    );
};

export default AccelerationChart;
