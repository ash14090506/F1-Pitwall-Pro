import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import WindowCard from './components/WindowCard';
import FloatingWindow from './components/FloatingWindow';
import LineChart from './components/LineChart';
import TrackMap from './components/TrackMap';
import PlaybackControls from './components/PlaybackControls';
import ErrorBoundary from './components/ErrorBoundary';
import LapComparisonModal from './components/LapComparisonModal';
import TemperatureAnalysis from './components/TemperatureAnalysis';
import PitstopAnalysis from './components/PitstopAnalysis';
import FlagsTimeline from './components/FlagsTimeline';
import DriverPositionChart from './components/DriverPositionChart';
import TireStrategyGrid from './components/TireStrategyGrid';
import TrafficHeatmap from './components/TrafficHeatmap';
import DeltaAnalysis from './components/DeltaAnalysis';
import AccelerationChart from './components/AccelerationChart';
import DetailedLapData from './components/DetailedLapData';
import LapTimeBoxPlot from './components/LapTimeBoxPlot';
import PedalBehavior from './components/PedalBehavior';
import ThrottleCornerAnalysis from './components/ThrottleCornerAnalysis';
import LongRunAnalysis from './components/LongRunAnalysis';
import IdealLapRanking from './components/IdealLapRanking';
import StraightLineSpeed from './components/StraightLineSpeed';
import BrakeAccelPerformance from './components/BrakeAccelPerformance';
import CornerClassification from './components/CornerClassification';
import AiPredictions from './components/AiPredictions';
import HistoricalTrackMap from './components/HistoricalTrackMap';
import SeasonStartReaction from './components/SeasonStartReaction';
import TyreDegradation from './components/TyreDegradation';
import LapDeltaOverlay from './components/LapDeltaOverlay';
import PitStrategyGantt from './components/PitStrategyGantt';
import SectorMiniSplits from './components/SectorMiniSplits';
import SectorComparisonChart from './components/SectorComparisonChart';
import WelcomeDashboard from './components/WelcomeDashboard';
import RadioPlayer from './components/RadioPlayer';
import { Play, Sun, Moon, Share2, Check, Radio } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

