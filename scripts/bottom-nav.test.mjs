/**
 * Bottom navigation: three states, and only ONE of them is drawn differently.
 *
 * WHAT THIS IS FOR (DECISIONS.md D11, as amended 21 August 2026)
 * The bar has three states, and the visual treatment deliberately collapses
 * two of them:
 *
 *   active    the current route IS this tab's destination. Four cues: the
 *             indicator rule, a bold label, the FILLED icon variant, and full
 *             label colour.
 *   enabled   tappable, but not where the participant is. Identical to a
 *             disabled tab STANDING STILL - same colour, same weight, outline
 *             icon, no indicator. It says it is tappable by answering a
 *             finger (`:active` / `:hover` in components.css), not by looking
 *             different at rest.
 *   disabled  Payments, Insights, Profile - the surrounding bank app.
 *
 * The defect this was written for: nothing set `color` on `.bottom-nav__tab`,
 * so an ENABLED tab inherited the document's full-strength label colour while
 * a DISABLED one was greyed by the user agent's own `:disabled` styling. Two
 * treatments, neither of them chosen. Goals on /home - enabled, not current -
 * drew exactly as dark as Home and read as selected on the first screen of
 * the study.
 *
 * WHY IT MEASURES COMPUTED VALUES AND RENDERED MARKUP
 * Reading the stylesheet would not have caught it: the rule that greyed the
 * disabled tabs was not IN the stylesheet, it came from the UA. The assertion
 * that catches this class of defect is the cross-state one -
 *
 *     Goals on /home === Payments on /home
 *
 * - resolved colour, resolved weight, icon variant, indicator, in one
 * comparison. Same shape as overlap.test.mjs (G41/G43): measure what the
 * browser resolved, not what the file says.
 *
 * Run with:  node --test scripts/bottom-nav.test.mjs
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('.');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png' };
let server;
let browser;
let base;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const f = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${server.address().port}`; resolve(); });
  });
}

/**
 * Runs in the page. One record per tab, holding everything that could carry
 * "this is the tab you are on" - resolved colours and weights, which drawing
 * the icon is, whether the indicator exists, and the two ARIA states.
 *
 * `iconVariant` is the `icon--<name>` class, which is how icons.js names the
 * drawing (`target` vs `target-fill`), and `iconFilled` is whether any part
 * of the glyph carries `.icon__fill`. Both are recorded because they are
 * different claims: the first says a different SVG was chosen in the markup,
 * the second says it renders as solid.
 */
const PROBE = () => {
  const SIZE_OR_WEIGHT = /^icon--(micro|footnote|subheadline|body|title3|large|hero|regular|medium|semibold|bold)$/;
  const tabs = [...document.querySelectorAll('.bottom-nav__tab')];
  return tabs.map((el) => {
    const label = el.querySelector('.bottom-nav__label');
    const svg = el.querySelector('svg.icon');
    const cs = getComputedStyle(el);
    const ls = getComputedStyle(label);
    const is = getComputedStyle(svg);
    return {
      id: el.dataset.tab,
      tabColor: cs.color,
      labelColor: ls.color,
      labelWeight: ls.fontWeight,
      iconColor: is.color,
      iconVariant: [...svg.classList].find((c) => c.startsWith('icon--') && !SIZE_OR_WEIGHT.test(c)),
      iconFilled: !!svg.querySelector('.icon__fill, .icon__solid'),
      hasIndicator: !!el.querySelector('.bottom-nav__active-rule'),
      activeClass: el.classList.contains('bottom-nav__tab--active'),
      ariaCurrent: el.getAttribute('aria-current'),
      disabled: el.disabled,
      focusable: !el.disabled,
    };
  });
};

/** Everything that is meant to be identical between an enabled and a disabled
 *  tab at rest. Excludes `iconVariant` (different shapes) and `disabled`. */
const AT_REST = ({ tabColor, labelColor, labelWeight, iconColor, iconFilled, hasIndicator, activeClass, ariaCurrent }) =>
  ({ tabColor, labelColor, labelWeight, iconColor, iconFilled, hasIndicator, activeClass, ariaCurrent });

