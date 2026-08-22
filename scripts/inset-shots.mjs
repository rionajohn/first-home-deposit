/**
 * Screenshot + measurement harness for the screen-inset pass.
 *
 * Not a test - a verification aid, kept because the numbers it prints are the
 * evidence behind DECISIONS.md D23 and are worth being able to re-derive
 * rather than re-eyeball. Run: `node scripts/inset-shots.mjs [outDir]`.
 *
 * It measures the inset the way a participant sees it: the gap between the
 * PHONE SCREEN's own edge and the first real content box inside the scroller,
 * not the padding value the stylesheet declares. Those two agree only if
 * nothing between them adds a margin of its own, which is exactly the thing
 * worth checking.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('.');
const OUT = path.resolve(process.argv[2] || '.screenshots/insets');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
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

/** A late-journey session, so no screen bounces back to an earlier one. */
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
  savingsWithUs: true, consentStatementChecked: true, calculatorEntered: true,
  goal: 'house', checkRunAt: '2026-08-20T10:00:00.000Z', softSearchRecorded: true,
  mode: 'personalised', stage: 'saving', resultOutcome: 'likely', solveFor: 'date',
  returnFrame: '/tracker', selectedAccountId: 'house-pot',
};

/**
 * The four views the brief names, each a different wrapper/chrome pairing,
 * plus two scrolled-to-the-end variants.
 *
 * The scrolled pair earn their place: the action bar is revealed only once
 * the participant reaches the bottom (src/action-bar.js), and the gap ABOVE
 * that bar is one of the three insets being changed. Measuring it unscrolled
 * measures a bar nobody can see yet.
 */
const VIEWS = [
  ['goals', '/goals', {}, false],                                   // app bar + tab bar
  ['calculator-property', '/calculator/property', {}, false],       // form-step header + action bar
  ['calculator-property-end', '/calculator/property', {}, true],    // ... with that bar revealed
  ['sheet-assumptions-deposit', '/assumptions/deposit', {}, false], // overlay sheet
  ['sheet-assumptions-deposit-end', '/assumptions/deposit', {}, true],
  ['settings', '/settings', {}, false],                             // no bottom chrome at all
];

const WIDTHS = [375, 1280];

const MEASURE = () => {
  const round = (n) => +n.toFixed(2);
  const screen = document.querySelector('.screen');
  const sr = screen.getBoundingClientRect();
  const scroller =
    document.querySelector('.sheet-overlay .bottom-sheet__content') ||
    document.querySelector('.screen-content');
  if (!scroller) return { error: 'no scroller' };

  const cs = getComputedStyle(scroller);
  const kids = [...scroller.children].filter((c) => c.getBoundingClientRect().width > 1);
  const first = kids[0]?.getBoundingClientRect();
  const last = kids[kids.length - 1]?.getBoundingClientRect();

  // The chrome directly above the scroller, and whatever sits at the bottom edge.
  const header = document.querySelector(
    '.sheet-overlay .bottom-sheet__header, .sheet-overlay .bottom-sheet__drag-handle, .app-bar, .form-step-header'
  );
  const bar = document.querySelector('.action-bar, .bottom-nav');
  // The sheet card, not the phone screen, is the edge a sheet's content is inset from.
  const card = document.querySelector('.sheet-overlay .bottom-sheet');
  const edge = card ? card.getBoundingClientRect() : sr;

  // The leading control's visible GLYPH, not its touch target: the icon is
  // what a participant sees sitting on (or off) the content margin.
  const glyph = document.querySelector(
    '.sheet-overlay .bottom-sheet__close .icon, .app-bar__cell--action .icon, .form-step-header__cell--action .icon'
  );

  const root = getComputedStyle(document.documentElement);
  return {
    screenWidth: round(sr.width),
    glyphInset: glyph
      ? round(Math.min(
          glyph.getBoundingClientRect().left - edge.left,
          edge.right - glyph.getBoundingClientRect().right
        ))
      : null,
    scrollerPadding: {
      top: cs.paddingTop, right: cs.paddingRight, bottom: cs.paddingBottom, left: cs.paddingLeft,
    },
    insetLeft: first ? round(first.left - edge.left) : null,
    insetRight: first ? round(edge.right - first.right) : null,
    insetTopBelowHeader: header && first ? round(first.top - header.getBoundingClientRect().bottom) : null,
    insetBottomAboveBar: bar && last ? round(bar.getBoundingClientRect().top - last.bottom) : null,
    tokens: {
      x: root.getPropertyValue('--screen-inset-x').trim() || '(unset)',
      y: root.getPropertyValue('--screen-inset-y').trim() || '(unset)',
    },
  };
};

