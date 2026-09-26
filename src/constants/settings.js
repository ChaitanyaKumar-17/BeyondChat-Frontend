export const INITIAL_USER = { 
  id: 0, 
  name: 'Alex Rivera', 
  handle: '@arivera',
  about: 'Available',
  avatar: 'https://i.pravatar.cc/150?u=0',
  status: 'Online'
};

export const DEFAULT_SETTINGS = {
  safety: {
    profanityFilter: 'block', // block | warn | sanitize | off
    leetDetection: true,
    customBlocklist: [],
  },
  ai: {
    smartReplies: true,
    writingAssistant: true,
  },
  notifications: {
    inApp: true,
    preview: true,
    sound: true,
    tone: 'ping',       // ping | chime | pop | bubble | none
    reactions: true,
    groupChats: true,
    calls: true,
    dnd: { enabled: false, from: '22:00', to: '08:00' },
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    accentColor: '#6366f1',
    bubbleStyle: 'default',  // default | rounded | minimal
  },
  privacy: {
    readReceipts: true,
    onlineStatus: true,
    lastSeen: 'everyone',
  },
};
