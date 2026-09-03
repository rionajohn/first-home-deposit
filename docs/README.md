# Your first home - repo guide

Mid-fidelity click-through prototype for MSc usability testing. Not production code.

This file covers repo-level operations: the three names in play, the log of what has been
deployed to participants, how to rename each name, and the maintenance rules that catch the
mistakes those renames tend to cause. For the build itself see
`build-spec.md` (authoritative for navigation, state, routes and variables), `SPEC.md` (technical
structure), `DECISIONS.md` (authoritative where the spec is silent) and `GAPS.md`.

## The three names

They are three different things with three different lifecycles. Changing one does not change,
and must not change, the others.

| # | Name | Current value | Where it lives | Seen by a participant? |
|---|---|---|---|---|
| 1 | Repo / folder | `first-home-deposit` | GitHub remote + the folder on disk | No |
| 2 | Vercel project | `first-home-deposit-ux-prototype` | The Vercel dashboard, **not** the repo | **Yes - it is the URL they type** |
| 3 | App display name | see the line below | `src/config.js` | Yes - title, icon label, app bar |

<!-- app-display-name --> Current display name: **Your first home** (short name: **First home**)

The line above is rewritten by `scripts/set-app-name.mjs`. Leave the HTML comment marker in place.

---

## Deployment version log

Every merge from `build` to `main` produces a new production deployment, and a participant session
can only be reported against the build it actually ran on. This table is that record: it is the
answer to "which version did this participant see".

A row is added **with the merge, before the push**, never afterwards. The deployment reason is
written by Riona and supplied with the merge request; a merge that arrives without one stops and
asks rather than inventing a description. Merges touching only documentation or governance files
take no version number, because a version denotes a state of the prototype a participant could
have seen.

| Version | Date | Commit | Deployment reason | Vercel Link |
|---|---|---|---|---|
| v1 | 2026-08-21 | `7f0f4cc` | Based on what was in the Figma screens (linked to a specific stated flow) | first-home-deposit-ux-prototype-fmti3zzae-riona-john.vercel.app |
| v2 | 2026-08-28 | `ce2b482` | Adding insight pages to add Mortgage in Principle flow | first-home-deposit-ux-prototype-bawbmx7qg-riona-john.vercel.app |
| v3 | 2026-08-28 | `394565a` | Seed the opening session at £650,000 so it meets the Lifetime ISA cap | first-home-deposit-ux-prototype-qzbfiocgy-riona-john.vercel.app |
| v4 | 2026-08-30 | `4a627bc` | Going through usability testing protocol to see what fixes were needed | first-home-deposit-ux-prototype-7uto5ow4e-riona-john.vercel.app |
| v5 | 2026-08-31 | `3b11d8f` | Allowing the deposit goal to take in extra costs such as stamp duty, and allowing the deposit result page to be clearer rather than showing a range based on the deposit percentage saved towards | first-home-deposit-ux-prototype-di1meg30f-riona-john.vercel.app |
| v6 | 2026-09-01 | `2fb6667` | Pilot feedback changes: Scaling in different screens when on desktop, copy on the screen where a participant will decide how to save for their deposit, and the results for the deposit page - improving the chart to show a better comparison over the years | first-home-deposit-ux-prototype-qz5gnoxco-riona-john.vercel.app |
| v7 | 2026-09-01 | `c92e064` | Reserve the browser toolbar's space so the tab bar stays reachable on iPhone Safari during phone-based usability sessions | first-home-deposit-ux-prototype-99qnniq61-riona-john.vercel.app |
| v8 | 2026-09-03 | `6ae4259` | The deposit breakdown now lists only the accounts its total counts, on both the results card and the sources sheet, and the accounts screen no longer contradicts the participant's own selection | first-home-deposit-ux-prototype-gwr476cgw-riona-john.vercel.app |
| v9 | 2026-09-03 | `b4353d9` | Clicking an account row on frame 03 no longer scrolls the device screen inside the bezel. The checkbox input's containing block was resolving to #app.screen, stranding the focus target outside the scroller and giving Blink a 141px scroll it could not recover, which opened an empty band under the tab bar and clipped the app bar. Affected Chrome and Edge only, so this removes a device-dependent difference in what participants saw. Carries D144 and D145. | pending |

A production deployment that changes only documentation or governance files carries no
version number, so Vercel's deployment history holds more deployments than this table holds
rows. The most recent numbered version remains the current state of the prototype.

**Commit** names the last content commit of the version. A commit cannot contain its own SHA, so
from v6 on it is not the commit `main` ended up pointing at; for v1 to v5, merged before this log
existed, the two coincide.

**The gap between the two is not fixed, and must never be counted.** It has been 0 (v1-v5), 1 (v6,
v8) and 2 (v7), because it depends on what else was on `build` at the time. The deployed commit is
read with `git rev-parse --short main` at merge time and written straight into the cell - see the
deploy procedure below. An earlier version of this note said the log row "sits one commit above"
the cell, which was true of the merges that existed when it was written and was never a rule.

