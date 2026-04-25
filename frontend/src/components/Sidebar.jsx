import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, Settings, Zap, Map, FileSearch, Target, Gauge, Clock, Radio } from 'lucide-react';

const Sidebar = ({ activeModal, onMenuSelect }) => {
    const [expanded, setExpanded] = useState({ 
        'sec1': true, 'sec2': true, 'sec3': true, 'sec4': true, 
        'sec5': true, 'sec6': true, 'sec7': true, 'sec8': false 
    });

    const toggle = (sec) => {
        setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const isActive = (moduleName) => {
        // Main Telemetry Dashboard is special, it closes modal
        if (moduleName === 'Main Telemetry Dashboard' && !activeModal) return true;
        return activeModal === moduleName;
    };

    const handleSelect = (moduleName) => {
        if (onMenuSelect) onMenuSelect(moduleName);
    };

    return (
        <div className="w-[280px] bg-[#16181d] border-r border-[#2b2e36] flex flex-col h-full overflow-y-auto shrink-0 select-none pb-12">
            <div className="p-2 border-b border-[#2b2e36] text-xs font-bold text-gray-400 uppercase tracking-wider bg-[#1b1d24] sticky top-0 z-10">
                Analysis Modules
            </div>

            <div className="mt-2 text-sm text-gray-200">
                {/* 1. Historical Analysis */}
                <div>
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec1')}>
                        {expanded['sec1'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-purple-400">1. Historical Analysis</span>
                    </div>
                    {expanded['sec1'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Temperature Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Temperature Analysis')}><Activity size={14} /> 1.1 Temperature Analysis</div>
                            <div className={`tree-item ${isActive('Track Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Track Analysis')}><Map size={14} /> 1.2 Track Analysis</div>
                            <div className={`tree-item ${isActive('Pitstop Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Pitstop Analysis')}><Clock size={14} /> 1.3 Pitstop Analysis</div>
                            <div className={`tree-item ${isActive('Pit Strategy Gantt') ? 'active' : ''}`} onClick={() => handleSelect('Pit Strategy Gantt')}><Clock size={14} /> 1.4 Pit Strategy Gantt ✦</div>
                            <div className={`tree-item ${isActive('Accident & Flags Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Accident & Flags Analysis')}><Zap size={14} /> 1.5 Accident & Flags Analysis</div>
                            <div className={`tree-item ${isActive('Tire Strategy Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Tire Strategy Analysis')}><Target size={14} /> 1.6 Tire Strategy Analysis</div>
                            <div className={`tree-item ${isActive('Driver Run Position') ? 'active' : ''}`} onClick={() => handleSelect('Driver Run Position')}><Activity size={14} /> 1.7 Driver Run Position</div>
                            <div className={`tree-item ${isActive('Traffic Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Traffic Analysis')}><Activity size={14} /> 1.8 Traffic Analysis</div>
                        </div>
                    )}
                </div>

                {/* 2. Main Telemetry Analysis */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec2')}>
                        {expanded['sec2'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-emerald-400">2. Main Telemetry Analysis</span>
                    </div>
                    {expanded['sec2'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Main Telemetry Dashboard') ? 'active' : ''}`} onClick={() => handleSelect('Main Telemetry Dashboard')}><Activity size={14} /> 2.1 Main Telemetry Dashboard</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">2.2 Channel-Specific Analysis</div>
                            <div className={`tree-item ${isActive('Straight Line Speed') ? 'active' : ''}`} onClick={() => handleSelect('Straight Line Speed')}><Gauge size={14} /> Speed Analysis</div>
                            <div className={`tree-item ${isActive('Throttle/Brake Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Throttle/Brake Analysis')}><Activity size={14} /> Throttle & Brake Analysis</div>
                            <div className={`tree-item ${isActive('Steering/Gear Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Steering/Gear Analysis')}><Settings size={14} /> Gear & RPM Analysis</div>
                            <div className={`tree-item ${isActive('DRS & Acceleration') ? 'active' : ''}`} onClick={() => handleSelect('DRS & Acceleration')}><Zap size={14} /> Acceleration (Generic)</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">2.3 Delta Analysis</div>
                            <div className={`tree-item ${isActive('Delta Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Delta Analysis')}><Activity size={14} /> Delta Analysis</div>
                            <div className={`tree-item ${isActive('Lap-by-Lap Comparison') ? 'active' : ''}`} onClick={() => handleSelect('Lap-by-Lap Comparison')}><FileSearch size={14} /> Lap-by-Lap Comparison</div>
                            <div className={`tree-item ${isActive('Lap Delta Overlay') ? 'active' : ''}`} onClick={() => handleSelect('Lap Delta Overlay')}><Activity size={14} /> 2.4 Lap Delta Overlay</div>
                        </div>
                    )}
                </div>

                {/* 3. Lap Data & Long Run */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec3')}>
                        {expanded['sec3'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-cyan-400">3. Lap Data & Long Run</span>
                    </div>
                    {expanded['sec3'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Detailed Lap Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Detailed Lap Analysis')}><FileSearch size={14} /> 3.1 Detailed Lap Data</div>
                            <div className={`tree-item ${isActive('Lap Time Box Plot') ? 'active' : ''}`} onClick={() => handleSelect('Lap Time Box Plot')}><Activity size={14} /> 3.2 Lap Time Box Plot</div>
                            <div className={`tree-item ${isActive('Throttle Corner Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Throttle Corner Analysis')}><Map size={14} /> 3.3 Throttle Corner Analysis</div>
                            <div className={`tree-item ${isActive('Pedal Behavior Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Pedal Behavior Analysis')}><Activity size={14} /> 3.4 Pedal Behavior Analysis</div>
                            <div className={`tree-item ${isActive('Long Run Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Long Run Analysis')}><Activity size={14} /> 3.5 Long Run Analysis</div>
                            <div className={`tree-item ${isActive('Tyre Degradation') ? 'active' : ''}`} onClick={() => handleSelect('Tyre Degradation')}><Activity size={14} /> 3.6 Tyre Degradation</div>
                        </div>
                    )}
                </div>

                {/* 4. Ideal Lap Analysis */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec4')}>
                        {expanded['sec4'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-orange-400">4. Ideal Lap Analysis</span>
                    </div>
                    {expanded['sec4'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Ideal Lap Ranking') ? 'active' : ''}`} onClick={() => handleSelect('Ideal Lap Ranking')}><Target size={14} /> Sector Reconstruction</div>
                            <div className={`tree-item ${isActive('Sector Mini-Splits') ? 'active' : ''}`} onClick={() => handleSelect('Sector Mini-Splits')}><Map size={14} /> Sector Mini-Splits ✦</div>
                        </div>
                    )}
                </div>

                {/* 5. Performance Evaluation */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec5')}>
                        {expanded['sec5'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-pink-400">5. Performance Evaluation</span>
                    </div>
                    {expanded['sec5'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Straight Line Speed') ? 'active' : ''}`} onClick={() => handleSelect('Straight Line Speed')}><Gauge size={14} /> 5.1 Straight Line Speed</div>
                            <div className={`tree-item ${isActive('Brake & Accel Performance') ? 'active' : ''}`} onClick={() => handleSelect('Brake & Accel Performance')}><Zap size={14} /> 5.2 Brake & Accel Perf</div>
                            <div className={`tree-item ${isActive('Corner Classification') ? 'active' : ''}`} onClick={() => handleSelect('Corner Classification')}><Map size={14} /> 5.3 Corner Classification</div>
                        </div>
                    )}
                </div>

                {/* 6. AI Prediction Models */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec6')}>
                        {expanded['sec6'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-blue-400">6. AI Prediction Models</span>
                    </div>
                    {expanded['sec6'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('AI Prediction Models') ? 'active' : ''}`} onClick={() => handleSelect('AI Prediction Models')}><Target size={14} /> Qualifying & Race</div>
                        </div>
                    )}
                </div>

                {/* 7. Multi-Season Analysis */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec7')}>
                        {expanded['sec7'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-yellow-400">7. Multi-Season Analysis</span>
                    </div>
                    {expanded['sec7'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className={`tree-item ${isActive('Historical Track Map') ? 'active' : ''}`} onClick={() => handleSelect('Historical Track Map')}><Map size={14} /> 7.1 Historical Track Map</div>
                            <div className={`tree-item ${isActive('Season Start Reaction') ? 'active' : ''}`} onClick={() => handleSelect('Season Start Reaction')}><Zap size={14} /> 7.2 Season Start Reaction</div>
                        </div>
                    )}
                </div>

                {/* 8. Live Timing & Core Monitoring */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('sec8')}>
                        {expanded['sec8'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold text-red-400">8. Live Timing & Strategy</span>
                    </div>
                    {expanded['sec8'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-0.5">
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.1 Core Monitoring</div>
                            <div className={`tree-item ${isActive('Ranking Tower') ? 'active' : ''}`} onClick={() => handleSelect('Ranking Tower')}><Activity size={14} /> Ranking Tower</div>
                            <div className={`tree-item ${isActive('Live Track Map') ? 'active' : ''}`} onClick={() => handleSelect('Live Track Map')}><Map size={14} /> Track Map</div>
                            <div className={`tree-item ${isActive('Circle Map') ? 'active' : ''}`} onClick={() => handleSelect('Circle Map')}><Radio size={14} /> Circle Map</div>
                            <div className={`tree-item ${isActive('Track & Weather') ? 'active' : ''}`} onClick={() => handleSelect('Track & Weather')}><Activity size={14} /> Track & Weather</div>
                            
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.2 Strategy & Prescription</div>
                            <div className={`tree-item ${isActive('Driver Strategy') ? 'active' : ''}`} onClick={() => handleSelect('Driver Strategy')}><Target size={14} /> Driver Strategy</div>
                            <div className={`tree-item ${isActive('Battle Insight') ? 'active' : ''}`} onClick={() => handleSelect('Battle Insight')}><Target size={14} /> Battle Insight</div>
                            <div className={`tree-item ${isActive('Chase Strategy') ? 'active' : ''}`} onClick={() => handleSelect('Chase Strategy')}><Activity size={14} /> Chase Strategy</div>
                            <div className={`tree-item ${isActive('Pit Window') ? 'active' : ''}`} onClick={() => handleSelect('Pit Window')}><Clock size={14} /> Pit Window</div>
                            <div className={`tree-item ${isActive('Live Tyre Strategy') ? 'active' : ''}`} onClick={() => handleSelect('Live Tyre Strategy')}><Target size={14} /> Tyre Strategy</div>
                            
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.3 Telemetry & Performance</div>
                            <div className={`tree-item ${isActive('Real-time Traces') ? 'active' : ''}`} onClick={() => handleSelect('Real-time Traces')}><Activity size={14} /> Real-time Traces</div>
                            <div className={`tree-item ${isActive('Live Sector Comparison') ? 'active' : ''}`} onClick={() => handleSelect('Live Sector Comparison')}><Activity size={14} /> Sector Comparison</div>
                            <div className={`tree-item ${isActive('SF% History') ? 'active' : ''}`} onClick={() => handleSelect('SF% History')}><Gauge size={14} /> SF% History</div>
                            <div className={`tree-item ${isActive('Top Speed History') ? 'active' : ''}`} onClick={() => handleSelect('Top Speed History')}><Gauge size={14} /> Top Speed History</div>

                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.4 History & Stats</div>
                            <div className={`tree-item ${isActive('Lap History Tables') ? 'active' : ''}`} onClick={() => handleSelect('Lap History Tables')}><FileSearch size={14} /> Lap History Tables</div>
                            <div className={`tree-item ${isActive('Lap Time Distribution') ? 'active' : ''}`} onClick={() => handleSelect('Lap Time Distribution')}><Activity size={14} /> Lap Time Distribution</div>
                            <div className={`tree-item ${isActive('Live Traffic Timeline') ? 'active' : ''}`} onClick={() => handleSelect('Live Traffic Timeline')}><Activity size={14} /> Live Traffic Timeline</div>
                            <div className={`tree-item ${isActive('Traffic Distance') ? 'active' : ''}`} onClick={() => handleSelect('Traffic Distance')}><Activity size={14} /> Traffic Distance</div>

                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.5 Others</div>
                            <div className={`tree-item ${isActive('Race Control') ? 'active' : ''}`} onClick={() => handleSelect('Race Control')}><Radio size={14} /> Race Control Messages</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default React.memo(Sidebar);
