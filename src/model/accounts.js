/**
 * Mock linked-account data for frame 03 (Consent and linked accounts) and
 * frame 03b (Move this account). This is the prototype's stand-in for a real
 * open-banking read — see build-spec.md's out-of-scope list.
 *
 * Each account belongs to one of four groups, matching the four
 * "Content / Account group header" sections drawn in the reference PNG:
 *   - 'unassigned' — the bank can't tell what it's for ("Not sorted yet")
 *   - 'deposit'    — counted toward saved-toward-deposit
 *   - 'emergency'  — counted toward emergency-fund
 *   - 'excluded'   — shown for transparency but never counted in any total
 *
 * `excludeFromTotal` marks the current account specifically: its own caption
 * ("Not included in total above") says it never contributes to a total even
 * though it renders inside the "Not counted" group alongside accounts that
 * do (the holiday pot). Frame 03b can move an account between the first
 * three groups; the current account is never movable (no chevron row is
 * wired to open 03b for it in the reference).
 */

export const MOCK_ACCOUNTS = [
  {
    id: 'stocks-isa',
    name: 'Stocks and shares ISA',
    category: 'Stocks and shares ISA',
    balance: 2400,
    group: 'unassigned',
    captionKey: 'stocksIsaCaption',
    movable: true,
  },
  {
    id: 'house-pot',
    name: 'House pot',
    category: 'Pot',
    balance: 3150,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'instant-saver',
    name: 'Instant saver',
    category: 'Savings',
    balance: 1850,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'cash-isa',
    name: 'Cash ISA',
    category: 'Cash ISA',
    balance: 1200,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'lifetime-isa',
    name: 'Lifetime ISA',
    category: 'Lifetime ISA',
    balance: 2750,
    group: 'deposit',
    captionKey: 'lifetimeIsaCaption',
    movable: true,
  },
  {
    id: 'emergency-fund',
    name: 'Emergency fund',
    category: 'Pot',
    balance: 5600,
    group: 'emergency',
    captionKey: 'emergencyFundCaption',
    movable: true,
  },
  {
    id: 'current-account',
    name: 'Current account',
    category: 'Current account',
    balance: 1042.16,
    group: 'excluded',
    captionKey: 'currentAccountCaption',
    excludeFromTotal: true,
    movable: false,
  },
  {
    id: 'holiday-pot',
    name: 'Holiday pot',
    category: 'Pot',
    balance: 420,
    group: 'excluded',
    movable: true,
  },
];

export const GROUP_ORDER = ['unassigned', 'deposit', 'emergency', 'excluded'];

/**
 * Mock monthly position for frame 05/05b (money-in, essential-spending —
 * build-spec.md section 6). Read from the same mock salary credit shown on
 * frame 01's transaction list (+£2,240.00), so the figure is consistent
 * across screens rather than a second, unrelated number. Provenance is
 * 'read' in both personalised and estimate mode: build-spec.md's own
 * "unseen balances flagged prefilled-estimated" (section 1, "Agree and
 * continue (mode = estimate)" row) scopes the estimate to account
 * *balances* held elsewhere — money-in/essential-spending come from this
 * bank's own current-account activity, which is visible regardless of where
 * the participant's savings are held.
 */
export const MOCK_POSITION = {
  moneyIn: 2240,
  essentialSpending: 1860,
  // Frame 10's "how you'll save" range slider (monthly-low/monthly-high):
  // read from the instant saver's own deposit history, the same source the
  // frame 10 review row credits ("Read from your instant saver") for the
  // savings interest rate row. Values match the range build-spec.md/Figma
  // draws (£200 to £310) so the built screen matches the reference.
  recentMonthlySavingLow: 200,
  recentMonthlySavingHigh: 310,
  // Frame 15/16's "This month" card: both captioned "Read from..." (a
  // directly-read mock figure, provenance 'read' — not derived from
  // savings-rate or the AER, which would carry a different provenance and
  // contradict that caption).
  thisMonthSaved: 310,
  thisMonthInterest: 38,
};

/**
 * Re-derives each account's effective group and included-in-total flag from
 * state overrides (03b moves an account's group; the "Select all accounts"
 * row toggles inclusion for the deposit group — see consent.js). Pure:
 * takes the base list and two override maps, returns a new list.
 */
export function effectiveAccounts(assignments = {}, included = {}) {
  return MOCK_ACCOUNTS.map((account) => {
    const group = assignments[account.id] ?? account.group;
    const isIncluded = group === 'deposit' ? (included[account.id] ?? true) : true;
    return { ...account, group, included: isIncluded };
  });
}

/**
 * Sums balances by group, honouring excludeFromTotal and the deposit
 * group's included flag. Returns the four section-6 raw source figures this
 * screen is responsible for seeding: unassigned, saved-toward-deposit
 * ('deposit' here), emergency-fund ('emergency' here) and the not-counted
 * subtotal shown under its own header.
 */
export function groupTotals(accounts) {
  const totals = { unassigned: 0, deposit: 0, emergency: 0, notCounted: 0 };
  for (const account of accounts) {
    if (account.excludeFromTotal) continue;
    if (account.group === 'deposit' && !account.included) continue;
    if (account.group === 'unassigned') totals.unassigned += account.balance;
    else if (account.group === 'deposit') totals.deposit += account.balance;
    else if (account.group === 'emergency') totals.emergency += account.balance;
    else if (account.group === 'excluded') totals.notCounted += account.balance;
  }
  return totals;
}

export function depositSelection(accounts) {
  const depositAccounts = accounts.filter((a) => a.group === 'deposit');
  const selected = depositAccounts.filter((a) => a.included).length;
  return { selected, total: depositAccounts.length };
}
