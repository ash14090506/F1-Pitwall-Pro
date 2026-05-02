import React, { useMemo, useState } from 'react';

const LiveLeaderboard = ({ telemetryData, playbackIndex, allDrivers }) => {
    const [collapsed, setCollapsed] = useState(false);

    const leaderboard = useMemo(() => {
        if (!telemetryData || telemetryData.length === 0) return [];

        const standings = telemetryData.map(data => {
            const { driver, telemetry, compound, tyre_life } = data;
            const driverInfo = allDrivers?.find(d => d.abbreviation === driver) || {};

            let distance = 0;
            if (telemetry.distance && telemetry.distance.length > 0) {
                const idx = Math.min(playbackIndex, telemetry.distance.length - 1);
                distance = telemetry.distance[idx] || 0;
            }

            return {
                driver,
                color: driverInfo.team_color ? `#${driverInfo.team_color}` : '#ffffff',
                status: driverInfo.status || 'Finished',
                distance,
                compound: compound || 'UNKNOWN',
                tyreLife: tyre_life || 0,
            };
        });

        standings.sort((a, b) => b.distance - a.distance);

        if (standings.length > 0) {
            const leaderDist = standings[0].distance;
            standings.forEach(s => { s.gapToLeader = leaderDist - s.distance; });
        }

        return standings;
    }, [telemetryData, playbackIndex, allDrivers]);

    if (leaderboard.length === 0) return null;

    const getCompoundChar = (compound) => {
        switch (compound?.toUpperCase()) {
            case 'SOFT':         return { char: 'S', cls: 'text-red-400' };
            case 'MEDIUM':       return { char: 'M', cls: 'text-yellow-400' };
            case 'HARD':         return { char: 'H', cls: 'text-gray-300' };
            case 'INTERMEDIATE': return { char: 'I', cls: 'text-green-400' };
            case 'WET':          return { char: 'W', cls: 'text-blue-400' };
            default:             return { char: '?', cls: 'text-gray-500' };
        }
    };

    return (
        <div className="absolute bottom-4 left-2 z-20 pointer-events-auto select-none">
            {/* Header — always visible, click to collapse */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-t bg-[#0b0d10]/70 border border-[#2b2e36]/60 backdrop-blur-sm w-full text-left hover:bg-[#1b1d24]/80 transition-colors"
            >
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex-1">Leaderboard</span>
                <span className="text-blue-500 text-[8px] animate-pulse">●</span>
                <span className="text-gray-600 text-[9px] ml-1">{collapsed ? '▲' : '▼'}</span>
            </button>

            {/* Body — collapsible */}
            {!collapsed && (
                <div className="bg-[#0b0d10]/55 backdrop-blur-sm border border-t-0 border-[#2b2e36]/50 rounded-b overflow-hidden">
                    {leaderboard.map((item, index) => {
                        const isOut = item.status && !item.status.includes('Lap') && !item.status.includes('Finished');
                        const { char, cls } = getCompoundChar(item.compound);

                        return (
                            <div
                                key={item.driver}
                                className={`flex items-center gap-1.5 px-2 py-0.5 border-b border-[#2b2e36]/30 last:border-b-0 ${isOut ? 'opacity-40' : ''}`}
                            >
                                {/* Position */}
                                <span className="text-[9px] text-gray-600 font-mono w-3 text-right flex-shrink-0">{index + 1}</span>

                                {/* Team colour bar */}
                                <div className="w-0.5 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: isOut ? '#555' : item.color }} />

                                {/* Driver */}
                                <span className={`text-[11px] font-bold font-mono flex-1 ${isOut ? 'text-gray-500' : 'text-white'}`}>
                                    {item.driver}
                                </span>

                                {/* Gap */}
                                <span className="text-[9px] font-mono text-gray-400">
                                    {isOut
                                        ? <span className="text-red-500">OUT</span>
                                        : index === 0
                                            ? <span className="text-green-400 font-bold">P1</span>
                                            : `+${item.gapToLeader.toFixed(0)}m`}
                                </span>

                                {/* Compound letter */}
                                {item.compound !== 'UNKNOWN' && !isOut && (
                                    <span className={`text-[9px] font-bold font-mono ${cls}`}>{char}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LiveLeaderboard;
