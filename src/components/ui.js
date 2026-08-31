/**
 * Shared building blocks used by 2+ screens (SPEC.md file structure rule —
 * introduced here rather than speculatively, because the app bar, action
 * bar, info banner, flag row and provenance caption all appear on every
 * screen built this session and are already specified as recurring
 * components in build-spec.md's frame descriptions).
 *
 * Every function here returns an HTML string. None of them binds an event
 * listener — the screen module that renders the string queries for its
 * `data-action` after inserting it into the DOM and wires the listener
 * itself, the same pattern src/screens/home.js already established.
 */

import { goBack, exitFlow } from '../router.js';
import { formatDigits } from '../format.js';
import { frameScale } from '../shell-scale.js';
import {
  arrowLeft,
  checkmark,
  checkmarkCircle,
  chevronRight,
  circle,
  circleDot,
  chevronDown,
  chevronUp,
  exclamationTriangle,
  flag as flagIcon,
  infoCircle,
  starCircle,
  starCircleDashed,
  starCircleFill,
  xmark,
  TAB_ICONS,
  TAB_ICONS_ACTIVE,
} from '../icons.js';

/**
 * App bar: a left icon (back arrow, close/X, or none), a centred title, and
 * an empty right cell to keep the title visually centred. `left` is null on
 * frame 01 (bottom-nav root screen, no app bar back per build-spec.md's
 * "Assumed" row), 'back' or 'close' everywhere else depending on which icon
 * the reference PNG for that frame actually draws.
 *
 * The hit target is widened to the 48px minimum via padding on the button
 * itself; the icon glyph stays visually centred at the same position the
 * Figma 44px-wide cell draws it at, so this is a touch-target compliance
 * change, not a visual one.
 */
export function appBarHTML({ title, left = null, appBarLabels }) {
  // Both leading controls render at the same size and weight. They did not
  // before — back.svg drew at 24px and close.svg at 20px in the same 44px
  // cell, on screens sitting side by side in the flow.
  const iconMarkup = left === 'back'
    ? arrowLeft({ size: 'title3', className: 'app-bar__icon' })
    : left === 'close'
      ? xmark({ size: 'title3', className: 'app-bar__icon' })
      : '';
  const label = left === 'close' ? appBarLabels?.closeLabel : appBarLabels?.backLabel;

  // ONE CELL, TWO CONTROLS, TWO ACTIONS. The chevron and the X sit in the same
  // 44px cell and used to carry the same `data-action`, which meant the same
  // handler, which meant the X went back one screen instead of leaving the
  // journey. The glyph was the only thing that differed. They are separated
  // here, at the point the glyph is chosen, so the markup cannot say "close"
  // and behave like "back" again.
  const action = left === 'close' ? 'app-bar-close' : 'app-bar-back';

  const leftCell = left
    ? `<button type="button" class="app-bar__cell app-bar__cell--action" data-action="${action}" aria-label="${label}">${iconMarkup}</button>`
    : '<div class="app-bar__cell"></div>';

  return `
    <header class="app-bar" role="banner">
      ${leftCell}
      <h1 class="app-bar__title">${title}</h1>
      <div class="app-bar__cell"></div>
    </header>
  `;
}

/**
 * Bank tab bar (Figma frame 01's own bottom navigation).
 *
 * Drawn in the reference set on frame 01 alone. DECISIONS.md D11 keeps it on
 * every full-screen journey screen as well, so that a participant who has
 * gone several screens deep always has one visible, always-in-the-same-place
 * route back to frame 01 rather than only a chain of back taps. Because it
 * is the same five-tab component frame 01 already draws, the journey reads
 * as sitting inside a bank app rather than having grown a control of its
 * own — see D11 for why it is a deliberate deviation from the wireframes and
 * exempt from the screenshot-comparison pass.
 *
 * THREE TABS RESOLVE: Home, Goals, and — since the deposit tracker is the
 * bank's own view of how this goal is going — Insights, which lands on
 * /tracker. Payments and Profile stay exactly as inert here as they already
 * are on frame 01: they are the surrounding bank app, out of prototype
 * scope, so they are rendered `disabled` and hidden from assistive
 * technology rather than left as tappable dead ends. Tapping the tab you are
 * already on is a no-op re-navigation to the route already showing, which is
 * the standard tab-bar behaviour for the active tab.
 *
 * INSIGHTS IS THE ONLY WAY INTO THE TRACKER FROM THE BAR, and the tracker is
 * the only way into the Mortgage in Principle flow (tracker.js's action bar).
 * The bar itself carries no route to /mip and must not gain one: one entry
 * into that flow is the whole point of keeping it on the tracker.
 *
 * `active` names which tab is lit. It is a parameter rather than a constant
 * because the bar is genuinely a bank tab bar now: /goals is the bank's own
 * goals area, and a tab bar that showed Home lit while the participant stood
 * in Goals would be telling them they were somewhere they were not. Defaults
 * to 'home', so every existing caller is unchanged.
 *
 * `NAVIGABLE_TABS` is the single list both this function and router.js's
 * `mountBottomNav` read — one place decides which tabs are live, so a tab
 * cannot be rendered enabled here and left unbound there (or the reverse,
 * which is worse: a bound listener on a `disabled` button that never fires).
 *
 * router.js mounts this on every non-excluded route and wires the live tabs;
 * no screen module needs to render or bind it.
 *
 * THE DISABLED PROFILE TAB ANSWERS A LONG PRESS, AND THAT IS DELIBERATE. It
 * opens /settings - see `src/facilitator-gesture.js`, bound from
 * `mountBottomNav`, and DECISIONS.md D54. A disabled button fires `pointerdown`
 * but NOT `click`, which is exactly what makes the gesture safe: the tab stays
 * completely inert to a tap and answers only a deliberate 700ms hold. **Do not
 * "fix" the tab by removing its `disabled` attribute or by adding `profile` to
 * `NAVIGABLE_TABS`** - either would start delivering `click` and put a tap and
 * a hold in competition. If the tab is ever made live, review that module in
 * the same change.
 */
export const NAVIGABLE_TABS = { home: '/home', goals: '/goals', insights: '/tracker' };

/**
 * THREE STATES, NOT TWO.
 *
 *   active     the current route IS this tab's destination. Full emphasis:
 *              the indicator above the icon, a bold label, and the filled
 *              icon variant. At most one tab, and only on /home and /goals.
 *   enabled    tappable, but not where the participant is. Identical to a
 *              disabled tab at rest — same colour, same weight, outline icon,
 *              no indicator. It says it is tappable by responding to touch
 *              (components.css), not by looking different standing still.
 *   disabled   Payments, Insights, Profile. Reduced contrast, not focusable,
 *              not tappable.
 *
 * The bar previously had two treatments and the difference between them was
 * an accident: nothing set `color` on a tab, so an enabled tab inherited the
 * full-strength label colour while a disabled one was greyed by the USER
 * AGENT's own disabled styling. That made Goals on /home — enabled, not
 * current — draw exactly as dark as Home, so it read as selected when it was
 * not. Every state now sets its own colour, and the UA has no say.
 *
 * `active` is nullable and defaults to null: most screens in this app are
 * inside the "Your first home" journey, which as far as the surrounding bank
 * app is concerned is not any of its five tabs. Lighting Home on all of them
 * would have claimed the participant was on the bank's home screen when they
 * were ten steps into a mortgage calculator.
 *
 * ARIA CARRIES THE SAME THREE STATES, because the visual treatment
 * deliberately does not distinguish enabled from disabled:
 *   - `aria-current="page"` on the active tab only.
 *   - `aria-disabled="true"` on the three disabled ones, alongside the real
 *     `disabled` attribute. `disabled` is what makes them unfocusable and
 *     untappable; `aria-disabled` is what states it, since these three were
 *     previously `aria-hidden="true"` and so absent from the accessibility
 *     tree entirely — a screen-reader participant could not tell there were
 *     five tabs, let alone which were which. `tabindex="-1"` went with it:
 *     redundant beside `disabled`, and misleading to leave in.
 */
export function bottomNavHTML(labels, { active = null } = {}) {
  const tab = (id, label) => {
    const isLive = Object.prototype.hasOwnProperty.call(NAVIGABLE_TABS, id);
    const isActive = isLive && id === active;
    // One hint per live tab, looked up by id rather than chosen by a ternary.
    // The ternary this replaces returned the Goals hint for every tab that
    // was not Home, which was correct only while Goals was the sole other
    // live tab — Insights would have announced itself as "Your goals".
    const hint = labels[`${id}TabHint`];
    // Fall back to the outline drawing rather than throwing if a live tab
    // has no filled twin. Making Insights live without adding `diamondFill`
    // made this `undefined(...)`, which took the whole tab bar down on the
    // one route the tab is lit. The fallback loses a cue; it does not lose
    // the bar.
    const glyph = (isActive ? TAB_ICONS_ACTIVE[id] : null) || TAB_ICONS[id];
    return `
      <button
        type="button"
        class="bottom-nav__tab${isActive ? ' bottom-nav__tab--active' : ''}"
        data-tab="${id}"
        ${isLive
          ? `data-action="nav-tab" aria-label="${hint}"${isActive ? ' aria-current="page"' : ''}`
          : 'disabled aria-disabled="true"'}
      >
        ${isActive ? '<div class="bottom-nav__active-rule"></div>' : ''}
        ${glyph({ size: 'body', className: 'bottom-nav__icon' })}
        <span class="bottom-nav__label">${label}</span>
      </button>
    `;
  };

  return `
    <nav class="bottom-nav" aria-label="${labels.ariaLabel}">
      ${tab('home', labels.home)}
      ${tab('payments', labels.payments)}
      ${tab('goals', labels.goals)}
      ${tab('insights', labels.insights)}
      ${tab('profile', labels.profile)}
    </nav>
  `;
}

/**
 * Re-renders a screen in place without throwing the participant back to the
 * top of it.
 *
 * THE PROBLEM THIS SOLVES
 * Every screen module builds itself with `container.innerHTML = ...`, so a
 * toggle handler that calls its own `render` destroys and rebuilds
 * `.screen-content` — the element that owns the scroll position. The browser
 * has nothing to restore `scrollTop` onto, so it starts again at 0, and
 * `document.activeElement` falls back to `<body>` because the focused control
 * no longer exists. Tapping a control two thirds of the way down a long
 * screen sent the screen to the top and dropped keyboard focus, on frames 03,
 * 04, 05, 05b, 06, 09, 09a, 09b, 10, 10b and 33.
 *
 * WHAT IT DOES
 * Records the scroll offset and enough about the focused element to find it
 * again, re-renders, then puts both back. The element is found by the
 * `data-action` (plus `data-account-id` / `data-disclosure-id` / `data-value`
 * where present) this codebase already puts on every interactive control, so
 * nothing needs an id and no screen has to opt in.
 *
 * `focus({ preventScroll: true })` matters: without it the browser scrolls
 * the refocused control into view and undoes the line above it.
 *
 * Text selection is restored too, so a re-render triggered while someone is
 * mid-edit in a currency field does not drop their caret to the start.
 *
 * WHEN NOT TO USE IT
 * This is the general fallback for a screen that rebuilds itself wholesale.
 * Where a change only affects part of a screen, updating that part directly
 * is better still — nothing is destroyed, so there is nothing to restore. See
 * `syncAccounts` in screens/consent.js, which patches the account card rather
 * than re-rendering frame 03 around it.
 */
const FOCUS_KEY_ATTRS = ['accountId', 'disclosureId', 'value', 'tab', 'group'];

function focusSelector(el) {
  if (!el || !el.dataset) return null;
  const { action, role } = el.dataset;
  if (!action && !role) return null;

  const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v);
  const parts = [];
  if (action) parts.push(`[data-action="${esc(action)}"]`);
  if (role) parts.push(`[data-role="${esc(role)}"]`);
  for (const key of FOCUS_KEY_ATTRS) {
    const value = el.dataset[key];
    if (value != null) {
      const attr = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      parts.push(`[data-${attr}="${esc(value)}"]`);
    }
  }
  return parts.join('');
}

