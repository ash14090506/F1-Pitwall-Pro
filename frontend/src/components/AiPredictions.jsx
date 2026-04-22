import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const formatTime = (seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(3);
    return `${m}:${s.padStart(6, '0')}`;
};

const formatDelta = (delta) => {
    if (!delta) return '-';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(3)}s`;
};

export default function AiPredictions({ year, round }) {
    const [activeTab, setActiveTab] = useState('qualifying');
    const [qualiData, setQualiData] = useState(null);
    const [raceData, setRaceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || !round) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [qRes, rRes] = await Promise.all([
                    axios.get(`${API_BASE}/predict_qualifying?year=${year}&round=${round}`).catch(e => e.response),
                    axios.get(`${API_BASE}/predict_race?year=${year}&round=${round}`).catch(e => e.response)
                ]);

                if (qRes && qRes.status === 200) setQualiData(qRes.data);
                if (rRes && rRes.status === 200) setRaceData(rRes.data);
                
                if ((!qRes || qRes.status !== 200) && (!rRes || rRes.status !== 200)) {
                    setError("Failed to fetch predictions. Data might be unavailable.");
                }
            } catch (err) {
                setError("Error connecting to prediction server.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, round]);

    if (loading) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Running ML Models & Simulations...</div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>;

    const renderQualiTab = () => {
        if (!qualiData || !qualiData.predictions || qualiData.predictions.length === 0) {
            return <div className="flex items-center justify-center h-full text-gray-500">Qualifying data unavailable.</div>;
        }

        // Calculate ranks
        let preds = [...qualiData.predictions];
        preds.sort((a, b) => (a.fp2_time || 999) - (b.fp2_time || 999));
        preds.forEach((p, i) => p.fp2_rank = p.fp2_time ? i + 1 : '-');

        preds.sort((a, b) => (a.q_time || a.predicted_q_time || 999) - (b.q_time || b.predicted_q_time || 999));
        preds.forEach((p, i) => p.q_rank = (p.q_time || p.predicted_q_time) ? i + 1 : '-');

        return (
            <div className="flex flex-col h-full bg-[#0b0d10] text-[#e2e8f0] text-xs">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-[#1b1d24] sticky top-0 z-10 border-b border-[#2b2e36]">
                            <tr>
                                <th className="p-2 font-semibold">Driver</th>
                                <th className="p-2 font-semibold">Team</th>
                                <th className="p-2 font-semibold">FP2 Time</th>
                                <th className="p-2 font-semibold text-blue-400">Predicted Time</th>
                                <th className="p-2 font-semibold">Q Time</th>
                                <th className="p-2 font-semibold">Δ FP2</th>
                                <th className="p-2 font-semibold">FP2 Rank</th>
                                <th className="p-2 font-semibold">Q Rank</th>
                                <th className="p-2 font-semibold">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preds.map((row, idx) => {
                                const deltaColor = row.delta_fp2 < 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400';
                                const changeVal = (row.fp2_rank !== '-' && row.q_rank !== '-') ? (row.fp2_rank - row.q_rank) : '-';
                                const changeColor = changeVal > 0 ? 'bg-green-900/20 text-green-400' : changeVal < 0 ? 'bg-red-900/20 text-red-400' : '';
                                
                                return (
                                    <tr key={idx} className="border-b border-[#1b1d24] hover:bg-[#16181d]">
                                        <td className="p-0">
                                            <div className="py-1.5 px-2 text-white font-bold mx-auto w-16" style={{ backgroundColor: `#${row.team_color}` }}>
                                                {row.driver}
                                            </div>
                                        </td>
                                        <td className="p-1.5">{row.team_name}</td>
                                        <td className="p-1.5">{formatTime(row.fp2_time)}</td>
                                        <td className="p-1.5 font-bold text-blue-300">{formatTime(row.predicted_q_time)}</td>
                                        <td className="p-1.5">{formatTime(row.q_time)}</td>
                                        <td className={`p-1.5 font-medium ${deltaColor}`}>{formatDelta(row.delta_fp2)}</td>
                                        <td className="p-1.5">{row.fp2_rank}</td>
                                        <td className="p-1.5">{row.q_rank}</td>
                                        <td className={`p-1.5 font-medium ${changeColor}`}>{changeVal > 0 ? `+${changeVal}` : changeVal}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="h-10 border-t border-[#2b2e36] bg-[#16181d] flex items-center justify-between px-4 text-gray-400">
                    <div>Total Drivers: {preds.length}</div>
                    <div className="flex gap-6">
                        <span>Model R²: <strong className="text-white">{(qualiData.r2 || 0).toFixed(4)}</strong> (Samples: {preds.length})</span>
                        <span>Model MAE: <strong className="text-white">{(qualiData.mae || 0).toFixed(3)}s</strong> (Avg Error)</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderRaceTab = () => {
        if (!raceData || !raceData.predictions || raceData.predictions.length === 0) {
            return <div className="flex items-center justify-center h-full text-gray-500">Race simulation data unavailable.</div>;
        }

        const preds = [...raceData.predictions].sort((a, b) => a.expected_finish - b.expected_finish);

        return (
            <div className="flex flex-col h-full bg-[#0b0d10] text-[#e2e8f0] text-xs">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-[#1b1d24] sticky top-0 z-10 border-b border-[#2b2e36]">
                            <tr>
                                <th className="p-2 font-semibold">Driver</th>
                                <th className="p-2 font-semibold">Team</th>
                                <th className="p-2 font-semibold">Starting Grid</th>
                                <th className="p-2 font-semibold text-purple-400">Expected Finish</th>
                                <th className="p-2 font-semibold">Actual Finish</th>
                                <th className="p-2 font-semibold">Podium Prob.</th>
                                <th className="p-2 font-semibold">Win Prob.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preds.map((row, idx) => {
                                return (
                                    <tr key={idx} className="border-b border-[#1b1d24] hover:bg-[#16181d]">
                                        <td className="p-0">
                                            <div className="py-1.5 px-2 text-white font-bold mx-auto w-16" style={{ backgroundColor: `#${row.team_color}` }}>
                                                {row.driver}
                                            </div>
                                        </td>
                                        <td className="p-1.5">{row.team_name}</td>
                                        <td className="p-1.5 font-medium">{row.start_pos}</td>
                                        <td className="p-1.5 font-bold text-purple-300">{row.expected_finish.toFixed(1)}</td>
                                        <td className="p-1.5">{row.actual_finish || '-'}</td>
                                        <td className="p-1.5">{(row.podium_prob * 100).toFixed(1)}%</td>
                                        <td className="p-1.5">{(row.win_prob * 100).toFixed(1)}%</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="h-10 border-t border-[#2b2e36] bg-[#16181d] flex items-center justify-between px-4 text-gray-400">
                    <div>Track: <strong className="text-white">{raceData.track}</strong></div>
                    <div>Overtaking Coefficient: <strong className="text-white">{raceData.overtake_coefficient}</strong> (Monte Carlo N=1000)</div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#0b0d10]">
            <div className="flex border-b border-[#2b2e36] bg-[#16181d]">
                <button 
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${activeTab === 'qualifying' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#1b1d24]' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('qualifying')}
                >
                    FP2 → Qualifying
                </button>
                <button 
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${activeTab === 'race' ? 'text-purple-400 border-b-2 border-purple-400 bg-[#1b1d24]' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('race')}
                >
                    Qualifying → Race
                </button>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === 'qualifying' ? renderQualiTab() : renderRaceTab()}
            </div>
        </div>
    );
}
