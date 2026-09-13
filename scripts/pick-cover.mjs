/**
 * PICK A COVER BY EYE, IN A REAL BROWSER, WITH THE HARNESS'S OWN RULES - AND
 * SHOOT IT WITH THE HARNESS ITSELF. DECISIONS.md D159 and D160.
 *
 *     pick-cover.cmd                          (double-click, in the repo root)
 *     node scripts/pick-cover.mjs             (opens on /home)
 *     node scripts/pick-cover.mjs --routes=consent
 *
 * Opens a visible Chromium on the route in the session `scripts/shots.mjs`
 * captures - the shared seed, greyscale, default text size, `CAPTURE_TODAY`
 * and its timezone pinned on the browser clock, this build's stamp, the
 * service worker blocked - and draws an overlay over the phone:
 *
 *   green, dashed   the part of the screen an anchor must sit in: below the
 *                   pinned header, above the dock and its fade
 *   blue line       where `--scroll-align=start` puts an anchor's top edge
 *   box             the anchor candidate - magenta when the rules pass, red
 *                   when they fail
 *   panel           a route menu, the candidate's selector, the alignment and
 *                   the verdict
 *
 * Keys. Alt+Shift, and none of these letters is a Chromium shortcut or handled
 * by the app. (Alt+Shift+A was the align key in D159: Chromium on Windows
 * reserves it for "focus inactive dialogs", so in a real window it could be
 * taken by the browser. Synthetic key events in the D159 tests bypass browser
 * shortcuts, which is why they did not catch it.)
 *
 *   Alt+Shift+N   next anchor candidate
 *   Alt+Shift+L   toggle --scroll-align between start and center
 *   Alt+Shift+S   snap: move the screen to exactly where shots.mjs will put it
 *                 and run the visibility check
 *   Alt+Shift+C   snap, check, and copy the full shots.mjs command to the
 *                 clipboard, PowerShell-quoted. Also printed in the terminal.
 *   Alt+Shift+P   snap, check, and SHOOT: run that same command, verify the PNG
 *                 and report where it went
 *   Alt+Shift+R   focus the route menu
 *
 * Nothing is copied or shot when a check fails; the reason is shown.
 *
 * CHANGING ROUTE RELOADS THE PAGE on the new route, so it is entered the way
 * shots.mjs enters it - a fresh document, freshly seeded. A screen reached by
 * tapping through the app instead can draw differently from a direct load (a
 * back chevron, D41), so the panel says so and the shoot key refuses it.
 *
 * THE CHECKS ARE THE HARNESS'S, NOT A COPY. The overlay's verdict comes from
 * `anchorRules` in `scripts/anchor-rules.mjs`, the function shots.mjs hands to
 * `page.evaluate`, injected here as the same source. The selector a candidate
 * gets is this file's own, but whether it is usable is decided by those rules.
 *
 * THE SHOOT KEY RUNS THE HARNESS, IT DOES NOT SCREENSHOT THIS WINDOW. This
 * window is the full, visible Chromium; shots.mjs runs Playwright's headless
 * build, and the two rasterise text differently (D159: 93.6-94.1% of screen
 * pixels identical). So Alt+Shift+P spawns `node scripts/shots.mjs` as its own
 * headless process with exactly the arguments Alt+Shift+C copies, plus an
 * output folder. The PNG is checked (`scripts/cover-checks.mjs`) before it is
 * moved to `.screenshots/picked/`; one that fails goes to
 * `.screenshots/picked/failed/` with a note naming the failed check, so it is
 * never left looking like a good one. It also refuses when this session holds a
 * change no shots.mjs flag reproduces, since the PNG would not show it.
 *
 * `--cdp-port=<n>` opens a Chrome DevTools Protocol port so a script can drive
 * the picker, which is how it was verified. Leave it off otherwise.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { FULL } from './session-seed.mjs';
import { anchorRules, isAnchorSelector } from './anchor-rules.mjs';
import { checkCover } from './cover-checks.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- Arguments -------------------------------------------------------------
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([a-z-]+)=(.*)$/);
  if (!m) { console.error(`pick-cover: unrecognised argument "${a}". Use --routes=<route>.`); process.exit(1); }
  return [m[1], m[2]];
}));
for (const key of Object.keys(args)) {
  if (!['routes', 'cdp-port'].includes(key)) { console.error(`pick-cover: unknown option --${key}. Known: --routes, --cdp-port.`); process.exit(1); }
}
// /home when none is given: it renders on a fresh seeded session without a
// redirect, and the route menu in the window goes anywhere from there.
const requested = args.routes || 'home';
if (/^\/?[A-Za-z]:[\\/]/.test(requested) || requested.includes('Program Files')) {
  console.error(`pick-cover: --routes was rewritten by the shell to "${requested}". Drop the leading slash (--routes=consent).`);
  process.exit(1);
}
const ROUTE = requested.startsWith('/') ? requested : `/${requested}`;

// The route list is router.js's own, read the way smoke.test.mjs reads it.
const routerSrc = fs.readFileSync(path.join(ROOT, 'src/router.js'), 'utf8');
const routeBlock = routerSrc.match(/const ROUTES = \[([\s\S]*?)\n\];/);
const KNOWN = routeBlock ? [...routeBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
if (!KNOWN.includes(ROUTE)) {
  console.error(`pick-cover: "${ROUTE}" is not a route in src/router.js. One of: ${KNOWN.map((r) => r.slice(1)).join(', ')}.`);
  process.exit(1);
}

// --- The capture session, from shots.mjs's own source ----------------------
// Read, not repeated, so the picker cannot pin a different date, zone or
// instant than the harness does (D156).
const shotsSrc = fs.readFileSync(path.join(ROOT, 'scripts/shots.mjs'), 'utf8');
const readFrom = (src, file) => (re, name) => {
  const m = src.match(re);
  if (!m) { console.error(`pick-cover: could not read ${name} from ${file}.`); process.exit(1); }
  return m[1];
};
const readConst = readFrom(shotsSrc, 'scripts/shots.mjs');
const CAPTURE_TODAY = readConst(/const CAPTURE_TODAY = '(\d{4}-\d{2}-\d{2})';/, 'CAPTURE_TODAY');
const CAPTURE_TIMEZONE = readConst(/const CAPTURE_TIMEZONE = '([^']+)';/, 'CAPTURE_TIMEZONE');
const CLOCK_TIME = readConst(/setFixedTime\(new Date\(`\$\{CAPTURE_TODAY\}T([0-9:+-]+)`\)\)/, 'the setFixedTime instant');
// THE DEVICE SCALE IS THE HARNESS'S TOO, NOT THE SCREEN'S: the page runs at
// shots.mjs's default --scale, read from its DEFAULTS, because Chromium snaps
// borders and line boxes to device pixels and a different ratio can lay the
// frame out differently. The window's own display scaling is a separate
// problem, handled at launch below.
const DEVICE_SCALE = Number(readConst(/\n  scale: '(\d+(?:\.\d+)?)',/, 'the --scale default'));
const COVER_MARGIN = Number(readConst(/\n  'cover-margin': '(\d+)',/, 'the --cover-margin default'));
// shots.mjs's seed at its defaults: --theme=light, --text=default, no seeding option.
const SEED = { ...FULL, theme: 'greyscale', textSize: 'default', sessionAnchor: CAPTURE_TODAY, buildVersion: BUILD_VERSION };

// What a cover must measure, for the shoot key's checks: the bezel from the
// tokens shots.mjs's `coverViewport` reads, its radius from tokens.css.
const shellCss = fs.readFileSync(path.join(ROOT, 'src/css/shell.css'), 'utf8');
const tokensCss = fs.readFileSync(path.join(ROOT, 'src/css/tokens.css'), 'utf8');
const readShell = readFrom(shellCss, 'src/css/shell.css');
const COVER_SPEC = {
  bezelWidth: Number(readShell(/--frame-width:\s*(\d+)px/, '--frame-width')) + 2 * Number(readShell(/--frame-bezel:\s*(\d+)px/, '--frame-bezel')),
  bezelHeight: Number(readShell(/--frame-height:\s*(\d+)px/, '--frame-height')) + 2 * Number(readShell(/--frame-bezel:\s*(\d+)px/, '--frame-bezel')),
  radius: Number(readFrom(tokensCss, 'src/css/tokens.css')(/--radius-device:\s*(\d+)px/, '--radius-device')),
  margin: COVER_MARGIN,
  scale: DEVICE_SCALE,
};

// --- A static server, as shots.mjs serves the app ---------------------------
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg',
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// --- The overlay, run in the page -------------------------------------------
// Self-contained like anchorRules: it is injected as source text.
function overlay({ seed, routes }) {
  const rules = window.__anchorRules;
  const isAnchorSelector = window.__isAnchorSelector;
  const report = (payload) => { try { window.__pickerReport(payload); } catch { /* not bound */ } };
  const ui = { align: 'start', selected: null, candidates: [], message: '', busy: false };

  const css = `
    #cp-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font: 12px/1.35 system-ui, sans-serif; }
    #cp-root .cp-clear { position: fixed; border: 2px dashed #1b9e3e; box-sizing: border-box; }
    #cp-root .cp-start { position: fixed; height: 0; border-top: 2px solid #1565c0; }
    #cp-root .cp-anchor { position: fixed; box-sizing: border-box; border: 2px solid #c2185b; background: rgba(194,24,91,0.08); }
    #cp-root .cp-anchor.fail { border-color: #d50000; background: rgba(213,0,0,0.12); }
    #cp-root .cp-panel { position: fixed; left: 12px; top: 12px; width: 340px; background: rgba(255,255,255,0.97); color: #111;
      border: 1px solid #999; border-radius: 6px; padding: 10px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); pointer-events: auto; }
    #cp-root .cp-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    #cp-root .cp-head select { flex: 1; font: inherit; }
    #cp-root .cp-body { white-space: pre-wrap; word-break: break-word; }
    #cp-root .cp-panel b { font-weight: 700; }
    #cp-root .cp-ok { color: #1b5e20; } #cp-root .cp-bad { color: #b71c1c; } #cp-root .cp-note { color: #555; }
    #cp-root.cp-hidden { display: none; }`;

  let root, clearBox, startLine, anchorBox, panel, routeMenu, body;
  function build() {
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    root = document.createElement('div'); root.id = 'cp-root';
    clearBox = document.createElement('div'); clearBox.className = 'cp-clear';
    startLine = document.createElement('div'); startLine.className = 'cp-start';
    anchorBox = document.createElement('div'); anchorBox.className = 'cp-anchor';
    panel = document.createElement('div'); panel.className = 'cp-panel';
    // The route menu is built once and never re-rendered, so an open menu is
    // not closed under the pointer by the next redraw.
    const head = document.createElement('div'); head.className = 'cp-head';
    const title = document.createElement('b'); title.textContent = 'Cover picker';
    routeMenu = document.createElement('select'); routeMenu.id = 'cp-route'; routeMenu.setAttribute('aria-label', 'Route');
    for (const r of routes) { const o = document.createElement('option'); o.value = r; o.textContent = r; routeMenu.appendChild(o); }
    routeMenu.value = routeNow();
    routeMenu.addEventListener('change', () => {
      // A fresh document on the new route: re-seeded by the init script, and
      // entered the way shots.mjs enters it.
      history.replaceState(null, '', `#${routeMenu.value}`);
      location.reload();
    });
    head.append(title, routeMenu);
    body = document.createElement('div'); body.className = 'cp-body';
    panel.append(head, body);
    root.append(clearBox, startLine, anchorBox, panel);
    // Appended to body, not #app: the router observes #app's children.
    document.body.appendChild(root);
  }

  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const scroller = () => document.querySelector('.bottom-sheet__content, .screen-content');
  const routeNow = () => (location.hash.slice(1).split('?')[0] || '/home');
  const loadRoute = routeNow();

  function place(el, r) {
    el.style.display = 'block';
    el.style.left = `${r.left}px`; el.style.top = `${r.top}px`; el.style.width = `${r.width}px`; el.style.height = `${r.height}px`;
  }

  // A selector for one element, by the harness's rules: starts . # or [, no
  // comma, unique on the page, inside the active scroller. Stable forms first.
  function selectorFor(el, s) {
    const tries = [];
    const q = (v) => (v.includes("'") ? null : `'${v}'`);
    if (el.id) tries.push(`#${CSS.escape(el.id)}`);
    for (const [key, value] of Object.entries(el.dataset)) {
      const attr = `data-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
      if (value.includes(',')) {
        const head = value.split(',')[0];
        if (head && q(head)) tries.push(`[${attr}^=${q(head)}]`);
      } else if (q(value)) {
        tries.push(`[${attr}=${q(value)}]`);
      }
    }
    for (const c of el.classList) tries.push(`.${CSS.escape(c)}`);
    // One ancestor inside the scroller with a unique class, then this element's class.
    for (let a = el.parentElement; a && a !== s; a = a.parentElement) {
      const unique = [...a.classList].map((c) => `.${CSS.escape(c)}`).find((sel) => document.querySelectorAll(sel).length === 1);
      if (unique) { for (const c of el.classList) tries.push(`${unique} .${CSS.escape(c)}`); break; }
    }
    for (const sel of tries) {
      if (!isAnchorSelector(sel)) continue;
      let hits; try { hits = document.querySelectorAll(sel); } catch { continue; }
      if (hits.length === 1 && hits[0] === el && s.contains(el) && el !== s) return sel;
    }
    return null;
  }

  function candidatesFor(s, region, k) {
    const startY = region.startLine;
    const seen = new Map();
    for (const el of s.querySelectorAll('*')) {
      if (el.closest('#cp-root')) continue;
      const r = el.getBoundingClientRect();
      const hLayout = r.height / k;
      if (hLayout < 16) continue;
      if (r.top < region.top - 1 || r.top > region.bottom) continue;
      if (r.height > region.bottom - region.top) continue; // can never be wholly visible
      const key = `${Math.round(r.top)}:${Math.round(r.height)}:${Math.round(r.left)}:${Math.round(r.width)}`;
      if (seen.has(key)) continue; // an inner wrapper with the same box adds nothing
      const sel = selectorFor(el, s);
      if (!sel) continue;
      seen.set(key, { sel, distance: Math.abs(r.top - startY), text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) });
    }
    return [...seen.values()].sort((a, b) => a.distance - b.distance).slice(0, 15);
  }

  // Flags shots.mjs can take for what differs from the seed, and what it cannot.
  function stateFlags() {
    let stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('yfh-state') || '{}'); } catch { /* unreadable */ }
    const flags = []; const notes = [];
    if (stored.skippedAhead === true) flags.push('--state=ahead');
    if (stored.textSize === 'large') flags.push('--text=large');
    if (stored.theme === 'dark') flags.push('--theme=dark');
    if (stored.solveFor === 'amount') flags.push('--solve=amount');
    const open = [...document.querySelectorAll('[data-action="toggle-disclosure"][aria-expanded="true"]')]
      .map((b) => b.dataset.disclosureId).filter(Boolean);
    const uniqueOpen = [...new Set(open)];
    if (uniqueOpen.length === 1) flags.push(`--open=${uniqueOpen[0]}`);
    if (uniqueOpen.length > 1) notes.push(`${uniqueOpen.length} disclosures are open (${uniqueOpen.join(', ')}); shots.mjs opens one`);
    if (stored.chartView === 'table') flags.push('--view=table');
    if (routeNow() !== loadRoute) {
      notes.push(`this screen was reached by navigating inside the app from ${loadRoute}; shots.mjs loads ${routeNow()} directly, which can draw it differently - choose it from the route menu to see it as it will be captured`);
    }
    // Compared with what the app stored on first load, not with the raw seed:
    // on load it fills in thirty-odd defaults the seed does not carry, the same
    // on every route, and none of those is a change anyone made. Keys a flag
    // above reproduces are not reported; nor are disclosure flags (`...Open`,
    // read from the DOM as --open) or the router's own history bookkeeping.
    const handled = new Set(['skippedAhead', 'skipAheadStash', 'textSize', 'theme', 'solveFor', 'chartView',
      'journeyEntryPoint', 'flowEntryHistoryLength', 'returnFrame']);
    // "Further along" replaces a set of figures and keeps what it replaced in
    // `skipAheadStash` (src/skip-ahead.js); --state=ahead replays that press, so
    // every key in the stash is reproduced by the flag, not a change to report.
    if (stored.skippedAhead === true && stored.skipAheadStash) {
      for (const key of Object.keys(stored.skipAheadStash)) handled.add(key);
    }
    const baseline = ui.baseline || seed;
    const differs = Object.keys({ ...baseline, ...stored }).filter((key) => !handled.has(key) && !/Open$/.test(key)
      && JSON.stringify(stored[key]) !== JSON.stringify(baseline[key]));
    if (differs.length) notes.push(`changed since this page loaded, and no shots.mjs flag reproduces it: ${differs.join(', ')}`);
    return { flags, notes };
  }

  const nextFrames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // shots.mjs's settle after a scroll: its 300ms pause, two frames, finite animations.
  async function settle() {
    await new Promise((r) => setTimeout(r, 300));
    await nextFrames();
    await Promise.allSettled(document.getAnimations()
      .filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished));
  }

  const KEYS = '<span class="cp-note">Alt+Shift+N next  ·  L align  ·  S snap  ·  C copy  ·  P shoot  ·  R route</span>';

  function draw() {
    if (routeMenu.value !== routeNow() && document.activeElement !== routeMenu) routeMenu.value = routeNow();
    const s = scroller();
    if (!s) {
      clearBox.style.display = startLine.style.display = anchorBox.style.display = 'none';
      body.innerHTML = `<span class="cp-bad">This screen has no scroller, so it can only be shot at --scroll=top.</span>\n${ui.message ? `${ui.message}\n` : ''}${KEYS}`;
      return;
    }
    const sr = s.getBoundingClientRect();
    const k = sr.height / s.offsetHeight;
    const region = rules({ op: 'region' });
    place(clearBox, { left: sr.left, top: region.top, width: sr.width, height: region.bottom - region.top });
    place(startLine, { left: sr.left, top: region.startLine, width: sr.width, height: 0 });

    ui.candidates = candidatesFor(s, region, k);
    if (!ui.candidates.some((c) => c.sel === ui.selected)) ui.selected = ui.candidates[0]?.sel ?? null;
    const index = ui.candidates.findIndex((c) => c.sel === ui.selected);

    const lines = [];
    if (!ui.selected) {
      anchorBox.style.display = 'none';
      lines.push('<span class="cp-bad">No usable anchor near the top of the screen. Scroll until an element with a unique class or data attribute sits under the header.</span>');
    } else {
      const el = document.querySelector(ui.selected);
      const res = rules({ op: 'resolve', selector: ui.selected, align: ui.align });
      place(anchorBox, el.getBoundingClientRect());
      lines.push(`Anchor ${index + 1} of ${ui.candidates.length}: <b>${esc(ui.selected)}</b>`);
      lines.push(`<span class="cp-note">${esc(ui.candidates[index].text || '(no text)')}</span>`);
      lines.push(`Align: <b>${ui.align}</b>`);
      if (res.error) {
        anchorBox.classList.add('fail');
        lines.push(`<span class="cp-bad">Fails: ${esc(res.error)}</span>`);
      } else {
        anchorBox.classList.remove('fail');
        const at = Math.round(s.scrollTop);
        if (Math.abs(at - res.want) <= 1) {
          const vis = rules({ op: 'inspect', selector: ui.selected, want: res.want });
          if (vis.error) { anchorBox.classList.add('fail'); lines.push(`<span class="cp-bad">Snapped, but fails: ${esc(vis.error)}</span>`); }
          else lines.push('<span class="cp-ok">Snapped: this is what shots.mjs will capture. Checks pass.</span>');
        } else {
          lines.push(`<span class="cp-note">Not snapped: shots.mjs will scroll to ${res.want} (now ${at}). Alt+Shift+S to preview exactly.</span>`);
        }
      }
    }
    const { flags, notes } = stateFlags();
    if (flags.length) lines.push(`Flags from this session: ${esc(flags.join(' '))}`);
    for (const n of notes) lines.push(`<span class="cp-bad">Warning: ${esc(n)}</span>`);
    if (ui.message) lines.push(ui.message);
    lines.push(KEYS);
    body.innerHTML = lines.join('\n');
  }

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; try { draw(); } catch (e) { body.textContent = `Cover picker error: ${e.message}`; } }); };

  async function snap() {
    ui.message = '';
    if (!ui.selected) return { error: 'no anchor selected' };
    const sel = ui.selected;
    const placed = rules({ op: 'place', selector: sel, align: ui.align });
    if (placed.error) return { error: placed.error, sel };
    await settle();
    const vis = rules({ op: 'inspect', selector: sel, want: placed.scrollTop });
    ui.selected = sel;
    return vis.error ? { error: vis.error, sel } : { sel, scrollTop: placed.scrollTop };
  }

  // The shots.mjs arguments, once: the copy key prints them, the shoot key runs them.
  function command(sel) {
    const route = routeNow().replace(/^\//, '');
    const { flags, notes } = stateFlags();
    const argv = ['--cover', '--no-sheet', `--routes=${route}`, `--scroll=${sel}`, `--scroll-align=${ui.align}`, ...flags];
    const ps = (v) => `'${v.replace(/'/g, "''")}'`;
    const text = ['node scripts/shots.mjs', ...argv.map((a) => (a.startsWith('--scroll=') ? ps(a) : a))].join(' ');
    return { argv, text, notes };
  }

  async function onKey(e) {
    if (!(e.altKey && e.shiftKey)) return;
    const code = e.code;
    if (!['KeyN', 'KeyL', 'KeyS', 'KeyC', 'KeyP', 'KeyR'].includes(code)) return;
    e.preventDefault(); e.stopPropagation();
    if (code === 'KeyR') { routeMenu.focus(); try { routeMenu.showPicker(); } catch { /* focus is enough */ } return; }
    if (ui.busy) { ui.message = '<span class="cp-note">Still shooting - wait for the result.</span>'; schedule(); return; }
    if (code === 'KeyN' && ui.candidates.length) {
      const i = ui.candidates.findIndex((c) => c.sel === ui.selected);
      ui.selected = ui.candidates[(i + 1) % ui.candidates.length].sel;
      ui.message = '';
    }
    if (code === 'KeyL') { ui.align = ui.align === 'start' ? 'center' : 'start'; ui.message = ''; }
    if (code === 'KeyS' || code === 'KeyC' || code === 'KeyP') {
      const verb = { KeyS: 'Snap', KeyC: 'Not copied', KeyP: 'Not shot' }[code];
      const result = await snap();
      if (result.error) {
        ui.message = `<span class="cp-bad">${code === 'KeyS' ? '' : `${verb}. `}--scroll "${esc(result.sel || '')}" ${esc(result.error)}</span>`;
        report({ kind: 'refused', action: code === 'KeyP' ? 'shot' : code === 'KeyC' ? 'copied' : 'snapped', route: routeNow(), selector: result.sel, align: ui.align, error: result.error });
      } else if (code === 'KeyC') {
        const cmd = command(result.sel);
        let copied = true;
        try { await navigator.clipboard.writeText(cmd.text); } catch { copied = false; }
        ui.message = `<span class="cp-ok">${copied ? 'Copied' : 'Clipboard unavailable - printed in the terminal'}:</span>\n${esc(cmd.text)}`;
        report({ kind: 'copied', command: cmd.text, notes: cmd.notes, copied, route: routeNow(), selector: result.sel, align: ui.align, scrollTop: result.scrollTop });
      } else if (code === 'KeyP') {
        const cmd = command(result.sel);
        if (cmd.notes.length) {
          ui.message = `<span class="cp-bad">Not shot: the PNG would not show this screen as it is - ${esc(cmd.notes.join('; '))}. Alt+Shift+C still copies the command.</span>`;
          report({ kind: 'refused', action: 'shot', route: routeNow(), selector: result.sel, align: ui.align, error: cmd.notes.join('; ') });
        } else {
          ui.busy = true;
          ui.message = `<span class="cp-note">Shooting with the harness:\n${esc(cmd.text)}</span>`;
          schedule();
          let shot;
          try { shot = await window.__pickerShoot({ argv: cmd.argv, text: cmd.text }); } catch (err) { shot = { ok: false, error: String(err) }; }
          ui.busy = false;
          const checks = (shot.checks || []).map((c) => `${c.pass ? 'pass' : 'FAIL'}  ${c.name}: ${c.detail}`).join('\n');
          ui.message = shot.ok
            ? `<span class="cp-ok">Shot and verified:</span>\n${esc(shot.file)}\n${esc(checks)}`
            : `<span class="cp-bad">Shot failed${shot.file ? ` - moved to ${esc(shot.file)}` : ''}: ${esc(shot.error || 'a check failed')}</span>${checks ? `\n${esc(checks)}` : ''}`;
        }
      } else {
        ui.message = `<span class="cp-ok">Snapped to ${result.scrollTop}.</span>`;
      }
    }
    schedule();
  }

  function start() {
    build();
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', () => { ui.message = ''; setTimeout(schedule, 400); });
    const app = document.getElementById('app');
    if (app) new MutationObserver(schedule).observe(app, { childList: true, subtree: true, attributes: true });
    window.__coverPicker = { ui, snap, command: (sel) => command(sel || ui.selected), draw };
    // The state as the app first stored it on this load - the seed plus its
    // defaults - so later differences are the ones made in this window.
    setTimeout(() => {
      try { ui.baseline = JSON.parse(sessionStorage.getItem('yfh-state') || 'null'); } catch { ui.baseline = null; }
      schedule();
    }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}

// --- The shoot key: the real harness, in its own headless process -------------
const PICKED = path.join(ROOT, '.screenshots', 'picked');

async function shoot({ argv, text }) {
  const staging = path.join(PICKED, `.staging-${Date.now()}`);
  fs.mkdirSync(staging, { recursive: true });
  console.log(`\nShooting:\n  ${text}`);
  const run = await new Promise((resolve) => {
    let out = '';
    const child = spawn(process.execPath, ['scripts/shots.mjs', ...argv, `--out=${staging}`], { cwd: ROOT });
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => resolve({ code, out }));
  });
  const pngs = fs.existsSync(staging) ? fs.readdirSync(staging).filter((f) => f.endsWith('.png')) : [];
  const finish = (result) => {
    fs.rmSync(staging, { recursive: true, force: true });
    if (result.ok) {
      console.log(`  verified -> ${result.file}`);
    } else {
      console.log(`  FAILED: ${result.error}${result.file ? ` (moved to ${result.file})` : ''}`);
    }
    for (const c of result.checks || []) console.log(`    ${c.pass ? 'pass' : 'FAIL'}  ${c.name}: ${c.detail}`);
    return result;
  };
  if (run.code !== 0 || pngs.length !== 1) {
    const why = (run.out.match(/^Error: .*$/m) || [])[0] || `shots.mjs exited ${run.code} and wrote ${pngs.length} PNG(s)`;
    // Anything it did write is not presented as a result.
    if (pngs.length) {
      fs.mkdirSync(path.join(PICKED, 'failed'), { recursive: true });
      for (const f of pngs) fs.renameSync(path.join(staging, f), path.join(PICKED, 'failed', f));
    }
    return finish({ ok: false, error: why.replace(/^Error: /, '') });
  }
  const name = pngs[0];
  const checked = checkCover(fs.readFileSync(path.join(staging, name)), COVER_SPEC);
  if (checked.ok) {
    fs.mkdirSync(PICKED, { recursive: true });
    const dest = path.join(PICKED, name);
    fs.rmSync(dest, { force: true });
    fs.renameSync(path.join(staging, name), dest);
    return finish({ ok: true, file: path.relative(ROOT, dest), checks: checked.checks });
  }
  const failedDir = path.join(PICKED, 'failed');
  fs.mkdirSync(failedDir, { recursive: true });
  const dest = path.join(failedDir, name);
  fs.rmSync(dest, { force: true });
  fs.renameSync(path.join(staging, name), dest);
  fs.writeFileSync(`${dest}.txt`, `${text}\n\n${checked.checks.map((c) => `${c.pass ? 'pass' : 'FAIL'}  ${c.name}: ${c.detail}`).join('\n')}\n`);
  return finish({ ok: false, file: path.relative(ROOT, dest), error: `failed: ${checked.checks.filter((c) => !c.pass).map((c) => c.name).join(', ')}`, checks: checked.checks });
}

