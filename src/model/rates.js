/**
 * Dated rate constants (DECISIONS.md D3). Nothing in this codebase fetches a
 * rate at runtime — the prototype is a research instrument and must show the
 * same figures in every session regardless of when it's run. Frames 29 and 30
 * read `source` and `asAt` from this object rather than repeating them as
 * copy, so the date on screen cannot drift from the rate the model actually
 * used.
 *
 * Maintenance rule (SPEC.md): any change to a value in this file requires
 * re-running the model tests and bumping sw.js's CACHE_VERSION in the same
 * commit. The Bank Rate is under Monetary Policy Committee review on
 * 17 September 2026.
 */
export const RATES = {
  bankRate: 0.0375,
  source: 'Bank of England Bank Rate',
  sourceUrl: 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate',
  asAt: '2026-07-30',
  nextReviewDate: '2026-09-17',
  rangeSpread: 0.10,
};

/** DECISIONS.md D2: every low/high range pair is the central value at 0.9 and 1.1. */
export const RANGE_SPREAD = RATES.rangeSpread;

/** GAPS.md G20 / DECISIONS.md D2 (confirmed): central value for the borrow-low/borrow-high range. */
export const BORROW_RANGE_CENTRAL = 'loan-amount';

/** GAPS.md G15 / DECISIONS.md D6: frame 09b's Lifetime ISA cap warning triggers above this property value. */
export const LISA_CAP_PROPERTY_VALUE = 450000;

/**
 * Frame 04 (Consent declined / general mode): the default monthly saving
 * range shown before a participant drags or types their own figures, and
 * the slider bounds. Published UK average, not read from any account —
 * provenance 'estimated' (build-spec.md section 2's "04 Consent declined /
 * default range" row: "annual = monthly x 12, no interest").
 */
export const GENERAL_SAVINGS_RANGE = {
  low: 150,
  high: 288,
  min: 0,
  max: 600,
  source: 'NatWest Savings Index 2026',
};
