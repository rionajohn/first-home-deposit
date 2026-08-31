# Your first home - prototype

Mid-fidelity click-through prototype for MSc usability testing. Not production code.

Three names are in play and they are NOT interchangeable. Keep them distinct:
- **Repo and folder**: `first-home-deposit`. Git and disk only, never user-facing.
- **Vercel project**: `first-home-deposit-ux-prototype`. This is the URL participants type. It
  lives in the Vercel dashboard, not in this repo. Changing it changes that URL.
- **App display name**: "Your first home". On screen, in the browser title and on the home-screen
  icon, and in Figma. This does not change - Figma frame names are the system of record for
  `docs/build-spec.md`, and renaming the feature would break the spec-to-code mapping.

The display name lives in `src/config.js` alone; `index.html`, `content.js` and the screens read it
from there. See `docs/README.md` for how to rename any of the three.

### STANDING CONSTRAINTS for this repo. These apply to every change.

This is a mid-fidelity research prototype used as an instrument in moderated
think-aloud usability testing. Fidelity of interaction matters more than
production code quality. Do not add libraries, do not refactor architecture,
do not introduce a state management library.

## Design rules
- No Source badges. Use provenance captions instead.
- Bars measure quantities, not journeys. A horizontal track may show a figure against a goal the
  participant set (`.progress-bar`, frames 15/16) or one amount as a share of another
  (`.proportion-row`, frames 05/06). It must never show progress through the app's own process, a
  form, or the journey. See DESIGN.md and DECISIONS.md D36.
- A divided bar needs a label or legend naming each part. Colour ranks the parts; it never
  identifies them.
- Icons must be real vectors, never emoji or images of icons.
- All text must fit via auto layout. Nothing truncates or overflows.
- A row is either editable or explanatory, never both.
- Any correction applies everywhere the same pattern appears, not just the
  screen named in the prompt.

## State rules
- **Screen-local draft state never writes to a section 6 figure.** A field being
  edited, cleared or half-typed is the screen's own state and belongs in its own
  key (`propertyValueCleared`, `targetMonth`). A figure is written when the
  participant commits it, which on every calculator screen means Continue.
- A screen may only display a figure derived from a key its own guard tested. If
  a guard passes on stored keys, the screen must not re-derive that figure live
  from something the guard never checked - the two will eventually disagree.
- Breaking either rule leaves the store holding a state no screen expects, and
  `formatCurrency(null)` renders it as £0 rather than failing. See DECISIONS.md
  D46 and D38's third amendment; both were this same defect.

## Content rules:
- All figures stay anchored to the Bank of England Bank Rate as already set in
  the codebase. Do not invent or change financial figures.
- Copy must stay within FCA guidance-versus-advice boundaries. Do not
  introduce language that recommends a course of action to the user.
- British English throughout. No em dashes, use hyphens.

## Working rules
- Check git status before starting. If the tree is not clean, stop and report
  what is there rather than editing over it - once two changes interleave in
  one file they cannot be committed separately.
- End every session with a commit. Leave nothing staged, uncommitted or
  half-applied for the next session to inherit. If it cannot be committed,
  stop and say why rather than leaving it in the tree.
- Do not change behaviour outside the scope stated in the prompt.
- Preserve existing dark mode support in anything you touch.
- Update docs/DECISIONS.md with a dated entry for any design decision you make.
- Before adding a decision entry, read the last number in docs/DECISIONS.md and take the next one.
- Every merge from `build` to `main` adds a row to the deployment version log in `docs/README.md`
  in the same operation, before the push. The row is written as part of the merge, never
  retrospectively - a deployment that is recorded later is a deployment nobody can attribute a
  session to in the meantime.
- The deployment reason is written by Riona and supplied with the merge request. If no reason has
  been supplied, stop and ask for one. Do not merge with an invented or inferred description, and
  do not summarise the commit log into one.
- A merge touching only documentation or governance files, with no change to prototype code or
  copy, does not take a version number. Version numbers denote states of the prototype that a
  participant could have seen.

