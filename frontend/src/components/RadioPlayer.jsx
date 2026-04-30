import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Radio, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';

/**
 * RadioPlayer — syncs FastF1 team radio audio clips to the playback engine.
 *
 * Props:
 *   clips        — array of { driver, session_time_s, url, utc_time }
 *   playbackIndex — current global playback index (0..N)
 *   telemetryData — array of driver telemetry payloads (each has .telemetry.time[])
 *   isEnabled    — boolean: user can mute the radio
 *   driverColors — Map<driver_abbrev, hex_color>
 */
const RadioPlayer = ({ clips = [], playbackIndex, telemetryData = [], isEnabled, driverColors = {} }) => {
    const audioRef = useRef(null);
    const lastPlayedUrlRef = useRef(null);
    const [currentClip, setCurrentClip] = useState(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [clipIndex, setClipIndex] = useState(null); // index into clips[]
    const [volume, setVolume] = useState(0.85);

    // Derive current session time in seconds from playback index + first driver's time array
    const getCurrentSessionTime = useCallback(() => {
        if (!telemetryData.length) return null;
        // Use the first loaded driver's time array as the reference timeline
        const primary = telemetryData[0];
        const times = primary?.telemetry?.time;
        if (!times || times.length === 0) return null;
        const clamped = Math.min(playbackIndex, times.length - 1);
        return times[clamped]; // time values are already in seconds
    }, [telemetryData, playbackIndex]);

    // Find the nearest radio clip to the current session time within a ±12s window
    const findNearestClip = useCallback((sessionTimeSec) => {
        if (!clips.length || sessionTimeSec === null) return null;
        const WINDOW = 12; // seconds — how close a clip must be to trigger
        let best = null;
        let bestDiff = Infinity;
        clips.forEach((clip, i) => {
            const diff = Math.abs(clip.session_time_s - sessionTimeSec);
            if (diff < bestDiff && diff <= WINDOW) {
                bestDiff = diff;
                best = { clip, index: i };
            }
        });
        return best;
    }, [clips]);

    // Play / stop audio when playback position changes
    useEffect(() => {
        if (!isEnabled || !clips.length) return;

        const sessionTimeSec = getCurrentSessionTime();
        if (sessionTimeSec === null) return;

        const found = findNearestClip(sessionTimeSec);

        if (!found) {
            // No clip nearby — don't interrupt if already playing the last clip
            return;
        }

        const { clip, index } = found;

        // Don't replay a clip that's already playing
        if (clip.url === lastPlayedUrlRef.current) return;

        // Stop previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Instantiate and play
        const audio = new Audio(clip.url);
        audio.volume = volume;
        audioRef.current = audio;
        lastPlayedUrlRef.current = clip.url;
        setCurrentClip(clip);
        setClipIndex(index);

        audio.play().then(() => setIsAudioPlaying(true)).catch(err => {
            // Autoplay may be blocked by the browser on first interaction — fail silently
            console.warn('[RadioPlayer] Autoplay blocked or failed:', err.message);
            setIsAudioPlaying(false);
        });

        audio.onended = () => {
            setIsAudioPlaying(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackIndex, isEnabled]);

    // Volume sync
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Stop audio when radio is disabled
    useEffect(() => {
        if (!isEnabled && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsAudioPlaying(false);
            setCurrentClip(null);
        }
    }, [isEnabled]);

    // Manual skip controls
    const skipToClip = useCallback((targetIndex) => {
        if (!clips[targetIndex]) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        const clip = clips[targetIndex];
        const audio = new Audio(clip.url);
        audio.volume = volume;
        audioRef.current = audio;
        lastPlayedUrlRef.current = clip.url;
        setCurrentClip(clip);
        setClipIndex(targetIndex);
        audio.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false));
        audio.onended = () => setIsAudioPlaying(false);
    }, [clips, volume]);

    if (!clips.length) return null;

    const driverColor = currentClip ? (driverColors[currentClip.driver] || '#3b82f6') : '#3b82f6';
    const totalClips = clips.length;

    return (
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded border transition-all duration-300 ${
            isAudioPlaying
                ? 'bg-[#1a1f2e] border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'bg-[#16181d] border-[#2b2e36]'
        }`}>
            {/* Radio icon — pulsing when active */}
            <div className={`relative flex items-center justify-center ${isAudioPlaying ? 'text-blue-400' : 'text-gray-500'}`}>
                <Radio size={14} />
                {isAudioPlaying && (
                    <span className="absolute -inset-1 rounded-full bg-blue-400/20 animate-ping pointer-events-none" />
                )}
            </div>

            {/* Waveform animation (3 bars) */}
            {isAudioPlaying && (
                <div className="flex items-end gap-[2px] h-4">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="w-[3px] bg-blue-400 rounded-full"
                            style={{
                                height: `${40 + Math.sin(Date.now() / 200 + i) * 30}%`,
                                animation: `waveBar 0.${6 + i}s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.12}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Current clip info */}
            {currentClip ? (
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wider"
                        style={{ backgroundColor: `#${driverColor}22`, color: `#${driverColor}`, border: `1px solid #${driverColor}55` }}
                    >
                        {currentClip.driver}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                        {isAudioPlaying ? 'LIVE RADIO' : 'Radio'}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                        {Math.floor(currentClip.session_time_s / 60)}:{String(Math.floor(currentClip.session_time_s % 60)).padStart(2, '0')}
                    </span>
                </div>
            ) : (
                <span className="text-[10px] text-gray-500">{totalClips} clips</span>
            )}

            {/* Skip back */}
            <button
                onClick={() => skipToClip(Math.max(0, (clipIndex ?? 0) - 1))}
                className="text-gray-500 hover:text-white transition-colors p-0.5"
                title="Previous radio clip"
                disabled={clipIndex === 0 || clipIndex === null}
            >
                <SkipBack size={11} />
            </button>

            {/* Skip forward */}
            <button
                onClick={() => skipToClip(Math.min(totalClips - 1, (clipIndex ?? -1) + 1))}
                className="text-gray-500 hover:text-white transition-colors p-0.5"
                title="Next radio clip"
                disabled={clipIndex === totalClips - 1}
            >
                <SkipForward size={11} />
            </button>

            {/* Clip counter */}
            {clipIndex !== null && (
                <span className="text-[9px] text-gray-600 font-mono">
                    {clipIndex + 1}/{totalClips}
                </span>
            )}

            {/* Volume slider */}
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-14 accent-blue-400 h-1 cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
            />
        </div>
    );
};

export default RadioPlayer;