See `DECISIONS.md` D91 for the convention, D138 for the renumbering that moved the v1-v5 boundary
when `394565a` took v3, and **D144** for the correction to the offset and for capturing the
deployment URL with the merge.

### Where these dates and commits come from

`main` has a linear history and every merge so far was a fast-forward, so none of them exists as a
merge commit and the graph alone cannot date a deployment. The seven moves were read from
`git reflog show main`, which covers the branch from its initial commit on 19 August 2026 and is
therefore complete rather than truncated. Six of the seven carried a change to prototype code and
all six now have a deployment reason. The seventh, `7825bd9` on 31 August 2026, changed only this
file and so takes no version number. v1 is independently corroborated by the `v1.0` tag,
"Build for pilot session", which points at `7f0f4cc`. Dates are the dates `main` moved, which is
when Vercel deployed, not the dates the commits were authored.

The initial commit `e9da66d` (19 August 2026) takes no version number. It holds `build-spec.md`,
the Figma file and `.gitignore.txt`, and no prototype code at all, so there was nothing a
participant could have seen.

---

## 1. Renaming the repo and folder

Never user-facing. Safe to change at any time.

```bash
# Rename on GitHub, from inside the repo
gh repo rename <new-repo-name>

# gh updates the 'origin' remote for you. Confirm:
git remote -v

# Then rename the local folder to match (close your editor first on Windows)
cd ..
mv first-home-deposit <new-repo-name>
```

Nothing in the tracked source refers to the repo name, so no code change is needed. `CLAUDE.md`
names it for orientation - update that line if you rename.

## 2. Renaming the Vercel project

**This changes the URL participants type.** Do not do it mid-study.

It is changed in the Vercel dashboard, not in the repo: **Project → Settings → General → Project
Name**. The production URL becomes `https://<new-project-name>.vercel.app`.

`.vercel/project.json` holds the `projectName` locally, but it is gitignored and is refreshed by
the Vercel CLI - do not hand-edit it to perform a rename.

If a rename is unavoidable once participants have the old URL, add a redirect or reserve the old
name as a domain alias, and re-check any URL printed on a participant-facing sheet.

## 3. Renaming the app display name

One command:

```bash
node scripts/set-app-name.mjs "<new display name>"

# with a new home-screen label too (roughly 12 characters before truncation)
node scripts/set-app-name.mjs "<new display name>" --short "<new short name>"

# preview without writing
node scripts/set-app-name.mjs "<new display name>" --dry-run
```

That updates `src/config.js`, `manifest.webmanifest` and this file together, and writes nothing
unless all three succeed.

### Why a script rather than one import

`src/config.js` is the single source of truth: `index.html`, `src/content.js` and `src/app.js` all
read the name from it, and nothing else hardcodes it. But `manifest.webmanifest` is static JSON and
cannot import a module, so it is the one place the name is necessarily written twice. Two defences:

1. **The script** changes both in one command.
2. **A dev-only drift check** in `src/app.js` fetches the manifest on start and logs a console
   warning if any identity field disagrees with `config.js`. It is gated on hostname
   (`localhost`, `127.0.0.1`, `::1`, `*.local`) because this prototype has no build step and no
   `NODE_ENV` - the hostname is the only development signal available. It never runs on the
   deployed URL.

### What the script does not touch, on purpose

- **`docs/build-spec.md`.** Figma frame names are the system of record. Renaming the feature there
  would break the spec-to-code mapping.
- **Prose in `src/content.js`.** The words "your first home" appear inside sentences (the `/home`
  entry card, the `/journey` headline). Those are English, not the product name, and substituting
  a variable would break the sentence. Rewrite by hand if the name ever changes.
- **`CACHE_VERSION` in `sw.js`.** See below.

---

## Maintenance rules

### Shell-asset paths and `CACHE_VERSION`

**Any change to a path in `sw.js`'s `SHELL_ASSETS` requires a `CACHE_VERSION` bump in the same
commit.** An installed copy is served cache-first, so a renamed or moved shell asset that ships
without a bump leaves the old path cached and the new one unfetched. When that asset is the
manifest, PWA install breaks *silently* - the app still runs, and nothing surfaces the fault until
someone tries to add it to a home screen.

This is separate from the existing rule that `CACHE_VERSION` is bumped on every deploy and in the
same commit as any change to a value in `src/model/rates.js`. Adding a new module or icon to
`SHELL_ASSETS` counts as a path change.

Keep `src/cache-version.js`'s `BUILD_VERSION` in step with `sw.js` - a paired hand-edit,
by design; see that file's comment for why the two cannot be derived from one another.

