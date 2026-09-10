/**
 * DEVICE DIAGNOSTIC OVERLAY. TEMPORARY, GATED, AND NOT PART OF THE PROTOTYPE.
 *
 * Purpose: read back, from the participant's own iPhone, the runtime values
 * that decide whether the constant band of `--color-bg` below `.bottom-nav`
 * in the installed standalone PWA is the doubled safe-area inset it looks
 * like. The hypothesis under test is that `shell.css`'s
 * `.screen:has(> .bottom-nav) { padding-bottom: 0 }` is not applying, so
 * `.screen`'s own `padding-bottom` (shell.css) and the bar's
 * (components.css) are both counted. Items 3 and 8 below are the two
 * independent ways of asking that; item 5's `paddingBottom` is the answer
 * itself.
 *
 * THIS FILE MEASURES AND CHANGES NOTHING. It reads computed styles and
 * bounding boxes, writes them into an overlay of its own, and touches no
 * layout, height, padding or safe-area value anywhere in the app. Its own
 * elements are `position: fixed` and therefore out of flow, appended to
 * `document.body` rather than to `#app` - the router's MutationObserver
 * (router.js) watches `#app`'s childList, so appending here cannot re-enter
 * `mountBottomNav`.
 *
 * THE OVERLAY IS GATED ON `?diag=1`. `render()` is called from one guarded
 * statement at the end of the file; without the flag it is never called and
 * no overlay element is created.
 *
 * THE FILE ITSELF IS NO LONGER INERT WITHOUT THE FLAG, and the second block
 * at the end of the file is why. An installed home-screen app launches a
 * frozen `start_url` with no address bar, so `?diag=1` cannot be typed in the
 * one mode where the defect appears - which made the overlay unreachable
 * exactly where it was needed. So the same readout is also shown on frame 33
 * (`/settings`), and reaching it needs a capture taken earlier, on a route
 * that HAS a bottom bar. Two listeners are therefore registered
 * unconditionally. They only read, and write to one module-level variable;
 * nothing is created or styled until frame 33 renders. See that block for the
 * full reasoning.
 *
 * Both places the flag can sit are accepted, because this app is hash routed
 * and either is a reasonable thing to type:
 *   index.html?diag=1#/home     (search)
 *   index.html#/home?diag=1     (hash query - `parseHash` in router.js
 *                                already splits on "?", so the route still
 *                                resolves to /home)
 *
 * Strings are inline rather than in content.js deliberately. content.js holds
 * every string a PARTICIPANT can see; nothing here is ever shown in a
 * session, and putting debug labels in the content module would leave them
 * behind when this file goes.
 *
 * TO REMOVE: delete this file, the one `import './diagnostics.js';` line in
 * src/app.js, and the `renderStoredReadout` import and call in
 * src/screens/settings.js. The overlay and the settings readout are one
 * temporary diagnostic and come out together; leaving the settings half
 * behind would put a debug block on a participant-facing screen.
 */

// Already in the eager module graph (app.js imports screens/settings.js,
// which imports this same module), so naming it here adds no fetch and no
// side effect - the module body is two `export const` declarations.
import { BUILD_VERSION } from './cache-version.js';

/** Highest value a 32-bit signed z-index can take, so nothing outranks it. */
const OVERLAY_Z_INDEX = 2147483647;

/**
 * Is the flag present? A pure read of `location`. This is the only thing in
 * this file that runs when the flag is absent, and it creates nothing.
 */
function diagnosticsRequested() {
  if (new URLSearchParams(window.location.search).get('diag') === '1') return true;

  const queryStart = window.location.hash.indexOf('?');
  if (queryStart === -1) return false;

  return new URLSearchParams(window.location.hash.slice(queryStart + 1)).get('diag') === '1';
}

/** Two decimal places, so a fractional device pixel is visible rather than rounded away. */
function round(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : String(value);
}

/** An empty computed value reads as "(empty)" rather than as a blank line. */
function show(value) {
  return value === '' || value === null || value === undefined ? '(empty)' : String(value);
}

