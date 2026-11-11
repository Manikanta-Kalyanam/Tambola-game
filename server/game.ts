import crypto from 'crypto';
import { getDb, saveDb, hashToken, generateToken, generateRoomCode } from './db';
import {
  generateTambolaTicket,
  generateMultipleTickets,
  verifyClaimMultiTicket,
} from '../src/shared/tambola';
import {
  PrizeType,
  PRIZE_NAMES,
  RoomState,
  TicketGrid,
  CallRecord,
  ClaimRecord,
  WinnerInfo,
  PlayerPublic,
  RoomRewards,
  DEFAULT_REWARDS,
} from '../src/shared/types';

// Map to hold Server-Sent Event (SSE) listeners for each room
type SseClient = (data: RoomState) => void;
const roomListeners = new Map<string, Set<SseClient>>();

export function subscribeToRoom(code: string, client: SseClient): () => void {
  const normCode = code.toUpperCase();
  if (!roomListeners.has(normCode)) {
    roomListeners.set(normCode, new Set());
  }
  roomListeners.get(normCode)!.add(client);

  return () => {
    const clients = roomListeners.get(normCode);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        roomListeners.delete(normCode);
      }
    }
  };
}

export async function broadcastRoomState(code: string): Promise<void> {
  const normCode = code.toUpperCase();
  const clients = roomListeners.get(normCode);
  if (!clients || clients.size === 0) return;

  const state = await getRoomState(normCode);
  if (!state) return;

  for (const client of clients) {
    try {
      client(state);
    } catch (e) {
      console.error('SSE client delivery error:', e);
    }
  }
}

function parseTickets(raw: string): TicketGrid[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])) {
        // It's TicketGrid[]
        return parsed as TicketGrid[];
      }
      // It's a single TicketGrid
      return [parsed as TicketGrid];
    }
    return [generateTambolaTicket()];
  } catch {
    return [generateTambolaTicket()];
  }
}

/**
 * Creates a new room and registers the host as the first player with multiple tickets if requested.
 */
