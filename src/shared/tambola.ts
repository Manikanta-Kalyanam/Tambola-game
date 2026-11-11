import { PrizeType, TicketGrid, VerificationResult } from './types';

// Column boundaries for standard 90-ball Tambola (Housie)
export const COLUMN_RANGES: [number, number][] = [
  [1, 9],    // Col 0
  [10, 19],  // Col 1
  [20, 29],  // Col 2
  [30, 39],  // Col 3
  [40, 49],  // Col 4
  [50, 59],  // Col 5
  [60, 69],  // Col 6
  [70, 79],  // Col 7
  [80, 90],  // Col 8 (up to 90)
];

export const DIGIT_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];

/**
 * Returns the spoken call text for a number without taglines:
 * e.g. 64 -> "Six Four, 64"
 * e.g. 7 -> "Single Seven, 7"
 * e.g. 88 -> "Eight Eight, 88"
 */
export function getNumberCallSpoken(num: number): string {
  if (num < 1 || num > 90) return `Number ${num}`;
  if (num < 10) {
    return `Single ${DIGIT_WORDS[num]}, ${num}`;
  }
  const d1 = Math.floor(num / 10);
  const d2 = num % 10;
  return `${DIGIT_WORDS[d1]} ${DIGIT_WORDS[d2]}, ${num}`;
}

/**
 * Returns clean display text without taglines:
 * e.g. 64 -> "Six Four • 64"
 * e.g. 7 -> "Single Seven • 7"
 */
export function getNumberCallDisplay(num: number): string {
  if (num < 1 || num > 90) return `${num}`;
  if (num < 10) {
    return `Single ${DIGIT_WORDS[num]} • ${num}`;
  }
  const d1 = Math.floor(num / 10);
  const d2 = num % 10;
  return `${DIGIT_WORDS[d1]} ${DIGIT_WORDS[d2]} • ${num}`;
}

// Clean number labels without taglines
export const NUMBER_NICKNAMES: Record<number, string> = new Proxy(
  {},
  {
    get: (_, prop) => {
      const n = Number(prop);
      if (isNaN(n)) return '';
      return getNumberCallDisplay(n);
    },
  }
);

/**
 * Generate a random integer between min and max inclusive
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array in-place
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generate a standard valid 3x9 Tambola ticket.
 * Rules:
 * - 3 rows x 9 columns
 * - Exactly 5 numbers per row (15 numbers total)
 * - Each column has 1, 2, or 3 numbers
 * - Numbers in column c fall in COLUMN_RANGES[c]
 * - Numbers in each column appear in ascending order from top to bottom
 */
export function generateTambolaTicket(): TicketGrid {
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    const ticket = tryBuildTicket();
    if (ticket && validateTicketStructure(ticket).valid) {
      return ticket;
    }
  }
  // Fallback guaranteed generation if random search misses
  return fallbackBuildTicket();
}

function tryBuildTicket(): TicketGrid | null {
  // Initialize empty grid 3x9
  const grid: (number | null)[][] = [
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
  ];

  // Distribute 15 positions across 9 columns:
  // Each of the 9 columns must have at least 1 number -> 9 slots used.
  // Remaining 6 slots distributed across the 9 columns (max 3 per column, max 2 additional per column).
  const colCounts = [1, 1, 1, 1, 1, 1, 1, 1, 1];
  const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  shuffle(colIndices);

  // Add 6 more to make 15 total numbers
  for (let i = 0; i < 6; i++) {
    colCounts[colIndices[i]]++;
  }

  // Now assign which row gets the number for each column so each row has exactly 5 numbers.
  // We can model this row allocation:
  const rowCounts = [0, 0, 0];
  const colRowAssignments: number[][] = [];

  for (let c = 0; c < 9; c++) {
    const count = colCounts[c];
    if (count === 3) {
      colRowAssignments[c] = [0, 1, 2];
      rowCounts[0]++;
      rowCounts[1]++;
      rowCounts[2]++;
    } else if (count === 2) {
      // Pick 2 rows
      colRowAssignments[c] = [];
    } else {
      // Pick 1 row
      colRowAssignments[c] = [];
    }
  }

  // Backtracking or greedy fill for columns with 1 or 2 numbers
  const remainingCols = colIndices.filter((c) => colCounts[c] < 3);
  // Sort remaining columns descending by count
  remainingCols.sort((a, b) => colCounts[b] - colCounts[a]);

  function fillRows(index: number): boolean {
    if (index >= remainingCols.length) {
      return rowCounts[0] === 5 && rowCounts[1] === 5 && rowCounts[2] === 5;
    }

    const c = remainingCols[index];
    const count = colCounts[c];

    if (count === 2) {
      const pairs = [
        [0, 1],
        [0, 2],
        [1, 2],
      ];
      shuffle(pairs);
      for (const [r1, r2] of pairs) {
        if (rowCounts[r1] < 5 && rowCounts[r2] < 5) {
          rowCounts[r1]++;
          rowCounts[r2]++;
          colRowAssignments[c] = [r1, r2];
          if (fillRows(index + 1)) return true;
          rowCounts[r1]--;
          rowCounts[r2]--;
          colRowAssignments[c] = [];
        }
      }
    } else if (count === 1) {
      const rows = [0, 1, 2];
      shuffle(rows);
      for (const r of rows) {
        if (rowCounts[r] < 5) {
          rowCounts[r]++;
          colRowAssignments[c] = [r];
          if (fillRows(index + 1)) return true;
          rowCounts[r]--;
          colRowAssignments[c] = [];
        }
      }
    }
    return false;
  }

  if (!fillRows(0)) {
    return null;
  }

  // Now choose unique random numbers for each column in ascending order
  for (let c = 0; c < 9; c++) {
    const [min, max] = COLUMN_RANGES[c];
    const count = colCounts[c];
    const rows = colRowAssignments[c].sort((a, b) => a - b);

    // Pick 'count' unique numbers from min..max
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    shuffle(pool);
    const chosen = pool.slice(0, count).sort((a, b) => a - b);

    for (let i = 0; i < count; i++) {
      grid[rows[i]][c] = chosen[i];
    }
  }

  return grid;
}

