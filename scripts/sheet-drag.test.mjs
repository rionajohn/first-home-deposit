/**
 * Drag-to-dismiss equivalence check for the sheets that set state on close.
 *
 * The point of src/sheet-drag.js is that a drag is not a second way out of a
 * sheet — it is the same way out, reached by a different gesture. That claim
 * is only worth anything if it is asserted, because the failure it guards
 * against is invisible: a sheet that closed and looked right while quietly
 * failing to record what the participant saw. 13b is the sharp case
 * (`ltvVideoSeen`), 03b the one with a returnFrame to honour.
 *
 * So each sheet is driven twice, from an identical fresh session, and the
 * whole persisted store is compared byte for byte:
 *
 *     assert.deepStrictEqual(viaDrag.state, viaControl.state)
 *
 * Run with:  node --test scripts/sheet-drag.test.mjs
 *
 * Needs Playwright's Chromium (already in node_modules alongside the
 * screenshot tooling — a dev dependency, never shipped). Serves the repo
 * over a throwaway localhost server because ES modules will not load from
 * file://, the same reason CLAUDE.md's serve command exists.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

let server;
let browser;
let base;

/** The store key state.js persists to sessionStorage. */
const STORAGE_KEY = 'yfh-state';

/**
 * The two sheets whose close behaviour is more than a navigation.
 * `open` drives the real trigger on the real screen rather than deep-linking
 * to the sheet route, so `returnFrame` and (for 03b) `selectedAccountId` are
 * set exactly as they are in a session.
 *
 * `seed` is written to sessionStorage before the app boots, for the one
 * precondition a trigger cannot supply: frame 13 sends a participant to
 * /calculator/result unless property-value and deposit-pct are set, so
 * reaching 13b at all means arriving with the calculator already answered.
 * state.js's loader merges a stored object over its own defaults, so a
 * two-key seed is a valid store. Both runs of a comparison get the same
 * seed, which is what makes the two stores comparable at all.
 */
const SHEETS = [
  {
    frame: '03b',
    name: 'Move this account',
    seed: null,
    async open(page) {
      await page.goto(`${base}/#/consent`);
      await page.locator('.account-row__open:not([disabled])').first().click();
    },
  },
  {
    frame: '13b',
    name: 'Loan-to-Value: video and diagram',
    seed: {
      'property-value': { value: 350000, provenance: 'entered' },
      'deposit-pct': { value: 0.1, provenance: 'entered' },
    },
    async open(page) {
      await page.goto(`${base}/#/learn/ltv`);
      await page.locator('[data-action="open-video"]').click();
    },
  },
];

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const filePath = path.join(REPO_ROOT, urlPath === '/' ? 'index.html' : urlPath);
      if (!filePath.startsWith(REPO_ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

/**
 * Scrolls the sheet's content to its end, and waits for the action bar to
 * reveal itself (DECISIONS.md D17 — on a sheet whose content overflows, 13b
 * among them, the close control does not exist to be tapped until the
 * participant has read to the bottom).
 *
 * Run before BOTH gestures, not only before the tap: the two runs being
 * compared have to differ in the gesture and nothing else.
 */
async function reachEndOfSheet(page) {
  await page.evaluate(() => {
    const scroller = document.querySelector('.bottom-sheet__content');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await page.waitForFunction(() => {
    const bar = document.querySelector('[role="dialog"] .action-bar');
    return !bar || window.getComputedStyle(bar).opacity === '1';
  }, null, { timeout: 5000 });
}

/** The sheet's own close control — the thing a participant taps. */
async function closeWithControl(page) {
  await page.locator('[role="dialog"] [data-action="dismiss"]').first().click();
}

/**
 * Waits for the sheet to finish rising. Playwright measures a box and then
 * presses at those coordinates as two separate steps, so pressing mid-rise
 * aims at where the grabber was a moment ago and lands on the content below
 * it. (A real finger has no such problem — the browser hit-tests the pixels
 * that are actually there.) Waiting also makes the gesture start from a
 * known position, which is what the threshold arithmetic is measured
 * against.
 */
async function waitForSheetAtRest(page) {
  await page.waitForFunction(() => {
    const sheet = document.querySelector('[role="dialog"].bottom-sheet');
    return !!sheet && sheet.getAnimations().every((animation) => animation.playState === 'finished');
  }, null, { timeout: 5000 });
}

/** The grabber, pulled down past the dismiss threshold and released. */
function dragDown({ fraction = 0.4, stepDelay = 24 } = {}) {
  return async (page) => {
    await waitForSheetAtRest(page);
    const handle = page.locator('.bottom-sheet__drag-handle, .bottom-sheet__header').first();
    const grip = await handle.boundingBox();
    const card = await page.locator('[role="dialog"].bottom-sheet').boundingBox();
    const viewport = page.viewportSize();

    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    const distance = Math.min(card.height * fraction, viewport.height - y - 8);

    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 8; step += 1) {
      await page.mouse.move(x, y + (distance * step) / 8);
      await page.waitForTimeout(stepDelay);
    }
    await page.mouse.up();
    return distance;
  };
}

/** A fresh session: empty sessionStorage, no service worker, phone viewport. */
async function newSession({ reducedMotion = 'no-preference', seed = null } = {}) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // below the 768px breakpoint: no device frame, no scaling
    serviceWorkers: 'block',
    reducedMotion,
  });
  if (seed) {
    await context.addInitScript(([key, value]) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // storage unavailable — the app falls back to defaults and the
        // affected test will fail visibly on its own precondition
      }
    }, [STORAGE_KEY, seed]);
  }
  return context;
}

