/**
 * FRAME 10b'S FLOOR, AND THE FIGURE IT IS ABOUT. DECISIONS.md D83 (superseding
 * D82's bounded steppers, which superseded D80's banner), closing GAPS.md G64
 * and G65.
 *
 * WHY IT IS ITS OWN FILE. The defect it guards was open for two weeks with the
 * whole suite green, because nothing in the suite looks at what frame 10b
 * COMMITS. `smoke.test.mjs` asserts the screen mounts - it did, perfectly, while
 * accepting an impossible figure. `overlap.test.mjs` asserts nothing crosses
 * text - true of a screen showing £1,861 against a £640 ceiling. D77's finding
 * exactly: an assertion that passes for a reason unrelated to what it claims to
 * test is worse than none, because it is counted.
 *
 * WHAT CHANGED UNDER D83, AND WHAT THIS FILE NOW ASSERTS. D80 let the date be
 * set and refused it; D82 bounded the steppers so it could not be set; D83
 * replaced the steppers with dropdowns floored at the same date. **The
 * invariant is the same through all three** - no impossible figure is committed
 * - so the tests asserting the invariant are unchanged. What moved is the
 * coverage of the CONTROL: D82's six stepper tests (disabled chevrons, press
 * sequences, a refused press moving nothing) describe a control that no longer
 * exists, and are replaced by list tests - the floor is the first option, no
 * offered pair is below it, and changing the year re-derives the month list.
 *
 * THE FLOOR IS NOT THE DEFAULT, and there is a test for it on its own, because
 * it is the one property here that is a research requirement rather than a
 * correctness one: at the floor the solved amount is the whole of `left-over`,
 * so opening there would anchor the participant on the most aggressive figure
 * the model permits (D83).
 *
 * WHAT ASSERTS IN WHAT FORM. Shape, not figures, so it survives a re-scale of
 * the seeded session the way `chart-range.test.mjs` does (D73's third
 * amendment). Every expected value below is derived from `model.js` at run time
 * and compared against what the SCREEN did; none is written here as a constant.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';
import { monthlyAmountFromDate, monthsToReachAmount, combinedGoal } from '../src/model/model.js';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

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

const CEILING = FULL['left-over'].value;

/** THE FLOOR, computed the way the screen computes it - same function, same rounding (D2). */
const EARLIEST_MONTHS = Math.ceil(monthsToReachAmount({
  startingBalance: FULL['saved-toward-deposit'].value,
  targetAmount: combinedGoal(FULL).value,
  monthlyAmount: CEILING,
}));

/** `monthsFromNow`'s inverse, as the screen has it. */
function dateAtMonths(n) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return { targetMonth: d.getMonth() + 1, targetYear: d.getFullYear() };
}

function monthsFromNow(targetMonth, targetYear) {
  const now = new Date();
  return (targetYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
}

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

/**
 * A FRESH TAB EVERY TIME, never a reload: a reload can restore a stale session
 * (D59), and every seed here carries `buildVersion` for the same reason.
 *
 * Pass `months: null` to seed NO date at all, which is how the seeded default
 * is tested - the screen writes its own 36-months-out date on first render.
 */
async function openAt(months, extra = {}) {
  const date = months === null ? {} : dateAtMonths(months);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...FULL, solveFor: 'amount', ...date, ...extra, buildVersion: BUILD_VERSION });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/#/calculator/saving`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(260);
  assert.deepEqual(errors, [], `frame 10b raised: ${errors.join(' | ')}`);
  return { context, page };
}

const probe = (page) => page.evaluate(() => {
  const month = document.querySelector('[data-action="select-month"]');
  const year = document.querySelector('[data-action="select-year"]');
  const moved = document.querySelector('.info-banner#date-moved');
  const figure = document.querySelector('.figure-input[role="status"]');
  const stored = JSON.parse(sessionStorage.getItem('yfh-state') || '{}');
  const opts = (el) => [...el.options].map((o) => Number(o.value));
  return {
    monthValue: Number(month.value),
    yearValue: Number(year.value),
    monthOptions: opts(month),
    yearOptions: opts(year),
    hasMoved: !!moved,
    movedText: moved?.querySelector('p')?.textContent ?? null,
    movedRole: moved?.getAttribute('role') ?? null,
    movedLive: moved?.getAttribute('aria-live') ?? null,
    movedGlyph: moved ? [...moved.querySelector('svg').classList].find((c) => c.startsWith('icon--') && !/^icon--(body|regular)$/.test(c)) : null,
    hasErrorBanner: !!document.querySelector('.warning-banner'),
    readoutText: figure?.querySelector('.figure-display')?.textContent ?? null,
    readoutLive: figure?.getAttribute('aria-live') ?? null,
    disabled: document.querySelector('.button--primary')?.disabled ?? null,
    stored: { month: stored.targetMonth, year: stored.targetYear, movedFlag: stored.dateMovedToEarliest },
    committed: { rate: stored['savings-rate'], low: stored['monthly-low'], high: stored['monthly-high'] },
  };
});

