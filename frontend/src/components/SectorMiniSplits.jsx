import React, { useState, useEffect, useMemo, useCallback } from 'react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const SECTOR_COLORS = {
  1: { main: '#818cf8', dim: 'rgba(129,140,248,0.25)', label: 'S1' },
  2: { main: '#34d399', dim: 'rgba(52,211,153,0.25)',  label: 'S2' },
  3: { main: '#fb923c', dim: 'rgba(251,146,60,0.25)',  label: 'S3' },
};

/* ── Normalise X/Y arrays into SVG space ─────────────────────────── */
function buildSvgPath(xs, ys, minX, minY, scale, offX, offY, height) {
  if (!xs?.length) return '';
  const pts = xs.map((x, i) => {
    const sx = offX + (x - minX) * scale;
    const sy = height - (offY + (ys[i] - minY) * scale);
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  });
  return 'M ' + pts.join(' L ');
}

function formatDelta(v) {
  if (v == null) return '';
  return (v > 0 ? '+' : '') + v.toFixed(3) + 's';
}

/* ── SVG map subcomponent ─────────────────────────────────────────── */
function SectorTrackMap({ drivers, bestByS1, bestByS2, bestByS3 }) {
  const W = 720, H = 440, PAD = 40;

  // Collect all X/Y to compute scale
  const allX = [], allY = [];
  drivers.forEach(d => {
    [d.s1, d.s2, d.s3].forEach(sec => {
      if (sec) { allX.push(...sec.x); allY.push(...sec.y); }
    });
  });
  if (!allX.length) return null;

  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const scaleX = (W - PAD * 2) / (maxX - minX || 1);
  const scaleY = (H - PAD * 2) / (maxY - minY || 1);
  const scale  = Math.min(scaleX, scaleY);
  const offX   = PAD + ((W - PAD * 2) - (maxX - minX) * scale) / 2;
  const offY   = PAD + ((H - PAD * 2) - (maxY - minY) * scale) / 2;

  const mkPath = (sec) => buildSvgPath(sec.x, sec.y, minX, minY, scale, offX, offY, H);

  // For each sector, draw ALL drivers dim first, then draw the winner on top
  const layers = [];

  [1, 2, 3].forEach(sNum => {
    const key  = `s${sNum}`;
    const best = sNum === 1 ? bestByS1 : sNum === 2 ? bestByS2 : bestByS3;
    const col  = SECTOR_COLORS[sNum];

    // Dim (non-best) drivers
    drivers.forEach(d => {
      if (!d[key]?.x?.length || d.driver === best?.driver) return;
      layers.push(
        <path
          key={`${d.driver}-s${sNum}-dim`}
          d={mkPath(d[key])}
          fill="none"
          stroke={col.dim}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });

    // Winner (bold)
    if (best && best[key]?.x?.length) {
      const c = best.team_color.startsWith('#') ? best.team_color : `#${best.team_color}`;
      layers.push(
        <path
          key={`${best.driver}-s${sNum}-best`}
          d={mkPath(best[key])}
          fill="none"
          stroke={c}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
  });

  // Sector label badges at midpoint of winner's sector path
  const badges = [1, 2, 3].map(sNum => {
    const key  = `s${sNum}`;
    const best = sNum === 1 ? bestByS1 : sNum === 2 ? bestByS2 : bestByS3;
    if (!best || !best[key]?.x?.length) return null;
    const mid = Math.floor(best[key].x.length / 2);
    const bx  = offX + (best[key].x[mid] - minX) * scale;
    const by  = H - (offY + (best[key].y[mid] - minY) * scale);
    const col = SECTOR_COLORS[sNum];
    const tc  = best.team_color.startsWith('#') ? best.team_color : `#${best.team_color}`;
    return (
      <g key={`badge-s${sNum}`}>
        <rect x={bx - 24} y={by - 13} width={48} height={18} rx={4} fill="#0b0d10" fillOpacity={0.85} stroke={col.main} strokeWidth={1.5} />
        <text x={bx} y={by + 1} textAnchor="middle" fontSize={9} fontFamily="Inter, monospace" fontWeight="700" fill={tc}>
          {col.label}: {best.driver}
        </text>
      </g>
    );
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', maxHeight: '100%' }}>
      {layers}
      {badges}
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
const SectorMiniSplits = ({ year, round, sessionType, selectedDrivers, allDrivers }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!year || !round || !sessionType || !selectedDrivers?.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sector_map?year=${year}&round=${round}&session_type=${sessionType}&drivers=${selectedDrivers.join(',')}`);
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      const json = await res.json();
      setData(json.drivers);
    } catch (e) {
      setError(e.message || 'Failed to fetch sector data.');
    } finally {
      setLoading(false);
    }
  }, [year, round, sessionType, selectedDrivers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Resolve best-sector drivers
  const { bestByS1, bestByS2, bestByS3 } = useMemo(() => {
    if (!data?.length) return {};
    const findBest = key => {
      let best = null;
      data.forEach(d => {
        if (d[`${key}_is_best`]) best = d;
      });
      return best || [...data].sort((a, b) => a[`${key}_time`] - b[`${key}_time`])[0];
    };
    return { bestByS1: findBest('s1'), bestByS2: findBest('s2'), bestByS3: findBest('s3') };
  }, [data]);

  if (!selectedDrivers?.length) return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Select drivers to compare sector mini-splits.</div>
  );
  if (loading) return (
    <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xs tracking-widest animate-pulse uppercase">Computing Sector Splits...</div>
  );
  if (error) return (
    <div className="w-full h-full flex items-center justify-center text-red-500 text-xs font-bold">{error}</div>
  );
  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No sector data available.</div>
  );

  const fmt = (v) => {
    if (v == null) return '—';
    const m = Math.floor(v / 60);
    const s = (v % 60).toFixed(3).padStart(6, '0');
    return m > 0 ? `${m}:${s}` : `${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0b0d10' }}>
      {/* Top sector winner bar */}
      <div className="flex items-center gap-0 px-4 py-2 border-b border-[#2b2e36] shrink-0">
        <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mr-4">Fastest Sectors:</span>
        {[
          { sNum: 1, best: bestByS1 },
          { sNum: 2, best: bestByS2 },
          { sNum: 3, best: bestByS3 },
        ].map(({ sNum, best }) => {
          if (!best) return null;
          const col = SECTOR_COLORS[sNum];
          const tc  = best.team_color.startsWith('#') ? best.team_color : `#${best.team_color}`;
          return (
            <div key={sNum} className="flex items-center gap-2 mr-6">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ background: col.dim, color: col.main, border: `1px solid ${col.main}` }}>
                S{sNum}
              </span>
              <span className="font-bold text-sm" style={{ color: tc }}>{best.driver}</span>
              <span className="font-mono text-[11px] text-gray-400">{fmt(best[`s${sNum}_time`])}</span>
            </div>
          );
        })}
      </div>

      {/* Main content: map + table */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SVG Map */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <SectorTrackMap drivers={data} bestByS1={bestByS1} bestByS2={bestByS2} bestByS3={bestByS3} />
        </div>

        {/* Right table: per-driver sector breakdown */}
        <div className="w-64 shrink-0 border-l border-[#2b2e36] bg-[#16181d] overflow-auto">
          <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
            <thead className="sticky top-0 bg-[#1b1d24] text-gray-500 text-[10px] uppercase">
              <tr>
                <th className="p-2 text-left border-b border-[#2b2e36]">Driver</th>
                {[1, 2, 3].map(n => (
                  <th key={n} className="p-2 text-center border-b border-[#2b2e36]" style={{ color: SECTOR_COLORS[n].main }}>S{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].sort((a, b) => (a.s1_time + a.s2_time + a.s3_time) - (b.s1_time + b.s2_time + b.s3_time)).map(d => {
                const tc = d.team_color.startsWith('#') ? d.team_color : `#${d.team_color}`;
                return (
                  <tr key={d.driver} className="border-b border-[#2b2e36]/30 hover:bg-[#2b2e36] transition-colors">
                    <td className="p-2 font-bold" style={{ color: tc }}>{d.driver}</td>
                    {[1, 2, 3].map(n => {
                      const isBest = d[`s${n}_is_best`];
                      const delta  = d[`s${n}_delta`];
                      return (
                        <td key={n} className="p-2 text-center font-mono text-[10px]">
                          <div className={isBest ? 'text-purple-300 font-bold' : 'text-gray-400'}>
                            {fmt(d[`s${n}_time`])}
                          </div>
                          {!isBest && delta != null && (
                            <div className="text-[9px] text-red-400">{formatDelta(delta)}</div>
                          )}
                          {isBest && (
                            <div className="text-[9px] text-purple-400 font-bold">BEST</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Color key */}
          <div className="p-2 border-t border-[#2b2e36] text-[9px] text-gray-600 space-y-0.5">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: SECTOR_COLORS[n].main }} />
                <span>S{n} — {SECTOR_COLORS[n].label} winner (thick line)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SectorMiniSplits);
