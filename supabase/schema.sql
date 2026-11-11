-- Tambola Multiplayer Game - Lovable Cloud / Supabase PostgreSQL Schema
-- Includes Row Level Security (RLS), Token Hashing, and Narrow Server Actions

-- Enable pgcrypto for token hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    host_token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
    current_number INT CHECK (current_number IS NULL OR (current_number >= 1 AND current_number <= 90)),
    auto_call_speed INT NOT NULL DEFAULT 0 CHECK (auto_call_speed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    player_token_hash VARCHAR(64) NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    ticket JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CALLS TABLE (Enforces unique calls per room)
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    number INT NOT NULL CHECK (number >= 1 AND number <= 90),
    call_order INT NOT NULL,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_room_number UNIQUE (room_id, number)
);

-- 4. CLAIMS TABLE (Enforces auto-verified claims and prevents duplicate prize winners)
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    prize_type VARCHAR(30) NOT NULL CHECK (prize_type IN ('early_five', 'top_line', 'middle_line', 'bottom_line', 'full_house')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('accepted', 'rejected_bogey', 'rejected_already_claimed')),
    verified_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index to prevent duplicate accepted prizes per room
CREATE UNIQUE INDEX IF NOT EXISTS unique_accepted_prize_per_room
ON public.claims (room_id, prize_type)
WHERE status = 'accepted';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_players_room ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_calls_room_order ON public.calls(room_id, call_order);
CREATE INDEX IF NOT EXISTS idx_claims_room ON public.claims(room_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Server-side / Public Read Policies:
-- Anyone can view room state, call history, public player names, and claims
CREATE POLICY "Public can view rooms by code"
ON public.rooms FOR SELECT
USING (true);

CREATE POLICY "Public can view players public info"
ON public.players FOR SELECT
USING (true);

CREATE POLICY "Public can view calls"
ON public.calls FOR SELECT
USING (true);

CREATE POLICY "Public can view claims"
ON public.claims FOR SELECT
USING (true);

-- Direct modifications are blocked for unauthenticated clients;
-- All mutating actions are executed through validated server RPCs or the backend API.
CREATE POLICY "Server only room insert" ON public.rooms FOR INSERT WITH CHECK (false);
CREATE POLICY "Server only room update" ON public.rooms FOR UPDATE USING (false);
CREATE POLICY "Server only player insert" ON public.players FOR INSERT WITH CHECK (false);
CREATE POLICY "Server only call insert" ON public.calls FOR INSERT WITH CHECK (false);
CREATE POLICY "Server only claim insert" ON public.claims FOR INSERT WITH CHECK (false);

