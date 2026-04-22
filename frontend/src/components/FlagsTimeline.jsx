import React from 'react';
import { useFetch } from '../hooks/useFetch';

const FlagsTimeline = ({ year, round, sessionType, onClose }) => {
    const endpoint = `/race_control?year=${year}&round=${round}&session_type=${sessionType}`;
    const { data, loading, error } = useFetch(endpoint, [year, round, sessionType]);
    const messages = data?.messages || [];

    const getCategoryColor = (flag) => {
        const f = (flag || '').toUpperCase();
        if (f.includes('YELLOW')) return 'text-yellow-500 border-yellow-500 bg-yellow-900/20';
        if (f.includes('RED')) return 'text-red-500 border-red-500 bg-red-900/20';
        if (f.includes('GREEN') || f.includes('CLEAR')) return 'text-green-500 border-green-500 bg-green-900/20';
        if (f.includes('BLACK')) return 'text-white border-white bg-black';
        return 'text-blue-400 border-blue-500 bg-blue-900/20';
    };

    return (
        <div className="h-full w-full bg-[#0b0d10] flex flex-col font-sans text-gray-300 relative border border-[#2b2e36]">
            {onClose && (
                <button onClick={onClose} className="absolute -top-8 right-0 text-white hover:text-red-500 z-50 px-2 py-1 bg-red-900/50 rounded text-xs font-bold border border-red-500/50">✕ CLOSE MODULE</button>
            )}
            <div className="p-4 border-b border-[#2b2e36] bg-[#16181d] shrink-0">
                <h2 className="text-white font-bold tracking-widest text-lg uppercase">Accident & Flags Control Log</h2>
                <div className="text-xs text-gray-500 tracking-wider">FIA Direct Race Control Messaging & Interventions</div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col gap-2 relative">
                {loading && <div className="text-blue-400 font-bold text-sm m-auto animate-pulse">DECRYPTING RACE CONTROL...</div>}
                {error && <div className="text-red-500 font-bold text-sm m-auto border border-red-500 bg-red-900/20 px-4 py-2">{error}</div>}
                {!loading && !error && messages.length === 0 && <div className="text-gray-500 font-bold text-sm m-auto">NO CRITICAL INCIDENTS</div>}
                
                {!loading && !error && messages.map((msg, i) => (
                    <div key={i} className={`p-3 border-l-4 rounded-r-md ${getCategoryColor(msg.flag || msg.category)} flex items-center justify-between`}>
                        <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                                TIME INDEX: {msg.time.toFixed(1)}s
                            </div>
                            <div className="font-bold tracking-wide uppercase text-sm">{msg.message}</div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-black/50 rounded font-black tracking-widest uppercase shrink-0">
                            {msg.flag !== 'Unknown' ? msg.flag : msg.category}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlagsTimeline;
