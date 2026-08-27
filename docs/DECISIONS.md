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

**Correction, 22 August 2026: the diagram row was never removed, and is live.** The paragraph above
describes an intention that the build did not carry out. `git log -S"open-diagram" --
src/screens/learn-ltv.js` returns exactly one commit, `eb666a2` ("Build Figma page 04 Understanding
and tracking"), which **added** the row; nothing has ever taken it out. Frame 13's "Want more on
this?" card carries both explainer rows today, and **both of them open frame 13b**:

```js
['open-video', 'open-diagram'].forEach((action) => { ... window.location.hash = '#/learn/ltv/video'; });
```

The reason the build diverged is recorded in `learn-ltv.js`'s own header and is a better one than
this decision's: the reference PNG for frame 13 is annotated "Both open frame 13b", so the row is
not the dead end D8 took it for. It has a destination, and that destination is built. What is not
built is the diagram inside it, which is a placeholder in the Figma export as well as in the code -
see `docs/investigations/2026-08-frame-13b.md`.

The rest of D8 stands: 14 and 22-28 are still not built, and the "Talk to someone about it"
treatment in D10 is unaffected. Only the claim about the diagram row is wrong. "To reverse" above is
moot for the same reason - there is nothing to re-add.

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

> **SUPERSEDED by D39, 24 August 2026.** The bar is pinned and visible from first paint; there
> is no hidden state. The reasoning below is left intact rather than edited, because it is the
> argument D39 had to outweigh and the record of why is the useful part. What survives D39: the
> measured `--action-bar-height`, the content-scrolls-under-the-bar overlap, and the 56px scroll
> fade (moved above the dock). What does not: the hidden state, the reveal, the focus-reveal
> path, and the rise transition.

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

## D26. The general-mode tracker measures the plan, not the balance

**Decision.** Frames 15/16 gain a fourth variant, selected on `saved-toward-deposit` being null. It shows **no balance and no progress bar**, because there is no truthful figure to put in either. The headline figure becomes `deposit-target` - the goal the participant set - and the "This month" card is replaced by a "Your plan" card. Frame 16 has no general-mode counterpart and cannot have one. Closes `GAPS.md` G51.

### What the participant has actually done by the time they get here

Read out of `sessionStorage` at `/tracker` after walking 04 -> 09a -> 09 -> 10 -> 11 -> 12 -> "Save my goal":

| Done | State | Set by |
|---|---|---|
| Declined to link accounts | `mode: 'general'`, `consentGiven: null`, `accountAssignments: {}` | frame 04 / frame 03 "Not now" |
| Set a monthly saving range | `generalMonthlyLow/High` 150 / 288, provenance `estimated` | frame 04 slider |
| Entered a property value | `property-value` 280,000, `entered` | frame 09 |
| Chose a deposit percentage | `deposit-pct` 0.15, `entered` | frame 09 |
| Confirmed the monthly range | `monthly-low/high`, `savings-rate`, provenance inherited | frame 10 |
| Worked it out | `months-to-target`, `checkpoint-amount` | frame 11 |
| Saved the goal | `goalSaved: true` | frame 12 |

Null throughout: `saved-toward-deposit`, `emergency-fund`, `unassigned`, `money-in`, `essential-spending`, `left-over`.

### Why there is no progress figure, and why none was substituted

Every candidate was checked and every one fails:

| Candidate | Why not |
|---|---|
| `saved-toward-deposit` | Null. Nothing was read. |
| Zero | **The one worth writing down.** Frame 12 may legitimately PROJECT from a zero balance and caption it as an assumption ("starting from nothing"). A tracker headline reading "GBP 0" under "your deposit so far" is a different act: it is a claim about the participant. They may hold savings elsewhere. It would be a false statement, not a conservative one. |
| `MOCK_POSITION.thisMonthSaved` / `thisMonthInterest` | `accounts.js` documents both as directly-read account figures, provenance `read`. Substituting them would be exactly the fabrication this variant exists to avoid. |
| A published average of what first-time buyers have saved | No such constant exists in `rates.js`, and adding one would put a figure about somebody else on screen as this participant's progress. This is where the D24 `savingCeiling` precedent stops: a published constant can supply a *bound* the screen needs, never a *measurement* of this person. |
| Time elapsed since the goal was set | `goalSaved` is a boolean. The prototype holds no timestamp, and inventing one is inventing state. |

So the screen stops being a progress tracker and becomes a plan screen. That is the answer to "what does it measure": **the goal the participant set and what they said they would put toward it, with nothing claimed about where they currently stand.**

### What it shows, and where each figure comes from

| On screen | Source | Caption |
|---|---|---|
| `deposit-target` (headline) | `property-value` x `deposit-pct`, both entered | "Worked out from the 15% deposit you chose on a GBP 280,000 home" |
| `checkpoint-amount` | `CHECKPOINT_FRACTION` x `deposit-target` | "Unlocks at GBP 31,500, 75% of the goal you set" |
| Monthly range | `monthly-low`/`monthly-high` | "The range you set", or if the seeded range was kept, "The published range you kept. Source: NatWest Savings Index 2026" |
| `on-track-for` | `onTrackFor()` from that range | "Worked out from that range, starting from nothing, because we can't see what you've already saved" |
| Rate bands | `LTV_RATE_BANDS_BY_DEPOSIT_PCT`, a dated constant, x their `property-value` | unchanged from the consent path |

Nothing else appears. The "Saved" and "Interest earned" rows are gone rather than zeroed, per the rule that a figure without a source does not appear at all.

### The milestones

`['locked', 'locked', 'current', 'locked']`. Milestones 1 and 2 ARE the consent journey and neither happened, so both sit at `locked` - the dashed, not-started icon. They stay visible rather than being hidden: they are precisely the two things this session is missing, and seeing them is how a participant understands why there is no balance. "Deposit goal set" is genuinely `current`, the same state the consent path's own below-checkpoint variant gives it. The ladder is not linear in this mode and does not pretend to be. No milestone is `done`, because none of the four has been completed and left behind.

Milestone 4's body drops the consent path's "{gap} to go" - a gap needs a starting point - and says instead that linked accounts would be needed to tell them when they reach the checkpoint. The row stays inert, as D25 left it.

### Why frame 16 has no general-mode counterpart

Passing the checkpoint is a statement about a balance nobody has measured, so the variant is always `below-checkpoint` and the Mortgage in Principle milestone stays locked. This is not a limitation being worked around: `mip-pre-check.js` reads `money-in`, `essential-spending` and `saved-toward-deposit`, none of which exist here, so the MiP route could not run even if it were offered. D25's action bar - a guidance primary and a demoted "Adjust my goal" - is therefore the only action bar general mode ever sees, and it needed no change.

### Verified

Walked 04 -> tracker at 375px, screenshotting each step. All three consent-path tracker variants (below-checkpoint, checkpoint-reached, goal-met) render **byte-identical PNGs** to before, top and bottom of scroll, as do the consent path's own frames 10, 11 and 12. `scripts/overlap.test.mjs` gains a `15-general` frame and passes at both text sizes (68 assertions, up from 66); `bottom-nav` (6), `sheet-drag` (15) and `src/model/*.test.js` (47) pass unchanged.

---

## D27. A second guidance line for sessions where nothing was read, and the first one untouched

**Decision.** `content.shared.regulatory.guidanceNotAdvice` is not edited, to the character. A
second line is added as `content.shared.regulatoryAwaitingCheck.guidanceNotAdviceNoAccounts`, and
`src/regulatory.js` picks between the two. Eleven screens select: 04, 09, 10, 11, 12, 13, 13b, 15,
29, 30 and 32. Closes `GAPS.md` G52; opens G53, G54 and G55.

**The problem.** The checked line says `This is guidance based on your account activity.` That is
true wherever activity was read and false wherever none was. Frame 04 has carried it since the
build, when the participant has just declined to share anything, and since D24 and D26 the general
path reaches ten more screens that carry it.

### The three wordings drafted

Each keeps the second sentence word for word: `It is not financial advice and does not take account
of everything about your situation.` That sentence is the one doing the regulatory work, and none
of the three weakens it. What differs is the sourcing clause in front of it.

| | Wording | Read |
|---|---|---|
| **A** | This is guidance based on published figures and what you entered yourself. | Minimal delta. Keeps the checked line's exact frame ("This is guidance based on X"), makes one positive claim, and denies nothing. |
| **B** (used) | This is guidance based on published figures and what you entered yourself, not on your accounts. | A's claim plus an explicit denial of the one the checked line makes. |
| **C** | We have not read your accounts, so this is guidance based on published figures and what you entered yourself. | Leads with the denial and derives the sourcing from it. |

**B is the one in the build.** A participant reaching frame 04 has just declined to link accounts,
and one reaching frame 09 from `/goals` never saw the question. Neither has been told what the
figures on the screen are, and A leaves it to them to notice that "your account activity" has
quietly stopped being claimed. B says it. That matters more here than a shorter line, because the
thing under test is whether participants can tell where a figure came from - this line is part of
the instrument, not decoration around it. C says the same thing but leads with an absence, which
puts a negative first on eleven screens and reads as a warning rather than a provenance note.

**"Published figures", not "published averages".** The general path draws on
`GENERAL_SAVINGS_RANGE` (NatWest Savings Index 2026) and `AREA_AVERAGE_PROPERTY_VALUE` (UK House
Price Index 2026), which are averages, and on `RATES.bankRate` and `LTV_RATE_BANDS_BY_DEPOSIT_PCT`,
which are published rates and not averages of anything. "Published figures" covers both and
overclaims neither. The other half of the sentence, "what you entered yourself", is
`property-value`, `deposit-pct` and the monthly range - all typed or dragged by the participant.
No third source is named, because there is no third source.

**This line has not had a copy check, and is stored so that nobody can think it has.** The four
lines in `shared.regulatory` were transcribed verbatim from the reference PNGs. This one was
written here. It lives in a separate object, `shared.regulatoryAwaitingCheck`, under a comment
block headed `NOT FCA COPY CHECKED. AWAITING REVIEW.`, which keeps `regulatory` at the four-key
shape `SPEC.md` fixes for it and makes it impossible to pick the unchecked line up as though it
were one of the checked four. Open as `GAPS.md` G53 until it is checked.

### The test, and the half of it that is not D24's

`left-over === null` is D24's test, the one `savingCeiling` uses, so the sourcing claim and the
slider ceiling can never disagree about whether accounts were read. It is not `mode === 'general'`,
because the calculator is reachable from `/goals` with no consent decision recorded and `mode`
still null (G50).

On its own it is wrong on two of the eleven screens. `left-over` is committed by frame 05's
Continue, not by consent, so on the consent path it is still null while frame 05 is on screen - and
frame 05's own rows open 29 ("How we worked out your saving amount") and 32 ("Where these figures
come from") from there, before that commit. `left-over === null` alone would tell those two sheets
that nothing had been read, on a path where `money-in` and `essential-spending` had just been read
from twelve months of activity and are on the screen behind them. So the test is
`left-over === null && money-in === null`: `money-in` is set from `MOCK_POSITION` at consent and
stays null for the whole of general mode, which is what "nothing was read" actually means. On the
other nine screens the second half is a no-op, because there the two are null and non-null
together.

**Where the line is not conditional.** Frames 02, 03 and 03b carry it before either path has read
anything, and frame 05 carries it while `left-over` is still uncommitted. All four keep the checked
line unconditionally: switching them would change what renders on the consent path, and what the
line should say before the participant has decided is a copy question rather than a mechanical one.
Open as G55. The Mortgage in Principle screens (17 to 21, and the adviser stub) also keep it
unconditionally: general mode cannot reach them, because `mipUnlocked` is set only by the tracker's
checkpoint-reached variant and D26 established that general mode never renders it.

**What this pass did not fix.** Frames 29 and 32 make the same account-sourcing claim in their own
body copy, and 32 shows four named account balances from a caption in `content.js` to a participant
who declined to share any. That is five screen-owned strings on two frames rather than one shared
regulatory line, and it is open as G54.

### Verified

38 screens shot at 390px, before and after, with animation and scroll behaviour pinned so the
capture is deterministic (confirmed by two identical after-runs). All 54 consent-path shots are
byte-identical to before, the frame-05-mid-flow state included; the 12 that differ are all general
mode. Every one of the eleven screens renders the new line and every consent-path screen renders
the checked one, asserted from the rendered DOM rather than from the source. `overlap.test.mjs` (68),
`bottom-nav` (6), `sheet-drag` (15) and `src/model/*.test.js` (47) all pass unchanged.

**To reverse.** Point `guidanceNotAdviceLine` at `content.shared.regulatory.guidanceNotAdvice`
unconditionally, or revert the eleven one-line render-site changes and delete `src/regulatory.js`
and the `regulatoryAwaitingCheck` object. Nothing else reads either.

---

## D28. The account-linking choice is removed, and the app assumes connected accounts

**Date.** 22 August 2026.

**Decision.** There is no longer a decision to make about whether this bank may look at the
participant's accounts. It is their main bank, the accounts are connected, and the figures that
follow from that are seeded into the store when the session starts (`src/state.js`). Everything
that existed only to serve the alternative is deleted rather than routed around.

**What went.**

| Removed | What it was |
|---|---|
| Frame 04 and its route | `/consent/declined`, the general-figures screen reached by "Not now" |
| The choice on frame 03 | The consent statement checkbox, "Not now", and the "Are your main savings with us?" question with its yes/no row |
| Estimate mode | Frame 05b, the estimate banner on 03 and 05, the `'estimated'` provenance branch in `accountFigures`, and the `savingsWithUs` flag that selected it |
| General mode | `mode` in its entirety, the general-mode tracker variant (D26), the general captions on frames 10, 11, 12 and 13, and the incomplete-salary trigger on frame 19 |
| The second guidance line | `shared.regulatoryAwaitingCheck` and `src/regulatory.js` (D27, reversed) |
| Constants and model | `GENERAL_SAVINGS_RANGE`, `generalAnnualRange()`, `generalMonthlyLow`/`High` |
| State | `mode`, `consentGiven`, `consentStatementChecked`, `savingsWithUs` |
| Frame 33's "Data" control | Its three options were personalised, estimate and general; two are gone and a one-option control changes nothing |

**What stayed, and why.** Frame 03 keeps the accounts card, the select-all row and frame 03b.
Assigning an account to a deposit, an emergency fund or neither is real participant input, and the
provenance captions across the app depend on it: `accountFigures` still flips `saved-toward-deposit`
from `read` to `entered` the moment a participant changes what counts (D5). What frame 03 lost is
the framing, not the function - it is now "Your accounts", asking what each one is for.
`shared.regulatory.estimateDisclosure` also stayed: despite the name it is not the estimate-mode
line, and frames 12, 20 and 21 carry it unconditionally about a figure being an estimate rather
than an offer.

**Seeding moved, which is what made the deletion possible.** `money-in` and `essential-spending`
were seeded by frame 03's "Agree and continue" and `left-over` by frame 05's Continue, so every
screen ahead of those two could be reached with nulls - which is the whole reason general mode
existed (`GAPS.md` G50, G51). All of them are now seeded in `defaultState()`, from the same
`MOCK_POSITION`, `accountFigures()` and `leftOver()` the screens already used. Nothing computes a
figure in `state.js`; it calls the model. Three redirect guards that could no longer fire went with
it (`/position` on `money-in`, `/position/summary` on `left-over`, `/goal-check` on
`saved-toward-deposit`), as did `savingCeiling`'s published-range fallback on frame 10, which now
resolves to `left-over` unconditionally. Frame 05's Continue commits nothing that was not already
committed; it still writes an entered override, and typing over the figure still sets `entered`.

**Deviation from `build-spec.md`, recorded not applied.** Frames 03, 04 and 05b are in section 3's
inventory and section 2's variant table, section 7 lists five scenario controls, and Figma frame
names are the system of record (`CLAUDE.md`). `build-spec.md` is deliberately NOT edited: it
records what was designed, and this records what was built and why they differ. The reference PNGs
for 04 and 05b stay in `reference/frames/` for the same reason. Frames 03, 04, 05b and the
general-mode tracker are exempt from the screenshot-comparison pass.

**Closes** `GAPS.md` G51, G52, G53, G54 and G55, all by removal rather than by fix. **Reverses**
D26 and D27 and amends D24 (the ceiling stays, its fallback goes). G56's general-mode repro is
gone; the chart defect it describes is not, and it stays open.

**Reversal.** Restoring the choice means restoring frame 04, the branch on frame 03 and a null
state for the seeded figures - at which point every general-mode variant deleted here has to come
back with it. That is the point of doing it as a deletion: the two paths cost more than the second
path was worth in a study about where figures come from.

---

## D29. The browser's history is the navigation stack

**Date.** 22 August 2026.

**Decision.** Back is one operation with one implementation: `history.back()`, behind
`goBack()` in `src/router.js`. Every back affordance calls it - the app-bar leading cell, the
calculator's form-step header, and all seven sheets' dismiss control - and none of them names a
destination any more. Forward navigation is unchanged and still assigns the hash, which is what
pushes the entry that `goBack()` later pops.

**Why.** Participants test on a phone browser, so iOS edge-swipe-back and the Android back button
are in the session whether the prototype accounts for them or not, and neither can be pointed
anywhere except at the previous history entry. Any destination written into a screen is therefore
a second, competing answer to "where is back" that the gesture will contradict the moment the two
disagree. `returnFrame` was that second answer: a single-slot scalar in `sessionStorage` that
overwrites rather than stacks, read by ten screens each with its own hardcoded fallback for when
it was empty or stale. The history stack is a record of where the participant actually went; a
fallback is a guess made at build time about where they probably came from.

**A descent pushes; a lateral move replaces; a guard replaces.** This is the rule the rest depends
on, and it is a rule about the SHAPE OF THE MOVE, not about who made it:

| Kind of move | What it does | Why |
|---|---|---|
| **Descent** into a screen | pushes | There is a screen behind it, and back has to return there |
| **Lateral** between roots | replaces | There is not. The root being left has no place in the stack of the root being entered |
| **Guard** redirect | replaces | Same reason: the screen refused to render, so there is nothing behind it either |

Eleven state guards were converted, plus `/reset` and frame 19b's two timer transitions - see the
table below. Without this, one back tap unwinds a cascade rather than a screen: `GAPS.md`'s note
under G50 records frame 09's back travelling `#/goals -> #/calculator/property ->
#/position/summary -> #/consent`, three hops from one tap. Traced after the change, that same tap
moves one screen, and a cold arrival on `#/tracker` - whose guards chain four deep to
`/calculator/property` - now consumes no history at all.

| Converted to `location.replace()` | Why there is nothing behind it |
|---|---|
| Eleven state guards (frames 09b, 10, 11, 12, 13, 15/16, 18, 19, 19b, 20, 21) | The screen refuses to render and sends the participant somewhere they did not ask to go |
| `/reset` in `router.js` | A side-effecting pseudo-route. Left pushing, one back tap would land on `#/reset`, wipe the session and push forward again - an inescapable trap that also destroys the participant's data |
| Frame 19b's two timer transitions | A determinate processing state that resolves itself after 1400ms. Left pushing, back from a result screen would land on 19b, whose timer re-fires and pushes forward again |
| Tab-bar taps from a tab root (D40, 25 August 2026) | A lateral move between roots. Ten Insights/Goals switches built ten entries that swipe-back then walked one screen at a time |

> **SUPERSEDED PHRASING, kept because the wording was load-bearing and is cited elsewhere.** This
> rule was originally stated as **"Guards replace, user navigation pushes."** For every case that
> existed when it was written that is the same rule, and as a general statement it is wrong: it
> names WHO INITIATED the move, which was only ever a proxy for the thing that actually governs it.
> The proxy holds as long as every participant-initiated move is a descent. It breaks at the first
> participant-initiated move with nothing behind it - a tab-bar tap between roots - which the old
> phrasing can only classify as "user navigation", and would therefore have pushed. The axis was
> always descent versus lateral; the initiator was standing in for it. None of the guard
> conversions change, only the reason given for them.

**Cold start is handled once, structurally.** Deleting the fallbacks removes what a deep arrival
used to rely on, so `seedHistoryRoot()` in `router.js` puts `/home` behind a participant who lands
directly on a deep route, before the first render. The back control then always has somewhere real
to go, and no screen needs to know that. `history.length` is NOT the test for "nothing behind us",
however much it looks like it - a tab's own initial entry counts toward it, so the length is
already 2 on the first paint and the seed would never fire. This was measured, not assumed. The
test is `history.state`: every entry the router renders is stamped, a freshly-typed URL has a null
state, so an unmarked entry is one never visited before. The stamp survives a reload of the same
entry, which is what stops a mid-session refresh seeding a second root.

**Two behaviours changed as a consequence, and are accepted rather than worked around.**

*Frame 06's "save for something else" branch.* Back from `/goals` returned to frame 01 on the
reasoning (D21) that a participant who left the journey should not be dropped back into it. It now
returns to frame 06 when that is where they came from. The reasoning does not survive the move:
frame 06 is where swipe-back will take them regardless, so the only thing the written destination
could still change is whether the on-screen control disagrees with the gesture. The worry does not
materialise either - going back retraces a step, it does not undo a choice, and `goal` stays
`'other'`.

*A sheet deep-linked by URL.* Dismissing it lands on `/home`, the seeded root, rather than on the
parent screen its old fallback named. Opened the way a participant opens one - from a screen - it
returns to that screen, which is the case that matters and the one `sheet-drag.test.mjs` asserts.

**The drag rule is untouched, and `sheet-drag.js` is unmodified.** A drag still never closes a
sheet by itself; it synthesises a click on the sheet's own dismiss control (D18). Because that
control is now `goBack()`, the gesture inherits the change with no edit, and so does `router.js`'s
Escape handler, which closes through the same synthesised click. Tap, Escape and drag were traced
separately and land identically. 13b still sets `ltvVideoSeen` before navigating.

**`returnFrame` stays for now.** Removing it is a separate piece of work. It is still written by
~20 forward controls and still read by frame 03b's guard, frame 22's "Done" and frame 18's - none
of which are back affordances. Seven screens now declare a `returnHash` that nothing reads:
frames 10c, 13b, 18, 29, 30, 31 and 32.

**Reversal.** Restore an `onBack` parameter to `bindAppBarBack` and `bindFormStepHeader`, and give
each call site a destination again. The guard conversions should NOT be reversed with it - a guard
that pushes is wrong under either model.

## D30. The close X leaves the flow; the back chevron does not

**Date.** 22 August 2026.

**Decision.** The two leading controls are separated and mean different things. The back chevron
moves one screen, through `goBack()` (D29). The close X leaves the journey and returns to the
screen it was entered from - frame 01 or the goals area - through a new `exitFlow()` in
`src/router.js`. `appBarHTML` now emits `data-action="app-bar-close"` for the X and
`app-bar-back` for the chevron, and `bindAppBarLeading` (renamed from `bindAppBarBack`, which no
longer described what it does) wires whichever of the two a screen drew.

**Why it needed fixing.** D29 pointed every back affordance at one handler, correctly, and swept
the X in with them because `appBarHTML` gave both controls the same `data-action`. The glyph was
the only thing that differed. On all ten screens that draw an X it was a chevron wearing a
different icon, which is worse than either control alone: it advertises an exit and performs a
step.

**`journeyEntryPoint`, and why `returnFrame` could not do this job.** Nothing in the app recorded
where the journey was entered, so the state is new: `'/home'` or `'/goals'`, written once by
frame 01's "start-journey" and by the goals card, null for a session that never entered (a typed
URL, frame 33), which `exitFlow` falls back to `/home` on. `returnFrame` answers a different
question - it is a single scratch slot naming whichever screen opened the sheet you are looking
at, overwritten by roughly twenty forward controls, so on frame 21 it reads
`/mip/result/not-yet`. The X needs the one fact that does not change as a participant moves
through the flow.

