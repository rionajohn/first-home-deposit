/**
 * THE ANCHOR RULES, IN ONE PLACE. DECISIONS.md D155 wrote them; D159 moved them
 * here so `scripts/shots.mjs` and `scripts/pick-cover.mjs` run the same code.
 *
 * A picker that re-implemented these would be a second copy that agrees with
 * the harness only until one of them is edited, and nothing would notice the
 * day they stopped agreeing. So the picker does not approximate the harness's
 * checks: it runs this function, the one `shots.mjs` runs.
 *
 * `anchorRules` RUNS IN THE PAGE, NOT IN NODE. It is handed to Playwright's
 * `page.evaluate` (shots.mjs) or injected as source text (the picker), so it
 * must stay SELF-CONTAINED: no imports, nothing referenced from this module's
 * scope, only its argument and the page's own globals. A helper moved outside
 * it would be undefined in the page.
 *
 * Four operations on the active scroller (`.bottom-sheet__content`, or
 * `.screen-content`), in layout px except `region`:
 *
 *   region   The clear part of the scroller and the `start` line, in viewport
 *            px as rendered, for the picker's overlay. Moves nothing.
 *            `{ top, bottom, startLine }`.
 *   resolve  Which element the selector names and the `scrollTop` the requested
 *            alignment needs. Moves nothing. `{ top, height, want, max }`.
 *   place    `resolve`, then write that `scrollTop` and confirm it held.
 *            `{ top, height, scrollTop, max }`.
 *   inspect  Is the scroller still at `want`, and is the anchor WHOLLY VISIBLE
 *            between whatever is pinned above the scroller and whatever is
 *            pinned below it, including the dock's `--more-below` fade?
 *            `{}` when it is.
 *
 * Every failure returns `{ error }`, a phrase that reads after `--scroll "<sel>"
 * on <route>`. The caller decides whether that throws (the harness) or is shown
 * as a warning (the picker).
 *
 * THE OFFSET IS MEASURED FROM THE SCROLLER, NOT FROM `offsetTop`. `offsetTop` is
 * relative to the element's offset parent, and `.screen-content` is not
 * positioned, so that parent is `.screen` (the app bar and top inset included -
 * 115px out on /home) or whatever positioned box sits between (a table on
 * /learn/ltv, 492px out). The position is taken from the two rendered boxes
 * instead, divided by the scroller's own rendered-to-layout ratio, so it is in
 * the layout px `scrollTop` is written in whatever `--frame-scale` is (D92) - the
 * reference is the scroller, and it is named here.
 *
 * `scrollTop` is written directly rather than through `scrollIntoView`, which
 * also scrolls every scrollable ancestor - and at framed widths `body` is one,
 * so it could move the page under a `--cover` clip.
 *
 * FAILS, rather than placing anywhere else, when the selector is invalid,
 * matches nothing, matches more than one element (a new match earlier on the
 * screen would otherwise move the anchor silently), matches outside the active
 * scroller, or needs a `scrollTop` the scroller cannot reach - an anchor too
 * near either end for the requested alignment.
 *
 * `inspect` reads the fade's height from the dock's own `::before`, not from a
 * number written here.
 */
