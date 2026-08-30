/**
 * Pure calculation functions for "Your first home". No DOM, no rendering, no
 * side effects — every function's output depends only on its arguments.
 *
 * `state` is a plain object keyed by the exact build-spec.md section 6 name
 * of each figure (e.g. `state['property-value']`, `state['deposit-pct']`),
 * each entry shaped `{ value, provenance }`. `deposit-pct` and every other
 * range-spread style fraction is stored as a fraction (0.10 for 10%), the
 * same convention as RATES.rangeSpread.
 *
 * Every function returns `{ value, provenance, error }`:
 *   - value: the computed figure, or null if it genuinely can't be computed
 *   - provenance: 'read' | 'derived' | 'estimated' | 'entered'
 *   - error: null, or a string code for one of the boundary states in
 *     build-spec.md section 2 marked "No frame drawn" — the model returns a
 *     typed result for these rather than throwing.
 *
 * Provenance propagates (build-spec.md section 6): a figure derived even
 * partly from an 'entered' input is itself provenance 'entered', not
 * 'derived' — it's no longer purely computed from account data.
 */

import { RATES, CHECKPOINT_FRACTION, LTV_RATE_BANDS_BY_DEPOSIT_PCT, SDLT } from './rates.js';

function combineProvenance(...results) {
  return results.some((r) => r.provenance === 'entered') ? 'entered' : 'derived';
}

function ok(value, provenance) {
  return { value, provenance, error: null };
}

function fail(error, provenance, value = null) {
  return { value, provenance, error };
}

// --- Deposit calculator ---------------------------------------------------

/**
 * deposit-target = property-value x deposit-pct
 *
 * build-spec.md section 2 marks a non-numeric, zero, or otherwise
 * implausible property-value as its own "error" variant of frame 09, with no
 * wireframe drawn for it. Validated here since every downstream figure in
 * this chain depends on it.
 */
export function depositTarget(state) {
  const propertyValue = state['property-value'];
  const depositPct = state['deposit-pct'];
  const provenance = combineProvenance(propertyValue, depositPct);

  if (typeof propertyValue.value !== 'number' || Number.isNaN(propertyValue.value)) {
    return fail('non-numeric', provenance);
  }
  if (!Number.isFinite(propertyValue.value) || propertyValue.value <= 0) {
    return fail('not-positive', provenance);
  }

  return ok(propertyValue.value * depositPct.value, provenance);
}

/**
 * Sum a price across a marginal band table. Each band is [from, to, rate] and
 * contributes only the portion of `price` that falls inside it, so no band
 * ever taxes the whole price.
 */
function bandedTax(price, bands) {
  return bands.reduce(
    (total, [from, to, rate]) => total + Math.max(0, Math.min(price, to) - from) * rate,
    0,
  );
}

/**
 * stamp-duty = SDLT on property-value at first-time buyer rates
 * (DECISIONS.md D70).
 *
 * NOT A PERCENTAGE OF THE PRICE, and not a discount on the standard figure.
 * Below `SDLT.ftbReliefLimit` the first-time buyer scale applies; ABOVE it the
 * relief is lost outright and the standard scale applies to the whole price.
 * The two are separate calculations with a genuine cliff between them - at
 * 500,000 the tax is 10,000 and at 500,001 it is 15,000, a 5,000 step for one
 * pound. That is the real rule, not an artefact of this implementation, and
 * frame 09's own banner is what explains it on screen.
 *
 * WORKED FIGURES (asserted in model.test.js so they cannot drift):
 *   300,000 -> 0          the whole price sits in the 0% band
 *   450,000 -> 7,500      5% of the 150,000 above 300,000; the seeded case
 *   500,000 -> 10,000     5% of the full 200,000 second band
 *   500,001 -> 15,000.05  relief lost: standard rates on the whole price
 *
 * THE FIRST-TIME BUYER ASSUMPTION IS THE PROTOTYPE'S, NOT THE PARTICIPANT'S.
 * Nothing asks whether they qualify - the app has no question that could - so
 * every figure this returns is an estimate on an assumption the copy has to
 * state wherever the figure appears. `/tracker`'s `stampDutyNoteTemplate` and
 * frame 30's assumption row both carry it.
 */
