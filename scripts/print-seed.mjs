/**
 * Prints one line to paste into a browser's DevTools console, so a desktop
 * browser opens the same session `scripts/shots.mjs` captures.
 *
 *     node scripts/print-seed.mjs
 *
 * The line writes the shared seed (`scripts/session-seed.mjs`) to
 * sessionStorage and reloads the page. It is the seed shots.mjs writes: the
 * greyscale theme, default text size, `CAPTURE_TODAY` as the session anchor
 * (D156) and this build's `BUILD_VERSION`, without which the app discards the
 * session as another build's (D59).
 *
 * `CAPTURE_TODAY` is read from shots.mjs's source, not written here, so the
 * two cannot name different dates. The app also discards an anchor whose month
 * is not the browser's current month, so outside that month the pasted session
 * is dropped silently.
 *
 * Prints only. Changes no file and starts nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FULL } from './session-seed.mjs';
import { BUILD_VERSION } from '../src/cache-version.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const shots = fs.readFileSync(path.join(here, 'shots.mjs'), 'utf8');
const match = shots.match(/const CAPTURE_TODAY = '(\d{4}-\d{2}-\d{2})';/);
if (!match) {
  console.error('print-seed: could not read CAPTURE_TODAY from scripts/shots.mjs.');
  process.exit(1);
}

const seed = { ...FULL, theme: 'greyscale', textSize: 'default', sessionAnchor: match[1], buildVersion: BUILD_VERSION };
console.log(`sessionStorage.setItem('yfh-state', ${JSON.stringify(JSON.stringify(seed))}); location.reload();`);
