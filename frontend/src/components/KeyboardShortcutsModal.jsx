import React from 'react';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcutsModal = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Telemetry' },
    { key: '← / →', desc: 'Step Frame Backward / Forward' },
    { key: 'Shift + ←/→', desc: 'Step 10 Frames Backward / Forward' },
    { key: '↑ / ↓', desc: 'Adjust Playback Speed' },
    { key: 'Home / End', desc: 'Jump to Start / End' },
    { key: '[ / ]', desc: 'Switch Single Driver (Previous/Next)' },
    { key: 'E', desc: 'Export Dashboard (PNG/PDF)' },
    { key: '?', desc: 'Toggle Keyboard Shortcuts Panel' },
  ];

  return (
    <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#1b1d24] border border-[#2b2e36] rounded shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#2b2e36]">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Keyboard size={18} className="text-blue-500" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{s.desc}</span>
              <kbd className="bg-[#0b0d10] border border-[#2b2e36] text-gray-200 px-2 py-1 rounded text-xs font-mono shadow-sm whitespace-nowrap">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
