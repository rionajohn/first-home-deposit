/**
 * FRAME 33'S BUILD LIST: the chip group, the detail area, and the one thing
 * that navigates.
 *
 * WHY THIS IS NOT PART OF `smoke.test.mjs`. Every state below renders. The
 * screen mounts, `#app` fills, nothing throws - so the smoke assertions pass on
 * a chip row that selects two chips at once, on a detail area that never
 * empties, and on an open action whose accessible name reads "Open {version} in
 * a new tab" with the placeholder still in it. None of those is a render fault
 * and none of them is visible to a test that only asks whether a screen drew.
 *
 * WHAT IT ASSERTS, AND WHY EACH ONE IS HERE (DECISIONS.md D140):
 *
 *   single-select     Selecting a second chip must clear the first. A group
 *                     that lights two at once has a detail area describing one
 *                     of them, with no way to tell which.
 *   deselect          Tapping the lit chip again empties the area. It is the
 *                     only way back to rest, so if it fails the block is
 *                     one-way for the rest of the session.
 *   accessible name   The open action's name must be the FULL string with the
 *                     version substituted - "Open v5 in a new tab", never the
 *                     template. It is the only thing announcing that a new tab
 *                     is coming, so an unsubstituted placeholder is the whole
 *                     warning lost. Read off `textContent` the way the
 *                     accessible name is actually computed for a link with no
 *                     `aria-label`.
 *   new tab           `target="_blank"` AND `rel="noopener"`. The new tab is
 *                     the return path: without `_blank` the current session is
 *                     replaced and there is nothing to come back to.
 *   current is inert  The running build's chip must not select. It carries
 *                     `aria-disabled`, not `disabled`, so it stays focusable -
 *                     asserted here so a later tidy-up does not "fix" it into
 *                     the tab order's blind spot.
 *   nothing committed The chip group is screen-local draft state. Selecting one
 *                     must leave `sessionStorage` byte-identical: CLAUDE.md's
 *                     state rule, and the defect D46 and G62 both were.
 *
 * The version figures are read from `src/deployments.js` at run time rather
 * than written here, so this follows the list instead of breaking on it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { FULL, SEED_ANCHOR } from './session-seed.mjs';
import { DEPLOYMENTS, currentDeployment } from '../src/deployments.js';
import { BUILD_VERSION } from '../src/cache-version.js';

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

const [server, base] = await startServer();
const browser = await chromium.launch();

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

/** The versions a moderator can actually select: everything but the running one. */
const CURRENT = currentDeployment(BUILD_VERSION);
const SELECTABLE = DEPLOYMENTS.filter((d) => !CURRENT || d.version !== CURRENT.version);

