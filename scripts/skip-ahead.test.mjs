/**
 * The skip-ahead control (src/skip-ahead.js, DECISIONS.md D38).
 *
 * The control's whole claim is that a participant can move to the later
 * position and back as many times as they like, and that the starting position
 * returns EXACTLY as it was. That is a claim about state, so it is asserted
 * against state rather than by looking at screenshots: a drift of one rounding
 * step per round trip would be invisible on screen and fatal to a session.
 *
 * Pure Node - no browser, no Playwright. `src/skip-ahead.js` and the model it
 * calls are side-effect-free ES modules, so they can be imported and driven
 * directly.
 *
 * Run: node --test scripts/skip-ahead.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canSkipAhead,
  isSkippedAhead,
  skipAheadPatch,
  skipBackPatch,
  startingSavedTowardDeposit,
  accountFiguresPatch,
} from '../src/skip-ahead.js';
import { CHECKPOINT_FRACTION } from '../src/model/rates.js';
import { monthsToTarget, onTrackFor, maxProperty } from '../src/model/model.js';

const f = (value, provenance = 'read') => ({ value, provenance });
const unset = () => ({ value: null, provenance: null });

/**
 * A session that has set a goal and is saving toward it - the state the
 * control is actually used from. Deliberately BELOW the checkpoint
 * (11,350 against a 31,500 checkpoint) so "Further along" has somewhere to go
 * and the tracker starts locked.
 */
function savingSession(overrides = {}) {
  return {
    'money-in': f(2240),
    'essential-spending': f(1860),
    'left-over': f(380, 'derived'),
    'saved-toward-deposit': f(11350),
    'emergency-fund': f(5600),
    unassigned: f(2400),
    'property-value': f(420000, 'entered'),
    'deposit-pct': f(0.1, 'entered'),
    'deposit-target': f(42000, 'entered'),
    'loan-amount': f(378000, 'entered'),
    ltv: f(0.9, 'entered'),
    'monthly-low': f(200, 'estimated'),
    'monthly-high': f(310, 'estimated'),
    'savings-rate': f(310, 'entered'),
    'months-to-target': f(84.2, 'entered'),
    'on-track-for': f({ low: 76, high: 93 }, 'entered'),
    // DERIVED, NOT WRITTEN DOWN. `skipAheadPatch()` reads this stored key rather
    // than re-deriving the checkpoint (D38's third amendment), so a hard-coded
    // 31500 here would let a change to CHECKPOINT_FRACTION break the two tests
    // below instead of being followed by them. Deriving it keeps those tests
    // what their comments say they are: assertions that no number is written
    // down, not assertions about 31500.
    'checkpoint-amount': f(CHECKPOINT_FRACTION * 42000, 'entered'),
    'borrow-low': unset(),
    'borrow-high': unset(),
    'max-property': unset(),
    goal: 'house',
    accountAssignments: {},
    accountIncluded: {},
    accountSelectionEdited: false,
    targetMonth: 6,
    targetYear: 2028,
    skippedAhead: false,
    skipAheadStash: null,
    ...overrides,
  };
}

/** What a participant put in, and what must survive the control untouched. */
const PARTICIPANT_ENTERED = [
  'property-value',
  'deposit-pct',
  'deposit-target',
  'savings-rate',
  'monthly-low',
  'monthly-high',
];

const apply = (state, patch) => ({ ...state, ...patch });

test('the later position is CHECKPOINT_FRACTION of the goal, and nothing else', () => {
  const state = savingSession();
  const ahead = apply(state, skipAheadPatch(state));

  assert.equal(
    ahead['saved-toward-deposit'].value,
    CHECKPOINT_FRACTION * state['deposit-target'].value
  );
  // The threshold the tracker unlocks at is the same arithmetic from the same
  // input, so landing on it is an equality rather than a near miss.
  assert.ok(ahead['saved-toward-deposit'].value >= state['checkpoint-amount'].value);
  assert.ok(ahead['saved-toward-deposit'].value < state['deposit-target'].value);
});

test('the starting position is below the checkpoint, so the control has somewhere to go', () => {
  const state = savingSession();
  assert.ok(state['saved-toward-deposit'].value < state['checkpoint-amount'].value);
});

test('three round trips leave the state identical, every time', () => {
  const start = savingSession();
  let state = start;

  for (let trip = 1; trip <= 3; trip += 1) {
    state = apply(state, skipAheadPatch(state));
    assert.equal(isSkippedAhead(state), true, `trip ${trip}: did not reach the later position`);

    state = apply(state, skipBackPatch(state));
    assert.equal(isSkippedAhead(state), false, `trip ${trip}: did not return`);
    assert.deepEqual(state, start, `trip ${trip}: state drifted`);
  }
});

