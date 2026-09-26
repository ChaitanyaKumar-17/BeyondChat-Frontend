import { useEffect, useRef, useMemo } from 'react';
import { ChevronRight, Hash, Trash2 } from 'lucide-react';
import SubHeader from '@/components/common/SubHeader';

export default function StorageScreen({ chatDetails, onClearChat, onClearCache, onBack }) {
  const canvasRef = useRef(null);

  // Simulate realistic storage figures from actual message data
  const storageData = useMemo(() => {
    const totalMsgs = chatDetails.reduce((s, c) => s + c.messages.length, 0);
    const mediaMsgs = chatDetails.reduce((s, c) =>
      s + c.messages.filter(m => m.attachment || m.gif || m.sticker).length, 0);
    const voiceMsgs = chatDetails.reduce((s, c) =>
      s + c.messages.filter(m => m.voiceNote).length, 0);

    // Derive MB estimates
    const mediaKB   = mediaMsgs  * 420 + 8200;   // avg 420KB per media
    const docsKB    = Math.round(mediaMsgs * 0.3) * 180 + 1200;
    const voiceKB   = voiceMsgs  * 85  + 600;    // avg 85KB per voice msg
    const msgsKB    = totalMsgs  * 2.4 + 900;    // ~2.4KB per message
    const cacheKB   = 4200 + Math.random() * 2000 | 0;
    const totalKB   = mediaKB + docsKB + voiceKB + msgsKB + cacheKB;

    const fmt = (kb) => kb > 1024 ? `${(kb/1024).toFixed(1)} MB` : `${kb} KB`;

    return {
      total: fmt(totalKB),
      totalKB,
      categories: [
        { label: 'Media',    kb: mediaKB, color: '#6366f1', pct: mediaKB / totalKB },
        { label: 'Docs',     kb: docsKB,  color: '#8b5cf6', pct: docsKB  / totalKB },
        { label: 'Voice',    kb: voiceKB, color: '#06b6d4', pct: voiceKB / totalKB },
        { label: 'Messages', kb: msgsKB,  color: '#22c55e', pct: msgsKB  / totalKB },
        { label: 'Cache',    kb: cacheKB, color: '#f59e0b', pct: cacheKB / totalKB },
      ],
      fmt,
    };
  }, [chatDetails]);

  // Draw donut chart — DPR-aware, proper arc paths, text centred in hole
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // HiDPI fix: scale canvas buffer by devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 160; // logical CSS px
    canvas.width  = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width  = displaySize + 'px';
    canvas.style.height = displaySize + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const outerR = displaySize * 0.40;  // outer radius
    const innerR = displaySize * 0.26;  // inner radius (donut hole)
    const gap    = 0.012;               // gap between segments (radians)

    ctx.clearRect(0, 0, displaySize, displaySize);
    let startAngle = -Math.PI / 2;

    // Draw donut segments using proper arc paths (no moveTo center)
    storageData.categories.forEach(cat => {
      if (cat.pct <= 0) return;
      const sweep = cat.pct * 2 * Math.PI - gap;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);          // outer arc
      ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);    // inner arc (reverse)
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();
      startAngle += cat.pct * 2 * Math.PI;
    });

    // Centre label (inside hole)
    const mainLabel = storageData.total;
    const fontSize  = Math.max(12, displaySize * 0.115);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle    = '#ffffff';
    ctx.fillText(mainLabel, cx, cy - fontSize * 0.35);
    ctx.font      = `${fontSize * 0.58}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#71717a';
    ctx.fillText('used', cx, cy + fontSize * 0.55);
  }, [storageData]);

  // Per-chat usage sorted by message count descending
  const chatUsage = useMemo(() =>
    [...chatDetails]
      .map(c => ({
        id: c.id, name: c.name, avatar: c.avatar, isGroup: c.isGroup,
        msgs: c.messages.length,
        kb: c.messages.length * 2.4
          + c.messages.filter(m => m.attachment || m.gif).length * 420
          + c.messages.filter(m => m.voiceNote).length * 85,
      }))
      .filter(c => c.msgs > 0)
      .sort((a, b) => b.kb - a.kb)
      .slice(0, 12),
  [chatDetails]);

  const maxKb = chatUsage[0]?.kb || 1;

  return (
    <div className="flex flex-col h-full bg-[#0f0f13]">
      <SubHeader title="Storage & Data" onBack={onBack} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">

        {/* Donut chart + legend */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-5">
          <div className="flex items-center gap-6">
            <canvas ref={canvasRef} className="flex-shrink-0" style={{width:160,height:160}} />
            <div className="flex-1 space-y-2.5">
              {storageData.categories.map(cat => (
                <div key={cat.label} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-300 font-medium">{cat.label}</span>
                      <span className="text-xs text-zinc-500">{storageData.fmt(cat.kb)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(cat.pct * 100).toFixed(1)}%`, background: cat.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-chat list */}
        {chatUsage.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Chats</p>
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
              {chatUsage.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  {c.isGroup
                    ? <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><Hash size={14} className="text-white" /></div>
                    : <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                      <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">{storageData.fmt(c.kb)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, (c.kb / maxKb) * 100).toFixed(1)}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">{c.msgs} messages</p>
                  </div>
                  <button
                    onClick={() => onClearChat(c.id)}
                    className="ml-2 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Actions</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            <button onClick={onClearCache}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={15} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Clear Cache</p>
                <p className="text-xs text-zinc-500 mt-0.5">Remove temporary files and thumbnails</p>
              </div>
              <ChevronRight size={16} className="text-zinc-600" />
            </button>
            <button onClick={() => { chatDetails.forEach(c => onClearChat(c.id)); }}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors text-left">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={15} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Clear All Chat History</p>
                <p className="text-xs text-zinc-500 mt-0.5">Permanently delete all messages from all chats</p>
              </div>
              <ChevronRight size={16} className="text-zinc-600" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 px-1 pb-2 leading-relaxed">
          Storage values are estimates. Actual usage depends on media quality and device caching.
        </p>
      </div>
    </div>
  );
}

// ⚙? SETTINGS PAGE COMPONENT
// -----------------------------------------------------------
