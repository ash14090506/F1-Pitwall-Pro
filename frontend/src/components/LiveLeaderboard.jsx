import React, { useMemo } from 'react';

const LiveLeaderboard = ({ telemetryData, playbackIndex, allDrivers }) => {
    // Determine the current "live" order based on distance at playbackIndex
    const leaderboard = useMemo(() => {
        if (!telemetryData || telemetryData.length === 0) return [];

        const standings = telemetryData.map(data => {
            const { driver, telemetry, compound, tyre_life } = data;
            
            // Find the driver info from allDrivers to get color, full name, etc.
            const driverInfo = allDrivers?.find(d => d.abbreviation === driver) || {};
            
            // Get current distance, default to 0 if out of bounds
            let distance = 0;
            if (telemetry.distance && telemetry.distance.length > 0) {
                const idx = Math.min(playbackIndex, telemetry.distance.length - 1);
                distance = telemetry.distance[idx] || 0;
            }

            return {
                driver,
                fullName: driverInfo.full_name || driver,
                color: driverInfo.team_color ? `#${driverInfo.team_color}` : '#ffffff',
                status: driverInfo.status || 'Finished',
                distance,
                compound: compound || 'UNKNOWN',
                tyreLife: tyre_life || 0,
            };
        });

        // Sort descending by distance
        standings.sort((a, b) => b.distance - a.distance);

        // Calculate gaps to leader
        if (standings.length > 0) {
            const leaderDist = standings[0].distance;
            standings.forEach(s => {
                s.gapToLeader = leaderDist - s.distance;
            });
        }

        return standings;
    }, [telemetryData, playbackIndex, allDrivers]);

    if (leaderboard.length === 0) return null;

    const getCompoundColor = (compound) => {
        switch (compound?.toUpperCase()) {
            case 'SOFT': return 'bg-red-500 text-white';
            case 'MEDIUM': return 'bg-yellow-400 text-black';
            case 'HARD': return 'bg-white text-black';
            case 'INTERMEDIATE': return 'bg-green-500 text-white';
            case 'WET': return 'bg-blue-500 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    return (
        <div className="absolute top-4 left-4 z-40 bg-[#1b1d24]/90 backdrop-blur border border-[#2b2e36] rounded-lg shadow-2xl overflow-hidden w-64 pointer-events-none transition-all duration-300">
            <div className="bg-[#0b0d10] px-4 py-2 border-b border-[#2b2e36] flex items-center justify-between">
                <h3 className="text-white font-bold text-xs tracking-wider uppercase">Live Leaderboard</h3>
                <span className="text-blue-500 text-[10px] animate-pulse">● LIVE</span>
            </div>
            
            <div className="p-2 space-y-1">
                {leaderboard.map((item, index) => {
                    const isOut = item.status && !item.status.includes('Lap') && !item.status.includes('Finished');
                    
                    return (
                    <div key={item.driver} className={`flex items-center gap-2 rounded p-1.5 border transition-all duration-300 ${isOut ? 'bg-[#0b0d10]/30 border-[#2b2e36]/30 opacity-60' : 'bg-[#0b0d10]/50 border-[#2b2e36]/50'}`}>
                        <div className="text-[10px] text-gray-500 font-mono w-4 text-center">{index + 1}</div>
                        
                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: isOut ? '#666' : item.color }} />
                        
                        <div className="flex-1 flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1">
                                <span className={`font-bold text-sm leading-none ${isOut ? 'text-gray-400' : 'text-white'}`}>{item.driver}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-mono text-gray-400">
                                    {isOut ? (
                                        <span className="text-red-500 font-bold">OUT</span>
                                    ) : (
                                        index === 0 ? 'Leader' : `+${item.gapToLeader.toFixed(0)}m`
                                    )}
                                </div>
                                
                                {item.compound !== 'UNKNOWN' && !isOut && (
                                    <div className="flex items-center gap-0.5">
                                        <div className={`px-1 rounded-sm text-[8px] font-bold ${getCompoundColor(item.compound)}`}>
                                            {item.compound?.charAt(0)}
                                        </div>
                                        {item.tyreLife > 0 && (
                                            <span className="text-[9px] text-gray-400 font-mono">L{item.tyreLife}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LiveLeaderboard;
