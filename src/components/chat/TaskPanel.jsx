import { useState } from 'react';
import { ArrowLeft, Trash2, Check, ListTodo, Calendar, CheckCircle } from 'lucide-react';

export default function TaskPanel({ tasks, onClose, onUpdateTask, onDeleteTask, friends, canManage, onJumpToMessage }) {
  const [filter, setFilter] = useState('all'); // all, todo, in-progress, done
  const priorities = { high: 'text-red-400 bg-red-500/10', medium: 'text-amber-400 bg-amber-500/10', low: 'text-emerald-400 bg-emerald-500/10' };
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusOrder = { 'in-progress': 0, todo: 1, done: 2 };

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .sort((a, b) => {
      // Status sort: done goes last
      const statusDiff = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
      if (statusDiff !== 0) return statusDiff;
      // Priority sort within same status group
      return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    });
  const counts = { all: tasks.length, todo: tasks.filter(t => t.status === 'todo').length, 'in-progress': tasks.filter(t => t.status === 'in-progress').length, done: tasks.filter(t => t.status === 'done').length };

  return (
    <div className="absolute inset-0 z-[80] bg-[#121214] flex flex-col animate-in slide-in-from-right-8 duration-300">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.04] bg-[#121214]/80 backdrop-blur-md z-10 flex-none">
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors bg-[#1a1a1c] p-2 rounded-full"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2"><ListTodo size={18} className="text-indigo-400" /><h2 className="text-base font-medium text-white">Tasks</h2></div>
        <span className="ml-auto text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full">{tasks.length} total</span>
      </header>

      <div className="flex gap-1 px-4 py-3 border-b border-white/[0.04] overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${filter === key ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'}`}>
            {key === 'all' ? 'All' : key === 'in-progress' ? 'In Progress' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 pb-10">
            <CheckCircle size={40} className="mb-3 text-zinc-600" />
            <p className="text-sm font-medium">No tasks {filter !== 'all' ? `marked as "${filter}"` : 'yet'}</p>
            <p className="text-xs text-zinc-600 mt-1">Convert any message into a task</p>
          </div>
        ) : filtered.map(task => (
          <div key={task.id} className="bg-[#1a1a1c] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors group cursor-pointer" onClick={() => onJumpToMessage(task.msgId)}>
            <div className="flex items-start gap-3">
              <button onClick={(e) => { e.stopPropagation(); canManage && onUpdateTask(task.id, { status: task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in-progress' : 'done' }); }} className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : task.status === 'in-progress' ? 'border-amber-400 bg-amber-500/20' : 'border-white/20 hover:border-white/40'}`}>
                {task.status === 'done' && <Check size={12} className="text-white" />}
                {task.status === 'in-progress' && <div className="w-2 h-2 rounded-sm bg-amber-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'text-zinc-500 line-through' : 'text-white'}`}>{task.title}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${priorities[task.priority]}`}>{task.priority}</span>
                  {task.dueDate && <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                  {task.assignee && <span className="text-[10px] text-zinc-500">? {friends.find(f => f.id === task.assignee)?.name || 'You'}</span>}
                </div>
              </div>
              {canManage && <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-zinc-600 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
