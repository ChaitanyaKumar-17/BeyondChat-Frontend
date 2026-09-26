import { Image as ImageIcon, Film, Mic, FileArchive, FileText, File as FileIcon } from 'lucide-react';

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (type, name) => {
  if (type?.startsWith('image/')) return ImageIcon;
  if (type?.startsWith('video/')) return Film;
  if (type?.startsWith('audio/')) return Mic;
  if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar') || type?.includes('7z') || name?.match(/\.(zip|rar|7z|tar|gz)$/i)) return FileArchive;
  if (type?.includes('pdf') || type?.includes('doc') || type?.includes('text') || name?.match(/\.(pdf|doc|docx|txt|rtf|csv|xls|xlsx|ppt|pptx)$/i)) return FileText;
  return FileIcon;
};

// Generate a stable waveform pattern from a seed (message id)
