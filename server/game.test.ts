import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  createRoom,
  joinRoom,
  getRoomState,
  callNextNumber,
  claimPrize,
  reconnectPlayer,
  resetRoom,
  updateRewards,
} from './game';
import { getDb } from './db';
import { getRowNumbers } from '../src/shared/tambola';

describe('Server & Game Actions End-to-End Test', () => {
  it('handles multiple tickets, host rewards, auto-verification and security', async () => {
    // 1. Host creates a room with 2 tickets and custom rewards
    const hostCreated = await createRoom('Alice Host', 2, {
      ticket_price: '₹50',
      early_five: '₹100',
      top_line: '₹200',
      full_house: '₹1000',
    });

    expect(hostCreated.roomCode).toBeDefined();
    expect(hostCreated.hostToken).toBeDefined();
    expect(hostCreated.playerToken).toBeDefined();
    expect(hostCreated.player.isHost).toBe(true);
    expect(hostCreated.player.tickets.length).toBe(2);
    expect(hostCreated.player.tickets[0].length).toBe(3);

    const roomCode = hostCreated.roomCode;
    const hostToken = hostCreated.hostToken;
    const hostPlayerToken = hostCreated.playerToken;

    // 2. Player joins the room with 3 tickets
    const playerJoined = await joinRoom(roomCode, 'Bob Player', 3);
    expect(playerJoined.roomCode).toBe(roomCode);
    expect(playerJoined.playerToken).toBeDefined();
    expect(playerJoined.player.isHost).toBe(false);
    expect(playerJoined.player.tickets.length).toBe(3);

    const bobToken = playerJoined.playerToken;
    const bobTickets = playerJoined.player.tickets;

    // 3. Verify public room state & custom rewards
    const state1 = await getRoomState(roomCode);
    expect(state1).not.toBeNull();
    expect(state1?.players.length).toBe(2);
    expect(state1?.rewards.full_house).toBe('₹1000');
    expect(state1?.rewards.ticket_price).toBe('₹50');
    expect(state1?.players[0].ticketCount).toBe(2);
    expect(state1?.players[1].ticketCount).toBe(3);

    // 4. Host updates rewards
    await updateRewards(roomCode, hostToken, {
      ticket_price: '₹50',
      early_five: '₹150',
      full_house: '₹1200',
    });
    const stateAfterRewardUpdate = await getRoomState(roomCode);
    expect(stateAfterRewardUpdate?.rewards.early_five).toBe('₹150');

    // 5. Bob tries to claim Early Five with 0 numbers called -> MUST BE REJECTED AS BOGEY!
    const claimBogey = await claimPrize(roomCode, bobToken, 'early_five');
    expect(claimBogey.accepted).toBe(false);
    expect(claimBogey.status).toBe('rejected_bogey');
    expect(claimBogey.message).toContain('BOGEY');

    // 6. Host calls numbers
    for (let i = 0; i < 5; i++) {
      const call = await callNextNumber(roomCode, hostToken);
      expect(call.number).toBeGreaterThanOrEqual(1);
      expect(call.number).toBeLessThanOrEqual(90);
    }

    // 7. Test unauthorized calls: fake token cannot call number
    await expect(callNextNumber(roomCode, 'invalid_fake_token')).rejects.toThrow('Unauthorized');

    // 8. Auto-Verification test across multiple tickets:
    // Simulate numbers matching Bob's Ticket #2 top line
    const db = await getDb();
    const bobTicket2TopLine = getRowNumbers(bobTickets[1], 0);
    expect(bobTicket2TopLine.length).toBe(5);

    const roomRes = db.exec(`SELECT id FROM rooms WHERE code = '${roomCode}'`);
    const roomId = roomRes[0].values[0][0] as string;

    for (const num of bobTicket2TopLine) {
      const check = db.exec(`SELECT id FROM calls WHERE room_id = '${roomId}' AND number = ${num}`);
      if (!check.length || !check[0].values.length) {
        db.run(
          `INSERT INTO calls (id, room_id, number, call_order, called_at) VALUES ('${crypto.randomUUID()}', '${roomId}', ${num}, 99, '${new Date().toISOString()}')`
        );
      }
    }

    // Bob claims Top Line -> AUTO-VERIFIED AS ACCEPTED ON TICKET #2!
    const claimTopLine = await claimPrize(roomCode, bobToken, 'top_line');
    expect(claimTopLine.accepted).toBe(true);
    expect(claimTopLine.status).toBe('accepted');
    expect(claimTopLine.message).toContain('Ticket #2');
    expect(claimTopLine.message).toContain('AUTO-VERIFIED');

    // 9. Prevent duplicate prizes: Alice tries to claim Top Line after Bob won it -> REJECTED AS ALREADY CLAIMED!
    const claimAliceTopLine = await claimPrize(roomCode, hostPlayerToken, 'top_line');
    expect(claimAliceTopLine.accepted).toBe(false);
    expect(claimAliceTopLine.status).toBe('rejected_already_claimed');
    expect(claimAliceTopLine.message).toContain('already been won by Bob Player');

    // 10. Reconnect test: preserves multiple tickets
    const reconnected = await reconnectPlayer(roomCode, bobToken);
    expect(reconnected.name).toBe('Bob Player');
    expect(reconnected.isHost).toBe(false);
    expect(reconnected.tickets.length).toBe(3);
    expect(reconnected.tickets).toEqual(bobTickets);
  });

  it('correctly handles non-playing host with 0 tickets (caller-only mode)', async () => {
    // 1. Host creates room with ticketCount = 0
    const hostCreated = await createRoom('Caller Only Host', 0);
    expect(hostCreated.roomCode).toBeDefined();
    expect(hostCreated.player.isHost).toBe(true);
    expect(hostCreated.player.tickets).toEqual([]);
    expect(hostCreated.player.tickets.length).toBe(0);

    const roomCode = hostCreated.roomCode;
    const hostToken = hostCreated.hostToken;
    const hostPlayerToken = hostCreated.playerToken;

    // 2. Room state verifies host has ticketCount = 0
    const state = await getRoomState(roomCode, hostPlayerToken);
    expect(state?.players[0].ticketCount).toBe(0);
    expect(state?.myPlayer?.tickets).toEqual([]);

    // 3. Reconnecting host returns 0 tickets
    const reconnectedHost = await reconnectPlayer(roomCode, hostPlayerToken);
    expect(reconnectedHost.tickets).toEqual([]);
    expect(reconnectedHost.tickets.length).toBe(0);

    // 4. Host cannot claim prizes with 0 tickets
    const claimRes = await claimPrize(roomCode, hostPlayerToken, 'early_five');
    expect(claimRes.accepted).toBe(false);
    expect(claimRes.status).toBe('rejected_bogey');
    expect(claimRes.message).toContain('Caller Only Mode');

    // 5. Normal player joins and receives tickets
    const player = await joinRoom(roomCode, 'Player Dave', 2);
    expect(player.player.tickets.length).toBe(2);

    // 6. Resetting room maintains 0 tickets for caller host
    await resetRoom(roomCode, hostToken);
    const stateAfterReset = await getRoomState(roomCode, hostPlayerToken);
    expect(stateAfterReset?.players.find((p) => p.isHost)?.ticketCount).toBe(0);
    expect(stateAfterReset?.myPlayer?.tickets.length).toBe(0);
  });
});
