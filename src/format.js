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
  // 'mo', AND IT WENT TO 'mon' AND CAME BACK (D72's amendment). The longer
  // form was tried while frame 12's comparison values looked clipped; the
  // cause turned out to be that card's missing padding, and once that was
  // fixed the string change was doing no work. 'mo' also keeps both
  // abbreviations two letters - 'yr' with 'mon' left a live mismatch, and the
  // ways out of it are worse, since 'yrs' would pair a plural with a singular
  // and this function deliberately does not inflect its abbreviated forms.
  const monthUnit = abbreviated ? 'mo' : remainderMonths === 1 ? 'month' : 'months';

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
 * "D Month YYYY" (frames 29/30/31's "as at" footer captions — DECISIONS.md
 * D3: these read RATES.asAt rather than a hand-typed date, so the figure on
 * screen can't drift from the rate the model actually used). Takes the date
 * string as a parameter rather than `new Date()` for the same reason
 * formatMonthYear does.
 */
export function formatFullDate(dateString) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
}
