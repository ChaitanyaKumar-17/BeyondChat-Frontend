export default function ReceiptIndicator({ status }) {
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

// Voice note player with play/pause and progress bar
