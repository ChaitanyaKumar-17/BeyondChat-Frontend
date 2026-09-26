export default function CommunitySidebar({ communities, groups, activeCommunityId, setActiveCommunityId, onCommunityClick }) {
  return (
    <div className="w-[64px] flex-shrink-0 bg-[#0a0a0c] border-r border-white/10 flex flex-col items-center py-4 gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden z-10 pb-24">
        {communities.map(c => {
           const hasUnread = c.groupIds.some(gid => { const g = groups.find(x => x.id === gid); return g && g.unread > 0 });
           return (
           <div key={c.id} 
                onClick={() => { setActiveCommunityId(c.id); if (onCommunityClick) onCommunityClick(c.id); }} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white cursor-pointer relative transition-all ${activeCommunityId === c.id ? 'rounded-xl ' + c.icon : 'bg-[#1a1a1c] hover:bg-white/5 hover:rounded-xl text-zinc-400 hover:text-white'}`}>
             {c.short}
             {hasUnread && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0c]"></div>
             )}
             {activeCommunityId === c.id && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
             )}
           </div>
        )})}
    </div>
  );
}
