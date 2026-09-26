import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Home, 
  Users, 
  Settings, 
  Search, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Hash, 
  ArrowLeft,
  Phone,
  Video,
  MoreHorizontal,
  Send,
  Mic,
  MicOff,
  Smile,
  Paperclip,
  Globe,
  X,
  Play,
  Pause,
  Trash2,
  Palette,
  SkipForward,
  Tv,
  UserPlus,
  Check,
  UserMinus,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Flag,
  Ban,
  LogOut,
  Pencil,
  MoreVertical,
  Reply,
  Pin,
  Star,
  Forward,
  AlertTriangle,
  Timer,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Film,
  FileArchive,
  Download,
  Square,
  File as FileIcon,
  Sticker,
  SearchIcon,
  Sparkles,
  Wand2,
  ArrowUpRight,
  Type,
  MessageCircle,
  BarChart3,
  ListTodo,
  CheckSquare,
  Calendar,
  Clock,
  Paintbrush,
  StickyNote,
  Eraser,
  Undo2,
  Layers,
  Move,
  Circle,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  Camera,
  Bell,
  Moon,
  Database,
  HelpCircle,
  AtSign,
  UserCheck,
  Sliders,
  ShieldCheck,
  MessageSquare,
  VolumeX,
  Volume2,
  Smartphone,
  GripVertical
} from 'lucide-react';

import { MAX_FILE_SIZE } from '@/constants/config';
import { CURATED_GIF_CATEGORIES, STICKER_PACKS, STICKER_STORE_PACKS } from '@/constants/media';
import { generateMagicReplies, AI_WRITING_TOOLS, applyAiWritingTool } from '@/utils/ai';
import { PROFANITY_LIST, normalizeLeet, containsProfanity, sanitizeText } from '@/utils/profanity';
import { formatFileSize, getFileIcon } from '@/utils/file';
import { generateWaveform, playNotificationTone } from '@/utils/audio';
import { formatMessageTime, formatStoryTime, formatDividerDate, formatRecentChatTime, formatLastSeen, nowMs, MIN, HOUR, DAY } from '@/utils/format';
import { INITIAL_USER, DEFAULT_SETTINGS } from '@/constants/settings';
import { E, gradients, EMOJI_CATEGORIES, QUICK_REACTIONS } from '@/constants/emoji';
import { generateStories, isInDndWindow } from '@/utils/helpers';
import {
  initialFriends, initialGroups, initialChats, initialRecent,
  initialMyStories, initialGlobalUsers, initialCommunities,
  initialCommunities as initialCommunitiesData,
  initialReceivedRequests, mockCallLogs, mockChannels
} from '@/data/initialState';

// -- Extracted components --
import NewChatModal from '@/components/modals/NewChatModal';
import CallsView from '@/views/CallsView';
import RequestsView from '@/views/RequestsView';
import CreateStoryModal from '@/components/story/CreateStoryModal';
import HomeDashboard from '@/views/HomeDashboard';
import StoryViewer from '@/components/story/StoryViewer';
import ReceiptIndicator from '@/components/common/ReceiptIndicator';
import VoiceNotePlayer from '@/components/chat/VoiceNotePlayer';
import VoiceReviewPlayer from '@/components/chat/VoiceReviewPlayer';
import CreatePollModal from '@/components/chat/CreatePollModal';
import WhiteboardPanel from '@/components/chat/WhiteboardPanel';
import SubHeader from '@/components/common/SubHeader';
import SettingsRow from '@/components/common/SettingsRow';
import FAQItem from '@/components/common/FAQItem';
import StorageScreen from '@/views/settings/StorageScreen';
import SettingsPage from '@/views/settings/SettingsPage';
import TaskPanel from '@/components/chat/TaskPanel';
import ChatView from '@/views/ChatView';
import StoryRing from '@/components/common/StoryRing';
import NavButton from '@/components/common/NavButton';
import CommunitySidebar from '@/views/CommunitySidebar';
import CommunityView from '@/views/CommunityView';

