import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { TicketGrid, PrizeType, WinnerInfo, RoomRewards } from '../shared/types';
import { playDabSound, triggerHaptic, playWinSound, playBogeySound } from '../utils/audio';
import { Tag, Trophy, CheckCircle, AlertTriangle, Sparkles, Loader2, Award } from 'lucide-react';

interface TicketViewProps {
  tickets: TicketGrid[];
  dabs: Set<string>; // Stored as `${ticketIndex}_${num}`
  calledNumbersSet: Set<number>;
  onToggleDab: (ticketIndex: number, num: number) => void;
  winners?: Partial<Record<PrizeType, WinnerInfo>>;
  rewards?: RoomRewards;
  myPlayerId?: string;
  onClaim?: (prizeType: PrizeType) => Promise<{
    accepted: boolean;
    status: string;
    message: string;
  }>;
  winningNumbersSet?: Set<number>;
}

const MINI_PRIZES: { type: PrizeType; short: string; label: string }[] = [
  { type: 'early_five', short: 'Early 5', label: 'Early 5' },
  { type: 'top_line', short: 'Top Line', label: 'Top Line' },
  { type: 'middle_line', short: 'Mid Line', label: 'Mid Line' },
  { type: 'bottom_line', short: 'Bot Line', label: 'Bot Line' },
  { type: 'full_house', short: 'Full House', label: 'Full House' },
];

export const TicketView: React.FC<TicketViewProps> = ({
  tickets,
  dabs,
  calledNumbersSet,
  onToggleDab,
  winners = {},
  rewards = {},
  myPlayerId,
  onClaim,
}) => {
  const [claimingPrize, setClaimingPrize] = useState<PrizeType | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{
    accepted: boolean;
    message: string;
  } | null>(null);

  const safeTickets = tickets && tickets.length > 0 ? tickets : [];

  if (safeTickets.length === 0) {
    return null;
  }

  const handleCellClick = (ticketIdx: number, num: number | null) => {
    if (num === null) return;

    // Strict validation: If number has NOT been called yet, do not allow selection!
    if (!calledNumbersSet.has(num)) {
      // Gentle error haptic vibration indicating action not allowed
      triggerHaptic([60, 40, 60]);
      return;
    }

    // Number has been called -> allow dab toggle
    playDabSound();
    onToggleDab(ticketIdx, num);
  };

  const handleClaimClick = async (prizeType: PrizeType) => {
    if (!onClaim || claimingPrize) return;
    setClaimingPrize(prizeType);
    setClaimFeedback(null);

    try {
      const res = await onClaim(prizeType);
      setClaimFeedback({
        accepted: res.accepted,
        message: res.message,
      });

      if (res.accepted) {
        playWinSound();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
        });
      } else {
        playBogeySound();
      }

      setTimeout(() => {
        setClaimFeedback(null);
      }, 5000);
    } catch (err: any) {
      playBogeySound();
      setClaimFeedback({
        accepted: false,
        message: err.message || 'Claim failed',
      });
    } finally {
      setClaimingPrize(null);
    }
  };

  // Render the Prize Claim Buttons
  const renderPrizeButtons = (isStickyBottom: boolean = false) => {
    if (!onClaim) return null;

    return (
      <div className={isStickyBottom ? 'w-full' : 'mt-4 pt-3 border-t border-slate-800/80'}>
        {!isStickyBottom && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>Instant Claim Prizes (Auto-Verified)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Tap any to claim
            </span>
          </div>
        )}

        <div className="grid grid-cols-5 gap-1.5">
          {MINI_PRIZES.map(({ type, short }) => {
            const winner = winners ? winners[type] : undefined;
            const isWon = Boolean(winner);
            const didIWin = isWon && winner?.playerId === myPlayerId;
            const prizeReward = rewards ? rewards[type] : '';
            const isPending = claimingPrize === type;

            if (isWon) {
              return (
                <div
                  key={type}
                  className={`py-1.5 px-1 rounded-xl text-center flex flex-col items-center justify-center border transition-all ${
                    didIWin
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-bold truncate leading-tight w-full">
                    {short}
                  </span>
                  <span className="text-[8px] truncate leading-tight w-full opacity-90 mt-0.5">
                    {didIWin ? '🏆 Won!' : winner?.playerName}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleClaimClick(type)}
                disabled={isPending}
                className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-bold text-center flex flex-col items-center justify-center shadow-md transition-all border border-amber-400/30 disabled:opacity-50"
              >
                <div className="flex items-center gap-0.5">
                  {isPending ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                  )}
                  <span className="text-[9px] sm:text-[10px] font-bold leading-tight truncate">
                    {short}
                  </span>
                </div>
                {prizeReward && (
                  <span className="text-[8px] font-mono text-amber-100 font-semibold leading-tight mt-0.5 truncate max-w-full">
                    {prizeReward}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {claimFeedback && (
          <div
            className={`mt-2 p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 animate-pop ${
              claimFeedback.accepted
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
            }`}
          >
            {claimFeedback.accepted ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="truncate">{claimFeedback.message}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Player Tickets Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Your Tambola Tickets</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
                {safeTickets.length} {safeTickets.length === 1 ? 'Ticket' : 'Tickets Stacked'}
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Scroll down to see all
        </span>
      </div>

      {/* ALL TICKETS DISPLAYED ONE BY ONE IN SINGLE VIEW (DOWN BY DOWN) */}
      <div className="space-y-4">
        {safeTickets.map((ticket, tIdx) => {
          // Count marks for this ticket
          let tMarked = 0;
          for (const row of ticket) {
            for (const val of row) {
              if (val !== null && dabs.has(`${tIdx}_${val}`)) {
                tMarked++;
              }
            }
          }

          return (
            <div
              key={tIdx}
              className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-xl backdrop-blur-md relative"
            >
              {/* STICKY TICKET HEADER - Sticks cleanly while scrolling through this ticket */}
              <div className="sticky top-[108px] sm:top-[68px] z-20 -mx-1 px-3 py-2 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-md backdrop-blur-md mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center text-xs font-mono font-black">
                    #{tIdx + 1}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white">
                    Ticket #{tIdx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden hidden xs:block">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                      style={{ width: `${(tMarked / 15) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {tMarked}/15 Dabbed
                  </span>
                </div>
              </div>

              {/* 3x9 Ticket Grid */}
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
                  {ticket.map((row, rIdx) => (
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

                        const isDabbed = dabs.has(`${tIdx}_${val}`);

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleCellClick(tIdx, val)}
                            className={`aspect-square rounded-lg sm:rounded-xl font-mono font-bold text-xs sm:text-base transition-all relative flex items-center justify-center select-none active:scale-90 shadow-sm ${
                              isDabbed
                                ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-2 border-rose-300 shadow-rose-600/40 shadow-md scale-[1.02]'
                                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80'
                            }`}
                          >
                            <span className="relative z-10 leading-none">{val}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prize buttons placed directly below the tickets in small mobile-friendly buttons */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-xl backdrop-blur-md">
        {renderPrizeButtons(false)}
      </div>

      {/* Sticky Bottom Dock for Mobile (Always accessible when scrolling through tickets) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 p-2 sm:hidden backdrop-blur-xl shadow-2xl">
        <div className="max-w-md mx-auto">
          {renderPrizeButtons(true)}
        </div>
      </div>
    </div>
  );
};
