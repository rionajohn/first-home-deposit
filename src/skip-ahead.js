/**
 * THE SKIP-AHEAD CONTROL. A RESEARCH AFFORDANCE, NOT A FEATURE.
 *
 * This file exists so a moderated session can look at the deposit tracker in
 * its later state, and the Mortgage in Principle screens beyond it, without a
 * participant having to save toward the goal for real. It has no counterpart
 * in a production build and is written to be deleted in one move: this module,
 * one state pair in `state.js`, the `.skip-ahead` block in `screens.css`, the
 * five `skipAhead*` keys in `content.js`, and two lines in `tracker.js`. The
 * control is drawn on `/tracker` and on no other screen. See DECISIONS.md D38.
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
 * The threshold is the STORED `checkpoint-amount`, which `calculator-review.js`
 * and `calculator-result.js` wrote from `checkpointAmount()` in model.js -
 * `CHECKPOINT_FRACTION * depositTarget(state)` and nothing else. No fraction,
 * percentage or amount is written down in this file. That matters twice over:
 * changing `CHECKPOINT_FRACTION` in rates.js moves this control with it, and
 * the skipped position lands on exactly the figure the tracker measures against,
 * so `saved >= checkpoint` is true by construction rather than by rounding luck.
 *
 * READING THE STORED KEY RATHER THAN RE-DERIVING IT IS DELIBERATE, and is the
 * fix recorded in D38's third amendment - see `canSkipAhead()` below.
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

import { monthsToTarget, onTrackFor, maxProperty } from './model/model.js';
import { rerenderInPlace } from './components/ui.js';

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
 * IT READS THE STORED `checkpoint-amount`, AND THAT IS THE WHOLE POINT
 * (DECISIONS.md D38, third amendment). It used to recompute the checkpoint live
 * through `checkpointAmount()`, which derives it from `property-value` x
 * `deposit-pct`. `/tracker`'s guard, which decides whether this control is drawn
 * at all, tests the STORED `checkpoint-amount` and `deposit-target` keys. Two
 * things answering "does this session have a deposit goal?" from different
 * sources will eventually disagree, and they did: clearing the property-value
 * field on frame 09 writes `property-value: null` without clearing the
 * committed `deposit-target`, so the guard passed on the stored keys while the
 * live derivation failed `non-numeric` and the control drew itself inert.
 *
 * Reading the same key the guard reads makes the two agree by construction.
 * Wherever `/tracker` renders, `checkpoint-amount` is non-null - the guard has
 * already tested it - so "Further along" is enabled wherever the control is
 * drawn.
 *
 * The `available` branch below is therefore dead by CONSTRUCTION rather than by
 * coincidence, and is kept for a caller that draws this control somewhere the
 * guard does not run. That is a different and much stronger claim than the one
 * this file used to make.
 */
