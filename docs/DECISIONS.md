# Design and calculation decisions

Authoritative where `build-spec.md` is silent. Where the two conflict, `build-spec.md` wins on navigation, state, routes and variable names; this file wins on visual language, rate sources and range rules.

Each decision records what was decided, why, and what it would take to reverse it. Open questions sit at the end and must be closed before the prototype goes in front of a participant.

Last updated: 20 August 2026

---

## D1. Apple Human Interface Guidelines throughout

**Decision.** Apple HIG governs both visual styling and motion. Material 3 is not used.

**Why.** The wireframes are mid-fidelity and platform-neutral, so a design language had to be chosen at the build stage rather than inherited. One language is used rather than two because mixing conventions introduces a confound: if a participant hesitates over a control, it would not be possible to separate a design problem from a platform mismatch.

**Android compatibility is handled as a constraint set, not a second design language:**

| Constraint | Rule |
|---|---|
| Status bar | No status bar element anywhere in the markup or CSS |
| Font | `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, Roboto, sans-serif`. SF Pro is absent on Android and the fallback must not shift layout |
| Touch target | Minimum 48px in both dimensions. Satisfies the HIG minimum of 44pt and Android's 48dp, so nothing changes per platform |
| Interaction | No iOS-only interaction without an equivalent. Edge-swipe back may be an enhancement, never the only route back |
| Safe areas | `env(safe-area-inset-*)`, honoured by both platforms |

**Motion.** Push and pop slide horizontally with the outgoing view parallaxing. Sheets rise from the bottom over a dimmed scrim and dismiss by drag-down or scrim tap. Durations and easing from the HIG motion guidance. `prefers-reduced-motion` drops everything to a cross-fade.

**To reverse.** Rewrite `src/css/tokens.css` and the transition rules in `src/router.js`. Screens themselves should not need changing if they use tokens rather than raw values.

**For the write-up.** This is a design decision made at the build stage, not something the wireframes dictated. It needs stating and justifying in the methodology chapter.

---

## D2. Range figures are the central value plus or minus 10%

**Decision.** Every low and high pair is the central value at 0.9 and 1.1.

| Figure | Central value | Low | High |
|---|---|---|---|
| `borrow-low` / `borrow-high` | `loan-amount` | 0.9 x central | 1.1 x central |
| `max-property` | - | - | `borrow-high` + `saved-toward-deposit` |
| `monthly-low` / `monthly-high` | `savings-rate` | 0.9 x central | 1.1 x central |
| `on-track-for` | `months-to-target` | 0.9 x central, rounded up to a whole month | 1.1 x central, rounded up to a whole month |

**Why.** `build-spec.md` section 4 states that `on-track-for` is a range but never defines its width, and gives no rule at all for `borrow-low` and `borrow-high`, which frames 20 and 21 depend on. A single symmetric band keeps every range traceable to one stated rule rather than three unrelated ones.

**Invariants.** Low is always below high. Both bracket the central value. Asserted in `model.test.js`.

**To reverse.** One constant in `src/model/rates.js`.

**Confirmed 19 August 2026.** `loan-amount` is the central value for `borrow-low`/`borrow-high`, matching the table above. Confirmed against the alternative salary-based reading; kept because it stays consistent with how `max-property` is already derived (`borrow-high` + `saved-toward-deposit`) — decoupling the MIP result from the deposit-calculator's loan-amount would break that chain.

---

## D3. Interest comes from the Bank of England Bank Rate, pinned not fetched

**Decision.** `savingsAer = bankRate = 3.75%`, held as a dated constant. Nothing fetches a rate at runtime.

**Source.** Bank of England Bank Rate, held at 3.75% on 30 July 2026. Next Monetary Policy Committee decision due 17 September 2026.
https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate

**Why pinned rather than live.** Two reasons. The prototype is offline-capable, so a runtime fetch would fail during a session. More importantly it is a research instrument: the next MPC decision falls on 17 September 2026, between testing sessions and submission. A live rate would mean participants tested either side of that date see different figures, and the screenshots in the dissertation stop matching the running build. That is a confound with no research benefit.

**Why Bank Rate rather than a product AER.** Bank Rate is what the Bank pays commercial banks, not what a savings account pays a customer, so using it directly is a simplification. It is used as a declared proxy because it keeps every figure on screen traceable to one named public source, which is the provenance principle running through the rest of the feature. Frames 29 and 30 state in plain words that growth is modelled on the Bank of England Bank Rate as at 30 July 2026.

This replaces the 4.1% AER that appears in `build-spec.md` section 4. That figure implied a real savings product with no stated source.

**Implementation.** `src/model/rates.js`:

```js
export const RATES = {
  bankRate: 0.0375,
  source: 'Bank of England Bank Rate',
  sourceUrl: 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate',
  asAt: '2026-07-30',
  nextReviewDate: '2026-09-17',
  rangeSpread: 0.10,
};
```

Frames 29 and 30 read `source` and `asAt` from this object rather than repeating them as copy, so the date on screen cannot drift from the rate in the model.

**To reverse.** Change `bankRate` and `asAt` together, re-run the model tests, and tag a new build. Never change one without the other.

---

## D4. Compounding convention

**Decision.** Monthly rate is `(1 + AER)^(1/12) - 1`.

**Why.** This is what AER means: the annual equivalent of monthly compounding. `AER / 12` is a nominal rate and would overstate growth over a five-year horizon.

Contributions are paid at the start of each month, per `build-spec.md` section 4. Solving in either direction, months from a monthly amount or a monthly amount from a target date, must be exact inverses. Asserted by a round-trip test.

**To reverse.** One function in `src/model/model.js`, with the derivation commented above it.

---

## D5. Rate and figure provenance

**Decision.** Every figure carries one of `read`, `derived`, `estimated` or `entered`, per `build-spec.md` section 6. Provenance propagates: anything derived from an entered value is itself flagged as containing entered input.

**Why.** The provenance caption is a designed feature of the interface, not a technical detail, and it is one of the things usability testing is meant to evaluate. It cannot be approximated.

