/**
 * Reveal-on-reach for the pinned action bar (DECISIONS.md D17).
 *
 * The action bar — primary button plus, on most screens, a secondary link —
 * used to be visible from the moment a screen loaded. It now appears only
 * once the participant has reached the end of the content, on screens that
 * have an end to reach.
 *
 * ---------------------------------------------------------------------------
 * TWO CASES, ONE PREDICATE
 * ---------------------------------------------------------------------------
 *   Content overflows its scroller  ->  hidden on load, revealed at the
 *                                       bottom, hidden again on scrolling
 *                                       back up. Not sticky once revealed.
 *   Content fits without scrolling  ->  revealed immediately and stays
 *                                       revealed. There is no bottom to
 *                                       reach, so no gesture is waited for.
 *
 * Which case a screen is in is never decided once. It is recomputed whenever
 * anything can change the content height — a disclosure opening, a state
 * variant rendering, frame 33's text-size control, a viewport resize — so a
 * screen that fits when its disclosures are closed and overflows when one is
 * expanded switches behaviour correctly, and back again.
 *
 * ---------------------------------------------------------------------------
 * WHY OPACITY AND NOT visibility: hidden
 * ---------------------------------------------------------------------------
 * The brief asked for `visibility` and `opacity` so the bar stays focusable.
 * `visibility: hidden` does the opposite: it removes an element from the
 * accessibility tree AND makes it unfocusable, which is exactly the
 * non-negotiable this feature has to satisfy — a keyboard participant must
 * never be unable to proceed. So the hidden state is `opacity: 0` plus
 * `pointer-events: none`:
 *
 *   - opacity 0            invisible, but still rendered, still focusable,
 *                          still in the accessibility tree.
 *   - pointer-events none  a tap where the invisible bar sits passes through
 *                          instead of hitting a button nobody can see.
 *   - no display/visibility change, ever, while the screen is active.
 *
 * Focus is then the third way in, alongside "fits" and "at the bottom": while
 * focus is anywhere inside the bar the bar is revealed, whatever the scroll
 * position says. Tabbing to it also scrolls the content to its end, so what
 * the participant sees agrees with why the bar appeared, and so scrolling
 * does not immediately hide the control they are standing on.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT: THE CONTENT SCROLLS UNDER THE BAR
 * ---------------------------------------------------------------------------
 * The bar overlaps the end of the scroller rather than carving a slot out of
 * it, and the scroller carries a matching bottom padding so the last real
 * content still clears it. The scroller's height is therefore the same
 * whether the bar is showing or not.
 *
 * That constancy is the point. Collapsing the bar when hidden would shorten
 * the scroller, which changes whether the content overflows, which changes
 * whether the bar should show — and on a screen that overflows by less than
 * the bar's own height (09a overflows by 104px, 13b by 61px, against a ~136px
 * bar) that loop genuinely oscillates. Overlapping makes "reaching the
 * bottom" a fact about the screen rather than about the bar, and means the
 * reveal never shifts the content being read.
 *
 * This module measures the bar and publishes `--action-bar-height` on the
 * host; components.css does the overlapping with it.
 */

/**
 * Sub-pixel tolerance for "at the bottom" and "overflows".
 *
 * `scrollHeight` and `clientHeight` are integers, `scrollTop` is fractional,
 * and the framed view scales the whole frame by a non-integer factor — so an
 * exact comparison misses the bottom by fractions of a pixel and the bar
 * never appears. 2px is enough for that rounding and far too small to fire
 * early: 2px of a 390px-tall scroller is not "reaching the end".
 */
const TOLERANCE = 2;

/** Active controllers, disconnected before each re-mount so nothing leaks. */
let controllers = [];

function disconnectAll() {
  for (const controller of controllers) controller.destroy();
  controllers = [];
}

/**
 * The scroller an action bar belongs to. `.screen-content` for a full
 * screen, `.bottom-sheet__content` for a sheet — both are the bar's own
 * sibling inside the same parent, so one lookup covers both without the
 * controller knowing which kind of screen it is on.
 */
function scrollerFor(bar) {
  // Past the dock, not inside it: the bar's own parent is `.action-bar-dock`,
  // and the scroller is the dock's sibling — both are children of `.screen`
  // or of `.bottom-sheet`.
  const dock = bar.closest('.action-bar-dock');
  const host = (dock || bar).parentElement;
  if (!host) return null;
  return host.querySelector(':scope > .screen-content, :scope > .bottom-sheet__content');
}

