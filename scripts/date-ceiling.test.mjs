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
 * WHAT D84 CHANGED HERE. The control is a custom listbox now, not a native
 * `<select>`, so every assertion that read `.value` or `.options` had to be
 * rewritten against `[role="option"]` - and the semantics native used to
 * provide for free became this build's, so they are asserted rather than
 * assumed. **The floor's own tests did not change at all**, which is the point:
 * the floor is enforced by which options are built, and that is the one thing
 * D84 deliberately did not touch.
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
import { monthlyAmountFromDate, monthsToReachAmount, monthsToGoalUnaided, combinedGoal, rangeFromCentral } from '../src/model/model.js';

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

/**
 * THE CAP (D85), computed the way the screen computes it - same function, and
 * rounded DOWN for the reason the screen states: the crossing sits between two
 * months and rounding up readmits the first one whose answer is negative.
 */
const unaidedFor = (state) => monthsToGoalUnaided(state);
const CAP_MONTHS = (() => {
  const u = unaidedFor(FULL);
  return u.error || !Number.isFinite(u.value) ? null : Math.floor(u.value);
})();

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
  // READ OFF THE LISTBOX, NOT OFF A `<select>` (D84). The selected value is the
  // option carrying `aria-selected`, which is the same attribute a screen
  // reader reads - so this cannot pass while the control is announcing
  // something else.
  const list = (n) => document.querySelector(`[data-popover="${n}"] [role="listbox"]`);
  const selectedIn = (n) => Number(list(n).querySelector('[aria-selected="true"]').dataset.value);
  const optionsIn = (n) => [...list(n).querySelectorAll('[role="option"]')].map((o) => Number(o.dataset.value));
  const moved = document.querySelector('.info-banner#date-moved');
  const figure = document.querySelector('.figure-input[role="status"]');
  const stored = JSON.parse(sessionStorage.getItem('yfh-state') || '{}');
  return {
    monthValue: selectedIn('month'),
    yearValue: selectedIn('year'),
    monthOptions: optionsIn('month'),
    yearOptions: optionsIn('year'),
    monthLabel: document.querySelector('[data-list="month"] .date-select__value').textContent,
    yearLabel: document.querySelector('[data-list="year"] .date-select__value').textContent,
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

/**
 * OPEN THE LIST AND TAP AN OPTION, which is what a participant does. D83's
 * `page.selectOption` set a `<select>`'s value directly and never opened
 * anything; going through the trigger means the open path, the option markup
 * and the pick handler are all exercised by every test that changes a date.
 */
const pick = async (page, name, value) => {
  await page.click(`[data-list="${name}"]`);
  await page.waitForTimeout(140);
  await page.click(`[data-popover="${name}"] [role="option"][data-value="${value}"]`);
  await page.waitForTimeout(200);
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
    await pick(page, 'year', floor.targetYear + 1);
    assert.equal((await probe(page)).monthOptions[0], 1, 'the month list kept the floor year bound in a later year');
    await pick(page, 'year', floor.targetYear);
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
    await pick(page, 'month', 1);
    assert.equal((await probe(page)).monthValue, 1);
    await pick(page, 'year', floor.targetYear);
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

    await pick(page, 'year', floor.targetYear + 2);
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
    await pick(page, 'month', 12);
    await pick(page, 'year', before.yearValue + 1);
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

// ---------------------------------------------------------------------------
// THE LISTBOX CONTRACT. D84 - everything the native `<select>` used to give
// away, asserted rather than assumed, because getting it wrong is worse for a
// screen reader user than the control it replaces.
// ---------------------------------------------------------------------------

const listState = (page, name) => page.evaluate((n) => {
  const trigger = document.querySelector(`[data-list="${n}"]`);
  const popover = document.querySelector(`[data-popover="${n}"]`);
  const list = popover.querySelector('[role="listbox"]');
  const options = [...list.querySelectorAll('[role="option"]')];
  const readout = document.querySelector('.figure-display');
  const dock = document.querySelector('.action-bar-dock').getBoundingClientRect();
  const scroller = document.querySelector('.screen-content').getBoundingClientRect();
  const rect = popover.getBoundingClientRect();
  const active = list.getAttribute('aria-activedescendant');
  return {
    hidden: popover.hidden,
    expanded: trigger.getAttribute('aria-expanded'),
    haspopup: trigger.getAttribute('aria-haspopup'),
    controls: trigger.getAttribute('aria-controls'),
    listId: list.id,
    listRole: list.getAttribute('role'),
    everyOptionHasRole: options.length > 0 && options.every((o) => o.getAttribute('role') === 'option'),
    everyOptionHasId: options.every((o) => !!o.id),
    selectedCount: options.filter((o) => o.getAttribute('aria-selected') === 'true').length,
    tickCount: list.querySelectorAll('.date-select__tick').length,
    activeDescendant: active,
    activeIsReal: !!(active && list.querySelector(`#${CSS.escape(active)}`)),
    focusIsList: document.activeElement === list,
    focusIsTrigger: document.activeElement === trigger,
    focusIsBody: document.activeElement === document.body,
    aboveTrigger: popover.classList.contains('date-select__popover--above'),
    withinVisibleArea: rect.top >= scroller.top - 1 && rect.bottom <= dock.top + 1,
    widthRatio: rect.width / document.querySelector('.date-select__row').getBoundingClientRect().width,
    readoutTop: readout ? Math.round(readout.getBoundingClientRect().top) : null,
    dockTop: Math.round(dock.top),
    scrollTop: Math.round(list.scrollTop),
    scrollHeight: list.scrollHeight,
    clientHeight: list.clientHeight,
  };
}, name);

test('the closed trigger and the open list carry the listbox roles', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    let seen = await listState(page, 'year');
    assert.equal(seen.hidden, true, 'the list is open before it is opened');
    assert.equal(seen.expanded, 'false');
    assert.equal(seen.haspopup, 'listbox');
    assert.equal(seen.controls, seen.listId, 'the trigger does not point at the list it opens');

    await page.click('[data-list="year"]');
    await page.waitForTimeout(160);
    seen = await listState(page, 'year');
    assert.equal(seen.hidden, false);
    assert.equal(seen.expanded, 'true');
    assert.equal(seen.listRole, 'listbox');
    assert.ok(seen.everyOptionHasRole, 'not every option carries role="option"');
    assert.ok(seen.everyOptionHasId, 'an option has no id, so aria-activedescendant cannot name it');
    assert.equal(seen.selectedCount, 1, 'aria-selected is not on exactly one option');
    assert.ok(seen.activeIsReal, `aria-activedescendant "${seen.activeDescendant}" names no option in the list`);
    assert.ok(seen.focusIsList, 'focus did not move into the list');
  } finally {
    await context.close();
  }
});