---

## D6. Lifetime ISA cap trigger — property value, not annual contribution

**Decision.** Frame 09b's warning triggers when `property-value > £450,000`.

**Why.** Matches the £450,000 figure already referenced elsewhere in the wireframes (frame 06's Lifetime ISA note, and 09b's own warning text), and is a single-field check against a value the participant has just entered — reliable to trigger in a session. The alternative (annual LISA contribution > £4,000) would require tracking a new derived figure that `build-spec.md` never defines anywhere else.

**To reverse.** One constant (`lisaCapPropertyValue = 450000`) in `src/model/rates.js`.

---

## D7. States with no wireframe — build a fallback, and the corrected count

**Decision.** All eleven states in `build-spec.md` section 2 marked "No frame drawn" get a fallback built from existing component patterns (error banners, empty-state cards, locked-row styling) rather than being made unreachable.

**Correction.** Section 2 lists eleven such rows, not fifteen as Q3 originally said. Recounted directly against the table: 04 at bound; 05/05b error; 06 emergency fund short; 06 no accounts assigned; 09 error; 10/10b error; 12 beyond chart window; 12 unreachable; 15/16 goal met; 17 locked; 19 incomplete.

**Why.** Blocking navigation would hide exactly the edge-case behaviour a think-aloud session is meant to surface. A composed fallback keeps the session moving without inventing new visual design.

**To reverse.** Each fallback lives in its own screen module under `src/screens/`; disabling one is a one-line change to the triggering condition.

---

## D8. Frame numbering gaps — 14 and 22 to 28 confirmed skipped

**Decision.** Frames 14 and 22 through 28 are not built. Frame 13's "See it as a diagram" row (the likely reference for 14) is removed from the build rather than stubbed. The Mortgage-in-Principle results' "Talk to someone about it" row (20, 21) — the likely reference for something in 22 to 28 — is kept and built, but as a new screen outside the numbered sequence: `/mip/adviser` (see D10).

