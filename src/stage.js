/**
 * THE JOURNEY STAGE CONTROL. A RESEARCH AFFORDANCE, NOT A FEATURE.
 *
 * Frame 33's "Journey stage" control (build-spec.md section 7) puts a session
 * into one of three set-up states before a participant sits down. It has no
 * counterpart in a production build and is written to be deleted in one move:
 * this module, the `stage` key in `state.js`, the three content options in
 * `content.js`, one binding line in `settings.js`, and one entry in `sw.js`'s
 * `SHELL_ASSETS`. See DECISIONS.md D38 (as amended) and D45.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT SOLVES
 * ---------------------------------------------------------------------------
 * `/tracker` opens with a guard on the STORED `checkpoint-amount` and
 * `deposit-target`, and both are null until frame 09's Continue, frame 10's
 * Continue and frame 11's "Work it out" have all run. So tapping Insights on a
 * fresh session redirects into the deposit calculator, and a facilitator could
 * not demonstrate the tracker, the skip-ahead control or the Mortgage in
 * Principle flow without spending session time on the calculator first. This
 * control writes the state those three taps would have written.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT A SECOND SKIP-AHEAD CONTROL (DECISIONS.md D38, fifth amendment)
 * ---------------------------------------------------------------------------
 * D38 rejected a second session-position control by name, frame 33 included,
 * and it was right to. The two controls answer different questions and must
 * never be able to answer the same one:
 *
 *   `skip-ahead.js` moves a SAVINGS POSITION WITHIN A GOAL THAT ALREADY EXISTS.
 *   This file establishes WHETHER A SESSION HAS A GOAL AT ALL.
 *
 * One control for position, one for setup. The boundary is enforced by what
 * each writes, not by convention: this module never writes `skippedAhead`
 * except through `skipAheadPatch()` itself (see `readyToCheckPatch()` below),
 * and the skip-ahead control never writes `stage`. So frame 33 can still read
 * "Ready to check" while the tracker's own control sits at "Now" - the session
 * has the goal that stage set up, and is being shown at the earlier position
 * within it. Those are two facts, not one fact recorded twice.
 *
 * ---------------------------------------------------------------------------
 * EVERY STAGE IS COMPUTED FROM A FRESH `defaultState()`
 * ---------------------------------------------------------------------------
 * Never layered onto whatever the session currently holds. Two things follow,
 * and both are the point:
 *
 *   - Stage changes are idempotent in BOTH directions. Every stage writes every
 *     key in `STAGE_KEYS` - the later ones with their own values, the earlier
 *     ones with the default - so moving ready-to-check -> setting-up leaves
 *     nothing behind, and moving back returns the same state a second time.
 *   - The figures in the patch are true of the session it creates. They are
 *     derived against `defaultState()`'s own seeded account totals, so the
 *     account picture is reset alongside them; otherwise a participant's
 *     earlier account edit would leave a stored `months-to-target` describing a
 *     balance the session does not hold.
 *
 * ---------------------------------------------------------------------------
 * NOTHING DERIVED IS WRITTEN BY HAND
 * ---------------------------------------------------------------------------
 * The patch follows the calculator's own call order, screen by screen, and gets
 * every figure from the same model function the screen calls:
 *
 *   frame 09  Continue      entered figures, then depositTarget, loanAmount, ltv
 *   frame 10  Continue      step 2's rate seeding (monthly-low/high, savings-rate)
 *   frame 11  Work it out   monthsToTarget, onTrackFor, checkpointAmount
 *   frame 12  Save my goal  goalSaved (and checkpointAmount again, identically)
 *
 * Two numbers are written down, and only two: the property value and the
 * deposit percentage a participant would have typed and tapped. Everything else
 * follows from them through `src/model/`.
 */

import { defaultState } from './state.js';
import {
  depositTarget,
  loanAmount,
  ltv,
  monthsToTarget,
  onTrackFor,
  checkpointAmount,
} from './model/model.js';
import { MOCK_POSITION } from './model/accounts.js';
import { LISA_CAP_PROPERTY_VALUE, CHART_WINDOW_MONTHS } from './model/rates.js';
import { skipAheadPatch } from './skip-ahead.js';

