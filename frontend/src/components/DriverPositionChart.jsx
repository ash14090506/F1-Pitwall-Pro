import React, { useState, useEffect } from 'react';
import ReactPlot from 'react-plotly.js';
import axios from 'axios';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

const DriverPositionChart = ({ year, round, sessionType, allDrivers }) => {
    const [positionData, setPositionData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchPositions = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/positions?year=${year}&round=${round}&session_type=${sessionType}`);
                setPositionData(res.data.driver_positions || []);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError("Failed to fetch driver positional data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, [year, round, sessionType]);

    if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse">CALCULATING LAP POSITIONS...</div>;
    if (error) return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs">{error}</div>;
    if (!positionData || positionData.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">NO POSITION DATA</div>;

    const fallbackColors = ['#00D2BE', '#0000FF', '#FF0000', '#FFA500', '#00FF00', '#FF00FF', '#AAAAAA', '#FFFFFF'];
    const usedColors = {};

    const traces = positionData.map((d, index) => {
        let color = fallbackColors[index % fallbackColors.length];
        if (allDrivers) {
            const drvInfo = allDrivers.find(drv => drv.abbreviation === d.driver);
            if (drvInfo && drvInfo.team_color) {
                color = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
            }
        }
        
        // Differentiate teammates mathematically
        let dashStyle = 'solid';
        if (usedColors[color]) {
            dashStyle = usedColors[color] === 1 ? 'dash' : 'dot';
            usedColors[color]++;
        } else {
            usedColors[color] = 1;
        }

        return {
            x: d.laps,
            y: d.positions,
            type: 'scatter',
            mode: 'lines+markers',
            name: d.driver,
            line: { color: color, width: 2, dash: dashStyle, shape: 'hv' }, // Step interpolation
            marker: { size: 4 },
            hovertemplate: `${d.driver}<br>Lap: %{x}<br>Pos: P%{y}<extra></extra>`
        };
    });

    return (
        <div className="h-full w-full bg-[#0b0d10] relative font-sans">
            <Plot
                data={traces}
                layout={{
                    autosize: true,
                    margin: { l: 40, r: 20, t: 20, b: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    showlegend: true,
                    legend: { orientation: 'v', y: 1, x: 1.02, font: { color: '#e2e8f0', size: 10 } },
                    hovermode: 'closest',
                    hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0' } },
                    xaxis: { 
                        title: { text: "Lap Number", font: { size: 10, color: '#64748b' } },
                        showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' }
                    },
                    yaxis: { 
                        title: { text: "Position", font: { size: 10, color: '#64748b' } },
                        showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#e2e8f0', size: 11, weight: 'bold' },
                        autorange: "reversed", // Position 1 is at the top
                        dtick: 1
                    }
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};

export default DriverPositionChart;
