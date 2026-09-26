import { useState, useEffect, useRef } from 'react';
import { Users, Plus, ArrowLeft, X, Trash2, Pencil, Eye, Paintbrush, Eraser, Undo2, Image } from 'lucide-react';

export default function WhiteboardPanel({ canUserEdit, isAdmin, chat, currentUser, canvasEditors, setCanvasEditors, friends, onClose,
  boards, setBoards, activeBoardId, setActiveBoardId }) {
  // boards / activeBoardId are lifted to ChatView so they persist across open/close
  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1e1e2e');
  const [strokeSize, setStrokeSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]); // per-board undo history
  const [showEditorMgr, setShowEditorMgr] = useState(false);
  const [renamingBoardId, setRenamingBoardId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);
  const lastPos = useRef(null);
  const switchingBoard = useRef(false);
  const boardsRef = useRef(boards);
  useEffect(() => { boardsRef.current = boards; }, [boards]);

  const PEN_COLORS = [
    { hex: '#1e1e2e', label: 'Dark' },
    { hex: '#ffffff', label: 'White' },
    { hex: '#ef4444', label: 'Red' },
    { hex: '#f97316', label: 'Orange' },
    { hex: '#eab308', label: 'Yellow' },
    { hex: '#22c55e', label: 'Green' },
    { hex: '#3b82f6', label: 'Blue' },
    { hex: '#a855f7', label: 'Purple' },
    { hex: '#ec4899', label: 'Pink' },
  ];

  const BG_COLORS = [
    { hex: '#fafaf9', label: 'White' },
    { hex: '#fffbeb', label: 'Cream' },
    { hex: '#f0fdf4', label: 'Mint' },
    { hex: '#f0f9ff', label: 'Sky' },
    { hex: '#1e1e2e', label: 'Dark' },
  ];

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    // Restore saved data if any
    if (activeBoard.data) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = activeBoard.data;
    }
  }, []);

  // When switching boards: save current, restore next
  const switchToBoard = (newId) => {
    if (newId === activeBoardId) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const currentId = activeBoardId; // capture before any setState

    // Save current board's canvas content
    const currentData = canvas.toDataURL();
    setBoards(prev => prev.map(b => b.id === currentId ? { ...b, data: currentData } : b));

    // Clear canvas immediately
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use boardsRef (always up-to-date) instead of stale closure `boards`
    const targetBoard = boardsRef.current.find(b => b.id === newId);
    if (targetBoard?.data) {
      const img = new window.Image();
      img.onload = () => {
        const c = ctxRef.current;
        if (c) c.drawImage(img, 0, 0, w, h);
      };
      img.src = targetBoard.data;
    }

    setActiveBoardId(newId);
    setHistory([]);
  };

  const addBoard = () => {
    // Save current first
    const canvas = canvasRef.current;
    const currentData = canvas.toDataURL();
    const newId = Date.now();
    setBoards(prev => [
      ...prev.map(b => b.id === activeBoardId ? { ...b, data: currentData } : b),
      { id: newId, name: `Board ${prev.length + 1}`, bgColor: '#fafaf9', data: null },
    ]);
    // Clear canvas for new board
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setActiveBoardId(newId);
    setHistory([]);
    // Reset drawing tools to defaults for the new board
    setTool('pen');
    setColor('#1e1e2e');
    setStrokeSize(4);
  };

  const deleteBoard = (id) => {
    const currentBoards = boardsRef.current;
    if (currentBoards.length === 1) return; // can't delete last

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (id === activeBoardId) {
      // Save the current canvas content into the board being deleted (not strictly needed,
      // but keeps boardsRef state consistent). More importantly, we now pick the closest
      // previous board to switch to — not just the last one.
      const currentData = canvas ? canvas.toDataURL() : null;
      const remaining = currentBoards.filter(b => b.id !== id);
      const deletedIdx = currentBoards.findIndex(b => b.id === id);
      // Prefer the board immediately before; fall back to the one after
      const nextBoard = remaining[deletedIdx - 1] || remaining[0];
      const nextId = nextBoard.id;

      // Update boards state: remove deleted, save current data in it (for safety)
      setBoards(currentBoards
        .map(b => b.id === id && currentData ? { ...b, data: currentData } : b)
        .filter(b => b.id !== id)
      );

      // Restore the next board's canvas content
      if (ctx && canvas) {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (nextBoard.data) {
          const img = new window.Image();
          img.onload = () => {
            const c = ctxRef.current;
            if (c) c.drawImage(img, 0, 0, w, h);
          };
          img.src = nextBoard.data;
        }
      }

      setActiveBoardId(nextId);
      setHistory([]);
    } else {
      // Deleting a non-active board — just remove it from state
      setBoards(currentBoards.filter(b => b.id !== id));
    }
  };

  const setBgColorForActive = (hex) => {
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, bgColor: hex } : b));
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev.slice(-19), canvas.toDataURL()]);
  };

  const startDraw = (e) => {
    if (!canUserEdit) return;
    e.preventDefault();
    saveHistory();
    const ctx = ctxRef.current;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setIsDrawing(true);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeSize * 6;
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = strokeSize * 3;
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = strokeSize;
      ctx.strokeStyle = color;
    }
  };

  const draw = (e) => {
    if (!isDrawing || !canUserEdit) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const dpr = window.devicePixelRatio || 1;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
    img.src = prev;
  };

  const handleClear = () => {
    if (!canUserEdit) return;
    saveHistory();
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const toolBtn = (id, icon, label) => (
    <button
      key={id}
      onClick={() => setTool(id)}
      title={label}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all ${
        tool === id ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
      }`}
    >
      {icon}
      <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );

  // Save the current board's canvas content before closing so it persists on re-entry
  const handleClose = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const currentData = canvas.toDataURL();
      const currentId = activeBoardId;
      setBoards(prev => prev.map(b => b.id === currentId ? { ...b, data: currentData } : b));
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[90] flex flex-col animate-in slide-in-from-right-8 duration-300" style={{ background: '#0f0f13' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.05] bg-[#0f0f13]/90 backdrop-blur-md z-10 flex-none">
        <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors bg-white/[0.06] p-2 rounded-full">
          <ArrowLeft size={17} />
        </button>
        <div className="flex items-center gap-2">
          <Paintbrush size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white tracking-tight">Whiteboard</h2>
        </div>
        {chat.isGroup && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            canUserEdit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
          }`}>
            {canUserEdit ? 'Can Edit' : 'View Only'}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* Background color picker */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1.5 border border-white/[0.06]">
            {BG_COLORS.map(b => (
              <button
                key={b.hex}
                onClick={() => setBgColorForActive(b.hex)}
                title={`Background: ${b.label}`}
                className={`w-5 h-5 rounded-md border-2 transition-transform hover:scale-110 ${
                  activeBoard.bgColor === b.hex ? 'border-white/60 scale-110' : 'border-transparent'
                }`}
                style={{ background: b.hex }}
              />
            ))}
          </div>
          {isAdmin && chat.isGroup && (
            <button onClick={() => setShowEditorMgr(v => !v)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors" title="Manage editors">
              <Users size={16} />
            </button>
          )}
          {canUserEdit && (
            <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors disabled:opacity-30" title="Undo">
              <Undo2 size={16} />
            </button>
          )}
          {canUserEdit && (
            <button onClick={handleClear} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/[0.08] rounded-full transition-colors" title="Clear board">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Board tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] bg-[#0f0f13]/80 overflow-x-auto [&::-webkit-scrollbar]:hidden flex-none">
        {boards.map(b => {
          const isActive = b.id === activeBoardId;
          const isRenaming = renamingBoardId === b.id;
          return (
            <div
              key={b.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 group ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] cursor-pointer'
              }`}
              onClick={() => {
                if (isRenaming) return;
                if (isActive) {
                  // Second click on active tab ? start rename
                  setRenameValue(b.name);
                  setRenamingBoardId(b.id);
                  setTimeout(() => renameInputRef.current?.select(), 30);
                } else {
                  switchToBoard(b.id);
                }
              }}
            >
              <div className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" style={{ background: b.bgColor }} />
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const trimmed = renameValue.trim();
                      if (trimmed) setBoards(prev => prev.map(bd => bd.id === b.id ? { ...bd, name: trimmed } : bd));
                      setRenamingBoardId(null);
                    } else if (e.key === 'Escape') {
                      setRenamingBoardId(null);
                    }
                  }}
                  onBlur={() => {
                    const trimmed = renameValue.trim();
                    if (trimmed) setBoards(prev => prev.map(bd => bd.id === b.id ? { ...bd, name: trimmed } : bd));
                    setRenamingBoardId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  className="bg-transparent border-b border-indigo-400 outline-none text-indigo-200 w-20 text-xs"
                  autoFocus
                />
              ) : (
                <span>{b.name}</span>
              )}
              {isActive && !isRenaming && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setRenameValue(b.name);
                    setRenamingBoardId(b.id);
                    setTimeout(() => renameInputRef.current?.select(), 30);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-indigo-400/60 hover:text-indigo-300 transition-all rounded"
                  title="Rename board"
                >
                  <Pencil size={9} />
                </button>
              )}
              {boards.length > 1 && !isRenaming && (
                <button
                  onClick={e => { e.stopPropagation(); deleteBoard(b.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all rounded"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
        {canUserEdit && (
          <button
            onClick={addBoard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all flex-shrink-0"
            title="Add new board"
          >
            <Plus size={13} /> New
          </button>
        )}
      </div>

      {/* Drawing toolbar */}
      {canUserEdit && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-[#0f0f13]/80 flex-none flex-wrap">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.05]">
            {toolBtn('pen', <Pencil size={15} />, 'Pen')}
            {toolBtn('marker', <Paintbrush size={15} />, 'Marker')}
            {toolBtn('eraser', <Eraser size={15} />, 'Eraser')}
          </div>
          <div className="w-px h-7 bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            {[2, 4, 8, 14].map(sz => (
              <button
                key={sz}
                onClick={() => setStrokeSize(sz)}
                title={`Size ${sz}`}
                className={`flex items-center justify-center rounded-full transition-all hover:scale-110 ${
                  strokeSize === sz ? 'ring-2 ring-indigo-400' : 'ring-1 ring-white/10'
                }`}
                style={{ width: Math.max(10, sz * 1.8), height: Math.max(10, sz * 1.8), background: tool === 'eraser' ? '#6b7280' : color }}
              />
            ))}
          </div>
          <div className="w-px h-7 bg-white/[0.06]" />
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => { setColor(c.hex); if (tool === 'eraser') setTool('pen'); }}
                title={c.label}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                  color === c.hex && tool !== 'eraser' ? 'border-white scale-125 ring-2 ring-white/30' : 'border-white/20'
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Canvas area ? background is CSS only, canvas is transparent */}
      <div className="flex-1 relative overflow-hidden transition-colors duration-300" style={{ background: activeBoard.bgColor }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: !canUserEdit ? 'not-allowed' : tool === 'eraser' ? 'cell' : 'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle, ${activeBoard.bgColor === '#1e1e2e' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        {!canUserEdit && (
          <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md text-zinc-300 text-xs px-4 py-2 rounded-full">
              <Eye size={13} /> View only ? ask an admin to grant edit access
            </div>
          </div>
        )}
      </div>

      {/* Admin: Editor management overlay */}
      {showEditorMgr && isAdmin && chat.isGroup && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowEditorMgr(false)}>
          <div className="w-full bg-[#141418] border-t border-white/[0.06] rounded-t-3xl p-5 animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-sm">Edit Access Control</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {canvasEditors.length === 0 ? 'Everyone can edit' : `${canvasEditors.length} member${canvasEditors.length > 1 ? 's' : ''} can edit`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCanvasEditors([])}
                  className={`text-[11px] px-3 py-1.5 rounded-full font-semibold transition-all ${
                    canvasEditors.length === 0 ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30' : 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  All members
                </button>
                <button onClick={() => setShowEditorMgr(false)} className="p-1.5 text-zinc-400 hover:text-white"><X size={16} /></button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {(chat.memberIds || []).filter(id => id !== currentUser.id).map(memberId => {
                const member = friends.find(f => f.id === memberId) || { id: memberId, name: 'Member', avatar: null };
                const canEdit = canvasEditors.length === 0 || canvasEditors.includes(memberId);
                return (
                  <div key={memberId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.name}</p>
                      <p className="text-[10px] text-zinc-500">{canEdit ? 'Can edit' : 'View only'}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (canvasEditors.length === 0) {
                          setCanvasEditors((chat.memberIds || []).filter(id => id !== memberId && id !== currentUser.id));
                        } else if (canvasEditors.includes(memberId)) {
                          setCanvasEditors(prev => prev.filter(id => id !== memberId));
                        } else {
                          setCanvasEditors(prev => [...prev, memberId]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                        canEdit ? 'bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-zinc-500/10 text-zinc-400 hover:bg-emerald-500/15 hover:text-emerald-400'
                      }`}
                    >
                      {canEdit ? 'Revoke' : 'Grant'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ??????????????????????????????????????????????????????????????
// Shared settings UI primitives (used by StorageScreen + SettingsPage)
// ??????????????????????????????????????????????????????????????
