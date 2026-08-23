/**
 * THE SKIP-AHEAD CONTROL. A RESEARCH AFFORDANCE, NOT A FEATURE.
 *
 * This file exists so a moderated session can look at the deposit tracker in
 * its later state, and the Mortgage in Principle screens beyond it, without a
 * participant having to save toward the goal for real. It has no counterpart
 * in a production build and is written to be deleted in one move: one module,
 * one state pair, one control on one screen (`/goals`). See DECISIONS.md D38.
 *
 * ---------------------------------------------------------------------------
 * TWO POSITIONS, AND THE ROUND TRIP BETWEEN THEM
 * ---------------------------------------------------------------------------
 *   'now'   — the starting savings position, whatever the session has arrived
 *             at. Not a constant: it is whatever `saved-toward-deposit` held
 *             when the control was last at "Now".
 *   'ahead' — the checkpoint position, `CHECKPOINT_FRACTION` x `deposit-target`,
 *             which is exactly the threshold `/tracker` unlocks the Mortgage in
 *             Principle milestone at.
 *
 * The threshold comes from `checkpointAmount()` in model.js, which is
 * `CHECKPOINT_FRACTION * depositTarget(state)` and nothing else. No fraction,
 * percentage or amount is written down in this file. That matters twice over:
 * changing `CHECKPOINT_FRACTION` in rates.js moves this control with it, and
 * the skipped position lands on the same arithmetic the tracker's own
 * `checkpoint-amount` came from, so `saved >= checkpoint` is true by
 * construction rather than by rounding luck.
 *
 * ---------------------------------------------------------------------------
 * WHY A STASH RATHER THAN A COMPUTED OVERRIDE
 * ---------------------------------------------------------------------------
 * Roughly a dozen screens read `state['saved-toward-deposit']` directly. An
 * override read through a helper would mean changing every one of them and
 * would leave the next screen someone adds able to miss it silently. Instead
 * the control WRITES the skipped position into the store and keeps the
 * position it replaced in `skipAheadStash`, restoring it verbatim on the way
 * back. Every screen and every model function is untouched and moves on its
 * own, and "the starting state returns exactly as it was" is a property of
 * copying an object back rather than of re-deriving it and hoping.
 *
 * ---------------------------------------------------------------------------
 * WHAT MOVES, AND WHAT DOES NOT
 * ---------------------------------------------------------------------------
 * Most of what depends on the savings position is computed at render time and
 * needs nothing from this file: the tracker's headline, its progress fill, its
 * below/reached/met variant and therefore every milestone state, its action
 * bar, `gapToCheckpoint`, `gap`, `monthsToTarget`, `onTrackFor`,
 * `neededLoanAmount`, `maxProperty` and `mipEstimatedLtv` all re-derive from
 * whatever `saved-toward-deposit` currently says.
 *
 * THREE FIGURES ARE STORED RATHER THAN DERIVED, and would otherwise be left
 * behind at the position they were committed at. They are listed in
 * `DERIVED_STORED_KEYS` below and are recomputed here, but only where they had
 * already been committed - skipping ahead must not conjure a figure onto a
 * screen the participant has not reached yet.
 *
 * NOT MOVED, DELIBERATELY, and recorded in DECISIONS.md D38:
 *   - `MOCK_POSITION.thisMonthInterest` (frames 15/16's "Interest earned").
 *     It is a directly-read mock figure carrying a "read from" caption, fixed
 *     as such by D34. Deriving it from the balance would contradict its own
 *     caption on screen.
 *   - Per-account balances on frames 03, 06 and 32. Raising them means
 *     inventing balances, which the content rules forbid. While the control is
 *     at "Further along" those screens show a saved total larger than the
 *     accounts they list.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NEVER TOUCHED
 * ---------------------------------------------------------------------------
 * `property-value`, `deposit-pct`, `deposit-target`, `savings-rate`, `goal`,
 * `targetMonth`/`targetYear`, the account assignments and every other thing a
 * participant entered. The patch below names its keys explicitly rather than
 * spreading a computed object, so a figure can only move by being added to one
 * of the two lists in this file.
 */

import { checkpointAmount, monthsToTarget, onTrackFor, maxProperty } from './model/model.js';

/** The two positions the control moves between. Also its two `data-value`s. */
export const SKIP_AHEAD_POSITIONS = ['now', 'ahead'];

/**
 * The stored figures that genuinely derive from the savings position, and so
 * have to be recomputed when it moves and restored when it moves back.
 *
 *   `months-to-target` / `on-track-for` — committed once by frame 11's
 *     "Work it out" (calculator-review.js) and read afterwards rather than
 *     recomputed, so without this they would still describe the old position.
 *   `max-property` — committed by `/mip/running` on each run, and
 *     `borrow-high + saved-toward-deposit` by definition (model.js). A
 *     participant who runs the check while skipped ahead would otherwise leave
 *     a skipped-position figure behind them on the way back.
 *
 * `borrow-low` / `borrow-high` are NOT here: they derive from `loan-amount`,
 * which is sized against `deposit-target`, and do not see the savings position
 * at all. `checkpoint-amount` is not here for the same reason.
 */
const DERIVED_STORED_KEYS = ['months-to-target', 'on-track-for', 'max-property'];

/** Everything the control writes, and therefore everything it stashes. */
const STASHED_KEYS = ['saved-toward-deposit', ...DERIVED_STORED_KEYS];

