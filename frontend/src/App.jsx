import React, { useState, useEffect } from 'react';
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
import { Play } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8001/api';

function App() {
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedSession, setSelectedSession] = useState('R');
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [telemetries, setTelemetries] = useState([]);

  // UI States
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Playback States
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [maxPlaybackIndex, setMaxPlaybackIndex] = useState(0);
  const [maxDistance, setMaxDistance] = useState(0);

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
      switch(activeModal) {
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
          case 'Throttle/Brake Analysis':
              return (
                  <div className="h-full w-full flex flex-col gap-3 relative">
                      <button onClick={() => setActiveModal(null)} className="absolute -top-8 right-0 text-white hover:text-red-500 z-50 px-2 py-1 bg-red-900/50 rounded text-xs font-bold border border-red-500/50">✕ CLOSE WINDOW</button>
                      <WindowCard title="Throttle High-Fidelity Module" fullSpan={true}>
                          <LineChart title="Throttle" yLabel="%" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
                      </WindowCard>
                      <WindowCard title="Brake Pressure High-Fidelity Module" fullSpan={true}>
                          <LineChart title="Brake" yLabel="Pressure %" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
                      </WindowCard>
                  </div>
              );
          case 'Steering/Gear Analysis':
              return (
                  <div className="h-full w-full flex flex-col gap-3 relative">
                      <WindowCard title="Gear Analysis" onClose={() => setActiveModal(null)}>
                          <LineChart title="Gear Analysis" dataKey="nGear" yLabel="Gear" maxVal={8} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
                      </WindowCard>
                  </div>
              );
          case 'Driver Run Position':
              return (
                  <WindowCard title="Grid Progression & Run Layout" fullSpan={true} onClose={() => setActiveModal(null)}>
                      <DriverPositionChart year={selectedYear} round={selectedRace} sessionType={selectedSession} allDrivers={drivers} />
                  </WindowCard>
              );
          default:
              return (
                  <WindowCard title={activeModal} fullSpan={true} onClose={() => setActiveModal(null)}>
                      <div className="flex items-center justify-center h-full w-full bg-[#0b0d10] text-[#64748b] text-sm">
                          Data for <strong className="mx-1 text-white">{activeModal}</strong> is currently unavailable or disconnected.
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
      if (drv && !selectedDrivers.includes(drv) && selectedDrivers.length < 5) {
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
          {selectedDrivers.length < 5 && (
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
        {sidebarVisible && <Sidebar activeModal={activeModal} onMenuSelect={setActiveModal} />}

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
                <LineChart title="Speed" yLabel="km/h" maxVal={350} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
              </WindowCard>
              
              <WindowCard title={`Brake Analysis_${selectedYear}_${selectedSession}`}>
                <LineChart title="Brake" yLabel="Pressure %" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
              </WindowCard>

              <WindowCard title={`Throttle Analysis_${selectedYear}_${selectedSession}`}>
                <LineChart title="Throttle" yLabel="%" maxVal={105} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
              </WindowCard>

              {/* Bottom Row: Gear, RPM, Track Map */}
              <WindowCard title={`Gear Analysis_${selectedYear}_${selectedSession}`}>
                <LineChart title="nGear" dataKey="gear" yLabel="Gear" maxVal={9} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
              </WindowCard>

              <WindowCard title={`RPM Analysis_${selectedYear}_${selectedSession}`}>
                <LineChart title="RPM" yLabel="Revs" maxVal={13000} telemetryData={telemetries} allDrivers={drivers} playbackIndex={playbackIndex} fixedXMax={maxDistance} />
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