**Why.** No PNG, no Figma node, and no other evidence that 14 or 22-28 were ever drawn — only forward-references that terminate without a destination. Removing the one dead-end control (13's diagram row) is the fastest path to a testable prototype without inventing screens beyond what the spec drew. The second dead end is treated differently because whether a participant reaches for it is itself a finding worth observing — see D10.

**To reverse.** Re-add the diagram row to `content.js`'s frame-13 copy and give it a route once a frame 14 design exists.

---

## D9. Currency display rounds to the nearest £1

**Decision.** All currency figures display rounded to the nearest whole pound. No pence shown anywhere. Locale en-GB, symbol £, thousands separated — already decided. The model keeps full precision; only the formatted display rounds.

**Why.** Standard en-GB convention for figures this size; needs one formatting helper (`src/model/format.js`) rather than a rule that varies by figure or context.

**To reverse.** One rounding mode in `format.js`.

---

## D10. The Mortgage-in-Principle adviser route rests on MCOB 4.8A and Consumer Duty, not PERG 4.6

**Decision.** The obligation to offer a route to human advice after a Mortgage-in-Principle result is not FCA PERG 4.6.25B(5). That rule is boundary guidance: it keeps an eligibility tool like this one on the guidance side of the advice boundary, and says nothing about requiring an adviser route. The correct basis is two separate rules: MCOB 4.8A (execution-only sales — the customer must be told they can request advice) and the Consumer Duty consumer support outcome (no unreasonable barriers to a customer pursuing their financial objectives).

**Why this matters.** Citing PERG 4.6 for this obligation would misstate what that rule does, and the error would need correcting later if it reached the write-up. The adviser route (`/mip/adviser`, a terminal stub — request logged, no form, no booking calendar) is justified by the rule that actually requires it.

**To reverse.** N/A — citation correction, not a reversible build decision.

---

## D11. A persistent bottom navigation bar, not drawn in the wireframes

**Decision.** Frame 01's five-tab bank navigation bar (Home, Payments, Goals, Insights, Profile) is rendered on every full-screen journey screen, not on frame 01 alone. Its Home tab is the one tab that resolves, and it routes back to frame 01 from anywhere in the journey. The other four stay exactly as inert as they already are on frame 01 - they are the surrounding bank app, which is out of prototype scope - and are rendered `disabled` so they are not focus stops that do nothing.

This is a **deliberate deviation from the reference wireframes.** No frame other than 01 draws a bottom bar. It was added at the build stage, knowingly, and it is **exempt from the screenshot-comparison pass** on every screen it appears on - see `GAPS.md` G29, recorded alongside the frame 13 and frame 32 exemptions.

**Why.** The wireframes give a participant one way out of any given screen: the app bar's back control, one screen at a time. Ten screens into the deposit calculator that is ten taps, and a participant who wants to stop and start again has no visible way to do it. In a moderated think-aloud that turns into the facilitator intervening, which contaminates the very thing being observed. A single always-present, always-in-the-same-place route back to the entry point removes that intervention.

Frame 01's own bar was reused rather than a new control designed, for two reasons. It is already drawn, so nothing new is being invented visually. And it keeps the journey reading as something sitting *inside* a bank app rather than a standalone tool that has grown a control of its own - which is what the feature actually is.

**Where it does not appear.**

| Excluded | Why |
|---|---|
| 03b, 10c, 13b, 29, 30, 31, 32 (the seven sheets) | A tab bar belongs to the screen behind a sheet, not to the sheet. Rendering one inside a sheet would put it under the scrim, inside the sheet's own card, and would offer a second dismissal that skips the close behaviour each sheet defines for itself (13b's `video-seen`, 10c's `journeyPaused`). Apple's HIG is explicit about this structurally. |
| 19b Running your check | A determinate processing state that resolves to 20 or 21 on its own. An exit offered mid-check would leave `checkRunAt` set with no result, and whether a participant waits is part of what 19b is for. |
| 33 Prototype settings | Facilitator-only, deliberately outside the participant journey, reachable only by typing the URL (`GAPS.md` G23). It has its own close control back to frame 01 already. |

**One qualification, on the calculator's step flow (09, 09a, 09b, 10, 10b, 11).** These *keep* the bar - "from anywhere in the journey" includes mid-calculator - but its Home tab opens frame 10c ("Leave this for now?") instead of jumping straight to frame 01. `build-spec.md` section 1 already defines what leaving the calculator means: the form-header close on 09/10/10b opens 10c, and only 10c's own "Leave" sets `journeyPaused = true` and retains the draft inputs. A tab bar that bypassed that would silently discard a participant's part-entered figures. Frame 11 draws no close control, but it is the same step flow holding the same drafts, so it is treated the same way.

**Implementation.** `bottomNavHTML` in `src/components/ui.js`; mounted by `src/router.js`'s `mountBottomNav` against an exclusion set, so a screen added later inherits the bar without anyone remembering to add it. Because several screens re-render themselves in place from a toggle handler and rewrite every child of `#app`, a `MutationObserver` re-mounts the bar rather than ~20 screen modules each having to render it. Each tab is at least 48px in both dimensions (D1).

**Superseded, then restored.** This originally read: "Height is 56px plus `env(safe-area-inset-bottom)`, carried by the bar itself so its surface runs to the bottom edge of the display the way a native tab bar's does; `.screen` takes the bottom inset only on the screens with no bar, so the two never double up." D14's safe-area pass reversed it — the bar became a plain 56px above a reserved band on `.screen` — and D14's bottom-inset pass (20 August 2026) restored it, because the band read as the app floating off the bottom edge. The original wording is accurate again, with one refinement: `.screen` now zeroes its own bottom padding whenever *any* bottom chrome is present, not only a tab bar, so the tab bar, a lone action bar and a sheet's action bar are all handled by one rule. See D14.

**To reverse.** Delete the `mountBottomNav` call and the observer in `src/router.js`. Frame 01 keeps its own bar, since it renders `bottomNavHTML` directly.

**For the write-up.** This is a build-stage design decision that the wireframes did not dictate, in the same category as D1. It needs stating in the methodology chapter, because a participant's route back to the start is part of what they were given.

---

## D12. Collapsible sections start closed, on every screen, every time

**Decision.** Every accordion, disclosure and expandable section in the app is closed when its screen loads - frames 05, 05b (the "How we got to £X" breakdown), 06 (the position breakdown) and 19 (all three "What you'll..." sections). This holds on first entry and on re-entry by back navigation. Open state is never carried between screens.

This is a **deliberate deviation from the reference wireframes**, which draw all of these expanded (chevron up), and from `build-spec.md` section 2's own "breakdown open / closed - opens by default" row. Those screens are **exempt from the screenshot-comparison pass** for this difference only - see `GAPS.md` G30.

**Why.** A section that is already open cannot show whether a participant would have chosen to open it. Whether someone goes looking for the breakdown behind a headline figure - and how far into the journey they keep doing it - is one of the behaviours these sessions exist to observe, and defaulting to open destroys the measurement. It also front-loads every screen with detail the participant did not ask for, which is the opposite of the progressive-disclosure framing the feature is built on.

**Implementation.** `COLLAPSIBLE_DEFAULTS` in `src/state.js` names every collapsible key in one place, and both rules hang off it: it seeds `defaultState()`, and `resetCollapsibles()` is called by `src/router.js` on each hash-driven navigation. Changing the default alone would not have been enough - the store is persisted to `sessionStorage`, so a section opened on frame 05 would still be open on returning to frame 05 by the back control. A screen re-rendering *itself* in place from its own toggle handler bypasses the router and correctly keeps what the participant just opened. A new disclosure inherits both rules by adding its key to that one object.

**To reverse.** Set the keys in `COLLAPSIBLE_DEFAULTS` to `true` and remove the `resetCollapsibles()` call in `src/router.js`.

---

## D13. Light mode is fixed; the OS cannot change what a participant sees

**Decision.** The prototype renders in light mode on every device, regardless of the participant's OS colour-scheme setting. Nothing in the stylesheets reads `prefers-color-scheme` any more. The dark palette still exists, behind an explicit `.theme-dark` class that only `state.theme` - i.e. only frame 33's Theme control - can apply, and `resetState()` restores the default in the same step it clears a participant's progress, so a theme change cannot survive a reset into the next session.

**Why.** Participants join a moderated Teams session on their own devices. Two participants seeing different colour schemes is a confound, not a preference: a comment about legibility, contrast or emphasis could not then be attributed to the design rather than to which palette that person's phone happened to be in. It also breaks the correspondence between the running build and the screenshots in the dissertation. This is the same reasoning as D3's pinned Bank Rate - a research instrument has to show every participant the same thing.

**Implementation.** `src/css/tokens.css`: `color-scheme: light` on `:root`, which pins the UA-rendered chrome the design tokens cannot reach (form controls, the canvas behind the page, selection, scrollbar colours) so an OS-dark device does not paint dark controls inside a light app; and the former `@media (prefers-color-scheme: dark)` block is now a `.theme-dark` rule, applied by `router.js`'s `applyScenarioClasses` from `state.theme`.

Frame 33's Theme control offers Greyscale and Brand (`build-spec.md` section 7). No Dark option is drawn anywhere in the reference set, so the dark palette is defined but not currently selectable. It was left defined rather than deleted so the accessibility pass's measured dark-mode contrast values are not lost, and left unselectable rather than wired to a new option, because adding a Dark option would be inventing a frame 33 control the spec never drew.

`prefers-reduced-motion` is untouched - that is a motion and vestibular-safety setting, not a visual-preference one, and D1 keeps honouring it.

**To reverse.** Restore the media-query form of the `.theme-dark` block in `tokens.css` and drop the `color-scheme` declaration.

---

## D14. The device frame clips, the page behind it does not scroll, and the safe-area space is reserved

**Decision.** At framed widths, content that overflows the phone screen is clipped by the device frame and reached only by scrolling inside the frame, exactly as on a real phone. The page behind the frame does not scroll in either view. Scrollbars are hidden in both views (`scrollbar-width: none` plus the `::-webkit-scrollbar` rule) while the content stays fully scrollable by touch, wheel and keyboard.

**Why.** A browser scrollbar down the side of a mocked phone, or a page that scrolls the frame itself out of view, is an artefact of the mock rather than the interaction being tested. A participant scrolling the page instead of the screen is discovering the prototype's seams, not the design's. Real phones show no persistent scrollbar track either, so hiding it is closer to the thing being simulated, not further from it.

**Implementation.** `src/css/shell.css`. `html, body { height: 100%; overflow: hidden }` in both views - `#app-frame` is scaled with a transform, which does not shrink its layout box, so on a short viewport the unscaled box would otherwise push the body past `100vh`. `.device-bezel` also clips, so the device is what cuts content off if anything ever reaches past `.screen`. An `#app { min-height: 100vh }` rule was removed in the same pass: `#app` *is* the `.screen` element, and an id selector out-specified the framed `height: var(--frame-height)`, stretching the screen past the bezel it is meant to be clipped by on any viewport taller than 852px.

`overflow` on the scroll containers themselves is deliberately untouched - they stay `overflow-y: auto`, so wheel, touch, momentum and focus-driven scrolling all still work; only the visible track is gone. Tabbing to a control below the fold still scrolls it into view. Verified: keyboard-Tab and wheel both still scroll, and no scroll container reports a visible track.

**To reverse.** Both changes are contained to `src/css/shell.css`.

### The reserved safe-area space, and why it is not the status bar

**Decision.** The vertical space a device's system furniture occupies is reserved inside the phone screen, on every screen including sheets and overlays: 59px at the top for the status-bar area, 34px at the bottom for the home indicator.

**The two insets are placed differently, and that is the point.**

| | Where it lives | What the band paints |
|---|---|---|
| **Top (59px)** | `padding-top` on `.screen`. Nothing is drawn in it and nothing scrolls into it. | Empty screen background. |
| **Bottom (34px)** | **Inside the lowest chrome on the screen** — the tab bar, or the action bar where there is no tab bar, or the sheet's action bar. | That chrome's own surface. |

**Revised 20 August 2026 (bottom-inset pass).** The bottom inset started life the same way as the top one, as `padding-bottom` on `.screen`. That put it *underneath* the tab bar, so the bar stopped 34px short of the bottom of the phone screen and left a band of page background below it — the app visibly floating off the bottom edge. G39 had already found and fixed the identical mistake on sheets, where the band painted the scrim and so was obvious; on a full screen the band painted `--color-bg`, the same colour as the app behind the tab bar, which is why it survived a pass longer.

The inset is not removed — it moves. `.screen` zeroes its own `padding-bottom` wherever something at the bottom edge can carry it, and that element takes it as its own padding instead. The chrome's background then reaches the bottom of the phone screen, exactly as a native tab bar's does, and the band stops being empty space and becomes part of the bar.

**The rule, for every screen type:** whatever sits lowest touches the bottom edge, with the safe-area inset inside it and nothing empty beneath.

| Lowest chrome | Carries the inset as | Screens |
|---|---|---|
| Tab bar | `padding-bottom` on `.bottom-nav`, `height: calc(56px + var(--safe-bottom))` | 19 full screens |
| Action bar, no tab bar under it | `padding-bottom` on `.action-bar`, selected by `.screen > .action-bar-dock:last-child` | none currently — see below |
| Sheet's action bar | `padding-bottom` on `.bottom-sheet .action-bar` (G39) | the 7 sheets |
| Nothing at the bottom edge | `padding-bottom` on `.screen`, the fallback | 19b, 33 |

The second row is unreachable today: every screen with an action bar also has the tab bar below it, and the two screens with no tab bar (19b, 33) have no action bar either. The rule is written anyway so it holds if D11's exclusion list changes, and it is exercised in the verification pass by excluding a screen from the tab bar and measuring.

**Touch targets are measured on the interactive area, above the inset.** The tab bar's content box stays exactly 56px under `box-sizing: border-box`, with the inset padding below it; tabs measure 51–57px inside that, and clipping each at the top of the inset band still leaves 51–56px. No target relies on the inset to reach D1's 48px minimum.

**The usable content area is unchanged by the move.** At framed widths `.screen-content` measures 647px before and after: the screen's 852px less the 59px top inset, less the app bar's 56px, less the tab bar's 56+34. The inset moved from one side of the bar to the other; it was not reclaimed.

One consequence worth stating: `.screen`'s children no longer all "end above the bottom inset". The lowest one ends *at the bottom edge*, with the inset inside it. Scrolling content still stops above the tab bar exactly as before, because the tab bar's box is taller, not because a band sits under it.

**These are two separate things, and the distinction matters.**

| | Status: |
|---|---|
| The status bar **element** — a drawn bar with a clock, signal and battery | **Still absent.** D1's Android constraint table says "No status bar element anywhere in the markup or CSS" and that is unchanged. Nothing is drawn in the reserved band; it paints screen background and nothing else. |
| The **space** a status bar occupies on the device | **Now reserved.** It was not before, and that was the defect. |

Conflating the two is what produced the bug. D1 removed the element for a good reason — a mid-fidelity prototype that draws a fake 9:41 and a fake battery invites participants to comment on the mock rather than the design, and the drawn bar would be wrong on whichever platform the participant is not on. But removing the element silently removed its 93px of height as well, which D1 never intended and never said. The Figma frames are 393x852, and that 852 is a whole device screen: 59px of it belongs to the system at the top, 34px at the bottom, and only 759px is the app's. Building without the insets gave every screen 852px of usable height where the wireframe gives 759, so content sat flush against the bezel and every screen read looser and more cramped at once — more content crammed in, less breathing room around it — compared with the frame it was drawn from.

**Values, and why they are floors rather than constants.** `--frame-safe-top` and `--frame-safe-bottom` in `shell.css`, used as `max(env(safe-area-inset-*), <floor>)` at framed widths only. Below the 768px breakpoint the app is running on real hardware, so `env()` is used alone and the device reports its own inset — a phone with no notch gets no top band, and nothing is hardcoded onto a real screen. At framed widths the app is running in a mock of a device, `env()` resolves to 0 in a desktop browser, and the floor is what reserves the space. `max()` rather than a flat value so a real device wide enough to land in the framed view — an iPad, or a phone in landscape — still wins with its own larger inset instead of being cut back to the mock's number.

**Scrolling content scrolls under the top inset, not into it.** `.screen-content` is a flex child of the padded `.screen`, so its box begins below the band, and its own `overflow-y: auto` clips there. Content disappears beneath the reserved band as it scrolls; it is never visible inside it. Verified at every scroll position on the longest screens in the flow: with the content scrolled to its end, no element paints inside either band.

**Sheets and overlays.** The sheet card is held out of the status-bar area by `padding-top` on `.sheet-overlay`.

**Corrected 20 August 2026 (sheet-bottom pass).** The bottom inset was originally placed the same way — as `padding-bottom` on `.sheet-overlay` — and that was wrong. Padding on the overlay sits OUTSIDE the card, so with `justify-content: flex-end` it lifted the whole sheet 34px off the bottom of the phone screen and left a band of scrim beneath it: the sheet visibly floating away from the bottom of the device. It read as a defect on a sheet and not on a full screen only because `.screen`'s equivalent band paints `--color-bg`, the same colour as the app behind the tab bar, while a sheet's band paints the dark scrim.

The bottom inset now sits INSIDE the card, as `padding-bottom` on the sheet's own action bar, so the card's surface reaches the bottom edge the way a real sheet's does and the inset band paints that surface. The rule this settles, for both kinds of screen: whatever sits lowest — the action bar on a sheet, the tab bar on a full screen — sits at the bottom of the phone screen, with the safe-area inset below it and nothing empty beneath that. Full screens already satisfied it and are unchanged.

Both insets now resolve from one pair of variables, `--safe-top` / `--safe-bottom` in `shell.css`, rather than each container spelling out its own `max(env(...), floor)` — which is how the two came to disagree about where the bottom one belonged. `.bottom-sheet`'s `max-height` moved from `92vh` to `92%` in the same pass: `vh` measured the browser viewport, which at framed widths has nothing to do with the 852px frame (at 1440x900 it resolved to 828px, taller than the frame's own safe area), so a tall sheet could push up through the reserved top band.