test('the selection is marked twice - a tick as well as the tint', async () => {
  // WCAG 1.4.1: colour may not be the only carrier. The same constraint D78
  // applied to the banner icons, where the answer was a different shape.
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    await page.click('[data-list="year"]');
    await page.waitForTimeout(160);
    const seen = await listState(page, 'year');
    assert.equal(seen.tickCount, 1, 'the selected option carries no tick, so the tint is the only marker');
    const tinted = await page.evaluate(() => {
      const sel = document.querySelector('[data-popover="year"] [aria-selected="true"]');
      const other = document.querySelector('[data-popover="year"] [aria-selected="false"]');
      return getComputedStyle(sel).backgroundColor !== getComputedStyle(other).backgroundColor;
    });
    assert.ok(tinted, 'the selected option is not tinted either');
  } finally {
    await context.close();
  }
});

test('the overlay floats: it pushes neither the readout nor the dock, and is not clipped', async () => {
  for (const months of [EARLIEST_MONTHS + 24, EARLIEST_MONTHS - 1]) {
    const { context, page } = await openAt(months);
    try {
      const before = await listState(page, 'year');
      await page.click('[data-list="year"]');
      await page.waitForTimeout(180);
      const after = await listState(page, 'year');
      assert.equal(after.readoutTop, before.readoutTop, 'opening the list moved the readout');
      assert.equal(after.dockTop, before.dockTop, 'opening the list moved the dock');
      assert.ok(after.withinVisibleArea, 'the list reaches outside the visible area, where .screen-content would clip it');
      assert.ok(after.widthRatio < 0.6, `the list spans ${Math.round(after.widthRatio * 100)}% of the row, so it covers the month`);
    } finally {
      await context.close();
    }
  }
});

