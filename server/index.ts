import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import {
  createRoom,
  joinRoom,
  reconnectPlayer,
  getRoomState,
  callNextNumber,
  setAutoCallSpeed,
  claimPrize,
  resetRoom,
  subscribeToRoom,
} from './game';
import { getDb } from './db';
import { PrizeType } from '../src/shared/types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Background auto-calling interval runner
const autoCallIntervals = new Map<string, NodeJS.Timeout>();

function manageAutoCallTimer(code: string, speed: number, hostToken: string) {
  const normCode = code.toUpperCase();
  if (autoCallIntervals.has(normCode)) {
    clearInterval(autoCallIntervals.get(normCode)!);
    autoCallIntervals.delete(normCode);
  }

  if (speed > 0) {
    const timer = setInterval(async () => {
      try {
        const state = await getRoomState(normCode);
        if (!state || state.status === 'completed' || state.calls.length >= 90) {
          clearInterval(timer);
          autoCallIntervals.delete(normCode);
          return;
        }
        await callNextNumber(normCode, hostToken);
      } catch (err: any) {
        console.log(`Auto call stopped for room ${normCode}:`, err.message);
        clearInterval(timer);
        autoCallIntervals.delete(normCode);
      }
    }, speed * 1000);
    autoCallIntervals.set(normCode, timer);
  }
}

// 1. Create Room
app.post('/api/rooms', async (req: Request, res: Response) => {
  try {
    const { hostName } = req.body;
    const result = await createRoom(hostName || 'Host');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Join Room
app.post('/api/rooms/join', async (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Room code and display name are required' });
    }
    const result = await joinRoom(code, name);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Reconnect
app.post('/api/rooms/reconnect', async (req: Request, res: Response) => {
  try {
    const { code, playerToken } = req.body;
    if (!code || !playerToken) {
      return res.status(400).json({ error: 'Code and playerToken are required' });
    }
    const player = await reconnectPlayer(code, playerToken);
    const roomState = await getRoomState(code, playerToken);
    res.json({ player, roomState });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// 4. Polling Get Room State
app.get('/api/rooms/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const token =
      (req.headers.authorization?.replace(/^Bearer\s+/i, '') as string) ||
      (req.query.token as string);

    const state = await getRoomState(code, token);
    if (!state) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Server-Sent Events (SSE) Live Stream
app.get('/api/rooms/:code/stream', async (req: Request, res: Response) => {
  const { code } = req.params;
  const token = req.query.token as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state immediately
  const initialState = await getRoomState(code, token);
  if (initialState) {
    res.write(`data: ${JSON.stringify(initialState)}\n\n`);
  }

  // Subscribe to room updates
  const unsubscribe = subscribeToRoom(code, (state) => {
    // If client provided token, ensure ticket is included
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  });

  // Keep-alive ping every 15 seconds
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    unsubscribe();
  });
});

// 6. Host Calls Next Number
app.post('/api/rooms/:code/call', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const hostToken =
      req.headers['x-host-token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.body.hostToken;

    if (!hostToken) {
      return res.status(401).json({ error: 'Host authorization token required' });
    }

    const result = await callNextNumber(code, hostToken as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Auto-call Speed Control
app.post('/api/rooms/:code/auto-call', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { speed, hostToken } = req.body;
    const token =
      hostToken ||
      req.headers['x-host-token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ error: 'Host token required' });
    }

    await setAutoCallSpeed(code, token as string, Number(speed) || 0);
    manageAutoCallTimer(code, Number(speed) || 0, token as string);
    res.json({ success: true, speed: Number(speed) || 0 });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Auto-Verified Prize Claim
app.post('/api/rooms/:code/claim', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { prizeType, playerToken } = req.body;
    const token =
      playerToken ||
      req.headers['x-player-token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ error: 'Player token required' });
    }

    if (!prizeType) {
      return res.status(400).json({ error: 'Prize type is required' });
    }

    const result = await claimPrize(code, token as string, prizeType as PrizeType);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Host Resets Room
app.post('/api/rooms/:code/reset', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const hostToken =
      req.headers['x-host-token'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.body.hostToken;

    if (!hostToken) {
      return res.status(401).json({ error: 'Host token required' });
    }

    // Stop auto-calling
    if (autoCallIntervals.has(code.toUpperCase())) {
      clearInterval(autoCallIntervals.get(code.toUpperCase())!);
      autoCallIntervals.delete(code.toUpperCase());
    }

    await resetRoom(code, hostToken as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend static build if available
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Catch-all route to serve SPA
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Tambola API Server is running. Use frontend dev server on port 5173.');
    }
  });
});

// Initialize database and start server
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🎯 Tambola Server running on port ${PORT}`);
  });
});
