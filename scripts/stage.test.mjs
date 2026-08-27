/**
 * Frame 33's Journey stage control (src/stage.js, DECISIONS.md D45).
 *
 * The control's claims are claims about STATE, so they are asserted against
 * state rather than by looking at screenshots. Three of them would be invisible
 * on screen and fatal in a session:
 *
 *   - a stage change is idempotent IN BOTH DIRECTIONS, so a facilitator can
 *     move between stages between participants without residue;
 *   - "Ready to check" is the SAME goal as "Saving", seen later, rather than a
 *     second goal that happens to sit past its own checkpoint;
 *   - no derived figure is written by hand, so a change to the Bank Rate, to
 *     CHECKPOINT_FRACTION or to the mock accounts moves the stages with it.
 *
 * Pure Node - no browser, no Playwright. `src/stage.js` and everything it
 * imports are side-effect-free ES modules once `state.js`'s own sessionStorage
 * read has fallen through to its catch, which it does under Node.
 *
 * Run: node --test scripts/stage.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { stagePatch, STAGES, STAGE_PROPERTY_VALUE, STAGE_DEPOSIT_PCT } from '../src/stage.js';
import { defaultState } from '../src/state.js';
import { skipAheadPatch, skipBackPatch, isSkippedAhead } from '../src/skip-ahead.js';
import { CHECKPOINT_FRACTION, CHART_WINDOW_MONTHS } from '../src/model/rates.js';
import { depositTarget, monthsToTarget, onTrackFor, checkpointAmount } from '../src/model/model.js';

/** What `settings.js` does on a tap: the stage value plus the stage's patch. */
const select = (state, stage) => ({ ...state, stage, ...stagePatch(stage) });

/** The two figures every guard in the app tests before it lets a screen draw. */
const hasGoal = (state) =>
  state['checkpoint-amount'].value !== null && state['deposit-target'].value !== null;

test('the three stages are exactly the three options frame 33 draws', () => {
  assert.deepEqual(STAGES, ['setting-up', 'saving', 'ready-to-check']);
});

// ---------------------------------------------------------------------------
// Setting up
// ---------------------------------------------------------------------------

test('"Setting up" is the empty state, unchanged', () => {
  const fresh = defaultState();
  const settingUp = select(fresh, 'setting-up');

  // `stage` itself is the one key that moves, and it moves to the value the
  // control was already at.
  assert.deepEqual(settingUp, { ...fresh, stage: 'setting-up' });
  assert.equal(hasGoal(settingUp), false);
});

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

test('"Saving" gives the tracker the two figures its guard tests', () => {
  const saving = select(defaultState(), 'saving');
  assert.equal(hasGoal(saving), true);
});

test('"Saving" leaves the savings position below the checkpoint', () => {
  const saving = select(defaultState(), 'saving');
  // Frame 15, not frame 16: the tracker renders locked and the Mortgage in
  // Principle milestone is the one thing still out of reach.
  assert.ok(saving['saved-toward-deposit'].value < saving['checkpoint-amount'].value);
  assert.ok(saving['saved-toward-deposit'].value < saving['deposit-target'].value);
});

test('"Saving" lands months-to-target inside the projection window', () => {
  const saving = select(defaultState(), 'saving');

  // NOT AN ASSERTION ABOUT 49.3 MONTHS. Above the window `monthsToTarget()`
  // returns the `beyond-window` error and `onTrackFor()` has no range to give,
  // so the tracker's "On track for" row falls to a boundary variant instead of
  // the ordinary screen this stage exists to demonstrate. This asserts the
  // property the property value was chosen for.
  assert.ok(saving['months-to-target'].value <= CHART_WINDOW_MONTHS);
  assert.equal(monthsToTarget(saving).error, null);

  const onTrack = saving['on-track-for'].value;
  assert.equal(typeof onTrack.low, 'number');
  assert.equal(typeof onTrack.high, 'number');
  assert.ok(onTrack.low < onTrack.high);
});