/**
 * Resolve the four safe-area insets to pixels.
 *
 * `env()` cannot be read directly, so a probe element takes all four as
 * padding and `getComputedStyle` reports what the engine resolved them to.
 * The probe is off-screen, inert and removed again in the same function, so
 * it exists for one synchronous read and leaves nothing in the document.
 */
function readSafeAreaInsets() {
  const probe = document.createElement('div');
  Object.assign(probe.style, {
    position: 'fixed',
    top: '0',
    left: '-9999px',
    width: '1px',
    height: '1px',
    visibility: 'hidden',
    pointerEvents: 'none',
  });
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingRight = 'env(safe-area-inset-right)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.paddingLeft = 'env(safe-area-inset-left)';

  document.body.appendChild(probe);
  const computed = window.getComputedStyle(probe);
  const insets = {
    top: computed.paddingTop,
    right: computed.paddingRight,
    bottom: computed.paddingBottom,
    left: computed.paddingLeft,
  };
  probe.remove();

  return insets;
}

/**
 * Does `.screen` match the selector the hypothesis is about?
 *
 * An engine without `:has()` throws SyntaxError from `matches()` rather than
 * returning false, and that throw is itself the answer - it means the whole
 * rule at shell.css:279-282 was dropped at parse time and the inset is being
 * counted twice. Reported as thrown rather than swallowed as false.
 */
function testHasSelector(screen) {
  if (!screen) return '(no .screen element)';
  try {
    return String(screen.matches('.screen:has(> .bottom-nav)'));
  } catch (error) {
    return `THREW ${error.name}: ${error.message} (:has() unsupported - rule dropped)`;
  }
}

/**
 * Everything that can be read synchronously, as label/value pairs.
 *
 * EXPORTED so the settings readout below reuses this exact function rather
 * than growing a second copy of the measurement logic. Two copies would drift,
 * and the whole value of the readout is that the numbers it shows are the ones
 * the overlay would have shown.
 */
export function collectSynchronous() {
  const screen = document.querySelector('.screen');
  const nav = document.querySelector('.bottom-nav');
  const insets = readSafeAreaInsets();

  const lines = [];
  const section = (title) => lines.push('', `--- ${title} ---`);
  const row = (label, value) => lines.push(`${label}: ${value}`);

  section('1. USER AGENT');
  row('navigator.userAgent', navigator.userAgent);

  section('2. DISPLAY MODE');
  row('navigator.standalone', String(navigator.standalone));
  row('(display-mode: standalone)', String(window.matchMedia('(display-mode: standalone)').matches));
  row('(display-mode: fullscreen)', String(window.matchMedia('(display-mode: fullscreen)').matches));
  row('(display-mode: browser)', String(window.matchMedia('(display-mode: browser)').matches));

  section('3. :has() SUPPORT');
  const supportsApi = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
  row(
    "CSS.supports('selector(:has(*))')",
    supportsApi ? String(CSS.supports('selector(:has(*))')) : '(CSS.supports unavailable)'
  );

  section('4. SAFE-AREA INSETS (resolved)');
  row('env(safe-area-inset-top)', show(insets.top));
  row('env(safe-area-inset-right)', show(insets.right));
  row('env(safe-area-inset-bottom)', show(insets.bottom));
  row('env(safe-area-inset-left)', show(insets.left));

  section('5. .screen');
  if (screen) {
    const style = window.getComputedStyle(screen);
    const rect = screen.getBoundingClientRect();
    row('height', show(style.height));
    row('paddingTop', show(style.paddingTop));
    row('paddingBottom', show(style.paddingBottom));
    row('rect.top', round(rect.top));
    row('rect.bottom', round(rect.bottom));
  } else {
    row('.screen', 'NOT FOUND');
  }

  section('6. .bottom-nav');
  if (nav) {
    const style = window.getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    row('height', show(style.height));
    row('paddingBottom', show(style.paddingBottom));
    row('position', show(style.position));
    row('rect.top', round(rect.top));
    row('rect.bottom', round(rect.bottom));
  } else {
    row(
      '.bottom-nav',
      'NOT FOUND (no bar on dialog routes, /mip/running or /settings - navigate to /home)'
    );
  }

  section('7. NAV PARENT');
  if (nav && nav.parentElement) {
    row('parentElement.id', show(nav.parentElement.id));
    row('parentElement.className', show(nav.parentElement.className));
    row('is direct child of #app', String(nav.parentElement.id === 'app'));
  } else {
    row('parentElement', '(no .bottom-nav on this route)');
  }

  section('8. :has() SELECTOR MATCH');
  row(".screen.matches('.screen:has(> .bottom-nav)')", testHasSelector(screen));

  section('9. VIEWPORT');
  row('window.innerHeight', round(window.innerHeight));
  row(
    'visualViewport.height',
    window.visualViewport ? round(window.visualViewport.height) : '(visualViewport unavailable)'
  );
  row('screen.height', round(window.screen.height));
  row('devicePixelRatio', round(window.devicePixelRatio));

  section('10. BUILD');
  row('BUILD_VERSION (executing code)', BUILD_VERSION);
  row('service worker', '(reading...)');

  // Derived, because these three are the whole question and working them out
  // by hand off a phone screen is where a transcription error would go.
  section('DERIVED');
  if (screen && nav) {
    const screenRect = screen.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const screenStyle = window.getComputedStyle(screen);
    row(
      'gap below nav (screen.bottom - nav.bottom)',
      `${round(screenRect.bottom - navRect.bottom)}px`
    );
    row(
      'gap below screen (innerHeight - screen.bottom)',
      `${round(window.innerHeight - screenRect.bottom)}px`
    );
    row(
      'doubled inset?',
      parseFloat(screenStyle.paddingBottom) > 0 && parseFloat(insets.bottom) > 0
        ? `YES - .screen keeps ${screenStyle.paddingBottom} AND the bar carries its own`
        : 'no - .screen paddingBottom is 0 or there is no bottom inset'
    );
  } else {
    row('derived', '(needs both .screen and .bottom-nav)');
  }

  return lines;
}

