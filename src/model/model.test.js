import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  depositTarget,
  loanAmount,
  ltv,
  checkpointAmount,
  leftOver,
  rangeFromCentral,
  onTrackFor,
  monthsToTarget,
  monthlyAmountFromDate,
  gap,
} from './model.js';

// Helpers for building state entries — every key is the exact build-spec.md
// section 6 name.
const read = (value) => ({ value, provenance: 'read' });
const entered = (value) => ({ value, provenance: 'entered' });
const derived = (value) => ({ value, provenance: 'derived' });

describe('worked examples — build-spec.md section 4', () => {
  test('deposit-target: 190,000 at 10% gives 19,000', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
    };
    const result = depositTarget(state);
    assert.equal(result.error, null);
    assert.equal(result.value, 19000);
    assert.equal(result.provenance, 'entered');
  });

  test('checkpoint-amount: 14,250 is 0.75 x 19,000', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
    };
    const result = checkpointAmount(state);
    assert.equal(result.error, null);
    assert.equal(result.value, 14250);
  });

  test('gap on frame 21: 4,400, from 19,000 deposit-target less 14,600 saved', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(14600),
    };
    const result = gap(state);
    assert.equal(result.error, null);
    assert.equal(result.value, 4400);
  });

  test('loan-amount and ltv follow from property-value and deposit-target', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
    };
    const loan = loanAmount(state);
    assert.equal(loan.error, null);
    assert.equal(loan.value, 171000);

    const value = ltv(state);
    assert.equal(value.error, null);
    assert.equal(value.value, 0.9);
  });
});

describe('range rule — DECISIONS.md D2', () => {
  test('every low/high pair is the central value at 0.9 and 1.1', () => {
    const { low, high } = rangeFromCentral(1000);
    assert.equal(low, 900);
    assert.equal(high, 1100);
  });

  test('low is always below high, and both bracket the central value', () => {
    for (const central of [1, 100, 4400, 19000, 171000, 0.9]) {
      const { low, high } = rangeFromCentral(central);
      assert.ok(low < high, `low (${low}) should be below high (${high})`);
      assert.ok(low < central, `low (${low}) should bracket central (${central})`);
      assert.ok(central < high, `high (${high}) should bracket central (${central})`);
    }
  });

  test('on-track-for rounds both ends up to a whole month', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
      'savings-rate': entered(250),
      'left-over': derived(380),
    };
    const months = monthsToTarget(state);
    assert.equal(months.error, null);
    assert.ok(!Number.isInteger(months.value), 'test fixture should produce a fractional month count');

    const result = onTrackFor(state);
    assert.equal(result.error, null);
    assert.equal(result.value.low, Math.ceil(months.value * 0.9));
    assert.equal(result.value.high, Math.ceil(months.value * 1.1));
    assert.ok(result.value.low < result.value.high);
    assert.ok(Number.isInteger(result.value.low));
    assert.ok(Number.isInteger(result.value.high));
  });
});

