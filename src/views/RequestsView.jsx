import { useState } from 'react';
import { Users, Send, X } from 'lucide-react';

export default function RequestsView({ sentReqs, receivedReqs, onAccept, onReject, onWithdraw }) {
  const [tab, setTab] = useState('received');

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <header className="px-6 py-6 md:px-0 flex items-center min-h-[94px] flex-shrink-0">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Requests</h1>
      </header>

      <div className="flex px-6 md:px-0 mb-6 gap-4 sm:gap-6 border-b border-white/10 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full max-w-full">
        <button 
          onClick={() => setTab('received')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'received' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Received ({receivedReqs.length})
          {tab === 'received' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setTab('sent')} 
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${tab === 'sent' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Sent ({sentReqs.length})
          {tab === 'sent' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-0 space-y-3 pb-24 [&::-webkit-scrollbar]:hidden">
        {tab === 'received' ? (
          receivedReqs.length > 0 ? (
            receivedReqs.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} alt={req.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h4 className="text-sm font-medium text-white">{req.name}</h4>
                    <p className="text-xs text-zinc-500">{req.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onReject(req.id)} 
                    className="p-2.5 rounded-full text-zinc-400 bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => onAccept(req.id)} 
                    className="px-4 py-2 rounded-full text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
              <Users size={40} className="opacity-20" />
              <p>No incoming connection requests.</p>
            </div>
          )
        ) : (
          sentReqs.length > 0 ? (
            sentReqs.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-[#121214] border border-white/[0.02] rounded-3xl shadow-lg">
                <div className="flex items-center gap-4">
                  <img src={req.avatar} alt={req.name} className="w-12 h-12 rounded-full grayscale opacity-70" />
                  <div>
                    <h4 className="text-sm font-medium text-white">{req.name}</h4>
                    <p className="text-xs text-zinc-500">{req.handle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onWithdraw(req.id)} 
                  className="px-4 py-2 rounded-full text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-16 text-sm flex flex-col items-center gap-3">
              <Send size={40} className="opacity-20" />
              <p>No outgoing connection requests.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