**A version number covers ONE state of `SHELL_ASSETS`, not one working session.** If the list changes
again after a build has been served under the current version - including a path being *removed*
again, and including a build served only from a local `python -m http.server` - bump again. It is not
enough that the version differs from the last commit; it has to differ from every build a browser
may already be holding.

This is written down because it happened, on 28 August 2026. `v41` was set in the same edit that
added `./src/run-check.js` to `SHELL_ASSETS`; that build was served locally; the module was then
removed in the same session and the version left at `v41`. **Two different shells were served under
one version number.** `sw.js` serves the shell cache-first with no revalidation and its `activate`
deletes only caches whose name differs from the current one, so the first `v41` shell was never
evicted and kept being served in full - old modules, old copy, old screen. Frame 33's build caption
could not surface it either: both builds honestly reported `v41`, which is a different failure from
the one D49 fixed and is not caught by anything the caption can do. The fix was `v42`; the rule is
above.

A display-name rename on its own does **not** need a bump: no path changes.

### Colours

`themeColour` and `backgroundColour` in `src/config.js` are the OS-chrome equivalents of
`--color-label` and `--color-bg` in `src/css/tokens.css`. If you change one, change the other -
a mismatch shows as a visible seam around the status bar on an installed copy.

---

## Merging and deploying

### Branches

Two branches. `build` is where all work happens. `main` is what participants see, and nothing is
committed to it directly.

Check which branch you are on before starting a session:

```bash
git branch --show-current
```

Switch to `build`:

```bash
git checkout build
```

If `build` does not exist locally on a machine that has only ever seen `main`:

```bash
git checkout -b build origin/build
```

Anything committed to `main` by accident should be moved to `build` rather than left there, since
`main` is meant to be a record of what has been deployed to participants.

### Deploying a build

1. Get the deployment reason from Riona. Without one, stop here and ask. Do not infer it from
   the commits.
2. Add the row to the deployment version log above, on `build`: version, date and reason. **Leave
   the Commit and Vercel Link cells empty** - neither value exists yet. Commit.
3. Confirm `git status` is clean, then push `build`.
4. `git checkout main`, then `git merge build`.
5. Record the deployed commit:

   ```bash
   git rev-parse --short main
   ```

   This is the commit `main` points at after the merge, read directly. **Never count it back from
   the Commit cell.** The offset between the two is not fixed - it has been 0, 1 and 2 across the
   versions logged so far, because it depends on what happened to be on `build` that day. See
   `DECISIONS.md` D144.
6. Fill the row's Commit cell with that value, on `build`, and merge it forward.
7. Tag. Every build a participant sees gets a tag, so the session can be traced to a commit.
8. `git push origin main --tags`.
9. Wait for Vercel to finish, then look up the deployment URL:

   ```bash
   vercel ls -m githubCommitSha=$(git rev-parse main)
   ```

   Take the **production** deployment.

   - The filter needs the **full 40-character SHA**, which is why this is `git rev-parse` and not
     `--short`. A 7-character prefix matches nothing.
   - An all-zero SHA is **coerced to empty and returns every deployment** rather than none. So a
     query that comes back with the full list has had its filter dropped - that is not a result,
     and taking a row from it would record someone else's deployment.
   - Nothing returned means the build has not finished, or has failed. **Wait and retry rather
     than substituting a nearby deployment.**
   - More than one production deployment for the same SHA: stop and report.

   This query returns nothing while the Vercel project has no connected Git repository, because
   CLI deployments carry no `githubCommitSha`. Until that is connected, read the URL from the
   `vercel deploy` output instead.
10. Fill the row's Vercel Link cell, on `build`, and commit. **Documentation only - no
    `CACHE_VERSION` bump**, since nothing a participant sees has changed.
11. `git checkout build` to carry on working. **Do not leave the working copy on `main`** - the next
    session will otherwise commit to it without noticing.

Steps 2 and 10 are two commits because the deployment does not exist until after the push. **They
belong to the same deployment and both are written in the same session.** A row left with an empty
Vercel Link cell is an incomplete merge, not a task for next time.

Vercel deploys `main` automatically. The production URL is `first-home-feature.vercel.app` and a
static build takes under a minute.

### Before a session, check two things

- **Open the production URL on a real phone, not a desktop browser.** `env(safe-area-inset-*)`
  resolves to zero on desktop, so the framed view only ever tests the fallback values. The
  safe-area handling on sheets and the bottom nav is untested until a notched device loads it.
- **Check the build version shown on `#/settings` matches the deploy you just made.** The service
  worker may serve a cached shell from an earlier visit, and the version display exists to make
  that visible.

---

## Commands

```bash
python -m http.server 8080               # serve (ES modules need a server, not file://)
node --test src/model/                   # test the model
node --test scripts/sheet-drag.test.mjs  # sheet drag-to-dismiss, in a real browser (Playwright)
node --test scripts/overlap.test.mjs     # no rule crosses text on any of the 32 frames, both text sizes
```
