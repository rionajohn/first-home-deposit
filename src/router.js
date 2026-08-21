/**
 * Hash-based router — works on static hosting with no server config.
 * Routes are the build-spec.md section 3 screen inventory, exactly as
 * written there (query strings like ?mode=estimate select a state variant
 * of a route, not a separate route — build-spec.md section 3's own note:
 * "Where two frames share a route they are variants of one screen, not two
 * screens.").
 *
 * Every route below has a registered screen module except stray typed URLs
 * outside the section 3 inventory, which fall through to a visible "not
 * built yet" placeholder rather than a broken screen.
 */

import { getState, setState, resetState, resetCollapsibles } from './state.js';
import content from './content.js';
import { bottomNavHTML, NAVIGABLE_TABS } from './components/ui.js';
import { mountActionBars } from './action-bar.js';
import { mountSheetDrag, dismissControlFor } from './sheet-drag.js';

export const ROUTES = [
  '/home',
  '/journey',
  '/consent',
  '/consent/move-account',
  '/consent/declined',
  '/position',
  '/position/summary',
  '/goals',
  '/goal-check',
  '/calculator/property',
  '/calculator/saving',
  '/calculator/exit',
  '/calculator/review',
  '/calculator/result',
  '/learn/ltv',
  '/learn/ltv/video',
  '/tracker',
  '/mip',
  '/mip/about',
  '/mip/pre-check',
  '/mip/running',
  '/mip/result/likely',
  '/mip/result/not-yet',
  '/mip/adviser',
  '/assumptions/saving',
  '/assumptions/deposit',
  '/assumptions/borrowing',
  '/assumptions/sources',
  '/settings',
];

const registry = new Map();

export function registerRoute(path, render) {
  if (!ROUTES.includes(path)) {
    throw new Error(`"${path}" is not in the section 3 screen inventory`);
  }
  registry.set(path, render);
}

function parseHash() {
  const raw = window.location.hash.slice(1) || '/home';
  const [path, query] = raw.split('?');
  return { path: path || '/home', params: new URLSearchParams(query || '') };
}

function renderNotBuilt(container, path) {
  container.innerHTML = `<div class="not-built">Not built yet: ${path}</div>`;
}

/**
 * SPEC.md's 7 sheets (03b, 10c, 13b, 29, 30, 31, 32) — each renders a
 * `[role="dialog"]` bottom sheet (src/screens' shared markup, see G-notes
 * in ui.js's sheetHeaderHTML) as the *entire* contents of #app, since every
 * screen (dialog or not) fully replaces #app's children rather than
 * layering over what was there. That full-replacement behaviour is what
 * makes the focus handling below possible without touching any of the ~25
 * individual "open a sheet" call sites across src/screens/: the trigger
 * element is still the live, focused DOM node at the moment a hash change
 * fires (the new screen hasn't rendered yet), so it can be captured
 * generically by its `data-action`, and the *returning* screen's fresh
 * render reliably contains a matching `[data-action]` element (same
 * template, same attribute) to refocus.
 */
const DIALOG_ROUTES = new Set([
  '/consent/move-account',
  '/calculator/exit',
  '/learn/ltv/video',
  '/assumptions/saving',
  '/assumptions/deposit',
  '/assumptions/borrowing',
  '/assumptions/sources',
]);

/**
 * Routes that do NOT carry the persistent bank tab bar (DECISIONS.md D11).
 * Everything else in the section 3 inventory gets it mounted automatically
 * by `mountBottomNav` below, so a new full-screen journey screen inherits it
 * without touching this file.
 *
 * The seven sheets are `DIALOG_ROUTES` verbatim, spread in rather than
 * relisted so the two sets cannot drift apart. A tab bar under a sheet would
 * sit inside the sheet's own card, below the scrim, and offer a second
 * dismissal that skips the close behaviour each sheet defines for itself
 * (13b's video-seen flag, 10c's journeyPaused). Apple's HIG says the same
 * thing structurally: a tab bar belongs to the screen behind a sheet, not to
 * the sheet.
 *
 * The two others:
 *   - `/mip/running` (19b) — a determinate processing state that resolves to
 *     20 or 21 on its own. Offering an exit mid-check would leave
 *     `checkRunAt` set with no result, and "did the participant wait" is
 *     part of what 19b is for.
 *   - `/settings` (33) — facilitator-only, deliberately outside the
 *     participant journey and reachable only by typing the URL (GAPS.md
 *     G23). It has its own close control back to /home already.
 */
const BOTTOM_NAV_EXCLUDED_ROUTES = new Set([
  ...DIALOG_ROUTES,
  '/mip/running',
  '/settings',
]);

/**
 * The calculator's step flow (frames 09, 09a, 09b, 10, 10b, 11). These keep
 * the tab bar — they are full-screen journey screens, and "from anywhere in
 * the journey" includes mid-calculator — but its Home tab routes through
 * frame 10c ("Leave this for now?") rather than jumping straight to frame
 * 01, because build-spec.md section 1 already defines what leaving the
 * calculator means: the form-header close on 09/10/10b opens 10c, and only
 * 10c's own "Leave" sets `journeyPaused = true` and retains the draft
 * inputs. A tab bar that bypassed that would silently drop a participant's
 * part-entered figures — a data-loss bug, not a shortcut. Frame 11 has no
 * close control drawn, but it is the same step flow holding the same drafts,
 * so it is treated the same way.
 */
