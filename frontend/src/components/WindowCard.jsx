import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Activity } from 'lucide-react';

const WindowCard = ({ title, children, fullSpan = false, onClose }) => {
    const [minimized, setMinimized] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    // Force charts to resize when window is maximized/restored
    useEffect(() => {
        const timeout = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 50); // Slight delay for DOM layout calculation
        return () => clearTimeout(timeout);
    }, [maximized, minimized]);

    if (isClosed) return null;

    return (
        <div className={`bg-[#16181d] border border-[#2b2e36] flex flex-col shadow-lg overflow-hidden transition-all duration-150 ${maximized ? 'fixed inset-4 z-50 bg-[#16181d]' : minimized ? 'h-8 self-start' : 'h-full w-full'} ${fullSpan ? 'col-span-3' : ''}`}>
            {/* Window Header */}
            <div className={`bg-[#1b1d24] border-b border-[#2b2e36] px-2 py-1 flex items-center justify-between select-none ${minimized ? 'cursor-pointer hover:bg-[#22252e]' : ''}`} onClick={() => minimized && setMinimized(false)}>
                <div className="text-xs font-medium flex items-center gap-2">
                    {minimized ? (
                         <>
                             <Activity size={12} className="text-blue-500" />
                             <span className="text-[#e2e8f0] font-semibold">{title}</span>
                         </>
                    ) : (
                         <>
                             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                             <span className="text-gray-200">{title}</span>
                         </>
                    )}
                </div>
                <div className="flex items-center gap-3 text-gray-500" onClick={(e) => minimized && e.stopPropagation()}>
                    {minimized ? (
                        <Square size={12} className="hover:text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setMinimized(false); }} />
                    ) : (
                        <Minus size={12} className="hover:text-white cursor-pointer" onClick={() => setMinimized(true)} />
                    )}
                    {maximized ? (
                        <Square size={12} className="hover:text-white cursor-pointer" onClick={() => setMaximized(false)} />
                    ) : (
                        <Maximize2 size={12} className="hover:text-white cursor-pointer" onClick={() => setMaximized(true)} />
                    )}
                    <X size={12} className="hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onClose) { onClose(); } else { setIsClosed(true); } }} />
                </div>
            </div>
            
            {/* Window Body */}
            <div className={`flex-1 p-1 overflow-hidden relative bg-[#0b0d10] ${minimized ? 'hidden' : 'block'}`}>
                {children}
            </div>
        </div>
    );
};

export default WindowCard;