/**
 * KEEP A PRESS ON A BUTTON FROM SWALLOWING ITSELF (DECISIONS.md D76).
 *
 * THE DEFECT THIS EXISTS FOR. On a screen with typed fields, pressing a button
 * while a field still has focus ran this sequence: mousedown -> the field
 * blurs -> its `change` handler commits and calls `rerenderInPlace`, which
 * replaces the whole of `#app` -> mouseup lands on a node that no longer
 * exists -> no `click` event is ever dispatched. The edit committed correctly;
 * only the button did nothing. A participant who typed a value and went
 * straight for Continue had to press it twice, on frames 09 and 11 both.
 *
 * WHY IT IS NOT FIXED BY DEFERRING THE RE-RENDER. `setTimeout(..., 0)` around
 * the re-render passes an instantaneous synthetic tap 4 times out of 4 and
 * fails a HELD tap 0 times out of 3 at both 80ms and 200ms - and a real finger
 * tap is 50-150ms. It would have looked fixed in the harness and been broken
 * for every participant. Measured before choosing; see D76.
 *
 * WHAT THIS DOES INSTEAD. Two listeners on the screen container:
 *
 *   mousedown  `preventDefault()` while a field is focused, so the press never
 *              moves focus, the field never blurs, `change` never fires and
 *              nothing re-renders. The button survives the whole press.
 *   click      in the CAPTURE phase, flush the still-focused field by
 *              dispatching the `change` it never got, so the value is committed
 *              before the button's own handler reads state.
 *
 * The flush re-renders, which detaches the button mid-event - but the click is
 * already in flight and its listener is on that node, so the handler still
 * runs. That is why the flush is on capture rather than bubble.
 *
 * It is bound to the container rather than to named buttons on purpose: every
 * typed field and every button on the screen inherits it, so a field or a
 * control added later cannot reintroduce the defect by being forgotten.
 */
