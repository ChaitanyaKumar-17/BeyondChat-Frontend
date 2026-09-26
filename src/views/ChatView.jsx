import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Users, Settings, Search, Plus, ChevronRight, ChevronDown, Hash, ArrowLeft, Phone, Video, MoreHorizontal, Send, Mic, Smile, Paperclip, Globe, X, Play, Trash2, Tv, UserPlus, Check, UserMinus, Flag, Ban, LogOut, Pencil, MoreVertical, Reply, Pin, Star, Forward, AlertTriangle, Timer, Shield, Eye, EyeOff, Download, Square, Sticker, SearchIcon, Sparkles, Wand2, ArrowUpRight, Type, BarChart3, ListTodo, Paintbrush, File } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/constants/config';
import { CURATED_GIF_CATEGORIES, STICKER_PACKS, STICKER_STORE_PACKS } from '@/constants/media';
import { generateMagicReplies, AI_WRITING_TOOLS, applyAiWritingTool } from '@/utils/ai';
import { containsProfanity, sanitizeText } from '@/utils/profanity';
import { formatFileSize, getFileIcon } from '@/utils/file';
import { HOUR, formatMessageTime, formatDividerDate, formatLastSeen } from '@/utils/format';
import { E, EMOJI_CATEGORIES, QUICK_REACTIONS } from '@/constants/emoji';
import ReceiptIndicator from '@/components/common/ReceiptIndicator';
import VoiceNotePlayer from '@/components/chat/VoiceNotePlayer';
import VoiceReviewPlayer from '@/components/chat/VoiceReviewPlayer';
import CreatePollModal from '@/components/chat/CreatePollModal';
import WhiteboardPanel from '@/components/chat/WhiteboardPanel';
import TaskPanel from '@/components/chat/TaskPanel';

