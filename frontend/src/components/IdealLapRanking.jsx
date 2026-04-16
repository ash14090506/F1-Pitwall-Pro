import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const formatLapTime = (sec) => {
    if (!sec) return "-";
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3);
    return `${m}:${s.padStart(6, '0')}`;
};

const formatDelta = (val) => {
    if (val === null || val === undefined) return "-";
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(3)}s`;
};

const deltaColor = (val, isBest) => {
    if (isBest) return 'text-[#c026d3]'; // Purple for overall best
    if (val === null || val === undefined) return 'text-gray-500';
    if (val < 0.05) return 'text-green-400';
    if (val < 0.15) return 'text-yellow-400';
    if (val < 0.3) return 'text-orange-400';
    return 'text-red-400';
};

const gapColor = (val) => {
    if (val === null || val === undefined) return 'text-gray-500';
    if (val < 0) return 'text-green-400';
    if (val < 0.1) return 'text-green-300';
    if (val < 0.3) return 'text-yellow-400';
    if (val < 0.5) return 'text-orange-400';
    return 'text-red-400';
};

const IdealLapRanking = ({ year, round, sessionType, allDrivers }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round || !sessionType) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}/ideal_lap`, {
                    params: { year, round, session_type: sessionType }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch ideal lap data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, round, sessionType]);

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Computing theoretical best laps...</div>;
    if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;
    if (!data) return <div className="flex h-full items-center justify-center text-gray-500">No data available.</div>;

    const { ranking, session_fastest } = data;

    const getDriverColor = (drv) => {
        if (!allDrivers) return '#e2e8f0';
        const info = allDrivers.find(d => d.abbreviation === drv);
        if (info && info.team_color) return info.team_color.startsWith('#') ? info.team_color : `#${info.team_color}`;
        return '#e2e8f0';
    };

    // Summary stats
    const fastestIdeal = ranking.length > 0 ? ranking[0] : null;
    const idealRange = ranking.length > 1 ? (ranking[ranking.length - 1].ideal_lap - ranking[0].ideal_lap) : 0;
    const perfectLapCount = ranking.filter(d => d.s1_is_best || d.s2_is_best || d.s3_is_best).length;

    return (
        <div className="h-full w-full flex flex-col bg-[#0b0d10] overflow-hidden">
            {/* Dual Panel Layout */}
            <div className="flex-1 flex gap-3 p-3 overflow-hidden">
                
                {/* LEFT: Sector Comparison Table */}
                <div className="flex-1 flex flex-col bg-[#16181d] border border-[#2b2e36] rounded shadow-lg overflow-hidden">
                    <div className="h-7 bg-[#2b2e36]/40 border-b border-[#2b2e36] px-3 flex items-center text-xs font-bold text-gray-300 shrink-0">
                        Sector Comparison — {year} {sessionType}
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-[#1b1d24] border-b border-[#2b2e36] text-gray-400 z-10">
                                <tr>
                                    <th className="px-2 py-1.5 w-8">#</th>
                                    <th className="px-2 py-1.5">Driver</th>
                                    <th className="px-2 py-1.5 text-center">S1 Delta</th>
                                    <th className="px-2 py-1.5 text-center">S2 Delta</th>
                                    <th className="px-2 py-1.5 text-center">S3 Delta</th>
                                    <th className="px-2 py-1.5 text-right">Cumulative</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((d, i) => {
                                    const cumDelta = d.s1_delta + d.s2_delta + d.s3_delta;
                                    return (
                                        <tr key={d.driver} className="border-b border-[#2b2e36]/40 hover:bg-[#1b1d24]">
                                            <td className="px-2 py-1 text-gray-500">{i + 1}</td>
                                            <td className="px-2 py-1 font-bold" style={{ color: getDriverColor(d.driver) }}>{d.driver}</td>
                                            <td className={`px-2 py-1 text-center ${deltaColor(d.s1_delta, d.s1_is_best)}`}>
                                                {d.s1_is_best ? '✓' : formatDelta(d.s1_delta)}
                                            </td>
                                            <td className={`px-2 py-1 text-center ${deltaColor(d.s2_delta, d.s2_is_best)}`}>
                                                {d.s2_is_best ? '✓' : formatDelta(d.s2_delta)}
                                            </td>
                                            <td className={`px-2 py-1 text-center ${deltaColor(d.s3_delta, d.s3_is_best)}`}>
                                                {d.s3_is_best ? '✓' : formatDelta(d.s3_delta)}
                                            </td>
                                            <td className={`px-2 py-1 text-right font-semibold ${gapColor(cumDelta)}`}>
                                                {cumDelta < 0.001 ? '—' : formatDelta(cumDelta)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: Ideal Lap Ranking Table */}
                <div className="flex-1 flex flex-col bg-[#16181d] border border-[#2b2e36] rounded shadow-lg overflow-hidden">
                    <div className="h-7 bg-[#2b2e36]/40 border-b border-[#2b2e36] px-3 flex items-center text-xs font-bold text-gray-300 shrink-0">
                        Ideal Lap Ranking — {year} {sessionType}
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-[#1b1d24] border-b border-[#2b2e36] text-gray-400 z-10">
                                <tr>
                                    <th className="px-2 py-1.5 w-8">Pos</th>
                                    <th className="px-2 py-1.5">Driver</th>
                                    <th className="px-2 py-1.5 text-right">Fastest Lap</th>
                                    <th className="px-2 py-1.5 text-right">Ideal Lap</th>
                                    <th className="px-2 py-1.5 text-right">Gap</th>
                                    <th className="px-2 py-1.5 text-right">Gap to P1</th>
                                    <th className="px-2 py-1.5 text-center">Sectors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((d, i) => (
                                    <tr key={d.driver} className="border-b border-[#2b2e36]/40 hover:bg-[#1b1d24]">
                                        <td className="px-2 py-1 text-gray-500 font-semibold">{i + 1}</td>
                                        <td className="px-2 py-1 font-bold" style={{ color: getDriverColor(d.driver) }}>{d.driver}</td>
                                        <td className="px-2 py-1 text-right text-gray-300">{d.actual_fastest ? formatLapTime(d.actual_fastest) : '-'}</td>
                                        <td className="px-2 py-1 text-right text-white font-semibold">{formatLapTime(d.ideal_lap)}</td>
                                        <td className={`px-2 py-1 text-right ${d.gap !== null && d.gap > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {d.gap !== null ? formatDelta(d.gap) : '-'}
                                        </td>
                                        <td className={`px-2 py-1 text-right ${gapColor(d.gap_to_session_fastest)}`}>
                                            {d.gap_to_session_fastest !== null ? formatDelta(d.gap_to_session_fastest) : '-'}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <span className={d.s1_is_best ? 'text-[#c026d3]' : 'text-gray-600'}>✓</span>
                                            <span className={d.s2_is_best ? 'text-[#c026d3]' : 'text-gray-600'}>✓</span>
                                            <span className={d.s3_is_best ? 'text-[#c026d3]' : 'text-gray-600'}>✓</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="h-14 shrink-0 bg-[#16181d] border-t border-[#2b2e36] px-4 flex items-center gap-8 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <span>Total Drivers: <strong className="text-white">{ranking.length}</strong></span>
                </div>
                <div>
                    Session Fastest Lap: <strong className="text-white">{session_fastest ? formatLapTime(session_fastest) : '-'}</strong>
                    {fastestIdeal && <span className="ml-1 text-gray-500">({fastestIdeal.driver})</span>}
                </div>
                <div>
                    Fastest Ideal Lap: <strong className="text-green-400">{fastestIdeal ? formatLapTime(fastestIdeal.ideal_lap) : '-'}</strong>
                </div>
                <div>
                    Ideal Lap Range: <strong className="text-yellow-400">{idealRange.toFixed(3)}s</strong>
                    <span className="ml-1 text-gray-500">({fastestIdeal ? formatLapTime(fastestIdeal.ideal_lap) : ''} – {ranking.length > 1 ? formatLapTime(ranking[ranking.length - 1].ideal_lap) : ''})</span>
                </div>
                <div>
                    Perfect Lap Rate: <strong className="text-white">{perfectLapCount}/{ranking.length}</strong>
                </div>
            </div>
        </div>
    );
};

export default IdealLapRanking;
