/**
 * THE SCREENSHOT HARNESS. Run this; do not regenerate one inline.
 *
 * It exists because the same harness was being rebuilt from scratch each time
 * a change needed looking at, which cost a hand-approved permission prompt per
 * session and shipped at least one duplicate `const` that threw on the first
 * run. A committed script is reviewable, fixable and diffable; a heredoc is
 * none of those.
 *
 * It is a VERIFICATION AID, not a test. It asserts nothing. It renders the app
 * at a given size, in a given theme, at a given point in the session, and
 * writes PNGs plus a contact sheet so a change can be looked at rather than
 * reasoned about.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 * ---------------------------------------------------------------------------
 *   node scripts/shots.mjs
 *   node scripts/shots.mjs --routes=/tracker --entry=goals,insights \
 *                          --state=now,ahead --theme=light,dark
 *
 * Every option takes a comma-separated list and every combination is shot, so
 * the run above produces 2 entries x 2 states x 2 themes = 8 PNGs plus a sheet.
 *
 *   --routes   App routes, without the `#`.            default /tracker
 *   --entry    How the screen is REACHED. `direct` sets the hash; `goals`
 *              taps the tracker card on /goals; `insights` taps the Insights
 *              tab. The three differ in what the app bar draws (D41) and in
 *              whether the entry is a root or a descent (D40), so a screenshot
 *              that only ever loads the hash misses two of the three.
 *                                                       default direct
 *   --state    `now` or `ahead` - the skip-ahead control's position
 *              (DECISIONS.md D38). `ahead` is applied by pressing the real
 *              control, not by seeding it, so what is captured is what the
 *              control actually does. Ignored where the control is not drawn.
 *                                                       default now
 *   --theme    `light` or `dark`.                        default light
 *   --text     `default` or `large` (frame 33's text size).
 *                                                       default default
 *   --width    Viewport width in px.                     default 390
 *   --height   Viewport height in px.                    default 844
 *   --saved    Deposit balance to seed, in pounds. The shared seed sits
 *              exactly AT the checkpoint, where both skip-ahead positions show
 *              the same figure; `--saved=12000` puts the session below it so
 *              `--state=now,ahead` shoots the two apart.
 *                                                default the seed's own value
 *   --goal     `set` or `none`. `none` clears the committed deposit goal, a
 *              state the late-journey seed cannot otherwise reach. Needed to
 *              shoot both sides of any screen that branches on whether a goal
 *              exists - `/goals` has three states off it (D44).
 *                                                       default set
 *   --draft    `none` or `property-cleared`. `property-cleared` puts frame 09's
 *              property field in the cleared-but-not-committed state - the
 *              session GAPS.md G62 was reported against. It is a state no seed
 *              reaches, because it is a DRAFT rather than a set of figures:
 *              every committed key stays exactly as it is and only the screen's
 *              own flag moves (DECISIONS.md D46). Use it to shoot the screens
 *              that read `property-value` live while a goal is committed.
 *                                                       default none
 *   --scroll   `top` or `end` - where the screen's scroller is left before the
 *              shot. An axis like the others, so `--scroll=top,end` shoots
 *              both. Added for the screens whose bottom edge is the thing
 *              under review: what clears the tab bar at the end of a long
 *              screen, and whether a dock's `--more-below` fade is drawn.
 *                                                       default top
 *   --out      Output directory.                  default .screenshots/shots
 *   --full     Capture the whole scroller rather than the viewport.
 *   --no-sheet Skip the contact sheet.
 *   --scale    Device pixel ratio.                       default 2
 *
 * ---------------------------------------------------------------------------
 * OUTPUT
 * ---------------------------------------------------------------------------
 * `.screenshots/` is gitignored, so nothing this writes can be committed by
 * accident. Files are named
 *
 *     <route>__<entry>__<state>__<theme>__<width>w[__large][__full].png
 *
 * and `contact-sheet.png` sits beside them: every shot in one grid, labelled,
 * which is the thing worth looking at when a change is meant to be invisible
 * on some variants and not others.
 *
 * The session seeded is the shared one in `scripts/session-seed.mjs`. Change
 * it there, not here.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { FULL } from './session-seed.mjs';

const ROOT = path.resolve('.');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
const DEFAULTS = {
  routes: '/tracker',
  entry: 'direct',
  state: 'now',
  theme: 'light',
  text: 'default',
  width: '390',
  height: '844',
  out: '.screenshots/shots',
  scale: '2',
  saved: '',
  goal: 'set',
  draft: 'none',
  scroll: 'top',
};

function parseArgs(argv) {
  const flags = { ...DEFAULTS, full: false, sheet: true };
  for (const arg of argv) {
    if (arg === '--full') { flags.full = true; continue; }
    if (arg === '--no-sheet') { flags.sheet = false; continue; }
    const m = arg.match(/^--([a-z-]+)=(.*)$/);
    if (!m) {
      console.error(`Unrecognised argument: ${arg}\nRun with no arguments for the defaults, or read the header of this file.`);
      process.exit(1);
    }
    const [, key, value] = m;
    if (!(key in DEFAULTS)) {
      console.error(`Unknown option --${key}. Known: ${Object.keys(DEFAULTS).map((k) => `--${k}`).join(', ')}, --full, --no-sheet.`);
      process.exit(1);
    }
    flags[key] = value;
  }
  return flags;
}

const list = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);

const args = parseArgs(process.argv.slice(2));

// GIT BASH REWRITES A LEADING SLASH INTO A WINDOWS PATH before this script
// ever sees it, so `--routes=/tracker` arrives as `/C:/Program Files/Git/tracker`
// and every shot is silently skipped as an unknown route. Caught here with the
// fix in the message, because the failure is otherwise invisible: the run
// completes, writes nothing, and blames the route.
for (const route of list(args.routes)) {
  if (/^\/?[A-Za-z]:[\\/]/.test(route) || route.includes('Program Files')) {
    console.error(
      `--routes was rewritten by the shell to "${route}".\n` +
      'Git Bash converts a leading slash into a Windows path. Drop the slash\n' +
      '(--routes=tracker), or set MSYS_NO_PATHCONV=1, or run it from PowerShell.',
    );
    process.exit(1);
  }
}

const ROUTES = list(args.routes).map((r) => (r.startsWith('/') ? r : `/${r}`));

/**
 * `--saved` moves the session's deposit balance before anything is rendered.
 *
 * IT EXISTS BECAUSE `--state=now,ahead` IS OTHERWISE NEARLY INERT. The shared
 * seed sits exactly AT `checkpoint-amount`, so "Now" and "Further along" put
 * the same figure on screen and the only difference between the two shots is
 * which segment is filled. Passing a balance below the checkpoint - the
 * position the control was built to move a session out of - makes the two
 * states show what they actually do. The default is the seed's own value, so
 * this changes nothing unless it is asked for.
 */