/**
 * One complete pass: fresh session, open the sheet through its real trigger,
 * close it the given way, and read back everything the app persisted.
 */
async function runSheet(sheet, close, { reducedMotion = 'no-preference' } = {}) {
  const context = await newSession({ reducedMotion, seed: sheet.seed });
  try {
    const page = await context.newPage();
    await sheet.open(page);
    await page.waitForSelector('[role="dialog"]');
    await reachEndOfSheet(page);
    await close(page);
    // Detached, not just hidden: the sheet route has actually been left.
    await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 });
    // `return await`, deliberately: a bare `return` of this promise would let
    // the finally below close the context out from under it.
    return await page.evaluate((key) => ({
      state: JSON.parse(sessionStorage.getItem(key)),
      hash: window.location.hash,
    }), STORAGE_KEY);
  } finally {
    await context.close();
  }
}

before(async () => {
  await startServer();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

for (const sheet of SHEETS) {
  test(`${sheet.frame} ${sheet.name} — drag to dismiss leaves state identical to the close control`, async () => {
    const viaControl = await runSheet(sheet, closeWithControl);
    const viaDrag = await runSheet(sheet, dragDown());

    assert.deepStrictEqual(viaDrag.state, viaControl.state);
    assert.strictEqual(viaDrag.hash, viaControl.hash);
  });

  test(`${sheet.frame} — same under prefers-reduced-motion`, async () => {
    const viaControl = await runSheet(sheet, closeWithControl, { reducedMotion: 'reduce' });
    const viaDrag = await runSheet(sheet, dragDown(), { reducedMotion: 'reduce' });

    assert.deepStrictEqual(viaDrag.state, viaControl.state);
    assert.strictEqual(viaDrag.hash, viaControl.hash);
  });
}

/**
 * All seven sheets in SPEC.md's transition rules, not just the two whose
 * close behaviour carries state. Each is dragged and has to end up back on
 * the screen its own dismiss control returns to — which is also a check that
 * the gesture is wired generically: nothing in sheet-drag.js names a screen,
 * so a sheet that draws the standard grabber gets this for free, and this
 * test is what would notice if one of them stopped.
 *
 * Deep-linked, except 03b, which redirects straight back out without a
 * selected account and so has to come through its real trigger.
 *
 * WHAT A DEEP-LINKED SHEET RETURNS TO CHANGED, and these expectations moved
 * with it. Dismiss is `goBack()` now — the browser's history is the back
 * stack — so a sheet returns to whatever the participant was actually on
 * when they opened it, and no sheet carries a written-down destination any
 * more. Opened cold by URL there is no such screen, so the answer is the
 * root the router seeds behind a deep arrival: /home. That is why six of the
 * seven rows below read `#/home` and only 03b, the one opened through its
 * real trigger, names a screen.
 *
 * The assertion this file exists to make is unaffected, and is the reason
 * these rows are worth keeping rather than deleting: a drag has to land
 * wherever the tap lands. It now does so for a reason that cannot drift,
 * since both go through the same control and that control has one behaviour.
 */
const ALL_SHEETS = [
  { frame: '03b', open: SHEETS[0].open, returnsTo: '#/consent' },
  { frame: '10c', route: '/calculator/exit', returnsTo: '#/home' },
  // Seeded like the equivalence run above: without the calculator answered,
  // frame 13 bounces to /calculator/result and 13b has nowhere to return to.
  { frame: '13b', route: '/learn/ltv/video', seed: SHEETS[1].seed, returnsTo: '#/home' },
  { frame: '29', route: '/assumptions/saving', returnsTo: '#/home' },
  { frame: '30', route: '/assumptions/deposit', returnsTo: '#/home' },
  { frame: '31', route: '/assumptions/borrowing', returnsTo: '#/home' },
  { frame: '32', route: '/assumptions/sources', returnsTo: '#/home' },
];

for (const sheet of ALL_SHEETS) {
  test(`${sheet.frame} — the grabber dismisses, and lands where its close control lands`, async () => {
    const context = await newSession({ seed: sheet.seed ?? null });
    try {
      const page = await context.newPage();
      if (sheet.open) {
        await sheet.open(page);
      } else {
        await page.goto(`${base}/#${sheet.route}`);
      }
      await page.waitForSelector('[role="dialog"]');
      await dragDown()(page);
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 });

      assert.strictEqual(await page.evaluate(() => window.location.hash), sheet.returnsTo);
    } finally {
      await context.close();
    }
  });
}