test('every derived figure matches what the model returns for the same state', () => {
  const saving = select(defaultState(), 'saving');

  // Nothing is written by hand: each stored figure is re-derived here through
  // the same function the screen that commits it calls, and compared.
  assert.deepEqual(saving['deposit-target'].value, depositTarget(saving).value);
  assert.deepEqual(saving['checkpoint-amount'].value, checkpointAmount(saving).value);
  assert.deepEqual(saving['months-to-target'].value, monthsToTarget(saving).value);
  assert.deepEqual(saving['on-track-for'].value, onTrackFor(saving).value);

  // deposit-target = property-value x deposit-pct, and the checkpoint is
  // CHECKPOINT_FRACTION of it - both as ratios, so a change in rates.js moves
  // the stage rather than breaking this.
  assert.equal(saving['deposit-target'].value, STAGE_PROPERTY_VALUE * STAGE_DEPOSIT_PCT);
  assert.equal(
    saving['checkpoint-amount'].value,
    CHECKPOINT_FRACTION * saving['deposit-target'].value
  );
  assert.equal(saving['loan-amount'].value, STAGE_PROPERTY_VALUE - saving['deposit-target'].value);
  assert.equal(saving.ltv.value, saving['loan-amount'].value / STAGE_PROPERTY_VALUE);
});

test('the entered figures carry entered provenance, and so does what follows from them', () => {
  const saving = select(defaultState(), 'saving');

  assert.equal(saving['property-value'].provenance, 'entered');
  assert.equal(saving['deposit-pct'].provenance, 'entered');
  // DECISIONS.md D5: a figure derived even partly from an entered input is
  // itself 'entered'. deposit-target and checkpoint-amount are not 'derived'.
  assert.equal(saving['deposit-target'].provenance, 'entered');
  assert.equal(saving['checkpoint-amount'].provenance, 'entered');
  assert.equal(saving['loan-amount'].provenance, 'entered');
  assert.equal(saving.ltv.provenance, 'entered');
  assert.equal(saving['months-to-target'].provenance, 'entered');
  assert.equal(saving['on-track-for'].provenance, 'entered');

  // The monthly range was seeded from the accounts and left alone, so it is
  // read, and so is the midpoint the screen takes of it.
  assert.equal(saving['monthly-low'].provenance, 'read');
  assert.equal(saving['monthly-high'].provenance, 'read');
  assert.equal(saving['savings-rate'].provenance, 'read');
});

test('"Saving" leaves the Mortgage in Principle flow locked', () => {
  const saving = select(defaultState(), 'saving');
  // The tracker's own "Check my Mortgage in Principle" control unlocks it, and
  // that tap is part of the demonstration rather than something to skip.
  assert.equal(saving.mipUnlocked, false);
  assert.equal(saving.checkRunAt, null);
  assert.equal(saving.softSearchRecorded, false);
  assert.equal(saving['borrow-high'].value, null);
  assert.equal(saving['max-property'].value, null);
});

test('"Saving" does not bake in anything read from the browser or the clock', () => {
  const fresh = defaultState();
  const saving = select(fresh, 'saving');

  // Written from window.history.length on a click (D30/D32), so they cannot be
  // reconstructed from a patch and are left alone.
  assert.equal(saving.journeyEntryPoint, fresh.journeyEntryPoint);
  assert.equal(saving.flowEntryHistoryLength, fresh.flowEntryHistoryLength);
  assert.equal(saving.journeyStarted, fresh.journeyStarted);
  // Frame 10 seeds these from today's date on its own first render.
  assert.equal(saving.targetMonth, fresh.targetMonth);
  assert.equal(saving.targetYear, fresh.targetYear);
});

test('one control does not move another frame 33 control', () => {
  const start = { ...defaultState(), theme: 'brand', textSize: 'large', resultOutcome: 'not-yet' };
  for (const stage of STAGES) {
    const next = select(start, stage);
    assert.equal(next.theme, 'brand', stage);
    assert.equal(next.textSize, 'large', stage);
    assert.equal(next.resultOutcome, 'not-yet', stage);
  }
});

// ---------------------------------------------------------------------------
// Ready to check
// ---------------------------------------------------------------------------

