import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, Settings, Zap, Map, FileSearch, Target, Gauge, Clock, Radio, ExternalLink } from 'lucide-react';

const Sidebar = ({ activeModal, onMenuSelect, onSpawnFloating }) => {
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

    const handleFloat = (e, moduleName) => {
        e.stopPropagation();
        if (onSpawnFloating) onSpawnFloating(moduleName);
    };

    const renderTreeItem = (name, icon, specialClass = '') => (
        <div className={`tree-item flex items-center justify-between group ${isActive(name) ? 'active' : ''} ${specialClass}`} onClick={() => handleSelect(name)}>
            <div className="flex items-center gap-1.5 truncate">
                {icon} <span className="truncate">{name}</span>
            </div>
            <button 
                onClick={(e) => handleFloat(e, name)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3b82f6] hover:text-white rounded text-gray-400 transition-all"
                title="Pop out as floating window"
            >
                <ExternalLink size={12} />
            </button>
        </div>
    );

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
                            {renderTreeItem('Temperature Analysis', <Activity size={14} />)}
                            {renderTreeItem('Track Analysis', <Map size={14} />)}
                            {renderTreeItem('Pitstop Analysis', <Clock size={14} />)}
                            {renderTreeItem('Pit Strategy Gantt', <Clock size={14} />)}
                            {renderTreeItem('Accident & Flags Analysis', <Zap size={14} />)}
                            {renderTreeItem('Tire Strategy Analysis', <Target size={14} />)}
                            {renderTreeItem('Driver Run Position', <Activity size={14} />)}
                            {renderTreeItem('Traffic Analysis', <Activity size={14} />)}
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
                            {renderTreeItem('Main Telemetry Dashboard', <Activity size={14} />)}
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">2.2 Channel-Specific Analysis</div>
                            {renderTreeItem('Straight Line Speed', <Gauge size={14} />)}
                            {renderTreeItem('Throttle/Brake Analysis', <Activity size={14} />)}
                            {renderTreeItem('Steering/Gear Analysis', <Settings size={14} />)}
                            {renderTreeItem('DRS & Acceleration', <Zap size={14} />)}
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">2.3 Delta Analysis</div>
                            {renderTreeItem('Delta Analysis', <Activity size={14} />)}
                            {renderTreeItem('Lap-by-Lap Comparison', <FileSearch size={14} />)}
                            {renderTreeItem('Lap Delta Overlay', <Activity size={14} />)}
                            {renderTreeItem('Sector Comparison Chart', <Zap size={14} />)}
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
                            {renderTreeItem('Detailed Lap Analysis', <FileSearch size={14} />)}
                            {renderTreeItem('Lap Time Box Plot', <Activity size={14} />)}
                            {renderTreeItem('Throttle Corner Analysis', <Map size={14} />)}
                            {renderTreeItem('Pedal Behavior Analysis', <Activity size={14} />)}
                            {renderTreeItem('Long Run Analysis', <Activity size={14} />)}
                            {renderTreeItem('Tyre Degradation', <Activity size={14} />)}
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
                            {renderTreeItem('Ideal Lap Ranking', <Target size={14} />)}
                            {renderTreeItem('Sector Mini-Splits', <Map size={14} />)}
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
                            {renderTreeItem('Straight Line Speed', <Gauge size={14} />)}
                            {renderTreeItem('Brake & Accel Performance', <Zap size={14} />)}
                            {renderTreeItem('Corner Classification', <Map size={14} />)}
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
                            {renderTreeItem('AI Prediction Models', <Target size={14} />)}
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
                            {renderTreeItem('Historical Track Map', <Map size={14} />)}
                            {renderTreeItem('Season Start Reaction', <Zap size={14} />)}
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
                            {renderTreeItem('Ranking Tower', <Activity size={14} />)}
                            {renderTreeItem('Live Track Map', <Map size={14} />)}
                            {renderTreeItem('Circle Map', <Radio size={14} />)}
                            {renderTreeItem('Track & Weather', <Activity size={14} />)}
                            
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.2 Strategy & Prescription</div>
                            {renderTreeItem('Driver Strategy', <Target size={14} />)}
                            {renderTreeItem('Battle Insight', <Target size={14} />)}
                            {renderTreeItem('Chase Strategy', <Activity size={14} />)}
                            {renderTreeItem('Pit Window', <Clock size={14} />)}
                            {renderTreeItem('Live Tyre Strategy', <Target size={14} />)}
                            
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.3 Telemetry & Performance</div>
                            {renderTreeItem('Real-time Traces', <Activity size={14} />)}
                            {renderTreeItem('Live Sector Comparison', <Activity size={14} />)}
                            {renderTreeItem('SF% History', <Gauge size={14} />)}
                            {renderTreeItem('Top Speed History', <Gauge size={14} />)}

                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.4 History & Stats</div>
                            {renderTreeItem('Lap History Tables', <FileSearch size={14} />)}
                            {renderTreeItem('Lap Time Distribution', <Activity size={14} />)}
                            {renderTreeItem('Live Traffic Timeline', <Activity size={14} />)}
                            {renderTreeItem('Traffic Distance', <Activity size={14} />)}

                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1 px-2">8.5 Others</div>
                            {renderTreeItem('Race Control', <Radio size={14} />)}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default React.memo(Sidebar);
