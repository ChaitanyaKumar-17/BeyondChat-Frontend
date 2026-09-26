import { useState } from 'react';
import { ChevronRight, X, Palette } from 'lucide-react';
import { containsProfanity } from '@/utils/profanity';
import { gradients } from '@/constants/emoji';

export default function CreateStoryModal({ onClose, onPost, currentUser, userSettings = {} }) {
  const [text, setText] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [storyProfanity, setStoryProfanity] = useState(false);
  const currentBg = gradients[bgIndex];

  const handlePost = () => {
    if (containsProfanity(text, { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] })) {
      setStoryProfanity(true);
      return;
    }
    onPost({ text, bgClass: currentBg, timestamp: Date.now() });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#0a0a0c]/90 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className={`h-[92vh] sm:h-[90vh] max-w-[95vw] aspect-[9/16] rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col ${currentBg} animate-in fade-in zoom-in-[0.98] duration-200 transition-colors`}>
        <div className="relative flex items-center justify-between p-6">
          <button onClick={onClose} className="relative z-10 p-2 text-white hover:bg-white/20 rounded-full backdrop-blur-md transition-colors shadow-sm">
            <X size={28}/>
          </button>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white/80 text-sm font-medium px-4 py-2 bg-black/20 rounded-full backdrop-blur-sm">
              Available for 24h
            </div>
          </div>

          <button 
            onClick={() => setBgIndex((prev) => (prev + 1) % gradients.length)}
            className="relative z-10 p-3 rounded-full border border-white/30 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors shadow-lg"
            title="Change Background"
          >
            <Palette size={24} className="text-white" />
          </button>
        </div>

          {/* Profanity warning removed from here ? now at the bottom near Post Story */}

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <textarea 
            value={text}
            onChange={e => { setText(e.target.value); if (storyProfanity) setStoryProfanity(false); }}
            placeholder="Tap to type..."
            autoFocus
            className="w-full bg-transparent text-center text-3xl sm:text-4xl font-bold text-white placeholder-white/50 focus:outline-none resize-none drop-shadow-lg cursor-text break-words"
            rows={5}
          />
        </div>

        <div className="p-6 pb-12 flex flex-col items-end gap-2">
          {storyProfanity && (
            <div style={{ animation: 'slideUp 0.2s ease-out' }} className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-xl border border-red-500/25 rounded-full whitespace-nowrap self-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span className="text-[12px] text-red-300/90 font-medium">Inappropriate language ? please revise</span>
            </div>
          )}
          <button 
            onClick={handlePost} 
            disabled={!text.trim()} 
            className="flex items-center gap-2 md:gap-2 bg-white text-black px-6 py-3 md:px-4 md:py-2 rounded-full font-bold md:font-semibold md:text-sm disabled:opacity-50 transition-transform active:scale-95 shadow-xl hover:bg-zinc-100 disabled:cursor-default"
          >
            <div className="w-7 h-7 md:w-5 md:h-5 rounded-full overflow-hidden border border-black/10">
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            Post Story
            <ChevronRight size={18} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
