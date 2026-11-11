import React from 'react';
import { X, Trophy, ShieldCheck, History, Award, CheckCircle2, Crown, Coins } from 'lucide-react';
import { PrizeType, PRIZE_NAMES, WinnerInfo, CallRecord, RoomRewards } from '../shared/types';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: Partial<Record<PrizeType, WinnerInfo>>;
  calls: CallRecord[];
  roomCode: string;
  rewards?: RoomRewards;
}

const ALL_PRIZES: PrizeType[] = [
  'early_five',
  'top_line',
  'middle_line',
  'bottom_line',
  'full_house',
];

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  winners,
  calls,
  roomCode,
  rewards,
}) => {
  if (!isOpen) return null;

  const totalWinners = Object.keys(winners).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-pop">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Prizes & Winners
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {roomCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Auto-verified prizes & reward distribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Winners Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Prizes Won ({totalWinners}/5 Claimed)</span>
              </h4>
              {rewards?.ticket_price && (
                <span className="text-[11px] font-mono text-slate-400">
                  Ticket Price: <strong className="text-amber-300">{rewards.ticket_price}</strong>
                </span>
              )}
            </div>

            <div className="space-y-2">
              {ALL_PRIZES.map((pType) => {
                const winner = winners[pType];
                const isWon = Boolean(winner);
                const prizeReward = winner?.reward || (rewards ? rewards[pType] : '');

                return (
                  <div
                    key={pType}
                    className={`p-3 rounded-2xl border transition-all ${
                      isWon
                        ? 'bg-gradient-to-br from-amber-500/15 via-slate-900 to-rose-500/10 border-amber-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{PRIZE_NAMES[pType]}</span>
                        {prizeReward && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold">
                            <Coins className="w-2.5 h-2.5" /> {prizeReward}
                          </span>
                        )}
                      </div>
                      {isWon ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" /> Auto-Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Unclaimed</span>
                      )}
                    </div>

                    {isWon && winner ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Winner: {winner.playerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(winner.claimedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Numbers: {winner.verifiedNumbers.join(', ')}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">Waiting for lucky winner</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Called Numbers History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-rose-400" />
              <span>Full Called Numbers ({calls.length}/90)</span>
            </h4>

            {calls.length > 0 ? (
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                  {calls.map((call) => (
                    <span
                      key={call.number}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px] font-bold"
                    >
                      #{call.order}: {call.number}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No numbers called yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
