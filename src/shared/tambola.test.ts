import { describe, it, expect } from 'vitest';
import {
  generateTambolaTicket,
  validateTicketStructure,
  verifyClaim,
  getTicketNumbers,
  getRowNumbers,
  COLUMN_RANGES,
} from './tambola';
import { TicketGrid } from './types';

describe('Tambola Pure Game Logic', () => {
  describe('generateTambolaTicket', () => {
    it('generates a structurally valid ticket', () => {
      const ticket = generateTambolaTicket();
      const validation = validateTicketStructure(ticket);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('generates 50 consecutive valid tickets without errors', () => {
      for (let i = 0; i < 50; i++) {
        const ticket = generateTambolaTicket();
        const validation = validateTicketStructure(ticket);
        expect(validation.valid, `Failed on attempt ${i}: ${validation.errors.join('; ')}`).toBe(true);

        // Verify total numbers count
        const numbers = getTicketNumbers(ticket);
        expect(numbers.length).toBe(15);
        expect(new Set(numbers).size).toBe(15);

        // Verify rows
        for (let r = 0; r < 3; r++) {
          expect(getRowNumbers(ticket, r).length).toBe(5);
        }

        // Verify column ranges
        for (let c = 0; c < 9; c++) {
          const [min, max] = COLUMN_RANGES[c];
          const colNumbers: number[] = [];
          for (let r = 0; r < 3; r++) {
            const val = ticket[r][c];
            if (val !== null) {
              expect(val).toBeGreaterThanOrEqual(min);
              expect(val).toBeLessThanOrEqual(max);
              colNumbers.push(val);
            }
          }
          expect(colNumbers.length).toBeGreaterThanOrEqual(1);
          expect(colNumbers.length).toBeLessThanOrEqual(3);

          // Verify ascending down the column
          for (let k = 1; k < colNumbers.length; k++) {
            expect(colNumbers[k]).toBeGreaterThan(colNumbers[k - 1]);
          }
        }
      }
    });
  });

  describe('validateTicketStructure edge cases', () => {
    it('detects duplicate numbers', () => {
      const invalidTicket: TicketGrid = [
        [4, 12, null, 33, 45, 52, null, null, null],
        [4, null, 22, null, 48, null, 61, 74, null],
        [null, 18, 28, null, null, 59, null, 79, 88],
      ];
      const result = validateTicketStructure(invalidTicket);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate number 4'))).toBe(true);
    });

    it('detects invalid row count', () => {
      const invalidTicket = [
        [4, 12, null, 33, 45, 52, null, null, null],
        [null, 18, 28, null, null, 59, null, 79, 88],
      ] as TicketGrid;
      const result = validateTicketStructure(invalidTicket);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('3 rows'))).toBe(true);
    });

    it('detects non-ascending column ordering', () => {
      const invalidTicket: TicketGrid = [
        [8, 12, null, 33, 45, null, null, null, null],
        [3, null, 22, null, 48, null, 61, 74, null], // col 0 has 8 above 3
        [null, 18, 28, null, null, 59, null, 79, 88],
      ];
      const result = validateTicketStructure(invalidTicket);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('strictly ascending'))).toBe(true);
    });
  });

  describe('Auto-Verification of Claims (verifyClaim)', () => {
    // Construct a known test ticket
    const testTicket: TicketGrid = [
      [7, 14, 21, null, 42, 56, null, null, null], // row 0: 7, 14, 21, 42, 56
      [null, 19, null, 35, 48, null, 63, 72, null], // row 1: 19, 35, 48, 63, 72
      [null, null, 29, 38, null, 59, null, 77, 85], // row 2: 29, 38, 59, 77, 85
    ];

    it('verifies Early Five accurately', () => {
      // 4 numbers called -> reject
      const called4 = new Set([7, 14, 21, 42]);
      const res4 = verifyClaim(testTicket, called4, 'early_five');
      expect(res4.valid).toBe(false);
      expect(res4.reason).toContain('Only 4 of required 5');

      // 5 numbers called -> accept
      const called5 = new Set([7, 14, 21, 42, 19]);
      const res5 = verifyClaim(testTicket, called5, 'early_five');
      expect(res5.valid).toBe(true);
      expect(res5.matchingNumbers.length).toBe(5);
    });

    it('verifies Top Line accurately', () => {
      // Missing one number (56) -> reject
      const calledIncomplete = new Set([7, 14, 21, 42, 99]);
      const resFail = verifyClaim(testTicket, calledIncomplete, 'top_line');
      expect(resFail.valid).toBe(false);
      expect(resFail.reason).toContain('Top line is missing numbers: 56');

      // All 5 in row 0 called -> accept
      const calledComplete = new Set([7, 14, 21, 42, 56, 1, 2, 3]);
      const resPass = verifyClaim(testTicket, calledComplete, 'top_line');
      expect(resPass.valid).toBe(true);
      expect(resPass.matchingNumbers).toEqual([7, 14, 21, 42, 56]);
    });

    it('verifies Middle Line accurately', () => {
      // row 1: [19, 35, 48, 63, 72]
      const calledComplete = new Set([19, 35, 48, 63, 72]);
      const resPass = verifyClaim(testTicket, calledComplete, 'middle_line');
      expect(resPass.valid).toBe(true);

      const calledIncomplete = new Set([19, 35, 48, 63]);
      const resFail = verifyClaim(testTicket, calledIncomplete, 'middle_line');
      expect(resFail.valid).toBe(false);
    });

    it('verifies Bottom Line accurately', () => {
      // row 2: [29, 38, 59, 77, 85]
      const calledComplete = new Set([29, 38, 59, 77, 85]);
      const resPass = verifyClaim(testTicket, calledComplete, 'bottom_line');
      expect(resPass.valid).toBe(true);

      const calledIncomplete = new Set([29, 38, 59, 77]);
      const resFail = verifyClaim(testTicket, calledIncomplete, 'bottom_line');
      expect(resFail.valid).toBe(false);
    });

    it('verifies Full House accurately', () => {
      const allNumbers = getTicketNumbers(testTicket);
      expect(allNumbers.length).toBe(15);

      // 14 called -> reject
      const called14 = new Set(allNumbers.slice(0, 14));
      const resFail = verifyClaim(testTicket, called14, 'full_house');
      expect(resFail.valid).toBe(false);
      expect(resFail.reason).toContain('Full house incomplete');

      // 15 called -> accept
      const called15 = new Set(allNumbers);
      const resPass = verifyClaim(testTicket, called15, 'full_house');
      expect(resPass.valid).toBe(true);
      expect(resPass.matchingNumbers.length).toBe(15);
    });
  });
});
