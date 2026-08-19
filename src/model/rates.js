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

/**
 * Frame 08 seeds the deposit calculator's starting property value from an
 * "area average" (build-spec.md section 2: "08 Ready for the calculator —
 * default — property-value (area average)") — no source is named anywhere
 * in build-spec.md/DECISIONS.md for this figure, so it's held here as a
 * dated, sourced constant rather than inlined into frame 09/09a/09b, the
 * same treatment GENERAL_SAVINGS_RANGE gets.
 */
export const AREA_AVERAGE_PROPERTY_VALUE = {
  value: 190000,
  source: 'UK House Price Index 2026, first-time-buyer average',
};

/**
 * Frame 09/09a/09b's deposit-percentage chip row (Figma "Inputs / Chip
 * row"). DEFAULT_DEPOSIT_PCT matches build-spec.md section 4's own worked
 * example (a 19,000 deposit is 10% of a 190,000 property).
 */
export const DEPOSIT_PCT_OPTIONS = [0.05, 0.10, 0.15, 0.20, 0.25];
export const DEFAULT_DEPOSIT_PCT = 0.10;

/**
 * Frame 12's deposit range, growth chart and timing rows all plot against
 * these three fixed thresholds regardless of the deposit-pct the
 * participant actually chose on frame 09 (build-spec.md section 2, "12
 * Your deposit range": "Growth chart plotted to 5 years, thresholds at 5,
 * 10, 15%") — a deliberately narrower band than DEPOSIT_PCT_OPTIONS' full
 * 5-25% chip range, giving a fixed low/mid/high comparison independent of
 * the participant's own choice.
 */
export const CHART_DEPOSIT_PCTS = [0.05, 0.10, 0.15];

/** Frame 12's growth chart plots 5 years (build-spec.md section 2). */
export const CHART_WINDOW_MONTHS = 60;

/**
 * Frame 12 / frame 16's checkpoint-amount rule (build-spec.md section 4:
 * "checkpoint-amount | 0.75 x deposit-target"), pulled out to a named
 * constant so frame 16's "You've passed the 75% checkpoint" copy can read
 * the same fraction the model actually used rather than a second, separately
 * typed "75%" in content.js.
 */
export const CHECKPOINT_FRACTION = 0.75;

/**
 * Frame 13/15/16's Loan-to-Value rate table. Illustrative market rate
 * ranges by deposit %, transcribed from frame 13's reference PNG for the
 * three deposit levels the wireframe actually draws (5/10/15%, i.e.
 * CHART_DEPOSIT_PCTS). The 20% and 25% rows extend the same
 * roughly-linear-by-LTV-band pattern the wireframe's own three points
 * follow, to cover the rest of DEPOSIT_PCT_OPTIONS — these two rows are
 * this build's own extrapolation, not transcribed from any reference PNG.
 * Not a live rate feed (build-spec.md's out-of-scope list) — a dated,
 * sourced illustrative constant, the same treatment as
 * GENERAL_SAVINGS_RANGE and AREA_AVERAGE_PROPERTY_VALUE above.
 */
export const LTV_RATE_BANDS_BY_DEPOSIT_PCT = {
  0.05: { low: 0.051, high: 0.056 },
  0.10: { low: 0.046, high: 0.052 },
  0.15: { low: 0.043, high: 0.048 },
  0.20: { low: 0.040, high: 0.045 },
  0.25: { low: 0.038, high: 0.043 },
};

/**
 * Term frame 13's "What that looks like at three deposits" table uses for
 * its Monthly/Interest rows (its own "Interest, 25 yrs" row label).
 */
export const MORTGAGE_TERM_YEARS = 25;