test('the list flips above the trigger when there is no room below it', async () => {
  // D83's moved-date disclosure sits above the control and pushes it down far
  // enough that a five-option list does not fit beneath it. Measured, not
  // assumed: this is the state that makes the flip necessary rather than nice.
  // AWAITED INSIDE THE `try`, not returned from it: a returned promise settles
  // after `finally` has already closed the context, which fails as "target
  // closed" and looks like a defect in the control rather than in the harness.
  const openAndRead = async (months) => {
    const { context, page } = await openAt(months);
    try {
      await page.click('[data-list="year"]');
      await page.waitForTimeout(180);
      return await listState(page, 'year');
    } finally { await context.close(); }
  };
  const below = await openAndRead(EARLIEST_MONTHS + 24);
  const moved = await openAndRead(EARLIEST_MONTHS - 1);
  assert.equal(below.aboveTrigger, false, 'the list flipped above the trigger where there was room below it');
  assert.equal(moved.aboveTrigger, true, 'the list opened below the trigger where it does not fit');
  assert.ok(below.withinVisibleArea && moved.withinVisibleArea);
});

test('the list opens on the current selection, with what is above it in view', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    await page.click('[data-list="year"]');
    await page.waitForTimeout(180);
    const seen = await listState(page, 'year');
    assert.ok(seen.scrollHeight > seen.clientHeight, 'the year list does not scroll, so this asserts nothing');
    const selectedVisible = await page.evaluate(() => {
      const list = document.querySelector('[data-popover="year"] [role="listbox"]');
      const sel = list.querySelector('[aria-selected="true"]');
      const lr = list.getBoundingClientRect(); const sr = sel.getBoundingClientRect();
      return sr.top >= lr.top - 1 && sr.bottom <= lr.bottom + 1;
    });
    assert.ok(selectedVisible, 'the list opened without the selected option in view');
    assert.ok(seen.scrollTop > 0, 'the list opened at the top rather than on the selection');
  } finally {
    await context.close();
  }
});

test('near the floor the list opens at the top, so the floor reads as where it begins', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS);
  try {
    await page.click('[data-list="year"]');
    await page.waitForTimeout(180);
    assert.equal((await listState(page, 'year')).scrollTop, 0, 'the floor is scrolled out of view on open');
  } finally {
    await context.close();
  }
});

test('the keyboard moves the active option without committing anything', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const before = await probe(page);
    await page.focus('[data-list="year"]');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(180);
    const opened = await listState(page, 'year');
    assert.equal(opened.expanded, 'true', 'ArrowDown on the trigger did not open the list');
    const startedOn = opened.activeDescendant;

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
    const moved = await listState(page, 'year');
    assert.notEqual(moved.activeDescendant, startedOn, 'ArrowDown did not move the active option');
    assert.deepEqual((await probe(page)).committed, before.committed, 'an arrow key committed a figure');
    assert.equal((await probe(page)).yearValue, before.yearValue, 'an arrow key changed the selection');

    await page.keyboard.press('End');
    await page.waitForTimeout(120);
    const end = await listState(page, 'year');
    await page.keyboard.press('Home');
    await page.waitForTimeout(120);
    const home = await listState(page, 'year');
    assert.notEqual(end.activeDescendant, home.activeDescendant, 'Home and End land on the same option');
    assert.ok(home.activeIsReal && end.activeIsReal);
  } finally {
    await context.close();
  }
});

test('Escape dismisses without selecting and returns focus to the trigger', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const before = await probe(page);
    await page.focus('[data-list="year"]');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(180);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(140);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(180);
    const seen = await listState(page, 'year');
    assert.equal(seen.hidden, true, 'Escape left the list open');
    assert.equal(seen.expanded, 'false');
    assert.equal(seen.focusIsTrigger, true, 'Escape dropped focus somewhere other than the trigger');
    assert.equal(seen.focusIsBody, false);
    assert.equal((await probe(page)).yearValue, before.yearValue, 'Escape committed the option the arrows had reached');
  } finally {
    await context.close();
  }
});

