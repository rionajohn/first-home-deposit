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

import { RATES } from './rates.js';

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

/** checkpoint-amount = 0.75 x deposit-target */
export function checkpointAmount(state) {
  const target = depositTarget(state);
  if (target.error) return fail(target.error, target.provenance);
  return ok(0.75 * target.value, target.provenance);
}

/** gap (frame 21) = deposit-target - saved-toward-deposit */
export function gap(state) {
  const savedTowardDeposit = state['saved-toward-deposit'];
  const target = depositTarget(state);
  const provenance = combineProvenance(savedTowardDeposit, target);

  if (target.error) return fail(target.error, provenance);
  return ok(target.value - savedTowardDeposit.value, provenance);
}

// --- Monthly position ------------------------------------------------------

/**
 * left-over = money-in - essential-spending, unless the participant has
 * typed a direct override (05/05b "entered" variant) — pass it as the
 * optional second argument.
 *
 * build-spec.md section 2 marks two conditions as the "error" variant of
 * frame 05/05b, with no wireframe drawn for either:
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
  const target = depositTarget(state);
  const provenance = combineProvenance(savedTowardDeposit, savingsRate, target);

  if (target.error) return fail(target.error, provenance);
  if (savingsRate.value === 0) return fail('unreachable', provenance);
  if (leftOverFigure && savingsRate.value > leftOverFigure.value) {
    return fail('exceeds-left-over', provenance);
  }

  const r = monthlyRate();
  const p0 = savedTowardDeposit.value;
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

// --- General mode (frame 04) -----------------------------------------------

/**
 * annual = monthly x 12, no interest (build-spec.md section 2, frame 04
 * "default range" row) — deliberately simpler than the compounding model
 * used everywhere else, since general mode has no saved-toward-deposit
 * starting balance to compound. Provenance propagates from the monthly
 * figures: 'entered' if either was typed/dragged by the participant,
 * otherwise 'estimated' (a published average, not read from an account).
 */
export function generalAnnualRange(monthlyLow, monthlyHigh) {
  const provenance = monthlyLow.provenance === 'entered' || monthlyHigh.provenance === 'entered'
    ? 'entered'
    : 'estimated';
  return ok({ low: monthlyLow.value * 12, high: monthlyHigh.value * 12 }, provenance);
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
  const target = depositTarget(state);
  const provenance = combineProvenance(savedTowardDeposit, target);

  if (target.error) return fail(target.error, provenance);
  if (months < 0) return fail('in-the-past', provenance);

  const r = monthlyRate();
  const p0 = savedTowardDeposit.value;
  const goal = target.value;
  const growth = Math.pow(1 + r, months);

  const pmt = ((goal - p0 * growth) * r) / ((1 + r) * (growth - 1));
  return ok(pmt, provenance);
}
