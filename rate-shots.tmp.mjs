/**
 * Verification aid for the fixed-rates pass. Not a committed test.
 *
 *   1. Asserts frame 13 stays reachable in all three /tracker variants.
 *   2. Asserts no rate row carries an interactive element.
 *   3. Shoots every rate-bearing screen at 375px, light and dark.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('C:/Users/riona/GitHub_Repos/first-home-deposit');
const OUT = path.resolve(process.argv[2]);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

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

const f = (v, p = 'read') => ({ value: v, provenance: p });

const FULL = {
  'money-in': f(2600), 'essential-spending': f(1450), 'left-over': f(1150, 'derived'),
  'saved-toward-deposit': f(21000), 'emergency-fund': f(4200), 'unassigned': f(800),
  'property-value': f(280000, 'entered'), 'deposit-pct': f(0.1, 'entered'),
  'deposit-target': f(28000, 'derived'), 'loan-amount': f(252000, 'derived'), 'ltv': f(0.9, 'derived'),
  'monthly-low': f(400, 'estimated'), 'monthly-high': f(600, 'estimated'),
  'savings-rate': f(500, 'entered'), 'months-to-target': f(14, 'derived'),
  'on-track-for': f(14, 'derived'), 'checkpoint-amount': f(21000, 'derived'),
  'borrow-low': f(168000, 'estimated'), 'borrow-high': f(189000, 'estimated'),
  'max-property': f(210000, 'estimated'),
  calculatorEntered: true, goalSaved: true,
  goal: 'house', checkRunAt: '2026-08-20T10:00:00.000Z', softSearchRecorded: true,
  stage: 'saving', resultOutcome: 'likely', solveFor: 'date',
  returnFrame: '/tracker', selectedAccountId: 'house-pot',
  journeyEntryPoint: '/home',
};

// checkpoint-amount is 0.75 x deposit-target = 21,000; deposit-target 28,000.
const BELOW = { 'saved-toward-deposit': f(12000) };   // < 21,000
const REACHED = { 'saved-toward-deposit': f(21000) }; // >= 21,000, < 28,000
const GOAL_MET = { 'saved-toward-deposit': f(28000) };// >= 28,000

const VIEWS = [
  ['08-goal-check', '/goal-check', {}],
  ['10-calculator-saving', '/calculator/saving', {}],
  ['10b-calculator-saving-date', '/calculator/saving', { solveFor: 'amount' }],
  ['11-calculator-review', '/calculator/review', {}],
  ['12-calculator-result', '/calculator/result', {}],
  ['13-learn-ltv', '/learn/ltv', {}],
  ['15-tracker-below', '/tracker', BELOW],
  ['16-tracker-reached', '/tracker', REACHED],
  ['16-tracker-goal-met', '/tracker', GOAL_MET],
  ['29-assumptions-saving', '/assumptions/saving', {}],
  ['30-assumptions-deposit', '/assumptions/deposit', {}],
  ['32-assumptions-sources', '/assumptions/sources', {}],
];

// Every element that would let a participant act on a rate.
const PROBE = () => {
  const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const card = document.querySelector('.rates-card');
  const rateRows = [...document.querySelectorAll('.rate-band-row, .review-row')];
  return {
    // Anything tappable inside the rates card or on a review row.
    interactiveInRateCard: card
      ? [...card.querySelectorAll('button, input, select, [data-action], a')].map((e) => e.tagName + ':' + txt(e).slice(0, 40))
      : null,
    headingTag: card ? card.querySelector('.rates-card__heading')?.tagName : null,
    headingCursor: card ? getComputedStyle(card.querySelector('.rates-card__heading')).cursor : null,
    changeButtons: [...document.querySelectorAll('.review-row__change')].map(txt),
    // A rate row = one whose LABEL is a rate. Not "Deposit %age" (a
    // proportion the participant chooses) and not "Saved so far".
    rowLabels: rateRows.map((r) => {
      const label = txt(r.querySelector('.review-row__label, .rate-band-row__label')) || txt(r).slice(0, 24);
      const isRate = /savings interest|tax rate|% deposit/i.test(txt(r).slice(0, 60));
      return { label, isRate, control: !!r.querySelector('button, input') };
    }),
    rateRowsWithButton: rateRows
      .filter((r) => /savings interest|tax rate/i.test(txt(r.querySelector('.review-row__label')) || '') && r.querySelector('button, input'))
      .map((r) => txt(r).slice(0, 60)),
    ltvLinks: [...document.querySelectorAll('[data-action="open-ltv-info"], [data-action="learn-ltv"], [data-action="open-ltv"]')]
      .map((e) => e.dataset.action + ' = "' + txt(e) + '"'),
  };
};

const [server, base] = await startServer();
const browser = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });

async function open(route, overrides, theme, height = 812) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height }, serviceWorkers: 'block', deviceScaleFactor: 2,
  });
  await ctx.addInitScript((v) => {
    try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {}
  }, { ...FULL, ...overrides });
  const page = await ctx.newPage();
  await page.goto(`${base}/#${route}`);
  await page.waitForTimeout(320);
  if (theme === 'dark') {
    await page.evaluate(() => document.querySelector('.screen').classList.add('theme-dark'));
    await page.waitForTimeout(140);
  }
  return { ctx, page };
}

console.log('=== A. Frame 13 reachability, per tracker variant ===');
for (const [label, overrides] of [['below-checkpoint', BELOW], ['checkpoint-reached', REACHED], ['goal-met', GOAL_MET]]) {
  const { ctx, page } = await open('/tracker', overrides, 'light');
  const probe = await page.evaluate(PROBE);
  // Actually click through, rather than trusting the DOM.
  const sel = '[data-action="open-ltv-info"], [data-action="learn-ltv"]';
  const el = await page.$(sel);
  let landed = '(no control found)';
  if (el) {
    // The action bar reveals only at the end of the scroller (action-bar.js),
    // so scroll there before a real, hit-tested click.
    await page.evaluate(() => {
      const s = document.querySelector('.screen-content');
      if (s) s.scrollTop = s.scrollHeight;
    });
    await page.waitForTimeout(520);
    await el.click();
    await page.waitForTimeout(320);
    landed = await page.evaluate(() => window.location.hash);
  }
  console.log(`  ${label.padEnd(20)} controls: ${JSON.stringify(probe.ltvLinks)}`);
  console.log(`  ${''.padEnd(20)} click -> ${landed}   ${landed === '#/learn/ltv' ? 'REACHABLE' : 'UNREACHABLE'}`);
  await ctx.close();
}

console.log('\n=== B. Rate rows carry no interactive element ===');
for (const [name, route, overrides] of VIEWS) {
  const { ctx, page } = await open(route, overrides, 'light');
  const p = await page.evaluate(PROBE);
  const bad = [];
  if (p.headingTag && p.headingTag !== 'P') bad.push(`rates-card heading is <${p.headingTag}>`);
  if (p.headingCursor && p.headingCursor === 'pointer') bad.push('rates-card heading has cursor:pointer');
  if (p.interactiveInRateCard?.length) bad.push(`interactive in rates card: ${p.interactiveInRateCard.join(', ')}`);
  if (p.rateRowsWithButton?.length) bad.push(`rate row with control: ${p.rateRowsWithButton.join(' | ')}`);
  console.log(`  ${name.padEnd(30)} ${bad.length ? 'FAIL ' + bad.join('; ') : 'ok'}`);
  for (const r of p.rowLabels ?? []) {
    if (!r.label) continue;
    console.log(`      ${r.isRate ? 'RATE ' : '     '}${r.label.padEnd(24)} ${r.control ? 'HAS CONTROL' : 'explanatory'}`);
  }
  await ctx.close();
}

console.log('\n=== C. Screenshots, 375px, light + dark ===');
for (const [name, route, overrides] of VIEWS) {
  for (const theme of ['light', 'dark']) {
    // Phone WIDTH is 375; the viewport is grown vertically so the whole screen
    // is in one frame rather than only the part above a phone's fold.
    const probeCtx = await open(route, overrides, theme);
    const need = await probeCtx.page.evaluate(() => {
      const s = document.querySelector('.sheet-overlay .bottom-sheet__content') || document.querySelector('.screen-content');
      return s ? Math.min(4000, s.scrollHeight + 320) : 812;
    });
    await probeCtx.ctx.close();
    const { ctx, page } = await open(route, overrides, theme, Math.max(812, need));
    await page.screenshot({ path: path.join(OUT, `${name}-375-${theme}.png`), fullPage: false });
    await ctx.close();
  }
  console.log(`  ${name}`);
}

await browser.close();
server.close();
console.log('\nwrote to ' + OUT);