**The sheet carve-out is structural, not a special case.** A sheet closes through
`[data-action="dismiss"]`, which is `goBack()` and lands on the screen underneath. That is a
different action from `app-bar-close` and never reaches `exitFlow`, so `sheet-drag.js`, the
Escape handler and the drag gesture all come through untouched - verified, not assumed. Frame
10c is the one crossing point: its X and "Keep going" dismiss the sheet, and only its "Leave"
exits, now to the entry point rather than a hardcoded frame 01. The calculator's form-step X
still opens 10c, so build-spec.md section 1's definition of leaving the calculator, and the
`journeyPaused` flag and retained drafts that go with it, are unchanged.

**`replace()` does not do what it was hoped to do, and this is the honest result.** The exit
replaces its entry rather than pushing, so the screen the X was pressed on does not sit on the
stack as the thing one back tap returns to. It does not unwind the flow, because `replace`
overwrites exactly one entry. Measured: goals -> calculator -> step 3 -> X -> Leave lands on
`/goals`, and one back tap from there lands on `/calculator/review` - the step before the one
exited from, still inside the flow. Pushing instead would be worse (back would land on the 10c
sheet). Genuinely leaving the flow behind needs `history.go(-n)` to the entry point's own entry,
which means tracking flow depth; that is a larger change than this correction, and is not done
here. Recorded rather than papered over.

**What is deliberately NOT changed.** The chevron, the sheet X, Escape, the drag dismiss and the
guard redirects, all verified in D29 and re-verified here.

**Glyphs that now read oddly, reported not changed.** Frame 13 (`/learn/ltv`) is reached from
three places - frame 09's LTV info link, frame 12's, and frame 15/16's "What a bigger deposit
changes" - and is an explainer in all three, not a flow boundary. Its X exits to the entry point,
so a participant reading it from the tracker is returned to the goals area rather than the
tracker. Frame 33 (`/settings`) is facilitator-only and outside the journey; its X now follows a
`journeyEntryPoint` the facilitator did not set. Frame 22 (`/mip/adviser`) is an end-of-flow
confirmation whose X exiting is arguably right and whose "Done" already goes elsewhere. All three
want a glyph decision rather than a handler change.

**Reversal.** Point `app-bar-close` at `goBack` and the two controls merge again.

---

## D31. Rates are explanatory everywhere; frame 13 keeps a link of its own

**Date.** 22 August 2026.

**Decision.** No rate in this build is adjustable, and no row carrying one presents an affordance
that says otherwise. Four "Change" links are removed - the savings interest rate and the tax rate
on frames 10/10b and 11 - and frames 15/16's rates-card heading stops being a `<button>`. All six
values stay on screen with their provenance captions unchanged.

**Why.** The four links never edited anything: neither figure has an owning editable screen, so
both routed to frame 32 to explain where the figure came from. A "Change" link that explains
rather than changes is the row-is-either-editable-or-explanatory rule broken in the direction that
misleads - it invites a participant to try, and a think-aloud study will surface that as confusion
about what the prototype will let them do. The rates-card heading is the same fault in a different
shape: a heading that is also a button says the rate figures beneath it are tappable.

**What was NOT removed, and why.** Frame 13 (Loan-to-Value) and frame 13b stay. They are
comprehension content, they change no rate, and their comparison table is fixed. Removing the
rates-card heading alone would have made frame 13 unreachable from frames 15/16 at and above the
checkpoint: below the checkpoint D25's primary CTA reaches it, but at checkpoint-reached and
goal-met that CTA becomes "Check my Mortgage in Principle" and the heading was the only route
left. So the heading's job moves to an `infoLink` below the card, the same component, position and
treatment as the "How we worked out these rate figures" link already sitting there.

It carries the wording D25's CTA already uses - "What a bigger deposit changes" - because it opens
the same screen, and because it says what frame 13 explains rather than naming it. The link is
rendered only in the two unlocked variants: below the checkpoint the CTA already carries that exact
label, and two controls with identical wording on one screen is what `goal-check.js`'s "one link to
frame 29, not two" already ruled out.

`savings-rate` is not a rate and was not touched: build-spec.md section 4 defines it as the monthly
amount put aside, and frame 10's slider and 10b's date stepper stay adjustable. Deposit percentage
selection stays adjustable. Frame 11's other four rows keep their "Change" links.

**Reversal.** Restore `changeLabel`/`changeAction` on the four rows and turn the heading back into
a button. The `infoLink` would then be the duplicate, and goes.

## D32. Three screens take the chevron back, and the exit unwinds the flow

**Date.** 22 August 2026.

**Decision.** D30 gave the close X its own meaning - leave the journey, return to where it was
entered. Three of the ten screens carrying an X were not flow boundaries and are corrected to the
back chevron, which means `goBack()` and no other change. Separately, the exit itself stops
overwriting one entry and goes back over the flow's own entries instead.

**The three glyph corrections.**

| Frame | Why the X was wrong |
|---|---|
| 13 `/learn/ltv` | An explainer on all three routes in - frame 09's LTV link, frame 12's, and frames 15/16's "What a bigger deposit changes". Being ejected to frame 01 or the goals area after reading it lost the participant's place, worst from the tracker, which is a screen they return to and orient themselves on |
| 33 `/settings` | Facilitator-only and outside the journey, so its X followed a `journeyEntryPoint` no facilitator ever set. The chevron also gives back-to-profile for nothing when a hidden gesture in from the profile screen arrives |
| 22 `/mip/adviser` | A terminal confirmation reached only from frames 20 and 21. D10 makes the adviser route an addition to the result, offered because MCOB 4.8A and the Consumer Duty support outcome require it be offered - so finishing with it belongs back on the result, not out of the journey |

Frame 22's "Done" moves to `goBack()` with it, dropping its `returnFrame` read and its push. Both
its controls are the same journey and are now the same call, and back from the result screen no
longer returns to the confirmation the participant just finished with - verified. The screen's own
header comment claimed `returnFrame` as the mechanism behind SPEC.md's back-route requirement; the
requirement still holds and the comment now says how.

**The exit unwinds, and this is the second attempt at it.** D30 used `location.replace`, which
overwrites exactly one entry, so the flow's earlier screens stayed on the stack and one back tap
from the entry point landed back inside the flow just left. `exitFlow` now records
`history.length` at entry, beside `journeyEntryPoint`, and goes back by the difference.

**Measured, because it is an approximation and was not going to be trusted otherwise.** Entering
from the goals area: length 3 at entry, 7 at the exit, so back 4, landing on `/goals` - and one
further back reaches `/home`, the seeded root, rather than `/calculator/review` as before.
Entering from frame 01: length 2 at entry, 11 at the exit, back 9, landing on frame 01.

**What it does not guarantee.** `history.length` counts forward entries as well as back ones, caps
at 50 in Chrome, and a push made after going back truncates the forward entries - so the
difference can understate the depth. It is not a running index. The guards leave it alone, because
they `replace` rather than push and so add nothing to count, which is D29's rule paying off here.
A missing, zero or negative delta falls back to D30's `replace`, landing on the right screen with
the old limitation rather than throwing the participant somewhere unrelated. No depth tracking was
built: a known limitation is worth more than new machinery in a research prototype.

**One consequence worth stating.** Exiting to frame 01 leaves the participant at the root of the
history, so a further back leaves the prototype. That is not new - frame 01 has always been the
first entry of a session and has always behaved that way - but the exit makes it easier to reach.

**Not changed.** The chevron, the sheet X, Escape, the drag dismiss and the guard redirects, all
verified in D29 and D30 and re-verified here. Frame 18 `/mip/about` keeps its X and is the one
remaining screen where the same question could be asked - see `GAPS.md` G58.

**Reversal.** Set the three screens back to `left: 'close'`, and drop the `flowEntryHistoryLength`
branch from `exitFlow` to return to D30's `replace`.

---

## D34. Every figure states its source, and shared figures share one caption

**Date.** 22 August 2026.

**Decision.** Every figure shown to a participant carries a provenance caption naming where the
value came from: read from an account, entered by the participant, worked out from named values,
or a dated constant in `rates.js`. `figureRowHTML`'s trailing mode gained an optional caption to
make this possible; it was the one figure-bearing component with no caption line, which is how
frame 08's savings interest rate came to be shown with no source at all.

**Three captions were not missing but wrong**, which is worse: a caption naming the wrong source is
a false statement about a participant's own figure, and it is believed.

- *The savings interest rate is not read from any account.* Frames 10, 10b, 11 and 32 said "Read
  from your instant saver" or "The rate on your Instant saver". There is no AER anywhere in
  `model/accounts.js`. The value is `RATES.bankRate`, a dated constant anchored to the Bank of
  England Bank Rate (D3) - which is what frames 29 and 30 have always said. The app stated two
  incompatible origins for one figure. The Bank Rate anchor is the deliberate decision, so the code
  was right and the captions were the error. All four now resolve `{source}` from `RATES.source`
  rather than naming a source in prose, so a caption cannot name a source the model did not use.
  The claim had also propagated into a code comment in `accounts.js`, which cited frame 10's caption
  as evidence; left alone it would have re-seeded this, so it is corrected too.
- *Essential spending was described three ways.* Frames 05 and 06 said "direct debits, standing
  orders and card payments"; frame 32 said "Direct debits and standing orders, averaged over the
  last 6 months" - a different set of sources and an averaging window. Frame 32 is the screen a
  participant opens to settle exactly that question. One shared key now, carrying the frames 05/06
  wording: it is what two of the three already said, it agrees with the how-this-works row, and it
  drops an averaging claim that nothing in the code performs.
- *Frame 12 used one caption key for two different derivations.* The same string sat under the
  deposit range (property value x 5% and 15%) and under the timing figures (what you have set aside
  and what you are putting away). It was true of the second and false of the first.

**Shared rather than per-screen.** `bankRateCaptionTemplate`, `essentialSpendingCaption` and
`leftOverCaption` are in `shared`. All three were previously duplicated per screen and two had
already drifted. A sourcing statement written twice is the pair that drifts, and this pass exists
because it did.

**Wording chosen rather than followed.** Existing captions use "Read from" for a value taken from an
account and "Worked out from" for a derived one, and every existing derived caption names a single
source. Six figures needed captions naming TWO values, which no existing caption did:

| Figure | Caption |
| --- | --- |
| 20 property up to | Worked out from the most you could borrow and what you have saved so far |
| 20 Loan-to-Value | Worked out from the most you could borrow and the most you could pay for a property |
| 21 what you would need to borrow | Worked out from the property value you set and what you have saved so far |
| 21 what a lender would offer | Worked out from the property value you set and your deposit goal |
| 21 the gap | Worked out from your deposit goal and what you have saved so far |
| 12 deposit range | Worked out from the property value you set |

Each names the values, never where they sit on screen. "The top of the range above" and "beside it"
break the moment layout or text size changes, and mean nothing read aloud.

One caption departs further and is recorded as a deliberate exception. Frames 15 and 16's rate-band
rows carry two figures from different sources on one line - a deposit amount derived from the
property value, and a rate band from `rates.js`. A bare "Worked out from the property value you set"
would appear to claim the rate as well, so it reads **"Deposit amounts worked out from the property
value you set"**. It is the only caption that names which figures it covers, and it does so because
the row would otherwise mis-state the source of the figure beside it.

**`savings-rate` is a monthly amount, not a rate** (`build-spec.md` section 4), and the name had
caused exactly one wrong caption: frame 21's "Around {months} at your current rate", where `months`
is solved from the monthly amount being put aside. It now uses frames 15/16's wording for the same
figure, "at what you're putting aside each month". No other caption mistook it for a rate. The
variable is not renamed here - `build-spec.md` is the system of record for its name.

**What still carries no caption, deliberately.** Frame 19's "About 10 minutes" and "Usually 90 days"
are policy statements, not figures. Frames 20 and 21's borrowing ranges are sourced by their own
"Based on / salary, deposit and commitments" row plus the estimate disclosure, so a caption would
repeat what the next row says. Frames 15/16's rates range figure is captioned "Typical market rates
at {ltv} Loan-to-Value" and sits above two further lines about what those rates are and are not.
The assumptions sheets state their sources as sentences. Frame 13's comparison table is governed by
one caption naming the term and basis.

**Reversal.** The component change is additive - a row that passes no caption renders exactly the
markup it did before. Reverting the copy means restoring the per-screen keys, which restores the
drift.

---

## D33. The savings-location question is confirmed gone, and the spec now says so

**Date.** 22 August 2026.

**Decision.** Frame 03's question about whether the participant's savings are held with this bank,
its two options, and every screen and state reachable only through them were deleted under D28.
This entry is the verification that nothing survived in code, plus the part D28 deliberately did
not do: `build-spec.md` still documented the question, the branch and the frames as live, and now
does not.

**What the question was, and what was reachable only through it.** Recorded here because D28's
change log lists the deletions without naming the branch as a branch:

| Removed | Where it was |
|---|---|
| The question and its two options, "Yes, they're with you" / "No, they're elsewhere" | Frame 03 |
| 04 Consent declined, and the general saving range it carried | `/consent/declined` |
| 05b What we can see - estimate mode | `/position?mode=estimate` |
| Frame 10's general-mode variant, which never rendered | `GAPS.md` G50 |
| `mode`, `savingsWithUs`, `consentGiven`, `consentStatementChecked` | `state.js` |
| `GENERAL_SAVINGS_RANGE`, `generalAnnualRange()` | `model/` |
| `src/regulatory.js` and `shared.regulatoryAwaitingCheck` | whole file, one key |
| Frame 33's "Data" control, whose three options were the modes | `/settings` |

**What depended on the answer, and what each value now is.** This is the part worth being able to
find again, because every one of these is a figure a participant sees:

| Figure | What the answer changed | What it is now |
|---|---|---|
| `money-in`, `essential-spending` | Provenance `read` where the accounts were with the bank, `estimated` where they were not - frame 05 against 05b | Always `read`, seeded at session start from `MOCK_POSITION` |
| `left-over` | Derived from those two, or never derived at all on the declined path, where it stayed null | Always `derived`. £380, from £2,240 less £1,860 |
| `monthly-low` / `monthly-high`, the frame 10 slider ceiling | `left-over` in personalised mode; `GENERAL_SAVINGS_RANGE.max` in general mode, because `left-over` was null (D24) | Always `left-over`. `calculator-saving.js` reads `state['left-over'].value` and has no fallback |
| The annual saving range on frame 04 | `generalAnnualRange()` - monthly x 12, no interest | Gone with the frame. The calculator's interest-bearing projection is the only one left |
| The guidance-not-advice line | `regulatory.js` selected a second, uncleared line when nothing had been read (D27) | Gone. The FCA-checked line applies on every screen that carries one |

No figure changed value. Each default above is what the consent path already produced, so the
numbers in a session are the numbers D28's surviving path produced before this was written down.

**The spec change.** `build-spec.md` sections 1, 2 and 7 lose the rows for the question, its two
options, the two "Agree and continue" destinations, "Not now", all six frame 04 transitions, the
three `savingsWithUs` variants, both frame 04 state rows, the 05b variant row, frame 10's
general-mode row and frame 33's Mode control. The combined "05 / 05b" rows become "05". Section 1's
frame 03 continue row now names what it actually commits.

Section 3 keeps frames 04 and 05b with their route cleared and a status of "Removed - DECISIONS.md
D28", rather than deleting them. Section 3 is the Figma-to-route mapping and the file's header
makes frame names the system of record; those frames are still drawn in Figma, and a moderator
comparing the prototype against the wireframes needs to see that the frame was dropped deliberately
rather than missed. Section 3 already used a status of "Remove" for frame 07 on the same reasoning.
This is a status in the file's own column, not a flag hiding live behaviour - sections 1, 2 and 7
describe what the prototype does, and their rows are gone.

**Not changed, deliberately.** `GAPS.md` is an audit log of what was found and when, not a live
spec. Its G1-G11 enumeration quotes `build-spec.md` section 2's "No frame drawn" rows as they stood
and now predates the removal of two of them; G18 quotes a frame 04 transition. Editing either would
falsify a dated record. The count is stale by design, not by oversight.

**The D32 collision, since resolved.** When this entry was written `DECISIONS.md` carried two
entries numbered D32 - the chevron corrections and the provenance captions - both already
committed, with code comments citing "D32" for the second. Renumbering then would have touched
files with uncommitted work in them, so this entry took D33 and left the collision visible. It was
resolved on the same day: the chevron entry keeps D32, having been recorded first, and the
provenance entry became D34.

**Reversal.** The code is already the reversal point: nothing was deleted here. Restoring the
question means reversing D28, which its own entry covers. Restoring the spec rows means reverting
this commit's `build-spec.md` change alone.

---

## D35. The Mortgage in Principle flow becomes reachable: Insights lights the tracker, and the tracker is its only door

**Date.** 22 August 2026.

> **Amended 25 August 2026 (D40).** `journeyEntryPoint` is the FLOW entry point, not the screen
> arrival route, and the two must not share a variable. It answers "which screen does the close X
> leave this flow to", written once when a flow is entered and left alone as the participant moves
> through it (D30). "Which route did the participant reach this screen by" is a different question,
> answered per history entry by `isRootEntry()` (D40), and overloading one variable with both would
> make the X's destination depend on how the tracker was opened rather than on where the flow began.
>
> So this entry stands unchanged: the tracker writes `journeyEntryPoint: '/tracker'` when its action
> bar opens the Mortgage in Principle flow, and the X on frames 17, 18, 19b, 20 and 21 returns to
> the tracker from BOTH routes into it - the Insights tab and the goals card alike. A proposal to
> have the X follow the route in was considered and dropped on that basis.

**Decision.** The Insights tab resolves to `/tracker`, the tracker's action bar is confirmed as the
single entry into the Mortgage in Principle flow, and that flow now exits back to the tracker rather
than out to frame 01. Two copy corrections come with it: the entry no longer claims the prototype
issues a decision in principle, and frames 19 and 19b no longer claim a check runs inside this
build.

**What was already there, and was not rebuilt.** All six screens (17, 18, 19, 19b, 20, 21) existed,
were registered in `router.js` and were already wired to each other, including both result branches
and both sides of the explainer. The flow was unreachable for one reason only: nothing navigated to
`/tracker`, and `/tracker` was the only screen that navigated to `/mip`. This entry adds the missing
link into the tracker, not the flow behind it.

**Insights is the third live tab.** `NAVIGABLE_TABS` gains `insights: '/tracker'` and
`TAB_FOR_ROUTE` gains `['/tracker', 'insights']`, so the tab resolves and lights on its own
destination the way Home and Goals already do. Payments and Profile stay `disabled`. Three things
had to move with it:

| Change | Why |
|---|---|
| `diamondFill` added to `icons.js`, registered in `TAB_ICONS_ACTIVE` | The map held filled twins for Home and Goals only. `bottomNavHTML` looked up `TAB_ICONS_ACTIVE[id]` for an active tab and called the result, so making Insights live without a filled diamond made that `undefined(...)` and threw the whole tab bar on the one route the tab is lit. |
| `bottomNavHTML`'s glyph lookup falls back to the outline drawing | Same defect, made unreachable rather than merely fixed. A live tab with no filled twin now loses a cue instead of taking the bar down. |
| The tab hint stops being a ternary | `id === 'home' ? homeTabHint : goalsTabHint` returned "Your goals" for every tab that was not Home. Correct while Goals was the only other live tab; Insights would have announced itself as Goals. Now a lookup by tab id, with `insightsTabHint` added to `shared.bottomNav`. |

`/tracker` guards on `checkpoint-amount` and `deposit-target`, so a participant who taps Insights
before setting a goal is replaced through `/calculator/result` -> `/calculator/review` ->
`/calculator/saving` -> `/calculator/property`. Four `replace` hops, one history entry, one back tap
(D29). Left as it is: the guards are correct, and gating the tab would reintroduce the conditional
navigation PN removed.

**One door into the flow, and it is the action bar.** The instruction for this pass described the
Mortgage in Principle milestone row as a live link and cited `tracker.js:220-224`. Neither held:
those lines are the `actionBarHTML` call, and the milestone row was a plain `<div>` in the unlocked
state. `reference/frames/16` draws exactly that split, and it is the right one - the milestone
tracker reports progress, the action bar acts. Confirmed rather than changed, on the author's
decision once the discrepancy was put to them.

What did change is the locked row. It carried `action: 'locked-row-noop'`, which made
`milestoneTrackerHTML` render it as a `<button>` with `cursor: pointer`, keyboard focus and no
behaviour. `build-spec.md` section 1's "Tap the locked row -> 15 (in place) ... explanatory only" is
served better by a row that does not offer the tap, and a focusable control that does nothing is a
dead end rather than an accessibility gain. Both states are plain rows now. The MIP button is
absent, not disabled, below the checkpoint: the locked action bar carries D25's "What a bigger
deposit changes" and "Adjust my goal" instead.

**Exiting returns to the tracker.** The close X on 17, 18, 19b, 20 and 21 goes through `exitFlow()`,
which reads `journeyEntryPoint` - written only by frame 01 and the goals card, so a participant who
reached the tracker through the Insights tab had `null` there and would have been dropped on
`/home`. The tracker's entry handler now writes `journeyEntryPoint: '/tracker'` and
`flowEntryHistoryLength` on the same click, exactly as `home.js` and `goals.js` write the pair when
the journey itself is entered. D30's mechanism is reused unchanged; what widens is the set of values
`journeyEntryPoint` can hold, from two screens to three. Walked in a browser: all five X-bearing
screens land on `/tracker`, and back still steps one screen per tap.

**Copy: the entry stops claiming a decision in principle.**

| Key | Was | Is |
|---|---|---|
| `/tracker` `checkpointReachedCta` | "Check my Mortgage in Principle" | "Check what a lender might lend you" |
| `/tracker` `readyToCheckLabel` | "Ready to check" | "An indication of what a lender might lend you. Not a decision, and not an application." |

The possessive in the old label was the problem: it read as though the prototype produces a decision
in principle addressed to the participant. The caption was doing no work beyond repeating that the
door was open, which the milestone row above it already says, so it becomes the supporting line the
label needs - what the participant gets, and the two things it is not. Deviation from
`reference/frames/16`'s button wording, recorded here.

