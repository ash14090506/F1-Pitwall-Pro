import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import WindowCard from './components/WindowCard';
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
import { Play, Sun, Moon, Share2, Check } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001/api';

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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [shareToast, setShareToast] = useState(false);

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

  const renderModalContent = () => {
      switch (activeModal) {
          case 'Lap Time Box Plot':
              return (
                  <WindowCard title="Lap Time Consistency (Box Plot)" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <LapTimeBoxPlot year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Long Run Analysis':
              return (
                  <WindowCard title="FP2 Long Run Analysis & Fuel Correction" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <LongRunAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Pedal Behavior Analysis':
              return (
                  <WindowCard title="Pre-Apex Pedal Behavior Mapping" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <PedalBehavior year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Throttle Corner Analysis':
              return (
                  <WindowCard title="Throttle vs Detected Corners" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <ThrottleCornerAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Detailed Lap Analysis':
              // Overwriting the old Grid view with the new 3.1 Data Table, as Grid stands firmly underneath
              return (
                  <WindowCard title="Detailed Lap Data Matrix" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <DetailedLapData year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} />
                  </WindowCard>
              );
          case 'Lap-by-Lap Comparison':
              return (
                  <LapComparisonModal 
                      year={selectedYear} 
                      round={selectedRace} 
                      sessionType={selectedSession}
                      drivers={selectedDrivers} 
                      onClose={() => setActiveModal(null)} 
                      onApplyLaps={handleLoadSpecificLaps}
                  />
              );
          case 'Track Analysis':
              return (
                  <WindowCard title="Track Analysis (Full Screen Module)" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <TrackMap telemetryData={telemetries} playbackIndex={playbackIndex} allDrivers={drivers} year={selectedYear} round={selectedRace} sessionType={selectedSession} />
                  </WindowCard>
              );
          case 'Temperature Analysis':
              return (
                  <WindowCard title="Temperature & Weather Extrapolation" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <TemperatureAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} />
                  </WindowCard>
              );
          case 'Pitstop Analysis':
              return (
                  <div className="h-full w-full max-w-7xl relative mx-auto shadow-2xl">
                    <PitstopAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} onClose={() => setActiveModal(null)} />
                  </div>
              );
          case 'Accident & Flags Analysis':
              return (
                  <div className="h-full w-full max-w-3xl relative mx-auto shadow-2xl">
                    <FlagsTimeline year={selectedYear} round={selectedRace} sessionType={selectedSession} onClose={() => setActiveModal(null)} />
                  </div>
              );
          case 'Tire Strategy Analysis':
              return (
                  <WindowCard title="Tire Strategy Allocation" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <TireStrategyGrid year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Traffic Analysis':
              return (
                  <WindowCard title="Dirty Air & Traffic Heatmap" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <TrafficHeatmap year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Throttle/Brake Analysis':
              return (
                  <WindowCard title="Throttle & Brake High-Fidelity Module" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <div className="h-full w-full flex flex-col gap-3">
                          <div className="flex-1 min-h-0">
                              <LineChart title="Throttle" yLabel="%" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                          </div>
                          <div className="flex-1 min-h-0">
                              <LineChart title="Brake" yLabel="Pressure %" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                          </div>
                      </div>
                  </WindowCard>
              );
          case 'Steering/Gear Analysis':
              return (
                  <WindowCard title="Gear & RPM Analysis Module" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <div className="h-full w-full flex flex-col gap-3">
                          <div className="flex-1 min-h-0">
                              <LineChart title="nGear" dataKey="gear" yLabel="Gear" maxVal={9} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                          </div>
                          <div className="flex-1 min-h-0">
                              <LineChart title="RPM" yLabel="Revs" maxVal={13000} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                          </div>
                      </div>
                  </WindowCard>
              );
          case 'Driver Run Position':
              return (
                  <WindowCard title="Grid Progression & Run Layout" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <DriverPositionChart year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'DRS & Acceleration':
              return (
                  <WindowCard title="DRS & Acceleration Analysis" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <div className="h-full w-full flex flex-col gap-3">
                          <div className="flex-1 min-h-0">
                              <LineChart title="DRS Status" dataKey="drs" yLabel="Active" maxVal={1.2} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} hoverDistance={globalHoverDistance} onHoverChange={setGlobalHoverDistance} />
                          </div>
                          <div className="flex-1 min-h-0">
                              <AccelerationChart telemetryData={telemetries} allDrivers={drivers} />
                          </div>
                      </div>
                  </WindowCard>
              );
          case 'Delta Analysis':
              return (
                  <WindowCard title="Comparative Delta Analysis" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <DeltaAnalysis year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} selectedDrivers={selectedDrivers} />
                  </WindowCard>
              );
          case 'Straight Line Speed':
              return (
                  <WindowCard title="Straight Line Speed Analysis" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <StraightLineSpeed year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Brake & Accel Performance':
              return (
                  <WindowCard title="Brake & Acceleration Performance" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <BrakeAccelPerformance year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Corner Classification':
              return (
                  <WindowCard title="Corner Performance Classification" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <CornerClassification year={selectedYear} round={selectedRace} sessionType={selectedSession} selectedDrivers={selectedDrivers} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'Ideal Lap Ranking':
              return (
                  <WindowCard title="Ideal Lap & Sector Comparison" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <IdealLapRanking year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          case 'AI Prediction Models':
              return (
                  <WindowCard title="AI Prediction Models" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <AiPredictions year={selectedYear} round={selectedRace} />
                  </WindowCard>
              );
          case 'Historical Track Map':
              return (
                  <WindowCard title="Historical Track Map & Flags" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <HistoricalTrackMap year={selectedYear} round={selectedRace} />
                  </WindowCard>
              );
          case 'Season Start Reaction':
              return (
                  <WindowCard title="Season Start Reaction" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <SeasonStartReaction year={selectedYear} />
                  </WindowCard>
              );
          default:
              return (
                  <WindowCard title={activeModal} fullSpan={true} onClose={() => setActiveModal(null)}>
                      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0b0d10] text-[#64748b]">
                          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-[#1b1d24] border border-[#2b2e36]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          </div>
                          <div className="text-lg font-bold text-white mb-1">Under Construction</div>
                          <div className="text-sm">
                              Module <strong className="text-red-400">{activeModal}</strong> is planned for a future update.
                          </div>
                      </div>
                  </WindowCard>
              );
      }
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
      const res = await axios.get(`${API_BASE}/races?year=${year}`);
      setRaces(res.data.races);
      if (res.data.races.length > 0) {
        setSelectedRace(res.data.races[0].round.toString());
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch available races for this year.");
      setRaces([]);
    }
  };

  const fetchDrivers = async (year, round, sessionType) => {
    try {
      const res = await axios.get(`${API_BASE}/drivers?year=${year}&round=${round}&session_type=${sessionType}`);
      setDrivers(res.data.drivers);
      if (res.data.drivers.length >= 2) {
        setSelectedDrivers([res.data.drivers[0].abbreviation, res.data.drivers[1].abbreviation]);
      } else if (res.data.drivers.length === 1) {
        setSelectedDrivers([res.data.drivers[0].abbreviation]);
      } else {
        setSelectedDrivers([]);
      }
    } catch (err) {
      console.error(err);
      setDrivers([]);
      setSelectedDrivers([]);
      if (err.response && err.response.status === 500) {
          setError(`The ${sessionType} session is completely unavailable or did not occur during this race weekend.`);
      } else {
          setError(`Failed to fetch drivers for the ${sessionType} session.`);
      }
    }
  };

  const loadTelemetry = async () => {
    if (selectedDrivers.length === 0 || !selectedRace) return;
    setLoading(true);
    setError(null);
    try {
      const requests = selectedDrivers.map(drv => 
        axios.get(`${API_BASE}/telemetry/fastest?year=${selectedYear}&round=${selectedRace}&session_type=${selectedSession}&driver=${drv}`)
      );
      const responses = await Promise.all(requests);
      const data = responses.map(res => res.data);
      setTelemetries(data);
      
      if (data.length > 0 && data[0].telemetry && data[0].telemetry.distance) {
          const maxDist = Math.max(...data.map(d => d.telemetry.distance[d.telemetry.distance.length - 1] || 0));
          const maxIdx = Math.max(...data.map(d => d.telemetry.distance.length - 1));
          setMaxDistance(maxDist);
          setMaxPlaybackIndex(maxIdx);
          setPlaybackIndex(maxIdx); // Default to fully loaded view until user clicks play
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
          setError(`Failed: ${err.response.data.detail}`);
      } else {
          setError("Failed to fetch telemetry data. FastF1 cache may still be spinning up or race data is unavailable.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSpecificLaps = async (lapSelections) => {
    if (Object.keys(lapSelections).length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const requests = Object.entries(lapSelections).map(([drv, lapNum]) => 
        axios.get(`${API_BASE}/telemetry/lap?year=${selectedYear}&round=${selectedRace}&session_type=${selectedSession}&driver=${drv}&lap_number=${lapNum}`)
      );
      const responses = await Promise.all(requests);
      const data = responses.map(res => res.data);
      setTelemetries(data);
      
      if (data.length > 0 && data[0].telemetry && data[0].telemetry.distance) {
          const maxDist = Math.max(...data.map(d => d.telemetry.distance[d.telemetry.distance.length - 1] || 0));
          const maxIdx = Math.max(...data.map(d => d.telemetry.distance.length - 1));
          setMaxDistance(maxDist);
          setMaxPlaybackIndex(maxIdx);
          setPlaybackIndex(maxIdx);
      }
      setActiveModal(null); // Close modal automatically upon plotting
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
          setError(`Failed: ${err.response.data.detail}`);
      } else {
          setError("Failed to fetch custom lap telemetry data.");
      }
    } finally {
      setLoading(false);
    }
  };

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
            try { await axios.get(`${API_BASE}/clear_cache`); } catch (err) { console.error(err); };
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
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {sidebarVisible && <Sidebar activeModal={activeModal} onMenuSelect={handleMenuSelect} />}

        {/* Modal Overlay */}
        {activeModal && activeModal !== 'Detailed Lap Analysis' && (
            <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-12 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="w-full h-full max-w-6xl max-h-[800px] relative shadow-2xl">
                  {renderModalContent()}
               </div>
            </div>
        )}
        
        <div className="flex-1 overflow-auto bg-[#0b0d10] relative">
          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 border border-red-500 text-white px-4 py-2 rounded shadow-2xl text-xs font-medium max-w-xl text-center flex items-center gap-4">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="hover:text-red-300 ml-auto font-bold px-2">✕</button>
            </div>
          )}
          
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
                 <TrackMap telemetryData={telemetries} playbackIndex={playbackIndex} allDrivers={drivers} />
              </WindowCard>
              
          </div>
        </div>
      </div>
      {/* Playback Controls Footer */}
      <PlaybackControls 
         maxIndex={maxPlaybackIndex} 
         playbackIndex={playbackIndex} 
         setPlaybackIndex={setPlaybackIndex} 
      />
    </div>
    </ErrorBoundary>
  );
}

export default App;