export function keepPressAlive(container) {
  const focusedField = () => {
    const active = document.activeElement;
    return active && active.matches?.('input[data-role]') && container.contains(active)
      ? active
      : null;
  };

  container.addEventListener('mousedown', (event) => {
    if (!event.target.closest('button')) return;
    if (focusedField()) event.preventDefault();
  });

  container.addEventListener('click', (event) => {
    if (!event.target.closest('button')) return;
    const field = focusedField();
    if (field) field.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);
}

export function rerenderInPlace(container, render, ctx) {
  const scroller = container.querySelector('.screen-content, .bottom-sheet__content');
  const scrollTop = scroller ? scroller.scrollTop : 0;

  const active = document.activeElement;
  const focused = active && container.contains(active) ? active : null;
  const selector = focusSelector(focused);
  const caret = focused && typeof focused.selectionStart === 'number'
    ? { start: focused.selectionStart, end: focused.selectionEnd }
    : null;

  render(container, ctx);

  const nextScroller = container.querySelector('.screen-content, .bottom-sheet__content');
  if (nextScroller) nextScroller.scrollTop = scrollTop;

  if (!selector) return;
  const target = container.querySelector(selector);
  if (!target) return;
  target.focus({ preventScroll: true });
  if (caret && typeof target.setSelectionRange === 'function') {
    try {
      target.setSelectionRange(caret.start, caret.end);
    } catch {
      // Some input types (number, email) throw on setSelectionRange. Focus is
      // the part that matters; the caret is a nicety.
    }
  }
}

/** Wires whichever leading control the app bar rendered: the chevron to `goBack`, the X to `exitFlow`. No-op if it drew neither. */
export function bindAppBarLeading(container) {
  const back = container.querySelector('[data-action="app-bar-back"]');
  if (back) back.addEventListener('click', goBack);

  // A screen draws one leading control or none, so exactly one of these two
  // ever binds. Both are wired from one call so a screen cannot pick up the
  // chevron's handler by drawing the X, which is the defect this replaces.
  const close = container.querySelector('[data-action="app-bar-close"]');
  if (close) close.addEventListener('click', exitFlow);
}

/**
 * Bottom action bar: a primary button, and an optional secondary action
 * that's either a bordered button (frame 04) or a plain text link (frames
 * 02, 03). `secondary` is omitted entirely on screens with only one action.
 */
export function actionBarHTML({ primaryLabel, primaryAction, secondaryLabel, secondaryAction, secondaryStyle = 'text', primaryDisabled = false, primaryDescribedBy = null }) {
  const secondaryMarkup = secondaryLabel
    ? secondaryStyle === 'button'
      ? `<button type="button" class="button button--secondary" data-action="${secondaryAction}">${secondaryLabel}</button>`
      : `<button type="button" class="text-action" data-action="${secondaryAction}">${secondaryLabel}</button>`
    : '';

  // WHY THE DISABLED BUTTON POINTS AT THE ERROR (D78). A disabled Continue
  // says nothing about why it is disabled, and the banner explaining it is
  // several elements up the page. `aria-describedby` puts the reason on the
  // button, so a participant swiping through the screen meets "Continue,
  // dimmed" followed by the error rather than a dead end. Accepts a list, so
  // frame 11 - which can raise three row errors at once - names all of them.
  // Empty and null are both treated as "no reason", so no screen renders a
  // dangling reference to a banner it did not draw.
  const ids = Array.isArray(primaryDescribedBy) ? primaryDescribedBy.filter(Boolean) : (primaryDescribedBy ? [primaryDescribedBy] : []);
  const describedBy = ids.length ? ` aria-describedby="${ids.join(' ')}"` : '';

  return actionBarDockHTML(`
    <button type="button" class="button button--primary" data-action="${primaryAction}"${describedBy} ${primaryDisabled ? 'disabled' : ''}>${primaryLabel}</button>
    ${secondaryMarkup}
  `);
}

/**
 * The shell every action bar sits in (DECISIONS.md D17).
 *
 * The dock exists so the scroll affordance — the "there is more below" fade —
 * has somewhere to live. It cannot live on the bar itself: the bar's hidden
 * state is `opacity: 0`, and opacity applies to an element's pseudo-elements
 * too, so a gradient drawn on the bar would be invisible in exactly the state
 * that needs it. The dock stays fully opaque and draws the fade immediately
 * above itself with `bottom: 100%`.
 *
 * Every action bar in the app goes through here — the seventeen full screens
 * via `actionBarHTML` above, and the seven sheets, which build their own
 * buttons but wrap them in this.
 */
export function actionBarDockHTML(buttonsHTML) {
  return `
    <div class="action-bar-dock">
      <div class="action-bar">
        ${buttonsHTML}
      </div>
    </div>
  `;
}

/**
 * THE INFORMATIONAL BANNER. `warningBannerHTML` below is the error one; the two
 * are separate components and differ in glyph as well as colour (D78, D79).
 *
 * `live` makes the block a POLITE live region (DECISIONS.md D83). Pass it when
 * the banner reports something the app did rather than something that is
 * simply true - frame 10b's "we've moved your date", which appears because an
 * edit on another screen moved the earliest reachable date past the one the
 * participant had chosen. Without it nothing announces: the banner is inserted
 * by a re-render, and a participant using a screen reader would arrive at a
 * date they did not set with no account of how it changed.
 *
 * POLITE, AND NOT `role="alert"`. It is a disclosure of a change, not an error:
 * nothing is wrong, nothing is disabled, and Continue is live. D78 reserves the
 * assertive role and the triangle for a state that blocks the participant, and
 * borrowing them here would tell them something had gone wrong when it had not.
 */
export function infoBannerHTML(text, { id = null, live = false } = {}) {
  return `
    <div class="info-banner"${id ? ` id="${id}"` : ''}${live ? ' role="status" aria-live="polite"' : ''}>
      ${infoCircle({ size: 'body', className: 'info-banner__icon' })}
      <p class="info-banner__text">${text}</p>
    </div>
  `;
}

/**
 * DUAA 2025 automated-decision pushback control (SPEC.md's regulatory
 * anchor map). Opens the Feedback / Report sheet — out of scope to build in
 * full this session (no destination screen yet), so it's wired as a no-op
 * data-action a later stage can pick up rather than a dead link.
 */
export function flagRowHTML(label) {
  return `
    <button type="button" class="flag-row" data-action="report-issue">
      ${flagIcon({ size: 'body', className: 'flag-row__icon' })}
      <span class="flag-row__label">${label}</span>
      ${chevronRight({ size: 'body', className: 'flag-row__chevron' })}
    </button>
  `;
}

/** DECISIONS.md D5: every figure's provenance caption, in its own row under the figure. */
export function provenanceCaptionHTML(text) {
  return `<p class="provenance-caption">${text}</p>`;
}

/**
 * Disclosure / accordion (Figma "Content / Disclosure"): a header row (title
 * + chevron) that expands a content slot below it. Introduced here because
 * frames 05, 05b and 06 all reuse this exact pattern for "how we worked
 * this out" style breakdowns. `open` reflects state the caller owns (e.g.
 * state.breakdownOpen) — this function is a pure render, it does not track
 * its own open/closed state.
 */
export function disclosureHTML({ id, title, open, contentHtml }) {
  const contentId = `disclosure-content-${id}`;
  return `
    <div class="disclosure${open ? '' : ' disclosure--closed'}">
      <h3 class="disclosure__heading">
        <button type="button" class="disclosure__header" data-action="toggle-disclosure" data-disclosure-id="${id}" aria-expanded="${open}" aria-controls="${contentId}">
          <span class="disclosure__title">${title}</span>
          ${chevronUp({ size: 'body', weight: 'semibold', className: 'disclosure__chevron' })}
        </button>
      </h3>
      <div class="disclosure__content" id="${contentId}"${open ? '' : ' hidden'}>${contentHtml}</div>
    </div>
  `;
}

/**
 * Data viz / Proportion rows: a labelled horizontal bar per part, each with
 * a "n% of what comes in" caption. `parts` is `[{ label, valueText, pct,
 * pctText }]` — the caller computes `pct`/`pctText` from model figures
 * (SPEC.md: no number hardcoded in a screen), this function only renders.
 */
export function proportionRowsHTML(parts) {
  return `
    <div class="proportion-rows">
      ${parts.map((p) => `
        <div class="proportion-row">
          <div class="proportion-row__label-row">
            <p class="proportion-row__label">${p.label}</p>
            <p class="proportion-row__value">${p.valueText}</p>
          </div>
          <div class="proportion-row__track"><div class="proportion-row__fill" style="width:${p.pct}%"></div></div>
          <p class="proportion-row__caption">${p.pctText}</p>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Content / List row — the figure-presenting variant: a label, an optional
 * bold value beneath it, and an optional provenance/hint caption beneath
 * that (DECISIONS.md D5). Distinct from the plain nav `.list-row` above,
 * which is label + chevron only. `trailing` renders the inline single-line
 * shape instead ("Held in" / "Emergency fund pot") when a value sits beside
 * the label rather than stacked under it.
 */
export function figureRowHTML({ label, value, caption, trailing }) {
  if (trailing !== undefined) {
    // The caption is optional here on purpose: a row whose trailing side is
    // not a figure (frame 19's "Credit check / A soft search only") has no
    // source to state, and must not be forced to carry an empty line. When
    // one IS passed the label and value move into an inner row so the
    // caption can sit beneath both — an uncaptioned row keeps the flat
    // markup, and its appearance, exactly as it was.
    if (!caption) {
      return `
        <div class="figure-row figure-row--inline">
          <p class="figure-row__label">${label}</p>
          <p class="figure-row__trailing">${trailing}</p>
        </div>
      `;
    }
    return `
      <div class="figure-row figure-row--inline figure-row--inline-captioned">
        <div class="figure-row__inline-main">
          <p class="figure-row__label">${label}</p>
          <p class="figure-row__trailing">${trailing}</p>
        </div>
        <div class="figure-row__caption-row"><p class="figure-row__caption">${caption}</p></div>
      </div>
    `;
  }
  return `
    <div class="figure-row">
      <div class="figure-row__content">
        <p class="figure-row__label">${label}</p>
        ${value !== undefined && value !== null ? `<div class="figure-row__value-row"><p class="figure-row__value">${value}</p></div>` : ''}
        ${caption ? `<div class="figure-row__caption-row"><p class="figure-row__caption">${caption}</p></div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Comprehension / Assumptions link — an inline info-icon + underlined link,
 * distinct from the full-width underlined link pattern (which
 * has no icon and is its own primary-looking control on frame 04). Reused
 * by frames 06 and 08 for "How did we work this out?" style links.
 */
/**
 * A bare information icon that opens an explainer, for a term introduced
 * inside a sentence (DECISIONS.md D70). Distinct from `infoLinkHTML` above,
 * which is a full-width labelled row - this one sits in a trailing cell beside
 * the prose that names the term.
 *
 * IT IS 48px, AND THAT IS WHY IT IS A COMPONENT RATHER THAN AN INLINE <svg>.
 * DESIGN.md's rule 2 requires a 48px target and forbids shrinking one to match
 * a design; the icon inside it is body-sized. An icon dropped inline into a
 * 13px caption could not carry a 48px target without disturbing the line box,
 * which is why the callers put it in its own flex cell instead.
 *
 * `ariaLabel` is the control's whole accessible name - there is no visible
 * text - so it says what opening it gets you rather than describing the glyph.
 */
export function infoIconButtonHTML({ action, ariaLabel }) {
  return `
    <button type="button" class="info-icon-button" data-action="${action}" aria-label="${ariaLabel}">
      ${infoCircle({ size: 'body', className: 'info-icon-button__icon' })}
    </button>
  `;
}

export function infoLinkHTML({ label, action }) {
  return `
    <button type="button" class="info-link" data-action="${action}">
      ${infoCircle({ size: 'body', className: 'info-link__icon' })}
      <span class="info-link__label">${label}</span>
    </button>
  `;
}

/**
 * THE ERROR BANNER (DECISIONS.md D7 fallback component, D78).
 *
 * Every one of this function's call sites is an ERROR that disables the
 * screen's primary action - frame 05's left-over error, frame 09's
 * non-numeric property value, frame 10's ceiling breach and past date, and
 * frame 11's three row errors. It is not a soft warning and it never draws
 * beside an enabled Continue. `infoBannerHTML` above is the informational
 * banner and is a separate component; the two were only ever the same in
 * their icon, which is the thing D78 separates.
 *
 * WHY THE ICON CHANGED. Both banners drew `infoCircle`, so the only thing
 * marking an error was colour - the red border and red text. WCAG 1.4.1 does
 * not allow colour to be the sole carrier of a state, and a participant who
 * cannot separate red from grey saw the same symbol on both. The triangle is
 * a different SHAPE, not a recoloured circle, and it now takes
 * `--color-warning` so it matches the border and the text it sits with.
 *
 * `role="alert"` because the banner is inserted by a re-render, not present
 * at load: without it nothing announces, and the participant using a screen
 * reader meets a Continue that has silently gone dead. Pass `id` and hand the
 * same id to `actionBarHTML`'s `primaryDescribedBy` so the disabled button
 * carries the reason with it - see D78 for why the button keeps `disabled`
 * rather than switching to `aria-disabled`.
 */
export function warningBannerHTML(text, { id = null } = {}) {
  return `
    <div class="warning-banner" role="alert"${id ? ` id="${id}"` : ''}>
      ${exclamationTriangle({ size: 'body', className: 'warning-banner__icon' })}
      <p class="warning-banner__text">${text}</p>
    </div>
  `;
}

/**
 * Empty-state card (DECISIONS.md D7 fallback component): for "No frame
 * drawn" empty variants (e.g. frame 06's "no accounts assigned"), composed
 * from the same card look as everything else rather than inventing new
 * visual design.
 */
export function emptyStateCardHTML({ title, body, ctaLabel, ctaAction }) {
  return `
    <div class="card empty-state-card">
      <p class="empty-state-card__title">${title}</p>
      <p class="empty-state-card__body">${body}</p>
      ${ctaLabel ? `<button type="button" class="button button--secondary" data-action="${ctaAction}">${ctaLabel}</button>` : ''}
    </div>
  `;
}

/**
 * Input / Figure: the large editable currency headline (frames 05/05b's
 * left-over figure). A styled `<input type="text">` rather than
 * `type="number"` so a leading "£" can sit inside the same underline as the
 * digits, matching the Figma component; `inputmode="numeric"` still gives
 * mobile participants a numeric keypad.
 */
export function figureInputHTML({ id, value, caption, ariaLabel }) {
  const digits = String(Math.round(value ?? 0));
  return `
    <div class="figure-input">
      <div class="figure-input__field">
        <span class="figure-input__currency" aria-hidden="true">£</span>
        <input class="figure-input__value" type="text" inputmode="numeric" data-role="${id}" value="${digits}" style="width:${digits.length + 1}ch" aria-label="${ariaLabel}" />
      </div>
      <p class="figure-input__caption">${caption}</p>
    </div>
  `;
}

/**
 * Static (non-editable) counterpart to figureInputHTML — frame 06's
 * deposit-saved headline.
 *
 * `live` makes the block a polite live region (DECISIONS.md D80). Pass it when
 * the figure is DERIVED from a control on the same screen and changes as that
 * control is used - frame 10b's solved monthly amount, which moves on every
 * press of the date stepper. Without it a participant using a screen reader
 * presses a chevron and hears the month change but never the amount, which is
 * the figure the press was for. Off by default, so the two callers that render
 * a figure the screen arrived with (frames 06 and 21) are unchanged.
 */
export function figureDisplayHTML({ value, caption, live = false }) {
  return `
    <div class="figure-input"${live ? ' role="status" aria-live="polite"' : ''}>
      <p class="figure-display">${value}</p>
      <p class="figure-input__caption">${caption}</p>
    </div>
  `;
}

/**
 * Navigation / Form step header (frames 09, 09a, 09b, 10, 10b, 11 — the
 * deposit calculator's own step-by-step header, distinct from appBarHTML's
 * single-row app bar used everywhere else). A back button, a centred title,
 * a close button, and a "Step n of 3" row underneath. Introduced here
 * because 6 screens on this page share it exactly.
 */
export function formStepHeaderHTML({ title, step, appBarLabels }) {
  return `
    <header class="form-step-header" role="banner">
      <div class="form-step-header__title-bar">
        <button type="button" class="form-step-header__cell form-step-header__cell--action" data-action="form-step-back" aria-label="${appBarLabels?.backLabel}">
          ${arrowLeft({ size: 'title3', className: 'app-bar__icon' })}
        </button>
        <h1 class="form-step-header__title">${title}</h1>
        <button type="button" class="form-step-header__cell form-step-header__cell--action" data-action="form-step-close" aria-label="${appBarLabels?.closeLabel}">
          ${xmark({ size: 'title3', className: 'app-bar__icon' })}
        </button>
      </div>
      <div class="form-step-header__step-row">
        <p class="form-step-header__step">${step}</p>
      </div>
    </header>
  `;
}

/** Wires the form step header's back and close buttons. */
export function bindFormStepHeader(container, { onClose }) {
  container.querySelector('[data-action="form-step-back"]').addEventListener('click', goBack);
  container.querySelector('[data-action="form-step-close"]').addEventListener('click', onClose);
}

/**
 * Inputs / Currency input (frames 09, 09a, 09b): a secondary label, a
 * bordered £-prefixed field, and a hint line beneath. `value` is the raw
 * number or null (09a's empty state, rendered as an empty field with a
 * placeholder-style hint rather than "£0").
 */
export function currencyInputHTML({ id, label, value, hint, ariaLabel }) {
  const digits = value === null || value === undefined || Number.isNaN(value) ? '' : formatDigits(value);
  return `
    <div class="currency-input">
      <p class="currency-input__label">${label}</p>
      <div class="currency-input__field">
        <div class="currency-input__gutter">£</div>
        <input class="currency-input__value" type="text" inputmode="numeric" data-role="${id}" value="${digits}" aria-label="${ariaLabel}" />
      </div>
      <p class="currency-input__hint">${hint}</p>
    </div>
  `;
}

/**
 * Inputs / Chip row (frames 09, 09a, 09b): a row of pill-shaped percentage
 * choices, one selected. `chips` is `[{ value, label }]`; `selected` is the
 * currently-chosen value or null (09a, before any selection).
 */
/**
 * `chip.ariaLabel` IS OPTIONAL, DELIBERATELY (D73). Frame 09's chips are
 * percentages - "10%" reads correctly as an accessible name and needs no
 * override. Frame 12's range chips are abbreviations, and "6 mo" announced as
 * written is not a name a participant can act on, so those pass a spoken form
 * ("Show 6 months"). Making it required would have meant writing an override
 * for every chip that does not need one.
 */
export function chipRowHTML({ chips, selected, action }) {
  return `
    <div class="chip-row">
      ${chips.map((chip) => `
        <button type="button" class="chip${chip.value === selected ? ' chip--selected' : ''}" data-action="${action}" data-value="${chip.value}"${chip.ariaLabel ? ` aria-label="${chip.ariaLabel}"` : ''} aria-pressed="${chip.value === selected}">${chip.label}</button>
      `).join('')}
    </div>
  `;
}

/**
 * Content / Option comparison card (frames 09, 09b): "What each one means"
 * — a header and up to 3 option-rows (amount, sub-label, technical figure),
 * plus the shared inline info link at the bottom.
 */
/**
 * MARKING THE SELECTED ROW (frames 09 / 09b).
 *
 * The chip row above the card already shows the chosen deposit % as a filled
 * pill, but the card listing three percentages for comparison marked none of
 * them — so nothing on screen said which of the three figures the rest of the
 * screen was actually built from. `row.selected` marks it.
 *
 * THREE CUES, ONLY ONE OF WHICH IS VISUAL:
 *   1. `--selected` draws the 2px box outline (see components.css) — the same
 *      treatment `.rate-band-row--highlighted` already uses on frames 15/16 to
 *      mark the band matching the participant's own LTV. Same job, same
 *      treatment, not a second invention.
 *   2. `aria-current="true"` — the ARIA state for "the one within a set that
 *      is current".
 *   3. `selectedLabel`, rendered into the row as visually-hidden text. This is
 *      the part that satisfies "not by colour alone" properly: 1.4.1 is about
 *      colour, and an outline is a shape rather than a colour, but a shape is
 *      still no use to a screen-reader participant. The hidden text puts the
 *      same fact in the row's own announced content, after its figures.
 *
 * `aria-current` alone would not do it. On a `<div>` with no role it is a
 * state on a generic element, and support for announcing it there is
 * inconsistent — hence the text, which is read in flow by everything.
 */
export function optionComparisonCardHTML({ headerText, rows, infoLinkLabel, infoLinkAction, selectedLabel }) {
  return `
    <div class="card option-comparison-card" role="status" aria-live="polite">
      <h3 class="section-heading">${headerText}</h3>
      ${rows.map((row) => `
        <div class="option-comparison-card__row${row.selected ? ' option-comparison-card__row--selected' : ''}"${row.selected ? ' aria-current="true"' : ''}>
          <div class="option-comparison-card__left">
            <p class="option-comparison-card__amount">${row.amount}</p>
            <p class="option-comparison-card__sublabel">${row.sublabel}</p>
          </div>
          <p class="option-comparison-card__technical">${row.technical}</p>
          ${row.selected && selectedLabel ? `<span class="visually-hidden">${selectedLabel}</span>` : ''}
        </div>
      `).join('')}
      ${infoLinkHTML({ label: infoLinkLabel, action: infoLinkAction })}
    </div>
  `;
}

/**
 * Inputs / Review row (frames 10, 10b, 11): a label, a value, and an optional
 * provenance caption. Reused both inside the small "filled-in details" card
 * (10, 10b) and the full-width review list (11) — same shape in both places,
 * just a different container around it.
 *
 * NO CONTROL. The row used to carry a "Change" link that navigated to the
 * screen owning its figure. D62 replaced that with an "Edit" link that opened
 * a field, and then removed the link too: on frame 11 the figures a
 * participant may change are simply fields, all the time, so there is nothing
 * for a control to reveal. A row is either a field or a readout.
 *
 * PASS `fields` AND THE ROW IS A FIELD; leave it out and the row renders the
 * markup it always has, byte for byte. Frames 10 and 10b pass nothing and are
 * untouched.
 *
 * EACH FIELD IS FRAME 05's `figureInputHTML` AT THIS ROW'S TYPE SCALE. Same
 * structure and the same three mechanics: the £ (or the %) is a sibling span
 * carrying `aria-hidden`, OUTSIDE the input, so it cannot be selected or typed
 * over; the input is `type="text"` with `inputmode="numeric"` rather than
 * `type="number"`, for the reasons set out on `figureInputHTML` above; and the
 * width is set inline from the digit count, as frame 05 sets its own.
 *
 * THE CARET ALLOWANCE IS 4px, NOT FRAME 05's WHOLE EXTRA CHARACTER. `1ch` is
 * the width of a "0", and on a field carrying a SUFFIX that whole character
 * lands between the digits and the affix — "10" and "%" ended up visibly adrift
 * from one another. 4px is enough for the caret and leaves the affix against
 * its number. Frame 05 has no suffix and no neighbour to crowd, so its own
 * `+ 1` stays as it is. What is
 * NOT carried over is frame 05's 40px headline size — `currencyInputHTML` is
 * already the same pattern at a third size, so scale is not what identifies it.
 *
 * THE FIELD'S `aria-label` IS ITS ONLY ACCESSIBLE NAME. `.review-row__label`
 * is a sibling paragraph, not a `<label>`, so it is not programmatically
 * associated with the input; every caller must pass an `ariaLabel` that names
 * the figure. Nothing else on the row supplies one.
 *
 * `fields` is `[{ role, prefix, suffix, digits, ariaLabel }]`. Two entries with
 * a `join` between them is the monthly-saving range; one entry is every other
 * row.
 */
export function reviewRowHTML({ label, value, caption, fields, join, limit }) {
  const fieldHTML = (f) => {
    const affix = (text) => `<span class="review-row__affix" aria-hidden="true">${text}</span>`;
    return `
      <span class="review-row__field">
        ${f.prefix ? affix(f.prefix) : ''}
        <input class="review-row__input" type="text" inputmode="numeric" data-role="${f.role}" value="${f.digits}" style="width:calc(${f.digits.length}ch + 4px)" aria-label="${f.ariaLabel}"${limit ? ` aria-describedby="${limit.id}"` : ''} />
        ${f.suffix ? affix(f.suffix) : ''}
      </span>
    `;
  };
  // THE BOUND, BESIDE THE FIGURES IT BOUNDS (DECISIONS.md D90). A third child
  // of the same flex row as the fields, so it sits on their line and costs the
  // row no height when it fits - which matters because this screen is the worst
  // cut in the build under GAPS.md G96, and a line added above an error banner
  // pushes that banner further under the action bar.
  //
  // `aria-describedby` FROM BOTH FIELDS, not one, and not the row's accessible
  // name. It describes the pair: the same ceiling bounds the low and the high,
  // and a screen reader on either field should hear it. Putting it in the row's
  // name instead would announce it once, on arrival, and never again while the
  // participant is actually typing - which is the moment it is for. Same
  // pattern D78 used to point a disabled Continue at the error explaining it.
  //
  // NOT A BANNER AND NOT A CAPTION. No icon, no role, no live region: it states
  // a fact that is true whether or not anything is wrong. And not the `caption`
  // slot below, whose meaning on this screen is PROVENANCE (D5, as refined by
  // D62) - a bound in that slot would read as a claim about where the figure
  // came from.
  const limitHTML = limit ? `<span class="review-row__limit" id="${limit.id}">${limit.text}</span>` : '';
  const readout = fields
    ? `<div class="review-row__value review-row__value--fields">${fields.map(fieldHTML).join(join ? `<span class="review-row__join">${join}</span>` : '')}${limitHTML}</div>`
    : `<p class="review-row__value">${value}</p>`;
  return `
    <div class="review-row">
      <div class="review-row__content">
        <p class="review-row__label">${label}</p>
        ${readout}
        ${caption ? `<p class="review-row__caption">${caption}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Inputs / Segmented control (frames 10, 10b): two-option toggle switching
 * `solveFor` between 'date' (set a monthly amount, solve the date) and
 * 'amount' (set a target date, solve the monthly amount) — build-spec.md
 * section 2's own naming for the state variable.
 */
export function segmentedControlHTML({ options, selected, action }) {
  return `
    <div class="segmented-control">
      ${options.map((opt) => `
        <button type="button" class="segmented-control__segment${opt.value === selected ? ' segmented-control__segment--selected' : ''}" data-action="${action}" data-value="${opt.value}" aria-pressed="${opt.value === selected}">${opt.label}</button>
      `).join('')}
    </div>
  `;
}

/**
 * Input / Date select (frame 10b only). DECISIONS.md D84, replacing D83's two
 * native `<select>` elements with a custom listbox that opens as an overlay.
 *
 * THE FLOOR IS STILL ENFORCED BY CONSTRUCTION, which was D83's whole structural
 * argument and is unchanged: `monthOptions` and `yearOptions` arrive already
 * filtered by the caller, this component applies no bound of its own, and an
 * option that was never built cannot be chosen. What changed is only who draws
 * the open list.
 *
 * WHAT THAT COSTS, STATED PLAINLY. A native `<select>` came with its own popup,
 * keyboard handling, focus management and screen reader semantics. All four are
 * now this build's responsibility - see `bindDateSelect` below for the contract
 * and D84 for how it was checked. Getting listbox semantics wrong is worse for a
 * screen reader user than the control it replaces, which is why the roles are
 * asserted rather than assumed.
 *
 * THE OPEN LIST IS AN OVERLAY, NOT AN EXPANSION. It floats above the content
 * beneath it. Expanding in place would push the solved-amount readout and the
 * dock down on every open, which is exactly the class of defect GAPS.md G96
 * records.
 *
 * NO SCRIM. A scrim would dim the readout, and the readout is the figure the
 * participant is choosing against - the whole reason the date screen shows it
 * (G65). The popover's own shadow does the separating.
 *
 * The closed trigger keeps the box `.date-select__control` already drew, so the
 * frame reads as it did through three control changes now.
 */
export function dateSelectHTML({ monthOptions, monthValue, yearOptions, yearValue, hint, note = '', monthAction, yearAction, monthAriaLabel, yearAriaLabel }) {
  const field = ({ options, value, action, ariaLabel, name }) => {
    const listId = `date-${name}-list`;
    const optId = (v) => `date-${name}-opt-${v}`;
    return `
      <div class="date-select__field">
        <button type="button" class="date-select__control" data-action="${action}" data-list="${name}"
                aria-haspopup="listbox" aria-expanded="false" aria-controls="${listId}" aria-label="${ariaLabel}">
          <span class="date-select__value">${options.find((o) => o.value === value)?.label ?? ''}</span>
          ${chevronDown({ size: 'micro', weight: 'semibold', className: 'date-select__chevron' })}
        </button>
        <div class="date-select__popover" data-popover="${name}" hidden>
          <div class="date-select__scrolltrack" data-scrolltrack aria-hidden="true" hidden>
            <div class="date-select__scrollthumb" data-scrollthumb></div>
          </div>
          <ul class="date-select__list" role="listbox" id="${listId}" tabindex="-1"
              aria-label="${ariaLabel}" aria-activedescendant="${optId(value)}">
            ${options.map((o) => `
              <li class="date-select__option${o.value === value ? ' date-select__option--selected' : ''}"
                  role="option" id="${optId(o.value)}" aria-selected="${o.value === value}" data-value="${o.value}">
                <span class="date-select__option-label">${o.label}</span>
                ${o.value === value ? checkmark({ size: 'body', weight: 'semibold', className: 'date-select__tick' }) : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  };
  return `
    <div class="date-select">
      <div class="date-select__row">
        ${field({ options: monthOptions, value: monthValue, action: monthAction, ariaLabel: monthAriaLabel, name: 'month' })}
        ${field({ options: yearOptions, value: yearValue, action: yearAction, ariaLabel: yearAriaLabel, name: 'year' })}
      </div>
      ${note}
      <p class="date-select__hint">${hint}</p>
    </div>
  `;
}

/**
 * THE LISTBOX'S BEHAVIOUR, AND THE WHOLE OF WHAT NATIVE USED TO PROVIDE (D84).
 *
 * `onPick(name, value)` is called with the chosen value and nothing else - the
 * screen decides what a pick means, and this decides nothing about dates.
 *
 * OPEN AND CLOSE ARE DOM-ONLY, NEVER STATE. A re-render rebuilds the whole
 * screen (`rerenderInPlace`), so routing every arrow key through `setState`
 * would rebuild forty options to move a highlight and would fight the caret
 * restoration on the way. Only a PICK commits, and the re-render that follows
 * rebuilds the trigger closed - which is why nothing here has to close it
 * afterwards.
 *
 * WHICH SIDE IT OPENS ON IS MEASURED, NOT FIXED. Frame 10b's control sits at
 * y=299 on an ordinary visit and at y=429 (default text) or y=454 (Large) when
 * D83's moved-date disclosure is above it, and a five-option list is 242px: it
 * fits below the trigger in the first case and does not in the second. So the
 * side is chosen per open from the space actually available, and the height is
 * clamped to what that side offers - the list can therefore never be cut off by
 * `.screen-content`, which computes `overflow: auto` on BOTH axes and would
 * otherwise clip it (D84).
 *
 * THE BOTTOM EDGE IS THE DOCK, NOT THE SCROLLER. `.screen-content` extends
 * 137px below the dock by design (D82's negative margin), and everything in
 * that band is behind an opaque bar. Measuring to the scroller's own bottom
 * would "fit" a list into a region the participant cannot see.
 */
export function bindDateSelect(container, { onPick }) {
  const root = container.querySelector('.date-select');
  if (!root) return;
  const scroller = container.querySelector('.screen-content');
  const dock = container.querySelector('.action-bar-dock');
  let openName = null;
  let onOutside = null;

  const partsFor = (name) => ({
    trigger: root.querySelector(`[data-list="${name}"]`),
    popover: root.querySelector(`[data-popover="${name}"]`),
    list: root.querySelector(`[data-popover="${name}"] [role="listbox"]`),
    track: root.querySelector(`[data-popover="${name}"] [data-scrolltrack]`),
    thumb: root.querySelector(`[data-popover="${name}"] [data-scrollthumb]`),
  });

  /**
   * THE SCROLL INDICATOR IS DRAWN, NOT THE BROWSER'S.
   *
   * The list holds twenty-one years in five rows, and a participant on 2045 has
   * to be able to see WHERE in it they are - not merely that it moves. The
   * browser's own scrollbar cannot do that here: Blink uses OVERLAY scrollbars,
   * which are invisible at rest and appear only while a scroll is in flight, and
   * `scrollbar-width: thin` puts it on the standard path where
   * `::-webkit-scrollbar` is ignored entirely. Both were tried and neither
   * painted anything - measured as a zero gutter, not guessed from a screenshot.
   *
   * So this is a track and a thumb sized from `scrollTop` and `scrollHeight`,
   * which is the one version that is visible at rest, in a screenshot, and on
   * both mobile engines. `aria-hidden`, because it duplicates what
   * `aria-activedescendant` already tells a screen reader.
   */
  function updateThumb(name) {
    const { list, track, thumb } = partsFor(name);
    if (!track) return;
    const overflows = list.scrollHeight > list.clientHeight + 1;
    track.hidden = !overflows;
    if (!overflows) return;
    const trackH = list.clientHeight;
    const ratio = list.clientHeight / list.scrollHeight;
    const h = Math.max(24, Math.round(trackH * ratio));
    const top = Math.round((trackH - h) * (list.scrollTop / (list.scrollHeight - list.clientHeight)));
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${top}px)`;
  }

  function close() {
    if (!openName) return;
    const { trigger, popover } = partsFor(openName);
    // WHETHER FOCUS COMES BACK IS DECIDED BY WHERE IT IS, not by which caller
    // is closing. Hiding the element that holds focus drops it on `<body>` -
    // the top of the document, which is where a keyboard or screen reader user
    // then has to start again from - and that happens on EVERY dismiss path,
    // including the outside tap, because the list is what holds focus while it
    // is open. Asked before hiding, because after hiding the answer is always
    // `<body>`.
    //
    // AND ONLY THEN. A pointer user who tapped a different control should be
    // left on that control, not dragged back here; if the tap moved focus out
    // of the popover already, this leaves it alone. On a tap that focuses
    // nothing, the browser's own handling runs after this and focus stays on
    // the trigger.
    const bringFocusBack = popover.contains(document.activeElement);
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (onOutside) { document.removeEventListener('pointerdown', onOutside, true); onOutside = null; }
    openName = null;
    if (!bringFocusBack) return;
    trigger.focus();
    // AND AGAIN AFTER THE POINTER'S OWN FOCUS HANDLING, which runs after this
    // and undoes it: a mousedown on anything non-focusable - the headline, the
    // caption, the page background - clears focus to `<body>`, so the outside
    // tap was landing exactly where this is written to prevent. Re-asserted
    // only if focus actually ended up nowhere, so a tap that moved it to a real
    // control still leaves it there.
    requestAnimationFrame(() => {
      if (document.activeElement === document.body && document.contains(trigger)) trigger.focus();
    });
  }

  function open(name) {
    if (openName === name) { close(); return; }
    if (openName) close();
    const { trigger, popover, list } = partsFor(name);
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openName = name;

    // --- Which side, and how tall ------------------------------------------
    // MEASURED IN DEVICE PIXELS, APPLIED IN LAYOUT PIXELS, so the two have to
    // be converted between. `getBoundingClientRect()` reports the size a box
    // is DRAWN at, and at framed widths the whole phone is drawn through a
    // scale transform (DECISIONS.md D92); `max-height` is a CSS length and is
    // resolved before that transform. Divide the measurements by the scale and
    // the numbers are back in the units the declaration is written in.
    //
    // Left as-was, a frame rendered at 1.5 would measure 1.5x the space that
    // actually exists and set a max-height half again too tall - the list
    // would reach past the dock it is measured against, which is the one thing
    // this block exists to prevent. Anchoring itself is unaffected: the
    // popover is positioned by CSS inside `.date-select__field` (screens.css),
    // so it moves and scales with its trigger whatever the transform does.
    const scale = frameScale();
    const px = (n) => n / scale;
    const t = trigger.getBoundingClientRect();
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const bottom = dock ? dock.getBoundingClientRect().top : window.innerHeight;
    const gap = 8;
    const rows = list.querySelectorAll('[role="option"]');
    const rowH = rows.length ? px(rows[0].getBoundingClientRect().height) : 48;
    // THE IDEAL LENGTH, and it is a preference rather than a requirement. What
    // the list gets is whatever the chosen side offers, up to this.
    const wanted = rowH * 5 + 2;

    // THE LIST ALWAYS HANGS BELOW THE TRIGGER (DECISIONS.md D84 as revised;
    // D96 pinned the ordinary visit, this pins the rest). There is no upward
    // variant left and no side to choose - `useAbove` and its hysteresis are
    // gone, along with the `--above` class they toggled.
    //
    // WHY DIRECTION IS PINNED RATHER THAN CHOSEN. This is a research
    // instrument. A participant who triggered the moved-date disclosure used to
    // see the list open one way and a participant who did not saw it open the
    // other, on the same screen and the same task - interaction variance
    // between sessions, on the date branch GAPS.md G107 is measuring, and
    // exactly the class of thing D92 removed from layout. Measured at v104 the
    // side was also settled by a single layout pixel on an ordinary visit and
    // answered differently at Large text, so "chosen" never meant "stable".
    //
    // WHAT MADE PINNING POSSIBLE. The disclosure used to sit ABOVE the controls
    // and pushed them down, leaving 73px (default) / 47.5px (Large) beneath the
    // trigger against a 146px minimum - less than half, so downward could not
    // be honoured in that state at all. Moving the disclosure BELOW the
    // controls raises the field by its own height and hands that space back.
    // See D84's revision for the measured figures.
    //
    // THE CLAMP TAKES WHAT IS THERE, with no floor that could exceed it: a
    // `Math.max(rowH * 2, ...)` floor would reach past the dock the moment the
    // space fell under two rows, which is the one thing the measurement is for.
    // The three-row minimum is asserted in the tests rather than enforced here,
    // because a screen that cannot seat it is a layout defect to be fixed, not
    // a case for this function to paper over at run time.
    const below = px(bottom - t.bottom) - gap;
    list.style.maxHeight = `${Math.min(wanted, below)}px`;

    // --- Opens ON the selection, with what is above it in view -------------
    // A participant on 2045 must see 2045, not 2027. One row of headroom, so
    // near the floor `scrollTop` clamps to 0 and the first option reads as
    // where the list BEGINS rather than as something scrolled off.
    // THE ACTIVE OPTION IS RESET TO THE SELECTION ON EVERY OPEN, and it has to
    // be reset rather than left: arrowing around, pressing Escape and reopening
    // used to come back with the highlight wherever it was abandoned, several
    // rows from the value the trigger was showing. The scroll goes to the
    // selection either way, so the two would have disagreed on screen.
    const selected = list.querySelector('[aria-selected="true"]');
    if (selected) {
      setActive(list, selected);
      list.scrollTop = Math.max(0, selected.offsetTop - rowH);
    }

    updateThumb(name);
    list.focus({ preventScroll: true });

    // Registered on the way down so a tap on the trigger that opened this one
    // is not the tap that closes it again.
    onOutside = (e) => {
      if (!document.contains(trigger)) { close(); return; }
      if (!popover.contains(e.target) && !trigger.contains(e.target)) close();
    };
    document.addEventListener('pointerdown', onOutside, true);
  }

  function setActive(list, next) {
    if (!next) return;
    list.setAttribute('aria-activedescendant', next.id);
    next.classList.add('date-select__option--active');
    list.querySelectorAll('.date-select__option--active').forEach((el) => { if (el !== next) el.classList.remove('date-select__option--active'); });
    // `scrollIntoView({ block: 'nearest' })` moves the LIST only when the
    // option is outside it, which is what keeps a held arrow key from
    // scrolling the screen behind the popover as well.
    next.scrollIntoView({ block: 'nearest' });
  }

  for (const name of ['month', 'year']) {
    const { trigger, popover, list } = partsFor(name);
    if (!trigger) continue;

    list.addEventListener('scroll', () => updateThumb(name), { passive: true });
    trigger.addEventListener('click', () => open(name));
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(name); }
    });

    // A pick is a click on an option, or Enter/Space on the active one. Both
    // end in the same call, so there is one commit path and not two.
    popover.addEventListener('click', (e) => {
      const option = e.target.closest('[role="option"]');
      // CLOSED BEFORE THE COMMIT, so focus is back on the trigger by the time
      // the re-render captures it - `rerenderInPlace` restores whatever held
      // focus when it started, and that has to be a real control rather than
      // `<body>`.
      if (option) { close(); onPick(name, Number(option.dataset.value)); }
    });

    list.addEventListener('keydown', (e) => {
      const options = [...list.querySelectorAll('[role="option"]')];
      const current = list.querySelector(`#${CSS.escape(list.getAttribute('aria-activedescendant'))}`) ?? options[0];
      const i = options.indexOf(current);
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); setActive(list, options[Math.min(i + 1, options.length - 1)]); break;
        case 'ArrowUp': e.preventDefault(); setActive(list, options[Math.max(i - 1, 0)]); break;
        case 'Home': e.preventDefault(); setActive(list, options[0]); break;
        case 'End': e.preventDefault(); setActive(list, options[options.length - 1]); break;
        case 'Enter': case ' ':
          e.preventDefault();
          close();
          onPick(name, Number(current.dataset.value));
          break;
        // ESCAPE DISMISSES WITHOUT SELECTING, and the distinction is the point:
        // the active option may have moved several times, and none of that is a
        // choice until it is committed.
        case 'Escape': e.preventDefault(); close(); break;
        default: break;
      }
    });
  }
}

