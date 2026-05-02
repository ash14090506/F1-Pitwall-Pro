import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Zap, Trophy, Clock, ChevronUp, ChevronDown, Info, TrendingDown } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(secs) {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(3).padStart(6, '0');
  return m > 0 ? `${m}:${s}` : `${s}`;
}
function fmtDelta(v) {
  if (v == null) return '';
  return (v > 0 ? '+' : '') + v.toFixed(3) + 's';
}
function tc(color) {
  return color ? (color.startsWith('#') ? color : `#${color}`) : '#888';
}
function hexToRgb(hex) {
  const c = tc(hex).replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

// ── Animated number counter ───────────────────────────────────────────────────
function AnimatedTime({ target, duration = 900 }) {
  const [current, setCurrent] = useState(null);
  const rafRef = useRef();
  const startRef = useRef();

  useEffect(() => {
    if (target == null) { setCurrent(null); return; }
    const start = performance.now();
    startRef.current = start;
    const from = current ?? (target + 1.5);
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return <span>{fmt(current)}</span>;
}

// ── SVG Interactive Track Map ─────────────────────────────────────────────────
function TheoreticalTrackMap({ trackSectors, fantasy, hoveredSector, onSectorHover }) {
  const W = 560, H = 380, PAD = 36;
  const [tooltip, setTooltip] = useState(null);

  const allX = [], allY = [];
  ['s1', 's2', 's3'].forEach(k => {
    trackSectors[k]?.x?.forEach(v => allX.push(v));
    trackSectors[k]?.y?.forEach(v => allY.push(v));
  });

  if (!allX.length) return (
    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
      Track coordinates unavailable
    </div>
  );

  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const scaleX = (W - PAD * 2) / (maxX - minX || 1);
  const scaleY = (H - PAD * 2) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);
  const offX = PAD + ((W - PAD * 2) - (maxX - minX) * scale) / 2;
  const offY = PAD + ((H - PAD * 2) - (maxY - minY) * scale) / 2;

  const toSvgPts = (xs, ys) => xs
    .map((x, i) => {
      const sx = offX + (x - minX) * scale;
      const sy = H - (offY + (ys[i] - minY) * scale);
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' L ');

  const midPoint = (xs, ys) => {
    if (!xs?.length) return null;
    const mid = Math.floor(xs.length / 2);
    return {
      x: offX + (xs[mid] - minX) * scale,
      y: H - (offY + (ys[mid] - minY) * scale),
    };
  };

  const sectorInfo = {
    s1: { label: 'S1', driver: fantasy.s1_driver, time: fantasy.s1_time, color: tc(fantasy.s1_color) },
    s2: { label: 'S2', driver: fantasy.s2_driver, time: fantasy.s2_time, color: tc(fantasy.s2_color) },
    s3: { label: 'S3', driver: fantasy.s3_driver, time: fantasy.s3_time, color: tc(fantasy.s3_color) },
  };

  return (
    <div className="relative w-full h-full">
      <svg
        width="100%" height="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        <defs>
          {['s1', 's2', 's3'].map(k => {
            const info = sectorInfo[k];
            const rgb = hexToRgb(info.color);
            return (
              <filter key={`glow-${k}`} id={`glow-${k}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={hoveredSector === k ? 5 : 2.5} result="blur" />
                <feFlood floodColor={info.color} floodOpacity={hoveredSector === k ? 0.9 : 0.6} result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            );
          })}
        </defs>

        {/* Background track ghost */}
        {['s1', 's2', 's3'].map(k => {
          const seg = trackSectors[k];
          if (!seg?.x?.length) return null;
          return (
            <path key={`bg-${k}`}
              d={`M ${toSvgPts(seg.x, seg.y)}`}
              fill="none" stroke="#1a1e2a" strokeWidth={12}
              strokeLinecap="round" strokeLinejoin="round"
            />
          );
        })}

        {/* Colored sector lines */}
        {['s1', 's2', 's3'].map(k => {
          const seg = trackSectors[k];
          if (!seg?.x?.length) return null;
          const info = sectorInfo[k];
          const isHovered = hoveredSector === k;
          const isOtherHovered = hoveredSector && hoveredSector !== k;
          return (
            <path key={`col-${k}`}
              d={`M ${toSvgPts(seg.x, seg.y)}`}
              fill="none"
              stroke={info.color}
              strokeWidth={isHovered ? 8 : isOtherHovered ? 3 : 5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${k})`}
              opacity={isOtherHovered ? 0.35 : 1}
              style={{
                transition: 'stroke-width 0.2s, opacity 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={() => onSectorHover(k)}
              onMouseLeave={() => onSectorHover(null)}
            />
          );
        })}

        {/* Sector badge labels */}
        {['s1', 's2', 's3'].map(k => {
          const seg = trackSectors[k];
          const info = sectorInfo[k];
          const mp = midPoint(seg?.x, seg?.y);
          if (!mp) return null;
          const isHovered = hoveredSector === k;
          return (
            <g key={`badge-${k}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onSectorHover(k)}
              onMouseLeave={() => onSectorHover(null)}>
              <rect
                x={mp.x - 34} y={mp.y - 16} width={68} height={26} rx={6}
                fill="#0b0d10" fillOpacity={0.92}
                stroke={info.color} strokeWidth={isHovered ? 2 : 1.2}
                style={{ transition: 'stroke-width 0.2s' }}
              />
              <text x={mp.x} y={mp.y - 3} textAnchor="middle"
                fontSize={9} fontFamily="Inter, monospace" fontWeight="800" fill={info.color}>
                {info.label}
              </text>
              <text x={mp.x} y={mp.y + 7} textAnchor="middle"
                fontSize={8} fontFamily="Inter, monospace" fontWeight="600" fill="#e5e7eb">
                {info.driver}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Sector Ownership Badge ────────────────────────────────────────────────────
function SectorBadge({ label, driver, time, color, isHovered, onHover }) {
  const c = tc(color);
  return (
    <div
      className="flex-1 flex flex-col items-center px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200"
      style={{
        background: isHovered ? `${c}28` : `${c}10`,
        borderColor: isHovered ? `${c}90` : `${c}35`,
        boxShadow: isHovered ? `0 0 16px ${c}40` : 'none',
        transform: isHovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => onHover(label.toLowerCase())}
      onMouseLeave={() => onHover(null)}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: c }}>{label}</span>
      <span className="font-black text-base text-white font-mono">{driver}</span>
      <span className="text-[10px] font-mono" style={{ color: c }}>{fmt(time)}</span>
    </div>
  );
}

// ── Driver Gap Bar ────────────────────────────────────────────────────────────
function DriverGapBar({ d, fantasySectors, maxGap, index, allDrivers }) {
  const c = tc(d.team_color);
  const gapToFantasy = d.theoretical - (fantasySectors.s1_time + fantasySectors.s2_time + fantasySectors.s3_time);
  const barW = maxGap > 0 ? Math.min((gapToFantasy / maxGap) * 100, 100) : 0;
  const isFantasy = gapToFantasy < 0.002;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Rank */}
      <span className="text-[10px] font-mono text-gray-600 w-4 shrink-0">{index + 1}</span>

      {/* Driver color dot + name */}
      <div className="flex items-center gap-1.5 w-12 shrink-0">
        <div className="w-1.5 h-4 rounded-full shrink-0" style={{ background: c }} />
        <span className="text-[11px] font-bold truncate" style={{ color: c }}>{d.driver}</span>
      </div>

      {/* Sector times as mini pills */}
      <div className="flex gap-1 shrink-0">
        {['s1', 's2', 's3'].map(sk => {
          const isBest = d[`${sk}_is_global_best`];
          return (
            <span key={sk}
              className="text-[9px] font-mono px-1 py-0.5 rounded"
              style={{
                background: isBest ? `${c}30` : '#1a1e2a',
                color: isBest ? c : '#6b7280',
                border: isBest ? `1px solid ${c}50` : '1px solid transparent',
                fontWeight: isBest ? 800 : 400,
              }}>
              {isBest ? '★' : fmtDelta(d[`${sk}_delta`])}
            </span>
          );
        })}
      </div>

      {/* Theoretical time */}
      <span className="text-[10px] font-mono text-gray-200 font-bold w-16 text-right shrink-0">
        {fmt(d.theoretical)}
      </span>

      {/* Gap bar */}
      <div className="flex-1 flex items-center gap-1.5">
        {isFantasy ? (
          <div className="flex items-center gap-1">
            <Zap size={9} className="text-yellow-400" />
            <span className="text-[9px] text-yellow-400 font-bold">FANTASY</span>
          </div>
        ) : (
          <>
            <div className="flex-1 h-1.5 rounded-full bg-[#1a1e2a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${barW}%`,
                  background: `linear-gradient(90deg, ${c}80, ${c})`,
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-orange-400 w-10 text-right shrink-0">
              +{gapToFantasy.toFixed(3)}s
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TheoreticalLap = ({ year, round, sessionType }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('theoretical');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredSector, setHoveredSector] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef();

  const fetchData = useCallback(async () => {
    if (!year || !round || !sessionType) return;
    setLoading(true);
    setError(null);
    setRevealed(false);
    try {
      const res = await fetch(
        `${API_BASE}/theoretical_lap?year=${year}&round=${round}&session_type=${sessionType}`
      );
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      const json = await res.json();
      setData(json);
      // Cinematic reveal delay
      clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setRevealed(true), 200);
    } catch (e) {
      setError(e.message || 'Failed to fetch theoretical lap data.');
    } finally {
      setLoading(false);
    }
  }, [year, round, sessionType]);

  useEffect(() => { fetchData(); return () => clearTimeout(revealTimer.current); }, [fetchData]);

  const sortedDrivers = useMemo(() => {
    if (!data?.drivers) return [];
    return [...data.drivers].sort((a, b) => {
      const va = a[sortKey] ?? Infinity;
      const vb = b[sortKey] ?? Infinity;
      return sortAsc ? va - vb : vb - va;
    });
  }, [data, sortKey, sortAsc]);

  const maxGap = useMemo(() => {
    if (!data?.drivers || !data?.fantasy) return 1;
    const fantasyTotal = data.fantasy.s1_time + data.fantasy.s2_time + data.fantasy.s3_time;
    return Math.max(...data.drivers.map(d => d.theoretical - fantasyTotal), 0.001);
  }, [data]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  // ── States ─────────────────────────────────────────────────────────────────
  if (!year || !round) return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
      Load a race session first.
    </div>
  );

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-yellow-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-t-orange-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 animate-pulse">
          Computing Theoretical Perfection…
        </p>
        <p className="text-[10px] text-gray-600 mt-1">Parsing all sector times across every driver</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="w-full h-full flex items-center justify-center text-red-400 text-xs font-bold px-8 text-center">
      {error}
    </div>
  );

  if (!data) return null;

  const { fantasy, track_sectors } = data;
  const fantasyTotal = fantasy.s1_time + fantasy.s2_time + fantasy.s3_time;

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="text-gray-700 ml-0.5">↕</span>;
    return sortAsc
      ? <ChevronUp size={10} className="inline ml-0.5 text-yellow-400" />
      : <ChevronDown size={10} className="inline ml-0.5 text-yellow-400" />;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0c10] overflow-hidden">

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-4 border-b border-[#1e2130]"
        style={{ background: 'linear-gradient(135deg, #0d0f16 0%, #111520 100%)' }}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <Trophy size={18} className="text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white tracking-wide">
              Fastest Theoretical Lap
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Best S1 + best S2 + best S3 — the perfect lap no one drove
            </p>
          </div>

          {/* Fantasy time — animated reveal */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-2 justify-end">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-2xl font-black font-mono text-yellow-300 tracking-tight">
                {revealed ? <AnimatedTime target={fantasyTotal} /> : '—'}
              </span>
            </div>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">Fantasy Lap Time</p>
          </div>
        </div>

        {/* Sector ownership pills */}
        <div className="flex gap-2 mt-3">
          {[
            { label: 'S1', driver: fantasy.s1_driver, time: fantasy.s1_time, color: fantasy.s1_color },
            { label: 'S2', driver: fantasy.s2_driver, time: fantasy.s2_time, color: fantasy.s2_color },
            { label: 'S3', driver: fantasy.s3_driver, time: fantasy.s3_time, color: fantasy.s3_color },
          ].map(({ label, driver, time, color }) => (
            <SectorBadge
              key={label} label={label} driver={driver} time={time} color={color}
              isHovered={hoveredSector === label.toLowerCase()}
              onHover={setHoveredSector}
            />
          ))}
        </div>
      </div>

      {/* ── Body: Left map + Right table ───────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Track map */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Map header */}
          <div className="px-4 py-2 border-b border-[#1e2130] flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sector Ownership Map</span>
            <Info size={10} className="text-gray-700" />
            <span className="text-[9px] text-gray-700">Hover a sector to highlight</span>
          </div>

          <div className="flex-1 p-4 flex items-center justify-center">
            {track_sectors?.s1 ? (
              <TheoreticalTrackMap
                trackSectors={track_sectors}
                fantasy={fantasy}
                hoveredSector={hoveredSector}
                onSectorHover={setHoveredSector}
              />
            ) : (
              <div className="text-gray-600 text-xs text-center">
                Track map unavailable<br />
                <span className="text-[10px]">(session may lack X/Y telemetry)</span>
              </div>
            )}
          </div>

          {/* Sector legend */}
          <div className="px-4 py-2 border-t border-[#1e2130] flex items-center gap-4">
            {[
              { k: 's1', label: 'Sector 1', driver: fantasy.s1_driver, time: fantasy.s1_time, color: fantasy.s1_color },
              { k: 's2', label: 'Sector 2', driver: fantasy.s2_driver, time: fantasy.s2_time, color: fantasy.s2_color },
              { k: 's3', label: 'Sector 3', driver: fantasy.s3_driver, time: fantasy.s3_time, color: fantasy.s3_color },
            ].map(({ k, label, driver, time, color }) => {
              const c = tc(color);
              const isActive = hoveredSector === k;
              return (
                <div
                  key={k}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all"
                  style={{ background: isActive ? `${c}18` : 'transparent' }}
                  onMouseEnter={() => setHoveredSector(k)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  <div className="w-3 h-1.5 rounded-full" style={{ background: c }} />
                  <span className="text-[9px] font-bold text-gray-500">{label}:</span>
                  <span className="text-[9px] font-black" style={{ color: c }}>{driver}</span>
                  <span className="text-[9px] font-mono text-gray-600">{fmt(time)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Driver ranking */}
        <div className="w-[460px] shrink-0 flex flex-col border-l border-[#1e2130] bg-[#0d0f15]">
          {/* Table header */}
          <div className="px-3 py-2 border-b border-[#1e2130] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={11} className="text-gray-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Ranking</span>
            </div>
            <span className="text-[9px] text-gray-700">{sortedDrivers.length} drivers</span>
          </div>

          {/* Column headers */}
          <div className="px-3 py-1.5 border-b border-[#1e2130] bg-[#1a1d26] grid text-[9px] font-bold uppercase text-gray-600"
            style={{ gridTemplateColumns: '18px 48px 80px 56px 1fr' }}>
            <span>#</span>
            <span>DRV</span>
            <span className="text-center">Sectors</span>
            <button className="text-right hover:text-gray-400 transition-colors" onClick={() => toggleSort('theoretical')}>
              Theoretical <SortIcon col="theoretical" />
            </button>
            <span className="pl-2">Gap to Fantasy</span>
          </div>

          {/* Driver rows */}
          <div className="flex-1 overflow-auto">
            {sortedDrivers.map((d, idx) => (
              <DriverGapBar
                key={d.driver}
                d={d}
                fantasySectors={fantasy}
                maxGap={maxGap}
                index={idx}
                allDrivers={sortedDrivers}
              />
            ))}
          </div>

          {/* Footer legend */}
          <div className="px-3 py-2 border-t border-[#1e2130] flex items-center gap-4 text-[9px] text-gray-700">
            <span className="text-yellow-400 font-bold">★ best</span>
            <span>= fastest in that sector across all drivers</span>
            <span className="text-orange-400 ml-auto">+Xs = gap to sector best</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TheoreticalLap);
