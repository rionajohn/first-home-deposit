/**
 * UNKNOWN ROUTES GO HOME (DECISIONS.md D163).
 *
 * Boot on an unknown hash was already redirected by D162. This covers the half
 * D162 left: an unknown hash reached DURING a session, which used to render
 * "Not built yet: <path>" inside the tab bar. Also checks `404.html`, the file
 * Vercel serves for an unknown path, by loading it directly - the server
 * fallback itself can only be confirmed on a deployment.
 *
 * Asserts the landed hash, that Back does not return to the junk entry, and
 * that valid routes and `/reset` are untouched.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright-keep.mjs';
import { chromium as plainChromium } from 'playwright';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png' };

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
const plain = await plainChromium.launch();
test.after(async () => {
  await browser.close();
  await plain.close();
  await new Promise((resolve) => server.close(resolve));
});

async function open(b = browser) {
  const context = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/#/home`, { waitUntil: 'networkidle' });
  return { page, errors };
}
const settle = (page) => page.waitForTimeout(250);
const hash = (page) => page.evaluate(() => window.location.hash);
const text = (page) => page.locator('#app').innerText();

const UNKNOWN = ['#/doesnotexist', '#/', '#/goals/', '#/GOALS', '#/goals/x', '#/home/', '#//', '#/doesnotexist?diag=1'];

for (const h of UNKNOWN) {
  test(`in-session ${h} lands on #/home with no error screen`, async () => {
    const { page, errors } = await open();
    await page.evaluate((v) => { window.location.hash = v; }, h);
    await settle(page);
    assert.equal(await hash(page), '#/home');
    assert.ok(!/not built yet/i.test(await text(page)), 'the Not built yet screen rendered');
    assert.deepEqual(errors, []);
  });
}

test('an unknown hash replaces its entry: Back does not return to it', async () => {
  const { page } = await open();
  await page.evaluate(() => { window.location.hash = '#/goals'; });
  await settle(page);
  await page.evaluate(() => { window.location.hash = '#/doesnotexist'; });
  await settle(page);
  assert.equal(await hash(page), '#/home');
  await page.goBack();
  await settle(page);
  assert.equal(await hash(page), '#/goals');
  assert.ok(!/not built yet/i.test(await text(page)));
});

test('an empty hash is still home', async () => {
  const { page } = await open();
  await page.evaluate(() => { window.location.hash = '#/goals'; });
  await settle(page);
  await page.evaluate(() => { window.location.hash = ''; });
  await settle(page);
  assert.ok((await text(page)).length > 0);
  assert.ok(['', '#/home'].includes(await hash(page)));
});

test('a valid route is not redirected', async () => {
  const { page } = await open();
  await page.evaluate(() => { window.location.hash = '#/settings'; });
  await settle(page);
  assert.equal(await hash(page), '#/settings');
});

test('#/reset still resets and lands on home', async () => {
  const { page } = await open();
  await page.evaluate(() => { window.location.hash = '#/reset'; });
  await settle(page);
  assert.equal(await hash(page), '#/home');
});

test('boot on an unknown hash opens home (D162, without the keep flag)', async () => {
  const { page } = await open(plain);
  const context = page.context();
  const fresh = await context.newPage();
  await fresh.goto(`${base}/#/doesnotexist`, { waitUntil: 'networkidle' });
  await settle(fresh);
  assert.equal(await hash(fresh), '#/home');
});

test('404.html redirects to /#/home', async () => {
  const { page } = await open();
  // Served from the server root here; the fallback depth is a Vercel matter.
  await page.goto(`${base}/404.html`, { waitUntil: 'load' });
  await page.waitForURL(/\/#\/home$/);
  await settle(page);
  assert.equal(new URL(page.url()).pathname, '/');
  assert.ok((await text(page)).length > 0);
});

test('404.html is not a shell asset and is allowed through .vercelignore', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.ok(!/404\.html/.test(sw.split('self.addEventListener')[0].replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.match(fs.readFileSync('.vercelignore', 'utf8'), /^!\/404\.html$/m);
});