test('reopening puts the active option back on the selection', async () => {
  // It used to come back wherever the arrows had abandoned it, several rows
  // from the value the trigger was showing - while the SCROLL went to the
  // selection, so the two disagreed on screen. D84.
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    await page.focus('[data-list="year"]');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(180);
    await page.keyboard.press('End');
    await page.waitForTimeout(140);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(160);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    const seen = await listState(page, 'year');
    const selectedId = await page.evaluate(() => document.querySelector('[data-popover="year"] [aria-selected="true"]').id);
    assert.equal(seen.activeDescendant, selectedId, 'the active option came back where it was left, not on the selection');
  } finally {
    await context.close();
  }
});

test('Enter selects the active option, and focus lands on the trigger', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const before = await probe(page);
    await page.focus('[data-list="year"]');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(180);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(140);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(260);
    const after = await probe(page);
    assert.notEqual(after.yearValue, before.yearValue, 'Enter committed nothing');
    assert.ok(monthsFromNow(after.monthValue, after.yearValue) >= EARLIEST_MONTHS, 'Enter reached a date below the floor');
    assert.equal((await listState(page, 'year')).focusIsTrigger, true, 'focus was dropped after a keyboard pick');
    assert.deepEqual(after.committed, before.committed, 'a pick committed a section 6 figure');
  } finally {
    await context.close();
  }
});