export function stampDuty(state) {
  const propertyValue = state['property-value'];
  const provenance = combineProvenance(propertyValue);

  if (typeof propertyValue.value !== 'number' || Number.isNaN(propertyValue.value)) {
    return fail('non-numeric', provenance);
  }
  if (!Number.isFinite(propertyValue.value) || propertyValue.value <= 0) {
    return fail('not-positive', provenance);
  }

  const bands = propertyValue.value > SDLT.ftbReliefLimit ? SDLT.standardBands : SDLT.ftbBands;
  return ok(bandedTax(propertyValue.value, bands), provenance);
}

/** Has first-time buyer relief been lost at this property value? Frame 09's banner reads this. */
export function ftbReliefLost(state) {
  const propertyValue = state['property-value'];
  if (typeof propertyValue.value !== 'number' || !Number.isFinite(propertyValue.value)) return false;
  return propertyValue.value > SDLT.ftbReliefLimit;
}

/**
 * combined-goal = deposit-target + stamp-duty (DECISIONS.md D70).
 *
 * THE AMOUNT THE PARTICIPANT HAS TO SAVE. `deposit-target` is kept as its own
 * figure and is NOT overwritten, because the two answer different questions and
 * five figures still need the first one:
 *
 *   deposit-target  what goes down against the property. `loan-amount`, `ltv`,
 *                   `borrow-low`/`borrow-high`, `max-property` and
 *                   `mipEstimatedLtv` all size the MORTGAGE, and stamp duty is
 *                   cash paid to HMRC at completion rather than money put down
 *                   against the property. A larger goal must not shrink the
 *                   loan, so none of those five reads this function.
 *   combined-goal   what has to be in the account. Everything about SAVING
 *                   reads this: `checkpointAmount`, `monthsToTarget`,
 *                   `monthlyAmountFromDate`, `gap`, and the tracker's own
 *                   progress and variant.
 *
 * Splitting them rather than redefining `deposit-target` is what keeps that
 * boundary enforceable: the five mortgage figures needed no edit at all, so
 * none of them could be missed.
 */
export function combinedGoal(state) {
  const target = depositTarget(state);
  const tax = stampDuty(state);
  const provenance = combineProvenance(target, tax);

  if (target.error) return fail(target.error, provenance);
  if (tax.error) return fail(tax.error, provenance);
  return ok(target.value + tax.value, provenance);
}

/** loan-amount = property-value - deposit-target */
export function loanAmount(state) {
  const propertyValue = state['property-value'];
  const target = depositTarget(state);
  const provenance = combineProvenance(propertyValue, target);

  if (target.error) return fail(target.error, provenance);
  return ok(propertyValue.value - target.value, provenance);
}

/** ltv = loan-amount / property-value */
export function ltv(state) {
  const propertyValue = state['property-value'];
  const loan = loanAmount(state);
  const provenance = combineProvenance(propertyValue, loan);

  if (loan.error) return fail(loan.error, provenance);
  return ok(loan.value / propertyValue.value, provenance);
}

/**
 * checkpoint-amount = CHECKPOINT_FRACTION (0.75) x COMBINED-GOAL
 * (DECISIONS.md D70, amending build-spec.md section 4's "0.75 x
 * deposit-target").
 *
 * IT MOVED TO THE COMBINED GOAL FOR THE PROGRESS BAR, not for its own sake.
 * `/tracker` draws the bar with `markerPct: CHECKPOINT_FRACTION * 100` - a
 * literal 75 - and fills it against the goal. Leaving the checkpoint on
 * `deposit-target` while the bar ran to the combined goal would have put the
 * marker at 64.3% of the track while the copy beside it said 75%, and the two
 * would have been describing different denominators. One denominator, both
 * true.
 *
 * WHAT IT COST: the checkpoint rises 33,750 to 39,375 on the seeded goal. The
 * skip-ahead control and the ready-to-check stage both follow it with no edit,
 * because both read the STORED `checkpoint-amount` rather than a figure of
 * their own (skip-ahead.js, D38's third amendment) - which is exactly the
 * property that made this change safe to make.
 */
