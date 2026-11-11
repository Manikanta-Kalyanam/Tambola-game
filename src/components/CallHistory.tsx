import React from 'react';
import { CallRecord } from '../shared/types';
import { History } from 'lucide-react';

interface CallHistoryProps {
  calls: CallRecord[];
}

export const CallHistory: React.FC<CallHistoryProps> = ({ calls }) => {
  if (calls.length === 0) return null;

  // Recent calls in reverse order (newest first)
  const recentCalls = [...calls].reverse().slice(0, 15);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
        <History className="w-3.5 h-3.5 text-amber-400" />
        <span>Recent Calls (Newest to Oldest):</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {recentCalls.map((call, idx) => (
          <div
            key={call.number}
            className={`flex-shrink-0 flex items-center justify-center font-mono font-bold rounded-xl transition-all ${
              idx === 0
                ? 'w-10 h-10 bg-gradient-to-br from-rose-500 to-amber-500 text-white text-base shadow-lg shadow-rose-500/30 scale-105'
                : 'w-8 h-8 bg-slate-800 text-slate-300 border border-slate-700 text-xs'
            }`}
          >
            {call.number}
          </div>
        ))}
      </div>
    </div>
  );
};
