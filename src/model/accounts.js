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
 *
 * ---------------------------------------------------------------------------
 * `countsTowardDeposit` — THE ONE PLACE THE RULE LIVES
 * ---------------------------------------------------------------------------
 * Whether an account is the kind of account that can be counted toward a
 * house deposit. It is an explicit flag on each account rather than something
 * inferred from the account's name or category at render time, so the rule
 * can be changed here, once, without touching a screen.
 *
 * It is a property of the ACCOUNT, not of where the account currently sits.
 * Frame 03b moves an account between groups; it never changes what kind of
 * account it is. So this flag fixes the denominator of frame 03's
 * "N of M selected" — M is the number of accounts flagged true, and does not
 * move as a participant files things.
 *
 * Current rule (see the flag on each account below):
 *   counts      Pot, Savings, Cash ISA, Lifetime ISA, Stocks and shares ISA,
 *               including one the bank has not sorted yet
 *   never       a current account (everyday spending, not savings)
 *   never       a short-term goal pot, e.g. a holiday pot
 *   never       the emergency fund
 *
 * The emergency fund is the one judgement call in that list. It is a Pot, so
 * on type alone it would count — but `emergency-fund` is its own build-spec.md
 * section 6 variable, kept deliberately separate from `saved-toward-deposit`,
 * and frame 06 tells the participant in as many words that it is not counted
 * toward a deposit. Counting it here would contradict the screen that follows.
 * Flip its flag below if that is the wrong call.
 *
 * ---------------------------------------------------------------------------
 * `goalHorizon` — WHAT /goals SHOWS, AND WHY IT IS A FLAG AND NOT A SCREEN RULE
 * ---------------------------------------------------------------------------
 * `'short'`, `'long'`, or absent. Absent means "not a goal" — it is an
 * account, and the bank's goals area does not list accounts.
 *
 * The rule it encodes is "a goal is a Pot with a purpose": the three Pots
 * here carry it, the four savings accounts and the current account do not.
 * A Cash ISA is where money sits, not something you are saving *for*.
 *
 * It lives on the account for the same reason `countsTowardDeposit` does —
 * so /goals reads one field rather than re-deriving the classification from
 * names or categories at render time, and so a pot added here appears in
 * both places with one figure. The participant who saw "Holiday pot £420" on
 * frame 03 sees £420 on /goals because it is literally the same `balance`.
 *
 * NOTHING ON /goals ADDS A FIGURE THAT IS NOT ALREADY HERE. No targets, no
 * progress percentages, no projections — every one of those would be a
 * number this prototype invented, and /goals presents no computed result. If
 * a goal with a target is ever needed, add it as a field here, not in the
 * screen.
 */

