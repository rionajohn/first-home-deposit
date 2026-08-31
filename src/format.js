/**
 * Currency display formatting (DECISIONS.md D9): round to the nearest whole
 * pound, en-GB locale, £ symbol, thousands separator, never pence. The
 * model (src/model/) always keeps full precision — only this formatted
 * output rounds. Use this for every deposit-journey figure: anything in
 * build-spec.md section 6, and anything derived from those figures.
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Raw account-balance display: en-GB, £ symbol, thousands separator, pence
 * shown only when the balance actually carries them. This is deliberately
 * not D9's rounding rule — D9 governs deposit-journey figures (deposit
 * target, checkpoint amount, and so on), not a literal bank balance as read
 * from an account. Frame 01's current-account balance already displays
 * with pence (£1,042.16); frame 03 reads the same mock balance for the same
 * account and must show the same number, not a rounded one.
 */
export function formatAccountBalance(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Statement-line amount for frame 01's transaction list: en-GB, £, and
 * ALWAYS two decimal places.
 *
 * Deliberately neither of the two formatters above. `formatCurrency` is D9's
 * whole-pound rule and governs deposit-journey figures, not a statement line.
 * `formatAccountBalance` shows pence only when the value carries them, which
 * would render a 2,500.00 salary credit as "£2,500" - and every other row in
 * that list draws pence, so the one row without them would read as a
 * different kind of number rather than as the same kind rounded.
 *
 * The sign is the caller's, not this function's: the list draws "+" on a
 * credit and "−" (U+2212, not a hyphen) on a debit, and those are content
 * strings.
 */
export function formatTransactionAmount(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Percentage display for rate-derived figures (e.g. RATES.bankRate as an
 * AER, or a Loan-to-Value band) — takes a fraction (0.0375, not 3.75) and
 * formats it as en-GB percent text. Keeps every on-screen percentage
 * traceable to a model value rather than a string typed into a screen.
 */
export function formatPercent(value, digits = 2) {
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Thousands-grouped whole-number digits, no currency symbol and no pence —
 * for editable currency inputs (frame 09's property-value field) whose
 * markup already renders the £ as a separate fixed prefix glyph, so
 * formatCurrency's own "£" would be a second, duplicate symbol. en-GB
 * grouping, same rounding convention as formatCurrency (D9).
 */
export function formatDigits(value) {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Whole-months duration as "X years Y months" (frame 12's timing rows) or,
 * abbreviated, "X yr Y m" (frame 12's growth-chart x-axis). `months` is
 * always rounded up first (Math.ceil) — the same convention DECISIONS.md D2
 * uses for on-track-for, since a participant should never be told they're
 * there a fraction of a month early.
 */
export function formatMonthsDuration(months, { abbreviated = false } = {}) {
  const whole = Math.max(0, Math.ceil(months));
  const years = Math.floor(whole / 12);
  const remainderMonths = whole % 12;

  const yearUnit = abbreviated ? 'yr' : years === 1 ? 'year' : 'years';
  // 'm'. THIS STRING HAS A HISTORY AND D72 CARRIES IT: 'mo' to 'mon' to 'mo'
  // to 'm', with 'm' itself declined once before being applied. The objection
  // to it was that `m` reads as MILLION beside currency, and frame 12's
  // comparison card is full of currency - £22,500, £45,000, £67,500.
  //
  // WHAT ANSWERS THAT IS THE YEAR UNIT IN FRONT OF IT. Every string this
  // branch produces at more than a year reads "24 yr 11 m", so `yr` has
  // already established that the sentence is about time before the reader
  // reaches `m`. The one surface without a leading year - the chips - sits in
  // a row beside "1 YR" and "3 YR", which does the same job by adjacency.
  //
  // The unabbreviated branch below is untouched, so the chart's point labels,
  // frame 12's live region and frame 21's step caption all still spell it.
  const monthUnit = abbreviated ? 'm' : remainderMonths === 1 ? 'month' : 'months';

  if (years === 0) return `${remainderMonths} ${monthUnit}`;
  if (remainderMonths === 0) return `${years} ${yearUnit}`;
  return `${years} ${yearUnit} ${remainderMonths} ${monthUnit}`;
}

/**
 * "Month YYYY" for a whole-number month offset from `fromDate` (frame 15/16's
 * "On track for" row). Takes the reference date as a parameter rather than
 * `new Date()` so this stays a pure function of its arguments — callers pass
 * RATES.asAt (DECISIONS.md D3: everything in this prototype is dated from
 * the pinned rate, never the wall clock, so the on-screen date range can't
 * drift between testing sessions).
 */
export function formatMonthYear(monthsFromNow, fromDate) {
  const base = new Date(fromDate);
  const target = new Date(base.getFullYear(), base.getMonth() + Math.round(monthsFromNow), 1);
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(target);
}

/** "Month YYYY to Month YYYY" for an on-track-for {low, high} months range. */
export function formatMonthYearRange(lowMonths, highMonths, fromDate) {
  return `${formatMonthYear(lowMonths, fromDate)} to ${formatMonthYear(highMonths, fromDate)}`;
}

/**
 * "YYYY" for a whole-number month offset from `fromDate` — frame 12's x-axis,
 * endpoint line and comparison rows (DECISIONS.md D102, the plan's 6.10).
 *
 * YEAR ONLY, AND THAT IS THE DECISION RATHER THAN A FORMATTING CHOICE. A
 * projection is not accurate to the month, and stating it to the month invites
 * a participant to read it as a commitment. Every date the screen CLAIMS at
 * rest goes through this; the two that report a coordinate on a plotted curve
 * rather than an arrival — the scrub readout and the table's own column — go
 * through `formatMonthYear` above (the plan's 10.6 and 6.6.9).
 *
 * Takes the anchor as a parameter for `formatMonthYear`'s reason, and callers
 * pass `state.sessionAnchor` (D97) rather than `RATES.asAt`: a pinned rate
 * dates the figures, not the day the projection is measured from.
 */
export function formatYear(monthsFromNow, fromDate) {
  const base = new Date(fromDate);
  return String(new Date(base.getFullYear(), base.getMonth() + Math.round(monthsFromNow), 1).getFullYear());
}

/**
 * Round-pound tick values for frame 12's y-axis (the plan's 6.3), as
 * `[{ value, pct }]` from 0 up to the last step at or below `maxScale`.
 *
 * IT EXISTS SO THE AXIS READS IN ROUND POUNDS rather than in `maxScale / 4`.
 * The scale follows the curve and the curve is an annuity-due solve, so
 * quartering it gives labels like "£13,142" — four figures a participant has
 * to parse before they can read anything off the chart, which is the failure
 * this whole pass is repairing.
 *
 * The step is the 1 / 2 / 5 decade above `maxScale / count`, the standard
 * choice, so the labels land on values a reader already thinks in. `pct` is
 * the position as a percentage of `maxScale` — NOT of the last tick — so the
 * ticks stay in the same coordinate space the points are plotted in.
 */
export function axisTicks(maxScale, count = 4) {
  if (!Number.isFinite(maxScale) || maxScale <= 0) return [{ value: 0, pct: 0 }];

  const rough = maxScale / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalised = rough / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

  const ticks = [];
  for (let v = 0; v <= maxScale + step / 1000; v += step) {
    ticks.push({ value: v, pct: (v / maxScale) * 100 });
  }
  return ticks;
}

/**
 * "D Month YYYY" (frames 29/30/31's "as at" footer captions — DECISIONS.md
 * D3: these read RATES.asAt rather than a hand-typed date, so the figure on
 * screen can't drift from the rate the model actually used). Takes the date
 * string as a parameter rather than `new Date()` for the same reason
 * formatMonthYear does.
 */
export function formatFullDate(dateString) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
}
