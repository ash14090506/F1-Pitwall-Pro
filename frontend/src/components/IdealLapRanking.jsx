import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const formatLapTime = (sec) => {
    if (!sec && sec !== 0) return "-";
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3);
    return `${m}:${s.padStart(6, '0')}`;
};

const formatDelta = (val) => {
    if (val === null || val === undefined) return "-";
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(3)}s`;
};

/* ─── Color Utilities ─── */
const sectorCellColor = (val, isBest) => {
    if (isBest) return '#c026d3';            // Purple for overall best sector
    if (val === null || val === undefined) return '#4b5563';
    if (val < 0.05) return '#34d399';        // Green – basically matched
    if (val < 0.15) return '#fbbf24';        // Yellow – close
    if (val < 0.3)  return '#fb923c';        // Orange – noticeable loss
    return '#f87171';                        // Red – significant loss
};

const sectorBgColor = (val, isBest) => {
    if (isBest) return 'rgba(192,38,211,0.18)';
    if (val === null || val === undefined) return 'transparent';
    if (val < 0.05) return 'rgba(52,211,153,0.10)';
    if (val < 0.15) return 'rgba(251,191,36,0.10)';
    if (val < 0.3)  return 'rgba(251,146,60,0.10)';
    return 'rgba(248,113,113,0.10)';
};

const gapColor = (val) => {
    if (val === null || val === undefined) return '#4b5563';
    if (val < 0) return '#34d399';
    if (val < 0.1) return '#6ee7b7';
    if (val < 0.3) return '#fbbf24';
    if (val < 0.5) return '#fb923c';
    return '#f87171';
};

/* ─── Cumulative Bar Gradient ─── */
const cumulativeBarGradient = (cumDelta, maxCum) => {
    if (cumDelta < 0.001) return 'transparent';
    const ratio = Math.min(cumDelta / Math.max(maxCum, 0.6), 1);
    // Green → Yellow → Orange → Red gradient based on magnitude
    if (ratio < 0.25) return `linear-gradient(90deg, rgba(52,211,153,0.45) 0%, rgba(52,211,153,0.08) ${ratio * 100 * 4}%)`;
    if (ratio < 0.5)  return `linear-gradient(90deg, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0.08) ${ratio * 100 * 2}%)`;
    if (ratio < 0.75) return `linear-gradient(90deg, rgba(251,146,60,0.45) 0%, rgba(251,146,60,0.08) ${ratio * 133}%)`;
    return `linear-gradient(90deg, rgba(248,113,113,0.50) 0%, rgba(248,113,113,0.08) ${ratio * 100}%)`;
};

const cumulativeBarColor = (cumDelta) => {
    if (cumDelta < 0.001) return '#a78bfa';   // Perfect – no delta
    if (cumDelta < 0.1) return '#34d399';
    if (cumDelta < 0.2) return '#fbbf24';
    if (cumDelta < 0.35) return '#fb923c';
    return '#f87171';
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

    const getDriverColor = (drv) => {
        if (!allDrivers) return '#e2e8f0';
        const info = allDrivers.find(d => d.abbreviation === drv);
        if (info && info.team_color) return info.team_color.startsWith('#') ? info.team_color : `#${info.team_color}`;
        return '#e2e8f0';
    };

    /* Derived stats */
    const stats = useMemo(() => {
        if (!data || !data.ranking || data.ranking.length === 0) return null;
        const { ranking, session_fastest } = data;
        const fastestIdeal = ranking[0];
        const lastIdeal = ranking[ranking.length - 1];
        const idealRange = lastIdeal.ideal_lap - fastestIdeal.ideal_lap;
        const perfectCount = ranking.filter(d => d.gap !== null && d.gap < 0.01).length;
        const avgGap = ranking.reduce((sum, d) => sum + (d.gap || 0), 0) / ranking.length;

        // Who actually set the session fastest lap?
        let sessionFastestDriver = null;
        if (session_fastest) {
            const match = ranking.find(d => d.actual_fastest && Math.abs(d.actual_fastest - session_fastest) < 0.002);
            if (match) sessionFastestDriver = match.driver;
        }

        // Find which driver set the fastest in each sector
        const findSectorLeader = (sectorProp) => {
            const best = ranking.find(d => d[`${sectorProp}_is_best`]);
            return best ? best.driver : null;
        };

        return {
            fastestIdeal,
            lastIdeal,
            idealRange,
            perfectCount,
            avgGap,
            sessionFastestDriver,
            sessionFastest: session_fastest,
            s1Leader: findSectorLeader('s1'),
            s2Leader: findSectorLeader('s2'),
            s3Leader: findSectorLeader('s3'),
        };
    }, [data]);

    const maxCumDelta = useMemo(() => {
        if (!data || !data.ranking) return 0.6;
        return Math.max(...data.ranking.map(d => d.s1_delta + d.s2_delta + d.s3_delta), 0.6);
    }, [data]);

    /* ─── Render states ─── */
    if (loading) return (
        <div className="flex h-full items-center justify-center bg-[#0b0d10]">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 32, height: 32, border: '3px solid #2b2e36', borderTop: '3px solid #c026d3',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ color: '#94a3b8', fontSize: 12, letterSpacing: '0.05em' }}>Computing theoretical best laps…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
    if (error) return <div className="flex h-full items-center justify-center text-red-500 text-sm">{error}</div>;
    if (!data) return <div className="flex h-full items-center justify-center text-gray-500 text-sm">No data available.</div>;

    const { ranking } = data;

    return (
        <div style={{
            height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
            background: '#0b0d10', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            {/* ═══ Dual Panel Layout ═══ */}
            <div style={{ flex: 1, display: 'flex', gap: 10, padding: 10, overflow: 'hidden', minHeight: 0 }}>

                {/* ─── LEFT: Sector Comparison ─── */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: '#16181d', border: '1px solid #2b2e36', borderRadius: 4,
                    overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
                }}>
                    {/* Header */}
                    <div style={{
                        height: 30, background: 'linear-gradient(90deg, rgba(43,46,54,0.6), rgba(43,46,54,0.2))',
                        borderBottom: '1px solid #2b2e36', padding: '0 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d1d5db', letterSpacing: '0.02em' }}>
                            Sector Comparison — {year} {sessionType}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, color: '#6b7280' }}>
                            <span>🟣 Best Sector</span>
                            <span>✓ Personal Best</span>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                            <thead>
                                <tr style={{
                                    position: 'sticky', top: 0, zIndex: 10,
                                    background: '#1b1d24', borderBottom: '1px solid #2b2e36'
                                }}>
                                    <th style={thStyle}>#</th>
                                    <th style={{ ...thStyle, width: 48 }}>Pos</th>
                                    <th style={thStyle}>Driver</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>S1 Delta</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>S2 Delta</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>S3 Delta</th>
                                    <th style={{ ...thStyle, textAlign: 'right', minWidth: 140 }}>Cumulative Delta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((d, i) => {
                                    const cumDelta = d.s1_delta + d.s2_delta + d.s3_delta;
                                    const drvColor = getDriverColor(d.driver);
                                    return (
                                        <tr key={d.driver} style={{
                                            borderBottom: '1px solid rgba(43,46,54,0.4)',
                                            transition: 'background 0.15s',
                                            cursor: 'default'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,29,36,0.8)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ ...tdStyle, color: '#6b7280', fontWeight: 600, width: 28 }}>{i + 1}</td>
                                            <td style={{ ...tdStyle, width: 48 }}>
                                                {/* Driver color badge */}
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    background: drvColor, color: '#fff', fontWeight: 800,
                                                    fontSize: 10, borderRadius: 3, padding: '2px 6px',
                                                    minWidth: 24, textAlign: 'center',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                                    boxShadow: `0 0 6px ${drvColor}40`
                                                }}>
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: drvColor, letterSpacing: '0.03em' }}>
                                                {d.driver}
                                            </td>
                                            {/* S1 Delta */}
                                            <td style={{
                                                ...tdStyle, textAlign: 'center',
                                                color: sectorCellColor(d.s1_delta, d.s1_is_best),
                                                background: sectorBgColor(d.s1_delta, d.s1_is_best),
                                                fontWeight: d.s1_is_best ? 800 : 600
                                            }}>
                                                {d.s1_is_best ? '✓' : formatDelta(d.s1_delta)}
                                            </td>
                                            {/* S2 Delta */}
                                            <td style={{
                                                ...tdStyle, textAlign: 'center',
                                                color: sectorCellColor(d.s2_delta, d.s2_is_best),
                                                background: sectorBgColor(d.s2_delta, d.s2_is_best),
                                                fontWeight: d.s2_is_best ? 800 : 600
                                            }}>
                                                {d.s2_is_best ? '✓' : formatDelta(d.s2_delta)}
                                            </td>
                                            {/* S3 Delta */}
                                            <td style={{
                                                ...tdStyle, textAlign: 'center',
                                                color: sectorCellColor(d.s3_delta, d.s3_is_best),
                                                background: sectorBgColor(d.s3_delta, d.s3_is_best),
                                                fontWeight: d.s3_is_best ? 800 : 600
                                            }}>
                                                {d.s3_is_best ? '✓' : formatDelta(d.s3_delta)}
                                            </td>
                                            {/* Cumulative Delta with Gradient Bar */}
                                            <td style={{ ...tdStyle, textAlign: 'right', padding: 0 }}>
                                                <div style={{
                                                    position: 'relative', height: '100%', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'flex-end',
                                                    padding: '4px 10px'
                                                }}>
                                                    {/* Background gradient bar */}
                                                    <div style={{
                                                        position: 'absolute', left: 0, top: 2, bottom: 2,
                                                        width: `${Math.min((cumDelta / Math.max(maxCumDelta, 0.6)) * 100, 100)}%`,
                                                        background: cumulativeBarGradient(cumDelta, maxCumDelta),
                                                        borderRadius: 2,
                                                        transition: 'width 0.4s ease'
                                                    }} />
                                                    <span style={{
                                                        position: 'relative', zIndex: 2,
                                                        color: cumulativeBarColor(cumDelta),
                                                        fontWeight: 700, fontSize: 11,
                                                        fontVariantNumeric: 'tabular-nums'
                                                    }}>
                                                        {cumDelta < 0.001 ? '—' : formatDelta(cumDelta)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── RIGHT: Ideal Lap Ranking ─── */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: '#16181d', border: '1px solid #2b2e36', borderRadius: 4,
                    overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
                }}>
                    {/* Header */}
                    <div style={{
                        height: 30, background: 'linear-gradient(90deg, rgba(43,46,54,0.6), rgba(43,46,54,0.2))',
                        borderBottom: '1px solid #2b2e36', padding: '0 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d1d5db', letterSpacing: '0.02em' }}>
                            Ideal Lap Ranking Table — {year} {sessionType}
                        </span>
                        <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#6b7280' }}>
                            <span style={{ color: '#34d399' }}>■</span> On Pace
                            <span style={{ color: '#fbbf24' }}>■</span> Close
                            <span style={{ color: '#f87171' }}>■</span> Deficit
                        </div>
                    </div>

                    {/* Table Body */}
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                            <thead>
                                <tr style={{
                                    position: 'sticky', top: 0, zIndex: 10,
                                    background: '#1b1d24', borderBottom: '1px solid #2b2e36'
                                }}>
                                    <th style={thStyle}>Pos</th>
                                    <th style={thStyle}>Driver</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Fastest Lap</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Ideal Lap</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Gap</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Gap to Session Fastest</th>
                                    <th style={{ ...thStyle, textAlign: 'center', width: 70 }}>Sectors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((d, i) => {
                                    const drvColor = getDriverColor(d.driver);
                                    const gapVal = d.gap;
                                    const gapSF = d.gap_to_session_fastest;
                                    const isP1 = i === 0;

                                    return (
                                        <tr key={d.driver} style={{
                                            borderBottom: '1px solid rgba(43,46,54,0.4)',
                                            transition: 'background 0.15s',
                                            cursor: 'default',
                                            background: isP1 ? 'rgba(192,38,211,0.04)' : 'transparent'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,29,36,0.8)'}
                                        onMouseLeave={e => e.currentTarget.style.background = isP1 ? 'rgba(192,38,211,0.04)' : 'transparent'}
                                        >
                                            <td style={{ ...tdStyle, width: 36, fontWeight: 700 }}>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    background: drvColor, color: '#fff', fontWeight: 800,
                                                    fontSize: 10, borderRadius: 3, padding: '2px 6px',
                                                    minWidth: 24, textAlign: 'center',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                                    boxShadow: `0 0 6px ${drvColor}40`
                                                }}>
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: drvColor, letterSpacing: '0.03em' }}>
                                                {d.driver}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>
                                                {d.actual_fastest ? formatLapTime(d.actual_fastest) : '-'}
                                            </td>
                                            <td style={{
                                                ...tdStyle, textAlign: 'right', color: '#ffffff', fontWeight: 700,
                                                fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {formatLapTime(d.ideal_lap)}
                                            </td>
                                            {/* Gap (actual vs ideal = time left on the table) */}
                                            <td style={{
                                                ...tdStyle, textAlign: 'right',
                                                color: gapVal !== null ? (gapVal > 0.2 ? '#fb923c' : gapVal > 0.05 ? '#fbbf24' : '#34d399') : '#4b5563',
                                                fontWeight: 600, fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {gapVal !== null ? formatDelta(gapVal) : '-'}
                                            </td>
                                            {/* Gap to Session Fastest */}
                                            <td style={{
                                                ...tdStyle, textAlign: 'right',
                                                color: gapColor(gapSF),
                                                fontWeight: 600, fontVariantNumeric: 'tabular-nums'
                                            }}>
                                                {gapSF !== null ? formatDelta(gapSF) : '-'}
                                            </td>
                                            {/* Sector Best Indicators */}
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                    <SectorDot isBest={d.s1_is_best} label="S1" />
                                                    <SectorDot isBest={d.s2_is_best} label="S2" />
                                                    <SectorDot isBest={d.s3_is_best} label="S3" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ═══ Summary Footer ═══ */}
            {stats && (
                <div style={{
                    height: 52, flexShrink: 0, background: '#16181d', borderTop: '1px solid #2b2e36',
                    padding: '0 16px', display: 'flex', alignItems: 'center', gap: 0, fontSize: 11, color: '#9ca3af',
                    overflow: 'hidden'
                }}>
                    {/* Left stats group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' }} />
                            <span>Race Statistics Summary</span>
                        </div>
                        <StatItem label="Total Drivers" value={ranking.length} />
                        <StatItem label="Session Fastest Lap" value={
                            stats.sessionFastest
                                ? `${formatLapTime(stats.sessionFastest)} (${stats.sessionFastestDriver || '?'}${stats.sessionFastestDriver ? '' : ''})`
                                : '-'
                        } color="#ffffff" />
                    </div>
                    {/* Right stats group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, justifyContent: 'flex-end' }}>
                        <StatItem label="Fastest Ideal Lap" value={
                            `${formatLapTime(stats.fastestIdeal.ideal_lap)} (${stats.fastestIdeal.driver})`
                        } color="#34d399" />
                        <StatItem label="Average Gap" value={`${stats.avgGap.toFixed(3)}s`} color="#fbbf24" />
                        <StatItem label="Ideal Lap Range" value={
                            `${stats.idealRange.toFixed(3)}s (${formatLapTime(stats.fastestIdeal.ideal_lap)} – ${formatLapTime(stats.lastIdeal.ideal_lap)})`
                        } color="#fb923c" />
                        <StatItem label="Perfect Lap Rate" value={`${stats.perfectCount}/${ranking.length}`} color="#ffffff" />
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Sub-components ─── */

const SectorDot = ({ isBest, label }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 16, height: 16, borderRadius: 3,
        background: isBest ? 'rgba(192,38,211,0.25)' : 'rgba(75,85,99,0.15)',
        border: `1px solid ${isBest ? '#c026d3' : '#374151'}`,
        transition: 'all 0.2s',
        position: 'relative'
    }} title={`${label}: ${isBest ? 'Overall Best' : 'Not best'}`}>
        <span style={{
            fontSize: 10, fontWeight: 700,
            color: isBest ? '#c026d3' : '#4b5563'
        }}>✓</span>
        {isBest && <div style={{
            position: 'absolute', inset: -2, borderRadius: 5,
            border: '1px solid rgba(192,38,211,0.3)',
            animation: 'sectorPulse 2s ease-in-out infinite'
        }} />}
    </div>
);

const StatItem = ({ label, value, color = '#ffffff' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 9.5, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontWeight: 700, color, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
);

/* ─── Shared Styles ─── */
const thStyle = {
    padding: '5px 8px',
    fontSize: 10.5,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
};

const tdStyle = {
    padding: '4px 8px',
    whiteSpace: 'nowrap'
};

export default IdealLapRanking;
