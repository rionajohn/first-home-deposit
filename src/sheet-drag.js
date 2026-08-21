/**
 * Drag-to-dismiss for the seven sheets (03b, 10c, 13b, 29, 30, 31, 32).
 *
 * SPEC.md's transition rules already call for it — "Sheets (03b, 10c, 13b,
 * 29, 30, 31, 32): rise from bottom over a dimmed scrim; dismiss by
 * drag-down or scrim tap" — and every one of those sheets already draws the
 * grabber that advertises it (`.bottom-sheet__drag-handle` on 03b/10c/13b,
 * the same bar inside `.bottom-sheet__header` on 29-32). This module is what
 * makes the grabber do the thing it looks like it does; until now it was
 * decoration.
 *
 * THE RULE THAT MATTERS: a drag never closes a sheet by itself.
 *
 * Closing a sheet is not the same as changing the hash. 13b sets
 * `ltvVideoSeen` on close, so the explainer row it returns to reads
 * "watched"; 03b returns to whichever screen set `returnFrame`; 10c's
 * dismiss is "Keep going", which deliberately leaves `journeyPaused` alone
 * (build-spec.md section 1: only 10c's own "Leave" sets it). A gesture that
 * merely navigated would leave the session record saying a participant
 * never saw something they did see — a silent data error, not a visual one,
 * and not one anybody would catch by looking at the screen.
 *
 * So a completed drag ends by clicking the sheet's own dismiss control:
 * exactly the element the participant would have tapped, running exactly
 * the handler that element already carries. There is no second close path
 * to keep in sync, and a sheet added later inherits the behaviour by
 * drawing the same markup — nothing here is per-screen. It is the same
 * mechanism router.js's Escape key already uses, which is why
 * `dismissControlFor` lives here and is imported there rather than the
 * selector being written out twice.
 *
 * Accessibility: the grabber is not a control and is not focusable, so no
 * route depends on the gesture — every sheet keeps its visible close
 * control and its Escape key. SPEC.md's "no iOS-only-gesture-only routes"
 * rule is satisfied by construction.
 */

/**
 * How far down the sheet has to be released to close: a quarter of its own
 * height, with a floor so a short sheet (10c is a heading and one line of
 * body copy) still needs a deliberate pull rather than a twitch. SPEC.md
 * gives the gesture but no threshold — recorded in DECISIONS.md D18.
 */
const DISMISS_FRACTION = 0.25;
const DISMISS_FLOOR_PX = 72;

/**
 * A flick closes regardless of distance: released while still moving down
 * at 0.5px/ms (500px/s) or more. Without this, a fast short flick — the way
 * most people actually dismiss a sheet — would spring back and read as the
 * gesture having failed.
 */
const DISMISS_VELOCITY_PX_PER_MS = 0.5;
const MIN_FLICK_PX = 8;

/**
 * Backstop for the close/settle animation: `transitionend` does not fire if
 * the transition never starts (an element already at its target value), and
 * a sheet left half-open because no event arrived would be a dead screen.
 * Comfortably longer than --duration-standard (300ms).
 */
const TRANSITION_GUARD_MS = 450;

/**
 * The control whose click IS this sheet's close behaviour: the dismiss
 * control inside the dialog if it draws one (29-32's close glyph, 13b's
 * "Got it", 10c's "Keep going", 03b's "Cancel"), otherwise the scrim, which
 * every sheet binds to the same handler. Container-scoped rather than
 * document-scoped so it can only ever find the live screen's own control.
 */
export function dismissControlFor(container) {
  const dialog = container.querySelector('[role="dialog"]');
  if (!dialog) return null;
  return (
    dialog.querySelector('[data-action="dismiss"]') ||
    container.querySelector('.sheet-scrim[data-action="dismiss"]')
  );
}

function prefersReducedMotion() {
  // Read at release, not cached at mount: a facilitator changing the OS
  // setting mid-session gets the new behaviour on the next gesture.
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Runs `done` once: on the element's own transform transitionend, or on the guard timeout. */
function afterTransform(el, done) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    el.removeEventListener('transitionend', onEnd);
    done();
  };
  const onEnd = (event) => {
    if (event.target === el && event.propertyName === 'transform') finish();
  };
  el.addEventListener('transitionend', onEnd);
  window.setTimeout(finish, TRANSITION_GUARD_MS);
}

/**
 * Wires the grabber on whatever sheet is currently rendered. A no-op on a
 * screen with no sheet, and on a sheet already wired — router.js calls this
 * both after a hash-driven render and from its mutation observer (the same
 * two places the action bar is mounted), so a sheet that re-renders itself
 * in place gets its handle back without any screen module knowing.
 */
