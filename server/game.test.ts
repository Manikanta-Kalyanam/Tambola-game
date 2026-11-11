import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  createRoom,
  joinRoom,
  getRoomState,
  callNextNumber,
  claimPrize,
  reconnectPlayer,
  resetRoom,
} from './game';
import { getDb } from './db';
import { getTicketNumbers, getRowNumbers } from '../src/shared/tambola';

describe('Server & Game Actions End-to-End Test', () => {
  it('handles complete game flow with Auto-Verification and token security', async () => {
    // 1. Host creates a room
    const hostCreated = await createRoom('Alice Host');
    expect(hostCreated.roomCode).toBeDefined();
    expect(hostCreated.hostToken).toBeDefined();
    expect(hostCreated.playerToken).toBeDefined();
    expect(hostCreated.player.isHost).toBe(true);
    expect(hostCreated.player.ticket.length).toBe(3);

    const roomCode = hostCreated.roomCode;
    const hostToken = hostCreated.hostToken;
    const hostPlayerToken = hostCreated.playerToken;

    // 2. Player joins the room
    const playerJoined = await joinRoom(roomCode, 'Bob Player');
    expect(playerJoined.roomCode).toBe(roomCode);
    expect(playerJoined.playerToken).toBeDefined();
    expect(playerJoined.player.isHost).toBe(false);
    expect(playerJoined.player.ticket.length).toBe(3);

    const bobToken = playerJoined.playerToken;
    const bobTicket = playerJoined.player.ticket;

    // 3. Verify public room state
    const state1 = await getRoomState(roomCode);
    expect(state1).not.toBeNull();
    expect(state1?.players.length).toBe(2);
    expect(state1?.calls.length).toBe(0);
    expect(state1?.status).toBe('waiting');

    // 4. Bob tries to claim Early Five with 0 numbers called -> MUST BE REJECTED AS BOGEY!
    const claimBogey = await claimPrize(roomCode, bobToken, 'early_five');
    expect(claimBogey.accepted).toBe(false);
    expect(claimBogey.status).toBe('rejected_bogey');
    expect(claimBogey.message).toContain('BOGEY');

    // 5. Host calls 10 numbers
    for (let i = 0; i < 10; i++) {
      const call = await callNextNumber(roomCode, hostToken);
      expect(call.number).toBeGreaterThanOrEqual(1);
      expect(call.number).toBeLessThanOrEqual(90);
    }

    const stateAfterCalls = await getRoomState(roomCode);
    expect(stateAfterCalls?.calls.length).toBe(10);
    expect(stateAfterCalls?.status).toBe('in_progress');

    // 6. Test unauthorized calls: random token cannot call number
    await expect(callNextNumber(roomCode, 'invalid_fake_token')).rejects.toThrow('Unauthorized');

    // 7. Auto-Verification test: simulate numbers matching Bob's Top Line
    const db = await getDb();
    const bobTopLine = getRowNumbers(bobTicket, 0);
    expect(bobTopLine.length).toBe(5);

    // Call Bob's top line numbers directly if not already called
    const roomRes = db.exec(`SELECT id FROM rooms WHERE code = '${roomCode}'`);
    const roomId = roomRes[0].values[0][0] as string;

    for (const num of bobTopLine) {
      const check = db.exec(`SELECT id FROM calls WHERE room_id = '${roomId}' AND number = ${num}`);
      if (!check.length || !check[0].values.length) {
        db.run(
          `INSERT INTO calls (id, room_id, number, call_order, called_at) VALUES ('${crypto.randomUUID()}', '${roomId}', ${num}, 99, '${new Date().toISOString()}')`
        );
      }
    }

    // Now Bob claims Top Line -> AUTO-VERIFIED AS ACCEPTED!
    const claimTopLine = await claimPrize(roomCode, bobToken, 'top_line');
    expect(claimTopLine.accepted).toBe(true);
    expect(claimTopLine.status).toBe('accepted');
    expect(claimTopLine.message).toContain('AUTO-VERIFIED and ACCEPTED');

    // 8. Prevent duplicate prizes: Alice tries to claim Top Line after Bob won it -> REJECTED AS ALREADY CLAIMED!
    const claimAliceTopLine = await claimPrize(roomCode, hostPlayerToken, 'top_line');
    expect(claimAliceTopLine.accepted).toBe(false);
    expect(claimAliceTopLine.status).toBe('rejected_already_claimed');
    expect(claimAliceTopLine.message).toContain('already been won by Bob Player');

    // 9. Reconnect test
    const reconnected = await reconnectPlayer(roomCode, bobToken);
    expect(reconnected.name).toBe('Bob Player');
    expect(reconnected.isHost).toBe(false);
    expect(reconnected.ticket).toEqual(bobTicket);
  });
});
