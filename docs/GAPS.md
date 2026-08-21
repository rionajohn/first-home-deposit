# Gaps

Every hole the spec marks in itself, every conflict found between `build-spec.md`, `DECISIONS.md`,
the Figma file, and the reference PNGs, and how each was resolved. Resolutions made this session are
also recorded in `DECISIONS.md` (D6–D10) where they're a standing design decision rather than a
one-off note. Screenshot-comparison exemptions referenced below apply during the build's automated
per-screen verification pass (see `SPEC.md`).

---

**G0. File path/extension mismatches.** `build-spec.md` was at the repo root instead of `docs/`;
`docs/DECISIONS.md` and `docs/figma-links.md` existed but with a stray `.txt` suffix. Content in
both was correct. *Status: resolved — files renamed/moved, `DECISIONS.md` synced (D6–D10, Q1–Q5
closed).*

---

**G1–G11. The 11 rows marked "No frame drawn" in `build-spec.md` section 2.** Recounted directly
against the table — not the 14 first estimated, not the "fifteen" `DECISIONS.md` originally said (Q3
corrected, see D7):

1. 04 Consent declined — at bound (slider handle at min/max)
2. 05 / 05b What we can see — error (left-over ≤ 0, or entered value exceeds money-in)
3. 06 What we found — emergency fund short
4. 06 What we found — no accounts assigned (saved-toward-deposit = 0)
5. 09 Property and deposit — error (non-numeric, zero, or implausible property-value)
6. 10 / 10b How you'll save — error (savings-rate > left-over, or target date in the past)
7. 12 Your deposit range — beyond the chart window (months-to-target > 60)
8. 12 Your deposit range — unreachable (savings-rate = 0)
9. 15 / 16 Deposit tracker — goal met (saved-toward-deposit ≥ deposit-target)
10. 17 Mortgage in Principle — locked (mipUnlocked = false, reached only by deep link)
11. 19 Before you run the check — incomplete (a held figure is missing)

*Status: resolved (D7) — each gets a fallback built from existing component patterns (error banners,
empty-state cards, locked-row styling), not blocked navigation.*

---

**G15. Frame 09b — which rule triggers the Lifetime ISA cap warning.** `build-spec.md` section 2
flagged this itself: annual LISA payment > £4,000, or property value > £450,000. *Status: resolved
(D6) — property-value > £450,000.*

---

**G16. Frame 07 "Generic savings goal".** Not a gap — `build-spec.md` section 3 already marks it
"Remove." Excluded from the build.

---

**G17a. Frame 13's "See it as a diagram" row — dead end.** Links to an LTV diagram screen that was
never drawn (the likely candidate for the missing frame 14). *Status: resolved (D8) — row removed
entirely from frame 13's "Want more on this?" card. The video row (linking to the built frame 13b)
stays. Recorded as an intentional deviation from the reference PNG — exempt from the
screenshot-comparison pass.*

---

**G17b. MIP results' "Talk to someone about it" row — dead end, kept and built.** Frames 20 and 21
both link to an adviser-contact flow that was never drawn (likely within the missing 22–28 range).
*Status: resolved (D8, D10) — kept as a genuine, tappable, resolving control, because whether a
participant reaches for it — especially at the not-yet outcome — is itself a research finding, not
an artefact to hide.*

Built as a new terminal stub screen at `/mip/adviser`: a short confirmation that a request has been
logged and the bank's mortgage adviser will be in touch, carrying the guidance-not-advice line from
`content.shared.regulatory`, and a back route to the result screen the participant came from. No
form, no booking calendar, no real handoff.

**Regulatory basis correction:** the obligation to offer this route is not FCA PERG 4.6.25B(5) —
that's boundary guidance keeping the tool on the guidance side of advice, not a requirement to
signpost advice. The correct basis is MCOB 4.8A (execution-only sales: the customer must be told
they can request advice) and the Consumer Duty consumer support outcome (no unreasonable barriers to
pursuing financial objectives). Recorded this way in `DECISIONS.md` D10 and the regulatory anchor
map in `SPEC.md`, not under PERG 4.6.

Recorded as an intentional deviation from the reference PNGs, added to the inventory as a new
screen, and given its own step in end-to-end verification.

---

**G18. "Assumed" rows in the Navigation table that change what a session would observe.** Quoted
from `build-spec.md` section 1's "What changes in state" column:

- 03 → tap account row → 03b: `selectedAccountId = row id; returnFrame = 03`
- 03b confirm move → 03: `Account moved to the deposit set; saved-toward-deposit recalculated`
- 04 "Continue with general figures" → 09: `mode = general; property-value seeded from area average only`
- 09a continue with empty fields → 09a: `Button state = disabled; no state change`
- 09 / 10 / 10b form-header close → 10c: `returnFrame` set
- 10c Leave → 01: `Draft inputs retained; journeyPaused = true`
- 10c Keep going → returnFrame: `none`
- 12 primary action (save goal) → 15 or 16: `goalSaved = true; checkpoint-amount = 0.75 x deposit-target`
- 13b close → 13: `Explainer card state = video-seen`
- 19 edit a "We've already got" figure → 19: `Data variable overridden; provenance switches to entered`
- 21 assumptions link → 31: `returnFrame = 21`

*Status: accepted as the build's navigation model — no conflicting evidence found in Figma or the
PNGs.* A second, lower-stakes group of ~23 "Assumed" rows are all "back button → the screen you
arrived from, no state change" — accepted as-is without individual listing, since the pattern is
uniform and carries no calculation risk.

---

**G19. Calculation rules undetermined after `DECISIONS.md`.** Monthly rate convention was fully
resolved in D4 (`(1 + AER)^(1/12) - 1`, explicitly not nominal/12), rate pinned at 3.75% by D3,
superseding `build-spec.md`'s own 4.1% figure. Rounding and currency format were open (Q5). *Status:
resolved (D9) — round to the nearest £1 for on-screen display (model keeps full precision); en-GB
locale, £ symbol, thousands separator; no pence shown.*

---

**G20. borrow-low/borrow-high central value.** `DECISIONS.md` D2 assumed `loan-amount` but flagged it
as open (Q1) against the alternative reading (salary held at frame 19). *Status: resolved (D2,
confirmed) — loan-amount, consistent with how `max-property` is already derived (`borrow-high` +
`saved-toward-deposit`).*

---

**G21. Breakpoint/device-frame behaviour between 600–900px.** Not addressed anywhere in
`build-spec.md` or the original `DECISIONS.md`. *Status: resolved — single snap point at 768px.
Below: frameless, fills viewport. At/above: static phone frame (393×852), scaled to fit viewport
height per G27.*

---

**G22. State reset between participants.** Not addressed as a decision in either document. *Status:
resolved — manual only, via frame 33's existing "Clear all progress and start again" action. No
auto-reset.*

---

**G23. Frame 33 reachable to the facilitator, not discoverable by a participant.** Not addressed
anywhere. *Status: resolved — hidden route (`/settings`), never linked from any on-screen element.*

---

**G24. Section 5 (Regulatory anchors) — missed in the first research pass over `build-spec.md`, now
incorporated in full.** Verbatim:

| Constraint | Where it comes from and how it shows up |
|---|---|
| Guidance, not advice | FCA PERG 4.6, in particular PERG 4.6.25B(5) on eligibility tools. Every result screen carries the guidance line and the adviser-scope line. |
| Repossession warning | MCOB 3A. Not the superseded MCOB 3.6.13R. |
| Automated decision-making | Data (Use and Access) Act 2025, Articles 22A to 22D. Three commitments: a way to push back (Feedback / Report sheet), plain wording where something is automated, and visible sources. |
| Deposit protection | FSCS, £120,000 per person. Shown on 03 only, for accounts held with the bank. |
| Credit search | Soft search only at 19b. Any hard search sits outside this prototype. |