const SAVED = args.saved === '' ? null : Number(args.saved);
if (SAVED !== null && !Number.isFinite(SAVED)) {
  console.error('--saved must be a number, e.g. --saved=12000.');
  process.exit(1);
}

/**
 * `--goal=none` clears the committed deposit goal, which is a state the seed
 * cannot otherwise reach: `session-seed.mjs` is a late-journey session by
 * definition, so every route that branches on "has this participant set a
 * goal yet" would only ever be shot on one side of the branch. `/goals` has
 * three states off that question (DECISIONS.md D44) and two of them need this.
 *
 * It clears the same four keys frame 09's empty variant leaves null, so the
 * result is a session that has walked in but not committed, rather than an
 * incoherent one with a target and no property value.
 */
const GOAL_STATES = ['set', 'none'];
if (!GOAL_STATES.includes(args.goal)) {
  console.error(`Unknown --goal "${args.goal}". One of: ${GOAL_STATES.join(', ')}.`);
  process.exit(1);
}
const NO_GOAL_KEYS = ['property-value', 'deposit-pct', 'deposit-target', 'checkpoint-amount'];

/**
 * `--draft=property-cleared` is deliberately NOT a figure change, and that is
 * the point of having it. `--goal=none` clears four keys; this clears none. It
 * sets frame 09's own draft flag and leaves every committed figure standing,
 * which is exactly the state G62 was reported against and exactly what D46
 * fixed: the participant is re-typing a property value they have already
 * committed, and no screen behind them may notice.
 *
 * Shooting it is how the fix is checked by eye rather than by assertion - the
 * screens that read `property-value` live (11, 12, 13, 15/16) must look
 * identical to their ordinary state.
 */
const DRAFT_STATES = ['none', 'property-cleared'];
if (!DRAFT_STATES.includes(args.draft)) {
  console.error(`Unknown --draft "${args.draft}". One of: ${DRAFT_STATES.join(', ')}.`);
  process.exit(1);
}
const ENTRIES = list(args.entry);
const STATES = list(args.state);
const THEMES = list(args.theme);
const TEXTS = list(args.text);
const SCROLLS = list(args.scroll);
const WIDTH = Number(args.width);
const HEIGHT = Number(args.height);
const SCALE = Number(args.scale);
const OUT = path.resolve(args.out);

