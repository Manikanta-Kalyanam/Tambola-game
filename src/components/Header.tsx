import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Trophy, LogOut, Radio, Crown, Share2 } from 'lucide-react';
import { getIsMuted, setIsMuted } from '../utils/audio';

interface HeaderProps {
  roomCode: string;
  playerName: string;
  isHost: boolean;
  onOpenResults: () => void;
  onLeaveRoom: () => void;
  isConnected: boolean;
  totalCalls: number;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  playerName,
  isHost,
  onOpenResults,
  onLeaveRoom,
  isConnected,
  totalCalls,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [muted, setMutedState] = useState(getIsMuted());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/?room=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tambola Multiplayer Live',
          text: `Join my Tambola game! Room Code: ${roomCode}`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleSound = () => {
    const next = !muted;
    setIsMuted(next);
    setMutedState(next);
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Room Code */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-rose-500/20">
              90
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                Tambola Live
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isConnected ? 'Live Sync' : 'Reconnecting...'}</span>
                <span>•</span>
                <span>{totalCalls}/90 Called</span>
              </div>
            </div>
          </div>

          {/* Room Code Badge */}
          <button
            onClick={handleCopyCode}
            title="Click to copy Room Code"
            className="group flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-200 transition-all active:scale-95 ml-2"
          >
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">ROOM:</span>
            <span className="text-amber-400 tracking-wider text-sm">{roomCode}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            )}
          </button>

          {/* Copy / Native Mobile Share Link */}
          <button
            onClick={handleCopyLink}
            title="Share Game Link via WhatsApp, Messages, or Copy"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[10px] sm:text-[11px] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] sm:text-[11px]">Share</span>
              </>
            )}
          </button>
        </div>

        {/* Right side: Player Info, Mute, Results, Leave */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Player badge */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 px-3 py-1.5 rounded-lg text-xs">
            {isHost ? (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Crown className="w-3.5 h-3.5" /> Host
              </span>
            ) : (
              <span className="text-slate-400 font-medium">Player</span>
            )}
            <span className="text-slate-500">•</span>
            <span className="text-slate-200 font-semibold truncate max-w-[120px]">
              {playerName}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute Audio & Caller' : 'Mute Audio'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Winners / Results View */}
          <button
            onClick={onOpenResults}
            title="View Winners & History"
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Prizes & Winners</span>
          </button>

          {/* Leave Room */}
          <button
            onClick={onLeaveRoom}
            title="Leave Game"
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