export function checkpointAmount(state) {
  const goal = combinedGoal(state);
  if (goal.error) return fail(goal.error, goal.provenance);
  return ok(CHECKPOINT_FRACTION * goal.value, goal.provenance);
}

/**
 * gap-to-checkpoint (frames 15/16's "You're £X away..." / "£X to go" copy):
 * checkpoint-amount less saved-toward-deposit. Not a build-spec.md section 6
 * named figure (only `gap`, frame 21's shortfall against the full
 * deposit-target, is) — this is the same shape of calculation one checkpoint
 * short of it, needed so frame 15/16's tracker copy never subtracts two
 * model figures inline in a screen module.
 */
export function gapToCheckpoint(state) {
  const savedTowardDeposit = state['saved-toward-deposit'];
  // THE STORED KEY, NOT A LIVE DERIVATION, and for the reason D38's third
  // amendment already gave for `canSkipAhead()`: `/tracker` is the only caller,
  // its guard has already tested the STORED `checkpoint-amount`, and a figure
  // measured against a differently-sourced checkpoint can disagree with the
  // guard that let the screen draw. It did - see GAPS.md G62.
  //
  // Both inputs are stored, so nothing here is recomputed. The gap itself is
  // not a build-spec.md section 6 figure, which is why it is derived at all.
  const checkpoint = state['checkpoint-amount'];
  const provenance = combineProvenance(savedTowardDeposit, checkpoint);

  // Unreachable from `/tracker` BY CONSTRUCTION rather than by coincidence: the
  // screen redirects unless this key holds a number. Kept for a caller that
  // reads the gap without that guard in front of it.
  if (typeof checkpoint.value !== 'number') return fail('not-committed', provenance);
  return ok(checkpoint.value - savedTowardDeposit.value, provenance);
}

/**
 * gap (frame 21) = combined-goal - saved-toward-deposit (DECISIONS.md D70,
 * amending build-spec.md section 6's "deposit-target - saved-toward-deposit").
 *
 * A SAVING SHORTFALL, so it measures against what has to be saved. Frame 21
 * sits beside borrowing figures, and those stay on `deposit-target` - see
 * `combinedGoal` above for why the two must not be conflated.
 */
export function gap(state) {
  const savedTowardDeposit = state['saved-toward-deposit'];
  const goal = combinedGoal(state);
  const provenance = combineProvenance(savedTowardDeposit, goal);

  if (goal.error) return fail(goal.error, provenance);
  return ok(goal.value - savedTowardDeposit.value, provenance);
}

// --- Monthly position ------------------------------------------------------

/**
 * left-over = money-in - essential-spending, unless the participant has
 * typed a direct override (05 "entered" variant) — pass it as the
 * optional second argument.
 *
 * build-spec.md section 2 marks two conditions as the "error" variant of
 * frame 05, with no wireframe drawn for either:
 *   - the result is at or below zero
 *   - an entered override exceeds money-in (you can't have more left over
 *     than what came in)
 */
export function leftOver(state, entered) {
  const moneyIn = state['money-in'];
  const essentialSpending = state['essential-spending'];

  if (entered) {
    if (entered.value > moneyIn.value) {
      // Value kept (not null) so the screen can still show what the
      // participant typed while they correct it.
      return fail('exceeds-money-in', 'entered', entered.value);
    }
    if (entered.value <= 0) {
      return fail('not-positive', 'entered', entered.value);
    }
    return ok(entered.value, 'entered');
  }

  const provenance = combineProvenance(moneyIn, essentialSpending);
  const value = moneyIn.value - essentialSpending.value;
  if (value <= 0) {
    return fail('not-positive', provenance, value);
  }
  return ok(value, provenance);
}

// --- Range rule (DECISIONS.md D2) ------------------------------------------

/**
 * Every low/high pair in the model is the central value at 0.9 and 1.1
 * (DECISIONS.md D2). For any central > 0 this guarantees low < central <
 * high.
 */