The scrim is the one thing that deliberately does cover both bands. A safe-area inset keeps *content* clear of the system's furniture; it does not stop a background painting there, and dimming the whole screen is what a real sheet does. Absolutely positioned boxes resolve `inset: 0` against their containing block's padding box, so this happens without a special case.

**D11 was right the first time.** D11 originally recorded the tab bar as carrying the bottom inset itself, so its surface ran to the bottom edge of the display — the iOS convention for a real tab bar. D14's first pass reversed that on the grounds that "the reserved bands are empty and no chrome bleeds into them". That reasoning holds at the top of the screen, where nothing is drawn; at the bottom it produced the floating-off-the-edge defect above. The bottom-inset pass restores D11's original arrangement and generalises it to the action bar and the sheet card. D11's annotation is updated to say so.

**To reverse.** Set `--frame-safe-top` and `--frame-safe-bottom` to `0px` in `shell.css`. Nothing else reads them, and no screen module knows the insets exist. `--safe-top` / `--safe-bottom` are the single resolved pair every consumer reads; no component spells out its own `max(env(...), floor)`, and none should — that duplication is what let the top and bottom insets drift apart in the first place.

**For the write-up.** Worth a sentence, because it changes how much fits on a screen without scrolling — which is directly relevant to any finding about whether participants noticed content below the fold.