/**
 * Guards against the equality above passing for the wrong reason. If a drag
 * silently skipped 13b's close behaviour AND the control had never run it
 * either, both stores would read `ltvVideoSeen: false` and match perfectly.
 * This pins the value the comparison is supposed to be comparing.
 */
test('13b — the flag the comparison turns on is actually set by the drag', async () => {
  const viaDrag = await runSheet(SHEETS[1], dragDown());

  assert.strictEqual(viaDrag.state.ltvVideoSeen, true);
  assert.strictEqual(viaDrag.hash, '#/learn/ltv');
});

/**
 * The two ways out that already existed, checked against the same yardstick.
 * The scrim tap had to keep working untouched, and Escape's control lookup
 * moved into sheet-drag.js's shared helper during this change — both close
 * 13b, so both must leave `ltvVideoSeen` set exactly as a drag does.
 */
for (const [label, close] of [
  ['scrim tap', (page) => page.locator('.sheet-scrim').click({ position: { x: 196, y: 40 } })],
  ['Escape', (page) => page.keyboard.press('Escape')],
]) {
  test(`13b — ${label} still closes, and still records the video as seen`, async () => {
    const viaControl = await runSheet(SHEETS[1], closeWithControl);
    const viaOther = await runSheet(SHEETS[1], close);

    assert.deepStrictEqual(viaOther.state, viaControl.state);
    assert.strictEqual(viaOther.state.ltvVideoSeen, true);
  });
}

/**
 * The other half of the gesture: released short of the threshold, the sheet
 * comes back and nothing has happened — no close behaviour, no navigation.
 */
test('a short, slow drag springs back and closes nothing', async () => {
  const context = await newSession({ seed: SHEETS[1].seed });
  try {
    const page = await context.newPage();
    await SHEETS[1].open(page);
    await page.waitForSelector('[role="dialog"]');
    await waitForSheetAtRest(page);

    const handle = page.locator('.bottom-sheet__drag-handle, .bottom-sheet__header').first();
    const grip = await handle.boundingBox();
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    // 30px in two unhurried steps: under the 72px floor and under the
    // 0.5px/ms flick velocity, so neither dismissal rule fires.
    await page.mouse.move(x, y + 15);
    await page.waitForTimeout(80);
    await page.mouse.move(x, y + 30);
    await page.waitForTimeout(80);
    await page.mouse.up();
    await page.waitForTimeout(500); // let the settle finish

    const settled = await page.evaluate((key) => ({
      dialogOpen: !!document.querySelector('[role="dialog"]'),
      transform: document.querySelector('[role="dialog"].bottom-sheet').style.transform,
      state: JSON.parse(sessionStorage.getItem(key)),
      hash: window.location.hash,
    }), STORAGE_KEY);

    assert.strictEqual(settled.dialogOpen, true);
    assert.strictEqual(settled.transform, '');
    assert.strictEqual(settled.hash, '#/learn/ltv/video');
    assert.strictEqual(settled.state.ltvVideoSeen, false);
  } finally {
    await context.close();
  }
});