export function mountSheetDrag(container) {
  const overlay = container.querySelector('.sheet-overlay');
  if (!overlay) return;

  const sheet = overlay.querySelector('[role="dialog"].bottom-sheet');
  if (!sheet || sheet.dataset.dragMounted === 'true') return;

  const handle = sheet.querySelector('.bottom-sheet__drag-handle, .bottom-sheet__header');
  if (!handle) return;

  sheet.dataset.dragMounted = 'true';
  const scrim = overlay.querySelector('.sheet-scrim');

  let pointerId = null;
  let startY = 0;
  let startOffset = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let offset = 0;
  let height = 0;
  let closing = false;

  /**
   * Where the card is sitting right now, in px below its resting position.
   * Non-zero only when the grab comes while the sheet is still rising: the
   * dragging class turns the entry animation off, so without this the card
   * would jump to its resting position under the finger that just caught it
   * halfway up.
   */
  const currentOffset = () => {
    const transform = window.getComputedStyle(sheet).transform;
    if (!transform || transform === 'none') return 0;
    return Math.max(0, new DOMMatrixReadOnly(transform).m42);
  };

  const paint = () => {
    sheet.style.transform = offset > 0 ? `translateY(${offset}px)` : '';
    if (!scrim) return;
    // The scrim lightens as the sheet is pulled away, so the gesture reads
    // as one connected movement rather than a card sliding over a fixed
    // grey pane. Never to zero while dragging — the screen behind must not
    // look reachable until the sheet has actually gone.
    const progress = height > 0 ? Math.min(1, offset / height) : 0;
    scrim.style.opacity = String(1 - 0.6 * progress);
  };

  const clearDragState = () => {
    pointerId = null;
    offset = 0;
    velocity = 0;
    overlay.classList.remove('sheet-overlay--dragging');
  };

  const settle = () => {
    // Reduced motion: the sheet still followed the finger, it just does not
    // spring back — it is simply where it started again.
    if (offset === 0 || prefersReducedMotion()) {
      sheet.style.transform = '';
      if (scrim) scrim.style.opacity = '';
      clearDragState();
      return;
    }
    overlay.classList.add('sheet-overlay--settling');
    clearDragState();
    sheet.style.transform = '';
    if (scrim) scrim.style.opacity = '';
    afterTransform(sheet, () => overlay.classList.remove('sheet-overlay--settling'));
  };

  const dismiss = () => {
    const control = dismissControlFor(container);
    // Cannot happen with any sheet in the section 3 inventory — every one of
    // them draws at least a scrim bound to dismiss — but a sheet stranded
    // half-open would be worse than a gesture that did nothing.
    if (!control) {
      settle();
      return;
    }

    closing = true;
    if (prefersReducedMotion()) {
      clearDragState();
      control.click();
      return;
    }

    overlay.classList.add('sheet-overlay--closing');
    clearDragState();
    sheet.style.transform = `translateY(${height}px)`;
    if (scrim) scrim.style.opacity = '0';
    // The click lands once the sheet is off-screen, so the close it runs —
    // state change and route change alike — happens exactly once, on the
    // same path a tap takes.
    afterTransform(sheet, () => control.click());
  };

  handle.addEventListener('pointerdown', (event) => {
    if (closing || pointerId !== null) return;
    if (event.button !== undefined && event.button !== 0) return;
    // 29-32 put their close glyph inside the header. A press that starts on
    // a control is that control's press, not a drag.
    if (event.target.closest('button, a, input, select, textarea')) return;

    pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);
    startY = event.clientY;
    lastY = event.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
    height = sheet.offsetHeight;
    // Read before the class lands, while the entry animation (or an
    // interrupted settle) is still the thing positioning the card.
    startOffset = currentOffset();
    offset = startOffset;
    overlay.classList.remove('sheet-overlay--settling');
    overlay.classList.add('sheet-overlay--dragging');
    paint();
  });

  handle.addEventListener('pointermove', (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const dt = event.timeStamp - lastTime;
    if (dt > 0) velocity = (event.clientY - lastY) / dt;
    lastY = event.clientY;
    lastTime = event.timeStamp;
    // Down only. Dragging up past the resting position would lift the card
    // off the bottom edge of the phone screen and show scrim beneath it.
    offset = Math.max(0, startOffset + (event.clientY - startY));
    paint();
  });

  handle.addEventListener('pointerup', (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);

    const threshold = Math.max(DISMISS_FLOOR_PX, height * DISMISS_FRACTION);
    const flicked = velocity >= DISMISS_VELOCITY_PX_PER_MS && offset > MIN_FLICK_PX;
    if (offset >= threshold || flicked) {
      dismiss();
    } else {
      settle();
    }
  });

  handle.addEventListener('pointercancel', (event) => {
    // The system took the pointer (a call, a notification). Not a decision
    // to close — put the sheet back.
    if (pointerId === null || event.pointerId !== pointerId) return;
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    settle();
  });
}
