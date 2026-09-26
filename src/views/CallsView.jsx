import { useState, useEffect } from 'react';
import { Hash, ArrowLeft, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

export default function CallsView({ callLogs, friends, groups, onOverlayChange, isActive }) {
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('individual');
  const [showNewCall, setShowNewCall] = useState(false);
  const [callToast, setCallToast] = useState('');

  useEffect(() => {
    let timeout;
    if (!isActive) {
      timeout = setTimeout(() => {
        setTab('individual');
        setExpandedId(null);
        setShowNewCall(false);
      }, 200);
    }
    return () => clearTimeout(timeout);
  }, [isActive]);

  const handleOpenNewCall = () => {
    setShowNewCall(true);
    if (onOverlayChange) onOverlayChange('calls', true);
  };

  const handleCloseNewCall = () => {
    setShowNewCall(false);
    if (onOverlayChange) onOverlayChange('calls', false);
  };

  const handleInitiateCall = (name, type) => {
    handleCloseNewCall();
    setCallToast(`Starting ${type} call with ${name}...`);
    setTimeout(() => setCallToast(''), 3000);
  };

  const getDirectionIcon = (direction, type) => {
    const iconSize = 14;
    if (direction === 'missed') {
      return type === 'video' 
        ? <div className="text-red-400 flex items-center gap-1"><Video size={iconSize}/><span className="text-[10px]">&times;</span></div> 
        : <PhoneMissed size={iconSize} className="text-red-400" />;
    }
    if (direction === 'incoming') {
      return type === 'video' 
        ? <div className="text-blue-400 flex items-center gap-1"><Video size={iconSize}/><span className="text-[10px]">&darr;</span></div> 
        : <PhoneIncoming size={iconSize} className="text-blue-400" />;
    }
    return type === 'video' 
      ? <div className="text-emerald-400 flex items-center gap-1"><Video size={iconSize}/><span className="text-[10px]">&uarr;</span></div> 
      : <PhoneOutgoing size={iconSize} className="text-emerald-400" />;
  };

  const filteredLogs = callLogs.filter(log => log.type === tab);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      
      {callToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[120] bg-emerald-500/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl shadow-emerald-500/20 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300 whitespace-nowrap border border-emerald-400/20">
          {callToast}
        </div>
      )}

      <header className="px-6 py-6 md:px-0 flex justify-between items-center min-h-[94px] flex-shrink-0">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Call History</h1>
        <button 
          onClick={handleOpenNewCall}
          className="p-3 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors text-white shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Phone size={22} className="fill-current" />
        </button>
      </header>

      <div className="flex px-6 md:px-0 mb-6 gap-4 sm:gap-6 border-b border-white/10 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full max-w-full">
        <button 
          onClick={() => setTab('individual')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'individual' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Individuals
          {tab === 'individual' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setTab('group')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'group' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Groups
          {tab === 'group' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-0 space-y-3 pb-24 [&::-webkit-scrollbar]:hidden">
        {filteredLogs.length > 0 ? filteredLogs.map(log => {
           const latestCall = log.history[0];
           const isExpanded = expandedId === log.id;
           // Enforcing maximum of 5 previous records shown
           const cappedHistory = log.history.slice(0, 5);

           return (
             <div key={log.id} className="bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg overflow-hidden transition-all duration-300">
               <div 
                 onClick={() => setExpandedId(isExpanded ? null : log.id)}
                 className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
               >
                 <div className="flex items-center gap-4">
                   {log.type === 'group' ? (
                     <div className={`w-12 h-12 rounded-full ${log.icon} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                        <Hash size={20} />
                     </div>
                   ) : (
                     <img src={log.avatar} alt={log.name} className="w-12 h-12 rounded-full" />
                   )}
                   <div>
                     <h4 className={`text-sm font-medium ${latestCall.direction === 'missed' ? 'text-red-400' : 'text-white'}`}>
                       {log.name}
                     </h4>
                     <div className="flex items-center gap-2 mt-1">
                        {getDirectionIcon(latestCall.direction, latestCall.callType)}
                        <span className="text-xs text-zinc-500">{latestCall.time}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <button className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-indigo-500 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                     <Phone size={16} />
                   </button>
                   <button className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-indigo-500 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                     <Video size={16} />
                   </button>
                 </div>
               </div>

               <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-white/5' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden min-h-0 bg-[#0a0a0c]/50">
                     <div className="p-4 space-y-3">
                        <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Previous Calls</h5>
                        {cappedHistory.map(hist => (
                           <div key={hist.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-3">
                                 <div className="w-5 flex justify-center">
                                    {getDirectionIcon(hist.direction, hist.callType)}
                                 </div>
                                 <span className="text-sm text-zinc-300">{hist.time}</span>
                              </div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${hist.direction === 'missed' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-400'}`}>
                                {hist.duration}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             </div>
           );
        }) : (
          <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
            <Phone size={40} className="opacity-20" />
            <p>No {tab} call history.</p>
          </div>
        )}
      </div>

      <div 
        className={`absolute inset-0 z-[100] bg-[#0a0a0c] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          showNewCall 
            ? 'opacity-100 translate-y-0 ' 
            : 'opacity-0 translate-y-16 pointer-events-none'
        }`}
      >
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center gap-4 bg-[#121214]">
          <button 
            onClick={handleCloseNewCall} 
            className="p-2 text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">New Call</h2>
        </div>
        
        <div className="absolute inset-0 top-[73px] md:top-[81px] overflow-y-auto overflow-x-hidden p-6 space-y-8 [&::-webkit-scrollbar]:hidden pb-32">
          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Connections</h3>
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                      <h4 className="text-sm font-medium text-white">{friend.name}</h4>
                      <p className="text-xs text-zinc-500">{friend.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleInitiateCall(friend.name, 'audio')} className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                      <Phone size={18} />
                    </button>
                    <button onClick={() => handleInitiateCall(friend.name, 'video')} className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {groups.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Groups</h3>
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${group.icon} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                        <Hash size={20} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                        <h4 className="text-sm font-medium text-white">{group.name}</h4>
                        <p className="text-xs text-zinc-500">{group.members} members</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleInitiateCall(group.name, 'audio')} className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                        <Phone size={18} />
                      </button>
                      <button onClick={() => handleInitiateCall(group.name, 'video')} className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                        <Video size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
