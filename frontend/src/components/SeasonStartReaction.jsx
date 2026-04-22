import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;
const API_BASE = 'http://127.0.0.1:8001/api';

export default function SeasonStartReaction({ year }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/season_start_reaction?year=${year}`);
                setData(res.data);
            } catch (err) {
                setError("Error fetching season start reaction data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="mb-4">Fetching completed races and parsing Lap 1 acceleration...</div>
            <div className="text-xs text-gray-500">This requires heavy multi-session downloading on the first run.</div>
        </div>
    );
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;
    if (!data || !data.reactions) return null;

    // Build the traces for the box plot
    const traces = data.reactions.map(drv => {
        return {
            y: drv.times,
            type: 'box',
            name: drv.driver,
            boxpoints: 'all', // Show all points
            jitter: 0.3, // Spread them out
            pointpos: -1.8,
            marker: {
                color: `#${drv.team_color}`,
                size: 4
            },
            line: {
                color: `#${drv.team_color}`,
                width: 1.5
            },
            fillcolor: `#${drv.team_color}40`, // 25% opacity for the box
            hoverinfo: 'y+name',
            hovertemplate: '%{y:.3f}s<extra>%{name}</extra>'
        };
    });

    return (
        <div className="flex h-full w-full bg-[#0b0d10] text-[#e2e8f0] p-4 flex-col">
            <div className="bg-[#16181d] rounded-lg border border-[#2b2e36] flex-1 relative p-2 overflow-hidden flex flex-col">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#1b1d24] text-xs font-semibold rounded border border-[#2b2e36] text-gray-300 z-10">
                    0-50 km/h Acceleration Time Distribution
                </div>
                
                <div className="flex-1 w-full mt-8">
                    <Plot
                        data={traces}
                        layout={{
                            autosize: true,
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            showlegend: false,
                            margin: { l: 50, r: 20, t: 20, b: 40 },
                            xaxis: { 
                                title: 'Driver', 
                                color: '#64748b',
                                gridcolor: '#1e293b',
                                tickangle: 0,
                                tickfont: { size: 10, color: 'white', weight: 'bold' }
                            },
                            yaxis: { 
                                title: 'Time (seconds)', 
                                color: '#64748b',
                                gridcolor: '#1e293b',
                                tickformat: '.2f',
                                ticksuffix: 's'
                            },
                        }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false }}
                    />
                </div>
                
                <div className="h-10 border-t border-[#2b2e36] bg-[#0b0d10] flex items-center justify-between px-4 text-gray-400 mt-2 rounded">
                    <div className="text-xs">
                        Tracks median reaction/performance and stability range (IQR) across {data.reactions[0]?.times?.length || 0} sample points.
                    </div>
                </div>
            </div>
        </div>
    );
}
