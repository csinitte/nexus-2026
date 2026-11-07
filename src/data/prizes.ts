/**
 * NEXUS 2026 — Prize pool data (single source of truth).
 *
 * Used by Home page and Project Expo page via the shared <PrizePool /> component.
 *
 * Invariant: sum of all parts must equal the total.
 */
export const PRIZE_PARTS = [
  { rank: 'Winner', amount: 10000, icon: '🏆', special: false },
  { rank: "1st Runner-Up", amount: 6000, icon: '🥈', special: false },
  { rank: "2nd Runner-Up", amount: 4000, icon: '🥉', special: false },
  { rank: 'Best Innovation Award', amount: 2500, icon: '💡', special: true },
  { rank: 'Best Real-World Impact', amount: 2500, icon: '🌍', special: true },
] as const;

export const PRIZE_TOTAL = 25000;

// Dev-time assertion: parts must sum to total
// This runs at module load; in production builds it's tree-shaken away
// unless referenced, but the assertion expression itself is evaluated.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const sum = PRIZE_PARTS.reduce((acc, p) => acc + p.amount, 0);
  if (sum !== PRIZE_TOTAL) {
    throw new Error(
      `Prize pool mismatch: parts sum to ₹${sum} but PRIZE_TOTAL is ₹${PRIZE_TOTAL}`
    );
  }
}

/**
 * Format an amount in Indian rupees with en-IN grouping (e.g. ₹10,000).
 */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export type PrizePart = (typeof PRIZE_PARTS)[number];
