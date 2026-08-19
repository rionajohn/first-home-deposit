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
 * abbreviated, "X yr Y mo" (frame 12's growth-chart x-axis). `months` is
 * always rounded up first (Math.ceil) — the same convention DECISIONS.md D2
 * uses for on-track-for, since a participant should never be told they're
 * there a fraction of a month early.
 */
export function formatMonthsDuration(months, { abbreviated = false } = {}) {
  const whole = Math.max(0, Math.ceil(months));
  const years = Math.floor(whole / 12);
  const remainderMonths = whole % 12;

  const yearUnit = abbreviated ? 'yr' : years === 1 ? 'year' : 'years';
  const monthUnit = abbreviated ? 'mo' : remainderMonths === 1 ? 'month' : 'months';

  if (years === 0) return `${remainderMonths} ${monthUnit}`;
  if (remainderMonths === 0) return `${years} ${yearUnit}`;
  return `${years} ${yearUnit} ${remainderMonths} ${monthUnit}`;
}