test('an outside tap dismisses the list and does not drop focus on the document', async () => {
  const { context, page } = await openAt(EARLIEST_MONTHS + 24);
  try {
    const before = await probe(page);
    await page.click('[data-list="month"]');
    await page.waitForTimeout(160);
    assert.equal((await listState(page, 'month')).hidden, false);
    // The screen headline: outside the popover, and not itself focusable -
    // which is the case that used to clear focus to `<body>`.
    await page.click('.screen-title');
    await page.waitForTimeout(220);
    const seen = await listState(page, 'month');
    assert.equal(seen.hidden, true, 'the list survived a tap outside it');
    assert.equal(seen.expanded, 'false');
    assert.equal(seen.focusIsBody, false, 'the outside tap dropped focus at the top of the document');
    assert.equal(seen.focusIsTrigger, true);
    assert.equal((await probe(page)).monthValue, before.monthValue, 'an outside tap changed the selection');
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// THE CAP. D85, closing the reachable half of GAPS.md G98.
// ---------------------------------------------------------------------------

test('the cap rounds DOWN, because rounding up readmits the negative', () => {
  // Asserted on the arithmetic before any screen is opened, so a seed whose
  // crossing lands exactly on a month boundary fails here, naming the fixture,
  // rather than as a mysterious extra option.
  assert.ok(CAP_MONTHS !== null, 'the shared seed has no cap, so nothing below asserts anything');
  const atCap = monthlyAmountFromDate(FULL, CAP_MONTHS).value;
  const past = monthlyAmountFromDate(FULL, CAP_MONTHS + 1).value;
  assert.ok(atCap >= 0, `the solve at the cap month is ${atCap}, which is already negative`);
  assert.ok(past < 0, `the solve one month past the cap is ${past}, so the cap is not where the sign changes`);
});

test('the year list ends at the cap year and the month list ends at the cap month in it', async () => {
  const { context, page } = await openAt(CAP_MONTHS);
  try {
    const seen = await probe(page);
    const cap = dateAtMonths(CAP_MONTHS);
    assert.equal(seen.yearOptions[seen.yearOptions.length - 1], cap.targetYear, 'the year list runs past the cap year');
    assert.equal(seen.monthOptions[seen.monthOptions.length - 1], cap.targetMonth, 'the month list runs past the cap month in the cap year');
  } finally {
    await context.close();
  }
});

test('NO offered pair produces a negative solve, and D2 holds for every one', async () => {
  // The invariant this whole pass exists for, checked at each year's HIGHEST
  // offered month - the complete set of the range's top points, the mirror of
  // the floor test's lowest ones.
  const { context, page } = await openAt(CAP_MONTHS - 12);
  try {
    // THE HIGHEST OFFERED MONTH IS READ OFF THE SCREEN, NOT COMPUTED HERE.
    // Computing it from this file's own cap made the test pass while the screen
    // offered one month more than it should - it checked the month it believed
    // in rather than the month on offer, which is D77's finding in this very
    // file. Each year is SELECTED so its own re-derived month list can be read.
    const seen = await probe(page);
    const bad = [];
    for (const year of seen.yearOptions) {
      await pick(page, 'year', year);
      const forYear = await probe(page);
      const highest = forYear.monthOptions[forYear.monthOptions.length - 1];
      const months = monthsFromNow(highest, year);
      const solved = monthlyAmountFromDate(FULL, months).value;
      const range = rangeFromCentral(solved);
      if (solved < 0) bad.push(`${highest}/${year} solves ${solved.toFixed(2)}`);
      // D2: low < central < high. It holds only for a positive central, and
      // nothing in `rangeFromCentral` enforces that - see GAPS.md G99.
      if (!(range.low < solved && solved < range.high)) bad.push(`${highest}/${year} range inverted`);
    }
    assert.deepEqual(bad, [], `the lists offer ${bad.length} pair(s) that solve negative or invert: ${bad.join(', ')}`);
    assert.ok(seen.yearOptions.length > 1, 'only one year is offered, so this asserts almost nothing');
  } finally {
    await context.close();
  }
});

test('monthsToReachAmount is monotonic in the monthly amount, which is why floor <= cap', () => {
  // ASSERTED, NOT ASSUMED. The floor is taken at `left-over` and the cap at a
  // zero contribution, so "the floor cannot exceed the cap" rests entirely on
  // this and on nothing else. If it ever stopped holding, the two bounds could
  // cross on a session where the goal is NOT met, which is a state D85 says
  // cannot happen.
  const goal = combinedGoal(FULL).value;
  for (const startingBalance of [1000, 10000, FULL['saved-toward-deposit'].value, 27000]) {
    let previous = Infinity;
    for (let monthlyAmount = 1; monthlyAmount <= 2000; monthlyAmount += 1) {
      const months = monthsToReachAmount({ startingBalance, targetAmount: goal, monthlyAmount });
      assert.ok(months <= previous + 1e-9, `not monotonic at balance ${startingBalance}, amount ${monthlyAmount}: ${months} > ${previous}`);
      previous = months;
    }
  }
});

test('with nothing saved there is no cap, and the year span falls back to the constant', async () => {
  // GAPS.md G97, demoted rather than closed: nothing compounds from nothing, so
  // there is no crossing and the invented horizon is what is left.
  const { context, page } = await openAt(null, { 'saved-toward-deposit': { value: 0, provenance: 'read' } });
  try {
    const seen = await probe(page);
    const unaided = monthsToGoalUnaided({ ...FULL, 'saved-toward-deposit': { value: 0, provenance: 'read' } });
    assert.equal(unaided.value, Infinity, 'a zero balance has a finite crossing');
    assert.equal(seen.yearOptions.length, 21, 'the fallback span is not the 20 years past the floor that G97 records');
  } finally {
    await context.close();
  }
});

test('a selection above the cap is moved down to it, AND the move is disclosed', async () => {
  // The mirror of D83's moved-floor case, and disclosed since D86 - it was
  // silent under D85, which was the D46 gap GAPS.md G102 recorded.
  const { default: content } = await import('../src/content.js');
  const c = content['/calculator/saving'];
  const { context, page } = await openAt(CAP_MONTHS + 40);
  try {
    const seen = await probe(page);
    const cap = dateAtMonths(CAP_MONTHS);
    assert.equal(seen.yearValue, cap.targetYear, 'a date past the cap was left standing');
    assert.equal(seen.monthValue, cap.targetMonth);
    assert.equal(seen.stored.year, cap.targetYear, 'the store still holds the date past the cap');
    assert.equal(seen.stored.month, cap.targetMonth);
    assert.ok(seen.hasMoved, 'the date was moved down with nothing on screen saying so - D46');
    const monthName = new Date(cap.targetYear, cap.targetMonth - 1, 1).toLocaleString('en-GB', { month: 'long' });
    assert.ok(seen.movedText.includes(`${monthName} ${cap.targetYear}`), `the disclosure does not name the date it moved to: "${seen.movedText}"`);
    assert.doesNotMatch(seen.movedText, /\{[a-z]+\}/, 'an unfilled slot reached the screen');
    // IT IS THE CAP'S STRING, NOT THE FLOOR'S. The two lead differently on
    // purpose (D86) and normalising them to one shape would lose the reason.
    assert.notEqual(seen.movedText, c.dateMovedToEarliest, 'the floor\'s wording was used for a move down to the cap');
    assert.notEqual(seen.movedText, c.dateMovedToCap, 'the template rendered without its slot filled');
  } finally {
    await context.close();
  }
});

test('the cap disclosure is a polite status, not an error', async () => {
  const { context, page } = await openAt(CAP_MONTHS + 40);
  try {
    const seen = await probe(page);
    assert.equal(seen.movedRole, 'status');
    assert.equal(seen.movedLive, 'polite');
    assert.equal(seen.movedGlyph, 'icon--info-circle', 'the disclosure is drawn as an error');
    assert.equal(seen.hasErrorBanner, false, 'an error banner was drawn beside the disclosure');
    assert.equal(seen.disabled, false, 'Continue is disabled at a date the cap allows');
  } finally {
    await context.close();
  }
});

test('the cap disclosure appears only when something was MOVED, not on every capped list', async () => {
  // The check that caught a real defect: picking the cap's year while holding a
  // later month used to leave a date past the cap, which the render corrected
  // and announced - a banner saying the app had moved their date when they had
  // just moved it themselves. The year pick clamps at both ends now (D86).
  for (const months of [CAP_MONTHS, CAP_MONTHS - 20, EARLIEST_MONTHS]) {
    const { context, page } = await openAt(months);
    try {
      assert.equal((await probe(page)).hasMoved, false, `a disclosure was drawn on arrival at ${months} months, where nothing moved`);
    } finally {
      await context.close();
    }
  }
  // And picking the cap year with a later month held: clamped, not announced.
  const { context, page } = await openAt(CAP_MONTHS - 20);
  try {
    const cap = dateAtMonths(CAP_MONTHS);
    await pick(page, 'month', 12);
    await pick(page, 'year', cap.targetYear);
    const seen = await probe(page);
    assert.equal(seen.hasMoved, false, 'the participant\'s own year pick raised a disclosure');
    assert.equal(seen.monthValue, cap.targetMonth, 'the month was not clamped to the cap on a year pick');
  } finally {
    await context.close();
  }
});

test('the two disclosures are mutually exclusive, and only one banner ever renders', async () => {
  // A selection cannot be below the floor and above the cap at once - the floor
  // cannot exceed the cap while the goal is ahead (D85's monotonicity), and
  // where the goal is met neither branch runs. Each move clears the other's
  // flag, so no sequence of renders leaves both set. Seeded with both anyway,
  // which is a state the app cannot produce, to pin what happens if one ever
  // arrives: the floor's wins and exactly one banner is drawn.
  const { context, page } = await openAt(CAP_MONTHS - 20, { dateMovedToEarliest: true, dateMovedToCap: true });
  try {
    const { default: content } = await import('../src/content.js');
    const count = await page.evaluate(() => document.querySelectorAll('#date-moved').length);
    assert.equal(count, 1, `${count} disclosure banners rendered at once`);
    const seen = await probe(page);
    assert.ok(seen.movedText.startsWith("We've moved your date"), 'the floor\'s wording did not win when both flags were set');
    void content;
  } finally {
    await context.close();
  }
});

test('both disclosures clear when the participant picks a date', async () => {
  for (const [label, months] of [['floor', EARLIEST_MONTHS - 1], ['cap', CAP_MONTHS + 40]]) {
    const { context, page } = await openAt(months);
    try {
      const before = await probe(page);
      assert.ok(before.hasMoved, `${label}: nothing was disclosed to clear`);
      // Pick a year the list definitely offers and that is not the current one.
      const other = before.yearOptions.find((y) => y !== before.yearValue) ?? before.yearOptions[0];
      await pick(page, 'year', other);
      const after = await probe(page);
      assert.equal(after.hasMoved, false, `${label}: the disclosure survived the participant picking a date`);
      assert.equal(after.stored.movedFlag, false, `${label}: dateMovedToEarliest survived the pick`);
      assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('yfh-state')).dateMovedToCap), false, `${label}: dateMovedToCap survived the pick`);
      assert.deepEqual(after.committed, before.committed, `${label}: a pick committed a section 6 figure`);
    } finally {
      await context.close();
    }
  }
});

