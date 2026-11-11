import React from 'react';
import { Users, Activity, Crown, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { PlayerPublic, ClaimRecord, PRIZE_NAMES } from '../shared/types';

interface PlayersLogProps {
  players: PlayerPublic[];
  claimsLog: ClaimRecord[];
  myPlayerId?: string;
}

export const PlayersLog: React.FC<PlayersLogProps> = ({ players, claimsLog, myPlayerId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Players List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Users className="w-4 h-4 text-rose-400" />
            <span>Players in Room ({players.length})</span>
          </div>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  isMe
                    ? 'bg-rose-500/10 border-rose-500/30 text-white font-semibold'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {p.isHost ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                  <span>{p.name}</span>
                  {isMe && <span className="text-[10px] text-rose-400 font-bold">(You)</span>}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {p.isHost ? 'Host' : 'Player'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Claims Activity Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Live Auto-Verification Feed</span>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {claimsLog.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 italic">
              No claim attempts yet.
            </div>
          ) : (
            claimsLog.map((claim) => {
              const isAccepted = claim.status === 'accepted';
              const isBogey = claim.status === 'rejected_bogey';

              return (
                <div
                  key={claim.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    isAccepted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : isBogey
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  {isAccepted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : isBogey ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold truncate">{claim.playerName}</span>
                      <span className="text-[10px] font-mono opacity-60">
                        {new Date(claim.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-90">{claim.message}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
