/**
 * Stale-session audit (DECISIONS.md D59, GAPS.md G66's second half).
 *
 * WHAT THIS IS FOR
 * `state.js` restores a session by merging the stored object over
 * `defaultState()`, which means a STORED value beats a freshly seeded one. A
 * tab carried across a deploy therefore kept rendering the previous build's
 * seeded figures indefinitely, and - this is the part that cost an
 * investigation - with no visible symptom. The screen was fully rendered and
 * internally consistent, so it read as a bug in whichever figure had just
 * changed. `money-in` is the one that surfaced it; every seeded figure had the
 * same exposure.
 *
 * The fix stamps the store with `BUILD_VERSION` and discards a stored session
 * whose stamp is not the running build's. These tests hold the three
 * properties that fix has to have, and they are written against BEHAVIOUR
 * (what a screen renders, what survives a reload) rather than against
 * `load()`'s internals, so a later refactor of the merge cannot pass them
 * while reintroducing the defect.
 *
 * WHY A BROWSER AND NOT A UNIT TEST
 * The whole mechanism is `sessionStorage` plus module-evaluation order:
 * `state.js` reads storage exactly once, when the module is first evaluated.
 * A shim would have to reproduce that ordering to mean anything, and it is
 * the ordering that was subtle. Driving a real reload tests the thing itself.
 *
 * Run with:  node --test scripts/stale-session.test.mjs
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { BUILD_VERSION } from '../src/cache-version.js';
import { MOCK_POSITION } from '../src/model/accounts.js';
import { monthlyAmountFromDate } from '../src/model/model.js';

const ROOT = path.resolve('.');
const STORAGE_KEY = 'yfh-state';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png' };

let server;
let browser;
let base;

before(async () => {
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const f = path.join(ROOT, p === '/' ? 'index.html' : p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

/**
 * A context whose tab already holds `stored` under the app's storage key,
 * written before any app code runs - which is what a tab carried across a
 * deploy actually looks like.
 */
async function contextWith(stored) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (stored !== undefined) {
    await ctx.addInitScript(([k, v]) => {
      try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {}
    }, [STORAGE_KEY, stored]);
  }
  return ctx;
}

const readStored = (page) => page.evaluate((k) => {
  const raw = sessionStorage.getItem(k);
  return raw ? JSON.parse(raw) : null;
}, STORAGE_KEY);

// A session that looks real: past the calculator, with figures a default
// store does not have, so "was it discarded" is answerable by looking at any
// one of them.
function priorSession(buildVersion) {
  const f = (value, provenance = 'read') => ({ value, provenance });
  const s = {
    'money-in': f(2240),
    'essential-spending': f(1860),
    'left-over': f(380, 'derived'),
    'property-value': f(420000, 'entered'),
    'deposit-pct': f(0.1, 'entered'),
    'deposit-target': f(42000, 'entered'),
    journeyStarted: true,
    ltvVideoSeen: true,
  };
  if (buildVersion !== undefined) s.buildVersion = buildVersion;
  return s;
}

test('a session stamped with an older build is discarded, not merged', async () => {
  const ctx = await contextWith(priorSession('v1'));
  try {
    const page = await ctx.newPage();
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });

    await page.goto(`${base}/index.html#/position`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const stored = await readStored(page);
    // The seeded figure is back, and it is the MODEL's, not the stored one.
    assert.equal(stored['money-in'].value, MOCK_POSITION.moneyIn);
    assert.notEqual(stored['money-in'].value, 2240);
    // Discarded WHOLE: an unrelated flag from the old session is gone too, so
    // this cannot pass by merging the figures alone.
    assert.equal(stored.ltvVideoSeen, false);
    assert.equal(stored.journeyStarted, false);
    // And restamped, so the discard happens once rather than every load.
    assert.equal(stored.buildVersion, BUILD_VERSION);

    // The discard is announced, with both versions.
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /v1/);
    assert.match(warnings[0], new RegExp(BUILD_VERSION));
  } finally {
    await ctx.close();
  }
});

test('an unstamped session predates the stamp and is discarded too', async () => {
  const ctx = await contextWith(priorSession(undefined));
  try {
    const page = await ctx.newPage();
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });

    await page.goto(`${base}/index.html#/position`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const stored = await readStored(page);
    assert.equal(stored['money-in'].value, MOCK_POSITION.moneyIn);
    assert.equal(stored.buildVersion, BUILD_VERSION);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /unstamped/);
  } finally {
    await ctx.close();
  }
});

