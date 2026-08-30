/**
 * FRAME 12'S GROWTH CHART, AT THE SAVINGS POSITIONS THAT BROKE IT.
 *
 * WHY THIS IS NOT PART OF `smoke.test.mjs`. Every one of these states RENDERED.
 * The screen mounted, `#app` filled, nothing threw, the route resolved - so the
 * smoke assertions passed on all four while the chart drew, variously, twelve
 * bars in three distinct heights, an x-axis reading "0 mo" three times, a
 * descending series, and a live region announcing a balance lower than the
 * participant already had. A chart can be wrong in every particular and still
 * be a chart.
 *
 * WHAT BROKE, AND WHERE IT CAME FROM (DECISIONS.md D73's third amendment):
 *
 *   near the goal   `monthsToTarget` is a month or two, so the "Max" range was
 *                   shorter than the "6 mo" chip beside it, and twelve sample
 *                   points collapsed onto two or three distinct months.
 *   at the goal     `monthsToTarget` returns exactly 0, which is falsy, so the
 *                   range fell through to the five-year fallback by accident
 *                   rather than by decision.
 *   past the goal   `monthsToTarget` returns a NEGATIVE number, and
 *                   `Math.ceil(-17.5)` carried -17 into the range. The chart
 *                   projected backwards.
 *   the 6 mo chip   `Math.round(i * 6 / 12)` gives 1,1,2,2,3,3... - twelve bars
 *                   drawn in identical pairs, at every savings position.
 *
 * The assertions below are deliberately about SHAPE rather than about exact
 * figures: distinct bar heights, a series that rises, an axis whose labels
 * differ, and an announcement that cannot be lower than the starting balance.
 * Pinning the figures would make this a change-detector; pinning the shape
 * catches the defects and survives a re-scale.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

/** A 450,000 property at 10%: a 45,000 deposit plus 7,500 of stamp duty. */
const GOAL = 52500;
const seedAt = (saved) => ({
  ...FULL,
  'property-value': { value: 450000, provenance: 'entered' },
  'deposit-pct': { value: 0.10, provenance: 'entered' },
  'deposit-target': { value: 45000, provenance: 'entered' },
  'stamp-duty': { value: 7500, provenance: 'entered' },
  'combined-goal': { value: GOAL, provenance: 'entered' },
  'checkpoint-amount': { value: 39375, provenance: 'entered' },
  'saved-toward-deposit': { value: saved, provenance: 'read' },
  'monthly-low': { value: 200, provenance: 'read' },
  'monthly-high': { value: 310, provenance: 'read' },
  'savings-rate': { value: 255, provenance: 'read' },
  buildVersion: BUILD_VERSION,
});

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = path.resolve('.', url === '/' ? 'index.html' : `.${url}`);
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve([server, `http://127.0.0.1:${server.address().port}`]));
  });
}

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

/** Open frame 12 at a savings position, optionally pressing a range chip. */
async function chartAt(saved, chipValue = null) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, seedAt(saved));
  const page = await context.newPage();
  await page.goto(`${base}/#/calculator/result`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  if (chipValue !== null) {
    await page.click(`[data-action="select-chart-range"][data-value="${chipValue}"]`);
    await page.waitForTimeout(200);
  }
  const read = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.growth-chart__bar-group')];
    const totals = groups.map((g) => [...g.children]
      .reduce((t, c) => t + c.getBoundingClientRect().height, 0));
    return {
      totals,
      xLabels: [...document.querySelectorAll('.growth-chart__x-axis p')].map((e) => e.textContent.trim()),
      chips: [...document.querySelectorAll('[data-action="select-chart-range"]')].map((e) => e.textContent.trim()),
      pressed: [...document.querySelectorAll('[data-action="select-chart-range"]')]
        .filter((e) => e.getAttribute('aria-pressed') === 'true').map((e) => e.textContent.trim()),
      live: document.querySelector('[role="status"][aria-live="polite"]')?.textContent.trim() ?? '',
    };
  });
  await context.close();
  return read;
}

/** The live region says "... Savings reach £X." - pull X back out as a number. */
const announced = (live) => Number((live.match(/£([\d,]+)/) ?? [])[1]?.replace(/,/g, '') ?? NaN);

test('near the goal: twelve bars are not drawn as three heights', async () => {
  const c = await chartAt(52000);
  assert.equal(new Set(c.totals.map((t) => Math.round(t))).size, c.totals.length,
    `every bar should be a distinct height, got ${new Set(c.totals.map(Math.round)).size} of ${c.totals.length}`);
  assert.equal(new Set(c.xLabels).size, c.xLabels.length, `duplicate x-axis labels: ${c.xLabels.join(', ')}`);
});

test('near the goal: the range is never shorter than the shortest chip', async () => {
  // At 500 short of the goal the projection is 1.2 months, so without the floor
  // the "Max" chip would draw a NARROWER window than the "6 mo" chip beside it.
  // The floor is asserted by comparing the two directly rather than by counting
  // bars: at the floor they are the same window, so their axes must agree.
  const max = await chartAt(52000);
  const sixMonths = await chartAt(52000, 6);
  assert.deepEqual(max.xLabels, sixMonths.xLabels,
    `"Max" drew ${max.xLabels.join('|')} against "6 mo" drawing ${sixMonths.xLabels.join('|')} - the floor did not hold`);
  assert.equal(max.totals.length, sixMonths.totals.length, 'the two windows drew a different number of bars');
});

test('at the goal: the Max chip is not offered, and one chip is still selected', async () => {
  const c = await chartAt(GOAL);
  assert.ok(!c.chips.includes('Max'), `"Max" should not be offered once the goal is met, got ${c.chips.join(', ')}`);
  assert.equal(c.pressed.length, 1, `exactly one chip should be pressed, got ${c.pressed.join(', ') || 'none'}`);
});

test('past the goal: the chart does not run backwards', async () => {
  const c = await chartAt(60000);
  assert.ok(!c.chips.includes('Max'), '"Max" should not be offered past the goal either');
  for (let i = 1; i < c.totals.length; i += 1) {
    assert.ok(c.totals[i] >= c.totals[i - 1] - 0.5,
      `bar ${i + 1} is shorter than bar ${i} - the series is descending`);
  }
  assert.equal(new Set(c.xLabels).size, c.xLabels.length, `duplicate x-axis labels: ${c.xLabels.join(', ')}`);
});

test('the live region never announces less than the participant already has', async () => {
  for (const saved of [8950, 52000, GOAL, 60000]) {
    const c = await chartAt(saved);
    const said = announced(c.live);
    assert.ok(Number.isFinite(said), `no figure in the announcement at ${saved}: "${c.live}"`);
    assert.ok(said >= saved, `at ${saved} saved the chart announced ${said}, which is less`);
  }
});

test('the 6 mo chip draws one bar per month, not six pairs', async () => {
  const c = await chartAt(8950, 6);
  assert.equal(c.totals.length, 6, `six months should draw six bars, got ${c.totals.length}`);
  assert.equal(new Set(c.totals.map((t) => Math.round(t))).size, 6, 'the six bars are not six distinct heights');
  assert.equal(new Set(c.xLabels).size, c.xLabels.length, `duplicate x-axis labels: ${c.xLabels.join(', ')}`);
});

test('every chip still draws a rising series at an ordinary position', async () => {
  for (const chip of [6, 12, 36, 60]) {
    const c = await chartAt(8950, chip);
    for (let i = 1; i < c.totals.length; i += 1) {
      assert.ok(c.totals[i] > c.totals[i - 1],
        `at the ${chip}-month range, bar ${i + 1} does not rise above bar ${i}`);
    }
  }
});
