/**
 * Hash-based router — works on static hosting with no server config.
 * Routes are the build-spec.md section 3 screen inventory, exactly as
 * written there (query strings like ?solve=amount select a state variant
 * of a route, not a separate route — build-spec.md section 3's own note:
 * "Where two frames share a route they are variants of one screen, not two
 * screens.").
 *
 * Every route below has a registered screen module except stray typed URLs
 * outside the section 3 inventory, which fall through to a visible "not
 * built yet" placeholder rather than a broken screen.
 */

import { getState, setState, resetState, resetCollapsibles, isNewSession } from './state.js';
import { stagePatch, OPENING_STAGE } from './stage.js';
import content from './content.js';
import { bottomNavHTML, NAVIGABLE_TABS } from './components/ui.js';
import { mountActionBars } from './action-bar.js';
import { mountSheetDrag, dismissControlFor } from './sheet-drag.js';
import { bindSettingsGesture } from './facilitator-gesture.js';

export const ROUTES = [
  '/home',
  '/journey',
  '/consent',
  '/consent/move-account',
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
  '/learn/stamp-duty',
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
  '/assumptions/costs',
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

/**
 * NAVIGATION, IN ONE PLACE. The browser's own history IS the back stack.
 *
 * `navigate` pushes an entry, `goBack` pops one, so the in-app back control,
 * the iOS swipe-back edge gesture and the Android/desktop back button are the
 * same operation and cannot disagree about where "back" is. No screen decides
 * a back destination any more — the stack already knows it, because it is the
 * record of where the participant actually went rather than a guess written
 * at build time.
 *
 * The counterpart rule lives at the guard redirects across src/screens: a
 * guard bounces a participant off a screen they never chose, so it uses
 * `location.replace` and overwrites its own entry rather than adding one.
 * That is what makes one back tap move one screen instead of unwinding a
 * whole cascade of them (GAPS.md, the frame 09 note under G50).
 */
export function navigate(route) {
  window.location.hash = route.startsWith('#') ? route : `#${route}`;
}

export function goBack() {
  window.history.back();
}

/**
 * THE CLOSE X, WHICH IS NOT THE BACK CHEVRON. They are different controls and
 * this is the difference: the chevron moves one screen, the X leaves the
 * journey altogether and returns to the screen it was entered from - frame 01
 * or the goals area, whichever it was, read from `journeyEntryPoint`.
 *
 * HOW IT LEAVES, which is the part that took two attempts. `location.replace`
 * overwrites exactly one entry, so the flow's earlier screens stayed on the
 * stack and one back tap from the entry point landed back inside the flow the
 * participant had just left. Going back over the flow's own entries is what
 * actually leaves it behind, and the number of them is the difference between
 * `history.length` now and what it was when the flow was entered.
 *
 * THIS IS AN APPROXIMATION AND IT IS MEANT TO BE. `history.length` counts
 * forward entries as well as back ones and caps (50 in Chrome), and a push
 * made after going back truncates the forward entries, so the difference can
 * understate the depth. It is not a running index of where the participant
 * is. The guards do not disturb it, because they `replace` rather than push
 * and so add nothing to count - that is the same rule from D29 paying off
 * here.
 *
 * So it fails safe rather than failing oddly: a delta that is missing, zero
 * or negative falls back to the `replace` this used to do, which lands on the
 * right screen with the old back-into-the-flow limitation rather than
 * throwing the participant somewhere unrelated. Measured in a browser before
 * being kept - see DECISIONS.md D32 for the numbers.
 *
 * The X on a sheet is not this control and never reaches here: sheets close
 * through `[data-action="dismiss"]`, which is `goBack()` and lands on the
 * screen underneath (D29). Frame 10c is the one crossing point - its X and
 * "Keep going" dismiss the sheet, and only its "Leave" calls this.
 */
export function exitFlow() {
  const { journeyEntryPoint, flowEntryHistoryLength } = getState();
  const target = `#${journeyEntryPoint || '/home'}`;

  const depth = flowEntryHistoryLength === null
    ? null
    : window.history.length - flowEntryHistoryLength;

  if (depth !== null && depth > 0) {
    window.history.go(-depth);
    return;
  }

  window.location.replace(target);
}

/**
 * Cold start on a deep route: put /home behind the participant.
 *
 * Typing `#/tracker` into a fresh tab — or reopening a link a facilitator
 * pinned — lands on a screen whose app bar draws a back control with nothing
 * of ours behind it, and `history.back()` would then drop the participant
 * clean out of the prototype mid-session. Seeding the stack (the landing
 * route pushed on top of /home) gives that control somewhere real to go
 * without any screen having to carry a fallback destination of its own. That
 * is the point: the fallbacks are gone, so the cold-start case is answered
 * once, structurally, rather than eighteen times over.
 *
 * `history.length` is NOT the test for "nothing of ours behind us", however
 * much it looks like it. A tab's own initial entry counts toward it, so the
 * length is already 2 on the very first paint and the seed would never fire —
 * measured, not assumed. What is exact is `history.state`: every entry this
 * router has rendered carries `stampEntry`'s marker, and a browser hands a
 * freshly-typed URL a null state. So an unmarked entry is one we have never
 * been on before, which is precisely the case that needs a root behind it.
 * The marker survives a reload of the same entry, which is what stops a
 * refresh mid-session from seeding a second time.
 *
 * pushState and replaceState do not fire hashchange, so this rearranges the
 * stack before the first render without provoking a second one.
 *
 * A participant who reached a deep route from somewhere outside the prototype
 * loses that outside page as their back destination. That is deliberate: in a
 * moderated session, back leaving the prototype is a worse failure than back
 * not retracing a step the participant did not take inside it.
 */
const NAV_MARKER = 'yfh-nav-entry';

/**
 * ROOT-NESS IS A FACT ABOUT THE HISTORY ENTRY, NOT ABOUT THE ROUTE, and this
 * is the marker that records it. See `isRootEntry` below for why a route list
 * cannot answer the same question.
 */
const ROOT_MARKER = 'yfh-root-entry';

/**
 * Set by the tab handler immediately before it navigates, consumed by the
 * next `stampEntry`. A module-level handoff rather than an argument because
 * the navigation and the stamp are separated by a `hashchange` — the same
 * shape as `pendingFocusRestoreAction` below.
 *
 * TWO WRITERS, AND ONLY TWO. The tab handler is one. `seedHistoryRoot` below
 * is the other, and it writes this exactly once per page load, for the first
 * entry of the session — see there for why the route is decisive at that one
 * boundary and nowhere else. Closed GAPS.md G59.
 */
let pendingRootArrival = false;

function stampEntry() {
  if (window.history.state && window.history.state[NAV_MARKER]) return;
  window.history.replaceState({ [NAV_MARKER]: true, [ROOT_MARKER]: pendingRootArrival }, '');
  pendingRootArrival = false;
}

/**
 * IS THE ENTRY THE PARTICIPANT IS STANDING ON A TAB ROOT?
 *
 * NOT "is the current route a tab root". Those are different questions and
 * the difference is the whole reason this exists. `/tracker` is BOTH the
 * Insights root and a descent from the goals card; `/goals` is both the Goals
 * root and a descent from frame 06's "save for something else" branch. A
 * route list answers "which routes can be roots" and cannot tell the two
 * arrivals apart. Only the history entry can, because only the entry knows
 * how it was created.
 *
 * Testing the route instead is not a near-miss, it is a duplicate-entry bug.
 * Traced in a browser before this was built: `/goals` -> tracker card ->
 * `/tracker`, then a Goals tab tap treated as lateral, replaces, and history
 * becomes `["", "#/home", "#/goals", "#/goals"]`. Back lands on `/goals`
 * again and appears to do nothing; only the second back moves.
 *
 * Exported because the back chevron asks this same question - a screen draws
 * a chevron only when there is a preceding screen inside its own flow, which
 * is exactly "this entry is not a tab root". It must read this rather than
 * computing root-ness a second way.
 *
 * Survives back, forward and reload, because `history.state` is per-entry and
 * `stampEntry` above returns early on an entry it has already stamped. Both
 * measured, not assumed.
 */
export function isRootEntry() {
  return !!(window.history.state && window.history.state[ROOT_MARKER]);
}

/**
 * Is this path the root screen of a tab?
 *
 * READ FROM `NAVIGABLE_TABS`, NOT WRITTEN OUT AGAIN. That map in
 * components/ui.js is already the single definition of which tabs are live and
 * where each one lands, so "the tab roots" is derived from it rather than
 * duplicated - a fourth live tab would be a root here without this file
 * changing.
 *
 * CONSULTED AT EXACTLY ONE BOUNDARY: the first entry of a session, in
 * `seedHistoryRoot` below. It is NOT a route test applied generally, and
 * `isRootEntry()` is still the only thing any screen asks. See the note there.
 */
function isTabRootPath(path) {
  return Object.values(NAVIGABLE_TABS).includes(path);
}

function seedHistoryRoot() {
  // An entry we have rendered before — a reload, or one restored by the
  // browser. Whatever sits behind it is already behind it.
  if (window.history.state && window.history.state[NAV_MARKER]) return;

  // --- THE FIRST ENTRY OF THE SESSION, AND THE ONLY PLACE A ROUTE DECIDES ---
  //
  // Everything past this point in the session answers "root or descent?" from
  // how the entry was created: a tab tap raises `pendingRootArrival`, and
  // anything else is a descent. That test cannot work on the FIRST entry,
  // because nothing created it from inside the app - the participant opened a
  // link or typed a URL, and there is no earlier screen for them to have
  // descended from.
  //
  // So here, and only here, the route is decisive: NO DESCENT IS POSSIBLE ON
  // THE FIRST ENTRY, so if it lands on a tab root it IS a root. That is not a
  // route list applied generally - it is the one boundary where the usual
  // question has no answer and the route has one. Screens still ask
  // `isRootEntry()` and nothing else.
  //
  // Reaching this line at all means the entry is unstamped, and unstamped
  // means the browser made it. `seedHistoryRoot` is called once from
  // `startRouter`, which runs once per page load, so a URL typed MID-session
  // fires `hashchange` and never arrives here - measured: the length grows by
  // one, not by two. That is what separates the first entry from a later one.
  const { path } = parseHash();
  const landingIsRoot = isTabRootPath(path);

  if (path === '/home') {
    // Nothing to seed behind frame 01. Hand the verdict to the first
    // `stampEntry`, which runs a moment later in `startRouter` and consumes it.
    pendingRootArrival = landingIsRoot;
    return;
  }

  const landing = window.location.hash || '#/home';
  // The seeded /home is a tab root by the same reasoning and by the same test:
  // it sits at the bottom of the stack with nothing behind it at all.
  window.history.replaceState({ [NAV_MARKER]: true, [ROOT_MARKER]: true }, '', '#/home');
  window.history.pushState({ [NAV_MARKER]: true, [ROOT_MARKER]: landingIsRoot }, '', landing);
}

function renderNotBuilt(container, path) {
  container.innerHTML = `<div class="not-built">Not built yet: ${path}</div>`;
}

/**
 * SPEC.md's 7 sheets (03b, 10c, 13b, 29, 30, 31, 32) plus /assumptions/costs and
 * /learn/stamp-duty, neither of which has a frame number of its own (GAPS.md
 * G83 and G84) - 9 in total — each renders a
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
  '/learn/stamp-duty',
  '/assumptions/saving',
  '/assumptions/deposit',
  '/assumptions/borrowing',
  '/assumptions/sources',
  '/assumptions/costs',
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
 *     participant journey and reachable only by typing the URL, or by the
 *     long press on the disabled Profile tab that `mountBottomNav` binds
 *     (GAPS.md G23, DECISIONS.md D54 - neither path is visible). It has its
 *     own leading control back already.
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
 * true on exactly three screens. Everything else in the app is the "Your
 * first home" journey, which is not one of the bank's five tabs: it is a
 * feature reached FROM Home, not Home itself. Lighting Home on all of those
 * screens claimed the participant was on the bank's home screen while they
 * were mid-way through a mortgage calculator, and left the bar with no way to
 * show the one case where they really were on Home.
 *
 * /tracker lights Insights because /tracker IS the Insights destination
 * (NAVIGABLE_TABS in components/ui.js). The Mortgage in Principle screens
 * beyond it light nothing, the same as every other journey screen: they are
 * reached FROM Insights, they are not Insights.
 *
 * Any route not listed gets `null`, which `bottomNavHTML` renders as "no tab
 * active".
 */
const TAB_FOR_ROUTE = new Map([
  ['/home', 'home'],
  ['/goals', 'goals'],
  ['/tracker', 'insights'],
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

  // The facilitator gesture (src/facilitator-gesture.js, DECISIONS.md D54): a
  // long press on the DISABLED Profile tab opens /settings, so a session can
  // reach frame 33 and its reset without a hash typed in front of a
  // participant. Bound here because this is where the bar is built, so the
  // gesture follows the bar rather than the route. It draws nothing, announces
  // nothing, and owns no state.
  bindSettingsGesture(container);

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

      // Tapping the tab you are already on is a no-op. Returning here BEFORE
      // touching `pendingRootArrival` is what stops the flag leaking: an
      // unchanged hash fires no `hashchange`, so nothing would consume it and
      // the next descent would be stamped a root.
      if (path === target) return;

      // --- DESCENT PUSHES, LATERAL REPLACES (DECISIONS.md D29, as restated) -
      //
      // A tab tap from a tab root is a LATERAL move between roots: there is no
      // screen behind it inside the flow being left, so replacing costs the
      // participant nothing and stops ten switches building ten entries that
      // swipe-back then walks one at a time.
      //
      // A tab tap from anywhere else is a DESCENT out of wherever they were,
      // and that screen has to survive: a participant part-way through the
      // calculator who looks at Goals and swipes back must land where they
      // were, not wherever they were before that.
      //
      // `isRootEntry()` and NOT a list of root routes. `/tracker` is the
      // Insights root when the tab put them there and a descent when the goals
      // card did; a route list cannot tell those apart and turns the second one
      // into a duplicate history entry. See `isRootEntry`.
      const lateral = isRootEntry();
      pendingRootArrival = true;
      if (lateral) {
        window.location.replace(`#${target}`);
      } else {
        window.location.hash = `#${target}`;
      }
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

  // Mark this entry as one the router has rendered. See seedHistoryRoot: it
  // is what tells a cold arrival apart from a revisit, and it must happen on
  // every render because a guard's `location.replace` clears the state it
  // overwrites.
  stampEntry();

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
    // The next participant gets the same opening scenario a first page load
    // gives, rather than the empty session `resetState()` leaves behind.
    // `resetState()` clears the restored flag, so this is not a no-op.
    openSession();
    window.location.replace('#/home');
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

/**
 * OPENS A NEW SESSION IN ITS STAGE (DECISIONS.md D48).
 *
 * A session used to begin empty, so the Insights tab redirected into the
 * deposit calculator until a facilitator had set a stage on frame 33. It now
 * begins in `OPENING_STAGE`, which means the deposit tracker is a populated
 * screen from the first tap.
 *
 * IT REUSES `stagePatch()` AND ADDS NOTHING. The patch is the same function
 * frame 33's Journey stage control calls, against the same fresh
 * `defaultState()`, deriving every figure through `src/model/` in the
 * calculator's own call order. A session opened here and a session a
 * facilitator set to "Saving" hold identical state; there is one stage
 * machine, and this is where it starts. `stage` is written alongside the patch
 * for the same reason `settings.js` writes it - frame 33 reads that key to show
 * which stage is selected, and a session in the saving stage whose control
 * still read "Setting up" would be lying to the facilitator.
 *
 * ONLY ON A NEW SESSION. `isNewSession()` is false once a stored session has
 * been read back, so a mid-session refresh restores what the participant had
 * rather than resetting them to the opening scenario. `resetState()` clears the
 * flag, so `#/reset` opens the next participant's session here too.
 *
 * CALLED BEFORE `seedHistoryRoot()` AND BEFORE THE FIRST RENDER, so no screen
 * and no history entry can observe the empty state in between.
 */
function openSession() {
  if (!isNewSession()) return;
  setState({ ...stagePatch(OPENING_STAGE), stage: OPENING_STAGE });
}

export function startRouter() {
  // The opening scenario first: every screen below reads the store, and the
  // history root stamped next describes the route that store resolves to.
  openSession();

  // Before the first render, and before anything can push: see above.
  seedHistoryRoot();

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
