# Build specification

Technical spec for the "Your first home" click-through prototype: file structure, interfaces,
router/state design, transition and breakpoint rules, build order, out-of-scope list, and
end-to-end verification. Written after `docs/GAPS.md` closed every open gap in `build-spec.md` and
`DECISIONS.md`. No application code is written as part of producing this document.

Screen inventory: 32 buildable screens from the reference set (33 numbered frames minus frame 07,
excluded per its own "Remove" marking in `build-spec.md`), plus one new screen this session adds
outside the reference set - a terminal stub for the Mortgage-in-Principle adviser-contact request
(`/mip/adviser`, no reference PNG, no Figma node - see `DECISIONS.md` D8/D10 and `GAPS.md` G17b).

## File and folder structure

```
index.html                 - app shell: device-frame wrapper + #app mount point, no status bar element
manifest.webmanifest       - PWA manifest (installable, standalone display)
sw.js                      - service worker, cache-first for shell + assets; CACHE_VERSION constant
                              bumped on every deploy, non-matching caches deleted on activate, version
                              readable by the app (exposed on the settings screen)
src/
  css/
    tokens.css              - HIG-derived tokens: colour, type (-apple-system/SF Pro/Roboto fallback
                               stack), spacing, motion durations/easing, 48px touch target,
                               env(safe-area-inset-*)
    shell.css                - device-frame + the single 768px breakpoint + the scale-to-fit rule
    components.css           - shared UI: cards, buttons, sliders, steppers, accordions, flag rows,
                               warning boxes, milestone tracker, progress bar, review rows
    screens.css               - per-screen-family layout rules
  config.js                  - app identity: display name, short name, description, theme and
                               background colour, start URL. Single source of truth, read by
                               index.html, content.js and app.js. manifest.webmanifest mirrors it
                               (static JSON cannot import a module) and scripts/set-app-name.mjs
                               changes both together; app.js warns on drift in dev. See docs/README.md.
  content.js                 - single content module, all on-screen copy keyed by screen id - the one
                               file to edit for copy changes without touching logic.
                               Includes a `shared.regulatory` block with four fixed keys:
                                 - guidanceNotAdvice
                                 - adviserScope
                                 - mcob3aRepossessionWarning
                                 - estimateDisclosure
                               Wording that screens reference but cannot reword or inline-duplicate,
                               transcribed verbatim from the reference PNGs. `regulatoryAwaitingCheck`
                               is GONE, and with it the only unchecked wording in the file
                               (DECISIONS.md D28): every session has read account activity now, so
                               `guidanceNotAdvice` holds on every screen that carries it and the
                               second line it was written against has nothing to describe. Also
                               includes `shared.dataSource` (where the figures come from and where
                               the permission is changed, frames 03 and 33), the `/mip/adviser` stub
                               copy and the FSCS figure (£120,000 per person per authorised firm).
                               regulatory.js is DELETED (DECISIONS.md D28) - screens read
                               `shared.regulatory.guidanceNotAdvice` directly again
  state.js                   - central store: every Section 6 state variable + provenance tag, frame
                               33 scenario toggles, returnFrame stack, reset()
  router.js                  - route table, push/pop + sheet transition orchestration,
                               prefers-reduced-motion handling
  sheet-drag.js              - drag-to-dismiss on the seven sheets' grabbers; a completed drag
                               closes by clicking the sheet's own dismiss control, so every
                               on-close state change runs exactly as it does on a tap. Shares
                               that control lookup with router.js's Escape key. See DECISIONS.md
                               D18
  model/
    model.js                 - pure calculation functions: deposit-target, loan-amount, ltv,
                               checkpoint-amount, left-over, months-to-target, gap
    rates.js                 - RATES constant + borrow-range central value + LISA cap threshold.
                               See "Maintenance rule" below.
    anchors.js                - single source of truth for the regulatory anchor map (below), as
                               data. See "Mechanical anchor audit" below.
    format.js                 - currency formatter: round to nearest £1, en-GB, £, thousands
                               separator, no pence
  screens/                   - one render module per screen id; registered in router.js's route
                               table; includes the 11 no-frame-drawn fallback variants and the new
                               `/mip/adviser` stub
  components/                 - shared building blocks, introduced only where 2+ screens need the
                               same pattern (no speculative abstraction)
assets/icons/                 - PWA icons, favicon
docs/
  build-spec.md, DECISIONS.md, figma-links.md  - existing spec documents
  GAPS.md, SPEC.md             - this pair
```