function fallbackBuildTicket(): TicketGrid {
  // Deterministic valid distribution template:
  // Col counts: [2, 2, 1, 2, 2, 1, 2, 2, 1] -> sum = 15
  // Row 0 has 5 cols: 0, 1, 3, 4, 6
  // Row 1 has 5 cols: 0, 1, 2, 4, 7
  // Row 2 has 5 cols: 3, 5, 6, 7, 8
  const rowPattern = [
    [1, 1, 0, 1, 1, 0, 1, 0, 0], // row 0: 5 numbers
    [1, 1, 1, 0, 1, 0, 0, 1, 0], // row 1: 5 numbers
    [0, 0, 0, 1, 0, 1, 1, 1, 1], // row 2: 5 numbers
  ];

  const grid: TicketGrid = [
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
  ];

  for (let c = 0; c < 9; c++) {
    const [min, max] = COLUMN_RANGES[c];
    const activeRows: number[] = [];
    for (let r = 0; r < 3; r++) {
      if (rowPattern[r][c] === 1) activeRows.push(r);
    }
    const count = activeRows.length;
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    shuffle(pool);
    const chosen = pool.slice(0, count).sort((a, b) => a - b);
    for (let i = 0; i < count; i++) {
      grid[activeRows[i]][c] = chosen[i];
    }
  }

  return grid;
}

/**
 * Validates the strict structure and rules of a Tambola ticket.
 */
