import { PrizeType, RoomRewards, RoomState, TicketGrid } from '../shared/types';

export interface StoredSession {
  roomCode: string;
  playerToken: string;
  hostToken?: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}

const STORAGE_KEY = 'tambola_session_v1';
const DABS_KEY_PREFIX = 'tambola_dabs_v2_';

export function getSavedSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function clearSavedSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getSavedDabs(roomCode: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${DABS_KEY_PREFIX}${roomCode}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function saveDabs(roomCode: string, dabs: Set<string>): void {
  try {
    localStorage.setItem(`${DABS_KEY_PREFIX}${roomCode}`, JSON.stringify(Array.from(dabs)));
  } catch {}
}

const BASE_URL = ''; // Relative to origin (proxied in dev, direct in prod)

export async function apiCreateRoom(
  hostName: string,
  ticketCount: number = 1,
  rewards?: RoomRewards
) {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, ticketCount, rewards }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create room');
  }
  return res.json();
}

export async function apiJoinRoom(code: string, name: string, ticketCount: number = 1) {
  const res = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, ticketCount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to join room');
  }
  return res.json();
}

export async function apiReconnect(code: string, playerToken: string) {
  const res = await fetch(`${BASE_URL}/api/rooms/reconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, playerToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reconnect');
  }
  return res.json();
}

export async function apiGetRoomState(code: string, playerToken?: string): Promise<RoomState> {
  const headers: Record<string, string> = {};
  if (playerToken) {
    headers['Authorization'] = `Bearer ${playerToken}`;
  }
  const res = await fetch(`${BASE_URL}/api/rooms/${code}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get room state');
  }
  return res.json();
}

export async function apiCallNumber(code: string, hostToken: string) {
  const res = await fetch(`${BASE_URL}/api/rooms/${code}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-host-token': hostToken,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to call number');
  }
  return res.json();
}

export async function apiSetAutoCallSpeed(code: string, hostToken: string, speed: number) {
  const res = await fetch(`${BASE_URL}/api/rooms/${code}/auto-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-host-token': hostToken,
    },
    body: JSON.stringify({ speed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to set speed');
  }
  return res.json();
}

export async function apiUpdateRewards(code: string, hostToken: string, rewards: RoomRewards) {
  const res = await fetch(`${BASE_URL}/api/rooms/${code}/rewards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-host-token': hostToken,
    },
    body: JSON.stringify({ rewards }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update rewards');
  }
  return res.json();
}

export async function apiClaimPrize(code: string, playerToken: string, prizeType: PrizeType) {
  const res = await fetch(`${BASE_URL}/api/rooms/${code}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-player-token': playerToken,
    },
    body: JSON.stringify({ prizeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit claim');
  }
  return res.json();
}

export async function apiResetRoom(code: string, hostToken: string) {
  const res = await fetch(`${BASE_URL}/api/rooms/${code}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-host-token': hostToken,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset room');
  }
  return res.json();
}