**Copy: frame 19 is the boundary of the prototype and now says so.** No check runs in this build.
The handoff opens the bank's existing Mortgage in Principle tool, and 19b is the wait for what comes
back from it.

| Key | Was | Is |
|---|---|---|
| `/mip/pre-check` `primaryCta` | "Start the check" | "Open the Mortgage in Principle tool" |
| `/mip/pre-check` `handoffNote` | (new) | "This opens our Mortgage in Principle tool. The next screen you see here is the result that comes back." |
| `/mip/running` `title` | "Checking your details" | "Waiting for your result" |
| `/mip/running` `body` | "This is a soft credit search and will not affect your credit score." | "The Mortgage in Principle tool is running a soft credit search. It will not affect your credit score." |

`handoffNote` renders as `.body-text` directly below the three disclosures and above the two
regulatory lines: it is the substance of the step, not a footnote to it, and Rule 4 of the copy
check would have caught it at `.legal-text`. The soft-search fact is kept in both places, attributed
to the thing that performs it. `checkRunAt` and `softSearchRecorded` are still set on that tap,
unchanged - `build-spec.md` section 1's "Run the check -> checkRunAt set; soft search recorded"
records that the participant reached the handoff, which is what 19b and the result screens read.
Deviation from the frame 19 and 19b wireframe copy, recorded here.

**What was asked for and deliberately not built.**

- **A knowledge check on frame 17.** The instruction described one and asked that it route
  correctly. There is no knowledge check in the code, in `build-spec.md` (whose frame 17 rows are
  the learn-more link to 18 and a primary continue to 19, and nothing else) or in Figma node
  `104:196`. Building one meant inventing a question, two options and their copy, which CLAUDE.md
  forbids without asking. Put to the author, who confirmed it came from a stale summary and should
  not be built. The routing outcome it was meant to produce already works: the learn-more link
  reaches the explainer, the primary skips it, and both converge on frame 19.
- **A tracker entry on the goals page.** Out of scope for this pass (P11c). Confirmed absent:
  `/goals` has the deposit calculator entry and nothing else.
- **A direct MIP entry on the goals page.** Confirmed absent and must stay absent. No screen outside
  the tracker carries a `#/mip` link, and the tab bar carries none.

**On the figures the flow reads.** `mip-pre-check.js` reads `money-in`, `essential-spending` and
`saved-toward-deposit`. All three are seeded in `defaultState()` at session start from
`MOCK_POSITION` and `accountFigures()` (D28), before any screen renders, so none can be null on any
route into the flow - including a direct arrival from the goals page, were one added. Nothing had to
be defaulted and nothing had to stop.

**Tests.** `scripts/bottom-nav.test.mjs` gains optional `sessionStorage` seeding, a `/tracker` case
in the active-cue loop (the case that would have caught the missing `diamondFill`), Insights in the
mid-journey at-rest comparison, and an assertion that Payments and Profile stay inert on every
route. 8 tests, all passing. `overlap.test.mjs` 62 passing across both text sizes, which covers the
new paragraph on frame 19 and the longer caption on 15/16. `sheet-drag.test.mjs` 15 passing. Model
suites 43 passing.

**Reversal.** Remove `insights` from `NAVIGABLE_TABS` and `['/tracker', 'insights']` from
`TAB_FOR_ROUTE`, and the tab is inert again. Remove `journeyEntryPoint: '/tracker'` from the
tracker's entry handler, and the X reverts to leaving the journey. Restore
`action: 'locked-row-noop'` and its handler, and the locked row is a button again. The four copy
keys revert independently of all of that. `diamondFill` and the glyph fallback should stay in either
case: one is a drawing, the other is a guard against the same defect recurring.

---

## D36. Frame 18's timeline is built, and it is a process sequence - NOT a progress indicator

**Date.** 22 August 2026.

**READ THIS BEFORE REMOVING IT.** `DESIGN.md` excludes linear progress bars and segmented bars for
proportions. The process timeline on `/mip/about` is neither, and a design-rule sweep that reads
"four connected steps" as "a bar" and deletes it would be removing the thing the frame was always
specified to carry. The distinction is structural, not cosmetic, and it is written down here, in
`components.css` above `.process-timeline`, in `ui.js` above `processTimelineHTML`, and in
`mip-about.js`'s header - four places, because removal by misidentification is the most likely thing
to happen to this component.

| A progress indicator | This |
|---|---|
| Horizontal, like every bar in this app | Vertical |
| A track with a filled portion | Discrete nodes joined by a hairline connector |
| Divided into parts, or filled to a fraction | Neither. Nothing is divided and nothing is filled |
| Measures something - a value, a percentage, a position between two ends | Measures nothing. Four named stages of buying a house, the same four for every participant |
| Has a completed state | Has none. A step is `current` or `ahead`, and nothing is ever ticked off |

**What it replaced.** The Figma frame drew a placeholder reading `[Visual aid]` with the diagram
specified beneath it: "Timeline: Mortgage in Principle, then offer on a property, then full mortgage
application, then formal offer - showing where in the process this sits". The coded screen carried
that placeholder verbatim, in `visualAidLabel` and `visualAidCaption`. Both keys are gone and the
markup with them.

The `[Visual aid]` string still exists once in `content.js`, under `/learn/ltv/video` - frame 13b's
own placeholder for the Loan-to-Value diagram, a different screen and a separate piece of work. The
`.visual-aid-placeholder` CSS stays for the same reason.

**The `.media-placeholder` above the timeline is untouched and stays a placeholder.** It is not a
gap waiting to be filled: this prototype has no video and should not appear to have one.

**Vertical, not horizontal, and why.** At 320px the content column is 280px after the screen inset
and 248px inside the card. Four horizontal columns would be 62px each; "Full mortgage application"
does not set in 62px at footnote size without truncating or dropping below the type scale, and the
instruction's own preference was to stack rather than shrink the type. Stacking is also what makes
the shape unmistakable from a bar, so the constraint and the semantics pointed the same way.

**The four labels.**

| # | Label | State |
|---|---|---|
| 1 | Mortgage in Principle | `current`, filled node, visible "You are here" |
| 2 | Offer on a property | `ahead` |
| 3 | Full mortgage application | `ahead` |
| 4 | Formal mortgage offer | `ahead` |

Three are the specification's own wording. The fourth is not: the specification says "formal offer",
but "offer" already means the buyer's offer at step 2 and the lender's offer at step 4 is a
different thing. "Mortgage offer" is wording this screen already carries, in
`shared.mipAgreementNotOffer` ("An agreement in principle is not a mortgage offer"), so naming it
introduces no term the screen has not already used.

**Steps ahead do not read as completed.** Every label is the same colour. Only the font weight and
the node glyph change between states. This is deliberate: if the current step were darker than the
ones ahead of it, a four-step list with the first one dark would read as "filled up to here", which
is precisely the progress reading the component must not have. Position is carried by the filled
node, the bolder label and the "You are here" note, none of which implies completion.

**The glyphs are real vectors.** `circle` (an existing icon, the empty ring already used on frame
19) for a step ahead, and a new `circleDot` for the current one - a ring with a solid centre,
constructed the way `targetFill` is, because two sibling circles cannot share a `fill-rule` and
filling both would give a blob. Deliberately not a checkmark and not a star: reaching this screen
completes nothing, and `starCircleFill` means "milestone done" on frames 15 and 16. No emoji, no
image, no typed character.

**Not interactive, and proved so.** Every element is a `<p>`, `<li>` or `<div>`. No button, no link,
no `tabindex`, no `data-action`, no pointer cursor. Verified by walking the screen's whole tab order
25 times in a browser and confirming focus never enters the component.

**Accessible.** An `<ol>`, so a screen reader announces four numbered items in order rather than
four unrelated lines; `aria-labelledby` names the list from its own heading; the current step
carries `aria-current="step"` **and** a visible "You are here", so the participant's position
survives both a reader that ignores `aria-current` and a participant who cannot see which node is
filled.

**No new tokens.** Colour, spacing, radius and type all come from the existing scales. The connector
is 1px, the same hairline weight as `.divider` and `.milestone-row__divider`, so it introduces no
new width either. The node is centred on the label's first line with
`calc((var(--text-subheadline-line) - var(--icon-size-body) * var(--text-scale)) / 2)` - two
existing tokens, no magic number - so the dot and its word stay on one optical line at both text
sizes.

**Verified.** Screenshots at 320, 390 and 1280 in light and dark. No label clips, ellipsises,
escapes its box or overlaps another label, the node column or the connector, across three widths x
two text sizes x two themes. `overlap.test.mjs` 62 passing, which covers frame 18 at both text
sizes; `bottom-nav.test.mjs` 8, `sheet-drag.test.mjs` 15, model suites 43. 128 in total.

`CACHE_VERSION` v18 -> v19: `icons.js`, `ui.js`, `content.js`, `components.css` and `mip-about.js`
are all cache-first shell assets.

**Reversal.** Delete the `.process-timeline` block from `components.css`, `processTimelineHTML` from
`ui.js`, `circleDot` from `icons.js`, and put `visualAidLabel` / `visualAidCaption` and the
`.visual-aid-placeholder` markup back on frame 18. Nothing else depends on any of it. Do not do this
as part of a bar sweep - see the top of this entry.

---

## D37. The explainer row says "Opened", not "Watched", because no video plays

**Date.** 22 August 2026.

**Decision.** Frame 13's explainer row marker changes from "Watched" to "Opened". `content.js`'s
`explainerWatchedLabel` is renamed `explainerOpenedLabel`, because the key name carried the same
false claim as the string. Nothing else changes: `ltvVideoSeen` is still set at the same moment, by
the same three dismissal routes, and the row's treatment is unchanged - the marker is still the same
` · <label>` suffix on `.explainer-row__duration`, so no component was touched.

**The defect.** Frame 13b's media block is a placeholder with no playback (there is no media
pipeline in this build). Dismissing 13b sets `ltvVideoSeen`, and frame 13's video row then rendered
"1 min 20 · Watched". The app was stating something about the participant that had not happened, and
could not have happened.

It was wrong twice over. `ltvVideoSeen` is set by dismissing the sheet **however it was entered**,
and both explainer rows open it - so a participant who tapped "See it as a diagram", never touched
the video row, and saw no video, came back to a video row claiming they had watched it. "Opened" is
true on both paths, which is why the shortest of the three drafts was also the most accurate: it
says nothing about *what* was opened, and so cannot be wrong about which row got them there.

**The three drafts.** "Opened" (chosen), "Explainer opened", "You've opened this". All three drop
the playback claim and keep the signal that is actually useful - that the participant has been here
before. "Opened" won on fitting after "1 min 20 · " at 320px and at the large text size, and on
matching the one-word register the row already had.

**Why keep a marker at all.** Whether a participant returns to an explainer is a research signal
worth having on screen, and removing the marker would have thrown it away to fix a wording problem.
The instruction was explicit that the flag's timing must not change, only its label, and that is what
happened.

**The sweep, and what it found.** Every journey flag in `state.js` was checked for whether a screen
reads it to display a claim: `goalSaved`, `journeyStarted`, `calculatorEntered`, `journeyPaused`,
`softSearchRecorded`, `checkRunAt`, `accountSelectionEdited`, `ltvVideoSeen`. **Only `ltvVideoSeen`
drives a displayed marker.** The other seven are never read by any screen module for display, so
there is no second instance of this defect. A rendered-text sweep across 23 routes for
watched/played/completed/finished/viewed/read found nothing else.

Three things were looked at and deliberately left alone, recorded here so the next sweep does not
have to rediscover them:

| Left alone | Why it is not this defect |
|---|---|
| Frame 13's row title, "Watch: what Loan-to-Value means" | It describes what the row offers, not something the participant has done. It is a promise the prototype does not keep, which is a placeholder question, not a false-claim one |
| `/mip/adviser`'s "Request sent" | The participant did take the action it reports. Whether the prototype really sends anything is a fidelity question about the app, not a claim about the participant |
| Frames 15/16's "Accounts sorted - You told us what each one's for." | **Unsure, and reported rather than changed.** This milestone renders `done` unconditionally, so a participant who never opened frame 03 and never assigned an account still reads that they told us. It is the same family, but it is not flag-gated, it is the reference PNG's own copy, and D28's premise is that accounts are connected and assigned from session start. Changing it means changing frames 15/16, which this pass was scoped out of |

**Verified.** Frame 13's card screenshotted before and after opening 13b, at 390px in light and
dark: "1 min 20" before, "1 min 20 · Opened" after, in both themes. Confirmed the diagram row
produces the same marker. 128 tests passing (model, overlap, bottom-nav, sheet-drag).

**Reversal.** Rename the key back and restore the string. Nothing else moved.

---

## D38. The goals area reaches the tracker, and gains a skip-ahead control that is not a feature

**Date.** 24 August 2026.

> **Amended 26 August 2026 - the control moved from `/goals` to `/tracker`.** It is still a
> RESEARCH AFFORDANCE that would not exist in a production build; only where it is drawn has
> changed. Part two below reads as though it lives on the goals page. It does not any more.
>
> **Where it is now.** The top of the deposit tracker, above the headline figure and below the app
> bar, on `/tracker` and no other screen. Both routes into the tracker get it because they are the
> same screen and the same module - the Insights tab root (D40) and the goals-page card (part one of
> this entry). It is gone from `/goals` entirely; there is still exactly one trigger.
>
> **Why it moved.** Every figure it changes is on the tracker. On `/goals` the control and its whole
> effect were two screens apart, so a facilitator had to leave the screen they were demonstrating to
> move the position it showed, and a participant reading the control aloud could not see what it did.
>
> **What did NOT change.** The copy, verbatim - the label, the two option names and the supporting
> line. The state pair, the stash-and-restore mechanism, `CHECKPOINT_FRACTION` as the only source of
> the threshold, the two clobber guards on frames 03 and 06, and both coherence exceptions.
>
> **What moved with it in the code.** `skipAheadHTML` and the new `bindSkipAhead` moved out of
> `goals.js` and into `src/skip-ahead.js`, so the affordance is now one module plus one CSS block
> plus five content keys plus two lines in `tracker.js` - which makes this entry's
> "deleted in one move" claim true rather than nearly true. The five `skipAhead*` content keys moved
> from `/goals` to `/tracker` unedited.
>
> **The accessible name now carries the framing.** Each option is announced as "Prototype control:
> skip ahead, Further along" rather than bare "Further along", composed from the two existing keys
> rather than written as a third string. A radiogroup's name is announced on entering the group and
> not repeated per option, so a participant arrowing between the two would otherwise hear only the
> position names and lose the word that says this is not part of the app.
>
> **THE UNAVAILABLE BRANCH IS NOW UNREACHABLE, AND IS KEPT.** `canSkipAhead()` is false only with no
> `deposit-target`. On `/tracker` - the only route that draws the control - `render()` in
> `src/screens/tracker.js` opens by testing `state['checkpoint-amount'].value === null ||
> state['deposit-target'].value === null` and `location.replace('#/calculator/result')`, so the
> screen redirects before the control is drawn. **That specific guard, on that route, is the only
> reason the branch is dead.** Relax it, or draw the control on a second screen, and the branch is
> live again - so it and `skipAheadUnavailableNote` stay in place rather than being deleted as dead
> code.
>
> **The interest-earned incoherence now shares a screen with the control**, which is the one thing
> the move makes worse rather than better. Measured at 390x844: the control occupies y112-298 and
> the "Interest earned" row sits at y2011 in a 2496px scroller whose viewport ends at y788 - about
> 1200px below the fold, roughly two and a half screens down. A participant cannot see both at once,
> so the contradiction is not put in front of anyone by the move. Still not fixed, for D34's reason.

> **Amended 27 August 2026 - the block is restyled for the context it now sits in.** The move above
> changed where the control is drawn and nothing about how it looks. That was the defect: its
> treatment had been designed for the bottom of `/goals` and was carried to the top of `/tracker`
> unexamined. The two versions were pixel-identical, confirmed by screenshot diff - 0 of 260,400
> pixels differ in light, 1 at a delta of 1/255 in dark. Placement changed; styling did not follow.
>
> **The dashed box is gone, replaced by a single dashed bottom rule.** This is the substantive
> change, and the reason is that a dashed BOX is already this build's placeholder idiom:
> `.media-placeholder` and `.visual-aid-placeholder` both use one on `--color-border-strong`, and
> `.routes-illustration` on `--color-border-subtle`. At the bottom of `/goals` that was harmless,
> because two solid white `.card` blocks sat directly above it and the contrast read as "not one of
> those". As the OPENING element of `/tracker` there is nothing above it to contrast with, so it read
> as emphasis, and worse, as artwork that had not arrived yet. **A research instrument must not wear
> the build's placeholder idiom.** A single dashed edge means something else here, and means the right
> thing: `.account-group-header--unassigned` and `.status-card__still-to-sort` both carry one, on this
> same token, dividing unsettled from settled. The block borrows a convention rather than inventing
> one, and the mark and the boundary it marks become the same object.
>
> **The 32px moved from the top edge to the bottom edge.** `margin-top: var(--space-3xl)` was written
> to hold the annotation away from a card above it. As a first child it separated from nothing and
> rendered as a 56px void below the app bar. The block now adds no top spacing at all -
> `--screen-inset-y` governs, exactly as for the first element of every other screen, and no spacing
> step is used because there is no second thing to be spaced from. It carries
> `margin-bottom: var(--space-lg)` instead, which adds to `.screen-content`'s own 16px gap for 32px
> below: double the default sibling gap, on the side the app's content is actually on. Measured at
> 390x844, 0px above the block, 32px below it, and every other gap on the screen 16px.
>
> **Horizontal padding removed, so the block aligns to the content column.** The label and the note
> stop sitting 16px inside the column every other line on the screen observes. The consequence is
> that `.skip-ahead__options` widens from 318px to 350px.
>
> **THE TRACK IS NOW THE SAME WIDTH AS THE APP'S OWN ELEMENTS, AND THAT IS INTENTIONAL.** Every
> content element on `/tracker` measures 350px at x=20: the headline figure, both provenance
> captions, the progress bar and the action bar's button. Width does not mark app content on this
> screen - fill and weight do - and the block gives up both: no surface behind the label or note, no
> radius, no card, and a dashed edge underneath. An inset track was the thing that looked accidental.
> The track keeps `--color-surface` because it is a control and has to be found and hit, and that is
> what does the "I am a control" work now.
>
> **A recorded observation, not an open problem.** The white track is the brightest object in the
> upper half of the screen, and it is a full-width horizontal bar sitting two elements above another
> one, the progress bar. The headline figure and two captions separate them and the dashed rule closes
> the block, so they are not read as a pair. Written down in case a session ever shows an eye going
> track to progress bar.
>
> **The internal gap stays at `--space-md` (12), deliberately.** Tightening it to `--space-sm` (8) was
> tried, screenshot both ways at 390px, and rejected. At 8 the note binds to the segmented control
> above it and reads as a caption on the toggle, which narrows what it appears to disclaim. What a
> participant might take as real is the deposit figure below, not the control, so "Not part of the
> app" and "No money is saved or moved" have to attach to the screen and its figures rather than to
> the switch. 12 keeps the note a statement of its own, and gives the block's one filled surface a
> little more air, which is the direction a change made to quieten the block should go. The value is
> not arbitrary and should not later be read as arbitrary.
>
> **How the separation survives, given the box is gone.** Quieter is not the same as blending in.
> Four carriers, none of which was ever the outline: the label, unchanged at weight 600, the first
> line on the screen, naming itself before it names its action; the note, unchanged in substance; the
> dashed rule; and the absence of the furniture every figure below it carries - no provenance caption,
> no assumptions link, no surface, no radius. At `--color-border-subtle` the rule is decorative, about
> 1.14:1, and reinforces the other three rather than replacing them.
>
> **Contrast unchanged, because no colour, size or weight changed.** Re-measured from the rendered
> page at 390px, in both positions and both themes. Light: label 4.93:1, note 4.93:1, selected option
> 16.68:1, unselected option 5.28:1. Dark: 6.36:1, 6.36:1, 21:1, 5.95:1. All pass AA for normal text.
> The `aria-disabled` branch, still unreachable behind `tracker.js`'s guard, computes at 5.21:1 light
> and 5.09:1 dark.
>
> **THE COPY CHANGED, WHICH THIS ENTRY PREVIOUSLY RECORDED AS MOVED VERBATIM.** `skipAheadNote`'s
> middle clause now reads "so you can see what **this screen** shows then", not "what the tracker
> shows then". The original clause referred to the tracker from a screen that was not the tracker; now
> that the control sits on the tracker, the screen was naming itself in the third person, and a
> participant reading the note aloud there would stumble over it. Amended deliberately, not
> incidentally: the "copy unchanged verbatim" line in the amendment above is superseded on this clause
> and on no other. The label, both option names and the rest of the note are untouched. Checked
> against the FCA copy rules - no recommendation, no proposed amount, no figure, no rate, one clause,
> no numbers.
>
> **Three stale comments fixed in the same pass.** The `screens.css` header still opened "(/goals
> only" and still argued that "every other block on this screen is a `.card`"; the
> `.skip-ahead__options` comment still justified the track against "the dashed block around it"; and
> the `.skip-ahead__note` comment still reasoned about promotions from "nothing on /goals is
> promoted". All three described the old context. The third was not in the brief, and is included
> because it is the same correction.
>
> **The reason, in one line.** The block was styled for a context it no longer sits in.