/**
 * The service worker's script URL and state, appended once the registration
 * promise settles. Asynchronous, so it replaces the placeholder rather than
 * holding up the rest of the readout.
 */
function describeServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve('(serviceWorker unsupported)');
  }
  return navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (!registration) return '(no registration)';
      const worker = registration.active || registration.waiting || registration.installing;
      if (!worker) return '(registration present, no worker)';
      const which = registration.active
        ? 'active'
        : registration.waiting
          ? 'waiting'
          : 'installing';
      return `${which} - ${worker.scriptURL} - state ${worker.state}`;
    })
    .catch((error) => `(getRegistration failed: ${error.name})`);
}

/**
 * Copy the readout as plain text. `navigator.clipboard` needs a secure
 * context and a user gesture; the click is the gesture, and the deployed URL
 * is HTTPS. The execCommand path is the fallback for anything that refuses,
 * and if both fail the text is selectable by hand, which is why the readout
 * is a <pre> with user-select left on.
 */
function copyToClipboard(text, button) {
  const report = (message) => {
    button.textContent = message;
    window.setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => report('Copied'))
      .catch(() => report('Copy failed - select the text'));
    return;
  }

  const scratch = document.createElement('textarea');
  scratch.value = text;
  Object.assign(scratch.style, { position: 'fixed', top: '0', left: '-9999px' });
  document.body.appendChild(scratch);
  scratch.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch (error) {
    succeeded = false;
  }
  scratch.remove();
  report(succeeded ? 'Copied' : 'Copy failed - select the text');
}

/**
 * Build and inject the overlay.
 *
 * Every style is set inline on an element this function created. No rule is
 * added to any stylesheet and no <style> element is injected, so nothing here
 * can reach an existing selector.
 *
 * `aria-hidden` and `tabindex="-1"` on the container keep the whole thing out
 * of the accessibility tree and out of the tab order; the button carries its
 * own `tabindex="-1"` as well, so an `aria-hidden` subtree never contains a
 * tab stop.
 */