/** The three options frame 33 draws, and the three `data-value`s it writes. */
export const STAGES = ['setting-up', 'saving', 'ready-to-check'];

/**
 * WHAT THE STAND-IN PARTICIPANT TYPED ON FRAME 09. Not a rate and not a figure
 * the app derives, so it does not belong in `rates.js` - it is one of the two
 * inputs a participant supplies, chosen here on their behalf, and it lives with
 * the control so the deletion list at the top of this file stays true.
 *
 * WHY 240,000. It has to leave `months-to-target` inside the 60-month
 * projection window (`CHART_WINDOW_MONTHS`), because `monthsToTarget()` returns
 * the `beyond-window` error above it and `onTrackFor()` then has no range to
 * render - the tracker's "On track for" row would fall to its beyond-window
 * variant, which is a boundary state and not the ordinary screen a facilitator
 * is trying to demonstrate. Against the mock accounts' own seeds (a 8,950
 * starting balance and a 255 a month savings rate, both read from
 * `MOCK_POSITION`) the window closes at about 275,800; 240,000 lands at 49.3
 * months with roughly 36,000 of headroom, so a later change to the mock
 * balances or to the Bank Rate has room to move before the stage silently
 * changes which variant it demonstrates.
 *
 * It also has to leave the starting balance BELOW the checkpoint, so the saving
 * stage renders the tracker locked and "Ready to check" has somewhere to go:
 * 8,950 against a 18,000 checkpoint. `scripts/stage.test.mjs` asserts both
 * properties rather than asserting the numbers, so a change here is caught by
 * the thing it would break rather than by a stale constant.
 */
export const STAGE_PROPERTY_VALUE = 240000;

/**
 * The deposit percentage the stand-in participant tapped. Written here rather
 * than read from `DEFAULT_DEPOSIT_PCT` deliberately: the two are the same value
 * today, but the default is what frame 09 pre-selects and this is what a
 * participant chose, and tying the stage to the default would let a change to
 * frame 09's pre-selection move `months-to-target` out of the projection window
 * without anything naming the stage as what broke.
 */
export const STAGE_DEPOSIT_PCT = 0.10;

/**
 * EVERY KEY THIS CONTROL OWNS. The list is explicit rather than computed so a
 * figure can only move by being named here, the same discipline
 * `skip-ahead.js` applies to its own two lists.
 *
 * THE RULE FOR WHAT IS IN IT: a key belongs here when its value is a CLAIM
 * ABOUT A DEPOSIT GOAL - the goal's own figures, the account picture those
 * figures are read from, and the flags that assert a goal exists or has been
 * acted on. Selecting a stage is a scenario reset, so anything asserting a goal
 * that the new stage does not have would be a lie left behind: a `mipUnlocked`
 * surviving into "Setting up" would let `/mip` be deep-linked by a session with
 * no goal, and a surviving `checkRunAt` would claim a soft search was recorded
 * against a goal that no longer exists.
 *
 * AND WHAT IS DELIBERATELY NOT IN IT:
 *   - `journeyStarted`, `journeyEntryPoint`, `flowEntryHistoryLength`. Claims
 *     about the BROWSER, not about a goal. The last two are written from
 *     `window.history.length` on the same click (D30/D32) and cannot be
 *     reconstructed from a patch; `journeyStarted` is written with them, and
 *     splitting the trio is worse than leaving all three alone. A facilitator
 *     reaching `/tracker` from the Insights tab has a null entry point either
 *     way, and `tracker.js` writes the pair itself on the way into the Mortgage
 *     in Principle flow.
 *   - `targetMonth` / `targetYear`. Claims about the CLOCK. Frame 10 seeds them
 *     from today's date on its own first render, so a patch that baked them in
 *     would store a date that ages while the constants above do not.
 *   - `theme`, `textSize`, `resultOutcome`. The other three frame 33 controls.
 *     One control must not move another's setting.
 *   - `solveFor`, `returnFrame`, `selectedAccountId`, `ltvVideoSeen`. Scratch
 *     slots and participant-behaviour flags. None of them says anything about
 *     whether a goal exists.
 *   - Every `COLLAPSIBLE_DEFAULTS` key. `router.js` already closes them on each
 *     navigation.
 */
