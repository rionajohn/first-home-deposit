# Design and calculation decisions

Authoritative where `build-spec.md` is silent. Where the two conflict, `build-spec.md` wins on navigation, state, routes and variable names; this file wins on visual language, rate sources and range rules.

Each decision records what was decided, why, and what it would take to reverse it. Open questions sit at the end and must be closed before the prototype goes in front of a participant.

Last updated: 22 August 2026

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

**Decision.** Frame 01's five-tab bank navigation bar (Home, Payments, Goals, Insights, Profile) is rendered on every full-screen journey screen, not on frame 01 alone. **Two tabs resolve: Home and Goals.** Home routes back to frame 01 from anywhere in the journey. Payments, Insights and Profile stay exactly as inert as they already are on frame 01 - they are the surrounding bank app, which is out of prototype scope - and are rendered `disabled` so they are not focus stops that do nothing.

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

### Amended 21 August 2026: Goals is a live tab

**What changed.** `/goals` exists now (D21), so the Goals tab has a destination. It is enabled, it routes to `/goals`, and it is the lit tab while the participant is on that screen - `aria-current="page"`, the active rule, and the bold label, the same three cues Home has always used. Payments, Insights and Profile are unchanged.

**Why this is not a new deviation.** D11's original reasoning was that four of the five tabs are the surrounding bank app and out of prototype scope, so they are drawn but inert. `/goals` moved one of them *into* scope: it is a built screen with a route, and D21 put the journey's own "save for something else" exit there. A tab pointing at a screen that exists and is deliberately reachable is no longer a dead end, and leaving it `disabled` would mean the participant could reach `/goals` from frame 06's exit but not from the bar that is showing Goals as one of five places they can be. The tab bar is also now the only cue that `/goals` is *outside* the feature - it lights a different tab, which is the clearest signal the app has that the participant has stepped out of "Your first home" and into the bank around it.

**What the tab does not do.** It does not become live on the screens D11 already excludes - the seven sheets, 19b and 33 have no bar at all - and mid-calculator it behaves exactly as the Home tab does, routing through 10c so a part-entered set of drafts is never silently discarded. That qualification below was written for Home and now covers both live tabs; the rule was always about the calculator, not about which tab was pressed.

**Which tab is lit is a fact about the route**, held in `router.js`'s `TAB_FOR_ROUTE` map. Only exceptions are listed; everything else falls back to Home, because as far as the surrounding bank app is concerned the whole "Your first home" journey lives under Home.

**One place renders the bar, and it is the same place that binds it.** Frame 01 used to draw its own copy of `bottomNavHTML`, on the reasoning that the bar is part of what frame 01 is and `mountBottomNav` is a no-op when a bar is already present. That no-op is what broke: `mountBottomNav` is also what attaches the tab listeners, and its "already mounted" guard - there so the `MutationObserver` does not re-append on every mutation - made it return before binding anything. Frame 01's tabs were rendered and wired to nothing. Invisible for as long as Home was the only live tab, since tapping Home on frame 01 is a no-op either way; not invisible once Goals resolved, when it became an enabled, focusable button that did nothing, on the first screen of the study and on no other. Frame 01 no longer renders the bar; `mountBottomNav` renders and binds it everywhere.

**Implementation.** `bottomNavHTML` in `src/components/ui.js`, which takes `{ active }` and reads `NAVIGABLE_TABS` - the single list of which tabs resolve, shared with `src/router.js`'s `mountBottomNav`, so a tab cannot be rendered enabled in one file and left unbound in the other. Mounted against an exclusion set, so a screen added later inherits the bar without anyone remembering to add it. Because several screens re-render themselves in place from a toggle handler and rewrite every child of `#app`, a `MutationObserver` re-mounts the bar rather than ~20 screen modules each having to render it. Each tab is at least 48px in both dimensions (D1).

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

### Extended to the "How we worked this out" card (20 August 2026)

`howThisWorksCardHTML` - the card on frames 06, 12, 13, 20 and 21 - is a disclosure too, closed on load, with its title as the header. Five more keys in `COLLAPSIBLE_DEFAULTS`, one per screen for the reason above: opening the card on the results screen must not pre-open it on the tracker, or the second screen stops measuring anything.

It is the largest always-open block in the flow - an intro, three label/value/caption rows and a nav row, roughly a third of a phone screen, on five of the journey's most-read screens - and it is exactly the kind of working-out D12 exists to leave unopened. The nav row into the assumptions sheet collapses with the rest, deliberately: it is the footer of the working-out, not a second entry point to it, and leaving it visible under a closed heading that says the same thing would recreate the duplication D20 below just removed.

Frame 06 now carries two collapsibles - its "What we used to check this" breakdown and this card - so its toggle handler routes on `data-disclosure-id` instead of binding the first match. That id is already in `rerenderInPlace`'s `FOCUS_KEY_ATTRS`, so the pressed header is the element refocused after the re-render: the card opens in place, the scroller keeps its offset, and focus never leaves the control. Measured on all five screens: scroll offset unchanged to the pixel, the header's own viewport position unchanged to the pixel, `document.activeElement` still the header.

---

## D20. One control per destination on a screen, and a link that names where it goes

**Decision.** Where a screen drew two near-identical controls into the **same** assumptions sheet, one is removed. Where it draws two into **different** sheets, both stay and both are reworded to name what they explain.

The flow had three phrasings of the same idea - "How did we work this out?" (an underlined `.info-link`), "How we worked these out" (a `.list-row` with a chevron) and "See how we worked this out" (the nav row inside the how-this-works card) - and all four assumptions sheets share the heading "How we worked this out". So a screen carrying two of them offered the participant no way to tell, before tapping, whether they led to the same place.

| Screen | Was | Now |
|---|---|---|
| 06 `/position/summary` | Info-link and card nav row, **both** to 29 | Card nav row only |
| 12 `/calculator/result` | Info-link to 30, chevron row to 29, card nav row to 29 | Info-link "How we worked out the deposit range" (30) + card nav "How we worked out your monthly saving" (29) |
| 13 `/learn/ltv` | Info-link to 30 and card nav to 29, worded almost identically | "How we worked out these rate figures" (30) + "How we worked out your monthly saving" (29) |
| 15/16 `/tracker` | Info-link to 30 and chevron row to 29, worded almost identically | "How we worked out these rate figures" (30) + "How we worked out your monthly saving" (29) |

**Which one survives a merge.** The card's own nav row, every time. It belongs to `howThisWorksCardHTML` rather than floating in the page, it sits directly under the rows whose working it explains, and it is the footer 12, 13, 20 and 21 already draw - so keeping it is the choice that leaves the flow with fewer patterns, not more. The loose info-link on 06 had no such anchor: it named no figure and sat between two unrelated cards.