/**
 * Content / Range figure (frame 12): a static low-to-high readout, a
 * caption, a track with a position marker (where the goal sits within the
 * range), and a label under the track. Not interactive — Figma's own
 * component description: "For interactive range selection, use Input /
 * Value slider."
 */
export function rangeFigureHTML({ lowText, highText, caption, markerPct, trackLabel }) {
  const clampedPct = Math.max(0, Math.min(100, markerPct));
  return `
    <div class="range-figure" role="status" aria-live="polite">
      <div class="range-figure__readout">
        <p class="range-figure__value">${lowText}</p>
        <p class="range-figure__to">-</p>
        <p class="range-figure__value">${highText}</p>
      </div>
      <p class="range-figure__caption">${caption}</p>
      <div class="range-figure__track">
        <div class="range-figure__fill" style="width:${clampedPct}%"></div>
        <div class="range-figure__marker" style="left:${clampedPct}%"></div>
      </div>
      <p class="value-slider__caption">${trackLabel}</p>
    </div>
  `;
}

/**
 * Data viz / Growth chart (frame 12): a LINE projecting the saved balance at
 * two contribution rates (monthly-low/high) over a range the caller chooses,
 * with one point always active and an interactive detail on it.
 *
 * REBUILT FROM BARS TO A LINE (DECISIONS.md D100). The bars were not what
 * failed - what failed was that no value could be read off them (pilot, 21:42
 * and 23:28) - but they are not the shape that supports a continuous scrub
 * across a two-year window, and two stacked bands are harder to compare at a
 * point than two lines.
 *
 * `points` is `[{ months, date, year, low, high, lowPct, highPct }]`, one per
 * plotted mark, computed by the caller from model figures; this function only
 * renders. `series` is 'low' or 'high' and selects which line the detail
 * reports. `activeIndex` is the point whose guide, value and date are drawn.
 *
 * THE MODEL, IN ONE PLACE (the plan's 6.6.0):
 *
 *   One point is always active. Its value is drawn at the Y-AXIS EDGE, at the
 *   end of a HORIZONTAL guide running from the point to the axis. Its date is
 *   drawn ABOVE the point. The whole plot area is the target; there is NO HIT
 *   TESTING ON THE CIRCLES.
 *
 * THE GUIDE IS HORIZONTAL AND NOTHING ELSE. A vertical drop to the x-axis would
 * land between year ticks and point at nothing readable - the axis carries
 * years, so there is no mark for it to meet.
 *
 * THE X-AXIS IS A SCALE, NOT A ROW OF CAPTIONS (the plan's 6.4, closing pilot
 * finding P10). It used to draw four labels with `justify-content:
 * space-between` in a separate flex row from the bars, which had a different
 * count - so no label sat under the mark it named, and the participant counted
 * roughly 11 bars against 4 labels and was right. Each label is now absolutely
 * positioned at its own moment's percentage of the plot width, in the same
 * coordinate space the line is drawn in. Labels and marks cannot disagree about
 * position because both are placed by one linear time mapping.
 *
 * WHY THE LINE IS SVG AND THE POINTS ARE NOT. The polyline is drawn in a
 * `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`, so the caller's
 * percentages are the coordinates directly and no pixel geometry is duplicated
 * here. That squashes anything with intrinsic shape, which is why the points
 * are positioned HTML rather than SVG circles - a circle in that viewBox draws
 * as an ellipse, and D100 requires the active point to be told apart by SIZE
 * AND SHAPE rather than by colour (WCAG 1.4.1). `vector-effect` keeps the
 * stroke from stretching with it.
 */
