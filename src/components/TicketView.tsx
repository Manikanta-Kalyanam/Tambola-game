import React from 'react';
import { TicketGrid } from '../shared/types';
import { playDabSound } from '../utils/audio';
import { CheckCheck, Sparkles, Tag } from 'lucide-react';

interface TicketViewProps {
  ticket: TicketGrid;
  dabs: Set<number>;
  calledNumbersSet: Set<number>;
  onToggleDab: (num: number) => void;
  onAutoDabAllCalled?: () => void;
  winningNumbersSet?: Set<number>;
}

export const TicketView: React.FC<TicketViewProps> = ({
  ticket,
  dabs,
  calledNumbersSet,
  onToggleDab,
  onAutoDabAllCalled,
  winningNumbersSet = new Set(),
}) => {
  // Count total marked numbers on this ticket
  let totalTicketNumbers = 0;
  let markedCount = 0;

  for (const row of ticket) {
    for (const val of row) {
      if (val !== null) {
        totalTicketNumbers++;
        if (dabs.has(val)) {
          markedCount++;
        }
      }
    }
  }

  const handleCellClick = (num: number | null) => {
    if (num === null) return;
    playDabSound();
    onToggleDab(num);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Ticket Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Your Tambola Ticket
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                3 × 9 Grid
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Tap numbers to manually dab. Mark matching numbers as they are called.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs font-mono">
            <span className="text-slate-400">Dabbed: </span>
            <span className="text-amber-400 font-bold">{markedCount}</span>
            <span className="text-slate-500"> / {totalTicketNumbers}</span>
          </div>

          {/* Quick Auto-dab button */}
          {onAutoDabAllCalled && (
            <button
              onClick={onAutoDabAllCalled}
              title="Dab all numbers called so far"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Dab All Called</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Grid Table (Responsive with horizontal scrolling on extra small screens) */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[540px] sm:min-w-0 bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-500/10 p-2 sm:p-3 rounded-2xl border-2 border-amber-500/30 shadow-inner">
          {/* Ticket Column Headers */}
          <div className="grid grid-cols-9 gap-1.5 sm:gap-2 mb-1.5 text-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            <div>1-9</div>
            <div>10-19</div>
            <div>20-29</div>
            <div>30-39</div>
            <div>40-49</div>
            <div>50-59</div>
            <div>60-69</div>
            <div>70-79</div>
            <div>80-90</div>
          </div>

          {/* Ticket Rows */}
          <div className="space-y-1.5 sm:space-y-2">
            {ticket.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-9 gap-1.5 sm:gap-2">
                {row.map((val, cIdx) => {
                  if (val === null) {
                    return (
                      <div
                        key={cIdx}
                        className="h-12 sm:h-14 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-center opacity-40 select-none"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      </div>
                    );
                  }

                  const isCalled = calledNumbersSet.has(val);
                  const isDabbed = dabs.has(val);
                  const isWinningNumber = winningNumbersSet.has(val);

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleCellClick(val)}
                      className={`h-12 sm:h-14 rounded-xl font-bold font-mono text-base sm:text-lg transition-all relative flex flex-col items-center justify-center select-none active:scale-95 group shadow-sm ${
                        isDabbed
                          ? isCalled
                            ? 'bg-rose-600/90 text-white border-2 border-rose-400 shadow-rose-600/30'
                            : 'bg-amber-600/80 text-white border-2 border-amber-400'
                          : isCalled
                          ? 'bg-emerald-950/50 text-emerald-300 border-2 border-emerald-500/60 hover:border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {/* Number value */}
                      <span className="relative z-10">{val}</span>

                      {/* Dab stamp indicator */}
                      {isDabbed && (
                        <span className="absolute inset-1 rounded-lg bg-rose-500/20 pointer-events-none animate-pulse-fast" />
                      )}

                      {/* Small Called status badge dot */}
                      {isCalled && !isDabbed && (
                        <span
                          title="Called number! Tap to dab"
                          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"
                        />
                      )}

                      {/* Warning if player dabbed an uncalled number */}
                      {isDabbed && !isCalled && (
                        <span
                          title="Not called yet! Avoid bogey claim"
                          className="absolute -top-1 -right-1 text-[9px] font-sans font-bold bg-amber-400 text-slate-950 px-1 rounded-full shadow"
                        >
                          !
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend / Tip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-rose-600 border border-rose-400 inline-block" />
            <span>Marked (Dabbed)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-950 border border-emerald-500 inline-block" />
            <span>Called by Caller</span>
          </span>
        </div>
        <span className="text-slate-500 text-[10px]">
          Row 1: Top Line • Row 2: Middle Line • Row 3: Bottom Line
        </span>
      </div>
    </div>
  );
};