**Screens with one control keep their wording.** 04, 08, 10, 10b, 11, 20 and 21 have nothing to be confused with, so "How did we work this out?", "How we worked these out" and "See how we worked this out" all survive where they are unambiguous. Rewording them would be churn against the reference PNGs for no gain.

**Not done, and deliberately.** The four sheets still share the heading "How we worked this out". Renaming them would make the destinations self-evident on arrival, but the headings are Figma frame content and the change would touch `build-spec.md`'s frame mapping - a bigger decision than this one, and not needed once the links themselves say where they go.

**Found on the way.** Frame 21's card nav row had rendered since the screen was built with nothing bound to it - a dead control. Frame 20 binds the identical row. Now bound, same target and same `returnFrame` as 21's action-bar secondary. See `GAPS.md` G45.

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

**Revised 20 August 2026 (screen-tail pass): 56px anchored to the bottom, not 193px spanning the bar.** The fade first spanned the dock's whole height plus 56px above it — solid `--color-bg` across the bar's own area, fading out over the 56px above that. The reasoning: the content scrolls under the bar, and a hidden bar is transparent, so a gradient sitting only *above* the dock would fade the content out and then let it reappear, perfectly legible, underneath an invisible bar.

That is true of a gradient above the dock and false of one at the bottom of it. The dock's bottom edge *is* the bottom edge of the scroller — the negative margin above makes the scroller run to exactly there — so a fade anchored to `bottom: 0` dissolves the content once, at the last thing the participant can see, with nowhere below it for anything to reappear.

The cost of the old geometry was 193px of flat `--color-bg` on a two-button screen, 26% of the phone screen, at *every* scroll position while the bar was hidden. Real content sat under it — the next card's top edge would appear and then dissolve into a slab. That is what read as a blurred or blank region below the last element. Same job, 56px instead of 193, and content behind the hidden bar now stays legible until it reaches the bottom edge instead of dissolving 137px early.

### Layout: the content scrolls under the bar

The bar overlaps the end of the scroller rather than carving a slot out of it, with a matching bottom padding inside the scroller so the last real content still clears it.

**Corrected 20 August 2026 (screen-tail pass): that padding was never applying on a full screen.** The rule was written and correct, and lost — `.screen-content` sets the `padding` shorthand further down the same file, at equal specificity, which reset the longhand back to `var(--space-lg)`. The margin survived, because a shorthand only resets its own longhands. So the scroller's *box* grew under the bar while nothing reserved that height *inside* it, and the last element on every overflowing full screen ended 121px behind an opaque bar. Fixed by `.screen > .screen-content`, which wins on specificity rather than on source order. Sheets were never affected: G39 had already hit this exact failure on `.bottom-sheet__content` and fixed it the same way. Measured at both breakpoints: the last element now clears the bar by `--space-lg` on every full screen and `--space-2xl` on every sheet. See `GAPS.md` G41.

The first build reserved the bar's height in the flex column whether or not the bar was showing. That was stable but left ~136px of empty screen — 18% of the app's own 759px (D14) — blank for the whole scroll on every long screen, which is the "cramped and loose at once" problem D14 was about.

Collapsing the bar when hidden is the obvious alternative and it does not work: collapsing changes the scroller's height, which changes whether the content overflows, which changes whether the bar should show. On a screen that overflows by less than the bar's own height — 09a overflowed by 104px and 13b by 61px against a ~136px bar — that loop genuinely oscillates. Overlapping keeps the scroller's height identical in both states, so "reaching the bottom" is a fact about the screen rather than about the bar, and the reveal never shifts the content being read. Reclaiming those 136px is what moved 09a into the fits case.

**Sheets overlap too, by a different mechanism.** The negative-margin trick depends on the flex container having a definite height, so the space it frees is redistributed back to a `flex-grow` item. `.screen` has one; `.bottom-sheet` does not — it is sized by its content up to `max-height: 92%` — and applied there the negative margin simply dragged the bar up over the last row, hiding 03b's third purpose option.

Sheets were left reserving the bar's height instead, which was wrong for the same reason it was wrong on full screens: on a sheet whose content overflows (29-32, 13b) the hidden bar left a blank band inside the card. **Corrected 20 August 2026 (sheet-bottom pass)** by taking the dock out of flow — `position: absolute; bottom: 0` inside the card. An absolutely positioned child contributes nothing to its parent's height, so the card is sized by its scroller alone and the scroller's own bottom padding reserves room for the bar. Neither the card's height nor the scroller's depends on whether the bar is showing, so there is no feedback loop between "does the content overflow" and "should the bar be revealed" — the same property the negative-margin version has on full screens, reached without needing a definite height.

**The safe-area bottom inset (D14) sits below all of this**, as padding on `.screen` — not between the bar and the content. The reserved band stays empty and the bar rises within the app's own area.

**Motion.** A short fade and rise on the HIG tokens already in `tokens.css` — `--duration-standard` and `--ease-out`, the same pair the sheets use. Under `prefers-reduced-motion` the rise is dropped and only the cross-fade remains, matching how D1 treats every other transition.

**Implementation.** `src/action-bar.js` owns the decision and toggles the classes; `components.css` owns what the two states look like. Mounted from `router.js` on each navigation and from the same `MutationObserver` that re-mounts the tab bar, so a screen that rebuilds itself is rewired. Height changes are caught by a `ResizeObserver` on the scroller and its children plus a `MutationObserver` on the subtree, coalesced to one measurement per frame. All 33 screens go through one path — the seventeen full screens via `actionBarHTML`, the seven sheets via the same `actionBarDockHTML` wrapper.

**To reverse.** Delete the `mountActionBars` calls in `router.js` and give `.action-bar` `opacity: 1` unconditionally in `components.css`. The dock wrapper can stay; it is inert without the controller.

**For the write-up.** This one needs stating clearly, because it changes what a participant had to do before they could act. Any finding about whether someone read a disclosure, a provenance caption or a regulatory line has to be read against the fact that the button was withheld until they had scrolled past it.

## D18. Drag-to-dismiss closes a sheet through the sheet's own close control

**Decision.** The grabber at the top of all seven sheets (03b, 10c, 13b, 29, 30, 31, 32) is now the gesture surface `SPEC.md`'s transition rules always said it was: dragging down moves the card with the finger, releasing past a threshold dismisses it, releasing short of it settles the card back. A completed drag does not navigate. It **clicks the sheet's own dismiss control** — the same element a participant would tap — and lets that element's existing handler do the closing.

