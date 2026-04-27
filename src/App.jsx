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
  Eye
} from 'lucide-react';



// --- TIME FORMATTING HELPERS ---
const nowMs = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatStoryTime = (timestamp) => {
  if (!timestamp) return '';
  const diffMins = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
};

const formatDividerDate = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((nowStart.getTime() - dateStart.getTime()) / DAY);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const formatRecentChatTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((nowStart.getTime() - dateStart.getTime()) / DAY);

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const formatLastSeen = (lastSeen, isOnline) => {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Disabled';
  const now = new Date();
  const date = new Date(lastSeen);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / DAY);
  
  if (diffDays > 30) return 'Disabled';
  if (diffDays > 14) return 'A While Ago';
  if (diffDays > 7) return 'Last Week';
  
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const calendarDays = Math.round((nowStart.getTime() - dateStart.getTime()) / DAY);
  
  if (calendarDays === 0) return `Today At ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (calendarDays === 1) return `Yesterday At ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (calendarDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return 'Last Week';
};

// --- MOCK DATA ---
const currentUser = { 
  id: 0, 
  name: 'Alex Rivera', 
  handle: '@arivera',
  avatar: 'https://i.pravatar.cc/150?u=0',
  status: 'Online'
};

const gradients = [
  'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500',
  'bg-gradient-to-br from-blue-600 to-cyan-400',
  'bg-gradient-to-tr from-emerald-400 to-cyan-500',
  'bg-gradient-to-br from-rose-500 to-orange-400',
  'bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black',
];

const E = (hex) => String.fromCodePoint(parseInt(hex, 16));

const EMOJI_CATEGORIES = [
  { id: 'smileys', icon: E('1F600'), name: 'Smileys & People', emojis: [E('1F600'),E('1F602'),E('1F970'),E('1F60E'),E('1F913'),E('1F62D'),E('1F621'),E('1F44D'),E('1F64F'),E('1F525'),E('2728'),E('1F4AF'),E('1F64C'),E('1F44F'),E('1F496'),E('1F643'),E('1F644'),E('1F634')] },
  { id: 'animals', icon: E('1F436'), name: 'Animals & Nature', emojis: [E('1F436'),E('1F431'),E('1F98A'),E('1F43C'),E('1F981'),E('1F42F'),E('1F438'),E('1F435'),E('1F414'),E('1F427'),E('1F985'),E('1F424'),E('1F434'),E('1F984'),E('1F40D'),E('1F98B'),E('1F338'),E('1F31F')] },
  { id: 'food', icon: E('1F34E'), name: 'Food & Drink', emojis: [E('1F34E'),E('1F354'),E('1F355'),E('1F32E'),E('1F363'),E('1F369'),E('2615'),E('1F37A'),E('1F951'),E('1F966'),E('1F968'),E('1F969'),E('1F95E'),E('1F9C7'),E('1F35F'),E('1F377'),E('1F379'),E('1F349')] },
  { id: 'activities', icon: E('26BD'), name: 'Activities', emojis: [E('26BD'),E('1F3C0'),E('1F3C8'),E('1F3BE'),E('1F3AE'),E('1F3B8'),E('1F3B5'),E('1F3A8'),E('1F9E9'),E('1F3B3'),E('1F94A'),E('1F3D2'),E('1F3F8'),E('1F94B'),E('1F945'),E('1F3BF'),E('1F3C2'),E('1F3C6')] },
  { id: 'travel', icon: E('1F697'), name: 'Travel & Places', emojis: [E('1F697'),E('1F695'),E('2708'),E('1F680'),E('1F6A2'),E('1F3D6'),E('1F5FD'),E('1F5FC'),E('1F682'),E('1F68D'),E('1F6F6'),E('26F5'),E('1F6F3'),E('1F3A1'),E('1F3A2'),E('1F3D4'),E('1F3D5'),E('1F5FA')] },
  { id: 'objects', icon: E('1F4A1'), name: 'Objects', emojis: [E('231A'),E('1F4F1'),E('1F4BB'),E('1F4F7'),E('1F4A1'),E('1F4DA'),E('1F381'),E('1F388'),E('1F48E'),E('1F570'),E('1F4FA'),E('1F4FB'),E('1F4C0'),E('1F4FC'),E('1F50B'),E('1F6D2'),E('1FA84'),E('1F6D2')] },
];

const QUICK_REACTIONS = [E('1F44D'), E('2764'), E('1F602'), E('1F62E'), E('1F622'), E('1F64F')];

const generateStories = (name, count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${name.toLowerCase()}-story-${i}`,
    text: `A glimpse into ${name}'s day ${count > 1 ? `#${i + 1}` : ''}`,
    bgClass: gradients[Math.floor(Math.random() * gradients.length)],
    viewed: false,
    animationPlayed: false,
    views: [],
    timestamp: nowMs - (Math.random() * 23 * HOUR) 
  })).sort((a, b) => a.timestamp - b.timestamp);
};

