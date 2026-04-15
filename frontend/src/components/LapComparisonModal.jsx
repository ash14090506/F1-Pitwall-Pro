import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const LapComparisonModal = ({ year, round, sessionType, drivers, onClose, onApplyLaps }) => {
    const [lapData, setLapData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLaps, setSelectedLaps] = useState({});

    useEffect(() => {
        if (!drivers || drivers.length === 0) return;
        
        const fetchLaps = async () => {
            setLoading(true);
            setError(null);
            try {
                const driverStr = drivers.join(',');
                const res = await axios.get(`${API_BASE}/laps_summary?year=${year}&round=${round}&session_type=${sessionType}&drivers=${driverStr}`);
                setLapData(res.data.driver_laps || {});
            } catch (err) {
                console.error(err);
                setError("Failed to fetch lap data.");
            } finally {
                setLoading(false);
            }
        };
        fetchLaps();
    }, [year, round, sessionType, drivers]);

    const handleLapClick = (drv, lapNumber) => {
        setSelectedLaps(prev => ({
            ...prev,
            [drv]: lapNumber
        }));
    };

    return (
        <div className="h-full w-full bg-[#0b0d10] border border-[#2b2e36] flex flex-col relative font-sans text-gray-300 shadow-2xl">
            {/* Header */}
            <div className="h-12 min-h-[48px] bg-[#16181d] border-b border-[#2b2e36] flex items-center justify-between px-4 sticky top-0 shrink-0">
                <span className="text-white font-bold tracking-widest text-sm text-blue-400 uppercase">Lap-by-Lap Comparison Matrix</span>
                
                <div className="flex items-center gap-4 ml-auto mr-4">
                    <button 
                        onClick={() => onApplyLaps && onApplyLaps(selectedLaps)}
                        disabled={Object.keys(selectedLaps).length === 0}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1.5 px-6 rounded-sm text-xs tracking-widest transition-colors shadow-lg"
                    >
                        PLOT SELECTED TELEMETRY
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-lg px-2 rounded hover:bg-red-900/30 transition-colors">✕</button>
                </div>
            </div>
            
            {/* Context bar */}
            <div className="px-4 py-2 bg-[#1b1d24] border-b border-[#2b2e36] text-xs flex gap-6 shrink-0 tracking-wide uppercase font-semibold">
                <div><span className="text-gray-500">Year:</span> <span className="text-white ml-1">{year}</span></div>
                <div><span className="text-gray-500">Round:</span> <span className="text-white ml-1">{round}</span></div>
                <div><span className="text-gray-500">Comparisons:</span> <span className="text-white ml-1">{drivers.length > 0 ? drivers.join(' VS ') : 'None'}</span></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 flex gap-4">
                {loading ? (
                    <div className="m-auto text-blue-400 animate-pulse text-sm tracking-widest font-bold">DOWNLOADING LAP MATRIX...</div>
                ) : error ? (
                    <div className="m-auto text-red-500 bg-red-900/20 px-4 py-2 border border-red-500 text-sm font-bold">{error}</div>
                ) : drivers.length === 0 ? (
                    <div className="m-auto text-gray-500 text-sm font-bold uppercase tracking-widest">No Drivers Loaded to Compare</div>
                ) : (
                    drivers.map(drv => (
                        <div key={drv} className="flex-1 bg-[#16181d] border border-[#2b2e36] flex flex-col min-w-[300px] overflow-hidden shadow-xl rounded-sm">
                            <div className="bg-[#1b1d24] text-white text-center font-black text-lg py-2 border-b border-[#2b2e36] shrink-0 tracking-widest relative">
                                {drv}
                                {selectedLaps[drv] && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/50 font-mono tracking-normal">LAP {selectedLaps[drv]}</span>}
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-[#101216] sticky top-0 z-10 text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216]">#</th>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216] text-blue-300">Time</th>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216]">S1</th>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216]">S2</th>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216]">S3</th>
                                            <th className="p-2 border-b border-[#2b2e36] bg-[#101216]">Info</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(lapData[drv] || []).map((lap, i) => (
                                            <tr 
                                                key={i} 
                                                onClick={() => handleLapClick(drv, lap.LapNumber)}
                                                className={`cursor-pointer border-b border-[#2b2e36]/30 transition-colors ${selectedLaps[drv] === lap.LapNumber ? 'bg-green-900/40 hover:bg-green-900/50' : lap.IsPersonalBest ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'hover:bg-[#2b2e36]'}`}
                                            >
                                                <td className={`p-2 font-mono ${selectedLaps[drv] === lap.LapNumber ? 'text-green-300 font-bold' : 'text-gray-500'}`}>{lap.LapNumber}</td>
                                                <td className={`p-2 font-mono font-bold ${selectedLaps[drv] === lap.LapNumber ? 'text-green-100' : lap.IsPersonalBest ? 'text-purple-300' : 'text-gray-200'}`}>{lap.LapTime}</td>
                                                <td className={`p-2 font-mono ${selectedLaps[drv] === lap.LapNumber ? 'text-green-200' : 'text-gray-400'}`}>{lap.Sector1Time}</td>
                                                <td className={`p-2 font-mono ${selectedLaps[drv] === lap.LapNumber ? 'text-green-200' : 'text-gray-400'}`}>{lap.Sector2Time}</td>
                                                <td className={`p-2 font-mono ${selectedLaps[drv] === lap.LapNumber ? 'text-green-200' : 'text-gray-400'}`}>{lap.Sector3Time}</td>
                                                <td className="p-2 flex gap-1">
                                                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${lap.Compound === 'SOFT' ? 'bg-red-600 text-white' : lap.Compound === 'MEDIUM' ? 'bg-yellow-500 text-black' : lap.Compound === 'HARD' ? 'bg-gray-200 text-black' : 'bg-gray-700 text-white'}`} title={`Tyre Life: ${lap.TyreLife} laps`}>
                                                        {lap.Compound?.[0] || 'U'}
                                                    </span>
                                                    {lap.IsPersonalBest && <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-purple-600 text-white">PB</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LapComparisonModal;