**Why the indirection matters.** Closing a sheet is not the same as changing the route. 13b sets `ltvVideoSeen` on close, which is what makes frame 13's explainer row read "watched" afterwards. 03b returns to whichever screen set `returnFrame`. 10c's dismiss is "Keep going", which deliberately leaves `journeyPaused` alone — only its own "Leave" sets it (`build-spec.md` section 1). A gesture that merely set `window.location.hash` would look completely correct on screen while recording a participant as never having seen something they did see. That is a silent data error in the session record, and the sessions are what this prototype exists for.

Routing the gesture through the control means there is no second close path to keep in step with the first, and a sheet added later inherits the behaviour by drawing the same markup. It is also what the Escape key has always done, so the two now share one helper (`dismissControlFor` in `src/sheet-drag.js`) rather than two copies of the same selector.

### The threshold, which the spec does not give

`SPEC.md` requires "dismiss by drag-down or scrim tap" and stops there. Two rules, either sufficient:

| Rule | Value | Why |
|---|---|---|
| Distance | 25% of the sheet's own height, minimum 72px | A quarter of the card is the point iOS's own sheets commit at. The floor matters because 10c is a heading and one line of copy — a quarter of a short card is a twitch, not a decision. |
| Velocity | released while still moving down at 0.5px/ms or more | A fast, short flick is how most people actually dismiss a sheet. Without this rule it would spring back and read as the gesture having failed. |

Dragging up is clamped at the resting position rather than rubber-banded: the card's bottom edge is flush with the bottom of the phone screen, so any upward travel would lift it off that edge and show scrim underneath.

### Under `prefers-reduced-motion`

The sheet still tracks the finger — following a gesture is not decoration, and removing it would leave a grabber that once again does nothing. What is dropped is the un-commanded motion at the end: the settle and the exit slide both become instant. The reduced-motion branch also has to skip *waiting* for a transition that will not run, which is why this one case is decided in `sheet-drag.js` rather than in a `@media` block.

### The spring does not overshoot

`--ease-spring` (`cubic-bezier(0.22, 1, 0.36, 1)`) is fast off the mark with a long tail, which is what reads as a spring. A true overshooting curve was rejected for the same reason upward drag is clamped: overshoot past the resting position lifts the card off the bottom edge and flashes scrim beneath it.

**Verified, not asserted by description.** `scripts/sheet-drag.test.mjs` drives a real browser: it opens 03b and 13b twice each from identical fresh sessions, closes one run with the control and the other with a drag, and compares the whole persisted store — `assert.deepStrictEqual(viaDrag.state, viaControl.state)` — in both motion modes. All seven sheets are separately asserted to dismiss on a drag and land where their close control lands.

---

## D19. One way of drawing a close control, and a sheet heading that shares its row

**Decision.** The close control on frames 29-32 is now a plain `title3` xmark from `src/icons.js` in a transparent 48px box — the same treatment `.app-bar__cell--action` and `.form-step-header__cell--action` already give every other close and back control in the feature. The filled circular background is gone. The control sits at the top right of the sheet, **on the same row as the sheet's heading**, and that row lives in the sheet header rather than in the scroller.

This deviates from the reference PNGs for these four frames, which draw a grey disc above the heading. Recorded in `GAPS.md` G42; frames 29-32 are **exempt from the screenshot-comparison pass for the sheet header** and for nothing else.

**Why the circle went.** It was the only circular control in the app. Every other close in the flow — 15 app-bar screens and the six calculator steps — is a bare glyph, and these sheets are reached *from* those screens, so the same action changed appearance halfway through a journey. The sheet's glyph was also two sizes smaller than all of them (`footnote`, 16px, against `title3`, 24px).

**Why the heading moved into the header.** The overlap that prompted this was not a spacing slip; it was structural. The close was `position: absolute; top: 50%` against a header band that was only the drag bar plus its padding, so a 48px button centred on that band hung down over the first line of a heading that lived in a different box. Three requirements then pin the layout exactly:

| Requirement | What it rules out |
|---|---|
| The glyph aligns with the heading, not floats over it | Any absolute positioning — alignment between two independently laid-out boxes is a coincidence that copy changes break |
| The heading never runs under the glyph, at any number of lines | The heading and the glyph must share one flex row, so the heading's column *ends* where the glyph begins |
| The close stays reachable anywhere in a long sheet | The row cannot be in the scroller, or the only close control scrolls off the top |

One structure satisfies all three: a flex row in the fixed header, heading `flex: 1 1 0; min-width: 0`, glyph `flex: 0 0 auto`. The heading is therefore pinned above the scrolling body rather than scrolling with it — the second deviation from the reference, and the price of the other two requirements.

### The touch target is 48px and the glyph is 24px, so the box is offset, not the glyph

Laying the 48px box flush against the row's padding edge would leave the *visible* glyph 12px inside the right margin and 9px below the centre of the heading's first line — misaligned with the one thing it is meant to line up with. Each margin is negative half the difference between glyph and target, which pulls the box out by exactly the slack around the glyph: the target keeps its full 48x48 and simply overhangs into the card's edge padding, while the glyph lands on the margin. Both formulas are written against `--text-scale`, because glyph size and heading line-height both scale with frame 33's Large text control.

**Measured at 390px on all four sheets, at both text sizes and with a heading forced to three lines** — 12 combinations, every one of them: gap between heading and glyph 22-24px (never negative), glyph's right edge exactly on the body copy's right margin (0.0px), heading's left edge exactly on the body copy's left margin (0.0px), glyph centre exactly on the centre of the heading's first line (0.0px), no clipped or overflowing heading, and 16px between the heading and the top of the scroller.

### The head of a sheet clears the grabber, and every sheet with a heading uses the same one

Two amendments, both from the same complaint: the heading started too close to the top edge of the card.

**Top clearance.** `.bottom-sheet__title-row`'s top padding is `--space-2xl` (24px), not `--space-lg`. The padding that matters is not the heading's - it is the close control's, because the negative top margin above pulls its 48px target 9px *above* the heading's first line. At 16px that put the target's top edge 7px under the grabber: the heading read as starting immediately below the bar, and a downward drag begun on the grabber and a tap on the close were separated by single-figure pixels. At 24px the heading sits 24px below the grabber and the target still clears it by 15px, so the two are visibly separate controls. Measured at 390px: card top 67.5, grabber 79.5-83.5, close target top 98.5, heading first line 107.5 - the same numbers at Large text, where the overhang shrinks to 6.75px and the clearance grows.

**One header, six sheets.** `sheetHeaderHTML` now takes `closeLabel` as optional, and frames 03b and 10c use it without one. They previously put their heading inside the scroller, directly under a bare 28px drag handle - 12px below the grabber, the same defect the assumptions sheets had, in a sheet that had never been looked at for it. Adopting the header gives them the identical clearance and margins and pins their heading above their body, and it costs nothing: neither sheet overflows, so nothing that used to scroll has stopped.

