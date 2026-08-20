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

import { getState, setState, resetState } from './state.js';
import content from './content.js';

export const ROUTES = [
  '/home',
  '/journey',
  '/consent',
  '/consent/move-account',
  '/consent/declined',
  '/position',
  '/position/summary',
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
  // rather than duplicating what each screen's dismiss does.
  if (event.key === 'Escape') {
    const dismiss = dialog.querySelector('[data-action="dismiss"]') || document.querySelector('.sheet-scrim[data-action="dismiss"]');
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
  renderCurrentRoute();
}
