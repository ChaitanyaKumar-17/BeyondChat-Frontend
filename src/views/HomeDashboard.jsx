import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Plus, ChevronRight, ChevronLeft, Hash, ArrowLeft, Send, X, Tv, UserPlus, Check, UserMinus, Type } from 'lucide-react';
import { formatRecentChatTime } from '@/utils/format';
import { mockChannels } from '@/data/initialState';
import StoryRing from '@/components/common/StoryRing';
import StoryViewer from '@/components/story/StoryViewer';
import CreateStoryModal from '@/components/story/CreateStoryModal';

export default function HomeDashboard({ onSelectChat, globalUsers, sentReqs, onSendReq, onWithdrawReq, friends, setFriends, groups, receivedReqs, onAcceptReq, onRejectReq, myStories, setMyStories, recentConversations, typingIndicators, chatDetails, onSendMessage, onOverlayChange, currentUser, drafts = {}, userSettings = {} }) {
  const [listTab, setListTab] = useState('conversations');
  const [expandedGroups, setExpandedGroups] = useState(false);
  const [expandedRecent, setExpandedRecent] = useState(false);
  
  const scrollRef = useRef(null);
  const searchInputRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [dashToast, setDashToast] = useState('');
  
  const [activeStory, setActiveStory] = useState(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storyQueue, setStoryQueue] = useState([]);

  const myStoryViewed = myStories.length > 0 && myStories.every(s => s.viewed);
  
  const unreadConversationsCount = recentConversations.filter(c => c.unread > 0).length;
  const unreadGroupsCount = groups.filter(g => g.unread > 0).length;

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [isSearchActive]);

  const triggerDashToast = (msg) => {
    setDashToast(msg);
    setTimeout(() => setDashToast(''), 3000);
  };

  const sortedFriends = useMemo(() => {
    return [...friends]
      .filter(f => f.isOnline || f.stories.length > 0)
      .sort((a, b) => {
        const aHasUnviewed = a.stories.some(s => !s.viewed);
        const bHasUnviewed = b.stories.some(s => !s.viewed);

        if (aHasUnviewed && !bHasUnviewed) return -1;
        if (!aHasUnviewed && bHasUnviewed) return 1;

        const aLatest = a.stories.length > 0 ? Math.max(...a.stories.map(s => s.timestamp)) : 0;
        const bLatest = b.stories.length > 0 ? Math.max(...b.stories.map(s => s.timestamp)) : 0;

        if (aLatest !== bLatest) {
          return bLatest - aLatest;
        }

        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return 0;
      });
  }, [friends]);

  const friendsWithStories = useMemo(() => sortedFriends.filter(f => f.stories.length > 0), [sortedFriends]);
  
  const currentQueue = activeStory ? storyQueue : friendsWithStories;
  const activeStoryIndex = activeStory ? currentQueue.findIndex(f => f.id === activeStory.id) : -1;
  
  const hasNextUser = activeStoryIndex >= 0 && activeStoryIndex < currentQueue.length - 1;
  const hasPrevUser = activeStoryIndex > 0;

  const currentSnapshot = activeStoryIndex >= 0 ? currentQueue[activeStoryIndex] : null;
  const nextSnapshot = hasNextUser ? currentQueue[activeStoryIndex + 1] : null;
  
  const shouldStopAutoAdvance = Boolean(
    currentSnapshot && !currentSnapshot.storyViewed && 
    nextSnapshot && nextSnapshot.storyViewed
  );

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [sortedFriends]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -250 : 250, behavior: 'smooth' });
    }
  };

  const handleMarkStoryViewed = useCallback((friendId, storyId) => {
    if (friendId === currentUser.id) {
      setMyStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true } : s));
    } else {
      setFriends(prev => prev.map(f => {
        if (f.id === friendId) {
          const updatedStories = f.stories.map(s => s.id === storyId ? { ...s, viewed: true } : s);
          const allViewed = updatedStories.every(s => s.viewed);
          return { ...f, stories: updatedStories, storyViewed: allViewed };
        }
        return f;
      }));
    }
  }, [setFriends, setMyStories]);

  const handleMarkAnimationPlayed = useCallback((storyId) => {
    setMyStories(prev => prev.map(s => s.id === storyId ? { ...s, animationPlayed: true } : s));
  }, [setMyStories]);

  const handleStoryClick = (friend) => {
    if (friend.stories.length > 0) {
      if (!activeStory) {
        setStoryQueue(friendsWithStories);
      }
      setActiveStory(friend);
      if (onOverlayChange) onOverlayChange('home', true);
    }
  };

  const handleNextUser = () => {
    if (hasNextUser) handleStoryClick(currentQueue[activeStoryIndex + 1]);
  };

  const handlePrevUser = () => {
    if (hasPrevUser) handleStoryClick(currentQueue[activeStoryIndex - 1]);
  };

  const handleDeleteMyStory = useCallback((storyId) => {
    setMyStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      if (updated.length === 0) {
        setActiveStory(null);
        if (onOverlayChange) onOverlayChange('home', false);
      }
      return updated;
    });
  }, [setMyStories, onOverlayChange]);

  const handleReactToStory = useCallback((friendId, storyId, reactionType) => {
    if (friendId === currentUser.id) {
      setMyStories(prev => prev.map(s => {
        if (s.id === storyId) {
          const existingViewIndex = s.views?.findIndex(v => v.id === currentUser.id) ?? -1;
          let newViews = s.views ? [...s.views] : [];
          if (existingViewIndex >= 0) {
            newViews[existingViewIndex] = { ...newViews[existingViewIndex], reaction: reactionType };
          } else {
            newViews.push({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, reaction: reactionType });
          }
          return { ...s, views: newViews };
        }
        return s;
      }));
    } else {
      setFriends(prev => prev.map(f => {
        if (f.id === friendId) {
          const updatedStories = f.stories.map(s => {
            if (s.id === storyId) {
              const existingViewIndex = s.views?.findIndex(v => v.id === currentUser.id) ?? -1;
              let newViews = s.views ? [...s.views] : [];
              if (existingViewIndex >= 0) {
                newViews[existingViewIndex] = { ...newViews[existingViewIndex], reaction: reactionType };
              } else {
                newViews.push({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, reaction: reactionType });
              }
              return { ...s, views: newViews };
            }
            return s;
          });
          return { ...f, stories: updatedStories };
        }
        return f;
      }));
    }
  }, [setFriends, setMyStories]);

  const sortedRecent = useMemo(() => {
    return [...recentConversations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [recentConversations]);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const timeA = chatDetails.find(c => c.id === a.id)?.messages?.slice(-1)[0]?.timestamp || 0;
      const timeB = chatDetails.find(c => c.id === b.id)?.messages?.slice(-1)[0]?.timestamp || 0;
      return timeB - timeA;
    });
  }, [groups, chatDetails]);
  
  const renderRecentCard = (chat) => {
    const activeTypers = (typingIndicators[chat.id] || []).filter(id => id !== currentUser.id);
    const isTyping = activeTypers.length > 0;
    
    let typingText = 'Typing...';
    if (chat.isGroup && activeTypers.length === 1) {
      const typingUser = friends.find(f => f.id === activeTypers[0]) || globalUsers.find(u => u.id === activeTypers[0]);
      if (typingUser) typingText = `${typingUser.name.split(' ')[0]} is typing...`;
    }

    const friendData = friends.find(f => f.id === chat.id);
    const globalData = globalUsers.find(u => u.id === chat.id);
    const isOnline = friendData ? friendData.isOnline : 
                     globalData ? (globalData.status === 'Online' || globalData.status === 'online') : 
                     (chat.status === 'online');

    return (
      <div 
        key={`recent-${chat.id}`}
        onClick={() => onSelectChat(chat.id)}
        className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1a1a1c] cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {chat.isGroup ? (
            <div className={`w-12 h-12 rounded-full ${chat.icon || 'bg-indigo-500'} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
              <Hash size={20} />
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full" />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#121214] rounded-full" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white mb-0.5 truncate">{chat.name}</h3>
            <p className={`text-sm truncate ${chat.unread > 0 || isTyping ? 'text-zinc-200 font-medium' : drafts[chat.id] ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isTyping ? (
                <span className="text-emerald-400 font-medium">{typingText}</span>
              ) : drafts[chat.id] ? (
                <span className="truncate">
                  <span className="text-amber-400/90 font-semibold text-xs mr-1">Draft:</span>
                  <span className="text-zinc-400">{drafts[chat.id]}</span>
                </span>
              ) : (
                chat.lastMessage
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-zinc-500">{formatRecentChatTime(chat.timestamp)}</span>
          {chat.unread > 0 ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {chat.unread}
            </div>
          ) : (
            <ChevronRight size={16} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    );
  };

  const renderGroupCard = (group) => {
    const time = chatDetails.find(c => c.id === group.id)?.messages?.slice(-1)[0]?.timestamp || 0;
    const activeTypers = (typingIndicators[group.id] || []).filter(id => id !== currentUser.id);
    const isTyping = activeTypers.length > 0;
    
    let typingText = 'Typing...';
    if (activeTypers.length === 1) {
      const typingUser = friends.find(f => f.id === activeTypers[0]) || globalUsers.find(u => u.id === activeTypers[0]);
      if (typingUser) typingText = `${typingUser.name.split(' ')[0]} is typing...`;
    } else if (activeTypers.length > 1) {
      typingText = `${activeTypers.length} typing...`;
    }

    return (
      <div key={group.id} onClick={() => onSelectChat(group.id)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1a1a1c] cursor-pointer transition-colors group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-full ${group.icon} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
            <Hash size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white mb-0.5 truncate">{group.name}</h3>
            {isTyping ? (
              <p className="text-sm truncate text-emerald-400 font-medium">{typingText}</p>
            ) : (
              <p className="text-sm text-zinc-500 truncate">{group.members} members</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-zinc-500">{formatRecentChatTime(time)}</span>
          {group.unread > 0 ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {group.unread}
            </div>
          ) : (
            <ChevronRight size={16} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    );
  };

  const { matchedFriends, matchedGlobalUsers, matchedGroups, matchedChannels, matchedReceivedReqs, hasAnyResults } = useMemo(() => {
    const sq = searchQuery.toLowerCase().trim();
    const isPrefixMatch = (item) => {
      if (!sq) return false;
      const nameMatch = item.name.toLowerCase().startsWith(sq);
      const handleMatch = item.handle ? (item.handle.toLowerCase().startsWith(sq) || item.handle.toLowerCase().replace(/^@/, '').startsWith(sq)) : false;
      return nameMatch || handleMatch;
    };

    const resFriends = friends.filter(isPrefixMatch);
    const resGlobalUsers = globalUsers.filter(isPrefixMatch);
    const resGroups = groups.filter(isPrefixMatch);
    const resChannels = mockChannels.filter(isPrefixMatch);
    const resReceivedReqs = receivedReqs ? receivedReqs.filter(isPrefixMatch) : [];
    
    return {
      matchedFriends: resFriends,
      matchedGlobalUsers: resGlobalUsers,
      matchedGroups: resGroups,
      matchedChannels: resChannels,
      matchedReceivedReqs: resReceivedReqs,
      hasAnyResults: resFriends.length > 0 || resGlobalUsers.length > 0 || resGroups.length > 0 || resChannels.length > 0 || resReceivedReqs.length > 0
    };
  }, [searchQuery, friends, globalUsers, groups, receivedReqs]);

  const activeFriend = activeStory 
    ? (activeStory.isMine 
        ? { ...activeStory, stories: myStories } 
        : (friends.find(f => f.id === activeStory.id) || activeStory))
    : null;

  return (
    <div className="w-full h-full relative overflow-hidden">
      
      {dashToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[110] bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300">
          {dashToast}
        </div>
      )}

      {isCreatingStory && (
        <CreateStoryModal 
          onClose={() => {
            setIsCreatingStory(false);
            if (onOverlayChange) onOverlayChange('home', false);
          }} 
          onPost={(storyData) => {
            setMyStories(prev => [...prev, { id: Date.now(), viewed: false, animationPlayed: false, views: [], timestamp: Date.now(), ...storyData }]);
            setIsCreatingStory(false);
            if (onOverlayChange) onOverlayChange('home', false);
          }}
          currentUser={currentUser}
          userSettings={userSettings}
        />
      )}

      {activeFriend && (activeFriend.isMine ? myStories.length > 0 : true) && (
        <StoryViewer 
          key={activeFriend.id}
          friend={activeFriend} 
          onClose={() => {
            setActiveStory(null);
            setStoryQueue([]);
            if (onOverlayChange) onOverlayChange('home', false);
          }} 
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
          hasNextUser={hasNextUser}
          hasPrevUser={hasPrevUser}
          shouldStopAutoAdvance={shouldStopAutoAdvance}
          onDeleteStory={handleDeleteMyStory}
          onMarkViewed={handleMarkStoryViewed}
          onMarkAnimationPlayed={handleMarkAnimationPlayed}
          onSendMessage={onSendMessage}
          onReactToStory={handleReactToStory}
          onViewProfile={(userId) => { onSelectChat(userId); }}
          currentUser={currentUser}
          userSettings={userSettings}
        />
      )}

      <div 
        className={`absolute inset-0 z-[100] bg-[#0a0a0c] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isSearchActive 
            ? 'opacity-100 translate-y-0 ' 
            : 'opacity-0 translate-y-16 pointer-events-none'
        }`}
      >
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center gap-4 bg-[#121214]">
          <button 
            onClick={() => { 
              setIsSearchActive(false); 
              setSearchQuery(''); 
              if (onOverlayChange) onOverlayChange('home', false);
            }} 
            className="p-2 text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, groups, channels..." 
              className="w-full bg-white/5 border border-white/10 text-[15px] text-zinc-200 placeholder-zinc-500 rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner cursor-text"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 [&::-webkit-scrollbar]:hidden pb-24">
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <Search size={48} className="opacity-20" />
              <p>Type to search across all networks</p>
            </div>
          ) : (
            <>
              {matchedReceivedReqs.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Pending Requests</h3>
                  <div className="space-y-2">
                    {matchedReceivedReqs.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors" onClick={() => onSelectChat(req.id)}>
                        <div className="flex items-center gap-4">
                          <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white">{req.name}</h4>
                            <p className="text-xs text-zinc-500">{req.handle}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onRejectReq(req.id);
                            }} 
                            className="p-2 rounded-full text-zinc-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            title="Reject Request"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptReq(req.id);
                            }} 
                            className="p-2 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                            title="Accept Request"
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {matchedFriends.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Connections</h3>
                  <div className="space-y-2">
                    {matchedFriends.map(friend => (
                      <div key={friend.id} className="flex items-center gap-4 p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors" onClick={() => onSelectChat(friend.id)}>
                        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">{friend.name}</h4>
                          <p className="text-xs text-zinc-500">{friend.handle || 'Connected'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {matchedGlobalUsers.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Global Network</h3>
                  <div className="space-y-2">
                    {matchedGlobalUsers.map(user => {
                      const isReqSent = sentReqs.some(req => req.id === user.id);
                      const mutuals = (user.mutualFriendIds || []).map(id => friends.find(f => f.id === id)).filter(Boolean);
                      return (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors"
                          onClick={() => onSelectChat(user.id)}
                        >
                          <div className="flex items-center gap-4">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full grayscale opacity-80" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white">{user.name}</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-zinc-500">{user.handle}</p>
                                {mutuals.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-[10px] text-zinc-600">?</span>
                                    <span className="flex -space-x-1.5">
                                      {mutuals.slice(0, 3).map(mf => (
                                        <img key={mf.id} src={mf.avatar} alt={mf.name} className="w-4 h-4 rounded-full border border-[#0a0a0c]" />
                                      ))}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{mutuals.length} mutual</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              isReqSent ? onWithdrawReq(user.id) : onSendReq(user);
                            }}
                            className={`p-2 rounded-full transition-colors ${
                              isReqSent 
                                ? 'text-zinc-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400' 
                                : 'text-indigo-400 hover:bg-indigo-500/10'
                            }`}
                            title={isReqSent ? "Withdraw Request" : "Send Connection Request"}
                          >
                            {isReqSent ? <UserMinus size={18} /> : <UserPlus size={18} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {matchedGroups.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Groups</h3>
                  <div className="space-y-2">
                    {matchedGroups.map(group => (
                      <div key={group.id} className="flex items-center gap-4 p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors" onClick={() => onSelectChat(group.id)}>
                        <div className={`w-10 h-10 rounded-full ${group.icon} flex items-center justify-center text-white shrink-0`}>
                          <Hash size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">{group.name}</h4>
                          <p className="text-xs text-zinc-500">{group.members} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {matchedChannels.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Channels</h3>
                  <div className="space-y-2">
                    {matchedChannels.map(channel => (
                      <div key={channel.id} className="flex items-center gap-4 p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors" onClick={() => onSelectChat(channel.id)}>
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                          <Tv size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">#{channel.name}</h4>
                          <p className="text-xs text-zinc-500">{channel.members} subscribers</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!hasAnyResults && (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-sm">No results found for "{searchQuery}"</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden pb-24 ${activeFriend || isCreatingStory || isSearchActive ? 'hidden' : 'flex'}`}>
        <header className="flex flex-col gap-6 py-6 px-6 md:px-0">
          
          <div className="flex items-center gap-4 flex-shrink-0 pl-1 md:pl-2">
            <div 
              className={`relative w-16 h-16 flex items-center justify-center transition-transform duration-200 ${myStories.length > 0 ? 'cursor-pointer hover:scale-105' : ''}`}
              onClick={() => {
                if (myStories.length > 0) {
                  setActiveStory({ ...currentUser, isMine: true });
                  if (onOverlayChange) onOverlayChange('home', true);
                }
              }}
            >
              {myStories.length > 0 && <StoryRing stories={myStories} type={myStoryViewed ? 'viewed' : 'mine'} />}
              <img src={currentUser.avatar} alt="Profile" className={`w-16 h-16 rounded-full object-cover z-10 relative ${myStories.length > 0 ? 'border-2 border-[#0a0a0c]' : 'border-2 border-white/[0.05]'}`} />
              <div className="absolute bottom-0 right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0c] rounded-full z-20" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">{currentUser.name}</h1>
              <p className="text-sm text-zinc-400">{currentUser.handle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full relative">
            <button 
              onClick={() => {
                if (myStories.length >= 20) {
                  triggerDashToast("Story limit reached (20/20). Delete a story to add more.");
                } else {
                  setIsCreatingStory(true);
                  if (onOverlayChange) onOverlayChange('home', true);
                }
              }}
              className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border border-dashed border-zinc-600 flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                <Plus className="text-zinc-400 group-hover:text-white" size={20} />
              </div>
              <span className="text-xs text-zinc-500 font-medium">New</span>
            </button>
            
            <div className="w-[1px] h-12 bg-white/[0.1] flex-shrink-0 rounded-full mx-2"></div>
            
            <div className="relative flex-1 min-w-0 flex items-center group/scroll">
              
              <div className={`absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#0a0a0c]/0 sm:from-[#0a0a0c] to-[#0a0a0c]/0 z-40 flex items-center pointer-events-none transition-all duration-300 ease-in-out ${showLeftArrow ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <button 
                  onClick={() => scroll('left')}
                  className="ml-1 md:ml-2 p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/[0.08] rounded-full text-white shadow-lg  cursor-pointer hidden sm:flex"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full px-2 py-3 scroll-smooth"
              >
                {sortedFriends.map(friend => {
                  let ringType = 'none';
                  if (friend.stories.length > 0) {
                    if (friend.storyViewed) ringType = 'viewed';
                    else ringType = friend.storyType;
                  }

                  return (
                    <div 
                      key={friend.id} 
                      className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
                      onClick={() => handleStoryClick(friend)}
                    >
                      <div className={`relative w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}>
                        {ringType !== 'none' && <StoryRing stories={friend.stories} type={ringType} />}
                        <img src={friend.avatar} alt={friend.name} className={`w-16 h-16 rounded-full object-cover z-10 relative ${ringType !== 'none' ? 'border-2 border-[#0a0a0c]' : 'border-2 border-white/[0.05]'}`} />
                        {friend.isOnline && (
                          <div className="absolute bottom-0 right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0c] rounded-full z-20" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">{friend.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className={`absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#0a0a0c]/0 sm:from-[#0a0a0c] to-[#0a0a0c]/0 z-40 flex items-center justify-end pointer-events-none transition-all duration-300 ease-in-out ${showRightArrow ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                <button 
                  onClick={() => scroll('right')}
                  className="mr-1 md:mr-2 p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/[0.08] rounded-full text-white shadow-lg  cursor-pointer hidden sm:flex"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 px-6 md:px-0 lg:max-w-4xl lg:mx-auto w-full">
          <div className="relative w-full cursor-pointer" onClick={() => {
            setIsSearchActive(true);
            if (onOverlayChange) onOverlayChange('home', true);
          }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations, friends, or groups..." 
              readOnly
              className="w-full bg-[#121214] border border-white/[0.05] text-[15px] text-zinc-200 placeholder-zinc-500 rounded-full py-4 pl-12 pr-4 cursor-text hover:bg-white/[0.02] transition-colors shadow-xl"
            />
          </div>

          <section className="bg-[#121214] border border-white/[0.02] rounded-3xl p-4 sm:p-6 shadow-xl mb-4 max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 w-full">
              <div className="flex gap-4 sm:gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full">
                <button 
                  onClick={() => setListTab('conversations')} 
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${listTab === 'conversations' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Recent Chats
                  {unreadConversationsCount > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full px-1">{unreadConversationsCount}</span>
                  )}
                  {listTab === 'conversations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></div>}
                </button>
                <button 
                  onClick={() => setListTab('groups')} 
                  className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${listTab === 'groups' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Groups
                  {unreadGroupsCount > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full px-1">{unreadGroupsCount}</span>
                  )}
                  {listTab === 'groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></div>}
                </button>
              </div>
            </div>
            
            <div key={listTab} className="animate-in fade-in slide-in-from-right-2 duration-300 ease-out">
              {listTab === 'conversations' ? (
                <>
                  <div data-chat-list className="flex flex-col gap-1">
                    {sortedRecent.slice(0, 5).map(renderRecentCard)}
                    <div className={`grid transition-all duration-500 ease-in-out ${expandedRecent ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                      <div className="overflow-hidden flex flex-col gap-1 min-h-0">
                        {sortedRecent.slice(5).map(renderRecentCard)}
                      </div>
                    </div>
                  </div>
                  
                  {sortedRecent.length > 5 && (
                    <div className="flex justify-center mt-5 -mb-2">
                      <button 
                        onClick={() => setExpandedRecent(!expandedRecent)}
                        className="px-5 py-1.5 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-white transition-colors bg-white/[0.02] rounded-full hover:bg-white/[0.04] focus:outline-none"
                      >
                        {expandedRecent ? 'Less' : 'All'}
                        <ChevronRight size={14} className={`transition-transform duration-300 ${expandedRecent ? '-rotate-90' : 'rotate-90'}`} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    {sortedGroups.slice(0, 5).map(renderGroupCard)}
                    <div className={`grid transition-all duration-500 ease-in-out ${expandedGroups ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                      <div className="overflow-hidden flex flex-col gap-1 min-h-0">
                        {sortedGroups.slice(5).map(renderGroupCard)}
                      </div>
                    </div>
                  </div>
                  
                  {sortedGroups.length > 5 && (
                    <div className="flex justify-center mt-5 -mb-2">
                      <button 
                        onClick={() => setExpandedGroups(!expandedGroups)}
                        className="px-5 py-1.5 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-white transition-colors bg-white/[0.02] rounded-full hover:bg-white/[0.04] focus:outline-none"
                      >
                        {expandedGroups ? 'Less' : 'All'}
                        <ChevronRight size={14} className={`transition-transform duration-300 ${expandedGroups ? '-rotate-90' : 'rotate-90'}`} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
