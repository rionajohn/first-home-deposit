# Your first home — repo guide

Mid-fidelity click-through prototype for MSc usability testing. Not production code.

This file covers repo-level operations: the three names in play, how to rename each, and the
maintenance rules that catch the mistakes those renames tend to cause. For the build itself see
`build-spec.md` (authoritative for navigation, state, routes and variables), `SPEC.md` (technical
structure), `DECISIONS.md` (authoritative where the spec is silent) and `GAPS.md`.

## The three names

They are three different things with three different lifecycles. Changing one does not change,
and must not change, the others.

| # | Name | Current value | Where it lives | Seen by a participant? |
|---|---|---|---|---|
| 1 | Repo / folder | `first-home-deposit` | GitHub remote + the folder on disk | No |
| 2 | Vercel project | `first-home-deposit-ux-prototype` | The Vercel dashboard, **not** the repo | **Yes — it is the URL they type** |
| 3 | App display name | see the line below | `src/config.js` | Yes — title, icon label, app bar |

<!-- app-display-name --> Current display name: **Your first home** (short name: **First home**)

The line above is rewritten by `scripts/set-app-name.mjs`. Leave the HTML comment marker in place.

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
names it for orientation — update that line if you rename.

## 2. Renaming the Vercel project

**This changes the URL participants type.** Do not do it mid-study.

It is changed in the Vercel dashboard, not in the repo: **Project → Settings → General → Project
Name**. The production URL becomes `https://<new-project-name>.vercel.app`.

`.vercel/project.json` holds the `projectName` locally, but it is gitignored and is refreshed by
the Vercel CLI — do not hand-edit it to perform a rename.

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
   `NODE_ENV` — the hostname is the only development signal available. It never runs on the
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
manifest, PWA install breaks *silently* — the app still runs, and nothing surfaces the fault until
someone tries to add it to a home screen.

This is separate from the existing rule that `CACHE_VERSION` is bumped on every deploy and in the
same commit as any change to a value in `src/model/rates.js`. Adding a new module or icon to
`SHELL_ASSETS` counts as a path change.

Keep `src/cache-version.js`'s `BUILD_VERSION` in step with `sw.js` — a paired hand-edit,
by design; see that file's comment for why the two cannot be derived from one another.

A display-name rename on its own does **not** need a bump: no path changes.

### Colours

`themeColour` and `backgroundColour` in `src/config.js` are the OS-chrome equivalents of
`--color-label` and `--color-bg` in `src/css/tokens.css`. If you change one, change the other —
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

1. Commit and push everything on `build` first, and confirm `git status` is clean.
2. `git checkout main`, then `git merge build`.
3. Tag before pushing. Every build a participant sees gets a tag, so the session can be traced to
   a commit.
4. `git push origin main --tags`.
5. `git checkout build` to carry on working. **Do not leave the working copy on `main`** — the next
   session will otherwise commit to it without noticing.

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
