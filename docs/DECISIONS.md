# Design and calculation decisions

Authoritative where `build-spec.md` is silent. Where the two conflict, `build-spec.md` wins on navigation, state, routes and variable names; this file wins on visual language, rate sources and range rules.

Each decision records what was decided, why, and what it would take to reverse it. Open questions sit at the end and must be closed before the prototype goes in front of a participant.

Last updated: 19 August 2026

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

## Open questions

None remain open as of 19 August 2026 (second pass). All five originally listed here have been closed and folded into the decisions above: Q1 → D2 (confirmed), Q2 → D6, Q3 → D7, Q4 → D8, Q5 → D9. A sixth item, not originally an open question, was also corrected this pass: the regulatory basis for the Mortgage-in-Principle adviser route — see D10.

---

## Change log

| Date | Change |
|---|---|
| 19 August 2026 | D1 to D5 recorded. Q1 to Q5 opened. |
| 19 August 2026 (session 2) | D6 to D10 recorded. Q1 to Q5 closed and folded into D2, D6-D9. |