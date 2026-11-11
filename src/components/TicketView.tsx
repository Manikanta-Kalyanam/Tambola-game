import React, { useState } from 'react';
import { TicketGrid } from '../shared/types';
import { playDabSound } from '../utils/audio';
import { CheckCheck, Sparkles, Tag, Layers, ChevronRight, ChevronLeft } from 'lucide-react';

interface TicketViewProps {
  tickets: TicketGrid[];
  dabs: Set<string>; // Stored as `${ticketIndex}_${num}`
  calledNumbersSet: Set<number>;
  onToggleDab: (ticketIndex: number, num: number) => void;
  onAutoDabAllCalled?: (ticketIndex: number) => void;
  winningNumbersSet?: Set<number>;
}

export const TicketView: React.FC<TicketViewProps> = ({
  tickets,
  dabs,
  calledNumbersSet,
  onToggleDab,
  onAutoDabAllCalled,
  winningNumbersSet = new Set(),
}) => {
  const [activeTicketIdx, setActiveTicketIdx] = useState<number>(0);

  const safeTickets = tickets && tickets.length > 0 ? tickets : [];
  const currentTicket = safeTickets[activeTicketIdx] || safeTickets[0];

  if (!currentTicket) {
    return null;
  }

  // Count marks for current ticket
  let currentTicketTotal = 0;
  let currentTicketMarked = 0;

  for (const row of currentTicket) {
    for (const val of row) {
      if (val !== null) {
        currentTicketTotal++;
        if (dabs.has(`${activeTicketIdx}_${val}`)) {
          currentTicketMarked++;
        }
      }
    }
  }

  const handleCellClick = (num: number | null) => {
    if (num === null) return;
    playDabSound();
    onToggleDab(activeTicketIdx, num);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Multiple Tickets Selector Tabs */}
      {safeTickets.length > 1 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Your Tickets ({safeTickets.length} Total)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Tap to switch active ticket
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {safeTickets.map((t, idx) => {
              // Count marked for this specific ticket
              let tMarked = 0;
              for (const r of t) {
                for (const v of r) {
                  if (v !== null && dabs.has(`${idx}_${v}`)) tMarked++;
                }
              }

              const isActive = activeTicketIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTicketIdx(idx)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>Ticket {idx + 1}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-rose-800 text-rose-100' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {tMarked}/15
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ticket Header & Stats Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>Ticket #{activeTicketIdx + 1}</span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                ({currentTicketMarked}/15 Dabbed)
              </span>
            </h3>
          </div>
        </div>

        {/* Auto-dab current ticket */}
        {onAutoDabAllCalled && (
          <button
            onClick={() => onAutoDabAllCalled(activeTicketIdx)}
            title="Dab all called numbers on this ticket"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dab Called</span>
          </button>
        )}
      </div>

      {/* Mobile-Optimized 3x9 Ticket Grid */}
      <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-500/10 p-1.5 sm:p-3 rounded-2xl border-2 border-amber-500/30 shadow-inner">
        {/* Column Bounds Labels */}
        <div className="grid grid-cols-9 gap-1 sm:gap-1.5 mb-1 text-center text-[8px] sm:text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
          <div>1-9</div>
          <div>10s</div>
          <div>20s</div>
          <div>30s</div>
          <div>40s</div>
          <div>50s</div>
          <div>60s</div>
          <div>70s</div>
          <div>80s</div>
        </div>

        {/* The 3 Rows */}
        <div className="space-y-1 sm:space-y-1.5">
          {currentTicket.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-9 gap-1 sm:gap-1.5">
              {row.map((val, cIdx) => {
                if (val === null) {
                  return (
                    <div
                      key={cIdx}
                      className="aspect-square rounded-lg sm:rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-center opacity-30 select-none"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                    </div>
                  );
                }

                const isCalled = calledNumbersSet.has(val);
                const isDabbed = dabs.has(`${activeTicketIdx}_${val}`);

                return (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => handleCellClick(val)}
                    className={`aspect-square rounded-lg sm:rounded-xl font-mono font-bold text-xs sm:text-base transition-all relative flex items-center justify-center select-none active:scale-90 shadow-sm ${
                      isDabbed
                        ? isCalled
                          ? 'bg-rose-600 text-white border-2 border-rose-300 shadow-rose-600/30'
                          : 'bg-amber-600 text-white border-2 border-amber-300'
                        : isCalled
                        ? 'bg-emerald-950/60 text-emerald-300 border-2 border-emerald-500 hover:border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                    }`}
                  >
                    <span className="relative z-10 leading-none">{val}</span>

                    {/* Green ping dot if called and not yet dabbed */}
                    {isCalled && !isDabbed && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}

                    {/* Warning dot if dabbed an uncalled number */}
                    {isDabbed && !isCalled && (
                      <span
                        title="Uncalled number"
                        className="absolute -top-1 -right-1 text-[8px] font-bold bg-amber-400 text-slate-950 px-1 rounded-full leading-none"
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

      {/* Mobile Footer Tip */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
            <span>Marked</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Called</span>
          </span>
        </div>
        <span className="text-slate-500">
          {safeTickets.length > 1
            ? `Viewing Ticket ${activeTicketIdx + 1} of ${safeTickets.length}`
            : 'Standard 3×9 Ticket'}
        </span>
      </div>
    </div>
  );
};