function render() {
  const lines = collectSynchronous();
  const text = () => lines.join('\n').replace(/^\n/, '');

  const overlay = document.createElement('div');
  overlay.id = 'diagnostics-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('tabindex', '-1');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    maxHeight: '60vh',
    overflowY: 'auto',
    zIndex: String(OVERLAY_Z_INDEX),
    boxSizing: 'border-box',
    // The top inset, so the first lines clear the notch in standalone, where
    // `black-translucent` puts the web view under the status bar.
    padding: 'calc(8px + env(safe-area-inset-top)) 10px 10px',
    background: 'rgba(0, 0, 0, 0.88)',
    color: '#f2f2f7',
    font: '11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    WebkitOverflowScrolling: 'touch',
    WebkitTextSizeAdjust: '100%',
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('tabindex', '-1');
  Object.assign(button.style, {
    display: 'block',
    marginBottom: '8px',
    padding: '6px 14px',
    minHeight: '32px',
    background: '#f2f2f7',
    color: '#000',
    border: '0',
    borderRadius: '6px',
    font: 'inherit',
    fontWeight: '600',
    cursor: 'pointer',
  });
  button.addEventListener('click', () => copyToClipboard(text(), button));

  const readout = document.createElement('pre');
  Object.assign(readout.style, {
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
  });
  readout.textContent = text();

  overlay.appendChild(button);
  overlay.appendChild(readout);
  document.body.appendChild(overlay);

  // Item 10's second half lands when the promise settles.
  describeServiceWorker().then((description) => {
    const index = lines.indexOf('service worker: (reading...)');
    if (index !== -1) lines[index] = `service worker: ${description}`;
    readout.textContent = text();
  });
}

/**
 * Measure after the first screen has painted.
 *
 * A static import is evaluated before the importing module's body, so this
 * file runs BEFORE app.js calls `startRouter()` and before any screen or tab
 * bar exists. `load` fires after app.js's body has run; the two nested frames
 * then let the first render and `shell-scale.js` settle before anything is
 * measured.
 *
 * The readout is a snapshot taken once. To take another - after a rotation,
 * or on a different route - reload the page with the flag still on.
 */