// --- Launch -------------------------------------------------------------------
const cdpPort = args['cdp-port'] ? Number(args['cdp-port']) : null;
// --force-device-scale-factor=1: without it a visible window takes the
// operating system's display scaling, and on a Windows display at 125% that
// leaked into layout even with the page's device scale set - the rendered-to-
// layout ratio came out 1.0003 at frame scale 1, the anchor measured 572.22px
// and the scroller ended at 1077, where the harness's headless Chromium
// measures 573 and 1080. Forced to 1, the headed window lays out exactly as
// the harness does (measured: 573, 1080, ratio 1). The window is drawn at 100%
// as a result - small on a high-density display - while the page still runs at
// DEVICE_SCALE (`devicePixelRatio` 2), as the harness's does.
const browser = await chromium.launch({
  headless: false,
  args: ['--force-device-scale-factor=1', ...(cdpPort ? [`--remote-debugging-port=${cdpPort}`] : [])],
});
// A fixed viewport, so the device scale can be set; 1280x860 CSS px leaves the
// panel room beside the phone and fits a 1080p screen at 125%.
const context = await browser.newContext({
  viewport: { width: 1280, height: 860 }, deviceScaleFactor: DEVICE_SCALE, serviceWorkers: 'block', timezoneId: CAPTURE_TIMEZONE,
});
await context.clock.setFixedTime(new Date(`${CAPTURE_TODAY}T${CLOCK_TIME}`));
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
// The seed on every document load, as shots.mjs writes it.
await context.addInitScript((v) => { try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ } }, SEED);
await context.exposeBinding('__pickerReport', (_source, payload) => {
  if (payload.kind === 'copied') {
    console.log(`\n${payload.copied ? 'Copied' : 'Clipboard unavailable; copy this'}:\n  ${payload.command}`);
    for (const n of payload.notes) console.log(`  warning: ${n}`);
  } else if (payload.kind === 'refused') {
    console.log(`\nNot ${payload.action}: --scroll "${payload.selector}" on ${payload.route} ${payload.error}.`);
  }
});
let shooting = false;
await context.exposeBinding('__pickerShoot', async (_source, request) => {
  if (shooting) return { ok: false, error: 'a shot is already running' };
  shooting = true;
  try { return await shoot(request); } finally { shooting = false; }
});
await context.addInitScript({
  content: `window.__anchorRules = ${anchorRules.toString()};
window.__isAnchorSelector = ${isAnchorSelector.toString()};
(${overlay.toString()})(${JSON.stringify({ seed: SEED, routes: KNOWN })});`,
});

const page = await context.newPage();
await page.goto(`${base}/#${ROUTE}`);
console.log(`Cover picker on ${ROUTE} (${base}). Seeded at ${CAPTURE_TODAY}, ${CAPTURE_TIMEZONE}, build ${BUILD_VERSION}.`);
console.log('Keys: Alt+Shift+N next anchor, L start/center, S snap, C copy the command, P shoot and verify, R route menu.');
console.log('Verified shots go to .screenshots/picked/. Close the browser window to stop.');

await new Promise((resolve) => browser.on('disconnected', resolve));
server.close();
