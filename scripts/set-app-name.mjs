#!/usr/bin/env node
/**
 * Rename the app's display name in one command.
 *
 *   node scripts/set-app-name.mjs "Your first home"
 *   node scripts/set-app-name.mjs "Your first home" --short "First home"
 *   node scripts/set-app-name.mjs "Your first home" --dry-run
 *
 * Updates, in one pass, the three files that carry the display name:
 *
 *   src/config.js          - `name` and `shortName` (the source of truth)
 *   manifest.webmanifest   - "name" and "short_name" (static JSON, so it
 *                            necessarily duplicates config.js)
 *   docs/README.md         - the line recording the name currently in use
 *
 * Nothing is written unless all three files can be updated, so a partial
 * rename cannot leave config.js and the manifest disagreeing.
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH:
 *   - The repo/folder name and the Vercel project name. Three different
 *     names with three different lifecycles; see docs/README.md.
 *   - CACHE_VERSION in sw.js. That is a per-deploy value, not a per-rename
 *     one: bump it when a shell-asset PATH changes, not when a name does.
 *   - Prose in src/content.js that happens to contain the words "your first
 *     home" inside a sentence. Those are English, not the product name, and
 *     no script can tell which reading is meant. Rewrite them by hand.
 *   - docs/build-spec.md. Figma frame names are the system of record there;
 *     rewriting them would break the spec-to-code mapping.
 *
 * No dependencies: plain Node, readFileSync/writeFileSync only.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG_PATH = join(repoRoot, 'src', 'config.js');
const MANIFEST_PATH = join(repoRoot, 'manifest.webmanifest');
const README_PATH = join(repoRoot, 'docs', 'README.md');

/** Marker line in docs/README.md that records the name currently in use. */
const README_MARKER = '<!-- app-display-name -->';

/** Roughly where a home screen starts truncating an icon label. */
const SHORT_NAME_LIMIT = 12;

function fail(message) {
  console.error(`set-app-name: ${message}`);
  process.exit(1);
}

// --------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const positional = [];
let shortNameArg = null;

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === '--dry-run') continue;
  if (arg === '--short') {
    shortNameArg = argv[i + 1];
    if (shortNameArg === undefined) fail('--short needs a value.');
    i += 1;
    continue;
  }
  if (arg.startsWith('--')) fail(`unknown option ${arg}`);
  positional.push(arg);
}

if (positional.length === 0) {
  console.error(
    [
      'Usage: node scripts/set-app-name.mjs "<new display name>" [--short "<short name>"] [--dry-run]',
      '',
      'Updates src/config.js, manifest.webmanifest and docs/README.md together.',
      'Omit --short to keep the existing short name.',
    ].join('\n')
  );
  process.exit(1);
}
if (positional.length > 1) {
  fail(`expected one name, got ${positional.length}. Quote a name containing spaces.`);
}

const newName = positional[0].trim();
if (!newName) fail('the new name cannot be empty.');

const newShortName = shortNameArg === null ? null : shortNameArg.trim();
if (newShortName !== null && !newShortName) fail('the short name cannot be empty.');

if (newShortName !== null && newShortName.length > SHORT_NAME_LIMIT) {
  console.warn(
    `set-app-name: warning - short name is ${newShortName.length} characters; ` +
      `home screens truncate at roughly ${SHORT_NAME_LIMIT}.`
  );
}

// -------------------------------------------------------------------- read

function read(path, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    fail(`cannot read ${label} at ${path}.`);
    return '';
  }
}

const configBefore = read(CONFIG_PATH, 'src/config.js');
const manifestBefore = read(MANIFEST_PATH, 'manifest.webmanifest');
const readmeBefore = read(README_PATH, 'docs/README.md');

let manifest;
try {
  manifest = JSON.parse(manifestBefore);
} catch (error) {
  fail(`manifest.webmanifest is not valid JSON (${error.message}).`);
}

// --------------------------------------------------------- src/config.js

/**
 * Rewrites one top-level string property of the config object literal.
 * Anchored on a newline plus the exact two-space indent the object uses, so
 * the same key name appearing in this file's comments - or in some future
 * nested object - cannot be matched by mistake.
 */
function setConfigValue(source, key, value) {
  const pattern = new RegExp(`(\\n  ${key}:\\s*)(['"\`])((?:\\\\.|(?!\\2).)*)\\2`);
  const match = source.match(pattern);
  if (!match) {
    fail(`could not find \`${key}\` in src/config.js. Has the file been restructured?`);
  }
  return {
    source: source.replace(pattern, (whole, prefix) => prefix + toSingleQuoted(value)),
    previous: match[3],
  };
}

/**
 * Renders a JS single-quoted string literal. The codebase is single-quoted
 * throughout, and JSON.stringify would emit double quotes - a gratuitous
 * style change in the diff every time anyone runs a rename.
 */
function toSingleQuoted(value) {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

const nameEdit = setConfigValue(configBefore, 'name', newName);
let configAfter = nameEdit.source;
const previousName = nameEdit.previous;

let previousShortName = null;
if (newShortName !== null) {
  const shortEdit = setConfigValue(configAfter, 'shortName', newShortName);
  configAfter = shortEdit.source;
  previousShortName = shortEdit.previous;
}

// -------------------------------------------------------- manifest + README

const effectiveShortName = newShortName === null ? manifest.short_name : newShortName;

manifest.name = newName;
manifest.short_name = effectiveShortName;

// Re-serialised with the two-space indent and trailing newline the file
// already uses, so the diff shows only the lines that actually changed.
const manifestAfter = `${JSON.stringify(manifest, null, 2)}\n`;

if (!readmeBefore.includes(README_MARKER)) {
  fail(
    `could not find the ${README_MARKER} marker in docs/README.md. ` +
      'Restore it so the rename procedure keeps recording the current name.'
  );
}

const readmeLine =
  `${README_MARKER} Current display name: **${newName}** ` +
  `(short name: **${effectiveShortName}**)`;

// Replacer passed as a function: a literal `$&` or `$1` in a user-supplied
// name would otherwise be treated as a substitution pattern.
const readmeAfter = readmeBefore.replace(
  new RegExp(`^${README_MARKER}.*$`, 'm'),
  () => readmeLine
);

// ------------------------------------------------------------------- write

const changes = [
  { label: 'src/config.js', path: CONFIG_PATH, before: configBefore, after: configAfter },
  { label: 'manifest.webmanifest', path: MANIFEST_PATH, before: manifestBefore, after: manifestAfter },
  { label: 'docs/README.md', path: README_PATH, before: readmeBefore, after: readmeAfter },
];

console.log(`Display name: ${JSON.stringify(previousName)} -> ${JSON.stringify(newName)}`);
console.log(
  newShortName === null
    ? `Short name:   ${JSON.stringify(effectiveShortName)} (unchanged)`
    : `Short name:   ${JSON.stringify(previousShortName)} -> ${JSON.stringify(newShortName)}`
);

if (dryRun) {
  console.log('\n--dry-run: nothing written. Files that would change:');
} else {
  console.log('');
}

for (const change of changes) {
  if (change.before === change.after) {
    console.log(`  no change  ${change.label}`);
    continue;
  }
  if (!dryRun) writeFileSync(change.path, change.after);
  console.log(`  ${dryRun ? 'would update' : 'updated   '} ${change.label}`);
}

console.log(
  [
    '',
    'Not changed by this script (see docs/README.md):',
    '  - the repo/folder name and the Vercel project name',
    '  - CACHE_VERSION in sw.js (per-deploy, not per-rename)',
    '  - prose in src/content.js that uses the words as a sentence, not a name',
  ].join('\n')
);
