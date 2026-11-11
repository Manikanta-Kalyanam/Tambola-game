import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, ArrowRight, RotateCcw, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { StoredSession, getSavedSession } from '../utils/api';

interface HomeScreenProps {
  onCreateRoom: (hostName: string) => Promise<void>;
  onJoinRoom: (code: string, name: string) => Promise<void>;
  onReconnect: (session: StoredSession) => Promise<void>;
  loading: boolean;
  errorMessage: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onReconnect,
  loading,
  errorMessage,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [hostName, setHostName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [savedSession, setSavedSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    // Check saved session
    const session = getSavedSession();
    if (session) {
      setSavedSession(session);
    }

    // Check URL params for room code invite link
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setRoomCode(urlRoom.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateRoom(hostName);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;
    await onJoinRoom(roomCode.trim(), playerName.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-emerald-500 p-0.5 shadow-xl shadow-rose-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                90
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Tambola <span className="text-rose-500">Live</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Classic 90-ball Housie with instant server Auto-Verification
          </p>
        </div>

        {/* Reconnect Banner if previous game saved */}
        {savedSession && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Resume Previous Game</h4>
                  <p className="text-xs text-slate-300">
                    Room <span className="font-mono text-amber-400 font-bold">{savedSession.roomCode}</span> as{' '}
                    <span className="font-semibold text-white">{savedSession.playerName}</span>
                    {savedSession.isHost ? ' (Host)' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onReconnect(savedSession)}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Rejoin
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'create'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setTab('join')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'join'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Join Room
            </button>
          </div>

          {/* Form */}
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Host Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain Tambola"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Host plays with a standard 3×9 ticket</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Claims auto-verified instantly with zero delays</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !hostName.trim()}
                className="w-full mt-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Creating Game...' : 'Create Room & Start'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Room Code (6 characters)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAM92X"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-4 py-3 text-base font-mono tracking-widest text-amber-400 placeholder-slate-600 uppercase outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lucky Player"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !roomCode.trim() || !playerName.trim()}
                className="w-full mt-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Joining Game...' : 'Join Game'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-3 mt-6 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Instant Verification</div>
            <div className="text-[10px] text-slate-500">Auto checked</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Bogey Protection</div>
            <div className="text-[10px] text-slate-500">Zero false wins</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Sparkles className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">No Sign-in</div>
            <div className="text-[10px] text-slate-500">Token persistence</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 relative z-10 py-4">
        Standard 3×9 Tambola (90-Ball Housie) • Designed for fair multiplayer play
      </footer>
    </div>
  );
};
