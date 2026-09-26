import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Play, Pause, Trash2 } from 'lucide-react';
import { generateWaveform } from '@/utils/audio';

export default function VoiceReviewPlayer({ url, duration, onCancel, onSend }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const waveHeights = useMemo(() => generateWaveform(77777, 35), []);
  const filledBars = Math.floor((progress / 100) * waveHeights.length);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd); audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); };
  }, [url]);

  const seek = (e) => { const audio = audioRef.current; if (!audio || !audio.duration) return; const rect = e.currentTarget.getBoundingClientRect(); audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration; };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 bg-[#1e1e24] border border-indigo-500/30 p-2 px-4 rounded-full shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in duration-200">
      <button 
        type="button" 
        onClick={() => { const a = audioRef.current; a && (playing ? a.pause() : a.play()); }}
        className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full transition-colors"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex items-end gap-[2px] flex-1 h-5 cursor-pointer" onClick={seek}>
        {waveHeights.map((h, i) => (
          <div key={i} className={`w-[2px] rounded-full transition-colors duration-100 ${i < filledBars ? 'bg-indigo-400' : 'bg-indigo-400/25'}`} style={{ height: `${h}px` }} />
        ))}
      </div>
      <span className="text-xs text-zinc-400 font-mono tabular-nums shrink-0">{playing || currentTime > 0 ? fmtTime(currentTime) : fmtTime(duration)}</span>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button type="button" onClick={onCancel} className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/[0.05]" title="Discard">
        <Trash2 size={16} />
      </button>
      <button type="button" onClick={onSend} className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors shadow-lg shadow-indigo-500/20 active:scale-95" title="Send">
        <Send size={16} />
      </button>
    </div>
  );
}

// -----------------------------------------------------------
// 🗳? CREATE POLL MODAL
// -----------------------------------------------------------