function scheduleCapture() {
  const start = () => window.requestAnimationFrame(() => window.requestAnimationFrame(render));

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/* ===========================================================================
   THE SAME READOUT ON /settings, FOR THE INSTALLED APP
   ===========================================================================

   WHY THIS EXISTS. The `?diag=1` gate above cannot be reached in the one mode
   that matters. An installed iOS home-screen app launches its FROZEN
   `start_url` (`./index.html`, manifest.webmanifest) with no address bar, so
   there is nowhere to type the flag and the overlay has never once been
   readable in standalone - which is the only place the band below the tab bar
   appears. This block puts the same numbers on frame 33, which the facilitator
   gesture (D54) can reach from inside the running app.

   WHY THE VALUES ARE CAPTURED ELSEWHERE AND ONLY DISPLAYED HERE. `/settings`
   is in `BOTTOM_NAV_EXCLUDED_ROUTES` (router.js), so it has NO `.bottom-nav`,
   and `.screen`'s box is a different shape there - it keeps its own
   `padding-bottom` because no bar is present to carry the inset (shell.css),
   and there is no bar to measure at all. Measuring on `/settings` would answer
   a question nobody asked. So the readout is captured while a BARRED route is
   on screen and held until frame 33 asks for it.

   EVERY CAPTURE STAMPS THE ROUTE AND TIME IT CAME FROM, and the readout prints
   both at the top. That is the standing CLAUDE.md rule about naming the
   reference: these figures describe a screen that is no longer the one being
   looked at, and nothing else about them would reveal which.

   THIS FILE NOW HAS SIDE EFFECTS WITHOUT THE FLAG, which the header above used
   to be able to promise it did not. Two listeners are registered
   unconditionally and a capture is taken on every barred route. They only
   READ - computed styles and bounding boxes - and write to one module-level
   variable; no element is created, no style is set and no layout value is
   touched until `renderStoredReadout` is called from frame 33.

   TO REMOVE: this whole block, plus the `renderStoredReadout` call and its
   import in src/screens/settings.js. It comes out at the same time as the
   `?diag=1` overlay, not later. */

/** The most recent readout taken while a bottom bar was on screen, or null. */
let lastBarredCapture = null;

/**
 * Take a readout IF a bar is on screen, and stamp where it came from.
 *
 * The `.bottom-nav` test is the whole gate: it is the same fact
 * `mountBottomNav` acts on, read off the DOM rather than off a route list, so
 * this cannot disagree with what was actually drawn.
 */
function captureIfBarred() {
  if (!document.querySelector('.bottom-nav')) return;

  const route = window.location.hash.split('?')[0].slice(1) || '/home';
  const lines = collectSynchronous();
  const capture = { route, at: new Date(), lines };
  lastBarredCapture = capture;

  // Resolve item 10's async half into the STORED lines, so a readout opened
  // later already has it rather than showing the placeholder for ever.
  describeServiceWorker().then((description) => {
    const index = capture.lines.indexOf('service worker: (reading...)');
    if (index !== -1) capture.lines[index] = `service worker: ${description}`;
  });
}

/**
 * Two frames after a route settles, matching `scheduleCapture` above and for
 * the same reason: the bar is in the DOM before `shell-scale.js` and the
 * safe-area padding have finished, and a measurement taken then is of a layout
 * that never reached the screen.
 */
function scheduleBarredCapture() {
  window.requestAnimationFrame(() => window.requestAnimationFrame(captureIfBarred));
}

/**
 * Build the readout into `host`, from the stored capture.
 *
 * Everything is set with `textContent` and inline styles on elements this
 * function creates, so no participant-facing string, stylesheet rule or
 * existing settings control is touched. Colours come from the app's own tokens
 * so the block follows the theme like everything else on the screen.
 */
export function renderStoredReadout(host) {
  const wrap = document.createElement('section');
  Object.assign(wrap.style, {
    margin: '24px 0 0',
    padding: '12px',
    borderRadius: '10px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-subtle)',
  });

  const heading = document.createElement('p');
  heading.textContent = 'Device diagnostic (temporary)';
  Object.assign(heading.style, {
    margin: '0 0 8px',
    font: '600 13px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    color: 'var(--color-label)',
  });
  wrap.appendChild(heading);

  if (!lastBarredCapture) {
    const empty = document.createElement('p');
    empty.textContent =
      'No capture yet. Open Home, then come back - the figures are read from a screen that has the tab bar.';
    Object.assign(empty.style, {
      margin: '0',
      font: '11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      color: 'var(--color-label-secondary)',
    });
    wrap.appendChild(empty);
    host.appendChild(wrap);
    return;
  }

  const { route, at, lines } = lastBarredCapture;
  const stamp = [
    `CAPTURED ON: ${route}`,
    `CAPTURED AT: ${at.toTimeString().slice(0, 8)}`,
    'These figures describe the route named above, NOT this screen.',
    '/settings has no bottom bar, so measuring here would answer nothing.',
  ].join('\n');
  const text = () => `${stamp}\n${lines.join('\n').replace(/^\n/, '')}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy';
  Object.assign(button.style, {
    display: 'block',
    marginBottom: '8px',
    padding: '6px 14px',
    minHeight: '32px',
    background: 'var(--color-label)',
    color: 'var(--color-surface)',
    border: '0',
    borderRadius: '6px',
    font: '600 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    cursor: 'pointer',
  });
  button.addEventListener('click', () => copyToClipboard(text(), button));
  wrap.appendChild(button);

  const readout = document.createElement('pre');
  readout.textContent = text();
  Object.assign(readout.style, {
    margin: '0',
    // `pre-wrap` and `break-word` together are what keep the longest line -
    // the user agent string - inside the column instead of overflowing it.
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    font: '11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    color: 'var(--color-label)',
  });
  wrap.appendChild(readout);

  host.appendChild(wrap);
}

// Ungated, unlike the overlay: capture on first load and on every route
// change, so whatever barred screen was last on display is the one frame 33
// reports. Both handlers no-op on a route with no bar.
if (document.readyState === 'complete') scheduleBarredCapture();
else window.addEventListener('load', scheduleBarredCapture, { once: true });
window.addEventListener('hashchange', scheduleBarredCapture);

// THE ONLY *GATED* STATEMENT IN THIS FILE. The overlay above is still behind
// `?diag=1`: without the flag `diagnosticsRequested()` reads `location`,
// returns false, and `render()` is never called.
if (diagnosticsRequested()) {
  scheduleCapture();
}
