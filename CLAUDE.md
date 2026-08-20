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

## Commands
- Serve: `python -m http.server 8080` on Windows (ES modules need a server, not file://)
- Test the model: `node --test src/model/`

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