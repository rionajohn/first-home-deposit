/**
 * The pinned action bar (DECISIONS.md D39, superseding D17's reveal).
 *
 * The bar — primary button plus, on most screens, a secondary link — is
 * visible from the moment a screen paints and stays visible. It sits at the
 * bottom of the phone screen, above the tab bar, and the content scrolls
 * beneath it. D17 used to withhold it until the participant reached the end
 * of the content; that is gone, and why is in D39.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LEFT FOR THIS MODULE TO DECIDE
 * ---------------------------------------------------------------------------
 * Not visibility. Two things:
 *
 *   1. THE BAR'S MEASURED HEIGHT, published as `--action-bar-height` on the
 *      host. The bar is one or two buttons tall depending on the screen and
 *      grows with frame 33's text-size control, so the height the scroller
 *      has to reserve cannot be written down in the stylesheet.
 *
 *   2. WHICH OF TWO LAYOUT MODES THE SCREEN IS IN, published as
 *      `.actions-inline` on the host:
 *
 *        content overflows  ->  PINNED. The dock sits at the bottom of the
 *                               flex column, above the tab bar. The scroller
 *                               grows underneath it (negative margin) and
 *                               reserves its height as padding, so the last
 *                               real content still scrolls fully clear.
 *
 *        content fits       ->  INLINE. There is nothing to scroll, so
 *                               pinning the bar to the bottom would leave a
 *                               band of empty screen between the last card
 *                               and the buttons. The scroller stops growing,
 *                               and the dock follows the content directly.
 *
 * ---------------------------------------------------------------------------
 * THE TWO MODES CANNOT OSCILLATE, AND THAT IS ARITHMETIC RATHER THAN LUCK
 * ---------------------------------------------------------------------------
 * Switching mode changes the scroller's box AND its padding, which is exactly
 * the shape of feedback loop that made D17 choose the overlap in the first
 * place. It is safe here because the quantity this module tests is unchanged
 * by the switch. Writing S for the space the flex column leaves the scroller
 * when the dock is in flow, N for the content's natural height including the
 * screen inset, and H for the bar:
 *
 *   pinned   clientHeight = S + H      scrollHeight = N + H
 *   inline   clientHeight = min(N, S)  scrollHeight = N
 *
 * so `scrollHeight - clientHeight` is `N - S` in both modes. The predicate is
 * the same number before and after the switch, so a mode change produces one
 * more measurement, agrees with itself, and stops.
 *
 * ---------------------------------------------------------------------------
 * SHEETS ARE PINNED ONLY, AND NEED NO MODE
 * ---------------------------------------------------------------------------
 * A sheet's dock is `position: absolute` against a card that is sized by its
 * own content up to `max-height: 92%` (screens.css). A card that fits is
 * already exactly as tall as its content, so its bar is already sitting at the
 * end of it - there is no empty band to reclaim and nothing for an inline mode
 * to fix. `.actions-inline` is therefore only ever written to `.screen`.
 */

/**
 * Sub-pixel tolerance for "at the bottom" and "overflows".
 *
 * `scrollHeight` and `clientHeight` are integers, `scrollTop` is fractional,
 * and the framed view scales the whole frame by a non-integer factor — so an
 * exact comparison misses the bottom by fractions of a pixel. 2px is enough
 * for that rounding and far too small to fire early: 2px of a 390px-tall
 * scroller is not "reaching the end".
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
  const host = scroller.parentElement;
  // Only a full screen has two layout modes; see the header note on sheets.
  const modal = host ? host.classList.contains('screen') : false;
  let frame = 0;

  function apply() {
    frame = 0;

    // Publish the bar's measured height so the scroller can reserve exactly
    // that much (components.css / screens.css). Written only when it actually
    // differs: the value feeds a padding on the scroller, and rewriting it
    // every frame would retrigger the ResizeObserver that called us.
    if (host) {
      const measured = `${bar.offsetHeight}px`;
      if (host.style.getPropertyValue('--action-bar-height') !== measured) {
        host.style.setProperty('--action-bar-height', measured);
      }
    }

    const overflows = scroller.scrollHeight - scroller.clientHeight > TOLERANCE;
    const atBottom =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - TOLERANCE;

    // Pinned when there is something to scroll, inline when there is not.
    // `toggle` with an explicit force writes nothing when the class is already
    // in that state, so the ResizeObserver this switch wakes sees no second
    // change and the pair settles in one extra frame.
    if (modal) host.classList.toggle('actions-inline', !overflows);

    // The fade above the bar says "the content carries on under here". It
    // belongs to the case where that is true: content long enough to scroll,
    // and not yet scrolled to its end. The bar's own hairline is what marks
    // the edge at every other moment.
    if (dock) dock.classList.toggle('action-bar-dock--more-below', overflows && !atBottom);
  }

  // Coalesce to one measurement per frame: a scroll, a resize and a mutation
  // can all land in the same tick, and each of them reads layout.
  function update() {
    if (frame) return;
    frame = requestAnimationFrame(apply);
  }

  scroller.addEventListener('scroll', update, { passive: true });
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

  // Clear both published values before re-measuring. They are an inline
  // custom property and a class on the host, and `container.className =
  // 'screen'` in router.js resets classes but not inline styles — so
  // navigating from a screen that HAS an action bar to one that does not
  // (frames 01, 12, 19b, 20, 21 and 33) used to leave the old height behind, and
  // `.screen-content`'s negative margin then had no dock to be absorbed by.
  // Clearing first makes each property mean "there is a bar here, in this
  // state" rather than "there was one, once".
  container.style.removeProperty('--action-bar-height');
  container.classList.remove('actions-inline');
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
 *
 * `revealed` is gone with D17. There is no hidden state left to report.
 */
export function actionBarState(container) {
  return [...container.querySelectorAll('.action-bar')].map((bar) => {
    const scroller = scrollerFor(bar);
    const overflows = scroller
      ? scroller.scrollHeight - scroller.clientHeight > TOLERANCE
      : false;
    return {
      overflows,
      mode: bar.closest('.screen.actions-inline') ? 'inline' : 'pinned',
      affordance: !!bar.closest('.action-bar-dock--more-below'),
    };
  });
}
