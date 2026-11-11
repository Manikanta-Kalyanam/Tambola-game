import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Ticket,
  Coins,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StoredSession, getSavedSession } from '../utils/api';
import { RoomRewards, DEFAULT_REWARDS } from '../shared/types';

interface HomeScreenProps {
  onCreateRoom: (hostName: string, ticketCount: number, rewards: RoomRewards) => Promise<void>;
  onJoinRoom: (code: string, name: string, ticketCount: number) => Promise<void>;
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
  const [hostTicketCount, setHostTicketCount] = useState<number>(1);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerTicketCount, setPlayerTicketCount] = useState<number>(1);
  const [savedSession, setSavedSession] = useState<StoredSession | null>(null);

  // Rewards configuration by host
  const [showRewardsCustomizer, setShowRewardsCustomizer] = useState(false);
  const [rewards, setRewards] = useState<RoomRewards>({ ...DEFAULT_REWARDS });

  useEffect(() => {
    const session = getSavedSession();
    if (session) {
      setSavedSession(session);
    }

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setRoomCode(urlRoom.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateRoom(hostName, hostTicketCount, rewards);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;
    await onJoinRoom(roomCode.trim(), playerName.trim(), playerTicketCount);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-emerald-500 p-0.5 shadow-xl shadow-rose-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                90
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tambola <span className="text-rose-500">Live</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
            Multiplayer 90-ball Housie with multiple tickets & host rewards
          </p>
        </div>

        {/* Reconnect Banner if previous game saved */}
        {savedSession && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Resume Previous Game</h4>
                  <p className="text-[11px] text-slate-300">
                    Room <span className="font-mono text-amber-400 font-bold">{savedSession.roomCode}</span> as{' '}
                    <span className="font-semibold text-white">{savedSession.playerName}</span>
                    {savedSession.isHost ? ' (Host)' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onReconnect(savedSession)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Rejoin
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'join'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Join Room
            </button>
          </div>

          {/* Create Room Form */}
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Host Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Captain Tambola"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Multiple Tickets Selector for Host */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-rose-400" />
                    <span>Your Tickets to Play</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {hostTicketCount} {hostTicketCount === 1 ? 'Ticket' : 'Tickets'}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHostTicketCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        hostTicketCount === num
                          ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-md shadow-rose-600/30'
                          : 'bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Rewards Customizer (Host control) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRewardsCustomizer(!showRewardsCustomizer)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span>Set Prize Rewards / Pricing</span>
                  </div>
                  {showRewardsCustomizer ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showRewardsCustomizer && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Ticket Price
                        </label>
                        <input
                          type="text"
                          value={rewards.ticket_price || ''}
                          onChange={(e) => setRewards({ ...rewards, ticket_price: e.target.value })}
                          placeholder="e.g. ₹20"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Early 5 Prize
                        </label>
                        <input
                          type="text"
                          value={rewards.early_five || ''}
                          onChange={(e) => setRewards({ ...rewards, early_five: e.target.value })}
                          placeholder="e.g. ₹50"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Top Line
                        </label>
                        <input
                          type="text"
                          value={rewards.top_line || ''}
                          onChange={(e) => setRewards({ ...rewards, top_line: e.target.value })}
                          placeholder="e.g. ₹100"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Middle Line
                        </label>
                        <input
                          type="text"
                          value={rewards.middle_line || ''}
                          onChange={(e) => setRewards({ ...rewards, middle_line: e.target.value })}
                          placeholder="e.g. ₹100"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Bottom Line
                        </label>
                        <input
                          type="text"
                          value={rewards.bottom_line || ''}
                          onChange={(e) => setRewards({ ...rewards, bottom_line: e.target.value })}
                          placeholder="e.g. ₹100"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Full House (Tambola) Prize
                      </label>
                      <input
                        type="text"
                        value={rewards.full_house || ''}
                        onChange={(e) => setRewards({ ...rewards, full_house: e.target.value })}
                        placeholder="e.g. ₹500"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !hostName.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Game...' : `Create Room (${hostTicketCount} Tickets)`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Join Room Form */
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Room Code (6 characters)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAM92X"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-base font-mono tracking-widest text-amber-400 placeholder-slate-600 uppercase outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lucky Player"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Number of tickets for joining player */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-rose-400" />
                    <span>How many tickets do you want?</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {playerTicketCount} {playerTicketCount === 1 ? 'Ticket' : 'Tickets'}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPlayerTicketCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        playerTicketCount === num
                          ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-md shadow-rose-600/30'
                          : 'bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !roomCode.trim() || !playerName.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Joining Game...' : `Join Game (${playerTicketCount} Tickets)`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Ticket className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">1–6 Tickets</div>
            <div className="text-[10px] text-slate-500">Per player</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Coins className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Host Rewards</div>
            <div className="text-[10px] text-slate-500">Custom prizes</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Auto-Verified</div>
            <div className="text-[10px] text-slate-500">Instant check</div>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-600 relative z-10 py-3">
        Mobile-First Multiplayer Tambola (90-Ball Housie)
      </footer>
    </div>
  );
};
