import { useState, useEffect, useRef } from 'react';
import { Users, ArrowLeft, Check, Shield } from 'lucide-react';
import { containsProfanity } from '@/utils/profanity';

export default function NewChatModal({ isOpen, onClose, friends, onStartChat, onCreateGroup, userSettings = {} }) {
  const [mode, setMode] = useState('select-type'); // 'select-type', 'select-members', 'name-group'
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupProfanity, setGroupProfanity] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMode('select-type');
      setSelectedFriends([]);
      setGroupName('');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const toggleFriend = (id) => {
    setSelectedFriends(prev => {
      if (prev.includes(id)) return prev.filter(fid => fid !== id);
      if (prev.length >= 1023) return prev; // Max 1024 total (1023 friends + 1 creator)
      return [...prev, id];
    });
  };

  return (
    <div 
      className={`absolute inset-0 z-[100] bg-[#0a0a0c] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isOpen 
          ? 'opacity-100 translate-y-0 ' 
          : 'opacity-0 translate-y-16 pointer-events-none'
      }`}
    >
      <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#121214]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (mode === 'select-type') onClose();
              else if (mode === 'select-members') setMode('select-type');
              else if (mode === 'name-group') setMode('select-members');
            }} 
            className="p-2 text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {mode === 'select-type' && 'New Chat'}
            {mode === 'select-members' && 'Add Members'}
            {mode === 'name-group' && 'Name Group'}
          </h2>
        </div>
        {mode === 'select-members' && (
          <button 
            onClick={() => setMode('name-group')}
            disabled={selectedFriends.length === 0}
            className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:cursor-default"
          >
            Next
          </button>
        )}
        {mode === 'name-group' && (
          <button 
            onClick={() => {
              if (containsProfanity(groupName, { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] })) {
                setGroupProfanity(true);
                setTimeout(() => setGroupProfanity(false), 3000);
                return;
              }
              onCreateGroup(groupName, selectedFriends);
            }}
            disabled={!groupName.trim()}
            className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:cursor-default"
          >
            Create
          </button>
        )}
      </div>
      
      <div ref={scrollRef} className="absolute inset-0 top-[73px] md:top-[81px] overflow-y-auto overflow-x-hidden p-6 [&::-webkit-scrollbar]:hidden pb-24">
        {mode === 'select-type' && (
          <div className="space-y-6">
            <button 
              onClick={() => setMode('select-members')}
              className="flex items-center gap-4 w-full p-3 hover:bg-[#1a1a1c] rounded-2xl transition-colors group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <span className="text-sm font-medium text-white">Create a Group</span>
            </button>

            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Contacts</h3>
              <div className="space-y-2">
                {friends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => onStartChat(friend.id)}
                    className="flex items-center gap-4 p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors"
                  >
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                      <h4 className="text-sm font-medium text-white">{friend.name}</h4>
                      <p className="text-xs text-zinc-500">{friend.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {mode === 'select-members' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500">{selectedFriends.length} of 1023 selected</span>
            </div>
            {friends.map(friend => {
              const isSelected = selectedFriends.includes(friend.id);
              return (
                <div 
                  key={friend.id} 
                  onClick={() => toggleFriend(friend.id)}
                  className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white">{friend.name}</h4>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`}>
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'name-group' && (
          <div className="space-y-8 flex flex-col items-center pt-8">
            <div className="w-24 h-24 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
               <Users size={32} />
            </div>
            <input 
              type="text" 
              value={groupName}
              onChange={e => { setGroupName(e.target.value); setGroupProfanity(false); }}
              placeholder="Group Subject"
              autoFocus
              className={`w-full max-w-sm bg-transparent border-b text-center text-2xl text-white placeholder-zinc-600 py-2 focus:outline-none transition-colors cursor-text ${groupProfanity ? 'border-red-500' : 'border-white/20 focus:border-indigo-500'}`}
            />
            {groupProfanity && (
              <div style={{ animation: 'slideUp 0.3s ease-out' }} className="flex items-center gap-2 mt-3 px-4 py-2 bg-red-500/10 border border-red-500/25 rounded-full">
                <Shield size={12} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">Group name contains inappropriate language</span>
              </div>
            )}
            
            <div className="w-full max-w-sm mt-8">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 text-center">Selected Members ({selectedFriends.length})</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {selectedFriends.map(id => {
                  const f = friends.find(fr => fr.id === id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-2">
                       <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full border border-white/10" />
                       <span className="text-[10px] text-zinc-400 truncate w-12 text-center">{f.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
