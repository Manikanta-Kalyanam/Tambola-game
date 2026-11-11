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
  early_five: 'Any 5 numbers marked on the ticket',
  top_line: 'All 5 numbers on the top row',
  middle_line: 'All 5 numbers on the middle row',
  bottom_line: 'All 5 numbers on the bottom row',
  full_house: 'All 15 numbers on the entire ticket',
};

export type TicketGrid = (number | null)[][]; // 3 rows x 9 columns

export interface RoomRewards {
  early_five?: string;
  top_line?: string;
  middle_line?: string;
  bottom_line?: string;
  full_house?: string;
  ticket_price?: string;
}

export const DEFAULT_REWARDS: RoomRewards = {
  early_five: '₹50',
  top_line: '₹100',
  middle_line: '₹100',
  bottom_line: '₹100',
  full_house: '₹500',
  ticket_price: '₹20',
};

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
  ticketIndex?: number;
  reward?: string;
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
  ticketIndex?: number;
}

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
  ticketCount: number;
}

export interface RoomState {
  code: string;
  status: 'waiting' | 'in_progress' | 'completed';
  currentNumber: number | null;
  autoCallSpeed: number; // in seconds (0 = off)
  createdAt: string;
  rewards: RoomRewards;
  players: PlayerPublic[];
  calls: CallRecord[];
  winners: Partial<Record<PrizeType, WinnerInfo>>;
  claimsLog: ClaimRecord[];
  myPlayer?: {
    id: string;
    name: string;
    isHost: boolean;
    tickets: TicketGrid[];
  };
}

export interface VerificationResult {
  valid: boolean;
  matchingNumbers: number[];
  reason?: string;
  winningTicketIndex?: number;
}