---

## D15. One drawn icon set, on one canvas, sized from the type scale

**Decision.** Every icon in the prototype is drawn in `src/icons.js` as inline SVG on a shared 24x24 canvas, and nothing renders an icon any other way. The `.svg` files under `assets/icons/` are deleted (the PWA app icons and the favicon stay — those are install artefacts, not UI), no screen uses `<img>` for an icon, and the character glyphs that stood in for icons are gone.

Icon size comes from `--icon-size-*` in `tokens.css`, derived from the type scale at roughly 1.2x the font size an icon sits beside; stroke weight comes from `--icon-weight-*`, one per font weight the type scale actually uses.

**Why.** The icons were exported piecemeal from Figma, each on whatever canvas it happened to be drawn on, then rendered at a fixed pixel box. Stroke width is expressed in the *source* canvas's units, so the same nominal 1.5-unit stroke rendered at wildly different weights depending on how far each asset had to be scaled:

| Asset | Source viewBox | Rendered at | Rendered stroke |
|---|---|---|---|
| `chevron-right.svg` | 6.5 x 7.5 | 20 x 20 | ~4.0px |
| `chevron-up.svg` | 10 x 4 | 20 x 20 | ~3.0px |
| `back.svg` | 24 x 24 | 24 x 24 | ~1.5px |
| `tick.svg` | 12.8 x 9.8 | 12.8 x 9.8 | ~1.8px |

So a list-row chevron drew two to three times heavier than the app bar's back arrow on the same screen. Three further inconsistencies came out of the same audit: `back.svg` rendered at 24px and `close.svg` at 20px in the same 44px app-bar cell; `.info-link__icon` rendered at 16px on frame 04 and 20px everywhere else; `.list-row__chevron` rendered at 16px on frame 33 and 20px everywhere else. A single canvas makes all of that unrepresentable — one declared weight now means one optical weight everywhere.

Two things improve as a side effect. Icons inherit `currentColor`, so they follow the palette instead of carrying baked-in hex values that the `.theme-dark` palette (D13) could never have reached. And because size multiplies by `--text-scale`, icons now scale with frame 33's "Text size: Large" control, which the fixed-pixel assets never did.

