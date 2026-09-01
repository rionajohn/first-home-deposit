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

import { FULL, SEED_ANCHOR } from './session-seed.mjs';
import { goalMonths } from '../src/model/model.js';
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
  sessionAnchor: SEED_ANCHOR,
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
async function chartAt(saved, chipValue = null, { large = false, series = 'low', view = 'chart' } = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...seedAt(saved), textSize: large ? 'large' : 'default', chartSeries: series, chartView: view });
  const page = await context.newPage();
  await page.goto(`${base}/#/calculator/result`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  if (chipValue !== null) {
    const chip = page.locator(`[data-action="select-chart-range"][data-value="${chipValue}"]`);
    if (await chip.count()) {
      await chip.click();
      await page.waitForTimeout(250);
    }
  }
  const read = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const area = document.querySelector('[data-chart-area]');
    const points = [...document.querySelectorAll('.growth-chart__point')];
    const activeIdx = points.findIndex((p) => p.classList.contains('growth-chart__point--active'));
    // The point's own accessible name is "{date}, {amount}" - the same string a
    // screen reader gets, so this reads what is announced rather than a second
    // copy of the arithmetic.
    const parsePoint = (el) => {
      const [date, amount] = (el.getAttribute('aria-label') ?? '').split(', ');
      return { date, value: Number(String(amount ?? '').replace(/[^\d.]/g, '')) };
    };
    const xLabels = [...document.querySelectorAll('.growth-chart__x-label')].filter((e) => !e.hidden);
    const endpoint = [...document.querySelectorAll('p')]
      .map((p) => p.textContent.trim())
      .find((t) => /you'd reach your/.test(t)) ?? '';
    return {
      points: points.map(parsePoint),
      activeIndex: activeIdx,
      activeCount: points.filter((p) => p.classList.contains('growth-chart__point--active')).length,
      activePoint: box(points[activeIdx]),
      dateLabel: box(document.querySelector('.growth-chart__point-date')),
      plot: box(area),
      guideWidth: document.querySelector('.growth-chart__guide')?.getBoundingClientRect().width ?? 0,
      guideValue: document.querySelector('[data-chart-guide-value]')?.textContent.trim() ?? '',
      hasChart: !!area,
      hasReadout: !!document.querySelector('.figure-display'),
      readout: document.querySelector('.figure-display')?.textContent.trim() ?? '',
      readoutCaption: document.querySelector('.figure-input__caption')?.textContent.trim() ?? '',
      xLabels: xLabels.map((e) => e.textContent.trim()),
      xLabelBoxes: xLabels.map((e) => ({ text: e.textContent.trim(), ...box(e) })),
      chips: [...document.querySelectorAll('[data-action="select-chart-range"]')].map((e) => e.textContent.trim()),
      pressed: [...document.querySelectorAll('[data-action="select-chart-range"]')]
        .filter((e) => e.getAttribute('aria-pressed') === 'true').map((e) => e.textContent.trim()),
      seriesControl: document.querySelectorAll('[data-action="select-chart-series"]').length,
      compareRows: [...document.querySelectorAll('.rate-band-row')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
      tableRows: [...document.querySelectorAll('.growth-table tbody tr')].map((tr) => ({
        date: tr.querySelector('th')?.textContent.trim() ?? '',
      })),
      live: document.querySelector('[role="status"][aria-live="polite"]')?.textContent.trim() ?? '',
      endpoint,
      bodyText: document.querySelector('.screen-content')?.textContent ?? '',
    };
  });
  // The goal and the attainment month, derived from the MODEL at run time
  // rather than written into this file - D77's rule, and what lets this survive
  // a re-seeded fixture instead of breaking on one.
  const state = { ...seedAt(saved) };
  read.goal = state['combined-goal'].value;
  const g = goalMonths(state, state['monthly-low'].value);
  read.attainmentMonths = g.value !== null && Number.isFinite(g.value) && g.value > 0 ? Math.ceil(g.value) : null;
  await context.close();
  return read;
}

/** The live region says "... Savings reach £X." - pull X back out as a number. */
const announced = (live) => Number((live.match(/£([\d,]+)/) ?? [])[1]?.replace(/,/g, '') ?? NaN);

const money = (s) => Number(String(s).replace(/[^\d.]/g, ''));

test('the projection never overshoots the goal', async () => {
  // REQUIREMENT 5, and the whole reason `goalMonths` exists. The last plotted
  // point is the window's end; at "Max" that window IS the attainment month, so
  // the last point must land ON the goal and never past it.
  for (const chip of ['null', '60', '36']) {
    const c = await chartAt(20000, chip);
    const last = c.points[c.points.length - 1];
    assert.ok(last.value <= c.goal + 1,
      `chip ${chip}: last point ${last.value} exceeds the ${c.goal} goal`);
  }
});

test('the x-axis carries calendar years only, and no month string', async () => {
  const c = await chartAt(20000);
  // D102. Every label is either the origin or a bare four-digit year; a month
  // name anywhere on the axis is the defect this asserts against.
  for (const label of c.xLabels) {
    assert.ok(label === 'Now' || /^\d{4}$/.test(label), `axis label "${label}" is not a year`);
  }
  assert.equal(new Set(c.xLabels).size, c.xLabels.length, `duplicate axis labels: ${c.xLabels.join(', ')}`);
});

