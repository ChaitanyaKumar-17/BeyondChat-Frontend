import { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';

export default function CreatePollModal({ onClose, onCreatePoll }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const addOption = () => { if (options.length < 10) setOptions([...options, '']); };
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i, val) => { const o = [...options]; o[i] = val; setOptions(o); };

  const canCreate = question.trim() && options.filter(o => o.trim()).length >= 2;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreatePoll({
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: options.filter(o => o.trim()).map((text, i) => ({ id: i, text: text.trim(), votes: [] })),
      allowMultiple,
      isAnonymous,
      createdAt: Date.now(),
      closed: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg"><BarChart3 size={18} className="text-white" /></div>
            <h3 className="text-white font-semibold text-base">Create Poll</h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div>
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">Question</label>
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors" autoFocus />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center shrink-0"><span className="text-[10px] text-zinc-500 font-bold">{i + 1}</span></div>
                  <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                  {options.length > 2 && <button onClick={() => removeOption(i)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={14} /></button>}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"><Plus size={14} /> Add option</button>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.04]">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Allow multiple selections</span>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${allowMultiple ? 'bg-indigo-500' : 'bg-white/10'}`} onClick={() => setAllowMultiple(!allowMultiple)}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${allowMultiple ? 'left-5' : 'left-1'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Anonymous votes</span>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${isAnonymous ? 'bg-indigo-500' : 'bg-white/10'}`} onClick={() => setIsAnonymous(!isAnonymous)}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isAnonymous ? 'left-5' : 'left-1'}`} />
              </div>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={!canCreate} className="px-5 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-default shadow-lg shadow-indigo-500/20">Create Poll</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// 🎨 WHITEBOARD PANEL COMPONENT
// -----------------------------------------------------------
