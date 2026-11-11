import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Sparkles,
  Clock,
  Crown,
  AlertCircle,
  Coins,
  Settings2,
  Check,
} from 'lucide-react';
import { NUMBER_NICKNAMES } from '../shared/tambola';
import { RoomRewards } from '../shared/types';

interface HostControlsProps {
  onCallNumber: () => Promise<void>;
  onSetAutoCallSpeed: (speed: number) => Promise<void>;
  onResetGame: () => Promise<void>;
  onUpdateRewards?: (rewards: RoomRewards) => Promise<void>;
  currentRewards?: RoomRewards;
  autoCallSpeed: number;
  totalCalls: number;
  callingNumber: boolean;
  gameStatus: 'waiting' | 'in_progress' | 'completed';
}

export const HostControls: React.FC<HostControlsProps> = ({
  onCallNumber,
  onSetAutoCallSpeed,
  onResetGame,
  onUpdateRewards,
  currentRewards,
  autoCallSpeed,
  totalCalls,
  callingNumber,
  gameStatus,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRewardsEditor, setShowRewardsEditor] = useState(false);
  const [rewardsForm, setRewardsForm] = useState<RoomRewards>(currentRewards || {});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const remainingCount = 90 - totalCalls;

  const handleSpeedSelect = async (speed: number) => {
    await onSetAutoCallSpeed(speed);
  };

  const handleReset = async () => {
    setShowConfirmReset(false);
    await onResetGame();
  };

  const handleSaveRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateRewards) {
      await onUpdateRewards(rewardsForm);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setShowRewardsEditor(false);
      }, 1200);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-rose-500/10 border-2 border-amber-500/30 rounded-3xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Host Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
              Host Controls
              <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded-full font-bold">
                Admin
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Rewards button */}
          {onUpdateRewards && (
            <button
              onClick={() => setShowRewardsEditor(!showRewardsEditor)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <Coins className="w-3 h-3" />
              <span>Edit Rewards</span>
            </button>
          )}

          {/* Remaining balls counter */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Left: </span>
            <span className="text-rose-400 font-bold">{remainingCount}</span>
            <span className="text-slate-500">/90</span>
          </div>
        </div>
      </div>

      {/* Rewards Editor Modal/Accordion */}
      {showRewardsEditor && (
        <form onSubmit={handleSaveRewards} className="mb-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-pop">
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span className="flex items-center gap-1 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              Customize Pricing & Rewards
            </span>
            <span className="text-[10px] text-slate-500">Updates live for all players</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Ticket Price</label>
              <input
                type="text"
                value={rewardsForm.ticket_price || ''}
                onChange={(e) => setRewardsForm({ ...rewardsForm, ticket_price: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Early 5 Prize</label>
              <input
                type="text"
                value={rewardsForm.early_five || ''}
                onChange={(e) => setRewardsForm({ ...rewardsForm, early_five: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Top Line</label>
              <input
                type="text"
                value={rewardsForm.top_line || ''}
                onChange={(e) => setRewardsForm({ ...rewardsForm, top_line: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Middle Line</label>
              <input
                type="text"
                value={rewardsForm.middle_line || ''}
                onChange={(e) => setRewardsForm({ ...rewardsForm, middle_line: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Bottom Line</label>
              <input
                type="text"
                value={rewardsForm.bottom_line || ''}
                onChange={(e) => setRewardsForm({ ...rewardsForm, bottom_line: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Full House (Tambola)</label>
            <input
              type="text"
              value={rewardsForm.full_house || ''}
              onChange={(e) => setRewardsForm({ ...rewardsForm, full_house: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowRewardsEditor(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Rewards'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Draw Next Number Button - Giant thumb-friendly button */}
        <button
          type="button"
          onClick={onCallNumber}
          disabled={callingNumber || remainingCount <= 0 || gameStatus === 'completed'}
          className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <Shuffle className={`w-5 h-5 ${callingNumber ? 'animate-spin' : ''}`} />
          <span>{callingNumber ? 'Drawing Ball...' : remainingCount <= 0 ? 'All 90 Called!' : 'Draw Next Number'}</span>
        </button>

        {/* Controls row for mobile */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-1.5">
          {/* Auto Caller Speed */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-2xl flex-1 sm:flex-initial">
            <span className="text-[10px] text-slate-400 font-semibold px-1 hidden xs:inline">Auto:</span>
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
                className={`py-1 px-2 sm:px-2.5 rounded-xl text-[11px] font-bold transition-all ${
                  autoCallSpeed === val
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Reset Game */}
          {showConfirmReset ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
              >
                Reset?
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-[11px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              title="Reset Board & New Tickets"
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
