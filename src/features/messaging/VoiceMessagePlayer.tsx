import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ audioUrl, duration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isSimulating, setIsSimulating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simTimerRef = useRef<any>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isSimulating) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setAudioDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.warn("Audio element failed to load or play. Falling back to simulation mode for: ", audioUrl);
      setIsSimulating(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Initialize duration if it loaded immediately
    if (audio.duration && audio.duration !== Infinity) {
      setAudioDuration(audio.duration);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, isSimulating]);

  useEffect(() => {
    if (isSimulating && isPlaying) {
      simTimerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          const maxDur = audioDuration || duration || 5;
          if (next >= maxDur) {
            clearInterval(simTimerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, isPlaying, audioDuration, duration]);

  const togglePlay = () => {
    if (isSimulating) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.warn("Audio playback failed, switching to simulation mode:", err);
        setIsSimulating(true);
        setIsPlaying(true);
      });
      setIsPlaying(true);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isSimulating && audioRef.current) {
      audioRef.current.currentTime = value;
    }
    setCurrentTime(value);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) {
      return "0:00";
    }
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Pre-configured heights for a premium responsive SVG waveform
  const waves = [15, 30, 25, 40, 20, 35, 15, 30, 45, 20, 35, 25, 10, 30, 20, 40, 15, 25, 30, 10];

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-[#f0f2f5] hover:bg-[#eae6df] rounded-xl max-w-[280px] sm:max-w-[320px] select-none transition-colors duration-150 shadow-sm border border-black/5 mt-1" id="voice-player-container">
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#01755b] flex items-center justify-center text-white shrink-0 transition-all shadow active:scale-95 cursor-pointer"
        id="voice-play-toggle"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-end gap-[2px] h-[24px] px-1 select-none pointer-events-none">
          {waves.map((height, i) => {
            const isActive = (currentTime / (audioDuration || 1)) > (i / waves.length);
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-t transition-all duration-150 ${
                  isActive ? 'bg-[#00a884]' : 'bg-[#b6bec3]'
                } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{ 
                  height: `${height}%`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: '1.2s'
                }}
              />
            );
          })}
        </div>

        {/* Progress Slider Overlay */}
        <input 
          type="range"
          min={0}
          max={audioDuration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full accent-[#00a884] h-1.5 rounded-lg cursor-pointer bg-[#e1e3e6] hover:accent-[#01755b] transition-all"
          id="voice-progress-range"
        />

        {/* Time and metadata */}
        <div className="flex justify-between items-center text-[11px] text-[#667781] font-mono leading-none">
          <span>{formatTime(currentTime)} / {formatTime(audioDuration || duration)}</span>
          <span className="text-[10px] font-semibold text-[#00a884]">Voice Note</span>
        </div>
      </div>
    </div>
  );
};