function App() {
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Read initial state from URL query params for permalink support
  const _params = new URLSearchParams(window.location.search);
  const [selectedYear, setSelectedYear] = useState(_params.get('year') || '2026');
  const [selectedRace, setSelectedRace] = useState(_params.get('round') || '');
  const [selectedSession, setSelectedSession] = useState(_params.get('session') || 'R');
  const [selectedDrivers, setSelectedDrivers] = useState(
    _params.get('drivers') ? _params.get('drivers').split(',') : []
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [telemetries, setTelemetries] = useState([]);

  // UI States
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [floatingWindows, setFloatingWindows] = useState([]);
  const [focusedFloatingWindow, setFocusedFloatingWindow] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [shareToast, setShareToast] = useState(false);

  // Team radio state
  const [radioClips, setRadioClips] = useState([]);
  const [radioEnabled, setRadioEnabled] = useState(true);

  // Auto-restore workspace on initial load
  useEffect(() => {
    const saved = localStorage.getItem('pitwall-workspace');
    if (saved && !window.location.search) {
      try {
        const ws = JSON.parse(saved);
        if (ws.selectedYear) setSelectedYear(ws.selectedYear);
        if (ws.selectedRace) setSelectedRace(ws.selectedRace);
        if (ws.selectedSession) setSelectedSession(ws.selectedSession);
        if (ws.selectedDrivers) setSelectedDrivers(ws.selectedDrivers);
        if (ws.activeModal) setActiveModal(ws.activeModal);
        if (ws.floatingWindows) setFloatingWindows(ws.floatingWindows);
      } catch (e) { console.error('Failed to parse workspace', e); }
    }
  }, []);

  const saveWorkspace = () => {
    const ws = {
      selectedYear, selectedRace, selectedSession, selectedDrivers,
      activeModal, floatingWindows
    };
    localStorage.setItem('pitwall-workspace', JSON.stringify(ws));
    alert('Workspace saved successfully!');
  };

  const loadWorkspace = () => {
    const saved = localStorage.getItem('pitwall-workspace');
    if (saved) {
      try {
        const ws = JSON.parse(saved);
        if (ws.selectedYear) setSelectedYear(ws.selectedYear);
        if (ws.selectedRace) setSelectedRace(ws.selectedRace);
        if (ws.selectedSession) setSelectedSession(ws.selectedSession);
        if (ws.selectedDrivers) setSelectedDrivers(ws.selectedDrivers);
        if (ws.activeModal) setActiveModal(ws.activeModal);
        if (ws.floatingWindows) setFloatingWindows(ws.floatingWindows);
      } catch (e) { alert('Failed to load workspace.'); }
    } else {
      alert('No saved workspace found.');
    }
  };

  // Theme: persist to localStorage, apply to <html> data-theme
  const [theme, setTheme] = useState(() => localStorage.getItem('pitwall-theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pitwall-theme', theme);
  }, [theme]);

  // Sync toolbar state → URL query params (permalink support)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('year', selectedYear);
    if (selectedRace) params.set('round', selectedRace);
    params.set('session', selectedSession);
    if (selectedDrivers.length > 0) params.set('drivers', selectedDrivers.join(','));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [selectedYear, selectedRace, selectedSession, selectedDrivers]);

  const shareAnalysis = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  }, []);

  // Playback States
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [maxPlaybackIndex, setMaxPlaybackIndex] = useState(0);
  const [maxDistance, setMaxDistance] = useState(0);
  const [globalHoverDistance, setGlobalHoverDistance] = useState(null);

  const handleMenuSelect = useCallback((modalName) => {
      if (modalName === 'Main Telemetry Dashboard') {
          setActiveModal(null);
      } else {
          setActiveModal(modalName);
      }
  }, []);

  const handleSpawnFloating = useCallback((modalName) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      setFloatingWindows(prev => [...prev, { id, moduleName }]);
      setFocusedFloatingWindow(id);
  }, []);

  const closeFloatingWindow = useCallback((id) => {
      setFloatingWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const renderMenu = (name, items) => (
    <div className="relative z-[100]">
      <div 
        className={`px-2 py-0.5 cursor-pointer rounded-sm ${activeMenu === name ? 'bg-[#2b2e36] text-white' : 'hover:bg-[#2b2e36]'}`}
        onClick={() => setActiveMenu(activeMenu === name ? null : name)}
      >
        {name}
      </div>
      {activeMenu === name && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#1b1d24] border border-[#2b2e36] shadow-xl z-[100] py-1 rounded text-xs font-medium">
          {items.map((item, i) => item === 'divider' ? (
              <div key={i} className="my-1 border-t border-[#2b2e36]" />
          ) : (
              <div key={i} className="px-3 py-1 hover:bg-blue-600 cursor-pointer text-gray-200 hover:text-white" onClick={() => { item.action(); setActiveMenu(null); }}>
                {item.label}
              </div>
          ))}
        </div>
      )}
    </div>
  );

  const getModuleContent = (modalName) => {
      switch (modalName) {
          case 'Lap Time Box Plot':
              return { title: "Lap Time Consistency (Box Plot)", fullSpan: true, content: <LapTimeBoxPlot year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Long Run Analysis':
              return { title: "FP2 Long Run Analysis & Fuel Correction", fullSpan: true, content: <LongRunAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Sector Comparison Chart':
              return { title: "Sector Comparison Chart", fullSpan: true, content: <SectorComparisonChart year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Tyre Degradation':
              return { title: "Tyre Degradation Curves — Stint Analysis", fullSpan: true, content: <TyreDegradation year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Lap Delta Overlay':
              return { title: "Lap Delta — Gap vs. Distance + Track Map", fullSpan: true, content: <LapDeltaOverlay year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Pit Strategy Gantt':
              return { title: "Pit Stop Strategy — Gantt Timeline", fullSpan: true, content: <PitStrategyGantt year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'Sector Mini-Splits':
              return { title: "Sector Mini-Splits — Track Map", fullSpan: true, content: <SectorMiniSplits year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Pedal Behavior Analysis':
              return { title: "Pre-Apex Pedal Behavior Mapping", fullSpan: true, content: <PedalBehavior year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Throttle Corner Analysis':
              return { title: "Throttle vs Detected Corners", fullSpan: true, content: <ThrottleCornerAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Detailed Lap Analysis':
              return { title: "Detailed Lap Data Matrix", fullSpan: true, content: <DetailedLapData year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} /> };
          case 'Lap-by-Lap Comparison':
              return { title: "Lap-by-Lap Comparison", fullSpan: true, customWrap: true, content: <LapComparisonModal year={selectedYear} round={selectedRace} sessionType={selectedSession} drivers={selectedDrivers} onApplyLaps={handleLoadSpecificLaps} /> };
          case 'Track Analysis':
              return { title: "Track Analysis (Full Screen Module)", fullSpan: true, content: <TrackMap telemetryData={telemetries} playbackIndex={playbackIndex} allDrivers={drivers} year={selectedYear} round={selectedRace} sessionType={selectedSession} /> };
          case 'Temperature Analysis':
              return { title: "Temperature & Weather Extrapolation", fullSpan: true, content: <TemperatureAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} /> };
          case 'Pitstop Analysis':
              return { title: "Pitstop Analysis", fullSpan: true, rawRender: true, content: <PitstopAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} /> };
          case 'Accident & Flags Analysis':
              return { title: "Accident & Flags Analysis", fullSpan: true, rawRender: true, content: <FlagsTimeline year={selectedYear} round={selectedRace} sessionType={selectedSession} /> };
          case 'Tire Strategy Analysis':
              return { title: "Tire Strategy Allocation", fullSpan: true, content: <TireStrategyGrid year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'Traffic Analysis':
              return { title: "Dirty Air & Traffic Heatmap", fullSpan: true, content: <TrafficHeatmap year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'Throttle/Brake Analysis':
              return { title: "Throttle & Brake High-Fidelity Module", fullSpan: true, content: <div className="h-full w-full flex flex-col gap-3"><div className="flex-1 min-h-0"><LineChart title="Throttle" yLabel="%" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} /></div><div className="flex-1 min-h-0"><LineChart title="Brake" yLabel="Pressure %" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} /></div></div> };
          case 'Steering/Gear Analysis':
              return { title: "Gear & RPM Analysis Module", fullSpan: true, content: <div className="h-full w-full flex flex-col gap-3"><div className="flex-1 min-h-0"><LineChart title="nGear" dataKey="gear" yLabel="Gear" maxVal={9} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} /></div><div className="flex-1 min-h-0"><LineChart title="RPM" yLabel="Revs" maxVal={13000} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} /></div></div> };
          case 'Driver Run Position':
              return { title: "Grid Progression & Run Layout", fullSpan: true, content: <DriverPositionChart year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'DRS & Acceleration':
              return { title: "DRS & Acceleration Analysis", fullSpan: true, content: <div className="h-full w-full flex flex-col gap-3"><div className="flex-1 min-h-0"><LineChart title="DRS Status" dataKey="drs" yLabel="Active" maxVal={1.2} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} /></div><div className="flex-1 min-h-0"><AccelerationChart telemetryData={telemetries} allDrivers={drivers} /></div></div> };
          case 'Delta Analysis':
              return { title: "Comparative Delta Analysis", fullSpan: true, content: <DeltaAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} selectedDrivers={selectedDrivers} /> };
          case 'Straight Line Speed':
              return { title: "Straight Line Speed Analysis", fullSpan: true, content: <StraightLineSpeed year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'Brake & Accel Performance':
              return { title: "Brake & Acceleration Performance", fullSpan: true, content: <BrakeAccelPerformance year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Corner Classification':
              return { title: "Corner Performance Classification", fullSpan: true, content: <CornerClassification year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} /> };
          case 'Ideal Lap Ranking':
              return { title: "Ideal Lap & Sector Comparison", fullSpan: true, content: <IdealLapRanking year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} /> };
          case 'AI Prediction Models':
              return { title: "AI Prediction Models", fullSpan: true, content: <AiPredictions year={selectedYear} round={selectedRace} /> };
          case 'Historical Track Map':
              return { title: "Historical Track Map & Flags", fullSpan: true, content: <HistoricalTrackMap year={selectedYear} round={selectedRace} /> };
          case 'Season Start Reaction':
              return { title: "Season Start Reaction", fullSpan: true, content: <SeasonStartReaction year={selectedYear} /> };
          default:
              return { title: modalName, fullSpan: true, content: <div className="flex flex-col items-center justify-center h-full w-full bg-[#0b0d10] text-[#64748b]"><div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-[#1b1d24] border border-[#2b2e36]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><div className="text-lg font-bold text-white mb-1">Under Construction</div><div className="text-sm">Module <strong className="text-red-400">{modalName}</strong> is planned for a future update.</div></div> };
      }
  };

  const renderModalContent = () => {
      if (!activeModal) return null;
      const mod = getModuleContent(activeModal);
      if (mod.customWrap) {
          // Pass onClose into LapComparisonModal clone since it's a special component
          return React.cloneElement(mod.content, { onClose: () => setActiveModal(null) });
      }
      if (mod.rawRender) {
          return (
              <div className="h-full w-full max-w-7xl relative mx-auto shadow-2xl bg-[#0b0d10] rounded overflow-hidden">
                  <button onClick={() => setActiveModal(null)} className="absolute top-2 right-2 z-50 text-gray-400 hover:text-white p-1 bg-black/50 rounded-full"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                  {mod.content}
              </div>
          );
      }
      return (
          <WindowCard title={mod.title} fullSpan={mod.fullSpan} onClose={() => setActiveModal(null)}>
              {mod.content}
          </WindowCard>
      );
  };

  useEffect(() => {
    fetchRaces(selectedYear);
    setError(null);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedRace) {
      fetchDrivers(selectedYear, selectedRace, selectedSession);
      setTelemetries([]);
      setError(null);
    }
  }, [selectedRace, selectedSession]);

  const fetchRaces = async (year) => {
    try {
      const res = await fetch(`${API_BASE}/races?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch races");
      const data = await res.json();
      setRaces(data.races);
      if (data.races.length > 0) {
        setSelectedRace(data.races[0].round.toString());
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch available races for this year.");
      setRaces([]);
    }
  };


  const fetchDrivers = async (year, round, sessionType) => {
    try {
      const res = await fetch(`${API_BASE}/drivers?year=${year}&round=${round}&session_type=${sessionType}`);
      if (!res.ok) {
        if (res.status === 500) {
          throw new Error(`The ${sessionType} session is completely unavailable or did not occur during this race weekend.`);
        }
        throw new Error(`Failed to fetch drivers for the ${sessionType} session.`);
      }
      const data = await res.json();
      setDrivers(data.drivers);
      if (data.drivers.length >= 2) {
        setSelectedDrivers([data.drivers[0].abbreviation, data.drivers[1].abbreviation]);
      } else if (data.drivers.length === 1) {
        setSelectedDrivers([data.drivers[0].abbreviation]);
      } else {
        setSelectedDrivers([]);
      }
    } catch (err) {
      console.error(err);
      setDrivers([]);
      setSelectedDrivers([]);
      setError(err.message);
    }
  };


  /**
   * Reads an NDJSON streaming response from the given URL and calls onData(parsedObject)
   * incrementally for every line received. Returns a promise that resolves once the stream ends.
   */
  const readNDJSONStream = useCallback(async (url, onData, signal) => {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      let detail = res.statusText;
      try { const j = await res.json(); detail = j.detail || detail; } catch (_) {}
      throw new Error(detail);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // last element may be incomplete
      for (const line of lines) {
        if (!line.trim()) continue;
        const obj = JSON.parse(line);
        if (obj.done) break;
        if (obj.error) throw new Error(obj.error);
        onData(obj);
      }
    }
  }, []);

  // Fetch team radio clips for the current session
  const fetchRadioClips = useCallback(async () => {
    if (!selectedRace || !selectedYear) return;
    try {
      const driversParam = selectedDrivers.length > 0 ? `&drivers=${selectedDrivers.join(',')}` : '';
      const res = await fetch(`${API_BASE}/team_radio?year=${selectedYear}&round=${selectedRace}&session_type=${selectedSession}${driversParam}`);
      if (!res.ok) return;
      const data = await res.json();
      setRadioClips(data.clips || []);
    } catch (e) {
      console.warn('[Radio] Failed to fetch radio clips:', e);
    }
  }, [selectedRace, selectedYear, selectedSession, selectedDrivers]);

  const loadTelemetry = useCallback(async () => {
    if (selectedDrivers.length === 0 || !selectedRace) return;
    setLoading(true);
    setError(null);
    setTelemetries([]);  // clear previous data immediately for clean slate
    try {
      // Stream each driver in parallel — each arrives independently
      await Promise.all(selectedDrivers.map(async (drv) => {
        const url = `${API_BASE}/telemetry/fastest?year=${selectedYear}&round=${selectedRace}&session_type=${selectedSession}&driver=${drv}`;
        try {
          await readNDJSONStream(url, (payload) => {
          setTelemetries(prev => {
            // Replace existing entry for this driver if present (dedup), otherwise append
            const exists = prev.findIndex(d => d.driver === payload.driver);
            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = payload;
              return updated;
            }
            return [...prev, payload];
          });
          // Update distance / index bounds as data arrives
          if (payload.telemetry?.distance) {
            const dist = payload.telemetry.distance;
            setMaxDistance(prev => Math.max(prev, dist[dist.length - 1] || 0));
            setMaxPlaybackIndex(prev => Math.max(prev, dist.length - 1));
            setPlaybackIndex(dist.length - 1);
          }
        });
        } catch (err) {
          console.error(`Error loading telemetry for ${drv}:`, err);
          setError(prev => prev ? `${prev} | ${drv}: ${err.message}` : `${drv}: ${err.message}`);
        }
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch telemetry data. FastF1 cache may still be spinning up or race data is unavailable.');
      }
    } finally {
      setLoading(false);
      // After telemetry is loaded, fetch radio clips in the background
      fetchRadioClips();
    }
  }, [selectedDrivers, selectedRace, selectedYear, selectedSession, readNDJSONStream, fetchRadioClips]);


  const handleLoadSpecificLaps = useCallback(async (lapSelections) => {
    if (Object.keys(lapSelections).length === 0) return;
    setLoading(true);
    setError(null);
    setTelemetries([]);
    try {
      await Promise.all(Object.entries(lapSelections).map(async ([drv, lapNum]) => {
        const url = `${API_BASE}/telemetry/lap?year=${selectedYear}&round=${selectedRace}&session_type=${selectedSession}&driver=${drv}&lap_number=${lapNum}`;
        try {
          await readNDJSONStream(url, (payload) => {
          setTelemetries(prev => {
            const exists = prev.findIndex(d => d.driver === payload.driver);
            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = payload;
              return updated;
            }
            return [...prev, payload];
          });
          if (payload.telemetry?.distance) {
            const dist = payload.telemetry.distance;
            setMaxDistance(prev => Math.max(prev, dist[dist.length - 1] || 0));
            setMaxPlaybackIndex(prev => Math.max(prev, dist.length - 1));
            setPlaybackIndex(dist.length - 1);
          }
        });
        } catch (err) {
          console.error(`Error loading lap ${lapNum} for ${drv}:`, err);
          setError(prev => prev ? `${prev} | ${drv} (L${lapNum}): ${err.message}` : `${drv} (L${lapNum}): ${err.message}`);
        }
      }));
      setActiveModal(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch custom lap telemetry data.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDrivers, selectedRace, selectedYear, selectedSession, readNDJSONStream]);


  const removeDriver = (drv) => {
      setSelectedDrivers(prev => prev.filter(d => d !== drv));
  };
  
  const addDriver = (drv) => {
      if (drv && !selectedDrivers.includes(drv)) {
          setSelectedDrivers(prev => [...prev, drv]);
      }
  };

  return (
    <ErrorBoundary>
    <div className="h-full w-full flex flex-col font-sans select-none">
      {/* Menu Bar */}
      <div className="h-6 min-h-[24px] flex items-center bg-[#1b1d24] border-b border-[#2b2e36] text-[11px] text-gray-300 px-2 space-x-4 relative z-50">
        <span className="font-bold text-white tracking-widest mr-4">F1 PITWALL PRO</span>
        {renderMenu('File', [
          { label: 'Save Workspace', action: saveWorkspace },
          { label: 'Load Workspace', action: loadWorkspace },
          'divider',
          { label: 'Export Layout', action: () => alert('Exporting dashboard layout...') },
          'divider',
          { label: 'Reload Framework', action: () => window.location.reload() }
        ])}
        {renderMenu('View', [
          { label: `${sidebarVisible ? 'Hide' : 'Show'} Modules Sidebar`, action: () => setSidebarVisible(!sidebarVisible) },
          { label: 'Toggle Fullscreen', action: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() }
        ])}
        {renderMenu('Analysis', [
          { label: 'Clear Telemetry Cache', action: async () => { 
            try { await fetch(`${API_BASE}/clear_cache`); } catch (err) { console.error(err); };
            setTelemetries([]); 
            setSelectedDrivers([]); 
          } }
        ])}
        {renderMenu('Tools', [
          { label: 'Preferences...', action: () => setActiveModal('Preferences') }
        ])}
        {renderMenu('Help', [
          { label: 'About Pitwall Pro', action: () => alert('F1 Pitwall Pro\nMultidocument Web Framework') }
        ])}

        {/* Right-side action buttons */}
        <div className="ml-auto flex items-center gap-1 pr-1">
          {/* Share button */}
          <button
            onClick={shareAnalysis}
            title="Copy shareable link to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] transition-colors hover:bg-[#2b2e36] text-gray-400 hover:text-white"
          >
            {shareToast ? <Check size={11} className="text-green-400" /> : <Share2 size={11} />}
            {shareToast ? <span className="text-green-400">Copied!</span> : <span>Share</span>}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1 rounded-sm transition-colors hover:bg-[#2b2e36] text-gray-400 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
        </div>
      </div>
      
      {/* Global Transparent Overlay to close menus */}
      {activeMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />}

      {/* Main Toolbar */}
      <div className="h-12 min-h-[48px] flex items-center bg-[#16181d] border-b border-[#2b2e36] px-4 space-x-4 text-xs whitespace-nowrap overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Year:</span>
          <select className="toolbar-select w-20" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Race:</span>
          <select className="toolbar-select flex-1 max-w-[200px]" value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
            {races.map((r, i) => (
              <option key={i} value={r.round}>{r.country} - {r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Session:</span>
          <select className="toolbar-select w-16" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            <option value="R">R</option>
            <option value="S">S</option>
            <option value="SQ">SQ</option>
            <option value="Q">Q</option>
            <option value="FP3">FP3</option>
            <option value="FP2">FP2</option>
            <option value="FP1">FP1</option>
          </select>
        </div>

        <div className="w-px h-6 bg-[#2b2e36] mx-2"></div>

        <div className="flex items-center space-x-2">
          <span className="text-blue-400 font-semibold">Drivers:</span>
          <div className="flex gap-1 items-center">
            {selectedDrivers.map(drv => (
              <span key={drv} onClick={() => removeDriver(drv)} className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-0.5 rounded-sm text-xs cursor-pointer hover:bg-red-900 transition-colors hover:text-white">
                {drv} ✕
              </span>
            ))}
          </div>
          {selectedDrivers.length < drivers.length && (
            <select className="toolbar-select w-24 ml-2" value="" onChange={e => addDriver(e.target.value)}>
              <option value="">+ Add...</option>
              {drivers.filter(d => !selectedDrivers.includes(d.abbreviation)).map(d => (
                <option key={d.abbreviation} value={d.abbreviation}>{d.abbreviation}</option>
              ))}
            </select>
          )}
        </div>

        <button 
            onClick={loadTelemetry}
            disabled={loading}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-sm disabled:opacity-50 ml-4 font-semibold shadow-md transition-colors"
        >
          <Play size={12} fill="currentColor" />
          {loading ? 'Analyzing...' : 'Update Analysis'}
        </button>

        {/* Radio toggle */}
        <button
          onClick={() => setRadioEnabled(e => !e)}
          title={radioEnabled ? 'Mute team radio' : 'Enable team radio'}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-xs font-semibold transition-all ml-2 ${
            radioEnabled
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/30'
              : 'text-gray-500 hover:bg-[#2b2e36] border border-transparent'
          }`}
        >
          <Radio size={12} />
          Radio {radioEnabled ? 'ON' : 'OFF'}
          {radioClips.length > 0 && radioEnabled && (
            <span className="text-[9px] bg-blue-500 text-white px-1 rounded-full">{radioClips.length}</span>
          )}
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {sidebarVisible && <Sidebar activeModal={activeModal} onMenuSelect={handleMenuSelect} onSpawnFloating={handleSpawnFloating} />}

        {/* Modal Overlay */}
        {activeModal && activeModal !== 'Detailed Lap Analysis' && (
            <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-12 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="w-full h-full max-w-6xl max-h-[800px] relative shadow-2xl">
                  {renderModalContent()}
               </div>
            </div>
        )}

        {/* Floating Windows */}
        {floatingWindows.map(fw => {
            const mod = getModuleContent(fw.moduleName);
            // Default props if LapComparison or similar
            if (mod.customWrap) {
                return (
                    <FloatingWindow key={fw.id} id={fw.id} title={mod.title} onClose={closeFloatingWindow} isFocused={focusedFloatingWindow === fw.id} onFocus={setFocusedFloatingWindow}>
                        {React.cloneElement(mod.content, { onClose: () => closeFloatingWindow(fw.id) })}
                    </FloatingWindow>
                );
            }
            return (
                <FloatingWindow key={fw.id} id={fw.id} title={mod.title} onClose={closeFloatingWindow} isFocused={focusedFloatingWindow === fw.id} onFocus={setFocusedFloatingWindow}>
                    {mod.content}
                </FloatingWindow>
            );
        })}
        
        <div className="flex-1 overflow-auto bg-[#0b0d10] relative">
          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500 text-white px-4 py-2 rounded shadow-2xl text-xs font-medium max-w-xl text-center flex items-center gap-4">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="hover:text-red-300 ml-auto font-bold px-2">✕</button>
            </div>
          )}
          
          {telemetries.length === 0 && !activeModal ? (
            <WelcomeDashboard year={selectedYear} />
          ) : (
            <div className="window-grid">
                
                {/* Top Row: Speed, Brake, Throttle */}
                <WindowCard title={`Speed Analysis_${selectedYear}_${selectedSession}`}>
                  <LineChart title="Speed" yLabel="km/h" maxVal={350} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                </WindowCard>
                
                <WindowCard title={`Brake Analysis_${selectedYear}_${selectedSession}`}>
                  <LineChart title="Brake" yLabel="Pressure %" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                </WindowCard>

                <WindowCard title={`Throttle Analysis_${selectedYear}_${selectedSession}`}>
                  <LineChart title="Throttle" yLabel="%" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                </WindowCard>

                {/* Bottom Row: Gear, RPM, Track Map */}
                <WindowCard title={`Gear Analysis_${selectedYear}_${selectedSession}`}>
                  <LineChart title="nGear" dataKey="gear" yLabel="Gear" maxVal={9} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                </WindowCard>

                <WindowCard title={`RPM Analysis_${selectedYear}_${selectedSession}`}>
                  <LineChart title="RPM" yLabel="Revs" maxVal={13000} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                </WindowCard>

                <WindowCard title={`Track Map_${selectedYear}_${selectedSession}`}>
                   <TrackMap telemetryData={telemetries} playbackIndex={playbackIndex} allDrivers={drivers} year={selectedYear} round={selectedRace} sessionType={selectedSession} />
                </WindowCard>
                
            </div>
          )}
        </div>
      </div>
      {/* Playback Controls + Radio Footer */}
      <div className="flex items-center bg-[#1b1d24] border-t border-[#2b2e36] shrink-0">
        <div className="flex-1 min-w-0">
          <PlaybackControls 
             maxIndex={maxPlaybackIndex} 
             playbackIndex={playbackIndex} 
             setPlaybackIndex={setPlaybackIndex} 
          />
        </div>
        {radioClips.length > 0 && (
          <div className="flex items-center px-3 py-1.5 border-l border-[#2b2e36] shrink-0">
            <RadioPlayer
              clips={radioClips}
              playbackIndex={playbackIndex}
              telemetryData={telemetries}
              isEnabled={radioEnabled}
              driverColors={Object.fromEntries(drivers.map(d => [d.abbreviation, d.team_color || '3b82f6']))}
            />
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;