export default function App() {
  useLayoutEffect(() => {
    if (!document.getElementById('dashboard-global-styles')) {
      const style = document.createElement('style');
      style.id = 'dashboard-global-styles';
      style.innerHTML = `
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; }
        @keyframes instaFloat {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          5% { transform: translate(0, -5vh) scale(1.2) rotate(calc(var(--rot) * 0.2)); opacity: 1; }
          10% { transform: translate(calc(var(--sway) * 0.2), -10vh) scale(1) rotate(calc(var(--rot) * 0.5)); opacity: 1; }
          33% { transform: translate(var(--sway), -35vh) scale(1) rotate(var(--rot)); opacity: 1; }
          66% { transform: translate(calc(var(--sway) * -0.5), -70vh) scale(0.9) rotate(calc(var(--rot) * -0.5)); opacity: 0.8; }
          100% { transform: translate(calc(var(--sway) * 0.3), -100vh) scale(0.7) rotate(calc(var(--rot) * 0.5)); opacity: 0; }
        }
        .animate-burst {
          animation: instaFloat var(--duration) linear forwards;
          will-change: transform, opacity;
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .animate-typing-dot {
          animation: typingDot 1.4s infinite ease-in-out both;
        }
        body, html { 
          margin: 0; padding: 0; height: 100%; width: 100vw; max-width: 100vw; overflow-x: hidden; overflow-y: hidden; 
          background-color: #0a0a0c !important; overscroll-behavior: none; 
          cursor: default; 
        }
        button, a, [role="button"] { cursor: pointer; }
        button:disabled { cursor: default; }
        input, textarea { cursor: text; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [activeNav, setActiveNav] = useState('home');
  const [settingsInSubScreen, setSettingsInSubScreen] = useState(false);
  // In-memory draft store: { [chatId]: string } — cleared on logout/page close
  const [drafts, setDrafts] = useState({});
  const saveDraft = (chatId, text) => setDrafts(prev => ({ ...prev, [chatId]: text }));
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [appToast, setAppToast] = useState('');
  
  const [friends, setFriends] = useState(initialFriends);
  const [groups, setGroups] = useState(initialGroups);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || INITIAL_USER; } catch { return INITIAL_USER; }
  });
  const [userSettings, setUserSettings] = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('userSettings')) }; } catch { return DEFAULT_SETTINGS; }
  });

  // Persist settings to localStorage
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('userSettings', JSON.stringify(userSettings)); }, [userSettings]);

  const updateSetting = useCallback((section, key, value) => {
    setUserSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  }, []);

  // ?? Apply appearance ? CSS vars + global font scaling (no layout breakage) ??
  useEffect(() => {
    const a = userSettings.appearance;
    const themes = {
      dark:     { bg: '#0a0a0c', sec: '#121214', panel: '#0f0f13', border: 'rgba(255,255,255,0.05)' },
      darker:   { bg: '#050507', sec: '#0a0a0c', panel: '#080809', border: 'rgba(255,255,255,0.04)' },
      midnight: { bg: '#0d0d1a', sec: '#12122a', panel: '#0f0f20', border: 'rgba(100,100,255,0.08)' },
      slate:    { bg: '#0c0e12', sec: '#141720', panel: '#111318', border: 'rgba(255,255,255,0.06)' },
    };
    // Font scale multiplier ? ONLY font-size is overridden, NOT padding/margin/width/icons.
    // This means layout never breaks. Text scales everywhere (chat, settings, calls, etc.).
    const fontScale = { small: 0.875, medium: 1.0, large: 1.125 }[a?.fontSize] || 1.0;
    const t   = themes[a?.theme] || themes.dark;
    const acc = a?.accentColor || '#6366f1';

    // 1) CSS variables
    const root = document.documentElement;
    root.style.setProperty('--app-bg',           t.bg);
    root.style.setProperty('--app-bg-secondary', t.sec);
    root.style.setProperty('--app-bg-panel',     t.panel);
    root.style.setProperty('--app-border',       t.border);
    root.style.setProperty('--app-accent',       acc);
    root.style.setProperty('--app-font-scale',   String(fontScale));
    document.body.style.backgroundColor = t.bg;

    // 2) Injected style tag
    // Strategy: override every Tailwind .text-* class with a scaled font-size.
    // Padding (p-4), gap, width etc. use rem too but we do NOT override those classes
    // → layout stays pixel-perfect while all text content scales uniformly.
    const fs = fontScale; // shorthand
    let el = document.getElementById('app-theme-overrides');
    if (!el) {
      el = document.createElement('style');
      el.id = 'app-theme-overrides';
      document.head.appendChild(el);
    }
    el.textContent = `
      /* ??? Background overrides ??? */
      [class*="bg-[#0a0a0c]"], [class*="bg-[#050507]"],
      [class*="bg-[#0d0d1a]"], [class*="bg-[#0c0e12]"] { background-color: ${t.bg}    !important; }
      [class*="bg-[#121214]"], [class*="bg-[#12122a]"],
      [class*="bg-[#141720]"]                          { background-color: ${t.sec}   !important; }
      [class*="bg-[#0f0f13]"], [class*="bg-[#080809]"],
      [class*="bg-[#0f0f20]"], [class*="bg-[#111318]"] { background-color: ${t.panel} !important; }
      [class*="bg-[#0f0f13]/90"] { background-color: ${t.panel}e6 !important; }
      [class*="bg-[#0f0f13]/80"] { background-color: ${t.panel}cc !important; }
      [class*="bg-[#121214]/80"] { background-color: ${t.sec}cc   !important; }
      [class*="bg-[#0a0a0c]/80"] { background-color: ${t.bg}cc    !important; }

      /* ??? Global font scaling ? all text classes, zero layout impact ???
         Only font-size is overridden. Padding/margin/gap/icons (also rem) are untouched.
         Covers: chat, chat list, settings, calls, communities, requests, modals.
      */
      .text-xs   { font-size: ${(0.75  * fs).toFixed(4)}rem !important; }
      .text-sm   { font-size: ${(0.875 * fs).toFixed(4)}rem !important; }
      .text-base { font-size: ${(1.0   * fs).toFixed(4)}rem !important; }
      .text-lg   { font-size: ${(1.125 * fs).toFixed(4)}rem !important; }
      .text-xl   { font-size: ${(1.25  * fs).toFixed(4)}rem !important; }
      .text-2xl  { font-size: ${(1.5   * fs).toFixed(4)}rem !important; }
      .text-3xl  { font-size: ${(1.875 * fs).toFixed(4)}rem !important; }
      .text-4xl  { font-size: ${(2.25  * fs).toFixed(4)}rem !important; }

      /* Arbitrary px sizes used throughout the app */
      .text-\\[10px\\] { font-size: ${(10 * fs).toFixed(2)}px !important; }
      .text-\\[11px\\] { font-size: ${(11 * fs).toFixed(2)}px !important; }
      .text-\\[12px\\] { font-size: ${(12 * fs).toFixed(2)}px !important; }
      .text-\\[13px\\] { font-size: ${(13 * fs).toFixed(2)}px !important; }
      .text-\\[14px\\] { font-size: ${(14 * fs).toFixed(2)}px !important; }
      .text-\\[15px\\] { font-size: ${(15 * fs).toFixed(2)}px !important; }
      .text-\\[16px\\] { font-size: ${(16 * fs).toFixed(2)}px !important; }
      .text-\\[17px\\] { font-size: ${(17 * fs).toFixed(2)}px !important; }
      .text-\\[18px\\] { font-size: ${(18 * fs).toFixed(2)}px !important; }
      .text-\\[20px\\] { font-size: ${(20 * fs).toFixed(2)}px !important; }
      .text-\\[24px\\] { font-size: ${(24 * fs).toFixed(2)}px !important; }
      .text-\\[28px\\] { font-size: ${(28 * fs).toFixed(2)}px !important; }
      .text-\\[32px\\] { font-size: ${(32 * fs).toFixed(2)}px !important; }

            /* Settings navigation animations */
      @keyframes ssSlideIn {
        from { opacity: 0; transform: translateX(1.5rem); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes ssSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(1.5rem); }
      }
      @keyframes ssMenuReturn {
        from { opacity: 0; transform: translateX(-0.75rem); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .settings-subscreen     { animation: ssSlideIn    300ms ease-in-out both; }
      .settings-subscreen-out { animation: ssSlideOut   200ms ease-in-out both; pointer-events: none; }
      .settings-menu-return   { animation: ssMenuReturn 300ms ease-in-out both; }
    `;
  }, [userSettings.appearance]);


  const [communities, setCommunities] = useState(initialCommunities);
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [communityGroupChatId, setCommunityGroupChatId] = useState(null);
  const [myStories, setMyStories] = useState(initialMyStories);
  const [globalUsers] = useState(initialGlobalUsers);
  const [sentReqs, setSentReqs] = useState([]);
  const [receivedReqs, setReceivedReqs] = useState(initialReceivedRequests);
  
  
  const [typingIndicators, setTypingIndicators] = useState({});
  const [recentConversations, setRecentConversations] = useState(initialRecent);
  const [chatDetails, setChatDetails] = useState(initialChats);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [overlayStates, setOverlayStates] = useState({ home: false, calls: false });
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [disappearingChats, setDisappearingChats] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]); // { id, name, avatar, isGroup, blockedAt }
  
  const handleCloseChat = () => {
    const closingId = selectedChatId || communityGroupChatId;
    const disappearing = closingId ? disappearingChats[closingId] : null;
    
    setIsChatClosing(true);
    setTimeout(() => {
      // Only clean up messages for 'session' duration when chat closes
      if (disappearing?.enabled && closingId && disappearing.duration === 'session') {
        setChatDetails(prev => prev.map(c => {
          if (c.id !== closingId) return c;
          const filtered = c.messages.filter(m => 
            m.type === 'system' || !m.timestamp || m.timestamp < disappearing.enabledAt
          );
          const expiryMsg = {
            id: Date.now() + Math.random(),
            type: 'system',
            actorId: null,
            text: 'Your secret chat session ended',
            timestamp: Date.now()
          };
          return { ...c, messages: [...filtered, expiryMsg] };
        }));
        
        // Auto-disable disappearing mode for session duration
        setDisappearingChats(prev => {
          const next = { ...prev };
          delete next[closingId];
          return next;
        });
      }
      setSelectedChatId(null);
      setCommunityGroupChatId(null);
      setIsChatClosing(false);
    }, 300);
  };
  
  const handleOverlayChange = useCallback((source, isActive) => {
    setOverlayStates(prev => ({ ...prev, [source]: isActive }));
  }, []);

  const isGlobalOverlayActive = overlayStates.home || overlayStates.calls;

  const showGlobalToast = (msg, opts = {}) => {
    const notifs = userSettings?.notifications || {};
    // Respect inApp toggle (always show system-critical messages via opts.force)
    if (!opts.force && notifs.inApp === false) return;
    // Respect DND window
    if (!opts.force && isInDndWindow(notifs.dnd)) return;
    // Show toast ? optionally hide message content
    const displayMsg = (notifs.preview === false && opts.isMessage)
      ? 'New message'
      : msg;
    setAppToast(displayMsg);
    setTimeout(() => setAppToast(''), 3000);
    // Play sound
    if (notifs.sound !== false && !opts.silent) {
      playNotificationTone(notifs.tone || 'ping');
    }
  };

  const handleSelectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    if (chatId) {
      setRecentConversations(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
      setGroups(prev => prev.map(g => g.id === chatId ? { ...g, unread: 0 } : g));
    }
  }, []);

  useEffect(() => {
    const cullExpired = () => {
      const now = Date.now();
      const isExpired = (s) => (now - s.timestamp) >= 24 * HOUR;
      setMyStories(prev => prev.filter(s => !isExpired(s)));
      setFriends(prev => {
        let changed = false;
        const next = prev.map(f => {
          const validStories = f.stories.filter(s => !isExpired(s));
          if (validStories.length !== f.stories.length) {
            changed = true;
            return { ...f, stories: validStories, storyViewed: validStories.length > 0 ? validStories.every(s => s.viewed) : false };
          }
          return f;
        });
        return changed ? next : prev;
      });
    };
    cullExpired();
    const interval = setInterval(cullExpired, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (recentConversations.length === 0) return;
      const randomChat = recentConversations[Math.floor(Math.random() * recentConversations.length)];
      
      let memberId;
      if (randomChat.isGroup) {
        const group = groups.find(g => g.id === randomChat.id);
        if (!group) return;
        const others = group.memberIds.filter(id => id !== currentUser.id);
        if (others.length === 0) return;
        memberId = others[Math.floor(Math.random() * others.length)];
      } else {
        memberId = randomChat.id;
      }

      setTypingIndicators(prev => {
        const current = prev[randomChat.id] || [];
        if (current.includes(memberId)) return prev;
        return { ...prev, [randomChat.id]: [...current, memberId] };
      });

      setTimeout(() => {
        setTypingIndicators(prev => {
          const current = prev[randomChat.id] || [];
          return { ...prev, [randomChat.id]: current.filter(id => id !== memberId) };
        });
      }, 2000 + Math.random() * 3000);

    }, 8000); 
    return () => clearInterval(interval);
  }, [recentConversations, groups]);

  const handleTypingGlobal = useCallback((chatId, isTyping) => {
    setTypingIndicators(prev => {
        const current = prev[chatId] || [];
        const isCurrentlyTyping = current.includes(currentUser.id);
        if (isTyping && !isCurrentlyTyping) {
            return { ...prev, [chatId]: [...current, currentUser.id] };
        } else if (!isTyping && isCurrentlyTyping) {
            return { ...prev, [chatId]: current.filter(id => id !== currentUser.id) };
        }
        return prev;
    });
  }, []);

  const handleReactToMessageGlobal = useCallback((chatId, messageId, emoji) => {
    setChatDetails(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          const existingUserReactionIndex = currentReactions.findIndex(r => r.userId === currentUser.id);

          let newReactions = [...currentReactions];
          if (existingUserReactionIndex >= 0) {
            if (newReactions[existingUserReactionIndex].emoji === emoji) {
              newReactions.splice(existingUserReactionIndex, 1);
            } else {
              newReactions[existingUserReactionIndex] = { userId: currentUser.id, emoji };
            }
          } else {
            newReactions.push({ userId: currentUser.id, emoji });
          }
          return { ...m, reactions: newReactions };
        })
      };
    }));
  }, []);

  const handleSendMessageGlobal = useCallback((userId, text, replyTo = null, customPayload = null, storyReply = null, meta = null) => {
    // On-device profanity filter — only hard-block when mode is 'block'
    // Other modes (warn, sanitize, off) are handled in ChatView before this is called
    const _safetyMode = userSettings.safety?.profanityFilter || 'block';
    const _safetyOpts = { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] };
    if (text && _safetyMode === 'block' && containsProfanity(text, _safetyOpts) && !meta?.poll) return 'profanity';
    const group = groups.find(g => g.id === userId);
    const newMessage = customPayload || {
      id: Date.now(),
      senderId: currentUser.id,
      text: text,
      timestamp: Date.now(),
      replyTo: replyTo,
      isStarred: false,
      status: 'sent',
      ...(group ? { receipts: (group.memberIds || []).filter(mid => mid !== currentUser.id).map(mid => ({ userId: mid, status: 'pending' })) } : {}),
      ...(storyReply ? { storyReply } : {}),
      ...(meta ? { meta } : {})
    };

    setChatDetails(prev => {
      const existingChat = prev.find(c => c.id === userId);
      if (existingChat) {
        return prev.map(c => c.id === userId ? { ...c, messages: [...c.messages, newMessage] } : c);
      } else {
        return [...prev, { id: userId, messages: [newMessage] }];
      }
    });

    // Don't update home screen preview with disappearing messages
    const isDisappearing = disappearingChats[userId]?.enabled;
    
    // Generate preview text for non-text messages
    const previewText = text || (newMessage.attachment ? `📎 ${newMessage.attachment.name}` : (newMessage.voiceNote ? '🎤 Voice message' : (newMessage.gif ? 'GIF' : (newMessage.sticker ? newMessage.sticker.emoji : ''))));

    setRecentConversations(prev => {
      const existingRecent = prev.find(c => c.id === userId);
      if (existingRecent) {
        const filtered = prev.filter(c => c.id !== userId);
        if (isDisappearing) {
          // Keep old lastMessage, just bump to top
          return [{ ...existingRecent, timestamp: Date.now(), unread: 0 }, ...filtered];
        }
        return [{ ...existingRecent, lastMessage: previewText, timestamp: Date.now(), unread: 0 }, ...filtered];
      }

      const friend = friends.find(f => f.id === userId);
      const group = groups.find(g => g.id === userId);
      const globalUser = globalUsers.find(u => u.id === userId);
      
      let name = friend?.name || group?.name || globalUser?.name || 'Unknown';
      let avatar = friend?.avatar || globalUser?.avatar || '';
      let status = existingRecent?.status || (friend?.isOnline ? 'online' : (globalUser?.status?.toLowerCase() || 'offline'));
      let isGroup = existingRecent?.isGroup || !!group || false;
      let icon = existingRecent?.icon || group?.icon || '';

      const filtered = prev.filter(c => c.id !== userId);
      const newRecent = {
        id: userId, name, avatar, status, isGroup, icon, lastMessage: isDisappearing ? '' : previewText, timestamp: Date.now(), unread: 0
      };
      return [newRecent, ...filtered];
    });
  }, [friends, groups, globalUsers, disappearingChats]);

  const handleUpdateMessageStatus = useCallback((chatId, messageId, newStatus, newReceipts = null) => {
    setChatDetails(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.id !== messageId) return m;
          return { ...m, status: newStatus, ...(newReceipts ? { receipts: newReceipts } : {}) };
        })
      };
    }));
  }, []);

  const appendSystemMessage = useCallback((chatId, text, actorId = currentUser.id) => {
    const sysMsg = { id: Date.now() + Math.random(), type: 'system', text, actorId, timestamp: Date.now() };
    setChatDetails(prev => {
      const existingChat = prev.find(c => c.id === chatId);
      if (existingChat) return prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, sysMsg] } : c);
      return [...prev, { id: chatId, messages: [sysMsg] }];
    });
    setRecentConversations(prev => {
      const existing = prev.find(rc => rc.id === chatId);
      if (existing) {
        const filtered = prev.filter(c => c.id !== chatId);
        return [{ ...existing, timestamp: Date.now() }, ...filtered];
      }
      return prev;
    });
  }, []);

  const handleDeleteMessage = useCallback((chatId, messageId, deleteType, isSelf) => {
    setChatDetails(prev => {
      const chatIndex = prev.findIndex(c => c.id === chatId);
      if (chatIndex === -1) return prev;
      
      const nextDetails = [...prev];
      const chat = { ...nextDetails[chatIndex] };
      const isLastMsg = chat.messages.length > 0 && chat.messages[chat.messages.length - 1].id === messageId;
      
      chat.messages = deleteType === 'for_me' 
          ? chat.messages.filter(m => m.id !== messageId) 
          : chat.messages.map(m => m.id === messageId ? { ...m, isDeleted: true, deletedByAdmin: !isSelf } : m);
          
      nextDetails[chatIndex] = chat;

      if (isLastMsg) {
        let newLastMessageText = '';
        if (chat.messages.length > 0) {
          const lastM = chat.messages[chat.messages.length - 1];
          if (lastM.isDeleted) {
            newLastMessageText = E('1F6AB') + ' This message was deleted';
          } else if (lastM.type === 'system') {
            newLastMessageText = lastM.text;
          } else {
            newLastMessageText = lastM.text;
          }
        }
        // Use timeout to avoid exact StrictMode double-invocation warnings for state side-effects.
        setTimeout(() => {
          setRecentConversations(rcPrev => rcPrev.map(rc => rc.id === chatId ? { ...rc, lastMessage: newLastMessageText } : rc));
        }, 0);
      }
      return nextDetails;
    });
  }, []);

  const handleToggleStarMessage = useCallback((chatId, messageId) => {
    setChatDetails(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.id !== messageId) return m;
          return { ...m, isStarred: !m.isStarred };
        })
      };
    }));
  }, []);

  const handleStartChat = (userId) => {
    setShowNewChatModal(false);
    handleSelectChat(userId);
  };

  const handleCreateGroup = (name, memberIds) => {
    // Profanity filter for group name
    if (containsProfanity(name, { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] })) {
      showGlobalToast('⚠️ Group name contains inappropriate language. Please choose a different name.');
      return;
    }
    if (memberIds.length + 1 > 1024) {
      showGlobalToast("A group can have a maximum of 1024 members.");
      return;
    }
    const newGroup = {
      id: Date.now(), name: name, description: 'A new group created by you.', members: memberIds.length + 1,
      memberIds: [currentUser.id, ...memberIds], adminIds: [currentUser.id], unread: 0,
      icon: gradients[Math.floor(Math.random() * gradients.length)], isGroup: true
    };
    setGroups(prev => [newGroup, ...prev]);
    setShowNewChatModal(false);
    handleSelectChat(newGroup.id);
    appendSystemMessage(newGroup.id, 'created the group', currentUser.id);
    
    if (memberIds.length > 0) {
      const addedNames = memberIds.map(id => friends.find(f => f.id === id)?.name).filter(Boolean).join(', ');
      if (addedNames) setTimeout(() => appendSystemMessage(newGroup.id, `added ${addedNames}`, currentUser.id), 10);
    }
  };

  const handleUpdateGroupInfo = useCallback((groupId, newName, newDesc) => {
    // Profanity filter for group name & description
    const _groupFilterOpts = { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] };
    if (containsProfanity(newName, _groupFilterOpts) || containsProfanity(newDesc, _groupFilterOpts)) {
      showGlobalToast('⚠️ Inappropriate language detected. Please revise.');
      return;
    }
    const group = groups.find(g => g.id === groupId);
    if (group && group.name !== newName) appendSystemMessage(groupId, `changed the group name from "${group.name}" to "${newName}"`, currentUser.id);
    if (group && group.description !== newDesc) appendSystemMessage(groupId, `changed the group description`, currentUser.id);

    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName, description: newDesc } : g));
    setRecentConversations(prev => prev.map(c => c.id === groupId ? { ...c, name: newName } : c));
    setChatDetails(prev => prev.map(c => c.id === groupId ? { ...c, name: newName } : c));
    showGlobalToast('Group info updated.');
  }, [groups, appendSystemMessage]);

  const handleAddMembers = useCallback((groupId, newMemberIds) => {
    const addedNames = newMemberIds.map(id => friends.find(f => f.id === id)?.name).filter(Boolean).join(', ');
    appendSystemMessage(groupId, `added ${addedNames}`, currentUser.id);
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updatedIds = [...new Set([...g.memberIds, ...newMemberIds])];
        return { ...g, memberIds: updatedIds, members: updatedIds.length };
      }
      return g;
    }));
    showGlobalToast(`${newMemberIds.length} member(s) added.`);
  }, [friends, appendSystemMessage]);

  const handleRemoveMembers = useCallback((groupId, memberIdsToRemove) => {
    const removedNames = memberIdsToRemove.map(id => friends.find(f => f.id === id)?.name).filter(Boolean).join(', ');
    appendSystemMessage(groupId, `removed ${removedNames}`, currentUser.id);
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updatedIds = g.memberIds.filter(id => !memberIdsToRemove.includes(id));
        const updatedAdmins = g.adminIds.filter(id => !memberIdsToRemove.includes(id));
        return { ...g, memberIds: updatedIds, adminIds: updatedAdmins, members: updatedIds.length };
      }
      return g;
    }));
    showGlobalToast(`${memberIdsToRemove.length} member(s) removed.`);
  }, [friends, appendSystemMessage]);

  const handleToggleAdmin = useCallback((groupId, memberId) => {
    const group = groups.find(g => g.id === groupId);
    const memberName = friends.find(f => f.id === memberId)?.name;
    if (group && memberName) {
      const isAdmin = group.adminIds.includes(memberId);
      if (isAdmin) appendSystemMessage(groupId, `removed Admin privileges from ${memberName}`, currentUser.id);
      else appendSystemMessage(groupId, `made ${memberName} an Admin`, currentUser.id);
    }
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const isAdmin = g.adminIds.includes(memberId);
        return { ...g, adminIds: isAdmin ? g.adminIds.filter(id => id !== memberId) : [...g.adminIds, memberId] };
      }
      return g;
    }));
    showGlobalToast('Admin roles updated.');
  }, [groups, friends, appendSystemMessage]);

  const handleSendReq = (user) => { if (!sentReqs.find(r => r.id === user.id)) setSentReqs(prev => [...prev, user]); };
  const handleWithdrawReq = (userId) => setSentReqs(prev => prev.filter(r => r.id !== userId));
  const handleAcceptReq = (userId) => {
    const acceptedUser = receivedReqs.find(r => r.id === userId);
    if (acceptedUser) {
      setReceivedReqs(prev => prev.filter(r => r.id !== userId));
      setFriends(prev => [...prev, { id: acceptedUser.id, name: acceptedUser.name, handle: acceptedUser.handle, avatar: acceptedUser.avatar, storyType: 'none', isOnline: acceptedUser.status === 'Online', storyViewed: false, stories: [] }]);
    }
  };
  const handleRejectReq = (userId) => setReceivedReqs(prev => prev.filter(r => r.id !== userId));

  const handleLeaveGroup = (groupId) => {
    appendSystemMessage(groupId, 'left', currentUser.id);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setRecentConversations(prev => prev.filter(c => c.id !== groupId));
    setChatDetails(prev => prev.filter(c => c.id !== groupId));
    setSelectedChatId(null);
    showGlobalToast('You left the group.');
  };
  
  const handleDisconnect = (userId) => {
    setFriends(prev => prev.filter(f => f.id !== userId));
    setSelectedChatId(null);
    showGlobalToast('Connection removed.');
  };

  const handleBlock = (id, isGroup) => {
    // Capture info before removing from lists
    const group = groups.find(g => g.id === id);
    const friend = friends.find(f => f.id === id);
    const entity = isGroup ? group : friend;
    if (entity) {
      setBlockedUsers(prev => [
        ...prev.filter(b => b.id !== id),
        { id, name: entity.name, avatar: entity.avatar || null, isGroup: !!isGroup, blockedAt: Date.now() }
      ]);
    }
    if (isGroup) {
      setGroups(prev => prev.filter(g => g.id !== id));
      showGlobalToast('Group blocked.');
    } else {
      setFriends(prev => prev.filter(f => f.id !== id));
      showGlobalToast('User blocked.');
    }
    setRecentConversations(prev => prev.filter(c => c.id !== id));
    setChatDetails(prev => prev.filter(c => c.id !== id));
    setSelectedChatId(null);
  };

  const handleUnblock = (id) => {
    setBlockedUsers(prev => prev.filter(b => b.id !== id));
    showGlobalToast('Unblocked successfully.');
  };

  const handleReport = (id, isGroup, category, _description) => {
  
    if (isGroup) {
      setGroups(prev => prev.filter(g => g.id !== id));
      showGlobalToast(`Group reported for ${category}.`);
    } else {
      setFriends(prev => prev.filter(f => f.id !== id));
      showGlobalToast(`User reported for ${category}.`);
    }
    setRecentConversations(prev => prev.filter(c => c.id !== id));
    setChatDetails(prev => prev.filter(c => c.id !== id));
    setSelectedChatId(null);
  };

  const handlePinMessage = useCallback((groupId, message) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const isAlreadyPinned = group.pinnedMessage?.id === message.id;
    appendSystemMessage(groupId, isAlreadyPinned ? 'unpinned a message' : 'pinned a message', currentUser.id);

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, pinnedMessage: isAlreadyPinned ? null : message };
      }
      return g;
    }));
  }, [groups, appendSystemMessage]);

  const handleToggleAdminMessaging = useCallback((groupId, value) => {
    appendSystemMessage(groupId, value ? 'changed group settings to allow only admins to send messages' : 'changed group settings to allow all members to send messages', currentUser.id);
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, onlyAdminsCanMessage: value };
      }
      return g;
    }));
  }, [appendSystemMessage]);

  const handleToggleDisappearing = useCallback((chatId, enabled, duration = null) => {
    if (enabled && duration) {
      setDisappearingChats(prev => ({
        ...prev,
        [chatId]: { enabled: true, duration, enabledAt: Date.now() }
      }));
      appendSystemMessage(chatId, 'turned on secret chat', currentUser.id);
    } else {
      // When manually toggling off, delete messages sent during the disappearing period
      const config = disappearingChats[chatId];
      if (config?.enabled) {
        setChatDetails(prev => prev.map(c => {
          if (c.id !== chatId) return c;
          const filtered = c.messages.filter(m =>
            m.type === 'system' || !m.timestamp || m.timestamp < config.enabledAt
          );
          const endMsg = {
            id: Date.now() + Math.random(),
            type: 'system',
            actorId: null,
            text: 'Your secret chat session ended',
            timestamp: Date.now()
          };
          return { ...c, messages: [...filtered, endMsg] };
        }));
      }
      setDisappearingChats(prev => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
    }
  }, [appendSystemMessage, disappearingChats]);

  // Auto-expire disappearing chats based on duration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDisappearingChats(prev => {
        const next = { ...prev };
        let changed = false;
        const expiredIds = [];
        Object.entries(next).forEach(([chatId, config]) => {
          if (!config.enabled || config.duration === 'session') return;
          const durationMs = { '1day': DAY, '1week': 7 * DAY, '1month': 30 * DAY }[config.duration];
          if (durationMs && now - config.enabledAt >= durationMs) {
            expiredIds.push({ id: chatId, enabledAt: config.enabledAt });
            delete next[chatId];
            changed = true;
          }
        });
        // Clean up messages for expired chats
        if (expiredIds.length > 0) {
          setChatDetails(prevChats => prevChats.map(c => {
            const expired = expiredIds.find(e => String(e.id) === String(c.id));
            if (!expired) return c;
            const filtered = c.messages.filter(m =>
              m.type === 'system' || !m.timestamp || m.timestamp < expired.enabledAt
            );
            const expiryMsg = {
              id: Date.now() + Math.random(),
              type: 'system',
              actorId: null,
              text: 'Your secret chat expired',
              timestamp: Date.now()
            };
            return { ...c, messages: [...filtered, expiryMsg] };
          }));
        }
        return changed ? next : prev;
      });
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  let activeChat = null;
  if (selectedChatId) {
    const friend = friends.find(f => f.id === selectedChatId);
    const group = groups.find(g => g.id === selectedChatId);
    const globalUser = globalUsers.find(u => u.id === selectedChatId) || sentReqs.find(u => u.id === selectedChatId) || receivedReqs.find(u => u.id === selectedChatId);
    const existingChatDetails = chatDetails.find(c => c.id === selectedChatId);
    const recentChat = recentConversations.find(c => c.id === selectedChatId);
    
    const baseInfo = friend || group || globalUser || recentChat || existingChatDetails;
    
    if (baseInfo) {
      let isOnline = false;
      if (friend) isOnline = friend.isOnline;
      else if (globalUser) isOnline = globalUser.status === 'Online' || globalUser.status === 'online';
      else if (recentChat) isOnline = recentChat.status === 'online';
      else if (baseInfo.status) isOnline = baseInfo.status === 'online' || baseInfo.status === 'Online';

      activeChat = {
        ...baseInfo,
        status: isOnline ? 'online' : 'offline',
        lastSeen: friend?.lastSeen || null,
        isConnected: !!friend || !!group,
        messages: existingChatDetails ? existingChatDetails.messages : []
      };
    }
  }

  const unreadChatIds = new Set([
    ...recentConversations.filter(c => c.unread > 0).map(c => c.id),
    ...groups.filter(g => g.unread > 0).map(g => g.id)
  ]);
  const totalUnreadCount = unreadChatIds.size;

  const communityUnreadCount = communities.reduce((total, c) => {
    const hasUnread = c.groupIds.some(gid => {
      const g = groups.find(x => x.id === gid);
      return g && g.unread > 0;
    });
    return total + (hasUnread ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0c] text-zinc-200 font-sans md:p-4 overflow-hidden selection:bg-indigo-500/30 cursor-default w-full max-w-[100vw]">
      
      {/* Tailwind JIT FOUC Preloader - Forces compilation of story styles on load */}
      <div style={{ display: 'none' }} className="bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 bg-gradient-to-br from-blue-600 to-cyan-400 bg-gradient-to-tr from-emerald-400 to-cyan-500 bg-gradient-to-br from-rose-500 to-orange-400 bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] zoom-in-[0.98] bg-black/60 bg-black/80 bg-black/40 bg-gradient-to-t from-black/80 via-black/40 blur-3xl opacity-30 transform-gpu scale-110"></div>
      
      {appToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[150] bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300">
          {appToast}
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full max-w-7xl mx-auto min-h-0">
        <div className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-10 ${
          (selectedChatId && !isChatClosing) ? 'opacity-0 -translate-x-[20%] pointer-events-none scale-[0.98]' : 'opacity-100 translate-x-0  scale-100'
        }`}>
          
          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            activeNav === 'home' ? 'opacity-100 translate-y-0  scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            <HomeDashboard 
              onSelectChat={handleSelectChat} 
              globalUsers={globalUsers}
              sentReqs={sentReqs}
              onSendReq={handleSendReq}
              onWithdrawReq={handleWithdrawReq}
              friends={friends}
              setFriends={setFriends}
              groups={groups}
              receivedReqs={receivedReqs}
              onAcceptReq={handleAcceptReq}
              onRejectReq={handleRejectReq}
              myStories={myStories}
              setMyStories={setMyStories}
              recentConversations={recentConversations}
              typingIndicators={typingIndicators}
              chatDetails={chatDetails}
              onSendMessage={handleSendMessageGlobal}
              onOverlayChange={handleOverlayChange}
              currentUser={currentUser}
              userSettings={userSettings}
              drafts={drafts}
            />
          </div>
          
          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            activeNav === 'teams' ? 'opacity-100 translate-y-0  scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            <RequestsView 
              sentReqs={sentReqs}
              receivedReqs={receivedReqs}
              onAccept={handleAcceptReq}
              onReject={handleRejectReq}
              onWithdraw={handleWithdrawReq}
            />
          </div>

          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            activeNav === 'calls' ? 'opacity-100 translate-y-0  scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            <CallsView 
              callLogs={mockCallLogs} 
              friends={friends} 
              groups={groups} 
              onOverlayChange={handleOverlayChange} 
              isActive={activeNav === 'calls'}
            />
          </div>

          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            activeNav === 'community' ? 'opacity-100 translate-y-0  scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            <CommunityView 
              communities={communities} 
              setCommunities={setCommunities}
              groups={groups} 
              activeCommunityId={activeCommunityId} 
              setActiveCommunityId={setActiveCommunityId}
              onSelectGroup={(gid) => {
                setCommunityGroupChatId(gid);
                handleSelectChat(gid);
              }}
              currentUser={currentUser}
              userSettings={userSettings}
            />
          </div>

          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
            activeNav === 'settings' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            <SettingsPage
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              userSettings={userSettings}
              onUpdateSetting={updateSetting}
              blockedUsers={blockedUsers}
              onUnblock={handleUnblock}
              chatDetails={chatDetails}
              setChatDetails={setChatDetails}
              onToast={showGlobalToast}
              onSubScreenChange={setSettingsInSubScreen}
            />
          </div>

      </div>
        
      <div className={`absolute inset-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        (selectedChatId && activeChat && !isChatClosing) ? 'translate-x-0 opacity-100 ' : 'translate-x-[20%] opacity-0 pointer-events-none'
      }`}>
        {selectedChatId && activeChat && (
          <div className="flex h-full w-full bg-[#121214] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex-1 min-w-0 relative">
              <ChatView 
                key={activeChat.id}
              chat={activeChat} 
              onBack={handleCloseChat} 
              sentReqs={sentReqs}
              onSendReq={handleSendReq}
              onWithdrawReq={handleWithdrawReq}
              receivedReqs={receivedReqs}
              onAcceptReq={handleAcceptReq}
              onRejectReq={handleRejectReq}
              onSendMessage={handleSendMessageGlobal}
              onReactToMessage={handleReactToMessageGlobal}
              friends={friends}
              typingIndicators={typingIndicators}
              onTyping={handleTypingGlobal}
              onLeaveGroup={handleLeaveGroup}
              onBlock={handleBlock}
              onReport={handleReport}
              onDisconnect={handleDisconnect}
              onUpdateGroupInfo={handleUpdateGroupInfo}
              onRemoveMembers={handleRemoveMembers}
              onToggleAdmin={handleToggleAdmin}
              onAddMembers={handleAddMembers}
              onDeleteMessage={handleDeleteMessage}
              onStartChat={handleStartChat}
              onPinMessage={handlePinMessage}
              onToggleAdminMessaging={handleToggleAdminMessaging}
              onToggleStarMessage={handleToggleStarMessage}
              onForwardMessage={setForwardingMsg}
              groups={groups}
              globalUsers={globalUsers}
              disappearingChat={disappearingChats[activeChat.id] || null}
              onToggleDisappearing={handleToggleDisappearing}
              onUpdateMessageStatus={handleUpdateMessageStatus}
              currentUser={currentUser}
              readReceipts={userSettings.privacy?.readReceipts !== false}
              bubbleStyle={userSettings.appearance?.bubbleStyle || 'default'}
              chatFontSize={userSettings.appearance?.fontSize || 'medium'}
              aiSmartReplies={userSettings.ai?.smartReplies !== false}
              aiWritingAssistant={userSettings.ai?.writingAssistant !== false}
              filterSettings={userSettings.safety || {}}
              draft={drafts[activeChat?.id] || ''}
              onSaveDraft={saveDraft}
            />
            </div>
          </div>
        )}
      </div>
      </main>

      <NewChatModal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)} 
        friends={friends}
        onStartChat={handleStartChat}
        onCreateGroup={handleCreateGroup}
        userSettings={userSettings}
      />

      {forwardingMsg && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121214] border border-white/[0.05] rounded-3xl w-[90%] max-w-md shadow-2xl flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-[#121214] z-10 rounded-t-3xl">
              <h2 className="text-lg font-bold text-white tracking-tight">Forward Message</h2>
              <button type="button" onClick={() => setForwardingMsg(null)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
               <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Forward To</h3>
               <div className="space-y-1">
                 {[...friends, ...groups].map(info => {
                    return (
                      <button key={info.id} onClick={() => {
                        handleSendMessageGlobal(info.id, forwardingMsg.text, null, {
                           ...forwardingMsg,
                           id: Date.now(),
                           senderId: currentUser.id,
                           timestamp: Date.now(),
                           replyTo: null,
                           isStarred: false,
                           isDeleted: false,
                           forwardCount: (forwardingMsg.forwardCount || 0) + 1
                        });
                        setForwardingMsg(null);
                        showGlobalToast('Message forwarded');
                        handleStartChat(info.id);
                      }} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors text-left group/fwd">
                        <div className="relative">
                          {info.icon ? (
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0"><Hash size={16}/></div>
                          ) : (
                            <img src={info.avatar} alt="" className="w-10 h-10 rounded-full shrink-0"/>
                          )}
                        </div>
                        <div className="flex-[1] min-w-0">
                           <h4 className="text-sm font-medium text-white truncate">{info.name}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center opacity-0 group-hover/fwd:opacity-100 transition-opacity shrink-0">
                           <Send size={14} className="ml-0.5"/>
                        </div>
                      </button>
                    )
                 })}
               </div>
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121214]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-2 flex items-center shadow-2xl z-50 w-auto max-w-[95vw] overflow-x-auto ring-1 ring-white/[0.02] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        ((selectedChatId && !isChatClosing) || isGlobalOverlayActive || showNewChatModal || forwardingMsg || (activeNav === 'settings' && settingsInSubScreen)) 
          ? 'opacity-0 pointer-events-none translate-y-4 scale-95' 
          : 'opacity-100  translate-y-0 scale-100'
      }`}>
        <div className="flex items-center gap-1 md:gap-2 px-1">
          <NavButton 
            icon={<Settings size={22} />} 
            active={activeNav === 'settings'} 
            onClick={() => setActiveNav('settings')} 
          />
        </div>

        <div className="w-[1px] h-8 bg-white/[0.1] mx-2 md:mx-4 flex-shrink-0 rounded-full"></div>

        <div className="flex items-center gap-1 md:gap-2 px-1">
          <NavButton 
            icon={<Home size={22} />} 
            active={activeNav === 'home'} 
            onClick={() => {setActiveNav('home'); if (selectedChatId) handleCloseChat(); else setSelectedChatId(null);}} 
            badgeCount={totalUnreadCount > 0 ? totalUnreadCount : null}
          />
          <NavButton 
            icon={<Globe size={22} />} 
            active={activeNav === 'community'} 
            onClick={() => { setActiveNav('community'); setActiveCommunityId(null); if (selectedChatId) handleCloseChat(); else { setSelectedChatId(null); setCommunityGroupChatId(null); } }} 
            badgeCount={communityUnreadCount > 0 ? communityUnreadCount : null}
          />
          <NavButton 
            icon={<Users size={22} />} 
            active={activeNav === 'teams'} 
            onClick={() => setActiveNav('teams')} 
            badgeCount={receivedReqs.length > 0 ? receivedReqs.length : null} 
          />
          <NavButton 
            icon={<Phone size={22} />} 
            active={activeNav === 'calls'} 
            onClick={() => setActiveNav('calls')} 
          />
        </div>
        
        <div className="w-[1px] h-8 bg-white/[0.1] mx-2 md:mx-4 flex-shrink-0 rounded-full"></div>
        
        <div className="flex items-center px-1">
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="w-11 h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 cursor-pointer"
            title="New Chat or Group"
          >
            <Plus size={24} />
          </button>
        </div>
      </nav>
    </div>
  );
}