const pick = async (page, action, value) => {
  await page.selectOption(`[data-action="${action}"]`, String(value));
  await page.waitForTimeout(180);
};

// ---------------------------------------------------------------------------
// The floor's own arithmetic. G64.
// ---------------------------------------------------------------------------

test('the earliest workable month solves to at or under the ceiling, and the month before it does not', () => {
  assert.ok(EARLIEST_MONTHS >= 2, `the seed reaches its goal in ${EARLIEST_MONTHS} months at the ceiling, which leaves no month below the floor to test`);
  const at = monthlyAmountFromDate(FULL, EARLIEST_MONTHS).value;
  const before = monthlyAmountFromDate(FULL, EARLIEST_MONTHS - 1).value;
  assert.ok(at <= CEILING, `at the earliest month the solve is ${at}, above the ${CEILING} ceiling`);
  assert.ok(before > CEILING, `one month earlier the solve is ${before}, not above the ${CEILING} ceiling`);
});

// ---------------------------------------------------------------------------
// The floor is the list's first entry. D83.
// ---------------------------------------------------------------------------

test('the year list starts at the floor year and the month list at the floor month, in that year', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    const seen = await probe(page);
    const floor = dateAtMonths(EARLIEST_MONTHS);
    assert.equal(seen.yearOptions[0], floor.targetYear, 'the year list does not start at the floor');
    assert.equal(seen.monthOptions[0], floor.targetMonth, 'the month list does not start at the floor month in the floor year');
    assert.equal(seen.monthOptions[seen.monthOptions.length - 1], 12, 'the month list does not run to December');
  } finally {
    await context.close();
  }
});

test('at any later year the month list starts at January', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const seen = await probe(page);
    assert.equal(seen.monthOptions[0], 1, 'the month list is still floored in a year the floor does not reach into');
    assert.equal(seen.monthOptions.length, 12);
  } finally {
    await context.close();
  }
});

test('NO offered combination of year and month is below the floor', async () => {
  // The invariant the whole design rests on, checked over every year the list
  // offers rather than over the one on screen. For each year, the earliest month
  // the screen would offer in it is the floor's month in the floor year and
  // January in every later one - so this is the complete set of lowest points.
  const { context, page } = await openAt(EARLIEST_MONTHS + 5);
  try {
    const seen = await probe(page);
    const floor = dateAtMonths(EARLIEST_MONTHS);
    const below = [];
    for (const year of seen.yearOptions) {
      const firstMonth = year === floor.targetYear ? floor.targetMonth : 1;
      const months = monthsFromNow(firstMonth, year);
      if (months < EARLIEST_MONTHS) below.push(`${firstMonth}/${year} = ${months}`);
    }
    assert.deepEqual(below, [], `the lists offer ${below.length} pair(s) below the floor: ${below.join(', ')}`);
    assert.ok(seen.yearOptions.length > 1, 'the year list offers only one year, so this asserts almost nothing');
  } finally {
    await context.close();
  }
});

test('changing the year re-derives the month list', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    const floor = dateAtMonths(EARLIEST_MONTHS);
    assert.equal((await probe(page)).monthOptions[0], floor.targetMonth);
    await pick(page, 'select-year', floor.targetYear + 1);
    assert.equal((await probe(page)).monthOptions[0], 1, 'the month list kept the floor year bound in a later year');
    await pick(page, 'select-year', floor.targetYear);
    assert.equal((await probe(page)).monthOptions[0], floor.targetMonth, 'coming back to the floor year did not re-apply the month floor');
  } finally {
    await context.close();
  }
});