**What 03b and 10c deliberately do not get is the glyph.** Their reference PNGs draw no close control, and both already offer an explicit labelled pair - "Not now" on 03b, "Keep going" on 10c. A third, unlabelled exit beside a decision the participant is being asked to make is a control this prototype would be inventing, and on 10c it would be genuinely ambiguous (an X on a "leave this for now?" sheet reads as either answer). If that glyph is wanted on those two frames it is a one-line change - pass `closeLabel` - but it is a design decision, not a consistency fix, and it is not made here.

**Frame 13b takes neither.** Its only heading belongs to the video placeholder inside the scroller, so it keeps the bare drag handle and gets the 24px of head clearance as `padding-top` on the scroller instead (`.bottom-sheet__drag-handle + .bottom-sheet__content`), two classes deep so the shorthand on `.bottom-sheet__content` cannot reset it.

---

## D21. The way out of the journey leads somewhere - /goals, the bank's own goals area

**Decision.** Frame 06's secondary action, "Not right now - save for something else", now goes to a new screen at `/goals` instead of returning to frame 01. `/goals` is the bank's goals area: two sections (short-term and long-term) listing the participant's own pots, and one card under the long-term heading whose action routes into the deposit calculator. See **"Where the card goes"** below for the routing, which has been amended twice since.

**WHAT THIS DOES AND DOES NOT REVERSE.** Frame 07 ("Generic savings goal") stays excluded. `build-spec.md` section 3 still marks it **Remove**, no goal-setting flow was built, and nothing on `/goals` creates, edits or targets a goal. What changes is only the *destination* of the branch that used to point at it: the participant who says "no, something else" now lands somewhere that acknowledges the answer, rather than being returned to the screen they started on.

A note on the cross-reference, because it matters for anyone reading back: **D8 does not cover frame 07.** D8 is about frames 14 and 22 to 28, and frame 07's exclusion has only ever lived in `build-spec.md` section 3's "Remove" marking and in the comment on `position-summary.js`'s `goal-no` handler. So this decision partially reverses *that* exclusion, not D8's. What it does share with D8 is the reasoning D8 set out - that a dead-end control is better removed than stubbed - and this is the qualifying case: the control could not be removed, because the question frame 06 asks has to have both answers, so the answer needed a destination instead.

**Why the old behaviour was wrong.** "Not right now - save for something else" and the app bar's back control did exactly the same thing. A participant who considered the question and decided against a house was returned to frame 01 in the same state as one who had simply backed out, which makes the two indistinguishable in a session recording - and "did they leave the journey deliberately" is a finding, not a navigation detail. It also read as the app having nothing to say to someone whose answer was no.

**What makes it a bank screen and not a feature screen.** The same design system throughout - a bank does not change its design language between two of its own screens - and the difference is carried by what is absent: the app bar says "Goals" rather than `config.name`, and there is no journey framing, no provenance caption, no flag row, no assumptions link and no regulatory line. The tab bar shows **Goals** as the active tab rather than Home, which is the clearest single signal that the participant has stepped out of the feature and into the surrounding app.

**Figures.** Every number on the screen is a `balance` already in `MOCK_ACCOUNTS`, reached through the same `effectiveAccounts()` pass frames 03, 03b, 05 and 06 use. A participant who saw "Holiday pot GBP 420" on frame 03 sees GBP 420 here because it is the same field, not a second copy. Classification is a new `goalHorizon` flag on the account - `'short'`, `'long'`, or absent for "not a goal" - sitting beside `countsTowardDeposit` for the same reason that one exists: the rule lives in the data, not in a screen's render logic.

The rule it encodes is "a goal is a Pot with a purpose", which selects the three Pots and leaves the four savings accounts and the current account out. A Cash ISA is where money sits, not something you are saving for.

**No goals were invented, and no figures were.** The brief allowed adding goals to the data source if the screen needed them; it did not need them. Three real pots populate two sections, and **nothing on the screen is computed** - no targets, no progress bars, no projections. Every one of those would have been a number this prototype made up, on a screen whose whole point is that it shows what the bank already holds. Adding `goalHorizon` changed no total anywhere: `groupTotals` returns `{unassigned: 2400, deposit: 8950, emergency: 5600, notCounted: 420}` before and after.

**Regulatory anchors: none.** `SPEC.md`'s anchor map puts the guidance-not-advice line on every screen presenting a worked figure, and confirms it **absent from frame 01** - the bank's home screen, which draws the feature's own entry card and still carries no guidance line, because an entry point is not guidance. `/goals` is the same shape of screen: the bank's own area, listing balances it already holds, with one card leading into the feature. Nothing is worked out, so there is nothing to disclaim. The DUAA triad does not apply either - no automated decision is presented, so there is no pushback to offer and no source to surface beyond the balances themselves. The guidance line resumes at frame 08, on the far side of the card, which is where the first computed figure also resumes. Verified in a browser: zero `.legal-text`, zero `.flag-row`, zero `.provenance-caption` on `/goals`, and frame 08 still carrying its line.

**The tab bar became a real tab bar.** `bottomNavHTML` took no arguments and hardcoded Home as active with the other four `disabled`; it now takes `{ active }`, and `NAVIGABLE_TABS` is the one list both it and `router.js`'s `mountBottomNav` read, so a tab cannot be rendered enabled in one place and left unbound in the other. Two tabs are live (Home, Goals); the other three stay disabled, exactly as inert as they already were on frame 01. Leaving mid-calculator still routes through 10c whichever tab is used, because `build-spec.md` section 1 defines what leaving the calculator means and that definition does not depend on which piece of chrome was tapped.

### Where the card goes - amended 21 August 2026, replacing the /journey routing

**Decision.** The card's action routes to **frame 09 / 09a** (`/calculator/property`), for everyone, in one line and with no branch. If `consentGiven` is not `true` it sets `mode = 'general'` first.

This replaces two earlier answers. It first routed to frame 08, which bounced through three guards to the consent screen (`GAPS.md` G48). D22 then split it: frame 02 for a cold arrival, frame 08 when the journey was under way. That is now withdrawn.

**Why the calculator, and not a preamble.** The card says "Work out my deposit". The screen that works out a deposit is the calculator. A card that says one thing and opens an explainer is asking a participant to trust a label that did not hold, which is the wrong lesson for a prototype whose subject is whether people trust what the interface tells them. Frame 02 was the right answer to "where does a cold arrival get context"; it was the wrong answer to "what does this button do".

**Why it needs no branch.** `/calculator/property` renders `property-value === null` as frame 09a, its own documented empty variant, so it renders for every participant and no guard can redirect them off it. D22's rule - write state only once the destination is settled - is therefore satisfied unconditionally rather than by testing two flags. `goal` and `returnFrame` are written on the single path.

