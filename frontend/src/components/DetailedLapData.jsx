import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const DetailedLapData = ({ year, round, sessionType, selectedDrivers }) => {
    const [laps, setLaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            setLaps([]);
            return;
        }

        const fetchLaps = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/laps`, {
                    params: {
                        year, round, session_type: sessionType,
                        drivers: selectedDrivers.join(',')
                    }
                });
                setLaps(res.data.laps || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch lap data.");
            } finally {
                setLoading(false);
            }
        };

        fetchLaps();
    }, [year, round, sessionType, selectedDrivers.join(',')]);

    const bests = useMemo(() => {
        if (!laps.length) return null;
        const validLaps = laps.filter(l => l.lap_time_sec);
        if (!validLaps.length) return null;
        
        return {
            lap: Math.min(...validLaps.map(l => l.lap_time_sec)),
            s1: Math.min(...validLaps.filter(l => l.s1_sec).map(l => l.s1_sec)),
            s2: Math.min(...validLaps.filter(l => l.s2_sec).map(l => l.s2_sec)),
            s3: Math.min(...validLaps.filter(l => l.s3_sec).map(l => l.s3_sec)),
            st: Math.max(...validLaps.filter(l => l.speed_st).map(l => l.speed_st))
        };
    }, [laps]);

    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Please select drivers to view lap data.</div>;
    }

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Loading lap data...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;

    const formatTime = (sec) => {
        if (!sec) return "-";
        const m = Math.floor(sec / 60);
        const s = (sec % 60).toFixed(3);
        return m > 0 ? `${m}:${s.padStart(6, '0')}` : s;
    };

    const getLapColor = (lap) => {
        if (!lap.lap_time_sec) return "text-red-400"; // Invalid/Inlap
        if (lap.pit_out_time) return "text-yellow-400"; // Outlap
        if (bests && lap.lap_time_sec === bests.lap) return "text-[#c026d3] font-bold"; // Overall best (Purple)
        if (lap.is_personal_best) return "text-[#22c55e] font-medium"; // Personal Best (Green)
        return "text-gray-300";
    };

    const getSectorColor = (val, best) => {
        if (!val) return "text-gray-500";
        if (best && val === best) return "text-[#c026d3] font-bold"; // Purple
        return "text-gray-300";
    };

    const getCompoundColor = (comp) => {
        switch (comp) {
            case 'SOFT': return 'text-red-500';
            case 'MEDIUM': return 'text-yellow-500';
            case 'HARD': return 'text-white';
            case 'INTERMEDIATE': return 'text-green-500';
            case 'WET': return 'text-blue-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="h-full w-full overflow-auto bg-[#0b0d10]">
            <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#16181d] border-b border-[#2b2e36] text-gray-400 shadow z-10">
                    <tr>
                        <th className="px-3 py-2">Driver</th>
                        <th className="px-3 py-2">Lap</th>
                        <th className="px-3 py-2">Lap Time</th>
                        <th className="px-3 py-2">S1</th>
                        <th className="px-3 py-2">S2</th>
                        <th className="px-3 py-2">S3</th>
                        <th className="px-3 py-2">Speed ST</th>
                        <th className="px-3 py-2">Compound</th>
                        <th className="px-3 py-2">Tyre Age</th>
                    </tr>
                </thead>
                <tbody>
                    {laps.map((lap, i) => (
                        <tr key={i} className="border-b border-[#2b2e36]/50 hover:bg-[#1b1d24]">
                            <td className="px-3 py-1 font-semibold text-gray-200">{lap.driver}</td>
                            <td className="px-3 py-1 text-gray-400">{lap.lap_number}</td>
                            <td className={`px-3 py-1 ${getLapColor(lap)}`}>
                                {lap.lap_time_str ? lap.lap_time_str.substring(3, 11) : "IN/OUT LAP"}
                            </td>
                            <td className={`px-3 py-1 ${getSectorColor(lap.s1_sec, bests?.s1)}`}>{lap.s1_sec ? lap.s1_sec.toFixed(3) : '-'}</td>
                            <td className={`px-3 py-1 ${getSectorColor(lap.s2_sec, bests?.s2)}`}>{lap.s2_sec ? lap.s2_sec.toFixed(3) : '-'}</td>
                            <td className={`px-3 py-1 ${getSectorColor(lap.s3_sec, bests?.s3)}`}>{lap.s3_sec ? lap.s3_sec.toFixed(3) : '-'}</td>
                            <td className="px-3 py-1 text-blue-300">{lap.speed_st ? lap.speed_st.toFixed(0) : '-'}</td>
                            <td className={`px-3 py-1 font-bold ${getCompoundColor(lap.compound)}`}>{lap.compound}</td>
                            <td className="px-3 py-1 text-gray-400">{lap.tyre_life}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DetailedLapData;
