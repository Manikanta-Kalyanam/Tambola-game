import React, { useState, useEffect } from 'react';
import { getNumberCallDisplay } from '../shared/tambola';
import { speakNumber, triggerHaptic } from '../utils/audio';
import { Volume2, Play, Sparkles } from 'lucide-react';

interface FloatingBallProps {
  currentNumber: number | null;
  totalCalls: number;
  isHost: boolean;
  onCallNext?: () => void;
  callingNumber?: boolean;
}

export const FloatingBall: React.FC<FloatingBallProps> = ({
  currentNumber,
  totalCalls,
  isHost,
  onCallNext,
  callingNumber,
}) => {
  const [pulse, setPulse] = useState(false);

  // Trigger brief bounce animation whenever the called number changes
  useEffect(() => {
    if (currentNumber !== null) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timer);
    }
  }, [currentNumber]);

  const handleBallClick = () => {
    if (currentNumber !== null) {
      triggerHaptic(30);
      speakNumber(currentNumber);
    }
  };

  const displayText = currentNumber ? getNumberCallDisplay(currentNumber) : null;

  return (
    <div className="fixed top-2.5 right-2.5 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 select-none pointer-events-auto">
      {/* Mini info pill attached to the left of the ball */}
      {currentNumber !== null ? (
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl py-1 px-2.5 backdrop-blur-xl shadow-xl max-w-[170px] sm:max-w-xs transition-all">
          <div className="overflow-hidden text-right">
            <p className="text-[10px] sm:text-xs font-bold text-amber-300 font-mono truncate leading-tight">
              {displayText}
            </p>
            <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono leading-tight">
              #{totalCalls}/90
            </p>
          </div>

          {/* Quick Draw Next button for Host right on the floating pill */}
          {isHost && onCallNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCallNext();
              }}
              disabled={callingNumber || totalCalls >= 90}
              className="px-2 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-90 text-white font-black text-[10px] flex items-center gap-0.5 shadow-md transition-all flex-shrink-0 disabled:opacity-50"
              title="Draw next ball"
            >
              <Play className="w-2.5 h-2.5 fill-white" />
              <span>Next</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl py-1 px-2.5 backdrop-blur-xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-mono">Ready to play</span>
        </div>
      )}

      {/* Floating 3D Ball */}
      <button
        type="button"
        onClick={handleBallClick}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bingo-ball flex items-center justify-center shadow-2xl relative transition-transform active:scale-90 ${
          pulse ? 'scale-110 ring-4 ring-rose-500/60' : 'hover:scale-105'
        }`}
        title={currentNumber ? `Ball ${currentNumber} - Tap to hear` : 'Waiting for call'}
      >
        {/* Inner white circle */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center shadow-inner">
          <span className="font-mono font-black text-sm sm:text-base text-slate-950 tracking-tight leading-none">
            {currentNumber !== null ? currentNumber : '?'}
          </span>
        </div>
      </button>
    </div>
  );
};