const STAGE_KEYS = [
  // The section 6 figures the deposit calculator commits, frames 09 to 12.
  'property-value',
  'deposit-pct',
  'deposit-target',
  'loan-amount',
  'ltv',
  'monthly-low',
  'monthly-high',
  'savings-rate',
  'months-to-target',
  'on-track-for',
  'checkpoint-amount',

  // The section 6 figures `/mip/running` commits against that goal.
  'borrow-low',
  'borrow-high',
  'max-property',

  // The savings position, and the rest of the account picture it is summed
  // from. `saved-toward-deposit` is here because `skipAheadPatch()` moves it
  // and because the projection figures above are derived against it; the other
  // two are here so a session cannot hold a reset deposit total beside an
  // account filing that no longer produces it.
  'saved-toward-deposit',
  'emergency-fund',
  'unassigned',
  'accountAssignments',
  'accountIncluded',
  'accountSelectionEdited',

  // Frame 09's draft flag (D46). Not a figure, but it describes the goal's own
  // input, so a stage change must not leave a stale draft claiming the
  // participant is part-way through re-typing a property value this stage just
  // wrote or cleared.
  'propertyValueCleared',

  // The flags that assert a goal exists or has been acted on.
  'calculatorEntered',
  'goal',
  'goalSaved',
  'lisaCapBreached',
  'mipUnlocked',
  'checkRunAt',
  'softSearchRecorded',
  'journeyPaused',

  // The skip-ahead position. Written here only so "Setting up" and "Saving"
  // clear what "Ready to check" set - `readyToCheckPatch()` gets its values
  // from `skipAheadPatch()` and never writes them itself.
  'skippedAhead',
  'skipAheadStash',
];

/**
 * Every owned key at its `defaultState()` value - the "Setting up" stage, and
 * the floor every other stage is built on top of. A fresh object each call, so
 * two patches never share one.
 */
function baseline() {
  const base = defaultState();
  const patch = {};
  for (const key of STAGE_KEYS) patch[key] = base[key];
  return patch;
}

/**
 * The "Saving" stage: a goal set through the calculator, and a savings position
 * below its checkpoint.
 *
 * Each block below is one screen's own commit, in the order the participant
 * would have made them, reading the same model functions that screen reads.
 */
function savingPatch() {
  const base = defaultState();

  // --- Frame 09's Continue (calculator-property.js) -------------------------
  // The two entered figures first, then the three the screen derives from them.
  const entered = {
    'property-value': { value: STAGE_PROPERTY_VALUE, provenance: 'entered' },
    'deposit-pct': { value: STAGE_DEPOSIT_PCT, provenance: 'entered' },
  };
  const afterEntry = { ...base, ...entered };
  const target = depositTarget(afterEntry);
  const loan = loanAmount(afterEntry);
  const value = ltv(afterEntry);

  // Provenance is not stamped here, it is whatever the model returned:
  // `combineProvenance` makes each of these 'entered' rather than 'derived'
  // because it is partly derived from an entered input (DECISIONS.md D5), and
  // that is as true of `deposit-target` and `checkpoint-amount` as of the rest.
  const step1 = {
    ...entered,
    'deposit-target': { value: target.value, provenance: target.provenance },
    'loan-amount': { value: loan.value, provenance: loan.provenance },
    ltv: { value: value.value, provenance: value.provenance },
    lisaCapBreached: STAGE_PROPERTY_VALUE > LISA_CAP_PROPERTY_VALUE,
  };

  // --- Frame 10's Continue (calculator-saving.js) ---------------------------
  // The default path: `solveFor` unset, so the slider variant, with both
  // handles left where the screen seeds them. The seeds come from the same two
  // `MOCK_POSITION` fields the screen reads, clamped against the same ceiling
  // (`left-over`), and carry the same 'read' provenance - a participant who
  // accepted the seeded range has not entered anything.
  const savingCeiling = base['left-over'].value;
  const monthlyLow = {
    value: Math.min(MOCK_POSITION.recentMonthlySavingLow, savingCeiling),
    provenance: 'read',
  };
  const monthlyHigh = {
    value: Math.min(MOCK_POSITION.recentMonthlySavingHigh, savingCeiling),
    provenance: 'read',
  };
  const step2 = {
    'monthly-low': monthlyLow,
    'monthly-high': monthlyHigh,
    'savings-rate': {
      value: (monthlyLow.value + monthlyHigh.value) / 2,
      // The screen's own rule, copied rather than simplified: the midpoint
      // inherits the provenance of the pair it is the midpoint of.
      provenance:
        monthlyLow.provenance === 'entered' || monthlyHigh.provenance === 'entered'
          ? 'entered'
          : monthlyLow.provenance,
    },
  };

  // --- Frame 11's "Work it out" (calculator-review.js) ----------------------
  // Read against the store as frames 09 and 10 will have left it, so these
  // three see the figures those screens committed rather than the defaults.
  const afterStep2 = { ...afterEntry, ...step1, ...step2 };
  const months = monthsToTarget(afterStep2);
  const onTrack = onTrackFor(afterStep2);
  const checkpoint = checkpointAmount(afterStep2);

  return {
    ...baseline(),
    ...step1,
    ...step2,
    'months-to-target': { value: months.value, provenance: months.provenance },
    'on-track-for': { value: onTrack.value, provenance: onTrack.provenance },
    'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },

    // Frame 08's "Open the deposit calculator" (goal-check.js), frame 06's
    // "Yes, keep going" (position-summary.js) and frame 12's "Save my goal"
    // (calculator-result.js). Frame 12 also commits `checkpoint-amount` a
    // second time, from the same `checkpointAmount()` call against the same
    // inputs, so it is already above rather than written twice here.
    //
    // Nothing reads these three today. They are set because they are TRUE of
    // the session this stage stands in for, on the same reasoning `state.js`
    // gives for its own seeded figures - a screen added later that reads
    // `goalSaved` must not find a stage-set goal claiming it was never saved.
    calculatorEntered: true,
    goal: 'house',
    goalSaved: true,

    // `mipUnlocked` is deliberately NOT set, at either stage. It is written by
    // the tracker's own "Check my Mortgage in Principle" control, together with
    // the entry point the flow's close X reads, and a facilitator taking that
    // tap is part of the demonstration rather than something to skip past.
  };
}

