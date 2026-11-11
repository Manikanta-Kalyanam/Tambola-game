import React, { useState } from 'react';
import { Grid, ChevronDown, ChevronUp } from 'lucide-react';

interface BoardViewProps {
  calledNumbersSet: Set<number>;
  currentNumber: number | null;
}

export const BoardView: React.FC<BoardViewProps> = ({ calledNumbersSet, currentNumber }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Generate 1..90 in a 10-row x 9-col or standard 1..90 layout
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Master Board (1–90)
            </h3>
            <p className="text-xs text-slate-400">
              Live status of all called numbers across the game
            </p>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand Board' : 'Collapse Board'}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-2">
          <div className="grid grid-cols-10 sm:grid-cols-10 gap-1 sm:gap-1.5 text-center">
            {numbers.map((num) => {
              const isCalled = calledNumbersSet.has(num);
              const isCurrent = currentNumber === num;

              return (
                <div
                  key={num}
                  className={`h-7 sm:h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all select-none ${
                    isCurrent
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105 z-10 animate-pulse'
                      : isCalled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950/60 text-slate-600 border border-slate-800/60'
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                <span className="text-slate-400">Called</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                <span className="text-slate-400">Current</span>
              </span>
            </div>
            <span>{calledNumbersSet.size} of 90 marked</span>
          </div>
        </div>
      )}
    </div>
  );
};