test('nothing the participant entered moves in either direction', () => {
  const start = savingSession();
  const ahead = apply(start, skipAheadPatch(start));
  const back = apply(ahead, skipBackPatch(ahead));

  for (const key of PARTICIPANT_ENTERED) {
    assert.deepEqual(ahead[key], start[key], `${key} changed on the way out`);
    assert.deepEqual(back[key], start[key], `${key} changed on the way back`);
  }
  // The goal itself, the target date and the account filing are not figures,
  // and are checked separately for the same reason.
  assert.equal(ahead.goal, start.goal);
  assert.equal(ahead.targetMonth, start.targetMonth);
  assert.equal(ahead.targetYear, start.targetYear);
  assert.deepEqual(ahead.accountAssignments, start.accountAssignments);
  assert.deepEqual(ahead.accountIncluded, start.accountIncluded);
});

test('the stored derived figures are recomputed from the later position', () => {
  const start = savingSession();
  const ahead = apply(start, skipAheadPatch(start));

  const expectedMonths = monthsToTarget(ahead);
  const expectedOnTrack = onTrackFor(ahead);

  assert.equal(ahead['months-to-target'].value, expectedMonths.value);
  assert.deepEqual(ahead['on-track-for'].value, expectedOnTrack.value);
  // Closer to the goal means fewer months. If this ever fails the figure has
  // stopped following the position it is meant to describe.
  assert.ok(ahead['months-to-target'].value < start['months-to-target'].value);
});

test('a figure the participant has not reached yet stays unset in both positions', () => {
  const start = savingSession();
  const ahead = apply(start, skipAheadPatch(start));

  // max-property is committed by /mip/running, which this session has not
  // reached. Skipping ahead must not conjure it onto a screen behind them.
  assert.equal(ahead['max-property'].value, null);
  assert.equal(ahead['max-property'].provenance, null);
});

test('max-property IS recomputed once the check has run', () => {
  const start = savingSession({
    'borrow-low': f(340200, 'estimated'),
    'borrow-high': f(415800, 'estimated'),
    'max-property': f(427150, 'estimated'),
  });
  const ahead = apply(start, skipAheadPatch(start));

  assert.equal(ahead['max-property'].value, maxProperty(ahead).value);
  assert.ok(ahead['max-property'].value > start['max-property'].value);

  const back = apply(ahead, skipBackPatch(ahead));
  assert.deepEqual(back['max-property'], start['max-property']);
});

test('an account change made at the later position survives the move back', () => {
  const start = savingSession();
  let state = apply(start, skipAheadPatch(start));
  const skippedFigure = state['saved-toward-deposit'].value;

  // What frame 03 or frame 06 would recompute after the participant deselects
  // an account: a smaller deposit total, now carrying 'entered' (D5).
  const recomputed = {
    'saved-toward-deposit': f(8600, 'entered'),
    'emergency-fund': f(5600, 'entered'),
    unassigned: f(2400, 'entered'),
  };
  state = apply(state, accountFiguresPatch(state, recomputed));

  // The position on screen did not move, and its caption followed the
  // position it stands in for.
  assert.equal(state['saved-toward-deposit'].value, skippedFigure);
  assert.equal(state['saved-toward-deposit'].provenance, 'entered');
  // The figures that are not part of the savings position were written live.
  assert.deepEqual(state['emergency-fund'], recomputed['emergency-fund']);
  assert.deepEqual(state.unassigned, recomputed.unassigned);
  // And the starting position now holds the participant's edit.
  assert.deepEqual(startingSavedTowardDeposit(state), recomputed['saved-toward-deposit']);

  const back = apply(state, skipBackPatch(state));
  assert.deepEqual(back['saved-toward-deposit'], recomputed['saved-toward-deposit']);
  assert.equal(back.skippedAhead, false);
  assert.equal(back.skipAheadStash, null);
});

test('at "Now" the account figures are written straight through, unchanged', () => {
  const state = savingSession();
  const figures = {
    'saved-toward-deposit': f(8600, 'entered'),
    'emergency-fund': f(5600, 'entered'),
    unassigned: f(2400, 'entered'),
  };
  assert.deepEqual(accountFiguresPatch(state, figures), figures);
  assert.deepEqual(startingSavedTowardDeposit(state), state['saved-toward-deposit']);
});

test('there is nothing to skip to before a deposit goal exists', () => {
  const state = savingSession({
    'property-value': unset(),
    'deposit-pct': unset(),
    'deposit-target': unset(),
    'checkpoint-amount': unset(),
  });

  assert.equal(canSkipAhead(state), false);
  assert.equal(skipAheadPatch(state), null);
});

test('moving the checkpoint fraction moves the control with it', () => {
  // Not a test of a number - a test that no number is written down. The later
  // position is asserted as a multiple of whatever CHECKPOINT_FRACTION says,
  // so a change in rates.js cannot leave this control behind.
  const state = savingSession();
  const ahead = apply(state, skipAheadPatch(state));
  const fraction = ahead['saved-toward-deposit'].value / state['deposit-target'].value;
  assert.equal(fraction, CHECKPOINT_FRACTION);
});
