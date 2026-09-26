import { E } from '@/constants/emoji';
import { nowMs, MIN, HOUR, DAY } from '@/utils/format';
import { generateStories } from '@/utils/helpers';
import { gradients } from '@/constants/emoji';

export const initialMyStories = [
  {
    id: 'my-story-mock-1',
    text: 'Just finished a great workout! ' + E('1F4AA'),
    bgClass: gradients[2],
    viewed: false,
    animationPlayed: false,
    timestamp: nowMs - 2 * HOUR,
    views: [
      { id: 1, name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?u=1', reaction: 'fire' },
      { id: 4, name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=4', reaction: 'love' },
      { id: 9, name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?u=9', reaction: null },
      { id: 6, name: 'Anna Park', avatar: 'https://i.pravatar.cc/150?u=6', reaction: 'laugh' },
      { id: 2, name: 'Lucas Rivera', avatar: 'https://i.pravatar.cc/150?u=2', reaction: 'fire' },
      { id: 5, name: 'Mike Torres', avatar: 'https://i.pravatar.cc/150?u=5', reaction: null },
      { id: 8, name: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=8', reaction: 'laugh' },
      { id: 10, name: 'James Lee', avatar: 'https://i.pravatar.cc/150?u=10', reaction: null },
      { id: 11, name: 'Lily Harper', avatar: 'https://i.pravatar.cc/150?u=11', reaction: 'love' },
      { id: 12, name: 'Tom Wright', avatar: 'https://i.pravatar.cc/150?u=12', reaction: null },
      { id: 15, name: 'Maya Patel', avatar: 'https://i.pravatar.cc/150?u=15', reaction: 'fire' },
      { id: 18, name: 'Ethan Brooks', avatar: 'https://i.pravatar.cc/150?u=18', reaction: 'laugh' },
      { id: 22, name: 'William Zhang', avatar: 'https://i.pravatar.cc/150?u=22', reaction: null },
      { id: 26, name: 'Elijah Moore', avatar: 'https://i.pravatar.cc/150?u=26', reaction: 'love' },
    ]
  }
];

export const initialFriends = [
  { id: 1, name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?u=1', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Elena Rodriguez', 3), username: 'elena.rod', phone: '+1 (555) 012-3456', bio: 'UI/UX designer & coffee lover. Currently obsessed with design systems.', mutualFriendIds: [4, 8, 6, 9, 5, 10, 7] },
  { id: 2, name: 'Lucas Rivera', avatar: 'https://i.pravatar.cc/150?u=2', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Lucas Rivera', 2), username: 'lucasdev', phone: '+1 (555) 023-4567', bio: 'Full-stack developer. Building cool stuff with React and Node.', mutualFriendIds: [5, 9, 18, 24] },
  { id: 3, name: 'Sophia Kim', avatar: 'https://i.pravatar.cc/150?u=3', storyType: 'private', isOnline: false, lastSeen: nowMs - 2 * HOUR, storyViewed: false, stories: generateStories('Sophia Kim', 4), username: 'sophiaarts', phone: '+1 (555) 034-5678', bio: 'Digital artist and illustrator. Open for commissions!', mutualFriendIds: [6, 14, 25] },
  { id: 4, name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=4', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Sarah Jenkins', 1), username: 'sarah.j', phone: '+1 (555) 045-6789', bio: 'Frontend engineer @ TechCorp. Tailwind enthusiast.', mutualFriendIds: [1, 8, 23, 9, 6, 24] },
  { id: 5, name: 'Mike Torres', avatar: 'https://i.pravatar.cc/150?u=5', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Mike Torres', 2), username: 'mikebuilds', phone: '+1 (555) 056-7890', bio: 'Product manager by day, gamer by night.', mutualFriendIds: [1, 2, 7, 10, 22] },
  { id: 6, name: 'Anna Park', avatar: 'https://i.pravatar.cc/150?u=6', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Anna Park', 2), username: 'annadesign', phone: '+1 (555) 067-8901', bio: 'Visual designer. Minimalism is the ultimate sophistication.', mutualFriendIds: [1, 3, 9, 4, 25, 14] },
  { id: 16, name: 'Oliver Knox', avatar: 'https://i.pravatar.cc/150?u=16', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Oliver Knox', 3), username: 'oliver.k', phone: '+1 (555) 160-1234', bio: 'Backend engineer. Rust and Go advocate.', mutualFriendIds: [18, 8, 10] },
  { id: 17, name: 'Isabella Mori', avatar: 'https://i.pravatar.cc/150?u=17', storyType: 'private', isOnline: false, lastSeen: nowMs - 3 * DAY, storyViewed: false, stories: generateStories('Isabella Mori', 1), username: 'isabella_m', phone: '+1 (555) 170-2345', bio: 'Data scientist exploring the world of ML.', mutualFriendIds: [26, 18] },
  { id: 7, name: 'Chris Nguyen', avatar: 'https://i.pravatar.cc/150?u=7', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Chris Nguyen', 1), username: 'chriscode', phone: '+1 (555) 078-9012', bio: 'DevOps wizard. Automating everything.', mutualFriendIds: [1, 5, 10, 8] },
  { id: 8, name: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=8', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('David Chen', 3), username: 'davidchen', phone: '+1 (555) 089-0123', bio: 'API architect. Building the backend of the future.', mutualFriendIds: [1, 4, 7, 16, 10] },
  { id: 9, name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?u=9', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Emma Wilson', 4), username: 'emmawilson', phone: '+1 (555) 090-1234', bio: 'React Native dev. Mobile-first mindset.', mutualFriendIds: [1, 2, 4, 6, 19] },
  { id: 18, name: 'Ethan Brooks', avatar: 'https://i.pravatar.cc/150?u=18', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Ethan Brooks', 2), username: 'ethan.dev', phone: '+1 (555) 180-3456', bio: 'Systems programmer. Low-level is the best level.', mutualFriendIds: [2, 16, 17, 26] },
  { id: 10, name: 'James Lee', avatar: 'https://i.pravatar.cc/150?u=10', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('James Lee', 3), username: 'jameslee', phone: '+1 (555) 101-2345', bio: 'Cloud architect @ AWS. Distributed systems fan.', mutualFriendIds: [1, 5, 7, 8, 16, 12] },
  { id: 11, name: 'Lily Harper', avatar: 'https://i.pravatar.cc/150?u=11', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Lily Harper', 2), username: 'lilyhikes', phone: '+1 (555) 112-3456', bio: 'Outdoor enthusiast and nature photographer.', mutualFriendIds: [15, 21, 13] },
  { id: 19, name: 'Mia Carter', avatar: 'https://i.pravatar.cc/150?u=19', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Mia Carter', 1), username: 'mia.creates', phone: '+1 (555) 190-4567', bio: 'Content creator and social media strategist.', mutualFriendIds: [9, 23, 25] },
  { id: 12, name: 'Tom Wright', avatar: 'https://i.pravatar.cc/150?u=12', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Tom Wright', 2), username: 'tomwrites', phone: '+1 (555) 123-4567', bio: 'Technical writer. Making docs people actually read.', mutualFriendIds: [10, 13, 20] },
  { id: 13, name: 'Nina Patel', avatar: 'https://i.pravatar.cc/150?u=13', storyType: 'standard', isOnline: false, lastSeen: nowMs - 10 * DAY, storyViewed: false, stories: generateStories('Nina Patel', 1), username: 'ninapm', phone: '+1 (555) 134-5678', bio: 'Project manager keeping teams in sync.', mutualFriendIds: [11, 12, 15] },
  { id: 14, name: 'Leo Santos', avatar: 'https://i.pravatar.cc/150?u=14', storyType: 'private', isOnline: false, lastSeen: nowMs - 20 * DAY, storyViewed: false, stories: generateStories('Leo Santos', 2), username: 'leomotion', phone: '+1 (555) 145-6789', bio: 'Motion designer and animator. After Effects wizard.', mutualFriendIds: [3, 6, 25] },
  { id: 15, name: 'Maya Patel', avatar: 'https://i.pravatar.cc/150?u=15', storyType: 'standard', isOnline: false, lastSeen: nowMs - 45 * DAY, storyViewed: false, stories: generateStories('Maya Patel', 2), username: 'mayatrails', phone: '+1 (555) 156-7890', bio: 'Trail runner and adventure seeker.', mutualFriendIds: [11, 13, 21] },
  { id: 20, name: 'Noah Davis', avatar: 'https://i.pravatar.cc/150?u=20', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Noah Davis', 1), username: 'noahcodes', phone: '+1 (555) 200-5678', bio: 'Indie hacker building micro-SaaS products.', mutualFriendIds: [12, 24, 2] },
  { id: 21, name: 'Ava Green', avatar: 'https://i.pravatar.cc/150?u=21', storyType: 'private', isOnline: false, lastSeen: nowMs - 1 * DAY - 5 * HOUR, storyViewed: false, stories: generateStories('Ava Green', 2), username: 'avagreen', phone: '+1 (555) 210-6789', bio: 'Environmental scientist and sustainability advocate.', mutualFriendIds: [11, 15] },
  { id: 22, name: 'William Zhang', avatar: 'https://i.pravatar.cc/150?u=22', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('William Zhang', 3), username: 'willcraft', phone: '+1 (555) 220-7890', bio: 'Game developer. Unity & Unreal Engine.', mutualFriendIds: [5, 26, 18] },
  { id: 23, name: 'Charlotte Reed', avatar: 'https://i.pravatar.cc/150?u=23', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Charlotte Reed', 1), username: 'charlotteux', phone: '+1 (555) 230-8901', bio: 'UX researcher. Understanding users is my superpower.', mutualFriendIds: [4, 19, 1, 6] },
  { id: 24, name: 'Benjamin Frost', avatar: 'https://i.pravatar.cc/150?u=24', storyType: 'private', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Benjamin Frost', 2), username: 'benstack', phone: '+1 (555) 240-9012', bio: 'Full-stack TypeScript developer. Next.js fanatic.', mutualFriendIds: [2, 4, 20] },
  { id: 25, name: 'Amelia Cross', avatar: 'https://i.pravatar.cc/150?u=25', storyType: 'standard', isOnline: false, lastSeen: nowMs - 5 * DAY, storyViewed: false, stories: generateStories('Amelia Cross', 1), username: 'ameliaink', phone: '+1 (555) 250-0123', bio: 'Graphic designer and brand identity specialist.', mutualFriendIds: [3, 6, 14, 19] },
  { id: 26, name: 'Elijah Moore', avatar: 'https://i.pravatar.cc/150?u=26', storyType: 'standard', isOnline: true, lastSeen: null, storyViewed: false, stories: generateStories('Elijah Moore', 2), username: 'elijahml', phone: '+1 (555) 260-1234', bio: 'Machine learning engineer. Building intelligent systems.', mutualFriendIds: [17, 18, 22] },
];

export const initialGroups = [
  { id: 1001, name: 'Announcements', description: 'Community broadcast channel.', members: 4, memberIds: [0, 1, 4, 8, 6, 9, 12], adminIds: [0], unread: 2, icon: 'bg-indigo-700', isGroup: true, onlyAdminsCanMessage: true, pinnedMessage: null, isBroadcast: true },
  { id: 1002, name: 'Announcements', description: 'Community broadcast channel.', members: 5, memberIds: [0, 11, 15, 1, 5, 7, 10], adminIds: [0], unread: 0, icon: 'bg-rose-700', isGroup: true, onlyAdminsCanMessage: true, pinnedMessage: null, isBroadcast: true },
  { id: 101, name: 'Design System Team', description: 'Core UI/UX discussions and system updates.', members: 4, memberIds: [0, 1, 4, 8], adminIds: [0], unread: 3, icon: 'bg-purple-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 102, name: 'Frontend Guild', description: 'React, Tailwind, and Web Dev.', members: 3, memberIds: [0, 6, 9], adminIds: [6], unread: 0, icon: 'bg-blue-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 103, name: 'Weekend Hikers', description: 'Planning weekend hiking trips.', members: 3, memberIds: [0, 11, 15], adminIds: [11], unread: 1, icon: 'bg-emerald-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 104, name: 'Project Alpha', description: 'Confidential project alpha syncs.', members: 2, memberIds: [0, 12], adminIds: [0, 12], unread: 5, icon: 'bg-orange-500', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
  { id: 105, name: 'Coffee Enthusiasts', description: 'Discussing the best local brews.', members: 5, memberIds: [0, 1, 5, 7, 10], adminIds: [5], unread: 0, icon: 'bg-amber-700', isGroup: true, onlyAdminsCanMessage: false, pinnedMessage: null },
];

export const mockChannels = [
  { id: 201, name: 'announcements', members: 1200, type: 'channel' },
  { id: 202, name: 'general', members: 850, type: 'channel' },
  { id: 203, name: 'design-inspo', members: 430, type: 'channel' },
];

export const initialCommunities = [
  { id: 'com1', name: 'Tech Innovators', short: 'TI', icon: 'bg-indigo-600', groupIds: [1001, 101, 102, 104] },
  { id: 'com2', name: 'Social Club', short: 'SC', icon: 'bg-rose-600', groupIds: [1002, 103, 105] },
];

export const initialGlobalUsers = [
  { id: 301, name: 'John Doe', handle: '@johnd', avatar: 'https://i.pravatar.cc/150?u=301', status: 'Offline', isConnected: false, mutualFriendIds: [1, 4, 8] },
  { id: 302, name: 'Jane Smith', handle: '@janes', avatar: 'https://i.pravatar.cc/150?u=302', status: 'Online', isConnected: false, mutualFriendIds: [9, 6] },
  { id: 303, name: 'Alice Johnson', handle: '@alicej', avatar: 'https://i.pravatar.cc/150?u=303', status: 'Offline', isConnected: false, mutualFriendIds: [2, 5, 11, 12] },
  { id: 304, name: 'Michael Ross', handle: '@miker', avatar: 'https://i.pravatar.cc/150?u=304', status: 'Online', isConnected: false, mutualFriendIds: [1] },
];

export const initialReceivedRequests = [
  { id: 401, name: 'Marcus Chen', handle: '@marcus_c', avatar: 'https://i.pravatar.cc/150?u=401', status: 'Online' },
  { id: 402, name: 'Olivia Wang', handle: '@oliviaw', avatar: 'https://i.pravatar.cc/150?u=402', status: 'Offline' }
];

export const mockCallLogs = [
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

export const initialRecent = [
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

export const initialChats = [
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
      { id: 105, senderId: 1, timestamp: nowMs - 90000, attachment: { name: 'sunset.jpg', size: 2400000, type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600', viewOnce: true } },
      { id: 106, senderId: 0, timestamp: nowMs - 60000, status: 'read', attachment: { name: 'sketch_draft.png', size: 1800000, type: 'image/png', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', viewOnce: true } },
      { id: 107, senderId: 1, text: 'Ugh this damn build keeps failing, what the hell is wrong with it!', timestamp: nowMs - 8 * 60000 },
      { id: 108, senderId: 1, text: 'I swear this bullshit CI pipeline is broken again', timestamp: nowMs - 6 * 60000 },
      { id: 109, senderId: 1, text: 'Sorry about that — super frustrated. Anyway, can you check the PR?', timestamp: nowMs - 4 * 60000 },
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