export function rangeFromCentral(central, spread = RATES.rangeSpread) {
  return {
    low: central * (1 - spread),
    high: central * (1 + spread),
  };
}

/**
 * on-track-for: months-to-target expressed as a range, each end rounded UP
 * to a whole month (DECISIONS.md D2) — a participant should never be told
 * they're on track a fraction of a month early.
 */
export function onTrackFor(state) {
  const months = monthsToTarget(state);

  // BEYOND-WINDOW KEEPS ITS VALUE; THE OTHER THREE HAVE NONE TO KEEP.
  // `monthsToTarget` returns a months figure ALONGSIDE `beyond-window`
  // deliberately - the projection succeeded, it just landed past the 60-month
  // window - and this function used to discard it, so every caller saw an
  // error with a null value and could say nothing more than "no date". The
  // range is now derived and carried through `fail`'s third parameter, which
  // exists for exactly this (`leftOver`'s `exceeds-money-in` uses it the same
  // way). `non-numeric`, `unreachable` and `exceeds-left-over` all come back
  // from `monthsToTarget` with a null value, so there is nothing to propagate
  // and they are left as they were.
  if (months.error === 'beyond-window') {
    const beyond = rangeFromCentral(months.value);
    return fail(months.error, months.provenance, { low: Math.ceil(beyond.low), high: Math.ceil(beyond.high) });
  }
  if (months.error) return fail(months.error, months.provenance);

  const { low, high } = rangeFromCentral(months.value);
  return ok({ low: Math.ceil(low), high: Math.ceil(high) }, months.provenance);
}

// --- Savings projection (DECISIONS.md D4) -----------------------------------

/**
 * AER (Annual Equivalent Rate) is the annual rate that already accounts for
 * monthly compounding. The monthly rate that compounds to it over 12 months
 * solves (1 + monthlyRate)^12 = 1 + AER, so:
 *
 *   monthlyRate = (1 + AER)^(1/12) - 1
 *
 * This is NOT AER / 12 (a nominal rate), which would overstate growth over a
 * multi-year horizon (DECISIONS.md D4).
 */
export function monthlyRate(aer = RATES.bankRate) {
  return Math.pow(1 + aer, 1 / 12) - 1;
}

/**
 * Contributions are paid at the start of each month (build-spec.md section
 * 4), so this is a standard annuity-due future-value problem: the future
 * value after n months of a starting balance P0 plus a monthly payment PMT
 * at monthly rate r is
 *
 *   FV(n) = P0(1+r)^n + PMT(1+r)[(1+r)^n - 1] / r
 *
 * Solving FV(n) = target for n:
 *
 *   x = (1+r)^n = (target + PMT(1+r)/r) / (P0 + PMT(1+r)/r)
 *   n = ln(x) / ln(1+r)
 *
 * monthlyAmountFromDate() below solves the same equation for PMT given n,
 * and is its exact algebraic inverse.
 */
export function monthsToTarget(state) {
  const savedTowardDeposit = state['saved-toward-deposit'];
  const savingsRate = state['savings-rate'];
  const leftOverFigure = state['left-over'];
  // THE COMBINED GOAL, NOT `deposit-target` (DECISIONS.md D70). The stamp duty
  // has to be in the account too, so a projection to the deposit alone would
  // report a date the participant reaches with the tax still unsaved - and
  // would contradict the goal figure rendered directly above it on /tracker.
  const target = combinedGoal(state);
  const provenance = combineProvenance(savedTowardDeposit, savingsRate, target);

  if (target.error) return fail(target.error, provenance);
  if (savingsRate.value === 0) return fail('unreachable', provenance);
  // Guarded rather than compared bare: a null ceiling would read as 0 and
  // reject every positive savings-rate. left-over is seeded at session start
  // (src/state.js) so it is always present in the built app, but this stays
  // a pure function of whatever state it is handed.
  if (leftOverFigure && leftOverFigure.value !== null && savingsRate.value > leftOverFigure.value) {
    return fail('exceeds-left-over', provenance);
  }

  const r = monthlyRate();
  // A zero starting balance is a legitimate input (every account
  // deselected), so it is written out rather than left to null's arithmetic
  // coercion.
  const p0 = savedTowardDeposit.value ?? 0;
  const pmt = savingsRate.value;
  const goal = target.value;

  const annuityFactor = (pmt * (1 + r)) / r;
  const x = (goal + annuityFactor) / (p0 + annuityFactor);
  const months = Math.log(x) / Math.log(1 + r);

  if (months > 60) {
    return { value: months, provenance, error: 'beyond-window' };
  }
  return ok(months, provenance);
}

