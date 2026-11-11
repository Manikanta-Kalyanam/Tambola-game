export type PrizeType =
  | 'early_five'
  | 'top_line'
  | 'middle_line'
  | 'bottom_line'
  | 'full_house';

export const PRIZE_NAMES: Record<PrizeType, string> = {
  early_five: 'Early Five (Jaldi 5)',
  top_line: 'Top Line',
  middle_line: 'Middle Line',
  bottom_line: 'Bottom Line',
  full_house: 'Full House (Tambola)',
};

export const PRIZE_DESCRIPTIONS: Record<PrizeType, string> = {
  early_five: 'First player to mark any 5 called numbers on their ticket',
  top_line: 'First player to mark all 5 numbers on the top row',
  middle_line: 'First player to mark all 5 numbers on the middle row',
  bottom_line: 'First player to mark all 5 numbers on the bottom row',
  full_house: 'First player to mark all 15 numbers on their entire ticket',
};

export type TicketGrid = (number | null)[][]; // 3 rows x 9 columns

export interface CallRecord {
  number: number;
  order: number;
  calledAt: string;
}

export type ClaimStatus = 'accepted' | 'rejected_bogey' | 'rejected_already_claimed';

export interface WinnerInfo {
  playerId: string;
  playerName: string;
  prizeType: PrizeType;
  claimedAt: string;
  verifiedNumbers: number[];
}

export interface ClaimRecord {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  prizeType: PrizeType;
  status: ClaimStatus;
  numbers: number[];
  message: string;
  createdAt: string;
}

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface RoomState {
  code: string;
  status: 'waiting' | 'in_progress' | 'completed';
  currentNumber: number | null;
  autoCallSpeed: number; // in seconds (0 = off)
  createdAt: string;
  players: PlayerPublic[];
  calls: CallRecord[];
  winners: Partial<Record<PrizeType, WinnerInfo>>;
  claimsLog: ClaimRecord[];
  myPlayer?: {
    id: string;
    name: string;
    isHost: boolean;
    ticket: TicketGrid;
  };
}

export interface VerificationResult {
  valid: boolean;
  matchingNumbers: number[];
  reason?: string;
}
