import { E } from '@/constants/emoji';
import { nowMs, HOUR } from '@/utils/format';
import { gradients } from '@/constants/emoji';

export const generateStories = (name, count) => {
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


export const isInDndWindow = (dnd) => {
  if (!dnd?.enabled) return false;
  const now = new Date();
  const [fh, fm] = (dnd.from || '22:00').split(':').map(Number);
  const [th, tm] = (dnd.to   || '08:00').split(':').map(Number);
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const fromMin = fh * 60 + fm;
  const toMin   = th * 60 + tm;
  return fromMin > toMin
    ? nowMin >= fromMin || nowMin < toMin   // crosses midnight
    : nowMin >= fromMin && nowMin < toMin;
};
