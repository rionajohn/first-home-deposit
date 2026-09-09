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
 * IT IS GATED ON `?diag=1` AND DOES NOTHING WITHOUT IT. Everything below is
 * a function declaration until the single guarded call at the end of the
 * file. With the flag absent that call is not made: no element is created,
 * no style is set, no listener is attached, and the app behaves exactly as
 * it does with this file deleted.
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
 * TO REMOVE: delete this file and the one `import './diagnostics.js';` line
 * in src/app.js. Nothing else references it.
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

/** Everything that can be read synchronously, as label/value pairs. */
function collectSynchronous() {
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

// THE ONLY STATEMENT IN THIS FILE THAT EXECUTES. Everything above is a
// declaration. Without the flag, `diagnosticsRequested()` reads `location`,
// returns false, and nothing else in this module is ever called.
if (diagnosticsRequested()) {
  scheduleCapture();
}
