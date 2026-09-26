import { useState, useEffect } from 'react';

export default function NavButton({ icon, active, onClick, hasBadge, badgeCount }) {
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    if (!badgeCount) return;
    const expandTimer = setTimeout(() => setShowCount(true), 500);
    const shrinkTimer = setTimeout(() => setShowCount(false), 3500);
    return () => {
      clearTimeout(expandTimer);
      clearTimeout(shrinkTimer);
    };
  }, [badgeCount]);

  return (
    <button 
      onClick={onClick}
      className={`
        relative p-3 rounded-2xl transition-all duration-300 group
        ${active ? 'bg-indigo-500/15 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'}
      `}
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-95">
        {icon}
      </div>
      
      {hasBadge && !badgeCount && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#121214]"></span>
      )}
      {badgeCount && (
        <span 
          className={`absolute flex items-center justify-center bg-red-500 border-2 border-[#121214] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden rounded-full
            ${showCount 
              ? 'top-0 right-0 text-white text-[10px] font-bold px-1.5 min-w-[20px] h-[20px] transform translate-x-1/4 -translate-y-1/4 leading-none' 
              : 'top-2.5 right-2.5 w-2 h-2 text-transparent'
            }
          `}
        >
          {showCount && badgeCount}
        </span>
      )}
    </button>
  );
}
