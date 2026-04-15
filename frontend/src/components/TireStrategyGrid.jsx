import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const TireStrategyGrid = ({ year, round, sessionType, allDrivers }) => {
    const [strategyList, setStrategyList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchStrategy = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/tire_strategy?year=${year}&round=${round}&session_type=${sessionType}`);
                setStrategyList(res.data.driver_stints || []);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError("Failed to fetch tire strategy history.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStrategy();
    }, [year, round, sessionType]);

    if (loading) return <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">Parsing Strategy Nodes...</div>;
    if (error) return <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xs tracking-widest uppercase">{error}</div>;
    if (!strategyList || strategyList.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold tracking-widest text-xs uppercase">No Tire Data Found For Session</div>;

    const maxLaps = Math.max(...strategyList.map(d => Math.max(...d.stints.map(s => s.end_lap), 1)));

    const getTireBgColor = (compound) => {
        const c = compound.toUpperCase();
        if (c.includes('SOFT')) return 'bg-[#ff2031] text-white fill-white';
        if (c.includes('MEDIUM')) return 'bg-[#ffd12e] text-black fill-black';
        if (c.includes('HARD')) return 'bg-[#ffffff] text-black fill-black';
        if (c.includes('INTERMEDIATE')) return 'bg-[#43b02a] text-white fill-white';
        if (c.includes('WET')) return 'bg-[#006aff] text-white fill-white';
        return 'bg-pink-600 text-white fill-white';
    };

    return (
        <div className="h-full w-full bg-[#0b0d10] p-6 overflow-y-auto font-sans text-xs flex flex-col">
            <h2 className="text-[#94a3b8] font-bold text-sm tracking-[0.2em] mb-6 pb-2 uppercase border-b border-[#2b2e36] sticky top-0 z-10 bg-[#0b0d10]">
                Tire Operations
            </h2>
            <div className="flex flex-col gap-3">
                {strategyList.map((driverData, i) => {
                    return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 group">
                            <div className="w-16 font-bold text-[#e2e8f0] text-sm">{driverData.driver}</div>
                            <div className="flex-1 bg-[#16181d] h-10 relative overflow-hidden border border-[#2b2e36] shadow flex opacity-80 group-hover:opacity-100 transition-opacity">
                                {driverData.stints.map((stint, j) => {
                                    const widthPercent = (stint.laps / maxLaps) * 100;
                                    return (
                                        <div 
                                            key={j}
                                            className={`h-full flex items-center justify-center text-[11px] font-bold relative stint-block ${getTireBgColor(stint.compound)} ${!stint.fresh_tyre ? 'brightness-[0.7]' : ''}`}
                                            style={{ width: `${widthPercent}%` }}
                                            title={`Laps ${stint.start_lap} - ${stint.end_lap} | ${stint.fresh_tyre ? 'New' : 'Used'} ${stint.compound}`}
                                        >
                                            {widthPercent > 4 ? stint.compound.substring(0, 1) : ''}
                                            
                                            {j < driverData.stints.length - 1 && (
                                                <div className="absolute right-0 top-0 h-full w-1 blur-[1px] bg-black/60 z-10" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4 text-gray-500 font-bold uppercase text-[10px] tracking-wider justify-center">
                <div className="flex items-center gap-2"><span className="w-5 h-5 block bg-[#ff2031] rounded-sm shadow border border-black"></span> SOFT</div>
                <div className="flex items-center gap-2"><span className="w-5 h-5 block bg-[#ffd12e] rounded-sm shadow border border-black"></span> MEDIUM</div>
                <div className="flex items-center gap-2"><span className="w-5 h-5 block bg-[#ffffff] rounded-sm shadow border border-black"></span> HARD</div>
                <div className="flex items-center gap-2"><span className="w-5 h-5 block bg-[#43b02a] rounded-sm shadow border border-black"></span> INTER</div>
                <div className="flex items-center gap-2"><span className="w-5 h-5 block bg-[#006aff] rounded-sm shadow border border-black"></span> WET</div>
            </div>
        </div>
    );
};

export default TireStrategyGrid;
