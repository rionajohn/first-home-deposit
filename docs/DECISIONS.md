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

**Confirmed 19 August 2026.** `loan-amount` is the central value for `borrow-low`/`borrow-high`, matching the table above. Confirmed against the alternative salary-based reading; kept because it stays consistent with how `max-property` is already derived (`borrow-high` + `saved-toward-deposit`) - decoupling the MIP result from the deposit-calculator's loan-amount would break that chain.

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

**Refinement, 29 August 2026: where the caption is REQUIRED, and where it says nothing.** Added with D62, and drawn from this decision's own rationale rather than as an exception to it.

A provenance caption is required wherever the figure did not originate with the participant. It is omitted where the figure sits in a permanently editable field they typed into directly, because there the caption states only what the control already shows: "You entered this", under a field holding what they entered, is a tautology rather than a disclosure.

**This narrows the caption, not the provenance.** The Decision above is untouched and is about what a figure CARRIES: every figure still holds one of the four values, and propagation is unchanged. What changes is where that value is surfaced. The Why is untouched too - it forbids approximating a caption, and a row with no caption approximates nothing.

**Frames affected: 11 only.** Its property-value and monthly-saving rows lose their captions; its "Saved so far" row keeps one, because that figure is read from the accounts rather than typed, and it is the only row on the screen where a typed figure and an account-derived one would otherwise be indistinguishable. That row switches to "You entered this" on a typed edit and back to its account caption when the assigned accounts next recompute, so the change of provenance stays visible. The screen's two explanatory rows - the savings interest rate and the tax rate - keep their captions unchanged; neither is editable and neither figure is the participant's.

No other frame changes. Frame 05's figure is editable but carries a caption that distinguishes two real sources ("Amount you set" versus the read left-over), which is a disclosure rather than a tautology, and frames 09 and 10b's fields carry hints rather than provenance captions.

---

## D6. Lifetime ISA cap trigger - property value, not annual contribution

**Decision.** Frame 09b's warning triggers when `property-value > £450,000`.

**Why.** Matches the £450,000 figure already referenced elsewhere in the wireframes (frame 06's Lifetime ISA note, and 09b's own warning text), and is a single-field check against a value the participant has just entered - reliable to trigger in a session. The alternative (annual LISA contribution > £4,000) would require tracking a new derived figure that `build-spec.md` never defines anywhere else.

**To reverse.** One constant (`lisaCapPropertyValue = 450000`) in `src/model/rates.js`.

---

## D7. States with no wireframe - build a fallback, and the corrected count

**Decision.** All eleven states in `build-spec.md` section 2 marked "No frame drawn" get a fallback built from existing component patterns (error banners, empty-state cards, locked-row styling) rather than being made unreachable.

**Correction.** Section 2 lists eleven such rows, not fifteen as Q3 originally said. Recounted directly against the table: 04 at bound; 05/05b error; 06 emergency fund short; 06 no accounts assigned; 09 error; 10/10b error; 12 beyond chart window; 12 unreachable; 15/16 goal met; 17 locked; 19 incomplete.

**Why.** Blocking navigation would hide exactly the edge-case behaviour a think-aloud session is meant to surface. A composed fallback keeps the session moving without inventing new visual design.

**To reverse.** Each fallback lives in its own screen module under `src/screens/`; disabling one is a one-line change to the triggering condition.

---

## D8. Frame numbering gaps - 14 and 22 to 28 confirmed skipped

**Decision.** Frames 14 and 22 through 28 are not built. Frame 13's "See it as a diagram" row (the likely reference for 14) is removed from the build rather than stubbed. The Mortgage-in-Principle results' "Talk to someone about it" row (20, 21) - the likely reference for something in 22 to 28 - is kept and built, but as a new screen outside the numbered sequence: `/mip/adviser` (see D10).

**Why.** No PNG, no Figma node, and no other evidence that 14 or 22-28 were ever drawn - only forward-references that terminate without a destination. Removing the one dead-end control (13's diagram row) is the fastest path to a testable prototype without inventing screens beyond what the spec drew. The second dead end is treated differently because whether a participant reaches for it is itself a finding worth observing - see D10.

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

**Decision.** All currency figures display rounded to the nearest whole pound. No pence shown anywhere. Locale en-GB, symbol £, thousands separated - already decided. The model keeps full precision; only the formatted display rounds.

**Why.** Standard en-GB convention for figures this size; needs one formatting helper (`src/model/format.js`) rather than a rule that varies by figure or context.

**To reverse.** One rounding mode in `format.js`.

---

## D10. The Mortgage-in-Principle adviser route rests on MCOB 4.8A and Consumer Duty, not PERG 4.6

**Decision.** The obligation to offer a route to human advice after a Mortgage-in-Principle result is not FCA PERG 4.6.25B(5). That rule is boundary guidance: it keeps an eligibility tool like this one on the guidance side of the advice boundary, and says nothing about requiring an adviser route. The correct basis is two separate rules: MCOB 4.8A (execution-only sales - the customer must be told they can request advice) and the Consumer Duty consumer support outcome (no unreasonable barriers to a customer pursuing their financial objectives).

**Why this matters.** Citing PERG 4.6 for this obligation would misstate what that rule does, and the error would need correcting later if it reached the write-up. The adviser route (`/mip/adviser`, a terminal stub - request logged, no form, no booking calendar) is justified by the rule that actually requires it.

**To reverse.** N/A - citation correction, not a reversible build decision.

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
| 33 Prototype settings | Facilitator-only, deliberately outside the participant journey, reachable only by typing the URL (`GAPS.md` G23). It has its own close control back to frame 01 already. **Amended 28 August 2026 (D54):** also reachable by a long press on the disabled Profile tab - still nothing visible, and the leading control is now the back chevron (D32), not a close. |

**One qualification, on the calculator's step flow (09, 09a, 09b, 10, 10b, 11).** These *keep* the bar - "from anywhere in the journey" includes mid-calculator - but its Home tab opens frame 10c ("Leave this for now?") instead of jumping straight to frame 01. `build-spec.md` section 1 already defines what leaving the calculator means: the form-header close on 09/10/10b opens 10c, and only 10c's own "Leave" sets `journeyPaused = true` and retains the draft inputs. A tab bar that bypassed that would silently discard a participant's part-entered figures. Frame 11 draws no close control, but it is the same step flow holding the same drafts, so it is treated the same way.

### Amended 21 August 2026: Goals is a live tab

**What changed.** `/goals` exists now (D21), so the Goals tab has a destination. It is enabled, it routes to `/goals`, and it is the lit tab while the participant is on that screen - `aria-current="page"`, the active rule, and the bold label, the same three cues Home has always used. Payments, Insights and Profile are unchanged.

**Why this is not a new deviation.** D11's original reasoning was that four of the five tabs are the surrounding bank app and out of prototype scope, so they are drawn but inert. `/goals` moved one of them *into* scope: it is a built screen with a route, and D21 put the journey's own "save for something else" exit there. A tab pointing at a screen that exists and is deliberately reachable is no longer a dead end, and leaving it `disabled` would mean the participant could reach `/goals` from frame 06's exit but not from the bar that is showing Goals as one of five places they can be. The tab bar is also now the only cue that `/goals` is *outside* the feature - it lights a different tab, which is the clearest signal the app has that the participant has stepped out of "Your first home" and into the bank around it.

**What the tab does not do.** It does not become live on the screens D11 already excludes - the seven sheets, 19b and 33 have no bar at all - and mid-calculator it behaves exactly as the Home tab does, routing through 10c so a part-entered set of drafts is never silently discarded. That qualification below was written for Home and now covers both live tabs; the rule was always about the calculator, not about which tab was pressed.

**Which tab is lit is a fact about the route**, held in `router.js`'s `TAB_FOR_ROUTE` map. Only exceptions are listed; everything else falls back to Home, because as far as the surrounding bank app is concerned the whole "Your first home" journey lives under Home.

**One place renders the bar, and it is the same place that binds it.** Frame 01 used to draw its own copy of `bottomNavHTML`, on the reasoning that the bar is part of what frame 01 is and `mountBottomNav` is a no-op when a bar is already present. That no-op is what broke: `mountBottomNav` is also what attaches the tab listeners, and its "already mounted" guard - there so the `MutationObserver` does not re-append on every mutation - made it return before binding anything. Frame 01's tabs were rendered and wired to nothing. Invisible for as long as Home was the only live tab, since tapping Home on frame 01 is a no-op either way; not invisible once Goals resolved, when it became an enabled, focusable button that did nothing, on the first screen of the study and on no other. Frame 01 no longer renders the bar; `mountBottomNav` renders and binds it everywhere.

**Implementation.** `bottomNavHTML` in `src/components/ui.js`, which takes `{ active }` and reads `NAVIGABLE_TABS` - the single list of which tabs resolve, shared with `src/router.js`'s `mountBottomNav`, so a tab cannot be rendered enabled in one file and left unbound in the other. Mounted against an exclusion set, so a screen added later inherits the bar without anyone remembering to add it. Because several screens re-render themselves in place from a toggle handler and rewrite every child of `#app`, a `MutationObserver` re-mounts the bar rather than ~20 screen modules each having to render it. Each tab is at least 48px in both dimensions (D1).

**Superseded, then restored.** This originally read: "Height is 56px plus `env(safe-area-inset-bottom)`, carried by the bar itself so its surface runs to the bottom edge of the display the way a native tab bar's does; `.screen` takes the bottom inset only on the screens with no bar, so the two never double up." D14's safe-area pass reversed it - the bar became a plain 56px above a reserved band on `.screen` - and D14's bottom-inset pass (20 August 2026) restored it, because the band read as the app floating off the bottom edge. The original wording is accurate again, with one refinement: `.screen` now zeroes its own bottom padding whenever *any* bottom chrome is present, not only a tab bar, so the tab bar, a lone action bar and a sheet's action bar are all handled by one rule. See D14.

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

*Amended 31 August 2026 by **D92**, in two particulars. The transform is no longer on `#app-frame`:
that element is now the layout box, sized to the frame's rendered dimensions, and `.device-bezel`
carries the `scale()`. And the page DOES scroll, at framed widths only, on a window shorter than the
frame - the frame is never drawn below its natural size any more, so scrolling is what makes the
bottom of the phone reachable. The page's own scrollbar is no longer hidden at framed widths for the
same reason. Everything else here stands, including every scrollbar inside the bezel.*

**To reverse.** Both changes are contained to `src/css/shell.css`.

### The reserved safe-area space, and why it is not the status bar

**Decision.** The vertical space a device's system furniture occupies is reserved inside the phone screen, on every screen including sheets and overlays: 59px at the top for the status-bar area, 34px at the bottom for the home indicator.

**The two insets are placed differently, and that is the point.**

| | Where it lives | What the band paints |
|---|---|---|
| **Top (59px)** | `padding-top` on `.screen`. Nothing is drawn in it and nothing scrolls into it. | Empty screen background. |
| **Bottom (34px)** | **Inside the lowest chrome on the screen** - the tab bar, or the action bar where there is no tab bar, or the sheet's action bar. | That chrome's own surface. |

**Revised 20 August 2026 (bottom-inset pass).** The bottom inset started life the same way as the top one, as `padding-bottom` on `.screen`. That put it *underneath* the tab bar, so the bar stopped 34px short of the bottom of the phone screen and left a band of page background below it - the app visibly floating off the bottom edge. G39 had already found and fixed the identical mistake on sheets, where the band painted the scrim and so was obvious; on a full screen the band painted `--color-bg`, the same colour as the app behind the tab bar, which is why it survived a pass longer.

The inset is not removed - it moves. `.screen` zeroes its own `padding-bottom` wherever something at the bottom edge can carry it, and that element takes it as its own padding instead. The chrome's background then reaches the bottom of the phone screen, exactly as a native tab bar's does, and the band stops being empty space and becomes part of the bar.

**The rule, for every screen type:** whatever sits lowest touches the bottom edge, with the safe-area inset inside it and nothing empty beneath.

| Lowest chrome | Carries the inset as | Screens |
|---|---|---|
| Tab bar | `padding-bottom` on `.bottom-nav`, `height: calc(56px + var(--safe-bottom))` | 19 full screens |
| Action bar, no tab bar under it | `padding-bottom` on `.action-bar`, selected by `.screen > .action-bar-dock:last-child` | none currently - see below |
| Sheet's action bar | `padding-bottom` on `.bottom-sheet .action-bar` (G39) | the 7 sheets |
| Nothing at the bottom edge | `padding-bottom` on `.screen`, the fallback | 19b, 33 |

The second row is unreachable today: every screen with an action bar also has the tab bar below it, and the two screens with no tab bar (19b, 33) have no action bar either. The rule is written anyway so it holds if D11's exclusion list changes, and it is exercised in the verification pass by excluding a screen from the tab bar and measuring.

**Touch targets are measured on the interactive area, above the inset.** The tab bar's content box stays exactly 56px under `box-sizing: border-box`, with the inset padding below it; tabs measure 51–57px inside that, and clipping each at the top of the inset band still leaves 51–56px. No target relies on the inset to reach D1's 48px minimum.

**The usable content area is unchanged by the move.** At framed widths `.screen-content` measures 647px before and after: the screen's 852px less the 59px top inset, less the app bar's 56px, less the tab bar's 56+34. The inset moved from one side of the bar to the other; it was not reclaimed.

One consequence worth stating: `.screen`'s children no longer all "end above the bottom inset". The lowest one ends *at the bottom edge*, with the inset inside it. Scrolling content still stops above the tab bar exactly as before, because the tab bar's box is taller, not because a band sits under it.

**These are two separate things, and the distinction matters.**

| | Status: |
|---|---|
| The status bar **element** - a drawn bar with a clock, signal and battery | **Still absent.** D1's Android constraint table says "No status bar element anywhere in the markup or CSS" and that is unchanged. Nothing is drawn in the reserved band; it paints screen background and nothing else. |
| The **space** a status bar occupies on the device | **Now reserved.** It was not before, and that was the defect. |

Conflating the two is what produced the bug. D1 removed the element for a good reason - a mid-fidelity prototype that draws a fake 9:41 and a fake battery invites participants to comment on the mock rather than the design, and the drawn bar would be wrong on whichever platform the participant is not on. But removing the element silently removed its 93px of height as well, which D1 never intended and never said. The Figma frames are 393x852, and that 852 is a whole device screen: 59px of it belongs to the system at the top, 34px at the bottom, and only 759px is the app's. Building without the insets gave every screen 852px of usable height where the wireframe gives 759, so content sat flush against the bezel and every screen read looser and more cramped at once - more content crammed in, less breathing room around it - compared with the frame it was drawn from.

**Values, and why they are floors rather than constants.** `--frame-safe-top` and `--frame-safe-bottom` in `shell.css`, used as `max(env(safe-area-inset-*), <floor>)` at framed widths only. Below the 768px breakpoint the app is running on real hardware, so `env()` is used alone and the device reports its own inset - a phone with no notch gets no top band, and nothing is hardcoded onto a real screen. At framed widths the app is running in a mock of a device, `env()` resolves to 0 in a desktop browser, and the floor is what reserves the space. `max()` rather than a flat value so a real device wide enough to land in the framed view - an iPad, or a phone in landscape - still wins with its own larger inset instead of being cut back to the mock's number.

**Scrolling content scrolls under the top inset, not into it.** `.screen-content` is a flex child of the padded `.screen`, so its box begins below the band, and its own `overflow-y: auto` clips there. Content disappears beneath the reserved band as it scrolls; it is never visible inside it. Verified at every scroll position on the longest screens in the flow: with the content scrolled to its end, no element paints inside either band.

**Sheets and overlays.** The sheet card is held out of the status-bar area by `padding-top` on `.sheet-overlay`.

**Corrected 20 August 2026 (sheet-bottom pass).** The bottom inset was originally placed the same way - as `padding-bottom` on `.sheet-overlay` - and that was wrong. Padding on the overlay sits OUTSIDE the card, so with `justify-content: flex-end` it lifted the whole sheet 34px off the bottom of the phone screen and left a band of scrim beneath it: the sheet visibly floating away from the bottom of the device. It read as a defect on a sheet and not on a full screen only because `.screen`'s equivalent band paints `--color-bg`, the same colour as the app behind the tab bar, while a sheet's band paints the dark scrim.

The bottom inset now sits INSIDE the card, as `padding-bottom` on the sheet's own action bar, so the card's surface reaches the bottom edge the way a real sheet's does and the inset band paints that surface. The rule this settles, for both kinds of screen: whatever sits lowest - the action bar on a sheet, the tab bar on a full screen - sits at the bottom of the phone screen, with the safe-area inset below it and nothing empty beneath that. Full screens already satisfied it and are unchanged.

Both insets now resolve from one pair of variables, `--safe-top` / `--safe-bottom` in `shell.css`, rather than each container spelling out its own `max(env(...), floor)` - which is how the two came to disagree about where the bottom one belonged. `.bottom-sheet`'s `max-height` moved from `92vh` to `92%` in the same pass: `vh` measured the browser viewport, which at framed widths has nothing to do with the 852px frame (at 1440x900 it resolved to 828px, taller than the frame's own safe area), so a tall sheet could push up through the reserved top band.

The scrim is the one thing that deliberately does cover both bands. A safe-area inset keeps *content* clear of the system's furniture; it does not stop a background painting there, and dimming the whole screen is what a real sheet does. Absolutely positioned boxes resolve `inset: 0` against their containing block's padding box, so this happens without a special case.

**D11 was right the first time.** D11 originally recorded the tab bar as carrying the bottom inset itself, so its surface ran to the bottom edge of the display - the iOS convention for a real tab bar. D14's first pass reversed that on the grounds that "the reserved bands are empty and no chrome bleeds into them". That reasoning holds at the top of the screen, where nothing is drawn; at the bottom it produced the floating-off-the-edge defect above. The bottom-inset pass restores D11's original arrangement and generalises it to the action bar and the sheet card. D11's annotation is updated to say so.

**To reverse.** Set `--frame-safe-top` and `--frame-safe-bottom` to `0px` in `shell.css`. Nothing else reads them, and no screen module knows the insets exist. `--safe-top` / `--safe-bottom` are the single resolved pair every consumer reads; no component spells out its own `max(env(...), floor)`, and none should - that duplication is what let the top and bottom insets drift apart in the first place.

**For the write-up.** Worth a sentence, because it changes how much fits on a screen without scrolling - which is directly relevant to any finding about whether participants noticed content below the fold.

---

## D15. One drawn icon set, on one canvas, sized from the type scale

**Decision.** Every icon in the prototype is drawn in `src/icons.js` as inline SVG on a shared 24x24 canvas, and nothing renders an icon any other way. The `.svg` files under `assets/icons/` are deleted (the PWA app icons and the favicon stay - those are install artefacts, not UI), no screen uses `<img>` for an icon, and the character glyphs that stood in for icons are gone.

Icon size comes from `--icon-size-*` in `tokens.css`, derived from the type scale at roughly 1.2x the font size an icon sits beside; stroke weight comes from `--icon-weight-*`, one per font weight the type scale actually uses.

**Why.** The icons were exported piecemeal from Figma, each on whatever canvas it happened to be drawn on, then rendered at a fixed pixel box. Stroke width is expressed in the *source* canvas's units, so the same nominal 1.5-unit stroke rendered at wildly different weights depending on how far each asset had to be scaled:

| Asset | Source viewBox | Rendered at | Rendered stroke |
|---|---|---|---|
| `chevron-right.svg` | 6.5 x 7.5 | 20 x 20 | ~4.0px |
| `chevron-up.svg` | 10 x 4 | 20 x 20 | ~3.0px |
| `back.svg` | 24 x 24 | 24 x 24 | ~1.5px |
| `tick.svg` | 12.8 x 9.8 | 12.8 x 9.8 | ~1.8px |

So a list-row chevron drew two to three times heavier than the app bar's back arrow on the same screen. Three further inconsistencies came out of the same audit: `back.svg` rendered at 24px and `close.svg` at 20px in the same 44px app-bar cell; `.info-link__icon` rendered at 16px on frame 04 and 20px everywhere else; `.list-row__chevron` rendered at 16px on frame 33 and 20px everywhere else. A single canvas makes all of that unrepresentable - one declared weight now means one optical weight everywhere.

Two things improve as a side effect. Icons inherit `currentColor`, so they follow the palette instead of carrying baked-in hex values that the `.theme-dark` palette (D13) could never have reached. And because size multiplies by `--text-scale`, icons now scale with frame 33's "Text size: Large" control, which the fixed-pixel assets never did.

**Drawing conventions.** Apple's SF Symbols conventions, not Material. `developer.apple.com/sf-symbols/` was fetched and yields one usable sentence ("Symbols come in nine weights and three scales, automatically align with text..."); the linked HIG page returns only its `<title>` to a fetch, the same SPA behaviour already recorded at the top of `tokens.css`. So the geometry is stated in `icons.js` as this build's decision, from that sentence plus what is directly observable in any SF Symbols rendering: round caps and round joins without exception, stroke weight tracking the weight of the text beside it, relative stroke weight rising at small sizes and easing off at display sizes, and drawing inside an optical square rather than filling the canvas.

**What is deliberately not done.** The SF Symbols font is not embedded and none of Apple's symbol artwork is shipped or traced. Apple's licence for those assets is written for apps on Apple platforms; this is a web app. What is matched is the drawing convention, which is not the artwork.

**What each icon depicts is unchanged.** This is a restyle, not a redesign: the tab bar still shows a house, a two-way transfer, concentric rings, a rhombus and a ring; the locked milestone is still a dashed ring around a faint star, not a padlock. Two icons in the set are drawn but currently unused - `chevronLeft` and `lock` - because the brief named them; the notes in `icons.js` say where each would apply and why swapping it in would be a design change rather than a restyle.

**Deviation from the reference PNGs.** Every screen's icons are redrawn, so every screen differs from its reference PNG in icon weight and, on a handful of screens, icon size. Recorded as an intentional deviation and **exempt from the screenshot-comparison pass** for icon rendering only - everything else on those screens is diffed normally. See `GAPS.md` G34.

**To reverse.** `src/icons.js` and the `.icon` block in `components.css`. Every call site passes an icon function, so reverting means restoring the assets and the `<img>` tags too - this is not a one-line change.

**For the write-up.** Like D1 and D11, a build-stage design decision the wireframes did not dictate. Worth a line in the methodology chapter, because icon weight is one of the things a participant's eye reads as polish.

---

## D16. A checkbox on every countable account, and in-place updates that hold their place

**Decision.** Two changes to frame 03, made together because the second is what makes the first usable.

**Each counting account gets its own checkbox.** A participant can see *which* accounts are being counted toward their deposit, not only how many. Only accounts flagged `countsTowardDeposit` in `accounts.js` get one - Pot, Savings, Cash ISA, Lifetime ISA, Stocks and shares ISA, including one the bank has not sorted yet. A current account and a short-term goal pot get none, from the same flag the count and the totals already read.

**Toggling anything updates the screen where it stands.** No re-render throws the participant back to the top, and the control they just touched keeps focus.

This is a **deliberate design change, not something in the reference frames.** Frame 03's PNG draws no per-account control at all. It is **exempt from the screenshot-comparison pass** for the account rows and the count - see `GAPS.md` G37, recorded alongside the existing exemptions.

**Why the checkbox.** `GAPS.md` G36 closed with this left open, and the screenshots taken then showed the problem plainly: with everything deselected, the accounts still listed under "Toward your deposit" with a £0 subtotal, and a deselected account looked identical to a selected one. "0 of 5 selected" tells a participant how many, never which. In a think-aloud that is the difference between someone saying "so it's not counting my Cash ISA" and someone unable to tell, which makes their commentary about the totals uninterpretable. The count and the group subtotal were doing a job neither is shaped for.

**Two targets on one row, deliberately separate.** The row was a single `<button>` that opened 03b. It is now a container holding a 48x48 checkbox label and, beside it, a button carrying the name, type, balance and chevron that still opens 03b. Nesting a `<label><input></label>` inside a `<button>` is invalid HTML and would give one tap two meanings. Both targets meet D1's 48px minimum, and they do not overlap. Rows with no checkbox start at the card's left edge rather than against an empty box - an unticked box on an account that can never be counted would invite a tap that does nothing.

**Ticking follows the rule select-all already had.** `toggleAccountPatch` in `accounts.js` is `selectAllPatch` narrowed to one account: ticking marks it included *and* files it under "Toward your deposit", because an account sitting under "Not sorted yet" is not being counted however its flag reads; unticking clears the flag and leaves the filing alone. Asserted in `accounts.test.js`: ticking all five one at a time produces exactly the same selection as one select-all.

### The scroll jump, and why it was everywhere

**The bug.** Every screen module builds itself with `container.innerHTML = ...`. A toggle handler calling its own `render` therefore destroyed and rebuilt `.screen-content` - the element that owns the scroll position. The browser had nothing to restore `scrollTop` onto, so it started again at 0, and `document.activeElement` fell back to `<body>` because the focused control no longer existed. Tapping a control two thirds of the way down frame 03 sent the screen to the top and dropped keyboard focus.

**It was not only frame 03.** Auditing every in-place re-render found 18 call sites across 8 screens with the same defect: frames 03, 04, 05, 05b, 06, 09, 09a, 09b, 10, 10b and 33. Frame 11 was checked and is clean - its change links navigate to another route rather than re-rendering, so the router handles it. Frame 19's "edit a held figure" action from `build-spec.md` section 1 is not built at all; its three disclosures had the defect and now do not.

**Two fixes, at different altitudes.**

*Frame 03's account card patches itself.* `syncAccounts` in `consent.js` sets the checkbox properties, the count text and the group subtotals directly. In the ordinary case - ticking an account already filed where it needs to be - nothing is removed from the DOM at all, so there is nothing to restore: focus stays on the control because the control was never replaced. Only when a tick moves an account between groups does the `[data-role="account-groups"]` subtree get rebuilt, and even then the scroller is untouched and focus is put back on the row that moved. A `signature` string of group-to-account membership is what tells those two cases apart. Handlers are delegated from the card rather than bound per row, so they survive a rebuild.

*Everywhere else re-renders through a helper.* `rerenderInPlace` in `components/ui.js` records the scroll offset and enough about the focused element to find it again - the `data-action` plus `data-account-id` / `data-disclosure-id` / `data-value` this codebase already puts on every control - re-renders, and restores both. `focus({ preventScroll: true })` matters: without it the browser scrolls the refocused control into view and undoes the restore. Text selection is restored too, so a re-render while someone is mid-edit in a currency field does not drop their caret. Rewriting seven more screens into patch functions would have been a large change for screens where a full re-render is cheap and correct; this fixes all of them in one place.

**One limit, and it is the right behaviour.** Where an update makes the content shorter - selecting all empties the "Not sorted yet" group, taking its header, its "Sort this out" button and a spacer with it - the scroller's own maximum drops and the offset is clamped to it. Holding the old offset is not possible when there is no longer that much to scroll. The screen stays pinned where it was rather than jumping to the top, which is what the participant experiences as "it stayed put".

**Verified.** Scrolled to the bottom of frame 03 and toggled: offset unchanged, focus still on the tapped control, count, subtotal and `saved-toward-deposit` all updated. Same for the structural rebuild, and for frames 06 and 19. Provenance follows D5 - `entered` once the participant has changed which accounts count.

**To reverse.** Drop the `select` block from `accountRow` in `consent.js` for the checkbox; replace `rerenderInPlace(container, render, ...)` with `render(container, ...)` for the scroll behaviour. The two are independent.

**For the write-up.** The checkbox is a build-stage design change, in the same category as D11 and D15 - it needs stating, because what a participant could see about their own selection is part of what they were given. The scroll fix is a defect repair and needs no mention beyond a note that it was found and fixed before sessions.

---

## D17. The action bar appears once the participant reaches the end of the content

> **SUPERSEDED by D39, 24 August 2026.** The bar is pinned and visible from first paint; there
> is no hidden state. The reasoning below is left intact rather than edited, because it is the
> argument D39 had to outweigh and the record of why is the useful part. What survives D39: the
> measured `--action-bar-height`, the content-scrolls-under-the-bar overlap, and the 56px scroll
> fade (moved above the dock). What does not: the hidden state, the reveal, the focus-reveal
> path, and the rise transition.

**Decision.** The pinned action bar - the primary button and, on most screens, a secondary link below it - is no longer visible from the moment a screen loads. It appears when the participant reaches the bottom of the screen's content, and hides again if they scroll back up. On screens whose content fits without scrolling it is visible immediately and stays visible.

This is a **deliberate design change, not something in the reference frames**, which draw the bar present from the start on every screen that has one. It is **exempt from the screenshot-comparison pass** for the bar's visibility and the scroll affordance - see `GAPS.md` G38.

**Why.** The intent is that a participant reaches the end of the content before acting. These screens carry the things the feature exists to be judged on: how a figure was worked out, where it came from, the regulatory lines, the "something doesn't look right" route. A primary button sitting there from the first paint invites a participant to press it without reading any of that - and then a think-aloud records how fast someone can skip the content rather than what they made of it. Making the button the reward for reaching the end puts the content in the path rather than beside it.

**Short screens are exempt, and that is the point, not an exception.** Where the content already fits, there is no end to reach: the participant has seen everything the moment the screen paints. Withholding the button there would be a gesture requirement invented for its own sake - it would teach participants that the button appears *eventually* and train them to flick at every screen, which would undo the reason for doing this at all. So the rule is not "scroll to continue"; it is "the button waits until you have seen the content", and on a short screen you already have.

### Which screens fall into which case

Measured at 390x844, with disclosures closed as D12 requires. Frames 09a and 13b sit close enough to the boundary that D12's closed disclosures and this decision's own layout together put them on the short side.

| Case | Frames |
|---|---|
| **Content overflows** - hidden on load, revealed at the bottom (22) | 02, 03, 04, 06, 08, 09, 09b, 10, 10b, 11, 13, 13b, 15, 16, 18, 19, 20, 21, 29, 30, 31, 32 |
| **Content fits** - visible on load and stays (7) | 03b, 05, 05b, 09a, 10c, 17, `/mip/adviser` |
| **No action bar at all** (4) | 01, 12, 19b, 33 |

13b is the one close call: it overflows by 61px. It is a sheet, and sheets do not get the overlap described below - their card is content-sized, so there is no wasted band to reclaim - which is what keeps it on the overflow side. 09a, a full screen, overflowed by 104px before the overlap and fits after it.

D12 is why the second list is longer than it looks like it should be. Frames 05 and 05b carry a "How we got to £X" breakdown that the wireframes draw open; closed, the screen is 345px of content in a 732px box, comfortably short. Frame 19 is the counter-example - three closed disclosures and it still overflows by 763px.

**The case is recomputed, never decided once.** A disclosure opening, a state variant rendering, frame 33's text-size control, a viewport resize - each is watched, so a screen that fits when closed and overflows when expanded switches behaviour and switches back. Verified on frame 05 in both directions, and on frame 17 by shrinking the viewport and growing it again.

### Keyboard and screen reader - the part that is not negotiable

**The bar is never removed from the accessibility tree and never given `display: none` or `visibility: hidden` while a screen is active.** The hidden state is `opacity: 0` plus `pointer-events: none`.

This is a deliberate departure from the brief's own wording, which asked for `visibility` and `opacity` "so it stays focusable". `visibility: hidden` does the opposite of that: it removes an element from the accessibility tree *and* makes it unfocusable, which would mean a keyboard-only participant on a long screen could not reach the control that moves them forward. Opacity leaves the bar rendered, focusable and announced; `pointer-events: none` is what stops a tap landing on a button nobody can see.

Focus is then a third way in, alongside "fits" and "at the bottom": while focus is anywhere inside the bar it is revealed, whatever the scroll position says. Tabbing to it also scrolls the content to its end, so what the participant sees agrees with why the bar appeared, and so a stray scroll cannot hide the control they are standing on.

Verified against the real accessibility tree over CDP, not a proxy for it: on an overflowing screen, a fitting screen and a sheet, the bar's button is present and unignored while hidden; it is in the tab order; focusing it reveals it and scrolls the content to the end; and activating it from the keyboard navigates.

### The scroll affordance

A short fade at the bottom of the scroll container, shown only while the content overflows *and* the bar is still hidden, removed the moment the bar arrives - by then the bar is the signal and two would be noise. It lives on the dock rather than the bar, because the bar's hidden state is `opacity: 0` and opacity applies to an element's pseudo-elements, so a gradient drawn on the bar would be invisible in exactly the state that needs it.

**Revised 20 August 2026 (screen-tail pass): 56px anchored to the bottom, not 193px spanning the bar.** The fade first spanned the dock's whole height plus 56px above it - solid `--color-bg` across the bar's own area, fading out over the 56px above that. The reasoning: the content scrolls under the bar, and a hidden bar is transparent, so a gradient sitting only *above* the dock would fade the content out and then let it reappear, perfectly legible, underneath an invisible bar.

That is true of a gradient above the dock and false of one at the bottom of it. The dock's bottom edge *is* the bottom edge of the scroller - the negative margin above makes the scroller run to exactly there - so a fade anchored to `bottom: 0` dissolves the content once, at the last thing the participant can see, with nowhere below it for anything to reappear.

The cost of the old geometry was 193px of flat `--color-bg` on a two-button screen, 26% of the phone screen, at *every* scroll position while the bar was hidden. Real content sat under it - the next card's top edge would appear and then dissolve into a slab. That is what read as a blurred or blank region below the last element. Same job, 56px instead of 193, and content behind the hidden bar now stays legible until it reaches the bottom edge instead of dissolving 137px early.

### Layout: the content scrolls under the bar

The bar overlaps the end of the scroller rather than carving a slot out of it, with a matching bottom padding inside the scroller so the last real content still clears it.

**Corrected 20 August 2026 (screen-tail pass): that padding was never applying on a full screen.** The rule was written and correct, and lost - `.screen-content` sets the `padding` shorthand further down the same file, at equal specificity, which reset the longhand back to `var(--space-lg)`. The margin survived, because a shorthand only resets its own longhands. So the scroller's *box* grew under the bar while nothing reserved that height *inside* it, and the last element on every overflowing full screen ended 121px behind an opaque bar. Fixed by `.screen > .screen-content`, which wins on specificity rather than on source order. Sheets were never affected: G39 had already hit this exact failure on `.bottom-sheet__content` and fixed it the same way. Measured at both breakpoints: the last element now clears the bar by `--space-lg` on every full screen and `--space-2xl` on every sheet. See `GAPS.md` G41.

The first build reserved the bar's height in the flex column whether or not the bar was showing. That was stable but left ~136px of empty screen - 18% of the app's own 759px (D14) - blank for the whole scroll on every long screen, which is the "cramped and loose at once" problem D14 was about.

Collapsing the bar when hidden is the obvious alternative and it does not work: collapsing changes the scroller's height, which changes whether the content overflows, which changes whether the bar should show. On a screen that overflows by less than the bar's own height - 09a overflowed by 104px and 13b by 61px against a ~136px bar - that loop genuinely oscillates. Overlapping keeps the scroller's height identical in both states, so "reaching the bottom" is a fact about the screen rather than about the bar, and the reveal never shifts the content being read. Reclaiming those 136px is what moved 09a into the fits case.

**Sheets overlap too, by a different mechanism.** The negative-margin trick depends on the flex container having a definite height, so the space it frees is redistributed back to a `flex-grow` item. `.screen` has one; `.bottom-sheet` does not - it is sized by its content up to `max-height: 92%` - and applied there the negative margin simply dragged the bar up over the last row, hiding 03b's third purpose option.

Sheets were left reserving the bar's height instead, which was wrong for the same reason it was wrong on full screens: on a sheet whose content overflows (29-32, 13b) the hidden bar left a blank band inside the card. **Corrected 20 August 2026 (sheet-bottom pass)** by taking the dock out of flow - `position: absolute; bottom: 0` inside the card. An absolutely positioned child contributes nothing to its parent's height, so the card is sized by its scroller alone and the scroller's own bottom padding reserves room for the bar. Neither the card's height nor the scroller's depends on whether the bar is showing, so there is no feedback loop between "does the content overflow" and "should the bar be revealed" - the same property the negative-margin version has on full screens, reached without needing a definite height.

**The safe-area bottom inset (D14) sits below all of this**, as padding on `.screen` - not between the bar and the content. The reserved band stays empty and the bar rises within the app's own area.

**Motion.** A short fade and rise on the HIG tokens already in `tokens.css` - `--duration-standard` and `--ease-out`, the same pair the sheets use. Under `prefers-reduced-motion` the rise is dropped and only the cross-fade remains, matching how D1 treats every other transition.

**Implementation.** `src/action-bar.js` owns the decision and toggles the classes; `components.css` owns what the two states look like. Mounted from `router.js` on each navigation and from the same `MutationObserver` that re-mounts the tab bar, so a screen that rebuilds itself is rewired. Height changes are caught by a `ResizeObserver` on the scroller and its children plus a `MutationObserver` on the subtree, coalesced to one measurement per frame. All 33 screens go through one path - the seventeen full screens via `actionBarHTML`, the seven sheets via the same `actionBarDockHTML` wrapper.

**To reverse.** Delete the `mountActionBars` calls in `router.js` and give `.action-bar` `opacity: 1` unconditionally in `components.css`. The dock wrapper can stay; it is inert without the controller.

**For the write-up.** This one needs stating clearly, because it changes what a participant had to do before they could act. Any finding about whether someone read a disclosure, a provenance caption or a regulatory line has to be read against the fact that the button was withheld until they had scrolled past it.

## D18. Drag-to-dismiss closes a sheet through the sheet's own close control

**Decision.** The grabber at the top of all seven sheets (03b, 10c, 13b, 29, 30, 31, 32) is now the gesture surface `SPEC.md`'s transition rules always said it was: dragging down moves the card with the finger, releasing past a threshold dismisses it, releasing short of it settles the card back. A completed drag does not navigate. It **clicks the sheet's own dismiss control** - the same element a participant would tap - and lets that element's existing handler do the closing.

**Why the indirection matters.** Closing a sheet is not the same as changing the route. 13b sets `ltvVideoSeen` on close, which is what makes frame 13's explainer row read "watched" afterwards. 03b returns to whichever screen set `returnFrame`. 10c's dismiss is "Keep going", which deliberately leaves `journeyPaused` alone - only its own "Leave" sets it (`build-spec.md` section 1). A gesture that merely set `window.location.hash` would look completely correct on screen while recording a participant as never having seen something they did see. That is a silent data error in the session record, and the sessions are what this prototype exists for.

Routing the gesture through the control means there is no second close path to keep in step with the first, and a sheet added later inherits the behaviour by drawing the same markup. It is also what the Escape key has always done, so the two now share one helper (`dismissControlFor` in `src/sheet-drag.js`) rather than two copies of the same selector.

### The threshold, which the spec does not give

`SPEC.md` requires "dismiss by drag-down or scrim tap" and stops there. Two rules, either sufficient:

| Rule | Value | Why |
|---|---|---|
| Distance | 25% of the sheet's own height, minimum 72px | A quarter of the card is the point iOS's own sheets commit at. The floor matters because 10c is a heading and one line of copy - a quarter of a short card is a twitch, not a decision. |
| Velocity | released while still moving down at 0.5px/ms or more | A fast, short flick is how most people actually dismiss a sheet. Without this rule it would spring back and read as the gesture having failed. |

Dragging up is clamped at the resting position rather than rubber-banded: the card's bottom edge is flush with the bottom of the phone screen, so any upward travel would lift it off that edge and show scrim underneath.

### Under `prefers-reduced-motion`

The sheet still tracks the finger - following a gesture is not decoration, and removing it would leave a grabber that once again does nothing. What is dropped is the un-commanded motion at the end: the settle and the exit slide both become instant. The reduced-motion branch also has to skip *waiting* for a transition that will not run, which is why this one case is decided in `sheet-drag.js` rather than in a `@media` block.

### The spring does not overshoot

`--ease-spring` (`cubic-bezier(0.22, 1, 0.36, 1)`) is fast off the mark with a long tail, which is what reads as a spring. A true overshooting curve was rejected for the same reason upward drag is clamped: overshoot past the resting position lifts the card off the bottom edge and flashes scrim beneath it.

**Verified, not asserted by description.** `scripts/sheet-drag.test.mjs` drives a real browser: it opens 03b and 13b twice each from identical fresh sessions, closes one run with the control and the other with a drag, and compares the whole persisted store - `assert.deepStrictEqual(viaDrag.state, viaControl.state)` - in both motion modes. All seven sheets are separately asserted to dismiss on a drag and land where their close control lands.

---

## D19. One way of drawing a close control, and a sheet heading that shares its row

**Decision.** The close control on frames 29-32 is now a plain `title3` xmark from `src/icons.js` in a transparent 48px box - the same treatment `.app-bar__cell--action` and `.form-step-header__cell--action` already give every other close and back control in the feature. The filled circular background is gone. The control sits at the top right of the sheet, **on the same row as the sheet's heading**, and that row lives in the sheet header rather than in the scroller.

This deviates from the reference PNGs for these four frames, which draw a grey disc above the heading. Recorded in `GAPS.md` G42; frames 29-32 are **exempt from the screenshot-comparison pass for the sheet header** and for nothing else.

**Why the circle went.** It was the only circular control in the app. Every other close in the flow - 15 app-bar screens and the six calculator steps - is a bare glyph, and these sheets are reached *from* those screens, so the same action changed appearance halfway through a journey. The sheet's glyph was also two sizes smaller than all of them (`footnote`, 16px, against `title3`, 24px).

**Why the heading moved into the header.** The overlap that prompted this was not a spacing slip; it was structural. The close was `position: absolute; top: 50%` against a header band that was only the drag bar plus its padding, so a 48px button centred on that band hung down over the first line of a heading that lived in a different box. Three requirements then pin the layout exactly:

| Requirement | What it rules out |
|---|---|
| The glyph aligns with the heading, not floats over it | Any absolute positioning - alignment between two independently laid-out boxes is a coincidence that copy changes break |
| The heading never runs under the glyph, at any number of lines | The heading and the glyph must share one flex row, so the heading's column *ends* where the glyph begins |
| The close stays reachable anywhere in a long sheet | The row cannot be in the scroller, or the only close control scrolls off the top |

One structure satisfies all three: a flex row in the fixed header, heading `flex: 1 1 0; min-width: 0`, glyph `flex: 0 0 auto`. The heading is therefore pinned above the scrolling body rather than scrolling with it - the second deviation from the reference, and the price of the other two requirements.

### The touch target is 48px and the glyph is 24px, so the box is offset, not the glyph

Laying the 48px box flush against the row's padding edge would leave the *visible* glyph 12px inside the right margin and 9px below the centre of the heading's first line - misaligned with the one thing it is meant to line up with. Each margin is negative half the difference between glyph and target, which pulls the box out by exactly the slack around the glyph: the target keeps its full 48x48 and simply overhangs into the card's edge padding, while the glyph lands on the margin. Both formulas are written against `--text-scale`, because glyph size and heading line-height both scale with frame 33's Large text control.

**Measured at 390px on all four sheets, at both text sizes and with a heading forced to three lines** - 12 combinations, every one of them: gap between heading and glyph 22-24px (never negative), glyph's right edge exactly on the body copy's right margin (0.0px), heading's left edge exactly on the body copy's left margin (0.0px), glyph centre exactly on the centre of the heading's first line (0.0px), no clipped or overflowing heading, and 16px between the heading and the top of the scroller.

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

> **OVERRIDDEN IN PART, 28 August 2026 (D51).** The action bar's primary below the checkpoint is now
> `check-mip` carrying `checkpointReachedCta`, not "What a bigger deposit changes". The reasoning
> below is not withdrawn and is not wrong - it is conditional on a premise the author has since
> retired. **"The Mortgage in Principle route is genuinely not open - that is what the checkpoint
> means" was true when this was written and is no longer true**: the checkpoint still decides which
> result the flow returns, but it no longer decides whether the flow can be entered. D51 records the
> override and the reason for it.
>
> What survives this entry unchanged: "Adjust my goal" is still the secondary; the milestone row is
> still not a control; and frame 13 is still reachable from this screen under this entry's own label,
> as the in-content Loan-to-Value info link rather than as the primary. The reversal instruction at
> the foot of this entry is superseded by D51's.

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
| `left-over` | Derived from those two, or never derived at all on the declined path, where it stayed null | Always `derived`. £640, from £2,500 less £1,860 |
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

> **AMENDED 28 August 2026 (D51).** "One door into the flow, and it is the action bar" still holds,
> and is still the reason nothing else in the app routes to `/mip`. **What changed is that the door is
> no longer gated on the checkpoint**: the action bar carries `check-mip` on the below-checkpoint
> variant too, so the flow is enterable at any savings position. The count of doors is unchanged at
> one; only the condition on it is gone. This entry's finding that the milestone row is not a live
> link is untouched and still correct - the row reports, the bar acts.

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

> **Amended 27 August 2026 - BOTH REJECTED OPTIONS WERE PROPOSED A SECOND TIME AND RE-REJECTED.
> Nothing in this entry changes.** Recorded so that neither is proposed a third time, and so the
> next reader does not start from the wrong premise this re-examination started from.
>
> **1. THE INSTRUMENT COST OF PUTTING "ADJUST MY GOAL" ON THE UNLOCKED VARIANT. Read this one
> first: it is the only argument here that does not depend on taste.** The at-or-above-checkpoint
> variant exists to get participants into the Mortgage in Principle flow - that is what the
> checkpoint unlocks and what the screen is for. A backwards-pointing action sitting beside the
> control that opens that flow will send some participants into the calculator instead, and **those
> sessions lose the observation the variant was built to produce**. That is a cost to the data, not
> a matter of how the pair reads. The design argument below is a judgement and can be argued with;
> this one cannot.
>
> **2. THE PREMISE THIS RE-EXAMINATION STARTED FROM WAS WRONG, AND D25 DOES NOT SAY WHAT IT WAS
> ASSUMED TO SAY.** The assumption was that "Adjust my goal" had been REMOVED from frame 16 by D25,
> and that the removal could therefore be revisited. **It was never there.** D25 governs frame 15
> only. What D25 decided was to KEEP "Adjust my goal" and DEMOTE it to secondary, because below the
> checkpoint the screen's only action pointed backwards into the calculator and the state "had no
> onward move at all". The unlocked variant has never had that problem - it has a forward primary -
> so D25's reason does not transfer to it and offers no support either way. There is no
> `checkpointReachedSecondaryCta` key in `content.js`; only `belowCheckpointSecondaryCta`, named for
> the variant it belongs to. **Adding the secondary to frame 16 would be a new control needing a new
> string and a copy check, not a restoration.**
>
> **3. THE MEASUREMENTS STILL HOLD, AND THE FOLD IS NOT THE ARGUMENT.** Re-measured at 390px by
> injecting the secondary into the live DOM, in light and dark and at both text sizes:
>
> | Text size | Dock | Fold y | Milestone rows fully above the fold |
> |---|---|---|---|
> | Default, as built | 81px | 707 | **2** of 4 - "Accounts linked", "Accounts sorted" |
> | Default, + secondary | 137px | 651 | **1** of 4 |
> | Large, as built | 81px | 707 | 1 of 4 |
> | Large, + secondary | 137px | 651 | 1 of 4 - **no change** |
>
> +56px on the dock and 56px off the fold in every case. These reproduce this entry's original
> figures exactly (81 to 137, 707 to 651), which is worth knowing: D39's pinned action bar and
> D38's fourth amendment have both landed since that measurement and neither moved it. Geometry is
> identical in both themes - they differ in colour only - so no screenshot was taken and the
> argument does not turn on appearance. **New since the original measurement: at Large text the cost
> is zero**, the screen being already down to one milestone row. So the fold cost is
> default-text-only and it is one row, which is a real cost but not one to reject a change on.
>
> **4. HOW THE PAIR READS, WHICH IS THE DESIGN ARGUMENT AND IS VARIANT-SPECIFIC.** Below the
> checkpoint, "What a bigger deposit changes" then "Adjust my goal" is sequential: the primary
> explains a relationship, the secondary is how you act on having understood it. At or above it,
> "Check what a lender might lend you" then "Adjust my goal" invites the participant to go back and
> change the target **at the exact moment the app has told them they have reached a threshold
> measured against that target**. One says "go on, you have arrived"; the other says "change what
> arriving means". Not two steps in an order - two readings of what just happened.
>
> **5. THE SKIP-AHEAD CONDITION WAS PROPOSED AGAIN AND REJECTED ON THE SAME FINDING.** Driving the
> cards from `isSkippedAhead()` came back as a first thought a second time. The finding below
> settles it and settled it again unchanged: **`skippedAhead` is written only by `bindSkipAhead`, so
> no participant action ever sets it.** A participant who completed the calculator without a
> facilitator touching the toggle would be offered "Work out my deposit" for ever, having already
> worked out their deposit. Noted so it is not proposed a third time.
>
> One nuance that was not in the original rejection and is worth having: the skip-ahead position
> **already** changes `/goals`, legitimately. Moving to "Further along" raises
> `saved-toward-deposit` past the checkpoint, which flips `unlocked` and adds the calculator card.
> That is the position having an effect through a FIGURE, which any participant could also reach by
> saving, rather than through the FLAG, which only a facilitator can set. The first is fine; the
> second is what this entry rejects.
>
> **WHAT THIS MEANS FOR STRICT ALTERNATION.** It is not free. Moving the calculator route onto the
> tracker so `/goals` could show one card in every state would cost the participant furthest along
> their only nearby route to the calculator, and the fix for that costs more than it buys. The
> third state keeps both cards, and this entry's rule stands as written.
>
> **No `CACHE_VERSION` bump for this amendment: it is documentation only, and nothing served to a
> browser changed.** The full suite was run to show the edit touched nothing.

> **Amended 27 August 2026 (fifth amendment) - STRICT ALTERNATION. THE THIRD STATE IS REMOVED, AND
> IT WAS NOT WRONG.** `/goals` now shows exactly one bridge card in every state: the calculator
> while no deposit goal is set, the tracker once one is, at any savings position. `unlocked` is
> gone from `goals.js` and the whole condition is `hasGoal ? trackerCardHTML : houseCardHTML`.
>
> **THE RULE HAS NOT CHANGED, AND THE REASONING BELOW IS NOT SUPERSEDED - IT IS OUTRANKED.** "Do
> not advertise a door that redirects" still holds and is still why the no-goal state withholds the
> tracker card. The third state was **correct under that rule**: at or above the checkpoint both
> destinations genuinely render, so both could honestly be offered, and the entry below is right
> that the goals card was the calculator's nearest route there. Nothing in that argument has been
> found faulty and none of it is deleted. What changed is a judgement above it - **one card in every
> state is worth more than a second honest door in one state** - and that judgement is the whole of
> this amendment.
>
> **THE COST, ACCEPTED KNOWINGLY.** `tracker.js` draws its "Adjust my goal" secondary on the
> below-checkpoint variant and no other (D25, which governs frame 15 only). So a participant at or
> above the checkpoint now has **NO NEARBY ROUTE TO THE DEPOSIT CALCULATOR AT ALL** - not from
> `/goals`, not from the tracker. It is reachable by typing `#/calculator/property` and in no other
> way from that state. This is stated plainly here and in `ROUTES.md` rather than left to be
> rediscovered, because it is the kind of thing a facilitator finds mid-session.
>
> **WHAT WAS NOT DONE, AND WHY.** The obvious repair - drawing "Adjust my goal" on the unlocked
> variant too - was examined in this entry's fourth amendment and rejected there on an instrument
> cost that has not changed: a backwards-pointing action beside the control that opens the Mortgage
> in Principle flow will divert some participants into the calculator, and those sessions lose the
> observation the unlocked variant exists to produce. Taking the cost above is cheaper than taking
> that one. The two amendments are consistent: the fourth refused to add a route to the tracker, the
> fifth removes one from `/goals`, and both are paid for by the same participant in the same state.
>
> **WHAT THIS BUYS.** One rule a facilitator can hold in their head - a goal or no goal, one card
> either way - and one fewer state for `/goals` to be in when a session's figures are not where they
> were expected. The screen no longer changes shape at the checkpoint, so crossing it is visible on
> the tracker and nowhere else.
>
> **Verified.** All three journey states driven through frame 33's Journey stage at 390px, asserting
> the rendered `data-action` set on `/goals` rather than eyeballing it: `setting-up` gives
> `["open-deposit-calculator"]`, `saving` and `ready-to-check` both give `["open-deposit-tracker"]`.
> Each card was then clicked and lands where it says (`#/calculator/property`, `#/tracker`). The
> Insights tab was tapped in all three and is unchanged: `#/tracker` in the two goal states, and
> still redirecting into the calculator in the no-goal state exactly as it always did. Shot at 390px
> in light and dark in both states; dark mode unchanged, and no layout gap where the second card was.
> `overlap.test.mjs` loses its `goals-below-checkpoint` row - the bare `goals` row and that row are
> now the same shape, one tracker card either side of the checkpoint, so it asserted nothing the
> bare row does not; restore it if the third state ever comes back. `ROUTES.md`'s three-state table
> becomes two rows and gains the missing-calculator-route warning. `CACHE_VERSION` v37.
>
> **Reversal.** Restore `unlocked` and the three-branch ternary in `goals.js`, the third table row
> in `ROUTES.md`, and the `goals-below-checkpoint` row in `overlap.test.mjs`. The reasoning it needs
> is still below, unedited, which is why it was left there.

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

**Amended 28 August 2026 (D55): the property value is now 650,000, and the window property above is
deliberately given up.** Everything above stands as the reasoning for 240,000 - it was the right
number for what the stage demonstrated then, and the two-numbers-only discipline, the replay order
and the provenance rules are all unchanged. What changed is what the stage has to demonstrate: the
opening session must now meet the Lifetime ISA cap warning as part of its opening state, and that
warning renders only above 450,000. **The two requirements cannot both be satisfied** - the
projection window closes at about 275,800 and the cap starts above 450,000, with no value in
between - so the window property was traded away rather than missed. `months-to-target` is now
154.8 months and the tracker's "On track for" row renders its beyond-window variant from the
opening session. The second property is untouched and still asserted: 8,950 against a 48,750
checkpoint. `scripts/stage.test.mjs` no longer asserts the window property; it asserts the seed is
above the cap, and asserts the beyond-window consequence explicitly so the cost stays visible. See
D55 for the full trade and its reversal.

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

## D49. The build caption reports the running code, not Cache Storage

**Date.** 28 August 2026.

**Decision.** Frame 33's build caption is rendered from `BUILD_VERSION`, the constant compiled into
the running modules, and is **never overwritten**. Where Cache Storage holds a shell version that is
not the running one, that is shown as a **second, labelled line** saying it is downloaded and
waiting for a reload. `CACHE_VERSION_FALLBACK` is renamed `BUILD_VERSION`: it was never a fallback,
it was the only honest reading in the file.

**Why. The caption was evidence, and it was wrong.** `readLiveCacheVersion()` read `caches.keys()`
on the reasoning that the cache holds the version actually running. It does not. Cache Storage is
rewritten by whichever service worker most recently activated, and `sw.js` uses `skipWaiting()` and
`clients.claim()`, so on the first load after a deploy the new worker installs, activates, claims
and deletes the old cache **while the document keeps executing the modules it already had**. The
caption then named the new version over the old code.

That is worse than showing no version at all. It cost a full investigation: a facilitator read
"Build v38", typed `#/reset` on the strength of it, and the page was running v37 - whose `#/reset`
predates D48's `openSession()` and so left an empty session behind. Reproduced end to end before
this change, five steps, with the caption naming a version the page was not running at two of them.

**A constant compiled into the module graph cannot disagree with the code around it.** Whatever
build served `cache-version.js` is the build whose value it holds. That is the whole argument for
making it primary, and it is a stronger guarantee than any runtime lookup can offer.

**The cached version is still worth showing**, and is the fact the old caption was reaching for and
got backwards: a newer build is downloaded and will take over on the next document load. It is a
second line, labelled "Downloaded and waiting for a reload", using "downloaded" rather than
"running" precisely because naming a version as running was the fault.

**`find()` on the cache names is gone rather than corrected.** `names.find((name) =>
name.startsWith('yfh-shell-'))` returned whichever key `caches.keys()` listed first, and two keys
coexist for exactly the window that matters - between a new worker caching its shell and its
`activate` deleting the old one - so the one moment the caption had something useful to say was the
one moment it chose arbitrarily between two right answers. `readCachedVersions()` returns the whole
set instead. **Nothing ranks them**: 'v9' and 'v10' do not compare correctly as strings, and parsing
them into numbers would be a second place that knows how `sw.js` names a build. The caller asks only
which of them is not the running version, which needs equality and nothing else.

**Verified.** v38 worktree with its worker installed, then the server flipped to v39, five steps
through reloads and `#/reset`: **zero false version claims**. With caches forced to coexist, the
primary line stays on the running build and the second line lists every other cached version,
sorted, for one waiting version and for two.

**What this does NOT fix, deliberately - see GAPS.md G66.** A tab holding a session from before a
deploy still never applies the opening stage, so Insights keeps redirecting to the calculator. The
proposed remedy - stamp the build version into the session and treat a mismatch as new - was
specified in the same pass and **stopped before implementation** on its own stated condition: it
resets a participant mid-task. The check would run in `load()`, on every document load, and a
document load can happen during a session (a refresh, a tab restore, a home-screen relaunch). A
participant who had entered their own figures would lose them and be returned to the opening stage,
and because `stagePatch()` covers only `STAGE_KEYS` they would land in a mixed state - the opening
stage's goal figures beside their own `targetMonth`, `solveFor` and `journeyStarted` - which is the
condition the state rules in CLAUDE.md exist to prevent. Recorded in full in G66 rather than taken.

**Reversal.** Restore `readLiveCacheVersion()` and the `CACHE_VERSION_FALLBACK` name, drop
`SHELL_CACHE_PREFIX` and `cachedBuildTemplate`, and put the overwrite back in `settings.js`. The
caption starts lying again on the first load after every deploy.

---

## D48. A session opens in the saving stage, so the tracker is populated from the first tap

**Date.** 28 August 2026.

**Decision.** A new session opens in the **saving stage** rather than empty. The Insights tab lands
on a populated deposit tracker from the first tap, without a facilitator setting anything on frame
33 and without a participant running the deposit calculator first.

**Why.** The tracker was the one screen in the app a participant could not meet. `/tracker` guards
on the stored `checkpoint-amount` and `deposit-target`, and both were null until frames 09, 10 and
11 had all been through, so tapping Insights on a fresh session redirected into the calculator. That
is the same problem `state.js` already solved for `money-in` and `essential-spending`: the
participant's accounts are connected, so the figures that follow from them are there rather than
waiting on a form. A tracker with a goal on it is a worked example; a redirect is an empty state
wearing a tab.

**The two are now separate, and participants are told so.** The tracker no longer stands downstream
of the calculator in a session's own history - it is populated on arrival, and the calculator is a
thing a participant can go and run. That is a study-design decision taken outside this repo and
recorded here because the build now depends on it.

**How, and what was deliberately not done.**

`router.js` opens a session by calling `stagePatch(OPENING_STAGE)`, the same function frame 33's
Journey stage control calls, against the same fresh `defaultState()`. A session that opened itself
and a session a facilitator set to "Saving" hold **byte-identical** state; `scripts/stage.test.mjs`
asserts exactly that, through the very expression `openSession()` runs. There is one stage machine
and this names its starting point. Every figure still comes from `src/model/` in the calculator's
own call order - D45's rule is untouched, and nothing derived is written by hand anywhere.

**`OPENING_STAGE` is a constant in `stage.js`, NOT a changed default in `state.js`, and that is the
load-bearing part.** `stage.js`'s `baseline()` is built from `defaultState()`, and `baseline()` is
what frame 33's "Setting up" returns a session to. Had the default moved to `'saving'`, `baseline()`
would have started returning the saving stage's own figures, "Setting up" would have become a no-op,
and the blank calculator would have gone out of reach - the exact affordance a facilitator needs
when they want one. `defaultState()` therefore stays the empty session in every key, `stage`
included. It also keeps `stage.js`'s deletion list true: the opening scenario is one name in that
module, not a value spread through the store.

**It sits in `router.js` rather than in `state.js`** because `state.js` cannot import `stage.js` -
`stage.js` already imports `defaultState` from it, and the cycle would put `stagePatch` in the
temporal dead zone on any module order where `stage.js` evaluates first. The router already owns the
two moments a session begins (`startRouter()` and `#/reset`), so both call `openSession()` and the
module graph stays a directed acyclic one.

**Only on a new session.** `state.js` now records whether the store was restored from
sessionStorage, and `isNewSession()` gates the patch. A mid-session refresh restores what the
participant had - re-applying an opening stage to it would discard their work, which is the thing
persisting the store exists to prevent. `resetState()` clears the flag, so `#/reset` opens the next
participant's session the same way a first load does. Verified in a browser: a property value
entered on frame 09 survives a reload unchanged.

**`saved-toward-deposit` is untouched, at £8,950.** It is the sum of the four accounts frames 03, 06
and 32 draw, and the tracker captions it "Read from the accounts you assigned to your deposit". The
opening stage sets up a GOAL; it must not move the position measured against it, and raising it
would mean inventing balances the account list contradicts - the refusal `skip-ahead.js` already
records for the same reason. The session therefore opens BELOW its checkpoint, which is what leaves
the skip-ahead control both of its positions.

**What a participant now meets populated.** Frame 09 arrives pre-filled at £240,000 with the 10%
chip selected; frames 10, 11 and 12 render against that goal; `/goals` draws the tracker bridge card
from the first tap instead of the calculator card (D44's fifth amendment - one card in every state,
chosen by `hasGoal`). A participant who runs the calculator with their own figures simply overwrites
the stage, and the tracker follows: £300,000 at 5% gives a £15,000 goal and an £11,250 checkpoint on
the next visit. The stage is a one-shot patch, not a flag re-read at render time.

**Cost, accepted.** The calculator is no longer a blank instrument on first arrival. That is the
price of the tracker not being an empty state, and it is the trade the study design has taken.
Frame 33's "Setting up" is the way back to a blank calculator and is verified to still do it.

**Reversal.** Delete `OPENING_STAGE` from `stage.js`, `openSession()` and its two call sites from
`router.js`, `isNewSession()` and the `restoredFromStorage` flag from `state.js`, and the seven
opening-stage tests from `scripts/stage.test.mjs`. Nothing else moves; every figure was already
`stage.js`'s.

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

## D50. Frame 20 is the end of the flow: no action bar, and one next-step row stops being a control

> **AMENDED 28 August 2026 (D52). THE INSTRUCTION BELOW IS WITHDRAWN.** This entry says the frame
> 20 / frame 21 asymmetry is deliberate and that "**the asymmetry must not be propagated to 21**".
> It has now been propagated, on purpose: frame 21 draws no action bar either, and its first two
> next-step rows are plain rows. The reasoning below for frame 20 is unchanged and still correct;
> what was wrong was the reading of frame 21 as "not an end - it is a not-yet". Both screens end the
> same flow, and what differs between them is the answer, not whether the flow has finished. D52
> records the change, what it costs and how to reverse it. **Anyone reading this entry alone should
> not act on its frame 21 sentences.**

**Date.** 28 August 2026.

**Decision.** Frame 20 (`/mip/result/likely`) is the end of the Mortgage in Principle flow and is
built as one. Three changes, all on that screen:

1. **No action bar.** "Start my Mortgage in Principle" and "Keep saving for now" are removed, along
   with their handlers and their `primaryCta` / `secondaryCta` keys in `content.js`. The screen
   joins frames 01, 12, 19b, 33 and 17-locked as a screen with no bar at all.
2. **The first next-step row stops being a control.** "Keep saving to lower your Loan-to-Value"
   declares no action, so it renders as a plain `<div>` with no chevron and no focus stop.
3. **The second stays exactly as it was.** "Talk to someone about it" keeps its action, its chevron
   and its route to `/mip/adviser`.

**Why row 2 is not treated like row 1, which is a deliberate departure from "remove both chevrons".**
It is the adviser route, and the obligation to offer it is MCOB 4.8A (execution-only sales: the
customer must be told they can request advice) plus the Consumer Duty consumer support outcome
(no unreasonable barriers), recorded in D10 and in `SPEC.md`'s anchor map. `SPEC.md`'s verification
step 4 requires `/mip/adviser` reachable from **both** 20 and 21, and this row is the only route to
it from 20. Making it static would have severed a regulatory anchor and left "Our advisers only
advise on our own mortgages." sitting under a card that no longer offers an adviser.

**The chevron and the focus stop are decided by one fact, not two.** `nextStepsCardHTML` now draws a
`<button>` with a chevron when a step declares an `action` and a `<div>` with neither when it does
not. The chevron is the app's claim that a row goes somewhere, so it is drawn from the thing that
decides it; and a `<button>` bound to nothing is a dead focus stop, which is the same reasoning D11
applies in rendering the inert tabs `disabled`. `consent.js` already drew its account-row chevron
this way. **Frame 21 renders exactly as before** - all three of its steps declare actions - which is
what makes this a branch rather than a change to the component's existing behaviour.

### What this costs, stated rather than discovered later

- **`build-spec.md` section 1's row 83 is superseded.** It records "20 Result - likely to be
  considered | Back or done | 16 Tracker - checkpoint reached", marked **Assumed**. Frame 20 no
  longer offers any in-content route to the tracker: `/tracker` is reached from this screen **only
  via the Insights tab**, which is the bank's own furniture and draws no lit tab on this route
  (D11). The app-bar X still leaves the journey to `journeyEntryPoint` (D30, D32).
- **The `--more-below` fade goes with the dock.** On a screen this long, the only remaining cue that
  content continues below the fold is the scroll itself. The fade belongs to `.action-bar-dock`
  (D39) and is not reproduced anywhere else.
- **Whether a participant presses "Start my Mortgage in Principle" is no longer observable.** That
  was a real finding the sessions could have collected - the reach for the out-of-scope branch D8
  deliberately kept live. It is given up knowingly in exchange for the screen reading as an end.
- **Frames 20 and 21 now diverge deliberately.** 21 keeps its action bar and all three chevroned
  rows. `CLAUDE.md`'s standing rule that a correction applies everywhere the same pattern appears
  does **not** apply here: this is a decision about what frame 20 *is*, not a defect fixed in one
  place. **The asymmetry must not be propagated to 21**, whose result is not an end - it is a
  not-yet, and its rows are the routes back into saving.

**Screenshot comparison.** Frame 20's reference PNG draws the bar and both chevrons, so an eighth
exemption is added to `SPEC.md`'s list, covering that difference only. Frame 20 also leaves the
sixth exemption's set, having no bar whose visibility can be diffed.

**To reverse.** Restore the `actionBarHTML` block and the `start-mip` / `keep-saving-for-now`
handlers in `mip-result-likely.js` with the two `content.js` keys, and give step 1 back its
`action: 'keep-saving'` - the component needs no change, since a step that declares an action gets
its button and chevron back automatically. Move the route back into `SCREENS` in
`action-bar.test.mjs` and drop the `SPEC.md` exemption.

---

## D51. The Mortgage in Principle check is offered at any savings position, and the checkpoint decides the result rather than the route

**Date.** 28 August 2026.

**Decision.** The deposit tracker's action bar carries `check-mip` as its primary on **both** variants,
under one string (`checkpointReachedCta`, "Check what a lender might lend you"). Below the checkpoint
the flow's result is decided by the savings position and is always frame 21; at or above it, frame
33's `resultOutcome` decides, exactly as before. **This is an explicit override of D25 and D35**,
taken by the author, and both entries are amended in place rather than deleted.

**The problem.** Frame 21 was reachable only by typing a URL. The flow's one door was drawn only at or
above the checkpoint (D35), and the outcome lever is frame 33's `resultOutcome`, on a screen with no
on-screen route anywhere in the app. So the not-yet result - the one a moderated session most needs to
put in front of a participant, because it is where the next-step rows and the adviser route actually
get used - could not be reached in a session at all.

**WHAT THE CHECKPOINT NOW MEANS.** It stops gating the route and keeps deciding the result. D25 said
"the Mortgage in Principle route is genuinely not open - that is what the checkpoint means"; that
premise is retired. What the checkpoint means now is which answer the check comes back with, which is
a statement about the participant's position rather than about what the app will let them do.

**THE OUTCOME IS DERIVED BELOW THE CHECKPOINT AND FORCED NOWHERE.** `mip-running.js` reads
`gapToCheckpoint(state).value > 0`, the model's existing figure over the STORED `checkpoint-amount`
and `saved-toward-deposit` - the same two keys `/tracker`'s own guard tests before it will draw the
button. No new model function, no new constant, no threshold written down in a screen. It fails safe:
`gapToCheckpoint` returns a null value with no checkpoint committed and `null > 0` is false, so a
session with no goal falls through to `resultOutcome` as before.

**AN AFFORDABILITY OR LOAN-TO-VALUE RULE WAS CONSIDERED AND REJECTED ON THE FIGURES.** Frame 21's own
copy states the comparison - "the amount you'd need to borrow is above what a lender would typically
offer" - and that comparison is **false at every position this prototype can reach**, because
`borrow-high` is `loan-amount` at 1.1 (D2) while the shortfall moves with what has been saved:

| Position | `neededLoanAmount()` | `borrowRange().high` | needed > high? |
|---|---|---|---|
| Below the checkpoint (8,950 saved) | 231,050 | 237,600 | **no** |
| At the checkpoint (18,000 saved) | 222,000 | 237,600 | **no** |
| build-spec.md:184's own frame 21 example (14,600 saved) | 175,400 | 188,100 | **no** |

It only becomes true below about 2,400 saved, so wiring it would have rendered the LIKELY result on
the one path this change exists to serve. A Loan-to-Value threshold would flip correctly (96.37%
below the checkpoint against 92.96% at it) but only by deciding a lending outcome from
`LTV_RATE_BANDS_BY_DEPOSIT_PCT`, a rate-illustration table transcribed for a different purpose, whose
lookup deliberately falls back to the nearest band so a sub-5% deposit does not fall off it. Neither
is a rule this build has the model to support, and the real credit check is out of scope.

**THE COST, ACCEPTED RATHER THAN OVERLOOKED.** Frame 33's "Mortgage in Principle outcome" pill no
longer describes what happens below the checkpoint: set it to "Likely", run the check from the
tracker below the checkpoint, and frame 21 is what appears. That was chosen over the alternative,
which was to let a participant with a 3.73% deposit be told a lender would likely consider them. One
reading of the state beats two levers that can disagree about it.

**ONE DOOR, STILL, AND ONE LABEL.** D35's "one door into the flow, and it is the action bar" is
unchanged and is still why nothing else in the app routes to `/mip`. `checkpointReachedCta` is reused
on both variants rather than a second key being added, and it keeps its name: the string is
identical, and renaming it would make a copy-identical key read as new wording in every diff and
screenshot comparison.

**The displaced control, and a condition that is spent.** The below-checkpoint primary was D25's
"What a bigger deposit changes". It becomes the in-content Loan-to-Value info link, which is
`ltvInfoLinkLabel` - **the same string**, already drawn in exactly this way on the checkpoint-reached
variant and on frames 09 and 12. That link was gated to the unlocked variant for one reason, recorded
at `tracker.js`: below the checkpoint the primary CTA "already opens frame 13 under this very label,
and two controls carrying identical wording on one screen is what goal-check.js's 'one link to frame
29, not two' already ruled out". **That reason is spent** - `check-mip` holds the primary at both
positions, so there is no second control with this label and no duplication to prevent. The gate is
removed rather than reworded: this is the arrangement the unlocked variant already had, with an
obsolete condition taken off it. "Adjust my goal" keeps the secondary slot, exactly as D25 left it,
and `belowCheckpointCta` is deleted as unused.

**The milestone row takes `available` below the checkpoint, and D42 needs no amendment.** Its
definitions stay literally true: the route is not blocked, and `available` is "not done, and not
blocked". D42 anticipates this case in terms - *"If a later milestone is added that can be reachable
and not yet done, it takes this same treatment."* Two consequences are recorded rather than worked
around:

- **The two variants now differ at row 3, not row 4.** Below the checkpoint the list is
  `['done', 'done', 'current', 'available']`; at or above it, `['done', 'done', 'done', 'available']`.
  The variants remain distinguishable, but the distinction moves up a row.
- **The checkpoint is no longer legible on the milestone list.** It is still on the progress bar as
  the marker, and it still decides which result the flow returns, but the list stops reporting it.
  That is a real loss and it is the price of the row telling the truth about what is blocked.

`locked` therefore has no occupant anywhere: D42 already establishes rows one to three can never take
it, and row four no longer does. `MILESTONE_ICON.locked`, the `.milestone-row--locked` rule and
`lockedRowAriaSuffix` are all **kept rather than deleted**, so this override stays reversible in one
edit. See GAPS.md G68, which also records that `lockedRowAriaSuffix` has been unreferenced since D35.

**The copy, and the three row-and-caption decisions taken with it.**

| Key | String |
|---|---|
| `checkpointReachedCta` | "Check what a lender might lend you" - unchanged, now on both variants |
| `ltvInfoLinkLabel` | "What a bigger deposit changes" - unchanged, now drawn on both variants |
| `belowCheckpointSecondaryCta` | "Adjust my goal" - unchanged |
| `belowCheckpointBodyTemplate` | "A Mortgage in Principle is a lender's estimate, worked out before you choose a property. You can run one at any point." |
| `mipBody` **(new)** | "Not run yet. The estimate uses the deposit you have on the day you run it." |
| `mipCaption` **(renamed)** | "An indication of what a lender might lend you. Not a decision, and not an application." - wording unchanged |
| `belowCheckpointCta` | **deleted** |
| `mipLockedBodyTemplate` | **deleted**, collapsed into `mipBody` |
| `mipUnlockedBodyTemplate` | **deleted**, collapsed into `mipBody` |
| `unlocksAtTemplate` | **deleted** |

**1. `belowCheckpointBodyTemplate` had to change.** It read "You're {gap} away from the point where
checking a Mortgage in Principle starts to be useful", and that sentence would have sat directly above
a button offering the check it says is not yet useful. It also framed the deposit position as a
distance short of a point, which the tone and vulnerability rule names directly. **The replacement
carries no figure and hints at no direction**, so nothing on the screen implies a threshold and a
participant reading aloud in a think-aloud session is not told what the result will say before they
run it. It glosses the term in a legible slot, which matters more now that the row below no longer
implies the check is gated. The checkpoint is not in this line at all; the progress bar's marker still
carries it. The rejected alternative was "You can check what a lender might lend you at any point. The
result moves as your deposit grows." - easier to read (FK grade 3.6 against 5.9), but it hints at the
direction of the result and its first sentence repeats the button immediately below it. The key keeps
its `...Template` name though it now has no placeholder: it is the same string in the same slot, and a
rename would make a one-line copy change read as a structural one.

**2. THE TWO MILESTONE-ROW BODIES COLLAPSE INTO ONE, `mipBody`.** Both rows render `available` now, so
there is one state and one string. D42 held the two deliberately parallel - both opened "Available
from {checkpoint}" so that passing the checkpoint read as one figure changing state - and **both
halves of that are gone rather than tidied away**: the shared clause was a gating claim that the
override falsified on *both* rows, not just the lower one, and the pairing has no subject left because
there is no longer a transition on this row to make legible. "Not run yet" rather than "not done": a
check is run. The second sentence replaces what the checkpoint figure used to carry - the only thing
on the row explaining why running it now and later differ, without saying which way the answer moves.
No figure, deliberately: any figure here would imply a threshold that no longer exists, and D42's
original reason against a borrowing figure still stands. Two candidates were rejected and the reasons
are kept in `content.js`: "Your figures are ready for it" makes a readiness claim that is frame 19's
job, and "Nothing here is sent to a lender" makes a search claim whose checked wording is
`/mip/pre-check`'s `softSearchWarning`. It is `mipBody`, not `...Template`, because it carries no
placeholder.

**3. `unlocksAtTemplate` IS DELETED, AND THAT CLOSES D42's DEFERRED LINE.** It held "Unlocks at
{checkpoint}" in the caption slot under the milestone list on the below-checkpoint variant. It carried
gating information that no longer exists, and it was the last survivor of the "unlocks" game language
D42 stripped from the rows - D42's own change-log entry ends *"`mipLockedBodyTemplate`'s 'Unlocks at'
is left for a separate decision."* **This is that decision**, and it is a deletion rather than a
rewording: no new string.

The slot it shared is now unconditional. `mipCaption` - the same wording, renamed from
`readyToCheckLabel` - renders on **both** variants, where it used to render above the checkpoint only.
That is the caption catching up with the override rather than a workaround for the deletion: the line
makes no claim about a threshold, only about what the check returns and what it is not, so it was
already true at either position. The alternative considered was dropping the element on the
below-checkpoint variant, which would have left that variant with no gloss of the term under the list,
and a third option - removing the element for both - would have cost the at-checkpoint variant its
only gloss once the row bodies collapsed. Measured at 390px, both variants: caption 36px tall, 16px
above and below, no empty flex child on either. **The rename** is because `readyToCheckLabel` asserted
a state - the checkpoint reached, the door open - that no longer exists; `mipCaption` names what the
string IS on screen, beside `mipTitle` and `mipBody`. D35's copy table above records this line's
previous wording under the old key name.

**A referential loose end, recorded rather than fixed.** On the at-checkpoint variant
`belowCheckpointBodyTemplate` does not render, so `mipBody`'s "**The** estimate" has no antecedent
above it and leans on the row title "Mortgage in Principle" instead. It reads, but it is weaker there
than below the checkpoint, where the body text two blocks above supplies "a lender's estimate"
directly. Left alone deliberately - the fix is a wording change to one of two strings that were both
just settled - but whoever next edits either one should know the two are coupled.

**Verification item 2 is superseded, deliberately.** The brief for this change asked that the
at-checkpoint variant come out byte-identical to before the work, and it did until this pass. It no
longer does, because "Available from {checkpoint}" was false on that variant too once the override
landed: correctness beat the identity check. What *is* unchanged on that variant is everything the
override does not touch - the action bar, the rates card, the risk warnings, the guidance line, and
the caption's own wording and treatment.

**To reverse.** Restore `belowCheckpointCta` and set the action bar's primary back to
`unlocked ? checkpointReachedCta : belowCheckpointCta` with `unlocked ? 'check-mip' : 'learn-ltv'`;
re-gate the Loan-to-Value info link and the `check-mip` handler on `unlocked`; put the
below-checkpoint milestone state back to `locked`; restore the previous
`belowCheckpointBodyTemplate`; split `mipBody` back into `mipLockedBodyTemplate` and
`mipUnlockedBodyTemplate` and restore the ternary that chose between them; restore
`unlocksAtTemplate` and re-gate the caption slot on `unlocked`, renaming `mipCaption` back to
`readyToCheckLabel`; and drop the `belowCheckpoint` condition in `mip-running.js`. D25's and D35's
amendment banners come off in the same pass. Nothing was deleted from `MILESTONE_ICON`,
`components.css` or the `locked` state's own styling, so the milestone half of that reversal is one
word.

### Amended, 30 August 2026: the checkpoint is not drawn at all now

D51 recorded a cost: the checkpoint stopped being legible on the milestone list, and the consolation
was that "the progress bar's marker still carries the checkpoint". **That is no longer true.** The
marker at 75% and the "Checkpoint" label beneath the track are both removed. Nothing on any screen
draws the checkpoint now.

**Presentation only. Nothing behavioural changed, and this was verified rather than assumed:**

| What the checkpoint drives | Where | Status |
|---|---|---|
| Frame 15 vs frame 16 vs goal-met | `tracker.js`, `saved >= checkpoint-amount` | unchanged |
| Whether `/mip/running` returns likely or not-yet | `mip-running.js`, `gapToCheckpoint(state).value > 0` | unchanged |
| Where the skip-ahead control lands | `skip-ahead.js`, reads the stored `checkpoint-amount` | unchanged |
| Whether `/goals` shows its tracker card | `goals.js`, tests the key for null | unchanged |
| The value itself | `checkpointAmount()` = 0.75 x `combined-goal` | unchanged |

The only things deleted are a `<div>`, a `<p>`, two CSS rules and one content key
(`checkpointProgressLabel`). `CHECKPOINT_FRACTION` is still imported by `tracker.js`, because
`checkpointReachedBodyTemplate` still renders the 75% figure in its text.

**Why remove it: one kind of fact per channel.** D71 set this out at length while rejecting a
different proposal - three marked points on the track - and the argument applies to the element that
was already there. The bar was carrying a **position** (the fill, where the participant is) and a
**milestone** (the marker, a threshold that decides what the flow returns) on one axis with no visual
grammar separating them. Of the two, the milestone was the one nothing else on the screen explained:
the fill is self-evident, the marker was a bare tick.

**D71 is not contradicted by this, and the distinction matters.** D71 declined "drop the checkpoint
marker" as a *means to an end* - as a way of making room for the three-point sketch, trading a working
element for a speculative one. Nothing speculative replaced it here; the space is simply recovered.
The three-point sketch remains rejected on D71's own measurements.

**What it recovered:** 22.0px at default text, 24.7px at Large. `.progress-bar` goes from 40.0px to
18.0px, and from 45.4px to 20.7px. Verified after the change: the goal figure still sits at the
track's right end, the segment boundary is still drawn at 85.7%, and the fill's leading edge still
reads as an edge at 22.9% - the marker's removal took nothing else with it.

**THE CONCEPT IS NOT REMOVED, AND THE SILENCE MUST NOT BE READ THAT WAY.** This is the part most
likely to be misread by whoever comes next. Two pieces of participant-facing copy still name the
checkpoint:

- `/tracker`'s `checkpointReachedBodyTemplate` - "You've passed the 75% checkpoint" (frame 16)
- `/mip`'s `body` - "You've saved three quarters of your deposit" (frame 17)

Both now arrive without an antecedent, and the second is **also arithmetically wrong** since D70: the
checkpoint is 0.75 x the combined goal, so at the checkpoint a participant has saved 87.5% of their
deposit, not three quarters of it. Both are raised as `GAPS.md` G86 rather than silently kept, and
the frame 17 arithmetic should be closed before participant sessions. Neither was fixed here: frame
17 is inside the Mortgage in Principle flow, which this change was scoped out of.

### Amended again, 30 August 2026: the Mortgage in Principle copy is one block, on the row

The tracker was explaining a Mortgage in Principle in **two places at once**: a standalone paragraph
beneath the goal disclosure, and the subtext of the milestone row named after it. The paragraph moved
into the row. One block where there were two, on the element the copy was always about.

**What each block held before the move:**

| | Standalone paragraph | Milestone row subtext |
|---|---|---|
| Below checkpoint | "A Mortgage in Principle is a lender's estimate, worked out before you choose a property. You can run one at any point." | "Not run yet. The estimate uses the deposit you have on the day you run it." |
| Checkpoint reached | "You've passed the 75% checkpoint. You can now check whether a Mortgage in Principle is likely to be approved." | *the same string* |
| Goal met | "You've saved your full deposit goal. You can check whether a Mortgage in Principle is likely to be approved whenever you're ready." | *the same string* |

Two things worth noting from that table. The paragraph had **three** states, not two - the goal-met
variant is easy to miss. And the row had **none**: D51's first amendment had already collapsed its two
keys into one, because both variants render the same `available` icon state.

### Nothing from the replaced subtext was dropped, and both halves needed different homes

**"Not run yet" stays, and it is not decoration.** The milestone row's state is carried by its ICON
and by nothing else - there is no `aria-label`, no visually-hidden text, and `lockedRowAriaSuffix` in
`content.js` has no reader anywhere in `src/`. So that clause is the only thing telling a
screen-reader participant the check has not been done. It now opens all three replacements.

**"The estimate uses the deposit you have on the day you run it" moved down one element**, into
`mipCaption`. Verified by search that this was the **only** place in the whole of `content.js` where
that fact appeared. `mipCaption` glosses what the check is and is not - "An indication of what a
lender might lend you... Not a decision, and not an application" - so a property of the estimate
belongs there better than in a status line. It now reads "An indication of what a lender might lend
you, based on the deposit you have on the day you run it. Not a decision, and not an application."

### The standalone block was carrying no structural work

Checked before removing it. It carried **no required statement**: `guidanceNotAdvice` renders at
`.legal-text` near the foot of the screen and `mcob3aRepossessionWarning` through `riskWarningHTML`
above the "This month" card, and neither is this paragraph. It separated the disclosure from the
milestone list, but that gap is `.screen-content`'s own 16px row-gap and does not depend on anything
sitting in it.

**Recovered 82.0px at default text and 91.9px at Large** - the paragraph's own 66.0px / 75.9px plus
the 16px flow gap it occupied.

### The checkpoint-reached wording had two faults, not one

It read "You've passed the 75% checkpoint. You can now check whether a Mortgage in Principle is
likely to be approved."

1. **It cited a marker that no longer exists.** D51's second amendment removed the 75% marker from the
   progress bar, so the sentence congratulated the participant on passing something they had never
   been shown (`GAPS.md` G86).
2. **"You can NOW check" asserts a gate this very decision removed.** D51's original override made the
   check available at either position. Nothing becomes possible at the checkpoint that was not
   possible before it, so "now" was false on its own terms and had been since D51 was written.

The replacement states the position the participant **can** see - the fill is past three quarters of
the track - without naming a figure, without implying a gate, and without hinting which way the result
will go, which D51 rejected an earlier candidate for doing:

> "Not run yet. You're most of the way to your goal. You can run a check whenever you want to."

**This closes the frame 16 half of G86** and takes the last reference to 75% off the screen entirely:
`CHECKPOINT_FRACTION` is no longer imported by `tracker.js`. Frame 17's "You've saved three quarters
of your deposit" is untouched and still wrong; it is inside the Mortgage in Principle flow, which this
task was scoped out of, and G86 carries it.

### Also corrected, and it was overdue

`goalMetBody` said "You've saved your full **deposit** goal". The goal has included stamp duty since
D70, so that was false about £7,500 of it - the same correction `goalCaptionTemplate` took at the
time and this string was missed. It now reads "your full goal".

### The three keys were renamed, and the three states stayed

`belowCheckpointBodyTemplate`, `checkpointReachedBodyTemplate` and `goalMetBody` became
`mipRowBelowCheckpoint`, `mipRowCheckpointReached` and `mipRowGoalMet`. Renamed because they changed
slot as well as wording, which is the convention D51's first amendment set when it renamed `mipBody`
for the same reason; the `...Template` suffix went with the placeholder none of them carries now.
Each still renders in exactly the state it rendered in before.

The three are deliberately parallel - status, then where the participant is, then what they can do -
so crossing a threshold reads as one clause changing rather than the row being replaced. That is D42's
reasoning for the milestone rows generally, applied to the row it had not yet reached.

**One defect on the way, worth recording.** Hoisting: `mipRowBody` was left declared where the old
`bodyText` had been, which is *after* the `milestones` array that now consumes it - a temporal dead
zone that rendered the whole screen blank with `Cannot access 'mipRowBody' before initialization`.
`node --check` passes it, every test passed, and the only thing that caught it was looking at a
screenshot. The same lesson as D70's progress-bar defect: this build's tests assert layout and state,
not that a screen rendered at all.

`shots.mjs` gained a selector form for `--scroll` on the same pass - `--scroll=.milestone-tracker` -
because `top` and `end` cannot reach an element in the middle of a long screen, and the row this
decision is about is exactly that.

---

## D52. Frame 21 ends the flow too: D50's treatment applied to the not-yet result

**Date.** 28 August 2026.

**Decision.** Frame 21 (`/mip/result/not-yet`) takes the treatment D50 gave frame 20. It draws **no
action bar**, and the first two rows of its "What you could do next" card stop being controls. Row 3,
"Talk to someone about it", is unchanged. **D50's own instruction that this asymmetry must not be
propagated to 21 is withdrawn**, and D50 carries a dated banner saying so.

**Why D50 said the opposite, and why that is no longer right.** D50 drew a distinction between the two
results: frame 20 is an end - the estimate has been given, the next steps are things to go and do
elsewhere - while frame 21 "is not an end - it is a not-yet, and its rows are the routes back into
saving." That reading treated a not-yet result as an unfinished task the screen should push the
participant onward from. **Both screens are the end of the same flow.** What differs is the answer,
not whether the flow has finished, and a screen that has finished does not need an action bar to say
so - the header X and the tab bar are how a participant leaves either one.

**WHAT ROWS 1 AND 2 ARE, AND WHY THEY STOP BEING CONTROLS.**

| Row | Was | Is |
|---|---|---|
| 1 "Save around {amount} more toward your deposit" | `<button>` with chevron, `action: 'update-goal'` -> `/tracker` | plain row |
| 2 "Look at a property target closer to {amount}" | `<button>` with chevron, `action: 'change-property-target'` -> `/calculator/property` | plain row |
| 3 "Talk to someone about it" | `<button>` with chevron -> `/mip/adviser` | **unchanged** |

Both are statements about what a different figure would do - save this much more, aim at a property
this size - rather than routes, which is exactly what D50 said of frame 20's first row. Row 1 also
duplicated the action bar's own primary: "Update my savings goal" and the row both went to `/tracker`,
two controls on one screen for one destination.

**ONE MECHANISM, NOT A SECOND ONE.** `nextStepsCardHTML` already draws a row as a plain `<div>` with no
chevron when it declares no `action`, and as a `<button>` with one when it does. Rows 1 and 2 simply
stop declaring an action. No flag, no variant, no new component - the same A2 mechanism committed with
D50 at `67c747b`, used a second time exactly as it was designed to be.

**ROW 3 IS NOT A JUDGEMENT CALL.** The adviser route rests on MCOB 4.8A (execution-only sales: the
customer must be told they can request advice) and the Consumer Duty consumer support outcome, per D10
and SPEC.md's anchor map. SPEC.md's verification step 4 requires `/mip/adviser` "reachable from both 20
and 21's 'Talk to someone about it' row", and that step **still holds as written** - checked, not
assumed. `GAPS.md` G17b adds the research reason for keeping it live: whether a participant reaches for
it, *especially at the not-yet outcome*, is itself a finding.

**WHAT IS LOST, STATED RATHER THAN DISCOVERED LATER.**

- **Two in-content routes out of this screen.** `/tracker` (rows 1 and the bar's primary) and
  `/calculator/property` (row 2). Neither is orphaned: `/tracker` is the Insights tab root, a `/goals`
  card, and where the header X lands from here; `/calculator/property` is reached from `/goal-check`,
  the `/goals` card, `/calculator/review` and `/calculator/saving`. What goes is the *shortcut from
  this screen*, and that is the point - the routes were competing with the one row that has a
  regulatory reason to be a control.
- **The borrowing sheet keeps a route from here.** The bar's secondary ("See what changes this") is
  gone, but the "How we worked this out" card's own nav row opens `/assumptions/borrowing` and is
  unaffected. That row was dead until it was bound (`GAPS.md` G20's second finding); it is now the only
  route, which is why it matters that it works.
- **The `--more-below` fade goes with the dock.** The scroll affordance is drawn by
  `.action-bar-dock`'s pseudo-element (`bottom: 100%`), so a screen with no bar has no dock and no
  fade. Frame 21 is long - result panel, gap figure, three figure rows, two risk warnings, a
  three-row card, a disclosure and a flag row - so this is a real loss of "there is more below" on the
  longest screen in the flow. Accepted for the same reason D50 accepted it on frame 20: the fade
  exists to sit above a bar, and inventing a bar-less fade for two screens is a new component for a
  cue the tab bar's own edge already partly gives.

**build-spec.md section 1's "21 -> Back to my deposit -> 15 Tracker" is served by the header X**, which
goes through `exitFlow()` to `journeyEntryPoint`. That row is marked "Assumed", not "In file", and D50
read frame 20's identical row (`20 -> Back or done -> 16`) the same way. The screen keeps **two exits**,
the X and the tab bar, and neither was added for this change.

**Copy.** `primaryCta` ("Update my savings goal") and `secondaryCta` ("See what changes this") are
deleted from `/mip/result/not-yet`: both lost their only reader with the bar. No string on this screen
changed wording.

**Screenshot comparison.** Frame 21's reference PNG draws the bar and three chevroned rows, so a
**ninth** exemption is added to SPEC.md's list, covering that difference only. Frame 21 also leaves the
sixth exemption's set, having no bar whose visibility can be diffed - so both result screens are now
out of it. `scripts/action-bar.test.mjs` moves `/mip/result/not-yet` out of `SCREENS` and into the
no-bar test, whose name and preamble now read "01, 12, 19b, 20, 21 and 33".

**To reverse.** Restore the `actionBarHTML` block in `mip-result-not-yet.js` with the two `content.js`
keys, re-add the `update-goal`, `change-property-target` and `see-what-changes` handlers, and give rows
1 and 2 back their `action` properties - the component needs no change, since a step that declares an
action gets its button and chevron back automatically. Move the route back into `SCREENS` in
`action-bar.test.mjs` and drop the ninth SPEC.md exemption. D50's amendment banner comes off in the
same pass.

---

## D53. Frame 08 offers one forward route, and it is the deposit calculator

**Date.** 28 August 2026.

**Decision.** Frame 08 (`/goal-check`) draws **no action bar**. The button it held, "Not now, just
track my goal", is removed with its content key. The "The calculator asks you two things" card's own
"Open the deposit calculator" button becomes the only forward route from the screen.

**Why.** The screen had two forward controls and they were not equal. The card's button is the one
`build-spec.md` section 1 names from here - *"08 Ready for the calculator | Checkpoint button | 09a if
no values held, otherwise 09 | calculatorEntered = true | In file (annotation)"* - and it is the only
route that writes anything. The bar's button wrote no state at all: a bare
`window.location.hash = '#/tracker'`. So the screen introduced the calculator and then offered a
shortcut past it, from the more prominent of the two slots.

**WHAT THE REMOVED BUTTON REACHED, AND WHERE THAT STILL IS.** `/tracker`, which remains reachable
from the Insights tab (its own root, D40), from `/goals`'s bridge card (D44), from frame 12's primary
("See what this means for borrowing"), and from the Mortgage in Principle flow's exits. Nothing is
orphaned by this.

**No journey state is lost either, checked rather than assumed.** The handler set nothing, so the
only state difference between the two routes was that the calculator's button also writes
`calculatorEntered: true`. **Nothing in `src/` reads `calculatorEntered`** - it is written by
`goal-check.js` and by `stage.js`, and read by no screen - so "reached the tracker without entering
the calculator" was not a state any screen could tell apart. Where a session genuinely needs a
populated tracker without a participant walking the calculator, frame 33's Journey stage already
builds it: `savingPatch()` writes `calculatorEntered`, `goal`, `goalSaved` and every calculator figure
from a fresh `defaultState()` (D45). That is the supported way to set it up, and it is more complete
than the button was.

**IT WAS NOT NAMED ANYWHERE AS A REQUIRED ROUTE.** `build-spec.md` section 1 lists two triggers for
frame 08 - the checkpoint button and the app bar back - and **no row for this button at all**. Neither
`SPEC.md` nor `DECISIONS.md` names a tracker route from this screen. It was an addition, and it is
withdrawn.

**THE PUSHBACK AFFORDANCE IS UNAFFECTED, AND IT IS NOT THIS BUTTON.** `SPEC.md`'s anchor map puts the
**DUAA 2025 automated-decision triad (pushback / plain wording / visible sources)** on frame 08 among
others, and says what satisfies it: *"The flag row ('something doesn't look right') plus 'how we
worked this out' links."* Both survive untouched - the flag row above the legal line, and the
"How we worked these out" link above the handoff card. The removed control was a **decline route**
("not now"), which is a different thing from the pushback the map requires, and no entry ties a
decline route to this screen specifically.

**The guidance-not-advice line's placement does not change.** It stays the last element in
`.screen-content`, at `.legal-text`, exactly where it sits on every other screen that carries it -
including frames 20 and 21, which have no action bar either (D50, D52). Nothing moved up into the
space the dock vacated; the line was already below the flag row and still is.

**WHAT IS LOST.**

- **The screen's only decline route.** After this, a participant who does not want to open the
  calculator leaves by the header X or the tab bar, or pushes back through the flag row. That is a
  real narrowing of what the screen offers, and it is the point of the change rather than a
  side-effect: the alternative was two forward controls of unequal standing, one of which skipped the
  screen's own subject.
- **The `--more-below` fade.** It is drawn by `.action-bar-dock`'s pseudo-element (`bottom: 100%`), so
  a screen with no bar has no dock and no fade. Frame 08 is long - headline, body, a three-row figure
  card, an assumptions link, a three-row handoff card with its own button, the flag row and the legal
  line - so the cue that there is more below is gone from a screen that needs scrolling. Accepted on
  the same terms D50 and D52 accepted it: the fade exists to sit above a bar, and a bar-less fade
  would be a new component for a cue the tab bar's edge already partly gives.

**Screenshot comparison.** Frame 08's reference PNG draws the bar, so a **tenth** exemption is added
to `SPEC.md`'s list, covering that difference only. Frame 08 also leaves the sixth exemption's set,
having no bar whose visibility can be diffed. `scripts/action-bar.test.mjs` moves `/goal-check` out of
`SCREENS` and into the no-bar test, whose name and preamble now read "01, 08, 12, 19b, 20, 21 and 33";
`src/action-bar.js`'s own enumeration of that set is updated to match.

**To reverse.** Restore `primaryCta` under `/goal-check` in `content.js`, put the
`actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'track-goal' })` call back after
`</main>` with `actionBarHTML` in the import list, and re-add the `track-goal` handler navigating to
`#/tracker`. Move the route back into `SCREENS` in `action-bar.test.mjs`, drop the tenth `SPEC.md`
exemption, and revert the three enumerations.

---

## D54. Frame 33 gains a second facilitator path, and it is invisible

**Date.** 28 August 2026.

**Decision.** A **~700ms long press on the DISABLED Profile tab** in the bottom nav opens
`/settings`. Nothing renders, nothing is labelled, nothing enters the accessibility tree, and the tab
stays visually and semantically disabled. The typed URL still works and is unchanged.

**The problem.** `/settings` and `#/reset` are both things a facilitator needs mid-session, and both
were reachable only by typing a hash. Typing a URL in front of a participant is worse than a control
they cannot see: it breaks the fiction of the app more thoroughly than any hidden gesture, and it
happens at exactly the moment the session is being observed.

**THREE SHAPES WERE COSTED. TWO WERE REJECTED FOR REASONS WORTH KEEPING.**

- **A visible prototype block on `/home`** was the cheapest to build - the screen exists and carries
  the tab bar - and was rejected as the **worst possible placement**: frame 01 is the first screen a
  participant sees, and the control it would expose can flip the journey stage, the Mortgage in
  Principle outcome, the theme and the text size mid-session.
- **A `/profile` screen** was rejected as a large change in service of a small need. It would have
  meant a new route, a new screen module outside the 32-frame reference set, `profile` added to
  `NAVIGABLE_TABS`, and a currently non-focusable tab made focusable - and D11's three tab states are
  a participant-visible signal about what is and is not built, which `bottom-nav.test.mjs` asserts
  directly. **The control does not need a home. It needs to stop being a typed hash.**

**WHY THE DISABLED PROFILE TAB AND NOT THE APP BAR**, which is what the Figma node annotates. Both
bind in one place - the tab from `mountBottomNav`, the app bar from a central mount - so the deciding
factors were coverage and blast radius, measured per route rather than estimated:

| | Profile tab | App bar |
|---|---|---|
| Routes it renders on | **20 / 28** | 19 / 28 |
| Exclusive routes | **`/calculator/property`, `/calculator/saving`, `/calculator/review`** | `/mip/running` (a 1.4s transient), `/settings` (already there) |
| Competing control in the target | **none - the tab is inert** | the back/close button, the most-pressed control in the app |
| What a stray tap does today | **nothing** | navigates back, or exits the flow |

The three calculator steps draw a step header rather than an `.app-bar`, so the app bar cannot reach
them at all; they are mid-journey screens where a facilitator plausibly needs frame 33. And a hesitant
back-press is a normal thing for a participant to do, which is the risk the app bar carries and the
tab does not.

**`settings.js`'s own reason for rejecting the app-bar gesture was wrong, and is corrected in place.**
It read "adding one would mean touching every other screen's app bar". All 17 screens that render
`appBarHTML` already call the shared `bindAppBarLeading`, so one edit would have covered them. What it
would still have missed - and this is the real objection - is frame 01, which renders `.app-bar`
**inline in `home.js`**, and the three calculator steps.

**A DISABLED BUTTON FIRES `pointerdown` BUT NOT `click`, AND THE GESTURE IS BUILT ON THAT.** Measured
in Chromium in both a mouse and a touch context:

```
press on the disabled Profile tab -> pointerdown (+ touchstart on touch), on the
                                     button and bubbling to the nav; NO mousedown, NO click
```

Activation events are not delivered to a disabled form control. **This is load-bearing rather than
incidental**: it is what lets the tab answer a deliberate hold while staying completely inert to a tap,
because there is no activation path for an accidental press to take. It also sets the condition under
which this must be revisited - if `profile` is ever added to `NAVIGABLE_TABS`, `click` starts firing
and a tap and a hold would be in competition. The maintainer comment at `bottomNavHTML` says so, and
it is required rather than optional: a disabled control that silently answers a long press is exactly
the kind of thing the next reader "fixes".

**The threshold** is 700ms with a 10px movement tolerance, and the pointer discipline is copied from
`sheet-drag.js` - one pointer at a time by id, primary button only, and `pointercancel` handled,
which is the one that matters on a phone when a scroll takes the pointer over. The constants are not
shared with that file: its thresholds are about a product gesture's feel, this one's is about not
firing by accident.

**FOUR DECISIONS TAKEN WITH IT.**

1. **`user-select: none` on `.bottom-nav__tab` is part of this change, not a styling tweak.** Without
   it, a 700ms hold raises the iOS text callout over the tab's label and the gesture is unusable on a
   real phone. It sits on the **shared** rule and therefore applies to all five tabs - deliberate and
   cheap, since nobody has a reason to select a tab label. **Recorded here so a later pass does not
   read it as cosmetic and remove it independently of the gesture.**
2. **`GAPS.md` G23 stays resolved**, with a dated note. Its resolution reads "never linked from any
   on-screen element", and that is still literally true: the gesture adds no element, no link and no
   accessible name. Both the letter and the intent - not discoverable by a participant - survive.
3. **The maintainer comment at `bottomNavHTML` is required**, per above.
4. **`skip-ahead.js` cited "the facilitator gesture on frame 10", which never existed.** There were no
   pointer handlers anywhere in `src/` outside `sheet-drag.js`. The stale reference was found while
   costing this and is corrected to point at what was actually built, so it does not read as a second
   gesture that someone later goes looking for.

**NO COPY, AND NO ACCESSIBLE NAME.** No label, no supporting line, no content key. This drops the
"Prototype control" framing that `skip-ahead.js` carries and that every other prototype affordance in
this build uses - correctly, because there is no name to carry it in and an invisible gesture should
not announce itself. `skip-ahead.js`'s rule is explicitly about a **visible** control that a keyboard
or screen-reader participant cannot reach; this one is invisible to everyone, so no participant is
disadvantaged relative to another, and the typed URL survives unchanged as the keyboard path. **There
is deliberately no keyboard equivalent.**

**The return path is untouched.** `/settings` draws the back chevron bound to `goBack`, and D32 chose
that control anticipating this exact entry point: "a later hidden gesture in from the profile screen
... with no special case for it".

**It owns no state key**, no route, no content key and no CSS block of its own.

**To remove**, in one pass: delete `src/facilitator-gesture.js`, remove one import line and one call
line in `src/router.js`, and remove the `user-select` / `-webkit-touch-callout` lines from
`.bottom-nav__tab` in `src/css/components.css`. The comment at `bottomNavHTML` and the six dated
"typing the URL" notes come off in the same pass.

---

## D55. The opening session meets the Lifetime ISA cap, and the projection window is what it costs

**Date.** 28 August 2026.

**Decision.** `STAGE_PROPERTY_VALUE` in `src/stage.js` is raised from **240,000 to 650,000**, so a
session that opens in the saving stage (D48) arrives on frame 09 already above the Lifetime ISA cap
and renders the cap warning as part of its opening state. D45's projection-window property is given
up to do it. D45 is amended in place rather than rewritten: its reasoning for 240,000 is still the
reasoning for 240,000.

**Why the field is not left blank, and why this is the only lever.** `OPENING_STAGE` is `'saving'`
(D48), so a new session runs `savingPatch()` and frame 09 arrives pre-filled. `STAGE_PROPERTY_VALUE`
is the single definition of that figure - the only other property value in the repo is
`scripts/session-seed.mjs`'s 280,000, which is deliberately separate (D43) and drives screenshots
and browser tests rather than the app.

**The two requirements are mutually exclusive, and that is the whole decision.** Against the mock
accounts as they stand - an 8,950 starting balance and a 255 a month savings rate - the 60-month
projection window closes at a **275,832** property, and `LISA_CAP_PROPERTY_VALUE` is 450,000, so the
warning needs **more than 450,000**. There is no value in between. Nor can a savings rate bridge it:
reaching a 65,000 target inside 60 months needs **822.11 a month**, which `monthsToTarget()` rejects
outright as `exceeds-left-over` against the 380 `left-over` ceiling, and even at that ceiling the
largest property reachable inside the window is **358,305** - still below the cap. Raising
`saved-toward-deposit` to 40,076 would satisfy both, and was rejected: 8,950 is the sum of the four
mock accounts frames 03, 06 and 32 draw, so moving it would desynchronise three screens to fix one.

**What it costs, stated rather than discovered.** At 650,000 the target is 65,000 and the checkpoint
48,750. `months-to-target` is **154.8 months**, so `monthsToTarget()` returns `beyond-window`,
`onTrackFor()` has no range, and the tracker's "On track for" row renders its **beyond-window
variant from the opening session**. That variant is built, correct and already reachable by recipe
(`ROUTES.md` no-frame-drawn state 7); it is simply no longer the ordinary screen a facilitator meets
first. Frames 11 and 12 show the same variant on the same figures.

**What it keeps.** D45's second property is untouched and still asserted: **8,950 < 48,750**, so the
tracker still opens locked, the Mortgage in Principle milestone is still the thing out of reach, and
**both skip-ahead positions still exist**. `readyToCheckPatch()` still composes `skipAheadPatch()`,
so "Ready to check" is still the same goal seen later rather than a second goal.

**And the cost is confined to one stage.** "Ready to check" moves `saved-toward-deposit` to the
48,750 checkpoint, which puts the remaining projection at **37.8 months, on track for 35 to 42** -
inside the window. So only the **saving** stage, and therefore the opening session, meets the
beyond-window variant; the later position renders an ordinary "On track for" row. This was measured
rather than assumed, and it is why the trade is acceptable: the boundary variant is what a
facilitator meets first, not what the whole demonstration is stuck in.

**The tests assert the trade, not the numbers.** `scripts/stage.test.mjs` drops the window assertion
and gains two in its place: the seed is above `LISA_CAP_PROPERTY_VALUE` and `lisaCapBreached` is
true, and `months-to-target` is beyond `CHART_WINDOW_MONTHS` with `monthsToTarget()` returning
`beyond-window`. The second is the point - a later change that silently restored the window now
fails a test that names D55, instead of looking like a fix. `scripts/g62.test.mjs` had one
assertion coupled to the seed (`monthsToTarget(after).error === null`); it asserted the draft
invariant *and*, accidentally, that the seed sat inside the window. It now compares the projection
before and after the clear, which is the invariant that file exists for and is seed-independent.

**Frame 09's banner is derived live, not read from the flag.** `calculator-property.js` computes
`propertyValue.value > LISA_CAP_PROPERTY_VALUE` at render (line 78) rather than reading
`lisaCapBreached`, so the banner follows the seed without the flag being consulted. The flag is
still written by `savingPatch()` because it is true of the session. `position-summary.js`'s
`lisaCaption` is unconditional and unaffected.

**Verified.** Chromium at 390px, fresh session in light and dark: frame 09 opens pre-filled at
**£650,000** with the cap banner rendered above the deposit chips; the derived target reads
**£65,000** and the checkpoint **£48,750**; the tracker opens below its checkpoint with the
Mortgage in Principle milestone locked, and both skip-ahead positions round-trip. Frames 20 and 21
render in range on the new seed, with no em dash standing where a number belongs. All four tracker
recipes re-driven and unchanged - they are participant-entered and independent of the seed. 264
tests passing, 0 failing. `CACHE_VERSION` v46.

**Reversal.** Put `240000` back in `src/stage.js` and the window property returns untouched, since
nothing else was moved to accommodate this - no rate, no mock balance and no ceiling changed. The
two `stage.test.mjs` assertions are the other half: swap the beyond-window pair back for
`months-to-target <= CHART_WINDOW_MONTHS`, and drop the cap assertion. `g62.test.mjs`'s
before-and-after comparison is an improvement either way and should stay.

---

## D56. The area-average property figure is London, dated, and named to its source

**Date.** 29 August 2026.

**Decision.** `AREA_AVERAGE_PROPERTY_VALUE` in `src/model/rates.js` goes from **190,000 to 470,000**,
gains `region: 'London'`, `asAt: '2026-06'`, `asAtLabel: 'June 2026'` and a `sourceUrl`, and its
`source` becomes **'UK House Price Index, HM Land Registry and ONS'**. Frame 09's caption becomes
"In London, first-time buyers paid around 470,000 on average in June 2026." and a
`provenanceCaptionHTML()` line beneath it reads "Source: UK House Price Index, HM Land Registry and
ONS, June 2026."

**Why.** 190,000 was carried with the note that no source was named for it anywhere in
`build-spec.md` or here, and it was the only figure on any screen in that position. It is also wrong
for the case study: this prototype's participants are London first-time buyers, the opening session
holds a 650,000 property (D55), and a screen that offers 190,000 as the local average alongside a
650,000 field is not context, it is noise. A figure a participant is asked to reason against has to
be one they can place, and it has to say where it came from.

**Nothing is calculated from it, and that is what made this safe.** `AREA_AVERAGE_PROPERTY_VALUE` is
read at exactly one place in the repo - the caption on `src/screens/calculator-property.js`. The
property value a session opens with is `STAGE_PROPERTY_VALUE` (D55); every figure on frames 09 to 12
runs off the participant's own committed `property-value`; and `model.test.js`'s 190,000 fixtures are
`build-spec.md` section 4's deposit-target worked example, a different figure that happens to share
the number. Nothing in `model/` was touched and no derived figure moved. The 43 model tests pass
unchanged, which is the evidence rather than the claim.

**Why it is one constant and two templates rather than two sentences.** The sentence and its
attribution both name the month, and the sentence and the constant both name the figure. Written out
twice they drift, which is the failure `bankRateCaptionTemplate` already exists to prevent -
`{source}` there resolves from `RATES.source` so the caption cannot name a source the model did not
use. The same treatment applies here: `areaAverageCaption` and `areaAverageSourceCaption` resolve
`{region}`, `{amount}`, `{source}` and `{period}` from the one object, so the two lines on screen
cannot come apart.

**Plain text, not a link, and the caption style is the existing one.** The attribution renders
through `provenanceCaptionHTML()` at `.provenance-caption`, the style D5 established and nine other
screens already use - not a Source badge, which the design rules exclude, and not a new style. It
does not link out because **no screen in this build renders an anchor at all**: a grep for `<a ` and
`href=` across `src/` returns nothing outside `index.html`'s own stylesheet and icon tags. A single
link on frame 09 would be the only tappable external destination in the prototype and would be read
as a live affordance in a think-aloud session. The URL is recorded on the constant instead, the same
way `RATES.sourceUrl` is held and never rendered.

**Copy check.** Rule 1 (advice boundary): a statement of past fact, no recommendation, no steer.
Rule 6: the average sits above the input as context for what to type, not as a benchmark the
participant is measured against, and the copy makes no comparison between it and their own figure -
which matters more at 470,000 against an opening 650,000 than it did at 190,000. Rule 8: sentence
case, en-GB, pound sign and thousands separator through `formatCurrency`, provenance carried as a
caption. **One flag, not fixed:** rule 5 bars sentences carrying more than one number, and
"470,000 ... June 2026" carries a figure and a date. The wording is as specified and the date is
what makes the figure checkable, so it stands; it is recorded here rather than silently allowed.

**What was NOT changed.** No other copy on frame 09. `build-spec.md` section 4's 190,000 worked
example and `model.test.js`'s fixtures are a different figure and are left alone. `scripts/session-
seed.mjs` is untouched.

**Verified.** 43 model tests, 50 state tests (`skip-ahead`, `g62`, `stage`), 66 overlap assertions
(all 33 frames x both text sizes, so frame 09 with the extra line at large text) and 77 action-bar
assertions - 236 passing, 0 failing. `CACHE_VERSION` v47, with `BUILD_VERSION` bumped to match: it
was found at v45 against sw.js's v46, a drift from the previous commit, and D49's pairing rule makes
correcting it part of this bump rather than a separate errand.

**Reversal.** Put `190000` and the old one-line `source` back in `rates.js`, restore
`areaAverageCaption` to its "in your area" wording, and drop `areaAverageSourceCaption` with the
`provenanceCaptionHTML()` call and the import that feeds it. Nothing else depends on any of it.

---

## D57. The seeded salary rounds to 2,500, and the FCA slider flags clear as a side effect

**Date.** 29 August 2026.

**Decision.** `MOCK_POSITION.moneyIn` in `src/model/accounts.js` goes from **2,240 to 2,500**, and
frame 01's matching salary credit in `content.js` goes from `+£2,240.00` to `+£2,500.00`. The unit
is unchanged: this is **monthly income after tax**, which is what frame 19 labels it, what frame
01 draws as a single credit categorised "Monthly pay", and what frames 05/06 caption as read from
salary payments over twelve months. Gross annual pay is a different variable,
`MOCK_MIP_DATA.annualSalaryBeforeTax`, and is untouched at 38,000.

**Why the number was wrong before, not merely awkward.** 2,240 a month is 26,880 a year net, which
38,000 gross cannot produce - the two mock figures described a person who does not exist. 38,000
gross nets about 2,573 a month, less roughly 80 a month of Plan 2 student loan (the same loan
`MOCK_MIP_DATA` already carries), which lands at about 2,493. The rounded figure is the internally
consistent one; the awkward figure was also the incoherent one.

**One derived figure moves, and only one.** `left-over` is the sole figure computed from
`money-in` (`build-spec.md` section 4: `money-in - essential-spending`), and
`essential-spending` is unchanged at 1,860, so `left-over` goes **380 to 640**. Frames 05 and 06
recompute their two proportion rows from the pair: essential spending **83% to 74%** of what comes
in, left over **17% to 26%**, still summing to 100.

**Nothing in the projection chain moves at all,** which is the load-bearing fact of this pass.
Frame 10's slider ceiling is `left-over`, so the ceiling rises - but the seeded handles are
`min(200, ceiling)` and `min(310, ceiling)`, and the clamp was **not binding at 380 and is not
binding at 640**. `monthly-low` stays 200, `monthly-high` stays 310, `savings-rate` stays 255, and
therefore `months-to-target`, `on-track-for`, `checkpoint-amount`, `deposit-target`, `loan-amount`,
`ltv`, `borrow-low`, `borrow-high` and `max-property` are all **unchanged**. The deposit calculator
steps 1 to 3, the tracker and the MIP borrowing result read nothing from `money-in`. **No formula
was touched.**

**THE CONSEQUENCE THAT WAS NOT ASKED FOR AND IS THE MOST IMPORTANT PART.** Three open FCA gaps were
raised against the 380 ceiling, and raising it clears two of them without a figure in the slider
moving:

- **G61a**, the 255 default at 67% of left-over, 27 above rule 1A's 60% line: now **39.8%**, and
  129 below a line that has itself risen to 384.
- **G63**, the 310 upper handle at 81.6%, above the 80% rule 1A names as predictably failing: now
  **48.4%**, below both thresholds. This gap named its own trade exactly - lowering 310 would break
  frame 10's reference PNG - and this pass took the other side of it, leaving 310 alone.
- **G64**, the 10b date path's uncapped 331-404 range: now sits *inside* a 640 ceiling. **The defect
  is unchanged and the gap stays open.** Only its default reproduction goes quiet, which makes it
  harder to find rather than smaller, and the gap now says so.

**Flagged, not fixed, and not mine to close.** Frame 10's slider track becomes 0-640 where the
reference PNG draws 0-380. G63 anticipated exactly this as a screenshot-exemption call belonging to
whoever owns the reference set. G63 is therefore left **open** with its resolution recorded, rather
than closed on my own authority.

**D55's reasoning is amended in place, and its decision is not.** The stage block argued the LISA
cap and the projection window "cannot both hold" partly on the ground that "at the left-over ceiling
of 380 a month, the most a session can reach inside 60 months is a 358,300 property, still below the
cap". At 640 that is false: 640 a month from 8,950 reaches 52,985 in 60 months, a **529,848**
property at 10%, above the cap. The trade still stands because the stage does not drag the handles -
`savings-rate` is still 255 and 650,000 still lands beyond-window - so `STAGE_PROPERTY_VALUE` is
untouched and `stage.test.mjs` asserts the same things. It is now a trade about the **seeded** rate
rather than about every reachable rate, and the comment says so.

**Test fixtures deliberately left alone.** `model.test.js`'s `read(2240)` and
`skip-ahead.test.mjs`'s `f(2240)` are self-contained hypotheticals, not the seed - the latter models
a 420,000-property session that never existed. Both stay internally consistent at 2,240 less 1,860,
and both still assert what they were written to assert. `session-seed.mjs`'s 2,600 is the
screenshot seed and is a separate scenario by design.

**Reversal.** Put `2240` back in `MOCK_POSITION.moneyIn` and `+£2,240.00` back in `content.js`.
The stage comment, the three GAPS amendments and the four doc figures are prose and revert with it.
Nothing else depends on any of it.

---

## D58. Frame 01's two figures are read from the model, because a display string is a second copy

**Date.** 29 August 2026.

**Decision.** `content.js`'s `'/home'` block loses both of its typed money strings.
`balanceAmount: '£1,042.16'` is deleted outright and `home.js` renders
`formatAccountBalance(MOCK_ACCOUNTS['current-account'].balance)`. The salary row's
`amount: '+£2,500.00'` becomes `amountTemplate: '+{amount}'`, which `home.js` fills with
`formatTransactionAmount(MOCK_POSITION.moneyIn)`. The other three transaction rows keep their
literal amounts: they are arbitrary mock merchants with no model figure behind them, so there is
nothing to read them from. **Nothing on the screen changes** - it renders £1,042.16 and +£2,500.00
before and after.

**Why, and it is not tidiness.** D57 rounded the seeded salary and had to edit `content.js` by hand
as a second step, because the figure existed twice. That is the whole defect: `MOCK_POSITION.moneyIn`
is the seed every screen derives from, and frame 01 held a typed copy of the same number with
nothing connecting them. A pass that updated one and missed the other would leave the store saying
2,500 and the first screen of the study saying 2,240, and no test would fail - the repo's own
`overlap`, `action-bar` and `bottom-nav` suites measure geometry, not figures.

**The balance was the same defect, one row up, and is included under the standing rule that a
correction applies everywhere the pattern appears.** `format.js`'s own comment on
`formatAccountBalance` already asserted that frame 01's balance and frame 03's account row "read the
same mock balance for the same account and must show the same number, not a rounded one" - a
statement that was true only because someone had kept two numbers equal by hand. It is now true
because there is one number.

**A third formatter, and why the two existing ones would not do.** `formatTransactionAmount` is
en-GB, £, always two decimal places. `formatCurrency` is D9's whole-pound rule for deposit-journey
figures and would render "£2,500". `formatAccountBalance` shows pence only when the value carries
them and would also render "£2,500" for a round salary. Every other row in that list draws pence, so
a salary row without them would read as a different kind of number rather than the same kind
rounded. The sign stays in `content.js`, where the "+" and the "−" (U+2212, not a hyphen) are copy.

**What this does not do.** It does not make frame 01 recompute anything. `MOCK_POSITION` and
`MOCK_ACCOUNTS` are mock read-provenance sources, not calculations, so this is a read, not a
derivation, and no provenance changes.

**Audited rather than assumed.** All 29 routes were walked in a browser on a FRESH session and their
rendered text searched for every form of the old figure and its derived pair. No screen renders
£2,240, £380, 83% or 17%. Frames 20 and 21 were reached by walking the real Mortgage in Principle
flow, the only way they are reachable. Gross pay is £38,000 on both screens that show it (frame 19
and the borrowing sheet), both from `MOCK_MIP_DATA.annualSalaryBeforeTax`, and no screen anywhere
shows £26,880 or any other figure implying the old net.

**Reversal.** Put the two literals back in `content.js`, drop the two imports and
`CURRENT_ACCOUNT_BALANCE` from `home.js`, and delete `formatTransactionAmount` from `format.js`.

---

## D59. A stored session is stamped with its build, and a session from another build is discarded whole

**Date.** 29 August 2026.

**Decision.** `defaultState()` gains a `buildVersion` key holding `BUILD_VERSION`. `load()` compares
the stored stamp with the running one and, on any mismatch - including a session with no stamp at
all - discards the stored session entirely, falls through to `defaultState()`, warns on the console
with both versions, and re-persists so the discard happens once rather than on every load. A
matching stamp restores exactly as before. `persist()`, `setState()` and every other write path are
untouched.

**What this fixes.** `load()` returned `{ ...defaultState(), ...stored }`, so a STORED value beat a
freshly seeded one. A tab carried across a deploy kept rendering the previous build's seeded figures
indefinitely. `money-in` is the one that surfaced it, over three sessions of investigation, and the
symptom is what made it expensive: the screen is fully rendered and internally consistent, so it
reads as a defect in whichever figure just changed. It also survives both things anyone tries first
- a hard refresh clears the HTTP cache and the service worker but not `sessionStorage`, and a
`CACHE_VERSION` bump invalidates assets where this is stored state.

**WHY THIS IS NOT THE FIX G66 REJECTED, WHICH MATTERS BECAUSE THAT REJECTION WAS CORRECT.** G66
specified stamping the session and, on a mismatch, *treating it as new and applying the opening
stage*. It was stopped because `stagePatch()` writes only `STAGE_KEYS`, so the result was a store
holding `targetMonth`, `solveFor`, `journeyStarted`, `returnFrame` and `ltvVideoSeen` from a real
session beside an opening stage's fresh goal - **a combination no screen expects**, which is the
exact condition `CLAUDE.md`'s state rules and D46 exist to prevent. **Discarding the store whole
cannot produce that.** What comes back is a first load, and every screen already handles a first
load. The difference is one word in the specification and it is the whole of why this is safe.

**The routing half closes for free.** `restoredFromStorage` stays false on a discard, so
`isNewSession()` is true and `openSession()` applies the opening stage to a *fresh* store - the same
path a genuine first load takes. G66's original symptom, the Insights tab redirecting to
`/calculator/property` forever, goes with it, with no second mechanism added.

**THE STAMP LIVES INSIDE THE STORE, NOT IN AN ENVELOPE AROUND IT.** `{ build, state }` was the
tidier shape and was rejected on blast radius: **ten call sites across six browser harnesses** read
or write the stored object directly, and two of them read it back - `sheet-drag.test.mjs` asserts
`state.ltvVideoSeen`, and `shots.mjs` spreads its frame 33 settings over a stored session. An
envelope breaks every one of those reads. A key inside the store breaks none.

**Every harness seed is now stamped, and it had to be.** An unstamped seed is discarded by the very
check being added, so `overlap`, `action-bar`, `bottom-nav`, `sheet-drag`, `inset-shots` and `shots`
would each have silently measured a DEFAULT session instead of the one they set up - green tests
asserting nothing. Ten seed sites carry `buildVersion: BUILD_VERSION` with a comment saying why.
This is the change's real risk and it is why the full suite, not just the new file, is the check.

**WHAT REMAINS, AND IT IS DELIBERATE.** A participant whose session spans a deploy and who then
causes a document load loses their progress - to a clean opening session rather than to a mixed one.
`BUILD_VERSION` is constant within a deploy, so every ordinary mid-session refresh matches and
restores untouched; only a deploy landing mid-session triggers it. That is the price of the figures
never disagreeing with the build, and it is the trade G66 could not make while the fix produced
mixed state.

**Frame 33 already surfaced the build and still does** (D49): the footer reads "Build v51. Figures
are illustrative throughout." from the constant compiled into the running modules, with a second
line if a newer build is cached and waiting. Verified rendering v51; no change was needed.

**Every seeded figure had this exposure, not only `money-in`:** `money-in`, `essential-spending`,
`left-over`, `saved-toward-deposit`, `emergency-fund` and `unassigned`, plus the scenario defaults
`theme`, `textSize`, `stage` and `resultOutcome`, plus every `COLLAPSIBLE_DEFAULTS` key, plus the
fifteen `STAGE_KEYS` the opening stage writes - those doubly so, since a restored session never
received them at all. Any future change to a default had the same exposure; that is what closes
here.

**Reversal.** Drop the `buildVersion` key from `defaultState()`, restore `load()`'s three-line body,
delete `scripts/stale-session.test.mjs` and its `CLAUDE.md` line, and remove `buildVersion` from the
ten harness seed sites.

---


## D60. The seeded property is 450,000, and the Lifetime ISA cap warning is what it costs

**29 August 2026.**

**Decision.** `STAGE_PROPERTY_VALUE` in `src/stage.js` is lowered from **650,000 to 450,000**. This
reverses D55 in effect: 450,000 is exactly `LISA_CAP_PROPERTY_VALUE`, the comparison in
`savingPatch()` is strictly greater-than, so `lisaCapBreached` is false and a session opening in the
saving stage no longer arrives on frame 09 with the Lifetime ISA cap banner rendered.

**Why.** The seed is the case study a participant is asked to reason against in a moderated
think-aloud session, and 650,000 is not a property an early-career professional reads as theirs. A
figure a participant treats as somebody else's problem is a figure they reason about at arm's length,
which is the opposite of what the method needs: the instrument is trying to observe how someone
thinks about *their* deposit, and a headline they cannot occupy converts that into a comment on the
London market. 450,000 is chosen for relatability and for nothing else.

**What it costs, stated rather than discovered.** Frame 09b's cap banner stops being an OPENING
state. It is not unreachable and no code was removed: frame 09 re-derives the comparison live from
`property-value` rather than reading the stored flag (confirmed in the D55 pass), so a participant or
facilitator who types anything above 450,000 still meets it. What is gone is meeting it *without
typing*, which is the whole thing D55 bought. Carried as `GAPS.md` **G70** so a facilitator who
expects the banner on the opening screen finds the reason rather than a bug.

**What it does not buy back, and this is the part worth being explicit about.** The projection
window. D55 gave the window up to reach the cap; lowering the seed gives the cap up **without**
recovering the window. At 450,000 the target is 45,000 and `months-to-target` is **107.6 months**,
still past `CHART_WINDOW_MONTHS`, so `monthsToTarget()` still returns `beyond-window` and the
tracker's "On track for" row still renders its beyond-window variant from the opening session. The
window closes at about a **275,832** property against the seeded 8,950 balance and 255 a month, so
nothing near a relatable London figure sits inside it. This is understood, not overlooked: the two
properties D45 and D55 traded between are now both given up, and the seed is chosen on a third axis
that neither of them was about.

**What it keeps.** D45's second property, untouched and still asserted: **8,950 < 33,750**, so the
tracker still opens locked, the Mortgage in Principle milestone is still the thing out of reach, and
both skip-ahead positions still exist. "Ready to check" lands at **29.9 months, on track for 27 to
33** - inside the window, because the skip-ahead position starts from the checkpoint rather than from
8,950.

**Every dependent figure follows, and none of them was edited.** `deposit-target` 65,000 → **45,000**,
`loan-amount` 585,000 → **405,000**, `checkpoint-amount` 48,750 → **33,750**, `gap-to-checkpoint`
39,800 → **24,800**, frame 21's `gap` 56,050 → **36,050**, `borrow-low`/`borrow-high` 526,500/643,500
→ **364,500/445,500**, `max-property` 652,450 → **454,450**, frame 20's Loan-to-Value 99% → **98%**,
frame 21's needed loan 641,050 → **441,050**, frame 12's three chart targets 32,500/65,000/97,500 →
**22,500/45,000/67,500**. `ltv` stays 90%, because it is a function of `deposit-pct` alone. Not one of
these is written down anywhere: the repo already holds SPEC.md's "no number hardcoded in a screen"
property, so a full grep for every one of the old figures in all seven written forms returned code
hits in `src/stage.js` only, and prose hits in this file, `GAPS.md`, `ROUTES.md` and `SPEC.md`. There
was nothing to rewire.

**The test moves with it.** `scripts/stage.test.mjs`'s cap assertion was D55's, and asserting the old
intent would have failed. It now asserts the new one - the seed does not breach the cap, the stored
flag is false, and the flag agrees with the live comparison frame 09 makes - written as a
relationship to `LISA_CAP_PROPERTY_VALUE` rather than as `450000`, because the seed and the cap are
the same figure today by coincidence (one is a relatability choice, one is the Lifetime ISA rule) and
a change to either should only fail this test if the opening session's banner state actually moved.
The beyond-window test needed no new assertion and got a new comment: the cost it records now
outlives the thing it was paid for.

**Flagged and not fixed.** The borrowing figures do not sit plausibly against the seeded salary. The
affordability figure is `MOCK_MIP_DATA.annualSalaryBeforeTax` (38,000), not `money-in`'s 2,500 a
month after tax - the two are different seeds for different screens - and a 405,000 loan is **10.7x**
it, down from 15.4x but still well outside any real multiple. Frame 20's outcome is facilitator-set
(`resultOutcome`), not affordability-derived, so
nothing errors and no screen contradicts itself on that axis. Raised as `GAPS.md` **G71** rather than
addressed here, because changing it means choosing an income-derived `borrowRange`, which is one of
the three readings G69 is already waiting on an answer for.

**Reversal.** Put 650,000 back in `src/stage.js` and restore `stage.test.mjs`'s cap assertion to
`> LISA_CAP_PROPERTY_VALUE` / `true`. The opening session's banner returns untouched; nothing else
was moved to accommodate this.

---


## D61. Step 2 of 3's target year is typed as well as stepped, and looks no different for it

**29 August 2026.**

**Decision.** The year on frame 10b (`/calculator/saving`, `solveFor === 'amount'`) is an input. It
was a `<p class="date-stepper__value">` reachable only by its two chevrons; it is now an
`<input class="date-stepper__value date-stepper__value--input">` carrying the same class, so a
participant can tap it and type. The month beside it is unchanged and stays stepped-only: it is
chosen from twelve names rather than typed, and a text field is the wrong control for a closed set
the two chevrons already reach in at most six taps.

**Why.** A participant setting a target three, five or seven years out was tapping a chevron once per
year with no other route to the value, while frame 05's headline figure and frame 09's property value
have both been typeable throughout. The prototype is an instrument for observing how someone sets a
deposit goal, and a control that makes the goal expensive to move measures the control rather than
the goal.

**The pattern is frame 05's and frame 09's, not a new one.** `figureInputHTML` and
`currencyInputHTML` already agree on every attribute that matters, and the year copies them exactly:
`type="text"` with `inputmode="numeric"` rather than `type="number"` - the numeric keypad without the
spinners, without the locale parsing, and without the `setSelectionRange` exception `rerenderInPlace`
has to catch on a number input. The handler is the same two listeners those screens bind:
`focus -> select()`, so a tap replaces the year rather than dropping a caret between two digits, and
`change` rather than `input` as the commit, so a half-typed "2" never reaches the store or
re-renders the screen under the participant's fingers.

**Nothing on the screen moved, and that was checked rather than asserted.** `shots.mjs` gains a
`--solve` axis - frame 10b was previously unshootable, because the shared seed carries
`solveFor: 'date'` and a variant selector belongs in a script's own overrides rather than in
`session-seed.mjs` - and frame 10b was shot before and after in both themes and at both text sizes.
All three pairs are **byte-for-byte identical**. Two rules bought that:

- **No border, no underline, no fill.** Frame 05's `.figure-input__field` draws a 1px bottom rule,
  but that rule belongs to the wrapper around its input and frame 05 has no box of its own. Here the
  `.date-stepper__control` box is already the field's outline, and a second rule 1px inside it would
  redraw a screen this pass was not meant to touch. The modifier undoes what a user-agent stylesheet
  puts on a form control - border, background, padding, font family, the ~20ch default width - and
  adds nothing; every visible property still comes from `.date-stepper__value`, so the year and the
  month beside it cannot drift apart. Focus is still shown: the global `:focus-visible` ring in
  `shell.css` applies to this input like any other control, on keyboard focus only, so a tap shows
  nothing and a Tab shows the ring.
- **No `min-height`,** which is the one place this departs from `.figure-input__value`. That rule
  sets `min-height: var(--touch-target-min)` on a readout standing alone on a screen; the same 44px
  here would grow the control box by about 20px and move the stepper. The readout keeps its 24px line
  box, which still clears WCAG 2.5.8's 24px minimum, and the two 44px chevron buttons flanking it are
  untouched.

**An empty field is a draft, which is D46 applied to the second typeable field in this build.**
`state.js` gains `targetYearCleared`, and an empty or unparseable field sets it instead of writing
`targetYear`. This is not a precaution: `savings-rate`, `monthly-low` and `monthly-high` are all
SOLVED from the target date on this path (D2), so a year written mid-keystroke would be solved
against by frames 11 and 12 exactly as `property-value: null` was before D46 - and
`formatCurrency(null)` renders that as £0 rather than failing. The committed year is left standing,
Continue is disabled with **no error banner** (nothing is wrong yet; the participant is part-way
through typing, which is frame 09's own behaviour), and the draft is resolved by the same click that
commits the figures it fed. The render guards on the draft BEFORE deriving anything, so no figure is
built from a year the guard has not tested - CLAUDE.md's second state rule.

**Both year chevrons resolve the draft, and so does a month roll that crosses a year boundary.** The
second is the one worth stating: `step-month-up` at December writes `targetYear + 1`, and while the
field was empty that would have moved the year where the participant could not see it. `stepMonth()`
clears the draft on exactly the presses that write a new year and leaves it alone on the other eleven.

**`targetYearCleared` is deliberately NOT in `stage.js`'s `STAGE_KEYS`,** for the reason `targetYear`
itself is not: a stage patch makes no claim about the clock and does not write the target date, so
clearing the draft without clearing the year it describes would leave the two disagreeing.

**Bounds: the existing minimum only, and the maximum asked rather than invented.** `errorPastDate`
already guards a date in the past and is reused untouched. No maximum exists anywhere - both stepper
chevrons are unbounded arithmetic - and the typed field adds none, so the two routes to a year cannot
accept different values. `maxlength="4"` is a **format constraint, not a bound**: a year is four
digits, so the field holds four; it introduces no error string and no content rule, it applies to
`type="text"` (it is ignored on `type="number"`, a second reason the pattern uses text), and it
constrains typing only - not `select()`, and not a value set programmatically on re-render. See
GAPS.md **G73**, which records that five-digit years are now unreachable by typing, that four-digit
years beyond a plausible range remain possible and degrade into a pennies-level figure and frame 12's
existing `beyondWindowNote` rather than erroring, and that the stepper stays unbounded - so the gap
is mitigated for typing and not closed.

**Rejected: reusing `figureInputHTML` itself.** It is a 40px centred currency figure with a £ prefix
and a bottom rule, built for a headline standing alone on a screen. Dropping it into a 17px stepper
box would have changed every visible property of the readout, which is the one thing this change was
not allowed to do. What is reused is the pattern the component encodes - the attributes, the two
listeners, the draft rule - which is what reuse is worth here.

**No copy changed.** The input takes the existing `dateStepperYearAriaLabel` ('target year') as its
own `aria-label`, which a screen reader announces alongside the edit-text role, so the change added
no string to `content.js` and raised no FCA copy question.

**Verified.** 270 tests passing. `stale-session.test.mjs` gains a sixth test covering the whole of
the flow-through: the attribute contract, the typed year surviving a reload (the D59 stamp path - a
same-build restore must carry it through rather than discard it as stale) and a back navigation, an
empty field writing nothing and disabling Continue, and the committed `savings-rate` matching
`monthlyAmountFromDate()` run over the same months - asserted against the model rather than against a
number written into the test, so the two cannot drift.

---

## Open questions

None remain open as of 20 August 2026. Nothing in D11-D19 (this session's shell, icon-set, frame 03, action-bar, sheet-gesture and sheet-header passes) opened a new one - each is a build-stage decision with a stated reason and a stated reversal, not a question left hanging.

As of 19 August 2026 (second pass): All five originally listed here have been closed and folded into the decisions above: Q1 → D2 (confirmed), Q2 → D6, Q3 → D7, Q4 → D8, Q5 → D9. A sixth item, not originally an open question, was also corrected this pass: the regulatory basis for the Mortgage-in-Principle adviser route - see D10.

---

## Change log

| Date | Change |
|---|---|
| 19 August 2026 | D1 to D5 recorded. Q1 to Q5 opened. |
| 19 August 2026 (session 2) | D6 to D10 recorded. Q1 to Q5 closed and folded into D2, D6-D9. |
| 20 August 2026 (shell pass) | D11 to D14 recorded: persistent bottom navigation (deviation from the wireframes, exempt from the screenshot pass), collapsible sections closed on load, light mode fixed against the OS setting, and device-frame clipping with hidden scrollbars. |
| 20 August 2026 (icon set) | D15 recorded: one drawn icon set in src/icons.js, SF Symbols drawing conventions, sized from the type scale. assets/icons/*.svg deleted. Deviation from the reference PNGs, exempt from the screenshot pass for icon rendering. |
| 20 August 2026 (safe area) | D14 extended: the 59px status-bar and 34px home-indicator space is reserved inside the phone screen, while the status bar element stays absent per D1 - the two are separate and are now written down as such. D11's tab-bar inset detail superseded. |
| 20 August 2026 (frame 03 selection) | D16 recorded: a checkbox on every countable account (deviation from the wireframes, exempt from the screenshot pass), and in-place updates that hold scroll position and focus - an 18-call-site defect across 8 screens, fixed by `syncAccounts` on frame 03 and `rerenderInPlace` everywhere else. |
| 20 August 2026 (screen tail) | D17 corrected on two counts: the scroller's reserve for the bar was being silently reset by a `padding` shorthand, leaving the last element on every overflowing full screen behind the bar; and the scroll affordance's fade spanned 193px of the screen in flat `--color-bg` rather than 56px at the bottom edge, which is what read as a blurred region below the last element. See `GAPS.md` G41. |
| 20 August 2026 (bottom inset) | D14 revised: the bottom safe-area inset now lives INSIDE the lowest chrome on every screen type - the tab bar, a lone action bar, or the sheet's action bar - rather than as a band beneath it on `.screen`. The chrome's background reaches the bottom of the phone screen; `.screen` keeps the inset only on 19b and 33, which have no bottom chrome. D11's original tab-bar arrangement is restored. See `GAPS.md` G40. |
| 20 August 2026 (sheet bottom) | D14 and D17 corrected: the sheet's bottom safe-area inset moved from `.sheet-overlay`'s padding (outside the card, which lifted every sheet off the bottom of the phone screen) to inside the card below its action bar; both insets now resolve from one `--safe-top`/`--safe-bottom` pair; and a sheet's content now scrolls under its own action bar via an out-of-flow dock. See `GAPS.md` G39. |
| 20 August 2026 (action bar) | D17 recorded: the action bar appears once the participant reaches the end of the content, on the 22 screens that overflow; the 7 that fit show it immediately. Deviation from the wireframes, exempt from the screenshot pass. Kept focusable and in the accessibility tree throughout - `opacity`, never `visibility: hidden`. |
| 20 August 2026 (sheet gesture) | D18 recorded: the grabber on all seven sheets drags, dismisses past a threshold and settles back short of it, and a drag closes by clicking the sheet's own dismiss control rather than navigating - so 13b's `ltvVideoSeen` and every other on-close state change happen exactly as they do on a tap. Asserted in a browser by `scripts/sheet-drag.test.mjs`. |
| 20 August 2026 (sheet header) | D19 recorded: 29-32's close control loses its circular background for the app's standard plain-glyph treatment, and the sheet heading moves into the header row beside it so the two align and the heading's column ends where the glyph begins. Deviation from the reference PNGs for the sheet header on those four frames, exempt from the screenshot pass. See `GAPS.md` G42. |
| 20 August 2026 (sheet head spacing) | D19 amended: the title row's top padding goes to `--space-2xl`, so the close control's 48px target clears the grabber by 15px instead of 7px and the heading starts 24px below it rather than 16px; `sheetHeaderHTML`'s `closeLabel` becomes optional and frames 03b and 10c adopt the header without a glyph, 13b taking the same 24px as scroller padding. No close control is added to a frame whose reference PNG does not draw one. |
| 20 August 2026 (assumptions links) | D20 recorded: where a screen drew two near-identical "how we worked this out" controls into the same sheet, one is removed (06, 12); where they go to different sheets, both stay and are reworded to name the figures they explain (12, 13, 15, 16). Frame 21's card nav row, unbound since it was built, now works. See `GAPS.md` G45. |
| 20 August 2026 (card disclosure) | D12 extended to `howThisWorksCardHTML` on frames 06, 12, 13, 20 and 21: closed on load, opening in place with scroll and focus held. Frame 06 now routes two collapsibles on `data-disclosure-id`. |
| 20 August 2026 (goals area) | D21 recorded: frame 06's "save for something else" branch now lands on `/goals`, the bank's own goals area, instead of returning to frame 01. Partially reverses `build-spec.md` section 3's exclusion of frame 07 - the generic savings-goal SCREEN stays excluded, only the branch's destination changes. New `goalHorizon` flag on the account data; no invented figures; no regulatory anchor, on the frame 01 precedent. Tab bar gains an `active` parameter and a live Goals tab. |
| 21 August 2026 (Goals tab) | D11 amended: Goals is a live tab - enabled, routing to `/goals`, lit while on that screen. Payments, Insights and Profile stay `disabled`. Frame 01 stopped rendering its own copy of the bar, which had left its tabs bound to nothing: `mountBottomNav` is the only renderer and the only binder now. See `GAPS.md` G47. |
| 21 August 2026 (tab states) | D11 amended again: the bar has three tab states, not two - active (indicator + bold label + filled icon + `aria-current`), enabled-not-active (identical to disabled at rest, darkens under a press), and disabled (`aria-disabled`, not focusable). A tab is active only where the route IS its destination, so `/home` and `/goals` light one and every other screen lights none. The old two-state split was an accident: no rule set `color` on a tab, so enabled inherited full strength and disabled was greyed by the user agent. See `GAPS.md` G49. |
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
| 27 August 2026 (strict alternation on /goals) | **D44 amended a fifth time**: `/goals` now shows exactly **one** bridge card in every state - the calculator while no deposit goal is set, the tracker once one is, at any savings position. `unlocked` is gone from `goals.js` and the condition is `hasGoal ? trackerCardHTML : houseCardHTML`. **The rule has not changed and the third-state reasoning is not superseded - it is outranked, and deliberately left in the entry unedited.** "Do not advertise a door that redirects" still holds and is still why the no-goal state withholds the tracker card; the third state was *correct* under it, both destinations genuinely rendering at or above the checkpoint. What changed is a judgement above the rule: one card in every state is worth more than a second honest door in one state. **The cost is accepted knowingly and recorded in both the entry and `ROUTES.md`**: `tracker.js` draws "Adjust my goal" on the below-checkpoint variant and no other (D25, which governs frame 15 only), so a participant at or above the checkpoint now has **no nearby route to the deposit calculator at all** - it is reachable by typing `#/calculator/property` and in no other way from that state. The obvious repair, drawing the secondary on the unlocked variant too, stays rejected on the fourth amendment's instrument cost: a backwards-pointing action beside the control that opens the Mortgage in Principle flow diverts participants into the calculator and costs the sessions the observation that variant exists to produce. The two amendments are consistent - the fourth refused to add a route to the tracker, the fifth removes one from `/goals`, both paid for by the same participant in the same state. Verified by driving all three journey states through frame 33 and asserting the rendered `data-action` set rather than eyeballing it (`setting-up` -> `["open-deposit-calculator"]`, `saving` and `ready-to-check` -> `["open-deposit-tracker"]`), clicking each card to confirm where it lands, and tapping Insights in all three - unchanged, `#/tracker` in the two goal states and still redirecting in the no-goal state. Shot at 390px light and dark in both states, dark mode unchanged, no layout gap where the second card was. `overlap.test.mjs` loses `goals-below-checkpoint`, now the same shape as the bare `goals` row; `ROUTES.md`'s three-state table becomes two rows and gains the missing-route warning. `CACHE_VERSION` v37. 268 tests passing. |
| 28 August 2026 (session opens populated) | **D48 recorded.** A new session opens in the **saving stage** rather than empty, so the Insights tab lands on a populated deposit tracker from the first tap - the tracker was previously the one screen a participant could not meet, `/tracker`'s guard redirecting into the calculator until frames 09, 10 and 11 had all run. Same reasoning `state.js` already applies to `money-in`: the accounts are connected, so what follows from them is there rather than waiting on a form. **`router.js` reuses `stagePatch()`**, the same function frame 33 calls, against the same fresh `defaultState()` - a session that opened itself and one a facilitator set to "Saving" are byte-identical, asserted through the very expression `openSession()` runs. **`OPENING_STAGE` is a constant in `stage.js`, not a changed default in `state.js`, and that is load-bearing**: `baseline()` is built from `defaultState()`, so a moved default would have made frame 33's "Setting up" a no-op and put the blank calculator out of reach. It sits in `router.js` because `state.js` cannot import `stage.js` without a cycle that would put `stagePatch` in the temporal dead zone. Gated on `isNewSession()`, so a mid-session refresh restores rather than resets; `resetState()` clears the flag so `#/reset` opens the next participant's session too. **`saved-toward-deposit` untouched at £8,950** - the sum of the four accounts frames 03, 06 and 32 draw, so the session opens BELOW its checkpoint and skip-ahead keeps both positions. Accepted cost: frame 09 arrives pre-filled at £240,000/10% and `/goals` draws the tracker card from the first tap. `CACHE_VERSION` v38. 275 tests passing. |
| 28 August 2026 (build caption tells the truth) | **D49 recorded.** Frame 33's build caption is rendered from `BUILD_VERSION` - the constant compiled into the running modules - and is **never overwritten**; a cached version that is not the running one appears as a **second, labelled line** saying it is downloaded and waiting for a reload. `CACHE_VERSION_FALLBACK` renamed `BUILD_VERSION`: it was never a fallback. **The caption was being read as evidence and it was wrong** - Cache Storage is rewritten by whichever worker most recently activated, and `sw.js` uses `skipWaiting()`/`clients.claim()`, so after a deploy the new worker claims while the document keeps executing the modules it already had. It cost a full investigation: "Build v38" on screen, v37 executing, and a `#/reset` typed on the strength of it ran the previous build's reset. **`find()` on the cache names is gone rather than corrected** - it picked arbitrarily between two right answers during exactly the window that mattered; `readCachedVersions()` returns the whole set and **nothing ranks them**, since only equality against the running version is needed. Verified across a real v38 to v39 deploy, five steps: **zero false version claims**. **Part two stopped before implementation, on its own condition** - stamping the build version into the session would reset a participant mid-task, because the check runs on every document load and a refresh, tab restore or home-screen relaunch is a document load. Logged as **G66** with the full cost. `CACHE_VERSION` v39. 275 tests passing. |
| 28 August 2026 (frame 20 ends the flow) | **D50 recorded.** Frame 20 is built as the end of the MIP flow: **no action bar** ("Start my Mortgage in Principle" and "Keep saving for now" removed with their handlers and their `content.js` keys), and its **first next-step row stops being a control** - no action, so no chevron and no focus stop. **The second row is deliberately untouched**, keeping its chevron and its `/mip/adviser` route, because it is the MCOB 4.8A + Consumer Duty adviser route (D10) and `SPEC.md`'s verification step 4 requires it reachable from 20; that step still holds as written, and no `GAPS.md` entry was needed. `nextStepsCardHTML` now draws a `<button>` + chevron when a step declares an `action` and a `<div>` with neither when it does not - **one fact deciding both**, since the chevron is the claim that a row goes somewhere and a button bound to nothing is a dead focus stop (D11's reasoning for `disabled` tabs). **Frame 21 is byte-identical**, asserted by comparing its rendered `.next-steps-card` outerHTML before and after (2,304 characters, strictly equal), and it keeps its bar and all three chevroned rows - the asymmetry is deliberate and must not be propagated. Costs recorded rather than discovered later: `build-spec.md` row 83's *Assumed* "Back or done -> 16 Tracker" is superseded and `/tracker` is now reached from this screen **only via the Insights tab**; the dock's `--more-below` fade goes with the dock, leaving scroll as the only more-below cue; and whether a participant presses "Start my Mortgage in Principle" stops being observable. Layout needed no work - `mountActionBars` already clears the published height for bar-less screens and `var(--action-bar-height, 0px)` falls back, so the scroller reserves `--screen-inset-y` alone. Measured in Chromium: at 375x667 the last element ends 24px above the tab bar, `.screen` padding-bottom `0px` with the inset carried inside `.bottom-nav`, so **the safe area is not doubled**; at 1280x900 framed, `--safe-bottom` resolves to 34px, the nav is 90px tall and its bottom edge is the phone screen's. `scripts/shots.mjs` gains a **`--scroll=top,end`** axis, the screens' bottom edge being the thing under review and the frame itself not being what scrolls. `SPEC.md` gains an eighth screenshot exemption, frame 20 only, and frame 20 leaves the sixth's set. `CACHE_VERSION` v40, with `BUILD_VERSION` bumped in the same commit (D49's paired-edit rule). 271 tests passing - four fewer than 275, being frame 20's four viewport rows moving out of `action-bar.test.mjs`'s `SCREENS` and into its no-bar list. |
| 28 August 2026 (the check is offered at any position) | **D51 recorded; D25 and D35 amended in place.** The deposit tracker's action bar carries `check-mip` as its primary on **both** variants under one string, so the Mortgage in Principle flow is enterable at any savings position and frame 21 is reachable in a moderated session rather than only by URL. An explicit author override: the checkpoint stops gating the ROUTE and keeps deciding the RESULT - below it the outcome is derived from position through the model's existing `gapToCheckpoint`, at or above it `resultOutcome` governs. An affordability/Loan-to-Value rule was rejected on the figures, the comparison frame 21's own copy states being false at every position this prototype can reach. Frame 33's outcome pill therefore no longer describes what happens below the checkpoint, accepted explicitly. D25's displaced primary becomes the in-content Loan-to-Value info link (the same string, its unlocked-only gate now spent), `belowCheckpointCta` is deleted, and `belowCheckpointBodyTemplate` is rewritten to carry no figure and hint at no direction. The milestone row takes `available` below the checkpoint - **D42 needs no amendment**, it anticipates the case - so the variants now differ at row 3 and the checkpoint leaves the milestone list; `locked` keeps no occupant and is kept rather than deleted (GAPS.md G68). Copy: `mipLockedBodyTemplate` and `mipUnlockedBodyTemplate` **collapse into one `mipBody`** (one row state, one string, and the shared "Available from {checkpoint}" opening was false on both rows); `unlocksAtTemplate` is **deleted**, which closes D42's own deferred "'Unlocks at' is left for a separate decision" line; and `readyToCheckLabel` is renamed `mipCaption` and rendered on both variants, since it was already true at either position. Verification item 2 (at-checkpoint variant byte-identical) is superseded on purpose - correctness beat the identity check. `CACHE_VERSION` v42. |
| 28 August 2026 (frame 21 ends the flow too) | **D52 recorded; D50 amended in place.** Frame 21 takes D50's frame 20 treatment: **no action bar**, and rows 1 and 2 of its next-steps card stop being controls, through the same A2 mechanism (a row that declares no `action` renders as a plain `<div>` with no chevron and no focus stop) - no flag and no second mechanism. **Row 3 is untouched**: the adviser route rests on MCOB 4.8A and the Consumer Duty support outcome (D10, SPEC.md's anchor map), and SPEC.md's verification step 4 requires it reachable from both 20 and 21, confirmed still true as written. D50's live instruction that "the asymmetry must not be propagated to 21" is **withdrawn** by a dated banner: both screens end the same flow, and what differs is the answer, not whether the flow has finished. Lost and recorded: the in-content routes to `/tracker` and `/calculator/property` from this screen (neither orphaned - both reachable elsewhere, and the borrowing sheet keeps this screen's own card nav row), and the `--more-below` fade, which is drawn by the dock and goes with it on the longest screen in the flow. `primaryCta` and `secondaryCta` deleted; no wording changed. A **ninth** screenshot exemption in SPEC.md, and frame 21 leaves the sixth exemption's set, so both result screens are now out of it. `action-bar.test.mjs` moves the route into the no-bar test. `CACHE_VERSION` v43. |
| 28 August 2026 (one forward route from frame 08) | **D53 recorded.** Frame 08 draws **no action bar**: "Not now, just track my goal" is removed with its content key, and the deposit calculator becomes the only forward route from the screen. The removed button wrote no state and offered a shortcut past the one thing the screen introduces, from the more prominent of two unequal slots; `build-spec.md` section 1 names the card's checkpoint button from here and **no row for this one at all**. `/tracker` stays reachable from the Insights tab, `/goals`'s bridge card, frame 12's primary and the MIP exits, and no journey state is lost - nothing in `src/` reads `calculatorEntered`, and frame 33's Journey stage builds a populated tracker more completely than the button did (D45). The **DUAA pushback affordance is untouched**: SPEC.md's anchor map satisfies it on this screen with the flag row plus the "how we worked this out" link, both of which stay - the removed control was a decline route, not pushback. Lost and recorded: the screen's only decline route, and the `--more-below` fade, which the dock draws and which goes with it on a screen that needs scrolling. The guidance-not-advice line keeps its place as the last element in the content. A **tenth** screenshot exemption in SPEC.md; frame 08 leaves the sixth exemption's set; `action-bar.test.mjs` moves the route into the no-bar test and all three no-bar enumerations now read "01, 08, 12, 19b, 20, 21 and 33". `CACHE_VERSION` v44. |
| 28 August 2026 (a second, invisible path to frame 33) | **D54 recorded.** A **~700ms long press on the DISABLED Profile tab** opens `/settings`, so a session reaches frame 33 and its reset without a hash typed in front of a participant. Nothing renders, nothing is labelled, nothing enters the accessibility tree, and the tab stays visually and semantically disabled. A visible block on frame 01 was rejected as the worst possible placement for a control that can flip the scenario mid-session; a `/profile` screen was rejected as a large change - new route, new screen outside the 32-frame set, a focusable tab - in service of a small need. The tab beat the app bar the Figma node annotates on **coverage** (20 routes to 19, including the three calculator steps the app bar cannot reach) and **blast radius** (the tab is inert; the app bar holds the back control). Built on the measured fact that a disabled button fires `pointerdown` but **not** `click` - load-bearing, since it is what keeps the tab inert to a tap, and the condition under which this must be revisited if `profile` ever joins `NAVIGABLE_TABS`. `user-select: none` added to the shared `.bottom-nav__tab` rule for the gesture's sake, not as a styling tweak; a required maintainer comment at `bottomNavHTML`; `GAPS.md` G23 stays **resolved** with a dated note, its "never linked from any on-screen element" still literally true; and `skip-ahead.js`'s citation of a "facilitator gesture on frame 10" that never existed is corrected. **No copy and no accessible name** - the one prototype affordance in this build that does not carry the "Prototype control" framing, because there is no name to carry it in. Owns no state. Six "typing the URL" records amended in place. `CACHE_VERSION` v45. |
| 28 August 2026 (opening session meets the LISA cap) | **D55 recorded; D45 amended in place.** `STAGE_PROPERTY_VALUE` raised **240,000 to 650,000**, so a session opening in the saving stage (D48) arrives on frame 09 above the Lifetime ISA cap with the warning already rendered. **D45's projection-window property is deliberately given up**, because the two cannot both hold: the window closes at a **275,832** property and the cap starts above **450,000**, with no value in between, and no savings rate bridges it - 822.11 a month would be needed and `monthsToTarget()` rejects it as `exceeds-left-over` against the 380 ceiling, while even at that ceiling the largest property reachable inside 60 months is 358,305. Raising `saved-toward-deposit` to 40,076 would satisfy both and was rejected: 8,950 is the sum of the four mock accounts frames 03, 06 and 32 draw. **Cost:** `months-to-target` 154.8 months, so the tracker's "On track for" row renders its beyond-window variant from the opening session. **Kept:** 8,950 < 48,750, so the tracker still opens locked and both skip-ahead positions still exist. `stage.test.mjs` swaps the window assertion for two that assert the trade - the seed is above the cap, and the beyond-window consequence is explicit - so a later change that silently restored the window fails a test naming D55 rather than looking like a fix. `g62.test.mjs` had one assertion accidentally coupled to the seed and now compares the projection before and after the clear. Frame 09's banner was confirmed to derive live from `property-value` rather than read `lisaCapBreached`. `ROUTES.md` stage table and recipe comparison row updated. `CACHE_VERSION` v46. 264 tests passing. |
| 29 August 2026 (area average sourced and localised) | **D56 recorded.** `AREA_AVERAGE_PROPERTY_VALUE` goes **190,000 to 470,000**, gains `region`, `asAt`, `asAtLabel` and `sourceUrl`, and is sourced to the **UK House Price Index, HM Land Registry and ONS, June 2026**. Frame 09's caption becomes "In London, first-time buyers paid around 470,000 on average in June 2026." with a `.provenance-caption` "Source:" line beneath it. **No calculation moved**: the constant is read at one place in the repo (the caption), the opening property value is `STAGE_PROPERTY_VALUE` (D55), and `model.test.js`'s 190,000 is `build-spec.md` section 4's deposit-target example, a different figure sharing the number. Sentence and attribution are two templates over **one** object, the `bankRateCaptionTemplate` treatment, so they cannot drift. **Plain text, not a link** - no screen in this build renders an anchor, so one here would be the only external affordance in the prototype; the URL lives on the constant as `RATES.sourceUrl` does. Copy-checked: rules 1, 6 and 8 pass, **rule 5 flagged not fixed** (the sentence carries a figure and a date, and the date is what makes the figure checkable). No other frame 09 copy touched. 236 tests passing. `CACHE_VERSION` v47, `BUILD_VERSION` corrected v45 to v47 under D49. |
| 29 August 2026 (seeded salary rounded) | **D57 recorded; D55's reasoning amended in place.** `MOCK_POSITION.moneyIn` goes **2,240 to 2,500** with frame 01's matching salary credit, unit unchanged (**monthly income after tax**; gross annual stays `MOCK_MIP_DATA.annualSalaryBeforeTax` at 38,000). The old figure was not just awkward but **incoherent**: 2,240 net a month is 26,880 a year, which 38,000 gross cannot produce, where 2,500 is about what 38,000 nets after tax and Plan 2. **One derived figure moves**: `left-over` 380 to 640, so frames 05/06's proportions go 83%/17% to 74%/26%. **Nothing in the projection chain moves** - frame 10's ceiling rises but the seeded handles `min(200, c)` and `min(310, c)` were not clamped at 380 and are not at 640, so `savings-rate` stays 255 and `months-to-target`, `checkpoint-amount`, `borrow-low/high` and `max-property` are unchanged. No formula touched. **The side effect is the headline**: G61a's 67% default becomes **39.8%** and G63's 81.6% handle becomes **48.4%**, both now under rule 1A's 60% flag and 80% failure lines, with 310 itself untouched - G63's own named trade taken from the other side. **G64 stays open**: its 331-404 range now sits inside the ceiling, so the defect is unfound rather than fixed, and the gap says so. **Flagged not fixed**: the 0-640 track no longer matches frame 10's 0-380 PNG, a screenshot exemption belonging to whoever owns the reference set, so G63 is left open. D55's "no savings rate reaches one either" is now false (640 a month reaches a 529,848 property) but its decision stands - the stage does not drag the handles. `model.test.js` and `skip-ahead.test.mjs` fixtures deliberately left at 2,240 as self-contained hypotheticals. `CACHE_VERSION` v48, `BUILD_VERSION` v48. |
| 29 August 2026 (frame 01 reads its figures) | **D58 recorded.** `content.js`'s `'/home'` block loses both typed money strings: `balanceAmount: '£1,042.16'` is deleted and `home.js` renders `formatAccountBalance` over `MOCK_ACCOUNTS['current-account'].balance`, and the salary row's `amount: '+£2,500.00'` becomes `amountTemplate: '+{amount}'` filled with `formatTransactionAmount(MOCK_POSITION.moneyIn)`. **Nothing on screen changes.** The reason is D57: the seeded salary existed twice, so rounding it needed a second hand-edit, and a pass that missed the second copy would leave the store at 2,500 and the study's first screen at 2,240 with **no test failing** - the three browser suites measure geometry, not figures. The balance is the same defect one row up and is fixed under the standing correct-everywhere rule; `format.js`'s comment already asserted frames 01 and 03 must show the same balance, which was true only by hand. Third formatter added because neither existing one fits: `formatCurrency` is D9's whole-pound rule and `formatAccountBalance` drops pence on a round number, either of which would draw "£2,500" in a list where every other row shows pence. The other three transaction rows stay literal - no model figure exists behind them. **Audit, not assumption:** all 29 routes walked in a browser on a fresh session, frames 20 and 21 reached through the real MIP flow; **no screen renders £2,240, £380, 83% or 17%**, gross pay is £38,000 on both screens showing it, and £26,880 appears nowhere. Root cause of the reported sighting was **deployment, not code**: commit 8d87578 was never pushed, so `origin/build` and the Vercel build were two commits behind. `CACHE_VERSION` v49, `BUILD_VERSION` v49. |
| 29 August 2026 (G66 widened to seeded figures) | **No decision reversed; G66's SCOPE corrected and `ROUTES.md`'s deploy procedure with it.** Frame 19 was reported as still rendering £2,240 after D57. **It was not a code defect.** `mip-pre-check.js:80` renders `formatCurrency(state['money-in'].value)` with no literal anywhere in the file, no bundler or dist output exists in this repo, and the whole MIP flow was re-audited: **zero hard-coded monetary figures** across frames 17, 18, 19, 19b, 20, 21, the adviser stub and the borrowing sheet - every figure goes through `formatCurrency`/`formatPercent` over a store key or a `MOCK_MIP_DATA` constant. The cause is `state.js`'s `load()`, which returns `{ ...defaultState(), ...JSON.parse(raw) }`: **a stored figure overrides a freshly seeded one**, so a tab holding a pre-change session renders the old figure indefinitely on correct code. `isNewSession()` gates `openSession()`; **nothing gates the figures**, which is the half G66 did not say. Reproduced against v49: stored `money-in` at 2240, two reloads, £2,240 both times; `#/reset` or a new tab returns £2,500. **This symptom is worse than G66's routing one** - a stale figure is fully rendered and internally consistent, so it reads as a bug in the code that just changed and survives both a hard refresh (which clears the HTTP cache and the service worker, not `sessionStorage`) and a `CACHE_VERSION` bump (assets, not state). The version-stamp fix stays rejected for its original reason: it would reset a participant mid-task. `CACHE_VERSION` v50, `BUILD_VERSION` v50. 264 tests passing. |
| 29 August 2026 (stale sessions self-clear) | **D59 recorded; G66 RESOLVED, both halves.** `defaultState()` gains `buildVersion: BUILD_VERSION`, and `load()` **discards a stored session whose stamp is not the running build's** - unstamped included - falling through to `defaultState()` rather than merging over it, warning on the console with both versions, and re-persisting so the discard fires once. A matching stamp restores exactly as before; `persist()` and `setState()` are untouched. **This is not the fix G66 rejected, and the difference is one word:** that one re-applied the opening stage OVER a restored store, and `stagePatch()` writes only `STAGE_KEYS`, leaving a real session's flags beside a fresh goal - the mixed state D46 and `CLAUDE.md`'s state rules exist to prevent. Discarding WHOLE cannot produce it: what returns is a first load. **The routing half closes for free** - `restoredFromStorage` stays false, so `openSession()` applies the opening stage to the fresh store and Insights stops redirecting. **Stamp inside the store, not an envelope around it**, on blast radius: ten call sites across six harnesses touch the stored object and two read it back (`sheet-drag` asserts `state.ltvVideoSeen`, `shots` spreads over a stored session). **All ten harness seeds now stamped** - an unstamped seed is discarded by the check itself, so every browser suite would have silently measured a default session instead of its own. Residual risk kept deliberately: a deploy landing mid-session costs that participant their progress, to a clean opening session. Frame 33's build line (D49) already satisfied the surfacing requirement; verified at v51. `CACHE_VERSION` v51, `BUILD_VERSION` v51. **269 tests passing** (5 new in `scripts/stale-session.test.mjs`). |
| 29 August 2026 (the seeded property becomes relatable) | **D60 recorded; D55 reversed in effect, D45's window still not recovered.** `STAGE_PROPERTY_VALUE` lowered **650,000 to 450,000**, so the case study is one an early-career participant reads as theirs rather than as a comment on the London market. **The Lifetime ISA cap warning is the cost:** 450,000 IS `LISA_CAP_PROPERTY_VALUE` and the comparison is strictly greater-than, so `lisaCapBreached` is false and frame 09b's banner is no longer an opening state - still reachable by typing a higher value, since frame 09 derives it live, but not without typing. Logged as **G70**. **The window is not bought back:** `months-to-target` is 107.6 months, still `beyond-window`, because the window closes at a 275,832 property - so both of the properties D45 and D55 traded between are now given up, on purpose, for a third axis neither was about. **Kept:** 8,950 < 33,750, so the tracker still opens locked and both skip-ahead positions still exist; "Ready to check" is 29.9 months, on track for 27 to 33. Every dependent figure follows through `src/model/` and **not one was edited** - a full grep of all seven written forms of 650,000 and of every figure derived from it found code hits in `src/stage.js` alone. `stage.test.mjs`'s cap assertion rewritten to the new intent as a RELATIONSHIP to the cap constant rather than as `450000`; the beyond-window test kept its assertions and gained a comment. Borrowing against the seeded salary (`MOCK_MIP_DATA.annualSalaryBeforeTax`, 38,000 - not `money-in`, which is monthly after tax) is still implausible at 10.7x - flagged as **G71**, not fixed, because it needs G69's unanswered question settled first. `SPEC.md`, `ROUTES.md` and `GAPS.md` G69's figures updated. `CACHE_VERSION` v52. 93 pure-Node tests passing. |
| 29 August 2026 (step 2's year becomes typeable) | **D61 recorded; G73 raised, open.** The target year on frame 10b is an `<input>` rather than a `<p>`, carrying `.date-stepper__value` plus a modifier that undoes only what a user-agent stylesheet puts on a form control - so frame 10b is **byte-for-byte identical** before and after in both themes and at both text sizes, verified by shooting it rather than by asserting it. The attributes and the two listeners are frame 05's `figureInputHTML` and frame 09's `currencyInputHTML` verbatim: `type="text"` with `inputmode="numeric"` (not `type="number"`), `focus -> select()`, and `change` as the commit. `dateStepperHTML` gains a `yearRole` parameter - pass it and the readout becomes a field, leave it out and the control renders as it always has; the month stays stepped-only, being a closed set of twelve. **The empty case is D46's draft rule, applied to the second typeable field in this build:** `state.js` gains `targetYearCleared`, an empty or unparseable field writes it instead of `targetYear`, the render guards on it before deriving anything, and Continue is disabled with no error banner - which matters here because `savings-rate`, `monthly-low` and `monthly-high` are all SOLVED from this date (D2). Both year chevrons resolve the draft, and `stepMonth()` resolves it on exactly the month rolls that cross a year boundary. `targetYearCleared` is deliberately kept OUT of `STAGE_KEYS`, for the reason `targetYear` is. **Bounds: the existing `errorPastDate` minimum only.** No maximum exists anywhere, the stepper handlers stay unbounded, and none was invented - `maxlength="4"` is a format constraint, not a bound, so five-digit years are unreachable by typing while four-digit ones beyond a plausible range still degrade into a pennies-level figure and frame 12's existing `beyondWindowNote`. Asked before building, logged as **G73**, open. No copy changed - the input reuses `dateStepperYearAriaLabel`. `shots.mjs` gains a `--solve` axis, which is what made frame 10b shootable at all. `stale-session.test.mjs` gains a sixth test: the attribute contract, the typed year across a reload and a back navigation, the empty field writing nothing, and `savings-rate` matching `monthlyAmountFromDate()` asserted against the model rather than a literal. `CACHE_VERSION` v53. 270 tests passing. |
| 29 August 2026 (frame 05 leads with the definition) | **D63 recorded; G78 raised, open.** Frame 05's heading goes `"Here's what we worked out"` to **`"What's left over each month"`** and its body to **"This is roughly what you have left after your usual spending. Anything you save comes out of this. You can change any of it below."**, so the definition of the headline figure arrives in the first line rather than in the provenance caption below the input. **One correction of fact carried in:** the change was requested as "left after their usual spending **and the money they already save**", which the model does not do - `build-spec.md` section 6 defines `left-over` as `money-in - essential-spending` with no saving term, `model.js` computes exactly that, and frame 10 errors when `savings-rate > left-over`, a bound that only holds if saving comes OUT of this figure downstream. Shipping the requested clause would have overstated the deduction by the 200-310 a month frame 10 seeds and failed `fca-copy-check` rule 6A. The wording states the relationship in the same direction the code implements it, and its tense is unscoped on purpose: existing saving and whatever is chosen on frame 10 both come out of the same figure. `figureCaption` shortened **'Left over each month' to 'Each month'**, the heading now saying the long form two elements earlier; `figureAriaLabel` keeps the full label. **Nothing required was touched**: `shared.leftOverCaption`, `enteredCaption`, both error strings, the sources and assumptions routes and `guidanceNotAdvice` are all unchanged, and "roughly" strengthens the estimate framing on a figure modelled from 12 months of activity. Copy-checked over `/position`, all nine rules: **0 fixed, 1 flagged** (`report-issue` unbound, pre-existing and already recorded at `ui.js:1207`). **G78 raised**: dropping "This all comes from your accounts" leaves the provenance caption as the first sourcing statement, and it renders below the figure - recorded for observation in the first session, not fixed. `CACHE_VERSION` v56, `BUILD_VERSION` v56. |
| 29 August 2026 (frame 03 drops "earmark") | **D64 recorded.** `'/consent'.accountCaptions.stocksIsaCaption` goes "Some people **earmark** this for a home, some don't." to **"Some people are saving this towards a home, some aren't."** One string, one screen - a whole-repo grep for "earmark" returned exactly one hit, so there was no second copy to correct under the correct-everywhere rule. **The longer of two candidate replacements was taken** because the row is not tight: the Lifetime ISA caption directly beneath it is 100 characters in the same slot against this one's 72, and the shorter candidate ("Is any of this for your home?") would have bought nothing the layout needed. Verified rendered at large text, where it wraps to two lines and nothing truncates. **Not changed, and noted:** the string uses "towards" as specified, where the rest of the build uses "toward" - including two strings on this same screen. Both are British English; the inconsistency is flagged rather than silently resolved. A jargon scan over all 615 user-facing strings was run alongside and is reported separately: no `allocate`, `contribute`, `deploy`, `ring-fence`, `disposable`, `principal`, `equity`, `vehicle` or `instrument` anywhere, and the literal `LTV` never reaches the screen. `CACHE_VERSION` v57, `BUILD_VERSION` v57. 270 tests passing. |
| 29 August 2026 (AER leaves the screen, and five terms with it) | **D65 recorded; G79 raised, open by decision.** `fca-copy-check` rule 5's acronym rule was breached on three screens: frames 12, 29 and 30 used **AER** with no expansion on them, the gloss (`shared.bankRateCaptionTemplate`) rendering only on 08, 10, 11 and 32. **Remedy chosen was removal, not explanation** - all three become "a year", so the acronym is gone rather than glossed a fourth time, and `bankRateCaptionTemplate` and the four screens carrying it are untouched. Rate basis verified per screen: same `RATES.bankRate`, same annual period, source attribution kept verbatim on 29 and 30. **Stated rather than glossed over:** AER also encodes compounding, and only frame 29 keeps that - its "compounds monthly" becomes "each month you earn interest on the interest already added", so 29 says MORE than before, while 12 and 30 lose the implied signal. 12 recovers it through 29, one tap away; 30 does not, and a one-clause fix was offered and not taken because the brief specified the "a year" remedy and nothing more. Five further plain-wording swaps applied, all single-clause and none regulatory: "product fees", "provider", "conveyancing", "net of it" and frame 19's bare "A soft search only". **Two could not be applied literally** - the conveyancing row read "Solicitor **and conveyancing** fees" so a word swap produced nonsense, and the student-loan clause substituted directly would have repeated the noun and attached "which" to the wrong referent; both rewritten whole, with rule 6A's double-counting point preserved exactly. Frame 03's "towards" reverted to "toward" for consistency with two strings on its own screen. Copy-checked over all six routes: **3 fixed, 1 flagged** (`report-issue`, pre-existing). Six terms deliberately NOT changed and recorded as **G79**, with the rejected alternative beside each. `CACHE_VERSION` v58, `BUILD_VERSION` v58. 270 tests passing. |
| 29 August 2026 (regulatory lines stay identical) | **D66 recorded.** A copy-variation pass asked that repeated wording be varied screen to screen so the same meaning is met differently each time. Applied to the twelve genuinely duplicated explanatory clusters (**D67**); **refused for the nine shared keys**, and refused as a position rather than only as a constraint. **Architecturally** these are not duplicated strings but ONE key rendered on many render sites - `guidanceNotAdvice` on 23 screens, `mcob3aRepossessionWarning` on 7 - so "varying" them means splitting one key into N, which is the shape **D34** removed after three captions had drifted into being wrong rather than merely different: the savings rate naming two incompatible origins, essential spending described three ways including an averaging window nothing in the code performs, and frame 12 using one key for two derivations. That drift happened at two to four copies; the guidance line has 23. **For research**, identical wording lets a participant recognise a recurring line as the standard note and move past it, where varied wording obliges them to work out whether the MEANING changed - a new comprehension task, not a removed one, falling hardest on the lower-literacy participants the variation was meant to serve, and sitting badly with the Consumer Duty consumer understanding outcome. `CLAUDE.md`'s fixed-wording rule and `fca-copy-check` rule 9 both point the same way on A1-A4, rule 9 on process grounds: that object holds CHECKED wording, and rewriting it returns 36 regulatory strings to an unchecked state. **The position is about which copy, not about repetition as such** - twelve explanatory clusters were varied the same day. No code or copy changed by this entry. |
| 29 August 2026 (twelve duplicated clusters varied) | **D67 recorded.** The counterpart to **D66**: where that entry refuses to vary the nine shared keys, this one varies the twelve clusters that are genuinely duplicated - separate keys holding byte-identical wording. 18 string values across frames 06, 08, 11, 12, 13, 13b, 15/16, 18, 21, 29, 30 and 32. **Detection was mechanical, not by eye**: all 615 string leaves flattened and clustered by token-set overlap, which found 29 candidate clusters and, critically, CANNOT see a shared key (one leaf, many render sites) - the distinction D66 turns on. **One inventory error corrected on the way**: `howWeWorkedIntro` was filed as three keys on three screens, but frames 20 and 21 read frame 06's, so it is three keys across FIVE render sites and 06's is itself shared; 06's was therefore left alone and only 12 and 13 varied. **Where a third instance already varied** (frames 31 and 19 on four clusters) the existing variant was read first and the new wording pitched as a third distinct phrasing rather than converging on either. **B8's five phrasings were read as a set**, being the cluster most able to drift: all five name the same frame 03 assignment through four verbs, none names a different account set, none adds a window or averaging claim, and none shifts the `read` provenance sense. B2, B5 and B12 carry regulatory or scope content and were checked element by element; none required softening, so none was left identical on those grounds. **Recorded as a limit on the value**: frames 20 and 21 are mutually exclusive (`mip-running.js` replaces the hash with one), so B2, B10, B11 and B12 vary copy no single participant can compare. Copy-checked over all twelve routes: **0 fixed, 1 flagged** (`report-issue`, pre-existing). `CACHE_VERSION` v59, `BUILD_VERSION` v59. 270 tests passing. |
| 30 August 2026 (the tracker's "On track for" row) | **D68 recorded; G80 and G81 raised, both open.** The row rendered an **em dash** on every opening session, under a caption claiming a derivation, with no note anywhere saying why. Four changes, smallest first. **(1)** `onTrackFor()` propagated `beyond-window` through `fail()` and DISCARDED the months figure `monthsToTarget()` returns alongside it on purpose; it now carries the range through `fail`'s third parameter, the way `leftOver`'s `exceeds-money-in` already did. The other three error codes come back with a null value, so they are untouched. **(2)** The tracker renders **"More than 5 years"** rather than a dash, matching frame 12's threshold language so the two agree on one session. **Deliberately not the date range** the model can now supply: 60 months is where the projection stops being shown, so "August 2034 to June 2036" would be more precise than the window allows and would contradict frame 12. **(3)** `statRowHTML` guards its caption, so an absent figure no longer carries a provenance claim. **(4)** New `onTrackBeyondWindowNote`, frame 12's note rewritten for a screen with no chart - its second clause explains the missing DATE rather than the chart's limit, and "at what you're putting aside now" replaces "at your current rate" because a rates card sits just above it. **One test updated, not weakened**: `stage.test.mjs` asserted null was the correct stored value here, which D68 reverses; the projection-window COST it exists to assert is untouched and now also asserts the whole range sits past the window. **Reachability corrected**: the tracker redirects unless `deposit-target` and `checkpoint-amount` are set, so the two `setting-up` dash rows were never reachable on this screen and beyond-window was the only dash a participant could meet. Copy check on the new strings: **0 issues**. `CACHE_VERSION` v60, `BUILD_VERSION` v60. 270 tests passing. |
| 30 August 2026 (D68 change 2 reversed) | **D68 amended, not replaced.** The tracker's beyond-window row renders **the date range** ("August 2034 to June 2036" at the seed) rather than the threshold string "More than 5 years" that D68 shipped hours earlier. **The reason is a value judgement, and it went the other way on second look:** the model had computed a figure and the screen was declining to show it, which is withholding rather than protecting - a participant reading "More than 5 years" cannot tell whether the app does not know or will not say. Transparency preferred over withholding a computed figure; the original reasoning is kept in the entry rather than overwritten, because the trade is the useful part. `onTrackBeyondWindowValue` deleted; the render branch SIMPLIFIED to `onTrack.value ? range : dash`, so the value decides rather than the error code, and the caption guard follows the value. The note stays and its job changed - it used to explain a missing date, it now qualifies a present one: **"These dates are an estimate based on what you're putting aside now. They move if that changes."**, echoing `estimateDisclosure`'s framing rather than inventing a second phrasing. **Frame 12 reported and NOT changed**: neither clause of its `beyondWindowNote` becomes false, so nothing contradicts, but the disclosure is now asymmetric - it declines to name a date the tracker names. **Reported, not fixed:** the tracker renders a projected figure and carries no `estimateDisclosure`, a pre-existing `fca-copy-check` rule 2 breach that this change makes more consequential, and the month-precise endpoints of a 22-month band overstate what a 10% spread on a nine-year projection warrants. Logged as **G82**. `CACHE_VERSION` v61, `BUILD_VERSION` v61. 270 tests passing. |
| 30 August 2026 (frame 03's prompt caption) | **D69 recorded.** `stocksIsaCaption` ("...Tap to tell us.") rendered whatever group its account was in, so once a participant had filed the Stocks and shares ISA it went on inviting an action they had just taken. Cause: `captionKey` is a STATIC property of the account in `accounts.js`, read unconditionally by `accountRow`, so nothing tied the caption to the state it describes. Fixed with a per-account `captionWhileUnsorted` flag gating on `account.group === 'unassigned'`. **A flag, NOT a blanket rule, and that is the whole judgement**: the screen's other three captions are the opposite kind of string - `lifetimeIsaCaption` explains why an account IS counted, `emergencyFundCaption` and `currentAccountCaption` say what a pot is for - and none of their accounts is ever unassigned, so gating every caption on "unsorted" would have deleted all three outright. The prompt pattern has exactly one instance. **Item 5 answered**: the "Not sorted yet" header, its "We can't tell what this is for" subtitle and the "Sort this out" button were ALREADY governed together by `groupSection`'s empty-group return and its `group === 'unassigned'` test; the caption was the one piece outside that condition, and is now inside it. Verified by shot: all three present together unsorted, all three gone together once filed, in both themes at both text sizes. **Suppression is state-derived, not a one-way flag**, so the caption returns if the account ever returns to `unassigned` - which no control can do today (frame 03b offers only the three filed groups; unticking clears `included` and leaves the filing alone). **No layout risk**: `.account-row` keeps `min-height: 64px` and its own `border-bottom`, `.account-row-wrap` uses `gap` so nothing is left behind, and four accounts already render caption-free. `shots.mjs` gained `--assign`, without which frame 03's filed states are unshootable. `CACHE_VERSION` v62, `BUILD_VERSION` v62. 270 tests passing. |

---

## D62. Step 3 of 3's figures are fields, and every bound it enforces already existed

**Date.** 29 August 2026.

**Decision.** Frame 11's four editable rows - property value, deposit %age, saved so far and the
monthly saving range - no longer navigate, and no longer carry a control of any kind. The five
figures a participant may change are rendered as fields, permanently, using frame 05's inline-edit
pattern. The savings interest rate and tax rate rows are unchanged and carry no field, because a row
is either editable or explanatory, never both.

**Why.** These are moderated think-aloud sessions. Every correction to a single number cost the
participant a screen change, a screen change back, and their train of thought about the figure they
were checking. The navigation was measuring the prototype's routing rather than the thing under test.

**Why no control, not even a reveal.** An intermediate version renamed the link "Change" to "Edit"
and had it open the row's field on tap. That was discarded: a control whose only job is to reveal a
field is a step between the participant and the correction, and on a screen headed "Check these
before we work it out" the figures that can be checked are exactly the figures that can be changed.
Making them fields says so without a label. It is also frame 05's arrangement, where the figure has
always been a field with no control to reveal it.

**Each field is frame 05's `figureInputHTML` at the row's own type scale.** Structure and mechanics
are carried over exactly: the £ or % is a sibling `<span>` with `aria-hidden`, outside the input, so
it cannot be selected or typed over; `type="text"` with `inputmode="numeric"` rather than
`type="number"`, for the reasons already recorded on the frame 10b year field; width set inline from
the digit count; `focus` selects the whole value; `change`, never `input`, is the commit.

**The field hugs its text, and 1px of padding is why it still passes 2.5.8.** `min-height:
var(--touch-target-min)` is dropped - the same departure `.date-stepper__value--input` already makes,
and for the same reason: 44px on a readout inside a row inflates the row well past the value it
holds. Measured in Chromium at 390px, the field is a 22px line box at the default text size and
25.3px at large. Stripped of all padding that is 23px and 26.3px once the 1px bottom rule is counted,
so **the default text size falls 1px short of WCAG 2.5.8's 24px minimum**. `padding: 1px 0` takes it
to 25px and 28.3px, the smallest value clearing the minimum at both sizes. 2.5.8's "inline" exception
does not rescue the stripped version: these are standalone controls in a row, not targets inside a
sentence. `.review-row`'s own 44px min-height is untouched, so the row remains a full touch target
regardless.

**The `aria-label` is now each field's only accessible name.** `.review-row__label` is a sibling
paragraph, not a `<label>`, so it is not programmatically associated with the input, and with the
"Edit" control gone there is nothing else on the row supplying a name. All five fields carry one, all
five are distinct, and `reviewRowHTML` documents the requirement for any future caller.

### The captions

Two of the three go, and the reasoning is D5's own rather than an exception to it - see the
refinement recorded under D5.

- **Property value** and **monthly saving** lose theirs. "You entered this" and "The range you set"
  sat under fields holding what the participant entered, so they restated the control.
- **D47's problem goes with them.** That decision existed because frame 10 commits the monthly range
  whether or not a handle was moved, so "The range you set" was told to participants who set nothing,
  and the row picked between two captions by provenance to avoid it. With no caption there is no line
  that can make the claim, and both keys are removed from `content.js`.
- **Saved so far keeps its caption**, and is the reason the other two could lose theirs. It is the
  only figure on the screen the participant did not type, so it is the only one where provenance
  carries information rather than restating the control - and the only one where a typed figure and
  an account-derived one would otherwise be indistinguishable. A typed edit switches it to "You
  entered this"; when the assigned accounts next recompute, the figure and its original caption
  return together. Neither string is new.
- **The two explanatory rows are untouched.** Their captions state where a figure the participant
  never touched came from, which is the case the caption exists for, and the Bank Rate attribution is
  required by the FCA traceability rule as well as by D5.

### The bounds

**None of them is new, and that is the point.**

- **Property value** reuses `depositTarget()`'s own rejection and frame 09's `errorNonNumeric`, read
  from that screen's content block rather than copied into this one.
- **Deposit %age** is typed as a whole percent between 5 and 25. **These are the chip set's own ends,
  made explicit, not a new rule.** Frame 09 offers `DEPOSIT_PCT_OPTIONS` and nothing else, so its
  first and last members are what a typed percentage may hold; the screen reads them off the array
  (`Math.min(...)` / `Math.max(...)`) rather than writing 5 and 25 as literals, so the two controls
  cannot come to disagree if the option set is ever changed. The one new string, `errorDepositPct`,
  keeps `errorNonNumeric`'s two-part shape but describes RANGE rather than FORMAT, because 40 is a
  well-formed percentage and wrong only because the chip set does not offer it.
- **Monthly saving** reuses frame 10's left-over ceiling and its `errorExceedsLeftOver`. Low
  exceeding high **clamps**, using frame 10's identical expressions, rather than raising an error:
  the owning screen has never raised one for this case, so raising one here would have been a new
  error pattern and a second behaviour for the same edit. See GAPS.md G74.
- **Saved so far** has no bound, because none exists anywhere in this build to reuse. See GAPS.md G76.

**Empty is a draft on all five fields,** which is D46 and GAPS.md G62 applied to four more of them.
The property value reuses frame 09's own `propertyValueCleared` rather than adding a twin that could
disagree with it; the other three keys sit beside it in `state.js`. A draft leaves the committed
figure standing and disables "See what this means" without raising an error, exactly as an empty
property value does on frame 09 and an empty year on 10b. With every row a field, that guard is the
only thing standing between a cleared row and `formatCurrency(null)` rendering £0 on frames 12, 15
and 16.

### What an edit writes

Frame 09's split, with one difference forced by this screen's back button. The `change` handler
commits the base figure; `deposit-target`, `loan-amount`, `ltv` and `lisaCapBreached` are recomputed
beside it rather than being left to Continue. Frame 09 can leave its recompute to Continue because
Continue is the only way off that screen. Frame 11 has a back button to frame 10, so a
`property-value` committed here without its `deposit-target` would leave frame 10 measuring against a
target the participant had already replaced - the D38 and D46 disagreement arriving by a third route.
The recompute is guarded on the row being valid, so an out-of-range percentage writes its own base
figure and stops there.

Editing the monthly range commits the midpoint to `savings-rate`, as frame 10's Continue does, and
sets `solveFor: 'date'`. **That value is not a guess:** frame 10 calls the slider variant - the one
where a monthly amount is entered and the date is solved - `solveFor: 'date'`, so an edit here puts
the calculator in the same mode as typing an amount on frame 10. `targetMonth` and `targetYear` are
left standing, which is also what frame 10's own segmented control does, so a previously set target
date is not destroyed; it stops being what the result is built from, which is the point of the edit.

**To reverse.** The four draft keys beside `propertyValueCleared` in `src/state.js`, the `fields`
branch in `reviewRowHTML`, its CSS block in `components.css`, and the bindings in
`src/screens/calculator-review.js`. Restoring the navigation means putting a `changeLabel` back on
the component and re-pointing four actions at frames 09, 06 and 10; no route was removed, so all four
destinations are still live.

---

## D63. Frame 05 says what the figure is before it says the figure

**Date.** 29 August 2026.

**Decision.** Frame 05's heading names the figure and its body defines it. The heading goes
`"Here's what we worked out"` to `"What's left over each month"`, and the body goes `'This all comes
from your accounts. Change anything that looks wrong.'` to `'This is roughly what you have left after
your usual spending. Anything you save comes out of this. You can change any of it below.'`
`figureCaption` shortens from `'Left over each month'` to `'Each month'`. Three strings in
`content.js`. No screen module, no component, no CSS.

**Why.** Participants were not learning quickly enough what the headline number was. The old heading
named no figure at all - "what we worked out" describes an activity, not a quantity - and the only
definition on the screen was the provenance caption, which renders BELOW the input. A participant
therefore met the number before meeting anything that said what it was, and the think-aloud recorded
them working it out from the breakdown they had to open.

### The clause that was corrected, and why it had to be

The change was requested with the definition given as "the money left over after their usual spending
**and the money they already save**". The second half is not true of this figure, and three places in
the repo say so independently:

- `build-spec.md` section 6: `left-over | money-in - essential-spending`. No saving term.
- `src/model/model.js`: `const value = moneyIn.value - essentialSpending.value;`
- `build-spec.md` section 2: frame 10 errors when `savings-rate > left-over`. A bound that only makes
  sense if the saving is taken OUT of this figure. If it had already been taken off, the seeded
  200-310 a month would be constrained against a figure it had itself produced.

So the requested wording would have told a participant that 640 was already net of the 200-310 they
put aside, understating what they have to work with by up to half. That is `fca-copy-check` rule 6A -
a modelled figure presented as something the model does not compute - and it is the specific defect
`CLAUDE.md` means by "never invent a rule".

**The shipped sentence states the same relationship in the direction the code implements it.**
"Anything you save comes out of this" says the deduction happens downstream, which is what frame 10
then does. **Its tense is unscoped deliberately**: what they already put aside and whatever they
choose on frame 10 both come out of the same 640, and a version scoped to existing saving alone
would have been narrower than the truth.

**"Roughly" is not padding.** `left-over` is modelled from 12 months of activity and was previously
stated flat. The word clears a latent rule 6A item rather than hedging a known quantity.

### What was shortened, and what was not

`figureCaption` was the only repetition the new heading created: with the heading reading "What's
left over each month", a caption reading "Left over each month" two elements later did no new work.
It was shortened rather than deleted, because it is the field's visible label and an empty
`.figure-input__caption` would leave the element rendering nothing. `figureAriaLabel` keeps
`'Left over each month, editable'`, so what a screen reader announces is unchanged.

`'This all comes from your accounts'` went, and it was the screen's first sourcing statement. That is
a real loss and it is recorded as **G78**, open, for observation in the first session rather than
resolved. It was accepted because the caption that replaced it as the first sourcing statement is the
MORE specific of the two - "Worked out from your salary and your regular spending" against "your
accounts" - and because restoring it means a fourth sentence, which undoes the change this decision
was made for.

**Nothing required was touched.** `shared.leftOverCaption` still renders directly under the figure
and still switches to `enteredCaption` on a typed edit, which is D5 as refined by D62. Both error
strings, the disclosure and its breakdown, `'Where these figures come from'` to frame 32, the
assumptions route to frame 29, the flag row and `shared.regulatory.guidanceNotAdvice` are unchanged.

### Copy check

Run over `/position` against all nine rules. **0 fixed, 1 flagged.** The flag is the flag row's
`report-issue` action, which nothing binds - pre-existing, already recorded at `src/components/ui.js`
as the standing counter-example, and not introduced here. Rule 8 read against D5-as-refined and G77:
the caption is correctly present, because the figure does not originate with the participant until
they type over it.

**To reverse.** Three string values in `content.js`'s `'/position'` block: `headline`, `body` and
`figureCaption`. Nothing else changed, so restoring them restores the screen exactly.

---

## D64. "earmark" leaves frame 03, and the longer replacement is the one that fits

**Date.** 29 August 2026.

**Decision.** `'/consent'.accountCaptions.stocksIsaCaption` becomes `"Some people are saving this
towards a home, some aren't. Tap to tell us."` One string in `src/content.js`. Nothing else.

**Why.** "Earmark" is a verb a participant has to stop and decode, and frame 03 is the one screen
where the entire task is deciding what an account is FOR. A word that slows down the reading of the
question slows down the task the screen exists to measure.

**Why the longer of the two candidates.** A shorter alternative was available and was not needed. The
row is not tight: `lifetimeIsaCaption` renders in the same slot at 100 characters against this
string's 72, so the 8 characters the replacement adds over the original are absorbed with room to
spare. Confirmed by rendering frame 03 at the large text size, where the caption wraps to two lines
and nothing truncates or overflows. The shorter candidate would have traded away the "some people do,
some don't" framing - which is what tells the participant there is no right answer here - to solve a
layout problem the screen does not have.

**One hit, not several.** A grep for "earmark" across the whole repository, `node_modules` and `.git`
excluded, returned exactly one line. So the correct-everywhere rule had nothing further to reach:
there was no second copy on another screen, and none in the docs or the reference set.

**Flagged, not fixed.** The replacement uses "towards"; the rest of the build uses "toward",
including `accountSelectLabelTemplate` and the `deposit` group header on this same screen. Both are
British English, so neither is wrong, but the two now sit a few rows apart. The wording was specified
and has been applied as given rather than silently altered; resolving the inconsistency is a
one-word change either way.

**To reverse.** One string value in `content.js`.

---

## D65. The acronym goes, rather than getting a fourth explanation

**Date.** 29 August 2026.

**Decision.** Frames 12, 29 and 30 stop using "AER" and say "a year" instead. Frame 29 additionally
replaces "compounds monthly" with "each month you earn interest on the interest already added". Five
further terms are replaced in ordinary explanatory rows, and frame 03's "towards" becomes "toward".
Ten string values in `src/content.js`. No screen module, no component, no CSS, no figure.

**Why removal rather than a gloss.** `fca-copy-check` rule 5 asks that an acronym be written out
before use. The build already carried the expansion in `shared.bankRateCaptionTemplate` ("AER means
Annual Equivalent Rate"), but that string renders on frames 08, 10, 11 and 32 only, so three screens
used the acronym cold. The obvious repair was to render the gloss on those three too. It was not
taken. A gloss satisfies the rule by adding a second sentence a participant must read and hold; "a
year" satisfies it by removing the thing that needed explaining. On a screen being used to measure
whether people can follow their own figures, the shorter road is the point.

**What this deliberately does not touch.** `shared.bankRateCaptionTemplate` and the three
`savingsInterestSuffix` keys on 08, 10 and 32 are unchanged. Those screens render the suffix and its
expansion together, which is the pattern rule 5 asks for, and breaking it up would have traded a
compliant screen for a consistent vocabulary.

### The nuance that is lost, named rather than buried

AER is not only "annual". It is the rate once compounding is counted, and "a year" does not carry
that. The three screens land differently and it is worth being exact about which:

- **Frame 29 gains.** Compounding is now stated in words instead of encoded in three letters. This
  screen says more after the change than before it.
- **Frame 12 loses the signal, and recovers it.** The caption is a chart footnote; the working is on
  frame 29, which the screen already links.
- **Frame 30 loses it outright.** Rate, period and source survive, so the rate BASIS is unchanged,
  but nothing on that sheet now says interest builds on interest.

A one-clause fix for 30 exists ("with interest building up each month") and was offered rather than
applied, because the brief specified the "a year" remedy and adding to it would have been scope taken
rather than given. If frame 30's omission matters, that clause is the fix.

### Two swaps that could not be made literally

Both are recorded because a later reader comparing the brief to the diff will otherwise see a
deviation and not know it was forced.

- **"Solicitor and conveyancing fees."** The row named the same thing twice, so substituting the one
  word produced "Solicitor and solicitor fees for the legal work of buying fees". The row was
  replaced whole. Nothing is lost: conveyancing IS the legal work a solicitor does on a purchase.
- **"…which is already net of it."** Substituting the clause gave "…separately from the income
  figure, which has already been taken off the income figure" - the noun twice, and "which" bound to
  the income figure when the thing taken off is the loan. Split into two sentences instead. This line
  is the one rule 6A has a clause written specifically for (Plan 2 repayments leave through payroll,
  so subtracting again double-counts), so its meaning had to survive intact, and it does: the lender
  counts the loan separately, and it is already off the income figure.

**What was left alone, on purpose.** Six terms were found and not changed: the ISA account names,
"valuation", "repayment mortgage", "affordability model", and - found during this pass rather than
the one before it - "underwriting" and "indicative", both of which sit inside required risk warnings.
Each is recorded in **G79** with the alternative that was considered, so the position is on record
rather than waiting to be rediscovered.

**To reverse.** Ten string values in `content.js`. No other file carries any of them.

---

## D66. The regulatory lines stay word for word the same, and that is a design position

**Date.** 29 August 2026.

**Decision.** The nine shared keys are not varied screen to screen. They stay as one key with one
wording, rendered wherever the rule requires them. Nothing in this entry changes code or copy; it
records a refusal and the reasoning behind it, because the refusal is the interesting part.

| Key | Render sites |
|---|---|
| `shared.regulatory.guidanceNotAdvice` | 23 screens |
| `shared.regulatory.mcob3aRepossessionWarning` | 7 |
| `shared.regulatory.estimateDisclosure` | 3 |
| `shared.regulatory.adviserScope` | 3 |
| `shared.mipAgreementNotOffer` | 3 |
| `shared.dataSource` | 2 |
| `shared.essentialSpendingCaption` | 3 |
| `shared.leftOverCaption` | 3 |
| `shared.bankRateCaptionTemplate` | 4 |

**The request this answers.** A copy pass asked that repeated wording be varied, so the same meaning
arrives differently each time and the feature works for participants across a range of financial
literacy. That is a good instinct and it was acted on: twelve clusters of genuinely duplicated
explanatory copy were rewritten the same day (D67). This entry is about the copy where the instinct
does not hold, and why the line falls where it does.

### The architectural argument

These are not repeated strings. They are one string with many render sites. "Varying" the guidance
line does not mean rewriting a sentence; it means splitting one key into twenty-three, each free to
move independently from then on.

**D34 is the record of what that costs, and it is not hypothetical.** That pass found three shared
figures whose captions had been written per screen, and the finding was not that they had merely
diverged in style:

- The savings interest rate was captioned "Read from your instant saver" on four screens while the
  value was `RATES.bankRate`, a dated constant. The app stated two incompatible origins for one
  figure.
- Essential spending was described three ways, and frame 32 - the screen a participant opens
  specifically to settle where a figure came from - named a different set of sources and an averaging
  window that nothing in the code performs.
- Frame 12 used one caption key across two different derivations, so the string was true under one
  figure and false under the other.

A caption naming the wrong source is a false statement about a participant's own money, and it is
believed. That drift arose across two to four copies, maintained by people who knew the codebase. The
guidance line has twenty-three render sites. The proposal is to do deliberately, at ten times the
scale, the thing that produced those three defects by accident.

### The research argument

The stronger reason is about the participant, not the repository.

A recurring regulatory line is not read afresh each time. A participant meets it on frame 05, works
out what it is, and on frames 06, 08 and 09 recognises it as the same note and moves past it.
Recognition is cheap. It is what lets someone give their attention to the figure the screen is
actually about.

Varied wording removes that. Four differently-worded guidance lines across four screens present the
participant with a question they did not have before: **has the meaning changed, or only the words?**
Answering it means reading the new line closely, holding the old one in mind, and comparing. That is
a comprehension task added, not a comprehension task removed - and it is added precisely where the
copy pass was trying to help, because deciding whether two differently-worded legal statements say
the same thing is harder for a participant with lower financial literacy than reading either one.

This is also the better reading of the Consumer Duty consumer understanding outcome. That outcome
asks whether a communication actually equips someone to understand and act, not whether it avoids
looking repetitive. A line a participant can recognise and set aside supports understanding. A line
that shifts under them each time invites the suspicion that something has quietly changed, which is
the opposite of the confidence the outcome is asking for.

**Stated as a position rather than a constraint:** in an instrument measuring comprehension, the
consistency of a recurring regulatory statement is a property worth protecting, not boilerplate to be
disguised. Sameness is what makes it recognisable, and recognisable is what makes it cheap to read.

### Where the rules already said so

Two existing records point the same way for `shared.regulatory` specifically, and neither is the
reason for this decision so much as a confirmation of it.

- **`CLAUDE.md`'s fixed-wording rule**: those lines "are fixed wording. Do not reword, shorten or
  remove them, or remove them from a screen that carries them."
- **`fca-copy-check` rule 9**, on process rather than wording: that object holds copy that has been
  through check, and wording that has not is deliberately held apart from it. Rewriting the four
  lines into thirty-six per-screen variants returns every one of them to an unchecked state, and a
  required line resolved from unchecked wording does not satisfy the rule that required it.

### The boundary this draws

Not "repetition is fine". Twelve explanatory clusters were varied the same day, including copy on
frames 29 and 30 that had been byte-identical. The distinction is what the copy is doing:

- **Explanatory copy** tells a participant something about their own figures. Meeting it twice in
  identical words reads as boilerplate and gets skipped. Vary it.
- **A recurring regulatory statement** is a fixed point a participant learns to recognise. Its value
  is that it does not move. Leave it.

**To reverse.** Nothing to reverse; no code changed. Reversing the position means splitting the keys
in `content.js`'s `shared` block per render site, and, for A1 to A4, overriding `CLAUDE.md` and
re-running copy check across every screen that carries them.

---

## D67. The duplicated explanatory copy is varied, which is the other half of D66

**Date.** 29 August 2026.

**Decision.** Twelve clusters of byte-identical explanatory copy are rewritten so each instance is
worded differently. 18 string values in `src/content.js`, across frames 06, 08, 11, 12, 13, 13b,
15/16, 18, 21, 29, 30 and 32. No screen module, no component, no figure, no derivation.

**Read this with D66.** The two entries answer the same request and split it. D66 refuses the nine
shared keys and says why. This one takes everything else. The boundary is what the copy does: a
recurring regulatory statement is a fixed point a participant learns to recognise, and explanatory
copy met twice in identical words reads as boilerplate and gets skipped.

### The clusters were found mechanically, and that mattered

All 615 string leaves in `content.js` were flattened and clustered by token-set overlap on the 308
strings of five words or more. That found 29 candidate clusters.

**The method's blind spot is the important part.** A single key rendered on twenty-three screens is
ONE leaf, so the detector cannot see it at all. Those had to be traced by call site instead - and
they turned out to be the largest category by render count and the one that must not be touched.
A pass done by eye, reading the rendered journey, would have found the repetition and had no way to
tell the two kinds apart.

**One inventory error this exposed.** `howWeWorkedIntro` was first recorded as three keys on three
screens. Frames 20 and 21 do not have their own: they read frame 06's, through
`summaryContent.howWeWorkedIntro`. So it is three keys across five render sites, and 06's key is
itself shared. Frame 06's was left unchanged for that reason and only 12 and 13 varied, giving three
distinct phrasings across the five sites.

### Where a variant already existed

Four clusters (B3, B4, B7, B8) already had a third instance worded differently, on frames 31 and 19.
In each case the existing variant was read first and the new wording pitched as a third distinct
phrasing rather than converging on either. Frame 31 keeps "illustrative" and its not-an-offer clause;
frames 29 and 30 drop the word in two different directions.

**B8 was read as a set of five rather than one at a time**, being the cluster most able to drift in
meaning. All five name the same act - the frame 03 assignment - through four verbs ("assigned",
"chose", "picked", "said are for"). None names a different set of accounts, none adds a window or an
averaging claim of the kind D34 found, and none shifts the provenance sense away from `read`
(`state.js`). Two of the five additionally assert the figure is a total, which is true and which the
other three neither state nor contradict.

### The three carrying regulatory or scope content

B2 (the automated-decision note), B5 (the rate caution) and B12 (the adviser route) were checked
element by element against their originals. Every element survives in each: automated processing plus
the right to disagree plus the right to human review; market-ranges-not-our-offer plus the lender's
checks plus the participant's circumstances; the route in plus the mortgage adviser plus the timing.
None required an element to be dropped or softened, so none was left identical on those grounds.

B5 is worth naming: on the tracker it renders through `riskWarningHTML()`, a risk-warning slot rather
than body copy, which is why the element check was done before the wording was chosen and not after.

### A limit on what this buys, recorded rather than glossed

Frames 20 and 21 are mutually exclusive - `mip-running.js` replaces the hash with one or the other -
so no participant sees both in a run. Four of the twelve clusters (B2, B10, B11, B12) therefore vary
copy that nobody in a session can compare. The variation is real in the source and invisible in the
study, except where a moderator flips the outcome on frame 33. It was applied as asked, and the
limitation is written here so it is not later mistaken for an effect.

**To reverse.** 18 string values in `content.js`. The keys are listed by frame in the commit.

---

## D68. The tracker's "On track for" row says what it knows, instead of an em dash

**Date.** 30 August 2026.

**Decision.** Four changes, in increasing scope: `onTrackFor()` keeps the value it was discarding;
the tracker renders "More than 5 years" instead of a dash; `statRowHTML` stops emitting a caption
when there is no figure; and the tracker gains a beyond-window note of its own.

**The state being fixed.** At the opening session the seeded goal is 107.6 months away, past the
60-month window, so `monthsToTarget()` returns `beyond-window`. The row rendered `—`, and underneath
it, unconditionally, "Worked out from what you're putting aside each month". A caption naming a
derivation and its input, over a figure that is not there. Nothing on the screen said why, where
frame 12 in the same state renders an explanatory banner.

### 1. The value existed and was being thrown away

`monthsToTarget()` does not fail on beyond-window. It returns `{ value: months, provenance, error }`
- the months figure alongside the error - because the projection succeeded, it just landed past the
window. `onTrackFor()` then did `if (months.error) return fail(...)` for all four cases, which
replaced that value with null.

So the screen had no figure to render, not because none could be computed, but because the wrapper
discarded it one line after it arrived. Beyond-window now derives its range and returns it through
`fail()`'s third parameter - which exists for exactly this, and which `leftOver()`'s
`exceeds-money-in` branch already uses the same way, keeping the typed value so the screen can show
what the participant typed while they correct it.

`non-numeric`, `unreachable` and `exceeds-left-over` all come back from `monthsToTarget()` with a
null value. There is nothing to propagate, so they are unchanged.

### 2. A threshold, not a date

The row shows **"More than 5 years"**, which is the language frame 12 already uses, so the two
screens say the same thing about the same session.

**The date range is deliberately not rendered, although the model can now supply it.** It would be
"August 2034 to June 2036". Sixty months is the point at which this build stops showing a projection
at all, so quoting a month-and-year pair ten years out would state a precision the window exists to
deny, and would contradict frame 12, which says only "more than 5 years" for the identical figure.
The value is propagated so the row can make a threshold statement, not so it can be printed.

### 3. A caption over nothing is a false claim

`statRowHTML` emitted its caption unconditionally. The guard is in the component rather than the
caller because the component owns what it draws; a caller with no figure to explain now passes no
caption. D5 is unaffected - every figure that renders still carries its provenance.

**What this reaches, corrected from the first reading.** The tracker redirects to
`#/calculator/result` unless `deposit-target` and `checkpoint-amount` are both set, so the two
`setting-up` positions never draw this screen at all and their dash was never reachable here. With
beyond-window now rendering a value, the guard covers `unreachable` and `exceeds-left-over`. The
first of those is genuinely reachable: frame 11's `monthlyError` tests only the UPPER bound against
the saving ceiling, so a participant who types zero into the monthly range commits a zero
`savings-rate` and meets a dash on the tracker.

### 4. The note, written for a screen with no chart

> "This could take more than 5 years at what you're putting aside now. We show a date once it's
> closer than that."

Frame 12's is "This could take more than 5 years at your current rate - the chart shows progress to 5
years." Two differences, both forced by the screen:

- **No chart to refer to.** Frame 12's second clause explains the chart's limit. Here it explains why
  the row shows no date, which is the same job - accounting for what the screen is not showing - for
  a screen without one.
- **"at what you're putting aside now", not "at your current rate".** The tracker draws a rates card
  a few hundred pixels above this row, headed "What rates are like at this Loan-to-Value" and showing
  4.6% to 5.2%. "Your current rate" would read as the interest rate. The replacement also matches the
  row's own caption.

Rendered through `infoBannerHTML`, the same component frame 12 uses for the same content, so the
limitation is no less prominent here than there.

### The test that changed, and why it is not a weakening

`stage.test.mjs`'s "Saving gives up the projection window" asserted
`saving['on-track-for'].value === null` and its comment called null correct. D68 reverses that
premise, so the assertion had to move.

**What the test exists for is untouched.** Its own comment says it asserts the COST, so a later
change that silently restored the projection window would fail here and be read alongside D45, D55
and D60. Those assertions - `months-to-target` past `CHART_WINDOW_MONTHS`, and `monthsToTarget()`
returning `beyond-window` - are unchanged. The replaced lines now assert more than they did: that the
stored range matches what the model returns, and that its LOW end is past the window, so the whole
range is beyond it rather than just the central figure.

**To reverse.** The `beyond-window` branch in `onTrackFor()`, the caption guard in `statRowHTML`, the
`beyondWindow` branch in `tracker.js`, two keys in `content.js`, and the three assertions in
`stage.test.mjs`.


### Amended, 30 August 2026: change 2 reversed, the range is shown

**What changed.** The row renders the date range - "August 2034 to June 2036" at the opening seed -
rather than "More than 5 years". `onTrackBeyondWindowValue` is deleted. No model change was needed:
change 1 above already propagates the value, which is the whole reason this reversal costs one
branch rather than a rewrite.

**The original reasoning is left standing above, deliberately.** It is not wrong on its own terms:
sixty months IS where this build stops drawing a projection, and a month-and-year pair nine years out
IS more precise than that window implies. Both of those remain true. What was weighed differently on
second look is what the participant is owed.

**The argument that won.** The model had computed a figure and the screen was declining to show it.
"More than 5 years" does not tell a participant whether the app cannot work out a date or has decided
not to say - and those are very different things to learn about a tool you are being asked to trust
with your own money. In an instrument built to measure whether people can follow their own figures,
withholding a computed one to protect them from its imprecision is the wrong default: it protects the
app's appearance of certainty at the cost of the participant's understanding of what it knows. Better
to show the figure and qualify it.

**So the qualification moved rather than disappeared.** The note is kept and repointed. It used to
explain why no date was shown; it now says what kind of date it is:

> "These dates are an estimate based on what you're putting aside now. They move if that changes."

"an estimate based on" echoes `shared.regulatory.estimateDisclosure` rather than inventing a second
phrasing for the same idea, and it adds the two things the row's caption does not already say - that
the figure is an estimate, and that it moves.

**The render branch got simpler, not more complex.** It is now `onTrack.value ? range : dash`, so the
VALUE decides what draws rather than the error code, and the caption guard follows the value for the
same reason. The special case that turned one error code into a threshold string is gone.

**Frame 12 reconciled and not changed.** Its `beyondWindowNote` is "This could take more than 5 years
at your current rate - the chart shows progress to 5 years." Neither clause becomes false: "more than
5 years" is a superset statement that August 2034 sits inside, and the chart does still only draw to
five years. What now exists is an asymmetry in DISCLOSURE rather than a contradiction - frame 12
declines to name a date the tracker names, for the same session. Levelling it means adding the range
to frame 12's first clause and keeping the chart clause as it is. Reported and left alone.

**What this amendment exposes, reported rather than fixed (G82).** The tracker renders a projected
figure and carries no `estimateDisclosure`; its anchors are `guidanceNotAdvice` and
`mcob3aRepossessionWarning` only. That is a pre-existing `fca-copy-check` rule 2 breach - the
in-window range at `ready-to-check` has always shipped unqualified - which this change makes more
consequential, because the unqualified figure is now nine years out rather than two and a half. The
note supplies estimate framing in the beyond-window case alone.

---

## D69. A caption that asks a question goes once the question is answered

**Date.** 30 August 2026.

**Decision.** `stocksIsaCaption` renders only while its account is unsorted. One flag on the account
in `accounts.js`, one condition in `consent.js`. No copy changed, no layout changed, no figure
changed.

**The defect.** The caption reads "Some people are saving this toward a home, some aren't. **Tap to
tell us.**" It rendered in every group, so a participant who had filed the Stocks and shares ISA
under "Toward your deposit" - by ticking it, or through frame 03b - saw the row sit under that
heading, ticked, still asking them to tell us what it was for.

**The cause is structural rather than a missed condition.** `captionKey` is a static property of the
account in `MOCK_ACCOUNTS`, and `accountRow` read it unconditionally:

```js
const caption = account.captionKey ? content.accountCaptions[account.captionKey] : null;
```

Nothing connected the caption to the state it describes, because nothing ever needed to: three of the
four captions on this screen are true regardless of state.

### Why a flag and not a blanket rule

This is the part worth keeping. The obvious fix - render no caption unless the account is unassigned
- would have deleted three of the four captions outright, because none of their accounts is ever
unassigned:

| Caption | Account opens in | What it does |
|---|---|---|
| `stocksIsaCaption` | `unassigned` | **Asks** the participant to file the account |
| `lifetimeIsaCaption` | `deposit` | Explains why it IS counted, and offers a move |
| `emergencyFundCaption` | `emergency` | States what the pot holds |
| `currentAccountCaption` | `excluded` | States what the account is, and that it is not in the total |

Only the first is a prompt. The other three are standing explanations that are as true after filing
as before, and two of them describe accounts a participant may never touch. `CLAUDE.md`'s rule that a
correction applies everywhere the same pattern appears is satisfied by fixing one instance here,
because the pattern - **a caption that invites an action** - has exactly one instance.

Hence `captionWhileUnsorted: true` on the account, and a condition that leaves a caption without the
flag alone.

### Either answer counts as an answer

Suppression is on `group === 'unassigned'`, so all three filings settle it: counted toward the
deposit, kept for emergencies, or left out. The caption asks "is this for a home?", and "no" answers
it as completely as "yes".

**It is derived from where the account IS, not from a flag set when the participant acted.** So if a
route back to `unassigned` is ever added, the caption returns with no further change. None exists
today: frame 03b offers only `deposit`, `emergency` and `excluded`, and `toggleAccountPatch`'s
unticking "clears the flag and leaves the filing alone". The behaviour is therefore *would return,
unreachable today*, which is the honest answer to whether it comes back.

### The three things that now move together

`groupSection` already dropped the "Not sorted yet" header, its "We can't tell what this is for"
subtitle and the "Sort this out" button together - the first two through `if (accounts.length === 0)
return ''`, the button through `group === 'unassigned'`. The caption was the only piece of the
unsorted state outside that condition, which is why the before shot shows it standing alone with the
heading and button already gone. All four are now governed by the same fact.

### Layout

Nothing new was introduced. `.account-row` keeps `min-height: 64px` and its own `border-bottom`, so
the row cannot collapse and the list rhythm is unchanged. `.account-row-wrap` is a flex column with
`gap`, which applies only between children, so removing the caption leaves no residual space.
Strongest evidence: **four accounts already render with no caption** - House pot, Instant saver, Cash
ISA and Holiday pot - so the caption-free row is the list's existing default, not a new state.
Confirmed by shot in both themes at both text sizes.

### Harness

`scripts/shots.mjs` gained `--assign=<accountId>:<group>`, validated against the real account ids and
`GROUP_ORDER`. Without it frame 03's filed states cannot be shot at all: the seed always opens with
the Stocks and shares ISA unsorted, so every shot of that screen showed the same row in the same
state - which is why the defect survived to be found by reading rather than by looking. It writes
`accountSelectionEdited` alongside the assignment, because a filing the participant did is what that
flag records, and leaving it false would seed a session claiming `read` provenance for figures a
participant moved (D5).

**To reverse.** The `captionWhileUnsorted` flag on `stocks-isa` and the `captionApplies` condition in
`accountRow`.


---

## D70. Stamp duty joins the goal, the other upfront costs get a screen, and the two are kept apart on purpose

**Date.** 30 August 2026.

**Source for every figure below.** HMRC, *Stamp Duty Land Tax: residential property rates*,
<https://www.gov.uk/stamp-duty-land-tax/residential-property-rates>, accessed August 2026. Held as
`SDLT` in `model/rates.js` on the `AREA_AVERAGE_PROPERTY_VALUE` pattern, so the bands and their
attribution cannot be updated independently of each other.

### 1. Why the costs split across two screens

The tracker's job is the goal: one figure, its progress against a target, and what to do next. Five
cost ranges on that screen would be five more figures competing with the one the screen exists to
show, and **not one of them is a figure the participant is saving toward**. They are also not
comparable to each other or to the goal - a survey range and a deposit target are different kinds of
number - so a reader scanning the screen would have to sort them before reading either.

The separate screen keeps the costs one tap away and reachable, without making them the focus of a
screen about the goal. The tracker carries **one line** about the tax that is now in the goal, and
**one row** naming where the rest are. It lists none of them.

Stamp duty is the exception, and it is in the goal rather than on the costs screen for one reason:
it is the only one of the six that is **knowable from what the participant has already entered**.
The property value determines it. The other five depend on choices not yet made - which solicitor,
which survey, which lender - so any figure for them in the goal would be a guess dressed as a target.

### 2. `deposit-target` is not overwritten, and that is the safety property

`combined-goal = deposit-target + stamp-duty`, added as its own section 6 figure. The split is not
tidiness; it is what made the change safe.

| Reads `deposit-target` (the mortgage) | Reads `combined-goal` (the saving) |
|---|---|
| `loan-amount` | `checkpoint-amount` |
| `ltv` | `months-to-target` |
| `borrow-low` / `borrow-high` | `monthlyAmountFromDate` |
| `max-property` | `gap` (frame 21) |
| `mipEstimatedLtv` | `/tracker`'s progress fill and variant |

Stamp duty is cash paid to HMRC at completion, not money put down against the property, so a larger
goal must not shrink the loan. Because `deposit-target` kept its meaning, **the five mortgage figures
needed no edit at all** - and a figure that is never edited cannot be edited wrongly. Redefining
`deposit-target` in place would have made all five silently wrong and left nothing to review.
`model.test.js` asserts the boundary in both directions, at a property value where the tax is
non-zero.

**A trap worth recording.** The pre-existing model tests all use a 190,000 property, where
first-time buyer stamp duty is zero. Every one of them passed unchanged after this work - not because
the change was safe, but because at that price `combined-goal` and `deposit-target` are the same
number. New tests were added at 450,000 for that reason. A suite that cannot fail is not coverage.

### 3. The calculation is banded, and the cliff is real

Two scales, not one with a discount. Below `ftbReliefLimit` (500,000) the first-time buyer scale
applies; above it the relief is lost **entirely** and the standard scale applies to the whole price.

| Property | Stamp duty | |
|---|---|---|
| 300,000 | 0 | the whole price is in the nil-rate band |
| 400,000 | 5,000 | banded, not flat: 5% of 100,000, not 5% of 400,000 |
| **450,000** | **7,500** | the seeded case: 5% of the 150,000 above 300,000 |
| 500,000 | 10,000 | the last price at which relief applies |
| 500,001 | 15,000.05 | relief lost: standard rates on the whole price |

**One pound moves the goal by 5,000**, which is more than the preceding 50,000 of property value
moves it. That is the real rule, not an artefact. It is reachable in a session - frame 09's field
accepts any digits - and it is currently **explained nowhere**. Copy for it has been drafted and is
held pending a decision; the cliff is live in the model in the meantime, and `/assumptions/deposit`
states the 500,000 limit as an assumption.

### 4. The checkpoint moved, and the progress bar is why

`checkpoint-amount` becomes 0.75 x `combined-goal`, 33,750 to 39,375 on the seeded goal.

Not for its own sake. `tracker.js` draws the bar with `markerPct: CHECKPOINT_FRACTION * 100` - a
literal 75 - and fills it against the goal. Leaving the checkpoint on `deposit-target` while the bar
ran to `combined-goal` would have put the marker at **64.3%** of the track while the copy beside it
said 75%: two denominators, one bar. One denominator makes both true.

**Nothing else had to move with it**, and that is the payoff from D38's third amendment. The
skip-ahead control and the ready-to-check stage both read the **stored** `checkpoint-amount` rather
than a figure of their own, so both followed automatically. There is no 33,750 written down anywhere
in `src/` to have missed. Every stage still renders the frame it rendered before: Saving below the
checkpoint (frame 15), Ready to check at it (frame 16), Setting up unchanged.

### 5. Copy

The tracker's line carries its own estimate framing rather than adding
`shared.regulatory.estimateDisclosure` to the screen: this screen has never carried that line, and
its own beyond-window note (D68) already establishes in-line qualification as the treatment here.

Its **second sentence is the whole point**. Nothing in this app asks whether the participant is a
first-time buyer - there is no question that could - so the app has assumed it on their behalf. "at
first-time buyer rates" alone states the basis of the calculation, but attached to *their* goal it
reads as a claim they will get the relief. "Whether those apply is confirmed when you buy" keeps it a
basis rather than a promise, without telling them to go and do anything, which the guidance-versus-
advice boundary would not allow.

`goalCaptionTemplate` drops the word "deposit": the figure it captions is now the deposit plus the
tax, and calling that a deposit goal would be false about 7,500 of it.

The costs screen states a consequence it would have been easy to leave out. "Some lenders let you add
this to the mortgage instead of paying it upfront" reads as the fee being avoidable; it is deferred,
and deferring it costs interest. MCOB 3A.3.1R and the Consumer Duty consumer understanding outcome
both require the consequence to be as plain as the benefit. Stating it is not telling the participant
what to do.

### 6. Frame 30 gave the costs up rather than keeping a second copy

The five costs were already on `/assumptions/deposit`, as `exclusionsRows`, without amounts. Four
moved to the new screen whole and frame 30 now carries **one row pointing at it**; the fifth, stamp
duty, moved **up** into `assumptionsRowsBeforeInterest`, because a tax that is in the goal cannot sit
under "What's not counted here" - that placement went from stale to false. Frame 29's "covered
separately" now names the destination it always implied.

Two lists of the same costs at different specificity would drift, and D34 records what that costs.
This also closes a traceability gap: the stamp duty figure on the tracker is derived, and the
assumptions link already on that screen now reaches an assumption that explains it.

### 7. What is deferred, and why it is listed rather than done

- ~~**The segmented progress bar.**~~ **Built** - see section 9 below.
- ~~**The 500,000 cliff copy.**~~ **Built** - see section 9 below.
- **Contrast, recorded now because the measurement is the reasoning.** No third shade can reach 3:1
  from **both** the deposit fill and the empty track, in either theme, because the two ends are only
  6.48:1 apart in light and 4.08:1 in dark - and 3 x 3 exceeds both. In dark, nothing reaches 3:1
  against the deposit fill at any point on the scale. Measured candidates: light `#9a9aa2` at 3.00
  vs fill / 2.16 vs track, `#7d7d86` at 2.05 / 3.16; dark `#5c5c64` at 2.31 / 1.77, `#75757d` at
  1.59 / 2.56. **Colour therefore carries emphasis only.** The meaning is carried by the legend,
  which names each portion and its amount, and by a 1px `--color-surface` separator at the join -
  the device `.progress-bar__marker` already uses. This is not a workaround for a palette
  limitation; it is the correct treatment for a divided bar regardless, and WCAG 1.4.1 requires it
  independently of any contrast figure.

### 8. To reverse

`SDLT` and `UPFRONT_COST_SOURCES` in `rates.js`; `bandedTax`, `stampDuty`, `ftbReliefLost` and
`combinedGoal` in `model.js`, with `checkpointAmount`, `gap`, `monthsToTarget` and
`monthlyAmountFromDate` returned to `depositTarget`; the two keys in `state.js` and their commits in
`calculator-property.js`, `calculator-review.js` and `stage.js`; `assumptions-costs.js` with its
route in `app.js` and its two entries in `router.js`; the tracker's guard, variant, fill, one caption
and one info link; and frames 29 and 30's rows. `CACHE_VERSION` v63.

### 9. Amended, 30 August 2026: the bar is divided, and a zero tax collapses it

The three items section 7 listed as deferred are built. The design-rule amendment landed first, as
its own commit, so the rule was accurate before this work was judged against it.

**The bar is one bar.** `progressBarHTML` takes an optional `segments` list and the tracker passes
the deposit and the tax as shares of the goal, in two shades of one colour, so the tax reads as part
of the same goal rather than a second one beside it. The fill still shows how far along the
participant is; the division shows what they are heading toward. Undivided callers are untouched -
omit `segments` and the function is exactly what it was.

**Colour carries emphasis only, and the measurement is why.** No third shade can reach 3:1 from both
the deposit fill and the empty track, in either theme: the two ends are only 6.48:1 apart in light
and 4.08:1 in dark, and 3 x 3 exceeds both. In dark, nothing reaches 3:1 against the fill at any
point on the scale. `--color-accent-neutral-muted` is light `#9a9aa2` (3.00:1 against the fill,
2.16:1 against the track) and dark `#75757d` (1.59:1 and 2.56:1) - chosen to maximise separation
from the fill, because that is the pairing the legend has to disambiguate.

So the meaning is carried by two things that are not colour: a legend naming each portion and its
amount, and a 1px `--color-surface` separator at the join, the same device `.progress-bar__marker`
already uses. This is not a workaround for a palette limitation. WCAG 1.4.1 requires it of any
divided bar regardless of contrast, which is why it is now in the design rule rather than only here.

**A zero tax collapses the whole thing.** Below the 300,000 nil-rate band there is no stamp duty, and
three things are suppressed together: the sentence explaining it, the bar's division, and the legend.
The bar renders as an ordinary single fill.

The reasoning, because it decided the shape of the code. A line reading "Your goal includes an
estimated £0 of stamp duty" explains a component that is not there, and a legend entry reading
"Stamp duty £0" does the same in fewer words. Both invite the participant to wonder what they
missed - the opposite of what the line was added to do. **And this state is more likely to be seen
in a session than the seeded one**: three of `ROUTES.md`'s four tracker recipes (280,000, 200,000 and
150,000) sit below the threshold, so a facilitator following the documented recipes meets the zero
case before they meet the 450,000 one.

The collapse rule lives in `progressBarHTML`, not in the tracker: a segment with no width is dropped
there, and if that leaves one segment the legend goes with it. The tracker passes both segments
unconditionally and tests `stampDutyValue > 0` only for the sentence. One rule, one place, and a
future caller cannot forget it.

`shots.mjs` gained `--property` for this, rather than a harness written inline: the tax is a
FUNCTION of the property value with three regions worth looking at (no tax, relief, relief lost), and
`--saved` moves the position within a goal rather than the goal itself. It re-derives every dependent
figure through the model, so a screenshot cannot show a goal the model would not have produced.

**The costs link is NOT suppressed.** The other five costs exist at any property value, so the row
naming them is drawn whether or not there is any tax. Only the stamp duty content is conditional.

**Frame 09 gains the cliff banner, ordered cap-then-tax.** That is the order a participant typing
upward crosses them - the Lifetime ISA cap at 450,000, the relief cliff at 500,000 - and above
500,000 both are drawn because both are true. Between the two only the cap shows, which is correct:
nothing about the tax changes in that range. The banner says what the rule is and why the figure
moved; it does not suggest buying below the threshold, which would be advice.

### 10. The defect the tests found and reading did not

`STAGE_KEYS` in `stage.js` did not list `stamp-duty` or `combined-goal`, so selecting "Setting up"
cleared the property value and the deposit target but **left the previous stage's stamp duty and
combined goal in the store**. A session would then hold a null property value beside a 7,500 tax and
a 52,500 goal derived from a property that was no longer set.

That is precisely the failure mode CLAUDE.md's state rules describe - "the store holding a state no
screen expects" - and it is the same shape as D46 and D38's third amendment. It would have reached a
screen as a real figure rather than as an error, because `formatCurrency` renders a stale number as
readily as a fresh one.

**Reading would not have caught it.** The commit sites were all correct: frames 09 and 11 and the
stage each wrote both new keys beside `deposit-target`, which is what a review looks for. The bug was
in a *reset* list a hundred lines away from any of them, whose job is to name every key a stage
change must clear - a list that is correct by omission until a figure is added. `stage.test.mjs`'s
"every stage is reachable from every other, with nothing left behind" caught it on the first run.

**The general lesson, recorded because it will recur.** Adding a section 6 figure means touching two
kinds of place: everywhere it is written, and everywhere state is *cleared*. The first kind is
obvious from the feature; the second is only obvious from the test. `STAGE_KEYS`, `STASHED_KEYS` in
`skip-ahead.js` and `SECTION_6_KEYS` in `state.js` are the three lists of the second kind in this
build. `skip-ahead.js` needed no change here - neither new key depends on the savings position - but
it was checked for the same reason.

### 11. Amended, 30 August 2026: the goal area is restructured, and the legend closes

The goal area read as four stacked centred captions under one figure. It now reads as a figure, one
caption explaining it, a sentence about the tax, and a bar that runs from what has been saved to what
is being aimed at. Six changes, and three of them turn on the same question - what a thing is FOR.

**The goal figure moved to the right-hand end of the bar.** `goalCaptionTemplate` ("of your £52,500
goal") is deleted rather than moved: under the headline it labelled nothing, and at the end of the
track it labels the end the fill is crossing. The track and the figure share a flex row where **the
track takes all the width pressure** - `flex: 1 1 auto; min-width: 0` against the figure's
`flex: 0 0 auto` and `white-space: nowrap`. That direction is deliberate: a shorter track is a
smaller loss than a truncated currency figure, and CLAUDE.md's auto-layout rule forbids the second
outright. At Large text on a 350px column the figure takes about 67px and the track keeps about 275px.

**The provenance caption stays, and D5 is why.** `savedCaption` ("From the accounts you said are for
your deposit") was the one element considered for removal that could not go. `saved-toward-deposit`
carries provenance `read` - it is summed from the accounts the participant assigned, and they did not
type it - so D5 and copy-check rule 8 both require a caption on it. **Deleting `goalCaptionTemplate`
made that binding tighter, not looser**: it left `savedCaption` as the only thing on the screen
explaining the headline figure, where before it was one of three captions. Removing both would have
left an unexplained five-figure sum at the top of the screen. Kept in place and unshortened.

**The two amounts moved into a disclosure, closed by default** (D12: a section already open cannot
show whether a participant would have chosen to open it). The two strings are the legend's own,
reused under their `legend*` names rather than renamed - the strings are unchanged and in the same
relationship to the same two segments, and renaming copy-identical keys would make every future diff
read as new wording.

### What identifies the bar's segments with the legend closed

This is the question the collapse had to answer, because D70's section 9 recorded that colour cannot
do it: no third shade reaches 3:1 from both the fill and the empty track, and in dark nothing reaches
3:1 against the fill at all. While the legend was drawn, the legend was carrying identification.

**Size carries it, and size is not colour.** The segments are drawn in proportion to their amounts,
and the note directly above the bar states both - the goal at the track's end, the tax named in the
sentence. So a reader maps the larger segment to the larger amount without reference to the shades.
WCAG 1.4.1 asks that information not be conveyed by colour ALONE; here it is conveyed by proportion
and by prose, and the shades are a third, redundant encoding.

That holds across the whole plausible range, and it is worth writing the numbers down:

| Property value | Tax as a share of the bar |
|---|---|
| 450,000 (the case study) | 14.3% |
| 500,001 | 23.1% |
| 925,000 | 28.2% |
| 2,000,000 | 43.5% |
| **4,312,500** | **50% - parity** |

**No always-visible segment label is needed**, and one was rejected rather than overlooked: it would
restate what the sentence immediately above it already says, on a screen whose whole problem was too
many stacked captions.

**The residual, recorded because it is real.** Above about 4.3 million the two segments approach
parity and size stops disambiguating them. Nothing becomes false there - the note still states the
composition, and the disclosure still gives both amounts on demand - but the resting state stops
being self-evident. No participant in this study will type such a value; it is recorded because the
reasoning above depends on a bound, and a bound that is not written down is one that gets forgotten.

**"Checkpoint" stays where it is**, directly beneath the track and above the disclosure. It labels
the marker, not either end of the bar. One thing to watch in a session: with the goal figure now at
the track's right end, a left-aligned "Checkpoint" underneath could be misread as labelling the left
end. It sits on its own row between two elements that are both about the whole bar, which should hold
it, but it is the one part of this layout that was not verified against a participant.

### The explainer, and where its icon belongs

**Stamp duty is first named on the tracker**, on the default path. Frames 09 to 12 never name it at
the seeded property value - frame 09's cliff banner appears only above 500,000, and frame 30's
assumption rows only if the participant opens that sheet. So the icon belongs on the tracker's note,
which is the sentence that introduces the term, rather than on the disclosure row below it, which is
closed.

**It is also on frame 09's cliff banner**, and that is not a second-best placement: above 500,000 the
banner IS the first encounter, and the participant meets it having just watched the goal step up by
5,000 for one extra pound. They need the explainer more than a seeded participant does, not less.

**`returnFrame` differs by entry and has to.** From the tracker it is `/tracker`; from frame 09 it is
`/calculator/property`, so dismissing returns to the calculator step the participant was on rather
than to a tracker they may not have reached. Dismissal itself is `goBack` from either, so the return
is the history entry; `returnFrame` is what the sheet's `/home` fallback would otherwise mis-target
if the sheet were opened cold.

**The icon is 48px and sits in its own flex cell**, not inline in the sentence. DESIGN.md's rule 2
requires 48px of every control and forbids shrinking one to match a design, and a 48px target cannot
sit inside a 13px line box. `infoIconButtonHTML` exists for that reason rather than an inline `<svg>`.

**The sheet follows frames 29 to 32 but routes under `/learn`.** The visual pattern and the namespace
answer different questions: `/assumptions/*` means "how we derived YOUR numbers" and every screen in
that family reads participant state, while this one reads none - it explains a tax that exists
whether or not a goal has been set. `/learn/ltv/video` already put a sheet in that namespace.
`GAPS.md` G84 records the absent Figma frame.

### The progress bar had stopped showing progress, and a screenshot caught it

**Corrected here, and recorded because the description in section 9 was wrong rather than merely
incomplete.** Section 9 says "the fill still shows how far along the participant is; the division
shows what they are heading toward". The code did not do that. `progressBarHTML` drew the segments
**instead of** the fill whenever the bar was divided, so on the tracker - a screen whose entire
purpose is a savings position - the bar showed the goal's composition and nothing else. At 12,000
saved against a 52,500 goal it drew a bar that looked 86% full, because 86% is the deposit's share of
the goal.

**Neither the tests nor the review caught it.** `overlap.test.mjs` asserts nothing crosses text and
nothing is squashed, which a wrong-width fill satisfies perfectly; `action-bar.test.mjs` never looks
at the bar. It was found by looking at a screenshot taken for a different reason - the layout
restructure - which is the argument for `shots.mjs` existing at all.

**The fix is two layers.** The segments become a background layer inset over the whole track, and the
fill paints on top of them. Three regions result and each says a different thing: solid is saved, the
bare track is deposit still to save, the `--muted` band at the end is the tax. The join and the
checkpoint marker are raised above both layers so the fill cannot hide either.

That also removes a colour the palette could not really afford. The deposit band is left as the bare
track rather than given a fourth grey, so the shades in play are the fill, the tax band and the empty
track - the three the contrast work in section 9 already measured.

### Not fixed here: frame 12 says "Your goal - £45,000"

Found while tracing where stamp duty is first introduced. Frame 12 fills "Your goal - {target}" from
`deposit-target` while the tracker two screens later states the goal is `combined-goal`. One phrase,
two figures, two screens - D34's failure mode, opened by this decision and **not** closed by it.
Raised as `GAPS.md` G85 with the two candidate resolutions and the reason it is a decision about what
frame 12 is about rather than a string swap. It needs resolving before participant sessions.

### 12. Amended, 30 August 2026: the track is one bar, and the disclosure rows carry swatches

The bar read as three disconnected chunks rather than one track with regions inside it. Three rules
were producing that, and only one of them was the obvious suspect.

**What was actually causing it, rule by rule:**

| Rule | File | Line | What it did |
|---|---|---|---|
| `border-radius: var(--radius-full)` on `.progress-bar__fill` | `src/css/components.css` | 2228 | Put a **rounded cap on the fill's leading edge**, so the saved portion read as a short bar sitting inside a longer one rather than as a filled region of one track |
| `background: var(--color-surface)` on `.progress-bar__join` | `src/css/components.css` | 2268 | A 1px slit at the deposit/tax boundary |
| `background: var(--color-surface)` on `.progress-bar__marker` | `src/css/components.css` | 2311 | A 2px slit at the checkpoint |

**Ruled out, and worth recording so it is not re-investigated:** there is no flex gap anywhere along
the track. `.progress-bar` has `gap: var(--space-xs)` (line 2210) but it is a **column** gap between
the track row and the label beneath it. `.progress-bar__row`'s `gap: var(--space-sm)` (line 2288) sits
between the track and the goal figure, outside the track. `.progress-bar__segments` is a flex row with
**no gap at all**, and `.progress-bar__segment` carries no `border-radius` - per-segment rounding was
never the cause. The rounding that mattered was on the fill.

**The two slits were the same mistake made twice.** `--color-surface` is `#ffffff` on a page that is
`--color-bg` `#f7f7f8` - **1.06:1**, indistinguishable. So a separator drawn in it did not read as a
line drawn on the bar; it read as a hole through the bar to the page behind. The comment above
`.progress-bar__join` even called it "marked without colour", which was true of the intent and false
of the result.

**The fix is ink rather than background.** Both are now `--color-label`, which is the opposite of the
page in each theme - `#17171c` on light, `#ffffff` on dark - so neither can ever read as background
showing through. Measured against every neighbour either can touch:

| | vs bare track | vs muted band | vs fill |
|---|---|---|---|
| Light `#17171c` | 13.83 | 6.39 | 2.13 |
| Dark `#ffffff` | 11.70 | 4.57 | 2.87 |

The weakest case is a hairline crossing the fill, which only happens once the participant has saved
past the point in question, and it still clears 2:1 in both themes.

**The marker stays twice the join's width, and that is deliberate.** They are different kinds of fact
- the join is a boundary between parts of the goal, the marker is the checkpoint milestone - and D71
records that this bar must not blur kinds of fact together on one axis. Colour no longer separates
them, so weight does, and the marker alone carries a label beneath the track.

**The fill lost its own radius entirely.** It needs none: `.progress-bar__track` is `overflow: hidden`
with `border-radius: var(--radius-full)`, so the fill's left end is still clipped round by its parent.
The rounding that belongs to the bar is kept and the rounding that belonged to the fill is gone, which
leaves a square leading edge that reads as an edge within the track. Verified from computed style:
`border-radius: 0px` on the fill, `999px` and `hidden` on the track.

### The disclosure rows gain swatches, and D70's finding is unchanged rather than reversed

Each row in "What makes up your goal" now carries an 8px dot in the shade of the region it names -
`--color-accent-neutral` for the deposit, `--color-accent-neutral-muted` for the stamp duty.

**This does not disturb section 9's finding, and it is worth being explicit about why**, because the
change looks superficially like a reversal. Section 9 records that the two regions cannot be
distinguished by colour to 3:1 in either theme, and that colour therefore carries emphasis only. That
is still true and nothing here depends on it being false:

- The rows already name each portion and its amount in text. **Remove all colour and both rows read
  exactly as before** - "Deposit £45,000", "Stamp duty £7,500".
- The swatches are marked `aria-hidden="true"`, so the accessible text of each row is the string and
  nothing else. Verified from the rendered DOM: the row text is `Deposit £45,000` and
  `Stamp duty £7,500`, unchanged from before the swatches existed.
- What they add is a **link between the disclosure and the bar** for a sighted reader who has opened
  it - which is reinforcement of a mapping the proportions already carry, not a new carrier of it.

So the reasoning is unchanged: colour still carries emphasis only, size and text still carry the
identification, and a reader who cannot use colour loses nothing.

**The shades are the bar's own tokens, not restated literals.**
`.goal-breakdown__swatch--deposit` uses `var(--color-accent-neutral)`, which is exactly what
`.progress-bar__fill` paints, and `.goal-breakdown__swatch--stamp-duty` uses
`var(--color-accent-neutral-muted)`, which is exactly what `.progress-bar__segment--muted` paints. A
change to either token moves the bar and its swatch together. Verified from computed style: the
deposit swatch resolves to `rgb(77, 77, 85)`, byte-identical to the fill's own computed background.

**One honest note on the deposit swatch.** The region it points at is the left-hand part of the track,
which is painted in two states - the fill where the participant has saved, the bare track where they
have not. The swatch takes the fill's shade because that is the region's darkest and most legible
representative, not because the deposit portion is uniformly that colour. The text carries the
meaning, so nothing turns on the distinction, but it is recorded rather than glossed.

### `shots.mjs` gained `--open`, and it presses rather than seeds

A disclosure closed by default cannot be photographed, so the harness could not show this change at
all. `--open=<data-disclosure-id>` opens one before the shot.

**It presses the real control, because seeding does not work and should not.** `resetCollapsibles()`
runs on every hash-driven navigation (`router.js`), so a seeded `goalBreakdownOpen: true` is false
again before the screen first reads it. That is D12 working exactly as designed - a disclosure a
participant never chose to open must not be open - and the harness follows `--state=ahead` and
`--stage` in pressing the control the participant would press. The first attempt seeded the flag,
produced a closed disclosure, and is recorded here because the failure looked like a harness bug and
was not.

---

## D71. The tracker's bar keeps two segments and a disclosure: three marked points do not fit this track

**Date.** 30 August 2026.

**A decision NOT to build.** Nothing changed in `src/`. It is recorded because the proposal was
sound, the reasons it was rejected are measurements rather than opinions, and without them written
down the same sketch will be proposed again and re-measured from scratch.

### What was proposed

Replace the two-segment bar plus its "What makes up your goal" disclosure (D70's second amendment)
with **three marked points on a single track**: markers at the deposit (45,000) and at the deposit
plus stamp duty (52,500), with the fill showing the saved amount (8,950) proportionally against the
full goal. Per-marker detail would be revealed on tap.

### The geometry, measured rather than estimated

Measured on the rendered screen at a 390px viewport, both text sizes. **The track is 287.4px, not
350px** - it gave about 55px to the goal figure when that moved onto its row in D70's second
amendment, and the figure grows with the text scale, so the track shrinks as the type gets bigger.

| | Default | Large |
|---|---|---|
| Content column | 390.0px | 390.0px |
| Track | **287.4px** | **279.3px** |
| Goal figure at the end | 54.6px | 62.8px |

Marker positions, as shares of a 52,500 goal (saved 17.05%, checkpoint 75%, deposit 85.71%, goal
100%):

| Point | Default | Large |
|---|---|---|
| saved 8,950 | 49.0px | 47.6px |
| checkpoint | 215.6px | 209.4px |
| deposit 45,000 | 246.4px | 239.4px |
| goal 52,500 | 287.4px | 279.3px |

| Adjacent pair | Default | Large | Meets 48px? |
|---|---|---|---|
| saved to checkpoint | 166.6px | 161.8px | yes |
| **checkpoint to deposit** | **30.8px** | **29.9px** | **no** |
| **deposit to goal** | **41.1px** | **39.9px** | **no** |

### Why that settles the interaction

DESIGN.md's rule 2 requires 48px of every control and forbids shrinking one to match a design.
Adjacent 48px targets centred 30.8px and 41.1px apart **overlap by 17.2px and 6.9px**. A tap in the
overlap resolves to whichever element wins the hit test, not the one aimed at, and it does so
silently - which is worse than no interaction at all, because nothing on screen tells the participant
they hit the wrong thing.

**It is not an artefact of the seeded figures.** The three right-hand points are permanently squeezed
into the last quarter of the track: the checkpoint is fixed at 75% and the tax is a small share of
the goal at every plausible property value. It gets tighter as that share falls - at a 350,000
property the tax is 6.7% of the goal and the deposit marker sits about 19px from the end.

**Both gaps get worse at Large text**, which is the setting a participant with a visual impairment
would be using. The failure lands hardest on the people the 48px rule exists for, which is the
strongest form this objection takes.

### Why labels do not rescue it

Measured label widths:

| String | Default | Large |
|---|---|---|
| `£45,000` | 54.8px | 63.0px |
| `£52,500` | 54.6px | 62.8px |
| `£8,950` | 46.3px | 53.2px |
| `Checkpoint` | 73.0px | 84.0px |

Labels centred at their points collide before the targets do: `£45,000` at 54.8px in the 41.1px
deposit-to-goal gap **overlaps by about 13.7px**, and `Checkpoint` at 73.0px in the 30.8px gap
**overlaps by about 42px**. Three labelled points do not fit in the last quarter of a 287.4px track
at either text size.

### The segment-labelled variant, and a correction to its reported figures

A further variant was proposed: labels under the SEGMENTS rather than at the points - "Deposit
£45,000" centred under the wide left segment, "Stamp duty £7,500" right-aligned at the track end,
"Checkpoint" on a second row. It was reported as clearing by about 2px at default text and going
negative at Large.

**Measured as specified, it collides at BOTH sizes**, not only at Large:

| | Default | Large |
|---|---|---|
| `Deposit £45,000` | 105.6px | 121.4px |
| `Stamp duty £7,500` | 119.1px | 137.0px |
| Clearance | **-7.7px** | **-38.1px** |

The difference is sensitive to the centring assumption rather than to the strings: left-aligning the
first label instead of centring it under its segment clears at both sizes (about +63px and +21px).
Recorded because the figure was going into a permanent record, not because it changes the outcome -
the variant was already rejected for two reasons that hold whatever the clearance is. It saves only
about 12px against the 48px disclosure it would replace, and it turns the bar into a small table
drawn under a track.

### Discoverability, and what it would cost

**There is no tooltip, popover or bubble pattern anywhere in `src/`** - verified by search. So the
affordance would have to be invented, and the design question is what makes a 2px marker look
pressable. Every answer (an enlarged dot, a ring, a caret) adds visual weight at exactly the three
points that are already too close together.

The disclosure it would replace announces itself: a labelled control with a chevron, in the build's
existing idiom. Unlabelled markers announce nothing, and the likely session outcome is that nobody
taps them - the breakdown functionally absent while still costing the space.

**It saves no vertical space either.** Measured block heights:

| Element | Default | Large |
|---|---|---|
| Progress bar (track row + "Checkpoint") | 40.0px | 45.4px |
| Disclosure, closed | 48.0px | 50.3px |
| Stamp duty note above the bar | 54.0px | 82.8px |

Markers large enough to read as tappable add weight inside the bar row without removing the
"Checkpoint" row beneath it.

### Screen readers: the visible list is the mechanism, not the fallback

A marker is a positioned `div`. To be reachable it becomes a `button` with an `aria-label`, and a
screen reader user then arrows through three controls announcing "Deposit £45,000", "Stamp duty
£7,500", "Checkpoint" in DOM order, with no container explaining what they belong to and none of the
spatial relationship a sighted user reads off the bar.

The bubble is the harder half. A transient overlay needs `role="tooltip"` with `aria-describedby`, or
a `role="dialog"`, and either way must be dismissible, focus-managed, and not clipped by the track's
own `overflow: hidden`. `ui.js`'s entire ARIA vocabulary today is `aria-label` (15), `aria-current`
(8), `aria-hidden` (5), `aria-pressed` (3), `aria-disabled` (3), `aria-live` (2), `aria-expanded` (2)
and `aria-controls` (2) - the disclosure idiom and nothing resembling a popover.

So a visible list is not a fallback under the markers; it IS the mechanism, with the markers as a
redundant visual layer over it. Which is what the disclosure already is, minus the markers.

### Four marked points would read as two systems

This argument stands independently of every measurement above, and is the reason the decision would
be the same on a wider track **at this number of points**.

The bar would carry three different kinds of fact on one axis:

| Point | What kind of fact |
|---|---|
| The fill's edge, 8,950 | a **position** - where the participant is |
| The checkpoint, 75% | a **milestone** - it decides which tracker variant renders and what the Mortgage in Principle flow returns |
| 45,000 and 52,500 | **structure** - what the goal is made of |

Nothing visually distinguishes the three kinds, so a participant has to work out that 75% means
something categorically different from 85.71%. And the two points that most need to read as different
kinds of thing - the checkpoint and the deposit marker - are the 30.8px pair, the hardest to tell
apart.

The current arrangement keeps one channel per kind of fact: the fill is the position, the marker with
its own label is the milestone, and the shaded region plus the disclosure is the structure.

### The rejection is specific to this geometry, not to the idea

**On a wider track the sketch would be a better design than what is built.** Three marked points is a
clearer picture of a composite goal than a shaded region plus a collapsed list, and the reason to say
so here is that a future change which widens the track - a larger viewport target, a different
placement for the goal figure - reopens it as a real option. What it cannot survive is a 287.4px
track carrying four points, three of them in the last quarter.

### Two routes were offered and both declined, with reasons worth keeping

- **Move the goal figure off the bar's row** to return the track to about 350px. Declined: it undoes
  D70's second amendment deliberately made two commits earlier, and it fixes the label collisions
  without fixing the touch targets - the checkpoint-to-deposit gap would reach only about 37px
  against the 48px minimum.
- **Drop the checkpoint marker**, roughly doubling the tightest gap. Declined: it trades a working
  element for a speculative one, and the checkpoint still decides the tracker variant and the
  Mortgage in Principle result, so it would need somewhere else to live. D51 already records what its
  becoming less legible costs.

### Nothing is raised in GAPS.md

Deliberately. `GAPS.md` records defects, unresolved questions and known deviations from the spec.
This is a decision not to build a thing that was never in the spec, and the bar as built is correct.
Filing it there would turn a closed question into an open one.

### To reverse

Nothing to reverse. If the track ever widens, re-measure the three gaps against 48px before reopening
this - the numbers above are specific to a 287.4px track at a 390px viewport.

---

## D72. Frame 12 leads with the deposit the participant chose, and stops calling it "your goal"

**Date.** 30 August 2026. Closes `GAPS.md` G85.

### What the screen was

It sat at the end of the deposit calculator, immediately after the participant picked a percentage
from frame 09's chips, and led with a **range they had not chosen**: "A deposit on a £450,000 home
could be £22,500 to £67,500". Their own figure appeared only as a small marker label under the range
track. Three timing rows beneath were fixed at 5/10/15%, so a participant who chose **20% or 25% saw
no row for their own selection at all** - two of the five chips frame 09 offers.

Three numbers in the headline sentence, none of them theirs.

### The choice this turned on, and why the deposit won

Two readings were possible, and they are not interchangeable because they decide what the whole
screen is about.

**Lead with the combined goal (£52,500).** Rejected. Stamp duty does not vary with the deposit
percentage - it is a function of the property value alone - so every comparison row would carry the
same constant £7,500. Adding a constant to five rows carries no comparative information and destroys
the arithmetic relationship the comparison exists to show: 5% to 10% is a doubling of the deposit,
and 30,000 to 52,500 is not a doubling of anything. It would also put a goal figure at the head of a
screen whose "Why a bigger deposit helps" card, its Loan-to-Value link and its borrowing content are
all sized against the deposit alone (D70).

**Lead with the deposit for the chosen percentage (£45,000).** Chosen. This screen is the last step
of the **deposit calculator**, reached by choosing a deposit percentage. Its subject is that choice.
The quantity that varies across the comparison is the deposit; the tax is constant. And the goal is
the tracker's subject - the tracker is where saving is measured, and this is where the deposit is
decided.

So: **the deposit leads, and the goal appears beneath it under its own heading**, which is how the
participant meets £52,500 here rather than for the first time on the tracker.

### How G85 is closed, and why by deletion rather than rewording

G85 was `goalTrackLabelTemplate` - "Your goal - {target}" - filled from `deposit-target`, so frame 12
called 45,000 "your goal" while `/tracker` called 52,500 the same thing. One phrase, two figures, two
screens: D34's failure mode.

**The phrase is deleted, not reworded.** The range figure it labelled is gone, and with it
`rangeCaptionTemplate` and `rangeProvenanceCaption`. Rewording it to "Your deposit - £45,000" would
have satisfied the letter of D34 while leaving a second, smaller copy of a figure the headline now
states - the duplication D34 is actually about.

**D34's rule is satisfied rather than worked around, and the check is mechanical.** No phrase renders
on both screens carrying different figures:

| Phrase | Frame 12 | `/tracker` |
|---|---|---|
| "Your deposit would be" / "Your deposit" | 45,000 | not used |
| "Total to save" | **52,500** | not used |
| "of your {target} goal" | not used | **52,500** |
| "Your goal includes an estimated {amount} of stamp duty" | not used | 7,500 |
| "Stamp duty" | 7,500 | 7,500 (disclosure) |

The only figures appearing on both screens are 52,500 and 7,500, and both read from the same stored
keys - `combined-goal` and `stamp-duty` - so they cannot disagree. The word "goal" now appears on
frame 12 only in "What you would save toward", attached to the total, which is the tracker's figure.

### What replaced the range

**A comparison across every chip frame 09 offers**, built from `rateBandRowHTML` - the component the
tracker already uses for its Loan-to-Value band table, with its `highlighted` state marking the
participant's own row. No new component.

Each row is the deposit amount, the percentage as a sublabel, and the time to save that goal at the
slower of the two monthly figures. The slower end deliberately: one figure rather than a two-sided
range in a narrow value column, and the conservative end is the one that cannot disappoint.

**The selected row says "your choice" in words**, not only in the highlight. WCAG 1.4.1 again, and
this is the one row whose meaning depends on being told apart from the others.

### Every percentage is beyond the projection window at the seeded figures

Reported rather than fixed, because it is a property of the seed and not of this screen. At the
saving stage's own committed figures (450,000 property, 8,950 saved, 200-310 a month):

| Chip | Deposit | Goal with tax | At 310 a month | At 200 a month |
|---|---|---|---|---|
| 5% | 22,500 | 30,000 | 57.0 months | 81.4 |
| 10% | 45,000 | 52,500 | 108.6 | 150.5 |
| 15% | 67,500 | 75,000 | 153.1 | 207.4 |
| 20% | 90,000 | 97,500 | 192.3 | 255.9 |
| 25% | 112,500 | 120,000 | 227.3 | 298.1 |

**All five exceed the 60-month chart window**, at both monthly figures. That is expected and renders
correctly: the comparison rows state durations rather than plotting positions, so they are unaffected
by the window, and the growth chart still plots to five years carrying `beyondWindowNote` exactly as
D68 left it. It is recorded because a facilitator seeing "within 19 yr" on the 25% row should know it
is the seed's monthly figures talking and not a defect.

### The £70,875 mystery is solved, and it was never a deposit figure

Carried over as open from the previous round. `£70,875` is the growth chart's **y-axis ceiling**:
`maxScale = Math.max(rangeHighAmount, ...points) * 1.05`, and 67,500 x 1.05 = 70,875. It is 5%
headroom above the 15% threshold line so the topmost gridline is not flush with the chart's edge. Not
5, 10 or 15% of anything, and not a figure the participant is meant to read as an amount they might
save. No change made: the chart's own scale is allowed a ceiling, and `yTop` labelling it is what
makes the gridlines legible.

### Also changed

- `assumptionsLinkLabel` was "How we worked out the deposit range". There is no range now, so it
  reads "How we worked out these figures". Its destination, frame 30, is unchanged.
- The guard gains `combined-goal` and `stamp-duty`, because the screen now displays both - the same
  rule `/tracker`'s guard follows, and the same one D46 and D38's third amendment were written after.
- `rangeHighAmount` is still derived and still used: the growth chart's scale and its three threshold
  lines are fixed at 5/10/15% by `build-spec.md` regardless of the participant's choice. Only the
  headline and the range figure stopped reading it.

### To reverse

`headlineTemplate`, `depositBasisCaptionTemplate`, the `goal*` and `compare*` keys in `content.js`;
the headline, goal block and comparison in `calculator-result.js`, restoring `rangeFigureHTML` and
the `timing*` templates; and the guard's two extra keys. `CACHE_VERSION` v66.

### Amended, 30 August 2026: the comparison card's padding, the selected row's inset, and "mon"

Three fixes to frame 12's comparison, two of which turned out to be one defect each rather than the
string-length problem they looked like.

**The values were not clipping. They were flush.** Measured overhang past the card's content box was
+0.0px at every string length - no text was cut - but the value sat hard against the card's 1px
border, and so did the labels on the left. Shortening the string does not help: injected into a live
row, `within 24 yr 11 mo`, `24 yr 11 mo` and `24y 11m` all right-aligned to **369.0px** at both text
sizes. `.rate-band-row` is `space-between` with the value at `flex: 0 0 auto`, so the value's position
is set by the row's content edge, not by its own width.

"within" was therefore kept. It is the only per-row signal that the figure is `monthly-low`, the
pessimistic end of a range, rather than a point estimate, and neither the caption nor
`estimateDisclosure` carries that per row. The column-heading variant was dropped for a structural
reason as well as a width one: `rateBandRowHTML` has no heading slot, and the values right-align to
positions that vary with their own length, so a heading could not sit reliably over the column.

**1. `.card` is a base class, and the fix is a modifier.** Of roughly thirty uses across
`src/screens` and `ui.js`, every one pairs `.card` with a modifier that supplies padding -
`.rates-card` and `.this-month-card` at `--space-lg`, `.status-card` at `--space-xl`,
`.accounts-card`, `.why-bigger-deposit-card` and the rest. Frame 12's comparison card was the single
exception, written as a bare `<div class="card">` when it was added, so it inherited no padding.
Adding padding to `.card` itself would have moved every one of those screens; `.comparison-card` at
`--space-lg` is the convention rather than a one-off override, and matches `.rates-card` because the
two draw the same component.

**2. The selected row's contents were inset by 14px, on both screens.** Under the global
`box-sizing: border-box`, `padding: 12px` plus `border: 2px` on a `width: 100%` row keeps the outer
box the same and takes all 28px out of the content. Measured before: content 320px against 348px on
frame 12, and identically 288px against 316px on the tracker's rates card - the same component, so
the same defect in both places, which is why the fix is in `.rate-band-row--highlighted` and not on
either screen.

A negative horizontal margin of `--space-md + 2px` pulls the box outward by exactly what the padding
and border consume, so the content lands back on its neighbours' edges. Vertical padding drops by the
border width so row heights still match.

**Content alignment and an identical outer box cannot both be had** - the border has to occupy space
somewhere - and alignment is the one that shows. The box is 28px wider than an unhighlighted row,
which is where the ring lives: both cards that draw this component pad by 16px, so a 14px pull leaves
the ring 2px inside the card's own border and **the card edge stays straight**. Verified after: label
x 37.0 and value right 353.0 on both plain and highlighted rows, on both screens, at both text sizes,
with the ring at 23.0..367.0 inside a card border of 20.0..370.0.

**3. `mo` went to `mon`, and came back the same day.** Recorded rather than quietly undone, because
the round trip is the useful part of it.

The longer form was applied to `formatMonthsDuration`'s abbreviated branch while the comparison values
still looked clipped. Once the card padding above was in, the values cleared the border by 17px on
their own and the string change was doing no work - it had been a fix for a symptom whose cause was
elsewhere. It also left a live inconsistency: `yr` against `mon` pairs a two-letter abbreviation with a
three-letter one, and the ways out are worse, since `yrs` would pair a plural with a singular and this
function deliberately does not inflect its abbreviated forms at all - it renders "24 yr", not
"24 yrs".

So the branch is back to `mo`, both call sites together: frame 12's comparison rows and the growth
chart's x-axis, which reads `Now | 1 yr 8 mo | 3 yr 4 mo | 5 yr` with no overlap and no spill past the
axis at either text size. The unabbreviated branch was never touched in either direction, so frame
12's chart point labels and frame 21's `step1CaptionTemplate` are unaffected throughout.

**The measurement that settles it:** the longest value's right edge is 353.0px at both text sizes,
which is the card's content edge and **17px clear of its border** - and that figure is identical at
`mo` and at `mon`, because the value right-aligns to the content edge whatever its width. The padding
fixed the appearance; the abbreviation never could.

**`m` was proposed on 30 August 2026 and declined, for the same reason.** That would have been the
FOURTH move of this string in two days - `mo`, `mon`, `mo`, `m` - and the third was a revert of the
second on the grounds that shortening was not doing any work. Nothing had changed in between: the
comparison rows still clear the card edge by 17px and the chart's x-axis still fits at both text
sizes with no overlap and no spill. There was no problem behind the proposal.

It would also have taken the pair from `yr`/`mo` to `yr`/`m` - a two-letter abbreviation beside a
one-letter one - which is the same mismatch that sent `mon` back, and the only consistent way out
would have been moving `yr` to `y` as well. `10 y 7 m` is terse to the point where the units read as
placeholders.

**`mo` survived two attempts to shorten it, and then a third succeeded on a different argument.
30 August 2026: the abbreviated branch is `m`, and this closes the question.**

The million objection is the one that had stopped it, and it was answered rather than overruled.
**Every string this branch produces at over a year leads with the year unit** - "24 yr 11 m",
"7 yr 2 m" - so `yr` has established that the sentence is about time before the reader reaches `m`.
The single surface with no leading year is the chip, and it sits in a row beside "1 YR" and "3 YR",
which does the same work by adjacency. The ambiguity was real in isolation and does not survive
context.

**All three options were measured first**, against the 350px chip column, the comparison card's 316px
inner width, and the 350px axis:

| | Chips, default / Large | Comparison value | Axis, default / Large |
|---|---|---|---|
| **`m`** | 301 / 322 - fits | 121px, label column intact | 181 / 207 - fits |
| `mo` | 311 / 334 - fits | 130px, label column shrinks 6px | 204 / 234 - fits |
| spelled out | **416 / 454 - wraps** | **187 / 215px** | 339 fits / **391 overflows** |

Spelling it out was the option worth wanting - no abbreviation to misread, plainest for a
lower-literacy participant - and it fails on all three surfaces. The chips are over by 66px and 104px,
and **not because of the uppercase transform**: in sentence case they are still 376px and 408px, over
by 26px and 58px. At Large text the comparison value takes 215px of a 316px card, leaving 89px for a
currency label that needs 163px, so £67,500 would break across two lines. And the axis overflows by
41px. `m` is the only option that fits every surface with room to spare.

**What moved, and what deliberately did not.** The abbreviated branch of `formatMonthsDuration`, which
carries both its call sites together - frame 12's comparison rows and the chart's x-axis - and the
one chip label in `chartRangeLabels`. Verified that nothing else in `content.js` hardcodes a month
abbreviation, so no surface is left behind.

The unabbreviated branch is untouched, and three things still spell the unit in full: the chart's
point labels ("1 year 10 months"), frame 12's live region ("Showing 21 years 6 months"), and frame
21's step caption. **The chips' accessible names spell it too** - "6 m, six months" - because a screen
reader announcing "6 M" would be worse than the visible label, and because WCAG 2.5.3 needs the
accessible name to contain the visible one.

**This closes it.** The question has now been asked four times and answered from every direction:
shortening for its own sake was declined twice because nothing on screen was going wrong, spelling out
was declined on measurements, and `m` was declined once on ambiguity and then applied once the
ambiguity was shown not to survive the surrounding string. There is no fifth position left to take.

**Reported, not fixed: the growth chart's y-axis label overlaps its top threshold label.** `£70,875`
is `.growth-chart__y-label--top`, positioned at the top-left of the plot; `15% - £67,500` is a
`.growth-chart__threshold-label` positioned `bottom: {pct}%` where pct is the amount over `maxScale`.
`maxScale` is `rangeHighAmount * 1.05`, so the top threshold always sits at 95.2% of the plot - a few
pixels below the y-label, by construction rather than by coincidence. Measured overlapping at **both**
text sizes. Fixing it means more headroom above the top threshold, moving the y-label out of the plot
area, or dropping it; all three change the chart's proportions, so none was attempted here.

### Amended, 30 August 2026: three comparison rows, not five

Frame 12's comparison listed all five chip values. It now shows three - the selected percentage, one
step below and one step above - so the participant's own choice is the subject of the block rather
than one entry in a list, and the two options furthest from it stop carrying the same visual weight
as its neighbours.

**The rule already existed, on the screen immediately before this one.** `calculator-property.js`
has drawn a three-row comparison around the selection since it was built, windowed by a local
`neighbourPcts()`. That function is moved to `rates.js`, beside the constant it windows, and both
screens now import it. Two copies of "what counts as one step" would eventually disagree.

**It windows by INDEX, never by arithmetic.** "One step" is the neighbouring entry in
`DEPOSIT_PCT_OPTIONS`, not the selection plus or minus five points. The set is
`[0.05, 0.10, 0.15, 0.20, 0.25]` - a fixed constant, not derived - and it rises in fives today, but an
arithmetic version would silently ask for a percentage the calculator does not offer the moment that
stopped being true.

### At the ends of the set: extend, do not shrink

At 5% there is no step below and at 25% no step above. Two options were considered:

| | Show two rows | Extend to keep three |
|---|---|---|
| 5% selected | 5/10, selection at top | **5/10/15**, selection at top |
| 25% selected | 20/25, selection at bottom | **15/20/25**, selection at bottom |
| Row count | changes 2 to 3 with the selection | constant |
| Selected row's position | always an end | middle, except at the ends |

**Extending was chosen, for three reasons.**

**Frame 09 already does it**, live, on the previous screen of the same flow, for the same choice. Two
adjacent screens windowing the same decision by different rules is a worse inconsistency than the
selected row not always being in the middle.

**A participant at an end of the range gains more from two steps in one direction than from a blank
slot.** At 5% they are at the minimum the calculator offers and the useful information is what more
saving buys - 10% and 15%. At 25% they are at the maximum and the useful information is what they
would save by going lower - 20% and 15%. In both cases both remaining neighbours are the actionable
ones; dropping to two rows would spend the freed space on nothing at exactly the positions where the
participant has least context.

**A constant row count means the block does not resize** when they go back to step 1 and change the
chip, which the whole screen is built to support and which they can do at any time.

**What it costs, and why that is affordable.** "The middle row is mine" is not a learnable rule any
more. It never was the carrier though: D72 established the selected row by its outline **and** by
"your choice" in words, precisely because neither colour nor position should have to do it alone.
Verified: at 5% the marked row is first, at 10% second, at 25% third, and the marking is correct in
all three.

### The rows re-derive; nothing persists

`depositPctValue` is read from state at render and the window computed inside the render, so there is
nothing to go stale. Driven rather than assumed: opened at 10% (5/10/15, 10% marked), navigated back
to frame 09, selected 20%, continued through - frame 12 then showed **15/20/25 with 20% marked**.

### Copy

Nothing on the screen names a count or a range for the comparison. `compareHeading` is "How this
compares" and `compareProvenanceCaption` is "Time to save each one, at what you are putting away now"
- "each one" is count-agnostic and stays right at three. Both that caption and `estimateDisclosure`
are unchanged.

**One stale string was found and fixed while checking**, unrelated to the row count.
`unreachableBody` read "Add a monthly amount or a target date to see your deposit **range**", which
had been left behind when the range figure was deleted - the last reference on the screen to
something no longer drawn. It now reads "to see what this would take".

Frame 13's "What that looks like at three deposits" was checked and is a different screen and a
different fixed set (`CHART_DEPOSIT_PCTS`), unaffected.

### Two things this leaves standing, both recorded rather than fixed

**The growth chart still plots 5/10/15 whatever is selected**, because `build-spec.md` fixes its
thresholds there. At 25% the comparison now shows 15/20/25 above a chart whose lines are 5/10/15, and
the "Why a bigger deposit helps" card still says "less at 10% than at 5%" from the same fixed band.
That mismatch predates this change - the comparison used to include 5% and 10%, so the eye could at
least bridge it - and the window makes it more visible without causing it.

**A typed percentage outside the chip set gets no marked row.** Frame 11 accepts any whole number
from 5 to 25, so 12% is committable; the window then returns 5/10/15 and nothing matches. Equally
true before the window, when all five rows were listed and none was highlighted. `GAPS.md` G87.

### Amended, 30 August 2026: the chart keeps 5/10/15, and says why

**This decision caused the problem it is now closing, and that is worth stating plainly.** Frame 12's
growth chart plots thresholds at 5/10/15% whatever the participant chose, which `build-spec.md`
section 2 states explicitly. When that was written the whole screen answered at 5/10/15: the headline
was a 5-15% deposit range, the timing rows were 5/10/15, and the chart's lines matched both. This
decision replaced the headline with the participant's own deposit and the timing rows with a
comparison windowed on their selection - and left the chart alone. So one screen began giving two
answers to the same question, and nothing on it said why.

**The chart stays fixed, and the reason is what the chart is for.** Windowing its thresholds to
follow the selection was measured rather than argued about. The savings curve reaches £31,212 at
sixty months, and against a windowed axis it fills:

| Selected | Window | Axis top | Curve fills |
|---|---|---|---|
| 5% / 10% | 5/10/15 | £70,875 | 44.0% |
| 15% | 10/15/20 | £94,500 | 33.0% |
| 20% / 25% | 15/20/25 | £118,125 | **26.4%** |

At the top of the chip set the curve becomes a quarter of the plot. Showing growth is the chart's
only job, so the fix is to make the lines legible as a reference, not to make them follow a selection
they cannot follow without destroying the thing they sit behind.

### The caption, and the state it has to handle

Two jobs, and the second is the one that was actually missing.

`chartReferenceCaption` - always drawn - says the lines are a reference rather than the selection:

> "The three lines are a low, middle and high deposit at this property price, not the deposit you
> chose."

`chartGoalAboveNoteTemplate` appends where the goal clears the top line:

> "Your £120,000 goal sits above all three, so it is not shown here."

**One base sentence with a conditional clause, not two whole strings.** The base is true in both
states, so duplicating it into a second variant would have put the same wording in two keys to change
one clause - the shape `onTrackBeyondWindowNote` already uses on the tracker.

**It names the chart, not the goal's feasibility.** "so it is not shown here" is a statement about
this chart's scale. "out of reach", or anything about how far off they are, would be a claim about the
participant, and the rules on framing a savings position as a shortfall apply exactly as they do
everywhere else.

### The second state is common, not an edge case

The goal is the deposit plus stamp duty, so it clears the 15% line well before a 15% deposit does:

| Property | Stamp duty | Top line | Chips whose goal is above it |
|---|---|---|---|
| £300,000 | £0 | £45,000 | 20%, 25% - **two of five** |
| £450,000 (seeded) | £7,500 | £67,500 | **15%, 20%, 25% - three of five** |
| £500,001 | £15,000 | £75,000 | 15%, 20%, 25% - three of five |

**D70 is why 15% tips over.** With no stamp duty a 15% deposit lands exactly on the 15% line; the
£7,500 pushes it above. So the goal never coincides with a reference line at the seeded property, and
at the seeded value the majority of the chip set reaches the second state. Treating it as a rare
branch would have been wrong.

`build-spec.md` section 2's own row now records all of this, so the next person reading "thresholds at
5, 10, 15%" finds out immediately that it is deliberate and what changed around it.

---

## D73. Frame 12's growth chart gets a range control, and loses the threshold lines that made one impossible

**Date.** 30 August 2026.

Four chips - 6 mo, 1 yr, 3 yr, 5 yr - choose the chart's window, and the y-axis rescales to each. To
get there the three threshold lines had to go, and that is the decision the rest follows from.

### The lines and a range control could not both exist

The chart drew 5/10/15% of the property value as fixed horizontal lines, which forced the y-axis up
to whichever was highest. At the seeded figures that is £70,875, against a savings curve reaching
£31,212 - so the curve occupied 44% of the plot at five years and **16% at six months**. A six-month
view on that axis shows a flat strip near the floor: the range control would have existed and been
useless.

Three axis rules were costed before choosing:

| Range | A: follow the curve | B: clamp to the lowest line | C: fixed (as built) |
|---|---|---|---|
| 6 mo | £11,546, no lines, curve **95%** | £23,625, 5% line only, curve 47% | £70,875, all three, curve **16%** |
| 1 yr | £13,735, no lines, curve 95% | £23,625, 5% only, curve 55% | £70,875, all three, curve 18% |
| 3 yr | £22,903, 5% only, curve 95% | £23,625, 5% only, curve 92% | £70,875, all three, curve 31% |
| 5 yr | £32,773, 5% only, curve 95% | £32,773, 5% only, curve 95% | £70,875, all three, curve 44% |

**Every option except C loses most of the lines anyway.** B keeps one line and halves the curve at six
months; A keeps none below three years. There was no arrangement where a usable short range and three
reference lines coexisted, so keeping the lines meant not having the control.

**A was chosen, and the lines were dropped rather than kept in a degraded form.** A line that appears
at some ranges and not others is worse than none: it makes the chart's furniture depend on a control
that is supposed to change only the window.

**The lines were also a weaker duplicate by this point.** D72 added a comparison card listing the same
percentages with amounts *and* timeframes. Three unlabelled rules across a plot were the older, poorer
version of that, and removing them leaves deposit context in one place instead of two.

### It changes the default view, and that was checked rather than assumed

The 5-yr default was previously a £70,875 axis and is now £32,773. **Every participant sees a
different chart on arrival**, so it was screenshotted before and after rather than reasoned about. The
curve goes from 44% of the plot to 89%, the bars become legible as a rising series rather than a strip
along the bottom, and two collisions disappear with the labels that caused them - the £70,875 y-label
over the "15% - £67,500" line, and the "5% - £22,500" label over the bars. Recorded as an improvement
on the evidence, not on the argument.

### The two series were never told apart, and one half of that was live

`--bar--high` differed from `--bar--low` by `opacity: 0.6` alone. Measured against each other: **2.67:1
in light, 2.36:1 in dark** - under the 3:1 D70 measured this palette against, so colour could not carry
the distinction.

`--high` now carries a **hatch**, which reads naturally on what is actually a stacked band: the solid
part is what the lower monthly amount reaches, the hatched part is the extra the higher one adds.

**The legend was worse than the bars, and independently so.** Both rows rendered
`<span class="growth-chart__swatch">` from a single class with no modifier - two identical squares,
so nothing connected either row to either bar at any contrast. That is a defect that shipped and had
nothing to do with the range control; it is recorded on its own as `GAPS.md` G90. The swatches now
carry modifiers matching their segments, hatch included.

### Chips

`chipRowHTML` is reused rather than rebuilt, and gained **optional** `ariaLabel` support. Optional
deliberately: frame 09's chips are percentages, and "10%" reads correctly as an accessible name, so
requiring an override would have meant writing one for every chip that does not need one. Frame 12's
are abbreviations - "6 mo" announced as written is not a name a participant can act on - so those pass
a spoken form: "Show 6 months", "Show 1 year", "Show 3 years", "Show 5 years".

Verified: 48px height, `aria-pressed` correct on exactly one chip per range, one row at both text
sizes (263px of 350 at default, 278px at Large).

**The chart's change is announced, and the chart is not in the live region.** A twelve-bar chart cannot
be announced usefully. A visually-hidden `role="status" aria-live="polite"` line carries a summary
instead - "Showing 6 months. Savings reach £10,996." - and the chart stays out of it.

### The control is honest about what it changes

`chartRangeNoteText` says it once, under the chart: **"Changing the range changes what the chart shows,
not what you are on track to save."** Without it, switching to six months and seeing a much smaller
figure could read as the projection having changed rather than the window on it.

Three confirmations. `estimateDisclosure` renders **above** the chart section and is unaffected by
range. `monthsToTarget` decides beyond-window on its own hardcoded `months > 60`, so a view control
cannot reach the model. And `chartRangeMonths` is a view key in `state.js`, not a section 6 figure -
nothing in `model/` reads it.

**`beyondWindowNote` lost its second clause** rather than becoming range-aware. It read "This could
take more than 5 years at your current rate - the chart shows progress to 5 years." The second clause
was true only while the chart had one range; making it range-aware would have restated the chip the
participant had just pressed, and would have added a fifth place where `GAPS.md` G80 counts the
60-month window asserted in prose. Its job - saying the chart is a window rather than the whole story -
`chartRangeNoteText` now does once, for every range. The first clause keeps "5 years" correctly: that
is the model's own boundary, not the chart's.

### What went with the lines

`chartReferenceCaption` and `chartGoalAboveNoteTemplate` are deleted - both described the lines, and
D72's amendment that introduced them is superseded here two days after it was written.
`thresholdLabelTemplate` goes, and so do `.growth-chart__threshold-line` and `__threshold-label`.
`rangeHighAmount` and `rangeLowAmount` go with the axis they forced; the second had been dead since
D72 deleted the range figure. `CHART_DEPOSIT_PCTS` is still imported, because the "Why a bigger
deposit helps" card still reads its low and mid values.

**The chart no longer claims any relationship to the goal**, and that is the right reading of it: it
answers "how would my savings build up", the comparison card answers "what would each deposit take",
and the goal block above answers "what am I saving toward". One question each.

### Known costs, recorded not solved

The chips land **below the fold** at both text sizes - 837px at default and 1006px at Large, against
732px visible. That is a discoverability cost, not a layout bug: the chips belong under the heading
they control, and moving them above it would put a chart control on a screen before the chart. Whether
participants find them is what a session will show. `GAPS.md` G89.

### Amended, 30 August 2026: the chart opens at the whole projection, the chips move below it, and the hatch goes

### A compliant grey pair exists, and the hatch was not needed after all

D73 hatched the upper band because the two fills measured 2.67:1 in light and 2.36:1 in dark, under
the 3:1 D70 recorded. That was true of **those two fills**. It was not true of the palette, and the
palette was not searched before the hatch went in.

Every ordered pair of the nine greys was tested against two conditions in both themes: 3:1 against
each other, **and** 3:1 against the plot background. Three pairs clear both:

| Pair | Light | Dark |
|---|---|---|
| `label` / `border-strong` | 5.56 | 3.21 |
| **`label` / `border-control`** | **5.18** | **4.54** |
| `label` / `label-tertiary` | 3.43 | 3.26 |

`--color-label` with `--color-border-control` is the widest and is what the bands now use. The hatch
is gone.

**The second condition is what eliminates everything else, and it is easy to miss.**
`accent-neutral` against `surface-raised` reaches 7.29:1 and 4.86:1 - comfortably apart from each
other - but `surface-raised` is 1.06:1 against the page, so the upper band would have vanished
wherever it did not overlap the lower one. A band has to be visible against the plot, not only
against its neighbour. Every pair that failed, failed on that.

**Both bands changed, not just the upper one.** No pair containing the old `accent-neutral` passes,
so the lower band moved to `--color-label`. The chart is heavier for it, which is a real cost and the
reason to record the measurement rather than the preference.

The legend swatches take the two fills directly, closing `GAPS.md` G90 with colour rather than with
hatch.

### The default is the whole projection, and "To goal" is a chip

The chart opened at five years, which is a window rather than an answer. It now opens at the time the
participant's own projection runs to - `monthsToTarget`, the same figure the tracker's "On track for"
row uses. At the seeded figures that is **126.1 months, so 10 years 7 months**, and the axis reads
Now | 3 yr 7 mo | 7 yr 1 mo | 10 yr 7 mo.

**"No chip selected" was rejected as the default state.** It would leave a group with nothing pressed
and, worse, **no way back**: once a participant pressed 6 mo, the default would be reachable only by
leaving the screen and returning. So the default is a fifth chip, `months: null`, resolved at render.

Its label is not a duration on purpose. At the seeded figures the range is 10 years 7 months, and a
chip reading "10 yr 7 mo" would be unwieldy and different for every participant. "To goal" says what
it is at any figures.

`monthsToTarget` carries a months value even when it reports `beyond-window` (D68), which is exactly
this case - the seeded goal is past the 60-month boundary - so the range reads `.value` rather than
being gated on `.error`. It falls back to the five-year window only when the projection has no figure
at all, which is the unreachable case the chart is not drawn in.

**The early growth is legible, but the two bands are not distinguishable at the left edge.** At the
full range the first bar stands at 18-20% of the plot, against 31% at the old five-year default -
lower, but clearly above the floor, and the rise across twelve bars reads plainly. What does not read
is the gap between the two series in the first few bars: **4.6px of a 240px plot**. That is a property
of two rates that have barely diverged after ten months, not of the range or the colours, and it is
equally true at the five-year view (4.1px). Worth knowing before reading anything into the left of the
chart.

### The chips sit below the chart

A control reads as belonging to what it follows. Above the chart they separated the heading from the
thing the heading names.

Five chips fit **one row at default text and wrap to two at Large** (widths 65/56/58/58/79 and
70/60/62/62/86 against a 350px column). Wrapping is the correct behaviour under the auto-layout rule -
nothing truncates - and costs one row at the larger size only.

**`GAPS.md` G89 is unchanged in substance.** The chips were below the fold above the chart and are
still below it underneath, now further down. The reasoning there stands: they belong with the chart,
and whether participants find them is what a session will show.

**One defect on the way, and it is the third of its kind.** `rangeMonths` was left declared above
`monthsResult`, which it now reads - a temporal dead zone that blanked the screen. `node --check`
passes it and every test passed. Third time this exact failure has been caught by looking rather than
by the suite; the harness gap reported earlier is still the reason.

---

## D74. Every route gets a smoke assertion, because three blank screens got past the whole suite

**Date.** 30 August 2026.

`scripts/smoke.test.mjs`. Thirty routes, one test each, three assertions: the screen raises no error
while it mounts, it puts something into `#app`, and the hash the app settles on is the hash that was
asked for. Nothing about content.

### Why it took three occurrences

| | Defect | Caught by |
|---|---|---|
| D51's third amendment | `mipRowBody` declared after the array consuming it | a screenshot |
| D73 | `rangeMonths` declared after `monthsResult` | a screenshot |
| D73's amendment | the same, again, after that declaration moved | a screenshot |

All three are temporal dead zones. `node --check` passes them - they are valid syntax - and every
existing suite passed, because none of them asks whether a screen rendered at all.

**That was verified rather than assumed.** D51's defect was reintroduced deliberately and
`overlap.test.mjs` returned **72 of 72 passing against a completely blank tracker**. Its assertions
are all of the form "nothing is wrong": no divider crosses text, no box is squashed below its
content. An empty page satisfies every one of them. `action-bar.test.mjs` catches a blank screen only
incidentally, on the routes that have an action bar, and reports it as a covered button.

### What it asserts, and what it deliberately does not

**No content assertions at all.** A smoke test that knows what a screen says has to be updated
whenever the screen changes, and a test that is updated on every change stops being a check and
becomes a chore. This one should need touching only when a route is added - and it does not even need
touching then, because it reads the route list from `router.js` rather than keeping a copy.

**The third assertion earns its place.** A guard that newly rejects a screen which used to render is
the same failure from the participant's side as a screen that throws: they do not arrive. It costs
nothing to check once the seed that makes the route render is already in hand.

**It was verified to fail.** Reintroducing D73's exact defect takes it to 29 of 30, naming
`/calculator/result`. A suite that cannot fail is not coverage - the same test this project applied
to the model tests in D70 and failed at the time.

### Cost

**~29 seconds** for thirty routes, one browser, a fresh context per route. It is the second slowest
suite after `overlap` at ~28s, and it is the one to run first when a screen "does not render" -
recorded in `CLAUDE.md` in those words.

### What it found on the build it was written against: nothing

The reported failure - "See what this means" not reaching frame 12 - **does not reproduce at
`f9dfa33`**. All thirty routes pass. The full calculator flow was then driven end to end in a fresh
tab with no seed at all - frame 09, a typed £450,000, the 10% chip, Continue, Continue, "See what
this means" - and frame 12 rendered, titled "Your deposit would be £45,000".

Frame 12 was additionally exercised in seven states, since one seed cannot reach them all: within the
window, beyond it, unreachable, `monthly-low` at zero, a typed 12%, 25%, and with a range chip
preset. No errors in any.

**No committed build has the defect either.** The declaration order in `calculator-result.js` was
checked across the last twelve commits on `build`: `rangeMonths` sits above `monthsResult` only in
`5124e41`, where it did not yet read it. Both temporal dead zones existed in the working tree and
were fixed before the commit that would have carried them.

**`origin/main` was checked too, in a worktree, and passes 28 of 28.** It is **sixteen commits
behind** `origin/build`, still at `4a627bc` - the state before the stamp duty work began. If the
participant URL serves the production branch, it is serving a build from before any of this, which
would explain a frame 12 that does not look like the current one. It would not explain one that fails
to render, because that build's frame 12 renders.

So the cause is environmental rather than in the code, and this repo already documents both
candidates at length: a tab holding a session from before a deploy (`ROUTES.md`'s "After a deploy,
before the first participant", D49, D59, `GAPS.md` G66), or a deployment serving an older commit
(D58). `#/settings`'s footer reports the running build, which is the fastest way to tell them apart.

### One real defect found while looking

`chartRangeMonths` had been added **inside `COLLAPSIBLE_DEFAULTS`** in `state.js`. That object is
reset by `resetCollapsibles()` on every hash-driven navigation (D12), so a range the participant had
chosen was silently discarded the moment they opened a sheet and came back - the chip returned to "To
goal" with nothing to say why. It is a view setting, not a disclosure, and now sits with `theme` and
`textSize`, which persist for the session exactly as it should.

Not the reported failure, and not a crash. Found because a variant check showed a session seeded to
six months rendering byte-identically to the default.

### Amended, 30 August 2026: the fifth chip is "Max", and four accessible names were breaching 2.5.3

"To goal" becomes **"Max"**. One content key, `chartRangeLabels` in `content.js` - every other
occurrence of the old label was a code comment or this file, so nothing else on the screen named it.

**The live region is unaffected**, and by construction rather than by luck. It interpolates
`formatMonthsDuration(rangeMonths)` - a duration, not the chip's label - so it announces "Showing 10
years 7 months. Savings reach £61,428." whichever word is on the chip. That is also the better
behaviour: "Max" would tell a screen-reader participant nothing about what they are now looking at.

### Four of the five accessible names failed WCAG 2.5.3, and were fixed with the rename

Checking the new label against Label in Name showed the existing four were already breaching it.
`aria-label` REPLACES a button's text for the accessible name, so a speech-input participant saying
"click 5 yr" could not activate a button named "Show 5 years":

| Visible | Old accessible name | 2.5.3 |
|---|---|---|
| `6 mo` | "Show 6 months" | passes, by accident - it is a prefix of "6 months" |
| `1 yr` | "Show 1 year" | **fails** |
| `3 yr` | "Show 3 years" | **fails** |
| `5 yr` | "Show 5 years" | **fails** |
| `To goal` | "Show the whole time to your goal" | **fails** |

Each name now opens with its visible label and elaborates after a comma: "1 yr, one year", "5 yr,
five years", "Max, the whole time to reach your goal". All five pass, verified from the rendered DOM.

Fixed across all five rather than only the renamed one, under CLAUDE.md's rule that a correction
applies everywhere the same pattern appears. Leaving three known breaches beside one freshly written
compliant name would have been the worse outcome.

"Max" needs the longest elaboration of the five, because the abbreviation says nothing at all about
the range. It still names no duration: the range is the participant's own projection and differs for
each of them.

### It now fits one row at Large text, by nothing at all

The row was measured at 65/56/58/58/**79** with "To goal", wrapping to two rows at Large. "Max" is
19px narrower at default and 22px at Large, which is exactly what was missing:

| | Widths | Span | Rows |
|---|---|---|---|
| Default | 65/56/58/58/60 | 330px | **1** |
| Large | 70/60/62/62/64 | **350px** | **1** |

At Large the row spans 350px in a 350px column - **zero margin**. It fits, and it would stop fitting
on any change that widened a chip by a pixel: a longer label, a wider gap, a font substitution on a
device that lacks the loaded face. Recorded because "it fits at Large" is true today and fragile, and
the next person to touch these labels should know they have no room.

---

## D75. The chips are uppercased in CSS, and that is the only one of the four changes that could be made

**Date.** 30 August 2026. Four changes were asked of the shared chip component; one was already done,
one is applied here, and two are reported rather than applied because they need a decision that is
not mine.

### Uppercase: no rule forbids it, and it is still a first

**Neither `DESIGN.md` nor `CLAUDE.md` carries a sentence-case rule.** The only case rule anywhere is
`fca-copy-check`'s rule 8 - "Title Case in headings or buttons where sentence case is required" -
which is about Title Case rather than uppercase, and is conditional on a requirement stated nowhere.
So there is nothing to breach and no reason to stop.

Two things are worth recording anyway. `DESIGN.md` names Apple's Human Interface Guidelines as the
design language, and HIG sets controls in sentence case. And there is **no `text-transform` anywhere
else in `src/css`** - this is the first, so it is a new idiom rather than an application of an
existing one.

**It is done in CSS and never in the strings.** `content.js` still holds "6 mo" and the accessible
names still read "6 mo, six months", so the copy and the announced name stay in sentence case. Every
chip carrying letters also carries an `ariaLabel`, so the accessible name is computed from that and
cannot pick up the transform - which matters, because a screen reader given an uppercased string can
spell it out letter by letter.

**It changes one of the two screens.** Frame 09's chips are "5%" through "25%" - no letters, so
`text-transform: uppercase` leaves them pixel-identical, confirmed by screenshot. Only frame 12's
range chips change. A shared-component change with a visible effect on exactly one consumer.

### This is a recorded departure from the design language, not an accident

Written down because it is the kind of thing that is otherwise found months later and mistaken for
drift. Four facts, in the order someone re-reading this will want them:

1. **No rule forbade it.** `DESIGN.md` and `CLAUDE.md` carry no sentence-case rule, and
   `fca-copy-check`'s rule 8 governs Title Case, not uppercase.
2. **It still departs from the stated design language.** `DESIGN.md`'s section on styling names
   Apple's Human Interface Guidelines, which set controls in sentence case, and this is the **first
   `text-transform` in `src/css`** - so it is a new idiom, not an application of an existing one.
3. **The strings and the accessible names stay sentence case.** The transform is presentational only.
   `content.js` holds "6 mo"; the accessible name is "6 mo, six months"; a screen reader never
   receives an uppercased string, which matters because some announce those letter by letter.
4. **It is visible on one of the component's two consumers.** Frame 09's chips are numeric and
   render identically.

If the design language is ever enforced mechanically, this rule is the exception to declare rather
than the drift to clean up.

**It costs a row, and that is a real regression.** Uppercase glyphs are wider, so the range chips grew
from 65/56/58/58/60 to 68/61/63/63/64 - 351px of gaps and chips against a 350px column. The row that
fitted on one line at default text now **wraps, orphaning MAX alone on a second row**. At Large it
was already wrapping. Nothing truncates, so the auto-layout rule is satisfied, but the row reads worse
than it did.

The fix for that is the padding reduction reported below and not applied, which would return about
40px across the five chips - more than enough to restore one line.

### The chip is already at the floor, so it cannot be made shorter

Measured: **48px tall**, from `min-height: var(--touch-target-min)`. Its content needs only 36px - an
18px line box, 16px of vertical padding, 2px of border - so the last 12px is the touch target and
nothing else. `DESIGN.md`'s rule 2 forbids shrinking a control below 48px and forbids it in terms
("Never shrink a target to match Figma"), so **a shorter chip is not available**.

Of the three ways to make it read lighter without touching the target:

- **Reduced horizontal padding**, `--space-lg` to `--space-md`, 16px to 12px. Narrows each chip by
  8px and takes about 40px out of the row, which also undoes the wrap uppercase introduced. The only
  one of the three with no cost recorded against it.
- **A lighter border must not happen.** `--color-border-subtle` measures **1.29:1** against the chip
  fill in light and 1.45:1 in dark, against WCAG 1.4.11's 3:1. The current `--color-border-control`
  measures 3.45:1 and 3.75:1, and the comment above the rule records that it was chosen in the
  accessibility pass for exactly this reason: an unselected chip's fill matches its surroundings, so
  the border is the only thing marking its boundary.
- **A smaller corner radius** takes the chip from a pill to a rounded rectangle. That is a change of
  shape rather than of weight, and a rectangle generally reads heavier than a pill, so it works
  against the stated aim.

### The abbreviation is not changed again

"mo" to "m" was asked for and is reported rather than applied, because this abbreviation has now
moved three times in two days - "mo" to "mon" to "mo" - and the last move was a revert of the one
before it. The call sites are two, both on frame 12, and the `yr`/`y` question that comes with it is a
separate decision about whether the pair should stay two letters or both become one. Both are set out
in the handover rather than guessed at.

### Amended, 30 August 2026: the padding came down, and the row fits again

`--space-lg` to `--space-md` on the horizontal axis only - 16px to 12px, returning 8px per chip. It
was chosen over the two alternatives for reasons already measured: a lighter border would have taken
the only cue marking an unselected chip's boundary from 3.45:1 to **1.29:1** against WCAG 1.4.11's
3:1, and a smaller radius changes the shape rather than the weight.

**The 48px height is untouched.** Only `padding-left` and `padding-right` moved; `min-height` is still
`var(--touch-target-min)` and every chip still measures 48px, verified on both screens at both text
sizes.

**Every chip row now fits one line**, measured against the 350px column:

| | Widths | Total with gaps | Rows |
|---|---|---|---|
| Frame 09, default | 48/53/53/55/55 | 296px | 1 |
| Frame 09, Large | 50/57/57/59/59 | **315px** | 1 |
| Frame 12, default | 60/53/55/55/56 | 311px | 1 |
| Frame 12, Large | 65/57/60/60/60 | **334px** | 1 |

That undoes the wrap uppercase introduced on frame 12 at default text, and it also fixes one that was
there before either change: **frame 09's chips were wrapping at Large text already**, at 58/65/65/67/67,
and nothing had reported it. The measurement was taken to check this change and found the older
problem on the way.

The tightest case is now frame 12 at Large with 16px to spare, against zero before. Still not
generous, and the reason the note about a knife-edge fit stays on the record above.

### Amended, 30 August 2026: the chip row spans the column, and the height stays

**The row was left-packed with slack at the end** - `display: flex` with the chips at their natural
widths, leaving up to 54px unused on frame 09 at default text. `flex: 1 1 auto` on the chip shares
that slack between them, so the row now fills the 350px content column exactly, measured at zero slack
on both screens at both text sizes.

**`auto` rather than `0`, and the first attempt proved why.** `flex: 1 1 0` makes every chip the same
width - 64px for five in a 350px column - and the widest label does not fit it: "6 MO" needs 39px of
text at Large against a 38px content box, so the label wrapped and the chip grew to **59px**, taking
the row off the 48px it exists to hold. With `auto` the flex base is the content and only the slack is
shared, so widths vary a little with label length (57-68px measured) and nothing wraps.

That is a slightly weaker reading of "spaced equally" - the chips are not identical widths - but the
stronger reading cannot be had without either a wrapped label or a chip below the touch target.

**Wrapping is kept as a safety net rather than a layout.** With the chips flexing, a partly-filled
second row would stretch its chips to fill it, and a single leftover chip would be drawn full width -
a button, not a chip. Nothing wraps at either supported text size, so the case is unreachable today;
`nowrap` was rejected because the alternative failure is chips shrinking under their own 48px floor,
which is worse.

### The height stays at 48px, and the text is nowhere near the edges

Checked before deciding, across all twenty chips on both screens at both text sizes. The **smallest
clearance anywhere is 13px horizontally and 15px vertically**, against a 48px box holding a 15-18px
line of text. Nothing crowds, nothing overlaps, and nothing is close to doing so.

So the height is left alone, which is also what `DESIGN.md`'s rule 2 requires: the content needs 36px
and the last 12px is the touch target. There is no visual problem to solve here, and the only change
available would have been one the rules forbid.

**Nothing further was changed for weight.** With the row spanning the column the chips read as a
segmented control rather than as five separate pills, which is heavier in area but more legible as one
control. The remaining levers - font weight, fill, radius - were not touched, because none of them was
asked for and the border and touch target are both fixed by measurements already recorded.

### Amended, 30 August 2026: the "Max" range had no floor and no guard, and the points collapsed

Four defects, all in how the chart's range was resolved, none of which any test could see because
every one of them rendered a chart.

**`Math.ceil(monthsResult.value)` was doing too much work.** It took whatever `monthsToTarget`
returned and made it the window, and that function returns three things the range could not use:

| Savings position | `monthsToTarget` | What the chart drew |
|---|---|---|
| £52,000 of £52,500 | 1.2 | A 2-month window - **narrower than the "6 mo" chip beside it** - with twelve sample points collapsed onto three distinct months, every bar at 87-89% of the plot and the upper band 0-1px |
| £52,500 (met) | **0** | Falsy, so it fell through to the five-year fallback **by accident rather than by decision** |
| £60,000 (passed) | **-17.5** | `Math.ceil` gave -17, and the chart **projected backwards**: bars descending, an x-axis of "Now, 0 mo, 0 mo, 0 mo", no upper band, and a live region announcing **£51,808 to a participant holding £60,000** |

**The floor is six months, and it is the shortest chip.** `CHART_MIN_RANGE_MONTHS` in `rates.js`. The
reasoning is not about readability: a chip labelled "the whole time to reach your goal" drawing a
NARROWER window than the chip labelled "6 mo" next to it is incoherent whatever it is measuring. The
constant carries a note that it must come down if `chartRangeLabels` ever offers something shorter.

**Once the goal is met the chip is not offered at all.** "The whole time to reach your goal" names
nothing when the goal is behind them, and the alternatives were worse: keeping the chip and giving it
a different meaning makes the label lie, and keeping it with a fallback range makes it lie more
quietly. The chart itself stays - "how your savings would build up" is still a real question - so the
row becomes the four durations and the selection falls to five years. The stored `null` would
otherwise match nothing, so the fallback is marked instead and the row is never left with no chip
pressed.

The truthy test became `> 0` on the same pass. Exactly-at-goal returning 0 was reaching the fallback
by accident, and an accident that happens to produce the right answer is still going to produce a
wrong one eventually.

**Twelve points became `Math.min(12, rangeMonths)`.** `Math.round(i * rangeMonths / 12)` duplicates
whenever the range is under twelve, so the "6 mo" chip drew **twelve bars in six identical pairs** at
every savings position, not only near the goal. One point per month at short ranges; the bars get
wider and nothing else changes.

### The regression coverage is a separate file, and why

`scripts/chart-range.test.mjs`, seven tests, about 14 seconds. **Not part of `smoke.test.mjs`**, and
the reason is the point: every one of these states rendered. The screen mounted, `#app` filled,
nothing threw, the route resolved - so all three smoke assertions passed while the chart drew a
descending series and announced a balance lower than the participant's own. A chart can be wrong in
every particular and still be a chart.

It asserts SHAPE rather than figures - bars distinct and rising, x-axis labels distinct, the
announcement never below the starting balance - so it catches the defects without becoming a
change-detector that has to be updated whenever the axis rescales.

**One of the seven was wrong when first written**, and worth recording: the floor was asserted by
counting twelve bars, which the floor does not produce - a six-month range draws six. It now asserts
the floor by comparing the "Max" axis against the "6 mo" axis directly, which is the property that
actually matters.

---

## D76. The press that was swallowed, and three stale assertions that hid a real defect

**Date.** 30 August 2026.

### A participant who typed and then tapped had to tap twice

On frames 09 and 11, pressing the primary button while a field still had focus did nothing the first
time. The sequence: mousedown blurs the field, its `change` handler commits and calls
`rerenderInPlace`, which replaces the whole of `#app`, mouseup lands on a node that no longer exists,
and no `click` is ever dispatched. **The edit committed correctly** - only the button appeared dead.

Reproduced 6 times out of 6 on frame 11 and confirmed on frame 09. Tapping a neutral part of the
screen first, then the button, worked every time - which is why no test caught it: every test in
`inline-edit.test.mjs` blurs the field before pressing anything, and a participant does not.

### The two candidate fixes, and why the obvious one is a trap

**Committing on `input` instead of `change`** was rejected before it was tried. Every keystroke would
write to state and re-render, so typing "450000" commits property values of 4, 45, 450, 4500 and
45000 on the way - and D46 exists precisely to stop a half-typed field writing a figure, which is why
`propertyValueCleared` and its four siblings are in the store at all. It would also re-run
`rerenderInPlace`'s focus and caret restoration on every character, and flash frame 11's 5-to-25
deposit-percentage error at "1" on the way to "15".

**Deferring the re-render** was tried, measured, and rejected on the measurement:

| | Instant synthetic tap | Held 80ms | Held 200ms |
|---|---|---|---|
| `setTimeout(..., 0)` around the re-render | **4/4 pass** | **0/3** | **0/3** |

A real finger tap is 50-150ms. **The deferral would have looked correct in the harness and been broken
for every participant** - the same "passes because a timer happened to be long enough" failure this
project has now hit four times, this time inside the proposed fix. It is recorded because it is the
answer that looks right.

### What was built instead: the blur never happens

`keepPressAlive(container)` in `ui.js`, two listeners on the screen container:

- **`mousedown`** - `preventDefault()` while a field has focus, so the press never moves focus, the
  field never blurs, `change` never fires and nothing re-renders. The button survives the press.
- **`click`, capture phase** - flush the still-focused field by dispatching the `change` it never got,
  so the value is committed before the button's own handler reads state. Capture, because the flush
  re-renders and detaches the button mid-event; the click is already in flight and its listener is on
  that node, so the handler still runs.

**Bound to the container, not to named buttons**, so every typed field and every control on the
screen inherits it and a field added later cannot reintroduce the defect by being forgotten.

Verified across **all five typed fields on frame 11 and frame 09's field, at hold durations of 0, 80
and 200ms: 18 of 18**.

### Three stale assertions, not two, and the third was hidden

All three came from `8ae7964` (D67, varying the duplicated explanatory clusters), which changed copy
and did not update the tests. They are updated to the current strings rather than the copy reverted,
because D67's change was deliberate.

| Assertion | Expected | Actually renders |
|---|---|---|
| the two tautological captions | "Read from the accounts you assigned to your deposit" | "The total sitting in the accounts you picked for your deposit" |
| a typed Saved so far | same string | same |
| **the tax row still says where it came from** | "Worked out from your salary" | **"Based on what you earn"** |

**The third was invisible until the first was fixed** - the test failed on the earlier assertion and
never reached it. "Worked out from your salary" is `/calculator/saving`'s key, a different screen's.
So the count carried for a dozen sessions was wrong in both directions: three stale, not two, and the
remaining failure is not stale at all.

### The fixed wait is gone, and the first replacement was also wrong

`typeInto` waited 50ms after the blur. It now waits on the re-render having happened, detected by
stamping the field's node and waiting for a different node to carry the role.

**The first attempt waited for the field to redisplay what was typed, and hung on every clamping
field**: typing 900 into the lower monthly figure commits 600, so the value never equals the input
and the wait timed out at 30 seconds. Recorded because it is the obvious condition and it is wrong.

### Coverage for the real interaction

Five tests, one per typed field on frame 11: type, then press the CTA with **no intervening tap**,
holding 150ms, and assert navigation on the first press. Driven through the mouse API rather than
`locator.click()` so the press and release are separate events with a real gap - an instantaneous
synthetic click does not reproduce the defect, and a fix that satisfied only that would have shipped.

**One failure remains and it is not fixed**: `GAPS.md` G91 records it, with the evidence that it is a
harness isolation problem rather than an app defect and the three wrong hypotheses already eliminated.

---

## D77. Five tests that passed for the wrong reason: a finding about test validity in this build

**Date.** 30 August 2026. Drawn together from D70, D73, D74 and D76, which each recorded one instance
without seeing the pattern.

This entry exists because the same failure occurred five times in two days, was recorded five separate
times as five separate mistakes, and is one mistake. It is written as a finding rather than as a list
of fixes because the useful part is the shape, not the repairs.

### The shape

**An assertion that cannot fail is not coverage, and an assertion that passes for a reason unrelated
to what it claims to test is worse than none** - because it is counted. Both forms were present here,
and the second is the dangerous one: a suite reporting 300 passes carries the authority of 300
checks, and nobody re-reads a green line.

Every one of the five below was green. Four of the five were green while the thing they named was
broken.

### The five

**1. A suite that could not exercise the change it was guarding (D70).** Every existing model test
used a £190,000 property. First-time buyer stamp duty at £190,000 is **£0**, so `combined-goal` and
`deposit-target` are the same number there. Adding stamp duty to the goal - a change that redefined
what the app is saving toward - left all 43 tests passing, not because the change was safe but because
the fixture could not tell the two figures apart. *Caught by asking why nothing failed.* The fixture
was moved to £450,000, where the tax is £7,500 and the two figures diverge.

**2. Assertions of the form "nothing is wrong" (D74).** `overlap.test.mjs` asserts that no divider
crosses text and no box is squashed below its content. An empty page satisfies both perfectly. When a
temporal dead zone blanked the tracker, the suite returned **72 of 72 passing against a completely
blank screen** - verified by reintroducing the defect deliberately rather than assumed. *Caught by
looking at a screenshot.* `smoke.test.mjs` was added in response: thirty routes, asserting only that
each mounts, renders something and throws nothing.

**3. An assertion testing a property the code does not have (D73).** A new test asserted the chart's
range floor by counting twelve bars. The floor is six months, and a six-month range draws **six**
bars - so the assertion encoded a belief about the fix rather than the requirement, and failed on
correct code. It now compares the "Max" axis against the "6 mo" axis directly, which is the property
that actually matters. *Caught by the test failing, which is the one case in five where the mechanism
worked.*

**4. A wait long enough to hide a defect (D76).** `inline-edit.test.mjs` waited a fixed 50ms after a
field commit. That made one test load-sensitive - it failed roughly three runs in five inside the full
suite and passed six of six alone - and the flakiness was carried for a dozen sessions described as a
stale assertion. Investigating it found a **real defect on the main participant path**: pressing the
primary button while a field had focus did nothing, because the blur committed, the commit
re-rendered, and the button the press began on no longer existed when the finger came up. Two presses
were needed, on frames 09 and 11. *Caught by driving the real interaction* - every existing test
blurred the field first, and a participant does not.

**5. A fix that would have passed the harness and failed every participant (D76).** The obvious repair
for (4) was to defer the re-render. Measured before shipping:

| | Instant synthetic tap | Held 80ms | Held 200ms |
|---|---|---|---|
| `setTimeout(..., 0)` | **4 / 4 pass** | **0 / 3** | **0 / 3** |

A real finger tap is 50-150ms. The deferral repairs the synthetic click the harness produces and
nothing a person does. Had it been verified the way the rest of the suite verifies things, it would
have shipped as fixed. *Caught by holding the tap.*

### What the five have in common

Three were caught by a person looking at a rendered screen or driving the interaction by hand. One was
caught by asking why a change had not broken anything. One was caught by the suite.

That ratio is the finding. The tests in this build are good at asserting **relationships between
figures** - the model suite is dense and has caught real arithmetic errors - and weak at asserting
that **anything appeared on screen at all**, because the layout suites were written to catch overlap
and answer "is anything wrong with what is drawn", which an empty page answers correctly.

There is a second, subtler pattern in (1), (4) and (5): **the fixture or the harness was gentler than
reality.** A property value with no tax, a synthetic click with no duration, a wait long enough on an
idle machine. Each made the test easier to pass than the thing it stood for, and each difference was
invisible until something else exposed it.

### What changed as a result

Two suites were added, both deliberately narrow:

- **`smoke.test.mjs`** - every route mounts, renders non-empty content, throws nothing, and lands on
  the hash asked for. No content assertions at all, so it cannot rot into a change-detector.
- **`chart-range.test.mjs`** - frame 12's chart at savings positions near, at and past the goal.
  Separate from the smoke test *because all four of those states rendered perfectly well* while the
  chart drew a descending series and announced a balance lower than the participant's own. A chart can
  be wrong in every particular and still be a chart.

And one habit, which matters more than either file: **reintroduce the defect and confirm the test
fails.** It was applied to the smoke test (29 of 30 with a dead zone restored, naming the route) and
to overlap (72 of 72 against a blank screen, which is how the gap was proved rather than argued). A
test whose failure has never been observed is a claim, not a check.

### The limit of this finding

It does not generalise to "write more tests". Three of the five were found by a person looking, and
no amount of assertion would have replaced that: a screenshot showed a bar chart with a 26.4% curve, a
held tap showed a dead button. What it argues for is narrower - **know what each assertion would have
to see to fail, and check that it can** - and for keeping a cheap manual pass in the loop, because on
this project it out-performed the suite four times out of five.

---

## D78. The error banner gets an error icon, and tells a screen reader why Continue is dead

**Date.** 30 August 2026.

### The defect

Frame 11's ceiling-breach banner drew an **information icon** while being an error: red border, red
text, "See what this means" disabled. Every other banner of the same class did too - the icon was
`infoCircle` in `warningBannerHTML` and `infoCircle` in `infoBannerHTML`, the same glyph in both, so
the only thing separating an error from a note was colour.

That is a WCAG 1.4.1 failure and not a cosmetic one. A participant who cannot separate red from grey
met the same symbol in both places and had nothing else to go on. The measured contrast made it
worse in the dark palette: the icon inherited `--color-label` from `body`, where `.theme-dark`'s
override does not reach, so it drew **#17171c on #1c1c1e - 1.05:1**, against 1.4.11's 3:1 for
non-text content. It was invisible in the state that most needed to be seen.

### What was checked before anything changed

**`warningBannerHTML` and `infoBannerHTML` are already separate components, and every one of the
seven `warningBannerHTML` call sites is an error that disables the screen's primary action.** Listed
in full, because the point of listing them was to find out whether the change could be scoped:

| Screen | State | Primary action |
| --- | --- | --- |
| 05 `/position` | left over above money in | Continue disabled |
| 05 `/position` | left over at or below zero | Continue disabled |
| 09 `/calculator/property` | a property value the model rejects | Continue disabled |
| 10 `/calculator/saving` | the range above what is left over | Continue disabled |
| 10b `/calculator/saving` | a target date behind today | Continue disabled |
| 11 `/calculator/review` | the property row | Work it out disabled |
| 11 `/calculator/review` | the deposit % row | Work it out disabled |
| 11 `/calculator/review` | the monthly range row | Work it out disabled |

There is no soft-warning call site, and no call site where the banner sits beside an enabled button.
So this is not a component serving two purposes that needed splitting: the two banners were already
distinct in everything except the glyph, which is the one thing they shared and the one thing
changed. No informational banner is touched, in either theme - verified in a browser, not reasoned
about.

### The decision

**The error banner draws `exclamationTriangle`, in `--color-warning`.** The icon already existed in
`icons.js` (drawn for the MCOB risk-warning card) so nothing new was added to the set. It is a
different SHAPE, not a recoloured circle, which is what 1.4.1 asks for; the colour is what puts it in
agreement with the border and the text it sits beside rather than what carries the meaning.

Measured against the banner's own `--color-surface` background:

| | before | after | 1.4.11 needs |
| --- | --- | --- | --- |
| Light `#d63228` on `#ffffff` | 17.86:1 (`#17171c`) | **4.83:1** | 3:1 |
| Dark `#ff453a` on `#1c1c1e` | 1.05:1 (`#17171c`) | **4.99:1** | 3:1 |

The light figure goes down and that is correct: it was high because the icon was the wrong colour,
not because it was well designed. Both now clear the threshold, and the dark one clears it for the
first time.

### The accessible role, which was the larger half

The banner had **no role at all**. Every screen here re-renders by replacing `container.innerHTML`,
so the banner is inserted after load - and an inserted `<div>` with no live-region role announces
nothing. A participant using a screen reader met a Continue that had silently gone dead, with no
announcement of the error and nothing on the button saying why.

Two changes, both scoped to the error variant:

1. **`role="alert"` on the banner.** It is inserted by a re-render, which is exactly the case the
   role exists for. It re-announces on each re-render while the error stands, which is correct: the
   error is still true.
2. **`aria-describedby` from the disabled primary button to the banner.** `actionBarHTML` takes a
   `primaryDescribedBy`, accepts a list, and renders nothing when there is none - so no screen emits
   a dangling reference to a banner it did not draw. Frame 11 names all three of its banners, because
   it is the one screen that can raise more than one at a time.

**The button keeps `disabled` rather than moving to `aria-disabled`.** Swapping them would make the
button focusable by Tab and would need a click guard on every screen using the shared component - a
change to twenty screens and seven sheets, for a benefit the mobile screen readers this study
actually runs on do not need: VoiceOver and TalkBack both reach a disabled button by swipe and read
its description. A draft deliberately contributes no `describedby`: an empty field disables the
button *without* raising a banner, because nothing is wrong yet (D46), and there is nothing to point
at.

### What was NOT done, and why it is recorded here

**The informational banner's icon is still `#17171c` in the dark palette** - 1.18:1 on `#000000`,
the same inherited-colour mechanism described above. It is out of this change's scope by
construction: the brief was to separate the error variant, and recolouring the informational banner
would be the blanket change it ruled out. The dark palette is also not currently selectable (frame
33 offers Greyscale and Brand only; see `tokens.css`). Recorded so it is not lost.

### Verification

`shots.mjs` gained `--error`, naming the error states above and seeding the out-of-range FIGURE
rather than the error, so the screen's own validation raises the banner and a shot cannot show an
error the app would not itself draw. 36 shots: all eight states plus frame 11's three-at-once, each
in two themes at two text sizes, and two informational shots for comparison. Full suite: 353 tests, 352 passing, 1 skipped (G91), 0
failing.

---

## D79. The informational banner's icon names its colour, which closes D78's one exception

**Date.** 30 August 2026. Closes the exception recorded at the foot of D78.

### What was wrong

`infoBannerHTML`'s icon declared no colour. Every icon in this build is stroked in `currentColor`, so
it took the computed colour of the nearest ancestor that declares one - and that ancestor was `body`.
`body { color: var(--color-label) }` sits **outside `.screen`**, which is where `.theme-dark` applies
its palette, so the custom property resolved to the light value there and every descendant inherited
the literal `#17171c`.

In the dark palette the informational banner therefore drew a near-black glyph on `--color-bg`
`#000000`: **1.18:1**, against WCAG 1.4.11's 3:1 for non-text content. The icon was effectively
invisible while its own text beside it was white.

### Why this is not the blanket change D78 ruled out

D78 declined to touch informational banners because the change on the table was the **glyph** - giving
them the error triangle would have erased the shape difference WCAG 1.4.1 requires between an error and
a note. That reasoning does not reach a colour declaration. The glyph is unchanged: the informational
banner still draws `infoCircle`, the error banner still draws `exclamationTriangle`, and the two remain
different shapes rather than two colours of one shape.

What changed is an inherited value that was never chosen. Nothing decided that this icon should be
`#17171c` in the dark palette; it fell out of where a custom property happened to resolve.

### The decision

**`.info-banner__icon { color: var(--color-label) }`** - the token its own text already uses, declared
inside `.screen` so the theme override reaches it. No token was added. This is the same move D78 made
on the error banner for the same reason: there, the icon takes `--color-warning` because the border and
the text already do.

Measured against the banner's own background, which is `--color-bg` and not `--color-surface` (that is
the error banner's ground):

| | before | after | 1.4.11 needs |
| --- | --- | --- | --- |
| Light, on `#f7f7f8` | 16.68:1 | **16.68:1** (unchanged) | 3:1 |
| Dark, on `#000000` | **1.18:1** | **21.00:1** | 3:1 |

Light is untouched by construction: the token already resolved to `#17171c` there, so naming it changes
nothing. The fix is entirely a dark-palette one.

### Why it was worth doing while the dark palette is unselectable

Frame 33 offers Greyscale and Brand, so no participant can reach this (`tokens.css`). That makes it
**cheap to fix rather than safe to leave**: the palette is defined, measured and kept precisely so its
measurements are not lost, and a token left resolving outside its own theme is a defect that would ship
the moment the palette became selectable.

### Thirteen other icon contexts have the same defect, and are NOT fixed here

Audited by rendering all thirty routes in the dark palette and reporting every `svg.icon` whose
computed colour is the light `--color-label`. Recorded so the list exists; fixing them is a wider pass
than this one and was not asked for.

**One of the thirteen has since been promoted to its own gap entry. The other twelve stay here.**

| Icon | Context | Ground | Ratio |
| --- | --- | --- | --- |
| `exclamationTriangle` | `.risk-warning-card__icon` | `#1c1c1e` | 1.05:1 - **now GAPS.md G95** |
| `checkmarkCircle` | `.result-panel__icon`, `.tick-list__icon` | `#1c1c1e` | 1.05:1 |
| `arrowUp` | `.result-panel__icon` | `#1c1c1e` | 1.05:1 |
| `chevronRight` | `.list-row__chevron` | `#1c1c1e` / `#000000` | 1.05:1 / 1.18:1 |
| `playCircle` | `.media-placeholder__icon` | `#2c2c2e` | 1.28:1 |
| `starCircle` | `.goal-row__icon` | `#000000` | 1.18:1 |
| `starCircleFill`, `starCircleDashed` | `.milestone-row__icon` | `#000000` | 1.18:1 |
| `checkmarkCircle`, `arrowUpRight`, `photo` | no context class | `#000000` | 1.18:1 |

**30 AUGUST 2026: the risk-warning row moved to `GAPS.md` G95, and the record with it.** Its entry
here is now a pointer, not the record. This audit found it as one of thirteen contrast failures, which
is what it is measured as - but on seven of the eight screens it appears on, the glyph it fails to draw
is the one marking the MCOB 3A repossession warning as a warning, which makes it a Consumer Duty
consumer understanding question as well as a WCAG 1.4.11 one. That dimension is the reason it is a gap
of its own rather than a row in this table. See G95 for the eight screens and the argument.

**The other twelve remain recorded here and are deliberately not promoted.** They are contrast
failures on non-text content - chevrons, tick marks, milestone stars, a media placeholder - with no
regulatory dimension, and they belong together as one pass rather than as twelve entries. Fixing them
is still a wider pass than D79 was.

---

## D80. The ceiling applies to both paths through step 2, and the figure it refuses is now on screen

**Date.** 30 August 2026. Closes `GAPS.md` G64 and G65, which close together or not at all.

### The defect, in one line

Frame 10's slider path measured every input against `left-over` and refused anything above it. Frame
10b's date path solved a monthly amount from the chosen date - `monthlyAmountFromDate` is unbounded
by construction, a nearer date simply means a larger payment - and committed it. **Step 2 let a
participant leave with a figure the application already knew was impossible, and step 3 refused it.**
The ceiling was enforced in three of the four places it could be, and missing from the one path that
can generate a figure past it.

Worse, and this is why the two gaps could not be closed separately: the date path computed
`previewAmount` on every render and read it in exactly one place, the Continue handler. **It was never
shown.** So a participant could not notice that £1,861 was more than they had left over, because the
screen never said £1,861.

### Option C, and why the other two were declined

Three options were put forward. All three stop the impossible figure reaching step 3; they differ in
what the participant loses.

| | What they see | What they lose | D46 |
| --- | --- | --- | --- |
| A. Clamp on entering monthly-amount mode | The range snaps to at or under the ceiling as the segment changes | Their date. The screen then shows an amount that does not reach it, with nothing saying so, and `savings-rate` silently disagrees with the `targetMonth`/`targetYear` still in the store | **Fails.** The silent replacement D46 exists to prevent - and worse than G74's clamp, because the participant did not type this figure and is not looking at the field it lands in |
| B. Reset to the seeded range | The seeded £200-£310 in place of their range, unannounced | Both the date and the amount, replaced by something they never chose | **Fails**, more plainly: it lands on a seeded constant rather than on a bound they set themselves, which is the one mitigation G74 records for the clamps that already exist |
| **C. Leave the values, raise the error in target-date mode** | Their date, the amount it implies, and a banner saying why it cannot go forward | Nothing | **Satisfied.** Nothing is discarded, so nothing needs making visible |

**C was chosen.** It is the only one that discards nothing, it needs no new state key, and it makes
the two paths through one screen accept and refuse the same figures rather than giving one of them its
own rules.

**Nothing is written on this path, and that is the invariant to protect.** While the error stands,
Continue is disabled and its handler returns early, so `savings-rate`, `monthly-low` and
`monthly-high` keep whatever the participant last committed. `date-ceiling.test.mjs` asserts it by
clicking the disabled button through the DOM - past Playwright's actionability check - so both the
attribute and the handler's own guard are tested. If a future change finds itself writing one of those
three keys on this path, it is no longer option C.

### Raised in target-date mode, not on the segment switch

The check sits in the `else if (!yearCleared)` branch that already raised `errorPastDate`. Raising it
on the segment switch instead would put the error on a screen the participant had just left, about a
control they were no longer looking at - and it would still leave the date path free to commit the
figure on its own Continue.

### The earliest workable date

Refusing a date without naming one that works moves the failure a screen earlier rather than fixing
it. `monthsToReachAmount({ startingBalance: saved, targetAmount: the goal, monthlyAmount: left-over })`
already existed in `model.js` and is `monthlyAmountFromDate`'s exact inverse over the same annuity-due
equation, so the month it returns is precisely the point at which the solved amount stops exceeding
the ceiling. Rounded UP, D2's own rule: a date earlier than the maths gives is a date that does not
work.

**The goal is derived, not read from the store.** `monthlyAmountFromDate` already derives
`combinedGoal(state)` live, so deriving it again for the earliest date keeps the amount and the date in
one source. Reading the stored `combined-goal` beside a live-derived amount is exactly the
live-versus-stored split `CLAUDE.md`'s state rules and D38's third amendment name; the two would
eventually disagree, and the error would name a date that did not match the figure above it.

### The readout, and the deviation from reference PNG 10b

`previewAmount` is now rendered. **Reference PNG 10b draws no readout**, and G65 was right that the
build was faithful to it. The deviation is recorded rather than hidden, and the reason it is a
deviation worth taking is that **the frame predates the ceiling check existing**. Its silence was a
decision about a screen that refused nothing, not about a screen that refuses dates. The frame owner
approved the readout; the placement is this build's.

**Placement: below the stepper, above the banner.** The slider variant puts its figures ABOVE its
track because the participant sets them there; this one puts the figure BELOW the stepper because the
stepper produces it. Reading order matches causality on both. And on both, the banner sits immediately
under the figure it is about - which is what Continue's `aria-describedby` points at (D78).

**Drawn with `figureDisplayHTML`, which already existed**: the static counterpart to frame 05's figure
input, already rendering one large figure with a caption on frames 06 and 21. No new component and no
new CSS. It gained an optional `live` flag, off by default so both existing callers are byte-identical,
which makes the block a polite live region: the figure moves on every press of the date stepper, and
without it a participant using a screen reader hears the month change but never the amount the press
was for.

### The error banner behaves like the other seven (D78)

`role="alert"`, an id, and `aria-describedby` from the disabled Continue to it. Already true of this
branch before this pass - D78 wired the whole date branch, including `errorPastDate` - and asserted
here rather than assumed.

### Copy: one key outstanding - **SUPPLIED AND APPLIED 30 AUGUST 2026, D81**

**This section is settled. All three questions it raised were answered in D81** - the key was filled,
the stepper hint was rewritten, and `sliderCaption` was confirmed shared. Nothing here is outstanding.
The slot table below still describes what the screen passes, so it is kept.

**`content['/calculator/saving'].errorDateNeedsMoreThanLeftOver`, `[AWAITING COPY]` when this decision
was taken.**

It is deliberately not `errorExceedsLeftOver` and must not become it: that string ends "Choose a
smaller range" and there is no range control on this variant - the participant is looking at a month
and a year. Category B, so it may differ from the slider wording without touching D34.

Three slots are built and the copy may use any subset, because `fill()` replaces a slot only where the
template names it:

| Slot | Value |
| --- | --- |
| `{amount}` | the monthly figure the chosen date implies, formatted |
| `{max}` | what is left over each month - the same slot name `sliderRangeCaptionTemplate` already uses for it |
| `{earliest}` | the earliest month and year reachable at `{max}`, e.g. "August 2029" |

**One thing for the copy pass to look at while it is there.** The date stepper's hint still reads
"We'll work out what you'd need to put aside each month" - future tense, and it now sits directly above
the answer. It was correct when the answer was deferred to frame 11. It was not changed here, because
changing it is writing copy. **RESOLVED in D81: it now reads "Change the date to see what you'd need
to put aside each month."**

**And one reuse, flagged rather than hidden.** The readout's caption is `sliderCaption` ("Put aside
each month"), which names the same figure on the same screen - reuse of an existing string, not a new
one. The key name now under-describes its use. Renaming it would touch the slider path as well, so it
is left for the copy pass to decide. **RESOLVED in D81: it stays shared, and is not renamed.**

### Verification

`shots.mjs` gained a `saving-date-ceiling` error state, seeded three months out relative to TODAY
rather than at a fixed year, so it cannot quietly become a past date and shoot `errorPastDate`
instead. 20 shots: five step 2 states x two themes x two text sizes. `overlap.test.mjs` gained a
`10b-over-ceiling` row on the same relative date, so the taller of the two date-path layouts is
measured at Large text as well.

`date-ceiling.test.mjs` is new and its assertions are shape rather than figures, derived from
`model.js` at run time so they follow a re-seeded fixture instead of breaking on it. **Both defects
were reintroduced and the tests confirmed to fail** - 5 of 10 with the ceiling check disabled, 3 of 10
with the readout suppressed - which is D77's habit and the reason the file is worth having.

Full suite: 365 tests, 364 passing, 1 skipped (G91), 0 failing.

### What this does NOT close

**G92 is now unreachable, not fixed.** The low handle's change handler still reads
`Number(rangeHigh.value)`, which is the DOM value a range input clamps to its `max` while the number
input beside it does not. Bounding the date path removes the only route by which `monthly-high` can be
above the ceiling while the screen is drawn, so the two controls no longer diverge and the handler
never reads the wrong number - but the handler is unchanged and still wrong. G64's own 29 August
amendment is the precedent for stating this plainly: D57's re-seeding made G64 harder to find rather
than smaller, and this is the same, one step further removed.

**Two further defects measured in the same pass are `GAPS.md` G93 and G94** - the slider's unbounded
fill offset, and its number inputs holding values above their own `max`. Both are on the slider path
and both are, like G92, now unreachable rather than fixed.

**30 AUGUST 2026: the record for both moved to `GAPS.md`, and this footnote is now a pointer rather
than the record.** They were written up here because this decision is what made them unreachable, and
that was the wrong place to leave them: a decision record says what was decided, and neither of these
was decided - they are live defects with no participant-reachable route, which is exactly what G92 was
promoted for. Each entry carries its own status line, its own measured figures, and its own instruction
not to close it on the strength of this decision.

---

## D81. The date path's copy, and why the caption stays shared between two readouts

**Date.** 30 August 2026. Fills the one key D80 left `[AWAITING COPY]` and settles the two questions it
flagged beside it. Three strings, all Category B, so none touches D34.

### 1. The ceiling error

> That date needs more than the {max} you have left over each month. Even putting all of it aside, the
> earliest you could reach your goal is {earliest}.

**It uses two of the three slots the screen passes. `{amount}` is deliberately unused**, and it is
worth writing down why rather than leaving it looking like an oversight:

- **The readout sits directly above the banner.** D80 put the solved figure there. Restating it inside
  the error would read as introducing a number the participant has not seen, when in fact it is the
  number their eye has just left.
- **It would put two figures in one sentence.** The copy check's plain-language rule refuses that, and
  the first sentence already carries `{max}`. Splitting the message across two sentences is what keeps
  each to one figure - the ceiling in the first, the date in the second.

The slot stays available in the fill call and in `content.js`'s comment. Nothing has to change in the
screen if a later copy pass wants it.

**What it does, in order.** It names the constraint (`{max}`, the participant's own left-over), then
the consequence at the limit (`{earliest}`). It does not say the date is wrong, does not say the
participant cannot afford it, and does not tell them what date to pick - it gives them the boundary and
leaves the choice where D80 left it. "Even putting all of it aside" is the extreme case establishing
the bound, not a suggested contribution: the rule against system-proposed amounts is about proposing
one, and this proposes nothing.

### 2. The stepper hint

> Change the date to see what you'd need to put aside each month.

Replacing "We'll work out what you'd need to put aside each month". **The old line was not wrong when
it was written and is wrong now.** It was correct while the answer was deferred to frame 11 (which is
what G65 recorded); D80 rendered the solved amount directly beneath it, and a hint promising an answer
sitting on top of that answer tells the participant the figure below is still coming.

Present tense, and it names the control rather than the app: the participant changes the date, the
figure follows. That is what the screen now does.

### 3. `sliderCaption` stays shared, and is not renamed

Both readouts carry "Put aside each month" from one key. The slider variant captions the range the
participant SETS; the date variant captions the amount their date IMPLIES.

**The argument for splitting it, stated fairly.** The two figures have different provenance. One is
chosen, one is derived. Elsewhere in this build that difference is carried in copy - D5's provenance
captions exist precisely to say where a figure came from, and D62 kept "Saved so far"'s caption on
frame 11 for exactly this reason: it was the one figure the participant had not typed.

**Why it stays shared anyway.**

- **The caption answers "what is this number", not "where did it come from".** "Put aside each month"
  is true of both figures in the same words. D5's provenance captions are a separate device and say a
  separate thing; this is a label.
- **The screen already says which mode it is in.** The segmented control is two taps above, one option
  selected, and the stepper hint immediately above the readout now says the figure follows the date.
  A participant reading the date variant has passed two statements that it is derived before reaching
  the caption.
- **Two keys holding identical words is the pair that drifts.** `shared.bankRateCaptionTemplate` was
  made shared for this reason and `MOCK_POSITION`'s comment records the same argument. One of two
  identical strings gets edited and the other does not, and the screens then disagree about the same
  figure.
- **Renaming it is not free.** `sliderCaption` is also the `aria-label` prefix on all four slider
  controls. Renaming reaches the slider path, which nothing in this pass is changing.

**The key name under-describes its use, and that is accepted rather than fixed.** It is a code-side
name, not a participant-facing one, and `content.js` now carries a comment at the key saying both
readouts use it.

*Whether the caption should signal derived-versus-chosen at all was considered with all three strings
in view, which is the only way it could be: the answer turned on what the hint directly above it now
says. If a later pass gives the date readout its own caption, the argument to reopen is the provenance
one above, not the naming one.*

### Copy check

Both new strings were run through `.claude/skills/fca-copy-check` before being applied, against the
guidance-versus-advice boundary (MCOB 4.8A, PERG 4.6) and the Consumer Duty consumer understanding
outcome. Neither string was altered. The findings worth recording:

- **Advice boundary (rule 1).** No recommendation, no "you should". "you could reach" is the permitted
  form. "Change the date" is an interface instruction naming a control, not a steer toward one option -
  the same shape as `errorPastDate` ("Pick a date in the future") and `pickOneCaption`, both already on
  this screen.
- **System-proposed amounts (rule 1A).** The error proposes no contribution. It states a bound the
  participant's own date crossed.
- **Plain language (rule 5).** One figure per sentence, which is what drove `{amount}`'s exclusion. No
  acronyms.
- **Tone (rule 6).** The subject of the first sentence is "That date", not the participant. No
  shortfall framing, no "you don't have enough", no urgency. "your goal" keeps the goal theirs.
- **Estimate disclosure (rule 2), checked and not required.** `shared.regulatory.estimateDisclosure` is
  carried by frames 12, 20 and 21 - the screens that output a result. Frame 10b is an input screen, it
  carries `guidanceNotAdvice`, and its own `interestBannerText` ("Interest is included in the estimate.
  Rates can change.") is its estimate framing, exactly as the slider variant has always had. Adding the
  shared line here would extend SPEC.md's four-key set on a decision nobody has taken.

### Verification

Measured in fresh tabs, both themes, both text sizes. The banner renders `£1,150` and `February 2027`
from the seeded session; no literal `{amount}` and no doubled whitespace survives the unused slot, and
`date-ceiling.test.mjs` now asserts all of that rather than comparing the rendered text against its own
template - which is what it did while the string had no slots to fill, and which would now pass only if
the screen had stopped interpolating.

**Horizontally it fits at both text sizes**: banner 350px in a 350px container, text box 284px
(default) / 281px (Large) with a matching `scrollWidth`, wrapping to 4 and 5 lines. `.screen-content`
`scrollWidth` stays at 390px in every combination - no sideways scroll.

**Vertically it does not fit above the fold. That is now `GAPS.md` G96**, and this note is a pointer
rather than the record - the same reconciliation D79 and D80 were given when G93, G94 and G95 were
promoted out of them.

On first paint the banner's last line falls 38px below the action bar dock at default text and 107px at
Large, so a participant meets a disabled Continue with the error partly or wholly off-screen. It is a
layout question rather than a copy one: a shorter string is not the answer, and G96 records the
arithmetic showing that removing this pass's readout would not buy enough headroom at Large either.

**G96 is REACHABLE, which none of G92 to G95 are.** It also turned out not to be confined to this
screen - the sweep that opened it found frame 10's slider ceiling error cut at Large and frame 11's
third stacked banner cut at both sizes. See G96 for all three and for the research consequence, which
is the part that makes it urgent rather than filed.

---

## D82. The date stepper is bounded, which supersedes D80's option C rather than adding to it

**Date.** 30 August 2026. Supersedes the ceiling error D80 introduced. Closes `GAPS.md` G96's frame 10b
case as unreachable.

### What changed

D80 closed G64 by **option C**: let the participant set a date needing more than `left-over`, then
refuse it with `errorDateNeedsMoreThanLeftOver` and name the earliest date that works. Nothing was
discarded, so D46 was satisfied.

**The stepper is now bounded at that earliest date.** The impossible date cannot be set, so there is
nothing to refuse, the banner is never raised, and G96 - which is that banner falling below the fold -
goes with it. A banner that cannot be raised cannot fall anywhere.

**This is a different decision, not a refinement of option C.** Option C's whole shape was *accept, then
explain*; this is *do not accept*. The three options D80 weighed were about what to do with a figure the
participant had already set, and this one removes the premise. D46 is satisfied more simply than it was
under option C: no value is discarded because none is ever taken.

**It is also a better outcome than fixing G96's layout would have been.** Reserving space for the
banner, or scrolling to it, would have made an unreachable state legible. This removes the state.

### What the bound is, and where it lives

`earliestWorkableMonths()` in `calculator-saving.js`: whole months from today to the earliest date the
goal is reachable at `left-over`, through `monthsToReachAmount`, which is `monthlyAmountFromDate`'s
inverse over the same annuity-due equation. Rounded UP (D2). The target is derived through
`combinedGoal(state)` rather than read from the stored key, per D80 and unchanged by this decision: a
live-derived amount beside a stored target is the split D38's third amendment exists to prevent.

**Recomputed on every render, never cached.** Nothing this screen can edit moves the bound - every
input lives elsewhere:

| Input | Where it is committed | Reaches the bound through |
| --- | --- | --- |
| `money-in`, `essential-spending` | seeded at session start | `left-over` |
| `left-over` (entered override) | frame 05 | directly, as the ceiling |
| `property-value`, `deposit-pct` | frames 09 and 11 | `combinedGoal` |
| `saved-toward-deposit` | frames 03 / 06, and frame 11 | the starting balance |

So the bound cannot move WHILE the participant is on this screen, and it can differ between two visits
to it. Computing it on entry to date mode and caching it would be correct for the first visit and stale
for the second - which is the case worth designing for, not the one it looks like it is for.

**One number, three readers.** `belowBound`, `monthDownDisabled` and `yearDownDisabled` are all the same
comparison against it, and `monthStep()` is used both to compute a disable flag and to perform the press
it would have refused. The button that refuses a press and the guard that refuses a commit cannot
disagree.

### The controls

**Disabled, not hidden.** A control that vanishes at the bound moves every control below it up by its own
height, under the finger reaching for one of them, and takes the participant's landmark with it. The
greyed chevron stays where it was and says the same thing. Treatment is `.button--primary:disabled`'s
exactly - `opacity: 0.4`, `cursor: not-allowed` - so a dead control looks the same wherever it appears.

**Bounded as a pair, and the two take different bounds because they move by different amounts.** At the
bound, both down controls are dead. One month above it, the month may step down (it lands on the bound)
and the year may not (it would land eleven months under). Only the DOWN direction is bounded: there is a
floor on how soon, and no ceiling on how far ahead a participant may plan.

**Every date at or after the bound is still reachable**, by month presses if not by year presses. The
bound costs presses, not destinations.

**Guarded as well as disabled.** Each down handler re-checks its own flag, the same belt-and-braces the
Continue handler carries, so a press delivered past the attribute is still refused. Asserted by driving
clicks through the DOM rather than through Playwright's actionability check.

### The case most likely to be missed: a bound that moved

A participant sets a date here, goes back to frame 11, raises their property value, and returns. Their
date is unchanged and the bound has moved past it. **Reachable with no facilitator gesture.**

**Nothing is rewritten.** Their month and year stand exactly as they set them (D46), both down controls
are disabled so the date cannot go further out of range, both up controls are live so the bound is one
press-run away, and Continue is disabled so no impossible figure is committed - G64's invariant, kept
without the banner that used to carry it.

**It is unexplained on screen until the copy below lands.** That is a known cost of this commit and is
recorded rather than worked around. It is the same gap as the bound's own, and one string covers both.

### What was removed, and what was kept

- **`errorDateNeedsMoreThanLeftOver` is kept, unrendered, and marked superseded in `content.js`.** If the
  bound is ever removed or relaxed - a general mode, a different ceiling, a new entry point - the case
  returns and the string is already written and already copy-checked (D81). D80's reasoning for it stays
  beside the words rather than only here.
- **The earliest-date LABEL builder was deleted**, because nothing renders that date now. Three lines;
  filling the open question below brings it back. `earliestWorkableMonths` is the half worth keeping
  either way.
- **`errorPastDate` is untouched**, and is now reachable only from a stored date rather than from a
  press: the bound stops the steppers well before today.

### The typed year keeps no bound, deliberately

G73's note that "the two routes to a year cannot accept different values" still holds where it matters:
**neither route can COMMIT a date below the bound**, because `belowBound` disables Continue whichever
way the year got there. What differs is the affordance - the chevron will not take you there, the field
will let you type it and then sit refusing to go forward. Clamping the typed year to the bound would
replace a number the participant had just typed, in the field they typed it in, which is G74 exactly.

### Two open questions, deliberately not settled here

**1. The boundary case: the year press that cannot move.** A participant several years out steps the
year down repeatedly and arrives one year above the bound, where their month is below the bound's month.
Two readings:

| | What the participant sees | Cost |
| --- | --- | --- |
| **The year refuses to move** (built) | The chevron greys. Their month stands. To go lower they step the month instead | Dates at or after the bound stay reachable, but some now need month presses rather than a year press - up to eleven extra presses in the worst alignment |
| **The year moves and drags the month up** | The year drops and the month jumps forward on a control they did not touch | Changes a value the participant set, on a control they did not press. That is G92's pattern exactly, and G92 is open |

**The built behaviour is not a choice made here** - it is what "disable the control at the bound"
produces. Dragging the month would be an addition, and it is the addition that carries the D46 risk. The
question is whether the extra presses are worth avoiding and whether the drag could be made visible
enough to satisfy D46. **Provisional view: visibility is not available on a stepper.** The affordances a
visible replacement needs - an undo, a "we changed this" caption, a highlighted field - are all things
frame 11 has and this control does not; a stepper's whole vocabulary is "the number changed", which is
indistinguishable from the participant having changed it.

**2. What replaces the banner's explanation.** A disabled chevron says neither why the date will not go
lower nor what the earliest one is. In a session an unresponsive control reads as a broken prototype
rather than as a constraint, which is the failure mode this build has already recorded once, in G96.

`content['/calculator/saving'].dateBoundNote` is added as `[AWAITING COPY]`. It has to cover **two**
situations, and they are not the same sentence: the participant is AT the bound and pressing down does
nothing; or their already-set date is BELOW it because the bound moved. Slots available: `{earliest}`
and `{max}`. Nothing renders the key yet, deliberately - rendering it would be choosing the location,
which is the other half of this question.

**Measured, because G96 found this screen is already tight below the fold.** At the bound, on a 390x844
viewport:

| | Free between the readout's bottom and the dock | Budget for a new line |
| --- | --- | --- |
| Default text | 92px | **4 lines** at 13px/18px |
| Large text | **61px** | **2 lines** at 14.95px/20.7px |

Placed beneath the stepper instead, the budget is the same 92px / 61px, because it is the same space -
a line there pushes the readout down rather than the card. **Two lines at Large is the number the copy
has to fit.** For scale, D81's superseded banner was five lines at Large; a replacement of that length
would put itself below the fold and reopen G96 in a new place.

### Verification

`shots.mjs` gained `--date`, taking `bound`, `bound+N` or a bare month count, with the bound computed
through the model rather than written in the harness so it follows the seed. Its `saving-date-ceiling`
error state is renamed `saving-date-below-bound` and reseeded to one month under the bound, because it
no longer produces a ceiling banner and a state whose name outlives its behaviour is how a harness
starts lying. 16 shots: at the bound, one month above, thirty months above, and one below, each in two
themes at two text sizes.

`date-ceiling.test.mjs` grew from 11 tests to 16. Three that asserted the banner's presence, its
interpolated slots and its role were replaced rather than deleted: the banner is gone, so what they
guarded is now guarded by "no ceiling banner is raised anywhere on the date path", and D78's wiring is
asserted on `errorPastDate`, the one error this screen can still raise. **The defect was reintroduced
and the tests confirmed to fail** - 6 of 16 with the disable flags forced false - which is D77's habit.

Full suite: 371 tests, 370 passing, 1 skipped (G91), 0 failing.

---

## D83. The target date is two floored dropdowns, and the one case a floor cannot prevent is disclosed

**Date.** 30 August 2026. Supersedes D82's bounded steppers, and settles both questions D82 left open.
Closes `GAPS.md` G96's frame 10b case in a second, stronger way.

### The change

D82 bounded the month and year steppers at the earliest date the goal is reachable by. **The steppers
are now two `<select>` dropdowns, and the bound is the list's first entry rather than a control that
stops responding.** An impossible date cannot be picked because it is not offered.

That is what removed D82's two open questions rather than answering them:

| D82's open question | Why it is gone |
| --- | --- |
| **The boundary case** - does a year press refuse to move, or move and drag the month up? | There is no stepping. A year is chosen, not walked into |
| **What replaces the banner's explanation** - a disabled chevron says neither why nor what the earliest date is | There is no disabled chevron. A list that starts at February 2027 is not an unresponsive control |

`content['/calculator/saving'].dateBoundNote`, added by D82 as `[AWAITING COPY]` for that second
question, is **deleted**: the question it was for no longer exists.

### Floor only, not default

**The list starts at the earliest date; the SELECTION stays the seeded one** - 36 months out, as it has
been since the screen was built.

This is a research requirement, not a convenience. At the earliest date the solved amount is *by
definition* the entire `left-over`, because that is what the earliest date means. Opening there would
put the most aggressive figure the model permits in front of the participant before they had done
anything - an anchor against RQ2, and an implied recommendation against MCOB 4.8A, from a screen whose
own regulatory line says it is not advice. The seeded date is facilitator-controlled, which is what a
research instrument needs.

`date-ceiling.test.mjs` asserts it on its own rather than as part of a larger test, because it is the
one property here that correctness would not have caught.

### The mechanism: a native `<select>`

Two candidates. A custom bottom sheet was rejected; the native control was chosen.

**The reason that decided it is structural: a list cannot render an option it was not given.** The
floor is enforced by how the control is built rather than by a guard bolted beside it. D82 needed
*three* readers of one number - a disable flag per control, a handler guard per control, and a Continue
guard - all able to drift apart. This needs the option lists to be built correctly and nothing else.
There is no `belowBound`, no disabled attribute, no handler re-check.

**And the sheet was expensive.** Every sheet in this build is its own ROUTE, and `router.js` throws for
a path outside `build-spec.md`'s screen inventory - so a picker sheet would mean inventing two frames
nobody drew (`CLAUDE.md`: never invent a screen), plus drag-dismiss, scrim, focus trap and `returnFrame`
handling, and the participant would lose sight of the solved amount while choosing.

**What the native control costs.** The open list is drawn by iOS and Android, so it looks different on
each, cannot be styled, and **cannot be screenshotted** - it is a platform popup outside the page, which
is why this pass's verification records the option lists as text instead. For an instrument run on
participants' own phones that is closer to right than a bespoke list: it is what their phone actually
does. It is also the trade the slider already takes with `input[type=range]` rather than drawing its own
handles. Only the CLOSED control is styled, to the box the stepper drew.

### The lists, bounded as a pair

The year list runs from the floor's year for `YEAR_LIST_SPAN` years. The month list starts at the
floor's MONTH in the floor year and at January in every later one, and **changing the year re-derives
it**. The pair therefore cannot express a date below the floor in any combination - asserted over every
year the list offers, not just the one on screen.

The currently selected year is always included even if it sits past the span, so a restored session
holding a far-future date renders its own value rather than silently showing a different one.

**One residue of D82's first open question survives, and is smaller than that question was.** Picking
the floor's year while holding a month before the floor's month leaves the selected month off the new
list; it is raised to the floor's month. That is still a change to a value the participant set - but
there, a year press moved the month with no list to show why; here both values are in view, the
participant is actively working the date control, and the month list visibly no longer contains the
month they had.

### The one case a floor cannot prevent

The participant picks a date, then makes an upstream edit that moves the floor past their selection -
essentials up, money in down, property value up, deposit percentage up, saved total down. **They never
touched the dropdown.** Every one of those figures is committed on another screen, which is why the
floor is recomputed on every render and never cached.

**The date is moved to the new floor and the move is disclosed.** That is D46's own rule, met the way
D46 asks: a value the participant set may be replaced *only if the replacement is visible to them*.

Two alternatives were rejected:

| Rejected | Why |
| --- | --- |
| **Block the upstream edit** | It would make a figure about the participant's actual finances unchangeable because of a target they set afterwards. The essentials are theirs; the target is a plan |
| **Keep the date and raise D80's superseded banner** | It routes the one unpreventable case straight into the state `GAPS.md` G96 records: an error below the fold beside a disabled Continue. Using the worst-placed message in the build for the case that most needs reading is exactly backwards |

**The disclosure.** `content['/calculator/saving'].dateMovedToEarliest`, one slot, `{earliest}`:

> We've moved your date to {earliest}. With what you now have left over each month, that's the soonest
> you could get there.

- **Visible on arrival and not transient.** It renders from a stored flag (`dateMovedToEarliest` in
  `state.js`), not from a timer, so a participant returning from an upstream edit meets it however long
  they took to get back.
- **It clears when the participant picks a date themselves**, on either dropdown. It describes something
  the app did; the moment they choose, it is describing nothing.
- **Above the dropdowns, and the placement was measured.** The readout ends up in the *same* place
  either way - the banner displaces it by its own height wherever it sits - so the choice costs the
  readout nothing. What it buys is distance from the fold: above, the banner sits **116px (default) /
  122px (Large)** higher than it would below the dropdowns. Both fit at both sizes; above has the
  margin, and it puts the reason before the value it explains.
- **Not an error.** `infoBannerHTML` with `infoCircle`, `role="status"` and `aria-live="polite"` - not
  `exclamationTriangle` and not `role="alert"`, which D78 reserves for a state that blocks the
  participant. Nothing is wrong here, nothing is disabled, and Continue is live at the moved date.
  `infoBannerHTML` gained an optional `live` flag for it, off by default, so its thirteen other callers
  are unchanged.
- **First person, and not an outlier.** Checked, because it was asked: `pickOneCaption` ("we'll work out
  the other") and `provenanceKeyLabel` ("How we worked these out") are already first person on this
  screen, and the Category A regulatory strings are **not** uniformly impersonal -
  `shared.regulatory.estimateDisclosure` says "the information we hold today". "We've" says who acted,
  which is the point of the sentence. **No revisiting needed.**

### What else went, and what was kept

- **`targetYearCleared` is removed from `state.js`.** It existed because the year was a TYPED field that
  could sit empty mid-edit - frame 09's `propertyValueCleared` case. A `<select>` always holds one of its
  own options, so there is no half-made state to keep out of the store. G73's typed-versus-stepped
  question dissolves with it.
- **`shared.stepper`** (`Increase` / `Decrease`) had one reader and is deleted with it.
- **`errorDateNeedsMoreThanLeftOver` stays superseded, not deleted** (D82's rule, unchanged): if the
  floor is ever removed the case returns and the string is already written and copy-checked.
- **`errorPastDate` is now superseded on this path too, which was a consequence rather than an intent.**
  The floor is never negative and a stored date below it is moved to it, so a past date is corrected
  before the past-date branch can catch it. Kept for the same reason, and `date-ceiling.test.mjs`
  asserts the correction reaches it first.
- **The key names still say "stepper"** - `dateStepperHint`, `dateStepperMonthAriaLabel`,
  `dateStepperYearAriaLabel`. Kept rather than renamed, for the reason D81 kept `sliderCaption` shared:
  the WORDS are right for the control ("change the date" is what a dropdown asks for as squarely as a
  stepper did), the key name is a code-side label, and renaming reaches every screen and test that reads
  it.

### The year list's horizon is this build's own figure

A stepper needed no horizon; a list does, and `build-spec.md` gives none. `YEAR_LIST_SPAN = 20`, and it
is recorded as an invented figure in `GAPS.md` **G97** rather than passed over. Deliberately not
`MORTGAGE_TERM_YEARS`: a mortgage term is not a saving horizon.

### Verification

Sixteen shots across four states, two themes, two text sizes: the seeded selection on arrival, the floor
year, a later year, and the moved-date disclosure. **The open list is not among them and cannot be** -
it is a platform popup outside the page - so the option lists are recorded as text instead, which is
what the tests assert against too.

`date-ceiling.test.mjs`: 16 tests to 17. Six of D82's stepper tests describe a control that no longer
exists and were replaced, not deleted - disabled chevrons, both press-order sequences, "a refused press
moves nothing", and "a date below the bound is left standing" (it is moved now). What replaced them
asserts the list properties instead, plus the floor-is-not-the-default requirement and the whole of the
moved-date case. `stale-session.test.mjs`'s "typed target year" test is rewritten as "selected target
year": the attribute contract and the empty-field draft went with the field, and what survived is the
half that was never about the field - the choice persists across a reload and a back navigation, and
drives `savings-rate`.

Full suite: 372 tests, 371 passing, 1 skipped (G91), 0 failing.

---

## D84. The date lists become a custom listbox, and everything native was giving away becomes ours

**Date.** 30 August 2026. Replaces D83's two native `<select>` elements. The floor, the moved-floor
disclosure, the seeded default and `YEAR_LIST_SPAN` are untouched.

### What changed, and what deliberately did not

**Only the control.** The month and year lists are now a custom listbox that opens as an overlay
anchored to its own trigger. D83's structural argument survives the change intact and is the reason
this is a swap rather than a rewrite: **a list cannot render an option it was not given**, so the floor
is still enforced by which options are built and not by a guard that can drift. The option lists arrive
at the component already filtered; it applies no bound of its own; there is still no `belowBound`, no
disable flag and no handler re-check.

D83's other objection - that a picker sheet would mean inventing two routes, because every sheet in
this build is its own route and `router.js` throws for a path outside the screen inventory - does not
apply to an inline overlay. This is neither a route nor a sheet.

### This is a new component

**Nothing in the build drew an overlay anchored to a control.** Checked rather than assumed: there is
no popover, menu, tooltip or dropdown of any kind. `.sheet-overlay` is the only thing that renders
above `.screen-content` (`position: absolute; inset: 0; z-index: 10`) and it is a full-screen scrim for
a sheet ROUTE - a different thing entirely, and not reusable here. So `dateSelectHTML` /
`bindDateSelect` is a new component, and this record names it as one.

### What it costs

A native `<select>` came with its own popup, keyboard handling, focus management and screen reader
semantics. **All four are now this build's**, and the whole of section 3 below exists because getting
listbox semantics wrong is worse for a screen reader user than the control it replaces.

What is bought back is the thing D83 recorded as its own cost: the open list is no longer a platform
popup outside the page. It can be styled, it can be captured in a screenshot, and it can carry a
position indicator - none of which was possible before.

### Where it opens, and why that is measured rather than fixed

`.screen-content` computes `overflow: auto` on **both** axes - a non-visible overflow on one axis makes
the other `auto` - so an overlay positioned inside it is clipped by it. The bottom of that clip box is
not the fold either: the scroller extends **137px below the dock** by design (D82's negative margin),
and everything in that band sits behind an opaque bar. Measuring to the scroller's own bottom would
"fit" a list into a region the participant cannot see.

So the side and the height are decided per open, from the space between the scroller's top and the
**dock's** top:

| State | Trigger at | Room below (to the dock) | A five-option list needs | Opens |
| --- | --- | --- | --- | --- |
| Ordinary visit | y=299 | 292px | 242px | **below** |
| Moved-floor disclosure showing, default text | y=429 | 162px | 242px | **above** |
| Moved-floor disclosure showing, Large text | y=454 | 137px | 242px | **above** |

**The flip is necessary, not decorative**: D83's own disclosure is what pushes the trigger past the
point where the list fits beneath it. The height is clamped to whichever side is used, so the list can
never reach the clip.

**An overlay, not an expansion.** Expanding in place would push the solved-amount readout and the dock
down on every open, which is the class of defect `GAPS.md` G96 records. Asserted: opening the list
moves neither.

### No scrim, and what follows from it

A scrim would dim the readout, and the readout is the figure the participant is choosing against - the
whole reason G65 required it on screen. The popover's shadow does the separating.

**The consequence, recorded because it is a real one:** with no scrim there is nothing to swallow an
outside tap, so a tap on another control both dismisses the list *and* activates that control. A tap on
"Continue" while a list is open will continue. A native `<select>` was modal and would have eaten that
tap. Left as it is - an invisible barrier that costs a tap is its own surprise - but it is the trade the
no-scrim decision carries.

### The keyboard and screen reader contract

| | |
| --- | --- |
| Trigger | `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` pointing at the list's id |
| List | `role="listbox"`, `tabindex="-1"`, `aria-activedescendant` naming a real option |
| Options | `role="option"`, a unique id each, `aria-selected` on exactly one |
| Open | click, or ArrowDown / ArrowUp on the trigger. Focus moves into the list |
| Move | ArrowDown / ArrowUp one at a time, Home and End to the ends. **Moving commits nothing** |
| Select | Enter or Space on the active option, or a tap |
| Dismiss without selecting | Escape |
| Focus on every dismiss | back to the trigger |

**Two defects were found by driving it, not by reading it**, and both are the kind an assurance would
have missed:

1. **The active option came back where it was abandoned.** Arrow around, press Escape, reopen - and the
   highlight was several rows from the value the trigger was showing, while the SCROLL went to the
   selection. The two disagreed on screen. `open()` now resets the active option to the selection every
   time.
2. **An outside tap dropped focus on `<body>`** - the exact thing the contract forbids. Returning focus
   to the trigger was not enough: a mousedown on anything non-focusable (the headline, a caption, the
   background) clears focus *after* the handler runs and undid it. Focus is now re-asserted on the next
   frame, and only if focus actually ended up nowhere, so a tap that moved it to a real control still
   leaves it there.

**How it was tested.** Driven in Chromium through the real DOM - trigger presses, arrow keys, Escape,
Enter, an outside tap on the headline - reading `aria-expanded`, `aria-activedescendant`,
`aria-selected` and `document.activeElement` back at each step, and asserting the store did not move.
Eleven assertions in `date-ceiling.test.mjs` under "THE LISTBOX CONTRACT". The roles are read from the
same attributes a screen reader reads, so a test cannot pass while the control announces something
else. What this does **not** do is run an actual screen reader; the contract is asserted at the ARIA
layer, and that limit is stated rather than glossed.

### The selection is marked twice

A tick as well as the background tint - colour is not the only marker, which is WCAG 1.4.1 and the same
constraint D78 applied to the banner icons, where the answer was a different shape. The keyboard's
active option is a third, separate mark (an outline), because where the keyboard is is not the same
thing as what is selected.

### The scroll indicator is drawn, and had to be

Twenty-one years in five rows: a participant on 2045 has to see *where* in the list they are. The
browser's own scrollbar cannot do that here, and both routes to it were tried and measured rather than
assumed:

- `scrollbar-width: thin` puts Blink on its standard scrollbar path, where `::-webkit-scrollbar` is
  ignored entirely - and its thin scrollbar is an **overlay**, invisible at rest.
- `::-webkit-scrollbar` alone still produced a **zero gutter** and painted nothing.

So the indicator is a track and a thumb sized from `scrollTop` and `scrollHeight`, updated on open and
on scroll. Visible at rest, in a screenshot, and on both mobile engines. `aria-hidden`, because
`aria-activedescendant` already tells a screen reader the same thing.

**One cascade note worth keeping**, because it failed silently: shell.css hides every scrollbar under
`.screen *`, which is the same specificity as a bare class and later in the cascade, so a
`.date-select__list` rule lost without any sign of it.

### Verification

Twenty shots across five states, two themes, two text sizes: the closed control, the year list open at
the seeded selection, open at the floor, the month list open at the floor year showing its bounded
start, and the year list with the selection far down and the thumb showing position. **The open list is
in them**, which D83 could not manage.

`date-ceiling.test.mjs`: 17 tests to 28. Everything that read `.value` or `.options` was rewritten
against `[role="option"]` and `aria-selected`, and `pick()` now opens the trigger and taps an option
rather than setting a value - so the open path is exercised by every test that changes a date.
`stale-session.test.mjs`'s selected-year test moved the same way. **The floor's own tests did not change
at all**, which is the point.

Full suite: 383 tests, 382 passing, 1 skipped (G91), 0 failing.

### Found while verifying, and NOT fixed here

The solved amount goes **negative** at about 94 months on the shared seed - £21,000 at the Bank Rate
outgrows a £28,000 goal - and the year list offers twenty years, so a participant can reach a readout
saying "-£39 put aside each month". It predates this pass (D80 rendered the readout, D83 set the
horizon) and is out of this pass's scope, which explicitly leaves both alone. Recorded as `GAPS.md`
G98 rather than left in a report.

---

## D85. The date list is capped at the flip point, and the goal-already-met case gets a screen

**Date.** 31 August 2026. Closes the reachable half of `GAPS.md` G98. The floor, `dateMovedToEarliest`,
the listbox and its keyboard contract, and the seeded date as the initial selection are all untouched.

### What was wrong, and why it was not a display defect

Past the month at which the existing balance compounded at the Bank Rate reaches the goal,
`monthlyAmountFromDate` returns a NEGATIVE payment. It is the correct answer to a question that has
stopped applying - the goal is reachable with no contribution at all - and G98's measurement showed the
figure did not stay on screen:

| | |
| --- | --- |
| Continue committed | `savings-rate` -27.63, `monthly-low` -24.87, `monthly-high` -30.40 |
| D2's invariant | inverted - `monthly-low` came out ABOVE `monthly-high` |
| `monthsToTarget`'s two guards | both missed it: a negative is neither exactly zero nor above `left-over` |
| Frame 11 | showed "-25" and "-30", no error, Work it out enabled |
| Frame 12 | drew its two named bands swapped, and `chart-range.test.mjs` passed because both still rose |

### The cap

**Closed form, derived from the function it bounds.** `monthlyAmountFromDate` returns
`pmt = ((goal - p0 x g) x r) / ((1+r)(g-1))` with `g = (1+r)^n`, which is zero exactly when
`goal = p0 x g`:

    n = ln(goal / p0) / ln(1 + r)

`monthsToGoalUnaided` in `model.js`. **`monthsToReachAmount` is not changed** - it returns `Infinity`
for a monthly amount at or below zero, deliberately and with a comment, and "genuinely unreachable at a
zero contribution" is the right answer to the question that function asks.

**Rounded DOWN, and the direction is the decision.** The crossing sits between two months - 93.7738 on
the shared seed - and the solve is **+0.62 at month 93** and **-0.18 at month 94**. Rounding up readmits
the first month whose answer is negative, which is the state being removed. D2 rounds a month figure UP
where the risk is promising a date that is too soon; here the risk runs the other way, so this rounds
the other way. That is a difference in which direction is unsafe, not a departure from D2.

**Recomputed on every render, like the floor**, and it has to be: it moves with `saved-toward-deposit`,
`property-value` and `deposit-pct`, all committed on other screens. Measured shifts on plausible edits:
saved 21,000 to 15,000 **+109.7 months**, property 280,000 to 350,000 **+95.2**, deposit % 10 to 15
**+132.2**.

**And it does NOT move with `left-over`, which moves the floor** - measured at exactly 0.0 months. The
floor is when the goal is reachable at the most the participant could put aside; the cap is when it is
reachable at nothing. Neither can be derived from the other and this record says so, because "the other
end of the floor" is the wrong mental model.

**The lists are bounded at both ends, D83's pair rule mirrored.** The year list runs floor year to cap
year; the month list starts at the floor's month in the floor year and January in every later one, and
ends at the cap's month in the cap year and December in every earlier one. **In a year holding both
bounds it is bounded twice.**

**Floor cannot exceed cap while the goal is ahead**, because `monthsToReachAmount` is monotonically
decreasing in the monthly amount and the floor is taken at `left-over` while the cap is the same target
at zero. That is now **asserted rather than assumed** - `date-ceiling.test.mjs` sweeps four balances by
2000 monthly amounts - because the whole arrangement rests on it and on nothing else.

### The goal-already-met case, which could not be deferred

They DO cross the moment the goal is met: at a 5% deposit on the seed the goal is 14,000 against 21,000
saved, the floor is 0 and the cap is -133. **A capped list has nothing in it.**

**How often.** At the shared fixture's 21,000 saved, **10 of 45** realistic property-by-deposit-%
combinations. At the balance a real session actually opens with (8,950), **1 of 45** - £150,000 at 5%.
Rare, but one tap away on frame 09, and reachable from frame 11 and frames 03/06 as well.

**What was built.** The date control is **not drawn at all**, and a statement takes its place; Continue
is disabled; no figure is solved or rendered. An empty listbox is a control that asks a question with no
answers, and letting a participant open one to find nothing is worse than not drawing it.

**The segmented control is deliberately left in place.** "Set a monthly amount" is the way forward from
here, and removing it would leave the participant on a screen with nothing at all.

**It is not an error and must not read as one.** Nothing they did is wrong - they have saved enough. It
renders through `infoBannerHTML` with `infoCircle` and `role="status"` polite, not the error banner and
not `role="alert"` (D78).

**Copy outstanding: `content['/calculator/saving'].dateGoalAlreadyMet`, `[AWAITING COPY]`.** Slots
`{saved}` and `{goal}`. It has to do more than state the fact: the participant is on a screen whose
question no longer applies with a dead Continue, and the way out is the tab beside it.

**Monthly-amount mode does NOT degrade gracefully in the same state, and that is not fixed here.**
`monthsToTarget` has no `startingBalance >= targetAmount` guard, so a slider rate on an already-met goal
returns NEGATIVE months with `error: null` - -27.58, -12.63 and -6.63 at 200, 500 and 1000 a month - and
`onTrackFor` hands back an inverted `{ low: -24, high: -30 }`. Recorded as `GAPS.md` G100 and left
reachable rather than papered over. **The honest reading is that "the goal is already met" belongs
earlier in the flow than frame 10b** - it is a whole-calculator state, not a date-mode one - and this
pass fixes the half it was scoped to.

### Why B and C were rejected

- **B, restate the readout past the flip.** It makes the screen honest and **leaves the store wrong**:
  the negative still commits unless separately guarded, so G98's actual defect survives it. It also
  costs a new string, and G96's measurement gives two lines at Large text to put it in.
- **C, clamp to zero.** Worse than it looks. `monthsToTarget` rejects a savings-rate of exactly zero as
  **`unreachable`**, so frame 12 would tell a participant whose goal is already met by interest that
  they will never get there - a confident wrong statement in place of a nonsensical figure.

### What is unreachable rather than fixed

Recorded in `GAPS.md` in the G92-to-G95 form, open with an explicit instruction not to close on the
strength of this pass:

| | |
| --- | --- |
| **G99** | `rangeFromCentral` still inverts on a negative central. Its comment states the precondition; nothing enforces it |
| **G100** | `monthsToTarget`'s guards still miss a negative - and its missing already-met guard is **still reachable** through the slider |
| **G101** | `chart-range.test.mjs` cannot detect an inverted pair of bands. A gap in the suite, not the build, and it outlives the defect that revealed it |
| **G102** | A date moved DOWN to the cap is **not disclosed**, where one moved up to the floor is. A D46 gap, knowingly incomplete - the mirrored string is copy this pass did not own |

### G97 is demoted, not closed

`YEAR_LIST_SPAN = 20` was invented because `build-spec.md` gives no horizon. The cap is a horizon
derived from the model, so for any session with something saved the constant is not consulted. **It
survives for the zero-balance session** - nothing compounds from nothing, `monthsToGoalUnaided` returns
`Infinity`, and there is no crossing to cap at.

**One consequence worth stating, because it is the opposite of what a cap sounds like: it usually makes
the list LONGER.** At the real opening balance the crossing is 372 months out, so the year list runs 32
years where the constant gave 21; at 1,000 saved it would run 90. Every date in it is valid, which is
the point. Ending the list at whichever of the cap and the span comes first is one line, and was
deliberately not done - it would make the constant a co-bound again rather than the fallback. Recorded
in G97 so the choice is visible.

### Verification

Twenty shots across five states, two themes, two text sizes: the year and month lists at the cap, the
narrow single-year list where both bounds fall on one month list (March to July 2027, five options), and
the goal-met screen with no control at all.

`date-ceiling.test.mjs`: 28 tests to 36. The new ones assert the rounding direction on the arithmetic
before any screen opens, that no offered pair solves negative or inverts D2's range, the monotonicity
the floor-below-cap claim rests on, the fallback when nothing is saved, the move down to the cap, and
the whole of the goal-met state. **The defect was reintroduced and the tests confirmed to fail** -
rounding the cap up fails 3 of 36.

**And one of those tests was wrong first, in exactly the way D77 describes.** The "no offered pair
solves negative" test computed each year's highest offered month from its own copy of the cap rather
than reading it off the screen - so with the cap rounded up it checked the month it believed in and
passed while the screen offered one more. It now selects each year and reads that year's own re-derived
month list. Worth recording: the file that exists because of D77 grew a D77 defect.

Full suite: 391 tests, 390 passing, 1 skipped (G91), 0 failing.

---

## D86. The move down to the cap is disclosed, and its copy leads with the reason rather than the change

**Date.** 31 August 2026. Closes `GAPS.md` G102. Nothing else about D85's cap changes.

### What was silent

D85 moved a selection sitting above the cap down to it and said nothing. The participant picks 2034,
edits a figure on frame 11, comes back to 2028 with no account of how. That is the D46 breach
`dateMovedToEarliest` exists to prevent, at the other end of the same list - and D85 recorded it as
knowingly incomplete because the mirrored string was copy that pass did not own.

### The treatment mirrors D83's exactly

`content['/calculator/saving'].dateMovedToCap`, rendered from a stored flag (`dateMovedToCap` in
`state.js`), above the dropdowns, cleared when the participant picks a date on either list, through
`infoBannerHTML` with `infoCircle`, `role="status"` and `aria-live="polite"` - not the error banner and
not `role="alert"`, because nothing is wrong and nothing is disabled (D78).

### The copy leads with the reason, and that is deliberate

> Good news - you'll get there sooner than that now. We've moved your date to {earliest}.

against the floor's

> We've moved your date to {earliest}. With what you now have left over each month, that's the soonest
> you could get there.

**At the floor the participant met a limit**: the change is the news, and the reason follows to explain
why they could not have what they asked for. **Here their position improved** - they will reach their
goal sooner than the date they had picked - so the news IS the reason, and the move is the consequence
of it. Two different situations, two different shapes. **They must not be normalised to one.**

**The slot is `{earliest}` in both, which is the floor's name for the cap's date.** Kept exactly as
supplied rather than renamed: each key is filled by its own `fill()` call so nothing collides, and the
rendered sentence is identical whatever the slot is called. Renaming it would be editing copy this
build does not own. `{latest}` would read better in code if it is ever revisited.

### Mutually exclusive, and enforced rather than assumed

A selection cannot be below the floor and above the cap at once: the floor cannot exceed the cap while
the goal is ahead (D85's monotonicity assertion), and where the goal is met there is no list and neither
branch runs. **Each move writes its own flag and clears the other in the same patch**, so no sequence of
renders can leave both set, and the render draws at most one banner from one id.

**If both are somehow set** - a hand-edited session, which the app cannot produce - **the floor's wins**,
because a date that does not work is the more urgent of the two to explain. Asserted, so the behaviour
is pinned rather than incidental.

### One defect found by checking the disclosure fires only on a real move

Picking the CAP's year while holding a later month left a date past the cap, which the render then
corrected - **and announced**, with a banner saying the app had moved their date when the participant
had just moved it themselves. The year pick now clamps the month at BOTH ends
(`Math.min(Math.max(month, lowest), highest)`), mirroring the floor clamp D83 already had, so the month
lands on the cap directly and nothing is announced.

The disclosure is for an UPSTREAM edit moving the cap, not for the participant's own pick being tidied.
That distinction is what the check "appears only when something was moved" was written to hold, and it
caught this on the first run.

### Verification

Eight shots, both themes, both text sizes: the cap disclosure and the floor disclosure side by side for
comparison. `date-ceiling.test.mjs`: 36 tests to 40. Suppressing the flag fails 3 of them.

Full suite: 395 tests, 394 passing, 1 skipped (G91), 0 failing.

---

## D87. The year span becomes a co-bound rather than a fallback

**Date.** 31 August 2026. Amends `GAPS.md` G97 for the second time. Nothing about the cap, the floor or
either disclosure changes.

### The measurement that reversed the assumption

D85 wrote `YEAR_LIST_SPAN = 20` down as the FALLBACK for the one session with no crossing to cap at, on
the assumption that the cap would otherwise be the tighter bound. **It usually is not.**

| Session | Floor year | Cap year | Span end | Which wins | Years offered |
| --- | --- | --- | --- | --- | --- |
| Shared seed - saved 21,000, left-over 1,150 | 2027 | 2034 | 2047 | **cap** | 8 |
| A real session - saved 8,950, left-over 640, 280k at 10% | 2028 | 2057 | 2048 | **span** | 21 |
| The same, saved 1,000 | 2029 | 2117 | 2049 | **span** | 21 |
| The same, saved 25,000 | 2027 | 2029 | 2047 | **cap** | 3 |
| Nothing saved | 2030 | none | 2050 | span, no cap | 21 |

**The cap only wins once a participant has saved a good deal.** At the balance a real session reaches
the calculator with, the crossing is thirty years out and the span is what ends the list; at 1,000 saved
it is ninety years out. The fixture is the unrepresentative case - it holds 21,000, which is most of its
own goal.

### The decision

**The list ends at whichever comes first.** Both bounds stay and both are load-bearing, because they do
different jobs and neither subsumes the other:

- **The cap is correctness.** Past it `monthlyAmountFromDate` returns a negative payment, which D85
  showed does not stay on screen - it commits, inverts D2's range and passes both of `monthsToTarget`'s
  guards.
- **The span is proportion.** A ninety-year year list is absurd whatever the model says, and twenty
  years is a defensible horizon for a first-home deposit.

`Math.min(cap.year, floorYear + YEAR_LIST_SPAN)`, with the span alone where there is no cap.

**Not tied to `MORTGAGE_TERM_YEARS`**, for the reason G97 has recorded since it was raised: a mortgage
term is not a saving horizon, and borrowing one figure for the other is how two unrelated things end up
moving together.

### G97 is amended, not closed, for the second time

The constant is still invented, still absent from `build-spec.md`, and still needs a source. What has
changed twice is only its standing: **the rule (D83) -> the fallback (D85) -> a co-bound (D87)**. That
progression is recorded in G97 itself, because a figure whose role keeps narrowing is easy to lose track
of, and it is still the same unsourced 20.

### Verification

Eight shots, both themes, both text sizes: the year list where the span wins and where the cap wins.

**No D85 test asserted a length the co-bound shortens** - checked rather than assumed. The shared seed is
a cap-wins case at 8 years, so every existing assertion about the seed's list is untouched, and the
nothing-saved test asserts 21 years, which the span gives either way. The gap that left is now covered:
one new test sweeps all three branches - cap wins, span wins, no cap - and asserts the list never runs
longer than the span and never past the cap. Removing the co-bound fails it.

Full suite: 396 tests, 395 passing, 1 skipped (G91), 0 failing.

---

## D88. The floor disclosure is trimmed, and it is still one line too long at Large

**Date.** 31 August 2026. The copy half of a two-part change whose second half is **not done**: the
option list keeps D84's five-option height and its flip, because the state that change exists for still
does not fit.

### What was asked, and what it was for

D84's listbox opens above its trigger when there is no room below, and that flip is reachable in the
common case: with either disclosure showing, the trigger sits low enough that a 242px five-option list
does not fit above the action bar. Opening upward puts the list over the disclosure that just explained
why the date changed - the participant opens the control to respond to a message and the message
disappears behind it.

The fix is a fixed three-option list (146px) that always opens downward. Measured, five of six states
had room; the sixth, **the floor disclosure at Large text**, was 13px short - traced to
`dateMovedToEarliest` rendering four lines at Large against `dateMovedToCap`'s three, a 25px difference.
Trimming the copy was chosen over shaving the 48px row height (which would contradict
`--touch-target-min` across the whole build for 13px on one screen) or closing the 8px popover gap
(which is doing the work that separates the list from its trigger).

### The trim

> We've moved your date to {earliest}, the soonest you could get there on what you now have left over.

replacing

> We've moved your date to {earliest}. With what you now have left over each month, that's the soonest
> you could get there.

"each month" goes because the readout directly beneath carries those words already; the second sentence
becomes a subordinate clause. The change, the new date and the reason all survive.

### It did not do the job, and the numbers say why

| | Before | After |
| --- | --- | --- |
| Default text | 114px, 4 lines | **92px, 3 lines** |
| **Large text** | **127px, 4 lines** | **127px, 4 lines - unchanged** |

**Twenty-one characters bought a line at default and nothing at all at Large.** Large is 15% bigger type
in the same 281px box, so the saving fell short of a whole line there.

The floor-disclosure-at-Large state is therefore still **133px of room against 146px of list**, still
13px short, and **the flip stays**. Section 2 of the change was not attempted: the instruction was to
stop rather than compensate by shaving the row height or the gap, and further cutting is copy that this
build does not own.

### The budget, measured, so the next attempt does not have to guess

The text box is **281px** at Large with a 25.3px line height. Rendering successive word-boundary
prefixes of the new string, the longest that still fits three lines ends at "...on what you now" -
**87 characters** with the date filled in.

| String | Rendered length | Lines at Large |
| --- | --- | --- |
| `dateMovedToEarliest` (new) | 103 | 4 |
| **The budget** | **~87** | **3** |
| `dateMovedToCap` | 85 | 3 |

So it is **about 16 characters too long**. `dateMovedToCap` is the worked example of a string that fits.

Two caveats on the number. It is a WIDTH budget and characters are only a proxy - a line of narrow
letters holds more. And the date is interpolated: "February 2027" is 13 characters and "September 2034"
is 14, so the worst case is a character longer than measured.

### The height coupling is load-bearing, and both keys now say so

Whatever finally fits, **the two disclosures being the same height is what will make the
floor-at-Large state work**, and once the flip is removed there is no fallback if either grows. Both
keys in `content.js` carry a comment naming this decision and the measured budget - recorded as a
constraint on future copy edits rather than as a note about tidiness, because the failure mode is a
control that quietly starts opening upward again.

### What is NOT in this build

- The three-option height. The list is still five options.
- The removal of the flip. The above/below branch, the placement calculation and the
  `--above` modifier are all untouched.
- Any of D84's tests are unchanged, because nothing they assert has changed.

Suite: 396 tests, 395 passing, 1 skipped (G91), 0 failing. Four shots of the trimmed banner, both
themes, both text sizes.

---

## D89. The floor disclosure now fits - and the cap disclosure turns out not to

**Date.** 31 August 2026. The second copy attempt at making a three-option list open downward in every
state. **The floor string now fits and the change still cannot be made**, because a string D88 measured
as passing does not.

### The retrim

> We've moved your date. {earliest} is the earliest you could save your deposit.

replacing D88's

> We've moved your date to {earliest}, the soonest you could get there on what you now have left over.

Two short sentences rather than one with a subordinate clause: what happened, then what the new date
means. **Three lines at Large for all twelve month names**, measured across every one rather than
against the shared seed's date - which is how the defect below slipped past D88.

**What was given up.** The explicit reason - that the date follows from what they have left over - is
gone; there is no room for it. The readout directly beneath carries the monthly figure that left-over
supports, so the causal link is on screen even though the sentence no longer states it. That is a real
loss and it is the price of the space.

**"your deposit", not "this deposit".** Both render identically at 80 characters and three lines, so the
choice was purely how it reads. "your" is what the rest of the build says - "of your £28,000 deposit
goal", "the accounts you picked for your deposit", "Your deposit" - and "this deposit" is oddly
demonstrative about something that is theirs.

*One accuracy note, flagged rather than changed because it is copy.* The date is computed against
`combinedGoal`, which includes stamp duty (D70), so "save your deposit" understates what the date is
for. That is the same imprecision `GAPS.md` G88 already records on frame 21, and it applies to
`dateMovedToCap` equally.

### The measurement that stops the change again

`dateMovedToCap` is **four lines at Large when the month name is long**:

| Rendered with | Lines at Large | Banner |
| --- | --- | --- |
| "May 2034" - the shared seed's cap | 3 | 102px |
| **"February 2043"** | **4** | **127px** |

Driven in a browser on a seed whose cap lands in February: **133px of room below the trigger against
the 146px a three-option list needs. Short by 13px** - the identical shortfall the floor string had, now
in the other banner.

**D88 measured this string as passing, and it was measuring the wrong date.** Its own entry noted the
caveat - "the date is interpolated... the worst case is a character longer than measured" - and then did
not apply it to `dateMovedToCap`. That is the error to own: a caveat written down and not acted on is
worth no more than one never noticed.

### D88's character budget is withdrawn

D88 published "about 87 characters" as the budget. **It is not a usable rule**, and the numbers now
contradict it in both directions:

| String | Rendered length | Lines at Large |
| --- | --- | --- |
| `dateMovedToEarliest` (new) | 80 | 3 |
| `dateMovedToCap` | 90 | **4** |
| A neutral filler | 98 | 3 |

Where the word boundaries fall against the 281px box decides it, not the count. **The only reliable
test is the rendered line count at Large, with every month name**, and both keys now say so in
`content.js` rather than carrying a number that invites the same mistake again.

### Section 2 is not attempted, for the second time

The three-option height and the removal of the flip are not in this build. The list keeps D84's
five-option height and its above/below branch, because the state the change exists for - a disclosure
showing at Large - still does not fit, only for the other banner now.

Every other state does fit, and by more than before:

| State | Text | Room below | Needs | |
| --- | --- | --- | --- | --- |
| No disclosure | default / Large | 288px / 276px | 146px | fits |
| Floor disclosure | default / Large | 180px / **158px** | 146px | **fits, 12px spare** |
| Cap disclosure, short month | default / Large | 180px / 158px | 146px | fits |
| **Cap disclosure, long month** | **Large** | **133px** | 146px | **short by 13px** |

### Verification

Four shots of the retrimmed banner, both themes, both text sizes. Suite: 396 tests, 395 passing, 1
skipped (G91), 0 failing. No test changed, because nothing they assert has changed.

---

## D90. The left-over ceiling is named beside the range it bounds

**Date.** 31 August 2026. One label on frame 11. Nothing else about the screen changes.

### What was wrong

`errorExceedsLeftOver` says a range is more than what is left over **without saying what that is**. The
participant had to infer the target from a message that withholds it, and only after they had already
been refused.

### The label

`content['/calculator/saving'].monthlySavingMaxTemplate` - **`Max: {max}`**, Category B, so D34 does not
apply. `{max}` is `left-over` through the existing currency formatter.

**One value, not two derivations.** `savingCeiling` is read once at the top of the render and
`monthlyError` tests `monthlyHigh.value > savingCeiling` against the same variable, so the number shown
and the number refused against cannot drift. `date-ceiling`'s sibling suite asserts it at the boundary
rather than by reading the source: a high of exactly the ceiling passes, one above it fails, and the
label reads the same in both. Re-deriving the label from `money-in - essential-spending` fails two tests.

**Present always, not only on error** - the point is that the number is visible while the participant is
typing, not after they fail.

**Beside the range, not beneath it, and the placement was measured.** It is a third child of the same
flex row as the two fields, `margin-left: auto` so it sits at the end of their line. Measured on the
fields' own line in every state, at both text sizes - so it costs the row **zero height**, which matters
because this screen is the worst cut in the build under `GAPS.md` G96. **G96's frame 11 measurement is
unchanged: 110px at default, 200px at Large**, exactly the figures that entry records.

Footnote size in the secondary label colour, against 17px at full label colour for the fields beside it,
so it reads as a note ON the figures rather than a third figure among them.

**`aria-describedby` from BOTH fields.** The same ceiling bounds the low and the high, and a screen
reader on either should hear it. Not the row's accessible name, which would announce it once on arrival
and never again while the participant is actually typing - the moment it is for. Same pattern D78 used
to point a disabled Continue at the error explaining it.

**Guarded on a positive, finite ceiling.** `formatCurrency(null)` renders "£0" - the silent-zero defect
D46 and G62 were both written for - and a label reading "Max: £0" would be worse than no label.
`left-over` is seeded at session start and frame 05 refuses a non-positive override, so the guard only
covers a state the build does not produce.

### Three things deliberately not changed

- **The breach still blocks.** Work it out stays disabled, the banner stays an error, and it keeps D78's
  red treatment, `exclamationTriangle` and `role="alert"`. Asserted, including that forcing the button
  through the DOM commits nothing and navigates nowhere. A figure above the left-over must not reach the
  tracker or the MIP flow.
- **The fields' clamping is untouched.** See the correction below - what "untouched" means here is the
  opposite of what the brief assumed.
- **The banner copy is unchanged.** `errorExceedsLeftOver` stands.
- **It is not a banner.** No `infoBannerHTML`, no icon, no role, no live region: it states a fact that is
  true whether or not anything is wrong. And not the `caption` slot, whose meaning on this screen is
  PROVENANCE (D5 as refined by D62) - a bound in that slot would read as a claim about where the figure
  came from.

### A correction: frame 11 CLAMPS, it does not let a typed value stand

The brief for this change said the fields do not clamp and a typed value above the ceiling stands and
raises the error "as it does today". **The build does the opposite**, and has since D62:

    bindField('edit-monthly-high', (parsed) => ...
      commitRange(monthlyLow.value, clamp(parsed, monthlyLow.value, savingCeiling)))

A typed high above the ceiling snaps to it. That is `GAPS.md` **G74**, already recorded as a defect on
this screen, and D90 leaves it exactly as it is. The consequence for this change is that
**`errorExceedsLeftOver` cannot be reached by typing at all** - it is reachable only by ARRIVING with a
breaching range, which is why the tests seed one rather than typing one. The clamp is now pinned by a
test in both directions, so a later pass cannot change it silently.

### Which makes the label matter more, not less

The path that reaches the error is frame 10b's. Driven end to end in a browser: pick the earliest date
the list offers, press Continue, and land on frame 11 with the range **£980.88 to £1,198.85** against a
£1,150 ceiling, the error showing and Work it out disabled - **having typed nothing at all**. The label
is the only thing on that screen naming the number they have to get under.

That path is itself a defect and is recorded as `GAPS.md` **G103**: the floor guarantees the solved RATE
is at or under the ceiling, and frame 11 tests the HIGH, which is 1.1x it (D2). Not fixed here - this
pass was one label.

### Frame 10 already names the same quantity, and the two agree

`sliderRangeCaptionTemplate`: *"{max} is what's left each month once your essentials are covered."* Prose
there because it sits under a slider with room; terse here because it sits inline on a row.

**They cannot diverge.** Both screens read `state['left-over'].value` into a local called `savingCeiling`
and nothing else derives it - checked rather than assumed, so no entry is needed.

### Verification

Twelve shots, both themes, both text sizes: the row within the ceiling, breaching it with the banner
showing, and frame 11 with all three row errors raised. Suite: 397 tests, 396 passing, 1 skipped (G91),
0 failing.

---

## D91. Production deployments are logged by version, and the log is written with the merge

**Date.** 31 August 2026. A table in `docs/README.md`, a standing rule in `CLAUDE.md`, and four
backfilled rows. No prototype code changes.

**Decision.** Every merge from `build` to `main` takes a version number - v1, v2, v3 - recorded in
the deployment version log in `docs/README.md` with the date it landed, the commit `main` then
pointed at, and a one-sentence reason. The row is written as part of the merge, before the push.

**Why.** The prototype is a research instrument, not a product, and a think-aloud session is only
reportable if it can be attributed to the exact build the participant used. Five production
deployments had already gone out with no record of what changed in any of them, which made that
attribution impossible after the fact and would have been impossible to reconstruct later than
this. Writing the row with the merge rather than afterwards is the whole mechanism: a log that is
kept up retrospectively is exactly as useless as no log during the window it is behind.

### The reason is Riona's, not the merge's

The deployment reason is supplied with the merge request and is not derived from the commit log. A
merge that arrives without one stops and asks. This is the same rule as `CLAUDE.md`'s standing "do
not invent a figure, a rule or a screen": the reason records intent, which is in the researcher's
head and not in the diff, and a plausible summary assembled from 44 commit subjects would read as
a record while being an inference. The four backfilled reasons here are Riona's own words, used
verbatim.

### Documentation-only merges take no number

A merge that changes only documentation or governance files and no prototype code or copy does not
take a version number. The numbers denote states of the prototype a participant could have seen,
so a number that no participant could ever be assigned to would dilute the one thing the column is
for. This is why the initial commit `e9da66d` is excluded: it carries `build-spec.md`, the Figma
file and `.gitignore.txt` and nothing that renders.

### Why the Commit column shifts by one from v5

A commit cannot contain its own SHA. For v1 to v4 the cell is exactly the commit `main` pointed at
after the merge, because those merges carried no log row. From v5 the row is committed on `build`
before the merge, so the cell names the last content commit of the version and the row itself sits
one commit above it. The alternative was filling the cell a deploy later, which is the
retrospective recording this decision exists to prevent. The offset is one README line that no
participant is served, so nothing a participant saw differs between the two commits.

### How the backfill was dated, and what it could not settle

`main` is linear: every merge so far was a fast-forward, so no merge commit exists and the graph
cannot date a deployment at all. The five moves came from `git reflog show main`, which reaches the
initial commit on 19 August 2026 and is therefore complete rather than truncated at the window's
edge. v1 is independently corroborated by the `v1.0` tag, "Build for pilot session", on `7f0f4cc` -
the only tag ever cut, which is why the tagging step in `docs/README.md` could not serve as this
record and a log was needed instead.

Four reasons were supplied against five code-bearing deployments. Three map on content with no
ambiguity: `ce2b482` wires the Mortgage in Principle flow into the Insights tab, `4a627bc` is a
copy and seeded-figure pass, and `3b11d8f` puts stamp duty in the goal and removes the 5/10/15%
range from the result page. `394565a` is the leftover and is **not** assigned a number here. It is
recorded in the table with `[UNKNOWN]` in both cells and raised as `GAPS.md` G104.

**To reverse.** Delete the section from `docs/README.md` and the three rules from `CLAUDE.md`. The
reflog that the backfill was read from expires 90 days after each entry, so the dates are not
recoverable from this repository once that window passes: the table is the only remaining record.

---

## D92. The logical viewport is fixed and the rendered frame is scaled

**Date.** 31 August 2026. `src/css/shell.css`, `src/shell-scale.js` (new), one measurement in
`src/components/ui.js`, and `scripts/frame-scale.test.mjs` (new). No screen, no copy, no figure and
no breakpoint changes.

### What was wrong

The pilot session on 31 August 2026 was run at **150% browser zoom from beginning to end**, and the
participant disclosed it at 32:32 only after finishing: "I have been viewing this entire page in 150
and I didn't realise that 100% is this small one around that this might be an issue for people."

Every judgement that session produced about type size, colour weight, axis legibility and reading
effort was therefore made at a magnification the next participant has no reason to reproduce. That
is a threat to the comparability of findings between sessions, not a presentation complaint, and it
blocks further sessions until the default is legible.

The cause is in this file's own history. The frame was scaled to FIT - `min(1, ...)`, shrinking on a
short window and never growing on a tall one - so the largest the phone was ever drawn was its
natural 393x852, on a 2560x1440 desktop as much as on a laptop. A 393px-wide phone occupies 15% of
that display's width, and 17px body text at 100% zoom on it is what the participant could not read.

### The trap that was not taken

The obvious fix is to let the frame fill the space it is given. **It must not.** The frame is a
simulation of a phone, and if its width becomes fluid the internal breakpoints resolve differently,
the layout inside changes, and every finding from the pilot becomes uncomparable with the sessions
after it. The instrument would no longer be the same instrument.

### The decision

**The logical viewport stays fixed and the rendered frame is magnified.** `.screen` lays out against
`--frame-width` x `--frame-height` at every window size - 393x852, unchanged, and NOT the 390x844 the
brief proposed as a starting point: this build's frame has been 393x852 since the first commit,
because the Figma source for frame 01 is unambiguously `w-[393px]` (shell.css's own header records
this), and re-establishing a different one would move every wrap point in the build.

The frame is then drawn through a CSS `scale()` about its top centre. Everything inside is untouched:
same breakpoints, same font sizes, same spacing, same wrapping, same line lengths. Only the
magnification differs, which is exactly what a participant changing browser zoom would have got - and
now they do not have to.

| Window | Scale | Frame drawn | Page scrolls |
| --- | --- | --- | --- |
| 1280x720 | 1.0 | 421x880 | yes, by 160px |
| 1280x900 | 1.0 | 421x880 | no |
| 2560x1440 | 1.5 | 632x1320 | no |

### The four rules the scale obeys

**Derived from height.** The frame is far taller than it is wide, so height is what runs out first.
Width is a second bound rather than the driver, and exists only so a narrow-but-tall window cannot
scale the frame wider than the page can hold.

**Never below 1.0.** This reverses the previous behaviour deliberately. On a window shorter than the
frame the page scrolls instead of the frame shrinking. Shrinking would put the prototype back below
100% and reintroduce the defect this exists to remove, and the two failures are not comparable in
cost: a participant who cannot see the bottom of a phone knows it and scrolls, where a participant
reading type that is 30% too small does not know and simply finds the app harder than it is.

**Capped at 1.5, and the figure is the participant's own.** 150% is the magnification they chose for
themselves and read a whole session at, which makes it the one upper bound in this build that is
evidence rather than taste. Uncapped, a 4K display would draw the phone about 900px wide, past any
phone a participant has held.

**The gutter collapses before the frame does.** `--space-4xl` of breathing room above and below is
what a window with room to spare gets; a window without it gives that space to the frame instead. A
900px-tall window - a maximised browser on a 1080p display, the commonest session setup there is -
would otherwise scroll by 60px purely to hold two margins. Where the cap binds, the gutter re-derives
from what the frame actually took, so the frame is centred in what is left rather than pinned to the
top with the remainder falling below it.

### Why the computation is JavaScript

`src/shell-scale.js`, no dependency, reading `--frame-width`, `--frame-height`, `--frame-bezel`,
`--space-4xl` and `--frame-breakpoint` off the stylesheet so no dimension is written twice. It sets
`--frame-scale` and `--frame-gutter` on `:root`, on load and on a debounced `resize` /
`orientationchange`.

A `clamp()` in the stylesheet was the first attempt and was rejected for two reasons.

1. **The scale is a length divided by a length.** CSS expresses that only through type-changing
   `calc()` division, which is CSS Values 4. It resolves in Chromium 151, measured rather than
   assumed - and an engine that does not support it drops the whole declaration, leaving no
   transform at all, silently, on a browser nobody checked, in the middle of a session.
2. **`#app-frame` needs the rendered height as a real layout box.** A transform does not resize a
   layout box, so a frame drawn above 1.0 would paint outside a box the page never reserved: clipped
   rather than scrollable, and unreachable below the fold. The same number is needed as a scale
   factor and as a length, and is derived once.

The stylesheet still declares `--frame-scale: 1` and the full gutter as fallbacks, so the state
before the script runs, and if it never runs, is the frame at its natural size.

**Under Node the module is inert.** Four test scripts and `shots.mjs` reach it through the import
graph with no `document`, so `root` is null and every entry point returns early. Found by running
them, not by reasoning about it.

### The transform moved off `#app-frame` and onto `.device-bezel`

`#app-frame` is now the LAYOUT box, sized to the frame's rendered dimensions, and `.device-bezel` is
the element the transform is on, centred inside it with `margin-inline: auto` and scaled about its
own top centre so its scaled edges land exactly on that box. D14 and `GAPS.md` G32 both describe the
transform as sitting on `#app-frame`; that is this decision's change, and both carry a note.

### D14's "the page never scrolls" is amended, in one case only

D14 made the page unscrollable in both views, on the reasoning that the phone is what scrolls and
reaching content by scrolling the browser window would be an artefact of the mock. That stands
everywhere the frame fits. Where it does not - a window shorter than 880px - `overflow-y: auto` at
framed widths is what makes the bottom of the phone reachable at all, and it is a no-op at every
window tall enough. `overflow-x` stays hidden in both views.

**And the page's own scrollbar is now the one this build does not hide.** G32 hid every scrollbar
because a desktop track inside a phone mock reads as a browser artefact. That reasoning is about
tracks INSIDE the bezel and is unchanged; this one is outside it, appears only on a window too short
to hold the frame, and is the only sign a facilitator gets that the bottom of the phone is below the
fold. A frame cut off with no affordance is the worse failure.

### The one measurement that had to be converted

`bindDateSelect` in `src/components/ui.js` - frame 10b's overlay listbox (D84) - is the only control
in the build positioned from measured geometry rather than from CSS alone. It measures the space
between its trigger and the action bar with `getBoundingClientRect()`, which reports what is DRAWN,
and applies the result as a `max-height`, which is resolved BEFORE the transform. Left alone, a frame
drawn at 1.5 would have measured half again more space than exists and set a list half again too
tall, reaching past the very bar it was measured against. The measurements are divided by
`frameScale()`. Anchoring itself needed nothing: the popover is `position: absolute` inside
`.date-select__field`, so it moves and scales with its trigger whatever the transform does.

### Verification

`scripts/frame-scale.test.mjs`, 7 tests, ~17s. It asserts the CONTRACT rather than the appearance,
because the property that matters is one no screenshot can show:

- `.screen` measures exactly `--frame-width` x `--frame-height` in layout pixels at both window
  sizes, and what is drawn is that box times the scale.
- The layout fingerprint of **every** element inside the frame - tag, class, `offsetTop`,
  `offsetLeft`, `offsetWidth`, `offsetHeight`, computed `font-size` - is identical at 1280x720 and
  2560x1440, across three screens. A single differing row would mean an internal breakpoint had
  resolved differently and the two sessions were no longer measuring the same thing.
- The scale is never below 1 and never above the cap; a short window scrolls by exactly its
  overflow; a tall window does not scroll at all; neither produces horizontal overflow.
- The listbox spans its own field, hangs from its trigger, and its clamped height stays clear of the
  dock **measured in layout pixels**, so both window sizes answer to the same number rather than one
  1.5x looser.
- Focus rings stay 2 logical pixels at 2px offset and stay inside the phone at both sizes.
- The scale recomputes on resize, in both directions, after the debounce.

Screenshots: frame 10b closed, frame 10b with the year list open, frame 10b with a keyboard focus
ring, and frame 33, each at 1280x720 and at 2560x1440, all on fresh tabs. `shots.mjs` gains
`--focus=<n>`, which presses Tab that many times before the shot - real key presses, because the ring
is on `:focus-visible` and a scripted `.focus()` does not necessarily raise it.

Suite: 408 tests, 407 passing, 1 skipped (G91's known intermittent), 0 failing - every script
`CLAUDE.md` lists plus the new one. `CACHE_VERSION` v100, `BUILD_VERSION` v100, confirmed reading
"Build v100" on frame 33 in a fresh tab.

**One thing a headless screenshot cannot show.** The restored page scrollbar: this Chromium draws
overlay scrollbars, so the track does not appear in a PNG. What was verified instead is that
`scrollbar-width` computes to `auto` on `html` and `body` at framed widths, that the page scrolls by
exactly its overflow (160px at 1280x720), and that a wheel over the phone chains to the page once
`.screen-content` reaches its end - so the bottom of the frame is reachable with the cursor anywhere,
not only over the canvas beside it.

### To reverse

Delete `src/shell-scale.js` and its two imports, and restore `#app-frame`'s
`transform: scale(min(1, ...))` with `.device-bezel` back to a plain fixed-size box. The frame
returns to shrink-to-fit and the prototype returns to being unreadable at 100% zoom, so the reason
for reversing would need to be a different fix for the same finding rather than a return to it.

---

## D93. Frame 10's heading is emptied to a visible placeholder rather than rewritten in a build session

**Date.** 31 August 2026. Raised by the pilot session of the same date; recorded as `GAPS.md` G106,
which stays open.

### The finding

Frame 10 asks "How would you like to work this out?" above "Set a monthly amount" and "Set a target
date". The heading names the app's mechanism and never names the participant's goal, so the choice
beneath it has no subject. The pilot participant stopped twice and the moderator explained the choice
aloud both times - "What am I working out exactly?" at 19:48, and at 20:17 "I don't understand what
that means. Like, it would be better off just saying, you know, how would you like to save for your
deposit?" G106 carries the quotes in full and the contamination argument.

### Why the string is not written here

Copy is not invented in a build session. That is not a formality on this screen: frame 10's copy is
already three decisions deep (D81 rewrote the hint, D83 and D86 the disclosures) and every string on
it has been through the FCA guidance-versus-advice check. A heading written to fit a build would land
without that check, in the one position on the screen a participant reads first.

So the key is wired and the string is left outstanding. **The keys already existed** -
`content['/calculator/saving'].headline`, `.segmentMonthlyLabel`, `.segmentDateLabel` and
`.pickOneCaption` are all read from `content.js` and none was hard-coded, so there was no wiring to
do beyond emptying the one that failed. The brief anticipated new dotted keys
(`calculator.step2.heading` and so on); they were not added. `content.js` is keyed by route, and
`headline` is the screen-title key on twelve screens - a second, parallel namespace for one screen
would be an architecture change `CLAUDE.md` forbids, and would break the spec-to-code mapping the
Figma frame names are the record for.

### Why a visible placeholder rather than an empty string

`[AWAITING COPY]` renders literally in the `<h2>` the real heading occupies. An empty string would
leave a blank band that reads as a design choice, and would ship silently; the placeholder is
unmissable in a screenshot, in a test and in a session. It is the same treatment `dateGoalAlreadyMet`
has carried since D85, and it is the reason that key has not been forgotten.

### What was deliberately not changed

The two option labels stand. They were understood the moment they were read aloud - the participant
repeats them back correctly - so this is a framing fix and nothing else. The option order, the
segmented control, both variants beneath it and the date control and its listbox (D84, D85) are
untouched.

`pickOneCaption` stands too, and this was a judgement rather than an omission. It sits directly
beneath the options and is part of the same framing, so it was a candidate; but it was not part of
what failed, and blanking a line that worked would widen a copy pass that has one line to write. It
is named in G106 so the copy pass judges it against the new heading instead of finding it afterwards.

### Verified

In a fresh tab, never a reload (D59), at 390x844: the placeholder renders visibly in `h2.screen-title`
at 350x30 rather than collapsing; the heading outline is `H1 "Deposit calculator"` then
`H2 "[AWAITING COPY]"`, so it is announced as a heading at the level its position calls for and no
level is skipped; both options are `<button>`s, tabbable, take focus, select on Enter and report
`aria-pressed="true"`, with the accessible name of each coming from its keyed label rather than any
inline string; and the heading survives the mode switch, being rendered on both variants.

`smoke.test.mjs` 30/30 and `overlap.test.mjs` 74/74 - the layout tests matter here because the
placeholder is shorter than the string it replaces at both text sizes, and a heading that no longer
wraps changes the geometry of everything below it.

`CACHE_VERSION` and `BUILD_VERSION` v100 to v101, a paired hand-edit. **The bump is required rather
than routine:** `./src/content.js` is in `SHELL_ASSETS` and the shell is served cache-first with no
revalidation, so shipping changed copy under v100 would leave every browser holding v100 serving the
old heading - the exact fault the README's rule was written for. Confirmed reading "Build v101" on
frame 33 in a fresh tab.

### To reverse

Restore the string to `content['/calculator/saving'].headline`. Reversing to the old wording would
reinstate a heading the pilot showed to be blocking, so the reason would have to be a different
heading rather than that one.

---

## D94. Frame 10's heading names the participant's goal, and "work out" is spent on this screen

**Date.** 31 August 2026. Lands the string D93 left `[AWAITING COPY]`, closing `GAPS.md` G106 and
opening G107 and G108. Copy only: no layout, interaction or control changed.

### The string, and where it came from

    content['/calculator/saving'].headline = 'How would you like to save for your deposit?'

**It is the participant's own phrasing**, offered unprompted at 20:17 on 31 August 2026 - after they
had failed the screen, while describing what would have worked:

> "it would be better off just saying, you know, how would you like to save for your deposit? Set a
> monthly amount or set a target date? That makes a bit more sense."

The heading it replaces, "How would you like to work this out?", named the calculation rather than
the participant's goal. They could not proceed without the moderator explaining the choice verbally
at 19:53 and again at 20:07, having asked at 19:48 "what am I working out exactly?".

**Supplied and approved, not written here.** That distinction is the whole reason D93 rendered a
placeholder on a live screen rather than filling the gap itself, and it is what makes this entry a
record of a decision taken elsewhere rather than a copy decision taken in a build session.

### The standing rule this sets

**Copy on frame 10 is written from the participant's goal, not from the app's arithmetic.** Saving
for a deposit is what the participant came to do. Working it out is what the app does about it, and a
heading that names the second gives the two options beneath it no subject to attach to - which is
precisely how a screen with two legible options became one nobody could answer.

**And "work out" is not reused on this screen.** It is the exact phrase that failed, so it is spent
here whichever string it appears in, whether or not that string is otherwise fine. This is stricter
than the finding strictly requires and is meant to be: the phrase now carries a known failure, and
re-earning it one string at a time is not worth the sessions it would cost to find out.

The rule is **forward-looking, and it has three known exceptions today** - `pickOneCaption`,
`provenanceKeyLabel` and `taxRateCaption` all still contain it. They were not rewritten, because this
pass had one approved string and rewriting three more would be writing copy in a build session, which
is the practice D93 exists to stop. They are recorded as **G108** so the rule is not read as a
description of the screen's current state, which it is not.

### What was deliberately not done

**No supporting line was written.** The brief was explicit that the screen carries a reading-effort
finding and that adding text works against it, and no `subheading` key was created for it - D93 did
not create one either, so there was nothing to remove. `pickOneCaption` predates both decisions and
is neither the key the brief meant nor this pass's to touch.

**The option labels are unchanged**, including their wording and their order. They are the untested
half of the finding, and G107 opens as a measurement on them rather than a fix: the participant's
19:48 question was about the *result*, and both labels still name *inputs*. Changing them now would
mean the next session tests the heading and the labels as one lump and a clean run would not say
which string did the work. One change, one session, one answer.

### Verified

In a fresh tab, never a reload (D59), at 390x844: the heading renders `How would you like to save for
your deposit?` character for character against the approved string, in `h2.screen-title`; no
`[AWAITING COPY]` remains anywhere on the screen in either variant; the outline is `H1 "Deposit
calculator"` then `H2 "How would you like to save for your deposit?"`, so it is announced as a
heading at the level its position calls for with the accessible name matching the rendered string;
both options are still `<button>`s, tabbable, focusable, selecting on Enter and reporting
`aria-pressed="true"`, with `aria-pressed` moving between them exactly as it did under D93; and the
heading is rendered on both variants, surviving the mode switch.

`smoke.test.mjs` 30/30, `overlap.test.mjs` 74/74, `date-ceiling.test.mjs` 41/41,
`action-bar.test.mjs` 79/79, `stale-session.test.mjs` 6/6. The layout tests carry weight here for the
same reason they did under D93 and more of it: the approved string is longer than both the
placeholder and the heading it replaces, so it is the wrap case, at both text sizes, with the
segmented control directly beneath it.

`CACHE_VERSION` and `BUILD_VERSION` v101 to v102, a paired hand-edit, for the reason the README gives
and D93 already hit: `./src/content.js` is in `SHELL_ASSETS`, the shell is served cache-first with no
revalidation, and **a v101 shell carrying the placeholder was served locally during D93's
verification**. Shipping the approved string under v101 would leave any browser holding that build
rendering `[AWAITING COPY]` on a live screen. Confirmed reading "Build v102" on frame 33 in a fresh
tab.

### To reverse

Restore the previous string to `content['/calculator/saving'].headline`. That reinstates a heading a
pilot participant could not proceed past without two moderator interventions, so the reason would
have to be a third heading rather than a return to the second.