*Status: resolved — see the regulatory anchor map in `SPEC.md`, and G26/G28 below for how each
constraint was actually verified against the reference PNGs rather than reasoned about.*

---

**G25. FSCS note conflict — `build-spec.md` vs. the reference PNGs.** Section 5 says FSCS protection
is "shown on 03 only," but the PNGs also show an FSCS note on frame 06 and frame 32. *Status:
resolved — follow section 5 (03 only), for a specific reason, not as a tie-break: FSCS protection is
per person per authorised institution. Frame 03 is the only screen showing accounts individually,
attributed to where each is held — the only context in which the note is accurate. Frames 06 and 32
show aggregated figures that may span institutions and, in estimate mode, include balances the bank
cannot see, so a note there would imply protection over money it doesn't cover. Section 5's
qualifier "for accounts held with the bank" is the operative part of the rule. Recorded as an
intentional deviation from the reference PNGs on 06 and 32 — exempt from the screenshot-comparison
pass. `content.js`'s FSCS figure reads £120,000 per person per authorised firm (raised from £85,000
on 1 December 2025; current).*

---

**G26. "Every result screen" (section 5) needed direct verification against the reference PNGs, not
reasoning about which screens count as "result" screens — done for all 33 frames, not a sample.**

The **guidance-not-advice line** ("This is guidance based on your account activity. It is not
financial advice and does not take account of everything about your situation.") was checked
directly, screen by screen, and is confirmed present, verbatim, on: 02, 03, 03b, 04, 05, 06, 08, 09,
09a, 09b, 10, 10b, 11, 12, 13, 13b, 15, 16, 17, 18, 19, 20, 21, 29, 30, 31, 32 — every screen in the
flow except 01 (bank home, outside the feature), 05b (carries a different, estimate-specific line
instead — see G26's estimate-disclosure finding below), 10c and 19b (minimal modal/loading states),
and 33 (prototype-only, outside the participant journey).

The **adviser-scope line** ("Our advisers only advise on our own mortgages.") was checked directly on
06, 12, 15, 16, 20, and 21 — not inferred from structural pattern. It is confirmed present only on 20
and 21, where the "Talk to someone about it" row actually appears. It is confirmed **deliberately
absent** from 06, 12, 15, and 16: no adviser route is offered on those screens, and this line is a
scope disclosure about a specific service, so it belongs only where that service is offered. It was
not added there — doing so would be a design change made during the build, not something the
reference PNGs or `build-spec.md` ask for.

A **fourth fixed regulatory line** was found while doing this verification, distinct from the
guidance-not-advice line: an **estimate-specific disclosure** — "This is an estimate based on the
information we hold today. It is not an offer and your actual figures may be different." — shown
wherever a figure on screen is a modelled estimate rather than a read/derived one. Confirmed present,
verbatim, on **04, 05b, 12, 20, and 21** (broader than just 05b, which is where this was first
noticed).

*Status: resolved. The guidance-not-advice line's anchor scope is every screen where it's actually
drawn (listed above), not a narrower "result screen" reading of section 5. The adviser-scope line's
anchor scope is 20, 21, and the new `/mip/adviser` stub only. The estimate-specific disclosure is a
fourth key in `content.shared.regulatory` (`estimateDisclosure`), scoped to 04, 05b, 12, 20, 21.*

---

**G27. Device frame at a real laptop viewport.** The 393×852 frame, fixed and unscaled, overflows
vertically on a 1366×768 laptop once bezel is added — the resolution most participants will likely
be on, since sessions run over Teams. *Status: resolved — the framed view scales down to fit the
viewport height, preserving aspect ratio, rather than scrolling or clipping (see `SPEC.md`).*

---

**G28. DUAA pushback mechanism missing from frame 05b.** While verifying the DUAA 2025
automated-decision anchor directly against every listed screen (04, 05, 05b, 06, 08, 09, 09b, 10,
10b, 11, 12, 13, 13b, 15, 16, 20, 21, 32): 05b's reference PNG has no "something doesn't look right"
flag row anywhere on the screen, unlike every other figure-presenting screen in the flow, including
05 — the exact screen 05b is a variant of. 05b does carry the other two DUAA commitments (plain
wording, via the estimate-specific disclosure; visible sources, via both "How we worked these out"
and "Where these figures come from" links, both fully visible unlike on 05 where one is cut by the
fold).

*Status: resolved by adding the flag row to 05b. Unlike the adviser-scope line (G26), there's no
service-boundary reason for its absence here — estimate-mode figures are exactly where a participant
is most likely to want to challenge a modelled figure, so this reads as an oversight in the wireframe
rather than a deliberate scope decision. Recorded as an intentional deviation from the reference
PNG, exempt from the screenshot-comparison pass.*

---

**G29. Persistent bottom navigation bar - not in any reference PNG.** No frame other than 01 draws a
bottom bar, so on frames 02-32 this is a control the wireframes do not show. *Status: resolved (D11)
- frame 01's own five-tab bank navigation is rendered on every full-screen journey screen, its Home
tab routing back to frame 01 from anywhere in the journey; the other four tabs stay as inert as they
already are on frame 01. Added deliberately at the build stage, because the wireframes otherwise give
a participant no visible way back to the start except one back tap per screen, which in a moderated
think-aloud means the facilitator intervening. Recorded as an intentional deviation from the
reference PNGs - **exempt from the screenshot-comparison pass** on every screen it appears on,
alongside the frame 13 (G17a, diagram row removed), frame 32 (G25, FSCS note removed) and frame 05b
(G28, DUAA flag row added) exemptions.*

Excluded, and therefore diffed normally: the seven sheets (03b, 10c, 13b, 29, 30, 31, 32), 19b while
the check is running, and 33. One qualification: on the calculator's step flow (09, 09a, 09b, 10,
10b, 11) the bar is present but its Home tab opens 10c rather than jumping to 01, so that
`build-spec.md` section 1's own draft-retention rule (`journeyPaused = true`, draft inputs retained)
is not bypassed. See D11 for the full reasoning on each.

---

**G30. Collapsible sections drawn open in the PNGs, built closed.** Frames 05, 05b, 06 and 19 all
draw their disclosures expanded (chevron up), and `build-spec.md` section 2's "breakdown open /
closed" row says the breakdown "opens by default." *Status: resolved (D12) - built closed on every
load, including on re-entry by back navigation, and open state is never carried between screens. A
section that is already open cannot show whether a participant would have chosen to open it, and
whether someone goes looking for the breakdown behind a headline figure is one of the behaviours
these sessions exist to observe. Recorded as an intentional deviation from the reference PNGs on 05,
05b, 06 and 19 - **exempt from the screenshot-comparison pass for this difference only**; everything
else on those four screens is diffed normally.*

Note this overrides a line of `build-spec.md` itself, not only the PNGs - the one place in this
build where `DECISIONS.md` wins on a point section 2 states explicitly. It is recorded here rather
than silently applied for exactly that reason.

---

**G31. `prefers-color-scheme` made the participant's OS decide the palette.** `tokens.css` carried a
full `@media (prefers-color-scheme: dark)` block, so a participant on a device set to dark mode saw
a different colour scheme from one on a device set to light - and neither the spec nor the reference
set (light mode only in Figma) ever asked for that. Not previously recorded as a gap. *Status:
resolved (D13) - light mode is now fixed on every device: `color-scheme: light` on `:root`, and the
dark palette moved behind an explicit `.theme-dark` class that only frame 33's Theme control can
reach, cleared by `resetState()`. No screenshot exemption needed: the reference PNGs are light, and
this makes the build match them on every device rather than only on some.*

---

**G32. The page behind the device frame could scroll, and the frame could outgrow its bezel.** Two
related shell defects found while closing the overflow brief, neither previously recorded. (a)
`#app-frame` is scaled with a transform, which does not shrink its layout box, so on a viewport
shorter than the unscaled frame the body overflowed and the browser offered a scrollbar down the
side of the mocked phone. (b) `#app { min-height: 100vh }` out-specified (id beats class) the framed
`height: var(--frame-height)` on `.screen`, so on any viewport taller than 852px the screen stretched
past the bezel it is meant to be clipped by. *Status: resolved (D14) - `html, body { height: 100%;
overflow: hidden }` in both views, `overflow: hidden` on `.device-bezel`, and the `#app` min-height
rule removed. Scrollbars are hidden in both views while the content stays scrollable by touch, wheel
and keyboard - `overflow-y: auto` on the scroll containers is untouched, so focus-driven scrolling
still works. No screenshot exemption: this changes what surrounds the screen, not what is on it.*

---

**G33. Keyboard-only scrolling in a region with no focusable content - open, low risk.** With the
scrollbar track hidden (G32), a keyboard-only participant scrolls a region by tabbing to a control
inside it, which scrolls that control into view. Verified working. What is *not* covered is a screen
whose overflowing region contains no focusable element at all: arrow keys would not scroll it,
because the region is not itself a tab stop. No such screen exists in the current build - every
screen with overflow carries an action bar, a link row or a disclosure below the fold. *Status: open,
deliberately not pre-empted.* The standard fix (`tabindex="0"` on `.screen-content`) would add a
focus stop and a visible focus ring around the whole content area on every screen in the flow, which
is a visible change to all 32 of them for a case that does not currently arise. Re-check if a
text-only screen with overflow is ever added.

---

**G34. Icons were inconsistent with each other, and are now redrawn as one set.** Not previously
recorded as a gap. The Figma-exported `.svg` assets each carried their own source canvas, so an
identical nominal stroke rendered between ~1.5px and ~4.0px depending on the asset — a list-row
chevron drew two to three times heavier than the back arrow beside it on the same screen. Three
size inconsistencies came out of the same audit: `back.svg` at 24px vs `close.svg` at 20px in the
same app-bar cell, `.info-link__icon` at 16px on frame 04 vs 20px elsewhere, and
`.list-row__chevron` at 16px on frame 33 vs 20px elsewhere. Four icons were also drawn as literal
text characters rather than artwork at all: "checkmark" and "circle" on frame 19, a bullet on frame
04, and a right arrow on frame 32 — each rendered in whatever weight and baseline the participant's
own system font gave it, beside real icons drawn at a fixed weight on the same row.

*Status: resolved (D15) — one set in `src/icons.js`, inline SVG on a shared 24x24 canvas, drawn to
SF Symbols conventions, sized and weighted from the type scale in `tokens.css`. All 24 UI `.svg`
assets deleted and dropped from `sw.js`'s precache list. Recorded as an intentional deviation from
the reference PNGs on every screen — **exempt from the screenshot-comparison pass for icon rendering
only**, alongside the frame 13 (G17a), frame 32 (G25), frame 05b (G28), bottom-navigation (G29) and
collapsed-disclosure (G30) exemptions. Everything else on every screen is still diffed normally.*

Two related findings recorded but deliberately **not** acted on, because both would change what an
icon means rather than how it is drawn, and that is a design decision rather than a restyle:

- `warningBannerHTML` (the D7 red error banner) renders an info circle, while `riskWarningHTML` (the
  neutral regulatory box) renders a warning triangle. That is the wrong way round on the face of it.
  Left as drawn; flag if it should swap.
- Nothing in the prototype uses a padlock. Frame 15's "locked" milestone is drawn as a dashed ring
  around a faint star, consistent with the other two milestone states. `lock` is drawn as part of
  the set but is currently unused.

---

**G35. Frame 03 — the "Your accounts" card drew over the consent checkbox.** Not a positioning bug:
`.screen-content` is a flex column, and a flex item's default `flex-shrink: 1` compresses items
*below their content height* when the column overflows, instead of letting the column scroll. An item
whose automatic minimum size protects it (a plain text block) survives that; one that sets its own
`min-height` does not, because an explicit `min-height` replaces the automatic minimum.
`.checkbox-row` sets `min-height: var(--touch-target-min)` for the 48px touch target, so on frame 03
it was compressed from its natural 132px to exactly 48px — its title and body spilled out of the
shrunken box, and the "Your accounts" card, laid out immediately after that 48px box, drew straight
over them. The `<hr class="divider">` on the same screen was being compressed from 1px to 0 by the
same rule, so the rule under "Are your main savings with us?" was not drawing at all.

*Status: resolved — `.screen-content > * { flex: 0 0 auto }` in `components.css`. Every child now
keeps its natural height and `.screen-content`'s own `overflow-y: auto` scrolls, which is normal
document flow inside the device frame. Verified across all 28 routes: no `.screen-content` child is
compressed below its content height on any of them. No screenshot exemption — this restores what the
reference PNG draws rather than deviating from it.*

---

**G36. Frame 03 — "N of M selected" counted the wrong set, and the checkbox had no third state.**
The count was derived, but from the wrong rule: M was the number of accounts currently filed under
"Toward your deposit", so it read "4 of 4" and the checkbox was binary. Two consequences. The Stocks
and shares ISA — a savings account the bank has not sorted yet — was invisible to the count, so a
participant had no signal that anything was outstanding. And `build-spec.md` section 2's own
"all-selected / some-selected ... Checkbox state = checked / indeterminate" row had no reachable
indeterminate state at all, because M shrank in step with N whenever an account was refiled.

*Status: resolved.*

- **The rule now lives in one place.** Each account in `src/model/accounts.js` carries an explicit
  `countsTowardDeposit` flag rather than the rule being inferred from the account's name or category
  at render time. Counting: Pot, Savings, Cash ISA, Lifetime ISA, Stocks and shares ISA, including
  one not sorted yet. Not counting: a current account, a short-term goal pot (the holiday pot), and
  the emergency fund.
- **The emergency fund is the one judgement call.** It is a Pot, so on type alone it would count, but
  `emergency-fund` is its own section 6 variable held deliberately separate from
  `saved-toward-deposit`, and frame 06 tells the participant in as many words that it is not counted
  toward a deposit. Counting it here would contradict the next screen. Flagged `false`; it is one
  boolean to change.
- **M is a property of the data, not of the filing.** M is every counting account (5), and does not
  shrink when a participant refiles one on 03b — an account moved to the emergency fund is still one
  of your savings accounts. N is how many of those are being counted right now. So the screen now
  opens at **4 of 5, indeterminate**, which is the state `build-spec.md` describes and the reference
  PNG never showed.
- **Three-state, natively.** The row is a real `<input type="checkbox">` inside a `<label>`, not a
  button with `role="checkbox"`, because `indeterminate` exists only as a DOM property — there is no
  attribute for it, and `aria-checked="mixed"` on a button only approximates what a screen reader
  reads off the native control. The input is visually hidden but stays in the accessibility tree and
  stays focusable, with its focus ring drawn on the box beside it. The consent-statement checkbox on
  the same screen was converted to the same implementation rather than leaving two parallel ones.
- **Figures recalculate on every change.** `accountFigures()` in `accounts.js` is called by the
  select-all row and by a 03b move, not only by "Agree and continue", so `saved-toward-deposit`,
  `emergency-fund` and `unassigned` always match what the screen is showing. Provenance follows
  `DECISIONS.md` D5: `read` (or `estimated` in estimate mode) while untouched, `entered` once the
  participant has changed which accounts count, propagating from there to everything derived
  downstream.
- **Deviation from the reference PNG.** Frame 03's PNG draws "4 of 4 selected" with a fully checked
  box. Under the rule above the same screen opens at "4 of 5 selected", indeterminate. That is the
  rule working, not a defect — **exempt from the screenshot-comparison pass for the select-all row's
  count and checkbox state only**; everything else on frame 03 is diffed normally.

One thing worth a look before sessions, recorded rather than fixed because fixing it would mean
drawing UI the wireframes do not have: with all accounts deselected, the four accounts still list
under "Toward your deposit" with a £0 group total, and a deselected account is visually identical to
a selected one. The reference draws no per-account checkbox — selection is all-or-nothing via the
select-all row, plus per-account filing via 03b — so the group subtotal and the "0 of 5 selected"
count are the only signals. If a per-account selection control is wanted, that is a design addition
to make deliberately.

*Closed 20 August 2026 — that addition was made deliberately. See G37 and `DECISIONS.md` D16.*

---

**G37. Frame 03 — a per-account checkbox, and a scroll jump on every in-place update.** Two things,
raised together because the second made the first unusable.

**The scroll jump.** Toggling "Select all accounts" sent the screen back to the top and dropped
keyboard focus. Not a scroll-restoration bug — a re-render bug. Every screen module builds itself
with `container.innerHTML = ...`, so a toggle handler calling its own `render` destroyed and rebuilt
`.screen-content`, the element that owns the scroll position; the browser had nothing to restore
`scrollTop` onto and `document.activeElement` fell back to `<body>`. Auditing every in-place
re-render found **18 call sites across 8 screens** with the same defect — frames 03, 04, 05, 05b, 06,
09, 09a, 09b, 10, 10b and 33 — not the one screen it was reported on. Frame 11 was checked and is
clean: its change links navigate rather than re-render. Frame 19's "edit a held figure" action from
`build-spec.md` section 1 turns out not to be built at all, so there was nothing there to fix; its
three disclosures did have the defect and now do not.

*Status: resolved (D16). Frame 03's account card patches itself in place — `syncAccounts` in
`consent.js` sets checkbox properties, the count and the group subtotals directly, and rebuilds only
the group-list subtree when a tick actually moves an account between groups, never the scroller.
Everywhere else re-renders through `rerenderInPlace` in `components/ui.js`, which records and
restores the scroll offset, the focused control and its text selection. No screenshot exemption —
this is a defect repair, not a deviation.*

One limit, stated because it will show in any measurement: where an update makes the content shorter
(selecting all empties the "Not sorted yet" group, removing its header, its "Sort this out" button
and a spacer), the scroller's maximum drops and the offset is clamped to it. Holding the old offset
is impossible when there is no longer that much to scroll; the screen stays pinned where it was
rather than resetting to the top.

**The per-account checkbox.** Each counting account now carries its own checkbox, so a participant
can see *which* accounts are counted, not only how many. Only accounts flagged `countsTowardDeposit`
get one, from the same flag the count and the totals read; a current account and a holiday pot get
none, and no empty placeholder either — an unticked box on an account that can never be counted
would invite a tap that does nothing. The row is now two separate targets, both at least 48px and
non-overlapping: the checkbox toggles selection, and everything else on the row still opens 03b.

*Status: resolved (D16) — this is the design addition G36 left open, now made deliberately. Ticking
follows exactly the rule the select-all row already had (`toggleAccountPatch` is `selectAllPatch`
narrowed to one account), asserted in `accounts.test.js`: ticking all five one at a time gives the
same selection as one select-all. **Exempt from the screenshot-comparison pass for the account rows'
checkboxes and the select-all count only**, alongside the frame 13 (G17a), frame 32 (G25), frame 05b
(G28), bottom-navigation (G29), collapsed-disclosure (G30), icon-rendering (G34) and select-all-count
(G36) exemptions. Everything else on frame 03 is still diffed normally.*

---

**G38. The action bar was visible from first paint on every screen — now it waits for the end of
the content.** Not previously recorded. Every reference frame draws the primary button present from
the start, so on the 21 screens whose content overflows this is a control the wireframes show and
the build now withholds.

*Status: resolved (D17) — the bar appears once the scroll container reaches its bottom (2px
tolerance for sub-pixel rounding), hides again on scrolling back up, and is not sticky once
revealed. On the 8 screens whose content fits it is visible immediately and stays: there is no end
to reach, so no gesture is waited for. Recorded as an intentional deviation from the reference PNGs
— **exempt from the screenshot-comparison pass for the action bar's visibility and the scroll
affordance only**, alongside the frame 13 (G17a), frame 32 (G25), frame 05b (G28),
bottom-navigation (G29), collapsed-disclosure (G30), icon-rendering (G34), select-all-count (G36)
and per-account-checkbox (G37) exemptions. Everything else on every screen is still diffed
normally.*

**Which case each screen is in**, measured at 390x844 with disclosures closed per D12:

- **Overflows (22)** — 02, 03, 04, 06, 08, 09, 09b, 10, 10b, 11, 13, 13b, 15, 16, 18, 19, 20, 21,
  29, 30, 31, 32
- **Fits (7)** — 03b, 05, 05b, 09a, 10c, 17, `/mip/adviser`
- **No action bar (4)** — 01, 12, 19b, 33

D12 is the reason the middle list is as long as it is, and this is worth knowing before sessions:
frames 05 and 05b carry a breakdown the wireframes draw open, and closed they are 345px of content
in a 732px box. A facilitator who expects every screen to require a scroll will be wrong about a
quarter of them.

**Two things that came out of building it, both recorded rather than left implicit:**

- **`visibility: hidden` could not be used**, although the brief named it. It removes an element
  from the accessibility tree and makes it unfocusable, which would leave a keyboard-only
  participant on a long screen unable to reach the control that moves them forward. The hidden
  state is `opacity: 0` plus `pointer-events: none`, which keeps the bar rendered, focusable and
  announced. Verified against the real accessibility tree over CDP on an overflowing screen, a
  fitting screen and a sheet.
- **The bar could not simply collapse when hidden.** Collapsing changes the scroller's height,
  which changes whether the content overflows, which changes whether the bar should show — and on a
  screen overflowing by less than the bar's own height (09a by 104px, 13b by 61px, against a ~136px
  bar) that loop oscillates. The content scrolls *under* the bar instead, with a matching padding
  inside the scroller. Reclaiming that height is what moved 09a into the fits case. The overlap is
  scoped to full screens: it needs a flex container with a definite height for the freed space to be
  redistributed, and a sheet card is content-sized, so applied there it dragged the bar over the last
  row (it hid 03b's third purpose option). Sheets get the same behaviour from an absolutely
  positioned dock instead — see G39. 13b, overflowing by 61px, stays on the overflow side.

---

**G39. Sheets floated off the bottom of the phone screen.** A band of empty space sat below the last
element and above the bezel on 03b and the four assumptions sheets, so the content read as floating
away from the bottom of the device. Two causes, both introduced by the safe-area (D14) and
action-bar (D17) passes, and one of them a single container measuring wrongly.

**The container.** `.sheet-overlay` placed the bottom safe-area inset as its own `padding-bottom`.
The overlay is the flex parent with `justify-content: flex-end`, so that padding sits OUTSIDE the
card and lifted the whole sheet 34px off the bottom of the phone screen - and the band it left
paints the scrim, so the card visibly floated. The identical geometry on a full screen never read as
a defect, because `.screen`'s band paints `--color-bg`, the same colour as the app behind the tab
bar. Measured at 1440x900: card bottom 31.7px above the screen bottom on every sheet; 0 at 390px
only because `env()` resolves to 0 in a desktop browser, so a real notched phone would have shown it
at both widths.

**The second contributor.** On sheets whose content overflows (29, 30, 31, 32, 13b) D17's action-bar
dock reserved the bar's height while the bar was invisible, adding a further 75-81px of blank card.
Full screens avoid this by letting the content scroll under the hidden bar; that overlap had been
scoped out of sheets deliberately.

*Status: resolved.*

- The bottom inset moved inside the card, as `padding-bottom` on the sheet's own action bar, so the
  card's surface reaches the bottom edge and the inset band paints that surface.
- Both insets now resolve from one pair of variables - `--safe-top` / `--safe-bottom` in
  `shell.css` - instead of each container spelling out its own `max(env(...), floor)`. That is how
  the two came to disagree in the first place.
- The sheet dock is now `position: absolute; bottom: 0` inside the card, so a sheet's content scrolls
  under its bar exactly as a full screen's does. An out-of-flow child contributes nothing to the
  card's height, so this works on a content-sized card where the full-screen negative-margin trick
  does not.

Verified at both sides of the 768px breakpoint, on all seven sheets and on full screens: the lowest
chrome ends 0px above the phone-screen bottom on a sheet (the inset is inside the card) and exactly
one inset above it on a full screen (the band is the inset, nothing beneath). Scrolled to the end,
the last real content clears the bar by its normal 24px on every sheet, and 03b still shows all
three purpose options. No screenshot exemption - this restores the geometry the reference PNGs
draw rather than deviating from it.

---

**G40. Full screens floated off the bottom edge — the same mistake as G39, one level up.** The tab
bar stopped 34px short of the bottom of the phone screen, leaving a band of page background beneath
it. G39 had already found and fixed this exact placement error on sheets; it survived on full
screens for one more pass only because the band paints `--color-bg` there — the same colour as the
app behind the tab bar — while a sheet's band paints the dark scrim and so announced itself.

**Cause.** `.screen` carried the bottom safe-area inset as its own `padding-bottom`, which puts the
inset *underneath* the tab bar rather than inside it. Every flex child of `.screen` therefore ended
above the band, exactly as D14's first pass described and intended — the intent was the defect.

*Status: resolved.* The inset is not deleted, it moves. `.screen` zeroes its own `padding-bottom`
wherever bottom chrome exists to carry it, and that chrome takes the inset as its own padding:

| Lowest chrome | Carries the inset | Screens |
|---|---|---|
| Tab bar | `padding-bottom` + `height: calc(56px + var(--safe-bottom))` on `.bottom-nav` | 19 full screens |
| Action bar with no tab bar under it | `padding-bottom` on `.screen > .action-bar-dock:last-child .action-bar` | none currently |
| Sheet's action bar | unchanged from G39 | the 7 sheets |
| Nothing | `padding-bottom` on `.screen`, the fallback | 19b, 33 |

The second row is unreachable today — every screen with an action bar also has the tab bar below it,
and the two screens without a tab bar have no action bar. It is written for when D11's exclusion
list changes, and was exercised for verification by temporarily excluding `/mip` from the tab bar
and measuring the result, rather than asserted from the rule alone.

**Measured, not trusted.** G39 lost time to a longhand silently reset by a same-specificity
shorthand further down the file, and this touches the same two files, so every claim below is a
computed value or a measured rect:

- distance from the bottom of the lowest chrome to the bottom of the phone screen: **0px** in all
  three cases, at both 390px and 1440px;
- `.screen` computed `padding-bottom`: **0px** where chrome carries the inset, **34px** on 19b/33
  at framed widths;
- `.bottom-nav` computed height **90px** with `padding-bottom: 34px` framed, **56px / 0px**
  frameless — `env()` is 0 in a desktop browser, so the frameless view is the plain 56px it always
  was and a real notched phone gets its own value;
- the lone action bar's computed `padding-bottom`: **50px** framed (16 normal + 34 inset);
- touch targets clipped at the top of the inset band still measure **51–56px**, so none relies on
  the inset to clear D1's 48px minimum;
- `.screen-content` box height **647px** framed, identical before and after — the inset moved from
  one side of the bar to the other, it was not reclaimed.

The new selector is `.screen > .action-bar-dock:last-child .action-bar`, deliberately more specific
than the `padding` shorthand on `.action-bar` rather than merely later in the file, so source order
cannot silently undo it.

One pre-existing thing surfaced by the touch-target measurement and left alone: the active tab bar
item measures 57px in the bar's 56px content box, overflowing it by ~1px. It is the active-state
rule's 2px `margin-bottom` doubling with the row's 2px flex `gap`. Reproducing the pre-change
geometry (56px bar, no inset padding) shows the same ~0.93px overflow, so it predates this work and
is not caused by it. Fixing it would move frame 01's drawn tab bar by 2px against its reference
PNG, which is not a change to make unasked.

---

**G41. The end of a screen read as a blurred or blank region — two causes, one of them G39 again.**
Since the action-bar reveal landed (D17), several screens appeared to stop short: the last element
dissolved into a flat band above the tab bar instead of the screen ending cleanly.

**Cause 1 — the scroller's reserve for the bar never applied on a full screen.** D17 overlaps the
bar onto the end of the scroller with a negative margin, and reserves the same height as padding
*inside* the scroller so the last real content clears the bar. The margin applied; the padding did
not. `.screen-content` sets the `padding` SHORTHAND further down `components.css`, at equal
specificity, which reset the longhand to `var(--space-lg)`; the margin survived because a shorthand
only resets its own longhands. Measured: computed `padding-bottom` **16px** where the rule asks for
**153px**, and at the end of the scroll the last element sat **121px below the top of the bar** —
fully behind it — on every overflowing full screen. This is precisely G39's failure, one selector
away, on the file G39 was fixing; the sheet half was fixed then and the full-screen half was not.

*Fix.* `.screen > .screen-content`, which beats the shorthand on specificity rather than on source
order. The child combinator is exact: `.screen-content` is always a direct child of `.screen`
(`src/action-bar.js` resolves it as `:scope > .screen-content`).

**Cause 2 — the scroll affordance masked 193px of the screen.** The fade spanned the dock's full
height plus 56px above it, painting solid `--color-bg` across the bar's own area. On a two-button
screen that is 193px, **26% of the phone screen**, flat, at every scroll position while the bar was
hidden — with real content underneath it. A card's top edge would scroll into view and dissolve into
the slab. D17's reason for the slab was that a gradient above the dock would fade content out and
then let it reappear legibly under an invisible bar; that is true of a gradient above the dock and
false of one anchored to `bottom: 0`, because the dock's bottom edge is the scroller's bottom edge
and there is nowhere below it to reappear.

*Fix.* 56px, `bottom: 0`, a plain two-stop gradient. Content behind the hidden bar stays legible
until it reaches the bottom edge instead of dissolving 137px early.

*Status: resolved.* Measured across all 33 screens at 390px and 1440px — **406 assertions, 0
failures**:

- the scroller reserves the bar's height plus the normal clearance and nothing more, on every screen
  that has a bar;
- at the end of the scroll the last element clears the bar by **16px** on full screens and **24px**
  on sheets, at both breakpoints — never behind it;
- the affordance is shown exactly on the screens where content is genuinely below the readable
  region, and nowhere else; it is gone at the end of every scroll;
- no screen overflows on the clearance alone — that is, no screen shows the affordance for reserved
  space rather than for content.

**Two things measured and deliberately left alone.**

*The gap above a pinned bar on a screen whose content fits.* On 05, 05b, 17 and `/mip/adviser` there
is background between the last element and the action bar: 194px, 194px, 117px and 361px at 390px;
109px, 109px, 32px and 276px at 1440px. This is a pinned bar on a short screen, it matches the
reference frames, and it predates D17 — the bar was always visible before and the gap was the same.
Closing it would mean un-pinning the bar so it floated up under the content, and mechanically the
tab bar would float with it, since both are flex children of the same column. Not changed.

*The last 137px of a scroll, before the bar arrives.* Between the last element passing the bottom of
the scroller and the scroll reaching its stop, there is background below the last element and no bar
yet — up to the bar's own height. The old 193px slab hid this by masking the whole zone at all
times, which is the cure being worse than the disease. Rendered and inspected at 80px from the end:
the last element ends and ~64px of background sits below it, which reads as the ordinary bottom of a
page rather than a defect. Revealing the bar earlier — as soon as the reserve enters view — would
close it, but the bar would then appear on top of the last element and cover it, so it trades a
transient gap for a covered paragraph. Left as is; raise it if participants read it as the screen
having ended.

---

**G42. The close control on 29-32 sat on top of the heading, in a circle nothing else in the app
wears.** The reference PNGs for all four "Assumptions and sources" sheets draw a filled grey circle
at the top right of the card, above the heading. Two problems with what was built from that:

1. *The circle is inconsistent with the feature's own close and back controls.* Every other one —
   `.app-bar__cell--action` on 15 screens, `.form-step-header__cell--action` on the six calculator
   steps — is a plain 24px `title3` glyph in a transparent 48px box. The sheet's was a 16px
   `footnote` glyph on a filled `--color-bg` disc, so the one control that appears on the sheets a
   participant reaches *from* those screens looked like a different control.
2. *It overlapped the title.* The button was `position: absolute; top: 50%` against a header whose
   own height was only the drag bar plus 12px of padding, so a 48px button centred on that band
   hung down into the first line of the heading below it.

*Status: resolved — the circle is gone and the heading moved into the header row beside the glyph;
see `DECISIONS.md` D19. The resulting layout deviates from the reference PNGs for these four frames
(no circular background, heading pinned above the scroller rather than scrolling with it), so
frames 29, 30, 31 and 32 are **exempt from the screenshot-comparison pass for the sheet header**. A second pass on the same header added the head clearance the complaint was really about: the title row's top padding was `--space-lg`, and because the close control's 48px target hangs 9px above the heading's first line, that put the target 7px under the grabber. It is `--space-2xl` now - heading 24px below the grabber, target 15px clear of it. The same header was extended to frames 03b and 10c, whose headings had the identical 12px-below-the-grabber problem inside the scroller, and 13b took the matching 24px as scroller padding. 03b and 10c take the header's structure only: `closeLabel` is optional and they pass none, because neither reference PNG draws a close control and both already carry a labelled way out.
Everything below the header still matches.*

---

**G43. A divider through frame 32's caption — one line missing from a shared component, and the
sheet scroller was the half of the pair that never got it.** The caption "You'd reconfirm this
permission periodically" had `.open-banking-row`'s own border-bottom running through it.

*Cause.* `components.css` gives the full-screen scroller `.screen-content > * { flex: 0 0 auto; }`,
with a long note explaining why: a flex column's items default to `flex-shrink: 1`, so when the
content is taller than the box the items are compressed BELOW their content height instead of the
box scrolling. A plain text block survives that (its automatic minimum size protects it); a row that
sets its own `min-height` does not, because an explicit min-height REPLACES the automatic minimum.
`.bottom-sheet__content` is the other scrolling flex column in this app and never got the matching
rule. Measured on frame 32, at 390px:

| | box height | height its content needs | border-to-caption clearance |
|---|---|---|---|
| Default text, before | 48px | 91px | **-6.5px** (through the caption) |
| Default text, after | 91px | 91px | +15.0px |
| Large text, before | 48px | 121px | **-21.3px** |
| Large text, after | 121px | 121px | +15.2px |

The rows were the only things that could shrink — everything else in these sheets is text, protected
by its automatic minimum — so one or two children absorbed the whole of the overflow rather than it
being spread thin across the screen. That is why the damage looked local, and why it more than
tripled at Large text.

*Second instance, same cause.* 13b's `.flag-row` ("Something doesn't look right") was squeezed from
the 49.3px it needs to 48px at Large text — 1.2px, not yet a visible collision, one text-size step
away from being one. Both are direct children of `.bottom-sheet__content`; the rows inside
`.assumptions-list` on 29-32 were never squeezed, because the list itself has no `min-height` and so
could not shrink, which protected its children transitively.

*Status: resolved — `.bottom-sheet > .bottom-sheet__content > * { flex: 0 0 auto; }` in
`screens.css`, deliberately at two classes of specificity so it cannot lose to a later single-class
rule, which is the G41 failure mode. Verified by measuring the RESOLVED `flex-shrink` (0) and the
rendered geometry, not by the rule's presence. `scripts/overlap.test.mjs` now asserts both
conditions on all 32 frames at both text sizes, and was checked against the unfixed stylesheet: it
fails on exactly these three cases (32 default, 32 large, 13b large) and passes everywhere else.*

---

**G44. Frame 12's threshold labels paint over the bars they sit among. OPEN — needs a design
decision.** Found by the same audit, different mechanism, not fixed.

`.growth-chart__threshold-label` is absolutely positioned at `left: 48px` with
`transform: translateY(50%)` and an opaque `--color-bg` background, so it sits centred ON its
threshold line and knocks a gap in it. Masking the line is clearly deliberate and it works: the
label text stays legible. What is not deliberate is that the same opaque plate also covers whatever
bars are behind it. Measured at 390px with a £280,000 property at £500 a month:

| Text size | Label | Bars it paints over |
|---|---|---|
| Default | "10% - £28,000" | 6 bars, **2 of them erased completely** |
| Default | "5% - £14,000" | 4 bars, 20-26% of each |
| Large | "10% - £28,000" | 8 bars, 2 erased completely |
| Large | "5% - £14,000" | 4 bars, 23-30% of each |

The first four bars read as three stacked blocks rather than one bar. The reference PNG does not
show this because its own figures (a £190,000 property at £200-£310 a month) leave the left of the
plot area empty — so this is not a deviation from the reference, it is the same layout meeting
larger figures, and it is reachable with ordinary participant input.

*Why it is not fixed here.* Every available fix is a design choice the spec does not make: move the
label above its line (which is where the reference draws it, but it can then sit over a bar with no
plate at all), drop the plate and let the line run through the text, right-align the labels into
whatever space is free, or reserve a left gutter outside the plot area. `CLAUDE.md`: where the spec
is silent, record it and ask rather than guess. *Status: open — needs a decision on where a
threshold label goes when the bars reach it.*

---

**G45. Three phrasings of one idea, two of them on the same screen going to the same sheet - and
one that went nowhere at all.** The flow carried "How did we work this out?" (an underlined
`.info-link`), "How we worked these out" (a `.list-row` with a chevron) and "See how we worked this
out" (the nav row inside `howThisWorksCardHTML`). All four assumptions sheets share the heading
"How we worked this out", so a participant could not tell from a screen whether two of these led to
the same place. Audited across all 17 controls on 13 screens:

| Screen | Controls | Sheets they opened |
|---|---|---|
| 06 `/position/summary` | 2 | **29, 29** - same sheet, two controls |
| 12 `/calculator/result` | 3 | 30, **29, 29** - two of the three same sheet |
| 13 `/learn/ltv` | 2 | 30, 29 - different sheets, near-identical wording |
| 15/16 `/tracker` | 2 | 30, 29 - different sheets, near-identical wording |
| 04, 08, 10, 10b, 11, 20, 21 | 1 each | unambiguous, left alone |
| 05, 05b | 2 | 29, 32 - different sheets, wording already distinguishes them |

*Also found, and separately.* **Frame 21's card nav row had never been bound.** It rendered
`data-action="open-assumptions-borrowing"` from the day the screen was built and no listener was
ever attached, so "See how we worked this out" on 21 did nothing at all - frame 20 binds the
identical row. The borrowing sheet was still reachable from 21, but only through the action bar's
"See what changes this" secondary. A single-match `querySelector` is not what hid it; nothing
queried for it. This is the kind of defect a rendered-DOM check catches and reading the file does
not.

*Status: resolved - see `DECISIONS.md` D20 for what was merged, what was reworded and why the
card's nav row is the control that survives a merge. Verified in a browser at 390px: all 15
surviving controls reach the sheet they name, all four sheets render standalone, and the DUAA row
of `SPEC.md`'s anchor map still holds for every screen it lists.*

---

**G46. Frame 09's comparison card marked none of its three rows as the chosen one.** The chip row
above it shows the selected deposit percentage as a filled pill, and the card below lists three
neighbouring percentages with their deposit amounts and Loan-to-Values - but nothing in the card
said which of the three the rest of the screen was built from. The participant had to carry the
percentage from the pill and re-find it in the sublabels.

It matters more than it looks, because the card is the screen's whole comparison: the deposit
target, the loan amount and the LTV that frames 10 to 13 all inherit come from exactly one of those
rows, and which one was only recoverable by reading back up.

*Fixed with the treatment that already existed rather than a new one.* `.rate-band-row--highlighted`
marks the rate band matching the participant's own Loan-to-Value on frames 15/16 - a 2px
`--color-label` box at `--radius-sm` - which is the same job on a different screen.
`.option-comparison-card__row--selected` uses the same values.

*And not by the box alone.* The row also carries `aria-current="true"` and a visually-hidden
"Selected. This is the figure the rest of this screen uses." A box outline is a shape rather than a
colour, so it is not a 1.4.1 failure on its own terms, but it is no use to a screen-reader
participant, and `aria-current` on a `<div>` with no role is announced inconsistently. The text is
what actually carries it. `.visually-hidden` was added to `components.css` for this - the codebase
had the technique inline on `.checkbox-row__input` but no reusable form of it.

*Verified in a browser at 390px, all five percentages plus Large text:* exactly one row outlined,
always the one the chip shows; 2px `rgb(23, 23, 28)` at 8px radius; changing the chip moves the
outline with the scroller offset unchanged (178 -> 178) and focus still on the pressed chip; the
divider above the outlined row suppressed; row heights 79/82/78, so the marked row differs from its
neighbours by at most 4px.

---

**G47. Frame 01's tab bar was rendered by frame 01 and bound by nobody.** `home.js` drew its own
copy of `bottomNavHTML`, and `router.js`'s `mountBottomNav` - which is what attaches the tab click
listeners - returns early the moment it finds a `.bottom-nav` already in the DOM. That guard exists
so the `MutationObserver` does not re-append the bar on every in-place re-render, and it did its job;
it also meant frame 01's tabs had no listeners at all.

This was harmless for as long as Home was the only tab that resolved, because tapping Home while on
frame 01 is a no-op either way, and every other screen got its bar from the router. It stopped being
harmless the moment Goals became live (`DECISIONS.md` D11, as amended): frame 01 then drew an
enabled, focusable Goals button that did nothing, on the first screen a participant sees and on no
other screen in the app.

*Why the earlier verification missed it.* The D21 pass asserted `/tracker -> tap Goals -> #/goals`
and checked the tab's rendered state on `/home`. Both passed. The rendered state on frame 01 was
correct — `disabled=false`, `data-action="nav-tab"` — because that comes from the component; what
was missing was the listener, which comes from the router, and no check clicked the tab on the one
screen that renders its own bar. A state assertion and a behaviour assertion are not the same test.

*Status: resolved — `home.js` no longer renders the bar, so `mountBottomNav` is the only thing that
renders it and the only thing that binds it. Verified by clicking the Goals tab from frame 01:
`#/home -> #/goals`, with Goals then lit and Home not.*

---

**G48. `/goals` reads account balances before consent has been given, and the calculator route out of
it bounced through three guards.**

Traced from a genuinely fresh session (nothing seeded, all 20 `build-spec.md` section 6 figures
`null`, `consentGiven: null`, `mode: null`, `journeyStarted: false`): tap Goals on frame 01, then
"Want to calculate the deposit for your house?".

| | What happens |
|---|---|
| `/goals` renders | Emergency fund GBP 5,600, Holiday pot GBP 420, House pot GBP 3,150 — real balances, with no consent given |
| CTA sets state | `goal: 'house'`, `returnFrame: '/goals'` — both written before any guard runs |
| Hash chain | `/goals` -> `/goal-check` -> `/position/summary` -> `/position` -> `/consent` |
| Guard 1 (frame 08) | `saved-toward-deposit` is null -> `/position/summary` |
| Guard 2 (frame 06) | `left-over` is null -> `/position` |
| Guard 3 (frame 05) | `money-in` is null -> `/consent` |
| Participant lands on | Frame 03, "First, where do you keep your savings?" |
| Back from there | `/journey` — frame 02, which they have never seen, with `journeyStarted` still `false` |

*The calculator is never reached and never shows a wrong figure.* The three guards were written for
deep links and reloads and they hold for this route too, which is the good news. Four open questions
sit on top of that, all of them design rather than defect:

1. **`/goals` itself is the actual bypass.** It reads `effectiveAccounts()` straight from
   `MOCK_ACCOUNTS` and never consults `consentGiven`. Frame 03's whole premise is asking permission
   to use account information; `/goals` uses it first. In the prototype's fiction these are the
   bank's own pots, so it may be entirely intended — but it is worth deciding on purpose.
2. **A tap that appears to do nothing has changed state.** `goal` and `returnFrame` are set before
   the redirect. `returnFrame: '/goals'` is then wrong for the flow the participant is actually in:
   frame 03's "Agree and continue" goes to `/position`, not back to `/goals`.
3. **The redirect is silent.** Four hash changes in one tap, none of them animated (Drift D-7), and
   nothing on the consent screen explains why a request to calculate a deposit produced a question
   about where savings are kept.
4. **Back from `/consent` goes forward.** `/journey` is frame 02, a screen this participant has not
   seen, reached by pressing back.

*Status: resolved 21 August 2026 — the `/journey` option, plus the state and back-navigation
problems alongside it. See `DECISIONS.md` D22.*

| Item | Outcome |
|---|---|
| 1. Pre-consent balances on `/goals` | **Left as they are, deliberately.** `/goals` is the bank's own goals area and the bank already holds those balances. Frame 03 asks permission to analyse income and outgoings and to assign accounts to a deposit — a new processing purpose, not permission to see money the bank can already see. Recorded as a decision rather than left implicit, precisely because it looks like a bypass and is not. |
| 2. State written before the guards ran | **Fixed.** Nothing is written until the destination is settled. To frame 08: `goal` and `returnFrame`, because frame 08 renders. To frame 02: `journeyStarted` only — no `returnFrame` (it would sit in state for the rest of the journey and offer to return them to Goals from a sheet several screens later) and no `goal` (frame 06 asks that question, and D21 routes its "no" back to `/goals`). |
| 3. The silent four-hop redirect | **Fixed.** The card branches on `journeyStarted && saved-toward-deposit !== null` and sends a cold arrival to frame 02 instead. Three hops, all of them the participant's own taps. |
| 4. Back from `/consent` went forward | **Fixed by 3.** `/home -> /goals -> /journey -> /consent -> back -> /journey`: `/journey` is visited at hop 3 and returned to at hop 5. |

*The both-flags test is the part worth keeping in mind.* Branching on `journeyStarted` alone would
have left the original defect reachable: it is set by frame 01's entry card and by nothing else, so a
participant who tapped that card, backed out, and came round through Goals would carry
`journeyStarted: true` with every figure still null — and the guard chain would fire exactly as
before, writing `returnFrame` for a flow they were not in. `saved-toward-deposit` is what frame 08's
own guard tests, so testing it here is what guarantees the card never hands off to a screen that will
redirect. A branch deciding a destination should ask the same question the destination's guard asks.
Asserted directly: entry card tapped, then `/goals`, then the card → `#/journey`, `returnFrame` still
`null`.

---

**G49. The tab bar had two treatments and neither of them was designed.** `.bottom-nav__tab` set no
`color` at all. An enabled tab therefore inherited the document's full-strength `--color-label`,
and a disabled one was greyed by the **user agent's** own `:disabled` styling — so the visual
difference between "enabled" and "disabled" was a browser default the design system had never
chosen, and the only two states the bar could express were "dark" and "grey".

The consequence on `/home`: Goals is enabled but is not the current route, and it drew exactly as
dark as Home. Two tabs at full strength, one of them with an indicator. It read as selected.

A second, quieter problem sat beside it: `TAB_FOR_ROUTE` fell back to `'home'` for any unlisted
route, so Home was lit on all 18 journey screens. That claimed the participant was on the bank's
home screen while they were inside a mortgage calculator, and left the bar with no way to show the
one case where they genuinely were on Home.

*Resolved — three states, each declaring its own colour:*

| | Rest appearance | Press | ARIA | Focusable |
|---|---|---|---|---|
| Active | indicator, bold label, filled icon, `--color-label` (17.86:1) | — | `aria-current="page"` | yes |
| Enabled, not active | `--color-label-tertiary` (5.21:1), weight 400, outline icon | darkens to `--color-label` | none | yes |
| Disabled | identical to the row above | none | `disabled` + `aria-disabled="true"` | no |

Enabled and disabled are identical at rest **on purpose** — being tappable is carried by the press
response, not by a rest-state difference, because a rest-state difference is what made an available
tab read as the current one.

*The three disabled tabs also stopped being `aria-hidden="true"`.* They were absent from the
accessibility tree entirely, so a screen-reader participant could not tell there were five tabs, let
alone which were which — which defeats the point of having ARIA carry the states that the visual
treatment deliberately does not. `tabindex="-1"` went with it: redundant beside `disabled`.

*Verified in a browser at 390px:* `/home` — Home active with `icon--house-fill`, Goals and the three
disabled tabs all at `rgb(108, 108, 115)` weight 400 with no indicator; `/goals` — the two swap, and
Home's icon returns to `icon--house`; nine journey routes with zero active tabs, zero
`aria-current`, zero indicators and zero filled icons; exactly one `aria-current="page"` on each of
the two routes that have one; focus order reaching `["home","goals"]` only.

---

**G50. Step 2 of the deposit calculator cannot render in general mode. OPEN - needs a design
decision, deliberately not papered over.**

Found by walking `/goals` -> "Work out my deposit" -> 09a -> 09 -> Continue from a genuinely fresh
session with no consent given (`DECISIONS.md` D21, as amended). It is **not** caused by that route:
`build-spec.md` section 1's own frame 04 row - "Continue with general figures" -> 09, `mode =
general` - reaches the identical dead end, verified by walking that path too.

| Step | What renders | Verdict |
|---|---|---|
| **09a** | Empty currency field, hint "How much is a property likely to cost?", no comparison card, empty-state copy in its place, no chip selected, Continue **disabled** | **Works.** The documented empty variant, exactly as `build-spec.md` section 2 describes it. |
| **09** | Enter GBP 280,000: chip 10% selected, comparison card renders GBP 14,000 / GBP 28,000 / GBP 42,000 at 5/10/15%, 10% outlined, Continue enabled | **Works.** Everything on this step derives from `property-value` x `deposit-pct` and nothing else - neither of which needs an account. |
| **10** | Nothing. Continue commits `deposit-target` 28,000, `loan-amount` 252,000, `ltv` 0.9 correctly, then `calculator-saving.js` line 68 returns to `/calculator/property`. Tapping Continue again does the same. | **BREAKS. An unbreakable loop.** |
| **11, 12** | Unreachable | - |

*The guard, verbatim:*

```js
if (state['left-over'].value === null || state['deposit-target'].value === null) {
  window.location.hash = '#/calculator/property';
  return;
}
```

*Why it is a design gap and not a missing line of code.* `left-over` is `money-in` -
`essential-spending` (`build-spec.md` section 4), both read from account activity. In general mode
the bank has read nothing, so `left-over` does not exist and cannot be derived. And frame 10 does
not merely display it - the whole step is **scaled** to it:

```js
const fillLeft  = (monthlyLow.value  / leftOver) * 100;
const fillRight = (monthlyHigh.value / leftOver) * 100;
```

The monthly-saving slider's track runs from GBP 0 to "what's left each month once your essentials
are covered". Without `left-over` there is no ceiling to draw, no range to place a handle in, and
the screen's own caption ("{max} is what's left each month once your essentials are covered") has no
value to fill. Committing a number here would be inventing a figure - `CLAUDE.md`'s first IMPORTANT
rule - and it would be a figure about the participant's income, which is precisely the thing they
declined to share.

*What is NOT missing.* `generalMonthlyLow` / `generalMonthlyHigh` already exist as frame 04's own
general-mode saving range, sourced and captioned ("Published UK average, not worked out from your
accounts"). They are a monthly AMOUNT range, which is what `monthly-low` / `monthly-high` are - so
the input frame 10 asks for has a general-mode source. What has no general-mode source is the
CEILING the slider measures that amount against.

*The options, none of which this pass takes.*

1. **A general-mode variant of frame 10** whose slider is bounded by something other than
   `left-over` - the published range's own maximum, say - with its own caption saying so. Closest to
   how frame 04 already solves the same problem one screen earlier.
2. **Skip step 2 in general mode**, carrying `generalMonthlyLow`/`generalMonthlyHigh` straight into
   step 3 as the saving range, with a change link back to frame 04's slider.
3. **Ask for the monthly amount without a ceiling** - a plain currency input rather than a slider,
   since the constraint the slider expresses is the part that needs the account data.
4. **Gate the calculator on consent**, and have the `/goals` card and frame 04 both route somewhere
   that says so.

`build-spec.md` section 2 has no row for frame 10 in general mode, which is why this is filed the
same way as its own eleven "No frame drawn" rows: a state the build reaches that no wireframe
covers. *Status: open - needs either a frame or a written rule before sessions.*

*One further finding from the same walk, smaller and separate.* **Back from 09a on this route lands
on the consent screen.** Frame 09's form-header back is hardcoded to `#/goal-check`, which guards on
`saved-toward-deposit` and bounces through 06 and 05 to 03: `#/goals -> #/calculator/property ->
#/position/summary -> #/consent`, three hops from one back tap. This is G48's pattern on a different
control, and it survives because frame 09's back ignores `returnFrame` - which this route does now
set to `/goals`. Not fixed here; it is the same decision as the above.