## Content and model interfaces

- **`content.js`** exports one object keyed by screen id (`content['09'].headline`, etc.) plus
  `content.shared.regulatory.{guidanceNotAdvice, adviserScope, mcob3aRepossessionWarning,
  estimateDisclosure}`. Screens read from this object; nothing renders a hardcoded string. Wording
  written in this repo rather than transcribed from the reference PNGs is held apart from those four
  fixed keys until it has been copy checked. There is none today: the one such key,
  `regulatoryAwaitingCheck.guidanceNotAdviceNoAccounts`, and the `src/regulatory.js` that selected
  it were both deleted with the account-linking choice (DECISIONS.md D28, GAPS.md G53). The rule
  stands for the next line written in this repo.
- **`state.js`** exports a single mutable store holding the 20 Section 6 state variables (each
  paired with a `provenance` of `read` / `derived` / `estimated` / `entered`, propagating so that
  anything derived from an entered value is itself flagged as containing entered input), the frame
  33 scenario toggles (`theme`, `textSize`, `stage`, `resultOutcome` - `mode` deleted, DECISIONS.md
  D28), a `returnFrame` value
  set before navigating into any sheet/explainer and read on close, and a `reset()` function wired to
  frame 33's "Clear all progress and start again" action.
- **`model.js`** exports pure functions taking state and returning derived figures: `depositTarget`,
  `loanAmount`, `ltv`, `checkpointAmount`, `leftOver`, `monthsToTarget` (and its inverse,
  `monthlyAmountFromDate`), `gap`. The monthly-rate conversion is `(1 + AER)^(1/12) - 1` - the
  effective-monthly conversion of the pinned Bank Rate, not a nominal AER/12 division.
- **`rates.js`** exports `RATES = { bankRate: 0.0375, source, sourceUrl, asAt: '2026-07-30',
  nextReviewDate: '2026-09-17', rangeSpread: 0.10 }`, plus `borrowRangeCentral = 'loan-amount'` and
  `lisaCapPropertyValue = 450000`.

  **Maintenance rule:** any change to a value in this file requires re-running the model tests and
  bumping `sw.js`'s `CACHE_VERSION` in the same commit. The Bank Rate is under Monetary Policy
  Committee review on 17 September 2026; a rate change landed without a cache bump would leave some
  participants served stale cached figures with no visible sign of it.

- **`format.js`** exports a single currency formatter: rounds to the nearest whole £, en-GB locale,
  £ symbol, thousands separator, never shows pence. The model itself always keeps full precision -
  only the formatted display output rounds.

## Regulatory anchor map

Every screen in the flow was checked directly against its reference PNG for these anchors - no row
below is inferred or hedged.

**Frames 04 and 05b no longer exist** (DECISIONS.md D28: the account-linking choice, estimate mode
and general mode were removed on 22 August 2026). Their rows below are left as written, as the
record of what was checked at the time. Read them as history, not as a list of screens to verify:
04's route is gone from `src/router.js` and 05b is no longer a variant of `/position`. Every other
row is live and unchanged - the anchors on the surviving screens were not touched by that removal.

| Anchor | Screens | Note |
|---|---|---|
| Guidance-not-advice line (FCA PERG 4.6) | 02, 03, 03b, 04, 05, 06, 08, 09, 09a, 09b, 10, 10b, 11, 12, 13, 13b, 15, 16, 17, 18, 19, 20, 21, 29, 30, 31, 32, plus the new `/mip/adviser` | The flow's standard footer disclosure - not a narrow "result screen" line. Confirmed absent from 01, 05b (carries `estimateDisclosure` instead), 10c, 19b, 33 |
| Guidance-not-advice line, general-mode variant | 04, 09, 09a, 09b, 10, 10b, 11, 12, 13, 13b, 15, 29, 30, 32 | Same anchor, sourcing clause only. Rendered in place of the line above wherever no account activity was read. NOT YET COPY CHECKED - DECISIONS.md D27, GAPS.md G53 |
| Adviser-scope line (FCA PERG 4.6) | 20, 21, `/mip/adviser` only | Present on 20/21; deliberately absent from 06, 12, 15, 16 - a scope disclosure about a service only those two screens (and the stub) offer |
| MCOB 3A repossession warning | 13, 15, 16, 19, 20, 21 | Every screen discussing mortgage borrowing, LTV, or a lending result |
| DUAA 2025 automated-decision triad (pushback / plain wording / visible sources) | 04, 05, 05b, 06, 08, 09, 09b, 10, 10b, 11, 12, 13, 13b, 15, 16, 20, 21, 32 | The flag row ("something doesn't look right") plus "how we worked this out" links; 32 carries the fullest form via its "If something looks wrong" section. 05b's flag row is a content addition, not present in its reference PNG - see `GAPS.md` G28 |
| Estimate-specific disclosure (`estimateDisclosure`) | 04, 05b, 12, 20, 21 | Shown wherever a figure on screen is a modelled estimate rather than a read/derived one |
| Deposit protection (FSCS, £120,000 per person per authorised firm) | 03 only | Not 06 or 32 - see `GAPS.md` G25 |
| Soft search only | 19, 19b | 19's pre-check copy states it explicitly; 19b is the processing screen |
| Adviser-route obligation (MCOB 4.8A + Consumer Duty consumer support outcome) | 20, 21 → `/mip/adviser` | Not PERG 4.6 - see `DECISIONS.md` D10 |

