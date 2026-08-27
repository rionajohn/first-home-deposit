/**
 * THE ONE LATE-JOURNEY SESSION every browser-driven script seeds from.
 *
 * WHY THIS FILE EXISTS. Three scripts - `overlap.test.mjs`, `action-bar.test.mjs`
 * and `inset-shots.mjs` - each carried their own copy of the same `FULL`
 * object, and the copies had drifted. Two of them held `on-track-for` as a bare
 * number when the model returns a `{ low, high }` range, and only one of them
 * set `mipUnlocked`, so the same route rendered a different variant depending
 * on which script asked for it. A seed that differs between harnesses is worse
 * than a seed that is wrong in all of them, because a screen can pass one audit
 * and fail another for a reason neither reports.
 *
 * WHAT IT IS. A session that has been all the way through the deposit
 * calculator and is now saving toward a committed goal: every figure in
 * `build-spec.md` section 6 set, so no screen bounces back to an earlier one
 * through its own guard. It is deliberately BELOW nothing and past nothing in
 * particular - individual scripts override the two or three keys that select
 * the variant they are looking at, and the base stays the same underneath.
 *
 * HOW TO USE IT. Spread it and override:
 *
 *     import { FULL, f } from './session-seed.mjs';
 *     const seed = { ...FULL, 'saved-toward-deposit': f(12000) };
 *
 * ADDING A KEY HERE CHANGES EVERY SCRIPT THAT IMPORTS IT. That is the point,
 * and it is also the risk: a key added to select one variant belongs in that
 * script's own override list, not here. Only figures that are true of "a
 * participant part-way through saving" belong in this file.
 *
 * NOT THE JOURNEY STAGE PATCH EITHER, and deliberately not derived from it.
 * `src/stage.js` builds frame 33's three stages (DECISIONS.md D45) and looks
 * like it does the same job as this file. It does the opposite one. `FULL` is a
 * harness fixture, deliberately past nothing in particular, so each script
 * overrides the two or three keys that select the variant it is auditing; it
 * holds hand-written derived figures on purpose, and its property value was
 * chosen to stress layout. The stage patch is ONE fixed scenario, derives every
 * figure through the model, and its property value was chosen to keep
 * `months-to-target` inside the 60-month projection window. Making either the
 * source of the other would drag one file's constraint into the other: the
 * harnesses would lose the freedom to pick a variant by overriding two keys, or
 * a participant-facing session would inherit figures picked for pixel
 * measurement.
 *
 * `stage: 'saving'` below is therefore a plain recorded value and NOT a claim
 * that these figures are the saving stage's. It describes exactly the case D45
 * verifies: a session where a stage was set and the participant then ran the
 * calculator with their own figures. Nothing reads the key at render time.
 *
 * NOT SHARED WITH `skip-ahead.test.mjs`. Its `savingSession()` fixture derives
 * `checkpoint-amount` from `CHECKPOINT_FRACTION` on purpose (DECISIONS.md D38,
 * third amendment) so that two tests which assert "no number is written down"
 * follow the constant rather than being broken by it. Hard-coding it from here
 * would undo that, so it keeps its own fixture.
 */

/** A stored figure: a value and where it came from (build-spec.md section 6). */
export const f = (v, p = 'read') => ({ value: v, provenance: p });

export const FULL = {
  // --- Section 5: the monthly position, read from the connected accounts ----
  'money-in': f(2600), 'essential-spending': f(1450), 'left-over': f(1150, 'derived'),
  'saved-toward-deposit': f(21000), 'emergency-fund': f(4200), unassigned: f(800),

  // --- Section 6: the deposit goal, committed through the calculator -------
  'property-value': f(280000, 'entered'), 'deposit-pct': f(0.1, 'entered'),
  'deposit-target': f(28000, 'derived'), 'loan-amount': f(252000, 'derived'), ltv: f(0.9, 'derived'),
  // 'entered', NOT 'estimated'. `estimated` meant "derived because the main
  // account is elsewhere", and that mode went with the account-linking removal
  // (DECISIONS.md D28), so these two keys can only be 'read' (the seeded range
  // accepted untouched) or 'entered' (a handle moved). The fixture also
  // contradicted itself: `savings-rate` below is 'entered', and
  // calculator-saving.js derives the rate's provenance FROM this pair, so an
  // 'estimated' pair could not have produced an 'entered' rate. Frame 11 now
  // captions this row by that provenance (D47), which is what made the stale
  // value visible - it was inert while nothing read the key.
  'monthly-low': f(400, 'entered'), 'monthly-high': f(600, 'entered'),
  'savings-rate': f(500, 'entered'), 'months-to-target': f(14, 'derived'),

  // A RANGE, NOT A NUMBER. `onTrackFor()` returns `{ low, high }` and
  // `tracker.js` renders it through `formatMonthYearRange(value.low,
  // value.high, ...)`. Two of the three former copies held a bare `14` here,
  // which survived only because nothing reads the STORED key - every consumer
  // recomputes from `onTrackFor(state)`. It is written correctly here so the
  // fixture cannot teach the wrong shape to the next thing that does read it.
  'on-track-for': f({ low: 14, high: 17 }, 'derived'),

  'checkpoint-amount': f(21000, 'derived'),
  'borrow-low': f(168000, 'estimated'), 'borrow-high': f(189000, 'estimated'),
  'max-property': f(210000, 'estimated'),

  // --- Section 7 and the flow flags ----------------------------------------
  calculatorEntered: true, goal: 'house', checkRunAt: '2026-08-20T10:00:00.000Z',
  softSearchRecorded: true, stage: 'saving', resultOutcome: 'likely', solveFor: 'date',
  returnFrame: '/tracker', selectedAccountId: 'house-pot',

  // Frame 17 draws an empty-state card with its own inline CTA, and no action
  // bar, until the tracker has unlocked the flow. A session this far along has
  // unlocked it, so this is `true` and the LOCKED variant is the one a script
  // has to ask for by overriding it.
  mipUnlocked: true,

  // The skip-ahead control at rest (DECISIONS.md D38). Both are `state.js`'s
  // own defaults; they are stated rather than left absent so a script reading
  // this fixture can see which position it is starting from.
  skippedAhead: false, skipAheadStash: null,
};
