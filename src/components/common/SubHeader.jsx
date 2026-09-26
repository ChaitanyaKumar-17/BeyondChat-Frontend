import { ArrowLeft } from 'lucide-react';

export default function SubHeader({ title, onBack }) {
  return (
    <header className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05] flex-shrink-0 bg-[#0f0f13]">
      <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white bg-white/[0.06] rounded-full transition-colors">
        <ArrowLeft size={16} />
      </button>
      <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
    </header>
  );
}