### Mechanical anchor audit

`src/model/anchors.js` holds this table as data: `{ screenId: [anchorKey, ...] }`. Every screen
module in `src/screens/` exports its own `export const anchors = [...]` naming the same keys the
screen actually carries. A Stage 10 script:

1. Compares each screen's declared `anchors` list against `anchors.js` and flags any mismatch
   (a screen missing a key it should carry, or carrying one it shouldn't).
2. For each declared key, confirms the exact `content.shared.regulatory` wording is present,
   unmodified, in the screen's rendered DOM.

This makes the anchor audit mechanical - run once across all screens - rather than checked by eye.

## Router and state design

- `state.js` holds one flat object: the 20 Section 6 variables with provenance, the frame 33
  toggles, and the `returnFrame` value.
- `router.js` maps every route above - including `/mip/adviser` - to a screen module. Screens are
  pure render functions of `(state, content) → DOM`. No screen imports another screen directly; all
  cross-screen navigation goes through the router.
- Frame 33 mutates `state` directly, re-renders the current route in place, and displays the
  service worker's `CACHE_VERSION`.

## Transition rules

- Push/pop: horizontal slide, outgoing view parallaxes.
- Sheets (03b, 10c, 13b, 29, 30, 31, 32): rise from bottom over a dimmed scrim; dismiss by
  drag-down or scrim tap. The drag is live on the grabber: the card follows the gesture, releases
  past a quarter of its own height (or on a downward flick) to dismiss, and settles back below
  that. Dismissing by drag runs the sheet's own close control, not a bare route change - see
  DECISIONS.md D18 for why that distinction is load-bearing.
- `/mip/adviser` is a push (full screen), consistent with the result screens it's reached from.
- `prefers-reduced-motion`: everything drops to a cross-fade. A sheet still follows a drag -
  that is a response to a gesture, not an animation - but settles and dismisses without motion.
- No iOS-only-gesture-only routes: edge-swipe back, if implemented, is always paired with a visible
  back control.

## Breakpoint and device-frame rules

- `< 768px`: screen fills the viewport, no device frame, no status bar element anywhere.
- `>= 768px`: mobile screen (393×852) sits inside a phone frame, centred on the page.
- **Scale-to-fit:** the framed view (phone screen + bezel) scales down as a unit to fit the viewport
  height, preserving aspect ratio, whenever the viewport is shorter than the frame needs - e.g. a
  1366×768 laptop, the resolution most participants will likely be on over Teams. It never scrolls
  or clips. Scaling only ever reduces size; the frame never scales up past its natural 393×852 size
  on very tall viewports.
- One CSS breakpoint separates frame vs. frameless; scaling above that breakpoint is a continuous
  function of viewport height, not a second breakpoint.

## Build order

Each stage's screens are built, then immediately screenshot-diffed per the verification section
below.

1. **Shell** - `index.html`, manifest, `sw.js` (incl. `CACHE_VERSION` + activate-time cache
   cleanup), `tokens.css`, `shell.css` (incl. scale-to-fit), `router.js` skeleton, `state.js`
   skeleton, `content.js` skeleton including the `shared.regulatory` block, and frame 01 (`/home`) -
   built here rather than in stage 3, to prove the whole stack end-to-end (router → state → content
   → a real rendered screen) before the model or any other screen exists.
2. **Model** - `model.js`, `rates.js`, `anchors.js`, `format.js`. Tests: the compounding round-trip
   inverse (an amount-solved and a date-solved calculation must agree exactly), plus the worked
   examples from `build-spec.md` section 4 as seeded assertions - property-value 190,000 at 10% ⇒
   deposit-target 19,000; checkpoint-amount ⇒ 14,250; frame 21's gap ⇒ 4,400 (deposit-target 19,000
   less saved-toward-deposit 14,600). The round-trip test alone is necessary but not sufficient;
   these fixed examples pin the model to the spec's own numbers.
