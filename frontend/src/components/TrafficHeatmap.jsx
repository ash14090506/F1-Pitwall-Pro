import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const TrafficHeatmap = ({ year, round, sessionType, allDrivers }) => {
    const [trafficData, setTrafficData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchTraffic = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/traffic?year=${year}&round=${round}&session_type=${sessionType}`);
                setTrafficData(res.data.traffic || []);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError("Failed to fetch traffic matrices.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTraffic();
    }, [year, round, sessionType]);

    if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">Parsing Dirty Air Turbulence...</div>;
    if (error) return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs tracking-widest uppercase">{error}</div>;
    if (!trafficData || trafficData.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold tracking-widest text-xs uppercase">No Traffic Data Found</div>;

    const maxPercentage = Math.max(...trafficData.map(d => d.dirty_air_percentage));

    return (
        <div className="h-full w-full bg-[#0b0d10] p-6 font-sans text-xs flex flex-col">
            <div className="flex justify-between items-end mb-6 border-b border-[#2b2e36] pb-2">
                <h2 className="text-[#94a3b8] font-bold text-sm tracking-[0.2em] uppercase">
                    Dirty Air Exposure
                </h2>
                <span className="text-gray-500 font-mono text-[10px]">GAP {"<"} 1.5s</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {trafficData.map((d, i) => {
                    let teamColor = '#3b82f6';
                    if (allDrivers) {
                        const drvInfo = allDrivers.find(drv => drv.abbreviation === d.driver);
                        if (drvInfo && drvInfo.team_color) {
                            teamColor = drvInfo.team_color.startsWith('#') ? drvInfo.team_color : `#${drvInfo.team_color}`;
                        }
                    }

                    // Heatmap logic: Higher % = Brighter Red
                    const intensity = d.dirty_air_percentage / Math.max(80, maxPercentage); 
                    const barBg = `rgb(${Math.floor(255 * intensity * 1.5)}, ${Math.floor(50 * (1 - intensity))}, ${Math.floor(50 * (1-intensity))})`;

                    return (
                        <div key={i} className="flex flex-col gap-1 w-full max-w-lg mx-auto">
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-[#e2e8f0] text-sm flex items-center gap-2">
                                    <span className="w-2 h-4 rounded-sm block" style={{ backgroundColor: teamColor }}></span>
                                    {d.driver}
                                </span>
                                <span className="text-gray-400 font-mono font-bold">{d.dirty_air_percentage}%</span>
                            </div>
                            <div className="w-full bg-[#16181d] h-3 rounded overflow-hidden flex border border-[#2b2e36]">
                                <div 
                                    className="h-full rounded-r transition-all duration-1000 ease-out" 
                                    style={{ width: `${d.dirty_air_percentage}%`, backgroundColor: barBg, boxShadow: `0 0 10px ${barBg}80` }}
                                ></div>
                                <div className="h-full flex-1 bg-transparent border-l border-white/5 relative">
                                     <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-500 tracking-widest font-mono hidden sm:block">CLEAN AIR</div>
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono">
                                {d.dirty_air_laps} Laps spent in turbulence out of {d.dirty_air_laps + d.clean_air_laps} total laps
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrafficHeatmap;