test('"Ready to check" is the saving stage with the skip-ahead patch applied', () => {
  const saving = select(defaultState(), 'saving');
  const readyToCheck = select(defaultState(), 'ready-to-check');

  // Composed, not separately constructed: applying the control's own patch to
  // the saving stage must produce the ready-to-check stage exactly.
  assert.deepEqual(readyToCheck, { ...saving, stage: 'ready-to-check', ...skipAheadPatch(saving) });
  assert.equal(isSkippedAhead(readyToCheck), true);
});

test('"Ready to check" is the SAME goal as "Saving", seen later', () => {
  const saving = select(defaultState(), 'saving');
  const readyToCheck = select(defaultState(), 'ready-to-check');

  // A different journey would be a different participant. Every figure that
  // describes the goal itself is identical between the two stages; only the
  // position within it moves.
  for (const key of ['property-value', 'deposit-pct', 'deposit-target', 'loan-amount', 'ltv',
    'monthly-low', 'monthly-high', 'savings-rate', 'checkpoint-amount']) {
    assert.deepEqual(readyToCheck[key], saving[key], key);
  }
  assert.ok(readyToCheck['saved-toward-deposit'].value > saving['saved-toward-deposit'].value);
});

test('"Ready to check" reaches the checkpoint exactly, and by construction', () => {
  const readyToCheck = select(defaultState(), 'ready-to-check');

  assert.equal(
    readyToCheck['saved-toward-deposit'].value,
    readyToCheck['checkpoint-amount'].value
  );
  // Same arithmetic from the same input as the tracker's own unlock test, so
  // this is an equality rather than a near miss - and it is stated as a ratio,
  // so CHECKPOINT_FRACTION can move without a number here going stale.
  assert.equal(
    readyToCheck['saved-toward-deposit'].value,
    CHECKPOINT_FRACTION * readyToCheck['deposit-target'].value
  );
  assert.ok(readyToCheck['saved-toward-deposit'].value < readyToCheck['deposit-target'].value);
});

test('"Ready to check" recomputes the stored projection from the later position', () => {
  const readyToCheck = select(defaultState(), 'ready-to-check');
  const saving = select(defaultState(), 'saving');

  assert.equal(readyToCheck['months-to-target'].value, monthsToTarget(readyToCheck).value);
  assert.deepEqual(readyToCheck['on-track-for'].value, onTrackFor(readyToCheck).value);
  assert.ok(readyToCheck['months-to-target'].value < saving['months-to-target'].value);
  assert.equal(monthsToTarget(readyToCheck).error, null);
});

// ---------------------------------------------------------------------------
// The round trip, in both directions
// ---------------------------------------------------------------------------

test('three round trips through all three stages leave state identical, every time', () => {
  const start = defaultState();
  let state = start;

  for (let trip = 1; trip <= 3; trip += 1) {
    for (const stage of STAGES) {
      const once = select(state, stage);
      const twice = select(once, stage);
      // Idempotent: selecting the stage you are already on changes nothing.
      assert.deepEqual(twice, once, `trip ${trip}: ${stage} was not idempotent`);
      state = once;
    }
    // ...and back down the other way.
    for (const stage of [...STAGES].reverse()) {
      state = select(state, stage);
    }
    assert.deepEqual(state, { ...start, stage: 'setting-up' }, `trip ${trip}: state drifted`);
  }
});

test('every stage is reachable from every other, with nothing left behind', () => {
  for (const from of STAGES) {
    for (const to of STAGES) {
      const viaFrom = select(select(defaultState(), from), to);
      const direct = select(defaultState(), to);
      assert.deepEqual(viaFrom, direct, `${from} -> ${to} did not match ${to} set directly`);
    }
  }
});

test('a stage change clears what a run through the Mortgage in Principle flow left', () => {
  // The residue a facilitator would leave behind after demonstrating the whole
  // flow: a soft search recorded, the flow unlocked, and its three figures
  // committed against a goal the next stage may not have.
  const used = {
    ...select(defaultState(), 'ready-to-check'),
    mipUnlocked: true,
    checkRunAt: 1756300000000,
    softSearchRecorded: true,
    'borrow-low': { value: 194400, provenance: 'estimated' },
    'borrow-high': { value: 237600, provenance: 'estimated' },
    'max-property': { value: 255600, provenance: 'estimated' },
  };

  const settingUp = select(used, 'setting-up');
  assert.deepEqual(settingUp, { ...defaultState(), stage: 'setting-up' });
  // Nothing can deep-link into /mip from a session with no goal.
  assert.equal(settingUp.mipUnlocked, false);
});

