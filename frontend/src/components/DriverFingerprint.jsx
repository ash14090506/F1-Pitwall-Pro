import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { RefreshCw, Users, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const DriverFingerprint = ({ sessionData, selectedDrivers }) => {
  const [fingerprintData, setFingerprintData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionData || !selectedDrivers || selectedDrivers.length === 0) {
      setFingerprintData([]);
      return;
    }

    const fetchFingerprints = async () => {
      setLoading(true);
      setError(null);
      try {
        const driversStr = selectedDrivers.map(d => d.abbreviation || d).join(',');
        const response = await axios.get(`${API_BASE}/api/driver_style`, {
          params: {
            year: sessionData.year,
            round: sessionData.round,
            session_type: sessionData.session_type || sessionData.session,
            drivers: driversStr
          }
        });
        
        if (response.data && response.data.fingerprints) {
          setFingerprintData(response.data.fingerprints);
        } else {
          setFingerprintData([]);
        }
      } catch (err) {
        console.error("Failed to fetch driver style fingerprints:", err);
        setError("Failed to load driver fingerprint data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFingerprints();
  }, [sessionData, selectedDrivers]);

  if (!sessionData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-900 rounded-xl border border-slate-800 p-8">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a session to view driver fingerprints.</p>
      </div>
    );
  }

  if (selectedDrivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-900 rounded-xl border border-slate-800 p-8">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Select at least one driver to view their style fingerprint.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 rounded-xl border border-slate-800 p-8">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Computing telemetry fingerprint...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 rounded-xl border border-red-900/30 p-8 text-red-400">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  const axes = ['Consistency', 'Braking Aggression', 'Throttle Commitment', 'Cornering G-Force', 'Top Speed'];

  // Match driver colors if possible
  const getDriverColor = (abbr) => {
    const driverObj = selectedDrivers.find(d => d.abbreviation === abbr || d === abbr);
    return driverObj?.team_color ? `#${driverObj.team_color}` : '#ffffff';
  };

  const plotData = fingerprintData.map(fp => {
    // Close the loop by repeating the first value
    const rValues = [
      fp.consistency,
      fp.braking,
      fp.throttle,
      fp.cornering,
      fp.speed,
      fp.consistency
    ];
    
    // Also repeat first axis
    const thetaValues = [...axes, axes[0]];

    return {
      type: 'scatterpolar',
      r: rValues,
      theta: thetaValues,
      fill: 'toself',
      name: fp.driver,
      line: {
        color: getDriverColor(fp.driver)
      },
      marker: {
        color: getDriverColor(fp.driver),
        size: 8
      },
      hovertemplate: "%{theta}: %{r:.1f}<extra></extra>"
    };
  });

  const layout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 100],
        color: '#475569', // slate-600
        gridcolor: '#334155', // slate-700
        linecolor: '#334155',
        tickfont: { color: '#94a3b8' } // slate-400
      },
      angularaxis: {
        tickfont: {
          color: '#cbd5e1', // slate-300
          size: 13
        },
        gridcolor: '#334155',
        linecolor: '#334155',
      },
      bgcolor: '#0f172a' // slate-900
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      font: { color: '#e2e8f0' } // slate-200
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 40, r: 40, b: 40, l: 40 },
    autosize: true
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Driver Style Fingerprint
          </h2>
          <p className="text-xs text-slate-400 mt-1">Radar chart comparing telemetry-derived style characteristics</p>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[400px]">
        {fingerprintData.length > 0 ? (
          <Plot
            data={plotData}
            layout={layout}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            useResizeHandler={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            No valid telemetry found to compute fingerprints.
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverFingerprint;