## Commands
- Serve: `python -m http.server 8080` on Windows (ES modules need a server, not file://)
- Test the model: `node --test src/model/*.test.js` (the bare directory form fails on Node 24)
- Test the sheet gesture: `node --test scripts/sheet-drag.test.mjs` (drives Chromium via Playwright)
- Smoke test every route: `node --test scripts/smoke.test.mjs` (drives Chromium; reads the route list
  from `router.js` so a new route is covered as soon as it is registered. Asserts only that each
  screen mounts, renders something into `#app`, and raises no error - nothing about content. It
  exists because three temporal-dead-zone defects blanked a screen while the whole suite passed;
  `overlap.test.mjs` passes 72/72 against a completely blank tracker, which was verified rather than
  assumed. ~29s. **Run this first when a screen "does not render".**)
- Test the growth chart's ranges: `node --test scripts/chart-range.test.mjs` (drives Chromium;
  frame 12 at savings positions near, at and past the goal, plus the 6 mo chip. Asserts SHAPE - bars
  distinct and rising, x-axis labels distinct, the live region never announcing less than the
  participant has saved - rather than figures, so it survives a re-scale. Every one of these states
  rendered cleanly, so the smoke test passed on all of them: a chart can be wrong in every particular
  and still be a chart. ~14s. D73's third amendment.)
- Test screen layout: `node --test scripts/overlap.test.mjs` (all 37 frame rows x both text sizes; two of them, `/assumptions/costs` and `/learn/stamp-duty`, have no frame number of their own - GAPS.md G83 and G84; asserts no divider, border or rule crosses text and no box is squashed below its content)
- Test frame 10b's floor, cap, listbox and readout: `node --test scripts/date-ceiling.test.mjs` (drives
  Chromium; the date lists' floor at the earliest reachable date, the custom listbox that offers them,
  and the monthly amount they solve. Asserts SHAPE, every expected value derived from `model.js` at run
  time rather than written in the file, so it follows a re-seeded fixture instead of breaking on one:
  the floor is the list's first entry and NOT the selection, no offered year/month pair is below it,
  changing the year re-derives the month list, a date the floor has moved past is moved to it and
  disclosed, and the solved figure is rendered and matches the model. Its last eleven are D84's listbox
  contract - roles, `aria-activedescendant`, keyboard, focus return - read off the same attributes a
  screen reader reads. D85 adds the cap at the month the balance reaches the goal unaided - no offered
  pair solves negative, and the goal-already-met state draws no control at all. ~47s. D85; closes
  GAPS.md G64, G65, G96's frame 10b case and the reachable half of G98.)
- Test the skip-ahead control: `node --test scripts/skip-ahead.test.mjs` (pure Node, no browser; asserts three round trips leave state identical and that the threshold stays a ratio of CHECKPOINT_FRACTION rather than an amount)
- Test the draft invariant: `node --test scripts/g62.test.mjs` (pure Node, no browser; asserts that abandoning a draft changes no committed key, and that `gapToCheckpoint()` reads the stored checkpoint rather than re-deriving it)
- Test stale-session discard: `node --test scripts/stale-session.test.mjs` (drives Chromium; asserts a
  session stamped with another build - or unstamped - is discarded whole rather than merged, that a
  same-stamp session restores untouched, and that a typed calculator value survives a reload and a
  back navigation. D59. Also owns frame 10b's typed target year: its attribute contract, its
  persistence across a reload and a back navigation, that an empty field writes no committed key, and
  that the solved `savings-rate` matches the model over the same months. D61)
- Test the journey stage control: `node --test scripts/stage.test.mjs` (pure Node, no browser; asserts each stage is idempotent in both directions, that ready-to-check is the saving stage with `skipAheadPatch()` applied rather than a second goal, and that no derived figure is written by hand)
- Test the action bar: `node --test scripts/action-bar.test.mjs` (D39's pinned bar; 20 screens x 4 viewports plus 7 sheets, asserting the bar is visible and hittable without scrolling, flush above the tab bar, and clear of the last content element when scrolled to the end)
- Test the tab bar: `node --test scripts/bottom-nav.test.mjs` (D11's three states; asserts an enabled-but-not-current tab resolves to the same colour, weight, icon variant and indicator as a disabled one)
- Test the frame's rendered scale: `node --test scripts/frame-scale.test.mjs` (drives Chromium; D92's
  fixed logical viewport and scaled frame at 1280x720 and 2560x1440. Asserts the CONTRACT, not the
  appearance: `.screen` measures `--frame-width` x `--frame-height` in LAYOUT pixels at both, what is
  drawn is that box times the scale, and the layout fingerprint of every element inside the frame is
  identical between the two window sizes across three screens - which is the property that keeps
  findings comparable between sessions and the one thing a screenshot cannot show. Also the bounds
  (never below 1, never above the cap), that a short window scrolls rather than shrinking, frame 10b's
  overlay listbox anchoring and its height clamp measured in layout pixels, focus rings, and the
  debounced recompute on resize. ~17s. **Run this after anything touching `shell.css`, `#app-frame` or
  `.device-bezel`.**)
- Screenshots: `node scripts/shots.mjs` (see the file header for the options; `--routes`, `--entry`, `--state`, `--theme`, `--width`, `--focus`, `--saved`). **Screenshots come from `scripts/shots.mjs`, never from a harness generated inline.** Extend the script if it cannot do what a pass needs; do not rebuild one in a heredoc. Output goes to the gitignored `.screenshots/`, with a contact sheet beside the PNGs.
- Seed state for every browser-driven script lives in `scripts/session-seed.mjs`. One copy, imported by `shots.mjs`, `overlap.test.mjs`, `action-bar.test.mjs` and `inset-shots.mjs`. A key that selects one script's variant belongs in that script's own overrides, not in the shared seed.

## Stack rules
- Vanilla HTML, CSS and ES modules. No framework, no bundler, no build step.
- No runtime npm dependencies. Dev dependencies for screenshots and tests only.
- One `content.js` holds every user-facing string. Screens read from it and never inline copy.
  Its one exception: the app display name comes from `src/config.js`.
- One `model/` holds every calculation. Screens never compute a figure inline.
- Rates live in `model/rates.js` as dated constants. Never fetch a rate at runtime.
- Figures render through `format.js`. en-GB, £, no pence unless the spec shows pence.

## Design language
Apple Human Interface Guidelines for styling and motion. Not Material 3. Android is handled as a
constraint set, not a second design language - see docs/DECISIONS.md.

## Source of truth
- `docs/build-spec.md` is authoritative for navigation, state, routes, derived figures and variables.
- `docs/DECISIONS.md` is authoritative where the spec is silent.
- Figma frame names are the system of record. Use the exact `build-spec.md` variable names in code.
- Reference screenshots in `reference/frames/`. Figma page links in `docs/figma-links.md`.
- `docs/README.md` covers repo-level operations: the three names, renaming, and the
  `CACHE_VERSION` rules.

## IMPORTANT
- Never invent a figure, a rule or a screen. If the spec is silent or says "Confirm", "Gap" or
  "No frame drawn", add it to `docs/GAPS.md` and ask. Do not guess.
- The regulatory lines in `content.js` under `shared.regulatory` are fixed wording. Do not reword,
  shorten or remove them, or remove them from a screen that carries them.
- Provenance (`read`, `derived`, `estimated`, `entered`) updates whenever a figure is edited.