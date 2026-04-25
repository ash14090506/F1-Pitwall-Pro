import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const PlaybackControls = ({ maxIndex, playbackIndex, setPlaybackIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(2);
    const workerRef = useRef(null);

    // Initialise the Web Worker once on mount; terminate on unmount
    useEffect(() => {
        const worker = new Worker('/playbackWorker.js');
        workerRef.current = worker;

        worker.onmessage = (e) => {
            if (e.data.type === 'TICK') {
                setPlaybackIndex(e.data.index);
            } else if (e.data.type === 'DONE') {
                setIsPlaying(false);
            }
        };

        return () => worker.terminate();
    }, [setPlaybackIndex]);

    // Keep the worker aware of the latest maxIndex so it stops at the right place
    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({ type: 'SPEED', speed });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed]);

    const togglePlay = useCallback(() => {
        const worker = workerRef.current;
        if (!worker) return;

        if (isPlaying) {
            worker.postMessage({ type: 'PAUSE' });
            setIsPlaying(false);
        } else {
            // Rewind if at the end
            if (playbackIndex >= maxIndex) {
                worker.postMessage({ type: 'SEEK', index: 0 });
                setPlaybackIndex(0);
            }
            worker.postMessage({ type: 'START', speed, maxIndex });
            setIsPlaying(true);
        }
    }, [isPlaying, playbackIndex, maxIndex, speed, setPlaybackIndex]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT';
            if (isInput) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft': {
                    const stepL = e.shiftKey ? 10 : 1;
                    const newIdxL = Math.max(0, playbackIndex - stepL);
                    workerRef.current?.postMessage({ type: 'SEEK', index: newIdxL });
                    setPlaybackIndex(newIdxL);
                    break;
                }
                case 'ArrowRight': {
                    const stepR = e.shiftKey ? 10 : 1;
                    const newIdxR = Math.min(maxIndex, playbackIndex + stepR);
                    workerRef.current?.postMessage({ type: 'SEEK', index: newIdxR });
                    setPlaybackIndex(newIdxR);
                    break;
                }
                case 'Home':
                    workerRef.current?.postMessage({ type: 'SEEK', index: 0 });
                    setPlaybackIndex(0);
                    break;
                case 'End':
                    workerRef.current?.postMessage({ type: 'SEEK', index: maxIndex });
                    setPlaybackIndex(maxIndex);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, maxIndex, playbackIndex, setPlaybackIndex]);

    // Sync scrubber drags back to the worker so it resumes from the correct position
    const handleScrub = useCallback((e) => {
        const newIdx = parseInt(e.target.value);
        workerRef.current?.postMessage({ type: 'SEEK', index: newIdx });
        setPlaybackIndex(newIdx);
    }, [setPlaybackIndex]);

    const handleSpeedChange = useCallback((e) => {
        const newSpeed = parseInt(e.target.value);
        setSpeed(newSpeed);
        // Restart the worker with new speed if currently playing
        if (isPlaying) {
            workerRef.current?.postMessage({ type: 'SPEED', speed: newSpeed });
        }
    }, [isPlaying]);

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
                onChange={handleSpeedChange}
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
                    onChange={handleScrub}
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
