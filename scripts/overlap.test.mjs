/**
 * Overlap audit: no rule crosses text, and no box is squashed below its own
 * content — on all 32 frames of build-spec.md section 3, at both of frame
 * 33's text sizes.
 *
 * WHY THIS IS A TEST AND NOT A ONE-OFF CHECK
 * The defect it was written for (GAPS.md G43) was a shared-component spacing
 * rule: `.bottom-sheet__content` never got the `> * { flex: 0 0 auto }` that
 * `.screen-content` has, so any row inside a sheet that declares its own
 * `min-height` for a touch target was compressed below its content and drew
 * its own border through its own caption. One missing line in one shared
 * component, and the damage lands on whichever screens happen to overflow —
 * which is not something reading the stylesheet tells you. G41 was the same
 * shape (a longhand silently reset by a later shorthand at equal
 * specificity), which is why this measures the RENDERED geometry and the
 * RESOLVED computed values rather than checking that a rule exists.
 *
 * Two detectors:
 *   CROSSES  a border, <hr> or thin painted box passes through the glyph
 *            band of a line of text, and the text does not paint its own
 *            opaque background over it (a chart annotation that knocks a gap
 *            in the rule it labels is not an overlap).
 *   SQUASHED an in-flow box is shorter than the content inside it — the
 *            signature of the flex-shrink defect above, caught one step
 *            before it becomes a visible collision.
 *
 * The masking exemption is real and currently has one user: frame 12's
 * growth-chart threshold labels sit on their own threshold lines and paint
 * an opaque plate over them, which is what keeps the label readable. That
 * SAME plate also covers the bars behind it, which is not deliberate and is
 * not caught here — it is a design question, open as GAPS.md G44. Do not
 * read a green run as "frame 12's chart is fine".
 *
 * Run with:  node --test scripts/overlap.test.mjs
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
// The seed is shared with the other browser-driven scripts. See
// `scripts/session-seed.mjs` for what it holds, and for the rule about adding
// to it: a key that selects the variant THIS script looks at belongs in this
// file's own override list, not in the shared one.
import { FULL, f } from './session-seed.mjs';

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

/** The frames of build-spec.md section 3, each with what selects its variant.
 *  Frames 04 (consent declined) and 05b (estimate mode) are gone - see
 *  DECISIONS.md D28. */
const FRAMES = [
  ['01', '/home', {}],
  ['02', '/journey', {}],
  ['03', '/consent', {}],
  ['03b', '/consent/move-account', {}],
  ['05', '/position', {}],
  ['06', '/position/summary', {}],
  // Not a numbered Figma frame: /goals is the bank's own goals area, added
  // outside the reference set (DECISIONS.md D21). Audited here because the
  // check is about rendered geometry, and a screen with two card sections
  // and a 64px row has exactly the shape this test was written for.
  ['goals', '/goals', {}],
  ['08', '/goal-check', {}],
  ['09', '/calculator/property', {}],
  ['09a', '/calculator/property', { 'property-value': f(null, null), 'deposit-pct': f(null, null) }],
  ['09b', '/calculator/property', { 'property-value': f(480000, 'entered'), lisaCapBreached: true }],
  ['10', '/calculator/saving', { solveFor: 'date' }],
  ['10b', '/calculator/saving', { solveFor: 'amount', targetMonth: 6, targetYear: 2028 }],
  ['10c', '/calculator/exit', {}],
  ['11', '/calculator/review', {}],
  ['12', '/calculator/result', {}],
  ['13', '/learn/ltv', {}],
  ['13b', '/learn/ltv/video', {}],
  ['15', '/tracker', { 'saved-toward-deposit': f(12000), 'checkpoint-amount': f(21000, 'derived') }],
  ['16', '/tracker', { 'saved-toward-deposit': f(22000), 'checkpoint-amount': f(21000, 'derived') }],
  // The skip-ahead control (DECISIONS.md D38) sits at the TOP of the tracker,
  // above the headline, so it changes the geometry of the whole screen rather
  // than adding a block at the end. Its own note is the longest run of small
  // text on the screen, so it earns a row of its own at both text sizes.
  ['16-skipped', '/tracker', {
    'saved-toward-deposit': f(22000), 'checkpoint-amount': f(21000, 'derived'),
    skippedAhead: true,
    skipAheadStash: {
      'saved-toward-deposit': f(12000),
      'months-to-target': f(30, 'derived'),
      'on-track-for': f({ low: 27, high: 33 }, 'derived'),
      'max-property': f(null, null),
    },
  }],
  ['17', '/mip', {}],
  ['18', '/mip/about', {}],
  ['19', '/mip/pre-check', {}],
  ['19b', '/mip/running', {}],
  ['20', '/mip/result/likely', {}],
  ['21', '/mip/result/not-yet', {}],
  ['29', '/assumptions/saving', {}],
  ['30', '/assumptions/deposit', {}],
  ['31', '/assumptions/borrowing', {}],
  ['32', '/assumptions/sources', {}],
  ['33', '/settings', {}],
];

/**
 * Runs in the page. Returns every horizontal rule in the document paired with
 * its clearance to the nearest line of text that sits over it.
 */
