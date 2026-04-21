import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, Settings, Zap, Map, FileSearch, Target, Gauge } from 'lucide-react';

const Sidebar = ({ activeModal, onMenuSelect }) => {
    const [expanded, setExpanded] = useState({ 'overview': true, 'performance': true, 'ideal': true, 'speed': true });

    const toggle = (sec) => {
        setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const isActive = (moduleName) => {
        if (moduleName === 'Detailed Lap Analysis' && !activeModal) return true;
        return activeModal === moduleName;
    };

    const handleSelect = (moduleName) => {
        if (onMenuSelect) onMenuSelect(moduleName);
    };

    return (
        <div className="w-64 bg-[#16181d] border-r border-[#2b2e36] flex flex-col h-full overflow-y-auto shrink-0 select-none">
            <div className="p-2 border-b border-[#2b2e36] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Analysis Modules
            </div>

            <div className="mt-2 text-sm text-gray-200">
                {/* Race Overview Section */}
                <div>
                    <div className="flex items-center px-2 py-1 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('overview')}>
                        {expanded['overview'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold">Race Overview Analysis</span>
                    </div>
                    {expanded['overview'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-1">
                            <div className={`tree-item ${isActive('Track Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Track Analysis')}><Map size={14} /> Track Analysis</div>
                            <div className={`tree-item ${isActive('Temperature Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Temperature Analysis')}><Activity size={14} /> Temperature Analysis</div>
                            <div className={`tree-item ${isActive('Pitstop Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Pitstop Analysis')}><Activity size={14} /> Pitstop Analysis</div>
                            <div className={`tree-item ${isActive('Accident & Flags Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Accident & Flags Analysis')}><Zap size={14} /> Accident & Flags Analysis</div>
                            <div className={`tree-item ${isActive('Tire Strategy Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Tire Strategy Analysis')}><Zap size={14} /> Tire Strategy Analysis</div>
                        </div>
                    )}
                </div>

                {/* Driver Performance Section */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('performance')}>
                        {expanded['performance'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold">Driver Performance Analysis</span>
                    </div>
                    {expanded['performance'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-1">
                            <div className={`tree-item ${isActive('Detailed Lap Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Detailed Lap Analysis')}><FileSearch size={14} /> Detailed Lap Analysis</div>
                            <div className={`tree-item ${isActive('Lap Time Box Plot') ? 'active' : ''}`} onClick={() => handleSelect('Lap Time Box Plot')}><Activity size={14} /> Lap Time Box Plot</div>
                            <div className={`tree-item ${isActive('Long Run Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Long Run Analysis')}><Activity size={14} /> Long Run Analysis</div>
                            <div className={`tree-item ${isActive('Pedal Behavior Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Pedal Behavior Analysis')}><Activity size={14} /> Pedal Behavior Analysis</div>
                            <div className={`tree-item ${isActive('Throttle Corner Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Throttle Corner Analysis')}><Map size={14} /> Throttle Corner Analysis</div>
                            <div className={`tree-item ${isActive('Driver Run Position') ? 'active' : ''}`} onClick={() => handleSelect('Driver Run Position')}><Activity size={14} /> Driver Run Position</div>
                            <div className={`tree-item ${isActive('Traffic Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Traffic Analysis')}><Activity size={14} /> Traffic Analysis</div>
                            <div className={`tree-item ${isActive('Lap-by-Lap Comparison') ? 'active' : ''}`} onClick={() => handleSelect('Lap-by-Lap Comparison')}><FileSearch size={14} /> Lap-by-Lap Comparison</div>
                            <div className={`tree-item ${isActive('Throttle/Brake Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Throttle/Brake Analysis')}><Activity size={14} /> Throttle/Brake Analysis</div>
                            <div className={`tree-item ${isActive('Steering/Gear Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Steering/Gear Analysis')}><Settings size={14} /> Steering/Gear Analysis</div>
                            <div className={`tree-item ${isActive('DRS & Acceleration') ? 'active' : ''}`} onClick={() => handleSelect('DRS & Acceleration')}><Activity size={14} /> DRS & Acceleration</div>
                            <div className={`tree-item ${isActive('Delta Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Delta Analysis')}><Activity size={14} /> Delta Analysis</div>
                        </div>
                    )}
                </div>

                {/* Speed & Corner Analysis Section */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('speed')}>
                        {expanded['speed'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold">Speed & Corner Analysis</span>
                    </div>
                    {expanded['speed'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-1">
                            <div className={`tree-item ${isActive('Straight Line Speed') ? 'active' : ''}`} onClick={() => handleSelect('Straight Line Speed')}><Gauge size={14} /> Straight Line Speed</div>
                            <div className={`tree-item ${isActive('Brake & Accel Performance') ? 'active' : ''}`} onClick={() => handleSelect('Brake & Accel Performance')}><Zap size={14} /> Brake & Accel Performance</div>
                            <div className={`tree-item ${isActive('Corner Classification') ? 'active' : ''}`} onClick={() => handleSelect('Corner Classification')}><Map size={14} /> Corner Classification</div>
                        </div>
                    )}
                </div>

                {/* Ideal Lap & Sectors Section */}
                <div className="mt-2">
                    <div className="flex items-center px-2 py-1 cursor-pointer hover:bg-[#2b2e36]" onClick={() => toggle('ideal')}>
                        {expanded['ideal'] ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                        <span className="font-semibold">Ideal Lap & Sectors</span>
                    </div>
                    {expanded['ideal'] && (
                        <div className="pl-6 border-l border-[#2b2e36] ml-3 mt-1 space-y-1">
                            <div className={`tree-item ${isActive('Ideal Lap Ranking') ? 'active' : ''}`} onClick={() => handleSelect('Ideal Lap Ranking')}><Target size={14} /> Ranking Table</div>
                            <div className={`tree-item ${isActive('Sector Comparison') ? 'active' : ''}`} onClick={() => handleSelect('Ideal Lap Ranking')}><Activity size={14} /> Sector Comparison</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