export const MOCK_ACCOUNTS = [
  {
    id: 'stocks-isa',
    // Not sorted yet, but a Stocks and shares ISA is a savings account.
    countsTowardDeposit: true,
    name: 'Stocks and shares ISA',
    category: 'Stocks and shares ISA',
    balance: 2400,
    group: 'unassigned',
    captionKey: 'stocksIsaCaption',
    // THE ONLY CAPTION ON THIS SCREEN THAT ASKS FOR SOMETHING. It ends "Tap to
    // tell us", so once the participant HAS told us it invites an action they
    // have already taken. Rendered only while this account is unsorted.
    //
    // A FLAG RATHER THAN A BLANKET RULE, because the other three captions are
    // the opposite kind of string and none of their accounts is ever
    // unassigned. `lifetimeIsaCaption` explains why an account IS counted and
    // offers a move; `emergencyFundCaption` and `currentAccountCaption` state
    // what a pot is for. Gating every caption on "unsorted" would delete all
    // three outright, since Lifetime ISA opens in `deposit`, Emergency fund in
    // `emergency` and Current account in `excluded`. What is being corrected
    // is the PROMPT pattern, and this is its only instance.
    captionWhileUnsorted: true,
    movable: true,
  },
  {
    id: 'house-pot',
    countsTowardDeposit: true,
    goalHorizon: 'long',
    name: 'House pot',
    category: 'Pot',
    balance: 3150,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'instant-saver',
    countsTowardDeposit: true,
    name: 'Instant saver',
    category: 'Savings',
    balance: 1850,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'cash-isa',
    countsTowardDeposit: true,
    name: 'Cash ISA',
    category: 'Cash ISA',
    balance: 1200,
    group: 'deposit',
    movable: true,
  },
  {
    id: 'lifetime-isa',
    countsTowardDeposit: true,
    name: 'Lifetime ISA',
    category: 'Lifetime ISA',
    balance: 2750,
    group: 'deposit',
    captionKey: 'lifetimeIsaCaption',
    // A CAPTION THAT STATES A CONSEQUENCE ONLY HOLDS WHILE THE CONSEQUENCE
    // DOES. This one opens "Mainly for buying a first home, so we've counted
    // it", which contradicts the participant's own checkbox the moment they
    // untick the account - on the screen where unticking is the whole task.
    // So it renders only while the account is actually being counted, the
    // same shape as `captionWhileUnsorted` above: a flag on the account,
    // read by the one predicate in `consent.js` that decides whether a
    // caption applies. No second string, and the string itself is unchanged
    // (DECISIONS.md D142).
    captionWhileCounted: true,
    movable: true,
  },
  {
    id: 'emergency-fund',
    // A Pot by type, but held for emergencies — see the header note.
    countsTowardDeposit: false,
    goalHorizon: 'short',
    name: 'Emergency fund',
    category: 'Pot',
    balance: 5600,
    group: 'emergency',
    captionKey: 'emergencyFundCaption',
    movable: true,
  },
  {
    id: 'current-account',
    // Everyday spending, not savings.
    countsTowardDeposit: false,
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
    // A Pot by type, but a short-term goal, not a house deposit. The reason
    // it is excluded from the deposit is the same reason it is a goal in its
    // own right on /goals.
    countsTowardDeposit: false,
    goalHorizon: 'short',
    name: 'Holiday pot',
    category: 'Pot',
    balance: 420,
    group: 'excluded',
    movable: true,
  },
];

export const GROUP_ORDER = ['unassigned', 'deposit', 'emergency', 'excluded'];

/** The two sections /goals draws, in the order it draws them. */
export const GOAL_HORIZONS = ['short', 'long'];

/**
 * The bank's goals area, grouped by horizon: `{ short: [...], long: [...] }`.
 *
 * Takes the same `effectiveAccounts()` list every other screen works from,
 * so a 03b move or a select-all is reflected here without /goals knowing
 * either control exists. Order within a section follows MOCK_ACCOUNTS, which
 * is the order frame 03 lists them in — so a participant reading down the
 * two screens meets the same pots in the same sequence.
 *
 * `excludeFromTotal` is irrelevant here and deliberately not consulted: it
 * governs whether an account contributes to frame 03's totals, and /goals
 * shows each pot's own balance rather than any total.
 */
export function goalsByHorizon(accounts) {
  const sections = { short: [], long: [] };
  for (const account of accounts) {
    if (account.goalHorizon && sections[account.goalHorizon]) {
      sections[account.goalHorizon].push(account);
    }
  }
  return sections;
}

/**
 * Mock monthly position for frame 05 (money-in, essential-spending —
 * build-spec.md section 6). Read from the same mock salary credit shown on
 * frame 01's transaction list (+£2,500.00), so the figure is consistent
 * across screens rather than a second, unrelated number. Provenance is
 * 'read': this is the participant's main bank and its own current-account
 * activity, seeded into the store at session start (src/state.js).
 */