export default function ChatView({ chat, onBack, sentReqs, onSendReq, onWithdrawReq, receivedReqs, onAcceptReq, onRejectReq, onSendMessage, onReactToMessage, friends, typingIndicators, onTyping, onLeaveGroup, onBlock, onReport, onDisconnect, onUpdateGroupInfo, onRemoveMembers, onToggleAdmin, onAddMembers, onDeleteMessage, onStartChat, onPinMessage, onToggleAdminMessaging, onToggleStarMessage, onForwardMessage, groups, globalUsers, disappearingChat, onToggleDisappearing, onUpdateMessageStatus, currentUser, readReceipts = true, bubbleStyle = 'default', chatFontSize = 'medium', aiSmartReplies = true, aiWritingAssistant = true, filterSettings = {}, draft = '', onSaveDraft }) {
  const [inputText, setInputText] = useState(draft); // restored from in-memory draft
  const [showDetails, setShowDetails] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllMutuals, setShowAllMutuals] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  
  const [confirmAction, setConfirmAction] = useState(null);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [reportStep, setReportStep] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editName, setEditName] = useState(chat.name || '');
  const [editDesc, setEditDesc] = useState(chat.description || '');
  const [memberMenuOpen, setMemberMenuOpen] = useState(null);
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberSelections, setNewMemberSelections] = useState([]);
  
  const [showRemoveMembersPanel, setShowRemoveMembersPanel] = useState(false);
  const [removeMemberSelections, setRemoveMemberSelections] = useState([]);

  // New States for requested features
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji'); // 'emoji' | 'gif' | 'sticker'
  const [gifSearch, setGifSearch] = useState('');
  const [installedPacks, setInstalledPacks] = useState([]); // IDs of installed external packs
  const [showStickerStore, setShowStickerStore] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, text, senderId }
  const [reactionPopupId, setReactionPopupId] = useState(null);
  const [activeMsgId, setActiveMsgId] = useState(null);
  
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState(null);

  // All sticker packs = built-in + installed external ones
  const allStickerPacks = useMemo(() => {
    const external = STICKER_STORE_PACKS.filter(p => installedPacks.includes(p.id));
    return [...STICKER_PACKS, ...external];
  }, [installedPacks]);

  // AI Features state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState(null); // null | 'block' | 'warn'

  // --- Polls, Tasks, Canvas state ---
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [chatTasks, setChatTasks] = useState([]);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  // Whiteboard state lifted here so boards persist across open/close
  const [wbBoards, setWbBoards] = useState([{ id: 1, name: 'Board 1', bgColor: '#fafaf9', data: null }]);
  const [wbActiveBoardId, setWbActiveBoardId] = useState(1);
  const [canvasEditors, setCanvasEditors] = useState([]); // userIds allowed to draw; empty = all allowed
  const [createTaskFromMsg, setCreateTaskFromMsg] = useState(null); // msg object
  const [taskPriorityPrompt, setTaskPriorityPrompt] = useState(null); // msg object awaiting priority selection

  const handleCreatePoll = (poll) => {
    onSendMessage(chat.id, `📊 Poll: ${poll.question}`, null, null, null, { type: 'poll', poll });
  };

  const [pollVotes, setPollVotes] = useState({}); // { [msgId]: { [optionId]: [userIds] } }
  const [viewPollVotersMsgId, setViewPollVotersMsgId] = useState(null); // msgId for full voters overlay
  const [editPollMsgId, setEditPollMsgId] = useState(null); // msgId being edited
  const [editPollNewOpt, setEditPollNewOpt] = useState('');
  const [editPollTitle, setEditPollTitle] = useState('');
  const [showRecentPolls, setShowRecentPolls] = useState(false);

  // Get all poll messages for "recent polls" feature
  const pollMessages = useMemo(() => (chat.messages || []).filter(m => m.meta?.poll).slice(-5).reverse(), [chat.messages]);

  // Edit poll: add new option
  const handleAddPollOption = (msgId) => {
    if (!editPollNewOpt.trim()) return;
    const msg = (chat.messages || []).find(m => m.id === msgId);
    if (!msg?.meta?.poll) return;
    const newOptId = Math.max(...msg.meta.poll.options.map(o => o.id), -1) + 1;
    msg.meta.poll.options.push({ id: newOptId, text: editPollNewOpt.trim(), votes: [] });
    setEditPollNewOpt('');
    // Force re-render by toggling a poll vote state key
    setPollVotes(prev => ({ ...prev, [`_refresh_${Date.now()}`]: true }));
  };

  // Edit poll: toggle setting
  const handleTogglePollSetting = (msgId, setting) => {
    const msg = (chat.messages || []).find(m => m.id === msgId);
    if (!msg?.meta?.poll) return;
    msg.meta.poll[setting] = !msg.meta.poll[setting];
    setPollVotes(prev => ({ ...prev, [`_refresh_${Date.now()}`]: true }));
  };

  // Edit poll: change title
  const handleEditPollTitle = (msgId) => {
    if (!editPollTitle.trim()) return;
    const msg = (chat.messages || []).find(m => m.id === msgId);
    if (!msg?.meta?.poll) return;
    msg.meta.poll.question = editPollTitle.trim();
    msg.text = `📊 Poll: ${editPollTitle.trim()}`;
    setPollVotes(prev => ({ ...prev, [`_refresh_${Date.now()}`]: true }));
  };

  // Edit poll: remove option
  const handleRemovePollOption = (msgId, optId) => {
    const msg = (chat.messages || []).find(m => m.id === msgId);
    if (!msg?.meta?.poll || msg.meta.poll.options.length <= 2) return;
    msg.meta.poll.options = msg.meta.poll.options.filter(o => o.id !== optId);
    setPollVotes(prev => ({ ...prev, [`_refresh_${Date.now()}`]: true }));
  };

  // Start editing: populate title field
  const startEditPoll = (msgId) => {
    const isEditing = editPollMsgId === msgId;
    if (isEditing) { setEditPollMsgId(null); return; }
    const msg = (chat.messages || []).find(m => m.id === msgId);
    setEditPollTitle(msg?.meta?.poll?.question || '');
    setEditPollMsgId(msgId);
  };

  // Get voter name helper
  const getVoterName = (userId) => {
    if (userId === currentUser.id) return 'You';
    return friends.find(f => f.id === userId)?.name || 'Unknown';
  };

  const handleVotePoll = (msgId, optionId) => {
    const msg = (chat.messages || []).find(m => m.id === msgId);
    if (!msg?.meta?.poll || msg.meta.poll.closed) return;
    const isMulti = msg.meta.poll.allowMultiple;

    setPollVotes(prev => {
      const msgVotes = { ...prev[msgId] };
      // Initialize from poll data if first interaction
      if (Object.keys(msgVotes).length === 0) {
        msg.meta.poll.options.forEach(o => { msgVotes[o.id] = [...o.votes]; });
      }
      const currentVotes = msgVotes[optionId] || [];
      const hasVoted = currentVotes.includes(currentUser.id);

      if (hasVoted) {
        // Un-vote
        msgVotes[optionId] = currentVotes.filter(v => v !== currentUser.id);
      } else {
        // Vote ? if single select, clear all other votes first
        if (!isMulti) {
          Object.keys(msgVotes).forEach(key => {
            msgVotes[key] = (msgVotes[key] || []).filter(v => v !== currentUser.id);
          });
        }
        msgVotes[optionId] = [...(msgVotes[optionId] || []), currentUser.id];
      }
      return { ...prev, [msgId]: msgVotes };
    });
  };

  // Helper to get effective votes for a poll option (local state overrides original)
  const getPollOptionVotes = (msgId, optionId, originalVotes) => {
    return pollVotes[msgId]?.[optionId] ?? originalVotes;
  };

  const handleCreateTask = (msg, priority = 'medium') => {
    const newTask = { id: `task_${Date.now()}`, title: msg.text.slice(0, 120), msgId: msg.id, status: 'todo', priority, assignee: null, dueDate: null, createdAt: Date.now() };
    setChatTasks(prev => [newTask, ...prev]);
    setCreateTaskFromMsg(null);
    setActiveMsgId(null);
  };

  const handleUpdateTask = (taskId, updates) => setChatTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  const handleDeleteTask = (taskId) => setChatTasks(prev => prev.filter(t => t.id !== taskId));
  const pendingTaskCount = chatTasks.filter(t => t.status !== 'done').length;

  // Curated GIF filtering (no API needed)
  const filteredGifs = useMemo(() => {
    const q = gifSearch.toLowerCase().trim();
    if (!q) return CURATED_GIF_CATEGORIES;
    return CURATED_GIF_CATEGORIES.map(cat => ({
      ...cat,
      gifs: cat.gifs.filter(g => g.title.toLowerCase().includes(q))
    })).filter(cat => cat.gifs.length > 0);
  }, [gifSearch]);

  const sendGif = (gif) => {
    const payload = {
      id: Date.now() + Math.random(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      status: 'sent',
      isStarred: false,
      gif: { url: gif.url, title: gif.title }
    };
    onSendMessage(chat.id, null, null, payload);
    setShowEmojiPicker(false);
  };

  const sendSticker = (sticker) => {
    const payload = {
      id: Date.now() + Math.random(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      status: 'sent',
      isStarred: false,
      sticker: { id: sticker.id, emoji: sticker.emoji, label: sticker.label }
    };
    onSendMessage(chat.id, null, null, payload);
    setShowEmojiPicker(false);
  };

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [liveBars, setLiveBars] = useState(new Array(40).fill(4));
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [viewOnceEnabled, setViewOnceEnabled] = useState(false);
  const [viewOnceOpened, setViewOnceOpened] = useState({});
  const [viewOnceViewing, setViewOnceViewing] = useState(null); // { msgId, url, type }
  const fileInputRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const prevMsgCountRef = useRef(chat.messages?.length || 0);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const messages = chat.messages || [];

  // Magic Reply ? on-device contextual suggestions
  // Gated by AI Smart Replies setting
  const magicReplies = useMemo(() => {
    if (!aiSmartReplies) return [];
    return generateMagicReplies(messages, currentUser.id);
  }, [messages, currentUser.id, aiSmartReplies]);

  // AI Writing Assistant handler
  const handleAiTool = (toolId) => {
    if (!inputText.trim()) return;
    setAiProcessing(true);
    // Simulate brief processing delay for perceived intelligence
    setTimeout(() => {
      const result = applyAiWritingTool(inputText, toolId);
      setInputText(result);
      setAiProcessing(false);
      inputRef.current?.focus();
    }, 300 + Math.random() * 200);
  };

  const isReqSent = sentReqs?.some(r => r.id === chat.id);
  const isReqReceived = receivedReqs?.some(r => r.id === chat.id);

  const isAdmin = chat.isGroup && chat.adminIds?.includes(currentUser.id);
  const canMessage = !chat.isGroup || chat.onlyAdminsCanMessage !== true || isAdmin;

  const [, setTick] = useState(0);
  const [showMessageInfo, setShowMessageInfo] = useState(null);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Simulate receipt progression: sent ? delivered ? read
  // Respects per-member online/offline status in groups
  useEffect(() => {
    const myMsgs = messages.filter(m => m.senderId === currentUser.id && m.status && m.status !== 'read');
    if (myMsgs.length === 0) return;

    const timers = [];

    if (chat.isGroup) {
      // Group: update each member's receipt based on their online status
      const needsUpdate = myMsgs.filter(msg => msg.receipts?.some(r => r.status !== 'read'));
      if (needsUpdate.length > 0) {
        const t = setTimeout(() => {
          const now = Date.now();
          needsUpdate.forEach(msg => {
            const newReceipts = msg.receipts.map(r => {
              const member = friends.find(f => f.id === r.userId);
              const memberOnline = member?.isOnline ?? false;
              if (!memberOnline) return r;
              if (r.status === 'pending') return { ...r, status: 'delivered', deliveredAt: now };
              if (r.status === 'delivered') return { ...r, status: 'read', readAt: now };
              return r;
            });
            const allRead = newReceipts.every(r => r.status === 'read');
            const allDeliveredOrRead = newReceipts.every(r => r.status === 'delivered' || r.status === 'read');
            const aggStatus = allRead ? 'read' : allDeliveredOrRead ? 'delivered' : 'sent';
            onUpdateMessageStatus(chat.id, msg.id, aggStatus, newReceipts);
          });
        }, 1800);
        timers.push(t);
      }
    } else {
      // Personal: batch all messages, check single recipient online
      const isRecipientOnline = chat.status === 'online';
      if (!isRecipientOnline) {
        return () => {};
      }
      const sentMsgs = myMsgs.filter(m => m.status === 'sent');
      const deliveredMsgs = myMsgs.filter(m => m.status === 'delivered');

      if (sentMsgs.length > 0) {
        const t = setTimeout(() => {
          sentMsgs.forEach(msg => onUpdateMessageStatus(chat.id, msg.id, 'delivered', null));
        }, 1500);
        timers.push(t);
      }
      if (deliveredMsgs.length > 0) {
        const t = setTimeout(() => {
          deliveredMsgs.forEach(msg => onUpdateMessageStatus(chat.id, msg.id, 'read', null));
        }, 2500);
        timers.push(t);
      }
    }
    
    return () => timers.forEach(clearTimeout);
  }, [messages, chat.status, friends]);

  useEffect(() => {
    setEditName(chat.name || '');
    setEditDesc(chat.description || '');
    setIsEditingName(false);
    setIsEditingDesc(false);
  }, [chat.id, chat.name, chat.description]);

  const handleChatScroll = useCallback((e) => {
    const target = e.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsScrolledUp(!nearBottom);
    
    if (nearBottom) {
      setNewMsgCount(0);
      setFirstUnreadMsgId(null);
    }
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentMsgCount = messages.length;
    const prevMsgCount = prevMsgCountRef.current;
    const addedCount = currentMsgCount - prevMsgCount;
    const isNewMessage = addedCount > 0;

    if (isInitialMount.current) {
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight;
      isInitialMount.current = false;
    } else if (isNewMessage) {
      const lastMsg = messages[currentMsgCount - 1];
      const isMe = lastMsg && lastMsg.senderId === currentUser.id;

      if (!isScrolledUp || isMe) {
        container.style.scrollBehavior = 'smooth';
        container.scrollTop = container.scrollHeight;
      } else {
        setNewMsgCount((prev) => prev + addedCount);
        if (!firstUnreadMsgId) {
          const firstNew = messages[prevMsgCount];
          if (firstNew) setFirstUnreadMsgId(firstNew.id);
        }
      }
    } else if (addedCount <= 0 || typingIndicators) {
      if (!isScrolledUp) {
        container.style.scrollBehavior = 'smooth';
        container.scrollTop = container.scrollHeight;
      }
    }
    
    prevMsgCountRef.current = currentMsgCount;
  }, [messages.length, typingIndicators]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    onSaveDraft?.(chat.id, val); // persist draft in memory
    
    if (chat.isConnected || chat.isGroup) {
      onTyping(chat.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(chat.id, false);
      }, 2000);
    }
  };

  // --- FILE ATTACHMENT HANDLERS ---
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} exceeds the 2GB limit`);
        continue;
      }
      // Create a preview URL for images/videos
      const url = URL.createObjectURL(file);
      validFiles.push({ file, name: file.name, size: file.size, type: file.type, url });
    }
    setAttachedFiles(prev => [...prev, ...validFiles]);
    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => {
      const removed = prev[index];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSendFiles = () => {
    if (attachedFiles.length === 0) return;
    attachedFiles.forEach(af => {
      const isMedia = af.type?.startsWith('image/') || af.type?.startsWith('video/');
      const payload = {
        id: Date.now() + Math.random(),
        senderId: currentUser.id,
        timestamp: Date.now(),
        status: 'sent',
        isStarred: false,
        attachment: {
          name: af.name,
          size: af.size,
          type: af.type,
          url: af.url,
          viewOnce: isMedia && viewOnceEnabled,
        }
      };
      onSendMessage(chat.id, null, null, payload);
    });
    setAttachedFiles([]);
    setViewOnceEnabled(false);
  };


  // --- VOICE RECORDING HANDLERS ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up Web Audio API for real frequency visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        analyser.getByteFrequencyData(dataArray);
        const barCount = 40;
        const step = Math.floor(bufferLength / barCount);
        const bars = [];
        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(3, (val / 255) * 20));
        }
        setLiveBars(bars);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      updateBars();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const cleanupRecording = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch(e) {} }
    analyserRef.current = null;
    audioCtxRef.current = null;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setLiveBars(new Array(40).fill(4));
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    cleanupRecording();
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    cleanupRecording();
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !audioUrl) return;
    const payload = {
      id: Date.now() + Math.random(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      status: 'sent',
      isStarred: false,
      voiceNote: {
        url: audioUrl,
        duration: recordingTime,
      }
    };
    onSendMessage(chat.id, null, null, payload);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatRecordingTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSend = (e) => {
    e?.preventDefault();
    
    // Send attached files first
    if (attachedFiles.length > 0) {
      handleSendFiles();
    }
    
    if (inputText.trim()) {
      const filterMode = filterSettings?.profanityFilter || 'block';
      const filterOpts = {
        leetDetection: filterMode !== 'off' && filterSettings?.leetDetection !== false,
        customBlocklist: filterMode !== 'off' ? (filterSettings?.customBlocklist || []) : [],
      };
      let textToSend = inputText;
      if (filterMode === 'block') {
        // Block: refuse to send if profanity detected
        if (containsProfanity(inputText, filterOpts)) {
          setProfanityWarning('block');
          setTimeout(() => setProfanityWarning(null), 4000);
          return;
        }
      } else if (filterMode === 'sanitize') {
        // Sanitize: replace flagged words with *** and send
        textToSend = sanitizeText(inputText, filterOpts);
      } else if (filterMode === 'warn') {
        // Warn: show amber toast for 2.5s, THEN send (so user can read it)
        if (containsProfanity(inputText, filterOpts)) {
          setProfanityWarning('warn');
          const _warnText = textToSend;
          const _warnReply = replyingTo;
          setTimeout(() => {
            onSendMessage(chat.id, _warnText, _warnReply);
            setInputText('');
            setReplyingTo(null);
            setShowEmojiPicker(false);
            setProfanityWarning(null);
            onTyping(chat.id, false);
          }, 2500);
          return; // exit — send handled in timeout
        }
      }
      // 'off' + clean text in other modes: send normally
      const result = onSendMessage(chat.id, textToSend, replyingTo);
      if (result === 'profanity') {
        setProfanityWarning('block');
        setTimeout(() => setProfanityWarning(null), 4000);
        return;
      }
      setInputText('');
      onSaveDraft?.(chat.id, ''); // clear draft on successful send
      setReplyingTo(null);
      setShowEmojiPicker(false);
    }
    
    onTyping(chat.id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleSaveName = () => {
    if (!editName.trim()) return;
    const _fOpts = { leetDetection: filterSettings?.leetDetection !== false, customBlocklist: filterSettings?.customBlocklist || [] };
    if (containsProfanity(editName, _fOpts)) {
      setProfanityWarning('block');
      setTimeout(() => setProfanityWarning(null), 3000);
      return;
    }
    onUpdateGroupInfo(chat.id, editName, chat.description);
    setIsEditingName(false);
  };

  const handleSaveDesc = () => {
    if (containsProfanity(editDesc, { leetDetection: filterSettings?.leetDetection !== false, customBlocklist: filterSettings?.customBlocklist || [] })) {
      setProfanityWarning('block');
      setTimeout(() => setProfanityWarning(null), 3000);
      return;
    }
    onUpdateGroupInfo(chat.id, chat.name, editDesc);
    setIsEditingDesc(false);
  };
  
  const toggleNewMember = (id) => {
    setNewMemberSelections(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (chat.members + prev.length >= 1024) return prev;
      return [...prev, id];
    });
  };

  const submitNewMembers = () => {
    onAddMembers(chat.id, newMemberSelections);
    setShowAddMember(false);
    setNewMemberSelections([]);
  };

  const toggleRemoveMember = (id) => {
    setRemoveMemberSelections(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDivider = null;
    let lastSenderId = null;

    messages.forEach((msg) => {
      const divider = formatDividerDate(msg.timestamp);
      
      if (divider !== currentDivider) {
        groups.push({ type: 'divider', text: divider, id: `div-${msg.id}` });
        currentDivider = divider;
        lastSenderId = null; 
      }
      
      const showAvatar = msg.senderId !== currentUser.id && msg.senderId !== lastSenderId && msg.type !== 'system';
      lastSenderId = msg.senderId;

      groups.push({ type: msg.type || 'message', showAvatar, ...msg });
    });
    return groups;
  }, [messages]);

  const groupMembers = useMemo(() => {
    if (!chat.isGroup || !chat.memberIds) return [];
    return chat.memberIds 
        .map(id => id === currentUser.id ? currentUser : friends.find(f => f.id === id))
        .filter(Boolean)
        .sort((a, b) => {
          const aIsAdmin = chat.adminIds?.includes(a.id);
          const bIsAdmin = chat.adminIds?.includes(b.id);
          if (aIsAdmin && !bIsAdmin) return -1;
          if (!aIsAdmin && bIsAdmin) return 1;
          return chat.memberIds.indexOf(a.id) - chat.memberIds.indexOf(b.id);
        });
  }, [chat.isGroup, chat.memberIds, chat.adminIds, friends]);

  const onlineMembersCount = useMemo(() => {
    if (!chat.isGroup) return 0;
    // ACCURACY FIX: Exclude the current user from the online count calculation
    return groupMembers.filter(m => m.id !== currentUser.id && m.isOnline).length;
  }, [chat.isGroup, groupMembers]);

  const activeTypers = useMemo(() => {
    return (typingIndicators[chat.id] || []).filter(id => id !== currentUser.id);
  }, [typingIndicators, chat.id]);

  const renderTypingText = () => {
    if (activeTypers.length === 0) return null;
    const getFirstName = (id) => {
      const f = friends.find(fr => fr.id === id);
      return f ? f.name.split(' ')[0] : 'Someone';
    };

    if (activeTypers.length === 1) return `${getFirstName(activeTypers[0])} is typing...`;
    if (activeTypers.length === 2) return `${getFirstName(activeTypers[0])} and ${getFirstName(activeTypers[1])} are typing...`;
    return `${activeTypers.length} people are typing...`;
  };

  const starredMessages = useMemo(() => {
    return messages.filter(m => m.isStarred && !m.isDeleted && m.type !== 'system');
  }, [messages]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#121214] shadow-2xl overflow-hidden z-40">
      
      {/* Click outside overlay for popup menus like reactions */}
      {reactionPopupId && (
        <div className="absolute inset-0 z-40" onClick={() => setReactionPopupId(null)}></div>
      )}

      {confirmAction && (
        <div className="absolute inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
             <h3 className="text-white font-semibold text-lg text-center">{confirmAction.title}</h3>

             {confirmAction.type === 'delete_msg' ? (
               <div className="flex flex-col gap-2 mt-2">
                  {confirmAction.canDeleteForEveryone && (
                    <button 
                      onClick={() => {
                        const msg = messages.find(m => m.id === confirmAction.payload);
                        onDeleteMessage(chat.id, msg.id, 'for_everyone', msg.senderId === currentUser.id);
                        setConfirmAction(null);
                      }} 
                      className="w-full py-2.5 rounded-xl text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors font-medium"
                    >
                      Delete for everyone
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const msg = messages.find(m => m.id === confirmAction.payload);
                      onDeleteMessage(chat.id, msg.id, 'for_me', msg.senderId === currentUser.id);
                      setConfirmAction(null);
                    }} 
                    className="w-full py-2.5 rounded-xl text-sm text-white bg-white/5 hover:bg-white/10 transition-colors font-medium"
                  >
                    Delete for me
                  </button>
                  <button 
                    onClick={() => setConfirmAction(null)} 
                    className="w-full py-2.5 rounded-xl text-sm text-zinc-400 bg-transparent hover:bg-white/5 transition-colors font-medium mt-2"
                  >
                    Cancel
                  </button>
               </div>
             ) : (
               <>
                 <p className="text-sm text-zinc-400 text-center">{confirmAction.desc}</p>
                 <div className="flex gap-3 mt-2">
                   <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-medium">Cancel</button>
                   <button 
                     onClick={() => {
                       if (confirmAction.type === 'remove_member') {
                         onRemoveMembers(chat.id, confirmAction.payload);
                         setShowRemoveMembersPanel(false);
                         setRemoveMemberSelections([]);
                       } else if (confirmAction.type === 'toggle_admin') {
                         onToggleAdmin(chat.id, confirmAction.payload);
                       }
                       setConfirmAction(null);
                     }} 
                     className={`flex-1 py-2.5 rounded-xl text-sm text-white transition-colors font-medium shadow-lg ${confirmAction.confirmStyle}`}
                   >
                     {confirmAction.confirmText}
                   </button>
                 </div>
               </>
             )}
           </div>
        </div>
      )}

      <header className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-30 flex-none relative">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div 
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            onClick={() => setShowDetails(true)}
          >
            <div className="relative flex-shrink-0">
              {chat.isGroup ? (
                <div className={`w-10 h-10 rounded-full ${chat.icon || 'bg-indigo-500'} flex items-center justify-center text-white shadow-sm`}>
                  <Hash size={16} />
                </div>
              ) : (
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full" />
              )}
              {!chat.isGroup && (
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#121214] rounded-full ${chat.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-medium text-white tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md">{chat.name}</h2>
              <p className={`text-xs truncate ${chat.isGroup ? 'text-zinc-400' : (chat.status === 'online' ? 'text-emerald-400' : 'text-zinc-500')}`}>
                {chat.isGroup ? `${onlineMembersCount} online` : formatLastSeen(chat.lastSeen, chat.status === 'online')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 ml-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors"><Phone size={18} /></button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors"><Video size={18} /></button>
          <button onClick={() => setShowTaskPanel(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors relative" title="Tasks">
            <ListTodo size={18} />
            {pendingTaskCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-[9px] text-white font-bold flex items-center justify-center">{pendingTaskCount}</span>}
          </button>
          <button onClick={() => setShowCanvas(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors" title="Canvas"><Paintbrush size={18} /></button>
          {chat.isGroup && (
            <button onClick={() => setShowRecentPolls(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors relative" title="Recent Polls">
              <BarChart3 size={18} />
              {pollMessages.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-[9px] text-white font-bold flex items-center justify-center">{pollMessages.length}</span>}
            </button>
          )}
          <div className="w-px h-5 bg-white/[0.06] mx-1"></div>
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMoreMenu && (
              <>
                <div className="absolute top-12 right-0 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl w-48 z-[200] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col py-1">
                  <button onClick={() => { setShowMoreMenu(false); setReportStep('category'); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-red-400 font-medium text-sm text-left">
                    <Flag size={16} /> Report {chat.isGroup ? 'Group' : 'User'}
                  </button>
                  <button onClick={() => { setShowMoreMenu(false); setShowBlockConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-red-400 font-medium text-sm text-left">
                    <Ban size={16} /> Block {chat.isGroup ? 'Group' : 'User'}
                  </button>
                  {chat.isGroup ? (
                    <button onClick={() => { setShowMoreMenu(false); setShowLeaveConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-red-500 font-medium text-sm text-left border-t border-white/[0.04] mt-1 pt-2">
                      <LogOut size={16} /> Leave Group
                    </button>
                  ) : chat.isConnected ? (
                    <button onClick={() => { setShowMoreMenu(false); setShowDisconnectConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-red-500 font-medium text-sm text-left border-t border-white/[0.04] mt-1 pt-2">
                      <UserMinus size={16} /> Remove Connection
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for closing the more menu - placed outside header to escape its stacking context */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[25]" onClick={() => setShowMoreMenu(false)}></div>
      )}

      {chat.pinnedMessage && (
        <div className="px-6 py-2.5 bg-[#1a1a1c]/95 border-b border-white/[0.04] flex items-center justify-between z-10 flex-none cursor-pointer hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <span className="text-indigo-400 shrink-0"><Pin size={14} className="fill-indigo-400/20" /></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider leading-none mb-0.5">Pinned Message</span>
              <span className="text-xs text-zinc-300 truncate">{chat.pinnedMessage.text}</span>
            </div>
          </div>
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); onPinMessage(chat.id, chat.pinnedMessage); }} className="text-zinc-500 hover:text-white p-1.5 ml-2 rounded-full hover:bg-white/10 shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {disappearingChat?.enabled && (
        <div className="px-6 py-2 bg-amber-500/[0.06] border-b border-amber-500/[0.08] flex items-center justify-between z-10 flex-none">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <span className="text-amber-400 shrink-0"><Timer size={14} /></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider leading-none mb-0.5">Secret Chat</span>
              <span className="text-xs text-amber-300/70 truncate">Messages will be deleted once the timer expires</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-500/60 font-medium shrink-0 ml-2 bg-amber-500/10 px-2 py-0.5 rounded-full">
            {disappearingChat.duration === 'session' ? 'This session' : disappearingChat.duration === '1day' ? '1 day' : disappearingChat.duration === '1week' ? '1 week' : '1 month'}
          </span>
        </div>
      )}

      <div ref={scrollContainerRef} onScroll={handleChatScroll}
        data-chat-messages
        className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden p-6 space-y-6 relative"
        style={{ scrollBehavior: 'auto', ...(disappearingChat?.enabled ? { userSelect: 'none', WebkitUserSelect: 'none' } : {}) }}
        onClick={() => setActiveMsgId(null)}>
        
        {messages.length === 0 && chat.isConnected === false && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 pb-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-zinc-400" />
            </div>
            <h3 className="text-white font-medium mb-1">{chat.name}</h3>
            <p className="text-sm">Not connected yet.</p>
          </div>
        )}



        {groupedMessages.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div key={item.id} className="text-center my-6">
                <span className="text-xs font-medium text-zinc-500 bg-[#1a1a1c] px-3 py-1 rounded-full">{item.text}</span>
              </div>
            );
          }

          if (item.type === 'system') {
            const actorName = item.actorId == null ? '' : (item.actorId === currentUser.id ? 'You' : (friends.find(f => f.id === item.actorId)?.name || 'Someone'));
            return (
              <div key={item.id} className="text-center my-3">
                <span className="text-[11px] font-medium text-zinc-400 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.02]">
                  {actorName ? `${actorName} ${item.text}` : item.text}
                </span>
              </div>
            );
          }

          const msg = item;
          const isMe = msg.senderId === currentUser.id;
          const hasReactions = msg.reactions && msg.reactions.length > 0;

          // ── Incoming message receive-side filter ──────────────────────────
          const _recvMode = filterSettings?.profanityFilter || 'block';
          const _recvOpts = {
            leetDetection: _recvMode !== 'off' && filterSettings?.leetDetection !== false,
            customBlocklist: _recvMode !== 'off' ? (filterSettings?.customBlocklist || []) : [],
          };
          const _isFlaggedIncoming = !isMe && msg.text && _recvMode !== 'off' && containsProfanity(msg.text, _recvOpts);
          // block/sanitize → mask text; warn → show raw with badge; off → raw
          const displayText = (!isMe && msg.text && (_recvMode === 'block' || _recvMode === 'sanitize') && _isFlaggedIncoming)
            ? sanitizeText(msg.text, _recvOpts)
            : msg.text;
          const isNearBottom = idx >= groupedMessages.length - 3;

          return (
            <div key={msg.id} id={`message-${msg.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group/msg ${hasReactions ? 'mb-4' : 'mb-1'} ${activeMsgId === msg.id ? 'relative z-[60]' : 'relative'}`}>
              {!isMe && (
                <div className="w-8">
                  {msg.showAvatar && <img src={chat.isGroup ? (friends.find(f=>f.id===msg.senderId)?.avatar || chat.avatar) : chat.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />}
                </div>
              )}
              
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] lg:max-w-[60%]`}>
                <div 
                  className={`flex items-center gap-2 group/msgwrap relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  
                  {!msg.isDeleted && activeMsgId === msg.id && (() => {
                    // Smart positioning: check if message is in the top or bottom half of the scroll container
                    const msgEl = document.getElementById(`message-${msg.id}`);
                    const scrollEl = scrollContainerRef.current;
                    let showAbove = isNearBottom;
                    if (msgEl && scrollEl) {
                      const msgRect = msgEl.getBoundingClientRect();
                      const scrollRect = scrollEl.getBoundingClientRect();
                      const msgCenter = msgRect.top + msgRect.height / 2;
                      const scrollCenter = scrollRect.top + scrollRect.height / 2;
                      showAbove = msgCenter > scrollCenter;
                    }
                    return (
                    <div className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a1c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 flex flex-col py-1.5 min-w-[160px]`}>
                      <button onClick={(e) => { e.stopPropagation(); onToggleStarMessage(chat.id, msg.id); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                        <Star size={16} className={msg.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}/> {msg.isStarred ? 'Unstar Message' : 'Star Message'}
                      </button>
                      {!isMe && (
                        <button onClick={(e) => { e.stopPropagation(); setReactionPopupId(msg.id); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                          <Smile size={16}/> React
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo({ id: msg.id, text: msg.text, senderId: msg.senderId }); inputRef.current?.focus(); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                        <Reply size={16}/> Reply
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onForwardMessage(msg); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                        <Forward size={16}/> Forward
                      </button>
                      {msg.text && !msg.attachment && !msg.voiceNote && !msg.gif && !msg.sticker && !msg.meta?.poll && (!chat.isGroup || isAdmin) && (() => {
                        const existingTask = chatTasks.find(t => t.msgId === msg.id);
                        return existingTask ? (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(existingTask.id); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 size={16}/> Remove Task
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setTaskPriorityPrompt(msg); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-indigo-500/10 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ListTodo size={16}/> Create Task
                          </button>
                        );
                      })()}
                      {isAdmin && chat.isGroup && (
                        <button onClick={(e) => { e.stopPropagation(); onPinMessage(chat.id, msg); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                          <Pin size={16} className={chat.pinnedMessage?.id === msg.id ? 'text-indigo-400 fill-indigo-400' : ''}/> {chat.pinnedMessage?.id === msg.id ? 'Unpin Message' : 'Pin Message'}
                        </button>
                      )}
                      {chat.isGroup && isMe && msg.receipts && (
                        <button onClick={(e) => { e.stopPropagation(); setShowMessageInfo(msg.id); setActiveMsgId(null); }} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 hover:text-white transition-colors">
                          <Eye size={16}/> Message Info
                        </button>
                      )}
                      <button onClick={(e) => {
                        e.stopPropagation();
                        const isPersonalTimeExpired = Date.now() - msg.timestamp > HOUR;
                        const canDeleteForEveryone = isAdmin || (!isPersonalTimeExpired && isMe);
                        setConfirmAction({ type: 'delete_msg', payload: msg.id, title: 'Delete Message', canDeleteForEveryone });
                        setActiveMsgId(null);
                      }} className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-sm text-red-500 hover:text-red-400 transition-colors border-t border-white/[0.04] mt-1.5 pt-2">
                        <Trash2 size={16}/> Delete Message
                      </button>
                    </div>
                    );
                  })()}

                  {/* Reaction Quick-Select Popup */}
                  {reactionPopupId === msg.id && (
                    <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a1c] border border-white/10 rounded-full px-2 py-1.5 flex gap-2 shadow-2xl z-[60] animate-in zoom-in-95`}>
                      {QUICK_REACTIONS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => { 
                            onReactToMessage(chat.id, msg.id, emoji); 
                            setReactionPopupId(null); 
                          }} 
                          className="hover:scale-125 transition-transform text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* The Message Bubble itself */}
                  {msg.isDeleted ? (
                    <div id={`bubble-${msg.id}`} className={`px-4 py-2.5 rounded-2xl text-sm italic border border-white/[0.02] relative flex gap-2 items-center transition-[background-color,box-shadow,transform] duration-500 ease-out ${isMe ? 'bg-indigo-600/30 text-white/50 rounded-br-sm' : 'bg-[#1e1e24]/50 text-zinc-500 rounded-bl-sm'}`}>
                      <span>{E('1F6AB')} {msg.deletedByAdmin ? 'This message was deleted by an admin' : 'You deleted this message'}</span>
                      {msg.isStarred && <Star size={12} className="text-yellow-500/50 fill-current shrink-0" />}
                    </div>
                  ) : (() => {
                    const hasMedia = msg.attachment || msg.voiceNote || msg.gif || msg.sticker || msg.meta?.poll;
                    const bubbleRadius = {
                      default: isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm',
                      rounded: 'rounded-[2rem]',
                      minimal: 'rounded-lg',
                    }[bubbleStyle] || (isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm');
                    const bubbleClass = hasMedia
                      ? `group/bubble ${bubbleRadius} text-sm leading-relaxed relative flex flex-col transition-[background-color,box-shadow,transform] duration-500 ease-out ${msg.meta?.poll ? 'p-0' : 'p-1.5'} ${isMe ? 'bg-[#1a1a2e] border border-indigo-500/20 text-white' : 'bg-[#1a1a1c] text-zinc-100 border border-white/[0.04]'}`
                      : `group/bubble px-4 py-2.5 ${bubbleRadius} text-sm leading-relaxed relative flex flex-col transition-[background-color,box-shadow,transform] duration-500 ease-out ${isMe ? 'bg-indigo-600 text-white' : 'bg-[#1e1e24] text-zinc-100 border border-white/[0.02]'}`;
                    return (
                    <div id={`bubble-${msg.id}`} className={bubbleClass}>
                      
                      {/* Forwarded Status */}
                      {msg.forwardCount > 0 && (
                        <div className={`flex items-center gap-1 mb-1 text-[10px] text-white/50 font-medium tracking-wide ${hasMedia ? 'px-3 pt-2' : ''}`}>
                           {msg.forwardCount > 10 ? (
                             <><AlertTriangle size={12} className="text-yellow-500/80" /> <span className="text-yellow-500/80">Forwarded many times (Potential spam)</span></>
                           ) : (
                             <><Forward size={12} /> Forwarded</>
                           )}
                        </div>
                      )}

                      {/* Story Reply Context */}
                      {msg.storyReply && (
                        <div className={`rounded-lg mb-1.5 max-w-full overflow-hidden flex gap-2 items-stretch ${hasMedia ? 'mx-2.5 mt-1' : ''}`}>
                          <div className={`w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-[10px] text-white/70 ${msg.storyReply.storyBg || 'bg-gradient-to-br from-indigo-600 to-purple-600'}`}>
                            <Tv size={16} className="opacity-60" />
                          </div>
                          <div className="flex flex-col justify-center min-w-0">
                            <span className="text-[10px] text-indigo-300 font-bold tracking-wide flex items-center gap-1">
                              <Tv size={10} /> Replied to {msg.storyReply.storyOwnerName === 'You' ? 'your' : (msg.storyReply.storyOwnerName + "'s")} story
                            </span>
                            <p className="text-xs text-white/60 truncate">{msg.storyReply.storyText}</p>
                          </div>
                        </div>
                      )}

                      {/* Replied-To Snippet inside the bubble */}
                      {msg.replyTo && (
                        <div className="bg-black/20 border-l-4 border-indigo-400 rounded p-2 mb-1.5 max-w-full overflow-hidden">
                           <span className="text-[10px] text-indigo-300 font-bold block mb-0.5 tracking-wide">
                             {msg.replyTo.senderId === currentUser.id ? 'You' : (friends.find(f=>f.id===msg.replyTo.senderId)?.name || 'Someone')}
                           </span>
                           <p className="text-xs text-white/80 truncate">{msg.replyTo.text}</p>
                        </div>
                      )}

                      {/* File Attachment */}
                      {msg.attachment && (() => {
                        const att = msg.attachment;
                        const IconComp = getFileIcon(att.type, att.name);
                        const isViewOnce = att.viewOnce;
                        const hasOpened = viewOnceOpened[msg.id];

                        // View Once: opened/expired state
                        if (isViewOnce && hasOpened) {
                          return (
                            <div className={`flex items-center gap-2.5 rounded-xl p-3 mb-1.5 min-w-[200px] ${isMe ? 'bg-indigo-700/20' : 'bg-white/[0.02]'}`}>
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isMe ? 'bg-indigo-500/15' : 'bg-white/[0.04]'}`}>
                                <EyeOff size={16} className="text-zinc-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-500 italic">{att.type?.startsWith('video/') ? 'Video' : 'Photo'} opened</p>
                                <p className="text-[10px] text-zinc-600">View once</p>
                              </div>
                            </div>
                          );
                        }

                        // View Once: unopened ? click opens fullscreen viewer
                        if (isViewOnce && !hasOpened) {
                          return (
                            <div 
                              className="relative rounded-xl overflow-hidden mb-1.5 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewOnceViewing({ msgId: msg.id, url: att.url, type: att.type });
                              }}
                            >
                              <div className="w-[200px] h-[140px] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex flex-col items-center justify-center gap-2 border border-white/[0.06] rounded-xl hover:border-indigo-500/30 transition-colors">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMe ? 'bg-white/10' : 'bg-indigo-500/15'}`}>
                                  <Eye size={22} className={`${isMe ? 'text-white/70' : 'text-indigo-400/80'}`} />
                                </div>
                                <span className="text-xs text-white/70 font-medium">{att.type?.startsWith('video/') ? 'Video' : 'Photo'}</span>
                                <span className="text-[10px] text-white/40 flex items-center gap-1"><Timer size={10} /> View once</span>
                              </div>
                            </div>
                          );
                        }

                        if (att.type?.startsWith('image/')) {
                          return (
                            <div className="rounded-xl overflow-hidden mb-1.5 max-w-[280px]">
                              <img src={att.url} alt={att.name} className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                              <div className="flex items-center justify-between px-2 py-1.5 gap-2">
                                <span className="text-[10px] text-white/60 truncate">{att.name}</span>
                                <a href={att.url} download={att.name} className="text-white/40 hover:text-white transition-colors shrink-0" onClick={e => e.stopPropagation()}><Download size={12} /></a>
                              </div>
                            </div>
                          );
                        }
                        if (att.type?.startsWith('video/')) {
                          return (
                            <div className="rounded-xl overflow-hidden mb-1.5 max-w-[280px]">
                              <video src={att.url} controls className="w-full max-h-[300px] rounded-xl" />
                              <div className="flex items-center justify-between px-2 py-1.5 gap-2">
                                <span className="text-[10px] text-white/60 truncate">{att.name}</span>
                                <a href={att.url} download={att.name} className="text-white/40 hover:text-white transition-colors shrink-0" onClick={e => e.stopPropagation()}><Download size={12} /></a>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className={`flex items-center gap-3 rounded-xl p-3 mb-1.5 min-w-[200px] ${isMe ? 'bg-indigo-700/40' : 'bg-white/[0.04]'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-500/30' : 'bg-white/[0.06]'}`}>
                              <IconComp size={18} className="text-white/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{att.name}</p>
                              <p className="text-[10px] text-white/50">{formatFileSize(att.size)}</p>
                            </div>
                            <a href={att.url} download={att.name} className={`p-2 rounded-full transition-colors shrink-0 ${isMe ? 'hover:bg-indigo-500/30 text-white/50 hover:text-white' : 'hover:bg-white/[0.06] text-white/40 hover:text-white'}`} onClick={e => e.stopPropagation()}>
                              <Download size={16} />
                            </a>
                          </div>
                        );
                      })()}

                      {/* Voice Note */}
                      {msg.voiceNote && (
                        <VoiceNotePlayer msgId={msg.id} url={msg.voiceNote.url} duration={msg.voiceNote.duration} isMe={isMe} />
                      )}

                      {/* GIF */}
                      {msg.gif && (
                        <div className="rounded-xl overflow-hidden mb-1 max-w-[250px]">
                          <img src={msg.gif.url} alt={msg.gif.title || 'GIF'} className="w-full h-auto rounded-xl" />
                          <div className="flex items-center gap-1 px-2 py-1">
                            <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">GIF</span>
                            {msg.gif.title && <span className="text-[9px] text-zinc-600 truncate">{msg.gif.title}</span>}
                          </div>
                        </div>
                      )}

                      {/* Sticker */}
                      {msg.sticker && (
                        <div className="flex items-center justify-center py-1 mb-1">
                          <span className="text-6xl hover:scale-110 transition-transform cursor-default" title={msg.sticker.label}>{msg.sticker.emoji}</span>
                        </div>
                      )}

                      <div className={msg.meta?.poll ? 'mt-0.5' : 'pr-5 mt-0.5'}>
                        {/* 📊 Poll Card */}
                        {msg.meta?.poll && (() => {
                          const poll = msg.meta.poll;
                          const isMine = msg.senderId === currentUser.id;
                          const isEditing = editPollMsgId === msg.id;
                          const optionsWithVotes = poll.options.map(o => ({ ...o, votes: getPollOptionVotes(msg.id, o.id, o.votes) }));
                          const totalVotes = optionsWithVotes.reduce((sum, o) => sum + o.votes.length, 0);
                          const myVotes = optionsWithVotes.filter(o => o.votes.includes(currentUser.id)).map(o => o.id);
                          const optColors = ['from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-amber-400 to-orange-500', 'from-pink-400 to-rose-500', 'from-cyan-400 to-sky-500', 'from-lime-400 to-green-500'];
                          return (
                            <div className="w-[320px]">
                              <div className="bg-[#0e0e14] rounded-2xl p-4 border border-white/[0.06]">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-4">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"><BarChart3 size={15} className="text-white" /></div>
                                    <div className="min-w-0 flex-1">
                                      {isEditing ? (
                                        <input value={editPollTitle} onChange={e => setEditPollTitle(e.target.value)} className="w-full bg-white/[0.06] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-sm text-white font-semibold placeholder-zinc-500 focus:outline-none" onClick={e => e.stopPropagation()} />
                                      ) : (
                                        <span className="text-[15px] font-bold text-white block leading-snug">{poll.question}</span>
                                      )}
                                      <span className="text-[10px] text-zinc-500 mt-0.5 block">{poll.allowMultiple ? 'Select multiple' : 'Select one'}{poll.isAnonymous ? ' ? Anonymous' : ''}</span>
                                    </div>
                                  </div>
                                  {isMine && !poll.closed && !isEditing && (
                                    <button onClick={(e) => { e.stopPropagation(); startEditPoll(msg.id); }} className="p-1.5 rounded-lg transition-all shrink-0 text-zinc-500 hover:text-white hover:bg-white/5" title="Edit poll"><Pencil size={13} /></button>
                                  )}
                                </div>

                                {/* Edit Panel */}
                                {isEditing && (
                                  <div className="mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-3 animate-in fade-in duration-200">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Edit Options</span>
                                    {poll.options.map(opt => (
                                      <div key={opt.id} className="flex items-center gap-2">
                                        <span className="flex-1 text-xs text-zinc-300 truncate">{opt.text}</span>
                                        {poll.options.length > 2 && (
                                          <button onClick={(e) => { e.stopPropagation(); handleRemovePollOption(msg.id, opt.id); }} className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><X size={12} /></button>
                                        )}
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-2 pt-1">
                                      <input value={editPollNewOpt} onChange={e => setEditPollNewOpt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPollOption(msg.id)} placeholder="Add option..." className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50" onClick={e => e.stopPropagation()} />
                                      <button onClick={(e) => { e.stopPropagation(); handleAddPollOption(msg.id); }} className="px-2.5 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500/30 transition-colors"><Plus size={12} /></button>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                                      <button onClick={(e) => { e.stopPropagation(); handleTogglePollSetting(msg.id, 'allowMultiple'); }} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${poll.allowMultiple ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-500'}`}>{poll.allowMultiple ? '? Multi' : 'Multi'}</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleTogglePollSetting(msg.id, 'isAnonymous'); }} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${poll.isAnonymous ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-500'}`}>{poll.isAnonymous ? '? Anon' : 'Anon'}</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleTogglePollSetting(msg.id, 'closed'); }} className="text-[10px] px-2.5 py-1 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 ml-auto">Close</button>
                                    </div>
                                    {/* Save / Cancel */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                                      <button onClick={(e) => { e.stopPropagation(); setEditPollMsgId(null); setEditPollNewOpt(''); }} className="px-3 py-1.5 text-[11px] text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg font-medium transition-colors">Cancel</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleEditPollTitle(msg.id); setEditPollMsgId(null); setEditPollNewOpt(''); }} className="px-3 py-1.5 text-[11px] text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">Save changes</button>
                                    </div>
                                  </div>
                                )}

                                {/* Options */}
                                <div className="space-y-2">
                                  {optionsWithVotes.map((opt, oi) => {
                                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                    const voted = myVotes.includes(opt.id);
                                    const barColor = optColors[oi % optColors.length];
                                    return (
                                      <button key={opt.id} onClick={(e) => { e.stopPropagation(); if (!poll.closed) handleVotePoll(msg.id, opt.id); }} disabled={poll.closed} className={`w-full text-left rounded-xl p-3 relative overflow-hidden transition-all ${voted ? 'ring-2 ring-emerald-400/40 bg-emerald-500/10' : 'bg-white/[0.03] hover:bg-white/[0.06]'} ${poll.closed ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}>
                                        <div className={`absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`} style={{ width: `${pct}%`, opacity: 0.18 }} />
                                        <div className="relative flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${voted ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                                              {voted && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className={`text-[13px] font-medium ${voted ? 'text-white' : 'text-zinc-200'}`}>{opt.text}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-xs font-bold tabular-nums ${voted ? 'text-emerald-400' : 'text-zinc-500'}`}>{pct}%</span>
                                            <span className="text-[10px] text-zinc-600 tabular-nums">{opt.votes.length}</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
                                  <span className="text-[10px] text-zinc-500">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                                  <div className="flex items-center gap-2">
                                    {myVotes.length > 0 && !poll.closed && <span className="text-[10px] text-emerald-400/50">Tap to change</span>}
                                    {!poll.isAnonymous && totalVotes > 0 && (
                                      <button onClick={(e) => { e.stopPropagation(); setViewPollVotersMsgId(msg.id); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"><Users size={10} /> Voters</button>
                                    )}
                                    {poll.closed && <span className="text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-md">Closed</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        {msg.text && !msg.meta?.poll && <span className="break-words leading-relaxed">{displayText}</span>}
                        {!msg.text && !msg.attachment && !msg.voiceNote && !msg.gif && !msg.sticker && !msg.meta?.poll && <span className="break-words leading-relaxed"></span>}
                        {msg.isStarred && <Star size={12} className="inline-block text-yellow-400 fill-current opacity-80 shrink-0 ml-1.5 mb-[2px]" />}
                      </div>

                      <div className="absolute top-1 right-1.5 flex items-center">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMsgId(activeMsgId === msg.id ? null : msg.id); 
                          }}
                          className={`p-0.5 rounded-full bg-black/10 hover:bg-black/20 text-white/70 transition-colors opacity-100 md:opacity-0 md:group-hover/bubble:opacity-100 ${activeMsgId === msg.id ? '!opacity-100 bg-black/30' : ''}`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          title="Message Options"
                        >
                          <ChevronDown size={14} className={`transition-transform ${activeMsgId === msg.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Display active reactions overlapping the bubble */}
                      {hasReactions && (
                        <div className={`absolute bottom-[-12px] ${isMe ? 'right-2' : 'left-2'} bg-[#1a1a1c] border border-white/10 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-0.5 shadow-sm`}>
                          {Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0, 3).map(e => <span key={e}>{e}</span>)}
                          {msg.reactions.length > 1 && <span className="text-zinc-400 text-[10px] pr-0.5 ml-0.5 font-medium">{msg.reactions.length}</span>}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                {/* Receive-side filter badge — beside bubble, outside it */}
                {_isFlaggedIncoming && _recvMode === 'warn' && (
                  <div className="flex items-end pb-[3px] ml-0.5 shrink-0">
                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/20 text-[11px] font-bold text-amber-400 whitespace-nowrap tracking-wide">
                      ⚠️ flagged
                    </span>
                  </div>
                )}
                {_isFlaggedIncoming && (_recvMode === 'block' || _recvMode === 'sanitize') && (
                  <div className="flex items-end pb-[3px] ml-0.5 shrink-0">
                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/20 text-[11px] font-bold text-red-400 whitespace-nowrap tracking-wide">
                      🚫 filtered
                    </span>
                  </div>
                )}

                </div>
                <span className="text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-0.5">
                  {chat.isGroup && !isMe && msg.showAvatar && <span className="font-medium mr-2">{friends.find(f=>f.id===msg.senderId)?.name.split(' ')[0]}</span>}
                  {formatMessageTime(msg.timestamp)}
                  {isMe && <ReceiptIndicator status={readReceipts ? msg.status : (msg.status === 'read' ? 'delivered' : msg.status)} />}
                </span>
              </div>
            </div>
          );
        })}

        {activeTypers.length > 0 && (
          <div className="flex items-end gap-2 group/msg mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8">
               {chat.isGroup && <img src={friends.find(f=>f.id===activeTypers[0])?.avatar || chat.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />}
            </div>
            <div className="flex flex-col items-start max-w-[75%] lg:max-w-[60%]">
              <div className="bg-[#1e1e24] border border-white/[0.02] px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing-dot" style={{ animationDelay: '400ms' }} />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1 font-medium">
                {renderTypingText()}
              </span>
            </div>
          </div>
        )}

      </div>

      {isScrolledUp && (
        <div className="absolute bottom-[80px] right-6 z-[60] animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => {
              const container = scrollContainerRef.current;
              if (firstUnreadMsgId) {
                const el = document.getElementById(`message-${firstUnreadMsgId}`);
                if (el && container) {
                  container.style.scrollBehavior = 'auto';
                  const containerHalf = container.clientHeight / 2;
                  const elHalf = el.clientHeight / 2;
                  container.scrollTop = el.offsetTop - containerHalf + elHalf;
                  requestAnimationFrame(() => {
                    container.style.scrollBehavior = 'smooth';
                  });
                } else if (container) {
                  container.style.scrollBehavior = 'smooth';
                  container.scrollTop = container.scrollHeight;
                }
              } else if (container) {
                container.style.scrollBehavior = 'smooth';
                container.scrollTop = container.scrollHeight;
              }
            }}
            className="w-10 h-10 bg-[#1a1a1c] border border-white/10 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-colors"
          >
            <ChevronDown size={20} />
            {newMsgCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-2 border-[#1a1a1c]">
                {newMsgCount > 99 ? '99+' : newMsgCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Connect Card at bottom for unconnected users */}
      {!chat.isGroup && !chat.isConnected && (() => {
        const globalUser = globalUsers.find(u => u.id === chat.id);
        const mutualFriends = (globalUser?.mutualFriendIds || []).map(id => friends.find(f => f.id === id)).filter(Boolean);
        return (
          <div className="px-6 pb-6 pt-2 flex-none z-10">
            <div className="flex flex-col items-center p-6 bg-[#1a1a1c] border border-white/[0.05] rounded-3xl max-w-sm mx-auto text-center shadow-lg">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3">
                <img src={chat.avatar} alt={chat.name} className="w-16 h-16 rounded-full object-cover" />
              </div>
              <h3 className="text-white font-semibold text-lg tracking-tight mb-0.5">{chat.name}</h3>
              <p className="text-xs text-zinc-400 mb-1">{chat.handle}</p>
              {mutualFriends.length > 0 && (
                <div className="flex items-center gap-1 mb-3 mt-1">
                  <div className="flex -space-x-2">
                    {mutualFriends.slice(0, 3).map(mf => (
                      <img key={mf.id} src={mf.avatar} alt={mf.name} className="w-5 h-5 rounded-full border-2 border-[#1a1a1c]" />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-400 ml-1">
                    {mutualFriends.length} mutual friend{mutualFriends.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {isReqSent ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="w-full py-2 text-zinc-400 text-sm font-medium">Request Pending</div>
                  <button onClick={() => onWithdrawReq(chat.id)} className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors">Withdraw Request</button>
                </div>
              ) : isReqReceived ? (
                <div className="w-full flex gap-3">
                  <button onClick={() => onRejectReq(chat.id)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Decline</button>
                  <button onClick={() => onAcceptReq(chat.id)} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-lg">Accept</button>
                </div>
              ) : (
                <button onClick={() => onSendReq(chat)} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-lg">
                  Connect to chat with {chat.name.split(' ')[0]}
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {(chat.isGroup || chat.isConnected) && (
        <div className="px-6 pb-6 pt-0 flex-none z-50 bg-transparent flex flex-col relative">
          
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="w-full bg-[#1a1a1c] border-t border-x border-white/5 p-3 flex justify-between items-center rounded-t-2xl -mb-4 pt-3 pb-6 relative shadow-2xl animate-in slide-in-from-bottom-2">
              <div className="flex-1 bg-black/40 border-l-4 border-indigo-500 rounded p-2 overflow-hidden relative">
                <span className="text-[11px] text-indigo-400 font-bold block tracking-wide">
                  Replying to {replyingTo.senderId === currentUser.id ? 'Yourself' : (friends.find(f=>f.id===replyingTo.senderId)?.name || 'Someone')}
                </span>
                <span className="text-xs text-zinc-400 truncate block mt-0.5">{replyingTo.text}</span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="p-1.5 ml-3 text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full">
                <X size={14}/>
              </button>
            </div>
          )}

          {/* UNIFIED PICKER: Emoji / GIF / Sticker */}
          {showEmojiPicker && (
            <div className="absolute bottom-[100%] left-0 w-full md:w-[380px] md:left-6 h-80 mb-2 bg-[#1a1a1c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-[70] overflow-hidden animate-in slide-in-from-bottom-4">
               {/* Header with tabs */}
               <div className="flex items-center justify-between p-2.5 bg-black/20 border-b border-white/5">
                 <div className="flex gap-1">
                   {[
                     { id: 'emoji', icon: <Smile size={15} />, label: 'Emojis' },
                     { id: 'gif', icon: <span className="text-[11px] font-bold leading-none">GIF</span>, label: 'GIFs' },
                     { id: 'sticker', icon: <Sticker size={15} />, label: 'Stickers' },
                   ].map(tab => (
                     <button 
                       key={tab.id}
                       type="button" 
                       onClick={() => setPickerTab(tab.id)}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                         pickerTab === tab.id 
                           ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' 
                           : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                       }`}
                     >
                       {tab.icon} {tab.label}
                     </button>
                   ))}
                 </div>
                 <button 
                   type="button" 
                   onClick={() => setShowEmojiPicker(false)} 
                   className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <X size={14} />
                 </button>
               </div>

               {/* Emoji Tab */}
               {pickerTab === 'emoji' && (
                 <>
                   <div className="flex-1 overflow-y-auto p-4 scroll-smooth relative [&::-webkit-scrollbar]:hidden" id="emoji-scroll-container">
                     {EMOJI_CATEGORIES.map(cat => (
                       <div key={cat.id} id={`emoji-cat-${cat.id}`} className="mb-6">
                         <h4 className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-wider sticky top-0 bg-[#1a1a1c]/95 py-1 z-10 backdrop-blur-md">{cat.name}</h4>
                         <div className="grid grid-cols-7 gap-2">
                           {cat.emojis.map(emoji => (
                             <button 
                               type="button" 
                               key={emoji} 
                               onClick={() => {
                                 setInputText(prev => prev + emoji);
                                 inputRef.current?.focus();
                               }} 
                               className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors flex items-center justify-center hover:scale-110 active:scale-95"
                             >
                               {emoji}
                             </button>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-around p-2 bg-black/40 border-t border-white/5">
                     {EMOJI_CATEGORIES.map(cat => (
                       <button 
                         type="button" 
                         key={`tab-${cat.id}`} 
                         onClick={(e) => {
                           e.preventDefault();
                           const container = document.getElementById('emoji-scroll-container');
                           const target = document.getElementById(`emoji-cat-${cat.id}`);
                           if (container && target) {
                             container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
                           }
                         }} 
                         className="text-xl p-1.5 opacity-50 hover:opacity-100 transition-opacity hover:bg-white/5 rounded-lg"
                         title={cat.name}
                       >
                         {cat.icon}
                       </button>
                     ))}
                   </div>
                 </>
               )}

               {/* GIF Tab ? curated categories */}
               {pickerTab === 'gif' && (
                 <>
                   <div className="p-2.5 border-b border-white/5">
                     <div className="relative">
                       <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                       <input 
                         type="text"
                         value={gifSearch}
                         onChange={(e) => setGifSearch(e.target.value)}
                         placeholder="Search GIFs..."
                         className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/40"
                       />
                     </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden">
                     {filteredGifs.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                         <span className="text-3xl mb-2">📊</span>
                         <span className="text-xs">No GIFs match "{gifSearch}"</span>
                       </div>
                     ) : (
                       filteredGifs.map(cat => (
                         <div key={cat.id} className="mb-4">
                           <h4 className="text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-wider sticky top-0 bg-[#1a1a1c]/95 py-1 z-10 backdrop-blur-md">{cat.name}</h4>
                           <div className="grid grid-cols-2 gap-1.5">
                             {cat.gifs.map(gif => (
                               <button
                                 key={gif.id}
                                 type="button"
                                 onClick={() => sendGif(gif)}
                                 className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer relative group"
                               >
                                 <img src={gif.url} alt={gif.title} className="w-full h-24 object-cover rounded-lg" loading="lazy" />
                                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="text-[9px] text-white font-medium">{gif.title}</span>
                                 </div>
                               </button>
                             ))}
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </>
               )}

               {/* Sticker Tab */}
               {pickerTab === 'sticker' && (
                 <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden">
                   {/* Sticker Store Button */}
                   <button
                     type="button"
                     onClick={() => setShowStickerStore(!showStickerStore)}
                     className="w-full flex items-center justify-between p-2.5 mb-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
                   >
                     <div className="flex items-center gap-2">
                       <Plus size={14} className="text-indigo-400" />
                       <span className="text-[11px] text-indigo-400 font-semibold">Sticker Store</span>
                       <span className="text-[9px] text-zinc-500">{STICKER_STORE_PACKS.length} packs available</span>
                     </div>
                     <ChevronRight size={14} className={`text-indigo-400 transition-transform ${showStickerStore ? 'rotate-90' : ''}`} />
                   </button>

                   {/* Sticker Store Panel */}
                   {showStickerStore && (
                     <div className="mb-4 bg-black/30 rounded-xl border border-white/[0.04] p-2.5 animate-in slide-in-from-top-2 duration-200">
                       <h4 className="text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-wider">Available Packs</h4>
                       <div className="space-y-1.5">
                         {STICKER_STORE_PACKS.map(pack => {
                           const isInstalled = installedPacks.includes(pack.id);
                           return (
                             <div key={pack.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                               <span className="text-2xl shrink-0">{pack.preview}</span>
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs text-white font-medium">{pack.name}</p>
                                 <p className="text-[10px] text-zinc-500">{pack.description} ? {pack.stickers.length} stickers</p>
                               </div>
                               <button
                                 type="button"
                                 onClick={() => {
                                   setInstalledPacks(prev => 
                                     isInstalled ? prev.filter(id => id !== pack.id) : [...prev, pack.id]
                                   );
                                 }}
                                 className={`px-3 py-1 text-[10px] font-semibold rounded-full transition-all ${
                                   isInstalled 
                                     ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                                     : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25'
                                 }`}
                               >
                                 {isInstalled ? 'Remove' : 'Add'}
                               </button>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {/* Installed Sticker Packs */}
                   {allStickerPacks.map(pack => (
                     <div key={pack.id} className="mb-5">
                       <h4 className="text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-wider sticky top-0 bg-[#1a1a1c]/95 py-1 z-10 backdrop-blur-md">{pack.name}</h4>
                       <div className="grid grid-cols-4 gap-2">
                         {pack.stickers.map(s => (
                           <button
                             key={s.id}
                             type="button"
                             onClick={() => sendSticker(s)}
                             className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/[0.06] transition-colors group"
                             title={s.label}
                           >
                             <span className="text-4xl group-hover:scale-110 transition-transform">{s.emoji}</span>
                             <span className="text-[8px] text-zinc-600 group-hover:text-zinc-400 transition-colors">{s.label}</span>
                           </button>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* File Attachment Preview Panel */}
          {attachedFiles.length > 0 && (
            <div className="bg-[#1a1a1c]/90 backdrop-blur-md border border-white/[0.05] rounded-2xl p-3 mb-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached</span>
                <div className="flex items-center gap-3">
                  {attachedFiles.some(af => af.type?.startsWith('image/') || af.type?.startsWith('video/')) && (
                    <button 
                      onClick={() => setViewOnceEnabled(!viewOnceEnabled)} 
                      className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full transition-all ${
                        viewOnceEnabled 
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                          : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10'
                      }`}
                    >
                      {viewOnceEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                      View once {viewOnceEnabled ? 'ON' : 'OFF'}
                    </button>
                  )}
                  <button onClick={() => { attachedFiles.forEach(af => af.url && URL.revokeObjectURL(af.url)); setAttachedFiles([]); setViewOnceEnabled(false); }} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear all</button>
                </div>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pt-3 pb-1 [&::-webkit-scrollbar]:hidden">
                {attachedFiles.map((af, i) => {
                  const IconComp = getFileIcon(af.type, af.name);
                  const isMedia = af.type?.startsWith('image/') || af.type?.startsWith('video/');
                  return (
                    <div key={i} className="relative shrink-0">
                      {af.type?.startsWith('image/') ? (
                        <div className={`w-20 h-20 rounded-xl overflow-hidden border ${viewOnceEnabled ? 'border-indigo-500/40' : 'border-white/10'}`}>
                          <img src={af.url} alt={af.name} className={`w-full h-full object-cover ${viewOnceEnabled ? 'blur-[2px] opacity-70' : ''}`} />
                          {viewOnceEnabled && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Eye size={16} className="text-indigo-400" />
                            </div>
                          )}
                        </div>
                      ) : af.type?.startsWith('video/') ? (
                        <div className={`w-20 h-20 rounded-xl overflow-hidden border relative bg-black ${viewOnceEnabled ? 'border-indigo-500/40' : 'border-white/10'}`}>
                          <video src={af.url} className={`w-full h-full object-cover ${viewOnceEnabled ? 'blur-[2px] opacity-70' : ''}`} />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            {viewOnceEnabled ? <Eye size={16} className="text-indigo-400" /> : <Play size={18} className="text-white/80" />}
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-[#252528] border border-white/[0.06] flex flex-col items-center justify-center gap-1.5 px-2">
                          <IconComp size={22} className="text-indigo-400/70" />
                          <span className="text-[8px] text-zinc-400 font-medium truncate w-full text-center">{af.name.split('.').pop()?.toUpperCase()}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => removeFile(i)} 
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg z-10"
                      >
                        <X size={10} />
                      </button>
                      <p className="text-[8px] text-zinc-500 truncate w-20 mt-1 text-center">{af.name}</p>
                      <p className="text-[7px] text-zinc-600 w-20 text-center">{viewOnceEnabled && isMedia ? '?? View once' : formatFileSize(af.size)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Form Input */}
          {!canMessage ? (
            <div className="flex items-center justify-center p-3 text-sm text-zinc-500 bg-[#1e1e24] border border-white/[0.05] rounded-full relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
              Only admins can send messages in this group
            </div>
          ) : isRecording ? (
            /* Voice Recording UI */
            <div className="flex items-center gap-3 bg-[#1e1e24] border border-red-500/30 p-2 px-4 rounded-full shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-sm text-red-400 font-mono font-medium tabular-nums">{formatRecordingTime(recordingTime)}</span>
                <div className="flex items-end gap-[2px] flex-1 h-5 overflow-hidden">
                  {liveBars.map((h, i) => (
                    <div key={i} className="w-[2px] rounded-full bg-red-400/70 transition-[height] duration-75" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
              <button type="button" onClick={cancelRecording} className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]" title="Cancel">
                <Trash2 size={18} />
              </button>
              <button type="button" onClick={stopRecording} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg active:scale-95" title="Stop">
                <Square size={14} className="fill-current" />
              </button>
            </div>
          ) : audioBlob ? (
            <VoiceReviewPlayer url={audioUrl} duration={recordingTime} onCancel={cancelRecording} onSend={sendVoiceMessage} />
          ) : (
            <div className="relative">
              {/* 🚫 Profanity Warning Toast */}
              {profanityWarning && (
                <div style={{ animation: 'slideUp 0.3s ease-out' }} className={`flex items-center gap-3 mb-2 px-5 py-3 rounded-2xl backdrop-blur-md shadow-lg ${profanityWarning === 'warn' ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 shadow-amber-500/5' : 'bg-gradient-to-r from-red-500/15 to-orange-500/10 border border-red-500/30 shadow-red-500/5'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${profanityWarning === 'warn' ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                    <Shield size={14} className={profanityWarning === 'warn' ? 'text-amber-400' : 'text-red-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {profanityWarning === 'warn' ? (
                      <>
                        <p className="text-xs font-semibold text-amber-400">Language warning</p>
                        <p className="text-[10px] text-amber-400/70">Flagged content detected — message sending in a moment…</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-red-400">Message blocked</p>
                        <p className="text-[10px] text-red-400/70">Inappropriate language detected — please revise your message</p>
                      </>
                    )}
                  </div>
                  {profanityWarning === 'block' && (
                    <button type="button" onClick={() => setProfanityWarning(null)} className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* ? Magic Reply Suggestions ? on-device AI */}
              {magicReplies.length > 0 && !inputText.trim() && !showEmojiPicker && !replyingTo && !profanityWarning && (
                <div className="absolute bottom-full left-0 right-0 px-4 pb-2 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
                  <div className="flex items-center gap-1 shrink-0 mr-1">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400/70 uppercase tracking-wider">AI</span>
                  </div>
                  {magicReplies.map((reply, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onSendMessage(chat.id, reply);
                      }}
                      className="shrink-0 px-3 py-1.5 text-xs text-white/80 bg-[#1e1e24]/90 backdrop-blur-md border border-white/[0.08] rounded-full hover:bg-white/[0.12] hover:border-indigo-500/30 hover:text-white transition-all active:scale-95 whitespace-nowrap shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* 🤖 AI Writing Assistant Panel */}
              {showAiAssistant && inputText.trim() && (
                <div className="mb-2 bg-[#1a1a1c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 duration-200 z-[70]">
                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Wand2 size={12} className="text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">AI Writing Assistant</span>
                        <span className="text-[9px] text-zinc-500 ml-2 flex items-center gap-1 inline-flex">
                          <Shield size={8} /> On-device ? E2E safe
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowAiAssistant(false)} className="p-1 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  {aiProcessing ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                      <span className="text-xs text-amber-400/80 animate-pulse">Processing on device...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 p-2.5">
                      {AI_WRITING_TOOLS.map(tool => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleAiTool(tool.id)}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-colors">
                            {tool.id === 'improve' && <Sparkles size={14} className="text-amber-400" />}
                            {tool.id === 'shorten' && <ArrowUpRight size={14} className="text-amber-400 rotate-180" />}
                            {tool.id === 'expand' && <ArrowUpRight size={14} className="text-amber-400" />}
                            {tool.id === 'formal' && <Type size={14} className="text-amber-400" />}
                            {tool.id === 'casual' && <Smile size={14} className="text-amber-400" />}
                            {tool.id === 'fix' && <Check size={14} className="text-amber-400" />}
                          </div>
                          <span className="text-[10px] font-medium text-white/80 group-hover:text-white">{tool.label}</span>
                          <span className="text-[8px] text-zinc-600 group-hover:text-zinc-400">{tool.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form 
                onSubmit={handleSend}
                className="flex items-center gap-2 bg-[#1e1e24] border border-white/[0.05] p-2 rounded-full relative z-10"
              >
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 transition-colors rounded-full ${showEmojiPicker ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'}`}
                >
                  <Smile size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
                  title="Attach file (up to 2GB)"
                >
                  <Paperclip size={20} />
                </button>
                {chat.isGroup && (
                  <button 
                    type="button" 
                    onClick={() => setShowCreatePoll(true)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
                    title="Create Poll"
                  >
                    <BarChart3 size={20} />
                  </button>
                )}
                <input 
                  ref={inputRef}
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  /* ACCURACY FIX: Removed onFocus={() => setShowEmojiPicker(false)} so it doesn't close when clicking emojis */
                  placeholder="Message..." 
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none px-2 cursor-text"
                />
                
                {/* AI Writing Assistant button — only shown when enabled in settings */}
                {aiWritingAssistant && (
                <button 
                  type="button" 
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  className={`p-2 transition-all rounded-full relative ${showAiAssistant ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400 hover:text-amber-400 hover:bg-amber-500/5'}`}
                  title="AI Writing Assistant"
                >
                  <Sparkles size={18} />
                  {!showAiAssistant && inputText.trim() && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
                )}

                {inputText.trim() || replyingTo || attachedFiles.length > 0 ? (
                  <button type="submit" className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors shadow-lg shadow-indigo-500/20 active:scale-95">
                    <Send size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={startRecording} className="p-2.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]" title="Record voice message">
                    <Mic size={18} />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {showDetails && chat.isGroup && (
        <div className="absolute inset-0 z-50 bg-[#121214] flex flex-col animate-in slide-in-from-right-8 duration-300">
          <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
            <button onClick={() => { setIsEditingName(false); setIsEditingDesc(false); setShowDetails(false); }} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full">
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-medium text-white tracking-tight">Group Info</h2>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8 [&::-webkit-scrollbar]:hidden pb-24" onClick={() => setMemberMenuOpen(null)}>
            <div className="flex flex-col items-center w-full text-center">
              <div className={`w-24 h-24 rounded-3xl ${chat.icon || 'bg-indigo-500'} flex items-center justify-center text-white shadow-xl mb-4 mx-auto shrink-0`}>
                <Hash size={40} />
              </div>
              
              {/* Profanity warning for group name/desc editing */}
              {profanityWarning && (
                <div style={{ animation: 'slideUp 0.3s ease-out' }} className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-red-500/10 border border-red-500/25 rounded-2xl w-full max-w-sm mx-auto">
                  <Shield size={14} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-400 font-medium">Inappropriate language detected ? please revise</span>
                </div>
              )}

              {isEditingName ? (
                <div className="w-full max-w-sm mt-2 flex flex-col gap-1 mx-auto">
                  <div className="flex items-center gap-2 bg-[#1a1a1c] p-2 rounded-2xl border border-white/[0.05]">
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      placeholder="Group Name"
                      maxLength={50}
                      autoFocus
                      className="flex-1 bg-transparent border-none text-white text-center text-xl font-bold focus:outline-none cursor-text" 
                    />
                    <button onClick={handleSaveName} disabled={!editName.trim()} className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white transition-colors shadow-lg"><Check size={16}/></button>
                    <button onClick={() => { setIsEditingName(false); setEditName(chat.name); }} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"><X size={16}/></button>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500 pr-2">{editName.length}/50</div>
                </div>
              ) : (
                <div className="relative group/title inline-flex items-center justify-center max-w-[80%]">
                  <h2 className="text-xl font-bold text-white break-words text-center">
                    {chat.name}
                  </h2>
                  {isAdmin && (
                    <div className="absolute left-full ml-1 flex items-center">
                      <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover/title:opacity-100 text-zinc-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5" title="Edit Group Name">
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {isEditingDesc ? (
                <div className="w-full max-w-sm mt-4 bg-[#1a1a1c] p-3 rounded-2xl border border-white/[0.05] flex flex-col gap-2 mx-auto">
                  <textarea 
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)} 
                    placeholder="Add a group description..."
                    maxLength={160}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none cursor-text" 
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-500 pl-1">{editDesc.length}/160</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setIsEditingDesc(false); setEditDesc(chat.description); }} className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">Cancel</button>
                      <button onClick={handleSaveDesc} className="px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors shadow-lg">Save</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 relative inline-flex items-start justify-center max-w-[80%] group/desc mx-auto">
                  <div className="w-full">
                    {chat.description ? (
                      <p className="text-sm text-zinc-300 text-center leading-relaxed break-words">{chat.description}</p>
                    ) : (
                      <p className="text-sm text-zinc-500 italic text-center">No description</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="absolute left-full ml-1">
                      <button onClick={() => setIsEditingDesc(true)} className="opacity-0 group-hover/desc:opacity-100 text-zinc-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 mt-[-2px]" title="Edit Description">
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <section className="relative z-20">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Group Settings</h3>
                <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] overflow-hidden">
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex flex-col pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white">Secret Chat</span>
                        {disappearingChat?.enabled && <Timer size={12} className="text-amber-400" />}
                      </div>
                      <span className="text-xs text-zinc-500 leading-snug">Messages are deleted once the session ends</span>
                    </div>
                    <button
                      onClick={() => disappearingChat?.enabled ? onToggleDisappearing(chat.id, false) : setShowDisappearingModal(true)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${disappearingChat?.enabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${disappearingChat?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="border-t border-white/[0.02] p-5 flex items-center justify-between">
                    <div className="flex flex-col pr-4">
                      <span className="text-sm font-medium text-white mb-0.5">Restrict Messaging</span>
                      <span className="text-xs text-zinc-500 leading-snug">Allow only admins to send messages to this group</span>
                    </div>
                    <button
                      onClick={() => onToggleAdminMessaging(chat.id, !chat.onlyAdminsCanMessage)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${chat.onlyAdminsCanMessage ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${chat.onlyAdminsCanMessage ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className={`relative transition-all duration-300 ${memberMenuOpen ? 'z-40' : 'z-20'}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                 <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{chat.members} Members</h3>
                 {isAdmin && (
                   <div className="flex items-center gap-2">
                     {chat.members > 1 && (
                       <button onClick={() => setShowRemoveMembersPanel(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 font-medium transition-colors">
                         <UserMinus size={14} /> Remove
                       </button>
                     )}
                     {chat.members < 1024 && (
                       <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-400 font-medium transition-colors">
                         <UserPlus size={14} /> Add
                       </button>
                     )}
                   </div>
                 )}
              </div>
              <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] flex flex-col">
                {groupMembers.slice(0, showAllMembers ? undefined : 5).map((member, idx, arr) => (
                  <div 
                    key={member.id} 
                    onClick={() => {
                      if (member.id !== currentUser.id) onStartChat(member.id);
                    }}
                    className={`flex items-center gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer ${idx !== 0 ? 'border-t border-white/[0.02]' : ''} ${idx === 0 ? 'rounded-t-3xl' : ''} ${(idx === arr.length - 1 && chat.members <= 5) ? 'rounded-b-3xl' : ''} ${memberMenuOpen === member.id ? 'relative z-50 bg-white/5' : 'relative z-10'}`}
                  >
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        {member.name} 
                        {member.id === currentUser.id && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full leading-none">You</span>}
                        {chat.adminIds?.includes(member.id) && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full leading-none">Admin</span>}
                      </h4>
                      <p className="text-xs text-zinc-500">{member.handle || 'Member'}</p>
                    </div>
                    {isAdmin && member.id !== currentUser.id && (
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMemberMenuOpen(memberMenuOpen === member.id ? null : member.id); }} 
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {memberMenuOpen === member.id && (
                          <div className="absolute right-0 top-10 bg-[#2a2a2c] border border-white/10 rounded-xl shadow-2xl w-40 z-[100] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col py-1">
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation();
                                 const isTargetAdmin = chat.adminIds?.includes(member.id);
                                 setConfirmAction({
                                   type: 'toggle_admin',
                                   payload: member.id,
                                   title: isTargetAdmin ? 'Dismiss as Admin' : 'Make Admin',
                                   desc: isTargetAdmin ? `Are you sure you want to remove Admin privileges from ${member.name}?` : `Are you sure you want to promote ${member.name} to Admin?`,
                                   confirmText: isTargetAdmin ? 'Dismiss' : 'Promote',
                                   confirmStyle: 'bg-indigo-500 hover:bg-indigo-600'
                                 });
                                 setMemberMenuOpen(null); 
                               }} 
                               className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors text-white text-xs font-medium"
                             >
                               {chat.adminIds?.includes(member.id) ? 'Dismiss as Admin' : 'Make Admin'}
                             </button>
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation();
                                 setConfirmAction({
                                   type: 'remove_member',
                                   payload: [member.id],
                                   title: 'Remove Member',
                                   desc: `Are you sure you want to remove ${member.name} from the group?`,
                                   confirmText: 'Remove',
                                   confirmStyle: 'bg-red-500 hover:bg-red-600'
                                 });
                                 setMemberMenuOpen(null); 
                               }} 
                               className="w-full text-left px-4 py-2 hover:bg-red-500/10 transition-colors text-red-400 text-xs font-medium border-t border-white/[0.04]"
                             >
                               Remove Member
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {!showAllMembers && chat.members > 5 && (
                  <button 
                    onClick={() => setShowAllMembers(true)}
                    className="w-full p-4 text-sm font-medium text-indigo-400 hover:bg-white/5 transition-colors border-t border-white/[0.02] text-left rounded-b-3xl"
                  >
                    View all {chat.members} members
                  </button>
                )}
                {showAllMembers && chat.members > 5 && (
                  <button 
                    onClick={() => setShowAllMembers(false)}
                    className="w-full p-4 text-sm font-medium text-indigo-400 hover:bg-white/5 transition-colors border-t border-white/[0.02] text-left rounded-b-3xl"
                  >
                    Show less
                  </button>
                )}
              </div>
            </section>

            {starredMessages.length > 0 && (
              <section className="relative z-20">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Starred Messages</h3>
                <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] flex flex-col overflow-hidden">
                  {starredMessages.map((msg, idx) => (
                    <div 
                      key={msg.id} 
                      onClick={() => {
                        setShowDetails(false);
                        setTimeout(() => {
                          const el = document.getElementById(`message-${msg.id}`);
                          const bubble = document.getElementById(`bubble-${msg.id}`);
                          const container = scrollContainerRef.current;
                          
                          if (el && container) {
                            container.style.scrollBehavior = 'auto';
                            const containerHalf = container.clientHeight / 2;
                            const elHalf = el.clientHeight / 2;
                            container.scrollTop = el.offsetTop - containerHalf + elHalf;
                            
                            requestAnimationFrame(() => {
                               container.style.scrollBehavior = 'smooth';
                            });
                          }
                          
                          if (bubble) {
                            bubble.classList.add('ring-4', 'ring-indigo-500/50', 'scale-[1.02]', 'shadow-[0_0_20px_rgba(99,102,241,0.4)]');
                            setTimeout(() => { 
                              bubble.classList.remove('ring-4', 'ring-indigo-500/50', 'scale-[1.02]', 'shadow-[0_0_20px_rgba(99,102,241,0.4)]'); 
                            }, 2000);
                          }
                        }, 100);
                      }}
                      className={`p-4 flex flex-col gap-1.5 hover:bg-white/5 transition-colors cursor-pointer ${idx !== 0 ? 'border-t border-white/[0.02]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">
                          {msg.senderId === currentUser.id ? 'You' : (friends.find(f => f.id === msg.senderId)?.name || 'Someone')}
                        </span>
                        <span className="text-xs text-zinc-500">{formatMessageTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-3">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}



            <section className="space-y-2 relative z-10">
              <button onClick={() => setReportStep('category')} className="w-full flex items-center gap-3 p-4 bg-[#1a1a1c] hover:bg-white/5 transition-colors rounded-2xl text-red-400 font-medium text-sm">
                <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><Flag size={16} /></span>
                Report Group
              </button>
              <button onClick={() => setShowBlockConfirm(true)} className="w-full flex items-center gap-3 p-4 bg-[#1a1a1c] hover:bg-white/5 transition-colors rounded-2xl text-red-400 font-medium text-sm">
                <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><Ban size={16} /></span>
                Block Group
              </button>
              <button onClick={() => setShowLeaveConfirm(true)} className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-2xl text-red-500 font-medium text-sm">
                <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><LogOut size={16} /></span>
                Leave Group
              </button>
            </section>
          </div>
        </div>
      )}

      {/* 🗳? Create Poll Modal */}
      {showCreatePoll && <CreatePollModal onClose={() => setShowCreatePoll(false)} onCreatePoll={handleCreatePoll} />}

      {/* 👥 Poll Voters Overlay */}
      {viewPollVotersMsgId && (() => {
        const voterMsg = (chat.messages || []).find(m => m.id === viewPollVotersMsgId);
        if (!voterMsg?.meta?.poll) return null;
        const vPoll = voterMsg.meta.poll;
        const vOpts = vPoll.options.map(o => ({ ...o, votes: getPollOptionVotes(voterMsg.id, o.id, o.votes) }));
        const vTotal = vOpts.reduce((s, o) => s + o.votes.length, 0);
        const vColors = ['bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-lime-500'];
        return (
          <div className="absolute inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewPollVotersMsgId(null)}>
            <div className="bg-[#141418] border border-white/[0.06] rounded-2xl w-full max-w-[380px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Users size={14} className="text-white" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Poll Voters</h3>
                    <p className="text-[10px] text-zinc-500">{vTotal} total vote{vTotal !== 1 ? 's' : ''} ? {vPoll.question}</p>
                  </div>
                </div>
                <button onClick={() => setViewPollVotersMsgId(null)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden">
                {vOpts.map((opt, oi) => (
                  <div key={opt.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${vColors[oi % vColors.length]} shrink-0`} />
                      <span className="text-xs font-semibold text-white">{opt.text}</span>
                      <span className="text-[10px] text-zinc-500 ml-auto">{opt.votes.length} vote{opt.votes.length !== 1 ? 's' : ''}</span>
                    </div>
                    {opt.votes.length > 0 ? (
                      <div className="ml-5 space-y-1.5">
                        {opt.votes.map(uid => (
                          <div key={uid} className="flex items-center gap-2 text-xs text-zinc-300">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{getVoterName(uid).charAt(0)}</div>
                            <span>{getVoterName(uid)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-5 text-[10px] text-zinc-600 italic">No votes</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📋 Task Panel */}
      {showTaskPanel && <TaskPanel tasks={chatTasks} onClose={() => setShowTaskPanel(false)} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} friends={friends} canManage={!chat.isGroup || isAdmin} onJumpToMessage={(msgId) => { setShowTaskPanel(false); setTimeout(() => { const el = document.getElementById(`message-${msgId}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('msg-highlight'); void el.offsetWidth; el.classList.add('msg-highlight'); setTimeout(() => el.classList.remove('msg-highlight'), 2200); } }, 300); }} />}

      {/* 🎯 Task Priority Picker */}
      {taskPriorityPrompt && (
        <div className="absolute inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setTaskPriorityPrompt(null)}>
          <div className="bg-[#141418] border border-white/[0.06] rounded-2xl w-full max-w-[320px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><ListTodo size={14} className="text-white" /></div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Task</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[220px]">{taskPriorityPrompt.text?.slice(0, 60)}{taskPriorityPrompt.text?.length > 60 ? '...' : ''}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mb-3">Select Priority</p>
              <div className="space-y-2">
                {[
                  { key: 'high', label: 'High', desc: 'Urgent & important', color: 'from-red-500 to-rose-600', ring: 'ring-red-400/40', icon: '?' },
                  { key: 'medium', label: 'Medium', desc: 'Normal priority', color: 'from-amber-500 to-orange-600', ring: 'ring-amber-400/40', icon: '?' },
                  { key: 'low', label: 'Low', desc: 'Can wait', color: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-400/40', icon: '?' },
                ].map(p => (
                  <button
                    key={p.key}
                    onClick={() => { handleCreateTask(taskPriorityPrompt, p.key); setTaskPriorityPrompt(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] transition-all active:scale-[0.98]`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="text-left flex-1">
                      <span className="text-sm font-semibold text-white block">{p.label}</span>
                      <span className="text-[10px] text-zinc-500">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => setTaskPriorityPrompt(null)} className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Recent Polls Panel */}
      {showRecentPolls && (
        <div className="absolute inset-0 z-[80] bg-[#121214] flex flex-col animate-in slide-in-from-right-8 duration-300">
          <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
            <button onClick={() => setShowRecentPolls(false)} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full"><ArrowLeft size={18} /></button>
            <div className="flex items-center gap-2"><BarChart3 size={18} className="text-violet-400" /><h2 className="text-base font-medium text-white">Recent Polls</h2></div>
            <span className="ml-auto text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full">{pollMessages.length} poll{pollMessages.length !== 1 ? 's' : ''}</span>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden">
            {pollMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 pb-10">
                <BarChart3 size={40} className="mb-3 text-zinc-600" />
                <p className="text-sm font-medium">No polls yet</p>
                <p className="text-xs text-zinc-600 mt-1">Create a poll using the chart icon</p>
              </div>
            ) : pollMessages.map(pm => {
              const poll = pm.meta.poll;
              const optionsWV = poll.options.map(o => ({ ...o, votes: getPollOptionVotes(pm.id, o.id, o.votes) }));
              const total = optionsWV.reduce((s, o) => s + o.votes.length, 0);
              const optC = ['from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-amber-400 to-orange-500', 'from-pink-400 to-rose-500', 'from-cyan-400 to-sky-500'];
              return (
                <div key={pm.id} className="bg-[#1a1a1c] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0"><BarChart3 size={12} className="text-white" /></div>
                    <span className="text-sm font-bold text-white">{poll.question}</span>
                    {poll.closed && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-md font-medium ml-auto">Closed</span>}
                  </div>
                  <div className="space-y-1.5">
                    {optionsWV.map((opt, oi) => {
                      const pct = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
                      return (
                        <div key={opt.id} className="flex items-center gap-3">
                          <div className="flex-1 h-7 bg-white/[0.03] rounded-lg relative overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${optC[oi % optC.length]} rounded-lg transition-all duration-500`} style={{ width: `${pct}%`, opacity: 0.2 }} />
                            <span className="absolute inset-0 flex items-center px-3 text-xs text-zinc-300 font-medium truncate">{opt.text}</span>
                          </div>
                          <span className="text-xs text-zinc-400 font-mono w-10 text-right shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500">{total} vote{total !== 1 ? 's' : ''} ? {new Date(pm.timestamp).toLocaleDateString()}</span>
                    <button onClick={() => { setShowRecentPolls(false); const el = document.getElementById(`message-${pm.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Jump to poll ?</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🎨 Canvas / Whiteboard Panel */}
      {showCanvas && <WhiteboardPanel
        canUserEdit={!chat.isGroup || isAdmin || canvasEditors.length === 0 || canvasEditors.includes(currentUser.id)}
        isAdmin={isAdmin}
        chat={chat}
        currentUser={currentUser}
        canvasEditors={canvasEditors}
        setCanvasEditors={setCanvasEditors}
        friends={friends}
        boards={wbBoards}
        setBoards={setWbBoards}
        activeBoardId={wbActiveBoardId}
        setActiveBoardId={setWbActiveBoardId}
        onClose={() => setShowCanvas(false)}
      />}

      {/* Individual User Info Panel */}
      {showDetails && !chat.isGroup && (() => {
        const userFriend = friends.find(f => f.id === chat.id);
        const globalUser = globalUsers.find(u => u.id === chat.id);
        const sharedGroups = (groups || []).filter(g => g.memberIds && g.memberIds.includes(chat.id) && g.memberIds.includes(currentUser.id));
        const mutualFriendIds = (userFriend?.mutualFriendIds || globalUser?.mutualFriendIds || []);
        const mutualFriends = mutualFriendIds.map(id => friends.find(f => f.id === id)).filter(Boolean);
        const userStarred = messages.filter(m => m.isStarred && !m.isDeleted && m.type !== 'system');
        return (

          <div className="absolute inset-0 z-50 bg-[#121214] flex flex-col animate-in slide-in-from-right-8 duration-300">
            <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
              <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-medium text-white tracking-tight">Contact Info</h2>
            </header>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 [&::-webkit-scrollbar]:hidden pb-24">
              {/* Profile Avatar & Name */}
              <div className="flex flex-col items-center w-full text-center">
                <div className="relative mb-4">
                  <img src={chat.avatar} alt={chat.name} className="w-28 h-28 rounded-full shadow-xl ring-4 ring-white/[0.05]" />
                  {chat.status === 'online' && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-[#121214] rounded-full" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{chat.name}</h2>
                {userFriend?.username && (
                  <p className="text-sm text-indigo-400 mt-0.5">@{userFriend.username}</p>
                )}
                <p className={`text-xs mt-1 font-medium ${chat.status === 'online' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {chat.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-6">
                <button className="flex flex-col items-center gap-1.5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1c] border border-white/[0.04] flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                    <Phone size={20} />
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium">Audio</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1c] border border-white/[0.04] flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                    <Video size={20} />
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium">Video</span>
                </button>
              </div>

              {/* Chat Settings */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Chat Settings</h3>
                <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] p-5 flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">Secret Chat</span>
                      {disappearingChat?.enabled && <Timer size={12} className="text-amber-400" />}
                    </div>
                    <span className="text-xs text-zinc-500 leading-snug">Messages are deleted once the session ends</span>
                  </div>
                  <button
                    onClick={() => disappearingChat?.enabled ? onToggleDisappearing(chat.id, false) : setShowDisappearingModal(true)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${disappearingChat?.enabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${disappearingChat?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </section>

              {/* Bio / About */}
              {userFriend?.bio && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">About</h3>
                  <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] p-5">
                    <p className="text-sm text-zinc-200 leading-relaxed">{userFriend.bio}</p>
                  </div>
                </section>
              )}

              {/* Contact Details */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Details</h3>
                <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] overflow-hidden">
                  {userFriend?.phone && (
                    <div className="flex items-center gap-4 p-4 border-b border-white/[0.02]">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone size={16} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">{userFriend.phone}</p>
                        <p className="text-xs text-zinc-500">Phone</p>
                      </div>
                    </div>
                  )}
                  {userFriend?.username && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Globe size={16} className="text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">@{userFriend.username}</p>
                        <p className="text-xs text-zinc-500">Username</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Starred Messages */}
              {userStarred.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Starred Messages</h3>
                  <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] flex flex-col overflow-hidden">
                    {userStarred.slice(0, 5).map((msg, idx) => (
                      <div 
                        key={msg.id}
                        onClick={() => {
                          setShowDetails(false);
                          setTimeout(() => {
                            const el = document.getElementById(`message-${msg.id}`);
                            const bubble = document.getElementById(`bubble-${msg.id}`);
                            const container = scrollContainerRef.current;
                            if (el && container) {
                              container.style.scrollBehavior = 'auto';
                              container.scrollTop = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
                              requestAnimationFrame(() => { container.style.scrollBehavior = 'smooth'; });
                            }
                            if (bubble) {
                              bubble.classList.add('ring-4', 'ring-indigo-500/50', 'scale-[1.02]');
                              setTimeout(() => bubble.classList.remove('ring-4', 'ring-indigo-500/50', 'scale-[1.02]'), 2000);
                            }
                          }, 100);
                        }}
                        className={`p-4 flex flex-col gap-1 hover:bg-white/5 transition-colors cursor-pointer ${idx !== 0 ? 'border-t border-white/[0.02]' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {msg.senderId === currentUser.id ? 'You' : chat.name}
                          </span>
                          <span className="text-xs text-zinc-500">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-sm text-zinc-300 line-clamp-2">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Mutual Friends */}
              {mutualFriends.length > 0 && (() => {
                const SHOW_LIMIT = 5;
                const hasMore = mutualFriends.length > SHOW_LIMIT;
                return (
                  <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">{mutualFriends.length} Mutual Friend{mutualFriends.length !== 1 ? 's' : ''}</h3>
                    <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] flex flex-col overflow-hidden">
                      {mutualFriends.slice(0, showAllMutuals ? mutualFriends.length : SHOW_LIMIT).map((mf, idx) => (
                        <div
                          key={mf.id}
                          className={`flex items-center gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer ${idx !== 0 ? 'border-t border-white/[0.02]' : ''}`}
                          onClick={() => { setShowDetails(false); onStartChat(mf.id); }}
                        >
                          <img src={mf.avatar} alt={mf.name} className="w-10 h-10 rounded-full shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-white truncate">{mf.name}</h4>
                            <p className="text-xs text-zinc-500 truncate">{mf.bio || 'Connected'}</p>
                          </div>
                          <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          onClick={() => setShowAllMutuals(prev => !prev)}
                          className="w-full p-3 text-center text-sm text-indigo-400 hover:bg-white/5 transition-colors border-t border-white/[0.02] font-medium"
                        >
                          {showAllMutuals ? 'Show less' : `Show ${mutualFriends.length - SHOW_LIMIT} more`}
                        </button>
                      )}
                    </div>
                  </section>
                );
              })()}

              {/* Shared Groups */}
              {sharedGroups.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">{sharedGroups.length} Group{sharedGroups.length !== 1 ? 's' : ''} in Common</h3>
                  <div className="bg-[#1a1a1c] rounded-3xl border border-white/[0.02] flex flex-col overflow-hidden">
                    {sharedGroups.map((g, idx) => (
                      <div
                        key={g.id}
                        className={`flex items-center gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer ${idx !== 0 ? 'border-t border-white/[0.02]' : ''}`}
                        onClick={() => { setShowDetails(false); onStartChat(g.id); }}
                      >
                        <div className={`w-10 h-10 rounded-xl ${g.icon || 'bg-indigo-500'} flex items-center justify-center text-white shrink-0`}>
                          <Hash size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-white truncate">{g.name}</h4>
                          <p className="text-xs text-zinc-500 truncate">{g.members} members</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              )}


              {/* Danger Zone */}
              <section className="space-y-2">
                <button onClick={() => setReportStep('category')} className="w-full flex items-center gap-3 p-4 bg-[#1a1a1c] hover:bg-white/5 transition-colors rounded-2xl text-red-400 font-medium text-sm">
                  <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><Flag size={16} /></span>
                  Report {chat.name}
                </button>
                <button onClick={() => setShowBlockConfirm(true)} className="w-full flex items-center gap-3 p-4 bg-[#1a1a1c] hover:bg-white/5 transition-colors rounded-2xl text-red-400 font-medium text-sm">
                  <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><Ban size={16} /></span>
                  Block {chat.name}
                </button>
                {chat.isConnected && (
                  <button onClick={() => setShowDisconnectConfirm(true)} className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-2xl text-red-500 font-medium text-sm">
                    <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><UserMinus size={16} /></span>
                    Disconnect
                  </button>
                )}
              </section>
            </div>
          </div>
        );
      })()}

      {/* View Once Fullscreen Viewer */}
      {viewOnceViewing && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-white/60">
              <Eye size={16} />
              <span className="text-sm font-medium">View once</span>
            </div>
            <button 
              onClick={() => {
                setViewOnceOpened(prev => ({ ...prev, [viewOnceViewing.msgId]: true }));
                setViewOnceViewing(null);
              }}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-w-[90vw] max-h-[80vh] flex items-center justify-center">
            {viewOnceViewing.type?.startsWith('video/') ? (
              <video src={viewOnceViewing.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl" />
            ) : (
              <img src={viewOnceViewing.url} alt="View once" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            )}
          </div>
          <p className="text-white/30 text-xs mt-4">Close to dismiss ? this media will no longer be available</p>
        </div>
      )}

      {showMessageInfo && (() => {
        const infoMsg = messages.find(m => m.id === showMessageInfo) || null;
        if (!infoMsg) return null;
        const receipts = infoMsg.receipts || [];
        const readBy = receipts.filter(r => r.status === 'read');
        const deliveredTo = receipts.filter(r => r.status === 'delivered');
        const pending = receipts.filter(r => r.status === 'pending');
        return (
          <div className="absolute inset-0 z-[170] bg-[#0a0a0c] flex flex-col animate-in slide-in-from-right-8 duration-300">
            <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
              <button onClick={() => setShowMessageInfo(null)} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-medium text-white tracking-tight">Message Info</h2>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden">
              {/* Message Preview */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                <p className="text-sm text-zinc-200 line-clamp-3">{infoMsg.text}</p>
                <span className="text-[10px] text-zinc-500 mt-2 block">{formatMessageTime(infoMsg.timestamp)}</span>
              </div>

              {/* Read By */}
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Read by &middot; {readBy.length}</h3>
                </div>
                <div className="bg-[#1a1a1c] rounded-2xl border border-white/[0.02] overflow-hidden">
                  {readBy.length === 0 ? (
                    <p className="text-xs text-zinc-600 p-4 text-center">{pending.length === receipts.length ? 'No one yet' : 'No one yet'}</p>
                  ) : readBy.map((r, i) => {
                    const member = friends.find(f => f.id === r.userId);
                    return (
                      <div key={r.userId} className={`flex items-center gap-3 p-3.5 ${i !== 0 ? 'border-t border-white/[0.02]' : ''}`}>
                        <img src={member?.avatar || `https://i.pravatar.cc/150?u=${r.userId}`} alt="" className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{member?.name || 'Member'}</p>
                          <p className="text-[10px] text-indigo-400">{r.readAt ? formatMessageTime(r.readAt) : ''}</p>
                        </div>
                        <div className="flex -space-x-1">
                          <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="currentColor" className="text-indigo-400" /></svg>
                          <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="currentColor" className="text-indigo-400" /></svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Delivered To */}
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Delivered to &middot; {deliveredTo.length}</h3>
                </div>
                <div className="bg-[#1a1a1c] rounded-2xl border border-white/[0.02] overflow-hidden">
                  {deliveredTo.length === 0 ? (
                    <p className="text-xs text-zinc-600 p-4 text-center">{readBy.length === receipts.length ? 'Read by all' : pending.length > 0 ? 'Some are yet to receive' : 'No one yet'}</p>
                  ) : deliveredTo.map((r, i) => {
                    const member = friends.find(f => f.id === r.userId);
                    return (
                      <div key={r.userId} className={`flex items-center gap-3 p-3.5 ${i !== 0 ? 'border-t border-white/[0.02]' : ''}`}>
                        <img src={member?.avatar || `https://i.pravatar.cc/150?u=${r.userId}`} alt="" className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{member?.name || 'Member'}</p>
                          <p className="text-[10px] text-emerald-400">{r.deliveredAt ? formatMessageTime(r.deliveredAt) : ''}</p>
                        </div>
                        <div className="flex -space-x-1">
                          <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400" /></svg>
                          <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400" /></svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Pending */}
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending &middot; {pending.length}</h3>
                </div>
                <div className="bg-[#1a1a1c] rounded-2xl border border-white/[0.02] overflow-hidden">
                  {pending.length === 0 ? (
                    <p className="text-xs text-zinc-600 p-4 text-center">{readBy.length === receipts.length ? 'Read by all' : 'Delivered to everyone'}</p>
                  ) : pending.map((r, i) => {
                    const member = friends.find(f => f.id === r.userId);
                    return (
                      <div key={r.userId} className={`flex items-center gap-3 p-3.5 ${i !== 0 ? 'border-t border-white/[0.02]' : ''}`}>
                        <img src={member?.avatar || `https://i.pravatar.cc/150?u=${r.userId}`} alt="" className="w-9 h-9 rounded-full shrink-0 opacity-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-500 font-medium truncate">{member?.name || 'Member'}</p>
                          <p className="text-[10px] text-zinc-600">Waiting...</p>
                        </div>
                        <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600" /></svg>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        );
      })()}

      {showDisappearingModal && (
        <div className="absolute inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Timer size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Secret Chat</h3>
                <p className="text-xs text-zinc-500">Choose how long to keep it active</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {[
                { key: 'session', label: 'This Session', desc: 'Until you leave this chat', icon: '?' },
                { key: '1day', label: '1 Day', desc: 'Expires after 24 hours', icon: '?' },
                { key: '1week', label: '1 Week', desc: 'Expires after 7 days', icon: '?' },
                { key: '1month', label: '1 Month', desc: 'Expires after 30 days', icon: '?' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    onToggleDisappearing(chat.id, true, opt.key);
                    setShowDisappearingModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/[0.08] border border-white/[0.04] hover:border-amber-500/20 transition-all text-left group"
                >
                  <span className="text-lg w-8 text-center shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white block">{opt.label}</span>
                    <span className="text-xs text-zinc-500 group-hover:text-amber-400/60 transition-colors">{opt.desc}</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowDisappearingModal(false)}
              className="w-full py-2.5 rounded-xl text-sm text-zinc-400 bg-transparent hover:bg-white/5 transition-colors font-medium mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="absolute inset-0 z-[110] bg-[#0a0a0c] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#121214]">
            <div className="flex items-center gap-4">
              <button onClick={() => { setShowAddMember(false); setNewMemberSelections([]); }} className="p-2 text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] hover:bg-white/10 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-white">Add Members</h2>
            </div>
            <button 
              onClick={submitNewMembers}
              disabled={newMemberSelections.length === 0}
              className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-2 [&::-webkit-scrollbar]:hidden">
             <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500">{newMemberSelections.length} selected</span>
                <span className="text-xs text-zinc-500">{1024 - chat.members} slots left</span>
             </div>
             {friends.filter(f => !chat.memberIds?.includes(f.id)).map(friend => {
                const isSelected = newMemberSelections.includes(friend.id);
                return (
                  <div key={friend.id} onClick={() => toggleNewMember(friend.id)} className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                      <h4 className="text-sm font-medium text-white">{friend.name}</h4>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                );
             })}
             {friends.filter(f => !chat.memberIds?.includes(f.id)).length === 0 && (
               <p className="text-center text-zinc-500 text-sm py-10">All your friends are already in this group!</p>
             )}
          </div>
        </div>
      )}

      {showRemoveMembersPanel && (
        <div className="absolute inset-0 z-[110] bg-[#0a0a0c] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#121214]">
            <div className="flex items-center gap-4">
              <button onClick={() => { setShowRemoveMembersPanel(false); setRemoveMemberSelections([]); }} className="p-2 text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] hover:bg-white/10 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-white">Remove Members</h2>
            </div>
            <button 
              onClick={() => setConfirmAction({
                type: 'remove_member',
                payload: removeMemberSelections,
                title: 'Remove Members',
                desc: `Are you sure you want to remove ${removeMemberSelections.length} members from the group?`,
                confirmText: 'Remove',
                confirmStyle: 'bg-red-500 hover:bg-red-600'
              })}
              disabled={removeMemberSelections.length === 0}
              className="px-5 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-2 [&::-webkit-scrollbar]:hidden">
             <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-500">{removeMemberSelections.length} selected</span>
             </div>
             {groupMembers.filter(f => f.id !== currentUser.id).map(member => {
                const isSelected = removeMemberSelections.includes(member.id);
                return (
                  <div key={member.id} onClick={() => toggleRemoveMember(member.id)} className="flex items-center justify-between p-3 hover:bg-[#1a1a1c] rounded-2xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                      <div className="flex flex-col">
                        <h4 className="text-sm font-medium text-white">{member.name}</h4>
                        {chat.adminIds?.includes(member.id) && <span className="text-[10px] text-emerald-400">Admin</span>}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-red-500 border-red-500' : 'border-zinc-600'}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                );
             })}
             {groupMembers.filter(f => f.id !== currentUser.id).length === 0 && (
               <p className="text-center text-zinc-500 text-sm py-10">You are the only member.</p>
             )}
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="absolute inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
             <h3 className="text-white font-semibold text-lg text-center">Leave Group</h3>
             <p className="text-sm text-zinc-400 text-center">Are you sure you want to leave {chat.name}?</p>
             <div className="flex gap-3 mt-2">
               <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-medium">Cancel</button>
               <button onClick={() => onLeaveGroup(chat.id)} className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-sm text-red-500 transition-colors font-medium">Leave</button>
             </div>
           </div>
        </div>
      )}

      {showDisconnectConfirm && !chat.isGroup && (
        <div className="absolute inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
             <h3 className="text-white font-semibold text-lg text-center">Remove Connection</h3>
             <p className="text-sm text-zinc-400 text-center">Are you sure you want to remove {chat.name} from your connections?</p>
             <div className="flex gap-3 mt-2">
               <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-medium">Cancel</button>
               <button onClick={() => onDisconnect(chat.id)} className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-sm text-red-500 transition-colors font-medium">Remove</button>
             </div>
           </div>
        </div>
      )}

      {showBlockConfirm && (
        <div className="absolute inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
             <h3 className="text-white font-semibold text-lg text-center">Block {chat.isGroup ? 'Group' : 'User'}</h3>
             <p className="text-sm text-zinc-400 text-center">Are you sure you want to block {chat.name}? You cannot be added back once blocked.</p>
             <div className="flex gap-3 mt-2">
               <button onClick={() => setShowBlockConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-medium">Cancel</button>
               <button onClick={() => onBlock(chat.id, chat.isGroup)} className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-sm text-red-500 transition-colors font-medium">Block</button>
             </div>
           </div>
        </div>
      )}

      {reportStep === 'category' && (
         <div className="absolute inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-3xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
              <h3 className="text-white font-semibold text-lg text-center">Report {chat.isGroup ? 'Group' : 'User'}</h3>
              <p className="text-sm text-zinc-400 text-center mb-2">Select a reason for reporting:</p>
              <div className="flex flex-col gap-2">
                {['Spam', 'Harassment', 'Inappropriate Content', 'Other'].map(cat => (
                  <button key={cat} onClick={() => { setReportCategory(cat); setReportStep('description'); }} className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm text-white text-left transition-colors">{cat}</button>
                ))}
              </div>
              <button onClick={() => setReportStep(null)} className="mt-2 py-2 text-sm text-zinc-500 hover:text-white transition-colors">Cancel</button>
           </div>
         </div>
      )}

      {reportStep === 'description' && (
         <div className="absolute inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#1a1a1c] border border-white/10 rounded-3xl p-6 shadow-2xl w-80 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
              <h3 className="text-white font-semibold text-lg text-center">Additional Details</h3>
              <p className="text-xs text-zinc-400 text-center">Help us understand the issue with {chat.name}</p>
              <textarea 
                value={reportDescription} 
                onChange={e => setReportDescription(e.target.value)} 
                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none mt-2 cursor-text"
                placeholder="Provide more context..."
              />
              <div className="flex gap-3 mt-4">
               <button onClick={() => setReportStep('category')} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white transition-colors font-medium">Back</button>
               <button 
                 onClick={() => {
                   onReport(chat.id, chat.isGroup, reportCategory, reportDescription);
                   setReportStep(null);
                   setReportCategory('');
                   setReportDescription('');
                 }} 
                 className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm text-white transition-colors font-medium shadow-lg shadow-red-500/20"
               >
                 Submit
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

// --- HELPERS ---