3. **Entry & consent** - frames 02, 03, 03b, 04 (01 already built in stage 1).
4. **Personalised savings** - frames 05, 05b, 06, 08 (07 excluded).
5. **Deposit calculator** - frames 09, 09a, 09b, 10, 10b, 10c, 11, 12.
6. **Understanding & tracking** - frames 13 (diagram row removed), 13b, 15, 16.
7. **Mortgage in Principle** - frames 17, 18, 19, 19b, 20, 21, and the new `/mip/adviser` stub.
8. **Assumptions & sources** - frames 29, 30, 31, 32 (32's FSCS note removed).
9. **Prototype settings** - frame 33, hidden `/settings` route, manual reset, cache-version display.
10. **Cross-cutting pass** - the 11 no-frame-drawn fallback states; the mechanical regulatory
    anchor audit; PWA install check on iOS and Android; `prefers-reduced-motion` check; breakpoint
    check at both sides of 768px and at 1366×768; final human walkthrough.

## Out of scope

- Frame 07 and the "save for something else" branch.
- Frame 13's diagram row and frames 14, 22–28 (confirmed skipped - except the adviser stub).
- Any real backend, API, authentication, or live account data - all data is static/content-driven.
- Real open-banking connection (the "Connect another bank" row is a dead-end stub), real credit
  check, or lender integration.
- Any framework, bundler, build step, package manager, or TypeScript.
- Analytics/telemetry beyond what the moderated Teams session itself provides.
- Any screen beyond the inventory above (32 reference frames minus frame 07, plus one new adviser
  stub).

## End-to-end verification

**1. Automated, per screen, as it's built.** Render each screen in stages 3–9 at a 390px viewport,
screenshot it, compare against its reference PNG in `reference/frames/`. Fix any difference that
would change what a participant sees or does; log purely cosmetic ones. Every screen is diffed
normally, including 06, 12, 15 and 16 (the adviser-scope line is deliberately absent there - no
addition is made, so nothing exempts them). Exempt, and recorded as intentional deviations rather
than diffs to fix: frame 13 (diagram row removed), frame 32 (FSCS note removed), and frame 05b (DUAA
flag row added). Two further exemptions were added in the 20 August 2026 shell pass: the persistent
bottom navigation bar, on every screen it appears on (`DECISIONS.md` D11, `GAPS.md` G29), and the
closed-on-load state of the disclosures on 05, 05b, 06 and 19 (`DECISIONS.md` D12, `GAPS.md` G30).
A third was added by the icon-set pass: icon rendering, on every screen, since every icon is redrawn
from one canvas at one weight (`DECISIONS.md` D15, `GAPS.md` G34). A fourth covers frame 03's
select-all row only - its count and checkbox state now open at "4 of 5 selected", indeterminate,
where the PNG draws "4 of 4 selected", checked (`GAPS.md` G36) - a fifth covers frame 03's
per-account checkboxes, which the PNG does not draw at all (`DECISIONS.md` D16, `GAPS.md` G37), and
a sixth covers the action bar's visibility and the scroll affordance on the 22 screens whose content
overflows, where the PNGs draw the bar present from the start (`DECISIONS.md` D17, `GAPS.md` G38). A seventh covers the sheet
header on frames 29, 30, 31 and 32 only: the close control is a plain glyph rather than the PNGs' filled circle, and the heading
sits beside it in the header rather than scrolling with the body (`DECISIONS.md` D19, `GAPS.md` G42). An eighth covers **frame 20
only**, where the PNG draws a "Start my Mortgage in Principle" / "Keep saving for now" action bar and two chevroned next-step rows:
the screen is the end of the MIP flow, so it now draws no action bar at all and its first next-step row is a plain row rather than
a control (`DECISIONS.md` D50). A ninth covers **frame 21 only**, and is the same difference for the same reason
(`DECISIONS.md` D52): the PNG draws an "Update my savings goal" / "See what changes this" action bar and three chevroned
next-step rows, and the built screen draws no action bar and makes rows 1 and 2 plain rows, keeping the chevron on row 3
("Talk to someone about it") alone. **Both result screens therefore leave the sixth exemption's set** - neither is a screen whose
action bar's visibility is diffed, because neither has one. A tenth covers **frame 08 only**, where the PNG draws a
"Not now, just track my goal" action bar: the deposit calculator is the only forward route from that screen now, and the route is
the "The calculator asks you two things" card's own button rather than a pinned one (`DECISIONS.md` D53). Frame 08 leaves the
sixth exemption's set for the same reason as 20 and 21. Everything else on it - the card, its button, the flag row and the
guidance-not-advice line - is diffed normally.
In every case the exemption covers that difference only, and everything else on those screens is diffed normally. The new `/mip/adviser` screen has no reference PNG - see step 4.

**2. Regulatory anchor audit - mechanical, not by eye.** Run the Stage 10 script comparing every
screen module's declared `anchors` list against `anchors.js`, and confirming the exact
`content.shared.regulatory` wording for each declared key appears in the rendered DOM.

**3. Scripted human walkthrough:**
- Happy path: start to finish, to the likely-to-be-considered outcome. There is only one path now
  (DECISIONS.md D28); the estimate-mode (05b) and general-mode (04) branches this step used to
  require are deleted, and so is the frame 33 Data control that forced them.
- Not-yet outcome (21) branch.
- Every one of the 11 no-frame-drawn fallback states, forced via frame 33 toggles / crafted input.
- Breakpoint check at both sides of 768px, and explicitly at 1366×768 - confirm the framed view
  scales to fit with no vertical overflow or clipping, and that the page *behind* the frame does not
  scroll at any viewport size (`DECISIONS.md` D14).
- Colour scheme: open the prototype on a device set to dark mode at OS level and confirm it still
  renders light (`DECISIONS.md` D13).
- Collapsible sections: confirm every disclosure is closed on entering its screen, and closed again
  on returning to that screen by the back control (`DECISIONS.md` D12).
- Frame 03 account selection: confirm the select-all row opens at "4 of 5 selected" and announces as
  partially checked; that tapping it reaches 5 of 5 and then 0 of 5; and that `saved-toward-deposit`
  changes with it and again after a 03b move, carrying `entered` provenance once edited
  (`GAPS.md` G36). Confirm each counting account carries its own checkbox and the three that cannot
  be counted carry none; that tapping a checkbox toggles only that account while tapping elsewhere on
  the row still opens 03b (`DECISIONS.md` D16).
- In-place updates hold their place: scroll to the bottom of frames 03, 05, 06 and 19, toggle a
  control, and confirm the screen does not jump to the top and focus stays on the control just
  used (`DECISIONS.md` D16, `GAPS.md` G37).
- Action bar: on an overflowing screen (19), confirm it is hidden on load with the scroll affordance
  showing, appears on reaching the bottom, and hides again on scrolling back up. On a fitting screen
  (17), confirm it is visible on load and stays. Open frame 05's disclosure and confirm the screen
  switches from the fits case to the overflow case, and back on closing it. Then repeat the whole
  check by keyboard only: tab to the bar on an overflowing screen, confirm it reveals, scrolls the
  content to the end, and activates (`DECISIONS.md` D17, `GAPS.md` G38).
- Bottom navigation: confirm the bar is present on every full-screen journey screen and absent from
  the seven sheets, 19b and 33; that its Home tab reaches frame 01 from anywhere; and that from the
  calculator's step flow it opens 10c rather than discarding draft inputs (`DECISIONS.md` D11).
- PWA installability: add-to-home-screen on an actual iOS device and an actual Android device.
- `prefers-reduced-motion` at the OS level, confirming cross-fade replaces all slide/rise motion.
- `/settings` reachable only by typing the URL - confirmed absent from every visible nav element.
- The service worker serves the current `CACHE_VERSION` after a fresh deploy, with no stale cache
  from a prior session (open the app, deploy a change, reopen, confirm the new version loads).

**4. `/mip/adviser` - its own verification step** (new screen, no reference PNG to diff against):
reachable from both 20 and 21's "Talk to someone about it" row; displays the guidance-not-advice
line from `content.shared.regulatory`; has a working back route to the result screen it was opened
from; contains no form fields and no booking calendar.