**`mode = 'general'` is not a new state.** `build-spec.md` section 1 already defines this exact situation in its frame 04 row: "Continue with general figures" sets `mode = general` and enters the calculator with nothing read from an account. A participant arriving from `/goals` without consent is in the same position - the bank has read nothing - so they enter the calculator the same way and are marked the same way. `consent.js`'s own "Not now" sets the identical pair. The test is `consentGiven !== true` rather than `=== false`, because `null` (never asked) and `false` (declined) both mean the same thing here and only the strict test catches the first.

Nothing in frames 09 to 12 reads `mode`; only frame 19 and frame 33 do. It is set because it is true and because frame 19 asks it later, not because the calculator needs it.

**What this route does NOT fix, stated because it was walked and found.** Step 2 does not render on it. Frame 10 guards on `left-over === null` and returns to `/calculator/property`, so Continue on frame 09 is an unbreakable loop, and frames 11 and 12 are unreachable. **The same is true of `build-spec.md`'s own frame 04 path**, verified by walking it: this route reaches a pre-existing gap rather than creating one. See `GAPS.md` G50 - it needs a design decision about what step 2 is in general mode, and is deliberately not papered over here.

**To reverse.** Point `goal-no` back at `#/home`, drop `/goals` from `ROUTES` and `TAB_FOR_ROUTE`, and pass no `active` to `bottomNavHTML`. The `goalHorizon` flags are inert without the screen. To reverse the routing alone, restore D22's two-flag branch from this file's history.

---

## D22. Arriving at the calculator from Goals, and what /goals is allowed to show before consent

Two decisions from the same trace (`GAPS.md` G48), kept together because they are the two halves of "what may a participant do from the bank's goals area before they have agreed to anything".

### The card sends a cold arrival to frame 02, not into the guard chain

> **Superseded 21 August 2026 for the routing only.** The card now goes to frame 09/09a for
> everyone - see D21's "Where the card goes". The rest of D22 stands: the state-write ordering
> below is still the rule, and the pre-consent balances decision is untouched. Kept rather than
> deleted because the reasoning for frame 02 is why the current answer had to be defended on
> different grounds.

**Decision.** `/goals`'s "Want to calculate the deposit for your house?" card routes to **frame 02** (`/journey`) unless the journey is genuinely underway, in which case it routes to **frame 08** (`/goal-check`) as before.

**Why frame 02.** It is the screen that explains what the feature does and what it will ask for, before asking for anything. A participant reaching `/goals` from the Goals tab has been told nothing: they have not seen the journey overview, not answered the savings question, not granted account access. Frame 02 is the beginning of the thing they just asked for.

What it replaces is worse than a wrong destination. The card used to go straight to frame 08, whose guard bounced to 06, whose guard bounced to 05, whose guard bounced to 03 - **four hash changes in one tap**, none of them animated (Drift D-7), landing on a permission request with no explanation of why a request to calculate a deposit had produced a question about where savings are kept. The guards were doing their job; they were written for deep links and reloads, and this route was neither.

**The test is both flags, not just `journeyStarted`.**

```
journeyStarted && saved-toward-deposit !== null   ->  /goal-check
otherwise                                        ->  /journey
```

`journeyStarted` alone is not sufficient, and the reason matters for the second decision below. It is set by frame 01's entry card and by nothing else in the flow, so a participant who tapped that card, backed out, and came round through Goals would carry `journeyStarted: true` with every figure still `null` - and the guard chain would fire exactly as before. `saved-toward-deposit` is the condition frame 08's own guard tests, so testing it here is what guarantees the card never hands off to a screen that will immediately redirect. **A branch that decides a destination should ask the same question the destination's guard asks.**

### State is written after the destination is settled, never before

**Decision.** The card writes nothing until it knows which screen will actually render.

- **To frame 08:** `goal: 'house'` and `returnFrame: '/goals'`. Frame 08 renders - no guard stands between the tap and the screen - so "you came from Goals" is true and will stay true.
- **To frame 02:** `journeyStarted: true` only.

**Why `returnFrame` is not written on the cold path.** It is the value sheets and explainers read to send someone back. A participant entering the journey at its first screen is not stepping sideways out of anything, and `returnFrame: '/goals'` would sit in state for the rest of the journey - so the next assumptions sheet they opened, several screens later, would offer to return them to the bank's goals area. That is the defect G48 named: a `returnFrame` pointing at a flow they are not in.

**Why `goal` is not written on the cold path either.** Frame 06 asks "Is a house still your goal right now?" and that is where the answer belongs. Pre-filling it from a card tap answers a question the journey has not put yet, and D21 already routes frame 06's "no" back to `/goals` - so the participant would have arrived pre-committed to an answer the journey is about to ask them for.

**Why `journeyStarted` IS written.** Arriving at frame 02 is entering the journey, which is precisely what frame 01's entry card means by setting it, and frame 02's own "Not right now" clears it again. One flag, set by the same event on both routes in.

### Back from consent now lands on a screen the participant has seen

Frame 03's back control goes to `/journey`. Before this change that was a screen a Goals-arriving participant had never seen - pressing back moved them *forward* into the middle of a journey they had not started. With the route through frame 02 they have been there: `/home -> /goals -> /journey -> /consent -> back -> /journey`. Verified from a fresh session; `/journey` appears at hop 3 and is returned to at hop 5.

### The pre-consent balances on /goals stay

**Decision.** `/goals` goes on showing Emergency fund, Holiday pot and House pot with their real balances to a participant who has granted nothing. No gate, no placeholder, no "connect your accounts first" state.

**Why this is not a consent bypass.** `/goals` is **the bank's own goals area**, and the bank already holds these balances - they are its own pots, in its own accounts, shown in its own app. Showing a customer their pot balance is the ordinary operation of the account they opened; it needs no separate permission, and a bank that hid a customer's own savings behind a consent gate would be the strange behaviour, not this.

**What frame 03 actually asks for is a different thing.** It asks permission to *analyse income and outgoings* - to read twelve months of salary credits and average six months of direct debits into `money-in` and `essential-spending` - and to *assign accounts to a deposit*, producing `saved-toward-deposit` and everything derived from it. That is a **new processing purpose**: new inferences drawn from existing data, for a purpose the customer did not have when they opened the account. Permission to draw those inferences is not the same as permission to see money the bank can already see, and conflating the two would make the consent screen ask for something it does not need while implying the balances were somehow secret.

The line between the two is visible on the screen itself. `/goals` shows a `balance` field and nothing else - no provenance captions, no computed figures, no regulatory line, because there is nothing worked out to disclaim (D21). The first computed figure a participant sees is on the far side of consent.