// --- Frame 12 growth chart / timing rows ------------------------------------

/**
 * Future value at a given month, for an arbitrary starting balance and
 * monthly contribution — the same annuity-due formula monthsToTarget() and
 * monthlyAmountFromDate() use, parameterised directly rather than read from
 * state, so frame 12's growth chart can plot a balance at each of several
 * points along the x-axis without threading a fabricated state object
 * through the model.
 */
export function balanceAtMonth({ startingBalance, monthlyAmount, months, aer = RATES.bankRate }) {
  const r = monthlyRate(aer);
  return startingBalance * Math.pow(1 + r, months) + (monthlyAmount * (1 + r) * (Math.pow(1 + r, months) - 1)) / r;
}

/**
 * Months to reach an arbitrary target amount, for an arbitrary starting
 * balance and monthly contribution — frame 12's three timing rows (one per
 * deposit-pct threshold: 5%, 10%, 15%) each need this against a different
 * target, and each at both ends of the monthly-low/monthly-high range, so
 * it's written to take plain numbers rather than a whole state object.
 * Returns Infinity (not an error object) when the target is genuinely
 * unreachable at a zero contribution and the starting balance doesn't
 * already cover it — the caller decides how to display that.
 */
export function monthsToReachAmount({ startingBalance, targetAmount, monthlyAmount, aer = RATES.bankRate }) {
  if (startingBalance >= targetAmount) return 0;
  if (monthlyAmount <= 0) return Infinity;

  const r = monthlyRate(aer);
  const annuityFactor = (monthlyAmount * (1 + r)) / r;
  const x = (targetAmount + annuityFactor) / (startingBalance + annuityFactor);
  return Math.log(x) / Math.log(1 + r);
}

// --- Loan-to-Value rate table (frames 13, 15, 16) --------------------------

/**
 * Looks up LTV_RATE_BANDS_BY_DEPOSIT_PCT for a given deposit %, falling back
 * to the nearest defined band if the exact key isn't present (defensive only
 * — every caller on frames 13/15/16 passes a DEPOSIT_PCT_OPTIONS value,
 * which is always an exact key).
 */
export function rateBandForDepositPct(depositPct) {
  const band = LTV_RATE_BANDS_BY_DEPOSIT_PCT[depositPct];
  if (band) return band;

  const keys = Object.keys(LTV_RATE_BANDS_BY_DEPOSIT_PCT).map(Number);
  const nearest = keys.reduce((best, k) => (Math.abs(k - depositPct) < Math.abs(best - depositPct) ? k : best));
  return LTV_RATE_BANDS_BY_DEPOSIT_PCT[nearest];
}

/**
 * Standard reducing-balance mortgage repayment: PMT = L * i / (1 - (1+i)^-n),
 * i the monthly rate (annualRate / 12 — mortgage rates are quoted and
 * applied monthly-in-arrears by market convention, unlike the savings AER
 * elsewhere in this model which compounds via monthlyRate()'s
 * (1+AER)^(1/12)-1 conversion; DECISIONS.md D4 governs savings growth only).
 */
export function monthlyMortgagePayment({ loanAmount, annualRate, termYears }) {
  const i = annualRate / 12;
  const n = termYears * 12;
  return (loanAmount * i) / (1 - Math.pow(1 + i, -n));
}

/** Total interest paid over the mortgage term = total repaid less the loan itself. */
export function totalMortgageInterest({ loanAmount, monthlyPayment, termYears }) {
  return monthlyPayment * termYears * 12 - loanAmount;
}