export function validateTicketStructure(ticket: TicketGrid): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!ticket || ticket.length !== 3) {
    errors.push('Ticket must have exactly 3 rows');
    return { valid: false, errors };
  }

  let totalNumbers = 0;
  const allNumbers = new Set<number>();

  for (let r = 0; r < 3; r++) {
    if (!ticket[r] || ticket[r].length !== 9) {
      errors.push(`Row ${r} must have exactly 9 columns`);
      continue;
    }
    const rowNumbers = ticket[r].filter((n) => n !== null) as number[];
    if (rowNumbers.length !== 5) {
      errors.push(`Row ${r} must contain exactly 5 numbers (found ${rowNumbers.length})`);
    }
    for (const num of rowNumbers) {
      if (allNumbers.has(num)) {
        errors.push(`Duplicate number ${num} found on ticket`);
      }
      allNumbers.add(num);
      totalNumbers++;
    }
  }

  if (totalNumbers !== 15) {
    errors.push(`Ticket must contain exactly 15 numbers (found ${totalNumbers})`);
  }

  // Check columns range and ordering
  for (let c = 0; c < 9; c++) {
    const [min, max] = COLUMN_RANGES[c];
    const colNumbers: number[] = [];
    for (let r = 0; r < 3; r++) {
      const val = ticket[r][c];
      if (val !== null) {
        if (val < min || val > max) {
          errors.push(`Number ${val} in column ${c} is out of range [${min}, ${max}]`);
        }
        colNumbers.push(val);
      }
    }
    if (colNumbers.length === 0) {
      errors.push(`Column ${c} has no numbers (must have 1-3)`);
    }
    if (colNumbers.length > 3) {
      errors.push(`Column ${c} has more than 3 numbers`);
    }
    // Check strictly ascending order down the column
    for (let i = 1; i < colNumbers.length; i++) {
      if (colNumbers[i] <= colNumbers[i - 1]) {
        errors.push(`Column ${c} numbers are not in strictly ascending order: ${colNumbers.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extracts all non-null numbers from a ticket.
 */
export function getTicketNumbers(ticket: TicketGrid): number[] {
  const numbers: number[] = [];
  for (const row of ticket) {
    for (const val of row) {
      if (val !== null) numbers.push(val);
    }
  }
  return numbers;
}

/**
 * Extracts numbers for a specific row index (0 = top, 1 = middle, 2 = bottom).
 */
export function getRowNumbers(ticket: TicketGrid, rowIndex: number): number[] {
  if (rowIndex < 0 || rowIndex > 2) return [];
  return ticket[rowIndex].filter((n): n is number => n !== null);
}

/**
 * Auto-verifies a prize claim against the ticket and called numbers.
 * Pure game logic - completely deterministic and tamper-proof.
 */
export function verifyClaim(
  ticket: TicketGrid,
  calledNumbersSet: Set<number>,
  prizeType: PrizeType
): VerificationResult {
  switch (prizeType) {
    case 'early_five': {
      const allNumbers = getTicketNumbers(ticket);
      const matched = allNumbers.filter((n) => calledNumbersSet.has(n));
      if (matched.length >= 5) {
        return {
          valid: true,
          matchingNumbers: matched.slice(0, 5),
        };
      }
      return {
        valid: false,
        matchingNumbers: matched,
        reason: `Only ${matched.length} of required 5 numbers have been called on your ticket.`,
      };
    }

    case 'top_line': {
      const row0 = getRowNumbers(ticket, 0);
      const matched = row0.filter((n) => calledNumbersSet.has(n));
      if (matched.length === 5) {
        return {
          valid: true,
          matchingNumbers: matched,
        };
      }
      const missing = row0.filter((n) => !calledNumbersSet.has(n));
      return {
        valid: false,
        matchingNumbers: matched,
        reason: `Top line is missing numbers: ${missing.join(', ')}.`,
      };
    }

    case 'middle_line': {
      const row1 = getRowNumbers(ticket, 1);
      const matched = row1.filter((n) => calledNumbersSet.has(n));
      if (matched.length === 5) {
        return {
          valid: true,
          matchingNumbers: matched,
        };
      }
      const missing = row1.filter((n) => !calledNumbersSet.has(n));
      return {
        valid: false,
        matchingNumbers: matched,
        reason: `Middle line is missing numbers: ${missing.join(', ')}.`,
      };
    }

    case 'bottom_line': {
      const row2 = getRowNumbers(ticket, 2);
      const matched = row2.filter((n) => calledNumbersSet.has(n));
      if (matched.length === 5) {
        return {
          valid: true,
          matchingNumbers: matched,
        };
      }
      const missing = row2.filter((n) => !calledNumbersSet.has(n));
      return {
        valid: false,
        matchingNumbers: matched,
        reason: `Bottom line is missing numbers: ${missing.join(', ')}.`,
      };
    }

    case 'full_house': {
      const allNumbers = getTicketNumbers(ticket);
      const matched = allNumbers.filter((n) => calledNumbersSet.has(n));
      if (matched.length === 15) {
        return {
          valid: true,
          matchingNumbers: matched,
        };
      }
      const missing = allNumbers.filter((n) => !calledNumbersSet.has(n));
      return {
        valid: false,
        matchingNumbers: matched,
        reason: `Full house incomplete. ${missing.length} numbers still needed: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}.`,
      };
    }

    default:
      return {
        valid: false,
        matchingNumbers: [],
        reason: 'Unknown prize type',
      };
  }
}

/**
 * Generate multiple valid 3x9 tickets for a single player (e.g. 1 to 6 tickets).
 */
export function generateMultipleTickets(count: number = 1): TicketGrid[] {
  if (count <= 0) return [];
  const safeCount = Math.max(1, Math.min(6, Math.floor(count) || 1));
  const tickets: TicketGrid[] = [];
  for (let i = 0; i < safeCount; i++) {
    tickets.push(generateTambolaTicket());
  }
  return tickets;
}

/**
 * Auto-verifies a prize claim across all tickets owned by a player.
 * Checks each ticket; if any ticket meets the win criteria, returns valid with that ticket's index.
 */
export function verifyClaimMultiTicket(
  tickets: TicketGrid[],
  calledNumbersSet: Set<number>,
  prizeType: PrizeType
): VerificationResult {
  if (!tickets || tickets.length === 0) {
    return {
      valid: false,
      matchingNumbers: [],
      reason: 'No tickets found for player.',
    };
  }

  let bestFailResult: VerificationResult | null = null;
  let maxMatched = -1;

  for (let i = 0; i < tickets.length; i++) {
    const res = verifyClaim(tickets[i], calledNumbersSet, prizeType);
    if (res.valid) {
      return {
        ...res,
        winningTicketIndex: i,
      };
    }

    if (res.matchingNumbers.length > maxMatched) {
      maxMatched = res.matchingNumbers.length;
      bestFailResult = {
        ...res,
        winningTicketIndex: i,
      };
    }
  }

  return bestFailResult || verifyClaim(tickets[0], calledNumbersSet, prizeType);
}