export function canSkipAhead(state) {
  return typeof state['checkpoint-amount'].value === 'number';
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
  // THE SAME STORED KEY `canSkipAhead()` READS, and it has to be. If this
  // recomputed live while that one read the store, the option could be enabled
  // and do nothing when pressed - `bindSkipAhead` treats a null patch as "the
  // control cannot move right now" and returns silently. One source, one
  // answer.
  const checkpoint = state['checkpoint-amount'];
  if (typeof checkpoint.value !== 'number') return null;

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

// ---------------------------------------------------------------------------
// THE CONTROL ITSELF
// ---------------------------------------------------------------------------
// Markup and binding live here rather than in the screen that draws them, so
// the whole affordance is one file plus one CSS block plus five content keys.
// That is what makes the deletion list at the top of this file true.
//
// IT IS DRAWN BY `/tracker` AND BY NOTHING ELSE (D38, as amended). It used to
// sit at the bottom of `/goals`. It now sits at the top of the deposit tracker,
// above the headline figure - the screen whose figures it actually moves, so
// the control and its effect are read in one place rather than two screens
// apart. Both routes into the tracker get it, because they are the same screen.
//
// NOT in the Mortgage in Principle flow and NOT in the deposit calculator: a
// participant part-way through a task must not be able to change the position
// the task is measured against. One trigger, on one screen, and no second way.


/**
 * WHY A RADIOGROUP AND NOT A SWITCH OR A BUTTON. It selects between two named
 * positions rather than turning a thing on, and both names are visible at once,
 * so a participant can read what they are moving between before they move. A
 * switch would announce "Further along, on", which says an action was
 * performed; two radios announce "Now, selected" / "Further along, selected",
 * which says where the session is.
 *
 * FULLY IN THE ACCESSIBILITY TREE, unlike the facilitator gesture in
 * `src/facilitator-gesture.js`, because it is visible. (That citation used to
 * read "the facilitator gesture on frame 10", which never existed in the code -
 * a stale reference corrected when the real one was built, DECISIONS.md D54.) A visible control a keyboard or screen-reader
 * participant cannot reach, or cannot hear the state of, is a different
 * prototype for them than for everyone else - a defect in the instrument
 * rather than a finding about the design.
 *
 * THE ACCESSIBLE NAME CARRIES THE PROTOTYPE FRAMING, not just the position.
 * Each option is announced as "Prototype control: skip ahead, Further along"
 * rather than bare "Further along", composed from the two existing content keys
 * rather than written as a third string - nothing is redrafted. A radiogroup's
 * own name is announced on entering the group and not repeated per option, so
 * a participant arrowing between the two would otherwise hear only the position
 * names and lose the one word that says this is not part of the app.
 *
 * ROVING TABINDEX, per the ARIA radiogroup pattern: the group is one tab stop,
 * the selected option takes it, and the arrows move within it. Two tab stops
 * would put a control the bank does not have into the tab order twice.
 *
 * THE UNAVAILABLE CASE IS CURRENTLY UNREACHABLE, AND IS KEPT DELIBERATELY.
 * `canSkipAhead()` is false only when there is no `deposit-target` to take
 * `CHECKPOINT_FRACTION` of. On the one route that draws this control,
 * `/tracker`, that state cannot be reached: `render()` in
 * `src/screens/tracker.js` opens with
 *
 *     if (state['checkpoint-amount'].value === null
 *         || state['deposit-target'].value === null) {
 *       window.location.replace('#/calculator/result');
 *       return;
 *     }
 *
 * so the screen redirects into the calculator before the control is ever
 * drawn. THE BRANCH BECOMES LIVE AGAIN THE MOMENT THAT GUARD IS RELAXED, or if
 * the control is ever drawn on a second screen - do not delete it on the
 * grounds that it never renders today. When it is live, "Further along" carries
 * `aria-disabled` rather than `disabled`, so it keeps its place in the group
 * and its announcement and only the affordance is withdrawn.
 */
export function skipAheadHTML({ c, position, available }) {
  const option = ({ value, label, selected, disabled }) => `
    <button
      type="button"
      class="skip-ahead__option${selected ? ' skip-ahead__option--selected' : ''}"
      role="radio"
      aria-checked="${selected}"
      aria-label="${c.skipAheadLabel}, ${label}"
      ${disabled ? 'aria-disabled="true"' : ''}
      tabindex="${selected ? '0' : '-1'}"
      data-action="set-skip-ahead"
      data-value="${value}"
    >${label}</button>
  `;

  return `
    <section class="skip-ahead">
      <p class="skip-ahead__label" id="skip-ahead-label">${c.skipAheadLabel}</p>
      <div class="skip-ahead__options" role="radiogroup" aria-labelledby="skip-ahead-label">
        ${option({ value: 'now', label: c.skipAheadNowOption, selected: position === 'now', disabled: false })}
        ${option({ value: 'ahead', label: c.skipAheadAheadOption, selected: position === 'ahead', disabled: !available })}
      </div>
    </section>
  `;
}

/**
 * Wires the control. `render` is the drawing screen's own render function, so
 * selection re-renders that screen in place rather than navigating: the
 * participant stays where they were, keeps their scroll position, and keeps
 * focus on the option they just chose (`rerenderInPlace` restores focus by
 * `data-action` plus `data-value`, both of which these options carry).
 */
export function bindSkipAhead(container, ctx, render) {
  const options = Array.from(container.querySelectorAll('[data-action="set-skip-ahead"]'));
  if (options.length === 0) return;

  function selectPosition(value) {
    const current = isSkippedAhead(ctx.state) ? 'ahead' : 'now';
    if (value === current) return;

    // `skipAheadPatch` returns null when there is no goal to be part-way
    // toward. The option is already marked `aria-disabled` in that state; this
    // is the same rule enforced where it actually applies, so a click, an Enter
    // and an arrow key cannot disagree about it.
    const patch = value === 'ahead' ? skipAheadPatch(ctx.state) : skipBackPatch(ctx.state);
    if (!patch) return;

    const next = ctx.setState(patch);
    rerenderInPlace(container, render, { ...ctx, state: next });
  }

  options.forEach((option, index) => {
    option.addEventListener('click', () => selectPosition(option.dataset.value));

    // ARROW KEYS MOVE AND SELECT, which is the radiogroup pattern's own
    // behaviour rather than a shortcut invented here: in a radio group, moving
    // the focus IS choosing. Home and End are the same move to the ends. Space
    // and Enter are left to the browser, which already fires `click` on a
    // <button> for both.
    option.addEventListener('keydown', (event) => {
      const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const first = event.key === 'Home';
      const last = event.key === 'End';
      if (!back && !forward && !first && !last) return;

      event.preventDefault();
      const target = first
        ? 0
        : last
          ? options.length - 1
          : (index + (forward ? 1 : -1) + options.length) % options.length;
      // Focus first so the move still happens when the target is unavailable
      // and `selectPosition` declines - the participant is not left with focus
      // on an option they have just navigated away from.
      options[target].focus();
      selectPosition(options[target].dataset.value);
    });
  });
}