const initialMyStories = [
  {
    id: 'my-story-mock-1',
    text: 'Just finished a great workout! ' + E('1F4AA'),
    bgClass: gradients[2],
    viewed: false,
    animationPlayed: false,
    timestamp: nowMs - 2 * HOUR,
    views: [
      { id: 1, name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=1', reaction: 'fire' },
      { id: 4, name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=4', reaction: 'love' },
      { id: 9, name: 'Emma', avatar: 'https://i.pravatar.cc/150?u=9', reaction: null },
      { id: 6, name: 'Anna', avatar: 'https://i.pravatar.cc/150?u=6', reaction: 'laugh' },
      { id: 2, name: 'Lucas', avatar: 'https://i.pravatar.cc/150?u=2', reaction: 'fire' },
      { id: 5, name: 'Mike', avatar: 'https://i.pravatar.cc/150?u=5', reaction: null },
      { id: 8, name: 'David', avatar: 'https://i.pravatar.cc/150?u=8', reaction: 'laugh' },
      { id: 10, name: 'James', avatar: 'https://i.pravatar.cc/150?u=10', reaction: null },
      { id: 11, name: 'Lily', avatar: 'https://i.pravatar.cc/150?u=11', reaction: 'love' },
      { id: 12, name: 'Tom', avatar: 'https://i.pravatar.cc/150?u=12', reaction: null },
      { id: 15, name: 'Maya', avatar: 'https://i.pravatar.cc/150?u=15', reaction: 'fire' },
      { id: 18, name: 'Ethan', avatar: 'https://i.pravatar.cc/150?u=18', reaction: 'laugh' },
      { id: 22, name: 'William', avatar: 'https://i.pravatar.cc/150?u=22', reaction: null },
      { id: 26, name: 'Elijah', avatar: 'https://i.pravatar.cc/150?u=26', reaction: 'love' },
    ]
  }
];

const initialFriends = [
  { id: 1, name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=1', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Elena', 3), username: 'elena.rod', phone: '+1 (555) 012-3456', bio: 'UI/UX designer & coffee lover. Currently obsessed with design systems.', mutualFriendIds: [4, 8, 6, 9, 5, 10, 7] },
  { id: 2, name: 'Lucas', avatar: 'https://i.pravatar.cc/150?u=2', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Lucas', 2), username: 'lucasdev', phone: '+1 (555) 023-4567', bio: 'Full-stack developer. Building cool stuff with React and Node.', mutualFriendIds: [5, 9, 18, 24] },
  { id: 3, name: 'Sophia', avatar: 'https://i.pravatar.cc/150?u=3', storyType: 'private', isOnline: false, lastSeen: nowMs - 2 * HOUR, storyViewed: false, stories: generateStories('Sophia', 4), username: 'sophiaarts', phone: '+1 (555) 034-5678', bio: 'Digital artist and illustrator. Open for commissions!', mutualFriendIds: [6, 14, 25] },
  { id: 4, name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=4', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Sarah', 1), username: 'sarah.j', phone: '+1 (555) 045-6789', bio: 'Frontend engineer @ TechCorp. Tailwind enthusiast.', mutualFriendIds: [1, 8, 23, 9, 6, 24] },
  { id: 5, name: 'Mike', avatar: 'https://i.pravatar.cc/150?u=5', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Mike', 2), username: 'mikebuilds', phone: '+1 (555) 056-7890', bio: 'Product manager by day, gamer by night.', mutualFriendIds: [1, 2, 7, 10, 22] },
  { id: 6, name: 'Anna', avatar: 'https://i.pravatar.cc/150?u=6', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Anna', 2), username: 'annadesign', phone: '+1 (555) 067-8901', bio: 'Visual designer. Minimalism is the ultimate sophistication.', mutualFriendIds: [1, 3, 9, 4, 25, 14] },
  { id: 16, name: 'Oliver', avatar: 'https://i.pravatar.cc/150?u=16', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Oliver', 3), username: 'oliver.k', phone: '+1 (555) 160-1234', bio: 'Backend engineer. Rust and Go advocate.', mutualFriendIds: [18, 8, 10] },
  { id: 17, name: 'Isabella', avatar: 'https://i.pravatar.cc/150?u=17', storyType: 'private', isOnline: false, lastSeen: nowMs - 3 * DAY, storyViewed: false, stories: generateStories('Isabella', 1), username: 'isabella_m', phone: '+1 (555) 170-2345', bio: 'Data scientist exploring the world of ML.', mutualFriendIds: [26, 18] },
  { id: 7, name: 'Chris', avatar: 'https://i.pravatar.cc/150?u=7', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Chris', 1), username: 'chriscode', phone: '+1 (555) 078-9012', bio: 'DevOps wizard. Automating everything.', mutualFriendIds: [1, 5, 10, 8] },
  { id: 8, name: 'David', avatar: 'https://i.pravatar.cc/150?u=8', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('David', 3), username: 'davidchen', phone: '+1 (555) 089-0123', bio: 'API architect. Building the backend of the future.', mutualFriendIds: [1, 4, 7, 16, 10] },
  { id: 9, name: 'Emma', avatar: 'https://i.pravatar.cc/150?u=9', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Emma', 4), username: 'emmawilson', phone: '+1 (555) 090-1234', bio: 'React Native dev. Mobile-first mindset.', mutualFriendIds: [1, 2, 4, 6, 19] },
  { id: 18, name: 'Ethan', avatar: 'https://i.pravatar.cc/150?u=18', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Ethan', 2), username: 'ethan.dev', phone: '+1 (555) 180-3456', bio: 'Systems programmer. Low-level is the best level.', mutualFriendIds: [2, 16, 17, 26] },
  { id: 10, name: 'James', avatar: 'https://i.pravatar.cc/150?u=10', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('James', 3), username: 'jameslee', phone: '+1 (555) 101-2345', bio: 'Cloud architect @ AWS. Distributed systems fan.', mutualFriendIds: [1, 5, 7, 8, 16, 12] },
  { id: 11, name: 'Lily', avatar: 'https://i.pravatar.cc/150?u=11', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Lily', 2), username: 'lilyhikes', phone: '+1 (555) 112-3456', bio: 'Outdoor enthusiast and nature photographer.', mutualFriendIds: [15, 21, 13] },
  { id: 19, name: 'Mia', avatar: 'https://i.pravatar.cc/150?u=19', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Mia', 1), username: 'mia.creates', phone: '+1 (555) 190-4567', bio: 'Content creator and social media strategist.', mutualFriendIds: [9, 23, 25] },
  { id: 12, name: 'Tom', avatar: 'https://i.pravatar.cc/150?u=12', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Tom', 2), username: 'tomwrites', phone: '+1 (555) 123-4567', bio: 'Technical writer. Making docs people actually read.', mutualFriendIds: [10, 13, 20] },
  { id: 13, name: 'Nina', avatar: 'https://i.pravatar.cc/150?u=13', storyType: 'standard', isOnline: false, lastSeen: nowMs - 10 * DAY, storyViewed: false, stories: generateStories('Nina', 1), username: 'ninapm', phone: '+1 (555) 134-5678', bio: 'Project manager keeping teams in sync.', mutualFriendIds: [11, 12, 15] },
  { id: 14, name: 'Leo', avatar: 'https://i.pravatar.cc/150?u=14', storyType: 'private', isOnline: false, lastSeen: nowMs - 20 * DAY, storyViewed: false, stories: generateStories('Leo', 2), username: 'leomotion', phone: '+1 (555) 145-6789', bio: 'Motion designer and animator. After Effects wizard.', mutualFriendIds: [3, 6, 25] },
  { id: 15, name: 'Maya', avatar: 'https://i.pravatar.cc/150?u=15', storyType: 'standard', isOnline: false, lastSeen: nowMs - 45 * DAY, storyViewed: false, stories: generateStories('Maya', 2), username: 'mayatrails', phone: '+1 (555) 156-7890', bio: 'Trail runner and adventure seeker.', mutualFriendIds: [11, 13, 21] },
  { id: 20, name: 'Noah', avatar: 'https://i.pravatar.cc/150?u=20', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Noah', 1), username: 'noahcodes', phone: '+1 (555) 200-5678', bio: 'Indie hacker building micro-SaaS products.', mutualFriendIds: [12, 24, 2] },
  { id: 21, name: 'Ava', avatar: 'https://i.pravatar.cc/150?u=21', storyType: 'private', isOnline: false, lastSeen: nowMs - 1 * DAY - 5 * HOUR, storyViewed: false, stories: generateStories('Ava', 2), username: 'avagreen', phone: '+1 (555) 210-6789', bio: 'Environmental scientist and sustainability advocate.', mutualFriendIds: [11, 15] },
  { id: 22, name: 'William', avatar: 'https://i.pravatar.cc/150?u=22', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('William', 3), username: 'willcraft', phone: '+1 (555) 220-7890', bio: 'Game developer. Unity & Unreal Engine.', mutualFriendIds: [5, 26, 18] },
  { id: 23, name: 'Charlotte', avatar: 'https://i.pravatar.cc/150?u=23', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Charlotte', 1), username: 'charlotteux', phone: '+1 (555) 230-8901', bio: 'UX researcher. Understanding users is my superpower.', mutualFriendIds: [4, 19, 1, 6] },
  { id: 24, name: 'Benjamin', avatar: 'https://i.pravatar.cc/150?u=24', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Benjamin', 2), username: 'benstack', phone: '+1 (555) 240-9012', bio: 'Full-stack TypeScript developer. Next.js fanatic.', mutualFriendIds: [2, 4, 20] },
  { id: 25, name: 'Amelia', avatar: 'https://i.pravatar.cc/150?u=25', storyType: 'standard', isOnline: false, lastSeen: nowMs - 5 * DAY, storyViewed: false, stories: generateStories('Amelia', 1), username: 'ameliaink', phone: '+1 (555) 250-0123', bio: 'Graphic designer and brand identity specialist.', mutualFriendIds: [3, 6, 14, 19] },
  { id: 26, name: 'Elijah', avatar: 'https://i.pravatar.cc/150?u=26', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Elijah', 2), username: 'elijahml', phone: '+1 (555) 260-1234', bio: 'Machine learning engineer. Building intelligent systems.', mutualFriendIds: [17, 18, 22] },
];

const initialGroups = [
  { id: 1001, name: 'Announcements', description: 'Community broadcast channel.', members: 4, memberIds: [0, 1, 4, 8, 6, 9, 12], adminIds: [0], unread: 2, icon: 'bg-indigo-700', isGroup: true, onlyAdminsCanMessage: true, pinnedMessage: null, isBroadcast: true },
  { id: 1002, name: 'Announcements', description: 'Community broadcast channel.', members: 5, memberIds: [0, 11, 15, 1, 5, 7, 10], adminIds: [0], unread: 0, icon: 'bg-rose-700', isGroup: true, onlyAdminsCanMessage: true, pinnedMessage: null, isBroadcast: true },
  { id: 101, name: 'Design System Team', description: 'Core UI/UX discussions and system updates.', members: 4, memberIds: [0, 1, 4, 8], adminIds: [0], unread: 3, icon: 'bg-purple-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 102, name: 'Frontend Guild', description: 'React, Tailwind, and Web Dev.', members: 3, memberIds: [0, 6, 9], adminIds: [6], unread: 0, icon: 'bg-blue-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 103, name: 'Weekend Hikers', description: 'Planning weekend hiking trips.', members: 3, memberIds: [0, 11, 15], adminIds: [11], unread: 1, icon: 'bg-emerald-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 104, name: 'Project Alpha', description: 'Confidential project alpha syncs.', members: 2, memberIds: [0, 12], adminIds: [0, 12], unread: 5, icon: 'bg-orange-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 105, name: 'Coffee Enthusiasts', description: 'Discussing the best local brews.', members: 5, memberIds: [0, 1, 5, 7, 10], adminIds: [5], unread: 0, icon: 'bg-amber-700', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
];

const mockChannels = [
  { id: 201, name: 'announcements', members: 1200, type: 'channel' },
  { id: 202, name: 'general', members: 850, type: 'channel' },
  { id: 203, name: 'design-inspo', members: 430, type: 'channel' },
];

const initialCommunities = [
  { id: 'com1', name: 'Tech Innovators', short: 'TI', icon: 'bg-indigo-600', groupIds: [1001, 101, 102, 104] },
  { id: 'com2', name: 'Social Club', short: 'SC', icon: 'bg-rose-600', groupIds: [1002, 103, 105] },
];

const initialGlobalUsers = [
  { id: 301, name: 'John Doe', handle: '@johnd', avatar: 'https://i.pravatar.cc/150?u=301', status: 'Offline', isConnected: false, mutualFriendIds: [1, 4, 8] },
  { id: 302, name: 'Jane Smith', handle: '@janes', avatar: 'https://i.pravatar.cc/150?u=302', status: 'Online', isConnected: false, mutualFriendIds: [9, 6] },
  { id: 303, name: 'Alice Johnson', handle: '@alicej', avatar: 'https://i.pravatar.cc/150?u=303', status: 'Offline', isConnected: false, mutualFriendIds: [2, 5, 11, 12] },
  { id: 304, name: 'Michael Ross', handle: '@miker', avatar: 'https://i.pravatar.cc/150?u=304', status: 'Online', isConnected: false, mutualFriendIds: [1] },
];

const initialReceivedRequests = [
  { id: 401, name: 'Marcus Chen', handle: '@marcus_c', avatar: 'https://i.pravatar.cc/150?u=401', status: 'Online' },
  { id: 402, name: 'Olivia Wang', handle: '@oliviaw', avatar: 'https://i.pravatar.cc/150?u=402', status: 'Offline' }
];

const mockCallLogs = [
  {
    id: 'call-1',
    type: 'individual',
    name: 'Elena Rodriguez',
    avatar: 'https://i.pravatar.cc/150?u=1',
    history: [
      { id: 'h1', callType: 'video', direction: 'missed', time: 'Today, 2:30 PM', duration: 'Unanswered' },
      { id: 'h2', callType: 'voice', direction: 'outgoing', time: 'Yesterday, 4:15 PM', duration: '12m 45s' },
      { id: 'h3', callType: 'video', direction: 'incoming', time: 'Monday, 9:00 AM', duration: '45m 10s' },
    ]
  },
  {
    id: 'call-2',
    type: 'group',
    name: 'Design System Team',
    icon: 'bg-purple-500',
    history: [
      { id: 'h4', callType: 'video', direction: 'incoming', time: 'Yesterday, 10:00 AM', duration: '1h 15m' },
    ]
  },
  {
    id: 'call-3',
    type: 'individual',
    name: 'David Chen',
    avatar: 'https://i.pravatar.cc/150?u=8',
    history: [
      { id: 'h5', callType: 'voice', direction: 'outgoing', time: 'Tuesday, 6:20 PM', duration: '2m 10s' },
      { id: 'h6', callType: 'voice', direction: 'missed', time: 'Tuesday, 6:15 PM', duration: 'Unanswered' },
    ]
  },
  {
    id: 'call-4',
    type: 'individual',
    name: 'Sarah Jenkins',
    avatar: 'https://i.pravatar.cc/150?u=4',
    history: [
      { id: 'h7', callType: 'voice', direction: 'incoming', time: 'Oct 12, 11:30 AM', duration: '5m 22s' },
      { id: 'h8', callType: 'video', direction: 'outgoing', time: 'Oct 10, 8:00 PM', duration: '1h 5m' },
      { id: 'h9', callType: 'voice', direction: 'outgoing', time: 'Oct 9, 2:15 PM', duration: '1m 12s' },
      { id: 'h10', callType: 'voice', direction: 'missed', time: 'Oct 9, 2:10 PM', duration: 'Unanswered' },
      { id: 'h11', callType: 'video', direction: 'missed', time: 'Oct 8, 9:00 AM', duration: 'Unanswered' },
      { id: 'h12', callType: 'voice', direction: 'incoming', time: 'Oct 1, 1:00 PM', duration: '10m 00s' },
    ]
  }
];

const initialRecent = [
  {
    id: 104,
    isGroup: true,
    name: 'Project Alpha',
    icon: 'bg-orange-500',
    lastMessage: 'Let\'s keep this project under wraps.',
    timestamp: nowMs - 20 * DAY + 5 * MIN,
    unread: 5,
  },
  {
    id: 1,
    name: 'Elena Rodriguez',
    avatar: 'https://i.pravatar.cc/150?u=1',
    status: 'online',
    lastMessage: 'The new design system looks incredible!',
    timestamp: nowMs - 2 * MIN,
    unread: 2,
  },
  {
    id: 101,
    isGroup: true,
    name: 'Design System Team',
    icon: 'bg-purple-500',
    lastMessage: 'Will do! Thanks for the reminder.',
    timestamp: nowMs - 5 * MIN,
    unread: 3,
  },
  {
    id: 105,
    isGroup: true,
    name: 'Coffee Enthusiasts',
    icon: 'bg-amber-700',
    lastMessage: 'Count me in!',
    timestamp: nowMs - 2 * DAY + 15 * MIN,
    unread: 0,
  },
  {
    id: 8,
    name: 'David Chen',
    avatar: 'https://i.pravatar.cc/150?u=8',
    status: 'away',
    lastMessage: 'I will push the API updates tonight.',
    timestamp: nowMs - 1 * DAY - 2 * HOUR,
    unread: 0,
  },
  {
    id: 102,
    isGroup: true,
    name: 'Frontend Guild',
    icon: 'bg-blue-500',
    lastMessage: 'Glad to be here!',
    timestamp: nowMs - 10 * DAY + 10 * MIN,
    unread: 0,
  },
  {
    id: 103,
    isGroup: true,
    name: 'Weekend Hikers',
    icon: 'bg-emerald-500',
    lastMessage: 'Trail is closed tomorrow.',
    timestamp: nowMs - 4 * DAY,
    unread: 1,
  },
  {
    id: 4,
    name: 'Sarah Jenkins',
    avatar: 'https://i.pravatar.cc/150?u=4',
    status: 'online',
    lastMessage: 'Could you send over the hex codes?',
    timestamp: nowMs - 40 * DAY,
    unread: 5,
  }
];

const initialChats = [
  {
    id: 1,
    name: 'Elena Rodriguez',
    avatar: 'https://i.pravatar.cc/150?u=1',
    status: 'online',
    messages: [
      { id: 101, senderId: 1, text: 'Hey, did you get a chance to look at the Figma file?', timestamp: nowMs - 1 * DAY - 30 * MIN },
      { id: 102, senderId: 0, text: 'Just opening it now.', timestamp: nowMs - 1 * DAY - 25 * MIN, status: 'read' },
      { id: 103, senderId: 1, text: 'That workout story was intense!', timestamp: nowMs - 5 * MIN, storyReply: { storyId: 'my-story-mock-1', storyText: 'Just finished a great workout! ' + E('1F4AA'), storyBg: gradients[2], storyOwnerName: 'You', storyOwnerId: 0 } },
      { id: 104, senderId: 1, text: 'The new design system looks incredible!', timestamp: nowMs - 2 * MIN },
    ]
  },
  {
    id: 101,
    isGroup: true,
    name: 'Design System Team',
    icon: 'bg-purple-500',
    messages: [
      { id: 1009, type: 'system', actorId: 0, text: 'created the group', timestamp: nowMs - 4 * HOUR },
      { id: 10091, type: 'system', actorId: 0, text: 'added Elena, Sarah, Mike, David', timestamp: nowMs - 3.99 * HOUR },
      { id: 1010, type: 'system', actorId: 5, text: 'left', timestamp: nowMs - 3.5 * HOUR },
      { id: 1011, senderId: 4, text: 'The new button components are ready.', timestamp: nowMs - 3 * HOUR },
      { id: 1012, senderId: 8, text: 'Awesome, I will review them now.', timestamp: nowMs - 2 * HOUR - 30 * MIN },
      { id: 1013, senderId: 1, text: 'Anyone checked the new Figma?', timestamp: nowMs - 2 * HOUR },
      { id: 1014, senderId: 8, text: 'Yeah, looks good to me.', timestamp: nowMs - 1 * HOUR - 55 * MIN },
      { id: 1015, senderId: 4, text: 'I left some comments on the padding.', timestamp: nowMs - 1 * HOUR - 40 * MIN },
      { id: 1016, senderId: 0, text: 'I will address the padding feedback shortly.', timestamp: nowMs - 1 * HOUR - 10 * MIN, status: 'read' },
      { id: 1017, senderId: 1, text: 'Great. Let us target deployment by EOD.', timestamp: nowMs - 45 * MIN },
      { id: 1018, senderId: 8, text: 'Sounds like a plan.', timestamp: nowMs - 30 * MIN },
      { id: 1019, senderId: 4, text: 'Remember to update the design system docs too.', timestamp: nowMs - 15 * MIN },
      { id: 1020, senderId: 1, text: 'Will do! Thanks for the reminder.', timestamp: nowMs - 5 * MIN },
    ]
  },
  {
    id: 102,
    isGroup: true,
    name: 'Frontend Guild',
    icon: 'bg-blue-500',
    messages: [
      { id: 1020, type: 'system', actorId: 6, text: 'created the group', timestamp: nowMs - 10 * DAY },
      { id: 1021, type: 'system', actorId: 6, text: 'added you and Emma', timestamp: nowMs - 10 * DAY + 2 * MIN },
      { id: 1022, senderId: 6, text: 'Welcome to the guild!', timestamp: nowMs - 10 * DAY + 5 * MIN },
      { id: 1023, senderId: 9, text: 'Glad to be here!', timestamp: nowMs - 10 * DAY + 10 * MIN },
      { id: 1024, senderId: 9, text: 'Have you guys seen this new React compiler update?', timestamp: nowMs - 10 * DAY + 15 * MIN, forwardCount: 3 },
      { id: 1025, senderId: 9, text: 'CONGRATULATIONS YOU WON A $1000 GIFTCARD CLICK THIS RUMOUR SPAM LINK', timestamp: nowMs - 10 * DAY + 25 * MIN, forwardCount: 15 }
    ]
  },
  {
    id: 8,
    name: 'David Chen',
    avatar: 'https://i.pravatar.cc/150?u=8',
    status: 'away',
    messages: [
      { id: 301, senderId: 8, text: 'I will push the API updates tonight.', timestamp: nowMs - 1 * DAY - 2 * HOUR },
    ]
  },
  {
    id: 103,
    isGroup: true,
    name: 'Weekend Hikers',
    icon: 'bg-emerald-500',
    messages: [
      { id: 1030, type: 'system', actorId: 11, text: 'created the group', timestamp: nowMs - 6 * DAY },
      { id: 10301, type: 'system', actorId: 11, text: 'added you and Maya', timestamp: nowMs - 6 * DAY + MIN },
      { id: 1031, senderId: 11, text: 'Are we still on for Saturday?', timestamp: nowMs - 5 * DAY },
      { id: 1032, senderId: 15, text: 'Trail is closed tomorrow.', timestamp: nowMs - 4 * DAY },
    ]
  },
  {
    id: 104,
    isGroup: true,
    name: 'Project Alpha',
    icon: 'bg-orange-500',
    messages: [
      { id: 1040, type: 'system', actorId: 12, text: 'created the group', timestamp: nowMs - 20 * DAY },
      { id: 1041, type: 'system', actorId: 12, text: 'added you', timestamp: nowMs - 20 * DAY + MIN },
      { id: 1042, type: 'system', actorId: 12, text: 'made you an Admin', timestamp: nowMs - 20 * DAY + 2 * MIN },
      { id: 1043, senderId: 12, text: 'Let\'s keep this project under wraps.', timestamp: nowMs - 20 * DAY + 5 * MIN },
    ]
  },
  {
    id: 105,
    isGroup: true,
    name: 'Coffee Enthusiasts',
    icon: 'bg-amber-700',
    messages: [
      { id: 1050, type: 'system', actorId: 5, text: 'created the group', timestamp: nowMs - 30 * DAY },
      { id: 1051, type: 'system', actorId: 5, text: 'added you, Elena, Chris, James', timestamp: nowMs - 30 * DAY + MIN },
      { id: 1052, senderId: 5, text: 'Who wants to do a coffee run?', timestamp: nowMs - 2 * DAY },
      { id: 1053, senderId: 1, text: 'Count me in!', timestamp: nowMs - 2 * DAY + 15 * MIN },
    ]
  },
  {
    id: 4,
    name: 'Sarah Jenkins',
    avatar: 'https://i.pravatar.cc/150?u=4',
    status: 'online',
    messages: [
      { id: 400, senderId: 4, text: 'Hey Alex!', timestamp: nowMs - 40 * DAY - 10 * MIN },
      { id: 401, senderId: 4, text: 'Could you send over the hex codes?', timestamp: nowMs - 40 * DAY },
    ]
  },
  {
    id: 1001,
    isGroup: true,
    name: 'Announcements',
    icon: 'bg-indigo-700',
    messages: [
      { id: 9001, type: 'system', actorId: 0, text: 'created the broadcast channel', timestamp: nowMs - 7 * DAY },
      { id: 9002, senderId: 0, text: 'Welcome to the Tech Innovators community! This is the official broadcast channel.', timestamp: nowMs - 7 * DAY + 5 * MIN, status: 'read' },
      { id: 9003, senderId: 0, text: 'Reminder: Team sync is tomorrow at 10 AM.', timestamp: nowMs - 1 * DAY, status: 'read' },
      { id: 9004, senderId: 0, text: 'We just shipped v2.0 of the design system! ' + E('1F389'), timestamp: nowMs - 2 * HOUR, status: 'read' },
    ]
  },
  {
    id: 1002,
    isGroup: true,
    name: 'Announcements',
    icon: 'bg-rose-700',
    messages: [
      { id: 9010, type: 'system', actorId: 0, text: 'created the broadcast channel', timestamp: nowMs - 14 * DAY },
      { id: 9011, senderId: 0, text: 'Welcome to Social Club community!', timestamp: nowMs - 14 * DAY + 5 * MIN, status: 'read' },
    ]
  }
];

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
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [appToast, setAppToast] = useState('');
  
  const [friends, setFriends] = useState(initialFriends);
  const [groups, setGroups] = useState(initialGroups);
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

  const showGlobalToast = (msg) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(''), 3000);
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

  const handleSendMessageGlobal = useCallback((userId, text, replyTo = null, customPayload = null, storyReply = null) => {
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
      ...(storyReply ? { storyReply } : {})
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

    setRecentConversations(prev => {
      const existingRecent = prev.find(c => c.id === userId);
      if (existingRecent) {
        const filtered = prev.filter(c => c.id !== userId);
        if (isDisappearing) {
          // Keep old lastMessage, just bump to top
          return [{ ...existingRecent, timestamp: Date.now(), unread: 0 }, ...filtered];
        }
        return [{ ...existingRecent, lastMessage: text, timestamp: Date.now(), unread: 0 }, ...filtered];
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
        id: userId, name, avatar, status, isGroup, icon, lastMessage: isDisappearing ? '' : text, timestamp: Date.now(), unread: 0
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
  
    if (isGroup) {
      setGroups(prev => prev.filter(g => g.id !== id));
      showGlobalToast('Group blocked. You cannot be added back.');
    } else {
      setFriends(prev => prev.filter(f => f.id !== id));
      showGlobalToast('User blocked.');
    }
    setRecentConversations(prev => prev.filter(c => c.id !== id));
    setChatDetails(prev => prev.filter(c => c.id !== id));
    setSelectedChatId(null);
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
            />
          </div>

          <div className={`absolute inset-0 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center text-zinc-500 pb-32 ${
            activeNav === 'settings' ? 'opacity-100 translate-y-0  scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-[0.98]'
          }`}>
            Building the settings module...
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
        ((selectedChatId && !isChatClosing) || isGlobalOverlayActive || showNewChatModal || forwardingMsg) 
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

// --- VIEWS ---

function NewChatModal({ isOpen, onClose, friends, onStartChat, onCreateGroup }) {
  const [mode, setMode] = useState('select-type'); // 'select-type', 'select-members', 'name-group'
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState('');
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
            onClick={() => onCreateGroup(groupName, selectedFriends)}
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
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group Subject"
              autoFocus
              className="w-full max-w-sm bg-transparent border-b border-white/20 text-center text-2xl text-white placeholder-zinc-600 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-text"
            />
            
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

function CallsView({ callLogs, friends, groups, onOverlayChange, isActive }) {
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

function RequestsView({ sentReqs, receivedReqs, onAccept, onReject, onWithdraw }) {
  const [tab, setTab] = useState('received');

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <header className="px-6 py-6 md:px-0 flex items-center min-h-[94px] flex-shrink-0">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Requests</h1>
      </header>

      <div className="flex px-6 md:px-0 mb-6 gap-4 sm:gap-6 border-b border-white/10 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full max-w-full">
        <button 
          onClick={() => setTab('received')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'received' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Received ({receivedReqs.length})
          {tab === 'received' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setTab('sent')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'sent' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Sent ({sentReqs.length})
          {tab === 'sent' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-0 space-y-3 pb-24 [&::-webkit-scrollbar]:hidden">
        {tab === 'received' ? (
          receivedReqs.length > 0 ? (
            receivedReqs.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} alt={req.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h4 className="text-sm font-medium text-white">{req.name}</h4>
                    <p className="text-xs text-zinc-500">{req.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onReject(req.id)} 
                    className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => onAccept(req.id)} 
                    className="px-4 py-2 rounded-full text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
              <Users size={40} className="opacity-20" />
              <p>No incoming connection requests.</p>
            </div>
          )
        ) : (
          sentReqs.length > 0 ? (
            sentReqs.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} alt={req.name} className="w-12 h-12 rounded-full grayscale opacity-70" />
                  <div>
                    <h4 className="text-sm font-medium text-white">{req.name}</h4>
                    <p className="text-xs text-zinc-500">{req.handle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onWithdraw(req.id)} 
                  className="px-4 py-2 rounded-full text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
              <Send size={40} className="opacity-20" />
              <p>No outgoing connection requests.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CreateStoryModal({ onClose, onPost }) {
  const [text, setText] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const currentBg = gradients[bgIndex];

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

        <div className="flex-1 flex items-center justify-center p-8">
          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tap to type..."
            autoFocus
            className="w-full bg-transparent text-center text-3xl sm:text-4xl font-bold text-white placeholder-white/50 focus:outline-none resize-none drop-shadow-lg cursor-text break-words"
            rows={5}
          />
        </div>

        <div className="p-6 pb-12 flex justify-end items-center">
          <button 
            onClick={() => onPost({ text, bgClass: currentBg, timestamp: Date.now() })} 
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

function HomeDashboard({ onSelectChat, globalUsers, sentReqs, onSendReq, onWithdrawReq, friends, setFriends, groups, receivedReqs, onAcceptReq, onRejectReq, myStories, setMyStories, recentConversations, typingIndicators, chatDetails, onSendMessage, onOverlayChange }) {
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
            <p className={`text-sm truncate ${chat.unread > 0 || isTyping ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
              {isTyping ? (
                <span className="text-emerald-400 font-medium">{typingText}</span>
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
                                    <span className="text-[10px] text-zinc-600">·</span>
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
                  <div className="flex flex-col gap-1">
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

function StoryViewer({ friend, onClose, onNextUser, onPrevUser, hasNextUser, hasPrevUser, shouldStopAutoAdvance, onDeleteStory, onMarkViewed, onMarkAnimationPlayed, onSendMessage, onReactToStory, onViewProfile }) {
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
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[110] bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300">
            Message delivered
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
          <div className={`text-3xl sm:text-4xl font-bold text-white/90 text-center px-6 leading-relaxed drop-shadow-lg break-words`}>
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
                <Send className="w-4 h-4 md:w-3.5 md:h-3.5 translate-x-[1px] translate-y-[1px]" />
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

function ReceiptIndicator({ status }) {
  if (!status) return null;
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-0 ml-1" title="Sent">
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500" /></svg>
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center -space-x-1 ml-1" title="Delivered">
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400" /></svg>
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400" /></svg>
      </span>
    );
  }
  if (status === 'read') {
    return (
      <span className="inline-flex items-center -space-x-1 ml-1" title="Read">
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.5" fill="currentColor" className="text-indigo-400" /></svg>
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.5" fill="currentColor" className="text-indigo-400" /></svg>
      </span>
    );
  }
  return null;
}

function ChatView({ chat, onBack, sentReqs, onSendReq, onWithdrawReq, receivedReqs, onAcceptReq, onRejectReq, onSendMessage, onReactToMessage, friends, typingIndicators, onTyping, onLeaveGroup, onBlock, onReport, onDisconnect, onUpdateGroupInfo, onRemoveMembers, onToggleAdmin, onAddMembers, onDeleteMessage, onStartChat, onPinMessage, onToggleAdminMessaging, onToggleStarMessage, onForwardMessage, groups, globalUsers, disappearingChat, onToggleDisappearing, onUpdateMessageStatus }) {
  const [inputText, setInputText] = useState('');
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
  const [replyingTo, setReplyingTo] = useState(null); // { id, text, senderId }
  const [reactionPopupId, setReactionPopupId] = useState(null);
  const [activeMsgId, setActiveMsgId] = useState(null);
  
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState(null);

  const scrollContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const prevMsgCountRef = useRef(chat.messages?.length || 0);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const messages = chat.messages || [];

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

  // Simulate receipt progression: sent → delivered → read
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
    setInputText(e.target.value);
    
    if (chat.isConnected || chat.isGroup) {
      onTyping(chat.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(chat.id, false);
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    onSendMessage(chat.id, inputText, replyingTo);
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    
    onTyping(chat.id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleSaveName = () => {
    if (!editName.trim()) return;
    onUpdateGroupInfo(chat.id, editName, chat.description);
    setIsEditingName(false);
  };

  const handleSaveDesc = () => {
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

      <header className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
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
                <div className="fixed inset-0 z-[110]" onClick={() => setShowMoreMenu(false)}></div>
                <div className="absolute top-12 right-0 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl w-48 z-[120] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col py-1">
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

      <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden p-6 space-y-6 relative" style={{ scrollBehavior: 'auto', ...(disappearingChat?.enabled ? { userSelect: 'none', WebkitUserSelect: 'none' } : {}) }} onClick={() => setActiveMsgId(null)}>
        
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
          const isNearBottom = idx >= groupedMessages.length - 3;

          return (
            <div key={msg.id} id={`message-${msg.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group/msg ${hasReactions ? 'mb-4' : 'mb-1'} ${activeMsgId === msg.id ? 'relative z-50' : 'relative z-10'}`}>
              {!isMe && (
                <div className="w-8">
                  {msg.showAvatar && <img src={chat.isGroup ? (friends.find(f=>f.id===msg.senderId)?.avatar || chat.avatar) : chat.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />}
                </div>
              )}
              
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] lg:max-w-[60%]`}>
                <div 
                  className={`flex items-center gap-2 group/msgwrap relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  
                  {/* Message Actions Dropdown */}
                  {!msg.isDeleted && activeMsgId === msg.id && (
                    <div className={`absolute ${isNearBottom ? 'bottom-[105%]' : 'top-[105%]'} ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a1c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 flex flex-col py-1.5 min-w-[160px]`}>
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
                  )}

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
                  ) : (
                    <div id={`bubble-${msg.id}`} className={`group/bubble px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative flex flex-col transition-[background-color,box-shadow,transform] duration-500 ease-out ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-[#1e1e24] text-zinc-100 rounded-bl-sm border border-white/[0.02]'}`}>
                      
                      {/* Forwarded Status */}
                      {msg.forwardCount > 0 && (
                        <div className="flex items-center gap-1 mb-1 text-[10px] text-white/50 font-medium tracking-wide">
                           {msg.forwardCount > 10 ? (
                             <><AlertTriangle size={12} className="text-yellow-500/80" /> <span className="text-yellow-500/80">Forwarded many times (Potential spam)</span></>
                           ) : (
                             <><Forward size={12} /> Forwarded</>
                           )}
                        </div>
                      )}

                      {/* Story Reply Context */}
                      {msg.storyReply && (
                        <div className="rounded-lg mb-1.5 max-w-full overflow-hidden flex gap-2 items-stretch">
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

                      <div className="pr-5 mt-0.5">
                        <span className="break-words leading-relaxed">{msg.text}</span>
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
                  )}

                </div>
                <span className="text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-0.5">
                  {chat.isGroup && !isMe && msg.showAvatar && <span className="font-medium mr-2">{friends.find(f=>f.id===msg.senderId)?.name.split(' ')[0]}</span>}
                  {formatMessageTime(msg.timestamp)}
                  {isMe && <ReceiptIndicator status={msg.status} />}
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

          {/* EMOJI TRAY */}
          {showEmojiPicker && (
            <div className="absolute bottom-[100%] left-0 w-full md:w-[350px] md:left-6 h-80 mb-2 bg-[#1a1a1c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-[70] overflow-hidden animate-in slide-in-from-bottom-4">
               {/* ACCURACY FIX: Added explicit close button header */}
               <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5">
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Emojis</span>
                 <button 
                   type="button" 
                   onClick={() => setShowEmojiPicker(false)} 
                   className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                   title="Close Emojis"
                 >
                   <X size={16} />
                 </button>
               </div>
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
                           container.scrollTo({
                             top: target.offsetTop,
                             behavior: 'smooth'
                           });
                         }
                       }} 
                       className="text-xl p-1.5 opacity-50 hover:opacity-100 transition-opacity hover:bg-white/5 rounded-lg"
                       title={cat.name}
                     >
                       {cat.icon}
                     </button>
                  ))}
               </div>
            </div>
          )}

          {/* Form Input */}
          {!canMessage ? (
            <div className="flex items-center justify-center p-3 text-sm text-zinc-500 bg-[#1e1e24] border border-white/[0.05] rounded-full relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
              Only admins can send messages in this group
            </div>
          ) : (
            <form 
              onSubmit={handleSend}
              className="flex items-center gap-2 bg-[#1e1e24] border border-white/[0.05] p-2 rounded-full shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-10"
            >
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 transition-colors rounded-full ${showEmojiPicker ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'}`}
              >
                <Smile size={20} />
              </button>
              <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]">
                <Paperclip size={20} />
              </button>
              
              <input 
                ref={inputRef}
                type="text" 
                value={inputText}
                onChange={handleInputChange}
                /* ACCURACY FIX: Removed onFocus={() => setShowEmojiPicker(false)} so it doesn't close when clicking emojis */
                placeholder="Message..." 
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none px-2 cursor-text"
              />
              
              {inputText.trim() || replyingTo ? (
                <button type="submit" className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors shadow-lg shadow-indigo-500/20 active:scale-95">
                  <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                </button>
              ) : (
                <button type="button" className="p-2.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]">
                  <Mic size={18} />
                </button>
              )}
            </form>
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
                { key: 'session', label: 'This Session', desc: 'Until you leave this chat', icon: '⚡' },
                { key: '1day', label: '1 Day', desc: 'Expires after 24 hours', icon: '☀️' },
                { key: '1week', label: '1 Week', desc: 'Expires after 7 days', icon: '📅' },
                { key: '1month', label: '1 Month', desc: 'Expires after 30 days', icon: '📆' },
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

function StoryRing({ stories, type }) {
  const count = stories.length;
  const size = 68;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const gap = count > 1 ? 6 : 0;
  const segmentLength = (circumference / count) - gap;
  const dasharray = `${Math.max(0, segmentLength)} ${circumference}`;

  return (
    <svg width={size} height={size} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 rotate-[-90deg] pointer-events-none">
      <defs>
        <linearGradient id="standardGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="privateGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="myGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {stories.map((story, i) => {
        const angle = (360 / count) * i;
        const isViewed = story.viewed;
        let strokeColor = "url(#standardGradient)";
        if (isViewed) strokeColor = "#3f3f46";
        else if (type === 'private') strokeColor = "url(#privateGradient)";
        else if (type === 'mine') strokeColor = "url(#myGradient)";

        return (
          <circle
            key={story.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dasharray}
            strokeDashoffset={0}
            transform={`rotate(${angle}, ${size / 2}, ${size / 2})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function NavButton({ icon, active, onClick, hasBadge, badgeCount }) {
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

function CommunitySidebar({ communities, groups, activeCommunityId, setActiveCommunityId, onCommunityClick }) {
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

function CommunityView({ communities, setCommunities, groups, onSelectGroup, activeCommunityId, setActiveCommunityId }) {
  const [displayCommunityId, setDisplayCommunityId] = useState(activeCommunityId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState('select');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState('');
  
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
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    placeholder="e.g. Design Collective"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 rounded-2xl py-3 px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    autoFocus
                  />
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