> **Amended 27 August 2026 (second amendment that day) - THE CONTROL STAYS AT THE TOP, AND THAT IS
> NOW A DECISION RATHER THAN A DEFAULT.** The amendment above stands unchanged in every particular;
> this one closes the question it left open.
>
> **What was tried.** The block was moved out of the opening, to between the checkpoint sentence and
> the milestone list, and the move was built, verified and committed. It was then reverted
> (`git revert`), and the treatment recorded above is what is in the build. The reverted commit is
> kept in history rather than squashed, because the measurements in it are the evidence for this
> decision.
>
> **What prompted it.** At the top, the eye meets the white segmented track before the headline
> figure, because the annotation precedes the thing it annotates. The screen this was measured
> against is `37bae7f`, the last version before the block landed on the tracker at all: figure,
> provenance captions and progress bar first, milestones following, all four milestone rows whole
> above the fold.
>
> **THE DECISION: the control at the top, over four-of-four milestones above the fold.** The trade is
> real and is settled this way rather than left open.
>
> **The reason.** The block is 150 to 190px tall depending on its rules, and the fourth milestone row
> needs that space, so **no position above the milestone list keeps all four** - measured at 390x844,
> default text: two whole rows and "Deposit goal set" cut, identically for a bottom rule only, for
> two rules, for no rule at all, and for the position one element earlier immediately after
> `.progress-bar`. Every position that does keep all four fails another way. Directly after
> `.milestone-tracker` keeps four but splits the milestone list from its own "Ready to check"
> caption; after that caption keeps four but puts the block's top edge at y=785 against a fold of
> 788, three pixels of it visible, which is the below-the-fold problem that moved the control off
> `/goals` in the first place. And any mid-content position puts the app's own content on BOTH sides
> of the block, which a one-sided rule cannot fence: rendered at 390px, a bottom-only rule there
> leaves the top open and the annotation reads as a qualifier on "You've passed the 75% checkpoint",
> the one sentence it must not appear to qualify. Fencing both sides needs a bracketing mark - two
> dashed edges - that this build does not otherwise use, and inventing one was the thing the
> treatment above was written to avoid.
>
> > **THE ROW COUNTS IN THE PARAGRAPH ABOVE WERE MEASURED ON 27 AUGUST 2026 AGAINST A 169px BLOCK.
> > THE BLOCK IS NO LONGER 169px.** They are left standing rather than overwritten, because they are
> > the evidence this decision was taken on and they were correct when they were taken. What follows
> > is the same measurement re-taken at 390x844, default text, against the same fold that paragraph
> > uses - `.screen-content`'s own bottom at y=788 - at each height the block has since had:
> >
> >   - **169px**, with the supporting note: **two** whole milestone rows, "Deposit goal set" the
> >     first one cut. This is the figure recorded above.
> >   - **103px**, after the note was removed (third amendment): **three** whole rows, "Mortgage in
> >     Principle" the first one cut.
> >   - **99px**, after the internal gap closed to 8 (fourth amendment): **three** whole rows,
> >     "Mortgage in Principle" the first one cut.
> >
> > **THE THIRD ROW CAME BACK WITH THE NOTE REMOVAL, NOT WITH THE GAP.** 66 of the 70px came off when
> > the note went; the gap change accounts for the remaining 4 and moves no row across the fold. The
> > cause is recorded here so a later reader does not credit it to the wrong change.
> >
> > **The decision itself is unaffected, which is why this is a correction and not a reopening.** "No
> > position above the milestone list keeps all four" holds at all three heights - the fourth row is
> > cut at 99px exactly as it was at 169px - and every other reason in the paragraph above stands.
> >
> > **One fold, named, because this entry has only ever used the other.** y=788 is
> > `.screen-content`'s own bottom, which is what every figure here means. The pinned action bar
> > (D39) covers the content from y=651, so the number of rows a participant sees whole is **one**,
> > at all three block heights. That number has not moved through any of these changes.
>
> **So the top is the position where the styling is honest.** The app's own content is on one side of
> this block only, and that is exactly the condition under which a single dashed edge is the right
> mark. The cost is two milestone rows below the fold, paid knowingly - two at the 169px block this
> was decided against, one at the 99px block in the build now, per the re-measurement above. The
> trade was accepted at the larger figure, so nothing about it needs revisiting at the smaller one.
>
> **Also recorded from the reverted pass, because it does not depend on the position.** Removing the
> rules entirely and leaving the 32px gaps, the absent fill, the absent radius and the absent
> provenance caption to carry the separation was tried and fails wherever the block's neighbours are
> not cards: those four properties are shared with `.body-text` and the milestone rows, 32px against
> the screen's 16px reads as section spacing rather than a boundary, and the label shares its type
> role - 13px secondary at 600 - with "Checkpoint", the progress bar's own label. Plain-on-page is
> the app's idiom on this screen.
>
> **The reason, in one line.** The block is too tall to sit above the milestones without costing two
> rows, and every position that keeps all four either buries the control or needs a mark the build
> does not use.

> **Amended 27 August 2026 (third amendment that day) - THE SUPPORTING NOTE IS REMOVED, AND A
> LIVE-VERSUS-STORED DISAGREEMENT IS FIXED.** Two changes, and the second is the more important of
> the two even though the first is what prompted it.
>
> **THE CLAIM THIS ENTRY MADE ABOUT THE UNAVAILABLE BRANCH WAS WRONG, AND IS CORRECTED HERE RATHER
> THAN QUIETLY UPDATED.** The first amendment above states, in capitals, that the branch is
> unreachable because `tracker.js`'s guard redirects before the control is drawn, and that "that
> specific guard, on that route, is the only reason the branch is dead". **That was never true.** The
> guard and `canSkipAhead()` were answering the same question from different sources:
>
>   - the guard tested the STORED `checkpoint-amount` and `deposit-target` keys;
>   - `canSkipAhead()` recomputed the checkpoint LIVE through `checkpointAmount()`, which derives it
>     from `property-value` x `deposit-pct`.
>
> Those disagree whenever `property-value` is null while `deposit-target` is still committed, and
> `calculator-property.js` creates exactly that state: clearing the property-value field writes
> `property-value: null` and does not clear `deposit-target`, which is only rewritten on Continue.
>
> **Reproduced through ordinary participant actions, no facilitator gesture:** from `/tracker` below
> the checkpoint, tap "Adjust my goal" (the secondary action D25 put there for this purpose), reach
> frame 09, clear the property value field, return to `/tracker`. The guard passes on the stale
> stored keys, the screen renders, and the control draws itself inert with `aria-disabled="true"`.
>
> **THE FIX IS TO REMOVE THE DISAGREEMENT, NOT THE BRANCH.** `canSkipAhead()` now reads
> `state['checkpoint-amount']` - the same stored key the guard tests - so the two agree by
> construction. `skipAheadPatch()` reads it too, and had to: leaving it on the live derivation would
> have produced a worse defect than the one being fixed, an option that is enabled and does nothing
> when pressed, because `bindSkipAhead` treats a null patch as "cannot move right now" and returns
> silently. One source, one answer. **"Further along" is now enabled wherever `/tracker` renders**,
> verified by re-walking the five-step trace: the control draws, the option is enabled, and pressing
> it moves the session (`skippedAhead: true`, saved-toward-deposit £21,000).
>
> **The `available` branch is kept, and is now dead by CONSTRUCTION rather than by coincidence.** It
> costs one ternary and covers a caller that draws this control somewhere the guard does not run.
> That is a much stronger claim than the one this entry used to make, and it is the reason the branch
> is still worth keeping after its copy has gone.
>
> **Stash-and-restore is untouched.** `STASHED_KEYS`, the stash mechanics and `skipBackPatch` are
> unchanged; only the source of the checkpoint VALUE changed, and in every state where the two
> sources agree the patch is identical. Three round trips through the live control leave
> `sessionStorage` byte-identical, and `skip-ahead.test.mjs` passes unchanged at 11 assertions.
>
> **One test fixture was strengthened rather than left to pass by luck.** `savingSession()` hard-coded
> `checkpoint-amount: 31500`, which happens to equal `CHECKPOINT_FRACTION x 42000`. With
> `skipAheadPatch()` now reading that key, two tests whose own comments call them "a test that no
> number is written down" would have been broken by a change to `CHECKPOINT_FRACTION` instead of
> following it. The fixture now derives the key from `CHECKPOINT_FRACTION`, so those tests mean what
> they say again.
>
> **THE NOTE IS REMOVED, both strings and the element.** `skipAheadNote` and
> `skipAheadUnavailableNote` are deleted, with the `<p class="skip-ahead__note">` that carried them,
> the `aria-describedby` that pointed at it and the now-dead `.skip-ahead__note` CSS rule. **The
> reason: the control is operated by the facilitator, who does not need the explanation.** It was the
> only part of the block addressed to someone who did.
>
> **What survives the removal.** The label, "Prototype control: skip ahead", and the two option
> names. The label still names the control before it names its action, is still the first line on the
> screen, and is still composed into each option's accessible name - "Prototype control: skip ahead,
> Further along" - so a screen-reader participant arrowing between the two still meets the prototype
> framing. Verified: one tab stop, arrows move and select, `aria-checked` flips both ways, no
> dangling `aria-describedby` or `aria-labelledby` anywhere in the document, two children in the
> block and no empty paragraph.
>
> **The block is now 103px tall**, down from 169px, and the gaps around it are unchanged: 0px above,
> 32px below, 16px between every other pair on the screen.
>
> **`--space-md` (12) between the label and the track is left as it was, and is now an open
> question.** It was chosen for a three-part block, to stop the note reading as a caption on the
> track above it; that reason went with the note. In a two-part block it sets the distance between a
> control and its own label, where this build's convention for a label and the thing it labels is
> usually tighter. Not changed in the same pass as the removal, so the two are not confused with each
> other.

> **Amended 27 August 2026 (fourth amendment that day) - THE INTERNAL GAP IS `--space-sm` (8), AND
> THE QUESTION THE AMENDMENT ABOVE LEFT OPEN IS CLOSED.** One declaration changed, and nothing else.
>
> **The block is a control and its own label, and 8 is what this build spaces that pair at.** Two
> parts, in one order, and the first names the second: "Prototype control: skip ahead" over a
> two-option segmented track. There is no third element for the label to be held away from and no
> second relationship inside the block for a gap to arbitrate, so the gap has exactly one job, and
> it is the ordinary label-to-control job every form control on this build already does. The
> convention is 4 or 8 and nothing else: `.settings-control` on frame 33 - a label above a row of
> pill segments, which is the same object as this one - uses 8; `.currency-input` on frames 09, 09a
> and 09b uses 8 above its field; and `.progress-bar`, two elements below this block on this same
> screen, uses 4 between its track and its "Checkpoint" label. 8 is the value for a label above
> something a participant taps, 4 for a caption under a thin bar. This is the first case. At 8 the
> label is read as belonging to the track, which is what it is for.
>
> **WHAT SUPERSEDES WHAT.** The amendment above records this value as an open question, and the
> restyle amendment before it records 12 as deliberate, reasoning that at 8 the supporting note
> would bind to the track and appear to disclaim only the toggle. **That reasoning was sound and is
> now void, because there is no note.** Both paragraphs are superseded on this value and on nothing
> else; everything else either of them records still stands, including the position, the single
> dashed bottom edge, the 350px width and the four carriers of the separation.
>
> **Measured, at 390px, on both routes into `/tracker`, both themes and both positions - eight
> renders.** The block is **99px**, down from 103. The gaps around it are unchanged and identical
> across all eight: 0px above, 32px below, 16px between every other pair in `.screen-content`.
> Inside the block the label is 18px, the track 56px, the measured label-to-track distance 8px; the
> remaining 17px is the block's own `padding-bottom` and its 1px dashed edge. The block's width
> (350px), its x origin (20px), its `margin-bottom`, its `padding-bottom` and its border are all
> untouched, and no other rule in the stylesheet moved.
>
> **The 4px is reclaimed by everything below the block, and buys nothing at the fold.** The block is
> the first child of `.screen-content`, so the whole screen below it shifts up by exactly 4px and
> nothing reflows. The number of whole milestone rows above the fold is unchanged at 390x844: one
> against the pinned action bar's dock at y=651, three against `.screen-content`'s own bottom at
> y=788. The trade the second amendment settled is untouched - this is not a step back toward
> keeping four rows, and it was not made in order to be one.
>
> **Nothing about the control's behaviour or its announcement changed, and it was checked rather
> than assumed.** One tab stop in the block; ArrowRight, ArrowLeft, Home and End each move focus and
> select in the same step; `aria-checked` flips both ways and the roving `tabindex` follows it; both
> accessible names remain "Prototype control: skip ahead, Now" and "Prototype control: skip ahead,
> Further along"; the radiogroup still resolves its name through `skip-ahead-label`; no dangling
> `aria-describedby` or `aria-labelledby` anywhere in the document. Three round trips through the
> live control leave `sessionStorage` byte-identical. Dark mode follows without a second rule set,
> as it did before - the change adds no colour and no token.
>
> **A stale measurement found in passing, and CORRECTED IN PLACE.** The second amendment's "two
> whole rows above the fold" was measured against a 169px block; it has been 103px since the note
> was removed and is 99px now, and three whole rows clear `.screen-content`'s bottom at both smaller
> values. **A stale measurement in a decision record is worse than none, because the next person
> reasons from it**, so the correction sits beside the original inside that amendment rather than in
> this one - the original figure, its block height and its date kept visible, the current figures
> stated next to them, and the cause attributed to the note removal rather than to this change. The
> three heights were reproduced and re-measured rather than derived: forcing the block back to 169px
> returns "two whole rows, Deposit goal set cut" exactly as recorded, which is what makes the
> original safe to leave standing.
>
> **The reason, in one line.** A two-part block has one relationship in it, and this build spaces
> that relationship at 8.

**Marked as a research affordance.** Half of this entry describes a control that WOULD NOT EXIST IN
A PRODUCTION BUILD. It is an instrument for moderated sessions, not part of the design being tested,
and it is written to be removed in one move: delete `src/skip-ahead.js`, the `.skip-ahead` block in
`screens.css`, the five `skipAhead*` keys in `content.js`, the two-key state pair in `state.js`, the
`skipAheadHTML` helper and its handler in `goals.js`, the two `accountFiguresPatch` call sites, and
`scripts/skip-ahead.test.mjs`. Nothing else in the app knows it exists.

### Part one: the tracker entry on /goals

**Decision.** `/goals` gains a second card in its long-term section, alongside the deposit
calculator entry, built from the same `ctaCardHTML` helper both now call. It routes to `/tracker` -
the same route the Insights tab resolves to (D35). Both doors land on the same screen in the same
state; neither is the real one.

**Why one function and not two blocks of markup.** The two cards are two things you can do with the
same long-term goal, so they have to read as siblings. Written once, a change to the treatment
cannot land on one and miss the other. The calculator stays first because the tracker measures a
goal against a target and there is no target until the calculator has produced one.

> **Amended 27 August 2026 - THE TWO CARDS ARE NO LONGER BOTH ALWAYS DRAWN (D44).** This part
> reads throughout as though the section always carries both; it does not. `/goals` now offers a
> card only where the screen behind it will render rather than redirect: the calculator alone
> before a goal is set, the tracker alone between the goal and the checkpoint, both once the
> checkpoint is passed. The "siblings, one component" reasoning survives unchanged and is why the
> state that shows both still reads as one section rather than a card and a banner; what is
> superseded is only the assumption that there are always two. The card ORDER above is superseded
> too, in the one state that shows both: the tracker comes first there, so that crossing the
> checkpoint adds a card below it rather than pushing it down. Everything else in this part -
> `ctaCardHTML`, the routing, the back behaviour, and the deliberate absence of a guard - stands.

**Back follows D29 without this screen saying anything.** `/tracker`'s app bar is `goBack()`, which
is `history.back()`, so it returns to whichever screen actually pushed the entry below it - `/goals`
for a participant who arrived from the card, wherever they were for a participant who used the tab.
The card writes NO state at all, which is what makes that true: naming a destination is exactly what
D29 removed from every other screen.

**`journeyEntryPoint` is deliberately not written here**, unlike the calculator card beside it. It
belongs to the close X, which no screen between here and the tracker draws, and the tracker writes
it itself at the one moment it means something - when its action bar opens the Mortgage in Principle
flow (D30, D32). Writing it on this click would record the goals area as the entry point of a flow
the participant has not entered.

**No guard of its own.** `/tracker` already guards on `checkpoint-amount` and `replace()`s a
participant with no goal into the calculator, at no cost in back taps. A second, earlier guard here
would be a second copy of one rule, and the Insights tab does not have one - the two routes must
behave identically or they are not the same door.

### Part two: the skip-ahead control

**Decision.** `/goals` carries a two-option control moving the session between the starting savings
position ("Now") and the checkpoint position ("Further along"), at which `/tracker` unlocks the
Mortgage in Principle milestone. It is a toggle in both directions, any number of times, and the
starting position returns exactly as it was.

**The threshold is `CHECKPOINT_FRACTION`, and no figure is written down.** The later position is
`checkpointAmount()` from `model.js`, which is `CHECKPOINT_FRACTION * depositTarget(state)` and
nothing else. Two things follow: changing the fraction in `rates.js` moves the control with it, and
the position lands on the same arithmetic the tracker's own `checkpoint-amount` came from, so
`saved >= checkpoint` holds by construction rather than by rounding luck. Asserted as a ratio, not
as an amount, in `scripts/skip-ahead.test.mjs`.

**A stash, not a computed override.** About a dozen screens read `state['saved-toward-deposit']`
directly. An override read through a helper would mean changing every one of them, and would leave
the next screen someone adds able to miss it silently. So the control WRITES the later position into
the store and keeps the one it replaced in `skipAheadStash`, restoring it verbatim on the way back.
Every screen and every model function is untouched and follows on its own, and "returns exactly as
it was" becomes a property of copying an object back rather than of re-deriving it and hoping.

**What moves.** Most of it needs nothing: the tracker's headline, progress fill,
below/reached/met variant and therefore every milestone state and its action bar, plus
`gapToCheckpoint`, `gap`, `monthsToTarget`, `onTrackFor`, `neededLoanAmount`, `maxProperty` and
`mipEstimatedLtv`, are all computed at render time. THREE FIGURES ARE STORED rather than derived and
would otherwise be left behind at the position they were committed at:

| Figure | Committed by | Handled how |
|---|---|---|
| `months-to-target` | frame 11's "Work it out" | recomputed, and only where already committed |
| `on-track-for` | frame 11's "Work it out" | recomputed, and only where already committed |
| `max-property` | `/mip/running`, on each run | recomputed, and only where already committed |

"Only where already committed" is tested on `provenance === null`, this store's own never-set
marker: skipping ahead must not conjure a figure onto a screen the participant has not reached yet.
`borrow-low`/`borrow-high` are absent from that list because they derive from `loan-amount`, which is
sized against `deposit-target` and never sees the savings position.

**What is never touched.** `property-value`, `deposit-pct`, `deposit-target`, `savings-rate`,
`goal`, the target month and year, and the account assignments. The patch names its keys explicitly
rather than spreading a computed object, so a figure can only move by being added to one of the two
lists in `skip-ahead.js`.

**Provenance is carried over, not rewritten.** The four-value vocabulary describes where a figure
came from in the world the participant is being shown, and in that world the balance at the
checkpoint is still read from their accounts. There is no fifth value meaning "the prototype put
this here", and inventing one would put a word on screen that frame 29's provenance key does not
explain. The control's own label is what says this is a prototype position.

**Two screens had to stop clobbering it.** `position-summary.js` (frame 06) and `consent.js`
(frame 03) recompute the account totals whenever a participant changes which accounts count. Either
would have overwritten the later position with an account total - silently returning the session to
"Now" while the control still read "Further along", and discarding the participant's own account
edit when the control was moved back. `accountFiguresPatch` re-points the recomputed deposit total
at the stash instead, so the edit survives the round trip and the position on screen stays put.
`emergency-fund` and `unassigned` are not part of the savings position and are still written live.

**Two things cannot be kept coherent, and are reported rather than fudged:**

  1. **Interest earned.** `MOCK_POSITION.thisMonthInterest` (GBP 38) is a directly-read mock figure
     carrying a "Read from your savings accounts" caption, fixed as such by D34. At the checkpoint
     position it no longer follows from the balance beside it. Deriving it from the balance would
     contradict its own caption on screen and reopen D34, so it stays put and is stated here.
  2. **Per-account balances** on frames 03, 06 and 32. Raising them means inventing balances, which
     the content rules forbid. While the control is at "Further along" those three screens show a
     saved total larger than the accounts they list.

**Copy.** "Prototype control: skip ahead", two options "Now" and "Further along", and a supporting
line: "Not part of the app. It moves the example figures to a later point in this goal, so you can
see what the tracker shows then. No money is saved or moved." It names itself before it names its
action; the subject of the sentence describing what moves is "the example figures", not "your
savings"; and it makes no financial claim and recommends nothing, which is why the block adds no
regulatory anchor to `/goals`. "Skip ahead" rather than "fast-forward" - fast-forwarding is done TO
a timeline the participant is on, which is the reading to avoid. The option labels name a position,
not an action, for the same reason. A separate line replaces the note before a goal exists.

**A copy check moved the note up one step**, from caption size in the tertiary colour to footnote
size in the secondary. MCOB 3A.3.1R's balance rule does not bind here - nothing on `/goals` is
promoted - but its principle does: the qualifier must not be less legible than the thing it
qualifies, and "no money is saved or moved" had been the faintest text on the screen.

**Fully accessible, unlike frame 10's facilitator gesture, because it is visible.** A visible
control a keyboard or screen-reader participant cannot reach, or cannot hear the state of, is a
different prototype for them than for everyone else - a defect in the instrument, not a finding
about the design. `role="radiogroup"` with two `role="radio"` buttons carrying `aria-checked`,
labelled by the heading and described by the note, with a roving tabindex so the group is ONE tab
stop and the arrows move within it. Arrow keys move and select, which is the radiogroup pattern's
own behaviour rather than a shortcut invented here. Before a goal exists "Further along" carries
`aria-disabled` rather than `disabled`: it keeps its place and its announcement and only the
affordance is withdrawn - a control that vanishes between two visits to the same screen is harder to
account for mid-session than one that says why it will not move.

**A radiogroup rather than a switch or a flipping button.** It selects between two named positions
rather than turning a thing on, and both names are visible at once, so a participant can read what
they are moving between before they move. A switch announces "Further along, on", which says an
action was performed; two radios announce "Now, selected", which says where the session is.

**One trigger, on one screen.** Not on the tracker, not inside the Mortgage in Principle flow, not
on frame 33. A participant part-way through a task must not be able to change the position the task
is measured against, and a second control would also mean two places to look when a session's
figures are not where the facilitator expected. Frame 33's `stage` control is unrelated and remains
what it was: inert, read by no screen.

> **Amended 27 August 2026 (fifth amendment) - THE PARAGRAPH ABOVE WAS RIGHT ABOUT POSITION AND
> WRONG ABOUT SETUP, AND FRAME 33'S `stage` CONTROL IS NOW LIVE (D45).** The last sentence is
> superseded in both of its claims: `stage` is not unrelated, and it is no longer inert. Nothing
> else in that paragraph is - the ban on a second POSITION control stands exactly as written.
>
> **The distinction the paragraph was missing.** "A second session-position control" was the right
> thing to reject and the wrong description of what frame 33 offers. The two controls answer
> different questions:
>
> | | Question it answers | What it may write |
> |---|---|---|
> | Skip-ahead (`/tracker`) | Where is this session WITHIN a goal it already has? | The savings position and what re-derives from it |
> | Journey stage (frame 33) | Does this session have a goal AT ALL? | Whether the goal exists, and every figure that constitutes it |
>
> **One control for position, one for setup, and they must never both be able to answer the same
> question.** That is the rule this amendment adds, and it is enforced by what each control writes
> rather than by convention. The stage control reaches `skippedAhead` and `skipAheadStash` only by
> calling `skipAheadPatch()` itself - it never constructs the later position by hand - and the
> skip-ahead control never writes `stage`. So the two can disagree on screen without either being
> wrong: frame 33 can read "Ready to check" while `/tracker`'s own control sits at "Now", because
> the session HAS the goal that stage set up and is being SHOWN at the earlier position within it.
> Two facts, not one fact recorded twice. Asserted in `scripts/stage.test.mjs`
> ("neither control writes the other's key"), and measured: `ready-to-check` toggled back to "Now"
> is byte-identical in `sessionStorage` to `saving` set directly, key order included, apart from the
> single `stage` key that records which pill is lit.
>
> **Why the original ban was still correct.** A control that moved the POSITION from frame 33 would
> be the thing this paragraph forbids: two places to look when the figures are not where the
> facilitator expected, and a way to move a task's measure while a participant is part-way through
> it. `stage` cannot be reached mid-task in the same sense, because it is not reachable at all
> without leaving the participant's screen and typing a URL, and because what it sets is the state a
> session STARTS from rather than a position inside one.
>
> **What is superseded, precisely.** The clause "not on frame 33" survives as a ban on a second
> position control there, and is void as a ban on the stage control. "Frame 33's `stage` control is
> unrelated and remains what it was: inert, read by no screen" is void in full - and note that
> "read by no screen" is STILL true and is no longer the same as inert. `stage` is written once by
> the control and never re-read at render time; see D45 for why a set-up is written rather than
> interpreted.