**To reverse.** Gate the card list on `state.consentGiven` and give `/goals` an empty state. Recorded as a decision rather than left implicit precisely because it looks like a bypass and is not.

---

## D23. One screen inset, in two tokens, at every width

**Decision.** How far the app's content sits from the edge of the phone screen is set in exactly two places, `--screen-inset-x: 20px` and `--screen-inset-y: 24px` (`tokens.css`), and nothing else in the codebase decides it. Both apply at every viewport width. Content was previously 16px from the edge on all four sides and read as crowded against it.

**The three insets the tokens produce**, all measured from the phone screen's own edge rather than from a declared padding value:

| Inset | Value | Where it comes from |
|---|---|---|
| Horizontal, both edges | 20px | `--screen-inset-x` |
| Below the header, before the first block | 24px | `--screen-inset-y` |
| Above a revealed action bar | 24px | `--screen-inset-y`, plus the bar's measured height |

**Only two elements own an inset, because the app has only two scrolling content areas.** `.screen-content` is the shared wrapper every full screen renders its body into (`<main class="screen-content">`, all 24 of them), and `.bottom-sheet__content` is its counterpart on the seven overlay sheets. There was no per-screen padding to migrate: the stylesheets were swept for it and the only `.screen-content` modifiers that exist (`--centered`, `.declined-content`) set alignment, never spacing.

**Both wrappers read the same two tokens, rather than a screen pair and a sheet pair.** A sheet card is horizontally full-bleed - it touches both screen edges, with only its top corners rounded - so its content padding *is* the distance from the phone screen's edge, exactly as `.screen-content`'s is. Two numbers there would be two different insets on one edge; the sheets moved from 24px to 20px to match. Sheets keep 24px vertically, which is what they already had.

**Not aliased to `--space-xl` / `--space-2xl`, though they currently hold the same numbers.** The 8pt spacing scale answers "how far apart are two things"; these answer "how far in from the edge does the app start". Aliasing them would mean re-tuning the gap between two cards silently walked the screen margin with it.

### Full-bleed elements, identified before the change and preserved by breaking out rather than by exempting screens

| Element | What stays edge to edge |
|---|---|
| `.app-bar` | Surface, and the full 56px bar |
| `.form-step-header` | Surface, plus its `border-bottom` |
| `.action-bar` | Surface, plus its `border-top` |
| `.bottom-nav` | Surface, plus its `border-top`, plus the safe-area band below the tabs (D14) |
| `.sheet-scrim` | The whole dimmed area, insets included - see `shell.css` |
| `.bottom-sheet` | The card's left and right edges |
| `.action-bar-dock::before` | The 56px scroll-affordance fade |

Nothing *inside* either scroller is full-bleed, and nothing needs to be: the codebase contains no negative-margin breakout, so widening the wrapper could not strand one. Confirmed by sweeping all four stylesheets for negative horizontal margins - the only two negative margins in the codebase are D17's action-bar overlap and a `-1px` on a visually-hidden helper.

### The controls inside a full-bleed header move in; the header itself does not

**Decision.** `.app-bar` and `.form-step-header__title-bar` take horizontal padding of `calc(var(--screen-inset-x) - (var(--touch-target-min) - var(--icon-size-title3) * var(--text-scale)) / 2)`, and `.form-step-header__step-row` takes the plain inset. The action bar's buttons take `--screen-inset-x` too.

**Why the arithmetic rather than the plain token.** A leading control is a 24px title3 glyph centred in a 48px touch target (D1), so a cell laid flush against a 20px padding edge would sit the *visible* arrow at 32px - 12px further in than the heading beneath it. The expression subtracts that slack so the glyph's own edge lands on 20px and the touch target overhangs it symmetrically. `* var(--text-scale)` because the glyph grows at frame 33's Large text size while the 48px target does not: the slack is 12px at the default size and 10.2px at Large, and the glyph measures 20px at both. This is the identical correction `.bottom-sheet__close` already makes with its negative margins, written as the same expression so the two cannot drift.

**Why this is not a full-bleed exemption.** The bar's surface and border still span the whole screen, which is what makes it read as chrome. Only its controls move. The relationship restored is the one the Figma frames draw - frame 02's close glyph and its body copy share one left margin - which the old flush cell was already 4px short of and which the wider inset would otherwise have stretched to 8px.

Left alone deliberately: the 44px empty spacer cell opposite an action cell, which leaves `.app-bar`'s centred title 2px off the screen's centre. That is pre-existing Figma-drawn geometry, unchanged by this pass and unrelated to the edge inset.

### 768px and above keeps the same inset, and does not get a wider one

**Decision.** No breakpoint. The framed view uses `--screen-inset-x` / `--screen-inset-y` exactly as the frameless view does.

**Why.** At `>=768px` this app is not a fluid desktop layout: `shell.css` renders a fixed 393px phone mock inside a device bezel, centred on a canvas and scaled to fit the viewport height. There is no content column to cap or centre - the bezel already does both - so a wider "desktop" inset could only be applied *inside* the 393px phone screen, which would show a participant on a laptop a 329px content column where the same build gives a participant on a handset 353px. One screen would have two layouts, and the narrower one would no longer match the Figma frames that are this repo's system of record.

**A measurement note, so the numbers are not misread.** At 1280x900 the rendered inset measures 18.64px, not 20px. That is the mock's scale-to-fit transform (`0.9318` at that viewport height), not a different rule: `.screen-content`'s computed `padding-left` is `20px` at 1280x900, 1280x1000 and 1440x1080 alike, and at viewport heights of 1000px and up the transform is identity and the inset renders at exactly 20px.

**To reverse.** Add a `@media (min-width: 768px)` block redeclaring the two tokens on `:root`. Every consumer picks it up; no rule elsewhere needs to change. That is the whole point of them being tokens.

### Verified

`node --test scripts/overlap.test.mjs` (66 assertions, all 32 frames x both text sizes), `bottom-nav.test.mjs` (6), `sheet-drag.test.mjs` (15) and `src/model/*.test.js` (47) all pass unchanged. `scripts/inset-shots.mjs` measures the three insets and the glyph alignment on six views x two widths x both themes, and sweeps 320/375/414/768/1280px for horizontal overflow: none at any width, `scrollWidth === clientWidth` throughout and no child overhanging the phone screen by more than 0px.

---

## D24. In general mode the slider gets a ceiling, and `left-over` stays empty

**Decision.** `left-over` is **not** resolved for a participant who did not come through consent. It stays `null`, with `null` provenance, for the whole of that session. What frame 10 gains instead is a separately named local figure, `savingCeiling`, which is `left-over` when account activity was read and `GENERAL_SAVINGS_RANGE.max` (600) when it was not - the top of the published range frame 04's own slider already runs to, one screen earlier. Frame 10's guard drops `left-over` and keeps `deposit-target`. Closes `GAPS.md` G50.

