import { ChevronRight } from 'lucide-react';

export default function SettingsRow({ icon, title, subtitle, right, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors text-left ${
        danger ? 'text-red-400' : ''
      }`}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          danger ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.06] text-zinc-400'
        }`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right || <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />}
    </button>
  );
}
