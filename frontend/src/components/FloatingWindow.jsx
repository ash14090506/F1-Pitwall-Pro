import React from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';

const FloatingWindow = ({ id, title, children, onClose, defaultProps = {}, isFocused, onFocus }) => {
    return (
        <Rnd
            default={{
                x: defaultProps.x || Math.random() * 100 + 50,
                y: defaultProps.y || Math.random() * 100 + 50,
                width: defaultProps.width || 600,
                height: defaultProps.height || 400,
            }}
            minWidth={300}
            minHeight={200}
            bounds="parent"
            dragHandleClassName="drag-handle"
            className={`absolute flex flex-col bg-[#16181d] border border-[#2b2e36] rounded shadow-2xl overflow-hidden ${isFocused ? 'z-50 ring-1 ring-blue-500/50' : 'z-40'}`}
            onMouseDown={() => onFocus && onFocus(id)}
        >
            {/* Header / Drag Handle */}
            <div className="drag-handle flex items-center justify-between px-3 py-1.5 bg-[#1b1d24] border-b border-[#2b2e36] cursor-move select-none">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest truncate">{title}</span>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onClose && onClose(id); }} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 relative bg-[#0b0d10] overflow-hidden">
                {children}
            </div>
        </Rnd>
    );
};

export default FloatingWindow;