**Why `left-over` itself cannot be filled in.** `build-spec.md` section 4 defines it as `money-in - essential-spending`, and both are read from twelve months of account activity. In general mode the bank has read nothing, so there is no derivation available and no partial one either. Writing a number into it would be inventing a figure - `CLAUDE.md`'s first IMPORTANT rule - and specifically inventing a figure about the participant's *income*, which is the exact thing they declined to share one screen earlier. It would also propagate: `left-over` is displayed and captioned as read-from-your-accounts on frames 05, 06, 12, 13, 20, 21 and 32, and every one of those captions would become false.

**Why the ceiling is a different question from `left-over`.** Frame 10 does not display `left-over`. It uses it as the maximum of a two-handle slider, as the divisor for the fill percentage, and as the `{max}` in one caption. The screen needs an upper bound for "what could you put aside each month"; it does not need to know the participant's disposable income. Those happen to be the same number once accounts are linked, and are not the same question when they are not.

**Why the published maximum, and not one of the other three options G50 listed.**

| Option | Why not |
|---|---|
| Skip step 2 in general mode, carrying frame 04's range straight to step 3 | Removes the step where a participant sets a figure, and would leave "Step 3 of 3" following "Step 1 of 3". The range on frame 04 answers a different question ("what could you save"), not "what will you put toward this deposit". |
| A plain currency input with no ceiling | Discards the constraint the slider exists to express, and makes general mode's step 2 a structurally different screen from the consent path's - two layouts for one route. |
| Gate the calculator on consent | Closes the general path rather than fixing it, and contradicts `build-spec.md` section 1's own frame 04 row, which routes "Continue with general figures" to frame 09. |

`GENERAL_SAVINGS_RANGE` is already a dated, sourced constant in `model/rates.js` (NatWest Savings Index 2026), already the bound of frame 04's slider, and already captioned there as a published average. Reusing its maximum introduces no new figure and no new source.

**Two figures ride along with it, both already held.** The slider's seed is `generalMonthlyLow`/`generalMonthlyHigh` - the range the participant themselves set on frame 04 - rather than `MOCK_POSITION.recentMonthlySaving*`, which is account-read data this session never had. Their provenance (`estimated`, or `entered` once a handle is dragged) carries into `monthly-low`/`monthly-high` unchanged.

**The condition tested is `left-over === null`, not `mode === 'general'`.** The calculator is reachable from `/goals` with no consent decision recorded at all, in which case `mode` is still `null`. `left-over` being empty is the thing that actually matters, and the thing that used to bounce.

**Two model corrections this exposed.** `monthsToTarget()` compared `savings-rate` against `left-over` without checking it existed, so a `null` ceiling read as `0` and rejected every positive saving rate as `exceeds-left-over`. And it read `saved-toward-deposit` as the starting balance with no fallback; general mode now projects explicitly from `0`, which is the assumption `generalAnnualRange()` already documents for frame 04. `monthlyAmountFromDate()` takes the same fallback so it stays that function's exact inverse.

**Copy that would otherwise have lied.** Making these screens reachable exposed captions asserting a source general mode has not got. Each gains a general variant keyed off the same test: frame 10's slider caption, its "Already filled in from your accounts" card heading and that card's two rows; frame 11's "Saved so far" row (an em dash and an explanation, and no Change link - the screen behind it guards on `left-over` and would bounce three hops back to consent) and its own two read-only rows; frame 12's two provenance captions; and the How-this-works card on frames 12 and 13, whose "What we read: your salary and your regular payments" rows are replaced by a set that says nothing was read. `savings-rate`'s provenance also stops being stamped `entered` unconditionally and now inherits from the pair it is the midpoint of, which corrects the consent path too.

**To reverse.** Restore the `left-over` half of frame 10's guard and delete `savingCeiling`. The general variants of the copy become unreachable but harmless.

---

## D25. The below-checkpoint tracker's forward action is guidance, and the locked row stays inert

**Decision.** Frame 15's action bar becomes two controls. The primary, "What a bigger deposit changes", opens frame 13 (Loan-to-Value) with `returnFrame` set to `/tracker`. "Adjust my goal" is kept and demoted to the secondary. The locked "Mortgage in Principle" milestone row is left exactly as it was: a `<button>` that preventDefaults, keyboard-reachable and explanatory only, per `build-spec.md` section 1's "Tap the locked row -> 15 (in place) -> explanatory only".

**The problem.** Below the checkpoint the screen's only action routed to `/calculator/review` - backwards, into step 3 of a calculator the participant had already finished. Every forward-looking control on the screen was either locked or absent, so the state had no onward move at all.

**Why frame 13 and not something else.** It has to be honest about where the participant actually is. The Mortgage in Principle route is genuinely not open - that is what the checkpoint means - so neither `/mip` nor frame 18 (whose own CTA continues into `/mip/pre-check`) can be offered. Frame 13 explains what a bigger deposit does to the rate bands the card immediately above it is already showing, which is the one thing on this screen that a participant below the checkpoint can act on understanding. It returns here rather than continuing anywhere, so nothing implies progress that has not happened, and no milestone changes state.

**Why it is guidance and not advice.** The label names what changes, not what to do. "Save more" or "Increase your goal" would recommend a course of action; "What a bigger deposit changes" describes a relationship and leaves the choice with the participant, which is the line `guidanceNotAdvice` already draws at the foot of the screen.

**Why the row stayed inert.** Making it live would have to lead somewhere, and everywhere it could lead is either the MiP route or a restatement of the caption it already carries. The forward path belongs in the action bar, where a screen's actions live.

**To reverse.** Set `primaryAction` back to `adjust-goal` for the not-unlocked branch and drop the secondary.

---

## Open questions

