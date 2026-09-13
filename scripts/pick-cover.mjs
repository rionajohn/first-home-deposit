/**
 * PICK A COVER BY EYE, IN A REAL BROWSER, WITH THE HARNESS'S OWN RULES.
 * DECISIONS.md D159.
 *
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
 *   panel           the candidate's selector, the alignment and the verdict
 *
 * Keys (Alt+Shift, so they collide with nothing the app handles):
 *
 *   Alt+Shift+N   next anchor candidate
 *   Alt+Shift+A   toggle --scroll-align between start and center
 *   Alt+Shift+S   snap: move the screen to exactly where shots.mjs will put it
 *                 and run the visibility check, without copying
 *   Alt+Shift+C   snap, check, and copy the full shots.mjs command to the
 *                 clipboard, PowerShell-quoted. Also printed here. Nothing is
 *                 copied when a check fails; the reason is shown instead.
 *
 * THE CHECKS ARE THE HARNESS'S, NOT A COPY. The overlay's verdict comes from
 * `anchorRules` in `scripts/anchor-rules.mjs`, the function shots.mjs hands to
 * `page.evaluate`, injected here as the same source. The selector a candidate
 * gets is this file's own, but whether it is usable is decided by those rules.
 *
 * WHAT IT CANNOT DO. It does not shoot; run the copied command. A screen you
 * reached by tapping, or state you changed by typing or picking, may not be
 * reproducible from shots.mjs's flags - the panel lists every stored value
 * that differs from the seed and would not survive into the command. Close the
 * browser window to stop.
 *
 * `--cdp-port=<n>` opens a Chrome DevTools Protocol port so a script can drive
 * the picker, which is how it was verified. Leave it off otherwise.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { FULL } from './session-seed.mjs';
import { anchorRules, isAnchorSelector } from './anchor-rules.mjs';
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
if (!args.routes) { console.error('pick-cover: --routes=<route> is required, e.g. --routes=consent.'); process.exit(1); }
if (/^\/?[A-Za-z]:[\\/]/.test(args.routes) || args.routes.includes('Program Files')) {
  console.error(`pick-cover: --routes was rewritten by the shell to "${args.routes}". Drop the leading slash (--routes=consent).`);
  process.exit(1);
}
const ROUTE = args.routes.startsWith('/') ? args.routes : `/${args.routes}`;

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
const readConst = (re, name) => {
  const m = shotsSrc.match(re);
  if (!m) { console.error(`pick-cover: could not read ${name} from scripts/shots.mjs.`); process.exit(1); }
  return m[1];
};
const CAPTURE_TODAY = readConst(/const CAPTURE_TODAY = '(\d{4}-\d{2}-\d{2})';/, 'CAPTURE_TODAY');
const CAPTURE_TIMEZONE = readConst(/const CAPTURE_TIMEZONE = '([^']+)';/, 'CAPTURE_TIMEZONE');
const CLOCK_TIME = readConst(/setFixedTime\(new Date\(`\$\{CAPTURE_TODAY\}T([0-9:+-]+)`\)\)/, 'the setFixedTime instant');
// THE DEVICE SCALE IS THE HARNESS'S TOO, NOT THE SCREEN'S: the page runs at
// shots.mjs's default --scale, read from its DEFAULTS, because Chromium snaps
// borders and line boxes to device pixels and a different ratio can lay the
// frame out differently. The window's own display scaling is a separate
// problem, handled at launch below.
const DEVICE_SCALE = Number(readConst(/\n  scale: '(\d+(?:\.\d+)?)',/, 'the --scale default'));
// shots.mjs's seed at its defaults: --theme=light, --text=default, no seeding option.
const SEED = { ...FULL, theme: 'greyscale', textSize: 'default', sessionAnchor: CAPTURE_TODAY, buildVersion: BUILD_VERSION };

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
function overlay({ seed }) {
  const rules = window.__anchorRules;
  const isAnchorSelector = window.__isAnchorSelector;
  const report = (payload) => { try { window.__pickerReport(payload); } catch { /* not bound */ } };
  const ui = { align: 'start', selected: null, candidates: [], snapped: null, message: '' };

  const css = `
    #cp-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font: 12px/1.35 system-ui, sans-serif; }
    #cp-root .cp-clear { position: fixed; border: 2px dashed #1b9e3e; box-sizing: border-box; }
    #cp-root .cp-start { position: fixed; height: 0; border-top: 2px solid #1565c0; }
    #cp-root .cp-anchor { position: fixed; box-sizing: border-box; border: 2px solid #c2185b; background: rgba(194,24,91,0.08); }
    #cp-root .cp-anchor.fail { border-color: #d50000; background: rgba(213,0,0,0.12); }
    #cp-root .cp-panel { position: fixed; left: 12px; top: 12px; width: 340px; background: rgba(255,255,255,0.97); color: #111;
      border: 1px solid #999; border-radius: 6px; padding: 10px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); white-space: pre-wrap; word-break: break-word; }
    #cp-root .cp-panel b { font-weight: 700; }
    #cp-root .cp-ok { color: #1b5e20; } #cp-root .cp-bad { color: #b71c1c; } #cp-root .cp-note { color: #555; }
    #cp-root.cp-hidden { display: none; }`;

  let root, clearBox, startLine, anchorBox, panel;
  function build() {
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    root = document.createElement('div'); root.id = 'cp-root';
    clearBox = document.createElement('div'); clearBox.className = 'cp-clear';
    startLine = document.createElement('div'); startLine.className = 'cp-start';
    anchorBox = document.createElement('div'); anchorBox.className = 'cp-anchor';
    panel = document.createElement('div'); panel.className = 'cp-panel';
    root.append(clearBox, startLine, anchorBox, panel);
    // Appended to body, not #app: the router observes #app's children.
    document.body.appendChild(root);
  }

  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const scroller = () => document.querySelector('.bottom-sheet__content, .screen-content');
  const routeNow = () => (location.hash.slice(1).split('?')[0] || '/home');

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

  function draw() {
    const s = scroller();
    if (!s) {
      clearBox.style.display = startLine.style.display = anchorBox.style.display = 'none';
      panel.innerHTML = `<b>Cover picker</b>\n<span class="cp-bad">This screen has no scroller, so it can only be shot at --scroll=top.</span>\nRoute: ${esc(routeNow())}`;
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

    const lines = [`<b>Cover picker</b>  <span class="cp-note">${esc(routeNow())}</span>`];
    if (routeNow() !== window.__pickerLaunchRoute) lines.push(`<span class="cp-note">Launched on ${esc(window.__pickerLaunchRoute)}; the command uses this screen's route.</span>`);
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
    lines.push('<span class="cp-note">Alt+Shift+N next  ·  A align  ·  S snap  ·  C copy</span>');
    panel.innerHTML = lines.join('\n');
  }

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; try { draw(); } catch (e) { panel.textContent = `Cover picker error: ${e.message}`; } }); };

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

  function command(sel) {
    const route = routeNow().replace(/^\//, '');
    const ps = (v) => `'${v.replace(/'/g, "''")}'`;
    const { flags, notes } = stateFlags();
    return { text: ['node scripts/shots.mjs --cover --no-sheet', `--routes=${route}`, ps(`--scroll=${sel}`), `--scroll-align=${ui.align}`, ...flags].join(' '), notes };
  }

  async function onKey(e) {
    if (!(e.altKey && e.shiftKey)) return;
    const code = e.code;
    if (!['KeyN', 'KeyA', 'KeyS', 'KeyC'].includes(code)) return;
    e.preventDefault(); e.stopPropagation();
    if (code === 'KeyN' && ui.candidates.length) {
      const i = ui.candidates.findIndex((c) => c.sel === ui.selected);
      ui.selected = ui.candidates[(i + 1) % ui.candidates.length].sel;
      ui.message = '';
    }
    if (code === 'KeyA') { ui.align = ui.align === 'start' ? 'center' : 'start'; ui.message = ''; }
    if (code === 'KeyS' || code === 'KeyC') {
      const result = await snap();
      if (result.error) {
        ui.message = `<span class="cp-bad">${code === 'KeyC' ? 'Not copied. ' : ''}--scroll "${esc(result.sel || '')}" ${esc(result.error)}</span>`;
        report({ kind: 'refused', route: routeNow(), selector: result.sel, align: ui.align, error: result.error });
      } else if (code === 'KeyC') {
        const cmd = command(result.sel);
        let copied = true;
        try { await navigator.clipboard.writeText(cmd.text); } catch { copied = false; }
        ui.message = `<span class="cp-ok">${copied ? 'Copied' : 'Clipboard unavailable - printed in the terminal'}:</span>\n${esc(cmd.text)}`;
        report({ kind: 'copied', command: cmd.text, notes: cmd.notes, copied, route: routeNow(), selector: result.sel, align: ui.align, scrollTop: result.scrollTop });
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
    console.log(`\nNot copied: --scroll "${payload.selector}" on ${payload.route} ${payload.error}.`);
  }
});
await context.addInitScript({
  content: `window.__anchorRules = ${anchorRules.toString()};
window.__isAnchorSelector = ${isAnchorSelector.toString()};
window.__pickerLaunchRoute = ${JSON.stringify(ROUTE)};
(${overlay.toString()})(${JSON.stringify({ seed: SEED })});`,
});

const page = await context.newPage();
await page.goto(`${base}/#${ROUTE}`);
console.log(`Cover picker on ${ROUTE} (${base}). Seeded at ${CAPTURE_TODAY}, ${CAPTURE_TIMEZONE}, build ${BUILD_VERSION}.`);
console.log('Keys: Alt+Shift+N next anchor · Alt+Shift+A start/center · Alt+Shift+S snap · Alt+Shift+C snap and copy the command.');
console.log('Close the browser window to stop.');

await new Promise((resolve) => browser.on('disconnected', resolve));
server.close();
