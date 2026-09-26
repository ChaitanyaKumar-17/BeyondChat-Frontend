import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Send, X, Play, Pause, Trash2, SkipForward, Reply } from 'lucide-react';
import { containsProfanity } from '@/utils/profanity';
import { formatStoryTime } from '@/utils/format';
import { E } from '@/constants/emoji';

export default function StoryViewer({ friend, onClose, onNextUser, onPrevUser, hasNextUser, hasPrevUser, shouldStopAutoAdvance, onDeleteStory, onMarkViewed, onMarkAnimationPlayed, onSendMessage, onReactToStory, onViewProfile, currentUser }, userSettings = {} ) {
  const [storyIndex, setStoryIndex] = useState(() => {
    const firstUnviewed = friend.stories.findIndex(s => !s.viewed);
    return firstUnviewed !== -1 ? firstUnviewed : 0;
  });
  
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [activeReaction, setActiveReaction] = useState(null);
  
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const isPaused = isInputFocused || isManuallyPaused || showDeleteConfirm || showViewersList;

  const [floatingIcons, setFloatingIcons] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Message delivered');

  const isMyStory = friend.isMine;
  
  const safeIndex = Math.min(storyIndex, Math.max(0, friend.stories.length - 1));
  const currentStory = friend.stories[safeIndex];

  const handleNext = () => {
    if (safeIndex < friend.stories.length - 1) {
      setStoryIndex(safeIndex + 1);
      setProgress(0);
    } else if (hasNextUser && !shouldStopAutoAdvance) {
      onNextUser();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setStoryIndex(safeIndex - 1);
      setProgress(0);
    } else if (hasPrevUser) {
      onPrevUser();
    }
  };

  useEffect(() => {
    const firstUnviewed = friend.stories.findIndex(s => !s.viewed);
    setStoryIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
    setProgress(0);
  }, [friend.id]); 

  useEffect(() => {
    setReplyText('');
    setIsInputFocused(false);
    setIsManuallyPaused(false);
    setShowDeleteConfirm(false);
    setShowViewersList(false);
    setFloatingIcons([]);
    setShowToast(false);

    const myView = currentStory?.views?.find(v => v.id === currentUser.id);
    setActiveReaction(myView?.reaction || null);
  }, [currentStory?.id]);

  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      onMarkViewed(friend.id, currentStory.id);
    }
  }, [currentStory?.id, currentStory?.viewed, friend.id, onMarkViewed]); 

  useEffect(() => {
    if (isPaused || !currentStory?.id) return;
    const increment = 0.5;
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + increment));
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused, currentStory?.id]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, hasNextUser, shouldStopAutoAdvance]);

  const triggerAnimation = useCallback((types, count = 12) => {
    const typeList = Array.isArray(types) ? types : [types];
    if (typeList.length === 0) return;

    const newIcons = Array.from({ length: count }).map((_, i) => {
      const randomType = typeList[Math.floor(Math.random() * typeList.length)];
      const spread = 30; 
      const startX = (Math.random() - 0.5) * spread;
      const sway = (Math.random() - 0.5) * 80; 
      
      return {
        id: Date.now() + i + Math.random(),
        type: randomType,
        left: `calc(50% + ${startX}px)`,
        sway: `${sway}px`,
        rot: `${(Math.random() - 0.5) * 60}deg`,
        delay: `${Math.random() * 0.4}s`, 
        duration: `${1 + Math.random() * 0.75}s`, 
        fontSize: `${Math.random() * 0.6 + 1.2}rem`
      };
    });
    setFloatingIcons(prev => [...prev, ...newIcons]);
    setTimeout(() => {
      setFloatingIcons(prev => prev.filter(icon => !newIcons.includes(icon)));
    }, 2500); 
  }, []);

  useEffect(() => {
    if (isMyStory && currentStory && !currentStory.animationPlayed) {
      if (onMarkAnimationPlayed) onMarkAnimationPlayed(currentStory.id);

      if (currentStory.views && currentStory.views.length > 0) {
        const reactions = currentStory.views.filter(v => v.reaction).map(v => v.reaction);
        const uniqueReactions = [...new Set(reactions)];
        
        if (uniqueReactions.length > 0) {
          setTimeout(() => {
            triggerAnimation(uniqueReactions, 15); 
          }, 400); 
        }
      }
    }
  }, [currentStory?.id, currentStory?.animationPlayed, currentStory?.views, isMyStory, onMarkAnimationPlayed, triggerAnimation]);

  const handleReaction = (type) => {
    if (activeReaction === type) {
      setActiveReaction(null); 
      if (onReactToStory) onReactToStory(friend.id, currentStory.id, null);
    } else {
      setActiveReaction(type); 
      triggerAnimation(type, 15 + Math.floor(Math.random() * 6)); 
      if (onReactToStory) onReactToStory(friend.id, currentStory.id, type);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (replyText.trim()) {
      // Profanity filter for story replies
      if (containsProfanity(replyText, { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] })) {
        setReplyText('');
        setToastMessage('🚫 Message blocked ? inappropriate language');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
        return;
      }
      const storyContext = {
        storyId: currentStory.id,
        storyText: currentStory.text,
        storyBg: currentStory.bgClass,
        storyOwnerName: friend.isMine ? 'You' : friend.name,
        storyOwnerId: friend.id
      };
      if (onSendMessage) onSendMessage(friend.id, replyText, null, null, storyContext);
      setReplyText('');
      setIsInputFocused(false);
      setToastMessage('Message delivered');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!currentStory) return null;

  const hasPhysicalPrev = safeIndex > 0 || hasPrevUser;
  const hasPhysicalNext = safeIndex < friend.stories.length - 1 || hasNextUser;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0c]/90 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className="relative h-[92vh] sm:h-[90vh] max-w-[95vw] aspect-[9/16] rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col z-30 bg-[#0a0a0c] animate-in fade-in zoom-in-[0.98] duration-200">
        
        <div key={currentStory.id} className={`absolute inset-0 animate-in fade-in duration-300 z-0 ${currentStory.bgClass || 'bg-[#0a0a0c]'}`}>
           {!currentStory.bgClass && (
             <img src={friend.avatar} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 transform-gpu" alt="background" />
           )}
        </div>

        <div className="absolute bottom-[80px] right-2 md:right-4 w-32 pointer-events-none z-50 flex justify-center">
          {floatingIcons.map(icon => {
            const emoji = icon.type === 'laugh' ? E('1F602') : icon.type === 'love' ? E('2764') : E('1F525');
            return (
              <div 
                key={icon.id} 
                className="absolute animate-burst flex justify-center items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" 
                style={{ 
                  left: icon.left, 
                  animationDelay: icon.delay, 
                  fontSize: icon.fontSize,
                  '--sway': icon.sway,
                  '--rot': icon.rot,
                  '--duration': icon.duration,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>

        {showToast && (
          <div 
            className={`absolute top-32 left-1/2 -translate-x-1/2 z-[110] whitespace-nowrap max-w-[90%] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
              toastMessage.includes('blocked') 
                ? 'bg-black/80 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                : 'bg-black/80 backdrop-blur-xl border border-white/10'
            }`}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {toastMessage.includes('blocked') && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />}
            <span className={toastMessage.includes('blocked') ? 'text-red-300/90' : 'text-white/90'}>{toastMessage.includes('blocked') ? 'Message blocked ? inappropriate language' : 'Message delivered'}</span>
          </div>
        )}

        <div className={`absolute top-0 left-0 right-0 flex gap-1 p-4 pt-6 md:pt-4 z-40 transition-opacity duration-300 ${isPaused ? 'opacity-0' : 'opacity-100'}`}>
          {friend.stories.map((story, i) => {
            let width = '0%';
            if (i < safeIndex) width = '100%';
            else if (i === safeIndex) width = `${progress}%`;
            
            return (
              <div key={story.id} className="h-1 bg-white/20 rounded-full overflow-hidden flex-1">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width, transition: i === safeIndex && !isPaused ? 'width 50ms linear' : 'none' }} 
                />
              </div>
            );
          })}
        </div>

        <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-4 pb-4 z-40 transition-all duration-300">
          <div 
            className={`flex items-center gap-3 ${!isMyStory ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
            onClick={() => { if (!isMyStory && onViewProfile) { onClose(); onViewProfile(friend.id); } }}
          >
            <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full border border-white/10" />
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm leading-tight">{isMyStory ? 'Your Story' : friend.name}</span>
              <span className="text-white text-xs mt-0.5">{formatStoryTime(currentStory.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            {isMyStory && (
              <div className="relative">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="p-2 text-zinc-100 hover:text-red-400 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                {showDeleteConfirm && (
                  <div className="absolute top-12 right-0 bg-[#1a1a1c] border border-white/10 rounded-xl p-3 shadow-2xl w-48 z-[120] animate-in fade-in zoom-in-95">
                    <p className="text-sm text-white mb-3 text-center">Delete this story?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white transition-colors">Cancel</button>
                      <button onClick={() => { onDeleteStory(currentStory.id); setShowDeleteConfirm(false); }} className="flex-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-xs text-white transition-colors shadow-lg shadow-red-500/20">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isMyStory && (
              <button onClick={() => { if(hasNextUser && !shouldStopAutoAdvance) onNextUser(); else onClose(); }} className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors" title="Skip to next user">
                <SkipForward size={18} fill="currentColor" />
              </button>
            )}

            <button onClick={() => setIsManuallyPaused(!isManuallyPaused)} className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors">
              {isManuallyPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <button onClick={onClose} className="p-2 text-white hover:text-white transition-colors bg-black/40 rounded-full backdrop-blur-md hover:bg-black/60">
              <X size={20} />
            </button>
          </div>
        </div>

        <div key={`text-${currentStory.id}`} className="flex-1 flex items-center justify-center relative z-20 animate-in fade-in duration-300 pointer-events-none">
          <div className={`text-xl sm:text-2xl font-bold text-white/90 text-center px-10 leading-relaxed drop-shadow-lg break-words`}>
             {currentStory.text}
          </div>
        </div>

        {hasPhysicalPrev && (
          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 p-2 md:p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all duration-300 hover:scale-110 active:scale-95  flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 md:w-5 md:h-5" />
          </button>
        )}
        
        {hasPhysicalNext && (
          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 p-2 md:p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all duration-300 hover:scale-110 active:scale-95  flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 md:w-5 md:h-5" />
          </button>
        )}

        {!isMyStory && (
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 md:pb-6 flex items-center gap-4 z-40 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex-1 relative flex items-center group">
              <input 
                type="text" 
                placeholder={`Reply to ${friend.name.split(' ')[0]}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                    handleSendMessage(e);
                  }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-full pl-4 md:pl-5 pr-12 md:pr-14 py-2.5 md:py-2 text-xs md:text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/30 backdrop-blur-xl transition-colors cursor-text"
              />
              <button 
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  handleSendMessage(e);
                }}
                className={`absolute right-2 md:right-1.5 p-2 md:p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/20 ${replyText.trim() ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
              >
                <Send className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 pr-2">
              <button 
                onClick={() => handleReaction('laugh')} 
                className={`text-3xl md:text-2xl active:scale-95 transition-all duration-300 ${activeReaction === 'laugh' ? 'scale-125 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] opacity-100 grayscale-0' : 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                {E('1F602')}
              </button>
              <button 
                onClick={() => handleReaction('love')} 
                className={`text-3xl md:text-2xl active:scale-95 transition-all duration-300 ${activeReaction === 'love' ? 'scale-125 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] opacity-100 grayscale-0' : 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                {E('2764')}
              </button>
              <button 
                onClick={() => handleReaction('fire')} 
                className={`text-3xl md:text-2xl active:scale-95 transition-all duration-300 ${activeReaction === 'fire' ? 'scale-125 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] opacity-100 grayscale-0' : 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                {E('1F525')}
              </button>
            </div>
          </div>
        )}

        {isMyStory && (
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 md:pb-6 flex justify-center items-center z-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <button 
              onClick={() => setShowViewersList(true)}
              className="flex items-center gap-2 px-5 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/5 rounded-full text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <span className="font-semibold text-sm tracking-wide">{currentStory.views?.length || 0} Views</span>
            </button>
          </div>
        )}

        <div className={`absolute inset-0 z-[130] flex items-end md:items-center justify-center transition-opacity duration-200 ease-out ${showViewersList ? 'opacity-100 ' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transform-gpu" style={{ willChange: 'opacity, backdrop-filter' }} onClick={() => setShowViewersList(false)}></div>
          <div className={`bg-[#1a1a1c] w-full h-[60vh] md:h-auto md:max-h-[70vh] md:max-w-sm rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl relative z-10 border border-white/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${showViewersList ? 'translate-y-0 md:scale-100' : 'translate-y-full md:translate-y-8 md:scale-95'}`}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a1c] rounded-t-3xl md:rounded-3xl z-10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                Story Views
              </h3>
              <button onClick={() => setShowViewersList(false)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 [&::-webkit-scrollbar]:hidden">
              {currentStory.views?.length > 0 ? (
                currentStory.views.map(viewer => (
                  <div key={viewer.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={viewer.avatar} alt={viewer.name} className="w-12 h-12 rounded-full border border-white/10" />
                      <span className="text-white text-sm font-medium">{viewer.name}</span>
                    </div>
                    {viewer.reaction && (
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <span className="text-xl drop-shadow-md">
                          {viewer.reaction === 'laugh' ? E('1F602') : viewer.reaction === 'love' ? E('2764') : E('1F525')}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm py-10 space-y-3">
                  <span className="text-4xl opacity-50">{E('1F440')}</span>
                  <p>No views yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