async function openSettings() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  });
  await context.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch { /* private mode */ }
  }, { ...FULL, buildVersion: BUILD_VERSION, sessionAnchor: SEED_ANCHOR });
  const page = await context.newPage();
  await page.goto(`${base}/#/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  return { context, page };
}

const chip = (page, version) => page.locator(`[data-action="select-version"][data-value="${version}"]`);
const detail = (page) => page.locator('[data-role="version-detail"]');

test('every deployment has a chip, and the running build is not one of the selectable ones', async () => {
  const { context, page } = await openSettings();
  const count = await page.locator('.pill-chips__chip').count();
  assert.equal(count, DEPLOYMENTS.length, 'one chip per deployment');
  const selectable = await page.locator('[data-action="select-version"]').count();
  assert.equal(selectable, SELECTABLE.length, 'the current build carries no select action');
  await context.close();
});

test('the detail area is empty at rest', async () => {
  const { context, page } = await openSettings();
  assert.equal((await detail(page).innerHTML()).trim(), '', 'nothing before a chip is pressed');
  await context.close();
});

test('selecting a chip shows that version, and only that chip is lit', async () => {
  const { context, page } = await openSettings();
  const target = SELECTABLE[0];
  await chip(page, target.version).click();
  await page.waitForTimeout(120);

  assert.equal(await chip(page, target.version).getAttribute('aria-pressed'), 'true');
  const lit = await page.locator('.pill-chips .pill-segments__option--selected').count();
  assert.equal(lit, 1, 'exactly one chip lit');
  assert.match(await detail(page).textContent(), /Deployed /, 'the date line is drawn');
  await context.close();
});

test('selecting a second chip deselects the first', async () => {
  const { context, page } = await openSettings();
  const [a, b] = SELECTABLE;
  await chip(page, a.version).click();
  await page.waitForTimeout(80);
  await chip(page, b.version).click();
  await page.waitForTimeout(120);

  assert.equal(await chip(page, a.version).getAttribute('aria-pressed'), 'false');
  assert.equal(await chip(page, b.version).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.pill-chips .pill-segments__option--selected').count(), 1);
  await context.close();
});

test('tapping the selected chip again deselects it and empties the detail area', async () => {
  const { context, page } = await openSettings();
  const target = SELECTABLE[0];
  await chip(page, target.version).click();
  await page.waitForTimeout(80);
  await chip(page, target.version).click();
  await page.waitForTimeout(120);

  assert.equal(await chip(page, target.version).getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.pill-chips .pill-segments__option--selected').count(), 0);
  assert.equal((await detail(page).innerHTML()).trim(), '', 'back to rest');
  await context.close();
});

test("the open action's accessible name carries the version, and opens a new tab", async () => {
  const { context, page } = await openSettings();
  for (const entry of SELECTABLE.filter((d) => d.url)) {
    await chip(page, entry.version).click();
    await page.waitForTimeout(80);
    const action = page.locator('.version-detail__action');

    // The accessible name of a link with no aria-label IS its text content.
    const name = (await action.textContent()).trim();
    assert.equal(name, `Open ${entry.version} in a new tab`, 'full string, version substituted');
    assert.doesNotMatch(name, /\{|\}/, 'no placeholder left in the announced name');

    assert.equal(await action.getAttribute('href'), entry.url);
    assert.equal(await action.getAttribute('target'), '_blank', 'the current tab must survive');
    assert.match(await action.getAttribute('rel') ?? '', /noopener/);
  }
  await context.close();
});

test('the date line names that version\'s deployment date', async () => {
  const { context, page } = await openSettings();
  const target = SELECTABLE.at(-1);
  await chip(page, target.version).click();
  await page.waitForTimeout(120);
  const line = (await page.locator('.version-detail__date').textContent()).trim();
  // Long form, the same shape the anchor caption above it uses.
  assert.match(line, /^Deployed \d{1,2} [A-Z][a-z]+ \d{4}$/, line);
  assert.doesNotMatch(line, /\{|\}/);
  await context.close();
});

test('the current build\'s chip is inert, labelled, and still focusable', async (t) => {
  if (!CURRENT) {
    t.skip(`no row carries build ${BUILD_VERSION}, so no chip is current`);
    return;
  }
  const { context, page } = await openSettings();
  const el = page.locator('.pill-chips__chip--current');
  assert.equal(await el.count(), 1);
  assert.equal(await el.getAttribute('aria-disabled'), 'true');
  assert.equal(await el.getAttribute('disabled'), null, 'aria-disabled, not disabled: it stays reachable');
  assert.match((await el.textContent()).trim(), /\(current\)$/);

  await el.click({ force: true });
  await page.waitForTimeout(120);
  assert.equal((await detail(page).innerHTML()).trim(), '', 'selecting the current build is a no-op');
  assert.equal(await page.locator('.pill-chips .pill-segments__option--selected').count(), 0);
  await context.close();
});

test('selecting a chip writes nothing to the session', async () => {
  const { context, page } = await openSettings();
  const before = await page.evaluate(() => sessionStorage.getItem('yfh-state'));
  await chip(page, SELECTABLE[0].version).click();
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => sessionStorage.getItem('yfh-state'));
  assert.equal(after, before, 'the chip group is screen-local draft state');
  await context.close();
});

test('the chip group is keyboard operable', async () => {
  const { context, page } = await openSettings();
  const target = SELECTABLE[0];
  await chip(page, target.version).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  assert.equal(await chip(page, target.version).getAttribute('aria-pressed'), 'true');
  assert.match(await detail(page).textContent(), /Deployed /);
  await context.close();
});
