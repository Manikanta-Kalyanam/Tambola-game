import React from 'react';
import { NUMBER_NICKNAMES } from '../shared/tambola';
import { Radio } from 'lucide-react';

interface CurrentBallProps {
  currentNumber: number | null;
  callOrder?: number;
  totalCalls: number;
}

export const CurrentBall: React.FC<CurrentBallProps> = ({ currentNumber, callOrder, totalCalls }) => {
  const nickname = currentNumber ? NUMBER_NICKNAMES[currentNumber] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">
      {/* Background radial glow */}
      {currentNumber && (
        <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 via-transparent to-transparent pointer-events-none" />
      )}

      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
        <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        <span className="uppercase tracking-wider">Latest Called Ball</span>
      </div>

      {currentNumber !== null ? (
        <div className="flex flex-col items-center animate-pop">
          {/* 3D Glossy Ball */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bingo-ball flex items-center justify-center shadow-2xl relative my-1 transition-transform transform hover:scale-105 select-none">
            {/* Inner white circle */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span className="font-black text-3xl sm:text-4xl text-slate-950 font-mono tracking-tight">
                {currentNumber}
              </span>
            </div>
          </div>

          {/* Caller Nickname */}
          <div className="mt-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 max-w-xs">
            <p className="text-xs sm:text-sm font-bold text-amber-300 truncate">
              {nickname || `Number ${currentNumber}`}
            </p>
          </div>

          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Ball #{callOrder || totalCalls} of 90
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 mb-2">
            <span className="text-2xl font-black">?</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Ready to play!</p>
          <p className="text-[11px] text-slate-500">Waiting for the host to draw the first ball</p>
        </div>
      )}
    </div>
  );
};

