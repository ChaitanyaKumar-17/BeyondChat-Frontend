import { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, Play, Pause } from 'lucide-react';
import { generateWaveform } from '@/utils/audio';

export default function VoiceNotePlayer({ msgId, url, duration, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const waveHeights = useMemo(() => generateWaveform(msgId, 32), [msgId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    playing ? audio.pause() : audio.play();
  };

  const seek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const filledBars = Math.floor((progress / 100) * waveHeights.length);

  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 mb-1 min-w-[220px] ${isMe ? 'bg-indigo-700/40' : 'bg-white/[0.04]'}`}>
      <button 
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-500/20 hover:bg-indigo-500/30'}`}
      >
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-end gap-[2px] h-5 cursor-pointer" onClick={seek}>
          {waveHeights.map((h, i) => (
            <div 
              key={i} 
              className={`w-[3px] rounded-full transition-colors duration-150 ${i < filledBars ? (isMe ? 'bg-white/80' : 'bg-indigo-400') : (isMe ? 'bg-white/25' : 'bg-indigo-400/30')}`} 
              style={{ height: `${h}px` }} 
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-white/50 font-mono tabular-nums">{playing || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}</span>
          <Mic size={12} className={`shrink-0 ${isMe ? 'text-white/25' : 'text-indigo-400/40'}`} />
        </div>
      </div>
      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
}

// Inline voice review player (same pill style, with play/pause + progress)