function createController(bar) {
  const scroller = scrollerFor(bar);
  if (!scroller) return null;

  const dock = bar.closest('.action-bar-dock');
  let focusInside = false;
  let frame = 0;

  function apply() {
    frame = 0;

    // Publish the bar's measured height so the scroller can overlap it by
    // exactly that much (components.css). One or two buttons tall depending
    // on the screen, and it changes with the text-size control, so it is
    // measured rather than assumed. Written only when it actually differs:
    // the value feeds a padding on the scroller, and rewriting it every frame
    // would retrigger the ResizeObserver that called us.
    const host = scroller.parentElement;
    if (host) {
      const measured = `${bar.offsetHeight}px`;
      if (host.style.getPropertyValue('--action-bar-height') !== measured) {
        host.style.setProperty('--action-bar-height', measured);
      }
    }

    const overflows = scroller.scrollHeight - scroller.clientHeight > TOLERANCE;
    const atBottom =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - TOLERANCE;

    // Three independent reasons to show it. "Fits" and "focus inside" both
    // hold regardless of scroll position; only the middle one is a gesture.
    const revealed = !overflows || atBottom || focusInside;

    bar.classList.toggle('action-bar--revealed', revealed);
    // The affordance says "there is more below". It belongs only to the case
    // where that is true and the bar is not already saying it.
    if (dock) dock.classList.toggle('action-bar-dock--more-below', overflows && !revealed);
  }

  // Coalesce to one measurement per frame: a scroll, a resize and a mutation
  // can all land in the same tick, and each of them reads layout.
  function update() {
    if (frame) return;
    frame = requestAnimationFrame(apply);
  }

  function onFocusIn() {
    focusInside = true;
    // Reaching the bar by keyboard is reaching the end of the content, so
    // take the participant there rather than revealing a control floating
    // below content they have not seen.
    scroller.scrollTop = scroller.scrollHeight;
    apply();
  }

  function onFocusOut(event) {
    // relatedTarget is where focus is going. Staying inside the bar (primary
    // -> secondary) is not leaving it.
    if (event.relatedTarget && bar.contains(event.relatedTarget)) return;
    focusInside = false;
    update();
  }

  scroller.addEventListener('scroll', update, { passive: true });
  bar.addEventListener('focusin', onFocusIn);
  bar.addEventListener('focusout', onFocusOut);
  window.addEventListener('resize', update);

  // Height changes come from three directions and each needs a different
  // observer:
  //   - the scroller's own box            (viewport resize, frame scale)
  //   - the height of what is inside it   (a disclosure opening, a longer
  //                                        state variant, text-size change)
  //   - children being added or removed   (frame 03's account list rebuilding
  //                                        itself in place without a
  //                                        re-render)
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(scroller);

  function observeChildren() {
    for (const child of scroller.children) resizeObserver.observe(child);
  }
  observeChildren();

  const mutationObserver = new MutationObserver(() => {
    observeChildren();
    update();
  });
  mutationObserver.observe(scroller, { childList: true, subtree: true, attributes: true });

  apply();

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', update);
      bar.removeEventListener('focusin', onFocusIn);
      bar.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    },
  };
}

/**
 * Wires every action bar currently in `container`. Safe to call as often as
 * the DOM changes: it tears down the previous controllers first, so a screen
 * that re-renders itself does not accumulate listeners on detached nodes.
 *
 * Called from router.js — on each hash-driven navigation and from the same
 * MutationObserver that re-mounts the bottom nav, which is what catches the
 * screens that rebuild themselves from a toggle handler.
 */
export function mountActionBars(container) {
  disconnectAll();

  // Clear the measured height before re-measuring. It is an inline custom
  // property on the host, and `container.className = 'screen'` in router.js
  // resets classes but not inline styles — so navigating from a screen that
  // HAS an action bar to one that does not (frame 12, 01, 19b, 33) used to
  // leave the old value behind. `.screen-content`'s negative margin then had
  // no dock to be absorbed by, and the content grew past the tab bar and into
  // the reserved safe-area band. Clearing first makes the property mean
  // "there is a bar here, this tall" rather than "there was one, once".
  container.style.removeProperty('--action-bar-height');
  for (const sheet of container.querySelectorAll('.bottom-sheet')) {
    sheet.style.removeProperty('--action-bar-height');
  }

  for (const bar of container.querySelectorAll('.action-bar')) {
    const controller = createController(bar);
    if (controller) controllers.push(controller);
  }
}

/**
 * Test/verification hook: what state each action bar is in right now, without
 * reaching into class names from outside. Used by the verification scripts so
 * they assert on the controller's own view rather than on a CSS detail.
 */
export function actionBarState(container) {
  return [...container.querySelectorAll('.action-bar')].map((bar) => {
    const scroller = scrollerFor(bar);
    const overflows = scroller
      ? scroller.scrollHeight - scroller.clientHeight > TOLERANCE
      : false;
    return {
      overflows,
      revealed: bar.classList.contains('action-bar--revealed'),
      affordance: !!bar.closest('.action-bar-dock--more-below'),
    };
  });
}