test('the discarded session renders the CURRENT seeded figure on screen', async () => {
  // The behavioural half of the two tests above: the defect was never about
  // the store, it was about what a participant read on a screen.
  const ctx = await contextWith(priorSession('v1'));
  try {
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html#/position`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const text = await page.evaluate(() => document.getElementById('app').textContent);
    assert.match(text, /£2,500/);
    assert.doesNotMatch(text, /£2,240/);
  } finally {
    await ctx.close();
  }
});

test('a session stamped with the running build restores unchanged', async () => {
  const prior = priorSession(BUILD_VERSION);
  const ctx = await contextWith(prior);
  try {
    const page = await ctx.newPage();
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });

    await page.goto(`${base}/index.html#/position`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const stored = await readStored(page);
    // Every stored value survives, including the deliberately-old figure:
    // a matching stamp means this is a mid-session restore, not a stale one,
    // and the check must not touch it.
    assert.equal(stored['money-in'].value, 2240);
    assert.equal(stored['left-over'].value, 380);
    assert.equal(stored['property-value'].value, 420000);
    assert.equal(stored.ltvVideoSeen, true);
    assert.equal(stored.journeyStarted, true);
    // Nothing announced, because nothing was discarded.
    assert.equal(warnings.length, 0);

    // And `isNewSession()` stayed false: the opening stage was NOT re-applied
    // over the restored goal, which is the behaviour D48 depends on.
    assert.equal(stored['property-value'].value, 420000);
  } finally {
    await ctx.close();
  }
});

test('mid-session persistence still carries a typed calculator value across a reload and back navigation', async () => {
  // Step 4 of the change: nothing about in-session persistence may move. This
  // is the flow's real dependency - frame 09's value has to survive both a
  // reload (storage) and a back navigation (history), or the calculator loses
  // what the participant typed.
  const ctx = await contextWith(undefined);
  try {
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html#/calculator/property`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const input = await page.$('[data-role="property-value"]');
    assert.ok(input, 'frame 09 property-value input is present');
    await input.fill('375000');
    await input.dispatchEvent('change');
    await page.waitForTimeout(200);

    await page.click('[data-action="continue"]');
    await page.waitForTimeout(400);
    assert.match(await page.evaluate(() => location.hash), /calculator\/saving/);

    // Survives a document reload: this is the persistence path.
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    let stored = await readStored(page);
    assert.equal(stored['property-value'].value, 375000);
    assert.equal(stored['property-value'].provenance, 'entered');

    // Survives going back to frame 09, and the field is repopulated with it.
    // The field draws through `formatDigits`, so it is thousands-grouped and
    // carries no "£" (the markup renders the symbol as a separate prefix
    // glyph) - asserted as the screen actually draws it, not as the raw value.
    await page.goBack();
    await page.waitForTimeout(500);
    const shown = await page.evaluate(() => {
      const el = document.querySelector('[data-role="property-value"]');
      return el ? el.value : null;
    });
    assert.equal(shown, '375,000');

    stored = await readStored(page);
    assert.equal(stored['property-value'].value, 375000);
  } finally {
    await ctx.close();
  }
});

/**
 * THE TYPED TARGET YEAR (frame 10b).
 *
 * The year on step 2 of 3 used to be a stepped-only readout, and is now typed
 * as well - the same `focus`/`change` pair frames 05 and 09 already use. Three
 * things have to hold, and only the first is about this screen:
 *
 *   1. The typed year survives a reload and a back navigation, exactly as
 *      frame 09's typed property value does above. This is the half that
 *      touches D59: the store is stamped with the running build, so a
 *      same-build restore must carry the year through untouched rather than
 *      discard it as stale.
 *   2. It reaches the figure step 3 and the result screen are built from.
 *      `savings-rate` is SOLVED from the target date on this path (D2), so a
 *      year the participant typed and a year they stepped to must produce the
 *      same figure - asserted against the model directly, not against a
 *      number written into this file, so the two cannot drift.
 *   3. An empty field writes nothing. This is CLAUDE.md's state rule and
 *      D46/G62's defect: a draft that reached `targetYear` would leave the
 *      store holding a year no screen expects, and the calculator would solve
 *      against it.
 */
