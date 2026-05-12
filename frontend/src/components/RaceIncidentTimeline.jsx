import React from 'react';
import { useFetch } from '../hooks/useFetch';

const RaceIncidentTimeline = ({ year, round, sessionType, onIncidentClick }) => {
    const endpoint = `/race_control?year=${year}&round=${round}&session_type=${sessionType}`;
    const { data, loading, error } = useFetch(endpoint, [year, round, sessionType]);
    const messages = data?.messages || [];

    // Filter relevant incidents
    const incidents = messages.filter(m => 
        m.category === 'Flag' || 
        m.category === 'SafetyCar' || 
        m.message.toUpperCase().includes('SAFETY CAR') ||
        m.message.toUpperCase().includes('RED FLAG')
    );

    if (loading || error || incidents.length === 0) return null;

    const maxTime = Math.max(...messages.map(m => m.time), 1);

    const getIncidentColor = (msg) => {
        const text = (msg.flag + ' ' + msg.message).toUpperCase();
        if (text.includes('RED')) return 'bg-red-500';
        if (text.includes('YELLOW') || text.includes('SAFETY CAR')) return 'bg-yellow-500';
        if (text.includes('GREEN') || text.includes('CLEAR')) return 'bg-green-500';
        return 'bg-blue-500';
    };

    return (
        <div className="w-full h-10 bg-[#16181d] border-t border-b border-[#2b2e36] relative flex items-center px-4 shadow-inner">
            <div className="text-[10px] font-mono text-gray-500 font-bold w-20 shrink-0">RACE INCIDENTS</div>
            <div className="relative flex-1 h-1.5 bg-[#0b0d10] rounded-full mx-2 border border-[#2b2e36]">
                {incidents.map((inc, i) => {
                    const leftPct = Math.min(100, Math.max(0, (inc.time / maxTime) * 100));
                    return (
                        <div 
                            key={i}
                            className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-3 cursor-pointer hover:h-5 hover:w-2 hover:z-20 transition-all rounded-[1px] shadow-[0_0_5px_rgba(0,0,0,0.5)] z-10 ${getIncidentColor(inc)}`}
                            style={{ left: `${leftPct}%` }}
                            onClick={() => onIncidentClick && onIncidentClick(inc.lap)}
                            title={`Lap ${inc.lap || 'Unknown'}: ${inc.message}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RaceIncidentTimeline;