export const MOCK_POSITION = {
  moneyIn: 2500,
  essentialSpending: 1860,
  // Frame 10's "how you'll save" range slider (monthly-low/monthly-high):
  // read from the instant saver's own deposit history. Values match the
  // range build-spec.md/Figma draws (£200 to £310) so the built screen
  // matches the reference.
  //
  // This used to cite frame 10's savings-interest-rate caption ("Read from
  // your instant saver") as naming the same source. It did not: there is no
  // AER anywhere in this file, and that rate is RATES.bankRate, a dated
  // constant anchored to the Bank of England Bank Rate. The caption was
  // wrong and is now shared.bankRateCaptionTemplate. These two figures ARE
  // read from the saver; the rate is not. See DECISIONS.md D34.
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
 * Frame 19's "We've already got" card: two figures with no other home in
 * build-spec.md section 6 (monthly income, regular outgoings and deposit
 * saved there are read straight from state — money-in, essential-spending,
 * saved-toward-deposit). Annual salary and existing credit commitments have
 * no section-6 variable of their own, so they're held here as their own
 * mock read-provenance source, the same treatment MOCK_POSITION gets.
 */
export const MOCK_MIP_DATA = {
  annualSalaryBeforeTax: 38000,
  creditCommitmentsMonthly: 41,
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
    if (account.group === 'unassigned') totals.unassigned += account.balance;
    else if (account.group === 'deposit') {
      // The deposit total is the sum of exactly what the "N of M selected"
      // row says is selected — same predicate, so the headline figure and
      // the count can never disagree. An account filed here that the flag
      // says cannot count (a holiday pot moved to "Toward my deposit" on
      // 03b) still shows in the group, and still does not add to the total,
      // the same way the current account's own caption already describes.
      if (isSelectedForDeposit(account)) totals.deposit += account.balance;
    }
    else if (account.group === 'emergency') totals.emergency += account.balance;
    else if (account.group === 'excluded') totals.notCounted += account.balance;
  }
  return totals;
}

/**
 * Is this account currently being counted toward the deposit?
 *
 * Three things have to hold, and each is a different question:
 *   - it is the kind of account that can count at all (the flag above),
 *   - the participant has it filed under "Toward your deposit" (03b moves
 *     this),
 *   - and it has not been deselected by the "Select all accounts" row.
 */
export function isSelectedForDeposit(account) {
  return account.countsTowardDeposit && account.group === 'deposit' && account.included;
}

/**
 * The accounts that make up `saved-toward-deposit`, in MOCK_ACCOUNTS order.
 *
 * THE LIST FORM OF THE SUM ABOVE, so any screen that shows a breakdown of the
 * deposit total shows exactly the set `groupTotals` added up. Both terms are
 * `groupTotals`' own: it skips `excludeFromTotal` for every group before it
 * reaches the deposit branch, then applies `isSelectedForDeposit` there. A
 * breakdown that re-writes either term by hand is a second copy of the rule,
 * and the two drift the moment one of them is edited - which is how frame 06
 * came to list every account filed under "Toward your deposit" whether it was
 * counted or not, and frame 32 to list a holiday pot the total ignored.
 *
 * Callers pass the `effectiveAccounts()` list, so a 03b move and a checkbox
 * are both already resolved by the time this filter runs.
 */
export function countedTowardDeposit(accounts) {
  return accounts.filter((account) => !account.excludeFromTotal && isSelectedForDeposit(account));
}

/**
 * Does a rendered account list contain any of the accounts a caption is about?
 *
 * THE GENERAL RULE A CAPTION UNDER A BREAKDOWN OBEYS (DECISIONS.md D141): a
 * caption, note or footnote that describes specific accounts renders only
 * while at least one of them is in the list it sits under. One id in `ids` is
 * the single-account case; several is a caption about a set, which survives
 * while any one of the set is listed.
 *
 * WHY A HELPER AND NOT AN INLINE `.some()` AT EACH SITE. The rule is the same
 * rule in every case, and the sites are far apart. Written out by hand it
 * reads as a special case about one account, which is what the Lifetime ISA
 * caption on frame 06 had been for as long as the caption existed - it
 * explained an account that unticking a box had just removed from the list
 * above it. Named here, the next caption of this kind is one call rather than
 * a decision.
 *
 * Pass the SAME list the screen rendered, not `effectiveAccounts()`: the
 * question is what the participant can see, not what exists.
 */
export function listContainsAny(accounts, ids) {
  return accounts.some((account) => ids.includes(account.id));
}