**Drawing conventions.** Apple's SF Symbols conventions, not Material. `developer.apple.com/sf-symbols/` was fetched and yields one usable sentence ("Symbols come in nine weights and three scales, automatically align with text..."); the linked HIG page returns only its `<title>` to a fetch, the same SPA behaviour already recorded at the top of `tokens.css`. So the geometry is stated in `icons.js` as this build's decision, from that sentence plus what is directly observable in any SF Symbols rendering: round caps and round joins without exception, stroke weight tracking the weight of the text beside it, relative stroke weight rising at small sizes and easing off at display sizes, and drawing inside an optical square rather than filling the canvas.

**What is deliberately not done.** The SF Symbols font is not embedded and none of Apple's symbol artwork is shipped or traced. Apple's licence for those assets is written for apps on Apple platforms; this is a web app. What is matched is the drawing convention, which is not the artwork.

**What each icon depicts is unchanged.** This is a restyle, not a redesign: the tab bar still shows a house, a two-way transfer, concentric rings, a rhombus and a ring; the locked milestone is still a dashed ring around a faint star, not a padlock. Two icons in the set are drawn but currently unused — `chevronLeft` and `lock` — because the brief named them; the notes in `icons.js` say where each would apply and why swapping it in would be a design change rather than a restyle.

**Deviation from the reference PNGs.** Every screen's icons are redrawn, so every screen differs from its reference PNG in icon weight and, on a handful of screens, icon size. Recorded as an intentional deviation and **exempt from the screenshot-comparison pass** for icon rendering only — everything else on those screens is diffed normally. See `GAPS.md` G34.

**To reverse.** `src/icons.js` and the `.icon` block in `components.css`. Every call site passes an icon function, so reverting means restoring the assets and the `<img>` tags too — this is not a one-line change.

**For the write-up.** Like D1 and D11, a build-stage design decision the wireframes did not dictate. Worth a line in the methodology chapter, because icon weight is one of the things a participant's eye reads as polish.

---

## D16. A checkbox on every countable account, and in-place updates that hold their place

**Decision.** Two changes to frame 03, made together because the second is what makes the first usable.

**Each counting account gets its own checkbox.** A participant can see *which* accounts are being counted toward their deposit, not only how many. Only accounts flagged `countsTowardDeposit` in `accounts.js` get one — Pot, Savings, Cash ISA, Lifetime ISA, Stocks and shares ISA, including one the bank has not sorted yet. A current account and a short-term goal pot get none, from the same flag the count and the totals already read.

**Toggling anything updates the screen where it stands.** No re-render throws the participant back to the top, and the control they just touched keeps focus.

This is a **deliberate design change, not something in the reference frames.** Frame 03's PNG draws no per-account control at all. It is **exempt from the screenshot-comparison pass** for the account rows and the count — see `GAPS.md` G37, recorded alongside the existing exemptions.

**Why the checkbox.** `GAPS.md` G36 closed with this left open, and the screenshots taken then showed the problem plainly: with everything deselected, the accounts still listed under "Toward your deposit" with a £0 subtotal, and a deselected account looked identical to a selected one. "0 of 5 selected" tells a participant how many, never which. In a think-aloud that is the difference between someone saying "so it's not counting my Cash ISA" and someone unable to tell, which makes their commentary about the totals uninterpretable. The count and the group subtotal were doing a job neither is shaped for.

**Two targets on one row, deliberately separate.** The row was a single `<button>` that opened 03b. It is now a container holding a 48x48 checkbox label and, beside it, a button carrying the name, type, balance and chevron that still opens 03b. Nesting a `<label><input></label>` inside a `<button>` is invalid HTML and would give one tap two meanings. Both targets meet D1's 48px minimum, and they do not overlap. Rows with no checkbox start at the card's left edge rather than against an empty box — an unticked box on an account that can never be counted would invite a tap that does nothing.

**Ticking follows the rule select-all already had.** `toggleAccountPatch` in `accounts.js` is `selectAllPatch` narrowed to one account: ticking marks it included *and* files it under "Toward your deposit", because an account sitting under "Not sorted yet" is not being counted however its flag reads; unticking clears the flag and leaves the filing alone. Asserted in `accounts.test.js`: ticking all five one at a time produces exactly the same selection as one select-all.

### The scroll jump, and why it was everywhere

**The bug.** Every screen module builds itself with `container.innerHTML = ...`. A toggle handler calling its own `render` therefore destroyed and rebuilt `.screen-content` — the element that owns the scroll position. The browser had nothing to restore `scrollTop` onto, so it started again at 0, and `document.activeElement` fell back to `<body>` because the focused control no longer existed. Tapping a control two thirds of the way down frame 03 sent the screen to the top and dropped keyboard focus.

**It was not only frame 03.** Auditing every in-place re-render found 18 call sites across 8 screens with the same defect: frames 03, 04, 05, 05b, 06, 09, 09a, 09b, 10, 10b and 33. Frame 11 was checked and is clean — its change links navigate to another route rather than re-rendering, so the router handles it. Frame 19's "edit a held figure" action from `build-spec.md` section 1 is not built at all; its three disclosures had the defect and now do not.

**Two fixes, at different altitudes.**

*Frame 03's account card patches itself.* `syncAccounts` in `consent.js` sets the checkbox properties, the count text and the group subtotals directly. In the ordinary case — ticking an account already filed where it needs to be — nothing is removed from the DOM at all, so there is nothing to restore: focus stays on the control because the control was never replaced. Only when a tick moves an account between groups does the `[data-role="account-groups"]` subtree get rebuilt, and even then the scroller is untouched and focus is put back on the row that moved. A `signature` string of group-to-account membership is what tells those two cases apart. Handlers are delegated from the card rather than bound per row, so they survive a rebuild.

*Everywhere else re-renders through a helper.* `rerenderInPlace` in `components/ui.js` records the scroll offset and enough about the focused element to find it again — the `data-action` plus `data-account-id` / `data-disclosure-id` / `data-value` this codebase already puts on every control — re-renders, and restores both. `focus({ preventScroll: true })` matters: without it the browser scrolls the refocused control into view and undoes the restore. Text selection is restored too, so a re-render while someone is mid-edit in a currency field does not drop their caret. Rewriting seven more screens into patch functions would have been a large change for screens where a full re-render is cheap and correct; this fixes all of them in one place.