export function anchorRules({ op, selector, align, want }) {
  const s = document.querySelector('.bottom-sheet__content, .screen-content');

  // The part of the scroller clear of what is pinned above and below it,
  // including the dock's `--more-below` fade, in viewport px as rendered.
  // `inspect` checks an anchor against it; `region` hands it to the picker's
  // overlay so what is drawn is what is checked.
  const clearRegion = () => {
    const sr = s.getBoundingClientRect();
    const k = sr.height / s.offsetHeight;
    let visTop = sr.top + s.clientTop * k;
    let visBottom = visTop + s.clientHeight * k;
    let seenScroller = false;
    for (const c of s.parentElement.children) {
      if (c === s) { seenScroller = true; continue; }
      const pos = getComputedStyle(c).position;
      const r = c.getBoundingClientRect();
      if (pos === 'absolute' || pos === 'fixed' || r.height === 0) continue;
      if (!seenScroller) {
        visTop = Math.max(visTop, r.bottom);
      } else {
        let edge = r.top;
        if (c.classList.contains('action-bar-dock--more-below')) {
          edge -= (parseFloat(getComputedStyle(c, '::before').height) || 0) * k;
        }
        visBottom = Math.min(visBottom, edge);
      }
    }
    return { sr, k, visTop, visBottom };
  };

  if (op === 'region') {
    if (!s) return { error: 'this screen has no .bottom-sheet__content or .screen-content to scroll' };
    const { sr, k, visTop, visBottom } = clearRegion();
    const padTop = parseFloat(getComputedStyle(s).paddingTop) || 0;
    // Where `start` puts an anchor's top edge: the scroller's top padding.
    return { top: visTop, bottom: visBottom, startLine: sr.top + (s.clientTop + padTop) * k };
  }

  if (op === 'inspect') {
    const el = s && document.querySelector(selector);
    if (!s || !el || !s.contains(el)) return { error: 'is no longer on the screen, inside the scroller' };
    if (Math.abs(s.scrollTop - want) > 1) return { error: `moved: the scroller was left at ${want} and is now at ${s.scrollTop}` };

    const { sr, k, visTop, visBottom } = clearRegion();
    const er = el.getBoundingClientRect();
    const tol = 0.5 * k;
    if (er.top < visTop - tol || er.bottom > visBottom + tol) {
      const px = (v) => Math.round((v - sr.top) / k);
      return { error: `is not wholly visible: it spans ${px(er.top)} to ${px(er.bottom)}px of the scroller, and the part clear of the pinned header, dock and fade is ${px(visTop)} to ${px(visBottom)}px` };
    }
    return {};
  }

  // resolve and place
  if (!s) return { error: 'this screen has no .bottom-sheet__content or .screen-content to scroll' };
  let matches;
  try {
    matches = document.querySelectorAll(selector);
  } catch {
    return { error: 'is not a valid CSS selector' };
  }
  if (matches.length === 0) return { error: 'matches nothing on this screen' };
  if (matches.length > 1) return { error: `matches ${matches.length} elements; an anchor must match exactly one` };
  const el = matches[0];
  const scroller = `.${[...s.classList].join('.')}`;
  if (el === s || !s.contains(el)) return { error: `matches an element outside the active scroller ${scroller}` };

  const sr = s.getBoundingClientRect();
  const k = sr.height / s.offsetHeight;
  const er = el.getBoundingClientRect();
  const top = (er.top - sr.top) / k - s.clientTop + s.scrollTop;
  const height = er.height / k;
  const padTop = parseFloat(getComputedStyle(s).paddingTop) || 0;
  const target = Math.round(align === 'start' ? top - padTop : top + height / 2 - s.clientHeight / 2);
  const max = s.scrollHeight - s.clientHeight;
  if (target < 0 || target > max) {
    return { error: `needs scrollTop ${target} for --scroll-align=${align}, but ${scroller} only scrolls 0 to ${max} - the anchor is too near that end` };
  }
  if (op === 'resolve') {
    return { top: Math.round(top * 100) / 100, height: Math.round(height * 100) / 100, want: target, max };
  }
  s.scrollTop = target;
  if (Math.abs(s.scrollTop - target) > 1) return { error: `was scrolled to ${target} but ${scroller} settled at ${s.scrollTop}` };
  return { top: Math.round(top * 100) / 100, height: Math.round(height * 100) / 100, scrollTop: s.scrollTop, max };
}

/**
 * What `--scroll` accepts as an anchor rather than `top` or `end`: a selector
 * starting `.`, `#` or `[`, with no comma - the option splits its value on
 * commas, so a selector containing one never arrives whole.
 */
export function isAnchorSelector(value) {
  return /^[.#[]/.test(value) && !value.includes(',');
}