/**
 * The "Ready to check" stage: the saving stage with the skip-ahead control's
 * own patch applied on top.
 *
 * NOT A SEPARATELY CONSTRUCTED STATE, and not a cheaper property value that
 * happens to put the checkpoint below the mock balance. A different journey is
 * a different participant, not the same one further along - the point of this
 * stage is that the facilitator is demonstrating the SAME goal the saving stage
 * sets up, seen later. Composing the two patches is what makes that literally
 * true: the goal's own figures are byte-identical between the two stages, and
 * the only difference is the position within it.
 *
 * It also means this stage cannot drift from the control. `skipAheadPatch()`
 * takes its threshold from the stored `checkpoint-amount` and recomputes
 * `months-to-target` and `on-track-for` through the model, so a change to
 * `CHECKPOINT_FRACTION` moves both the stage and the control together, and
 * neither has a fraction, percentage or amount written down in it.
 */
function readyToCheckPatch() {
  const saving = savingPatch();
  const skipped = skipAheadPatch({ ...defaultState(), ...saving });
  // `skipAheadPatch()` returns null only when there is no numeric
  // `checkpoint-amount` to take a fraction of. `savingPatch()` has just
  // committed one through `checkpointAmount()`, so this cannot be null here -
  // spread defensively rather than asserted, because a null spread is a no-op
  // and would leave the saving stage rather than a broken one.
  return { ...saving, ...skipped };
}

/**
 * The patch for a stage, ready to be spread into `setState` alongside the
 * `stage` value itself.
 *
 * An unrecognised value falls back to the empty state rather than throwing:
 * this is a facilitator control on a prototype, and a stale `stage` string in
 * a restored session should leave a usable app rather than a blank screen.
 */
export function stagePatch(stage) {
  switch (stage) {
    case 'saving':
      return savingPatch();
    case 'ready-to-check':
      return readyToCheckPatch();
    case 'setting-up':
    default:
      return baseline();
  }
}

/**
 * The projection window the saving stage's property value is chosen against,
 * re-exported so `scripts/stage.test.mjs` asserts against the same constant
 * `monthsToTarget()` compares to rather than against a second copy of 60.
 */
export { CHART_WINDOW_MONTHS };
