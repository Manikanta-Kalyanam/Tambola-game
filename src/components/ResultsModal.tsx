import React from 'react';
import { X, Trophy, ShieldCheck, History, Award, CheckCircle2, Crown } from 'lucide-react';
import { PrizeType, PRIZE_NAMES, WinnerInfo, CallRecord } from '../shared/types';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: Partial<Record<PrizeType, WinnerInfo>>;
  calls: CallRecord[];
  roomCode: string;
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
}) => {
  if (!isOpen) return null;

  const totalWinners = Object.keys(winners).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-pop">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Room Results & Winners
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {roomCode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Auto-verified prize winners and complete called numbers log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Winners Section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Prize Winners ({totalWinners}/5 Claimed)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_PRIZES.map((pType) => {
                const winner = winners[pType];
                const isWon = Boolean(winner);

                return (
                  <div
                    key={pType}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWon
                        ? 'bg-gradient-to-br from-amber-500/10 to-slate-900 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-white">{PRIZE_NAMES[pType]}</span>
                      {isWon ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Auto-Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Unclaimed</span>
                      )}
                    </div>

                    {isWon && winner ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{winner.playerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Verified Numbers: {winner.verifiedNumbers.join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Claimed at: {new Date(winner.claimedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Still available to claim</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Called Numbers History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-rose-400" />
              <span>Full Call History ({calls.length}/90)</span>
            </h4>

            {calls.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {calls.map((call) => (
                    <span
                      key={call.number}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold"
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