const CALCULATOR_STEP_ROUTES = new Set([
  '/calculator/property',
  '/calculator/saving',
  '/calculator/review',
]);

/**
 * Which tab bar entry is lit on which route — and on most routes, none is.
 *
 * A tab is active when the current route IS that tab's destination, which is
 * true on exactly two screens. Everything else in the app is the "Your first
 * home" journey, which is not one of the bank's five tabs: it is a feature
 * reached FROM Home, not Home itself. Lighting Home on all 18 of those
 * screens claimed the participant was on the bank's home screen while they
 * were mid-way through a mortgage calculator, and left the bar with no way to
 * show the one case where they really were on Home.
 *
 * Any route not listed gets `null`, which `bottomNavHTML` renders as "no tab
 * active".
 */
const TAB_FOR_ROUTE = new Map([
  ['/home', 'home'],
  ['/goals', 'goals'],
]);

/**
 * Mounts the persistent tab bar on any route that should carry it.
 *
 * Called after the screen has rendered, and again by the observer below
 * whenever a screen rewrites `#app`'s children — every screen module builds
 * itself with `container.innerHTML = ...`, and several of them re-render
 * themselves in place from a toggle handler without going through the
 * router at all (position.js's breakdown, consent.js's account rows,
 * settings.js's five controls). Re-appending on mutation is what makes the
 * bar genuinely persistent across those in-place re-renders without adding
 * a nav call to ~20 screen modules and having to remember it in the 21st.
 *
 * THIS FUNCTION IS THE ONLY PLACE THE BAR IS RENDERED OR BOUND. Frame 01
 * used to draw its own copy, and the `querySelector` guard below — there to
 * stop the observer re-appending on every mutation — then made this a no-op
 * on exactly that screen, so frame 01's tabs were rendered and wired to
 * nothing. Harmless while Home was the only live tab; not harmless once
 * Goals resolved. The guard stays (the observer still needs it); what went
 * is the second renderer.
 */
function mountBottomNav(container, path) {
  if (BOTTOM_NAV_EXCLUDED_ROUTES.has(path)) return;
  if (container.querySelector('.bottom-nav')) return;

  // Which tab is lit is a fact about the route, not about the bar — and on
  // most routes the answer is "none". See TAB_FOR_ROUTE above.
  const active = TAB_FOR_ROUTE.get(path) ?? null;
  container.insertAdjacentHTML('beforeend', bottomNavHTML(content.shared.bottomNav, { active }));

  container.querySelectorAll('[data-action="nav-tab"]').forEach((tab) => {
    const target = NAVIGABLE_TABS[tab.dataset.tab];
    if (!target) return;
    tab.addEventListener('click', () => {
      // Leaving mid-calculator goes through 10c whichever tab is used to do
      // it — build-spec.md section 1 already defines what leaving the
      // calculator means, and that definition does not depend on which piece
      // of chrome the participant reached for. `returnFrame` is what brings
      // them back if they choose "Keep going".
      if (CALCULATOR_STEP_ROUTES.has(path)) {
        setState({ returnFrame: path });
        window.location.hash = '#/calculator/exit';
        return;
      }
      window.location.hash = `#${target}`;
    });
  });
}

function isDialogOpen(container) {
  return !!container.querySelector('[role="dialog"]');
}

function focusableElements(root) {
  return Array.from(
    root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
  ).filter((el) => el.offsetParent !== null);
}

// The data-action of whatever triggered the currently-open (or
// about-to-open) dialog — set when a dialog route is entered, consumed and
// cleared when that dialog closes back to a non-dialog route.
let pendingFocusRestoreAction = null;

/** Moves focus into a freshly-opened dialog: its first focusable element, or the dialog itself if it has none. */
function focusIntoDialog(container) {
  const dialog = container.querySelector('[role="dialog"]');
  if (!dialog) return;
  const [first] = focusableElements(dialog);
  if (first) {
    first.focus();
  } else {
    dialog.setAttribute('tabindex', '-1');
    dialog.focus();
  }
}

/**
 * Traps Tab/Shift+Tab within the open dialog. Registered once; checks on
 * every keypress whether a dialog is actually open rather than being
 * added/removed per open/close, so there's exactly one listener for the
 * app's lifetime regardless of how many sheets are opened and closed.
 */