/** Is the session currently showing the later position? */
export function isSkippedAhead(state) {
  return state.skippedAhead === true && state.skipAheadStash !== null;
}

/**
 * Can the control reach "Further along" at all?
 *
 * It cannot before a deposit goal exists: there is no `deposit-target`, so
 * there is no checkpoint to be three quarters of the way to, and `/tracker`
 * itself redirects into the calculator in that state. The control stays
 * visible and keyboard reachable and says so, rather than disappearing between
 * two visits to the same screen.
 */
export function canSkipAhead(state) {
  const checkpoint = checkpointAmount(state);
  return !checkpoint.error && typeof checkpoint.value === 'number';
}

/**
 * The patch that moves the session to the checkpoint position.
 *
 * Returns null when there is no goal to be part-way toward - the caller
 * treats that as "the control cannot move right now", not as an error.
 *
 * PROVENANCE IS CARRIED OVER, NOT REWRITTEN. The four-value vocabulary
 * (read / derived / estimated / entered) describes where a figure came from in
 * the world the participant is being shown, and in that world the balance at
 * the checkpoint is still a balance read from their accounts. There is no
 * fifth value meaning "the prototype put this here", and inventing one would
 * put a word on screen that the provenance key sheet (frame 29) does not
 * explain. The control's own label is what tells the participant this is a
 * prototype position; the caption under the figure is not the place to say it
 * a second time in a vocabulary built for something else.
 */
export function skipAheadPatch(state) {
  const checkpoint = checkpointAmount(state);
  if (checkpoint.error || typeof checkpoint.value !== 'number') return null;

  const stash = {};
  for (const key of STASHED_KEYS) stash[key] = state[key];

  const saved = {
    value: checkpoint.value,
    provenance: state['saved-toward-deposit'].provenance,
  };

  // The store as it will be, so the three recomputations below read the
  // skipped position rather than the one being replaced.
  const next = { ...state, 'saved-toward-deposit': saved };

  const patch = {
    skippedAhead: true,
    skipAheadStash: stash,
    'saved-toward-deposit': saved,
  };

  // ONLY WHERE ALREADY COMMITTED. `provenance === null` is this store's own
  // "never set" marker (state.js seeds every section 6 key that way, and
  // calculator-result.js already guards on exactly this for
  // `months-to-target`). A figure the participant has not reached yet stays
  // unset in both positions.
  if (state['months-to-target'].provenance !== null) {
    const months = monthsToTarget(next);
    const onTrack = onTrackFor(next);
    patch['months-to-target'] = { value: months.value, provenance: months.provenance };
    patch['on-track-for'] = { value: onTrack.value, provenance: onTrack.provenance };
  }
  if (state['max-property'].provenance !== null) {
    const max = maxProperty(next);
    patch['max-property'] = { value: max.value, provenance: max.provenance };
  }

  return patch;
}

/**
 * The patch that returns the session to the starting position.
 *
 * The stash is spread back verbatim - same values, same provenance, same
 * object shape - so this is a restore rather than a second derivation. That is
 * what makes an arbitrary number of round trips land on identical state
 * instead of drifting by a rounding step each time.
 */
export function skipBackPatch(state) {
  const stash = state.skipAheadStash;
  if (!stash) return { skippedAhead: false, skipAheadStash: null };
  return { ...stash, skippedAhead: false, skipAheadStash: null };
}

/**
 * The entry holding the STARTING savings position right now - the live figure
 * ordinarily, the stashed one while the control is at "Further along".
 *
 * Read by the two screens that recompute the account totals (frame 03's
 * selection rows and frame 06's summary), so they can tell whether the totals
 * have actually moved without comparing against a skipped figure that is never
 * going to match them.
 */
export function startingSavedTowardDeposit(state) {
  return isSkippedAhead(state)
    ? state.skipAheadStash['saved-toward-deposit']
    : state['saved-toward-deposit'];
}

/**
 * Re-points a freshly recomputed set of account figures at whichever position
 * owns them.
 *
 * WHY THIS EXISTS. `saved-toward-deposit` is a sum of account balances, and
 * two screens recompute it whenever a participant changes which accounts count
 * (frame 03's checkboxes, frame 06 on entry). Left alone, either of them would
 * overwrite the skipped position with the account total and silently return
 * the session to "Now" while the control still read "Further along" - and the
 * participant's own account edit would then be discarded by the restore on the
 * way back.
 *
 * So while the control is at "Further along" the recomputed deposit total goes
 * into the stash, where it is what the participant gets back when they move
 * the control to "Now". Their edit survives the round trip; the position on
 * screen stays put. `emergency-fund` and `unassigned` are not part of the
 * savings position and are written live in both cases.
 *
 * The live figure's provenance is kept in step with the stashed one (D5: these
 * become 'entered' the moment a participant changes what counts), so the
 * caption under the skipped figure says the same thing it would have said
 * about the position it stands in for.
 */
export function accountFiguresPatch(state, figures) {
  if (!isSkippedAhead(state)) return figures;

  const { 'saved-toward-deposit': saved, ...rest } = figures;
  return {
    ...rest,
    'saved-toward-deposit': {
      value: state['saved-toward-deposit'].value,
      provenance: saved.provenance,
    },
    skipAheadStash: { ...state.skipAheadStash, 'saved-toward-deposit': saved },
  };
}