**Marked, not foreign, visually.** Every other block on `/goals` is a `.card` - an opaque surface
square with the screen inset. This one is none of those: no card surface, a dashed rather than solid
outline, a label above rather than a heading inside. It reads as an annotation on the prototype
rather than as something the bank offers, while staying inside the design system for everything else
(same tokens, same 8pt spacing, same type scale, same segmented geometry as frames 10 and 10b). No
new token, so dark mode follows without a second rule set.

**Verified.** Walked at 390px in light and dark. At "Now" the tracker is below checkpoint (headline
GBP 8,950, milestones done/done/current/locked, primary "What a bigger deposit changes"); at
"Further along" it is checkpoint-reached (GBP 18,750 = 0.75 x GBP 25,000, done/done/done/current,
"Mortgage in Principle - Unlocked. Whenever you're ready.", primary "Check what a lender might lend
you", the Loan-to-Value link appearing). On track for moves from November 2029-August 2030 to
October 2027-February 2028. The Mortgage in Principle flow runs end to end from there: `/mip` to
`/mip/about` to `/mip/pre-check` to `/mip/running` to `/mip/result/likely`. Three round trips
through the live control leave `sessionStorage` byte-identical to the start each time, with every
entered figure unmoved. Keyboard confirmed in a browser: four Tab presses reach the group, it is one
tab stop, and ArrowRight/ArrowLeft/Home/End each move the position and flip `aria-checked`. 143
tests passing - 43 model, 66 overlap (three `/goals` rows added: the control's available, skipped
and unavailable states, at both text sizes), 8 bottom-nav, 15 sheet-drag, plus 11 new in
`scripts/skip-ahead.test.mjs`.

**Reversal.** Part one: drop the second `ctaCardHTML` call and its handler, and the three
`trackerCard*` keys. Part two: the deletion list at the top of this entry. Neither part depends on
the other.

---

## D39. The action bar is pinned and always visible, and D17's reveal-on-reach is withdrawn

**Date.** 24 August 2026.

**Decision.** The action bar is visible from the moment a screen paints and stays visible. It sits
at the bottom of the phone screen, above the tab bar, and the content scrolls beneath it. D17's
reveal-on-reach - hidden until the participant scrolled to the end of the content, hidden again on
scrolling back up - is removed, along with the `opacity: 0` / `pointer-events: none` pair, the rise
transition and the focus-reveal path that existed to keep the hidden state reachable.

**This reverses a research decision, not just a layout one, and that is worth saying plainly.**
D17's argument was that these screens carry the things the feature exists to be judged on - how a
figure was worked out, where it came from, the regulatory lines, the "something doesn't look right"
route - and that a primary button present from first paint invites a participant to press it
without reading any of that. Making the button the reward for reaching the end put the content in
the path rather than beside it.

That argument is not wrong, and nothing has been discovered that falsifies it. It has been
outweighed: a control the participant has to go looking for is itself a finding the sessions did
not set out to collect, and "I could not see how to continue" is noise in a study about whether
figures are understood. The requirement now is that a participant can read the final section and
see their options at the same time, without a further gesture. Both cannot hold at once. If the
comprehension argument is to win again, the middle option is to reveal the bar when the LAST
CONTENT ELEMENT enters the viewport rather than at exact scroll-bottom - that keeps the scroll
through the content and removes the extra gesture, and it is a change to one predicate in
`src/action-bar.js`.

### What replaced it

Not a deletion. `src/action-bar.js` still measures and still decides, but it decides about LAYOUT
rather than about visibility. Two modes, from one test - does the content overflow its scroller:

| Mode | When | The dock | The scroller |
|---|---|---|---|
| **Pinned** | content overflows | bottom of the flex column, above the tab bar | grows under the dock (negative margin) and reserves the dock's measured height as padding, so the last real content scrolls fully clear |
| **Inline** (`.screen.actions-inline`) | content fits | directly after the last card | stops growing; no negative margin, no reserved padding |

**Inline mode is the whole of what is new.** Pinning alone would have left a short screen showing
its content at the top, a band of empty screen, and the buttons stranded at the bottom edge - the
bar floating rather than belonging to what is above it. `/mip/adviser` at 375x667 is the case: four
short paragraphs and a Done button, with 200px of nothing between them if the bar is pinned.

**The modes cannot oscillate, and that is arithmetic rather than luck.** Switching mode changes the
scroller's box AND its padding together, which is precisely the feedback loop D17 avoided by
overlapping instead of collapsing. It is safe here because the quantity the module tests is
unchanged by the switch. Writing S for the space the flex column leaves the scroller with the dock
in flow, N for the content's natural height including the screen inset, and H for the bar:

```
pinned   clientHeight = S + H       scrollHeight = N + H
inline   clientHeight = min(N, S)   scrollHeight = N
```

`scrollHeight - clientHeight` is `N - S` in both. A mode change produces one more measurement,
agrees with itself, and stops.

### The tab bar does not move, and finding that out took a screenshot

`.bottom-nav` gains `margin-top: auto`. A no-op in every case but one: ordinarily `.screen-content`
is `flex: 1 1 auto` and absorbs the column's free space itself, so there is none left to claim.
In inline mode the scroller stops growing, and without this the whole column collapsed upward and
took the tab bar with it - the bar rose to sit directly under the action buttons, with a band of
page background between it and the bottom of the phone screen.

**The geometry test passed while that was broken.** It asserted the action bar did not overlap the
tab bar, which was true, and said nothing about where the tab bar itself was. The contact sheet
showed it in a second. The assertion now exists - the tab bar's bottom edge is the screen's bottom
edge, on every screen at every viewport - but the sequence is the point: measurement finds what it
was told to look for, and a look at the thing finds what it was not.

The action bar belongs to the screen and may sit where the screen's content ends. The tab bar
belongs to the bank (D11), is the same furniture on all 20 screens that carry it, and moving it
would mean the app's own navigation changed place depending on how much copy a screen happened to
have.

### The top edge

Two parts, and both are needed:

  - **The hairline** on `.action-bar` (`border-top`, `--color-border-subtle`) - present at every
    scroll position, the same 1px rule and the same token as `.bottom-nav`'s own top edge, so the
    two pieces of bottom chrome are bounded the same way. This existed already; it was simply
    never visible except in the revealed state.
  - **The 56px gradient**, `.action-bar-dock::before`, shown while the content is long enough to
    scroll and has not yet been scrolled to its end. Text passing under it dissolves into
    `--color-bg` rather than being cut at a hard line.

**The gradient moved from `bottom: 0` to `bottom: 100%`** - from inside the dock to immediately
above it. D17's placement was correct for D17's reasons: the bar's hidden state was `opacity: 0`,
and opacity applies to an element's pseudo-elements, so a gradient above a transparent bar would
have faded the content out and then let it reappear, perfectly legible, underneath the invisible
bar. A bar that is always opaque has nothing to reappear beneath, so the fade belongs where the
content actually is. It stays 56px: D17's first pass masked 193px in flat `--color-bg`, 26% of the
phone screen, and that slab is what read as a blurred region below the last element.

### Where the reserved space comes from, and one deviation from the brief

The brief asked for the scrolling area to be bottom-padded by **the action area plus the bottom
navigation**, computed rather than hardcoded. It is padded by the action area alone
(`calc(var(--screen-inset-y) + var(--action-bar-height))`, the height measured from the bar's own
`offsetHeight` because it is one or two buttons tall and grows with frame 33's text-size control).

**The tab bar's height is reserved structurally instead, which is stronger than padding rather than
weaker.** `.screen` is a flex column and the tab bar is a sibling flex item below the scroller, so
the scroller's viewport ENDS at the tab bar's top edge - there is no region under the tab bar for
content to reach, whether or not anything is padded. Adding the tab bar's height as padding as well
would double-count it and open a 56px dead band above the action bar on every screen in the app.
Measured rather than argued: at 375x667 the clearance between the last content element and the
action bar is 24px on all 27 screens, exactly `--screen-inset-y`, and the gap between the action bar
and the tab bar is 0px - flush, no overlap.

### Safe area

Unchanged in substance and now mode-aware. Whatever sits lowest carries the inset as its own
padding so its background reaches the bottom of the phone screen (D14, as revised): the tab bar
where there is one, the action bar where it is `:last-child`. That second rule gains
`:not(.actions-inline)`, because in inline mode the bar is NOT the lowest thing - it sits wherever
the content ended, with screen background below it - so `.screen` keeps its own `padding-bottom`
in that case instead. No screen in the current build reaches that combination; every screen with an
action bar also has the tab bar.

### Two action layers never appear at once

Structural, and now asserted. A sheet route replaces the whole of `#app` (router.js), so the screen
behind it is not in the DOM and cannot contribute a second bar. `scripts/action-bar.test.mjs`
counts `.action-bar` elements on all seven sheets and requires exactly one, and requires no tab bar
under a sheet.

Sheets get no inline mode and need none. A sheet's dock is `position: absolute` against a card
sized by its own content up to `max-height: 92%`, so a sheet whose content fits is already exactly
as tall as that content and its bar is already sitting at the end of it.

**Verified.** `scripts/action-bar.test.mjs`, 89 assertions: 20 screens x 4 viewports (375x667,
375x812, 430x932, 1280x900 framed), plus 7 sheets, plus the framed-view and no-action-bar cases.
Per screen per viewport it asserts the bar is opaque, hittable and inside the phone screen at first
paint with no scrolling; that it does not overlap the tab bar and the tab bar is still at the bottom
of the screen; that it carries a hairline; that the mode matches whether the content overflows, and
that a pinned bar is flush with what is below it while an inline one follows the content; and that
scrolled to the end, the last real content element sits fully above the bar. At 1280 it asserts the
bar spans the 393px phone screen (366px after the frame's 0.932 scale-to-fit) and not the browser
window. All 27 screens screenshotted at 375x667 scrolled to the end. 232 tests passing across the
suite.

**Reversal.** Restore `opacity: 0` / `pointer-events: none` / the rise on `.action-bar`, put the
`--revealed` class and the focus-reveal listeners back in `src/action-bar.js`, return the dock's
`::before` to `bottom: 0`, and drop `.actions-inline` and `.bottom-nav`'s `margin-top: auto`. The
measured height and the overlap are older than D17 and are not part of this.

---

## D40. The tracker is the Insights tab root, and a lateral move between roots replaces

**Date.** 25 August 2026.

**Decision.** The three tab roots are `/home`, `/goals` and `/tracker` - the values of
`NAVIGABLE_TABS` in `components/ui.js`. A tab-bar tap taken FROM a tab root is a lateral move and
uses `location.replace()`; a tab-bar tap taken from anywhere else is a descent out of that screen
and still pushes. This is D29's restated axis applied to the one control that had no answer under
the old phrasing.

**The Insights routing was already correct and is not what changed.** `NAVIGABLE_TABS` has mapped
`insights: '/tracker'` since D35, and a browser probe confirms `#/home` -> tap Insights ->
`#/tracker` with the tab enabled and bound. There is no second tracker screen, no Insights module
and no other Insights content; `/tracker` is that tab's only destination. What was broken was
history: **ten Insights/Goals switches built ten entries** (measured, 3 -> 13), and swipe-back then
walked `goals -> tracker -> goals` one screen at a time.

### `isRootEntry()` is the only fact that can answer this, and raw history depth cannot

`src/router.js` stamps every entry it renders with `ROOT_MARKER` alongside the existing
`NAV_MARKER`, set from a `pendingRootArrival` flag that the tab handler raises immediately before
navigating and the next `stampEntry()` consumes. `isRootEntry()` reads that marker and is exported,
because the back chevron asks the same question and must not compute it a second way.

**Why not a list of root routes.** `/tracker` is the Insights root when the tab put the participant
there and a DESCENT when the goals card did; `/goals` is the Goals root and a descent from frame
06's "save for something else" branch. A route list cannot tell those apart. Traced in a browser
before this was built, testing the route instead produces a duplicate entry rather than a near-miss:

```
tap Goals tab       #/goals    len=3   ["", "#/home", "#/goals"]
tap tracker card    #/tracker  len=4   ["", "#/home", "#/goals", "#/tracker"]
REPLACE -> /goals   #/goals    len=4   ["", "#/home", "#/goals", "#/goals"]   <-- duplicate
back (1st)          #/goals            <-- same screen; back did nothing
back (2nd)          #/home             <-- only now does it move
```

**Why not history depth either.** A tab root nearly always DOES have something behind it - the
previous tab, or the `/home` that `seedHistoryRoot()` puts behind a deep arrival. So any test based
on stack position or `history.length` would report "there is a predecessor" and be wrong. The
chevron and the tab rule are both claims about the FLOW, not about the raw stack, and only the
entry knows how it was created. `history.length` is separately unusable here for the reason D29
already records: a tab's own initial entry counts toward it, so it reads 2 on the very first paint.

**Per-entry state is the right channel, measured not assumed.** A value planted on `/home` is gone
after both a push and a replace - each creates a fresh entry - and returns intact on navigating
back to that entry. A refresh preserves it, because `stampEntry()` returns early on an entry it has
already stamped.

### What it costs and what it saves

| Sequence | Before | After |
|---|---|---|
| Ten root-to-root switches | +10 entries | +0 |
| Ten switches from a descended `/tracker` | +10 | +1, then flat |
| `/goals` -> tracker card -> Goals tab -> back | lands on `/tracker` | unchanged, no duplicate |
| Guarded tap from a root (`/tracker` with no goal, guards four deep) | +1 | +0 |

The 10c interception is untouched: a tab tap from a calculator step still opens "Leave this for
now?" and never reaches the lateral test.

**A known gap is left open deliberately and logged as `GAPS.md` G59.** Only a tab tap raises
`pendingRootArrival`, so a cold load, a deep link or a browser session restore stamps a tab root
`root: false`. Safe-directional for navigation - it means "descent", so the tap pushes - but NOT
safe for the back chevron, which is why it is logged rather than waved through.

**Reversal.** Drop `ROOT_MARKER`, `pendingRootArrival` and `isRootEntry()` from `router.js`, and
return the tab handler to a bare `window.location.hash = ...`. `seedHistoryRoot()`'s two explicit
`root: false` stamps go with them.

---

## D41. A screen draws the back chevron only when there is a screen behind it inside its own flow

**Date.** 25 August 2026.

> **Amended 26 August 2026 - the first entry of a session stamps by route, and G59 is closed.**
> D41's rule is UNCHANGED. What changed is the stamping underneath it, in one place.
>
> **The defect.** Only a tab tap raised `pendingRootArrival`, so a cold load, a deep link or a
> session restore stamped a tab root `root: false` - and a cold-loaded `/goals` or `/tracker` drew a
> back chevron on a tab root, the exact thing this rule exists to remove. Participants are sent a
> link and open it, so **cold load is the primary arrival path in a moderated session, not an edge
> case**: the defect was in front of most participants rather than at the margin.
>
> **The rule.** On the first entry of a session there is no earlier screen, so **no descent can have
> happened**. If that entry lands on a tab root, it is a root. `seedHistoryRoot` stamps it
> `root: true`, reading the tab roots from `NAVIGABLE_TABS` rather than writing a second list - a
> fourth live tab becomes a root without `router.js` changing.
>
> **This is not a route list applied generally.** The route decides at that one boundary and nowhere
> else, because that is the one place the usual question - how was this entry created - has no
> answer. Every screen still asks `isRootEntry()` and nothing else, and every later arrival is
> classified exactly as before.
>
> **The first entry is distinguishable, and this is what distinguishes it.** `seedHistoryRoot` is
> called once from `startRouter`, which runs once per page load. A URL typed MID-session fires
> `hashchange`, which re-renders without re-entering `startRouter` - measured as the history length
> growing by one rather than by two. So "unstamped entry, reached during `startRouter`" is exactly
> "the first entry of this session".
>
> **One knock-on, reported rather than buried.** A cold-loaded `/home` is now a root, so the FIRST
> tab tap of a session is a lateral and replaces instead of pushing. Ten root-to-root switches from a
> cold start now cost +0 entries where they cost +1 before. The cost is that back from that first tab
> root leaves the prototype rather than returning to `/home` - which is the already-accepted
> "back from a tab root with nothing behind it" case (D40), now reached one step earlier.
>
> **Browser session restore remains unmeasured.** It cannot be driven headlessly. A restored entry
> carries its `history.state` per the HTML spec, so it should look like a revisit and keep its stamp,
> which is the path a reload takes and that IS measured. Stated as reasoning, not as a result.

**Decision, stated generally.** The app bar's leading cell draws the back chevron when, and only
when, there is a preceding screen inside the same flow. The root screen of a tab has none by
definition - the tab bar put the participant there, and the tab they came from is not behind it in
any sense back should honour - so a tab root draws no chevron. This is the counterpart to D40 on
the same axis: D40 decided what a lateral move does to history, and this decides what a lateral
arrival means for the control that reads it.

**IT CHANGES TWO SCREENS, AND THAT IS NOT WHAT IT IS.** `/goals` and `/tracker` are the only two
screens in the app that are DUAL-NATURED - a tab root by one route and a descent by another:

| Screen | Root when | Descent when |
|---|---|---|
| `/goals` | the Goals tab | frame 06's "save for something else" branch (`position-summary.js`) |
| `/tracker` | the Insights tab | the goals-page tracker card (D38) |

Every other screen with an app bar has exactly one nature, and already draws the right thing.
`/home` is the third tab root and draws no chevron, but for the wrong reason: `home.js` builds its
app bar inline with two empty `<div class="app-bar__cell">` rather than calling `appBarHTML`, so it
happens to be correct rather than being made correct by this rule. Left alone deliberately - it is
right, and the rule holds over it - but it is not evidence the rule is applied there, and a future
change to that header would not inherit it.

So the rule is general and its blast radius is two. **It is not a two-screen patch**, and reading it
as one is how the next dual-natured screen gets built wrong: any new screen reachable both from a
tab and from a descent has to take the same conditional, and any screen that becomes a tab root has
to lose its unconditional chevron.

**Read `isRootEntry()`. Do not compute root-ness a second way.** Both screens do
`const leading = isRootEntry() ? null : 'back';`. The two arrivals share a route, so no route test
can distinguish them - that is D40's whole finding, and a route list there produced a duplicate
history entry rather than a near-miss. The predicate is exported from `router.js` for exactly this
second caller.

**Absent, not inert, and that came free.** `appBarHTML` already renders a plain 44px
`<div class="app-bar__cell">` when `left` is null - the shape `/home` has used all along. So there
is no disabled button, no invisible control, nothing `aria-hidden` wrapped around something still
reachable. Measured on all three roots: `focusablesInHeader = 0`, leading cell `<DIV>` 44px, and the
title's centre within 1.5px of the bar's centre, so nothing shifts left when the chevron goes.

**The close X rules are untouched.** `left: 'close'` still renders the X, still binds `exitFlow`,
and a sheet's own dismiss is a different control on a different `data-action` entirely. Only the
`'back'` case became conditional.

**Verified.** Every tab root by tab tap: no chevron, `<DIV>` 44px leading cell, title centred, zero
focusables in the header, and the first four tab stops land on page content and then the tab bar -
never on the empty cell. `/tracker` via the goals card: chevron present, returns to `/goals`.
`/goals` via frame 06: chevron present, returns to `/position/summary`. Screenshots at 390px in
light and dark for all five cases. 237 tests passing.

**KNOWN DEFECT, LOGGED NOT FIXED: `GAPS.md` G59.** A cold-loaded `/goals` or `/tracker` is stamped
`root: false` and therefore **still draws a chevron on a tab root** - measured and reported here
rather than quietly shipped. Participants open a link, so cold load is the common path in a session
rather than an edge case, which makes this the most likely way to meet the very defect this rule
removes. Closing it means deciding what a non-tab-tap arrival at a tab root counts as, which is its
own change and has to answer the browser-session-restore case that could not be driven headlessly.

**Reversal.** Restore `left: 'back'` as a literal in `goals.js` and `tracker.js` and drop the two
`isRootEntry` imports.

---

## D42. The milestone list separates "done" from "available", because `current` was saying both

**Date.** 27 August 2026.

**Decision.** The milestone tracker gains a fourth state, `available`, and the Mortgage in Principle
row takes it when the checkpoint has been passed. Its copy stops saying "Unlocked" and starts
carrying a figure, in the shape the locked row already uses.

**The fault.** `MILESTONE_ICON` had three states and the unlocked variant reused `current` for its
fourth row. That made one mark mean two incompatible things depending on which variant was on
screen:

- locked variant, `['done', 'done', 'current', 'locked']` - `current` sits on "Deposit goal set",
  a milestone the participant HAS completed.
- unlocked variant, `['done', 'done', 'done', 'current']` - the same `current` sits on "Mortgage in
  Principle", which they have NOT done and may never do.

Nothing else separated them: `done` and `current` shared text colour, weight, size and row height,
so the only difference was the icon, and the icon was saying "achieved" in both places. **This study
is about whether a participant can tell what the app has done from what it has not.** A list that
says both with one mark is the confusion being measured rather than a cosmetic problem, which is why
this was not left to the copy to carry.

**The four states, and the two independent facts they encode.** The icon says done or not done. The
text colour says blocked or not blocked. A row needs both:

| State | Icon | Text | Means |
|---|---|---|---|
| `done` | `starCircleFill` | full colour | achieved, earlier |
| `current` | `starCircle` | full colour | achieved, most recently |
| `available` | `starCircleDashed` | **full colour** | not done, and not blocked |
| `locked` | `starCircleDashed` | greyed | not done, and blocked |

`available` shares the dashed circle with `locked` deliberately - a dashed circle is this build's
"not filled in yet" mark and that is exactly what is true of it. **No new vector and no new CSS
rule:** `available` takes `.milestone-row__title`'s own full-colour default, because only `--locked`
overrides it. The whole state costs one line in `MILESTONE_ICON` and one word in `tracker.js`.

**MORTGAGE IN PRINCIPLE IS THE ONLY ROW THAT CAN TAKE IT, checked rather than assumed.** Rows one
and two report the accounts, which are connected from session start (D28), so they are facts before
any screen renders. Row three reports the deposit goal, and `/tracker`'s own guard requires
`deposit-target` before it will draw. So rows one to three are always achieved by the time this list
exists, and `available` can never apply to them. If a later milestone is added that can be reachable
and not yet done, it takes this same treatment.

**DELIBERATE DIVERGENCE FROM `reference/frames/16`, recorded so it is not later read as drift.** The
reference frame draws the unlocked Mortgage in Principle row with the solid-outline star, i.e. what
this build calls `current`. This build now draws it dashed. The frame is the system of record for
layout, type and spacing and remains so; what it cannot record is a distinction that was not noticed
when it was drawn. The divergence is one icon on one row in one variant, it introduces no new
artwork, and it is reversible by changing a single line of `MILESTONE_ICON`. **Anyone reconciling
the build against frame 16 should expect this one difference and leave it alone.**

**The copy.** `mipUnlockedBody` becomes `mipUnlockedBodyTemplate`:

> was: `"Unlocked. Whenever you're ready."`
> now: `'Available from {checkpoint}. A lender's estimate of how much they might lend, worked out before you choose a property.'`

Three things were wrong with the old line. "Unlocked" is game language for a mortgage product. The
row carried no figure while the rows above it carry one, three and two. And neither state of this
row had ever said what a Mortgage in Principle actually is.

The new line is deliberately the same shape as `mipLockedBodyTemplate`, on the same figure in the
same slot, so moving between the two states reads as one figure changing state rather than as a new
sentence arriving.

**No borrowing figure is quoted, and that is not an oversight.** `borrow-low` and `borrow-high` do
not exist until `/mip/running` has written them, so there is no honest borrowing figure to carry at
this point. Quoting one would also pull in the MCOB 3A repossession warning and edge into "what you
could be offered", which the copy rules name directly. `checkpoint-amount` is the one clean figure
available: every other figure on this list is already carried by another row.

**Contrast, measured from the rendered page at 390px.** All pass AA for normal text, and the
difference between `available` and `locked` is visible as well as compliant:

| | light | dark |
|---|---|---|
| `done` / `current` / `available` title | 16.68:1 | 21:1 |
| `locked` title | 4.93:1 | 6.36:1 |
| every row's body | 4.93:1 | 6.36:1 |

The body is identical across all four states by design - it is the title that carries "blocked", so
a participant reads the difference at the top of the row where the milestone is named.

**The locked row followed, and the two now open identically.** `mipLockedBodyTemplate` was
`'Unlocks at {checkpoint}. {gap} to go.'`; once the unlocked row stopped saying "Unlocked", that was
the only place the game language survived. It is now:

> `'Available from {checkpoint}. {gap} to go.'`

**THE PARALLEL OPENING IS THE POINT, and is recorded here so it is not later tidied into two
different phrasings.** Both states now open with the same clause on the same figure - "Available
from {checkpoint}" - and diverge only after the first sentence. Passing the checkpoint therefore
reads as ONE FIGURE CHANGING STATE rather than as the row being replaced by a different sentence.
That is the same reasoning that chose the unlocked draft over the alternatives, applied to the other
half of the pair; two independently sensible phrasings would lose it.

**The definition of a Mortgage in Principle is deliberately not repeated on the locked row.** It
lives in the unlocked row alone, for two reasons: the locked row's text is greyed to
`--color-label-secondary` and is the harder of the two to read, and the unlocked state is where a
participant has a reason to act on the definition. Adding it to the locked row would put the
explanation in the state where it is least legible and least useful.

---

## D43. Screenshots come from a committed harness, and every browser-driven script seeds from one session

**Date.** 27 August 2026.

**Decision, in two parts.** `scripts/shots.mjs` is the screenshot harness for this repo and is
committed. And `scripts/session-seed.mjs` holds the one late-journey session that `shots.mjs`,
`overlap.test.mjs`, `action-bar.test.mjs` and `inset-shots.mjs` all seed from. Both are recorded
here because both are now standing rules in CLAUDE.md rather than a preference.

**Why the harness is committed.** It was being regenerated inline, as a shell heredoc, once per
session for three consecutive sessions. That cost is not the typing: an inline heredoc is
unreviewable, undiffable and hand-approved at a permission prompt every time, and one of the three
generated copies carried a duplicate `const` that threw on first run. **A verification aid that is
rebuilt each time it is used is not a verification aid**, because nothing carries forward - not the
fix to the bug in it, not the entry paths it learned to walk, not the naming. Committed, it is a
file that can be extended when a pass needs something it does not do yet, which is the instruction
in CLAUDE.md: extend it, do not rebuild it.

**What it renders, and why the entry path is one of its axes.** Routes, entry path, skip-ahead
position, theme, text size and viewport, each a comma-separated list, every combination shot. Entry
is a real walk rather than a hash write - `goals` taps the tracker card, `insights` taps the tab -
because the router records a descent and a tab root differently (D40) and that is what decides
whether the app bar draws a back chevron (D41). A harness that only ever set the hash would render a
third thing no participant sees. Output goes to the already-gitignored `.screenshots/`, with a
contact sheet built by rendering an HTML grid in the same browser rather than by adding an image
library - the repo has no runtime dependencies and the one dev dependency it has can already do it.

**One thing the harness reports rather than hides.** The shared seed sits exactly AT
`checkpoint-amount`, so "Now" and "Further along" put the same figure on screen and differ only in
which segment is filled. That is a property of the seed, not a fault in the control, and it looked
like the latter. `--saved` moves the balance below the checkpoint, and the run prints a note saying
so whenever both positions are asked for from a session at or past it.

### The shared seed, and the three differences found collapsing it

The three copies had drifted. Two differences were inert, one was load-bearing, and one of them
changed what a test covers:

- **`on-track-for` held a bare number in two of the three copies, where the model returns a
  `{ low, high }` range.** `onTrackFor()` returns a range and `tracker.js` renders it through
  `formatMonthYearRange(value.low, value.high, ...)`. The wrong shape survived because **nothing
  reads the stored key** - every consumer recomputes from `onTrackFor(state)` - so it was never
  rendered. Corrected to the range in the shared seed, so the fixture cannot teach the wrong shape
  to the next thing that does read it. No test changed behaviour.
- **`mipUnlocked` was set only by `action-bar.test.mjs`, and there it is load-bearing.** Frame 17
  draws an empty-state card with no action bar until the tracker unlocks the flow, and that test
  asserts the presence of the bar against an explicit `{ mipUnlocked: false }` row, so its baseline
  has to be `true`. It is `true` in the shared seed, which is what "a session this far along" means.
- **CONSEQUENCE, STATED RATHER THAN SLIPPED IN: `overlap.test.mjs`'s frame 17 now audits the
  unlocked variant.** It was auditing the locked one, by the accident of never setting the key. The
  unlocked card is the frame as drawn, so this is the better coverage of the two, and the suite
  passes at 64 with it. If the locked variant needs auditing it should be a row of its own with an
  explicit override, the way `action-bar.test.mjs` already does it.
- `skippedAhead: false` and `skipAheadStash: null` were set only by `action-bar.test.mjs` and are
  `state.js`'s own defaults, so they changed nothing. Stated in the shared seed anyway, so a reader
  can see which skip-ahead position the fixture starts from.

**`skip-ahead.test.mjs` deliberately keeps its own fixture** and is NOT collapsed in. Its
`savingSession()` derives `checkpoint-amount` from `CHECKPOINT_FRACTION` (D38, third amendment) so
that two tests asserting "no number is written down" follow the constant rather than being broken by
a change to it. Seeding that from a hard-coded shared value would undo exactly what that fixture was
strengthened to do.

**The rule for adding to the shared seed.** Only figures that are true of "a participant part-way
through saving" belong in it. A key that selects the variant one script is looking at belongs in
that script's own override list, because a key added to the shared seed changes every script that
imports it - which is the point of the file and also its one hazard.

## D44. The goals area does not advertise a door that redirects

**Date.** 27 August 2026.

**Decision.** `/goals` offers a bridge card only where the screen behind it will actually render
for this session. It withholds one where that screen would bounce the participant somewhere else.

**THE RULE IS NOT "ALTERNATE THE CARDS", AND THE DIFFERENCE MATTERS.** Alternation is what the
first two states happen to look like; it is not the reason for them, and stating it that way makes
the third state read as an inconsistency that a later pass would try to "fix". There is one rule,
applied three times to what the session can reach:

| Session state | Cards offered | Because |
|---|---|---|
| No deposit goal set | **Calculator only** | `/tracker` guards on `checkpoint-amount` and `deposit-target` and `replace()`s into the calculator, so a tracker card would be a door onto a redirect |
| Goal set, below the checkpoint | **Tracker only** | Both destinations render, but the calculator would open on a goal already set, and the route to change it is one screen away - `/tracker`'s own "Adjust my goal" secondary (D25) |
| At or above the checkpoint | **Both** | Both destinations render, and `/tracker` drops its secondary on this variant, so the goals area is the calculator's nearest route |

**WHY THE MIDDLE STATE DOES NOT NEED BOTH, AND THE LAST ONE DOES.** This is the whole of the
asymmetry and it is a fact about `tracker.js`, not a preference. Its action bar reads
`secondaryLabel: unlocked ? undefined : c.belowCheckpointSecondaryCta`, so **"Adjust my goal" is
drawn on the below-checkpoint variant and on no other**. Below the checkpoint the calculator is
already one tap from the tracker, so the goals area does not have to carry it. At or above the
checkpoint that secondary is gone, and without a card here the participant furthest along would
have no nearby route into the calculator at all - only frame 21 after a Mortgage in Principle "not
yet", or re-walking the journey from frame 01 through the consent screens.

**WHAT WAS BUILT AND MEASURED INSTEAD, AND REJECTED.** The first answer to that gap was to drop the
`unlocked ?` condition and draw "Adjust my goal" on every tracker variant. It was previewed at
390px in light and dark at both text sizes before being written, and it is not a layout problem -
nothing truncates or overflows. It was rejected on two grounds:

- **The pair reads as competing next steps.** Below the checkpoint the two actions agree: the
  primary is guidance that returns to the tracker and neither commits to anything. On the unlocked
  variant the primary is the one genuine forward step in the app - it opens the terminal Mortgage in
  Principle flow and writes `journeyEntryPoint` - and a secondary underneath it goes backwards into
  the calculator. Primary/secondary weighting cannot carry that distinction, because the
  below-checkpoint bar already uses the same weighting for two actions that agree. **It also
  reintroduces exactly what D25 removed**, which demoted frame 11 from primary on the grounds that
  it "is a step backwards into the calculator" - put back at the one moment forward motion finally
  exists. And directly under "You've passed the 75% checkpoint", "Adjust my goal" reads as "or
  perhaps your goal is wrong": a doubt beside an achievement. Not advice under MCOB 4.8A, since it
  recommends no course of action, but it muddies the one screen state that otherwise has a single
  clear next step.
- **It costs a milestone row.** Measured at 390x844: the dock goes 81px to 137px and the fold from
  y=707 to y=651, taking the whole milestone rows above it from **two to one** at default text (at
  large text it is already one, so no change there). D38's second amendment already paid two
  milestone rows for the skip-ahead position; this would have taken a third, from the variant that
  currently shows the most.

Showing both cards in the unlocked state closes the same gap for nothing: `tracker.js`,
`content.js`'s tracker section and D25 are all untouched, the action bar keeps its single clear
next step, and no fold moves.

**A TAPPABLE MILESTONE ROW WAS ALSO CONSIDERED AND REJECTED.** `milestoneTrackerHTML` already
supports a per-row `action` and renders a `<button>` when given one, so "Deposit goal set" could
have carried the route on the thing it changes, at no cost to the fold. Rejected because it would
make one row of four tappable in a list where nothing else is: **in a think-aloud a participant
will tap the others and get nothing, and that is a confound that would have to be discounted from
the data.** It is also close to the design rule that a row is either editable or explanatory and
never both.

**WHY NOT THE SKIP-AHEAD POSITION, WHICH WAS THE FIRST PROPOSAL.** Driving the cards from
`isSkippedAhead()` was investigated and rejected on a finding that settles it: **`skippedAhead` is
written only by `bindSkipAhead`, so no participant action ever sets it.** A card tied to it would
appear only when a facilitator pressed a prototype toggle, and a participant who completed the
calculator properly would keep being offered "Work out my deposit" for ever. It would also make a
research affordance load-bearing for participant-facing content, against D38's deletion contract -
the affordance is written to be removed in one move, and `consent.js` and `position-summary.js`
already import from it only for coherence guards that change no pixel. `/goals` reading it would
have been the first time the instrument decided what a participant sees.

**THE PREDICATES ARE THE TRACKER'S OWN.** `hasGoal` is `/tracker`'s guard verbatim and `unlocked`
is its `below-checkpoint` test, read from the same two keys, so the two screens cannot drift apart
about which state a session is in. This is the same lesson as D38's third amendment: two things
answering one question from different sources eventually disagree.

**WITHHOLDING A CARD IS NOT A GUARD, AND THE TWO DOORS STILL BEHAVE IDENTICALLY.** This entry
deliberately does not add a second copy of `/tracker`'s rule. The Insights tab is unchanged and
still resolves to `/tracker` from every route that draws a tab bar, including `/goals` itself; tap
it with no goal and it redirects into the calculator exactly as it always did. So on a fresh
session the goals page and the tab bar **do disagree about whether the tracker is advertised**, and
that is the intended result: D38's "same door" rule governs how a route behaves when it is used,
not whether every surface points at it. The Insights tab is a permanent fixture of the bank's
chrome and cannot be conditional; a card in a content section can.

**One consequence recorded rather than left to be discovered.** `/goals` previously read only
`state.accountAssignments` and `state.accountIncluded` and was identical in every journey state.
It now reads three section 6 keys and has three states. That is a real new dependency for a screen
whose whole framing is that it belongs to the surrounding bank app rather than to the feature
(D21) - but the dependency is on what the participant has done, not on how the prototype is
configured, which is the distinction that made the skip-ahead version unacceptable.

**Order, in the state that shows both.** Tracker first, calculator second, which inverts the order
used when both always showed. The card present in more than one state does not move between them -
crossing the checkpoint adds a card below the tracker rather than pushing the tracker down - and by
that point "how is it going" is the live question while "what would this take" has become the way
to change something already settled.

**Verified.** All three states walked at 390px in light and dark, with every card that is drawn
actually clicked: no goal offers the calculator alone and lands on `/calculator/property`; below
the checkpoint offers the tracker alone and lands on `/tracker`; unlocked offers both and each
lands correctly. No page errors in any state - which is the thing that had to be checked, because
both click handlers were unconditional `querySelector(...).addEventListener(...)` and either would
have thrown on `null` in the state that withholds its card, taking the other card's handler down
with it. Both are now optionally chained, so the binding cannot disagree with what was rendered.
`overlap.test.mjs` gains two rows for the two states its late-journey seed could not reach.

---

## D45. Frame 33's Journey stage sets up a session, and does it by replaying the calculator

**Date.** 27 August 2026.

**Decision.** Frame 33's "Journey stage" control is wired. Selecting a stage writes the state that
stage means, computed from a fresh `defaultState()` and through the model, in `src/stage.js`. It was
fully built and fully inert: `state.js` declared it, `content.js` held the label and three options,
`settings.js` rendered and bound it and wrote the key correctly, and no screen read the key it
wrote.

**The problem.** `/tracker` opens on a guard against the STORED `checkpoint-amount` and
`deposit-target`, and both are null until frame 09's Continue, frame 10's Continue and frame 11's
"Work it out" have all run. So tapping Insights on a fresh session redirects into the deposit
calculator, and a facilitator could not demonstrate the tracker, the skip-ahead control or the
Mortgage in Principle flow without spending session time on the calculator first. That is session
time spent on a screen the participant was not brought in to look at.

**Reconciled with D38 first, not afterwards.** D38 rejected a second session-position control by
name, frame 33 included. It was right about position and wrong about setup, and its fifth amendment
now says so: skip-ahead moves a savings position WITHIN a goal that already exists, while Journey
stage establishes whether a session has a goal AT ALL. One control for position, one for setup, and
they must never both be able to answer the same question. See D38 for how that boundary is enforced
by what each control writes rather than by convention.

**The three stages.**

| Stage | What it is | Tracker |
|---|---|---|
| Setting up | Today's empty state, unchanged | Insights still redirects to `/calculator/property` |
| Saving | A goal set through the calculator, position below its checkpoint | Frame 15, Mortgage in Principle milestone locked |
| Ready to check | The saving stage with `skipAheadPatch()` applied | Frame 16, milestone available |

**"Ready to check" is composed, not constructed.** It is the saving stage with the skip-ahead
control's own patch on top, and deliberately NOT a separately built state, and deliberately not a
cheaper property value that happens to put the checkpoint below the mock balance. A different
journey is a different participant, not the same one further along - and the point of this stage is
that the facilitator is demonstrating the SAME goal the saving stage sets up, seen later. Composing
the patches makes that literally true rather than approximately: every figure describing the goal is
identical between the two stages, and only the position within it moves. It also means the stage
cannot drift from the control, because both take the threshold from the same stored
`checkpoint-amount` and neither has a fraction, percentage or amount written down in it.

**Every stage is computed from a fresh `defaultState()`, never layered on the current store.** Two
things follow, and both are the point. Stage changes become idempotent IN BOTH DIRECTIONS: every
stage writes every key in `STAGE_KEYS`, the later ones with their own values and the earlier ones
with the default, so ready-to-check to setting-up leaves nothing behind. And the figures in a patch
are true of the session it creates, because they are derived against the same seeded account totals
the patch resets the account picture to - otherwise a participant's earlier account edit would leave
a stored `months-to-target` describing a balance the session does not hold.

**Nothing derived is written by hand.** The patch follows the calculator's own call order, screen by
screen, and takes every figure from the function that screen calls: the entered pair, then
`depositTarget`/`loanAmount`/`ltv`; then step 2's rate seeding from `MOCK_POSITION`, clamped against
`left-over` exactly as frame 10 clamps it; then `monthsToTarget`/`onTrackFor`/`checkpointAmount`.
Provenance is whatever the model returned rather than being stamped: under D5 that makes
`deposit-target` and `checkpoint-amount` 'entered' rather than 'derived', because they are partly
derived from an entered input, and it makes the monthly range and its midpoint 'read', because a
participant who accepted the seeded range has not entered anything.

**Two numbers are written down, and only two.** The property value (240,000) and the deposit
percentage (0.10) a stand-in participant would have typed and tapped. Both live in `src/stage.js`
rather than `rates.js`: they are participant inputs chosen on a participant's behalf, not rates, and
keeping them with the control keeps the affordance deletable in one move.

**Why 240,000.** It has to leave `months-to-target` inside the 60-month projection window
(`CHART_WINDOW_MONTHS`), because above it `monthsToTarget()` returns `beyond-window`, `onTrackFor()`
has no range to give, and the tracker's "On track for" row falls to a boundary variant instead of
the ordinary screen the stage exists to demonstrate. Confirmed against the mock accounts as they
stand: an 8,950 starting balance and a 255 a month savings rate put a 24,000 target at **49.3
months**, on track for **45 to 55 months**, with the window closing at about 275,800 - roughly
36,000 of headroom, so a later change to the mock balances or to the Bank Rate has room to move
before the stage silently changes which variant it demonstrates. It also leaves 8,950 below the
18,000 checkpoint, so the saving stage renders locked and "Ready to check" has somewhere to go. Both
properties are asserted as properties in `scripts/stage.test.mjs`, not as numbers.

**A stage is written, not interpreted.** `stage` is still read by no screen, and that is now a
different thing from being inert. The control writes once; nothing re-reads the key at render time.
That is what makes a participant who then runs the calculator with their own figures see the tracker
follow THEIR entries - the stage was the state they started from, not a filter over what they do
next. Walked: after "Saving" the tracker reads a 24,000 goal at 8,950 saved, locked; the same
session run through the calculator at 180,000 at 5% reads a 9,000 goal at 8,950 saved, checkpoint
passed - while frame 33 still reads "Saving", correctly, because that is where the session started.

**What the control owns, and what it will not touch.** A key belongs to `STAGE_KEYS` when its value
is a CLAIM ABOUT A DEPOSIT GOAL: the goal's figures, the account picture they are read from, and the
flags asserting a goal exists or has been acted on. Selecting a stage is a scenario reset, so
anything asserting a goal the new stage does not have would be a lie left behind - a surviving
`mipUnlocked` would let `/mip` be deep-linked by a session with no goal, and a surviving
`checkRunAt` would claim a soft search was recorded against a goal that no longer exists. It owns
nothing that is a claim about the BROWSER (`journeyEntryPoint` and `flowEntryHistoryLength` are
written from `window.history.length` on a click per D30/D32 and cannot be reconstructed from a
patch; `journeyStarted` is written on the same click and splitting the trio is worse than leaving
it), nothing that is a claim about the CLOCK (`targetMonth`/`targetYear`, which frame 10 seeds from
today's date on its own first render), nothing belonging to another frame 33 control, and nothing
`router.js` already resets.

**`mipUnlocked` is deliberately not set by any stage.** The tracker's own "Check my Mortgage in
Principle" control writes it, together with the entry point the flow's close X reads. A facilitator
taking that tap is part of the demonstration rather than something to skip past, and it is the tap
that makes the flow's exit behaviour correct.

**Frame 33 stays facilitator-only and URL-reachable only.** No gesture is added and no on-screen
link. Unchanged by this entry.

**`scripts/session-seed.mjs` is NOT this patch, and should not become it.** The two look similar and
do opposite jobs. `FULL` is a browser-harness fixture, deliberately "past nothing in particular", so
each script overrides the two or three keys selecting the variant it is auditing; it holds
hand-written derived figures on purpose, and its property value was chosen to stress layout. The
stage patch is one fixed scenario, derives every figure through the model, and its property value
was chosen to stay inside the projection window. Making either the source of the other would drag
one file's constraint into the other: the harness would lose the freedom to pick a variant by
overriding two keys, or a participant-facing session would inherit figures picked for pixel
measurement. `FULL` keeps its own copy, and keeps carrying `stage: 'saving'` as a plain recorded
value - which is now a session that went through the calculator with its own figures after a stage
was set, exactly the case two paragraphs above.

**Verified.** Driven in Chromium at 390px against the real screens, not against the model alone.
Fresh session, each stage, tap Insights: "Setting up" lands on `#/calculator/property` (the redirect
cascade, unchanged); "Saving" lands on `#/tracker` showing 8,950 of a 24,000 goal, "You're 9,050
away...", milestones done/done/current/locked, "Unlocks at 18,000"; "Ready to check" lands on
`#/tracker` showing 18,000, "You've passed the 75% checkpoint", the Mortgage in Principle row
available. Ready-to-check toggled to "Now" through the tracker's own control is byte-identical in
`sessionStorage` to "Saving" set directly - key order included - apart from the single `stage` key,
which is the separation D38's fifth amendment requires rather than a defect. Seven stage selections
by real clicks across all three stages in both directions: every revisit byte-identical to that
stage's first visit, and "Setting up" byte-identical to an untouched fresh session. 260 tests
passing - 43 model, 68 overlap, 89 action-bar, 15 sheet-drag, 13 bottom-nav, 11 skip-ahead, plus 21
new in `scripts/stage.test.mjs`. `CACHE_VERSION` v34.

**Reversal.** Delete `src/stage.js`, its line in `sw.js`'s `SHELL_ASSETS`, `scripts/stage.test.mjs`,
the `stagePatch` import and the third argument to `settings.js`'s `bindGroup('set-stage', ...)`, and
the `defaultState` export in `state.js`. The control returns to inert; nothing else changes.

---

## D46. A draft is not a figure: frame 09 stops writing null, and the fix is upstream of every consumer

**Date.** 27 August 2026.

**Decision.** Clearing frame 09's property value field no longer writes `property-value: null`. The
empty field becomes that screen's own draft state (`propertyValueCleared`), the committed figure is
left standing, and the four screens that read `property-value` live are fixed at once rather than
one at a time. `gapToCheckpoint()` moves onto the stored `checkpoint-amount` in the same pass.

**The symptom, and why it was not the defect.** GAPS.md G62 reported `/tracker` rendering "You're £0
away from the point where checking a Mortgage in Principle starts to be useful" beside an £8,950
headline and "of your £24,000 deposit goal". Reproduced exactly. But the £0 was a consequence three
screens wide, not the fault - and G62 both understated its scope and misidentified one of the two
cases it named. See that entry for what it got wrong; this one records what was actually true.

**The root cause.** `calculator-property.js` wrote `property-value` on the field's `change` event,
while every other figure that screen owns - `deposit-target`, `loan-amount`, `ltv` - is written on
**Continue**. That asymmetry is the whole bug. It let the store hold a half-made edit
(`property-value: null`) beside a committed goal (`deposit-target: 24000`): a combination no
downstream screen expects, and one no guard tests for, because each guard tests the keys it needs
and none of them needs both.

**Three screens were broken, and `formatCurrency(null)` is why they lied rather than failed.** It
returns "£0". So frame 12's headline read "A deposit on a £0 home could be £0 to £0", frame 11's
property row read £0, and the tracker carried three separate £0s. A figure the app could not compute
was displayed as if it had been computed. That is the rule this build cares about most.

**Why the fix is upstream and not per consumer.** Per-consumer null-handling would mean writing
"we can't show this" copy on three screens for a state that should not exist, and every screen added
later could regress independently. Not writing the null removes the state instead. One change, four
screens fixed, and nothing to remember next time.

**An empty field was never committable, so it is now not recordable either.** Frame 09's Continue is
already disabled while the field is empty (`primaryDisabled: isEmpty`). The app had therefore
already decided an empty property value is not a value; the store was simply not told. `isEmpty`
now reads `propertyValueCleared || value === null` - two different facts that draw the same variant:
a session that has never entered a value, and a participant re-typing one they already committed.

**"Adjust my goal" means adjust.** There is no delete-my-goal affordance anywhere in the app, so
abandoning a half-made edit must leave the committed goal standing. The alternative considered and
rejected was to clear the downstream commits along with the field, which would have made the
tracker's guard fail and redirect honestly - but it destroys a participant's goal as a side effect
of clearing a text field, and there is no way back from it.

**A second route to the same state, found while verifying and closed with it.** `"-"`, `"."` and
`"-."` survive the input strip and yield `NaN`. `NaN` used to be written to the store, and
`JSON.stringify` persists it as `null` - so a refresh reproduced the entire defect through a
different door, and would have survived this fix. Only a finite number is committed now. Frame 09's
error variant is untouched: it is reached by a committed value the model rejects, `0` (ROUTES.md's
own recipe) or a negative, and both are finite.

**`gapToCheckpoint()` reads the stored checkpoint.** One line, and its one caller is `/tracker`,
whose guard has already tested `checkpoint-amount`. This is D38's third amendment applied to its
second consumer: a screen must not display a figure re-derived from a key its own guard never
checked, because the two sources will eventually disagree. It is defence in depth rather than the
fix - after the change above there is no disagreement to have - and it makes the tracker derive only
from keys the guard proved present. G62's stated reason for not doing this, that the function has
"other callers", was not true.

**Deliberately not done.** Teaching frames 11, 12 and 15/16 to handle a null `property-value`. After
the upstream fix there is no null to handle, and inventing fallback copy for an unreachable state
would add screens the spec never drew. The invariant is written down instead, in two places that
will actually be read: `CLAUDE.md` gains a **State rules** section, because this is a rule the next
screen that takes an input will break unless it is somewhere a session reads before starting, and
`scripts/g62.test.mjs` asserts it.

**The test asserts the invariant, not the symptom.** A test written against the £0 would pass the
moment any one of those three screens learned to hide it, while the store went on holding a state no
screen expects. What is asserted is that abandoning a draft changes no committed key - on the stored
JSON string, so a key-order change cannot slip past either.

**`shots.mjs` gains `--draft=property-cleared`**, which is deliberately not a figure change: it sets
the flag and clears nothing, unlike `--goal=none` which clears four keys. It is the only way to
shoot a state that is a draft rather than a set of figures.

**Verified.** The six-step reproduction driven in Chromium at 390px - and it is six, not five:
"Adjust my goal" lands on frame 11, and the property field is one further tap on ("Change"). At
step 4 the store now reads `property-value 240000, propertyValueCleared true, deposit-target 24000`,
the field renders empty, and Continue is disabled. At step 6 `/tracker` reads **"You're £9,050
away"** and **"£24,000, a 10% deposit on a £240,000 home"**. In the same cleared state frame 12 reads
"A deposit on a £240,000 home could be £12,000 to £36,000", frame 11 reads £240,000, and `/learn/ltv`
now renders instead of redirecting. Every input path walked: `"-"`, `"."` and `"abc"` set the draft
and leave the figure; `"0"` and `"-500"` commit and raise the error variant; `"300000"` commits and
enables Continue; a refresh after `"-"` leaves the committed value intact. Ten screenshots at 390px
in light and dark across all five screens, dark mode unchanged. 270 tests passing - 43 model, 68
overlap, 89 action-bar, 15 sheet-drag, 13 bottom-nav, 11 skip-ahead, 21 stage, plus 10 new.
`CACHE_VERSION` v35.

**Reversal.** Restore the single `setState` in `calculator-property.js`'s `change` handler, drop
`propertyValueCleared` from `state.js` and `stage.js`, restore `checkpointAmount(state)` inside
`gapToCheckpoint()`, and delete `scripts/g62.test.mjs` and the `--draft` option. G62 reopens with it.

---

## D47. Rule 1A's 60% clause is a flag, and G61 was three findings under one number

**Date.** 27 August 2026.

**Decision.** The FCA copy rule's 60% clause is a FLAG, not a FIX. The section header names the
section's dominant action; the clause states its own, and where they differ the clause wins. The
skill is corrected so this does not have to be resolved a second time. G61 is closed and split
three ways: the flagged default is resolved as a decision with no figure changes, the stronger
finding underneath it is opened as its own gap, and the one part that genuinely was a copy defect
is fixed.

**Why the clause is a flag, and it is not about the wording.** Rule 1A governs COPY, and **no screen
states £255 or 67%**. The midpoint exists only in the store: frame 10 shows the £200 to £310 range,
frame 11 shows the same range, and frame 12 and the tracker show what follows from it in months and
dates. Frame 10 headlines no proposed amount, frames none as a share of what is left, sets no
target, and states two facts - "£380 is what's left each month once your essentials are covered.
£310 is what you've been putting aside lately." **That is the remedy the three FIX bullets ask for,
already met.** A default the screen does not state is not a copy defect; raising it is a decision
about a figure, which sits outside a copy audit.

**The skill is corrected rather than the reading recorded.** A contradiction that has to be
re-resolved by every reader is a defect in the rule, not in the reader. Section 1A now says in its
heading that the 60% clause is the exception, says why a heading and a clause can differ, and
carries the reasoning above as its worked example. The cost of leaving it was measured: it took a
full investigation to establish, and would have taken another.

**G61a - the 67% default. Resolved, no figure changes.** The default stays flagged and is not being
raised. The £200-£310 range is fixed by the reference frames, which draw both figures and the
£0-£380 track exactly, so lowering it would take the built screen out of alignment with its own PNG
and change `MOCK_POSITION` values documented as read from the instant saver's deposit history.

**G61b - the £310 upper handle at 81.6%. Opened as its own gap, deliberately unresolved.** It is the
stronger finding and G61 did not contain it: £310 is **displayed**, twice on frame 10 and again on
frame 11, where £255 is displayed nowhere; 81.6% is above the 80% the rule itself names as
predictably failing, where 67% is only above the 60% flag line; and "You could put aside £310 a
month" is the rule's own example of a screen breaching it. The number in the rule is the number in
this build.

Both sides are recorded in the entry rather than one. **For it:** £310 is captioned as a fact about
the persona's past behaviour, read from the instant saver's own deposit history, and the grammar is
descriptive throughout - which is exactly why G61a resolves as it does. **Against it:** the slider
seeds its upper handle from that figure and Continue commits the midpoint whether or not a handle
moved, so **the app does default to it**, and the 60% clause is about defaults rather than about
description. A figure can be described honestly and still be the default. Recorded as G63.

**G61c - frame 11's caption. Fixed.** `monthlySavingCaption` read "The range you set"
unconditionally, so a participant who accepted the seeded range without touching a handle was told
they had set it. This is the part of rule 1A that genuinely was a copy defect: the section's own
remedy is "hand the choice to the user", and the screen was claiming a choice the participant had
not made.

The row now picks by provenance, following `position.js`'s own pattern on frame 05 rather than
inventing one - `read` gives "Read from what you've been putting aside lately", `entered` keeps "The
range you set". The new caption reuses frame 10's own words for the same figure ("what you've been
putting aside lately") behind frame 11's own prefix for a read figure ("Read from the accounts you
assigned to your deposit"), so it introduces no new vocabulary. The provenance test is written the
same way `calculator-saving.js` writes it when committing the midpoint, so the two cannot disagree
about what counts as having set the range. Copy-checked: it states a fact about past behaviour,
proposes nothing, and `read` is the correct provenance value under rule 8.

*Known limitation, logged not fixed.* The 10b date path derives the range from the chosen date and
lands on provenance `entered`, so it also reads "The range you set" where a **date** is what was
set. Loose rather than false - the participant did make the input it derives from - and separating
it needs a third string keyed on `solveFor` rather than on provenance, which is a wider change than
the defect warrants.

**Two things found in the same pass and logged separately, because neither is G61.** Both are
reachable in an ordinary session and both are on frame 10b. `G64`: the date path has no ceiling at
all, where the slider path clamps every input to `left-over` - `monthlyAmountFromDate()` is
unbounded and Continue commits it directly, which on the screen's own **default seeded date**
commits £331 to £404 against a £380 `left-over`, with no warning and no handle touched. `G65`: the
solved amount is computed on every render and never displayed, so a participant commits to a figure
they do not see until frame 11. Reference PNG 10b was checked rather than assumed and draws no
readout either, so the build is faithful and the gap is in the design, not the code - which makes
G65 a "Confirm" for the design owner, and G64 the argument for putting it to them.

**Verified.** Driven in Chromium at 390px. Straight through the calculator with no handle moved:
provenance `read/read`, row reads "£200 to £310 / Read from what you've been putting aside lately".
Lower handle dragged to £240 and continued: provenance `entered/entered`, row reads "£240 to £310 /
The range you set". The 10b path: provenance `entered/entered`, row reads "The range you set" - the
logged limitation, and the same run that produced G64's £331 to £404. No figure changed anywhere.
`CACHE_VERSION` v36.

**Reversal.** Restore the unconditional `caption: c.monthlySavingCaption` in
`calculator-review.js`, drop `monthlySavingReadCaption` and the `monthlySavingProvenance` binding.
The skill correction and the gap split stand on their own and would not need reverting with it.

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
| 22 August 2026 (general-mode tracker) | D26 recorded, closing `GAPS.md` G51: frames 15/16 gain a fourth variant for a session with no linked accounts. There is no truthful basis for a progress figure - zero is a claim about the participant, `MOCK_POSITION` is account data, and no constant measures what anyone has saved - so the balance and the progress bar are dropped rather than filled. The headline becomes the goal they set, milestones 1 and 2 sit at `locked`, none is `done`, and the "This month" card becomes "Your plan" carrying the monthly range and what it implies. Frame 16 has no general-mode counterpart. All three consent-path variants render byte-identical; `overlap.test.mjs` gains a `15-general` frame. |
| 22 August 2026 (guidance line) | D27 recorded: a second guidance-not-advice line for sessions where no account activity was read, selected by `src/regulatory.js` on `left-over === null && money-in === null`, applied to frames 04, 09, 10, 11, 12, 13, 13b, 15, 29, 30 and 32. The FCA-checked line is untouched and every consent-path screen renders byte-identically. `GAPS.md` G52 closed; G53 (the new line awaits a copy check), G54 (frames 29 and 32 still claim account sourcing in their own copy) and G55 (the pre-consent frames) opened. |
| 22 August 2026 (account-linking removed) | D28 recorded: the account-linking choice, estimate mode and general mode are deleted, and the read figures are seeded at session start instead of at frames 03 and 05. Frame 03 becomes "Your accounts" and keeps the account-assignment input; frames 04 and 05b, `mode`, `savingsWithUs`, `consentGiven`, `consentStatementChecked`, `GENERAL_SAVINGS_RANGE`, `generalAnnualRange()`, `src/regulatory.js` and `shared.regulatoryAwaitingCheck` all go. Reverses D26 and D27, amends D24. Closes `GAPS.md` G51-G55 by removal. Deviation from `build-spec.md` sections 2, 3 and 7 recorded here rather than applied there. |
| 22 August 2026 (history as the back stack) | D29 recorded: `goBack()` (`history.back()`) becomes the single implementation of back, called by the app-bar leading cell, the calculator form-step header and all seven sheets' dismiss control, none of which names a destination any more. Eleven state guards, `/reset` and frame 19b's two timer transitions convert to `location.replace()` so a guard overwrites its entry instead of adding one - the frame 09 cascade under `GAPS.md` G50 now moves one screen per tap. `seedHistoryRoot()` puts `/home` behind a cold arrival on a deep route, tested on `history.state` rather than `history.length`. Amends D21 (back from `/goals` retraces the participant's step) and D18 (unchanged in behaviour: the drag inherits `goBack()` through the dismiss control it already clicks). `returnFrame` stays, unused by any back control. |
| 22 August 2026 (close X) | D30 recorded: the app bar's leading cell splits into `app-bar-back` and `app-bar-close`, so the X leaves the journey via a new `exitFlow()` while the chevron keeps `goBack()`. New `journeyEntryPoint` state records `/home` or `/goals` on entry, because `returnFrame` names whichever screen opened the current sheet and cannot answer this. Frame 10c's "Leave" follows it; its X and "Keep going" do not. The sheet carve-out holds structurally - sheets dismiss through a different `data-action`. `replace()` does not unwind the flow, only the exited entry: back after an exit lands on the step before it. Amends D29. |
| 22 August 2026 (rates fixed) | D31 recorded: every rate becomes explanatory. The "Change" links on the savings interest rate and tax rate rows are removed from frames 10/10b and 11, and frames 15/16's rates-card heading stops being a button; all six values keep their provenance captions. Frame 13 and 13b stay - they are comprehension content and change no rate - but the heading's route to frame 13 moves to an `infoLink` below the card, labelled "What a bigger deposit changes" (D25's own CTA wording) and rendered only in the checkpoint-reached and goal-met variants, where the below-checkpoint CTA that otherwise reaches frame 13 is absent. `savings-rate` (a monthly amount, not a rate) and deposit-percentage selection are unchanged. |
| 22 August 2026 (chevron corrections) | D32 recorded: frames 13, 33 and 22 take the back chevron instead of the close X, none of them being a flow boundary; frame 22's "Done" moves to `goBack()` with it, dropping a `returnFrame` push that left the confirmation on the stack. `exitFlow` stops overwriting one entry and goes back by the difference between `history.length` now and at flow entry, measured at 4 and 9 steps on the two entry routes, falling back to D30's `replace` when the delta is missing or not positive. Amends D30. `GAPS.md` G57 and G58 opened. |
| 22 August 2026 (bank-branch removal verified) | D33 recorded: the savings-location question and its branch confirmed absent from the code, and `build-spec.md` sections 1, 2 and 7 stripped of the rows that still documented them - the question, its two options, all six frame 04 transitions, the 05b variant, frame 10's general-mode row and frame 33's Mode control. Section 3 keeps frames 04 and 05b at status "Removed - DECISIONS.md D28", the frame inventory being the Figma mapping. Records what the answer used to change (frame 05 provenance, frame 10's slider ceiling, frame 04's annual range, D27's second guidance line) and what each is now. No figure changed value. `GAPS.md` left intact as a dated log. Completes D28. |
| 22 August 2026 (provenance captions) | D34 recorded: every figure now states its source. `figureRowHTML` gains an optional caption in trailing mode - it was the one figure-bearing component without one, which is how frame 08's savings interest rate was shown with no source. Three captions were wrong rather than missing: the savings interest rate was credited to the participant's instant saver on frames 10/10b/11/32 when it is `RATES.bankRate` anchored to the Bank of England Bank Rate (D3), and the wrong claim had reached a code comment in `accounts.js`; essential spending was described three different ways, with frame 32 alone claiming a 6-month averaging window nothing performs; and frame 12 used one caption key for two different derivations. `bankRateCaptionTemplate`, `essentialSpendingCaption` and `leftOverCaption` move to `shared`, and the bank-rate caption resolves `{source}` from `RATES.source` so it cannot name a source the model did not use. Six new captions name two values each, a shape no existing caption had; frames 15/16's rate-band caption additionally names which figures it covers, because the row carries a rate from a different source. Frame 21's "at your current rate" - the one caption the `savings-rate` misnomer had corrupted - adopts frames 15/16's wording. |
| 22 August 2026 (false "Watched") | D37 recorded: frame 13's explainer marker changes from "Watched" to "Opened", and `explainerWatchedLabel` is renamed `explainerOpenedLabel`. Frame 13b's media block has no playback, and `ltvVideoSeen` is set by dismissing the sheet however it was entered - so the row claimed a video had been watched, sometimes by a participant who had asked for the diagram and never touched the video row. When the flag is set is unchanged; only its label. Swept all eight journey flags: `ltvVideoSeen` is the only one a screen reads to display a claim, and a text sweep of 23 routes found no other false-action marker. Three near-misses left alone and listed in the entry, including frames 15/16's unconditional "You told us what each one's for", which is reported as unsure rather than changed. **D8 and G17a corrected in the same commit**: both said frame 13's "See it as a diagram" row had been removed; `git log -S` shows it was only ever added, both rows open 13b per the reference PNG's own annotation, and the frame 13 entry in G29's screenshot-exemption list cited a deviation that does not exist. Original reasoning left intact, corrections appended and dated. |
| 22 August 2026 (frame 18 timeline) | D36 recorded: frame 18's `[Visual aid]` placeholder is replaced by the process timeline it specified - four labelled nodes joined by a hairline, Mortgage in Principle marked as where the participant is, the three ahead of them reading as ahead rather than done. **It is a process sequence, not a progress indicator, and is exempt from DESIGN.md's bar exclusions on that basis** - vertical, discrete nodes rather than a filled track, measuring nothing, with no completed state at all. Vertical because four horizontal labels do not fit 62px columns at 320px. New `circleDot` icon and `processTimelineHTML` component; no new colour, spacing or width token. Not interactive: no button, link, tabindex or pointer cursor, proved by walking the tab order. An `<ol>` with `aria-current="step"` and a visible "You are here", so sequence and position are not carried by the drawing alone. Frame 13b's separate `[Visual aid]` and the `.media-placeholder` video block are untouched. |
| 22 August 2026 (MiP reachable) | D35 recorded: the Insights tab resolves to `/tracker` (Payments and Profile stay disabled), which makes the six-screen Mortgage in Principle flow reachable - it was already built and already wired, and nothing navigated to the tracker. `diamondFill` added, because `TAB_ICONS_ACTIVE` held twins for two tabs and lighting a third called `undefined`; the glyph lookup now falls back to the outline, and the tab hint stops being a Home-or-Goals ternary. The tracker's action bar is confirmed as the single entry (`reference/frames/16` draws it; the instruction's "milestone row is a live link" did not hold), and the locked milestone row drops its no-op `<button>`. `journeyEntryPoint` gains `/tracker`, so the X on 17, 18, 19b, 20 and 21 exits to the tracker rather than frame 01. Four copy keys change: the entry stops claiming the prototype issues a decision in principle, and frames 19 and 19b stop implying a check runs here. No knowledge check built on frame 17 - it exists in no spec, wireframe or frame, and the author confirmed it came from a stale summary. |
| 26 August 2026 (first-entry stamping) | D41 amended and **`GAPS.md` G59 closed**. D41's rule is unchanged; the stamping underneath it gains one case. On the first entry of a session no descent can have happened, so if that entry lands on a tab root it IS a root and `seedHistoryRoot` stamps it `root: true`, reading the roots from `NAVIGABLE_TABS` rather than a second list. The route decides at that boundary and nowhere else - screens still ask `isRootEntry()` only. Fixes a cold-loaded `/goals` or `/tracker` drawing a chevron on a tab root, which mattered because participants open a link and cold load is the primary arrival path in a session. Measured after: `/home`, `/goals`, `/tracker` cold all report `isRootEntry() === true` with no chevron; `/position/summary` and `/consent` cold report false and keep theirs; refresh preserves the stamp in both directions. Knock-on reported: a cold `/home` is now a root, so the first tab tap of a session replaces rather than pushes and ten root-to-root switches cost +0 where they cost +1. Session restore still unmeasured. 235 tests passing. |
| 27 August 2026 (goals bridge cards become conditional) | **D44 recorded**: `/goals` offers a bridge card only where the screen behind it will actually render, and withholds one where that screen would redirect. **The rule is not "alternate the cards"** - alternation is what the first two states look like, not the reason for them, and framing it that way would make the third read as an inconsistency later. No goal: calculator only, because `/tracker` would `replace()` into the calculator. Goal set, below the checkpoint: tracker only, because the calculator is already one tap away via `/tracker`'s "Adjust my goal" secondary (D25). At or above the checkpoint: **both**, because `tracker.js` draws that secondary on the below-checkpoint variant and no other, so without a card here the participant furthest along has no nearby calculator route at all. The predicates are `/tracker`'s own guard and its own `below-checkpoint` test, read from the same keys, so the two screens cannot drift apart. Rejected on the way: drawing "Adjust my goal" on every tracker variant - previewed at 390px, light and dark, both text sizes, and it is not a layout problem, but it reads as competing next steps beside "Check what a lender might lend you", reintroduces the backwards step D25 demoted, and costs a milestone row above the fold (dock 81px to 137px, fold y=707 to y=651, two whole rows to one at default text). Also rejected: a tappable "Deposit goal set" milestone row, because one tappable row in a list of four inert ones is a think-aloud confound. Also rejected, earlier: driving the cards from `isSkippedAhead()`, because `skippedAhead` is written only by `bindSkipAhead` and no participant action sets it, so the tracker card would have appeared only when a facilitator pressed a toggle - and it would have made a research affordance load-bearing for participant-facing content, against D38's deletion contract. `tracker.js`, the tracker content keys and D25 are all untouched. Both `/goals` click handlers are now optionally chained; either would have thrown on `null` in the state that withholds its card. D38 part one amended on the "both cards, always" framing; `ROUTES.md` gains its first `/goals` row and the three-state table. `overlap.test.mjs` gains `goals-no-goal` and `goals-below-checkpoint`, the two states its late-journey seed cannot reach; `shots.mjs` gains `--goal=none` for the same reason. `CACHE_VERSION` v33. 239 tests passing. |
| 27 August 2026 (screenshot harness committed, seed collapsed) | **D43 recorded**, in two parts. `scripts/shots.mjs` becomes the committed screenshot harness - routes, entry path, skip-ahead position, theme, text size and viewport as comma-separated lists, every combination shot, output to the already-gitignored `.screenshots/` with a contact sheet built by rendering an HTML grid in the same browser rather than by adding an image library. It replaces a heredoc that had been regenerated inline for three consecutive sessions, cost a hand-approved permission prompt each time, and shipped a duplicate `const` that threw on first run. Entry path is one of its axes because `goals` and `insights` are real taps, not hash writes, and only a real tap makes the router record a descent (D40) and so decide the back chevron (D41). And `scripts/session-seed.mjs` becomes the ONE session `shots.mjs`, `overlap.test.mjs`, `action-bar.test.mjs` and `inset-shots.mjs` all seed from. Three differences found collapsing the copies: `on-track-for` held a bare number in two of them where the model returns a `{low, high}` range, inert because nothing reads the stored key, now corrected; `mipUnlocked` was set only by `action-bar.test.mjs`, where it is load-bearing, and is `true` in the shared seed - **so `overlap.test.mjs`'s frame 17 now audits the unlocked variant rather than the locked one it was hitting by accident, which is the frame as drawn**; `skippedAhead`/`skipAheadStash` matched `state.js`'s defaults and changed nothing. `skip-ahead.test.mjs` keeps its own fixture on purpose (D38, third amendment). One line added to CLAUDE.md: screenshots come from `scripts/shots.mjs`, never from a harness generated inline. No app code touched, so no `CACHE_VERSION` bump. 235 tests passing. |
| 27 August 2026 (stale fold measurement corrected) | D38's SECOND amendment corrected in place, and the fourth amendment's claim that it was left alone withdrawn. The second amendment's "two whole rows above the fold" was measured against a 169px block and has been wrong since the note removal took the block to 103px. **A stale measurement in a decision record is worse than none, because the next person reasons from it.** The original figure, its 169px block height and its date stay visible; the re-measurement sits beside them, at 390x844 against the same fold that paragraph uses (`.screen-content`'s bottom, y=788): 169px two whole rows with "Deposit goal set" cut, 103px three with "Mortgage in Principle" cut, 99px three with "Mortgage in Principle" cut. **The third row came back with the note removal, not with the gap change** - 66 of the 70px - and the cause is stated so it is not misattributed. Verified by reproduction rather than arithmetic: forcing the block back to 169px returns the recorded figure exactly. The decision is unaffected; no position above the milestone list keeps all four rows at any of the three heights. The pinned action bar's own fold (y=651) is named for the first time and gives one whole row at all three heights. No code change, so no `CACHE_VERSION` bump. |
| 27 August 2026 (skip-ahead internal gap) | D38 amended a fourth time, closing the question the third amendment left open: the gap between the label and the segmented track becomes `--space-sm` (8). **One declaration changed and nothing else.** The reasoning is taken from what the block is rather than from what was removed from it - two parts, a control and its own label, which is the one relationship this build already spaces at 4 or 8 and at nothing between: `.settings-control` (frame 33) puts a label 8 above its own pill segments, `.currency-input` (frames 09, 09a, 09b) puts one 8 above its field, and `.progress-bar`, two elements below this block on this same screen, sits its "Checkpoint" label 4 under its track. 8 is the value for a label above something a participant taps. The restyle amendment's defence of 12 rested on the supporting note binding to the toggle, and is void because there is no note; both it and the open-question paragraph are superseded on this value and on nothing else. Measured on both routes into `/tracker`, both themes and both positions - eight renders, all identical: block 103px to **99px**, gaps unchanged at 0 above, 32 below and 16 between every other pair in `.screen-content`, label 18px, track 56px, measured label-to-track 8px, width 350px at x=20 untouched. The 4px is reclaimed by the screen below the block and buys nothing at the fold - whole milestone rows above it are unchanged at one against the pinned dock (y=651) and three against `.screen-content`'s bottom (y=788). One tab stop, arrows and Home/End move and select, `aria-checked` flips both ways, both accessible names intact, no dangling ARIA references, three round trips byte-identical, dark mode unchanged. Noticed and reported rather than rewritten: the second amendment's "two whole rows above the fold" was measured against a 169px block and went stale when the note was removed, not here. `CACHE_VERSION` v32. |
| 27 August 2026 (skip-ahead note removed, read-source fixed) | D38 amended a third time, and one of its own claims CORRECTED. The entry recorded the unavailable branch as unreachable behind `tracker.js`'s guard; that was never true. The guard tested the stored `checkpoint-amount` and `deposit-target` while `canSkipAhead()` recomputed the checkpoint live from `property-value` x `deposit-pct`, and clearing the property-value field on frame 09 nulls `property-value` without clearing the committed `deposit-target`. Reproduced through ordinary actions - tracker, "Adjust my goal", clear the field, return - the control drew itself inert. Fixed by removing the disagreement rather than the branch: `canSkipAhead()` and `skipAheadPatch()` both read the stored `checkpoint-amount` the guard tests, so "Further along" is enabled wherever `/tracker` renders. `skipAheadPatch()` had to move too, or the option would have been enabled and done nothing. Stash-and-restore untouched; three round trips byte-identical. The `savingSession()` fixture now derives `checkpoint-amount` from `CHECKPOINT_FRACTION` so two "no number is written down" tests keep their meaning. Separately, the supporting note is removed - both strings, the element, the `aria-describedby` and the dead CSS rule - because the control is operated by the facilitator, who does not need the explanation; the label survives and still composes each option's accessible name. Block 169px to 103px, gaps unchanged at 0/32/16. The 12px internal gap is left as it was and flagged as an open question. `CACHE_VERSION` v31. 235 tests passing. |
| 27 August 2026 (milestone states) | D42 recorded: the milestone tracker gains a fourth state, `available`, and the Mortgage in Principle row takes it once the checkpoint is passed. `current` was doing two jobs - "achieved most recently" on the locked variant's third row and "you may now do this" on the unlocked variant's fourth - and nothing but the icon separated them, which is the exact distinction the study measures. The icon now says done or not done, the text colour says blocked or not blocked. `available` reuses `starCircleDashed` and needs no CSS rule at all, taking the full-colour title default that only `--locked` overrides. Mortgage in Principle is the only row that can take it, checked: rows one and two are facts from session start (D28) and row three is required by `/tracker`'s own guard. Deliberate, recorded divergence from `reference/frames/16`, which draws that row with the solid outline. Copy: `mipUnlockedBody` becomes `mipUnlockedBodyTemplate`, "Unlocked. Whenever you're ready." giving way to "Available from {checkpoint}. A lender's estimate of how much they might lend, worked out before you choose a property." - game language out, a figure in, and the row finally says what a Mortgage in Principle is. No borrowing figure quoted because none exists before `/mip/running` writes one. Contrast measured: title 16.68:1 light / 21:1 dark for `available` against 4.93:1 / 6.36:1 for `locked`, all AA. `mipLockedBodyTemplate`'s "Unlocks at" is left for a separate decision. `CACHE_VERSION` v29. 235 tests passing. |
| 27 August 2026 (skip-ahead stays at the top, decided) | D38 amended: the experiment that moved the block below the checkpoint sentence was built, verified, committed and then reverted with `git revert`, and **the control staying at the top of `.screen-content` is recorded as a decision rather than an unresolved trade**. The reason: the block is 150-190px tall whatever its rules, so no position above the milestone list keeps all four rows above the fold - measured identically at two whole rows for a bottom rule, two rules, no rule, and the position immediately after `.progress-bar` - while every position that does keep four either splits the milestone list from its own caption, lands three pixels above the fold, or puts app content on both sides of the block, which a one-sided rule cannot fence and which needs a bracketing mark this build does not otherwise use. The top is the position where the app's content is on one side only, which is the condition that makes the single dashed edge correct. Cost accepted: two milestone rows below the fold. Carried forward from the reverted commit and kept: the position-is-load-bearing framing at the head of the `.skip-ahead` comment, the warning that a treatment must not follow the block to a new position unexamined, and the finding that no rule at all fails wherever the neighbours are not cards. `CACHE_VERSION` v28. 235 tests passing. |
| 27 August 2026 (skip-ahead restyled for the tracker) | D38 amended again: the control's TREATMENT catches up with the move recorded above. Placement, behaviour and four of the five strings are unchanged. The dashed box goes - a dashed box is this build's placeholder idiom (`.media-placeholder`, `.visual-aid-placeholder`, `.routes-illustration`) and a research instrument must not wear it - replaced by a single dashed bottom rule, which is the build's existing unsettled-not-settled mark (`.account-group-header--unassigned`, `.status-card__still-to-sort`) and puts the boundary on the side the app's content is on. `margin-top: var(--space-3xl)` becomes `margin-bottom: var(--space-lg)`, so the block adds no top spacing, `--screen-inset-y` alone governs, and the 56px void below the app bar goes: 0px above, 32px below, every other gap on the screen 16px. Horizontal padding removed, so the block aligns to the 350px content column and the track widens 318 to 350, matching the headline figure, the progress bar and the action bar button - width does not mark app content on this screen, fill and weight do, and the block gives up both. The internal gap stays at 12 after being screenshot at 8 and rejected: at 8 the note reads as a caption on the toggle and appears to disclaim only the toggle, when what a participant might take as real is the deposit figure below. `skipAheadNote` takes its one deliberate copy amendment - "what this screen shows then" - the screen no longer naming itself in the third person. Three stale CSS comments corrected. Contrast unchanged and re-measured from the page: light 4.93/4.93/16.68/5.28, dark 6.36/6.36/21/5.95. Three round trips leave state identical. `CACHE_VERSION` v26. 235 tests passing. |
| 26 August 2026 (skip-ahead moves to the tracker) | D38 amended: the skip-ahead control moves from the bottom of `/goals` to the top of `/tracker`, above the headline figure, on both routes into the tracker and nowhere else. Still a research affordance that would not exist in a production build. Copy unchanged verbatim; the five `skipAhead*` keys move from `/goals` to `/tracker` unedited. `skipAheadHTML` and a new `bindSkipAhead` move out of `goals.js` into `src/skip-ahead.js`, so the affordance really is one module plus one CSS block plus five keys plus two lines in `tracker.js`. Option accessible names now compose the label with the position - "Prototype control: skip ahead, Further along" - because a radiogroup announces its name once on entry and a participant arrowing between two options would otherwise lose the prototype framing. The unavailable branch becomes unreachable behind `tracker.js`'s `checkpoint-amount`/`deposit-target` guard and is KEPT, with that guard named so it is obvious the branch goes live if it is relaxed. Interest earned now shares a screen with the control but sits ~1200px below the fold, so the two are never seen together; unfixed, per D34. `overlap.test.mjs` gains a `16-skipped` row and drops the two `/goals` control rows. 235 tests passing. |
| 25 August 2026 (back chevron) | D41 recorded: a screen draws the back chevron only when there is a preceding screen inside its own flow, so a tab root draws none. Stated generally; it changes `/goals` and `/tracker` only because those are the two DUAL-NATURED screens - a tab root by one route and a descent by another - so both become conditional rather than losing the chevron. Both read `isRootEntry()` (D40), which is the only fact that can separate the two arrivals to one route. `/home` is the third root and is already correct, but by hardcoding two empty cells in `home.js` rather than by the rule, and is noted as such. Absent not inert: `appBarHTML`'s null-`left` branch already rendered a plain 44px `<div>`, so the slot stays reserved, the title stays centred within 1.5px, and the header has zero focusables. Close X untouched. `GAPS.md` G59 still open: a cold-loaded tab root stamps `root: false` and so still draws a chevron. |
| 25 August 2026 (Insights tab root) | D40 recorded, and **D29 restated on the axis that actually governs it**: a descent pushes, a lateral move between roots replaces, a guard replaces - the original "Guards replace, user navigation pushes" kept underneath as superseded phrasing, because it named the initiator as a proxy for the shape of the move and had no way to classify a participant-initiated move with nothing behind it. The three tab roots are `/home`, `/goals`, `/tracker`. Tab taps from a root now `replace`: ten switches go from +10 entries to +0. New `ROOT_MARKER` per history entry and an exported `isRootEntry()`, which is the only fact that can tell a tab-root arrival from a descent to the same route - a route list produces a duplicate entry, and history depth is wrong because a tab root nearly always has the previous tab or the seeded `/home` behind it. D35 amended: `journeyEntryPoint` is the flow entry point, not the screen arrival route, so the flow X still returns to `/tracker` from both routes. Cold load / deep link / session restore still stamp `root: false` - logged as `GAPS.md` G59, open. |
| 24 August 2026 (pinned action bar) | D39 recorded, **superseding D17**: the action bar is visible from first paint on all 27 screens that have one and stays visible while the content scrolls beneath it. D17's hidden state, reveal, focus-reveal path and rise transition are removed; its measured height, its content-scrolls-under-the-bar overlap and its 56px fade survive, the fade moving from inside the dock to immediately above it now that the bar is always opaque. `src/action-bar.js` now decides LAYOUT rather than visibility: pinned to the bottom where the content overflows, inline after the last card where it fits, the two modes provably unable to oscillate because `scrollHeight - clientHeight` is the same number in both. `.bottom-nav` gains `margin-top: auto` so the tab bar stays at the bottom of the phone screen in both modes - a defect the geometry test passed straight through and a contact sheet caught. The brief's "pad by the action area plus the bottom navigation" is met for the action area by computed padding and for the tab bar structurally, which is stronger; padding both would double-count. New `scripts/action-bar.test.mjs`, 89 assertions over 20 screens x 4 viewports plus 7 sheets. `GAPS.md` G38 closed by removal - the deviation from the reference frames is gone, so its screenshot exemption goes with it. |
| 24 August 2026 (goals -> tracker, skip-ahead control) | D38 recorded, in two parts. `/goals` gains a deposit tracker card beside the calculator card, both built from one new `ctaCardHTML` helper, routing to `/tracker` - the same route the Insights tab resolves to (D35), with back following D29 because the card writes no state at all. And `/goals` alone gains a skip-ahead control, **a research affordance that would not exist in a production build**: a `role="radiogroup"` selecting between the starting savings position and `CHECKPOINT_FRACTION` x `deposit-target`, at which the Mortgage in Principle milestone unlocks. No fraction or amount is written down anywhere in it. It stashes the position it replaces and restores it verbatim, so three round trips leave state byte-identical and nothing the participant entered moves; `months-to-target`, `on-track-for` and `max-property` are recomputed because they are stored rather than derived, and only where already committed. Frames 03 and 06 stop clobbering the stashed position. Two things are reported as incoherent rather than fudged: frames 15/16's "Interest earned", a directly-read mock figure fixed by D34, and the per-account balances on frames 03, 06 and 32, which cannot rise without inventing balances. A copy check raised the supporting note from caption to footnote size. 143 tests passing. |
| 22 August 2026 (D32 collision resolved) | The provenance-captions entry, recorded second under a number the chevron entry already held, becomes **D34**; the chevron entry keeps D32. Four citations meant the provenance entry and were updated - its own heading, its change-log row, `content.js`'s shared-caption comment and `accounts.js`'s bank-rate comment. Nine meant the chevron entry and were left alone: `GAPS.md` G57 (twice) and G58, `router.js`, `state.js`, `learn-ltv.js`, `mip-adviser.js`, `settings.js`, and its own change-log row. D33's paragraph recording the collision as open is corrected. Sequence is now D1-D34, no duplicate and no gap; D34 sits before D33 in the file, and D20 before D13, neither being renumbered or moved. `CLAUDE.md` gains a working rule to take the next number from the last entry. |

| 27 August 2026 (journey stage wired) | **D45 recorded**, and **D38 amended a fifth time** to reconcile with it. D38 rejected a second session-position control by name, frame 33 included; it was right about position and wrong about setup. Skip-ahead moves a savings position WITHIN a goal that already exists, Journey stage establishes whether a session has a goal AT ALL - one control for position, one for setup, and they must never both be able to answer the same question, enforced by what each control writes rather than by convention. Frame 33's stage control was fully built and fully inert; it now writes the state each stage means, from `src/stage.js`. **Setting up** is the empty state unchanged, **Saving** is a goal set through the calculator with the position below its checkpoint, **Ready to check** is that same saving stage with `skipAheadPatch()` applied - composed rather than separately constructed, because a different journey is a different participant rather than the same one further along. Every stage is computed from a fresh `defaultState()`, so a change is idempotent in BOTH directions, and every figure comes from the model function the screen that commits it calls, in the calculator's own order - two numbers are written down, the property value and the deposit percentage a stand-in participant would have typed and tapped. 240,000 keeps `months-to-target` inside the 60-month window: **49.3 months**, on track for **45 to 55**, the window closing at about 275,800. `stage` is still read by no screen, which is now a different thing from inert - it is written once and never re-read at render time, so a participant who then runs the calculator with their own figures sees the tracker follow their entries. Verified in Chromium at 390px: each stage set from frame 33 then Insights tapped, landing on `/calculator/property`, frame 15 and frame 16 respectively; ready-to-check toggled to "Now" through the tracker's own control byte-identical in `sessionStorage` to saving set directly, key order included, apart from the single `stage` key that records which pill is lit. `ROUTES.md` corrected in three places rather than the two expected - its "Read this first" paragraph also claimed no setting seeds figures, and named a `mode` control D28 removed. `scripts/session-seed.mjs` deliberately stays separate, and why is recorded. New `scripts/stage.test.mjs`, 21 assertions. `CACHE_VERSION` v34. 260 tests passing. |
| 27 August 2026 (draft state, G62 closed) | **D46 recorded**, closing `GAPS.md` G62 and correcting it. The symptom was `/tracker` reading "You're £0 away" beside an £8,950 headline and a £24,000 goal; the cause was not `gapToCheckpoint()` re-deriving. `calculator-property.js` wrote `property-value: null` on the field's `change` event while `deposit-target`, `loan-amount` and `ltv` are written on Continue, so the store held a half-made edit beside a committed goal - a state no screen expects and no guard tests for. **Three screens were broken, not one**, and two are unmentioned in G62: frame 12's headline read "A deposit on a **£0** home could be **£0** to **£0**", frame 11's property row read £0, and the tracker carried three separate £0s (the gap sentence, "a 10% deposit on a **£0** home", and the rate-band table). `formatCurrency(null)` returns "£0", which is why all three fabricated a figure instead of failing visibly. **G62 was also wrong twice**: `learn-ltv.js` is not a second unhandled case (its own guard redirects - into frame 12, which was the broken screen), and `gapToCheckpoint()` has one caller, not "other callers", which was the only reason given for not applying D38's third-amendment fix to it. **Fixed upstream**: an empty field is now the screen's own draft state (`propertyValueCleared`), the committed figure is left standing, and all four consumers are fixed at once - per-consumer null-handling would have meant inventing "we can't show this" copy on three screens for a state that should not exist. A second route found while verifying and closed with it: `"-"`, `"."` and `"-."` survive the input strip, yield `NaN`, and `JSON.stringify` persists `NaN` as `null`, so a refresh reproduced the whole defect; only a finite number is committed now, and frame 09's error variant (`0`, negatives) is untouched. `gapToCheckpoint()` moved onto the stored `checkpoint-amount` as defence in depth. Rejected: clearing the downstream commits too, which would make the tracker redirect honestly but destroys a participant's goal as a side effect of clearing a text field. `CLAUDE.md` gains a **State rules** section - screen-local draft state never writes to a section 6 figure, and a screen may only display a figure derived from a key its own guard tested - because this is the rule the next screen that takes an input will break. New `scripts/g62.test.mjs` asserting the invariant rather than the symptom, 10 assertions; `shots.mjs` gains `--draft=property-cleared`. Verified in Chromium across the six-step reproduction (six, not five - "Adjust my goal" lands on frame 11), every input path, and 10 screenshots in light and dark. `CACHE_VERSION` v35. 270 tests passing. |
| 27 August 2026 (rule 1A resolved, G61 split) | **D47 recorded.** Rule 1A's 60% clause is a **FLAG, not a FIX** - a heading names a section's dominant action, a clause states its own, and where they differ the clause wins. The reason is not the wording: the clause governs COPY and **no screen states £255 or 67%**, while frame 10 headlines no proposed amount, frames none as a share of what is left, sets no target, and states two facts - which is the remedy the three FIX bullets ask for, already met. The skill is corrected in place so the contradiction does not have to be resolved again; leaving it had already cost one full investigation. **G61 closed and split three ways.** *G61a*, the 67% default: resolved as a documented decision, **no figure changes**, still flagged, the £200-£310 range being fixed by the reference frames which draw both figures and the £0-£380 track exactly. *G61b*, opened as **G63** and deliberately unresolved: the £310 upper handle is **81.6%** of left-over, it is **displayed** twice on frame 10 and again on frame 11 where £255 is displayed nowhere, 81.6% is above the 80% the rule itself names as predictably failing rather than merely above the 60% flag line, and "You could put aside £310 a month" is the rule's own example of a breach - the number in the rule is the number in this build. Both sides recorded in the entry: **for**, it is captioned as a fact about the persona's past saving and the grammar is descriptive throughout; **against**, the slider seeds its upper handle from it and Continue commits the midpoint whether or not a handle moved, so the app does default to it, and the clause is about defaults rather than description. *G61c*, **fixed**: frame 11's `monthlySavingCaption` read "The range you set" unconditionally, telling a participant who accepted the seeded range that they had set it - the one part of rule 1A that genuinely was a copy defect, since the section's own remedy is "hand the choice to the user". The row now picks by provenance following `position.js`'s frame 05 pattern; `read` gives "Read from what you've been putting aside lately", reusing frame 10's own words for the figure behind frame 11's own prefix for a read one, so no new vocabulary. Known limitation logged not fixed: the 10b path lands on `entered` and also reads "The range you set" where a date is what was set. **Two findings logged separately as neither is G61**, both on frame 10b and both reachable in a session: **G64**, the date path has no ceiling where the slider path clamps to `left-over`, so the screen's own default seeded date commits **£331 to £404** against a £380 left-over with no warning; **G65**, the solved amount is computed every render and never displayed - reference PNG 10b checked rather than assumed and draws no readout either, so the build is faithful and the gap is in the design. `CACHE_VERSION` v36. 270 tests passing. |
