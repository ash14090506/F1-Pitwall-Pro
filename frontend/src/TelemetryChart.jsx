import React from 'react';
import Plot from 'react-plotly.js';

export default function TelemetryChart({ dataA, dataB }) {
  if (!dataA || !dataB) return null;

  const tA = dataA.telemetry;
  const tB = dataB.telemetry;
  
  // Custom colors for distinction
  const colorA = '#3b82f6'; // Blue
  const colorB = '#22c55e'; // Green

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#e2e8f0' },
    margin: { l: 50, r: 20, t: 30, b: 50 },
    height: 800,
    grid: { rows: 4, columns: 1, subplots: ['xy', 'xy2', 'xy3', 'xy4'], roworder: 'top to bottom' },
    showlegend: true,
    legend: { orientation: "h", y: 1.05 },
    xaxis: { title: 'Distance (m)', showgrid: true, gridcolor: '#334155' },
    yaxis: { title: 'Speed (km/h)', showgrid: true, gridcolor: '#334155' },
    yaxis2: { title: 'Throttle (%)', showgrid: true, gridcolor: '#334155' },
    yaxis3: { title: 'Brake', showgrid: true, gridcolor: '#334155' },
    yaxis4: { title: 'Gear', showgrid: true, gridcolor: '#334155', dtick: 1 },
    hovermode: 'x unified'
  };

  const getTrace = (xData, yData, name, color, yaxis) => ({
    x: xData,
    y: yData,
    type: 'scatter',
    mode: 'lines',
    name: name,
    line: { color: color, width: 2 },
    yaxis: yaxis
  });

  const plotData = [
    // Speed
    getTrace(tA.distance, tA.speed, `${dataA.driver} Speed`, colorA, 'y'),
    getTrace(tB.distance, tB.speed, `${dataB.driver} Speed`, colorB, 'y'),
    
    // Throttle
    getTrace(tA.distance, tA.throttle, `${dataA.driver} Throttle`, colorA, 'y2'),
    getTrace(tB.distance, tB.throttle, `${dataB.driver} Throttle`, colorB, 'y2'),

    // Brake
    getTrace(tA.distance, tA.brake, `${dataA.driver} Brake`, colorA, 'y3'),
    getTrace(tB.distance, tB.brake, `${dataB.driver} Brake`, colorB, 'y3'),
    
    // Gear
    getTrace(tA.distance, tA.gear, `${dataA.driver} Gear`, colorA, 'y4'),
    getTrace(tB.distance, tB.gear, `${dataB.driver} Gear`, colorB, 'y4'),
  ];

  return (
    <div className="w-full">
      <Plot
        data={plotData}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  );
}