describe('boundary states — build-spec.md section 2, "No frame drawn"', () => {
  test('left-over at or below zero returns a typed result, not a throw', () => {
    const state = {
      'money-in': read(1860),
      'essential-spending': read(1860),
    };
    const result = leftOver(state);
    assert.equal(result.value, 0);
    assert.equal(result.error, 'not-positive');
  });

  test('left-over below zero also returns not-positive', () => {
    const state = {
      'money-in': read(1000),
      'essential-spending': read(1200),
    };
    const result = leftOver(state);
    assert.equal(result.value, -200);
    assert.equal(result.error, 'not-positive');
  });

  test('an entered value above money-in returns a typed result', () => {
    const state = {
      'money-in': read(2240),
      'essential-spending': read(1860),
    };
    const result = leftOver(state, entered(3000));
    assert.equal(result.error, 'exceeds-money-in');
    assert.equal(result.provenance, 'entered');
  });

  test('savings-rate above left-over returns a typed result', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
      'savings-rate': entered(400),
      'left-over': derived(380),
    };
    const result = monthsToTarget(state);
    assert.equal(result.value, null);
    assert.equal(result.error, 'exceeds-left-over');
  });

  test('savings-rate of zero returns unreachable', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
      'savings-rate': entered(0),
      'left-over': derived(380),
    };
    const result = monthsToTarget(state);
    assert.equal(result.value, null);
    assert.equal(result.error, 'unreachable');
  });

  test('a target date in the past returns a typed result', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
    };
    const result = monthlyAmountFromDate(state, -3);
    assert.equal(result.value, null);
    assert.equal(result.error, 'in-the-past');
  });

  test('months-to-target above 60 is flagged but still returns a value', () => {
    const state = {
      'property-value': entered(500000),
      'deposit-pct': entered(0.25),
      'saved-toward-deposit': read(1000),
      'savings-rate': entered(50),
      'left-over': derived(1000),
    };
    const result = monthsToTarget(state);
    assert.equal(result.error, 'beyond-window');
    assert.ok(result.value > 60, `expected > 60 months, got ${result.value}`);
  });

  test('a non-numeric property-value returns a typed result', () => {
    const state = {
      'property-value': entered(NaN),
      'deposit-pct': entered(0.10),
    };
    const result = depositTarget(state);
    assert.equal(result.value, null);
    assert.equal(result.error, 'non-numeric');
  });

  test('a zero or implausible (non-positive) property-value returns a typed result', () => {
    const state = {
      'property-value': entered(0),
      'deposit-pct': entered(0.10),
    };
    const result = depositTarget(state);
    assert.equal(result.value, null);
    assert.equal(result.error, 'not-positive');
  });

  test('errors propagate: loan-amount and ltv inherit a bad property-value', () => {
    const state = {
      'property-value': entered(-5),
      'deposit-pct': entered(0.10),
    };
    assert.equal(loanAmount(state).error, 'not-positive');
    assert.equal(ltv(state).error, 'not-positive');
    assert.equal(checkpointAmount(state).error, 'not-positive');
  });
});

describe('savings projection round trip — DECISIONS.md D4', () => {
  test('solving a monthly amount from a target date is the exact inverse of solving months from a monthly amount', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
      'savings-rate': entered(250),
      'left-over': derived(380),
    };

    const months = monthsToTarget(state);
    assert.equal(months.error, null);

    const impliedRate = monthlyAmountFromDate(state, months.value);
    assert.equal(impliedRate.error, null);
    assert.ok(
      Math.abs(impliedRate.value - state['savings-rate'].value) < 1e-6,
      `expected ${state['savings-rate'].value}, got ${impliedRate.value}`,
    );
  });

  test('round trip holds the other way: months solved from the implied rate matches the original months', () => {
    const targetMonths = 30;
    const state = {
      'property-value': entered(190000),
      'deposit-pct': entered(0.10),
      'saved-toward-deposit': read(8950),
      'left-over': derived(500),
    };

    const impliedRate = monthlyAmountFromDate(state, targetMonths);
    assert.equal(impliedRate.error, null);

    const roundTripState = { ...state, 'savings-rate': derived(impliedRate.value) };
    const months = monthsToTarget(roundTripState);
    assert.equal(months.error, null);
    assert.ok(
      Math.abs(months.value - targetMonths) < 1e-6,
      `expected ${targetMonths}, got ${months.value}`,
    );
  });
});

describe('provenance propagation — build-spec.md section 6', () => {
  test('a figure derived purely from read/derived inputs is itself derived', () => {
    const state = {
      'property-value': read(190000),
      'deposit-pct': derived(0.10),
    };
    assert.equal(depositTarget(state).provenance, 'derived');
  });

  test('a figure derived even partly from an entered input is itself entered', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': derived(0.10),
    };
    assert.equal(depositTarget(state).provenance, 'entered');
  });

  test('provenance keeps propagating through the loan-amount / ltv chain', () => {
    const state = {
      'property-value': entered(190000),
      'deposit-pct': read(0.10),
    };
    assert.equal(loanAmount(state).provenance, 'entered');
    assert.equal(ltv(state).provenance, 'entered');
    assert.equal(checkpointAmount(state).provenance, 'entered');
  });
});
