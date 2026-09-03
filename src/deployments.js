/**
 * EVERY DEPLOYED VERSION OF THIS PROTOTYPE, so frame 33 can open an earlier one
 * mid-session.
 *
 * This is a research-instrument control, not part of the design under test: a
 * moderator who needs to show a participant what a screen looked like two
 * deployments ago has no other route to it, because a Vercel deployment URL is
 * not discoverable from the running app.
 *
 * THE LIST IS TRANSCRIBED FROM `docs/README.md`'s deployment version log, which
 * is the record of which build a participant saw and is authoritative here. It
 * is NOT queried from Vercel at runtime and the URLs are NOT constructed from a
 * pattern: a deployment URL contains a generated slug (`di1meg30f`) that no rule
 * produces, so a constructed URL would be plausible and wrong, which is the one
 * failure this data cannot have. Rows are in the log's own order, oldest first;
 * the screen reverses them for display.
 *
 * ### `build` is how "current" is derived, and why it is not a separate constant
 *
 * `version` (v1, v2, v3) and the build stamp (v15, v45, v121) are two different
 * sequences: the first counts deployments, the second counts shell-cache builds
 * and moves several times between deployments. So the running code cannot name
 * its own deployment version without being told, and the obvious fix - a
 * `CURRENT_VERSION` constant - would be a second thing to update per merge and
 * therefore a second thing to forget.
 *
 * Instead each row records the build stamp that deployment SHIPPED, read from
 * `src/cache-version.js` at the commit `main` pointed at. `currentDeployment()`
 * matches that against the running `BUILD_VERSION`, which is already bumped on
 * every deploy by an existing rule. One update per merge - the new row - and the
 * match falls out of a value that was going to change anyway.
 *
 * TWO ROWS SHARE A STAMP AND IT CANNOT AFFECT THE LOOKUP. v2 and v3 both ship
 * `v45`: v3's commit bumped `sw.js` to v46 without bumping `cache-version.js`
 * alongside it, which is the paired-edit rule in `docs/README.md` being missed
 * on 28 August 2026. It is recorded as it shipped rather than corrected, because
 * this list says what ran, not what should have. `find()` would resolve a v45
 * build to v2, but no build stamped v45 contains this module - the feature did
 * not exist for another 76 builds - so the ambiguity is unreachable.
 *
 * v1 predates `src/cache-version.js` entirely and has no `BUILD_VERSION` to
 * carry; its `sw.js` stamp is recorded so the row is not silently blank, and it
 * can never match for the same reason.
 */

/**
 * Oldest first, matching `docs/README.md`'s table top to bottom.
 *
 * `date` is the date `main` moved and Vercel deployed - the log's own column,
 * not the commit's author date. It is a `YYYY-MM-DD` stamp read through
 * `formatFullDate`, which parses it as a LOCAL date; a `new Date(...)` on this
 * string would be parsed as UTC and render the previous day west of Greenwich.
 */
export const DEPLOYMENTS = [
  { version: 'v1', date: '2026-08-21', build: 'v15', url: 'https://first-home-deposit-ux-prototype-fmti3zzae-riona-john.vercel.app' },
  { version: 'v2', date: '2026-08-28', build: 'v45', url: 'https://first-home-deposit-ux-prototype-bawbmx7qg-riona-john.vercel.app' },
  { version: 'v3', date: '2026-08-28', build: 'v45', url: 'https://first-home-deposit-ux-prototype-qzbfiocgy-riona-john.vercel.app' },
  { version: 'v4', date: '2026-08-30', build: 'v62', url: 'https://first-home-deposit-ux-prototype-7uto5ow4e-riona-john.vercel.app' },
  { version: 'v5', date: '2026-08-31', build: 'v99', url: 'https://first-home-deposit-ux-prototype-di1meg30f-riona-john.vercel.app' },
  { version: 'v6', date: '2026-09-01', build: 'v120', url: 'https://first-home-deposit-ux-prototype-qz5gnoxco-riona-john.vercel.app' },
  { version: 'v7', date: '2026-09-01', build: 'v121', url: 'https://first-home-deposit-ux-prototype-99qnniq61-riona-john.vercel.app' },
  { version: 'v8', date: '2026-09-03', build: 'v124', url: null },
];

/**
 * The row the running build shipped as, or `null` when nothing matches.
 *
 * `null` is a real state, not a defensive branch: a build served from a local
 * `python -m http.server`, or a deployment whose row has not been written yet,
 * has no entry here. The caller renders every row as a link in that case, which
 * is correct - none of them is the one you are on.
 */
export function currentDeployment(buildVersion) {
  return DEPLOYMENTS.find((entry) => entry.build === buildVersion) ?? null;
}