**One limit, and it is the right behaviour.** Where an update makes the content shorter — selecting all empties the "Not sorted yet" group, taking its header, its "Sort this out" button and a spacer with it — the scroller's own maximum drops and the offset is clamped to it. Holding the old offset is not possible when there is no longer that much to scroll. The screen stays pinned where it was rather than jumping to the top, which is what the participant experiences as "it stayed put".

**Verified.** Scrolled to the bottom of frame 03 and toggled: offset unchanged, focus still on the tapped control, count, subtotal and `saved-toward-deposit` all updated. Same for the structural rebuild, and for frames 06 and 19. Provenance follows D5 — `entered` once the participant has changed which accounts count.

**To reverse.** Drop the `select` block from `accountRow` in `consent.js` for the checkbox; replace `rerenderInPlace(container, render, ...)` with `render(container, ...)` for the scroll behaviour. The two are independent.

**For the write-up.** The checkbox is a build-stage design change, in the same category as D11 and D15 — it needs stating, because what a participant could see about their own selection is part of what they were given. The scroll fix is a defect repair and needs no mention beyond a note that it was found and fixed before sessions.

---

## D17. The action bar appears once the participant reaches the end of the content

**Decision.** The pinned action bar — the primary button and, on most screens, a secondary link below it — is no longer visible from the moment a screen loads. It appears when the participant reaches the bottom of the screen's content, and hides again if they scroll back up. On screens whose content fits without scrolling it is visible immediately and stays visible.

This is a **deliberate design change, not something in the reference frames**, which draw the bar present from the start on every screen that has one. It is **exempt from the screenshot-comparison pass** for the bar's visibility and the scroll affordance — see `GAPS.md` G38.

**Why.** The intent is that a participant reaches the end of the content before acting. These screens carry the things the feature exists to be judged on: how a figure was worked out, where it came from, the regulatory lines, the "something doesn't look right" route. A primary button sitting there from the first paint invites a participant to press it without reading any of that — and then a think-aloud records how fast someone can skip the content rather than what they made of it. Making the button the reward for reaching the end puts the content in the path rather than beside it.

**Short screens are exempt, and that is the point, not an exception.** Where the content already fits, there is no end to reach: the participant has seen everything the moment the screen paints. Withholding the button there would be a gesture requirement invented for its own sake — it would teach participants that the button appears *eventually* and train them to flick at every screen, which would undo the reason for doing this at all. So the rule is not "scroll to continue"; it is "the button waits until you have seen the content", and on a short screen you already have.

### Which screens fall into which case

Measured at 390x844, with disclosures closed as D12 requires. Frames 09a and 13b sit close enough to the boundary that D12's closed disclosures and this decision's own layout together put them on the short side.

| Case | Frames |
|---|---|
| **Content overflows** — hidden on load, revealed at the bottom (22) | 02, 03, 04, 06, 08, 09, 09b, 10, 10b, 11, 13, 13b, 15, 16, 18, 19, 20, 21, 29, 30, 31, 32 |
| **Content fits** — visible on load and stays (7) | 03b, 05, 05b, 09a, 10c, 17, `/mip/adviser` |
| **No action bar at all** (4) | 01, 12, 19b, 33 |

13b is the one close call: it overflows by 61px. It is a sheet, and sheets do not get the overlap described below — their card is content-sized, so there is no wasted band to reclaim — which is what keeps it on the overflow side. 09a, a full screen, overflowed by 104px before the overlap and fits after it.

D12 is why the second list is longer than it looks like it should be. Frames 05 and 05b carry a "How we got to £X" breakdown that the wireframes draw open; closed, the screen is 345px of content in a 732px box, comfortably short. Frame 19 is the counter-example — three closed disclosures and it still overflows by 763px.

**The case is recomputed, never decided once.** A disclosure opening, a state variant rendering, frame 33's text-size control, a viewport resize — each is watched, so a screen that fits when closed and overflows when expanded switches behaviour and switches back. Verified on frame 05 in both directions, and on frame 17 by shrinking the viewport and growing it again.

### Keyboard and screen reader — the part that is not negotiable

**The bar is never removed from the accessibility tree and never given `display: none` or `visibility: hidden` while a screen is active.** The hidden state is `opacity: 0` plus `pointer-events: none`.

This is a deliberate departure from the brief's own wording, which asked for `visibility` and `opacity` "so it stays focusable". `visibility: hidden` does the opposite of that: it removes an element from the accessibility tree *and* makes it unfocusable, which would mean a keyboard-only participant on a long screen could not reach the control that moves them forward. Opacity leaves the bar rendered, focusable and announced; `pointer-events: none` is what stops a tap landing on a button nobody can see.

Focus is then a third way in, alongside "fits" and "at the bottom": while focus is anywhere inside the bar it is revealed, whatever the scroll position says. Tabbing to it also scrolls the content to its end, so what the participant sees agrees with why the bar appeared, and so a stray scroll cannot hide the control they are standing on.

Verified against the real accessibility tree over CDP, not a proxy for it: on an overflowing screen, a fitting screen and a sheet, the bar's button is present and unignored while hidden; it is in the tab order; focusing it reveals it and scrolls the content to the end; and activating it from the keyboard navigates.

### The scroll affordance

A short fade at the bottom of the scroll container, shown only while the content overflows *and* the bar is still hidden, removed the moment the bar arrives — by then the bar is the signal and two would be noise. It lives on the dock rather than the bar, because the bar's hidden state is `opacity: 0` and opacity applies to an element's pseudo-elements, so a gradient drawn on the bar would be invisible in exactly the state that needs it.

### Layout: the content scrolls under the bar

The bar overlaps the end of the scroller rather than carving a slot out of it, with a matching bottom padding inside the scroller so the last real content still clears it.

The first build reserved the bar's height in the flex column whether or not the bar was showing. That was stable but left ~136px of empty screen — 18% of the app's own 759px (D14) — blank for the whole scroll on every long screen, which is the "cramped and loose at once" problem D14 was about.

