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
