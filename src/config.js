/**
 * App identity — the single source of truth for what this prototype is
 * called and how it presents itself when installed.
 *
 * WHY THIS FILE EXISTS
 * Three different names sit around this project and they are not the same
 * thing. Only the third one is in here:
 *
 *   1. The repo / folder name (`first-home-deposit`) — lives in Git and on
 *      disk. Never seen by a participant. Not in this file.
 *   2. The Vercel project name (`first-home-deposit-ux-prototype`) — this
 *      is the URL a participant types. It lives in the Vercel dashboard,
 *      not in the repo, and changing it changes that URL. Not in this file.
 *   3. The app display name ("Your first home") — the browser title, the
 *      home-screen icon label, and the app-bar title on screen. That is
 *      what this file owns.
 *
 * See docs/README.md for the full rename procedure for all three.
 *
 * WHAT READS THIS
 *   - index.html         — sets <title>, the iOS home-screen title, and the
 *                          theme-colour meta from `name`/`shortName`/`themeColour`
 *   - src/content.js     — the app-bar title on the screens that show the
 *                          feature name (its ONE documented exception to the
 *                          "literal strings only" rule)
 *   - src/app.js         — dev-only drift check against manifest.webmanifest
 *   - scripts/set-app-name.mjs — rewrites `name`/`shortName` here and in the
 *                          manifest together, so the two cannot diverge
 *
 * manifest.webmanifest is static JSON and cannot import this module, so it
 * is the one place these values are necessarily duplicated. Do not hand-edit
 * one without the other — use `node scripts/set-app-name.mjs "<new name>"`,
 * which updates both plus docs/README.md in a single command. In development
 * (localhost), src/app.js logs a console warning if the two ever disagree.
 */

const config = {
  // SAFE TO EDIT — but edit via scripts/set-app-name.mjs, not by hand, so
  // manifest.webmanifest is updated in the same step.

  /**
   * Full display name. Browser tab title, PWA install prompt, splash screen,
   * and the app-bar title on /journey and /goal-check.
   * Mirrors manifest.webmanifest "name".
   */
  name: 'Your first home',

  /**
   * Short display name for the home-screen icon label, where the OS gives
   * roughly 12 characters before it truncates. Android reads this from the
   * manifest; iOS reads it from the apple-mobile-web-app-title meta tag that
   * index.html fills in from here.
   * Mirrors manifest.webmanifest "short_name".
   */
  shortName: 'First home',

  /**
   * One-line description shown in install prompts and listings. Never
   * rendered inside the app.
   * Mirrors manifest.webmanifest "description".
   */
  description:
    "A click-through prototype: guidance towards a first home deposit, built around a participant's own account activity.",

  // SAFE TO EDIT, but keep in step with src/css/tokens.css — these two
  // colours are the OS-chrome equivalents of the in-app tokens, and a
  // mismatch shows as a visible seam around the status bar on install.

  /**
   * Colour of the browser/OS chrome around the installed app.
   * Matches --color-label in src/css/tokens.css.
   * Mirrors manifest.webmanifest "theme_color".
   */
  themeColour: '#17171c',

  /**
   * Colour painted behind the app on the splash screen, before the first
   * render. Matches --color-bg in src/css/tokens.css.
   * Mirrors manifest.webmanifest "background_color".
   */
  backgroundColour: '#f7f7f8',

  // DO NOT EDIT without also checking sw.js — start URL and scope are what
  // the service worker precaches and serves against. Changing either without
  // updating SHELL_ASSETS and bumping CACHE_VERSION will strand installed
  // copies on a path that no longer resolves.

  /**
   * The URL an installed copy opens at, relative to the deploy root.
   * Mirrors manifest.webmanifest "start_url".
   */
  startUrl: './index.html',
};

export default config;