async function navAt(route) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  try {
    const page = await ctx.newPage();
    await page.goto(`${base}/#${route}`);
    await page.waitForSelector('.bottom-nav__tab');
    await page.waitForTimeout(150);
    assert.strictEqual(await page.evaluate(() => window.location.hash), `#${route}`, `did not stay on ${route}`);
    const tabs = await page.evaluate(PROBE);
    return Object.fromEntries(tabs.map((t) => [t.id, t]));
  } finally {
    await ctx.close();
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

/* --- The assertion that would have caught it the first time --------------
   Goals on /home is enabled and not current. Payments on /home is disabled.
   At rest they must be indistinguishable. */
test('/home - enabled Goals is drawn exactly like disabled Payments', async () => {
  const nav = await navAt('/home');

  assert.strictEqual(nav.goals.disabled, false, 'Goals must still be tappable');
  assert.strictEqual(nav.payments.disabled, true, 'Payments must still be inert');

  assert.deepStrictEqual(
    AT_REST(nav.goals),
    AT_REST(nav.payments),
    'Goals (enabled, not current) is drawn differently from Payments (disabled) at rest'
  );

  // Stated separately so a failure names the cue rather than dumping a diff.
  assert.strictEqual(nav.goals.labelColor, nav.payments.labelColor, 'Goals label colour differs from Payments');
  assert.strictEqual(nav.goals.iconFilled, false, 'Goals renders the FILLED icon on /home');
  assert.strictEqual(nav.goals.iconVariant, 'icon--target', 'Goals renders the active icon drawing on /home');
  assert.strictEqual(nav.goals.hasIndicator, false, 'Goals draws the active indicator on /home');
  assert.strictEqual(nav.goals.labelWeight, nav.payments.labelWeight, 'Goals label is a different weight from Payments');
});

test('/goals - enabled Home is drawn exactly like disabled Payments', async () => {
  const nav = await navAt('/goals');

  assert.deepStrictEqual(
    AT_REST(nav.home),
    AT_REST(nav.payments),
    'Home (enabled, not current) is drawn differently from Payments (disabled) at rest'
  );
  assert.strictEqual(nav.home.iconVariant, 'icon--house', 'Home renders the filled drawing on /goals');
  assert.strictEqual(nav.home.hasIndicator, false, 'Home draws the active indicator on /goals');
});

/* --- The other half: the active tab really is distinguished ---------------
   A bar where nothing is lit would pass every test above. */
for (const [route, lit, litIcon] of [['/home', 'home', 'icon--house-fill'], ['/goals', 'goals', 'icon--target-fill']]) {
  test(`${route} - ${lit} carries all four active cues and no other tab does`, async () => {
    const nav = await navAt(route);
    const active = nav[lit];

    assert.strictEqual(active.hasIndicator, true, 'no indicator rule');
    assert.strictEqual(active.labelWeight, '600', 'label is not bold');
    assert.strictEqual(active.iconVariant, litIcon, 'outline icon on the active tab');
    assert.strictEqual(active.iconFilled, true, 'active icon is not filled');
    assert.strictEqual(active.ariaCurrent, 'page', 'aria-current is not set on the active tab');
    assert.notStrictEqual(active.labelColor, nav.payments.labelColor, 'active label is the same colour as a resting tab');

    for (const id of ['home', 'payments', 'goals', 'insights', 'profile'].filter((t) => t !== lit)) {
      assert.strictEqual(nav[id].hasIndicator, false, `${id} draws an indicator on ${route}`);
      assert.strictEqual(nav[id].activeClass, false, `${id} carries --active on ${route}`);
      assert.strictEqual(nav[id].ariaCurrent, null, `${id} claims aria-current on ${route}`);
      assert.strictEqual(nav[id].iconFilled, false, `${id} draws a filled icon on ${route}`);
    }
  });
}

/* --- The same tab, two routes ---
   Goals is the control for itself: nothing about it may change between a
   route where it is lit and one where it is not, EXCEPT the four cues. */
test('Goals differs between /home and /goals in the four active cues and nothing else', async () => {
  const onHome = (await navAt('/home')).goals;
  const onGoals = (await navAt('/goals')).goals;

  assert.deepStrictEqual(
    { variant: onHome.iconVariant, filled: onHome.iconFilled, indicator: onHome.hasIndicator, weight: onHome.labelWeight },
    { variant: 'icon--target', filled: false, indicator: false, weight: '400' }
  );
  assert.deepStrictEqual(
    { variant: onGoals.iconVariant, filled: onGoals.iconFilled, indicator: onGoals.hasIndicator, weight: onGoals.labelWeight },
    { variant: 'icon--target-fill', filled: true, indicator: true, weight: '600' }
  );
  assert.notStrictEqual(onHome.labelColor, onGoals.labelColor, 'label colour does not change with the state');
  // Both routes leave it tappable and focusable - that is the whole point of
  // the state: distinguished by behaviour, not by appearance.
  assert.strictEqual(onHome.focusable, true);
  assert.strictEqual(onGoals.focusable, true);
});

/* --- A route inside the journey lights nothing (D11: TAB_FOR_ROUTE) ------- */
test('/journey - no tab is lit, and Home and Goals rest like the disabled three', async () => {
  const nav = await navAt('/journey');
  for (const id of ['home', 'payments', 'goals', 'insights', 'profile']) {
    assert.strictEqual(nav[id].hasIndicator, false, `${id} draws an indicator mid-journey`);
    assert.strictEqual(nav[id].iconFilled, false, `${id} draws a filled icon mid-journey`);
  }
  assert.deepStrictEqual(AT_REST(nav.home), AT_REST(nav.payments));
  assert.deepStrictEqual(AT_REST(nav.goals), AT_REST(nav.payments));
});
