import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, AlertTriangle, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { PrizeType, PRIZE_NAMES, PRIZE_DESCRIPTIONS, WinnerInfo } from '../shared/types';
import { playWinSound, playBogeySound } from '../utils/audio';

interface ClaimsBarProps {
  winners: Partial<Record<PrizeType, WinnerInfo>>;
  myPlayerId?: string;
  onClaim: (prizeType: PrizeType) => Promise<{
    accepted: boolean;
    status: string;
    message: string;
  }>;
}

const PRIZES: { type: PrizeType; short: string; badge: string }[] = [
  { type: 'early_five', short: 'Early 5', badge: 'Any 5 Nos' },
  { type: 'top_line', short: 'Top Line', badge: 'Row 1 (5 Nos)' },
  { type: 'middle_line', short: 'Middle Line', badge: 'Row 2 (5 Nos)' },
  { type: 'bottom_line', short: 'Bottom Line', badge: 'Row 3 (5 Nos)' },
  { type: 'full_house', short: 'Full House', badge: 'All 15 Nos' },
];

export const ClaimsBar: React.FC<ClaimsBarProps> = ({ winners, myPlayerId, onClaim }) => {
  const [claimingPrize, setClaimingPrize] = useState<PrizeType | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{
    prizeType: PrizeType;
    accepted: boolean;
    message: string;
  } | null>(null);

  const handleClaimClick = async (prizeType: PrizeType) => {
    if (claimingPrize) return;
    setClaimingPrize(prizeType);
    setClaimFeedback(null);

    try {
      const res = await onClaim(prizeType);
      setClaimFeedback({
        prizeType,
        accepted: res.accepted,
        message: res.message,
      });

      if (res.accepted) {
        playWinSound();
        // Fire confetti celebration!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } else {
        playBogeySound();
      }

      // Auto clear feedback message after 5 seconds
      setTimeout(() => {
        setClaimFeedback(null);
      }, 6000);
    } catch (err: any) {
      playBogeySound();
      setClaimFeedback({
        prizeType,
        accepted: false,
        message: err.message || 'Claim failed.',
      });
    } finally {
      setClaimingPrize(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Prizes & Auto-Verification
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Auto Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Claim when your marked numbers meet the pattern. Instant server verification.
            </p>
          </div>
        </div>
      </div>

      {/* Floating feedback alert */}
      {claimFeedback && (
        <div
          className={`mb-4 p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-pop ${
            claimFeedback.accepted
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          {claimFeedback.accepted ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{claimFeedback.message}</span>
        </div>
      )}

      {/* Prize Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PRIZES.map(({ type, short, badge }) => {
          const winner = winners[type];
          const isWon = Boolean(winner);
          const didIWin = isWon && winner?.playerId === myPlayerId;
          const isPendingThis = claimingPrize === type;

          return (
            <div
              key={type}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                didIWin
                  ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : isWon
                  ? 'bg-slate-950/70 border-slate-800 opacity-90'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">{short}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {PRIZE_DESCRIPTIONS[type]}
                </p>
              </div>

              {/* Status or Claim Button */}
              {isWon ? (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Trophy className={`w-3.5 h-3.5 ${didIWin ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className={`font-bold truncate ${didIWin ? 'text-amber-300' : 'text-slate-200'}`}>
                      {didIWin ? 'You Won!' : winner?.playerName}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">
                    Verified
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleClaimClick(type)}
                  disabled={isPendingThis}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isPendingThis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim {short}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
