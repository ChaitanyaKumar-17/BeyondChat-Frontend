import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, Hash, Globe, X, Check, Shield } from 'lucide-react';
import { containsProfanity } from '@/utils/profanity';
import CommunitySidebar from '@/views/CommunitySidebar';

export default function CommunityView({ communities, setCommunities, groups, onSelectGroup, activeCommunityId, setActiveCommunityId, currentUser }, userSettings = {} ) {
  const [displayCommunityId, setDisplayCommunityId] = useState(activeCommunityId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState('select');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [communityProfanity, setCommunityProfanity] = useState(false);
  
  useEffect(() => {
    if (activeCommunityId) {
      setDisplayCommunityId(activeCommunityId);
    }
  }, [activeCommunityId]);

  const adminGroups = groups.filter(g => g.adminIds?.includes(currentUser.id) && !g.isBroadcast);

  const handleToggleGroup = (gid) => {
    setSelectedGroupIds(prev => prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]);
  };

  const handleCreateCommunity = () => {
    if (!newCommunityName.trim() || selectedGroupIds.length < 2) return;
    // Profanity filter for community name
    if (containsProfanity(newCommunityName, { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] })) {
      setCommunityProfanity(true);
      setTimeout(() => setCommunityProfanity(false), 3000);
      return;
    }
    const name = newCommunityName.trim();
    const short = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['bg-violet-600', 'bg-teal-600', 'bg-sky-600', 'bg-pink-600', 'bg-lime-600', 'bg-fuchsia-600'];
    const icon = colors[Math.floor(Math.random() * colors.length)];
    const announcementId = Date.now();
    const newCommunity = {
      id: 'com_' + Date.now(),
      name, short, icon,
      groupIds: [announcementId, ...selectedGroupIds]
    };
    setCommunities(prev => [...prev, newCommunity]);
    setShowCreateModal(false);
    setCreateStep('select');
    setSelectedGroupIds([]);
    setNewCommunityName('');
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep('select');
    setSelectedGroupIds([]);
    setNewCommunityName('');
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Root Communities List */}
      <div className={`absolute inset-0 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-10 ${
        !activeCommunityId ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-[20%] pointer-events-none scale-95'
      }`}>
        <header className="px-6 py-6 md:px-0 flex items-center justify-between min-h-[94px] flex-shrink-0">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Communities</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-3 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors text-white shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={22} />
          </button>
        </header>
        <div className="px-6 md:px-0 border-b border-white/10 flex-shrink-0"></div>
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col pb-24">
          <div className="px-6 md:px-0 space-y-3 pt-6">
            {communities.map(community => {
              const hasUnread = community.groupIds.some(gid => {
                const g = groups.find(x => x.id === gid);
                return g && g.unread > 0;
              });
              return (
                <div key={community.id} onClick={() => setActiveCommunityId(community.id)} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg cursor-pointer hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${community.icon} flex items-center justify-center flex-shrink-0 text-white font-bold transition-transform duration-300 group-hover:scale-110 group-active:scale-95`}>
                      {community.short}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-white truncate">{community.name}</h3>
                      <p className="text-sm text-zinc-400 truncate">{community.groupIds.length} groups</p>
                    </div>
                  </div>
                  {hasUnread && (
                    <div className="w-3 h-3 bg-red-500 rounded-full ml-2 flex-shrink-0"></div>
                  )}
                </div>
              );
            })}
            {communities.length === 0 && (
              <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
                <Globe size={40} className="opacity-20" />
                <p>No communities yet. Create one!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Sidebar */}
      <div className={`absolute top-0 bottom-0 left-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        activeCommunityId ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      }`}>
        <CommunitySidebar communities={communities} groups={groups} activeCommunityId={activeCommunityId} setActiveCommunityId={setActiveCommunityId} />
      </div>

      {/* Community Groups List */}
      <div className={`absolute top-0 bottom-0 right-0 z-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        activeCommunityId ? 'left-[64px] opacity-100 translate-x-0 scale-100' : 'left-[64px] opacity-0 translate-x-[20%] pointer-events-none scale-105'
      }`}>
        <div key={displayCommunityId} className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col relative pb-24 animate-in fade-in duration-200">
          <header className="px-6 py-6 sticky top-0 bg-[#0a0a0c]/80 backdrop-blur z-10 flex min-h-[94px] items-center gap-3 flex-shrink-0">
            <button onClick={() => setActiveCommunityId(null)} className="p-2 -ml-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-95 flex-shrink-0">
               <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-white tracking-tight truncate">{communities.find(c => c.id === displayCommunityId)?.name}</h1>
          </header>
          <div className="px-4 border-b border-white/10 flex-shrink-0"></div>
          <div className="p-4 space-y-3 pt-4">
            {communities.find(c => c.id === displayCommunityId)?.groupIds.map(gid => {
              const group = groups.find(g => g.id === gid);
              if (!group) return null;
              return (
                <div key={gid} onClick={() => onSelectGroup(gid)} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg cursor-pointer hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${group.icon} flex items-center justify-center flex-shrink-0 text-white font-bold transition-transform duration-300 group-hover:scale-110 group-active:scale-95`}>
                       {group.isBroadcast ? <Globe size={20} /> : <Hash size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                         <h3 className="text-[15px] font-semibold text-white truncate">{group.name}</h3>
                         {group.isBroadcast && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><Check size={10} />Broadcast</span>}
                      </div>
                      <p className="text-sm text-zinc-400 truncate">{group.description}</p>
                    </div>
                  </div>
                  {group.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ml-2">
                      {group.unread}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.05] rounded-3xl w-[90%] max-w-md shadow-2xl flex flex-col my-auto relative animate-in zoom-in-95 duration-200 max-h-[80vh]">
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-[#121214] z-10 rounded-t-3xl">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {createStep === 'select' ? 'Select Groups' : 'Name Your Community'}
              </h2>
              <button type="button" onClick={handleCloseCreateModal} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
              {createStep === 'select' ? (
                <>
                  <p className="text-xs text-zinc-500 mb-4">Select at least 2 groups you admin to form a community. An Announcements channel will be added automatically.</p>
                  <div className="space-y-2">
                    {adminGroups.length > 0 ? adminGroups.map(group => {
                      const isSelected = selectedGroupIds.includes(group.id);
                      return (
                        <button key={group.id} onClick={() => handleToggleGroup(group.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                          <div className={`w-10 h-10 rounded-full ${group.icon} flex items-center justify-center text-white shrink-0`}>
                            <Hash size={16} />
                          </div>
                          <div className="flex-[1] min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">{group.name}</h4>
                            <p className="text-xs text-zinc-500 truncate">{group.description}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="text-center text-zinc-500 py-8 text-sm">
                        <p>You are not an admin of any groups.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500">Choose a name for your community.</p>
                  <input 
                    type="text"
                    value={newCommunityName}
                    onChange={(e) => { setNewCommunityName(e.target.value); setCommunityProfanity(false); }}
                    placeholder="e.g. Design Collective"
                    className={`w-full bg-white/5 border text-white placeholder-zinc-500 rounded-2xl py-3 px-4 text-[15px] focus:outline-none focus:ring-2 transition-all ${communityProfanity ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : 'border-white/10 focus:ring-indigo-500/50 focus:border-indigo-500/50'}`}
                    autoFocus
                  />
                  {communityProfanity && (
                    <div style={{ animation: 'slideUp 0.3s ease-out' }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/25 rounded-full">
                      <Shield size={12} className="text-red-400" />
                      <span className="text-xs text-red-400 font-medium">Community name contains inappropriate language</span>
                    </div>
                  )}
                  <div className="text-xs text-zinc-500">
                    <span className="text-indigo-400">{selectedGroupIds.length}</span> groups selected + 1 Announcements channel
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.05] flex gap-2">
              {createStep === 'select' ? (
                <button 
                  onClick={() => setCreateStep('name')}
                  disabled={selectedGroupIds.length < 2}
                  className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${
                    selectedGroupIds.length >= 2 
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Continue ({selectedGroupIds.length}/2 min)
                </button>
              ) : (
                <>
                  <button onClick={() => setCreateStep('select')} className="px-4 py-3 rounded-full text-sm font-medium text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={handleCreateCommunity}
                    disabled={!newCommunityName.trim()}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${
                      newCommunityName.trim() 
                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Create Community
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
