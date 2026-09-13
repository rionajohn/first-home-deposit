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
 * through its own guard. Its saved figure is the accounts' own total, which
 * puts it BELOW `checkpoint-amount` - the position a real session opens in -
 * and individual scripts override the two or three keys that select the
 * variant they are looking at, with the base the same underneath. (Before D158
 * this said "below nothing", while a hand-typed 21,000 sat exactly AT the
 * checkpoint.)
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

import { accountFigures } from '../src/model/accounts.js';

/** A stored figure: a value and where it came from (build-spec.md section 6). */
export const f = (v, p = 'read') => ({ value: v, provenance: p });

/**
 * THE THREE FIGURES THE ACCOUNTS DECIDE, READ FROM THE ACCOUNTS (DECISIONS.md
 * D158, amending D43).
 *
 * `saved-toward-deposit`, `emergency-fund` and `unassigned` are what the mock
 * accounts total under their default filing - the same `accountFigures()`
 * frames 03 and 06 compute, so the seed cannot disagree with them. They were
 * hand-typed (21,000, 4,200 and 800) against accounts that total 8,950, 5,600
 * and 2,400, and frame 06 rewrites any stored figure that differs from the
 * accounts on render: a seeded session showed one saved figure until it
 * visited "Where you stand" and another afterwards. build-spec.md makes the
 * accounts the source (frames 03 and 03b recalculate these), and D48 says the
 * saved figure IS the sum of the four deposit accounts.
 *
 * A script that needs a different balance - the date list's cap, a goal
 * already met - states its own override. It must not lean on this one.
 */
const ACCOUNTS = accountFigures({});

/**
 * `borrow-high` is shared by the stored range and `max-property`, which
 * build-spec.md section 4 defines as borrow-high + saved-toward-deposit. Both
 * borrow figures are hand-typed fixture values (the model's own `borrowRange()`
 * gives a different range for this seed - GAPS.md G139); `max-property` is
 * held consistent with the range the seed actually stores.
 */
const BORROW_HIGH = 189000;

/**
 * THE SESSION ANCHOR EVERY HARNESS MUST SEED (DECISIONS.md D97).
 *
 * `load()` discards a stored session whole when its anchor month is not the
 * current month - the same branch D59's build stamp takes, for the second
 * reason that a stale anchor produces wrong years with nothing on screen to
 * reveal it. A fixture written without one is therefore discarded on arrival,
 * every screen falls back to a fresh store, and guard-driven screens redirect:
 * that is what two smoke failures looked like the first time this landed, and
 * they looked like screen defects rather than like a missing seed key.
 *
 * COMPUTED AT RUN TIME, not pinned. A pinned anchor would pass today and start
 * discarding every fixture on the first of next month, which is the same class
 * of dated-constant failure D59 exists to catch.
 */
export const SEED_ANCHOR = (() => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

export const FULL = {
  // --- Section 5: the monthly position, read from the connected accounts ----
  'money-in': f(2600), 'essential-spending': f(1450), 'left-over': f(1150, 'derived'),
  // From the accounts, not typed here. See ACCOUNTS above.
  'saved-toward-deposit': ACCOUNTS['saved-toward-deposit'],
  'emergency-fund': ACCOUNTS['emergency-fund'],
  unassigned: ACCOUNTS.unassigned,

  // --- Section 6: the deposit goal, committed through the calculator -------
  'property-value': f(280000, 'entered'), 'deposit-pct': f(0.1, 'entered'),
  'deposit-target': f(28000, 'derived'), 'loan-amount': f(252000, 'derived'), ltv: f(0.9, 'derived'),
  // DECISIONS.md D70. ZERO, AND TRUTHFULLY SO: 280,000 sits under the 300,000
  // nil-rate band, so first-time buyer stamp duty on this fixture's property
  // really is nothing, and `combined-goal` really does equal `deposit-target`.
  // The figure is not invented to make the seed interesting - a fixture that
  // disagreed with `stampDuty()` would be worse than one that exercises the
  // zero case. `checkpoint-amount` below is 21,000 because 0.75 x 28,000 is
  // unchanged by a zero tax - derived from the goal, not from the saved figure,
  // so it did not move when the saved figure became the accounts' 8,950 (D158). The NON-zero case is exercised by
  // overlap.test.mjs's own `15-stamp-duty` row, which is that script's
  // override rather than a change here.
  'stamp-duty': f(0, 'entered'), 'combined-goal': f(28000, 'derived'),
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
  'borrow-low': f(168000, 'estimated'), 'borrow-high': f(BORROW_HIGH, 'estimated'),
  // 197,950: borrow-high + the accounts' saved figure (build-spec.md section 4).
  'max-property': f(BORROW_HIGH + ACCOUNTS['saved-toward-deposit'].value, 'estimated'),

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

  // See SEED_ANCHOR above. Without this every harness's fixture is discarded on
  // load and the screens under test render from a fresh store.
  sessionAnchor: SEED_ANCHOR,
};