const ENTRY_KINDS = ['direct', 'goals', 'insights'];
for (const entry of ENTRIES) {
  if (!ENTRY_KINDS.includes(entry)) {
    console.error(`Unknown --entry "${entry}". One of: ${ENTRY_KINDS.join(', ')}.`);
    process.exit(1);
  }
}
for (const state of STATES) {
  if (state !== 'now' && state !== 'ahead') {
    console.error(`Unknown --state "${state}". One of: now, ahead.`);
    process.exit(1);
  }
}
for (const scroll of SCROLLS) {
  if (scroll !== 'top' && scroll !== 'end') {
    console.error(`Unknown --scroll "${scroll}". One of: top, end.`);
    process.exit(1);
  }
}
if (!Number.isFinite(WIDTH) || !Number.isFinite(HEIGHT) || !Number.isFinite(SCALE)) {
  console.error('--width, --height and --scale must be numbers.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The same static server the tests use: ES modules need a real origin.
// ---------------------------------------------------------------------------
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve([server, `http://127.0.0.1:${server.address().port}`]));
  });
}

/**
 * Walks the app to `route` the way `entry` says to.
 *
 * `goals` and `insights` are real taps rather than hash writes, because that
 * is the only way the router records the entry as a descent or as a tab root
 * (D40) - and that is what decides whether the app bar draws a back chevron
 * (D41). Seeding the hash directly would give a third result that no
 * participant ever sees.
 */
async function navigate(page, base, route, entry) {
  if (entry === 'direct' || route !== '/tracker') {
    await page.goto(`${base}/#${route}`);
    await page.waitForTimeout(300);
    return;
  }
  if (entry === 'goals') {
    await page.goto(`${base}/#/goals`);
    await page.waitForTimeout(300);
    await page.click('[data-action="open-deposit-tracker"]');
  } else {
    await page.goto(`${base}/#/home`);
    await page.waitForTimeout(300);
    await page.click('.bottom-nav__tab[data-tab="insights"]');
  }
  await page.waitForTimeout(350);
}

const slug = (route) => route.replace(/^\//, '').replace(/\//g, '-') || 'root';

function shotName({ route, entry, state, theme, text, scroll }) {
  const parts = [slug(route), entry, state, theme, `${WIDTH}w`];
  if (args.goal === 'none') parts.splice(1, 0, 'no-goal');
  if (args.draft !== 'none') parts.splice(1, 0, args.draft);
  if (text !== 'default') parts.push(text);
  if (scroll !== 'top') parts.push(`scroll-${scroll}`);
  if (args.full) parts.push('full');
  return `${parts.join('__')}.png`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });

// Say so rather than let it look like a bug in the control: with the session
// already at the checkpoint, both skip-ahead positions carry the same figure.
const savedNow = SAVED ?? FULL['saved-toward-deposit'].value;
if (STATES.includes('now') && STATES.includes('ahead') && savedNow >= FULL['checkpoint-amount'].value) {
  console.log(
    `note: the session is at or past the checkpoint (${savedNow} vs ${FULL['checkpoint-amount'].value}),\n` +
    '      so "now" and "ahead" will show the same figure and differ only in which\n' +
    '      segment is selected. Pass --saved=12000 to shoot the two apart.\n',
  );
}

const [server, base] = await startServer();
const browser = await chromium.launch();
const shots = [];
const skipped = [];