test('a stage change resets the account picture its own figures were derived against', () => {
  // A participant who deselected an account, so the deposit total no longer
  // matches the one the stage's projection is computed from.
  const edited = {
    ...defaultState(),
    'saved-toward-deposit': { value: 6200, provenance: 'entered' },
    accountIncluded: { 'cash-isa': false, 'lifetime-isa': false },
    accountSelectionEdited: true,
  };

  const saving = select(edited, 'saving');
  assert.deepEqual(saving['saved-toward-deposit'], defaultState()['saved-toward-deposit']);
  assert.deepEqual(saving.accountIncluded, {});
  assert.equal(saving.accountSelectionEdited, false);
  // Which is what makes the stored projection true of the session it created.
  assert.equal(saving['months-to-target'].value, monthsToTarget(saving).value);
});

// ---------------------------------------------------------------------------
// The boundary with the skip-ahead control (DECISIONS.md D38, as amended)
// ---------------------------------------------------------------------------

test('"Ready to check" toggled to Now is the saving stage, apart from the stage key', () => {
  const readyToCheck = select(defaultState(), 'ready-to-check');
  const backToNow = { ...readyToCheck, ...skipBackPatch(readyToCheck) };
  const saving = select(defaultState(), 'saving');

  // THE ONE KEY THAT DIFFERS IS THE ONE THAT RECORDS WHICH BUTTON IS LIT, and
  // that is the separation D38 requires rather than a defect: `stage` says the
  // facilitator set this session up ready to check, `skippedAhead` says which
  // position within it is showing. Two facts, not one fact recorded twice.
  assert.notEqual(backToNow.stage, saving.stage);
  assert.deepEqual({ ...backToNow, stage: null }, { ...saving, stage: null });

  // Asserted on the stored string, not just the object: sessionStorage holds
  // JSON, so this catches a key-order change as well as a value change.
  assert.equal(
    JSON.stringify({ ...backToNow, stage: null }),
    JSON.stringify({ ...saving, stage: null })
  );
});

test('neither control writes the other\'s key', () => {
  const saving = select(defaultState(), 'saving');

  // The stage control reaches `skippedAhead` only through skipAheadPatch().
  const ahead = { ...saving, ...skipAheadPatch(saving) };
  assert.equal(ahead.stage, saving.stage, 'the skip-ahead control moved the stage');

  const readyToCheck = select(defaultState(), 'ready-to-check');
  assert.deepEqual(
    { skippedAhead: readyToCheck.skippedAhead, skipAheadStash: readyToCheck.skipAheadStash },
    { skippedAhead: ahead.skippedAhead, skipAheadStash: ahead.skipAheadStash }
  );
});

// ---------------------------------------------------------------------------
// What a participant does next
// ---------------------------------------------------------------------------

test('a calculator run after a stage overwrites the stage, not the other way round', () => {
  // The stage is a one-shot patch, not a flag re-read at render time, so a
  // participant's own figures are simply what the store holds afterwards.
  const saving = select(defaultState(), 'saving');

  const entered = {
    ...saving,
    'property-value': { value: 180000, provenance: 'entered' },
    'deposit-pct': { value: 0.05, provenance: 'entered' },
  };
  const target = depositTarget(entered);
  const committed = {
    ...entered,
    'deposit-target': { value: target.value, provenance: target.provenance },
  };
  const checkpoint = checkpointAmount(committed);
  const run = {
    ...committed,
    'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
  };

  assert.equal(run.stage, 'saving');
  assert.equal(run['deposit-target'].value, 9000);
  assert.equal(run['checkpoint-amount'].value, 6750);
  // 8,950 saved against a 6,750 checkpoint: the tracker follows the
  // participant's entries and unlocks, while `stage` still reads "Saving".
  assert.ok(run['saved-toward-deposit'].value >= run['checkpoint-amount'].value);
});
