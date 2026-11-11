# 🎯 Tambola Live - Multiplayer Game

A real-time, responsive multiplayer Tambola (90-Ball Housie / Indian Bingo) game built with React, TypeScript, Tailwind CSS, Express, and SQLite/PostgreSQL with **Instant Server Auto-Verification**.

---

## 🌟 What Players Get

1. **Responsive Home Screen**:
   - Create a game room as Host or join an existing room with a 6-character room code and display name.
   - One-click invite link with URL parameters (`?room=CODE`).
   - Auto-reconnect banner allowing players to resume active games across browser refreshes or disconnects.

2. **Standard 3×9 Tambola Ticket**:
   - Authentic 3 rows × 9 columns layout with exactly 15 numbers (5 numbers per row).
   - Valid column boundaries:
     - Col 0: 1–9
     - Col 1: 10–19
     - Col 2: 20–29
     - Col 3: 30–39
     - Col 4: 40–49
     - Col 5: 50–59
     - Col 6: 60–69
     - Col 7: 70–79
     - Col 8: 80–90
   - Strictly ascending column ordering down each column.
   - Interactive tactile dabbing/marking with audio feedback.
   - "Dab All Called" convenience button for fast play.

3. **Shared Live Game View**:
   - Host calls unique numbers from 1–90 (manual draw button or configurable auto-caller at 2s, 3s, or 5s intervals).
   - Real-time updates delivered via Server-Sent Events (SSE) stream with fast polling fallback.
   - Full 1–90 Master Board grid showing all called balls and recent call reel.
   - 3D glossy bingo ball spotlight displaying the latest drawn ball with traditional Tambola nicknames (e.g. *88 = Two Fat Ladies*, *1 = Kelly's Eye*).
   - Audio announcements using Web Speech Synthesis and Web Audio chimes.

4. **⚡ 100% Server Auto-Verified Claims (No Manual Host Verification)**:
   - Clickable prize claims for:
     - **Early Five (Jaldi 5)**: First 5 numbers marked on ticket.
     - **Top Line**: All 5 numbers in Row 1.
     - **Middle Line**: All 5 numbers in Row 2.
     - **Bottom Line**: All 5 numbers in Row 3.
     - **Full House (Tambola)**: All 15 numbers on the ticket.
   - **Deterministic Server-Side Verification**:
     - The server matches the player's ticket numbers against the room's called numbers.
     - **Valid claim**: Instantly accepted, winner recorded, confetti explosion, celebration audio!
     - **Bogey claim**: If criteria are not met, automatically rejected with an explanation (e.g., "Missing numbers: 14, 22").
     - **Duplicate prevention**: Each prize can only be accepted once per room. Subsequent claims report the existing winner.

5. **Room Results & Winners View**:
   - Modal displaying all 5 accepted winners, timestamp, and verified numbers.
   - Complete chronological called-number log.

---

## 🔒 Security & Data Architecture

- **Token-Based Authentication**:
  - Unauthenticated players do not require logins; rooms generate cryptographically secure tokens (`hostToken` and `playerToken`).
  - **Only token hashes (SHA-256)** are stored in the database.
  - Every action (`callNumber`, `claimPrize`, `resetRoom`) validates the token hash before executing.
- **Lovable Cloud / Supabase Schema**:
  - Full PostgreSQL schema with Row-Level Security (RLS) policies in [`supabase/schema.sql`](supabase/schema.sql).
  - High performance, server-side data access, and database-level unique constraints preventing duplicate calls or prizes.

---

## 📁 Project Structure

```
├── dist/                     # Optimized production bundle
├── server/
│   ├── db.ts                 # SQLite database via sql.js + SHA-256 token hashing
│   ├── game.ts               # Core game actions, auto-verification, SSE broadcaster
│   ├── game.test.ts          # End-to-end integration tests
│   └── index.ts              # Express API server + static file serving + SSE stream
├── src/
│   ├── components/
│   │   ├── BoardView.tsx     # 1-90 Master Board
│   │   ├── CallHistory.tsx   # Recent called numbers reel
│   │   ├── ClaimsBar.tsx     # 5 prize cards with instant auto-verification
│   │   ├── CurrentBall.tsx   # 3D glossy ball spotlight with nicknames
│   │   ├── Header.tsx        # Room code, audio toggle, connection status
│   │   ├── HomeScreen.tsx    # Create room, join room, reconnect card
│   │   ├── HostControls.tsx  # Host draw console & auto-caller speed controls
│   │   ├── PlayersLog.tsx    # Live activity feed & room player list
│   │   ├── ResultsModal.tsx  # Winners summary & call history
│   │   └── TicketView.tsx    # 3x9 authentic ticket grid with dabbing
│   ├── shared/
│   │   ├── tambola.ts        # Pure ticket generator & claim verification logic
│   │   ├── tambola.test.ts   # 10 unit tests for ticket shapes & claims
│   │   └── types.ts          # Shared TypeScript models and interfaces
│   ├── utils/
│   │   ├── api.ts            # Client API, persistence & SSE connection
│   │   └── audio.ts          # Speech synthesis & Web Audio effects
│   ├── App.tsx               # Main state controller
│   ├── index.css             # Tailwind CSS & 3D ball styles
│   └── main.tsx              # React DOM entrypoint
├── supabase/
│   └── schema.sql            # Lovable Cloud PostgreSQL schema with RLS
└── package.json
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```
Runs 11 automated unit and integration tests covering ticket structure validation, number column ranges, auto-verification of all 5 prizes, bogey detection, token security, and duplicate prize prevention.

### 3. Build & Run Production Server
```bash
npm run build
npm start
```
Starts the full-stack server on `http://localhost:3001` (serving both the API and the React frontend).

### 4. Run in Development Mode
In one terminal:
```bash
npm run server
```
In a second terminal:
```bash
npm run dev
```
Open `http://localhost:5173`.
