import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, Calendar, Info, Zap, Activity } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const WelcomeDashboard = ({ year }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/standings?year=${year}`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch standings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStandings();
    }, [year]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#0b0d10]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-400 text-sm font-medium animate-pulse">Initializing F1 Championship Data...</div>
                </div>
            </div>
        );
    }

    const { drivers = [], constructors = [], progress = { total: 0, completed: 0, percentage: 0 } } = data || {};

    return (
        <div className="h-full w-full bg-[#0b0d10] overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2b2e36] pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            F1 Pitwall <span className="text-blue-500">Pro</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 font-medium">Professional High-Fidelity Telemetry Analysis Workstation</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                        <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Season Progress</div>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2 bg-[#1b1d24] rounded-full overflow-hidden border border-[#2b2e36]">
                                    <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${progress.percentage}%` }}></div>
                                </div>
                                <span className="text-white font-bold text-sm">{progress.completed}/{progress.total} Races</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Column 1: Driver Standings */}
                    <div className="flex flex-col h-[600px] bg-[#16181d] rounded-xl border border-[#2b2e36] overflow-hidden shadow-2xl">
                        <div className="p-4 bg-[#1b1d24] border-b border-[#2b2e36] flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Driver Championship</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {drivers.map((d, i) => (
                                <div key={i} className="flex items-center p-3 rounded-lg hover:bg-[#1b1d24] transition-colors group">
                                    <div className="w-6 text-center font-black text-gray-500 italic mr-2 group-hover:text-white">{d.pos}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white uppercase">{d.driver}</span>
                                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{d.full_name}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium">{d.team}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-white">{d.points}</div>
                                        <div className="text-[9px] text-gray-500 font-bold uppercase">Points</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Constructor Standings */}
                    <div className="flex flex-col h-[600px] bg-[#16181d] rounded-xl border border-[#2b2e36] overflow-hidden shadow-2xl">
                        <div className="p-4 bg-[#1b1d24] border-b border-[#2b2e36] flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Constructor Standings</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {constructors.map((c, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-white uppercase">{c.team}</span>
                                        <span className="text-xs font-black text-blue-400">{c.points} pts</span>
                                    </div>
                                    <div className="w-full h-3 bg-[#0b0d10] rounded-sm overflow-hidden border border-[#2b2e36]">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                                            style={{ width: `${(c.points / (constructors[0]?.points || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Getting Started & Info */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl p-6 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Zap size={120} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Getting Started</h3>
                            <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                To begin analyzing telemetry, select a race year, round, and session from the toolbar above, then pick up to 3 drivers and click <span className="font-bold bg-white text-blue-900 px-1 rounded">Update Analysis</span>.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                                    <div className="p-2 bg-white/20 rounded-md"><Calendar size={18} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-60">Step 1</div>
                                        <div className="text-xs font-bold uppercase">Select Session</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                                    <div className="p-2 bg-white/20 rounded-md"><Trophy size={18} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-60">Step 2</div>
                                        <div className="text-xs font-bold uppercase">Choose Drivers</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                                    <div className="p-2 bg-white/20 rounded-md"><Activity size={18} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-60">Step 3</div>
                                        <div className="text-xs font-bold uppercase">Run Analytics</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#16181d] rounded-xl border border-[#2b2e36] p-6 shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Info size={16} className="text-gray-400" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Information</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-[#2b2e36] pb-2">
                                    <span className="text-[11px] text-gray-500 font-medium">FastF1 Version</span>
                                    <span className="text-[11px] text-white font-bold tracking-widest">3.3.0</span>
                                </div>
                                <div className="flex justify-between border-b border-[#2b2e36] pb-2">
                                    <span className="text-[11px] text-gray-500 font-medium">Cache Status</span>
                                    <span className="text-[11px] text-green-400 font-bold uppercase tracking-widest">Online</span>
                                </div>
                                <div className="flex justify-between border-b border-[#2b2e36] pb-2">
                                    <span className="text-[11px] text-gray-500 font-medium">Active Workers</span>
                                    <span className="text-[11px] text-white font-bold tracking-widest">3 (Playback, Telemetry, AI)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeDashboard;