Collapsing the bar when hidden is the obvious alternative and it does not work: collapsing changes the scroller's height, which changes whether the content overflows, which changes whether the bar should show. On a screen that overflows by less than the bar's own height — 09a overflowed by 104px and 13b by 61px against a ~136px bar — that loop genuinely oscillates. Overlapping keeps the scroller's height identical in both states, so "reaching the bottom" is a fact about the screen rather than about the bar, and the reveal never shifts the content being read. Reclaiming those 136px is what moved 09a into the fits case.

**Sheets overlap too, by a different mechanism.** The negative-margin trick depends on the flex container having a definite height, so the space it frees is redistributed back to a `flex-grow` item. `.screen` has one; `.bottom-sheet` does not — it is sized by its content up to `max-height: 92%` — and applied there the negative margin simply dragged the bar up over the last row, hiding 03b's third purpose option.

Sheets were left reserving the bar's height instead, which was wrong for the same reason it was wrong on full screens: on a sheet whose content overflows (29-32, 13b) the hidden bar left a blank band inside the card. **Corrected 20 August 2026 (sheet-bottom pass)** by taking the dock out of flow — `position: absolute; bottom: 0` inside the card. An absolutely positioned child contributes nothing to its parent's height, so the card is sized by its scroller alone and the scroller's own bottom padding reserves room for the bar. Neither the card's height nor the scroller's depends on whether the bar is showing, so there is no feedback loop between "does the content overflow" and "should the bar be revealed" — the same property the negative-margin version has on full screens, reached without needing a definite height.

**The safe-area bottom inset (D14) sits below all of this**, as padding on `.screen` — not between the bar and the content. The reserved band stays empty and the bar rises within the app's own area.

**Motion.** A short fade and rise on the HIG tokens already in `tokens.css` — `--duration-standard` and `--ease-out`, the same pair the sheets use. Under `prefers-reduced-motion` the rise is dropped and only the cross-fade remains, matching how D1 treats every other transition.

**Implementation.** `src/action-bar.js` owns the decision and toggles the classes; `components.css` owns what the two states look like. Mounted from `router.js` on each navigation and from the same `MutationObserver` that re-mounts the tab bar, so a screen that rebuilds itself is rewired. Height changes are caught by a `ResizeObserver` on the scroller and its children plus a `MutationObserver` on the subtree, coalesced to one measurement per frame. All 33 screens go through one path — the seventeen full screens via `actionBarHTML`, the seven sheets via the same `actionBarDockHTML` wrapper.

**To reverse.** Delete the `mountActionBars` calls in `router.js` and give `.action-bar` `opacity: 1` unconditionally in `components.css`. The dock wrapper can stay; it is inert without the controller.

**For the write-up.** This one needs stating clearly, because it changes what a participant had to do before they could act. Any finding about whether someone read a disclosure, a provenance caption or a regulatory line has to be read against the fact that the button was withheld until they had scrolled past it.

---

## Open questions

None remain open as of 20 August 2026. Nothing in D11-D17 (this session's shell, icon-set, frame 03 and action-bar passes) opened a new one - each is a build-stage decision with a stated reason and a stated reversal, not a question left hanging.

As of 19 August 2026 (second pass): All five originally listed here have been closed and folded into the decisions above: Q1 → D2 (confirmed), Q2 → D6, Q3 → D7, Q4 → D8, Q5 → D9. A sixth item, not originally an open question, was also corrected this pass: the regulatory basis for the Mortgage-in-Principle adviser route — see D10.

---

## Change log

| Date | Change |
|---|---|
| 19 August 2026 | D1 to D5 recorded. Q1 to Q5 opened. |
| 19 August 2026 (session 2) | D6 to D10 recorded. Q1 to Q5 closed and folded into D2, D6-D9. |
| 20 August 2026 (shell pass) | D11 to D14 recorded: persistent bottom navigation (deviation from the wireframes, exempt from the screenshot pass), collapsible sections closed on load, light mode fixed against the OS setting, and device-frame clipping with hidden scrollbars. |
| 20 August 2026 (icon set) | D15 recorded: one drawn icon set in src/icons.js, SF Symbols drawing conventions, sized from the type scale. assets/icons/*.svg deleted. Deviation from the reference PNGs, exempt from the screenshot pass for icon rendering. |
| 20 August 2026 (safe area) | D14 extended: the 59px status-bar and 34px home-indicator space is reserved inside the phone screen, while the status bar element stays absent per D1 — the two are separate and are now written down as such. D11's tab-bar inset detail superseded. |
| 20 August 2026 (frame 03 selection) | D16 recorded: a checkbox on every countable account (deviation from the wireframes, exempt from the screenshot pass), and in-place updates that hold scroll position and focus — an 18-call-site defect across 8 screens, fixed by `syncAccounts` on frame 03 and `rerenderInPlace` everywhere else. |
| 20 August 2026 (bottom inset) | D14 revised: the bottom safe-area inset now lives INSIDE the lowest chrome on every screen type — the tab bar, a lone action bar, or the sheet's action bar — rather than as a band beneath it on `.screen`. The chrome's background reaches the bottom of the phone screen; `.screen` keeps the inset only on 19b and 33, which have no bottom chrome. D11's original tab-bar arrangement is restored. See `GAPS.md` G40. |
| 20 August 2026 (sheet bottom) | D14 and D17 corrected: the sheet's bottom safe-area inset moved from `.sheet-overlay`'s padding (outside the card, which lifted every sheet off the bottom of the phone screen) to inside the card below its action bar; both insets now resolve from one `--safe-top`/`--safe-bottom` pair; and a sheet's content now scrolls under its own action bar via an out-of-flow dock. See `GAPS.md` G39. |
| 20 August 2026 (action bar) | D17 recorded: the action bar appears once the participant reaches the end of the content, on the 22 screens that overflow; the 7 that fit show it immediately. Deviation from the wireframes, exempt from the screenshot pass. Kept focusable and in the accessibility tree throughout — `opacity`, never `visibility: hidden`. |