// ---------------------------------------------------------------------------
// The empty list: the goal is already met. D85.
// ---------------------------------------------------------------------------

const GOAL_MET = {
  'deposit-pct': { value: 0.05, provenance: 'entered' },
  'deposit-target': { value: 14000, provenance: 'derived' },
  'combined-goal': { value: 14000, provenance: 'derived' },
};

test('when the goal is already met the date control is not drawn at all', async () => {
  const state = { ...FULL, ...GOAL_MET };
  const floorMonths = Math.ceil(monthsToReachAmount({
    startingBalance: state['saved-toward-deposit'].value,
    targetAmount: combinedGoal(state).value,
    monthlyAmount: state['left-over'].value,
  }));
  const capMonths = Math.floor(monthsToGoalUnaided(state).value);
  assert.ok(capMonths < floorMonths, `the fixture does not reach the empty case: floor ${floorMonths}, cap ${capMonths}`);

  const { context, page } = await openAt(null, GOAL_MET);
  try {
    const seen = await page.evaluate(() => ({
      control: !!document.querySelector('.date-select'),
      statement: !!document.querySelector('#date-goal-met'),
      role: document.querySelector('#date-goal-met')?.getAttribute('role') ?? null,
      live: document.querySelector('#date-goal-met')?.getAttribute('aria-live') ?? null,
      glyph: document.querySelector('#date-goal-met svg') ? [...document.querySelector('#date-goal-met svg').classList].find((c) => c.startsWith('icon--') && !/^icon--(body|regular)$/.test(c)) : null,
      errorBanner: !!document.querySelector('.warning-banner'),
      readout: !!document.querySelector('.figure-input[role="status"]'),
      disabled: document.querySelector('.button--primary').disabled,
      segments: document.querySelectorAll('[data-action="select-solve-for"]').length,
    }));
    // AN EMPTY LISTBOX IS NEVER DRAWN. A control that asks a question with no
    // answers is worse than no control.
    assert.equal(seen.control, false, 'the date control was drawn with nothing to offer');
    assert.ok(seen.statement, 'nothing took the control\'s place');
    // NOT AN ERROR. Nothing the participant did is wrong; they have saved enough.
    assert.equal(seen.role, 'status');
    assert.equal(seen.live, 'polite');
    assert.equal(seen.glyph, 'icon--info-circle');
    assert.equal(seen.errorBanner, false, 'the goal-met state raised an error banner');
    // NO FIGURE EITHER. There is no date, so there is nothing to solve.
    assert.equal(seen.readout, false, 'a solved amount was rendered with no date to solve for');
    assert.equal(seen.disabled, true, 'Continue is live with no date to commit');
    // THE WAY FORWARD IS LEFT IN PLACE.
    assert.equal(seen.segments, 2, 'the segmented control was removed, leaving no way off this state');
  } finally {
    await context.close();
  }
});

test('the goal-met state commits nothing, even if Continue is forced', async () => {
  const { context, page } = await openAt(null, GOAL_MET);
  try {
    const before = await page.evaluate(() => JSON.parse(sessionStorage.getItem('yfh-state')));
    // Clicked through the DOM, past Playwright's actionability check, so the
    // handler's own guard is tested and not only the disabled attribute.
    await page.evaluate(() => document.querySelector('[data-action="continue"]').click());
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => JSON.parse(sessionStorage.getItem('yfh-state')));
    assert.equal(await page.evaluate(() => window.location.hash), '#/calculator/saving', 'Continue navigated away from the goal-met state');
    for (const key of ['savings-rate', 'monthly-low', 'monthly-high']) {
      assert.deepEqual(after[key], before[key], `${key} was written from a state with no date`);
    }
  } finally {
    await context.close();
  }
});
