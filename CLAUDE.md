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
- No linear progress bars.
- No segmented bars for proportions.
- Icons must be real vectors, never emoji or images of icons.
- All text must fit via auto layout. Nothing truncates or overflows.
- A row is either editable or explanatory, never both.
- Any correction applies everywhere the same pattern appears, not just the
  screen named in the prompt.

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

## Commands
- Serve: `python -m http.server 8080` on Windows (ES modules need a server, not file://)
- Test the model: `node --test src/model/*.test.js` (the bare directory form fails on Node 24)
- Test the sheet gesture: `node --test scripts/sheet-drag.test.mjs` (drives Chromium via Playwright)
- Test screen layout: `node --test scripts/overlap.test.mjs` (all 33 frame rows x both text sizes; asserts no divider, border or rule crosses text and no box is squashed below its content)
- Test the skip-ahead control: `node --test scripts/skip-ahead.test.mjs` (pure Node, no browser; asserts three round trips leave state identical and that the threshold stays a ratio of CHECKPOINT_FRACTION rather than an amount)
- Test the tab bar: `node --test scripts/bottom-nav.test.mjs` (D11's three states; asserts an enabled-but-not-current tab resolves to the same colour, weight, icon variant and indicator as a disabled one)

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