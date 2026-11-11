import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Shuffle, Sparkles, Clock, Crown, AlertCircle } from 'lucide-react';
import { NUMBER_NICKNAMES } from '../shared/tambola';

interface HostControlsProps {
  onCallNumber: () => Promise<void>;
  onSetAutoCallSpeed: (speed: number) => Promise<void>;
  onResetGame: () => Promise<void>;
  autoCallSpeed: number;
  totalCalls: number;
  callingNumber: boolean;
  gameStatus: 'waiting' | 'in_progress' | 'completed';
}

export const HostControls: React.FC<HostControlsProps> = ({
  onCallNumber,
  onSetAutoCallSpeed,
  onResetGame,
  autoCallSpeed,
  totalCalls,
  callingNumber,
  gameStatus,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const remainingCount = 90 - totalCalls;

  const handleSpeedSelect = async (speed: number) => {
    await onSetAutoCallSpeed(speed);
  };

  const handleReset = async () => {
    setShowConfirmReset(false);
    await onResetGame();
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-rose-500/10 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Host Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              Host Caller Console
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                Room Admin
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Draw numbers manually or enable auto-caller timer. You also have a ticket to play!
            </p>
          </div>
        </div>

        {/* Remaining balls counter */}
        <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Remaining: </span>
          <span className="text-rose-400 font-bold">{remainingCount}</span>
          <span className="text-slate-500"> / 90</span>
        </div>
      </div>

      {/* Main Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Draw Next Number Button */}
        <button
          type="button"
          onClick={onCallNumber}
          disabled={callingNumber || remainingCount <= 0 || gameStatus === 'completed'}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-base tracking-wide shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Shuffle className={`w-5 h-5 ${callingNumber ? 'animate-spin' : ''}`} />
          <span>{callingNumber ? 'Drawing Ball...' : remainingCount <= 0 ? 'All 90 Called!' : 'Draw Next Number'}</span>
        </button>

        {/* Auto Caller Speed Selector */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Auto-Caller:</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { label: 'Off', val: 0 },
              { label: '5s', val: 5 },
              { label: '3s', val: 3 },
              { label: '2s', val: 2 },
            ].map(({ label, val }) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSpeedSelect(val)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  autoCallSpeed === val
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Game Button */}
        {showConfirmReset ? (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="px-3 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow"
            >
              Confirm Reset?
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-2.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            title="Reset Board & Deal New Tickets"
            className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        )}
      </div>
    </div>
  );
};
