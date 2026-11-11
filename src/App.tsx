import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Header } from './components/Header';
import { TicketView } from './components/TicketView';
import { CurrentBall } from './components/CurrentBall';
import { ClaimsBar } from './components/ClaimsBar';
import { BoardView } from './components/BoardView';
import { CallHistory } from './components/CallHistory';
import { HostControls } from './components/HostControls';
import { ResultsModal } from './components/ResultsModal';
import { PlayersLog } from './components/PlayersLog';
import {
  apiCreateRoom,
  apiJoinRoom,
  apiReconnect,
  apiGetRoomState,
  apiCallNumber,
  apiSetAutoCallSpeed,
  apiUpdateRewards,
  apiClaimPrize,
  apiResetRoom,
  saveSession,
  getSavedSession,
  clearSavedSession,
  saveDabs,
  getSavedDabs,
  StoredSession,
} from './utils/api';
import { RoomState, TicketGrid, PrizeType, RoomRewards } from './shared/types';
import { playNumberDrawnSound, speakNumber } from './utils/audio';
import { getNumberCallDisplay } from './shared/tambola';
import { Ticket, Trophy, Grid, Users } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myTickets, setMyTickets] = useState<TicketGrid[]>([]);
  const [dabs, setDabs] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callingNumber, setCallingNumber] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Mobile navigation tab: 'tickets' | 'prizes' | 'board' | 'players'
  const [mobileTab, setMobileTab] = useState<'tickets' | 'prizes' | 'board' | 'players'>('tickets');

  const prevLastCallRef = useRef<number | null>(null);

  // Set of called numbers for quick lookups
  const calledNumbersSet = useMemo(() => {
    if (!roomState?.calls) return new Set<number>();
    return new Set(roomState.calls.map((c) => c.number));
  }, [roomState?.calls]);

  // Set of verified winning numbers
  const winningNumbersSet = useMemo(() => {
    const s = new Set<number>();
    if (!roomState?.winners) return s;
    for (const win of Object.values(roomState.winners)) {
      if (win?.verifiedNumbers) {
        win.verifiedNumbers.forEach((n) => s.add(n));
      }
    }
    return s;
  }, [roomState?.winners]);

  // Attempt auto-reconnection on initial mount if saved session exists
  useEffect(() => {
    const saved = getSavedSession();
    if (saved) {
      handleReconnect(saved);
    }
  }, []);

  // Sync dabs to localStorage whenever they change
  useEffect(() => {
    if (session?.roomCode) {
      saveDabs(session.roomCode, dabs);
    }
  }, [dabs, session?.roomCode]);

  // Real-time synchronization via SSE stream with polling fallback
  useEffect(() => {
    if (!session?.roomCode) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const streamUrl = `/api/rooms/${session.roomCode}/stream?token=${session.playerToken}`;

    const updateState = (newState: RoomState) => {
      setRoomState((prev) => {
        // Detect new ball call for audio & speech
        if (newState.currentNumber && newState.currentNumber !== prevLastCallRef.current) {
          prevLastCallRef.current = newState.currentNumber;
          playNumberDrawnSound();
          speakNumber(newState.currentNumber);
        }

        // Detect newly won prizes across the room
        if (prev?.winners && newState.winners) {
          for (const [pType, win] of Object.entries(newState.winners)) {
            if (win && !prev.winners[pType as PrizeType] && win.playerId !== session.playerId) {
              playWinSound();
            }
          }
        }

        // If server provided myPlayer with tickets
        if (newState.myPlayer?.tickets !== undefined) {
          setMyTickets(newState.myPlayer.tickets);
        }

        return newState;
      });
      setIsConnected(true);
    };

    const setupSSE = () => {
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          if (isSubscribed) setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            updateState(data);
          } catch (e) {
            console.error('SSE JSON error:', e);
          }
        };

        eventSource.onerror = () => {
          if (isSubscribed) {
            setIsConnected(false);
            eventSource?.close();
            startPolling();
          }
        };
      } catch {
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const state = await apiGetRoomState(session.roomCode, session.playerToken);
          if (isSubscribed) {
            updateState(state);
          }
        } catch {
          if (isSubscribed) setIsConnected(false);
        }
      }, 2000);
    };

    setupSSE();

    return () => {
      isSubscribed = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [session?.roomCode, session?.playerToken]);

  // Actions
  const handleCreateRoom = async (
    hostName: string,
    ticketCount: number,
    rewards: RoomRewards
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiCreateRoom(hostName, ticketCount, rewards);
      const newSession: StoredSession = {
        roomCode: res.roomCode,
        playerToken: res.playerToken,
        hostToken: res.hostToken,
        playerId: res.player.id,
        playerName: res.player.name,
        isHost: true,
      };
      saveSession(newSession);
      setSession(newSession);
      setMyTickets(res.player.tickets ?? (res.player.ticket ? [res.player.ticket] : []));
      setDabs(new Set());

      const state = await apiGetRoomState(res.roomCode, res.playerToken);
      setRoomState(state);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, name: string, ticketCount: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiJoinRoom(code, name, ticketCount);
      const newSession: StoredSession = {
        roomCode: res.roomCode,
        playerToken: res.playerToken,
        playerId: res.player.id,
        playerName: res.player.name,
        isHost: false,
      };
      saveSession(newSession);
      setSession(newSession);
      setMyTickets(res.player.tickets ?? (res.player.ticket ? [res.player.ticket] : []));
      setDabs(new Set());

      const state = await apiGetRoomState(res.roomCode, res.playerToken);
      setRoomState(state);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async (saved: StoredSession) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiReconnect(saved.roomCode, saved.playerToken);
      setSession(saved);
      setMyTickets(res.player.tickets ?? (res.player.ticket ? [res.player.ticket] : []));
      setRoomState(res.roomState);
      setDabs(getSavedDabs(saved.roomCode));
    } catch (err: any) {
      clearSavedSession();
      setErrorMessage('Previous session expired. Please rejoin or create a new room.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    clearSavedSession();
    setSession(null);
    setRoomState(null);
    setMyTickets([]);
    setDabs(new Set());
    prevLastCallRef.current = null;
  };

  const handleToggleDab = (ticketIdx: number, num: number) => {
    const key = `${ticketIdx}_${num}`;
    setDabs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAutoDabAllCalled = (ticketIdx: number) => {
    const targetTicket = myTickets[ticketIdx];
    if (!targetTicket) return;

    setDabs((prev) => {
      const next = new Set(prev);
      for (const row of targetTicket) {
        for (const val of row) {
          if (val !== null && calledNumbersSet.has(val)) {
            next.add(`${ticketIdx}_${val}`);
          }
        }
      }
      return next;
    });
  };

  const handleCallNumber = async () => {
    if (!session?.hostToken || callingNumber) return;
    setCallingNumber(true);
    try {
      await apiCallNumber(session.roomCode, session.hostToken);
    } catch (err: any) {
      alert(err.message || 'Error calling number');
    } finally {
      setCallingNumber(false);
    }
  };

  const handleSetAutoCallSpeed = async (speed: number) => {
    if (!session?.hostToken) return;
    try {
      await apiSetAutoCallSpeed(session.roomCode, session.hostToken, speed);
    } catch (err: any) {
      alert(err.message || 'Error updating auto-caller speed');
    }
  };

  const handleUpdateRewards = async (rewards: RoomRewards) => {
    if (!session?.hostToken) return;
    try {
      await apiUpdateRewards(session.roomCode, session.hostToken, rewards);
    } catch (err: any) {
      alert(err.message || 'Error updating rewards');
    }
  };

  const handleClaimPrize = async (prizeType: PrizeType) => {
    if (!session) throw new Error('Not connected');
    const result = await apiClaimPrize(session.roomCode, session.playerToken, prizeType);
    return result;
  };

  const handleResetGame = async () => {
    if (!session?.hostToken) return;
    try {
      await apiResetRoom(session.roomCode, session.hostToken);
      setDabs(new Set());
      prevLastCallRef.current = null;
    } catch (err: any) {
      alert(err.message || 'Error resetting room');
    }
  };

  // If not in a room, render the HomeScreen
  if (!session || !roomState) {
    return (
      <HomeScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onReconnect={handleReconnect}
        loading={loading}
        errorMessage={errorMessage}
      />
    );
  }

  const unclaimedPrizesCount = 5 - Object.keys(roomState.winners || {}).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white pb-28 sm:pb-8">
      {/* Header Bar */}
      <Header
        roomCode={session.roomCode}
        playerName={session.playerName}
        isHost={session.isHost}
        onOpenResults={() => setShowResultsModal(true)}
        onLeaveRoom={handleLeaveRoom}
        isConnected={isConnected}
        totalCalls={roomState.calls.length}
      />

      {/* Sticky Active Ball Bar - Visible when scrolling down so players never lose sight of called numbers */}
      <div className="sticky top-[57px] z-30 bg-slate-900/95 border-b border-slate-800/90 px-3 py-2 backdrop-blur-md shadow-md">
        <div className="max-w-lg sm:max-w-4xl w-full mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {roomState.currentNumber !== null ? (
              <>
                <div className="w-8 h-8 rounded-full bingo-ball flex-shrink-0 flex items-center justify-center shadow-md">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <span className="font-mono font-black text-xs text-slate-950">
                      {roomState.currentNumber}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono truncate">
                    {getNumberCallDisplay(roomState.currentNumber)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ball #{roomState.calls.length} of 90
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Ready! Waiting for host to call first ball...</span>
              </div>
            )}
          </div>

          {session.isHost && (
            <button
              onClick={handleCallNumber}
              disabled={callingNumber || roomState.calls.length >= 90}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all flex-shrink-0 disabled:opacity-50"
            >
              <span>Draw Next</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mobile-First Container */}
      <main className="flex-1 max-w-lg sm:max-w-4xl w-full mx-auto p-3 sm:p-5 space-y-3.5">
        {/* Host Controls Console (if Host) */}
        {session.isHost && (
          <HostControls
            onCallNumber={handleCallNumber}
            onSetAutoCallSpeed={handleSetAutoCallSpeed}
            onResetGame={handleResetGame}
            onUpdateRewards={handleUpdateRewards}
            currentRewards={roomState.rewards}
            autoCallSpeed={roomState.autoCallSpeed}
            totalCalls={roomState.calls.length}
            callingNumber={callingNumber}
            gameStatus={roomState.status}
          />
        )}

        {/* Compact Current Ball Spotlight & Recent Calls Reel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          <div className="sm:col-span-1">
            <CurrentBall
              currentNumber={roomState.currentNumber}
              callOrder={roomState.calls.length}
              totalCalls={roomState.calls.length}
            />
          </div>
          <div className="sm:col-span-2 flex flex-col justify-between gap-2.5">
            <CallHistory calls={roomState.calls} />
            {/* On desktop or tablet, board view stays visible; on mobile, also available via tab */}
            <div className="hidden sm:block">
              <BoardView
                calledNumbersSet={calledNumbersSet}
                currentNumber={roomState.currentNumber}
              />
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation Buttons */}
        <div className="grid grid-cols-4 p-1 bg-slate-900 border border-slate-800 rounded-2xl sm:hidden">
          <button
            onClick={() => setMobileTab('tickets')}
            className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
              mobileTab === 'tickets'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{myTickets.length > 0 ? `Tickets (${myTickets.length})` : session.isHost ? 'Host' : 'Ticket'}</span>
          </button>
          <button
            onClick={() => setMobileTab('prizes')}
            className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
              mobileTab === 'prizes'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Prizes ({unclaimedPrizesCount})</span>
          </button>
          <button
            onClick={() => setMobileTab('board')}
            className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
              mobileTab === 'board'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>1-90 Board</span>
          </button>
          <button
            onClick={() => setMobileTab('players')}
            className={`py-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition-all ${
              mobileTab === 'players'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Feed ({roomState.players.length})</span>
          </button>
        </div>

        {/* Tab Content for Mobile or Full Content for Desktop */}
        <div className="space-y-3.5">
          {/* 1. Ticket Section */}
          <div className={`${mobileTab === 'tickets' ? 'block' : 'hidden sm:block'}`}>
            {myTickets.length > 0 ? (
              <TicketView
                tickets={myTickets}
                dabs={dabs}
                calledNumbersSet={calledNumbersSet}
                onToggleDab={handleToggleDab}
                winners={roomState.winners}
                rewards={roomState.rewards}
                myPlayerId={session.playerId}
                onClaim={handleClaimPrize}
                winningNumbersSet={winningNumbersSet}
              />
            ) : session.isHost ? (
              <div className="p-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  🎙️
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Host / Caller Mode (Not Playing)</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You are calling balls and managing the game without a ticket. All room controls, master board, and auto-verified claims are active!
                </p>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <div className="animate-spin w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading your Tambola ticket(s)...</p>
              </div>
            )}
          </div>

          {/* 2. Prizes & Claims Bar */}
          <div className={`${mobileTab === 'prizes' ? 'block' : 'hidden sm:block'}`}>
            <ClaimsBar
              winners={roomState.winners}
              rewards={roomState.rewards}
              myPlayerId={session.playerId}
              onClaim={handleClaimPrize}
            />
          </div>

          {/* 3. 1-90 Master Board (mobile tab) */}
          <div className={`${mobileTab === 'board' ? 'block' : 'hidden'} sm:hidden`}>
            <BoardView
              calledNumbersSet={calledNumbersSet}
              currentNumber={roomState.currentNumber}
            />
          </div>

          {/* 4. Players & Activity Feed */}
          <div className={`${mobileTab === 'players' ? 'block' : 'hidden sm:block'}`}>
            <PlayersLog
              players={roomState.players}
              claimsLog={roomState.claimsLog}
              myPlayerId={session.playerId}
            />
          </div>
        </div>
      </main>

      {/* Results / Winners Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        winners={roomState.winners}
        calls={roomState.calls}
        roomCode={session.roomCode}
        rewards={roomState.rewards}
      />
    </div>
  );
}

export default App;
