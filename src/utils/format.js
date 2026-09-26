export const nowMs = Date.now();
export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatStoryTime = (timestamp) => {
  if (!timestamp) return '';
  const diffMins = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
};

export const formatDividerDate = (timestamp) => {
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

export const formatRecentChatTime = (timestamp) => {
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

export const formatLastSeen = (lastSeen, isOnline) => {
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