try {
  for (const route of ROUTES) {
    for (const entry of ENTRIES) {
      // /tracker is the only screen with two doors into it; asking for a
      // `goals` or `insights` entry anywhere else would silently shoot the
      // same thing twice under two names.
      if (entry !== 'direct' && route !== '/tracker') {
        skipped.push(`${route} via ${entry} - only /tracker has more than one entry`);
        continue;
      }
      for (const theme of THEMES) {
        for (const text of TEXTS) {
          for (const state of STATES) {
            const context = await browser.newContext({
              viewport: { width: WIDTH, height: HEIGHT },
              deviceScaleFactor: SCALE,
              serviceWorkers: 'block',
            });
            const seed = { ...FULL, theme: theme === 'dark' ? 'dark' : 'greyscale', textSize: text };
            if (SAVED !== null) {
              seed['saved-toward-deposit'] = { ...FULL['saved-toward-deposit'], value: SAVED };
            }
            if (args.goal === 'none') {
              for (const key of NO_GOAL_KEYS) seed[key] = { value: null, provenance: null };
            }
            if (args.draft === 'property-cleared') seed.propertyValueCleared = true;
            await context.addInitScript((v) => {
              try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {}
            }, seed);
            const page = await context.newPage();
            try {
              await navigate(page, base, route, entry);

              const landed = await page.evaluate(() => window.location.hash);
              if (landed !== `#${route}`) {
                skipped.push(`${route} via ${entry} - the app redirected to ${landed || '#'}`);
                continue;
              }

              if (state === 'ahead') {
                const control = await page.$('[data-action="set-skip-ahead"][data-value="ahead"]');
                if (!control) {
                  skipped.push(`${route} - no skip-ahead control, so "ahead" is not a state it has`);
                  continue;
                }
                await control.click();
                await page.waitForTimeout(300);
              }

              // THE FRAME DOES NOT SCROLL, THE SCREEN INSIDE IT DOES
              // (shell.css). So an end-of-scroll shot moves `.screen-content`
              // - or a sheet's own `.bottom-sheet__content` - rather than the
              // window, and the pause after it is long enough for
              // action-bar.js to re-measure and settle the `--more-below`
              // fade, which is part of what such a shot is taken to show.
              for (const scroll of SCROLLS) {
                await page.evaluate((where) => {
                  const s = document.querySelector('.bottom-sheet__content, .screen-content');
                  if (s) s.scrollTop = where === 'end' ? s.scrollHeight : 0;
                }, scroll);
                await page.waitForTimeout(300);

                const name = shotName({ route, entry, state, theme, text, scroll });
                const file = path.join(OUT, name);
                await page.screenshot({ path: file, fullPage: args.full });
                shots.push({ name, file, route, entry, state, theme, text, scroll });
                console.log(`  ${name}`);
              }
            } finally {
              await context.close();
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Contact sheet: every shot in one labelled grid.
  //
  // Built by rendering an HTML page in the same browser and screenshotting it,
  // rather than by pulling in an image library - this repo has no runtime
  // dependencies and the one dev dependency it does have can already do it.
  // -------------------------------------------------------------------------
  if (args.sheet && shots.length > 0) {
    const THUMB = 260;
    const cards = shots.map((s) => {
      const data = fs.readFileSync(s.file).toString('base64');
      const caption = [s.entry, s.state, s.theme, s.text === 'default' ? null : s.text, s.scroll === 'top' ? null : `scrolled to ${s.scroll}`]
        .filter(Boolean).join(' / ');
      return `
        <figure>
          <img src="data:image/png;base64,${data}" alt="${s.name}" />
          <figcaption><b>${s.route}</b><span>${caption}</span></figcaption>
        </figure>`;
    }).join('');

    const html = `
      <style>
        body { margin: 0; padding: 24px; background: #f2f2f7; font: 13px -apple-system, "Segoe UI", system-ui, sans-serif; color: #1c1c1e; }
        h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
        p.meta { margin: 0 0 20px; color: #6c6c70; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(${THUMB}px, 1fr)); gap: 20px; }
        figure { margin: 0; }
        img { width: 100%; display: block; border-radius: 10px; border: 1px solid #d1d1d6; background: #fff; }
        figcaption { display: flex; flex-direction: column; gap: 2px; padding-top: 8px; line-height: 1.35; }
        figcaption span { color: #6c6c70; }
      </style>
      <h1>Your first home - ${shots.length} shot${shots.length === 1 ? '' : 's'} at ${WIDTH}x${HEIGHT}</h1>
      <p class="meta">${new Date().toISOString().slice(0, 16).replace('T', ' ')} - route / entry / skip-ahead state / theme</p>
      <div class="grid">${cards}</div>`;

    const context = await browser.newContext({
      viewport: { width: Math.min(1400, 24 * 2 + THUMB * Math.min(shots.length, 4) + 20 * 3), height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const sheet = path.join(OUT, 'contact-sheet.png');
    await page.screenshot({ path: sheet, fullPage: true });
    await context.close();
    console.log(`  contact-sheet.png`);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\n${shots.length} shot${shots.length === 1 ? '' : 's'} -> ${path.relative(ROOT, OUT)}`);
for (const note of skipped) console.log(`  skipped: ${note}`);
if (shots.length === 0) process.exitCode = 1;