// --- Mortgage in Principle (frames 20, 21) ----------------------------------

/**
 * borrow-low / borrow-high (build-spec.md section 6): DECISIONS.md D2's
 * range rule applied to loan-amount as the central value (D2, confirmed 19
 * August 2026 — see DECISIONS.md).
 */
export function borrowRange(state) {
  const loan = loanAmount(state);
  if (loan.error) return fail(loan.error, loan.provenance);
  const { low, high } = rangeFromCentral(loan.value);
  return ok({ low, high }, loan.provenance);
}

/** max-property (build-spec.md section 4) = borrow-high + saved-toward-deposit. */
export function maxProperty(state) {
  const range = borrowRange(state);
  const savedTowardDeposit = state['saved-toward-deposit'];
  const provenance = combineProvenance(range, savedTowardDeposit);
  if (range.error) return fail(range.error, provenance);
  return ok(range.value.high + savedTowardDeposit.value, provenance);
}

/**
 * Frame 20's "Loan-to-Value: around 92%" row is not state['ltv'] (the
 * deposit calculator's own Loan-to-Value, fixed by the deposit-pct chosen on
 * frame 09) — it is the Loan-to-Value AT max-property, i.e. what borrowing
 * to the top of the indicative range against the largest affordable
 * property would imply: borrow-high / max-property. Not a build-spec.md
 * section 4 named figure (that section predates frame 20/21's own numbers),
 * but the only reading of "Loan-to-Value" on this screen consistent with
 * its own displayed max-property and borrowing-range figures.
 */
export function mipEstimatedLtv(state) {
  const range = borrowRange(state);
  const max = maxProperty(state);
  const provenance = combineProvenance(range, max);
  if (range.error) return fail(range.error, provenance);
  if (max.error) return fail(max.error, provenance);
  return ok(range.value.high / max.value, provenance);
}

/**
 * Frame 21's "What you'd need to borrow" row: the loan a participant would
 * need today, against their chosen property-value, given what they've
 * actually saved toward the deposit so far — distinct from state['loan-amount']
 * (which is sized against deposit-target, the amount they're aiming to have
 * saved, not saved-toward-deposit, what they've saved so far). Not a
 * build-spec.md section 4 named figure, for the same reason as
 * mipEstimatedLtv above.
 */
export function neededLoanAmount(state) {
  const propertyValue = state['property-value'];
  const savedTowardDeposit = state['saved-toward-deposit'];
  const provenance = combineProvenance(propertyValue, savedTowardDeposit);

  if (typeof propertyValue.value !== 'number' || Number.isNaN(propertyValue.value)) {
    return fail('non-numeric', provenance);
  }
  return ok(propertyValue.value - savedTowardDeposit.value, provenance);
}

/**
 * Exact inverse of monthsToTarget(): solves the same annuity-due equation
 * for the monthly payment PMT, given a fixed number of months.
 *
 *   PMT = (target - P0(1+r)^n) * r / [(1+r)((1+r)^n - 1)]
 *
 * `months` is a signed number of months from today to the participant's
 * chosen target date, computed by the caller from real calendar dates
 * before calling this pure function. A negative value means the target date
 * is in the past.
 */
export function monthlyAmountFromDate(state, months) {
  const savedTowardDeposit = state['saved-toward-deposit'];
  // The combined goal, for `monthsToTarget`'s reason above and because this
  // function must stay that one's exact algebraic inverse (D70).
  const target = combinedGoal(state);
  const provenance = combineProvenance(savedTowardDeposit, target);

  if (target.error) return fail(target.error, provenance);
  if (months < 0) return fail('in-the-past', provenance);

  const r = monthlyRate();
  // Same zero-starting-balance assumption as monthsToTarget above, so this
  // stays that function's exact algebraic inverse in general mode too.
  const p0 = savedTowardDeposit.value ?? 0;
  const goal = target.value;
  const growth = Math.pow(1 + r, months);

  const pmt = ((goal - p0 * growth) * r) / ((1 + r) * (growth - 1));
  return ok(pmt, provenance);
}
