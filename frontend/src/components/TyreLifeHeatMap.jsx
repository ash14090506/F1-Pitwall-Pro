import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useFetch } from '../hooks/useFetch';

const TyreLifeHeatMap = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
    const driversStr = selectedDrivers.length > 0 ? selectedDrivers.join(',') : allDrivers.map(d => d.abbreviation).join(',');
    const endpoint = `/laps_summary?year=${year}&round=${round}&session_type=${sessionType}&drivers=${driversStr}`;
    
    const { data, loading, error } = useFetch(endpoint, [year, round, sessionType, driversStr]);

    const plotData = useMemo(() => {
        if (!data || !data.driver_laps) return [];

        const traces = [];
        
        // Helper to convert "1:24.532" to seconds
        const parseTimeToSeconds = (timeStr) => {
            if (!timeStr || timeStr === "-") return null;
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            }
            return parseFloat(timeStr);
        };

        const compoundMarkers = {
            'SOFT': 'circle',
            'MEDIUM': 'diamond',
            'HARD': 'square',
            'INTERMEDIATE': 'cross',
            'WET': 'x',
            'UNKNOWN': 'circle-open'
        };

        const compoundColors = {
            'SOFT': '#ef4444',
            'MEDIUM': '#eab308',
            'HARD': '#ffffff',
            'INTERMEDIATE': '#22c55e',
            'WET': '#3b82f6'
        };

        // First pass: collect all valid lap times to find session median
        let allValidTimes = [];
        Object.entries(data.driver_laps).forEach(([driver, laps]) => {
            laps.forEach(lap => {
                const s = parseTimeToSeconds(lap.LapTime);
                if (s !== null) allValidTimes.push(s);
            });
        });

        allValidTimes.sort((a, b) => a - b);
        // Exclude in/out laps (outliers > 107%)
        const minTime = allValidTimes[0] || 0;
        const cutoff = minTime * 1.07;
        const validRacingLaps = allValidTimes.filter(t => t <= cutoff);
        
        const sessionMedian = validRacingLaps.length > 0 
            ? validRacingLaps[Math.floor(validRacingLaps.length / 2)] 
            : 0;

        Object.entries(data.driver_laps).forEach(([driver, laps]) => {
            const driverInfo = allDrivers.find(d => d.abbreviation === driver);
            const teamColor = driverInfo?.team_color ? `#${driverInfo.team_color}` : '#ffffff';

            const xTyreAge = [];
            const yPaceDelta = [];
            const markerSymbols = [];
            const hoverTexts = [];
            const markerLineColors = [];

            laps.forEach(lap => {
                const lapTimeS = parseTimeToSeconds(lap.LapTime);
                if (lapTimeS !== null && sessionMedian > 0 && lapTimeS <= cutoff) {
                    const tyreAge = parseInt(lap.TyreLife) || 1;
                    const delta = lapTimeS - sessionMedian;
                    
                    const compound = String(lap.Compound).toUpperCase();
                    const symbol = compoundMarkers[compound] || 'circle';
                    const compColor = compoundColors[compound] || '#ffffff';

                    xTyreAge.push(tyreAge);
                    yPaceDelta.push(delta);
                    markerSymbols.push(symbol);
                    markerLineColors.push(compColor);
                    
                    hoverTexts.push(
                        `<b>${driver}</b><br>` +
                        `Lap: ${lap.LapNumber}<br>` +
                        `Tyre Age: ${tyreAge} laps<br>` +
                        `Compound: ${compound}<br>` +
                        `Time: ${lap.LapTime}<br>` +
                        `Delta to Median: ${delta > 0 ? '+' : ''}${delta.toFixed(3)}s`
                    );
                }
            });

            if (xTyreAge.length > 0) {
                traces.push({
                    x: xTyreAge,
                    y: yPaceDelta,
                    mode: 'markers',
                    name: driver,
                    text: hoverTexts,
                    hoverinfo: 'text',
                    marker: {
                        size: 10,
                        symbol: markerSymbols,
                        color: teamColor,
                        line: {
                            color: markerLineColors,
                            width: 2
                        },
                        opacity: 0.8
                    }
                });
            }
        });

        return traces;
    }, [data, allDrivers]);

    if (loading) return <div className="p-4 text-blue-400 font-mono animate-pulse">Computing Tyre Life Heat Map...</div>;
    if (error) return <div className="p-4 text-red-500 font-mono">{error}</div>;

    return (
        <div className="w-full h-full bg-[#0b0d10] p-4 flex flex-col relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2 text-xs bg-[#16181d] p-2 rounded border border-[#2b2e36]">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-[#ef4444]"></div> Soft</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-[#eab308]"></div> Medium</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-[#ffffff]"></div> Hard</div>
            </div>
            
            <div className="flex-1 min-h-0">
                <Plot
                    data={plotData}
                    layout={{
                        autosize: true,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        margin: { t: 20, r: 20, b: 40, l: 60 },
                        xaxis: {
                            title: 'Tyre Age (Laps)',
                            titlefont: { color: '#64748b', size: 12 },
                            tickfont: { color: '#64748b' },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#2b2e36'
                        },
                        yaxis: {
                            title: 'Pace Delta vs Median (s)',
                            titlefont: { color: '#64748b', size: 12 },
                            tickfont: { color: '#64748b' },
                            gridcolor: '#1b1d24',
                            zerolinecolor: '#ef4444',
                            autorange: 'reversed' // Faster times (negative delta) at the top
                        },
                        legend: {
                            font: { color: '#cbd5e1' },
                            orientation: 'h',
                            y: -0.15
                        },
                        hovermode: 'closest'
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <div className="text-[10px] text-gray-500 mt-2 font-mono text-center">
                Y-Axis: Delta to session median lap time (lower is better). Fill Color: Driver. Border Color/Shape: Compound.
            </div>
        </div>
    );
};

export default TyreLifeHeatMap;
