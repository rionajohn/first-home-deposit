/**
 * THE DRAFT INVARIANT (DECISIONS.md D46, GAPS.md G62).
 *
 *   Screen-local draft state does not write to a build-spec.md section 6
 *   figure. Abandoning a draft changes no committed key.
 *
 * This asserts the INVARIANT, not the symptom. G62's visible fault was
 * `/tracker` reading "You're £0 away" beside a £8,950 headline and a £24,000
 * goal, but the £0 was three screens' worth of consequence, not the defect:
 * frame 09 wrote `property-value: null` on an empty field while
 * `deposit-target` stayed committed, and frames 11, 12 and 15/16 all read
 * `property-value` live. A test written against the £0 would pass the moment
 * one of those three screens learned to hide it, while the store went on
 * holding a state no screen expects.
 *
 * Pure Node - no browser. The screen modules touch the DOM, so what is driven
 * here is the store transition frame 09 performs plus every model function that
 * reads the result. The rendered consequence is walked in a browser separately
 * and recorded in D46.
 *
 * Run: node --test scripts/g62.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultState } from '../src/state.js';
import { stagePatch } from '../src/stage.js';
import {
  gapToCheckpoint,
  checkpointAmount,
  depositTarget,
  monthsToTarget,
} from '../src/model/model.js';

/** A session with a committed goal, below its checkpoint - the state G62 starts from. */
const committed = () => ({ ...defaultState(), stage: 'saving', ...stagePatch('saving') });

/**
 * What frame 09's `change` handler now does with an empty field, and the whole
 * of the fix: the draft flag is set and NOTHING ELSE MOVES.
 */
const clearTheField = (state) => ({ ...state, propertyValueCleared: true });

/** What the screen decides from that - `isEmpty` in calculator-property.js. */
const isEmpty = (state) => state.propertyValueCleared || state['property-value'].value === null;

/** Every key frames 09 to 12 commit. None of them may move when a draft is abandoned. */
const COMMITTED_KEYS = [
  'property-value', 'deposit-pct', 'deposit-target', 'loan-amount', 'ltv',
  'monthly-low', 'monthly-high', 'savings-rate',
  'months-to-target', 'on-track-for', 'checkpoint-amount',
];

test('clearing the field changes no committed key', () => {
  const before = committed();
  const after = clearTheField(before);

  for (const key of COMMITTED_KEYS) {
    assert.deepEqual(after[key], before[key], `${key} moved when the draft was abandoned`);
  }
  // Stated on the stored string too, so a key-order change cannot slip past.
  const strip = (s) => JSON.stringify({ ...s, propertyValueCleared: null });
  assert.equal(strip(after), strip(before));
});

test('the screen still draws its empty variant, and Continue stays disabled', () => {
  const after = clearTheField(committed());
  // Frame 09a renders and `primaryDisabled: isEmpty` holds, exactly as when the
  // flag did not exist - the participant sees no change at all on this screen.
  assert.equal(isEmpty(after), true);
});

test('a session that never entered a value is still empty, by the other route', () => {
  const fresh = defaultState();
  assert.equal(fresh.propertyValueCleared, false);
  assert.equal(fresh['property-value'].value, null);
  assert.equal(isEmpty(fresh), true);
});

test('typing a value again clears the draft and commits', () => {
  const cleared = clearTheField(committed());
  const retyped = {
    ...cleared,
    propertyValueCleared: false,
    'property-value': { value: 180000, provenance: 'entered' },
  };
  assert.equal(isEmpty(retyped), false);
  assert.equal(depositTarget(retyped).value, 18000);
});

test('every figure the tracker shows survives the cleared draft', () => {
  const before = committed();
  const after = clearTheField(before);

  // The gap sentence G62 named. £9,050, not £0.
  assert.equal(gapToCheckpoint(after).value, gapToCheckpoint(before).value);
  assert.equal(gapToCheckpoint(after).error, null);
  assert.equal(
    gapToCheckpoint(after).value,
    after['checkpoint-amount'].value - after['saved-toward-deposit'].value
  );
  // The milestone caption's "a 10% deposit on a £X home", and the rate table's
  // own deposit amounts - both read `property-value` directly.
  assert.equal(after['property-value'].value, before['property-value'].value);
  assert.notEqual(after['property-value'].value, null);
});

test('every figure frames 11 and 12 show survives it too', () => {
  const before = committed();
  const after = clearTheField(before);

  // Frame 11's property row, and frame 12's headline and every threshold label,
  // are `property-value` multiplied by a percentage. A null here is what
  // produced "A deposit on a £0 home could be £0 to £0".
  assert.equal(typeof after['property-value'].value, 'number');
  assert.equal(depositTarget(after).error, null);

  // COMPARED BEFORE-TO-AFTER, NOT PINNED TO null. The invariant this file
  // exists for is that abandoning a draft moves nothing, so what matters is
  // that the projection answers the SAME thing either side of the clear -
  // whatever that answer is. Pinned to null it also asserted that the stage
  // seed sits inside the projection window, which is a fact about
  // `STAGE_PROPERTY_VALUE` and belongs to `stage.test.mjs`; D55 raised that
  // seed past the window deliberately and this test failed for a reason that
  // had nothing to do with drafts.
  assert.equal(monthsToTarget(after).error, monthsToTarget(before).error);
  assert.equal(monthsToTarget(after).value, monthsToTarget(before).value);
});

test('frame 13 no longer has to redirect', () => {
  // `learn-ltv.js` guards on `property-value` itself and redirected into frame
  // 12 - which was the broken screen. With the draft not writing the figure,
  // the guard passes and the redirect never happens.
  const after = clearTheField(committed());
  assert.notEqual(after['property-value'].value, null);
  assert.notEqual(after['deposit-pct'].value, null);
});

test('gapToCheckpoint reads the stored checkpoint, not a live derivation', () => {
  // The D38 third-amendment pattern, in its second consumer. With the stored key
  // present and the live inputs gone, the two answers used to differ; the gap
  // must now follow the stored one, which is the key /tracker's guard tested.
  const state = {
    ...committed(),
    'property-value': { value: null, provenance: 'entered' },
    'deposit-pct': { value: null, provenance: null },
  };
  assert.equal(checkpointAmount(state).error, 'non-numeric');   // live derivation fails
  assert.equal(gapToCheckpoint(state).error, null);             // stored read does not
  assert.equal(
    gapToCheckpoint(state).value,
    state['checkpoint-amount'].value - state['saved-toward-deposit'].value
  );
});

test('the gap reports rather than invents when no checkpoint was ever committed', () => {
  const fresh = defaultState();
  const result = gapToCheckpoint(fresh);
  assert.equal(result.error, 'not-committed');
  assert.equal(result.value, null);
});

test('a stage change does not leave a stale draft behind', () => {
  const cleared = clearTheField(committed());
  for (const stage of ['setting-up', 'saving', 'ready-to-check']) {
    const next = { ...cleared, stage, ...stagePatch(stage) };
    assert.equal(next.propertyValueCleared, false, `${stage} kept the draft`);
  }
});
