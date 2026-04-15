import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, Settings, Zap, Map, FileSearch } from 'lucide-react';

const Sidebar = ({ activeModal, onMenuSelect }) => {
    const [expanded, setExpanded] = useState({ 'overview': true, 'performance': true });

    const toggle = (sec) => {
        setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const isActive = (moduleName) => {
        if (moduleName === 'Detailed Lap Analysis' && !activeModal) return true;
        return activeModal === moduleName;
    };

    const handleSelect = (moduleName) => {
        if (onMenuSelect) onMenuSelect(moduleName === 'Detailed Lap Analysis' ? null : moduleName);
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
                            <div className={`tree-item ${isActive('Driver Run Position') ? 'active' : ''}`} onClick={() => handleSelect('Driver Run Position')}><Activity size={14} /> Driver Run Position</div>
                            <div className={`tree-item ${isActive('Lap-by-Lap Comparison') ? 'active' : ''}`} onClick={() => handleSelect('Lap-by-Lap Comparison')}><FileSearch size={14} /> Lap-by-Lap Comparison</div>
                            <div className={`tree-item ${isActive('Throttle/Brake Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Throttle/Brake Analysis')}><Activity size={14} /> Throttle/Brake Analysis</div>
                            <div className={`tree-item ${isActive('Steering/Gear Analysis') ? 'active' : ''}`} onClick={() => handleSelect('Steering/Gear Analysis')}><Settings size={14} /> Steering/Gear Analysis</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
