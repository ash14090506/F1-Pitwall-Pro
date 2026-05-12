import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

const MultiSessionComparison = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const [compareSession, setCompareSession] = useState('Q');
    const [dataPrimary, setDataPrimary] = useState(null);
    const [dataSecondary, setDataSecondary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const driver = selectedDrivers.length > 0 ? selectedDrivers[0] : (allDrivers[0]?.abbreviation || '');

    useEffect(() => {
        if (!driver) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch primary
                const pUrl = `/api/telemetry/fastest?year=${year}&round=${round}&session_type=${sessionType}&driver=${driver}`;
                // Fetch secondary
                const sUrl = `/api/telemetry/fastest?year=${year}&round=${round}&session_type=${compareSession}&driver=${driver}`;

                const readStream = async (url) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop();
                        for (const line of lines) {
                            if (!line.trim()) continue;
                            const obj = JSON.parse(line);
                            if (obj.done) continue;
                            if (obj.error) throw new Error(obj.error);
                            return obj; // Return the first (and only) payload
                        }
                    }
                };

                const [resPrim, resSec] = await Promise.all([
                    readStream(pUrl),
                    readStream(sUrl)
                ]);

                setDataPrimary(resPrim);
                setDataSecondary(resSec);

            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to fetch comparison data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, round, sessionType, compareSession, driver]);

    if (loading) return <div className="p-4 text-blue-400 font-mono animate-pulse">Loading Comparison...</div>;
    if (error) return <div className="p-4 text-red-500 font-mono">{error}</div>;
    if (!dataPrimary || !dataSecondary) return <div className="p-4 text-gray-500 font-mono">Select a driver to compare sessions.</div>;

    const tP = dataPrimary.telemetry;
    const tS = dataSecondary.telemetry;

    // Driver color
    const driverInfo = allDrivers.find(d => d.abbreviation === driver);
    const primColor = driverInfo?.team_color ? `#${driverInfo.team_color}` : '#3b82f6';
    const secColor = '#ffffff';

    return (
        <div className="w-full h-full flex flex-col bg-[#0b0d10] p-4 font-sans relative">
            <div className="flex items-center gap-4 mb-4 shrink-0 bg-[#16181d] p-3 rounded-lg border border-[#2b2e36]">
                <div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Driver</div>
                    <div className="text-white font-black text-xl">{driver}</div>
                </div>
                
                <div className="w-px h-8 bg-[#2b2e36] mx-2"></div>
                
                <div className="flex flex-col">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Base Session</div>
                    <div className="flex items-center gap-2 text-white font-bold">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primColor }}></div>
                        {sessionType} (Lap: {dataPrimary.lap_time})
                    </div>
                </div>

                <div className="w-px h-8 bg-[#2b2e36] mx-2"></div>

                <div className="flex flex-col">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Compare Session</div>
                    <div className="flex items-center gap-2 text-white font-bold">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secColor }}></div>
                        <select 
                            className="bg-[#0b0d10] border border-[#2b2e36] text-white px-2 py-0.5 rounded outline-none"
                            value={compareSession}
                            onChange={(e) => setCompareSession(e.target.value)}
                        >
                            <option value="R">R</option>
                            <option value="S">S</option>
                            <option value="SQ">SQ</option>
                            <option value="Q">Q</option>
                            <option value="FP3">FP3</option>
                            <option value="FP2">FP2</option>
                            <option value="FP1">FP1</option>
                        </select>
                        (Lap: {dataSecondary.lap_time})
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                <Plot
                    data={[
                        {
                            x: tP.distance,
                            y: tP.speed,
                            type: 'scatter',
                            mode: 'lines',
                            name: `Speed (${sessionType})`,
                            line: { color: primColor, width: 2 }
                        },
                        {
                            x: tS.distance,
                            y: tS.speed,
                            type: 'scatter',
                            mode: 'lines',
                            name: `Speed (${compareSession})`,
                            line: { color: secColor, width: 2, dash: 'dot' }
                        }
                    ]}
                    layout={{
                        autosize: true,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        margin: { t: 20, r: 20, b: 40, l: 50 },
                        xaxis: {
                            title: 'Distance (m)',
                            titlefont: { color: '#64748b' },
                            tickfont: { color: '#64748b' },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#2b2e36'
                        },
                        yaxis: {
                            title: 'Speed (km/h)',
                            titlefont: { color: '#64748b' },
                            tickfont: { color: '#64748b' },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#2b2e36',
                            range: [0, 350]
                        },
                        legend: {
                            font: { color: '#cbd5e1' },
                            orientation: 'h',
                            y: -0.15
                        },
                        hovermode: 'x unified'
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default MultiSessionComparison;