export async function createRoom(
  hostName: string,
  ticketCount: number = 1,
  rewards?: RoomRewards
) {
  const db = await getDb();
  const trimmedName = hostName.trim() || 'Host';
  const safeCount = Number(ticketCount) === 0 ? 0 : Math.max(1, Math.min(6, Math.floor(Number(ticketCount)) || 1));
  const roomRewards: RoomRewards = { ...DEFAULT_REWARDS, ...(rewards || {}) };

  let code = generateRoomCode();
  // Ensure uniqueness
  let existing = db.exec(`SELECT id FROM rooms WHERE code = '${code}'`);
  while (existing.length > 0 && existing[0].values.length > 0) {
    code = generateRoomCode();
    existing = db.exec(`SELECT id FROM rooms WHERE code = '${code}'`);
  }

  const roomId = crypto.randomUUID();
  const hostToken = generateToken();
  const playerToken = generateToken();
  const hostTokenHash = hashToken(hostToken);
  const playerTokenHash = hashToken(playerToken);
  const playerId = crypto.randomUUID();
  const now = new Date().toISOString();

  const tickets = generateMultipleTickets(safeCount);

  db.run(
    `INSERT INTO rooms (id, code, host_token_hash, status, current_number, auto_call_speed, rewards_json, created_at, updated_at)
     VALUES (?, ?, ?, 'waiting', NULL, 0, ?, ?, ?)`,
    [roomId, code, hostTokenHash, JSON.stringify(roomRewards), now, now]
  );

  db.run(
    `INSERT INTO players (id, room_id, name, player_token_hash, is_host, ticket_json, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [playerId, roomId, trimmedName, playerTokenHash, JSON.stringify(tickets), now]
  );

  saveDb();

  return {
    roomCode: code,
    hostToken,
    playerToken,
    player: {
      id: playerId,
      name: trimmedName,
      isHost: true,
      tickets,
    },
  };
}

/**
 * Player joins an existing room. Receives multiple tickets if requested.
 */
export async function joinRoom(code: string, playerName: string, ticketCount: number = 1) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const trimmedName = playerName.trim() || 'Player';
  const safeCount = Math.max(1, Math.min(6, Math.floor(Number(ticketCount)) || 1));

  const roomRes = db.exec(`SELECT id, status FROM rooms WHERE code = '${normCode}'`);
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Room not found. Check the room code.');
  }

  const [roomId, status] = roomRes[0].values[0] as [string, string];
  if (status === 'completed') {
    throw new Error('This game has already completed.');
  }

  const playerId = crypto.randomUUID();
  const playerToken = generateToken();
  const playerTokenHash = hashToken(playerToken);
  const tickets = generateMultipleTickets(safeCount);
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO players (id, room_id, name, player_token_hash, is_host, ticket_json, created_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [playerId, roomId, trimmedName, playerTokenHash, JSON.stringify(tickets), now]
  );

  saveDb();
  broadcastRoomState(normCode);

  return {
    roomCode: normCode,
    playerToken,
    player: {
      id: playerId,
      name: trimmedName,
      isHost: false,
      tickets,
    },
  };
}

/**
 * Reconnects a player using their saved player token.
 */
export async function reconnectPlayer(code: string, playerToken: string) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const tokenHash = hashToken(playerToken);

  const roomRes = db.exec(`SELECT id, host_token_hash FROM rooms WHERE code = '${normCode}'`);
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Room not found');
  }

  const [roomId] = roomRes[0].values[0] as [string, string];

  const playerRes = db.exec(
    `SELECT id, name, is_host, ticket_json FROM players WHERE room_id = '${roomId}' AND player_token_hash = '${tokenHash}'`
  );

  if (!playerRes.length || !playerRes[0].values.length) {
    throw new Error('Player session expired or not found in this room.');
  }

  const [id, name, isHost, ticketJson] = playerRes[0].values[0] as [
    string,
    string,
    number,
    string
  ];

  return {
    id,
    name,
    isHost: Boolean(isHost),
    tickets: parseTickets(ticketJson),
  };
}

/**
 * Host updates prize rewards / pricing.
 */
export async function updateRewards(code: string, hostToken: string, rewards: RoomRewards) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const hostHash = hashToken(hostToken);

  const roomRes = db.exec(
    `SELECT id FROM rooms WHERE code = '${normCode}' AND host_token_hash = '${hostHash}'`
  );
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Unauthorized: Invalid host token.');
  }

  const roomId = roomRes[0].values[0][0] as string;
  db.run(`UPDATE rooms SET rewards_json = ? WHERE id = ?`, [JSON.stringify(rewards), roomId]);
  saveDb();
  broadcastRoomState(normCode);
}

/**
 * Fetches the complete current state of a room for public/player consumption.
 */
export async function getRoomState(code: string, playerToken?: string): Promise<RoomState | null> {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();

  const roomRes = db.exec(
    `SELECT id, code, status, current_number, auto_call_speed, rewards_json, created_at FROM rooms WHERE code = '${normCode}'`
  );
  if (!roomRes.length || !roomRes[0].values.length) {
    return null;
  }

  const [roomId, roomCode, status, currentNum, autoSpeed, rewardsJson, createdAt] = roomRes[0]
    .values[0] as [
    string,
    string,
    'waiting' | 'in_progress' | 'completed',
    number | null,
    number,
    string | null,
    string
  ];

  const rewards: RoomRewards = rewardsJson ? JSON.parse(rewardsJson) : DEFAULT_REWARDS;

  // Players
  const playersRes = db.exec(
    `SELECT id, name, is_host, ticket_json, created_at FROM players WHERE room_id = '${roomId}' ORDER BY created_at ASC`
  );
  const players: PlayerPublic[] = [];
  if (playersRes.length && playersRes[0].values.length) {
    for (const row of playersRes[0].values) {
      const tickets = parseTickets(row[3] as string);
      players.push({
        id: row[0] as string,
        name: row[1] as string,
        isHost: Boolean(row[2]),
        ticketCount: tickets.length,
        joinedAt: row[4] as string,
      });
    }
  }

  // Calls
  const callsRes = db.exec(
    `SELECT number, call_order, called_at FROM calls WHERE room_id = '${roomId}' ORDER BY call_order ASC`
  );
  const calls: CallRecord[] = [];
  if (callsRes.length && callsRes[0].values.length) {
    for (const row of callsRes[0].values) {
      calls.push({
        number: row[0] as number,
        order: row[1] as number,
        calledAt: row[2] as string,
      });
    }
  }

  // Accepted winners
  const winnersRes = db.exec(
    `SELECT c.player_id, p.name, c.prize_type, c.created_at, c.numbers_json, c.message
     FROM claims c
     JOIN players p ON c.player_id = p.id
     WHERE c.room_id = '${roomId}' AND c.status = 'accepted'
     ORDER BY c.created_at ASC`
  );
  const winners: Partial<Record<PrizeType, WinnerInfo>> = {};
  if (winnersRes.length && winnersRes[0].values.length) {
    for (const row of winnersRes[0].values) {
      const pType = row[2] as PrizeType;
      const verified = JSON.parse(row[4] as string);
      winners[pType] = {
        playerId: row[0] as string,
        playerName: row[1] as string,
        prizeType: pType,
        claimedAt: row[3] as string,
        verifiedNumbers: verified,
        reward: rewards[pType] || '',
      };
    }
  }

  // Recent claims log
  const claimsRes = db.exec(
    `SELECT c.id, c.room_id, c.player_id, p.name, c.prize_type, c.status, c.numbers_json, c.message, c.created_at
     FROM claims c
     JOIN players p ON c.player_id = p.id
     WHERE c.room_id = '${roomId}'
     ORDER BY c.created_at DESC
     LIMIT 30`
  );
  const claimsLog: ClaimRecord[] = [];
  if (claimsRes.length && claimsRes[0].values.length) {
    for (const row of claimsRes[0].values) {
      claimsLog.push({
        id: row[0] as string,
        roomId: row[1] as string,
        playerId: row[2] as string,
        playerName: row[3] as string,
        prizeType: row[4] as PrizeType,
        status: row[5] as any,
        numbers: JSON.parse(row[6] as string),
        message: row[7] as string,
        createdAt: row[8] as string,
      });
    }
  }

  // Optional: myPlayer info if token provided
  let myPlayer: RoomState['myPlayer'] = undefined;
  if (playerToken) {
    try {
      const p = await reconnectPlayer(normCode, playerToken);
      myPlayer = p;
    } catch {}
  }

  return {
    code: roomCode,
    status,
    currentNumber: currentNum,
    autoCallSpeed: autoSpeed,
    createdAt,
    rewards,
    players,
    calls,
    winners,
    claimsLog,
    myPlayer,
  };
}

/**
 * Host calls the next random uncalled number (1-90).
 */
export async function callNextNumber(code: string, hostToken: string): Promise<CallRecord> {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const hostHash = hashToken(hostToken);

  const roomRes = db.exec(
    `SELECT id, status FROM rooms WHERE code = '${normCode}' AND host_token_hash = '${hostHash}'`
  );
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Unauthorized: Invalid host token for this room.');
  }

  const [roomId, status] = roomRes[0].values[0] as [string, string];
  if (status === 'completed') {
    throw new Error('Game is already completed.');
  }

  // Fetch already called numbers
  const callsRes = db.exec(`SELECT number FROM calls WHERE room_id = '${roomId}'`);
  const calledNumbers = new Set<number>();
  if (callsRes.length && callsRes[0].values.length) {
    for (const r of callsRes[0].values) {
      calledNumbers.add(r[0] as number);
    }
  }

  if (calledNumbers.size >= 90) {
    db.run(`UPDATE rooms SET status = 'completed' WHERE id = ?`, [roomId]);
    saveDb();
    broadcastRoomState(normCode);
    throw new Error('All 90 numbers have been called!');
  }

  const pool: number[] = [];
  for (let n = 1; n <= 90; n++) {
    if (!calledNumbers.has(n)) {
      pool.push(n);
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const chosenNumber = pool[randomIndex];
  const nextOrder = calledNumbers.size + 1;
  const now = new Date().toISOString();
  const callId = crypto.randomUUID();

  db.run(
    `INSERT INTO calls (id, room_id, number, call_order, called_at) VALUES (?, ?, ?, ?, ?)`,
    [callId, roomId, chosenNumber, nextOrder, now]
  );

  db.run(
    `UPDATE rooms SET current_number = ?, status = 'in_progress', updated_at = ? WHERE id = ?`,
    [chosenNumber, now, roomId]
  );

  saveDb();
  broadcastRoomState(normCode);

  return {
    number: chosenNumber,
    order: nextOrder,
    calledAt: now,
  };
}

/**
 * Update auto-call timer speed (0 = disabled, 2 = 2s, 3 = 3s, 5 = 5s)
 */
export async function setAutoCallSpeed(code: string, hostToken: string, speed: number) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const hostHash = hashToken(hostToken);

  const roomRes = db.exec(
    `SELECT id FROM rooms WHERE code = '${normCode}' AND host_token_hash = '${hostHash}'`
  );
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Unauthorized: Invalid host token.');
  }

  const roomId = roomRes[0].values[0][0] as string;
  db.run(`UPDATE rooms SET auto_call_speed = ? WHERE id = ?`, [speed, roomId]);
  saveDb();
  broadcastRoomState(normCode);
}

/**
 * AUTO-VERIFIED PRIZE CLAIM (checks all tickets owned by player):
 */
export async function claimPrize(
  code: string,
  playerToken: string,
  prizeType: PrizeType
) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const playerHash = hashToken(playerToken);

  const roomRes = db.exec(`SELECT id, status, rewards_json FROM rooms WHERE code = '${normCode}'`);
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Room not found.');
  }
  const [roomId, roomStatus, rewardsJson] = roomRes[0].values[0] as [string, string, string | null];
  const rewards: RoomRewards = rewardsJson ? JSON.parse(rewardsJson) : DEFAULT_REWARDS;

  // Lookup player
  const playerRes = db.exec(
    `SELECT id, name, ticket_json FROM players WHERE room_id = '${roomId}' AND player_token_hash = '${playerHash}'`
  );
  if (!playerRes.length || !playerRes[0].values.length) {
    throw new Error('Player not recognized or unauthorized.');
  }

  const [playerId, playerName, ticketJson] = playerRes[0].values[0] as [string, string, string];
  const tickets = parseTickets(ticketJson);

  // Check if this prize is ALREADY accepted in this room
  const existingWinnerRes = db.exec(
    `SELECT p.name FROM claims c
     JOIN players p ON c.player_id = p.id
     WHERE c.room_id = '${roomId}' AND c.prize_type = '${prizeType}' AND c.status = 'accepted'`
  );

  if (existingWinnerRes.length && existingWinnerRes[0].values.length) {
    const winnerName = existingWinnerRes[0].values[0][0] as string;
    const msg = `${PRIZE_NAMES[prizeType]} has already been won by ${winnerName}!`;

    const claimId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO claims (id, room_id, player_id, prize_type, status, numbers_json, message, created_at)
       VALUES (?, ?, ?, ?, 'rejected_already_claimed', '[]', ?, ?)`,
      [claimId, roomId, playerId, prizeType, msg, now]
    );
    saveDb();
    broadcastRoomState(normCode);

    return {
      accepted: false,
      status: 'rejected_already_claimed',
      message: msg,
    };
  }

  // Fetch all called numbers for this room
  const callsRes = db.exec(`SELECT number FROM calls WHERE room_id = '${roomId}'`);
  const calledSet = new Set<number>();
  if (callsRes.length && callsRes[0].values.length) {
    for (const r of callsRes[0].values) {
      calledSet.add(r[0] as number);
    }
  }

  // AUTO-VERIFICATION ACROSS ALL TICKETS
  const result = verifyClaimMultiTicket(tickets, calledSet, prizeType);
  const now = new Date().toISOString();
  const claimId = crypto.randomUUID();
  const ticketDisplayNum = (result.winningTicketIndex ?? 0) + 1;
  const prizeReward = rewards[prizeType] ? ` (Reward: ${rewards[prizeType]})` : '';

  if (result.valid) {
    const msg = `Auto-Verified: ${playerName} won ${PRIZE_NAMES[prizeType]} on Ticket #${ticketDisplayNum}!${prizeReward}`;
    db.run(
      `INSERT INTO claims (id, room_id, player_id, prize_type, status, numbers_json, message, created_at)
       VALUES (?, ?, ?, ?, 'accepted', ?, ?, ?)`,
      [claimId, roomId, playerId, prizeType, JSON.stringify(result.matchingNumbers), msg, now]
    );

    if (prizeType === 'full_house') {
      db.run(`UPDATE rooms SET status = 'completed', updated_at = ? WHERE id = ?`, [now, roomId]);
    }

    saveDb();
    broadcastRoomState(normCode);

    return {
      accepted: true,
      status: 'accepted',
      prizeType,
      winningTicketIndex: result.winningTicketIndex,
      message: `🎉 BINGO! Your claim for ${PRIZE_NAMES[prizeType]} was AUTO-VERIFIED on Ticket #${ticketDisplayNum}!${prizeReward}`,
      matchingNumbers: result.matchingNumbers,
    };
  } else {
    const msg = `Bogey Claim by ${playerName}: ${result.reason || 'Criteria not met.'}`;
    db.run(
      `INSERT INTO claims (id, room_id, player_id, prize_type, status, numbers_json, message, created_at)
       VALUES (?, ?, ?, ?, 'rejected_bogey', ?, ?, ?)`,
      [claimId, roomId, playerId, prizeType, JSON.stringify(result.matchingNumbers), msg, now]
    );

    saveDb();
    broadcastRoomState(normCode);

    return {
      accepted: false,
      status: 'rejected_bogey',
      prizeType,
      message: `⚠️ BOGEY CLAIM: ${result.reason || 'Criteria not met on your ticket(s).'}${tickets.length > 1 ? ` (Checked across all ${tickets.length} tickets)` : ''}`,
      matchingNumbers: result.matchingNumbers,
    };
  }
}