export function growthChartHTML({
  points,
  yTicks,
  yearLabels,
  nowLabel,
  legend,
  series,
  activeIndex,
  plotLabel,
  pointLabelTemplate,
  valueFormatter,
}) {
  const key = series === 'high' ? 'highPct' : 'lowPct';
  const other = series === 'high' ? 'lowPct' : 'highPct';
  const at = (p) => p[key];
  const xOf = (i) => (points.length <= 1 ? 0 : (i / (points.length - 1)) * 100);

  const polyline = (prop) => points.map((p, i) => `${xOf(i)},${100 - p[prop]}`).join(' ');
  const active = points[activeIndex] ?? points[points.length - 1];
  const activeX = xOf(activeIndex);
  const activeY = at(active);

  return `
    <div class="growth-chart">
      <div class="growth-chart__plot">
        <!-- THE SCRUB TARGET IS THIS ELEMENT, 305x224 logical, not the points
             at a 13.3px pitch (the plan's 6.6.1). One focus stop, with
             aria-activedescendant naming the active point - D84's listbox
             contract applied to a different control. touch-action: pan-y is
             in the stylesheet: vertical gestures scroll, horizontal ones
             scrub. -->
        <div class="growth-chart__area"
             role="group"
             tabindex="0"
             aria-label="${plotLabel}"
             aria-activedescendant="growth-point-${activeIndex}"
             data-chart-area>
          <!-- THE TICKS LIVE IN HERE, NOT IN THE PLOT, and that is a
               correctness fix rather than a tidy-up. The plot is 240px and this
               area is 224px (it clears the x-axis), so a tick at bottom 50%
               of the plot and a point at bottom 50% of the area are 8px
               apart - the gridlines did not line up with the data they were
               labelling. One coordinate space is the only way they can agree. -->
          ${yTicks.map((t) => `
            <div class="growth-chart__tick" style="bottom:${t.pct}%" aria-hidden="true"></div>
            <p class="growth-chart__tick-label" style="bottom:${t.pct}%">${valueFormatter(t.value)}</p>
          `).join('')}

          <svg class="growth-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <polyline class="growth-chart__line growth-chart__line--other" points="${polyline(other)}" vector-effect="non-scaling-stroke" />
            <polyline class="growth-chart__line growth-chart__line--active" points="${polyline(key)}" vector-effect="non-scaling-stroke" />
          </svg>

          <!-- The guide, drawn from the active point LEFTWARD to the axis. -->
          <div class="growth-chart__guide" style="bottom:${activeY}%;width:${activeX}%" aria-hidden="true"></div>

          ${points.map((p, i) => `
            <div class="growth-chart__point${i === activeIndex ? ' growth-chart__point--active' : ''}"
                 id="growth-point-${i}"
                 role="option"
                 aria-selected="${i === activeIndex}"
                 aria-label="${pointLabelTemplate(p)}"
                 style="left:${xOf(i)}%;bottom:${at(p)}%"></div>
          `).join('')}

          <!-- ABOVE THE POINT, NEVER BELOW IT (the plan's 6.6.2c): a label
               beneath the point is under the finger on every interaction. The
               room for it is bought in the caller's maxScale headroom, which
               D100 moved from 1.05 to 1.20 for this. -->
          <p class="growth-chart__point-date${activeX > 85 ? ' growth-chart__point-date--end' : activeX < 15 ? ' growth-chart__point-date--start' : ''}" style="left:${activeX}%;bottom:${activeY}%">${active.date}</p>
          <!-- The value the guide terminates in, at the axis edge and in the
               same coordinate space as the guide itself. -->
          <p class="growth-chart__guide-value" style="bottom:${activeY}%" data-chart-guide-value>${valueFormatter(series === 'high' ? active.high : active.low)}</p>
        </div>
      </div>

      <div class="growth-chart__x-axis">
        <p class="growth-chart__x-label growth-chart__x-label--now" style="left:0%">${nowLabel}</p>
        ${yearLabels.map((l) => `<p class="growth-chart__x-label" style="left:${l.pct}%" data-year-label>${l.label}</p>`).join('')}
      </div>

      <div class="growth-chart__legend">
        ${legend.map((l) => `
          <div class="growth-chart__legend-row">
            <span class="growth-chart__swatch growth-chart__swatch--${l.shade}" aria-hidden="true"></span>
            <p>${l.label}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Frame 12's table view (DECISIONS.md D100), the text alternative for the chart
 * above and - under D102's year-only rule - the only place on that screen
 * carrying date resolution finer than a year at rest.
 *
 * IT RENDERS THE SAME `points` ARRAY THE CHART RENDERS and recomputes nothing.
 * That is what guarantees it exposes every value the guide can reveal, rather
 * than a second derivation that could drift from the first.
 *
 * THE SELECTED COLUMN IS MARKED IN WORDS, not by a fill: this is the same
 * WCAG 1.4.1 rule the comparison card's "- your choice" follows.
 */
export function chartTableHTML({ points, series, headers, caption, selectedSuffix, valueFormatter }) {
  const mark = (which) => (which === series ? ` (${selectedSuffix})` : '');
  return `
    <div class="growth-table-wrap">
      <table class="growth-table">
        <caption class="growth-table__caption">${caption}</caption>
        <thead>
          <tr>
            <th scope="col">${headers.month}</th>
            <th scope="col">${headers.low}${mark('low')}</th>
            <th scope="col">${headers.high}${mark('high')}</th>
          </tr>
        </thead>
        <tbody>
          ${points.map((p) => `
            <tr>
              <th scope="row">${p.date}</th>
              <td${series === 'low' ? ' class="growth-table__selected"' : ''}>${valueFormatter(p.low)}</td>
              <td${series === 'high' ? ' class="growth-table__selected"' : ''}>${valueFormatter(p.high)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Binds frame 12's chart: the scrub, hover, click-to-pin, keyboard traversal
 * and the year-label thinning (DECISIONS.md D100).
 *
 * `onActivate(index)` is called with the newly active point. The CALLER owns
 * the active index; this function only reports moves, so the readout, the
 * guide and the in-plot labels all render from one number rather than from
 * three listeners that could disagree.
 *
 * ACTIVATION IS BY RATIO, NEVER BY A PIXEL OFFSET, and this is the one thing in
 * here that must not be "simplified". D92 draws the frame at a CSS scale, so
 * `getBoundingClientRect()` returns VISUAL pixels while layout is in LOGICAL
 * ones. `(clientX - rect.left) / rect.width` is scale-invariant and correct at
 * every window size without this handler knowing the scale exists; the same
 * expression written as a pixel offset divided by a logical width works at one
 * window size and silently mis-aims at the other. See CLAUDE.md's standing rule.
 *
 * NOTHING IS CLEARED ON RELEASE (the plan's 6.6.2a). While a finger is on the
 * screen it covers what is being read, so a detail that cleared on lift could
 * never be read at all. `pointercancel` - which is what the browser fires when
 * it commits to a vertical pan through `touch-action: pan-y` - is handled by
 * the same rule, so the scroll case needs no branch of its own.
 */
export function bindGrowthChart(container, { pointCount, onActivate }) {
  const area = container.querySelector('[data-chart-area]');
  if (!area || pointCount < 1) return;

  const indexFromEvent = (event) => {
    const rect = area.getBoundingClientRect();
    if (!rect.width) return 0;
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(pointCount - 1, Math.round(ratio * (pointCount - 1))));
  };

  let scrubbing = false;
  let pinned = false;

  const move = (event) => onActivate(indexFromEvent(event));

  area.addEventListener('pointerdown', (event) => {
    scrubbing = true;
    pinned = true;
    // Capture so a drag that leaves the plot keeps tracking rather than
    // stopping at the edge, which reads as the control jamming.
    if (area.setPointerCapture && event.pointerId !== undefined) {
      try { area.setPointerCapture(event.pointerId); } catch { /* not capturable */ }
    }
    move(event);
  });

  area.addEventListener('pointermove', (event) => {
    // Hover moves the active point WITHOUT a click (the plan's 6.6.5) - the
    // pointer path is the one the sessions actually observe. A pinned point
    // still follows the pointer while it is over the plot; what pinning buys
    // is surviving `pointerleave`.
    if (scrubbing || event.pointerType !== 'touch') move(event);
  });

  // Both end the gesture and NEITHER clears the active point.
  area.addEventListener('pointerup', () => { scrubbing = false; });
  area.addEventListener('pointercancel', () => { scrubbing = false; });

  area.addEventListener('keydown', (event) => {
    const current = Number(area.getAttribute('aria-activedescendant')?.replace('growth-point-', '') ?? 0);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(pointCount - 1, current + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, current - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End' || event.key === 'Escape') next = pointCount - 1;
    if (next === null) return;
    event.preventDefault();
    pinned = true;
    onActivate(next);
  });

  // THE GUIDE VALUE AND THE Y-TICK LABELS SHARE THE 48px GUTTER, so whenever
  // the active point sits near a tick the two draw on top of each other - which
  // the first shot of this chart showed at the at-rest point, £19,611 landing on
  // £20,000. The tick is the one that gives way: it is context, and the guide
  // value is the answer to the question the participant is asking. Measured
  // against the rendered boxes rather than against an assumed row height, so it
  // follows the Large text size.
  const guideValue = container.querySelector('[data-chart-guide-value]');
  if (guideValue) {
    const guideBox = guideValue.getBoundingClientRect();
    for (const label of container.querySelectorAll('.growth-chart__tick-label')) {
      const box = label.getBoundingClientRect();
      const overlaps = box.top < guideBox.bottom && box.bottom > guideBox.top;
      label.style.visibility = overlaps ? 'hidden' : '';
    }
  }

  // THE THINNING RULE, MEASURED RATHER THAN ESTIMATED (the plan's 6.4). A year
  // label is kept only if its left edge clears the previously kept label's
  // right edge by 8px. Measured from the rendered text, so it follows the Large
  // text size instead of a constant that would be right at one of them.
  // THE WALK STARTS AT THE "Now" LABEL, which is fixed at x=0 and is not a
  // year - so it was outside the loop, and the first year label could draw on
  // top of it. It is the one label that is never thinned, so it seeds the walk.
  const nowLabel = container.querySelector('.growth-chart__x-label--now');
  const labels = [...container.querySelectorAll('[data-year-label]')];
  let lastRight = nowLabel ? nowLabel.getBoundingClientRect().right : -Infinity;
  for (const label of labels) {
    const box = label.getBoundingClientRect();
    if (box.left < lastRight + 8) { label.hidden = true; continue; }
    label.hidden = false;
    lastRight = box.right;
  }
}

/**
 * Regulatory / Risk warning (frames 13, 15, 16): a bordered card with a
 * warning-triangle icon and body text. Distinct from `.warning-banner`
 * (DECISIONS.md D7's red error-state banner) — this is a neutral, always-on
 * regulatory/informational box (both the MCOB 3A repossession warning and
 * frame 13's "these are typical market ranges, not rates we're offering
 * you" note use this exact same visual wrapper in the reference PNGs).
 */
export function riskWarningHTML(text) {
  return `
    <div class="risk-warning-card">
      ${exclamationTriangle({ size: 'body', className: 'risk-warning-card__icon' })}
      <p class="risk-warning-card__text">${text}</p>
    </div>
  `;
}

/**
 * Content / Progress bar (frames 15, 16): a filled track toward the goal.
 *
 * NO CHECKPOINT MARKER AND NO LABEL ROW SINCE D51'S SECOND AMENDMENT. It
 * carried a 2px mark at 75% with "Checkpoint" beneath the track. Both are gone,
 * for D71's reason applied to the element D71 itself declined to remove: the
 * bar was carrying two kinds of fact on one axis - a position and a milestone -
 * and the milestone was the one nothing else on the screen explained. The
 * checkpoint is unchanged in the model and still decides the variant this bar
 * is drawn on; it is simply not drawn any more.
 *
 * DIVIDED, OPTIONALLY, SINCE DECISIONS.md D70. Pass `segments` to split the
 * track into named parts - `/tracker` passes the deposit and the stamp duty
 * that make up the goal, so the tax reads as part of the same goal rather than
 * a second one beside it. Omit it and the bar is exactly what it was: one
 * fill, one marker, one label.
 *
 * `segments` is `[{ widthPct, shade, label }]` in track order. `shade` is
 * 'primary' or 'muted', the two shades of one colour (`--color-accent-neutral`
 * and `--color-accent-neutral-muted`).
 *
 * THREE RULES THIS FUNCTION ENFORCES, and they are not stylistic:
 *
 *   1. COLOUR NEVER CARRIES THE MEANING - BUT THE LEGEND IS NO LONGER WHAT
 *      CARRIES IT (D70's second amendment). The segments are drawn IN
 *      PROPORTION to their amounts, and the caller states both amounts in
 *      prose directly above the bar, so SIZE maps the amounts to the segments.
 *      Size is not colour, so WCAG 1.4.1 is satisfied independently of the
 *      shades and independently of any legend. `segments` therefore carries no
 *      labels any more; `/tracker` renders the same two strings in a
 *      disclosure below the bar, closed by default.
 *   2. THE JOIN IS MARKED WITHOUT RELYING ON THE TWO SHADES. A 1px
 *      `--color-label` hairline sits at each internal boundary, so the division
 *      survives at any contrast. It was `--color-surface`, which on a light
 *      page is within 1.06:1 of the page itself, so it read as a slit through
 *      the bar rather than a line drawn on it and broke the track into chunks
 *      (D70's third amendment). Ink, not background: `--color-label` is the
 *      opposite of the page in both themes.
 *   3. A ZERO PART COLLAPSES. A segment with no width is dropped, and if that
 *      leaves one segment the bar renders as an ordinary single undivided
 *      fill. `/tracker` relies on this below the 300,000 nil-rate band, where
 *      the tax genuinely is nothing, and suppresses its own explanatory
 *      sentence on the same test.
 *
 * `endLabel` puts a figure at the RIGHT-HAND END of the track, on the same
 * row, so the bar reads from what has been saved to what is being aimed at.
 * The track flexes and the label does not: a truncated currency figure is
 * worse than a shorter track, so all the width pressure goes to the track.
 */
export function progressBarHTML({ fillPct, segments = null, endLabel = null }) {
  const clampedFill = Math.max(0, Math.min(100, fillPct));

  // Rule 3, applied before anything is measured: a part with no width is not a
  // part. `> 0` rather than a tolerance - these come from real amounts, and an
  // amount is either zero or it is not.
  const drawn = (segments || []).filter((seg) => seg.widthPct > 0);
  const divided = drawn.length > 1;

  // TWO LAYERS, NOT ONE, AND THE BAR IS WRONG WITHOUT BOTH.
  //
  // The segments describe the GOAL - what the participant is saving toward and
  // what it is made of. The fill describes the POSITION - how much of it they
  // have. An earlier version of this function drew segments INSTEAD of the fill
  // when divided, which silently turned the tracker's progress bar into a
  // composition chart: at 12,000 of a 52,500 goal it drew a bar that looked
  // 86% full, because that is the deposit's share of the goal. See D70.
  //
  // So the segments are a background layer inset over the whole track, and the
  // fill sits on top of them. Three regions result, and each says a different
  // thing: solid is saved, the lighter band is deposit still to save, the
  // middle band is the tax. The join and the checkpoint marker are drawn above
  // both layers so neither is hidden by the fill.
  const segmentsHTML = divided
    ? `
      <div class="progress-bar__segments">
        ${drawn.map((seg, i) => `
          <div
            class="progress-bar__segment progress-bar__segment--${seg.shade}"
            style="width:${Math.max(0, Math.min(100, seg.widthPct))}%"
          ></div>
          ${i < drawn.length - 1 ? '<div class="progress-bar__join"></div>' : ''}
        `).join('')}
      </div>
    `
    : '';

  return `
    <div class="progress-bar">
      <div class="progress-bar__row">
        <div class="progress-bar__track">
          ${segmentsHTML}
          <div class="progress-bar__fill" style="width:${clampedFill}%"></div>
        </div>
        ${endLabel ? `<p class="progress-bar__end-label">${endLabel}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Content / Milestone tracker (frames 15, 16): a vertical stack of milestones,
 * each in one of FOUR states. `milestones` is `[{ title, body, state }]`.
 *
 * It was three, confirmed against the reference PNGs, with frame 16's
 * "Mortgage in Principle" rendering as 'current'. That is the one place this
 * build now diverges from the reference deliberately - see D42 and the note
 * below.
 *
 * FOUR STATES, AND THE FOURTH IS THE POINT (DECISIONS.md D42).
 *
 * The icon says DONE or NOT DONE. The text colour says BLOCKED or NOT BLOCKED.
 * Those are two independent facts and the row needs both:
 *
 *   done       filled circle, full-colour text    achieved, earlier
 *   current    outline circle, full-colour text   achieved, most recently
 *   available  dashed circle, FULL-COLOUR text    not done, and not blocked
 *   locked     dashed circle, greyed text         not done, and blocked
 *
 * `available` shares `starCircleDashed` with `locked` deliberately: a dashed
 * circle is this build's "not filled in yet" mark and that is exactly what is
 * true of it. What separates the two is the text colour, and `available` gets
 * that for free by taking `.milestone-row__title`'s own default - only
 * `--locked` overrides it (components.css). No new vector, no new token.
 *
 * WHY IT EXISTS. Without it, `current` meant two incompatible things depending
 * on which row it landed on: "the milestone you just completed" on the locked
 * variant's "Deposit goal set", and "the thing you may now do" on the unlocked
 * variant's "Mortgage in Principle". A participant cannot be asked to tell what
 * the app has done from what it has not while the list says both with one mark.
 */
const MILESTONE_ICON = {
  done: starCircleFill,
  current: starCircle,
  available: starCircleDashed,
  locked: starCircleDashed,
};

export function milestoneTrackerHTML(milestones) {
  return `
    <div class="milestone-tracker">
      ${milestones.map((m, i) => `
        ${i > 0 ? '<div class="milestone-row__divider"></div>' : ''}
        ${m.action ? `<button type="button" class="milestone-row milestone-row--${m.state}" data-action="${m.action}">` : `<div class="milestone-row milestone-row--${m.state}">`}
          ${MILESTONE_ICON[m.state]({ size: 'large', className: 'milestone-row__icon' })}
          <div class="milestone-row__content">
            <p class="milestone-row__title">${m.title}</p>
            <p class="milestone-row__body">${m.body}</p>
          </div>
        ${m.action ? '</button>' : '</div>'}
      `).join('')}
    </div>
  `;
}

/**
 * Process timeline (frame 18): where the step the participant is reading
 * about sits in a longer sequence.
 *
 * THIS IS A PROCESS SEQUENCE, NOT A PROGRESS INDICATOR, and the distinction
 * is the reason it is built the way it is. DESIGN.md excludes linear progress
 * bars and segmented bars for proportions; this is neither, and a later
 * design-rule sweep should not remove it on sight. See DECISIONS.md D36. The
 * differences are structural, not cosmetic:
 *
 *   - It is VERTICAL. Every bar in this app is horizontal.
 *   - It is discrete NODES joined by a thin connector, not a track with a
 *     filled portion. Nothing here is divided into parts and nothing is
 *     filled to a proportion.
 *   - It measures nothing. There is no fraction, no percentage and no
 *     value behind it — it is four named stages of buying a house, which
 *     are the same four for every participant.
 *   - It has NO COMPLETED STATE. A step is either the one the participant
 *     is reading about (`current`) or one still ahead of them (`ahead`).
 *     Nothing is ever ticked off, because reaching this screen does not
 *     complete anything.
 *
 * VERTICAL RATHER THAN HORIZONTAL, because of the labels. At 320px the
 * content column is 280px after the screen inset and 248px inside a card;
 * four horizontal columns would be 62px each, and "Full mortgage
 * application" does not set in 62px at footnote size without either
 * truncating or dropping below the type scale. Stacking was the instruction's
 * own preference over shrinking the type, and it is also what makes the
 * shape unmistakable from a bar.
 *
 * NOT INTERACTIVE. Every element is a <p>, <li> or <div> — no button, no
 * link, no tabindex, no data-action. There is nothing to bind and no screen
 * module should bind anything to it.
 *
 * THE SEQUENCE IS IN THE MARKUP, not only in the drawing. It is an <ol>, so
 * a screen reader announces "list, 4 items" and numbers each one; the
 * current step carries `aria-current="step"` AND a visible "You are here"
 * note, so the participant's position survives both a reader that ignores
 * aria-current and a participant who cannot see the filled node.
 *
 * `steps` is an array of { label, note } in order. `currentIndex` is which
 * one the participant is at.
 */
export function processTimelineHTML({ heading, headingId, steps, currentIndex }) {
  const items = steps.map((step, i) => {
    const isCurrent = i === currentIndex;
    const glyph = isCurrent ? circleDot : circle;
    return `
      <li class="process-timeline__step process-timeline__step--${isCurrent ? 'current' : 'ahead'}"${isCurrent ? ' aria-current="step"' : ''}>
        <div class="process-timeline__marker">
          ${glyph({ size: 'body', className: 'process-timeline__node' })}
          ${i < steps.length - 1 ? '<div class="process-timeline__connector"></div>' : ''}
        </div>
        <div class="process-timeline__content">
          <p class="process-timeline__label">${step.label}</p>
          ${step.note ? `<p class="process-timeline__note">${step.note}</p>` : ''}
        </div>
      </li>
    `;
  }).join('');

  return `
    <div class="process-timeline">
      <p class="process-timeline__heading" id="${headingId}">${heading}</p>
      <ol class="process-timeline__list" aria-labelledby="${headingId}">
        ${items}
      </ol>
    </div>
  `;
}

/**
 * Content / Stat row (frames 15, 16's "This month" card): a label + value on
 * one line, a provenance caption on the next. Distinct from
 * `figureRowHTML`'s `trailing` mode, which has no caption line.
 */
export function statRowHTML({ label, value, caption }) {
  // THE CAPTION IS OPTIONAL, BECAUSE A PROVENANCE CLAIM OVER AN ABSENT FIGURE
  // IS A FALSE ONE. This row was emitting its caption unconditionally, so the
  // tracker's "On track for" row could render an em dash under
  // "Worked out from what you're putting aside each month" - naming a
  // derivation, and the input it ran on, for a figure that is not there. The
  // guard is here rather than in the caller because the component owns what it
  // draws; a caller with no figure to explain now passes no caption. D5's rule
  // is unaffected: every figure that DOES render still carries its provenance.
  return `
    <div class="stat-row">
      <div class="stat-row__line">
        <p class="stat-row__label">${label}</p>
        <p class="stat-row__value">${value}</p>
      </div>
      ${caption ? `<p class="stat-row__caption">${caption}</p>` : ''}
    </div>
  `;
}

/**
 * Content / Rate band row (frames 15, 16's rates-card): a two-line label
 * (amount + "n% deposit") on the left, a rate range on the right, with an
 * optional highlight border for the row matching the participant's own
 * chosen deposit %.
 */
export function rateBandRowHTML({ label, sublabel, value, highlighted, describedBy = null }) {
  // `describedBy` BINDS THE ROW TO ITS FOOTNOTE (DECISIONS.md D101). The
  // participant asked at 24:27 for a marker tying the caption to the figures it
  // describes; the visible marker is a literal character in `content.js`, and
  // this is the same binding for assistive technology, which must not depend on
  // a glyph being announced.
  return `
    <div class="rate-band-row${highlighted ? ' rate-band-row--highlighted' : ''}"${describedBy ? ` aria-describedby="${describedBy}"` : ''}>
      <div class="rate-band-row__content">
        <p class="rate-band-row__label">${label}</p>
        <p class="rate-band-row__sublabel">${sublabel}</p>
      </div>
      <p class="rate-band-row__value">${value}</p>
    </div>
  `;
}

/**
 * Transparency / How this works card: a title, an intro line, a stack of
 * label/value/caption rows, and a nav row into the fuller assumptions
 * screen. Built for frame 06 but written generically (rows as data) since
 * the Figma component name marks it as a design-system piece likely reused
 * by the assumptions/results screens later.
 *
 * IT IS A DISCLOSURE, CLOSED ON LOAD (DECISIONS.md D12). Everything below
 * the title collapses behind it — the intro, the rows and the nav row into
 * the assumptions sheet. The title is the header, so the card reads as one
 * line until it is asked for. D12's reasoning applies to this card exactly
 * as it does to frames 05/06/19's accordions: a working-out a participant
 * never chose to open cannot tell you whether they would have, and this is
 * the largest always-open block in the flow — five screens, roughly a third
 * of a phone screen each.
 *
 * IT SHARES `data-action="toggle-disclosure"` AND `data-disclosure-id` WITH
 * `disclosureHTML` ABOVE, deliberately. Frame 06 now carries two collapsibles
 * (its "What we used to check this" breakdown and this card), so a screen can
 * no longer bind a single `querySelector('[data-action="toggle-disclosure"]')`
 * — it binds them all and routes on the id. One action name keeps that one
 * loop, rather than a second name every screen has to know about.
 *
 * The nav row lives INSIDE the collapsed region on purpose. It is the footer
 * of the working-out, not a second entry point to it: leaving it visible
 * while the card is closed would put an unexplained "how we worked out X"
 * link directly under a heading that says the same thing, which is the
 * duplication this card was just untangled from.
 */
export function howThisWorksCardHTML({ id, open = false, title, intro, rows, navLabel, navAction, footnote }) {
  const contentId = `how-this-works-content-${id}`;
  return `
    <div class="card how-this-works-card${open ? '' : ' how-this-works-card--closed'}">
      <h3 class="how-this-works-card__heading">
        <button type="button" class="how-this-works-card__header" data-action="toggle-disclosure" data-disclosure-id="${id}" aria-expanded="${open}" aria-controls="${contentId}">
          <span class="how-this-works-card__title">${title}</span>
          ${chevronUp({ size: 'body', weight: 'semibold', className: 'how-this-works-card__chevron' })}
        </button>
      </h3>
      <div class="how-this-works-card__content" id="${contentId}"${open ? '' : ' hidden'}>
        <p class="how-this-works-card__intro">${intro}</p>
        <div class="how-this-works-card__rows">
          ${rows.map((row) => `
            <div class="how-this-works-card__row">
              <p class="how-this-works-card__row-label">${row.label}</p>
              <p class="how-this-works-card__row-value">${row.value}</p>
              <p class="how-this-works-card__row-caption">${row.caption}</p>
            </div>
          `).join('')}
        </div>
        <button type="button" class="how-this-works-card__nav" data-action="${navAction}">
          ${infoCircle({ size: 'body', className: 'info-link__icon' })}
          <span class="how-this-works-card__nav-label">${navLabel}</span>
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
        ${footnote ? `<p class="how-this-works-card__footnote">${footnote}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Content / Tick list (frame 17's "What this step does"): a checked-circle
 * icon beside a single line of text, one row per item — distinct from
 * checklistRowHTML below, whose rows carry a bold value and a caption under
 * the label (frame 19's "We've already got" card).
 */
export function tickListHTML(rows) {
  return `
    <div class="tick-list">
      ${rows.map((text) => `
        <div class="tick-list__row">
          ${checkmarkCircle({ size: 'body', className: 'tick-list__icon' })}
          <p class="tick-list__text">${text}</p>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Content / List row, checked/unchecked variant (frame 19's "We've already
 * got" card and its own "What you'll still be asked" disclosure): a state
 * icon beside a label, an optional bold value, and an optional caption.
 * `value`/`caption` omitted renders just the icon + label, the shape the
 * disclosure rows need.
 *
 * `state` is 'checked' (the bank already holds this figure) or 'pending'
 * (it will be asked for). These were literal "✓" and "○" characters until
 * the icon-set pass — whatever weight and baseline the participant's system
 * font happened to give them, next to real icons drawn at a fixed weight on
 * the same row.
 */
const CHECKLIST_ICON = {
  checked: checkmark,
  pending: circle,
};

export function checklistRowHTML({ state = 'pending', label, value, caption }) {
  return `
    <div class="checklist-row">
      ${CHECKLIST_ICON[state]({ size: 'subheadline', weight: 'semibold', className: 'checklist-row__glyph' })}
      <div class="checklist-row__content">
        <p class="checklist-row__label">${label}</p>
        ${value ? `<p class="checklist-row__value">${value}</p>` : ''}
        ${caption ? `<p class="checklist-row__caption">${caption}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Results / Result panel (frames 20, 21): a centred icon, headline and body
 * inside its own card — the top-of-screen summary of a Mortgage in
 * Principle result, positive or not-yet.
 */
export function resultPanelHTML({ icon: iconFn, headline, body }) {
  return `
    <div class="card result-panel">
      ${iconFn({ size: 'large', className: 'result-panel__icon' })}
      <p class="result-panel__headline">${headline}</p>
      <p class="result-panel__body">${body}</p>
    </div>
  `;
}

/**
 * Results / Next steps card (frames 20, 21): a title and a numbered list of
 * rows, each a bold title + caption. `steps` is
 * `[{ number, title, caption, action }]`, and `action` is OPTIONAL.
 *
 * A ROW IS A CONTROL WHEN, AND ONLY WHEN, IT DECLARES AN ACTION. A step with
 * one renders a `<button>` carrying the chevron; a step without one renders a
 * plain `<div>` with no chevron and no focus stop. Two rules meet here and
 * they are the same rule:
 *
 *   - The chevron is the app's claim that a row goes somewhere, so it is
 *     drawn from the fact that decides it rather than passed in beside it.
 *     `consent.js` already draws its account-row chevron this way, and
 *     `flagRowHTML` is the standing counter-example - a chevron on a row
 *     whose `report-issue` action nothing binds.
 *   - A `<button>` with nothing bound to it is a dead focus stop, which is
 *     worse than a quiet one: it takes a tab press and answers with nothing.
 *     Same reasoning as D11 rendering the inert tabs `disabled`.
 *
 * On both result screens only the adviser row is a control. Frame 20's first
 * step declares no action (DECISIONS.md D50) and its second - the MCOB 4.8A
 * adviser route - does; frame 21's first and second declare none (D52) and its
 * third, the same adviser route, does.
 */
export function nextStepsCardHTML({ title, steps }) {
  return `
    <div class="card next-steps-card">
      <p class="next-steps-card__title">${title}</p>
      ${steps.map((step, i) => {
        const rowClass = `next-steps-card__row${i < steps.length - 1 ? ' next-steps-card__row--divided' : ''}`;
        const rowBody = `
          <p class="next-steps-card__number">${step.number}</p>
          <div class="next-steps-card__content">
            <p class="next-steps-card__step-title">${step.title}</p>
            <p class="next-steps-card__caption">${step.caption}</p>
          </div>`;
        return step.action
          ? `
        <button type="button" class="${rowClass}" data-action="${step.action}">${rowBody}
          ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
        </button>
      `
          : `
        <div class="${rowClass}">${rowBody}
        </div>
      `;
      }).join('')}
    </div>
  `;
}

/**
 * Sheet header (frames 03b, 10c, 29, 30, 31, 32): a centred drag handle above
 * a row holding the sheet's heading and, where the frame draws one, its close
 * control. Introduced for the four "Assumptions and sources" sheets, which all
 * draw this exact header, and since extended to every sheet that has a heading
 * of its own so the head of a sheet is one shape across the feature.
 *
 * `closeLabel` IS OPTIONAL, AND ITS ABSENCE IS THE WHOLE POINT ON 03b/10c.
 * Those two dismiss via the scrim or a labelled button ("Not now", "Keep
 * going") and draw no close glyph in their reference PNGs; a second, unlabelled
 * exit next to an explicit pair of choices would be a control this prototype
 * invented. What they take from the header is its structure — the heading
 * fixed above the scroller, on the same margins and with the same clearance
 * below the grabber. Frame 13b takes neither: its only heading belongs to the
 * video placeholder inside the scroller, so it keeps the bare drag handle.
 *
 * THE HEADING BELONGS TO THE HEADER, NOT THE SCROLLER (DECISIONS.md D19).
 * It used to be the first child of `.bottom-sheet__content`, with the close
 * control absolutely positioned over the top-right corner — which is what
 * put a 48px circular button on top of the first line of the title. The
 * close control has to share a row with the heading for the two to align
 * and for the heading's text column to end where the icon begins; and that
 * row has to sit outside the scroller, or the only way out of a sheet
 * scrolls off the top of it. Both facts point at the same structure, so the
 * heading moved up here.
 *
 * `data-action="dismiss"` matches the action name every other sheet already
 * binds its scrim/button dismiss handlers to, so one
 * querySelectorAll('[data-action="dismiss"]') wires the scrim, this button,
 * and any other dismiss control together — and src/sheet-drag.js closes
 * through this same button when the sheet is dragged down.
 */
export function sheetHeaderHTML({ heading, headingId = 'sheet-heading', closeLabel }) {
  return `
    <div class="bottom-sheet__header">
      <div class="bottom-sheet__drag-handle-bar"></div>
      <div class="bottom-sheet__title-row">
        <h2 class="screen-title bottom-sheet__title" id="${headingId}">${heading}</h2>
        ${closeLabel ? `
        <button type="button" class="bottom-sheet__close" data-action="dismiss" aria-label="${closeLabel}">
          ${xmark({ size: 'title3', className: 'app-bar__icon' })}
        </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Prototype controls / Pill segments (frame 33): a row of equal-width,
 * individually-bordered pill buttons, one selected. Distinct from both
 * `chipRowHTML` (wraps, auto-width per chip — frames 09/09b's deposit %
 * choices) and `segmentedControlHTML` (one grouped track with an inset
 * selected segment, no per-option border — frames 10/10b's solveFor
 * toggle): frame 33's five controls need equal-width pills that fill the
 * row and never wrap, which neither existing pattern does without changing
 * its current behaviour on the frames that already reuse it. `options` is
 * `[{ value, label }]`.
 */
export function pillSegmentsHTML({ options, selected, action }) {
  return `
    <div class="pill-segments">
      ${options.map((opt) => `
        <button type="button" class="pill-segments__option${opt.value === selected ? ' pill-segments__option--selected' : ''}" data-action="${action}" data-value="${opt.value}" aria-pressed="${opt.value === selected}">${opt.label}</button>
      `).join('')}
    </div>
  `;
}

/**
 * Content / Processing state (frame 19b): a spinner, a title, a body line
 * and a tertiary caption, centred inside a bordered card. The spinner is a
 * pure-CSS rotating ring (no animated asset) — see components.css's
 * `.processing-state__spinner`, which also honours `prefers-reduced-motion`.
 */
export function processingStateHTML({ title, body, caption }) {
  return `
    <div class="processing-state">
      <div class="processing-state__spinner" aria-hidden="true"></div>
      <p class="processing-state__title">${title}</p>
      <p class="processing-state__body">${body}</p>
      <p class="processing-state__caption">${caption}</p>
    </div>
  `;
}
