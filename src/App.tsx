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
  apiClaimPrize,
  apiResetRoom,
  saveSession,
  getSavedSession,
  clearSavedSession,
  saveDabs,
  getSavedDabs,
  StoredSession,
} from './utils/api';
import { RoomState, TicketGrid, PrizeType } from './shared/types';
import { playNumberDrawnSound, speakNumber } from './utils/audio';

export function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myTicket, setMyTicket] = useState<TicketGrid | null>(null);
  const [dabs, setDabs] = useState<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [callingNumber, setCallingNumber] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

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

        // If server provided myPlayer with ticket
        if (newState.myPlayer?.ticket) {
          setMyTicket(newState.myPlayer.ticket);
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
            // Start polling as fallback
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
  const handleCreateRoom = async (hostName: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiCreateRoom(hostName);
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
      setMyTicket(res.player.ticket);
      setDabs(new Set());

      // Fetch initial room state
      const state = await apiGetRoomState(res.roomCode, res.playerToken);
      setRoomState(state);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiJoinRoom(code, name);
      const newSession: StoredSession = {
        roomCode: res.roomCode,
        playerToken: res.playerToken,
        playerId: res.player.id,
        playerName: res.player.name,
        isHost: false,
      };
      saveSession(newSession);
      setSession(newSession);
      setMyTicket(res.player.ticket);
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
      setMyTicket(res.player.ticket);
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
    setMyTicket(null);
    setDabs(new Set());
    prevLastCallRef.current = null;
  };

  const handleToggleDab = (num: number) => {
    setDabs((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  const handleAutoDabAllCalled = () => {
    if (!myTicket) return;
    setDabs((prev) => {
      const next = new Set(prev);
      for (const row of myTicket) {
        for (const val of row) {
          if (val !== null && calledNumbersSet.has(val)) {
            next.add(val);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
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

      {/* Main Game Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Host Controls Console (if Host) */}
        {session.isHost && (
          <HostControls
            onCallNumber={handleCallNumber}
            onSetAutoCallSpeed={handleSetAutoCallSpeed}
            onResetGame={handleResetGame}
            autoCallSpeed={roomState.autoCallSpeed}
            totalCalls={roomState.calls.length}
            callingNumber={callingNumber}
            gameStatus={roomState.status}
          />
        )}

        {/* Top Split: Current Number Spotlight & Call History Reel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1">
            <CurrentBall
              currentNumber={roomState.currentNumber}
              callOrder={roomState.calls.length}
              totalCalls={roomState.calls.length}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col justify-between gap-4">
            <CallHistory calls={roomState.calls} />
            <BoardView
              calledNumbersSet={calledNumbersSet}
              currentNumber={roomState.currentNumber}
            />
          </div>
        </div>

        {/* Player Ticket Section */}
        {myTicket ? (
          <TicketView
            ticket={myTicket}
            dabs={dabs}
            calledNumbersSet={calledNumbersSet}
            onToggleDab={handleToggleDab}
            onAutoDabAllCalled={handleAutoDabAllCalled}
            winningNumbersSet={winningNumbersSet}
          />
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading your Tambola ticket...</p>
          </div>
        )}

        {/* Auto-Verified Claims Bar */}
        <ClaimsBar
          winners={roomState.winners}
          myPlayerId={session.playerId}
          onClaim={handleClaimPrize}
        />

        {/* Players & Activity Log */}
        <PlayersLog
          players={roomState.players}
          claimsLog={roomState.claimsLog}
          myPlayerId={session.playerId}
        />
      </main>

      {/* Results / Winners Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        winners={roomState.winners}
        calls={roomState.calls}
        roomCode={session.roomCode}
      />
    </div>
  );
}

export default App;

