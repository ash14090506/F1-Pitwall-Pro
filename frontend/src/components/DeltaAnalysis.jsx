import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlot from 'react-plotly.js';

const Plot = ReactPlot.default || ReactPlot;

const API_BASE = 'http://127.0.0.1:8001/api';

const DeltaAnalysis = ({ year, round, sessionType, allDrivers, selectedDrivers }) => {
    const [deltaData, setDeltaData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refDriver = selectedDrivers.length > 0 ? selectedDrivers[0] : null;
    const compDrivers = selectedDrivers.slice(1);

    useEffect(() => {
        if (!refDriver || compDrivers.length === 0) {
            setDeltaData(null);
            return;
        }

        const fetchDeltas = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch delta for all comp drivers against ref_driver
                const requests = compDrivers.map(drv => 
                    axios.get(`${API_BASE}/telemetry/delta?year=${year}&round=${round}&session_type=${sessionType}&ref_driver=${refDriver}&comp_driver=${drv}`)
                );
                const responses = await Promise.all(requests);
                setDeltaData(responses.map(r => r.data));
            } catch (err) {
                console.error(err);
                setError("Failed to fetch delta data. Ensure fastest lap is available.");
            } finally {
                setLoading(false);
            }
        };

        fetchDeltas();
    }, [year, round, sessionType, refDriver, compDrivers.join(',')]);

    if (!selectedDrivers || selectedDrivers.length < 2) {
        return <div className="flex h-full w-full items-center justify-center text-[#64748b] bg-[#0b0d10] p-4 text-center">
            Please add at least 2 drivers to the main toolbar to perform Delta Analysis.
        </div>;
    }

    if (loading) {
        return <div className="flex h-full w-full items-center justify-center text-[#64748b]">Computing temporal interpolations...</div>;
    }

    if (error) {
        return <div className="flex h-full w-full items-center justify-center text-red-500">{error}</div>;
    }

    if (!deltaData || deltaData.length === 0) {
        return null;
    }

    const fallbackColors = ['#00FF00', '#FF00FF', '#FFA500', '#0000FF', '#FF0000'];
    const timeTraces = [];
    const speedTraces = [];

    // Reference driver horizontal zero line
    let refColor = '#FFFFFF';
    if (allDrivers) {
        const dInfo = allDrivers.find(d => d.abbreviation === refDriver);
        if (dInfo && dInfo.team_color) refColor = dInfo.team_color.startsWith('#') ? dInfo.team_color : `#${dInfo.team_color}`;
    }

    timeTraces.push({
        x: [deltaData[0].delta.distance[0], deltaData[0].delta.distance[deltaData[0].delta.distance.length - 1]],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: `${refDriver} (Ref)`,
        line: { color: refColor, width: 2, dash: 'dash' }
    });

    speedTraces.push({
        x: [deltaData[0].delta.distance[0], deltaData[0].delta.distance[deltaData[0].delta.distance.length - 1]],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: `${refDriver} (Ref)`,
        line: { color: refColor, width: 2, dash: 'dash' }
    });


    deltaData.forEach((d, idx) => {
        let color = fallbackColors[idx % fallbackColors.length];
        if (allDrivers) {
            const dInfo = allDrivers.find(drv => drv.abbreviation === d.comp_driver);
            if (dInfo && dInfo.team_color) color = dInfo.team_color.startsWith('#') ? dInfo.team_color : `#${dInfo.team_color}`;
        }

        timeTraces.push({
            x: d.delta.distance,
            y: d.delta.delta_time, // negative means comp is faster
            type: 'scatter',
            mode: 'lines',
            name: `${d.comp_driver} vs ${refDriver}`,
            line: { color: color, width: 2 }
        });

        speedTraces.push({
            x: d.delta.distance,
            y: d.delta.delta_speed, // positive means comp is faster
            type: 'scatter',
            mode: 'lines',
            name: `${d.comp_driver} Speed Delta`,
            line: { color: color, width: 1.5 }
        });
    });

    const commonLayout = {
        autosize: true,
        margin: { l: 40, r: 10, t: 10, b: 20 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: true,
        legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center', font: { color: '#e2e8f0', size: 10 } },
        hovermode: 'x unified',
        hoverlabel: { bgcolor: '#16181d', bordercolor: '#2b2e36', font: { color: '#e2e8f0', size: 12 } },
        xaxis: { showgrid: true, gridcolor: '#2b2e36', zeroline: false, tickfont: { color: '#64748b' }, spikemode: 'across', spikethickness: 1, spikecolor: '#94a3b8' }
    };

    return (
        <div className="flex flex-col h-full w-full gap-2 relative">
            <div className="absolute top-2 left-4 z-50 text-xs font-bold text-gray-300 bg-[#0b0d10] px-2 border-l-2 border-blue-500 shadow-md">
                Reference: <span className="text-white">{refDriver}</span>
            </div>
            <div className="flex-1 bg-[#16181d] border border-[#2b2e36] rounded shadow-lg overflow-hidden flex flex-col relative">
                <div className="h-6 bg-[#2b2e36]/30 border-b border-[#2b2e36] px-2 flex items-center text-xs font-semibold text-gray-300">
                    Time Delta (Seconds) - Negative is faster than Ref
                </div>
                <div className="flex-1">
                    <Plot
                        data={timeTraces}
                        layout={{ ...commonLayout, yaxis: { title: { text: "Time Delta (s)", font: { size: 10, color: '#64748b' } }, showgrid: true, gridcolor: '#2b2e36', zeroline: true, zerolinecolor: '#475569', tickfont: { color: '#64748b' } }}}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </div>
            </div>
            
            <div className="flex-1 bg-[#16181d] border border-[#2b2e36] rounded shadow-lg overflow-hidden flex flex-col relative">
                <div className="h-6 bg-[#2b2e36]/30 border-b border-[#2b2e36] px-2 flex items-center text-xs font-semibold text-gray-300">
                    Speed Delta (km/h) - Positive means higher top-speed than Ref
                </div>
                <div className="flex-1">
                    <Plot
                        data={speedTraces}
                        layout={{ ...commonLayout, yaxis: { title: { text: "Speed (km/h)", font: { size: 10, color: '#64748b' } }, showgrid: true, gridcolor: '#2b2e36', zeroline: true, zerolinecolor: '#475569', tickfont: { color: '#64748b' } }}}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DeltaAnalysis;
