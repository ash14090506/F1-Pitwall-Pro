import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

const PlaybackControls = ({ maxIndex, playbackIndex, setPlaybackIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(2); // Default to 2x since 600 points at 50ms is 30s replay.

    const togglePlay = useCallback(() => {
        if (playbackIndex >= maxIndex) setPlaybackIndex(0);
        setIsPlaying(prev => !prev);
    }, [playbackIndex, maxIndex, setPlaybackIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT';
            if (isInput) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    setPlaybackIndex(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowRight':
                    setPlaybackIndex(prev => Math.min(maxIndex, prev + 1));
                    break;
                case 'Home':
                    setPlaybackIndex(0);
                    break;
                case 'End':
                    setPlaybackIndex(maxIndex);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, maxIndex, setPlaybackIndex]);

    useEffect(() => {
        let interval;
        if (isPlaying && maxIndex > 0) {
            interval = setInterval(() => {
                setPlaybackIndex(prev => {
                    const next = prev + speed;
                    if (next >= maxIndex) {
                        setIsPlaying(false);
                        return maxIndex;
                    }
                    return next;
                });
            }, 40); // Request frame roughly ~25 FPS
        }
        return () => clearInterval(interval);
    }, [isPlaying, maxIndex, speed, setPlaybackIndex]);

    return (
        <div className="flex items-center gap-4 bg-[#1b1d24] px-4 py-2 border-t border-[#2b2e36] text-xs w-full shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-50">
            <button 
                onClick={togglePlay} 
                className="bg-blue-600 hover:bg-blue-500 rounded p-1.5 text-white disabled:opacity-50 transition-colors shadow-sm"
                disabled={maxIndex === 0}
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>

            <select 
                className="bg-[#0b0d10] border border-[#2b2e36] text-gray-200 px-2 py-1 rounded cursor-pointer outline-none font-semibold focus:border-blue-500 transition-colors"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
            >
                <option value={1}>1x Speed</option>
                <option value={2}>2x Speed</option>
                <option value={4}>4x Speed</option>
                <option value={8}>8x Speed</option>
                <option value={16}>16x Speed</option>
            </select>

            <div className="flex-1 flex items-center px-4">
                <input 
                    type="range" 
                    min="0" 
                    max={maxIndex || 100} 
                    value={playbackIndex || 0} 
                    onChange={(e) => {
                        setPlaybackIndex(parseInt(e.target.value));
                    }}
                    disabled={maxIndex === 0}
                    className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
                />
            </div>
            
            <div className="text-blue-400 font-mono w-16 text-right font-bold tracking-wider">
                {Math.min(100, Math.round(((playbackIndex || 0) / (maxIndex || 1)) * 100))}%
            </div>
        </div>
    );
};

export default PlaybackControls;
