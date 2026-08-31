/**
 * THE RENDERED SCALE OF THE PHONE FRAME. DECISIONS.md D92.
 *
 * The prototype is the instrument in a moderated think-aloud study, and the
 * pilot session on 31 August 2026 found it unreadable at 100% browser zoom:
 * the participant had run the whole session at 150% and said so at 32:32.
 * Every judgement they made about type size, colour weight and axis legibility
 * was therefore made at a magnification the next participant has no reason to
 * reproduce, which is a threat to comparability rather than a cosmetic
 * complaint.
 *
 * THE FIX IS MAGNIFICATION, NOT LAYOUT. The logical viewport stays fixed at
 * `--frame-width` x `--frame-height` (393x852, shell.css), so the internal
 * breakpoints, wrapping and line lengths resolve identically at every window
 * size; the frame is then scaled visually to fill the window it is given. A
 * fluid frame would have changed the layout inside it and made the findings
 * from one session uncomparable with the next.
 *
 * WHY THIS IS JAVASCRIPT AND NOT `clamp()` IN THE STYLESHEET. Two reasons, and
 * the second is the load-bearing one:
 *
 *   1. The scale is a length divided by a length. CSS can express that only
 *      through type-changing `calc()` division, which is CSS Values 4 and not
 *      uniformly supported. An unsupported expression makes the whole
 *      declaration invalid, and the failure mode is silent: no transform at
 *      all, on a browser nobody checked, in the middle of a session.
 *   2. `#app-frame` has to be given the frame's RENDERED height as a real
 *      layout box, because a transform does not resize one. The same number
 *      is needed as a scale factor and as a length, and it is derived once
 *      here rather than twice.
 *
 * WHAT IT DOES NOT DO: it never scales below 1.0. On a window shorter than the
 * frame the page scrolls instead (shell.css). Shrinking the frame would put
 * the prototype back below 100% and reintroduce the defect this exists to
 * remove - and the participant who cannot see the bottom of a phone knows it,
 * where the participant reading 8pt type does not.
 *
 * Every dimension below is READ FROM THE STYLESHEET rather than repeated here,
 * so `--frame-width`, `--frame-height`, `--frame-bezel` and the breakpoint keep
 * one definition each.
 */

/**
 * The bounds on the rendered scale.
 *
 * MIN is 1: never below the frame's natural size - see above.
 *
 * MAX is 1.5, and the figure is the pilot participant's own. 150% is the
 * magnification they chose for themselves and read the whole session at, so it
 * is the one upper bound in this build that is evidence rather than taste.
 * Uncapped, a 4K display would render the phone about 900px wide, which is
 * past any phone a participant has held and starts testing something else.
 */
const MIN_SCALE = 1;
const MAX_SCALE = 1.5;

/** How long the resize handler waits for the drag to settle, in ms. */
const SETTLE_MS = 100;

/**
 * NULL UNDER NODE, AND IT HAS TO BE. Four of this repo's test scripts are pure
 * Node with no browser (`g62`, `stage`, `skip-ahead`, and the model tests), and
 * `scripts/shots.mjs` imports the app's modules directly to derive the figures
 * it seeds. All of them reach this file through the import graph, so a bare
 * `document.documentElement` at module scope throws before any of them runs -
 * measured, not guessed: it did.
 */
const root = typeof document === 'undefined' ? null : document.documentElement;

/** A `--custom-property` off `:root`, in px, as a number. */
function pxVar(name) {
  const raw = getComputedStyle(root).getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function apply() {
  if (!root) return;
  const width = root.clientWidth || window.innerWidth;
  const height = root.clientHeight || window.innerHeight;

  const breakpoint = pxVar('--frame-breakpoint');
  const frameWidth = pxVar('--frame-width');
  const frameHeight = pxVar('--frame-height');
  const bezel = pxVar('--frame-bezel');
  const maxGutter = pxVar('--space-4xl');

  // Below the breakpoint the app runs frameless and fills the device it is on:
  // there is no frame to scale. The properties are removed rather than set to
  // 1, so the stylesheet's own fallbacks are what apply. Same on the reading
  // failing for any reason - the frame at its natural size is the safe state,
  // and it is the state the stylesheet already describes.
  if (
    breakpoint === null || frameWidth === null || frameHeight === null ||
    bezel === null || maxGutter === null || width < breakpoint
  ) {
    root.style.removeProperty('--frame-scale');
    root.style.removeProperty('--frame-gutter');
    return;
  }

  const totalWidth = frameWidth + bezel * 2;
  const totalHeight = frameHeight + bezel * 2;

  // THE GUTTER COLLAPSES BEFORE THE FRAME DOES. It is breathing room around a
  // frame that fits, not a reservation: on a window with less than
  // `--space-4xl` to spare above and below, the space it would have taken goes
  // to the frame instead. Without this a 900px-tall window - a maximised
  // browser on a 1080p display, the commonest session setup there is - would
  // scroll by 60px purely to hold two margins.
  const reserved = Math.max(0, Math.min(maxGutter, (height - totalHeight) / 2));

  // Height is what the scale is derived from, since the frame is far taller
  // than it is wide and height is what runs out first. Width is a second
  // bound rather than the driver, and exists only so a narrow-but-tall window
  // cannot scale the frame wider than the page can hold - which is what a
  // horizontal scrollbar would be.
  const byHeight = (height - reserved * 2) / totalHeight;
  const byWidth = (width - maxGutter * 2) / totalWidth;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(byHeight, byWidth)));

  // AND THEN THE GUTTER IS RE-DERIVED FROM WHAT THE FRAME ACTUALLY TOOK, so
  // the frame is centred in whatever is left rather than pinned `--space-4xl`
  // from the top with the remainder falling below it. The two differ only
  // where the cap binds: on a display tall enough to want more than 1.5, the
  // space the cap declined is split above and below instead of all landing
  // underneath. Zero on a window shorter than the frame, where there is
  // nothing to split and the page scrolls.
  const rendered = totalHeight * scale;
  const gutter = Math.max(0, (height - rendered) / 2);

  root.style.setProperty('--frame-scale', String(scale));
  root.style.setProperty('--frame-gutter', `${gutter}px`);
}

let timer = null;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(apply, SETTLE_MS);
}

if (root) apply();

// Debounced on the trailing edge: a window drag fires `resize` on every frame
// of the drag, and each recomputation rewrites two custom properties that
// invalidate layout for the whole frame. The frame lags the drag by a tenth of
// a second and is correct the moment it stops, which is the only moment anyone
// is looking at it.
//
// `orientationchange` is here for the tablets a session can be run from. It
// fires BEFORE the new dimensions are readable on some engines, so it goes
// through the same debounce rather than reading them straight away.
if (root) {
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
}

/**
 * The frame's current rendered scale, as a number. 1 when the app is frameless
 * or the frame is at its natural size.
 *
 * Read by anything that measures the page in DEVICE pixels and has to act in
 * LAYOUT pixels - `getBoundingClientRect()` returns the former and CSS lengths
 * are written in the latter, and under a transform the two differ. The custom
 * property is the single reading; nothing recomputes the scale for itself.
 */
export function frameScale() {
  if (!root) return 1;
  const value = Number.parseFloat(getComputedStyle(root).getPropertyValue('--frame-scale'));
  return Number.isFinite(value) && value > 0 ? value : 1;
}