/**
 * Host resets the room for a fresh game, generating new tickets for each player according to their ticket count.
 */
export async function resetRoom(code: string, hostToken: string) {
  const db = await getDb();
  const normCode = code.trim().toUpperCase();
  const hostHash = hashToken(hostToken);

  const roomRes = db.exec(
    `SELECT id FROM rooms WHERE code = '${normCode}' AND host_token_hash = '${hostHash}'`
  );
  if (!roomRes.length || !roomRes[0].values.length) {
    throw new Error('Unauthorized.');
  }

  const roomId = roomRes[0].values[0][0] as string;
  const now = new Date().toISOString();

  db.run(`DELETE FROM calls WHERE room_id = ?`, [roomId]);
  db.run(`DELETE FROM claims WHERE room_id = ?`, [roomId]);
  db.run(
    `UPDATE rooms SET status = 'waiting', current_number = NULL, auto_call_speed = 0, updated_at = ? WHERE id = ?`,
    [now, roomId]
  );

  // Generate fresh tickets for all existing players
  const playersRes = db.exec(`SELECT id, ticket_json FROM players WHERE room_id = '${roomId}'`);
  if (playersRes.length && playersRes[0].values.length) {
    for (const r of playersRes[0].values) {
      const pid = r[0] as string;
      const oldTickets = parseTickets(r[1] as string);
      const newTickets = generateMultipleTickets(oldTickets.length);
      db.run(`UPDATE players SET ticket_json = ? WHERE id = ?`, [JSON.stringify(newTickets), pid]);
    }
  }

  saveDb();
  broadcastRoomState(normCode);
}