/**
 * Frame 03's "N of M selected" and the state of its three-state checkbox.
 *
 * M (`total`) is every account the flag says can count — it does not shrink
 * when a participant files one elsewhere, because the question the row asks
 * is "how many of your savings accounts are we counting", and an account
 * moved to the emergency fund is still one of your savings accounts. N
 * (`selected`) is how many of those are actually being counted right now.
 *
 * `checked` / `indeterminate` / neither map straight onto the checkbox's
 * three states. Both are false when M is 0, which cannot happen with the
 * current mock data but would otherwise make an empty set read as
 * "all selected".
 */
export function depositSelection(accounts) {
  const counting = accounts.filter((a) => a.countsTowardDeposit);
  const selected = counting.filter(isSelectedForDeposit).length;
  return {
    selected,
    total: counting.length,
    checked: counting.length > 0 && selected === counting.length,
    indeterminate: selected > 0 && selected < counting.length,
  };
}

/**
 * The state patch for tapping "Select all accounts".
 *
 * Selecting: every counting account is both marked included and filed under
 * "Toward your deposit", because "select all" has to be able to reach
 * N === M, and an account sitting under "Not sorted yet" is not being
 * counted however its included flag reads. This does override an earlier 03b
 * move — that is what the control says it does.
 *
 * Deselecting: only the included flags are cleared. Groups are left alone, so
 * a participant who deselects everything and changes their mind still has
 * their own filing intact rather than a flattened list.
 */
export function selectAllPatch(accounts, assignments, included, target) {
  const nextAssignments = { ...assignments };
  const nextIncluded = { ...included };
  for (const account of accounts) {
    if (!account.countsTowardDeposit) continue;
    nextIncluded[account.id] = target;
    if (target) nextAssignments[account.id] = 'deposit';
  }
  return { accountAssignments: nextAssignments, accountIncluded: nextIncluded };
}

/**
 * The state patch for tapping one account's own checkbox.
 *
 * The same two rules `selectAllPatch` applies, narrowed to a single account,
 * so the per-account control and the select-all control cannot drift apart:
 * ticking marks the account included AND files it under "Toward your
 * deposit", because an account sitting under "Not sorted yet" is not being
 * counted however its included flag reads; unticking clears the flag and
 * leaves the filing alone.
 *
 * Ticking an account the participant had filed under emergencies or
 * not-counted does move it — that is what "count this toward my deposit"
 * means, and it is the same behaviour the select-all row already has.
 */
export function toggleAccountPatch(account, assignments, included, target) {
  const nextIncluded = { ...included, [account.id]: target };
  const nextAssignments = { ...assignments };
  if (target) nextAssignments[account.id] = 'deposit';
  return { accountAssignments: nextAssignments, accountIncluded: nextIncluded };
}

/**
 * The three section 6 figures frame 03 owns, recomputed from the current
 * account state — `saved-toward-deposit`, `emergency-fund` and `unassigned`.
 *
 * Called on every change that can move a figure: selecting or deselecting
 * accounts on frame 03, and confirming a move on frame 03b, as well as once
 * at session start (src/state.js), so the figures in state always match what
 * the screen is showing.
 *
 * Provenance (DECISIONS.md D5). Untouched, these are 'read' - read straight
 * from account data. Once a participant has changed which accounts
 * count — by the select-all row or by a 03b move — the figures contain the
 * participant's own input, so they carry 'entered', and D5's propagation rule
 * carries that on to everything derived from them downstream. All three move
 * together rather than only the one whose total changed: a 03b move shifts a
 * balance from one of these totals to another, so the pair is entered input
 * either way, and tracking them separately would claim a precision the
 * participant's action does not have.
 */
export function accountFigures(state) {
  const accounts = effectiveAccounts(state.accountAssignments, state.accountIncluded);
  const totals = groupTotals(accounts);
  const provenance = state.accountSelectionEdited ? 'entered' : 'read';
  return {
    'saved-toward-deposit': { value: totals.deposit, provenance },
    'emergency-fund': { value: totals.emergency, provenance },
    unassigned: { value: totals.unassigned, provenance },
  };
}
