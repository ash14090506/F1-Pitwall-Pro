import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const PitstopAnalysis = ({ year, round, sessionType, onClose }) => {
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;
        
        const fetchStops = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/pitstops?year=${year}&round=${round}&session_type=${sessionType}`);
                setStops(res.data.pitstops || []);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.detail || "Failed to fetch pitstop data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStops();
    }, [year, round, sessionType]);

    // Grouping by driver to show average pit loss and total stops
    const driverSummary = stops.reduce((acc, stop) => {
        if (!acc[stop.driver]) {
            acc[stop.driver] = { count: 0, totalLoss: 0, driver: stop.driver };
        }
        acc[stop.driver].count += 1;
        acc[stop.driver].totalLoss += stop.pit_loss;
        return acc;
    }, {});

    const sortedDrivers = Object.values(driverSummary).sort((a,b) => (a.totalLoss/a.count) - (b.totalLoss/b.count));

    return (
        <div className="h-full w-full bg-[#0b0d10] flex flex-col font-sans text-gray-300 relative border border-[#2b2e36]">
            {onClose && (
                <button onClick={onClose} className="absolute -top-8 right-0 text-white hover:text-red-500 z-50 px-2 py-1 bg-red-900/50 rounded text-xs font-bold border border-red-500/50">✕ CLOSE MODULE</button>
            )}
            <div className="p-4 border-b border-[#2b2e36] bg-[#16181d] shrink-0">
                <h2 className="text-white font-bold tracking-widest text-lg uppercase">Pitstop Global Ledger</h2>
                <div className="text-xs text-gray-500 tracking-wider">Analyzing Total Pit Lane Loss & Strategy Choices</div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex gap-6">
                {loading && <div className="text-blue-400 font-bold text-sm m-auto animate-pulse">COMPILING PIT DATA...</div>}
                {error && <div className="text-red-500 font-bold text-sm m-auto border border-red-500 bg-red-900/20 px-4 py-2">{error}</div>}
                {!loading && !error && stops.length === 0 && <div className="text-gray-500 font-bold text-sm m-auto">NO PITSTOPS RECORDED</div>}
                
                {!loading && !error && stops.length > 0 && (
                    <>
                        <div className="flex-1 min-w-[300px] border border-[#2b2e36] bg-[#16181d] rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-[#1b1d24] text-white text-center font-bold text-sm py-2 border-b border-[#2b2e36]">TEAM PERFORMANCE SUMMARY</div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#101216] sticky top-0 text-gray-500">
                                        <tr>
                                            <th className="p-2 border-b border-[#2b2e36]">Driver</th>
                                            <th className="p-2 border-b border-[#2b2e36]">Stops</th>
                                            <th className="p-2 border-b border-[#2b2e36]">Avg Pit Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDrivers.map(d => (
                                            <tr key={d.driver} className="border-b border-[#2b2e36]/30 hover:bg-[#2b2e36]">
                                                <td className="p-2 font-bold text-gray-200">{d.driver}</td>
                                                <td className="p-2 font-mono text-blue-400">{d.count}</td>
                                                <td className="p-2 font-mono text-purple-400">{(d.totalLoss / d.count).toFixed(3)}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex-[2] min-w-[400px] border border-[#2b2e36] bg-[#16181d] rounded-sm overflow-hidden flex flex-col">
                            <div className="bg-[#1b1d24] text-white text-center font-bold text-sm py-2 border-b border-[#2b2e36]">DETAILED PIT LOG</div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#101216] sticky top-0 text-gray-500 uppercase">
                                        <tr>
                                            <th className="p-2 border-b border-[#2b2e36]">Driver</th>
                                            <th className="p-2 border-b border-[#2b2e36]">Lap #</th>
                                            <th className="p-2 border-b border-[#2b2e36]">Out-Stint</th>
                                            <th className="p-2 border-b border-[#2b2e36]">New Compound</th>
                                            <th className="p-2 border-b border-[#2b2e36]">Pit Lane Loss (s)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stops.map((stop, i) => (
                                            <tr key={i} className="border-b border-[#2b2e36]/30 hover:bg-[#2b2e36]">
                                                <td className="p-2 font-bold text-white">{stop.driver}</td>
                                                <td className="p-2 font-mono text-gray-400">{stop.lap}</td>
                                                <td className="p-2 font-mono text-gray-400">{stop.stint}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${stop.compound === 'SOFT' ? 'bg-red-600 text-white' : stop.compound === 'MEDIUM' ? 'bg-yellow-500 text-black' : stop.compound === 'HARD' ? 'bg-gray-200 text-black' : 'bg-green-600 text-white'}`}>
                                                        {stop.compound}
                                                    </span>
                                                </td>
                                                <td className="p-2 font-mono text-red-400">{stop.pit_loss.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PitstopAnalysis;