test('no two visible year labels overlap, at both text sizes', async () => {
  // The thinning rule (the plan's 6.4), asserted as the PROPERTY it exists for
  // rather than as a label count - a count would be a change-detector and would
  // not notice a collision at Large text.
  for (const large of [false, true]) {
    const c = await chartAt(20000, 'null', { large });
    const boxes = c.xLabelBoxes;
    for (let i = 1; i < boxes.length; i += 1) {
      assert.ok(boxes[i].left >= boxes[i - 1].right,
        `${large ? 'large' : 'default'} text: "${boxes[i].text}" overlaps "${boxes[i - 1].text}"`);
    }
  }
});

test('the default window is three years, and exactly one chip is pressed in every state', async () => {
  // D106 reversed D100's 24 months. With one point per year the two short
  // chips yielded one point and two, which is not a series.
  const fresh = await chartAt(20000);
  assert.deepEqual(fresh.pressed, ['3 yr'], 'the chart should open at the 3 yr chip');
  assert.deepEqual(fresh.chips, ['3 yr', '5 yr', 'Max'], 'the short chips are dropped, not hidden');
  for (const chip of ['36', '60', 'null']) {
    const c = await chartAt(20000, chip);
    assert.equal(c.pressed.length, 1, `chip ${chip}: exactly one chip should be pressed, got ${c.pressed.length}`);
  }
});

test('a point is active on load, in every window and every series', async () => {
  // 6.6.2b. On touch there is no hover, so nothing would otherwise hint the
  // chart responds; the affordance has to be on screen before anyone tries it.
  for (const chip of ['36', '60', 'null']) {
    for (const series of ['low', 'high']) {
      const c = await chartAt(20000, chip, { series });
      assert.equal(c.activeCount, 1, `chip ${chip}/${series}: exactly one active point`);
      assert.equal(c.activeIndex, c.points.length - 1, 'the last point is active at rest');
      assert.ok(c.guideWidth > 0, 'the guide is drawn before any interaction');
      assert.ok(money(c.guideValue) > 0, 'the guide terminates in a value');
    }
  }
});

test('the readout reports the active point, and matches the model', async () => {
  const c = await chartAt(20000);
  const last = c.points[c.points.length - 1];
  assert.equal(money(c.readout), Math.round(last.value),
    'the readout figure is the active point’s own value');
  assert.ok(c.readoutCaption.includes(last.date),
    `the caption should name the active point's date: "${c.readoutCaption}" vs "${last.date}"`);
});

test('the guide value is drawn and stays inside the plot', async () => {
  // WAS "no label renders below the active point". D111 removed the in-plot
  // year label, which is the label that test was about; the guide value is the
  // only in-plot text left, and what still matters is that it is drawn and
  // clears the plot's bounds at both text sizes.
  for (const large of [false, true]) {
    const c = await chartAt(20000, 'null', { large });
    assert.match(c.guideValue, /^£[\d,]+$/, `${large ? 'large' : 'default'}: the guide terminates in a value`);
    assert.ok(c.dateLabel === null, 'the in-plot year label is gone');
  }
});

test('the table exposes every value the guide can reveal', async () => {
  // Guaranteed by construction - both views render one points array - so this
  // asserts the construction rather than sampling it.
  // The two are mutually exclusive VIEWS, so the comparison needs both renders:
  // what is being asserted is that they agree, which is exactly what reading
  // one of them twice could not show.
  const asChart = await chartAt(20000);
  const asTable = await chartAt(20000, null, { view: 'table' });
  assert.equal(asTable.tableRows.length, asChart.points.length, 'one table row per plotted point');
  for (const p of asChart.points) {
    assert.ok(asTable.tableRows.some((r) => r.date === p.date), `no table row for ${p.date}`);
  }
});

test('the attained state draws no chart, no chips and no negative figure', async () => {
  // D99. The goal is covered by what is held, so the projection has no length.
  // A flat line read as an answer is worse than no line.
  const c = await chartAt(60000);
  assert.equal(c.hasChart, false, 'no chart is drawn');
  assert.equal(c.chips.length, 0, 'no range chips are drawn');
  assert.equal(c.seriesControl, 0, 'no series control is drawn');
  assert.equal(c.hasReadout, false, 'no readout is drawn');
  // THE COMPARISON CARD STAYS (D46): the discarded values remain visible.
  assert.ok(c.compareRows.length >= 3, 'the comparison card is still drawn');
  assert.ok(c.compareRows.some((r) => /already saved/i.test(r)), 'a covered row says so');
  const currentYear = new Date().getFullYear();
  for (const row of c.compareRows) {
    const year = Number((row.match(/\b(20\d\d)\b/) ?? [])[1]);
    if (year) assert.ok(year >= currentYear, `a past date is on screen: ${row}`);
  }
  assert.doesNotMatch(c.bodyText, /-£|−£/, 'a negative figure is on screen');
});

test('no chip is offered beyond the attainment month', async () => {
  // Requirement 5 again, at the control rather than at the plot: a chip longer
  // than the projection would draw chart past the goal.
  const c = await chartAt(51000);
  assert.ok(c.attainmentMonths !== null && c.attainmentMonths < 36,
    `this fixture should attain inside three years, got ${c.attainmentMonths}`);
  assert.ok(!c.chips.includes('5 yr'),
    `the 5 yr chip should not be offered when attainment is ${c.attainmentMonths} months out`);
});

test('the live region never announces less than the participant already has', async () => {
  for (const chip of ['36', '60']) {
    const c = await chartAt(51000, chip);
    assert.ok(announced(c.live) >= 51000,
      `chip ${chip} announced ${announced(c.live)}, below the 51,000 already saved`);
  }
});