test('a typed target year survives a reload and a back navigation, and drives step 3', async () => {
  const ctx = await contextWith(undefined);
  try {
    const page = await ctx.newPage();
    await page.goto(`${base}/index.html#/calculator/property`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const propertyInput = await page.$('[data-role="property-value"]');
    await propertyInput.fill('375000');
    await propertyInput.dispatchEvent('change');
    await page.waitForTimeout(200);
    await page.click('[data-action="continue"]');
    await page.waitForTimeout(400);

    // Switch to the date-stepper variant, which is where the year lives.
    await page.click('[data-action="select-solve-for"][data-value="amount"]');
    await page.waitForTimeout(300);

    const yearInput = await page.$('[data-role="target-year"]');
    assert.ok(yearInput, 'frame 10b target-year input is present');

    // It is a numeric-keypad text field, not a number input, and it holds a
    // four-digit year - the whole of the attribute contract this change added.
    const attrs = await page.evaluate(() => {
      const el = document.querySelector('[data-role="target-year"]');
      return { type: el.type, inputmode: el.getAttribute('inputmode'), maxlength: el.getAttribute('maxlength') };
    });
    assert.equal(attrs.type, 'text');
    assert.equal(attrs.inputmode, 'numeric');
    assert.equal(attrs.maxlength, '4');

    const typedYear = new Date().getFullYear() + 7;
    await yearInput.fill(String(typedYear));
    await yearInput.dispatchEvent('change');
    await page.waitForTimeout(300);

    let stored = await readStored(page);
    assert.equal(stored.targetYear, typedYear);
    assert.equal(stored.targetYearCleared, false);
    const targetMonth = stored.targetMonth;

    // 1. Survives the reload. A same-build stamp is a mid-session restore.
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    stored = await readStored(page);
    assert.equal(stored.targetYear, typedYear, 'the typed year survived the reload');
    assert.equal(stored.buildVersion, BUILD_VERSION);
    assert.equal(
      await page.evaluate(() => document.querySelector('[data-role="target-year"]').value),
      String(typedYear),
      'and the field is repopulated with it',
    );

    // 2. AN EMPTY FIELD IS A DRAFT. The committed year is left standing and
    // Continue is disabled - no figure moves, and no error is raised, because
    // nothing is wrong yet.
    const liveYear = await page.$('[data-role="target-year"]');
    await liveYear.fill('');
    await liveYear.dispatchEvent('change');
    await page.waitForTimeout(300);
    stored = await readStored(page);
    assert.equal(stored.targetYearCleared, true);
    assert.equal(stored.targetYear, typedYear, 'the draft did not write the committed year');
    assert.equal(
      await page.evaluate(() => document.querySelector('[data-action="continue"]').disabled),
      true,
      'Continue is disabled while the field is empty',
    );

    // Typing it back resolves the draft.
    const backAgain = await page.$('[data-role="target-year"]');
    await backAgain.fill(String(typedYear));
    await backAgain.dispatchEvent('change');
    await page.waitForTimeout(300);
    stored = await readStored(page);
    assert.equal(stored.targetYearCleared, false);

    // 3. It drives the figure step 3 is built from. `savings-rate` is solved
    // from the typed date, so it must match the model run over the same
    // months - computed here from the store rather than hard-coded.
    await page.click('[data-action="continue"]');
    await page.waitForTimeout(400);
    assert.match(await page.evaluate(() => location.hash), /calculator\/review/);

    stored = await readStored(page);
    const now = new Date();
    const months = (typedYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
    const expected = monthlyAmountFromDate(stored, months);
    assert.ok(Math.abs(stored['savings-rate'].value - expected.value) < 1e-6,
      `savings-rate ${stored['savings-rate'].value} should be the model's ${expected.value}`);
    // And step 3 renders it, so the figure reached the screen and not just the
    // store. `monthly-low` is the range's lower bound, drawn by the review row.
    const reviewText = await page.evaluate(() => document.getElementById('app').textContent);
    const lowShown = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
      .format(Math.round(stored['monthly-low'].value));
    assert.ok(reviewText.includes(lowShown), `step 3 should show ${lowShown}`);

    // 4. Going back to step 2 still shows the typed year - the history path,
    // which is the one a participant uses to change their mind.
    await page.goBack();
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => document.querySelector('[data-role="target-year"]').value),
      String(typedYear),
      'the year is still there after a back navigation',
    );
  } finally {
    await ctx.close();
  }
});