function handleDialogTabTrap(event) {
  const container = document.getElementById('app');
  const dialog = container.querySelector('[role="dialog"]');
  if (!dialog) return;

  // Every sheet already wires its scrim tap and (where drawn) close button
  // to `[data-action="dismiss"]`, each with its own screen-specific close
  // behaviour (e.g. learn-ltv-video.js also sets ltvVideoSeen). Escape
  // reuses that existing, already-correct handler via a synthetic click
  // rather than duplicating what each screen's dismiss does. The drag
  // gesture (sheet-drag.js) closes through the very same control, found by
  // the very same helper — that is why the selector lives there and is
  // imported here, rather than being written out in both places and left to
  // drift.
  if (event.key === 'Escape') {
    const dismiss = dismissControlFor(container);
    if (dismiss) dismiss.click();
    return;
  }

  if (event.key !== 'Tab') return;

  const items = focusableElements(dialog);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!dialog.contains(document.activeElement)) {
    // Focus escaped the dialog (e.g. a programmatic .focus() elsewhere) —
    // pull it back in rather than letting Tab continue from outside.
    event.preventDefault();
    first.focus();
  }
}

/**
 * Applies frame 33's global scenario state (build-spec.md section 7) as
 * modifier classes on the `.screen` element — the one thing besides the
 * theme/mode/stage/result *data* frame 33 also has to change is what's
 * actually painted, and `.text-large` (tokens.css's --text-scale) is the
 * one control with a real, cross-screen visual effect. Exported so
 * settings.js can call it directly after its own in-place re-render
 * (toggling text size updates the screen the facilitator is looking at
 * immediately, not only on the next navigation).
 */
export function applyScenarioClasses(container, state) {
  container.classList.toggle('text-large', state.textSize === 'large');
  // The app renders light on every device, deterministically — tokens.css
  // no longer reads prefers-color-scheme at all, so `state.theme` (frame
  // 33's Theme control, and `resetState()`'s default) is the only thing that
  // can select a palette. See the `.theme-dark` block in tokens.css for why
  // no frame 33 option currently reaches it.
  container.classList.toggle('theme-dark', state.theme === 'dark');
}

function renderCurrentRoute() {
  const { path, params } = parseHash();
  const container = document.getElementById('app');

  const wasDialogOpen = isDialogOpen(container);
  const enteringDialog = DIALOG_ROUTES.has(path);
  if (enteringDialog && !wasDialogOpen) {
    // About to replace the DOM with the dialog — the trigger the
    // participant just activated is still the live focused element right
    // now, so capture it before it's gone.
    const active = document.activeElement;
    pendingFocusRestoreAction = active && active.dataset ? active.dataset.action || null : null;
  }

  // Reset to the base .screen class on every hash-driven navigation, so a
  // screen-specific modifier (e.g. settings.js's 'settings-screen', frame
  // 33's inverted white-page/grey-card treatment) never leaks onto whatever
  // route is visited next. In-place re-renders a screen triggers on itself
  // (toggle handlers calling `render(container, ...)` directly, bypassing
  // this function) don't hit this reset, which is correct — the class was
  // already set correctly for that same screen.
  container.className = 'screen';

  // Every accordion / disclosure starts closed each time a screen is
  // *entered*, including on back navigation — see COLLAPSIBLE_DEFAULTS in
  // state.js. This sits here, on the hash-driven path only, so that a screen
  // re-rendering itself in place from its own toggle handler keeps what the
  // participant just opened.
  resetCollapsibles();

  applyScenarioClasses(container, getState());

  if (path === '/reset') {
    resetState();
    window.location.hash = '#/home';
    return;
  }

  const render = registry.get(path);
  if (!render) {
    renderNotBuilt(container, path);
    return;
  }

  render(container, {
    state: getState(),
    setState,
    params,
    content,
  });

  mountBottomNav(container, path);
  // Reveal-on-reach for this screen's action bar (DECISIONS.md D17). Mounted
  // here rather than per screen so a screen added later inherits it, and
  // re-mounted by the observer below when a screen rebuilds itself.
  mountActionBars(container);
  // Drag-to-dismiss on the grabber of whatever sheet just rendered
  // (SPEC.md transition rules). Mounted generically for the same reason as
  // the two above, and a no-op on the ~25 screens that are not sheets.
  mountSheetDrag(container);

  if (enteringDialog) {
    focusIntoDialog(container);
  } else if (wasDialogOpen && pendingFocusRestoreAction) {
    const trigger = container.querySelector(`[data-action="${pendingFocusRestoreAction}"]`);
    if (trigger) trigger.focus();
    pendingFocusRestoreAction = null;
  }
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  document.addEventListener('keydown', handleDialogTabTrap);

  // See mountBottomNav: screens that re-render themselves in place replace
  // every child of #app, tab bar included. Re-mounting on mutation keeps the
  // bar present without every screen module having to know about it.
  // Appending the bar mutates #app and re-enters this callback once, where
  // the "already mounted" guard stops it — no loop.
  const container = document.getElementById('app');
  new MutationObserver(() => {
    mountBottomNav(container, parseHash().path);
    // The action bar is rebuilt along with everything else when a screen
    // re-renders itself, so its controller has to be rewired at the same
    // point the tab bar is re-mounted. The same applies to a sheet's
    // grabber; `mountSheetDrag` marks the card it has wired, so re-entering
    // here for an unrelated mutation costs one querySelector and stops.
    mountActionBars(container);
    mountSheetDrag(container);
  }).observe(container, { childList: true });

  renderCurrentRoute();
}