None remain open as of 20 August 2026. Nothing in D11-D19 (this session's shell, icon-set, frame 03, action-bar, sheet-gesture and sheet-header passes) opened a new one - each is a build-stage decision with a stated reason and a stated reversal, not a question left hanging.

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
| 20 August 2026 (screen tail) | D17 corrected on two counts: the scroller's reserve for the bar was being silently reset by a `padding` shorthand, leaving the last element on every overflowing full screen behind the bar; and the scroll affordance's fade spanned 193px of the screen in flat `--color-bg` rather than 56px at the bottom edge, which is what read as a blurred region below the last element. See `GAPS.md` G41. |
| 20 August 2026 (bottom inset) | D14 revised: the bottom safe-area inset now lives INSIDE the lowest chrome on every screen type — the tab bar, a lone action bar, or the sheet's action bar — rather than as a band beneath it on `.screen`. The chrome's background reaches the bottom of the phone screen; `.screen` keeps the inset only on 19b and 33, which have no bottom chrome. D11's original tab-bar arrangement is restored. See `GAPS.md` G40. |
| 20 August 2026 (sheet bottom) | D14 and D17 corrected: the sheet's bottom safe-area inset moved from `.sheet-overlay`'s padding (outside the card, which lifted every sheet off the bottom of the phone screen) to inside the card below its action bar; both insets now resolve from one `--safe-top`/`--safe-bottom` pair; and a sheet's content now scrolls under its own action bar via an out-of-flow dock. See `GAPS.md` G39. |
| 20 August 2026 (action bar) | D17 recorded: the action bar appears once the participant reaches the end of the content, on the 22 screens that overflow; the 7 that fit show it immediately. Deviation from the wireframes, exempt from the screenshot pass. Kept focusable and in the accessibility tree throughout — `opacity`, never `visibility: hidden`. |
| 20 August 2026 (sheet gesture) | D18 recorded: the grabber on all seven sheets drags, dismisses past a threshold and settles back short of it, and a drag closes by clicking the sheet's own dismiss control rather than navigating — so 13b's `ltvVideoSeen` and every other on-close state change happen exactly as they do on a tap. Asserted in a browser by `scripts/sheet-drag.test.mjs`. |
| 20 August 2026 (sheet header) | D19 recorded: 29-32's close control loses its circular background for the app's standard plain-glyph treatment, and the sheet heading moves into the header row beside it so the two align and the heading's column ends where the glyph begins. Deviation from the reference PNGs for the sheet header on those four frames, exempt from the screenshot pass. See `GAPS.md` G42. |
| 20 August 2026 (sheet head spacing) | D19 amended: the title row's top padding goes to `--space-2xl`, so the close control's 48px target clears the grabber by 15px instead of 7px and the heading starts 24px below it rather than 16px; `sheetHeaderHTML`'s `closeLabel` becomes optional and frames 03b and 10c adopt the header without a glyph, 13b taking the same 24px as scroller padding. No close control is added to a frame whose reference PNG does not draw one. |
| 20 August 2026 (assumptions links) | D20 recorded: where a screen drew two near-identical "how we worked this out" controls into the same sheet, one is removed (06, 12); where they go to different sheets, both stay and are reworded to name the figures they explain (12, 13, 15, 16). Frame 21's card nav row, unbound since it was built, now works. See `GAPS.md` G45. |
| 20 August 2026 (card disclosure) | D12 extended to `howThisWorksCardHTML` on frames 06, 12, 13, 20 and 21: closed on load, opening in place with scroll and focus held. Frame 06 now routes two collapsibles on `data-disclosure-id`. |
| 20 August 2026 (goals area) | D21 recorded: frame 06's "save for something else" branch now lands on `/goals`, the bank's own goals area, instead of returning to frame 01. Partially reverses `build-spec.md` section 3's exclusion of frame 07 - the generic savings-goal SCREEN stays excluded, only the branch's destination changes. New `goalHorizon` flag on the account data; no invented figures; no regulatory anchor, on the frame 01 precedent. Tab bar gains an `active` parameter and a live Goals tab. |
| 21 August 2026 (Goals tab) | D11 amended: Goals is a live tab - enabled, routing to `/goals`, lit while on that screen. Payments, Insights and Profile stay `disabled`. Frame 01 stopped rendering its own copy of the bar, which had left its tabs bound to nothing: `mountBottomNav` is the only renderer and the only binder now. See `GAPS.md` G47. |
| 21 August 2026 (tab states) | D11 amended again: the bar has three tab states, not two — active (indicator + bold label + filled icon + `aria-current`), enabled-not-active (identical to disabled at rest, darkens under a press), and disabled (`aria-disabled`, not focusable). A tab is active only where the route IS its destination, so `/home` and `/goals` light one and every other screen lights none. The old two-state split was an accident: no rule set `color` on a tab, so enabled inherited full strength and disabled was greyed by the user agent. See `GAPS.md` G49. |
| 21 August 2026 (Goals -> calculator) | D22 recorded: the /goals deposit card routes to frame 02 for a cold arrival and frame 08 only when `journeyStarted` AND `saved-toward-deposit` are both set, so it never hands off to a screen that will redirect; `goal` and `returnFrame` are written only once the destination is settled; and the pre-consent balances on /goals stay, because the bank already holds them and frame 03 asks for a different processing purpose. Closes `GAPS.md` G48. |
| 22 August 2026 (screen inset) | D23 recorded: the app's distance from the edge of the phone screen becomes two tokens, `--screen-inset-x: 20px` and `--screen-inset-y: 24px`, read by both scrolling content areas (`.screen-content`, `.bottom-sheet__content`) and by the action bar's buttons; content moves from 16px to 20px horizontally and 24px vertically, sheets from 24px to 20px horizontally so one edge has one inset. Header and tab-bar surfaces, their rules and the sheet scrim stay full-bleed; a header's controls move onto the content margin, restoring the alignment the Figma frames draw. No breakpoint at 768px - the framed view is a 393px mock of the phone, not a fluid column. |
| 21 August 2026 (Goals -> 09a) | D21 amended: the /goals card routes to frame 09/09a for everyone, setting `mode = 'general'` when `consentGiven !== true`, exactly as `build-spec.md`'s frame 04 row does. Replaces D22's /journey-for-cold-arrivals split, whose routing half is now superseded. Walked 09a to 12 in that state: 09a and 09 work, **frame 10 does not render** - it guards on `left-over` and loops back to 09 - and `build-spec.md`'s own frame 04 general path does the same. Recorded as `GAPS.md` G50, open. |
| 22 August 2026 (general-mode calculator) | D24 recorded, closing `GAPS.md` G50: `left-over` stays null for a session that never linked an account, and frame 10's slider takes its ceiling from `GENERAL_SAVINGS_RANGE.max` instead, seeded from the range the participant set on frame 04. Frame 10's guard drops `left-over` and keeps `deposit-target`. Two model fixes (`monthsToTarget`'s null-ceiling comparison and its starting balance) and general-mode caption variants across frames 10, 11, 12 and 13. Walked 04 -> 09a -> 09 -> 10 -> 11 -> 12 at 375px; the consent path's own 10/11/12 render pixel-identical to before. |
| 22 August 2026 (below-checkpoint tracker) | D25 recorded: frame 15's action bar gains a forward primary, "What a bigger deposit changes" -> frame 13 with `returnFrame` set, and keeps "Adjust my goal" as the secondary. The locked Mortgage-in-Principle milestone row stays inert. Neither the MiP route nor any milestone state changes. |