test('picking the floor year while holding an earlier month raises the month to the floor', async () => {
  // The one residue of D82's first open question, and it is smaller than that
  // question was: both values are in view, the participant is working the date
  // control, and the month list visibly no longer contains the month they had.
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const floor = dateAtMonths(EARLIEST_MONTHS);
    await pick(page, 'select-month', 1);
    assert.equal((await probe(page)).monthValue, 1);
    await pick(page, 'select-year', floor.targetYear);
    const seen = await probe(page);
    assert.equal(seen.yearValue, floor.targetYear);
    assert.equal(seen.monthValue, floor.targetMonth, 'a month below the floor survived a year change into the floor year');
    assert.ok(monthsFromNow(seen.monthValue, seen.yearValue) >= EARLIEST_MONTHS);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// Floor, not default. D83 - a research requirement, not a correctness one.
// ---------------------------------------------------------------------------

test('the seeded date is what appears on arrival, and the floor is the list start and NOT the selection', async () => {
  // Seeded with no date at all, so the screen writes its own default.
  const { context, page } = await openAt(null);
  try {
    const seen = await probe(page);
    const floor = dateAtMonths(EARLIEST_MONTHS);
    assert.equal(seen.yearOptions[0], floor.targetYear, 'the floor is not the first year offered');
    assert.ok(
      monthsFromNow(seen.monthValue, seen.yearValue) > EARLIEST_MONTHS,
      `the screen opened at or below the floor (${seen.monthValue}/${seen.yearValue}), which anchors the participant on the whole of left-over`,
    );
    // And the figure it opens on is well under the ceiling, which is the point
    // of not defaulting to the floor.
    const solved = monthlyAmountFromDate(FULL, monthsFromNow(seen.monthValue, seen.yearValue)).value;
    assert.ok(solved < CEILING, `the opening figure ${solved} is not below the ${CEILING} ceiling`);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The one case a floor cannot prevent: a floor that moved. D83, D46.
// ---------------------------------------------------------------------------

test('a date below the floor is moved to it, and the move is disclosed', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    const floor = dateAtMonths(EARLIEST_MONTHS);
    assert.equal(seen.monthValue, floor.targetMonth, 'the date was not moved to the floor');
    assert.equal(seen.yearValue, floor.targetYear);
    assert.equal(seen.stored.month, floor.targetMonth, 'the store still holds the unreachable date');
    assert.equal(seen.stored.year, floor.targetYear);
    assert.equal(seen.stored.movedFlag, true);
    assert.ok(seen.hasMoved, 'the date was moved with nothing on screen saying so - D46');
    assert.equal(seen.disabled, false, 'Continue is disabled at a date the ceiling can now reach');
  } finally {
    await context.close();
  }
});

test('the disclosure is a polite status, not an error', async () => {
  // D78 reserves the assertive role and the triangle for a state that blocks the
  // participant. Nothing is wrong here and nothing is disabled.
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.equal(seen.movedRole, 'status');
    assert.equal(seen.movedLive, 'polite');
    assert.equal(seen.movedGlyph, 'icon--info-circle', 'the disclosure is drawn as an error');
    assert.equal(seen.hasErrorBanner, false, 'an error banner was drawn beside the disclosure');
  } finally {
    await context.close();
  }
});

test('the disclosure names the date it moved to, and clears when the participant picks one', async () => {
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const floor = dateAtMonths(EARLIEST_MONTHS);
    const seen = await probe(page);
    const monthName = new Date(floor.targetYear, floor.targetMonth - 1, 1).toLocaleString('en-GB', { month: 'long' });
    assert.ok(seen.movedText.includes(`${monthName} ${floor.targetYear}`), `the disclosure does not name the date it moved to: "${seen.movedText}"`);
    assert.doesNotMatch(seen.movedText, /\{[a-z]+\}/, 'an unfilled slot reached the screen');
    assert.notEqual(seen.movedText, c.dateMovedToEarliest, 'the template rendered without its slot filled');

    await pick(page, 'select-year', floor.targetYear + 2);
    const after = await probe(page);
    assert.equal(after.hasMoved, false, 'the disclosure survived the participant picking their own date');
    assert.equal(after.stored.movedFlag, false, 'the flag survived the participant picking their own date');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// Nothing on this path writes a section 6 figure until Continue. G64.
// ---------------------------------------------------------------------------

test('selecting a date commits no figure', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 6);
  try {
    const before = await probe(page);
    await pick(page, 'select-month', 12);
    await pick(page, 'select-year', before.yearValue + 1);
    const after = await probe(page);
    assert.deepEqual(after.committed, before.committed, 'a selection wrote a section 6 figure');
  } finally {
    await context.close();
  }
});

test('the moved-date correction commits no figure either', async () => {
  // It rewrites `targetMonth`/`targetYear`, which are the screen's own keys, and
  // nothing else. D46's rule is about the participant's figures.
  const { context, page } = await openAt(EARLIEST_MONTHS - 1);
  try {
    const seen = await probe(page);
    assert.deepEqual(seen.committed.low, FULL['monthly-low']);
    assert.deepEqual(seen.committed.high, FULL['monthly-high']);
    assert.deepEqual(seen.committed.rate, FULL['savings-rate']);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The banner D82 superseded, still gone. GAPS.md G96's frame 10b case.
// ---------------------------------------------------------------------------

test('no ceiling banner is raised anywhere on the date path', async () => {
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  for (const months of [EARLIEST_MONTHS - 1, EARLIEST_MONTHS, EARLIEST_MONTHS + 6]) {
    const { context, page } = await openAt(months);
    try {
      assert.equal((await probe(page)).hasErrorBanner, false, `an error banner was drawn ${months - EARLIEST_MONTHS} months from the floor`);
    } finally {
      await context.close();
    }
  }
  // The string is KEPT, unrendered, per D82 and D83 - so that if the floor is
  // ever removed the case has its copy already written and copy-checked.
  assert.ok(c.errorDateNeedsMoreThanLeftOver, 'the superseded string was deleted rather than kept');
});

test('a stored date in the PAST is moved to the floor like any other, so errorPastDate never fires', async () => {
  // D83 SUPERSEDED `errorPastDate` ON THIS PATH TOO, which was not the intent
  // and is worth having a test say out loud. A past date is below the floor by
  // definition - the floor is never negative - so the moved-date correction
  // reaches it first and there is nothing left for the past-date branch to
  // catch. The string is kept for the same reason
  // `errorDateNeedsMoreThanLeftOver` is (D82, D83).
  const now = new Date();
  const { context, page } = await openAt(null, { targetMonth: 1, targetYear: now.getFullYear() - 1 });
  try {
    const seen = await probe(page);
    const floor = dateAtMonths(EARLIEST_MONTHS);
    assert.equal(seen.hasErrorBanner, false, 'the past-date banner fired, so the correction did not reach it first');
    assert.equal(seen.monthValue, floor.targetMonth);
    assert.equal(seen.yearValue, floor.targetYear);
    assert.ok(seen.hasMoved, 'a date was moved with nothing on screen saying so');
    assert.equal(seen.disabled, false);
  } finally {
    await context.close();
  }
});

test('D78 wiring is still asserted on this screen, on the one banner it can still raise', async () => {
  // The date path raises none now. The slider path's ceiling error is the same
  // component, on the same screen, through the same action bar - so D78's
  // treatment stays covered here rather than losing its only assertion on this
  // route.
  const { context, page } = await openAt(EARLIEST_MONTHS, {
    solveFor: 'date',
    'monthly-low': { value: CEILING + 100, provenance: 'entered' },
    'monthly-high': { value: CEILING + 400, provenance: 'entered' },
  });
  try {
    const seen = await page.evaluate(() => {
      const b = document.querySelector('.warning-banner');
      const p = document.querySelector('.button--primary');
      return { role: b?.getAttribute('role'), id: b?.id, describedBy: p?.getAttribute('aria-describedby'), disabled: p?.disabled };
    });
    assert.equal(seen.role, 'alert');
    assert.ok(seen.id, 'the banner carries no id for Continue to reference');
    assert.equal(seen.describedBy, seen.id);
    assert.equal(seen.disabled, true);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The readout. G65 - unaffected by D83, asserted so it stays that way.
// ---------------------------------------------------------------------------

test('the date path renders the monthly amount it solves, and it matches the model', async () => {
  const months = EARLIEST_MONTHS + 6;
  const { context, page } = await openAt(months);
  try {
    const seen = await probe(page);
    const expected = monthlyAmountFromDate(FULL, months).value;
    const { formatCurrency } = await import('../src/format.js');
    assert.equal(seen.readoutText, formatCurrency(expected));
    assert.equal(seen.readoutLive, 'polite');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// The slider path is untouched by any of this.
// ---------------------------------------------------------------------------

test('the slider path still shows its own ceiling error, unchanged', async () => {
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  const { context, page } = await openAt(EARLIEST_MONTHS, {
    solveFor: 'date',
    'monthly-low': { value: CEILING + 100, provenance: 'entered' },
    'monthly-high': { value: CEILING + 400, provenance: 'entered' },
  });
  try {
    const seen = await page.evaluate(() => ({
      text: document.querySelector('.warning-banner p')?.textContent ?? null,
      disabled: document.querySelector('.button--primary').disabled,
    }));
    assert.equal(seen.text, c.errorExceedsLeftOver);
    assert.equal(seen.disabled, true);
  } finally {
    await context.close();
  }
});
