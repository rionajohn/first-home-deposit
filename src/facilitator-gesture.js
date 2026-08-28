/**
 * THE FACILITATOR GESTURE. A RESEARCH AFFORDANCE, NOT A FEATURE, AND UNLIKE
 * EVERY OTHER ONE IN THIS BUILD IT IS INVISIBLE.
 *
 * A long press on the DISABLED Profile tab opens `/settings` (frame 33). It
 * exists so a moderated session can reach the prototype controls and the reset
 * without typing a hash in front of a participant, which is worse than a
 * control they cannot see. See DECISIONS.md D54.
 *
 * TO REMOVE IT, in one pass:
 *   - this module
 *   - one import line and one call line in `src/router.js` (`mountBottomNav`)
 *   - `user-select: none` on `.bottom-nav__tab` in `src/css/components.css`
 *
 * It owns NO state key, NO content key, NO route and NO CSS block of its own,
 * and it does not appear in the accessibility tree. There is nothing to delete
 * anywhere else.
 *
 * ---------------------------------------------------------------------------
 * WHY THE DISABLED PROFILE TAB, AND NOT THE APP BAR
 * ---------------------------------------------------------------------------
 * The Figma node for frame 33 annotates "Reached by a long press on the app
 * bar", and `settings.js` recorded that as considered and rejected. Re-costed
 * against the code (D54), the tab wins on both counts that matter:
 *
 *   COVERAGE.     The Profile tab renders on 20 of 28 routes, the app bar on
 *                 19 - but the tab reaches the three calculator steps (09, 10,
 *                 11), which draw a step header rather than an `.app-bar`, and
 *                 the app bar's only exclusive routes are `/mip/running` (a
 *                 1.4s transient) and `/settings` itself.
 *   BLAST RADIUS. The app bar holds the back/close control, the most-pressed
 *                 button in the app, and a hesitant back-press is a normal
 *                 thing for a participant to do. The Profile tab is inert and
 *                 has no competing purpose at all.
 *
 * ---------------------------------------------------------------------------
 * A DISABLED BUTTON FIRES `pointerdown` BUT NOT `click`, AND THAT IS THE WHOLE
 * MECHANISM
 * ---------------------------------------------------------------------------
 * Measured in Chromium in both a mouse and a touch context: a press on
 * `<button disabled>` dispatches `pointerdown` (and `touchstart`) to the button
 * and up through its ancestors, while `mousedown` and `click` are suppressed -
 * activation events are not delivered to a disabled form control.
 *
 * THIS IS LOAD-BEARING, NOT INCIDENTAL. It is what lets the tab answer a
 * deliberate hold while remaining completely inert to a tap: there is no
 * activation path to collide with, so an accidental press cannot do anything at
 * all. If a later change makes this tab live - adding `profile` to
 * `NAVIGABLE_TABS` - `click` starts firing and this gesture must be reviewed at
 * the same time, because a tap and a hold would then both mean something.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DOES NOT DO
 * ---------------------------------------------------------------------------
 * IT ADDS NOTHING TO THE ACCESSIBILITY TREE. The tab keeps `disabled` and
 * `aria-disabled="true"`, stays out of the tab order, and renders identically.
 * No label, no accessible name, no announcement. `skip-ahead.js` carries the
 * opposite treatment and says why: a VISIBLE control that a keyboard or
 * screen-reader participant cannot reach is a different prototype for them than
 * for everyone else. This one is invisible to everyone, so no participant is
 * disadvantaged relative to another, and the typed URL survives unchanged as
 * the keyboard path. There is deliberately no keyboard equivalent.
 *
 * IT DOES NOT TOUCH THE RETURN PATH. `/settings` draws the back chevron bound
 * to `goBack`, and D32 chose that control anticipating this exact entry:
 * "a later hidden gesture in from the profile screen ... with no special case
 * for it".
 */

/**
 * How long the press has to be held. Long enough that no tap reaches it, short
 * enough to be unfussy with a participant watching. Not shared with
 * `sheet-drag.js`: that file's thresholds are about a product gesture's feel,
 * and this one is about not firing by accident.
 */
const HOLD_MS = 700;

/**
 * How far the pointer may travel before the press stops counting as a hold.
 * The tab bar is at the bottom edge, where a press is often the start of a
 * scroll or an edge swipe, and neither is this gesture.
 */
const MOVE_TOLERANCE_PX = 10;

/**
 * Wires the gesture onto the Profile tab inside `container`, if one is drawn.
 *
 * Called from `mountBottomNav` in `router.js`, which runs on every route that
 * carries the tab bar and re-runs on in-place re-renders - so the binding
 * follows the bar rather than the route, and a screen that redraws its own nav
 * gets it back automatically. The listeners live on the element, so they go
 * when the bar is replaced; nothing accumulates.
 *
 * POINTER DISCIPLINE COPIED FROM `sheet-drag.js`, for the same reasons it gives:
 * one pointer at a time by id, primary button only, and a press that starts on
 * something else is that something else's press. Pointer capture is NOT taken -
 * this gesture has nothing to track once it starts, and capturing on a disabled
 * control would be a surprising thing to leave behind if the timer is cancelled.
 */
export function bindSettingsGesture(container) {
  const tab = container.querySelector('.bottom-nav__tab[data-tab="profile"]');
  if (!tab) return;

  let pointerId = null;
  let timer = null;
  let startX = 0;
  let startY = 0;

  const cancel = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    pointerId = null;
  };

  tab.addEventListener('pointerdown', (event) => {
    if (pointerId !== null) return;
    if (event.button !== undefined && event.button !== 0) return;

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    timer = window.setTimeout(() => {
      cancel();
      window.location.hash = '#/settings';
    }, HOLD_MS);
  });

  tab.addEventListener('pointermove', (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
    if (moved > MOVE_TOLERANCE_PX) cancel();
  });

  // Every way a press can end without becoming a hold. `pointercancel` is the
  // one that matters on a phone: the browser fires it when a scroll or a system
  // gesture takes the pointer over, and without it the timer would still be
  // running after the participant's finger had been claimed by something else.
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    tab.addEventListener(type, (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      cancel();
    });
  }
}