const [server, base] = await startServer();
const browser = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });
const insets = [];

for (const [name, route, overrides, scrollToEnd] of VIEWS) {
  for (const width of WIDTHS) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 768 ? 812 : 900 },
        serviceWorkers: 'block',
        deviceScaleFactor: 2,
      });
      await ctx.addInitScript((v) => {
        try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {}
      }, { ...FULL, ...overrides });
      const page = await ctx.newPage();
      await page.goto(`${base}/#${route}`);
      await page.waitForTimeout(300);
      if (scrollToEnd) {
        await page.evaluate(() => {
          const s = document.querySelector('.sheet-overlay .bottom-sheet__content') || document.querySelector('.screen-content');
          s.scrollTop = s.scrollHeight;
        });
        // The bar's reveal is a 300ms transition (--duration-standard).
        await page.waitForTimeout(500);
      }
      // Dark mode is class-only in this codebase (tokens.css: no OS media
      // query, and frame 33 draws no Dark control), so it is applied directly.
      if (theme === 'dark') {
        await page.evaluate(() => document.querySelector('.screen').classList.add('theme-dark'));
        await page.waitForTimeout(120);
      }
      insets.push({ view: name, width, theme, ...(await page.evaluate(MEASURE)) });
      await page.screenshot({ path: path.join(OUT, `${name}-${width}-${theme}.png`) });
      await ctx.close();
    }
  }
}

// Horizontal-scroll sweep. Light only: overflow is geometry, not colour.
const overflow = [];
for (const width of [320, 375, 414, 768, 1280]) {
  for (const [name, route, overrides] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width, height: 812 }, serviceWorkers: 'block' });
    await ctx.addInitScript((v) => {
      try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {}
    }, { ...FULL, ...overrides });
    const page = await ctx.newPage();
    await page.goto(`${base}/#${route}`);
    await page.waitForTimeout(250);
    overflow.push({
      width,
      view: name,
      ...(await page.evaluate(() => {
        const de = document.documentElement;
        const screenRight = document.querySelector('.screen').getBoundingClientRect().right;
        const worst = [...document.querySelectorAll('.screen *')].reduce((acc, el) => {
          const over = el.getBoundingClientRect().right - screenRight;
          return over > acc.over
            ? { over: +over.toFixed(2), el: (typeof el.className === 'string' && el.className ? el.className.split(' ')[0] : el.tagName) }
            : acc;
        }, { over: 0, el: null });
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, worst };
      })),
    });
    await ctx.close();
  }
}

await browser.close();
await new Promise((r) => server.close(r));

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ insets, overflow }, null, 2));

console.log('--- MEASURED INSETS (px, from the phone screen edge / sheet card edge) ---');
for (const r of insets) {
  console.log(
    `${r.view.padEnd(26)} ${String(r.width).padStart(4)}px ${r.theme.padEnd(5)}` +
    ` L=${String(r.insetLeft).padStart(5)} R=${String(r.insetRight).padStart(5)}` +
    ` glyph=${String(r.glyphInset).padStart(5)}` +
    ` topBelowHeader=${String(r.insetTopBelowHeader).padStart(5)}` +
    ` bottomAboveBar=${String(r.insetBottomAboveBar).padStart(6)}` +
    `  tokens(x=${r.tokens?.x}, y=${r.tokens?.y})`
  );
}
console.log('\n--- HORIZONTAL OVERFLOW ---');
for (const o of overflow) {
  const bad = o.scrollWidth > o.clientWidth || o.worst.over > 0.5;
  console.log(
    `${String(o.width).padStart(4)}px ${o.view.padEnd(26)} doc ${o.scrollWidth}/${o.clientWidth}` +
    ` worstOverhang=${o.worst.over}${o.worst.el ? ' (' + o.worst.el + ')' : ''}  ${bad ? '<<< OVERFLOW' : 'ok'}`
  );
}
console.log(`\nWrote ${insets.length} screenshots to ${OUT}`);
