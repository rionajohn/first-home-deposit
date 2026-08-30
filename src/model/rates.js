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
 * The first-time-buyer average property price shown as context on frame 09
 * (build-spec.md section 2's "08 Ready for the calculator - default -
 * property-value (area average)"). Held here as a dated, sourced constant
 * rather than inlined into frame 09/09a/09b, so the caption and the
 * attribution beneath it both resolve from one place and cannot drift
 * apart. See DECISIONS.md D56.
 *
 * DISPLAY ONLY. Nothing in model/ reads this - the seeded property value a
 * session opens with is STAGE_PROPERTY_VALUE in src/stage.js, and every
 * calculation on frames 09 to 12 runs off the participant's own committed
 * `property-value`. Changing the figure here changes one sentence and its
 * caption, and no derived figure anywhere.
 *
 * `sourceUrl` is recorded for the same reason RATES.sourceUrl is: the
 * prototype renders no anchors at all (no screen in this build links out),
 * so it documents the figure rather than being read by a screen.
 */
export const AREA_AVERAGE_PROPERTY_VALUE = {
  value: 470000,
  region: 'London',
  source: 'UK House Price Index, HM Land Registry and ONS',
  asAt: '2026-06',
  asAtLabel: 'June 2026',
  sourceUrl: 'https://www.gov.uk/government/statistics/uk-house-price-index-for-june-2026/uk-house-price-index-england-june-2026',
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
 * AREA_AVERAGE_PROPERTY_VALUE above.
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

/**
 * Stamp Duty Land Tax, residential rates, England and Northern Ireland.
 * A dated, sourced constant on the AREA_AVERAGE_PROPERTY_VALUE pattern
 * (DECISIONS.md D70), so the bands and their attribution cannot drift apart.
 * Nothing fetches these at runtime, exactly as RATES above.
 *
 * TWO SCALES, AND A CLIFF BETWEEN THEM. First-time buyer relief is not a
 * discount applied to the standard result - it is a separate scale that is
 * lost ENTIRELY above `ftbReliefLimit`, at which point the standard scale
 * applies to the whole price. That is why these are two band arrays rather
 * than one with an adjustment: at 500,001 the tax is not the 500,000 figure
 * plus a marginal step, it is a different calculation. See `stampDuty()` in
 * model.js and D70's own worked figures.
 *
 * Each band is [from, to, rate] and is MARGINAL - the rate applies only to
 * the portion of the price falling inside that band, never to the whole
 * price. `Infinity` closes the top band rather than a large number, so the
 * reducer needs no special case for it.
 */
export const SDLT = {
  ftbReliefLimit: 500000,
  ftbBands: [
    [0, 300000, 0],
    [300000, 500000, 0.05],
  ],
  standardBands: [
    [0, 125000, 0],
    [125000, 250000, 0.02],
    [250000, 925000, 0.05],
    [925000, 1500000, 0.10],
    [1500000, Infinity, 0.12],
  ],
  source: 'HMRC Stamp Duty Land Tax: residential property rates',
  /**
   * How the source is NAMED ON SCREEN, as distinct from `source` above, which
   * documents the publication. `/learn/stamp-duty` cites the body rather than
   * the page title, matching how RATES.source reads on screen ("Bank of
   * England Bank Rate") - a participant recognises the institution, not the
   * document.
   */
  sourceLabel: 'HM Revenue and Customs',
  sourceUrl: 'https://www.gov.uk/stamp-duty-land-tax/residential-property-rates',
  asAt: '2026-08',
  asAtLabel: 'August 2026',
};

/**
 * Attribution for `/assumptions/costs`'s five cost ranges (DECISIONS.md D70).
 * A dated, sourced constant on the AREA_AVERAGE_PROPERTY_VALUE pattern, and
 * held here for that constant's reason: the screen renders the source and the
 * date through one `metadataTemplate`, so neither can drift from the other or
 * be updated on its own.
 *
 * The ranges themselves stay in `content.js` as prose - "Up to about £1,800",
 * "From about £400" - because nothing computes them and they are read as
 * sentences, exactly as frame 30's own cost list already was. This constant
 * carries only what attributes them.
 */
export const UPFRONT_COST_SOURCES = {
  sources: 'MoneyHelper and Halifax',
  asAt: '2026-08',
  asAtLabel: 'August 2026',
};