const AUDIT = () => {
  const EXCLUDE = '.action-bar-dock, .bottom-nav, .sheet-scrim';
  const visible = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  const opaque = (color) => color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color);

  // --- rules: borders, <hr>, and any thin element with a painted background
  const rules = [];
  for (const el of document.querySelectorAll('*')) {
    if (el.closest(EXCLUDE)) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 2) continue;
    const label = el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase();
    const bt = parseFloat(cs.borderTopWidth);
    if (bt > 0 && opaque(cs.borderTopColor)) rules.push({ el, label, edge: 'border-top', y0: r.top, y1: r.top + bt, x0: r.left, x1: r.right });
    const bb = parseFloat(cs.borderBottomWidth);
    if (bb > 0 && opaque(cs.borderBottomColor)) rules.push({ el, label, edge: 'border-bottom', y0: r.bottom - bb, y1: r.bottom, x0: r.left, x1: r.right });
    // A thin painted box IS a rule: .divider, .milestone-row__divider, etc.
    if (r.height > 0 && r.height <= 4 && opaque(cs.backgroundColor)) {
      rules.push({ el, label, edge: 'fill', y0: r.top, y1: r.bottom, x0: r.left, x1: r.right });
    }
  }

  // --- text: one band per rendered line, sized to the glyphs rather than the
  // line box, so ordinary leading between a rule and a line is not a hit.
  const bands = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const parent = n.parentElement;
    if (!parent || parent.closest(EXCLUDE) || !visible(parent)) continue;
    const cs = getComputedStyle(parent);
    if (parseFloat(cs.opacity) === 0) continue;
    const fontSize = parseFloat(cs.fontSize);
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const rect of range.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const mid = (rect.top + rect.bottom) / 2;
      // The nearest element painting an opaque background behind this text.
      // Whether that MASKS a given rule depends on the rule: a background on
      // an ancestor of the rule is behind it, not over it.
      let bgEl = null;
      for (let a = parent; a && a !== document.body; a = a.parentElement) {
        if (opaque(getComputedStyle(a).backgroundColor)) { bgEl = a; break; }
      }
      bands.push({
        bgEl,
        text: n.nodeValue.trim().slice(0, 46),
        owner: parent.className && typeof parent.className === 'string' ? parent.className.split(' ')[0] : parent.tagName.toLowerCase(),
        // ascender-to-descender, approximated as the em box centred on the line
        top: mid - fontSize * 0.5, bottom: mid + fontSize * 0.5,
        x0: rect.left, x1: rect.right,
      });
    }
  }

  const hits = [];
  for (const rule of rules) {
    for (const band of bands) {
      const overlapX = Math.min(rule.x1, band.x1) - Math.max(rule.x0, band.x0);
      if (overlapX < 2) continue;
      const crosses = rule.y0 < band.bottom && rule.y1 > band.top;
      const gap = crosses ? -1 : (rule.y0 >= band.bottom ? rule.y0 - band.bottom : band.top - rule.y1);
      if (!crosses && gap >= 2) continue;
      hits.push({
        kind: crosses ? 'CROSSES' : 'TIGHT',
        rule: `${rule.label} ${rule.edge}`, text: band.text, owner: band.owner,
        gap: +gap.toFixed(2),
        masked: !!(band.bgEl && !band.bgEl.contains(rule.el) && band.bgEl !== rule.el),
      });
    }
  }

  // --- boxes squashed below their own content (the flex-shrink signature)
  const squashed = [];
  for (const el of document.querySelectorAll('*')) {
    if (el.closest(EXCLUDE) || !visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.overflow !== 'visible' || cs.position === 'absolute') continue;
    const r = el.getBoundingClientRect();
    if (r.height < 1) continue;
    let contentBottom = -Infinity, contentTop = Infinity;
    for (const child of el.children) {
      const ccs = getComputedStyle(child);
      // Out of flow, or deliberately overhanging its parent's box.
      if (ccs.position === 'absolute' || ccs.position === 'fixed') continue;
      if (parseFloat(ccs.marginTop) < 0 || parseFloat(ccs.marginBottom) < 0) continue;
      const cr = child.getBoundingClientRect();
      if (cr.height < 1) continue;
      contentBottom = Math.max(contentBottom, cr.bottom);
      contentTop = Math.min(contentTop, cr.top);
    }
    if (contentBottom === -Infinity) continue;
    const padBottom = parseFloat(cs.paddingBottom), padTop = parseFloat(cs.paddingTop);
    const borderBottom = parseFloat(cs.borderBottomWidth);
    const spill = (contentBottom + padBottom) - (r.bottom - borderBottom);
    if (spill > 0.5) {
      squashed.push({
        el: el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase(),
        boxHeight: +r.height.toFixed(1),
        neededHeight: +(contentBottom - contentTop + padTop + padBottom + borderBottom).toFixed(1),
        spill: +spill.toFixed(1),
        minHeight: cs.minHeight, flexShrink: cs.flexShrink,
      });
    }
  }

  return { hits, squashed };
};


before(async () => {
  await startServer();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

for (const [frame, route, overrides] of FRAMES) {
  for (const textSize of ['default', 'large']) {
    test(`frame ${frame} (${textSize} text) — nothing overlaps text, nothing is squashed`, async () => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const seed = { ...FULL, ...overrides, textSize };
      await ctx.addInitScript((v) => { try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {} }, seed);
      try {
        const page = await ctx.newPage();
        await page.goto(`${base}/#${route}`);
        await page.waitForTimeout(250);

        // The frame has to actually be on screen for the audit to mean
        // anything: a screen that bounced to an earlier one would pass by
        // never being looked at.
        assert.strictEqual(await page.evaluate(() => window.location.hash), `#${route}`, `frame ${frame} did not stay on ${route}`);
        assert.strictEqual(await page.evaluate(() => !!document.querySelector('.not-built')), false);

        const { hits, squashed } = await page.evaluate(AUDIT);

        const crossings = hits.filter((h) => h.kind === 'CROSSES' && !h.masked);
        assert.deepStrictEqual(crossings, [], `rule crosses text on frame ${frame}: ${JSON.stringify(crossings, null, 2)}`);
        assert.deepStrictEqual(squashed, [], `box squashed below its content on frame ${frame}: ${JSON.stringify(squashed, null, 2)}`);
      } finally {
        await ctx.close();
      }
    });
  }
}
