# Gaps

Every hole the spec marks in itself, every conflict found between `build-spec.md`, `DECISIONS.md`,
the Figma file, and the reference PNGs, and how each was resolved. Resolutions made this session are
also recorded in `DECISIONS.md` (D6–D10) where they're a standing design decision rather than a
one-off note. Screenshot-comparison exemptions referenced below apply during the build's automated
per-screen verification pass (see `SPEC.md`).

---

**G0. File path/extension mismatches.** `build-spec.md` was at the repo root instead of `docs/`;
`docs/DECISIONS.md` and `docs/figma-links.md` existed but with a stray `.txt` suffix. Content in
both was correct. *Status: resolved - files renamed/moved, `DECISIONS.md` synced (D6–D10, Q1–Q5
closed).*

---

**G1–G11. The 11 rows marked "No frame drawn" in `build-spec.md` section 2.** Recounted directly
against the table - not the 14 first estimated, not the "fifteen" `DECISIONS.md` originally said (Q3
corrected, see D7):

1. 04 Consent declined - at bound (slider handle at min/max)
2. 05 / 05b What we can see - error (left-over ≤ 0, or entered value exceeds money-in)
3. 06 What we found - emergency fund short
4. 06 What we found - no accounts assigned (saved-toward-deposit = 0)
5. 09 Property and deposit - error (non-numeric, zero, or implausible property-value)
6. 10 / 10b How you'll save - error (savings-rate > left-over, or target date in the past)
7. 12 Your deposit range - beyond the chart window (months-to-target > 60)
8. 12 Your deposit range - unreachable (savings-rate = 0)
9. 15 / 16 Deposit tracker - goal met (saved-toward-deposit ≥ deposit-target)
10. 17 Mortgage in Principle - locked (mipUnlocked = false, reached only by deep link)
11. 19 Before you run the check - incomplete (a held figure is missing)

*Status: resolved (D7) - each gets a fallback built from existing component patterns (error banners,
empty-state cards, locked-row styling), not blocked navigation.*

---

**G15. Frame 09b - which rule triggers the Lifetime ISA cap warning.** `build-spec.md` section 2
flagged this itself: annual LISA payment > £4,000, or property value > £450,000. *Status: resolved
(D6) - property-value > £450,000.*

---

**G16. Frame 07 "Generic savings goal".** Not a gap - `build-spec.md` section 3 already marks it
"Remove." Excluded from the build.

---

**G17a. Frame 13's "See it as a diagram" row - dead end.** Links to an LTV diagram screen that was
never drawn (the likely candidate for the missing frame 14). *Status: resolved (D8) - row removed
entirely from frame 13's "Want more on this?" card. The video row (linking to the built frame 13b)
stays. Recorded as an intentional deviation from the reference PNG - exempt from the
screenshot-comparison pass.*

*Corrected 22 August 2026: **the row was never removed and is live.** The status above records an
intention the build did not carry out. `git log -S"open-diagram" -- src/screens/learn-ltv.js`
returns only the commit that ADDED the row (`eb666a2`); nothing removed it. Frame 13 carries both
explainer rows, and **both open frame 13b** - the reference PNG for frame 13 is annotated "Both open
frame 13b", which is why the build wired it that way. The row is therefore not a dead end: its
destination exists and is built. What is missing is the diagram inside 13b, which is a `[Visual aid]`
placeholder in the Figma export as well as in the code, so there is nothing to port. Full inventory:
`docs/investigations/2026-08-frame-13b.md`. **There is no frame 13 deviation from the reference PNG
on this count, and so no screenshot-comparison exemption for it** - see the correction on the
exemption list further down this file. G17a is reclassified: not resolved-by-removal, but resolved
by the row having a real destination all along.*

---

**G17b. MIP results' "Talk to someone about it" row - dead end, kept and built.** Frames 20 and 21
both link to an adviser-contact flow that was never drawn (likely within the missing 22–28 range).
*Status: resolved (D8, D10) - kept as a genuine, tappable, resolving control, because whether a
participant reaches for it - especially at the not-yet outcome - is itself a research finding, not
an artefact to hide.*

Built as a new terminal stub screen at `/mip/adviser`: a short confirmation that a request has been
logged and the bank's mortgage adviser will be in touch, carrying the guidance-not-advice line from
`content.shared.regulatory`, and a back route to the result screen the participant came from. No
form, no booking calendar, no real handoff.

**Regulatory basis correction:** the obligation to offer this route is not FCA PERG 4.6.25B(5) -
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

*Status: accepted as the build's navigation model - no conflicting evidence found in Figma or the
PNGs.* A second, lower-stakes group of ~23 "Assumed" rows are all "back button → the screen you
arrived from, no state change" - accepted as-is without individual listing, since the pattern is
uniform and carries no calculation risk.

---

**G19. Calculation rules undetermined after `DECISIONS.md`.** Monthly rate convention was fully
resolved in D4 (`(1 + AER)^(1/12) - 1`, explicitly not nominal/12), rate pinned at 3.75% by D3,
superseding `build-spec.md`'s own 4.1% figure. Rounding and currency format were open (Q5). *Status:
resolved (D9) - round to the nearest £1 for on-screen display (model keeps full precision); en-GB
locale, £ symbol, thousands separator; no pence shown.*

---

**G20. borrow-low/borrow-high central value.** `DECISIONS.md` D2 assumed `loan-amount` but flagged it
as open (Q1) against the alternative reading (salary held at frame 19). *Status: resolved (D2,
confirmed) - loan-amount, consistent with how `max-property` is already derived (`borrow-high` +
`saved-toward-deposit`).*

---

**G21. Breakpoint/device-frame behaviour between 600–900px.** Not addressed anywhere in
`build-spec.md` or the original `DECISIONS.md`. *Status: resolved - single snap point at 768px.
Below: frameless, fills viewport. At/above: static phone frame (393×852), scaled to fit viewport
height per G27.*

---

**G22. State reset between participants.** Not addressed as a decision in either document. *Status:
resolved - manual only, via frame 33's existing "Clear all progress and start again" action. No
auto-reset.*

---

**G23. Frame 33 reachable to the facilitator, not discoverable by a participant.** Not addressed
anywhere. *Status: resolved - hidden route (`/settings`), never linked from any on-screen element.*

*Note, 28 August 2026 (`DECISIONS.md` D54): the route now has **two** facilitator paths - the typed URL,
and a ~700ms long press on the **disabled** Profile tab in the bottom nav. **This entry stays resolved and its
wording stands unchanged**: the gesture adds no on-screen element, no link, no label and nothing to the
accessibility tree, so "never linked from any on-screen element" is still literally true, and the intent -
not discoverable by a participant - is unaffected. Recorded here so the next reader knows there are two paths
and that neither is visible.*

---

**G24. Section 5 (Regulatory anchors) - missed in the first research pass over `build-spec.md`, now
incorporated in full.** Verbatim:

| Constraint | Where it comes from and how it shows up |
|---|---|
| Guidance, not advice | FCA PERG 4.6, in particular PERG 4.6.25B(5) on eligibility tools. Every result screen carries the guidance line and the adviser-scope line. |
| Repossession warning | MCOB 3A. Not the superseded MCOB 3.6.13R. |
| Automated decision-making | Data (Use and Access) Act 2025, Articles 22A to 22D. Three commitments: a way to push back (Feedback / Report sheet), plain wording where something is automated, and visible sources. |
| Deposit protection | FSCS, £120,000 per person. Shown on 03 only, for accounts held with the bank. |
| Credit search | Soft search only at 19b. Any hard search sits outside this prototype. |

*Status: resolved - see the regulatory anchor map in `SPEC.md`, and G26/G28 below for how each
constraint was actually verified against the reference PNGs rather than reasoned about.*

---

**G25. FSCS note conflict - `build-spec.md` vs. the reference PNGs.** Section 5 says FSCS protection
is "shown on 03 only," but the PNGs also show an FSCS note on frame 06 and frame 32. *Status:
resolved - follow section 5 (03 only), for a specific reason, not as a tie-break: FSCS protection is
per person per authorised institution. Frame 03 is the only screen showing accounts individually,
attributed to where each is held - the only context in which the note is accurate. Frames 06 and 32
show aggregated figures that may span institutions and, in estimate mode, include balances the bank
cannot see, so a note there would imply protection over money it doesn't cover. Section 5's
qualifier "for accounts held with the bank" is the operative part of the rule. Recorded as an
intentional deviation from the reference PNGs on 06 and 32 - exempt from the screenshot-comparison
pass. `content.js`'s FSCS figure reads £120,000 per person per authorised firm (raised from £85,000
on 1 December 2025; current).*

---

**G26. "Every result screen" (section 5) needed direct verification against the reference PNGs, not
reasoning about which screens count as "result" screens - done for all 33 frames, not a sample.**

The **guidance-not-advice line** ("This is guidance based on your account activity. It is not
financial advice and does not take account of everything about your situation.") was checked
directly, screen by screen, and is confirmed present, verbatim, on: 02, 03, 03b, 04, 05, 06, 08, 09,
09a, 09b, 10, 10b, 11, 12, 13, 13b, 15, 16, 17, 18, 19, 20, 21, 29, 30, 31, 32 - every screen in the
flow except 01 (bank home, outside the feature), 05b (carries a different, estimate-specific line
instead - see G26's estimate-disclosure finding below), 10c and 19b (minimal modal/loading states),
and 33 (prototype-only, outside the participant journey).

The **adviser-scope line** ("Our advisers only advise on our own mortgages.") was checked directly on
06, 12, 15, 16, 20, and 21 - not inferred from structural pattern. It is confirmed present only on 20
and 21, where the "Talk to someone about it" row actually appears. It is confirmed **deliberately
absent** from 06, 12, 15, and 16: no adviser route is offered on those screens, and this line is a
scope disclosure about a specific service, so it belongs only where that service is offered. It was
not added there - doing so would be a design change made during the build, not something the
reference PNGs or `build-spec.md` ask for.

A **fourth fixed regulatory line** was found while doing this verification, distinct from the
guidance-not-advice line: an **estimate-specific disclosure** - "This is an estimate based on the
information we hold today. It is not an offer and your actual figures may be different." - shown
wherever a figure on screen is a modelled estimate rather than a read/derived one. Confirmed present,
verbatim, on **04, 05b, 12, 20, and 21** (broader than just 05b, which is where this was first
noticed).

*Status: resolved. The guidance-not-advice line's anchor scope is every screen where it's actually
drawn (listed above), not a narrower "result screen" reading of section 5. The adviser-scope line's
anchor scope is 20, 21, and the new `/mip/adviser` stub only. The estimate-specific disclosure is a
fourth key in `content.shared.regulatory` (`estimateDisclosure`), scoped to 04, 05b, 12, 20, 21.*

---

**G27. Device frame at a real laptop viewport.** The 393×852 frame, fixed and unscaled, overflows
vertically on a 1366×768 laptop once bezel is added - the resolution most participants will likely
be on, since sessions run over Teams. *Status: resolved - the framed view scales down to fit the
viewport height, preserving aspect ratio, rather than scrolling or clipping (see `SPEC.md`).*

---

**G28. DUAA pushback mechanism missing from frame 05b.** While verifying the DUAA 2025
automated-decision anchor directly against every listed screen (04, 05, 05b, 06, 08, 09, 09b, 10,
10b, 11, 12, 13, 13b, 15, 16, 20, 21, 32): 05b's reference PNG has no "something doesn't look right"
flag row anywhere on the screen, unlike every other figure-presenting screen in the flow, including
05 - the exact screen 05b is a variant of. 05b does carry the other two DUAA commitments (plain
wording, via the estimate-specific disclosure; visible sources, via both "How we worked these out"
and "Where these figures come from" links, both fully visible unlike on 05 where one is cut by the
fold).

*Status: resolved by adding the flag row to 05b. Unlike the adviser-scope line (G26), there's no
service-boundary reason for its absence here - estimate-mode figures are exactly where a participant
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

*Corrected 22 August 2026: **the frame 13 exemption in that list should not be there.** It was
granted for a deviation that does not exist - the diagram row was never removed (see the correction
under G17a), so frame 13 matches its reference PNG on this count and has nothing to be exempt from.
The exemption list for this pass is frame 32 (G25) and frame 05b (G28), plus this bar itself. Frame
13 is diffed normally.*

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
identical nominal stroke rendered between ~1.5px and ~4.0px depending on the asset - a list-row
chevron drew two to three times heavier than the back arrow beside it on the same screen. Three
size inconsistencies came out of the same audit: `back.svg` at 24px vs `close.svg` at 20px in the
same app-bar cell, `.info-link__icon` at 16px on frame 04 vs 20px elsewhere, and
`.list-row__chevron` at 16px on frame 33 vs 20px elsewhere. Four icons were also drawn as literal
text characters rather than artwork at all: "checkmark" and "circle" on frame 19, a bullet on frame
04, and a right arrow on frame 32 - each rendered in whatever weight and baseline the participant's
own system font gave it, beside real icons drawn at a fixed weight on the same row.

*Status: resolved (D15) - one set in `src/icons.js`, inline SVG on a shared 24x24 canvas, drawn to
SF Symbols conventions, sized and weighted from the type scale in `tokens.css`. All 24 UI `.svg`
assets deleted and dropped from `sw.js`'s precache list. Recorded as an intentional deviation from
the reference PNGs on every screen - **exempt from the screenshot-comparison pass for icon rendering
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

**G35. Frame 03 - the "Your accounts" card drew over the consent checkbox.** Not a positioning bug:
`.screen-content` is a flex column, and a flex item's default `flex-shrink: 1` compresses items
*below their content height* when the column overflows, instead of letting the column scroll. An item
whose automatic minimum size protects it (a plain text block) survives that; one that sets its own
`min-height` does not, because an explicit `min-height` replaces the automatic minimum.
`.checkbox-row` sets `min-height: var(--touch-target-min)` for the 48px touch target, so on frame 03
it was compressed from its natural 132px to exactly 48px - its title and body spilled out of the
shrunken box, and the "Your accounts" card, laid out immediately after that 48px box, drew straight
over them. The `<hr class="divider">` on the same screen was being compressed from 1px to 0 by the
same rule, so the rule under "Are your main savings with us?" was not drawing at all.

*Status: resolved - `.screen-content > * { flex: 0 0 auto }` in `components.css`. Every child now
keeps its natural height and `.screen-content`'s own `overflow-y: auto` scrolls, which is normal
document flow inside the device frame. Verified across all 28 routes: no `.screen-content` child is
compressed below its content height on any of them. No screenshot exemption - this restores what the
reference PNG draws rather than deviating from it.*

---

**G36. Frame 03 - "N of M selected" counted the wrong set, and the checkbox had no third state.**
The count was derived, but from the wrong rule: M was the number of accounts currently filed under
"Toward your deposit", so it read "4 of 4" and the checkbox was binary. Two consequences. The Stocks
and shares ISA - a savings account the bank has not sorted yet - was invisible to the count, so a
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
  shrink when a participant refiles one on 03b - an account moved to the emergency fund is still one
  of your savings accounts. N is how many of those are being counted right now. So the screen now
  opens at **4 of 5, indeterminate**, which is the state `build-spec.md` describes and the reference
  PNG never showed.
- **Three-state, natively.** The row is a real `<input type="checkbox">` inside a `<label>`, not a
  button with `role="checkbox"`, because `indeterminate` exists only as a DOM property - there is no
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
  rule working, not a defect - **exempt from the screenshot-comparison pass for the select-all row's
  count and checkbox state only**; everything else on frame 03 is diffed normally.

One thing worth a look before sessions, recorded rather than fixed because fixing it would mean
drawing UI the wireframes do not have: with all accounts deselected, the four accounts still list
under "Toward your deposit" with a £0 group total, and a deselected account is visually identical to
a selected one. The reference draws no per-account checkbox - selection is all-or-nothing via the
select-all row, plus per-account filing via 03b - so the group subtotal and the "0 of 5 selected"
count are the only signals. If a per-account selection control is wanted, that is a design addition
to make deliberately.

*Closed 20 August 2026 - that addition was made deliberately. See G37 and `DECISIONS.md` D16.*

---

**G37. Frame 03 - a per-account checkbox, and a scroll jump on every in-place update.** Two things,
raised together because the second made the first unusable.

**The scroll jump.** Toggling "Select all accounts" sent the screen back to the top and dropped
keyboard focus. Not a scroll-restoration bug - a re-render bug. Every screen module builds itself
with `container.innerHTML = ...`, so a toggle handler calling its own `render` destroyed and rebuilt
`.screen-content`, the element that owns the scroll position; the browser had nothing to restore
`scrollTop` onto and `document.activeElement` fell back to `<body>`. Auditing every in-place
re-render found **18 call sites across 8 screens** with the same defect - frames 03, 04, 05, 05b, 06,
09, 09a, 09b, 10, 10b and 33 - not the one screen it was reported on. Frame 11 was checked and is
clean: its change links navigate rather than re-render. Frame 19's "edit a held figure" action from
`build-spec.md` section 1 turns out not to be built at all, so there was nothing there to fix; its
three disclosures did have the defect and now do not.

*Status: resolved (D16). Frame 03's account card patches itself in place - `syncAccounts` in
`consent.js` sets checkbox properties, the count and the group subtotals directly, and rebuilds only
the group-list subtree when a tick actually moves an account between groups, never the scroller.
Everywhere else re-renders through `rerenderInPlace` in `components/ui.js`, which records and
restores the scroll offset, the focused control and its text selection. No screenshot exemption -
this is a defect repair, not a deviation.*

One limit, stated because it will show in any measurement: where an update makes the content shorter
(selecting all empties the "Not sorted yet" group, removing its header, its "Sort this out" button
and a spacer), the scroller's maximum drops and the offset is clamped to it. Holding the old offset
is impossible when there is no longer that much to scroll; the screen stays pinned where it was
rather than resetting to the top.

**The per-account checkbox.** Each counting account now carries its own checkbox, so a participant
can see *which* accounts are counted, not only how many. Only accounts flagged `countsTowardDeposit`
get one, from the same flag the count and the totals read; a current account and a holiday pot get
none, and no empty placeholder either - an unticked box on an account that can never be counted
would invite a tap that does nothing. The row is now two separate targets, both at least 48px and
non-overlapping: the checkbox toggles selection, and everything else on the row still opens 03b.

*Status: resolved (D16) - this is the design addition G36 left open, now made deliberately. Ticking
follows exactly the rule the select-all row already had (`toggleAccountPatch` is `selectAllPatch`
narrowed to one account), asserted in `accounts.test.js`: ticking all five one at a time gives the
same selection as one select-all. **Exempt from the screenshot-comparison pass for the account rows'
checkboxes and the select-all count only**, alongside the frame 13 (G17a), frame 32 (G25), frame 05b
(G28), bottom-navigation (G29), collapsed-disclosure (G30), icon-rendering (G34) and select-all-count
(G36) exemptions. Everything else on frame 03 is still diffed normally.*

---

**G38. The action bar was visible from first paint on every screen - then it waited for the end of
the content, and now it is visible from first paint again.** Not previously recorded. Every
reference frame draws the primary button present from the start, so while D17 was in force the
build withheld a control the wireframes show.

*Status: closed by removal (D39, 24 August 2026).* **The deviation is gone and so is the exemption.**
The bar is visible from first paint on every screen that has one, which is what the reference frames
draw, so there is nothing left for the screenshot-comparison pass to exempt. The remaining
exemptions are unaffected: frame 13 (G17a), frame 32 (G25), frame 05b (G28), bottom-navigation
(G29), collapsed-disclosure (G30), icon-rendering (G34), select-all-count (G36) and
per-account-checkbox (G37).

**What D17's "which case" table became.** It was a list of which screens hid the bar. Under D39
nothing hides it, and the same overflow test now picks a LAYOUT mode instead - pinned to the bottom
where the content scrolls, inline after the last card where it does not. The membership of the two
lists is no longer a fact worth writing down here, because it changes with the viewport rather than
with the screen: at 393x852 frames 05, 17 and `/mip/adviser` are inline, at 375x667 only
`/mip/adviser` is. `scripts/action-bar.test.mjs` asserts the right mode per screen per viewport
rather than pinning a list to one screen size.

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
  which changes whether the content overflows, which changes whether the bar should show - and on a
  screen overflowing by less than the bar's own height (09a by 104px, 13b by 61px, against a ~136px
  bar) that loop oscillates. The content scrolls *under* the bar instead, with a matching padding
  inside the scroller. Reclaiming that height is what moved 09a into the fits case. The overlap is
  scoped to full screens: it needs a flex container with a definite height for the freed space to be
  redistributed, and a sheet card is content-sized, so applied there it dragged the bar over the last
  row (it hid 03b's third purpose option). Sheets get the same behaviour from an absolutely
  positioned dock instead - see G39. 13b, overflowing by 61px, stays on the overflow side.

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

**G40. Full screens floated off the bottom edge - the same mistake as G39, one level up.** The tab
bar stopped 34px short of the bottom of the phone screen, leaving a band of page background beneath
it. G39 had already found and fixed this exact placement error on sheets; it survived on full
screens for one more pass only because the band paints `--color-bg` there - the same colour as the
app behind the tab bar - while a sheet's band paints the dark scrim and so announced itself.

**Cause.** `.screen` carried the bottom safe-area inset as its own `padding-bottom`, which puts the
inset *underneath* the tab bar rather than inside it. Every flex child of `.screen` therefore ended
above the band, exactly as D14's first pass described and intended - the intent was the defect.

*Status: resolved.* The inset is not deleted, it moves. `.screen` zeroes its own `padding-bottom`
wherever bottom chrome exists to carry it, and that chrome takes the inset as its own padding:

| Lowest chrome | Carries the inset | Screens |
|---|---|---|
| Tab bar | `padding-bottom` + `height: calc(56px + var(--safe-bottom))` on `.bottom-nav` | 19 full screens |
| Action bar with no tab bar under it | `padding-bottom` on `.screen > .action-bar-dock:last-child .action-bar` | none currently |
| Sheet's action bar | unchanged from G39 | the 7 sheets |
| Nothing | `padding-bottom` on `.screen`, the fallback | 19b, 33 |

The second row is unreachable today - every screen with an action bar also has the tab bar below it,
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
  frameless - `env()` is 0 in a desktop browser, so the frameless view is the plain 56px it always
  was and a real notched phone gets its own value;
- the lone action bar's computed `padding-bottom`: **50px** framed (16 normal + 34 inset);
- touch targets clipped at the top of the inset band still measure **51–56px**, so none relies on
  the inset to clear D1's 48px minimum;
- `.screen-content` box height **647px** framed, identical before and after - the inset moved from
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

**G41. The end of a screen read as a blurred or blank region - two causes, one of them G39 again.**
Since the action-bar reveal landed (D17), several screens appeared to stop short: the last element
dissolved into a flat band above the tab bar instead of the screen ending cleanly.

**Cause 1 - the scroller's reserve for the bar never applied on a full screen.** D17 overlaps the
bar onto the end of the scroller with a negative margin, and reserves the same height as padding
*inside* the scroller so the last real content clears the bar. The margin applied; the padding did
not. `.screen-content` sets the `padding` SHORTHAND further down `components.css`, at equal
specificity, which reset the longhand to `var(--space-lg)`; the margin survived because a shorthand
only resets its own longhands. Measured: computed `padding-bottom` **16px** where the rule asks for
**153px**, and at the end of the scroll the last element sat **121px below the top of the bar** -
fully behind it - on every overflowing full screen. This is precisely G39's failure, one selector
away, on the file G39 was fixing; the sheet half was fixed then and the full-screen half was not.

*Fix.* `.screen > .screen-content`, which beats the shorthand on specificity rather than on source
order. The child combinator is exact: `.screen-content` is always a direct child of `.screen`
(`src/action-bar.js` resolves it as `:scope > .screen-content`).

**Cause 2 - the scroll affordance masked 193px of the screen.** The fade spanned the dock's full
height plus 56px above it, painting solid `--color-bg` across the bar's own area. On a two-button
screen that is 193px, **26% of the phone screen**, flat, at every scroll position while the bar was
hidden - with real content underneath it. A card's top edge would scroll into view and dissolve into
the slab. D17's reason for the slab was that a gradient above the dock would fade content out and
then let it reappear legibly under an invisible bar; that is true of a gradient above the dock and
false of one anchored to `bottom: 0`, because the dock's bottom edge is the scroller's bottom edge
and there is nowhere below it to reappear.

*Fix.* 56px, `bottom: 0`, a plain two-stop gradient. Content behind the hidden bar stays legible
until it reaches the bottom edge instead of dissolving 137px early.

*Status: resolved.* Measured across all 33 screens at 390px and 1440px - **406 assertions, 0
failures**:

- the scroller reserves the bar's height plus the normal clearance and nothing more, on every screen
  that has a bar;
- at the end of the scroll the last element clears the bar by **16px** on full screens and **24px**
  on sheets, at both breakpoints - never behind it;
- the affordance is shown exactly on the screens where content is genuinely below the readable
  region, and nowhere else; it is gone at the end of every scroll;
- no screen overflows on the clearance alone - that is, no screen shows the affordance for reserved
  space rather than for content.

**Two things measured and deliberately left alone.**

*The gap above a pinned bar on a screen whose content fits.* On 05, 05b, 17 and `/mip/adviser` there
is background between the last element and the action bar: 194px, 194px, 117px and 361px at 390px;
109px, 109px, 32px and 276px at 1440px. This is a pinned bar on a short screen, it matches the
reference frames, and it predates D17 - the bar was always visible before and the gap was the same.
Closing it would mean un-pinning the bar so it floated up under the content, and mechanically the
tab bar would float with it, since both are flex children of the same column. Not changed.

*The last 137px of a scroll, before the bar arrives.* Between the last element passing the bottom of
the scroller and the scroll reaching its stop, there is background below the last element and no bar
yet - up to the bar's own height. The old 193px slab hid this by masking the whole zone at all
times, which is the cure being worse than the disease. Rendered and inspected at 80px from the end:
the last element ends and ~64px of background sits below it, which reads as the ordinary bottom of a
page rather than a defect. Revealing the bar earlier - as soon as the reserve enters view - would
close it, but the bar would then appear on top of the last element and cover it, so it trades a
transient gap for a covered paragraph. Left as is; raise it if participants read it as the screen
having ended.

---

**G42. The close control on 29-32 sat on top of the heading, in a circle nothing else in the app
wears.** The reference PNGs for all four "Assumptions and sources" sheets draw a filled grey circle
at the top right of the card, above the heading. Two problems with what was built from that:

1. *The circle is inconsistent with the feature's own close and back controls.* Every other one -
   `.app-bar__cell--action` on 15 screens, `.form-step-header__cell--action` on the six calculator
   steps - is a plain 24px `title3` glyph in a transparent 48px box. The sheet's was a 16px
   `footnote` glyph on a filled `--color-bg` disc, so the one control that appears on the sheets a
   participant reaches *from* those screens looked like a different control.
2. *It overlapped the title.* The button was `position: absolute; top: 50%` against a header whose
   own height was only the drag bar plus 12px of padding, so a 48px button centred on that band
   hung down into the first line of the heading below it.

*Status: resolved - the circle is gone and the heading moved into the header row beside the glyph;
see `DECISIONS.md` D19. The resulting layout deviates from the reference PNGs for these four frames
(no circular background, heading pinned above the scroller rather than scrolling with it), so
frames 29, 30, 31 and 32 are **exempt from the screenshot-comparison pass for the sheet header**. A second pass on the same header added the head clearance the complaint was really about: the title row's top padding was `--space-lg`, and because the close control's 48px target hangs 9px above the heading's first line, that put the target 7px under the grabber. It is `--space-2xl` now - heading 24px below the grabber, target 15px clear of it. The same header was extended to frames 03b and 10c, whose headings had the identical 12px-below-the-grabber problem inside the scroller, and 13b took the matching 24px as scroller padding. 03b and 10c take the header's structure only: `closeLabel` is optional and they pass none, because neither reference PNG draws a close control and both already carry a labelled way out.
Everything below the header still matches.*

---

**G43. A divider through frame 32's caption - one line missing from a shared component, and the
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

The rows were the only things that could shrink - everything else in these sheets is text, protected
by its automatic minimum - so one or two children absorbed the whole of the overflow rather than it
being spread thin across the screen. That is why the damage looked local, and why it more than
tripled at Large text.

*Second instance, same cause.* 13b's `.flag-row` ("Something doesn't look right") was squeezed from
the 49.3px it needs to 48px at Large text - 1.2px, not yet a visible collision, one text-size step
away from being one. Both are direct children of `.bottom-sheet__content`; the rows inside
`.assumptions-list` on 29-32 were never squeezed, because the list itself has no `min-height` and so
could not shrink, which protected its children transitively.

*Status: resolved - `.bottom-sheet > .bottom-sheet__content > * { flex: 0 0 auto; }` in
`screens.css`, deliberately at two classes of specificity so it cannot lose to a later single-class
rule, which is the G41 failure mode. Verified by measuring the RESOLVED `flex-shrink` (0) and the
rendered geometry, not by the rule's presence. `scripts/overlap.test.mjs` now asserts both
conditions on all 32 frames at both text sizes, and was checked against the unfixed stylesheet: it
fails on exactly these three cases (32 default, 32 large, 13b large) and passes everywhere else.*

---

**G44. Frame 12's threshold labels paint over the bars they sit among. OPEN - needs a design
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
plot area empty - so this is not a deviation from the reference, it is the same layout meeting
larger figures, and it is reachable with ordinary participant input.

*Why it is not fixed here.* Every available fix is a design choice the spec does not make: move the
label above its line (which is where the reference draws it, but it can then sit over a bar with no
plate at all), drop the plate and let the line run through the text, right-align the labels into
whatever space is free, or reserve a left gutter outside the plot area. `CLAUDE.md`: where the spec
is silent, record it and ask rather than guess. *Status: open - needs a decision on where a
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
correct - `disabled=false`, `data-action="nav-tab"` - because that comes from the component; what
was missing was the listener, which comes from the router, and no check clicked the tab on the one
screen that renders its own bar. A state assertion and a behaviour assertion are not the same test.

*Status: resolved - `home.js` no longer renders the bar, so `mountBottomNav` is the only thing that
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
| `/goals` renders | Emergency fund GBP 5,600, Holiday pot GBP 420, House pot GBP 3,150 - real balances, with no consent given |
| CTA sets state | `goal: 'house'`, `returnFrame: '/goals'` - both written before any guard runs |
| Hash chain | `/goals` -> `/goal-check` -> `/position/summary` -> `/position` -> `/consent` |
| Guard 1 (frame 08) | `saved-toward-deposit` is null -> `/position/summary` |
| Guard 2 (frame 06) | `left-over` is null -> `/position` |
| Guard 3 (frame 05) | `money-in` is null -> `/consent` |
| Participant lands on | Frame 03, "First, where do you keep your savings?" |
| Back from there | `/journey` - frame 02, which they have never seen, with `journeyStarted` still `false` |

*The calculator is never reached and never shows a wrong figure.* The three guards were written for
deep links and reloads and they hold for this route too, which is the good news. Four open questions
sit on top of that, all of them design rather than defect:

1. **`/goals` itself is the actual bypass.** It reads `effectiveAccounts()` straight from
   `MOCK_ACCOUNTS` and never consults `consentGiven`. Frame 03's whole premise is asking permission
   to use account information; `/goals` uses it first. In the prototype's fiction these are the
   bank's own pots, so it may be entirely intended - but it is worth deciding on purpose.
2. **A tap that appears to do nothing has changed state.** `goal` and `returnFrame` are set before
   the redirect. `returnFrame: '/goals'` is then wrong for the flow the participant is actually in:
   frame 03's "Agree and continue" goes to `/position`, not back to `/goals`.
3. **The redirect is silent.** Four hash changes in one tap, none of them animated (Drift D-7), and
   nothing on the consent screen explains why a request to calculate a deposit produced a question
   about where savings are kept.
4. **Back from `/consent` goes forward.** `/journey` is frame 02, a screen this participant has not
   seen, reached by pressing back.

*Status: resolved 21 August 2026 - the `/journey` option, plus the state and back-navigation
problems alongside it. See `DECISIONS.md` D22.*

| Item | Outcome |
|---|---|
| 1. Pre-consent balances on `/goals` | **Left as they are, deliberately.** `/goals` is the bank's own goals area and the bank already holds those balances. Frame 03 asks permission to analyse income and outgoings and to assign accounts to a deposit - a new processing purpose, not permission to see money the bank can already see. Recorded as a decision rather than left implicit, precisely because it looks like a bypass and is not. |
| 2. State written before the guards ran | **Fixed.** Nothing is written until the destination is settled. To frame 08: `goal` and `returnFrame`, because frame 08 renders. To frame 02: `journeyStarted` only - no `returnFrame` (it would sit in state for the rest of the journey and offer to return them to Goals from a sheet several screens later) and no `goal` (frame 06 asks that question, and D21 routes its "no" back to `/goals`). |
| 3. The silent four-hop redirect | **Fixed.** The card branches on `journeyStarted && saved-toward-deposit !== null` and sends a cold arrival to frame 02 instead. Three hops, all of them the participant's own taps. |
| 4. Back from `/consent` went forward | **Fixed by 3.** `/home -> /goals -> /journey -> /consent -> back -> /journey`: `/journey` is visited at hop 3 and returned to at hop 5. |

*The both-flags test is the part worth keeping in mind.* Branching on `journeyStarted` alone would
have left the original defect reachable: it is set by frame 01's entry card and by nothing else, so a
participant who tapped that card, backed out, and came round through Goals would carry
`journeyStarted: true` with every figure still null - and the guard chain would fire exactly as
before, writing `returnFrame` for a flow they were not in. `saved-toward-deposit` is what frame 08's
own guard tests, so testing it here is what guarantees the card never hands off to a screen that will
redirect. A branch deciding a destination should ask the same question the destination's guard asks.
Asserted directly: entry card tapped, then `/goals`, then the card → `#/journey`, `returnFrame` still
`null`.

---

**G49. The tab bar had two treatments and neither of them was designed.** `.bottom-nav__tab` set no
`color` at all. An enabled tab therefore inherited the document's full-strength `--color-label`,
and a disabled one was greyed by the **user agent's** own `:disabled` styling - so the visual
difference between "enabled" and "disabled" was a browser default the design system had never
chosen, and the only two states the bar could express were "dark" and "grey".

The consequence on `/home`: Goals is enabled but is not the current route, and it drew exactly as
dark as Home. Two tabs at full strength, one of them with an indicator. It read as selected.

A second, quieter problem sat beside it: `TAB_FOR_ROUTE` fell back to `'home'` for any unlisted
route, so Home was lit on all 18 journey screens. That claimed the participant was on the bank's
home screen while they were inside a mortgage calculator, and left the bar with no way to show the
one case where they genuinely were on Home.

*Resolved - three states, each declaring its own colour:*

| | Rest appearance | Press | ARIA | Focusable |
|---|---|---|---|---|
| Active | indicator, bold label, filled icon, `--color-label` (17.86:1) | - | `aria-current="page"` | yes |
| Enabled, not active | `--color-label-tertiary` (5.21:1), weight 400, outline icon | darkens to `--color-label` | none | yes |
| Disabled | identical to the row above | none | `disabled` + `aria-disabled="true"` | no |

Enabled and disabled are identical at rest **on purpose** - being tappable is carried by the press
response, not by a rest-state difference, because a rest-state difference is what made an available
tab read as the current one.

*The three disabled tabs also stopped being `aria-hidden="true"`.* They were absent from the
accessibility tree entirely, so a screen-reader participant could not tell there were five tabs, let
alone which were which - which defeats the point of having ARIA carry the states that the visual
treatment deliberately does not. `tabindex="-1"` went with it: redundant beside `disabled`.

*Verified in a browser at 390px:* `/home` - Home active with `icon--house-fill`, Goals and the three
disabled tabs all at `rgb(108, 108, 115)` weight 400 with no indicator; `/goals` - the two swap, and
Home's icon returns to `icon--house`; nine journey routes with zero active tabs, zero
`aria-current`, zero indicators and zero filled icons; exactly one `aria-current="page"` on each of
the two routes that have one; focus order reaching `["home","goals"]` only.

---

**G50. Step 2 of the deposit calculator cannot render in general mode. RESOLVED 22 August 2026
- see `DECISIONS.md` D24.**

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
covers. *Status: resolved 22 August 2026 by option 1, the written rule rather than a new frame - see
`DECISIONS.md` D24. `left-over` stays null; frame 10 takes its slider ceiling from
`GENERAL_SAVINGS_RANGE.max` and its seed from `generalMonthlyLow`/`generalMonthlyHigh`, and says so
in its own caption. The guard now bounces on `deposit-target` alone. Walked 04 -> 09a -> 09 -> 10 ->
11 -> 12 at 375px; the consent path's own 10/11/12 render pixel-identical to before.*

*One further finding from the same walk, smaller and separate.* **Back from 09a on this route lands
on the consent screen.** Frame 09's form-header back is hardcoded to `#/goal-check`, which guards on
`saved-toward-deposit` and bounces through 06 and 05 to 03: `#/goals -> #/calculator/property ->
#/position/summary -> #/consent`, three hops from one back tap. This is G48's pattern on a different
control, and it survives because frame 09's back ignores `returnFrame` - which this route does now
set to `/goals`. Not fixed here; it is the same decision as the above.

---

**G51. Frames 15/16 (the deposit tracker) have no general-mode variant, and frame 12 now hands off
to them. CLOSED BY REMOVAL 22 August 2026 - see `DECISIONS.md` D28.**

Found while resolving G50. Now that the calculator runs end to end without consent, frame 12's "Save
my goal" reaches `/tracker` in a session that never linked an account, and three things on that
screen assert account data it has not got:

| On frame 15/16 | In general mode |
|---|---|
| The headline figure, `saved-toward-deposit`, captioned "Read from the accounts you assigned to your deposit" | Null. Renders as £0 under a caption that names a source that does not exist. |
| Milestones 1 and 2, "Accounts linked" and "Accounts sorted", both drawn `done` | Neither happened. The tracker would show two completed steps the participant never took. |
| The "This month" card - `thisMonthSaved`, `thisMonthInterest`, both captioned "Read from your ..." | Read from `MOCK_POSITION`, which stands in for account activity. |

Unlike G50 this is not one figure with a missing ceiling; it is the screen's whole premise. Frames
15 and 16 are built around a milestone tracker whose first two milestones ARE the consent journey,
and `build-spec.md` section 2 lists no general-mode row for either frame. Fixing it means either a
general-mode variant of the tracker (what would milestones 1 and 2 say?) or routing frame 12's "Save
my goal" somewhere else when there is nothing to track against. Both are design decisions, so
neither is taken here.

*What frame 12 itself does is correct in general mode* - its projection starts from a zero balance,
which is what the model already assumes for a session with no accounts (`generalAnnualRange`), and
its captions now say so. The gap is entirely on the far side of "Save my goal".

*Status: resolved 22 August 2026 by a written rule and a fourth variant - see `DECISIONS.md` D26.*

*What was decided, and the reasoning that governs it.* The load-bearing question was what the
tracker measures when nothing has been read, and the answer is that **no truthful progress figure
exists**, so none is shown. Each of the three rows in the table above is dealt with by removal
rather than substitution:

| Row above | What the variant does |
|---|---|
| The headline `saved-toward-deposit` | Gone, along with the progress bar. The headline is now `deposit-target`, the goal the participant set, captioned "Worked out from the 15% deposit you chose on a GBP 280,000 home". |
| Milestones 1 and 2 drawn `done` | Both sit at `locked` - the dashed, not-started icon - and stay visible rather than being hidden. No milestone in this variant is `done`. "Deposit goal set" is `current`, which they did do. |
| The "This month" card | Replaced by a "Your plan" card: the monthly range they set (captioned with its own source) and `on-track-for` worked out from it. `thisMonthSaved` and `thisMonthInterest` are gone, not zeroed. |

Zero was considered and rejected as a headline: frame 12 may legitimately PROJECT from a zero
balance and caption that as an assumption, but "GBP 0 saved" on a tracker is a claim about the
participant, who may hold savings elsewhere. No constant was added to `rates.js` either - a
published average of what buyers have saved would be a figure about somebody else shown as this
person's progress. That is where D24's `savingCeiling` precedent stops: a published constant can
supply a bound a screen needs, never a measurement of the participant.

*Frame 16 has no general-mode counterpart, and cannot have one.* Passing the checkpoint is a
statement about a balance nobody has measured, so the variant is always below-checkpoint and the
Mortgage in Principle milestone stays locked. `mip-pre-check.js` reads `money-in`,
`essential-spending` and `saved-toward-deposit`, so the route could not run even if it were
offered. D25's action bar needed no change.

*Verified.* Walked 04 to the tracker at 375px; all three consent-path tracker variants render
byte-identical PNGs to before; `scripts/overlap.test.mjs` gains a `15-general` frame and passes at
both text sizes.

*CLOSED BY REMOVAL, 22 August 2026.* Not by a better fourth variant - by deleting the one that
needed it. The account-linking choice is gone and the app assumes connected accounts, so
`saved-toward-deposit` is seeded at session start and can no longer be null when the tracker
renders. The fourth variant, its twelve content keys and the `15-general` overlap frame are all
deleted; frames 15 and 16 are back to the three variants `build-spec.md` section 2 draws. See
`DECISIONS.md` D28. What this gap actually recorded - that no truthful progress figure exists when
nothing has been read - is not contradicted by the removal; the state it described is simply
unreachable now.

---

**G52. `shared.regulatory.guidanceNotAdvice` says "based on your account activity" on screens that
read no account activity. CLOSED BY REMOVAL 22 August 2026 - see `DECISIONS.md` D28.**

The line is `This is guidance based on your account activity. It is not financial advice and does
not take account of everything about your situation.` It is carried by every figure-presenting
screen, including frame 04 (consent declined), where it has always been inaccurate, and now
including frames 10, 11 and 12 in general mode.

`CLAUDE.md` makes `shared.regulatory` fixed wording: "Do not reword, shorten or remove them, or
remove them from a screen that carries them." So the line stays exactly as it is and this is filed
rather than fixed. It predates this pass - frame 04 has carried it since the build - but general
mode now reaches four more screens that do, which makes it worth writing down.

Resolving it is a `DECISIONS.md`-level wording change, not a routine copy edit: either a second
fixed line for sessions with no linked accounts, or a rewording of this one that holds in both
modes.

*Resolved 22 August 2026 by the first of those two options.* The FCA-checked line is untouched, to
the character, and still renders on every screen where account activity was read. A second line,
`content.shared.regulatoryAwaitingCheck.guidanceNotAdviceNoAccounts`, renders where none was:
`This is guidance based on published figures and what you entered yourself, not on your accounts.
It is not financial advice and does not take account of everything about your situation.` The
guidance-not-advice sentence is carried over word for word - it is the half doing the regulatory
work, and it does not weaken. Only the sourcing half changes, and it claims only what general mode
actually has: the dated published constants in `model/rates.js`, and the figures the participant
typed in themselves.

`src/regulatory.js` selects between the two on `left-over === null` - D24's own test, the one
`savingCeiling` uses - conjoined with `money-in === null`, which is what "nothing was read" means
on the two sheets frame 05 can open before it commits `left-over`. Eleven screens select: 04, 09,
10, 11, 12, 13, 13b, 15, 29, 30 and 32. Every consent-path screen renders a byte-identical PNG to
before, the frame-05 mid-flow state included.

Two things this did not fix are now open as G53 and G54.

---

**G53. The general-mode guidance line has not had an FCA copy check. CLOSED BY REMOVAL
22 August 2026 - see `DECISIONS.md` D28.**

`guidanceNotAdviceNoAccounts` (G52 above) is new wording written in this repo. The four lines in
`shared.regulatory` were transcribed verbatim from the reference PNGs and are checked; this one has
had no such check and must not be presented as though it had. It is held in a separate object,
`shared.regulatoryAwaitingCheck`, so that the checked set keeps the four-key shape `SPEC.md` fixes
for it and nothing can pick the unchecked line up as though it were one of them. The block above it
in `content.js` is headed `NOT FCA COPY CHECKED. AWAITING REVIEW.`

Two candidate wordings were drafted alongside it and rejected (`DECISIONS.md` D27 records all
three). If a reviewer objects to the "not on your accounts" clause, candidate A is the same line
without it and needs no other change.

*Status: CLOSED BY REMOVAL, 22 August 2026.* The line it was about,
`shared.regulatoryAwaitingCheck.guidanceNotAdviceNoAccounts`, is deleted, and so is the
`regulatoryAwaitingCheck` object that held it - it had exactly the one key. Nothing unchecked is
left in `content.js`, and `shared.regulatory` is back to being the whole of the app's regulatory
copy, all four keys of it transcribed from the reference PNGs. The two candidate wordings this gap
mentions are recorded in `DECISIONS.md` D27 and were never shipped. See `DECISIONS.md` D28.

*Closed by removal, not by a copy check: no reviewer time was spent on this line and none now needs
to be.*

---

**G54. General mode still asserts account sourcing outside the guidance line, on frames 29 and 32.
CLOSED BY REMOVAL 22 August 2026 - see `DECISIONS.md` D28.**

G52 was about one shared line. Walking general mode with that line fixed and reading every string
containing the word "account" turns up two sheets whose own body copy makes the same claim, and one
of them shows account balances:

| Frame | String, as it renders in general mode | Problem |
|---|---|---|
| 29 How we worked out your saving amount | "We've used the last 12 months of your account activity as the starting point" | No activity was read. D26 established that general mode projects from zero. |
| 29 | "Based on your account activity to 30 July 2026. We refresh this monthly." | Same claim, in the metadata line. |
| 32 Where these figures come from | "Everything here is read from accounts you hold with us. Nothing was entered by you unless it says so." | Inverted: in general mode nothing here is read and everything is entered or published. |
| 32 | Section heading "Read directly from your accounts" | Nothing under it was read. Its figures correctly render as em dashes, which makes the heading read stranger, not better. |
| 32 | "House pot GBP 3,150, Instant saver GBP 1,850, Cash ISA GBP 1,200, Lifetime ISA GBP 2,750, all assigned by you on the accounts screen" | **The worst of the five.** A caption in `content.js`, not a state figure, so the em-dash treatment above it does not reach it. A participant who declined to share their accounts is shown four named account balances. |

Both sheets are reachable in general mode: 29 from frames 04, 10, 11, 12, 13 and 15, and 32 from 10 and
11. Frames 04, 10, 11 and 15 are clean - D24 and D26 gave each of their sourcing captions a general
variant - so this is the same defect on the two sheets that pass was not looking at.

Fixing it is the D24 pattern applied twice more: a general variant of each string, selected by the
same `src/regulatory.js`-style test, and for the balances caption a variant that names no account
and no figure. Left out of the G52 pass deliberately: that pass was scoped to the shared regulatory
line, and these are five screen-owned strings on two frames.

*Status: CLOSED BY REMOVAL, 22 August 2026.* All five strings in the table above are the
consent-path wording, which was always accurate; what made them false was general mode reaching
those two sheets, and general mode is gone. Every session now has read the twelve months of
activity that frame 29's intro and metadata line describe, and frame 32's "read directly from your
accounts" heading is true of everything under it. The balances caption this gap called the urgent
one - four named accounts and their balances - is now only ever shown to a session whose accounts
those are. No copy was changed to close this. See `DECISIONS.md` D28.

---

**G55. Frames 02, 03 and 03b claim account activity before any has been read. CLOSED BY REMOVAL
22 August 2026 - see `DECISIONS.md` D28.**

The guidance line on the journey overview, the consent screen and the move-account sheet says the
guidance is based on your account activity, and on all three it is displayed before the participant
has decided whether to share any. Both paths pass through them, so it is not a general-mode
question.

They were left out of the G52 pass on purpose. The test that pass installed asks whether anything
has been read; on these three the honest answer is "not yet", and switching them would change what
renders on the consent path, which the pass was required not to do. Whether "not yet" should read
as "nothing was read" is a copy question, not a mechanical one: the line on frame 02 is arguably
describing what the feature will do rather than what this screen shows.

Resolving it means deciding what these three screens are claiming, then either extending
`src/regulatory.js`'s test to them or writing a third line for the not-yet-decided state.

*Status: CLOSED BY REMOVAL, 22 August 2026.* Two of the three screens no longer exist as this gap
describes them, and the third is no longer pre-consent, because there is no consent step to be
before. Frame 03 is now "Your accounts" and asks what each account is for; frame 03b is unchanged
and reached from it; and frame 02, the journey overview, carries the guidance line at a point where
the account activity it names has already been read - the figures are seeded when the session
starts (`src/state.js`), not when a participant agrees to something. Verified in the built result:
walked `/home` to `/journey` from a fresh session and confirmed `money-in`, `essential-spending`,
`left-over` and `saved-toward-deposit` are all populated with provenance `read`/`derived` before
frame 02 renders. The honest answer on all three is now "already read", so no third line and no
extension of the deleted `src/regulatory.js` test is needed. See `DECISIONS.md` D28.

---

**G56. Frame 12's growth chart draws a y-axis label through a threshold line in general mode. OPEN.**

Found while auditing the eleven general-mode screens of the G52 pass with `overlap.test.mjs`'s own
detectors, run ad hoc over general-mode seeds rather than the committed 32-frame table. Frame 12 is
the only failure, at both text sizes: the y-label `GBP 44,100` sits on a
`growth-chart__threshold-line`, unmasked, so the rule passes through the glyphs.

It is **not** caused by that pass. The identical failure reproduces on the commit before it
(e7aa87e), so it predates the guidance-line change and belongs to the chart itself, next to G44's
question about the same chart's opaque label plates. The consent path's own frame 12 passes, so
whatever positions the label is reading a general-mode figure.

The general-mode frames were not added to `scripts/overlap.test.mjs` permanently, because doing so
would commit a suite that fails on this. Add them in the same pass that fixes it.

*Status: open - pre-existing chart defect, reproduces before the G52 pass.*

*22 August 2026: the general-mode REPRO is gone, the defect is not.* General mode was deleted
(`DECISIONS.md` D28), so the seeds this was found with no longer describe a reachable state. That
removes the reason the general-mode frames were kept out of `scripts/overlap.test.mjs`, but it does
not establish that frame 12's chart is sound - the label positioning that produced the collision
was never diagnosed, and G44's question about the same chart's opaque label plates is still open.
Re-find it against reachable figures before assuming it went with the mode.

---

**G57. Frame 13's "Got it" pushes where its chevron pops. OPEN.**

Found while giving frame 13 the back chevron (`DECISIONS.md` D32). The two controls on the screen
resolve to the same place by different means: the chevron is `goBack()`, while the "Got it"
primary at `src/screens/learn-ltv.js:214` still does `window.location.hash = '#' + returnFrame`.

Same destination in practice, because each of the three callers sets `returnFrame` immediately
before navigating. Different mechanism, and the difference shows on the next tap: "Got it" pushes,
so frame 13 stays on the stack and back from the screen it returned to lands on frame 13 again.
This is the pattern D29 removed from every back control and D32 has just removed from frame 22's
"Done" for exactly this reason.

Not fixed here because it was outside the stated scope of that change. The fix is one line - point
it at `goBack()` and drop the `returnFrame` read, as frame 22 now does. Worth doing with a sweep of
the other primaries that still return by pushing (`/mip/adviser` is done; `/learn/ltv` is this one),
rather than one at a time.

---

**G58. Frame 18 `/mip/about` keeps the close X, and may be the same mistake as frame 13. OPEN.**

`DECISIONS.md` D32 corrected the glyph on frames 13, 33 and 22, all of which carried an X without
being a boundary of the journey. Frame 18 was not part of that change and still carries one, so its
X leaves the journey for `journeyEntryPoint`.

It has one route in: frame 17's "What the check involves" row (`src/screens/mip.js:65-68`). That
makes it an explainer opened from the screen before it, which is the same shape as frame 13 - and
frame 13's X was corrected precisely because being ejected to frame 01 or the goals area after
reading an explainer loses the participant's place. The difference, and the reason this is a
question rather than a defect, is that frame 18 sits at the top of the Mortgage-in-Principle flow
rather than off the side of it, and its own action bar continues to frame 19 rather than returning
- so "leave the check" may genuinely be what its X should mean.

Needs a decision about what frame 18 is, not a code change guessed at from the pattern.

**G59. A cold-loaded tab root was stamped `root: false`, and drew a back chevron on a tab root.
CLOSED 26 August 2026.**

Opened by `DECISIONS.md` D40, 25 August 2026, left open through D41, and closed by D41's
first-entry amendment. *The description below is the defect as it stood; the resolution is at the
end.*

`src/router.js` stamps each history entry with `ROOT_MARKER`, read back by `isRootEntry()`. The flag
that feeds it, `pendingRootArrival`, is raised only by the tab-bar handler. **Every other way of
arriving at a tab root therefore stamps `root: false`**: a cold load, a link opened fresh, a deep
link, and a browser session restore. Measured, per tab root:

| Arrival | `history.length` | Stamp | Back goes to |
|---|---|---|---|
| Cold load `#/home` | 2 | `root: false` | **leaves the prototype** |
| Cold load `#/goals` | 3 | `root: false` | `#/home` |
| Cold load `#/tracker` | 3 | `root: false` | `#/home` |
| Tab tap to any of the three | - | `root: true` | previous tab |
| Refresh, arrived as a root | unchanged | `root: true` preserved | unchanged |
| Refresh, arrived by descent | unchanged | `root: false` preserved | the screen it descended from |

Refresh is NOT affected in either direction: `stampEntry()` returns early on an entry it has already
stamped, so a reload preserves whatever that entry was.

**Where `seedHistoryRoot()` sits, which is the crux.** It runs in `startRouter()` BEFORE the first
`renderCurrentRoute()`, and therefore before the first `stampEntry()`. It writes its two entries -
the seeded `/home` and the landing route pushed on top of it - with `root: false` written out
explicitly rather than inherited, because neither was reached by a tab tap. By the time any render
happens, a cold arrival is already stamped, and nothing later re-stamps it.

**This is safe-directional for navigation and NOT safe for the chevron.** For the tab rule,
`root: false` means "descent", so the first tab tap pushes rather than replaces: one extra entry per
cold arrival, bounded, never accumulation. For the back chevron the same value is a defect - a
cold-loaded `/goals` or `/tracker` reports "not a root" and so will **draw a back chevron on a tab
root**, which is the exact thing the chevron rule exists to remove.

**And cold load is the common path, not an edge case.** Participants are sent a link and open it;
they do not usually arrive at a tab root by tapping through from `/home`. So the shape of this gap
in a real session is closer to "the chevron is usually wrong on a directly-opened tab root" than to
"a rare cold-start case".

**RESOLVED.** The question it turned on - what a non-tab-tap arrival at a tab root should count as -
has an answer at exactly one boundary. **On the first entry of a session there is no earlier screen,
so no descent can have happened.** If that entry lands on a tab root, it is a root. `seedHistoryRoot`
now stamps it `root: true`, reading the tab roots from `NAVIGABLE_TABS` rather than a second list.

The route is decisive there and only there, so this is not a route test applied generally and D41's
rule is unchanged - screens still ask `isRootEntry()` and nothing else. The first entry is
distinguishable because `seedHistoryRoot` is called once from `startRouter`, which runs once per page
load: a URL typed mid-session fires `hashchange` and never reaches it, measured as the history length
growing by one rather than two.

After, on cold load: `/home`, `/goals` and `/tracker` all report `isRootEntry() === true` and draw no
chevron; `/position/summary` and `/consent` report `false` and keep theirs. Refresh still preserves
the stamp in both directions.

**Browser session restore is still unmeasured.** It could not be driven headlessly. A restored entry
carries its `history.state` per the HTML spec, so it should look like a revisit and keep its stamp -
the same path a reload takes, which IS measured. Recorded as reasoning, not as a result.

**G60. A tab tap and a swipe back mid-flow leaves `exitFlow()` overshooting by one screen. OPEN,
and pre-existing.**

Found while verifying D40 (25 August 2026), and confirmed NOT to be caused by it: the trace below is
byte-identical with D40's `src/router.js` and with the version at `HEAD` before it.

```
enter MIP from the tracker   #/mip     len=4   flowEntryHistoryLength=3
tap the Goals tab            #/goals   len=5   (a descent out of /mip, so it pushes - correct)
swipe back                   #/mip     len=5   delta = 5 - 3 = 2
flow X                       #/home            <-- should be #/tracker
```

`exitFlow()` goes back by `history.length` minus the length recorded at flow entry. The Goals tap
pushed an entry, the swipe back moved the POSITION but not the LENGTH, so the delta reads 2 where
the participant is only one entry deep in the flow, and `history.go(-2)` overshoots `/tracker` and
lands on the seeded `/home`.

This is exactly the approximation `DECISIONS.md` D32 records and accepts - "`history.length` counts
forward entries as well as back ones ... it is not a running index of where the participant is" -
so it fails onto a real screen rather than somewhere unrelated. What is new here is a concrete
reproduction rather than a general caveat.

**D40 does not make it worse, and makes it better in one case:** a tab-bar tap between two roots no
longer pushes at all, so the laterals that used to inflate the count no longer do. Inside a flow the
participant is never standing on a root, so the flow-exit path behaves exactly as it did.

*Not fixed here.* The fix is to record a position rather than a length - a monotonic depth counter
stamped into `history.state` alongside `ROOT_MARKER`, which is now available and was not when D32
was written. That is its own change, and it should be taken together with the G59 stamping question
rather than separately.

---

**G61. The calculator's default monthly saving is 67% of what is left over, above the ~60% the
copy rule flags. CLOSED 27 August 2026 - DECISIONS.md D47. Split three ways; see the closing note.**

Frame 10's range slider seeds itself from the accounts when the participant has not set it:
`calculator-saving.js` reads `MOCK_POSITION.recentMonthlySavingLow` and
`recentMonthlySavingHigh` (£200 and £310, provenance `read`) and clamps each to `left-over`.
`left-over` is £640 on a fresh session (`money-in` £2,500 less `essential-spending` £1,860), so
neither end clamps. A participant who accepts the range without moving a handle continues with
`savings-rate` set to the midpoint, **£255 a month - 40% of the £640 they have left**.

The copy-check rule (`.claude/skills/fca-copy-check`, rule 1A) asks that no default or
illustrative contribution exceed roughly 60% of what is left after essential spending, on the
Consumer Duty foreseeable-harm ground that a default set that high predictably fails. 60% of £380
is £228; the default is £27 above it.

**This is live for sessions, not hypothetical.** It is what every participant gets who does not
move a slider handle, which on a mid-fidelity prototype is most of them. It is also unrelated to
any recent change - it is the seeded default as originally built.

Found while planning the frame 33 "Journey stage" scenario, which would reproduce the same default
by following the calculator's own step 2 sequence. Recorded here rather than worked around there:
the scenario should reflect what the app does, not quietly do something better.

*Not fixed here, because both fixes change something the repo protects.* Lowering the seeded range
changes `MOCK_POSITION` values that are described as read from the instant saver's own deposit
history and that match the £200-£310 range the Figma frames draw, so the built screen would stop
matching its reference. Clamping the seed to 60% of `left-over` instead of to `left-over` changes
the ceiling rule for every participant and would need `monthsToTarget`'s `exceeds-left-over` guard
looked at in the same pass. Either is a decision about a figure, which CLAUDE.md puts outside a
tidy-up.

---

**CLOSED 27 August 2026, split three ways. The entry above bundled a flagged default, an unnoticed
stronger finding and a copy defect under one number. They have different answers, so they are
recorded separately.**

**G61a - the 67% default. RESOLVED as a documented decision. No figure changes.** Rule 1A's 60%
clause is a FLAG, not a FIX: the section header names the section's dominant action and the clause
states its own. The clause governs COPY, and **no screen states £255 or 67%**. The midpoint exists
only in the store - frame 10 shows the £200-£310 range, frame 11 shows the same range, frame 12 and
the tracker show what follows from it in months and dates. Frame 10 headlines no proposed amount,
frames none as a share of what is left, sets no target, and states two facts: "£380 is what's left
each month once your essentials are covered. £310 is what you've been putting aside lately." That is
the remedy the three FIX bullets ask for, already met. The range is fixed by the reference frames,
which draw £200, £310 and the £0-£380 track exactly. **The default remains flagged and is not being
raised.** The skill has been corrected so the FIX/FLAG contradiction does not have to be resolved
again. See DECISIONS.md D47.

**29 AUGUST 2026, D57: THE FLAG CLEARS ON ITS OWN, WITHOUT THE DEFAULT MOVING.** Rounding the
seeded salary to £2,500 lifts `left-over` from £380 to £640. The £255 midpoint is unchanged - the
slider seeds `min(200, ceiling)` and `min(310, ceiling)`, and the clamp was not binding at £380 and
is not binding at £640 - but it is now **39.8%** of what is left, against a 60% line that has itself
risen to £384. The default is £129 BELOW the line it used to sit £27 above. Recorded rather than
closed: the gap was raised as a question about the persona's figures, and the persona's figures are
what moved.

**G61b - the £310 upper handle at 81.6% of left-over. OPEN, and the stronger finding.** Raised
during the G61 split; carried below as its own entry, **G63**.

**G61c - frame 11 captioned the range "The range you set" to a participant who set nothing. FIXED.**
Frame 10 commits `monthly-low`/`monthly-high` on Continue whether or not a handle was moved, with
provenance `read` when untouched, and frame 11's caption was unconditional. The row now picks by
provenance, the same way frame 05 does: `read` gives "Read from what you've been putting aside
lately", `entered` keeps "The range you set". This is the part of rule 1A that WAS a copy defect -
the section's own remedy is "hand the choice to the user", and the screen was claiming a choice the
participant had not made.

*Known limitation, logged not fixed.* The 10b date path derives the range from the chosen date and
lands on provenance `entered`, so it also reads "The range you set" where a date is what was set.
Loose rather than false - the participant did make the input it derives from - and separating it
would need a third string keyed on `solveFor` rather than on provenance.

---

**G63. Frame 10's upper slider handle defaults to 81.6% of what is left over, and £310 is the copy
rule's own example of what not to do. OPEN.**

Raised as "G61b" while splitting G61, and the stronger of the two findings that entry contained.

`MOCK_POSITION.recentMonthlySavingHigh` is £310. `left-over` is £380 on a fresh session, so the
range's upper handle sits at **81.6%** - above the 80% that rule 1A names as the level at which a
default "predictably fails and sits badly against the Consumer Duty requirement to avoid
foreseeable harm". G61 flagged the £255 midpoint at 67% and did not look at the handle above it.

**It is also displayed, which the midpoint never was.** £310 appears twice on frame 10 - as the
upper figure in the readout, and by name in the caption "£310 is what you've been putting aside
lately" - and again on frame 11's review row. Rule 1A's first FIX bullet gives its own example of a
screen breaching it: *"You could put aside £310 a month"*. The number in the rule is the number in
this build.

**The defence, stated fairly.** £310 is not presented as a proposal. It is captioned as a fact about
the persona's past behaviour, read from the instant saver's own deposit history
(`src/model/accounts.js`), and the caption's grammar is descriptive throughout: what's left, and
what you've been putting aside. On the wording alone the screen does not breach the three FIX
bullets, which is exactly why G61a resolves as it does.

**And against it.** The slider seeds itself from that figure, so £310 is where the upper handle
starts rather than somewhere the participant dragged it; and Continue commits the midpoint of the
seeded range whether or not either handle moved. **The app does default to it.** A figure can be
described honestly and still be the default, and rule 1A's 60% clause is about defaults rather than
about description. Both halves of that are true at once, which is why this is a gap and not a
finding either way.

*Not resolved here.* Lowering it changes `MOCK_POSITION` values the reference frames draw exactly,
so the built screen would stop matching frame 10's PNG. Leaving it accepts a default above the level
the rule names. That is a decision about a figure and about a screenshot exemption, and it belongs
to whoever owns the mock persona rather than to a copy pass.

**29 AUGUST 2026, D57: RESOLVED BY THE PERSONA CHANGE THIS GAP ASKED FOR, FROM THE OTHER END.** The
gap named the trade exactly - lowering £310 would break the reference PNG - and the salary round
took the other side of it: `left-over` rises to £640 and £310 is untouched, so the PNG still matches
and the handle now sits at **48.4%**, below both the 60% flag line and the 80% "predictably fails"
level. Frame 10's caption is a template (`{max}`), so it renders the new ceiling with no copy
change. **Closing this needs one confirmation that is not mine to give:** the £0-£640 slider track
no longer matches the £0-£380 track frame 10's reference PNG draws. That is a screenshot-exemption
call for whoever owns the reference set.

---

---

**G64. Frame 10b's date path has no ceiling, so a target date can commit a monthly amount above
what is left over. OPEN.**

Raised while splitting G61. It is not G61: G61 was about a default that is too high, this is about
no upper bound existing at all on a second path through the same screen.

`calculator-saving.js`'s slider path measures every input against `savingCeiling`, which is
`left-over`. Both range inputs carry `max="${savingCeiling}"`, every `commit()` re-clamps through
`clamp(..., savingCeiling)`, and `errorExceedsLeftOver` fires if the upper figure passes it.

**The date path has none of that.** `monthlyAmountFromDate()` solves the monthly payment from the
chosen date and is unbounded by construction - a nearer date simply means a larger payment. The only
error the 10b branch raises is `errorPastDate`. Continue then commits the result directly:

    const rate = previewAmount;
    const range = rangeFromCentral(rate.value);
    setState({ 'savings-rate': { value: rate.value, ... }, ... });

**Driven in a browser, not reasoned about.** Switching to "Set a target date" and pressing Continue
on the default seeded date commits a range of **£331 to £404** against a £380 `left-over` - the
upper end already past the ceiling the slider path enforces, on the screen's own default date, with
no warning shown and no handle touched.

Downstream, `monthsToTarget()` has an `exceeds-left-over` guard, so frame 12 renders its own
`unreachable` variant rather than a wrong projection. The figure is caught one screen late, by a
model guard, on a screen that does not explain it - not by the screen that accepted it.

*Not fixed here.* The fix is a decision about which of two paths owns the ceiling rule, and it has
to be taken with `monthsToTarget`'s `exceeds-left-over` guard in the same pass rather than by adding
a clamp to one branch. Related but separate: G63, the height of the slider path's own default.

**29 AUGUST 2026, D57: THE DEFECT IS UNCHANGED; ITS DEFAULT REPRODUCTION IS NOT.** The date path
still has no ceiling, and that is still the gap. What changed is that the seeded date's £331-£404
range now sits INSIDE a £640 `left-over` rather than past a £380 one, so the recipe above no longer
breaches on the screen's own default and `monthsToTarget()`'s `exceeds-left-over` guard no longer
fires there. The path is reachable by stepping the date earlier. **This makes the gap harder to
find, not smaller** - do not read the recipe's going quiet as the bounds question being answered.

---

**G65. Frame 10b computes the monthly amount and never shows it, so a participant commits to a
figure they have not seen. OPEN.**

Raised in the same pass as G64, on the same screen, and reachable the same way.

`calculator-saving.js` computes `previewAmount = monthlyAmountFromDate(state, months)` on every
render of the date path. It is read in exactly one place: the Continue handler, where it becomes
`savings-rate`. **It is never rendered.** The 10b branch draws the date stepper and, if the date is
in the past, a warning - and nothing else.

So the screen asks "when would you like to have it by?", accepts a date, and commits a monthly
amount the participant is not shown until frame 11. The variable name says a preview was intended;
`build-spec.md` section 2's own line for this screen is "pick a target date, solve the monthly
amount", and the solved amount is the half the participant never sees.

This is what makes G64 worse than a bounds question. A participant cannot notice that £404 is more
than they have left over, because the screen does not tell them £404 is what they are choosing.

**The build is faithful; the design is the gap.** Reference PNG 10b was checked rather than assumed:
it draws the segmented control, the month and year steppers, and the hint "We'll work out what
you'd need to put aside each month" - and **no readout of the solved amount anywhere**. The hint is
future tense, so the frame as drawn does defer the answer to frame 11. This build renders exactly
what the reference draws. So this is not a build omission to be corrected against the PNG; it is a
question about the design the PNG records.

*Not fixed here.* Adding a readout means new copy and a decision about where the figure sits
relative to the stepper, on a frame whose reference deliberately has neither. That is a "Confirm"
for the design owner rather than something to invent in a build pass - and the £331 to £404 case
under G64 is the argument for putting it to them, because a bound the participant cannot see is a
bound they cannot act on.

**G62. Frame 15/16's gap sentence reads "You're £0 away" while the headline shows £8,950 against a
£28,000 goal. CLOSED 27 August 2026 - DECISIONS.md D46.**

`tracker.js` computes the gap sentence with `gapToCheckpoint(state)`, which recomputes the
checkpoint LIVE from `property-value` x `deposit-pct` rather than reading the stored
`checkpoint-amount`. With `property-value` null, `depositTarget()` fails and the gap collapses to
£0, so the screen says:

> You're £0 away from the point where checking a Mortgage in Principle starts to be useful.

while the headline above it reads £8,950, the caption reads "of your £28,000 deposit goal", and the
progress bar draws about a third. **The screen contradicts itself.**

**Reachable path, no facilitator gesture:** from `/tracker` below the checkpoint, tap "Adjust my
goal" (D25's secondary action), reach frame 09, clear the property value field - which writes
`property-value: null` without clearing the committed `deposit-target` - and return to `/tracker`.
The screen's own guard passes on the stored keys and it renders.

**THIS IS THE SAME LIVE-VERSUS-STORED DISAGREEMENT AS THE ONE FIXED IN `canSkipAhead()`, in a
different consumer,** and that is the thing to know before fixing it. D38's third amendment records
the pattern: `/tracker`'s guard decides whether the screen renders by testing the STORED
`checkpoint-amount` and `deposit-target`, so anything on the screen that re-derives those figures
live can disagree with the guard that let it draw. `canSkipAhead()` and `skipAheadPatch()` were moved
onto the stored key. `gapToCheckpoint()` was not, because it is a model function with other callers
and changing it is a wider decision than the one being taken there.

**Other live consumers on the same screen, checked in the same pass:**

- `assumptions-saving.js` calls `depositTarget(state)` live but HANDLES the error, falling back to
  `inflationExclusionFallbackAmount`. Correct as written.
- `learn-ltv.js` calls `depositTarget(state)` live and does not handle the error; its comparison
  table multiplies `property-value` directly, so with a null value the columns compute from zero.
  Same class of defect, not yet traced end to end.

*Not fixed here.* The fix is a decision about which figures a screen may re-derive and which it must
read, and it should be taken across `gapToCheckpoint`, `learn-ltv.js` and any later consumer at
once rather than one call site at a time.

---

**CLOSED 27 August 2026. The symptom above is real and was reproduced exactly. The diagnosis was
right about the mechanism and wrong about the scope, in both directions - the entry understated
what was broken and misidentified one of the two cases it named. Recorded here so this is not
read later as having been right.**

**What this entry got wrong.**

- **`learn-ltv.js` is NOT a second unhandled case.** The paragraph above says it "calls
  `depositTarget(state)` live and does not handle the error". Lines 77-78 do call it live, but
  line 69 guards on `property-value === null` and `window.location.replace`s before any of that
  runs. The screen never rendered in the cleared state, so it never showed a wrong figure. What it
  did do was redirect **into frame 12**, which was broken - so it was a route to the defect, not an
  instance of it.
- **`gapToCheckpoint()` does not have "other callers".** The paragraph above declines to move it
  onto the stored key partly on the grounds that it is "a model function with other callers".
  It has exactly one, `tracker.js:85`. That reasoning was the only thing keeping the D38 third-
  amendment fix from being applied here, and it was not true.

**What this entry missed. Three screens were broken, not one, and two of them are not mentioned
above at all.** Every one of them guards on stored keys and then reads `property-value` live:

| Screen | What it rendered in the cleared state |
|---|---|
| 15/16 `/tracker` | **Three** invented figures, not one: the £0 gap sentence named above, "a 10% deposit on a **£0** home" in the "Deposit goal set" milestone, and £0 deposit amounts down the rate-band table |
| 12 `/calculator/result` | **The worst of the three, and unmentioned above**: the headline read "A deposit on a **£0** home could be **£0** to **£0**", with every threshold label and the growth chart scale collapsed to zero |
| 11 `/calculator/review` | **Also unmentioned above**: the property value row read **£0** |

`formatCurrency(null)` returns "£0" rather than throwing, which is why all three fabricated a
figure instead of failing visibly. Frame 21 was checked in the same pass and is correct as written:
every one of its four model calls tests `.error` and renders "—".

**The root cause was upstream of all of it, and is not "which figures a screen may re-derive".**
`calculator-property.js` wrote `property-value: null` on the field's `change` event, while every
other figure that screen owns - `deposit-target`, `loan-amount`, `ltv` - is written on **Continue**.
That asymmetry let the store hold a half-made edit beside a committed goal, which is a state no
screen expects and no guard tests for. The three screens above were consequences.

**Fixed by not writing the null.** An empty field is now the screen's own draft state
(`propertyValueCleared`), the committed figure is left standing, and every consumer is fixed at
once. A second route to the same state was found while verifying and closed with it: `"-"`, `"."`
and `"-."` survive the input strip, yield `NaN`, and `JSON.stringify` persists `NaN` as `null`, so a
refresh reproduced the whole defect. Only a finite number is now committed.

`gapToCheckpoint()` was moved onto the stored `checkpoint-amount` as well - one line, its one
caller, and the D38 pattern - so the tracker derives only from keys its own guard proved present.
That is defence in depth rather than the fix.

**Deliberately not done:** teaching frames 11, 12 and 15/16 to handle a null `property-value`. After
the upstream fix there is no null to handle, and writing "we can't show this" copy for an
unreachable state would be adding screens the spec never drew. The invariant is in `CLAUDE.md`
under "State rules" and asserted by `scripts/g62.test.mjs`.

---

**G66. A session from before a deploy never applies the opening stage, so Insights keeps
redirecting - and, the half this entry originally missed, it renders that build's seeded figures
indefinitely. THE FIGURES HALF IS RESOLVED (29 August 2026, D59). The routing half is resolved as a
consequence. The facilitator procedure in `ROUTES.md` stands as a second line of defence.**

Raised while fixing the build caption (DECISIONS.md D49); the two share a root and only one of them
was safe to close.

`state.js`'s `isNewSession()` is false the moment anything is read back from sessionStorage, and
`router.js`'s `openSession()` is gated on it. sessionStorage is per tab and survives every reload,
so a tab that held a session from before D48 shipped is treated as restored on every subsequent
load, `openSession()` never runs, and `/tracker`'s guard sends the Insights tab to
`/calculator/property` indefinitely. **Reproduced**: v37 build, deploy, reload, reload - Insights
still at `/calculator/property` with `isNewSession()` returning false, and only a second `#/reset`
on the running build recovers it.

**A participant who opened the link early meets this**, and nothing on screen says why.

**29 AUGUST 2026: THE GAP IS WIDER THAN THE TITLE SAYS. IT IS NOT ONLY THE OPENING STAGE - IT IS
EVERY SEEDED FIGURE.** `load()` returns `{ ...defaultState(), ...JSON.parse(raw) }`, so a STORED
figure wins over a freshly seeded one. `isNewSession()` gates `openSession()`; nothing gates the
figures. A tab holding a session from before a seed changed therefore keeps rendering the OLD figure
on every screen that reads it, indefinitely, on correct code.

**Reproduced against the v49 build.** After D57 rounded the seeded salary to 2,500, frame 19 was
reported as still rendering £2,240. It was not a code defect - all 29 routes were verified rendering
£2,500 - and the cause was this. Seeding a tab's stored `money-in` at 2240 and reloading twice
renders £2,240 both times; `#/reset` or a new tab returns £2,500.

**WHY THIS SYMPTOM IS WORSE THAN THE ROUTING ONE.** A misrouting Insights tab is visibly wrong and
prompts someone to ask why. A stale FIGURE is not: the screen is fully rendered, internally
consistent, and indistinguishable from a build that was never updated. It reads as a bug in the code
that just changed, and it sends whoever is looking into the source rather than into the session. It
also survives the two things anyone would try first - a hard refresh (which clears the HTTP cache
and the service worker, not `sessionStorage`) and a `CACHE_VERSION` bump (which invalidates cached
ASSETS, where this is stored STATE).

**RESOLVED 29 AUGUST 2026 (D59), AND THE EARLIER REJECTION BELOW IS SUPERSEDED RATHER THAN
OVERRULED.** The store is now stamped with `BUILD_VERSION`, and `load()` DISCARDS a stored session
whose stamp is not the running build's - falling through to `defaultState()` instead of merging over
it. An unstamped session takes the same branch, which retires every session written before this
change. The discard is announced on the console with both versions.

**WHY THIS IS NOT THE FIX THIS ENTRY REJECTED.** The rejected one re-applied the opening stage OVER
a restored store, and `stagePatch()` writes only `STAGE_KEYS` - leaving `targetMonth`, `solveFor`,
`journeyStarted`, `returnFrame` and `ltvVideoSeen` sitting beside a fresh goal. That mixed state was
the objection, and it was the right one: it is exactly the condition `CLAUDE.md`'s state rules and
D46 exist to prevent. **Discarding the store whole cannot produce it.** What comes back is
byte-for-byte a first load, which every screen already handles because every screen already handles
a first load.

**The routing half falls out of it.** `restoredFromStorage` stays false on a discard, so
`isNewSession()` is true and `openSession()` applies the opening stage to the fresh store - the same
path a genuine first load takes. The Insights tab stops redirecting, without a second mechanism.

**WHAT REMAINS, HONESTLY.** A participant whose session is open across a deploy AND who then causes
a document load (a refresh, a tab restore, an installed copy relaunched after the OS reclaimed it)
still loses their progress - now deliberately, and to a clean opening session rather than to a mixed
one. That residual risk is the price of the figures never lying, and it is narrower than it looks:
`BUILD_VERSION` is constant within a deploy, so every ordinary mid-session refresh matches its stamp
and restores untouched. `scripts/stale-session.test.mjs` asserts that same-stamp case explicitly,
alongside the two discards and the calculator's typed value surviving a reload and a back
navigation.

**The `ROUTES.md` procedure is kept**, demoted from the only defence to a second one. It costs
nothing, and it still covers the case this fix cannot: a facilitator who wants to know which build
is running before a session starts.

**The proposed fix, and why it is not here.** Stamp `BUILD_VERSION` into the stored session; if the
stored stamp does not match the running one, treat the session as new and apply the opening stage.
It closes the gap exactly. It also **resets a participant mid-task**, which is why it was stopped:

- The check would live in `load()`, which runs at module evaluation - once per **document load**,
  not once per session.
- A document load can happen DURING a session, not only between them: a refresh, a browser tab
  restore, an installed home-screen copy relaunched after the OS reclaimed it, a crash recovery.
  Nothing in the app or `sw.js` forces one - `clients.claim()` takes over future fetches without
  reloading, checked rather than assumed - but the participant or the moderator can cause one at any
  moment.
- What they would lose: everything in `STAGE_KEYS`. Their property value and deposit percentage and
  every figure derived from them, their monthly saving range, their account filing from frames 03
  and 03b, and the flags recording that a check was run.
- **And they would land in a mixed state**, which is the worse half. `stagePatch()` writes only
  `STAGE_KEYS`, so `targetMonth`/`targetYear`, `solveFor`, `journeyStarted`, `returnFrame` and
  `ltvVideoSeen` would survive beside the opening stage's own goal figures - a store holding a
  combination no screen expects, which is the condition CLAUDE.md's state rules and D46 exist to
  prevent.

**THE FACILITATOR PROCEDURE, WHICH IS NOW PART OF RUNNING A SESSION AND NOT ONLY A NOTE ON A
DEFECT.** While this gap is open, every deploy carries one step before the first participant of the
day, and it belongs in the session routine rather than in this file alone. It is written up in
`ROUTES.md` under "After a deploy, before the first participant".

1. **Open the participant link in a brand-new tab.** A new tab holds no `sessionStorage`, so
   `isNewSession()` is true, `openSession()` runs, and Insights lands on the tracker. Preferred,
   because it needs nothing checked and nothing typed.
2. **Or reload the open tab, confirm the new build is running, and then type `#/reset` once.** In
   that order. A `#/reset` typed before the new code is running executes the PREVIOUS build's reset,
   which is the error D49 was written after: the caption said v38, v37 was executing, and the reset
   that ran was v37's.

**Frame 33's footer is how the running build is identified**, and it is only trustworthy since D49.
The first line, "Build vNN. Figures are illustrative throughout.", is rendered from the constant
compiled into the executing modules and is never overwritten. A second line, "Downloaded and waiting
for a reload: vNN.", means a newer build has been fetched and is not yet running - reload before
anything else.

*Not resolved here.* The choice is between a stale session that quietly redirects and a session that
can reset under someone mid-task, and it was taken explicitly in favour of the stale one. Three
options exist if it is revisited: gate the version check on a session that shows no participant
input (`journeyStarted` false and no `entered` provenance anywhere), which is a heuristic rather
than a rule; have the facilitator open a fresh tab or use `#/reset` once per deploy, which is the
current workaround and costs nothing to build; or surface the mismatch on frame 33 as a prompt
rather than acting on it. The build caption now makes the mismatch visible, which is what the
workaround needs to be reliable.

---

**G67. `src/model/anchors.js` is named as the source of truth for the anchor audit and does not
exist.** `SPEC.md` lines 67-68 list it in the file inventory as "single source of truth for the
regulatory anchor map (below), as data", and lines 141-150 describe the audit it backs: "`src/model/
anchors.js` holds this table as data: `{ screenId: [anchorKey, ...] }`. Every screen module in
`src/screens/` exports its own `export const anchors = [...]` naming the same keys", compared
mechanically so the audit is "run once across all screens - rather than checked by eye".

Half of that is real. Every screen module does export an `anchors` array, and they are populated -
`mip-result-not-yet.js` declares `['guidanceNotAdvice', 'adviserScope', 'mcob3aRepossessionWarning',
'estimateDisclosure']`, matching `SPEC.md`'s own map rows for frame 21. What does not exist is the
file those arrays are supposed to be compared against, so nothing checks them and a screen whose
declared anchors drift from the rendered lines would not be caught. `SPEC.md`'s verification step 2
("Regulatory anchor audit - mechanical, not by eye") cannot currently be run as written.

Found while tracing the anchors on frames 20 and 21 for D51. *Status: open, and deliberately not
fixed here - it is unrelated to that change, and writing the missing file means deciding whether the
map's authority sits in `SPEC.md` or in code, which is a decision rather than a repair. `SPEC.md` is
left describing the intended state rather than edited down to the built one, so the discrepancy
stays visible.*

---

**G68. The `locked` milestone state now has no occupant, and is kept anyway.** D51 makes the Mortgage
in Principle row render `available` below the checkpoint as well as above it, because the route is no
longer blocked there and `available` is D42's "not done, and not blocked". D42 already establishes
that rows one to three can never take `locked` - the accounts are connected from session start (D28)
and `/tracker`'s own guard requires `deposit-target` before it will draw - so with row four gone,
**nothing on this list can take `locked` at all**.

Three things are therefore unreachable and all three are **deliberately kept**:

| What | Where |
|---|---|
| `MILESTONE_ICON.locked` | `src/components/ui.js` |
| `.milestone-row--locked` title and body colour rule | `src/css/components.css` |
| `lockedRowAriaSuffix` | `src/content.js`, under `/tracker` |

`lockedRowAriaSuffix` is a separate and older case: it has been **unreferenced anywhere in `src/`
since D35**, which made the milestone row a plain `<div>` rather than a `<button>` and removed the
only thing that read it. It did not become dead in this pass; this pass is where it was noticed.

*Status: open by choice, not a defect.* D51 is an explicit override of D25 and D35, and the whole
point of keeping these three is that the override reverts in one word - put the below-checkpoint
milestone state back to `locked` and the icon, the colour rule and the aria suffix are all still there
to receive it. Deleting them would make the reversal a multi-file restoration and would remove a state
D42's own four-state table still describes as meaningful. Revisit only if the override is confirmed
permanent, and then treat `lockedRowAriaSuffix` separately, since removing it is unrelated to D51.
---

**G69. Frame 21 says the amount needed is above what a lender would offer, while its own two rows
show the opposite.** Noticed while verifying D55's raised seed, and **not caused by it** - the
condition holds at every property value below £895,000, so it was equally true at D45's £240,000.

At the D60 seed the screen reads:

| Row | Figure |
|---|---|
| Headline copy | "the amount you'd need to borrow is **above** what a lender would typically offer" |
| What you'd need to borrow | £441,050 |
| What a lender would typically offer | around £445,500 |

£441,050 is **below** £445,500, so the two rows contradict the sentence above them. The same
comparison at D55's £650,000 gives £641,050 against £643,500, and at D45's £240,000 gives £231,050
against £237,600 - contradictory in the same direction at all three, which is the point below.

**Why it is structural rather than a bad number.** `neededLoanAmount` is `P - S`, and `borrowRange`
is `rangeFromCentral(loanAmount)`, so its high is `1.1 x P x (1 - depositPct)` = `0.99P` at a 10%
deposit. `P - S < 0.99P` reduces to `P < 100 x S`, and S is the fixed £8,950 mock balance - so the
sentence is false for every property under £895,000 and true only above it. The same relationship
makes `max-property` (£454,450) exceed the property value itself, which is why step 2 of "What you
could do next" invites the participant to "look at a property target closer to £454,450" when their
current target is £450,000 - a higher one.

**Why the screen is shown at all is a separate and correct thing.** Under D51 the CHECKPOINT decides
the result, not this comparison, so a below-checkpoint session lands on frame 21 whatever these two
rows say. The routing is right; the copy asserts a reason that its own figures do not support.

*Status: open. Not fixed in the D55 pass, and not in the D60 pass either - D60 moved the figures and
left the finding exactly where it was.* Three candidate readings, and the spec does not settle which
is meant: the copy is generic and should not name a comparison it does not make; or `borrowRange`
should be income-derived (the mock salary the MIP flow actually reads is
`MOCK_MIP_DATA.annualSalaryBeforeTax`, £38,000, which no plausible multiple takes to £445,500 - see
G71) rather than derived from the loan the participant's own
property value implies; or frame 21's rows should compare against the checkpoint that actually chose
the screen. The third is closest to D51 but the widest change. **Asked rather than guessed** -
picking one silently would move a figure on frames 20 and 21 and change what the MIP flow tells a
participant.

---

**G70. Frame 09b's Lifetime ISA cap banner is no longer an opening state, and a facilitator
expecting it will not find it.** Raised by D60, which caused it deliberately, and recorded here so
the absence reads as a decision rather than as a broken screen.

D55 raised `STAGE_PROPERTY_VALUE` to £650,000 for one reason: to put the opening session above
`LISA_CAP_PROPERTY_VALUE` so frame 09 rendered the cap banner from the first tap, with the
projection window given up to pay for it. D60 lowered the seed to £450,000 for relatability. £450,000
IS the cap, and `savingPatch()`'s comparison is strictly greater-than:

```js
lisaCapBreached: STAGE_PROPERTY_VALUE > LISA_CAP_PROPERTY_VALUE   // 450000 > 450000 === false
```

So the opening session sits exactly on the boundary and does not breach it.

**Nothing was removed, and the banner still works.** Frame 09 derives the comparison live from
`property-value` rather than reading the stored flag, so typing any value above £450,000 renders it
immediately, and `scripts/overlap.test.mjs` still covers the 09b row. What is gone is meeting it
*without typing* - which for a moderated session means a facilitator who wants to show 09b has to
spend a step of session time reaching it, exactly the cost D45's own rationale gives for the stage
control existing at all.

**Three ways out, none taken.** Seed £450,001 or £455,000 - restores the banner, costs the round
figure that made the case study relatable in the first place. Change the comparison to `>=` -
rejected outright, because £450,000 is the real Lifetime ISA property ceiling and a home *at* the cap
is usable, so `>=` would make the app state the rule wrongly. Give frame 33 a fourth stage that opens
above the cap - rejected under D38's fifth amendment, which is the standing argument against a second
control answering a question an existing one already answers.

*Status: open as a question for the researcher, not as a defect.* The prototype is correct at every
value; the question is whether an opening session that meets the cap warning is worth more to the
study than an opening property a participant recognises. **Asked rather than guessed** - D55 and D60
each answered it one way, and the answer belongs to whoever is running the sessions.

**Read alongside G72**, which is the reason this one matters beyond convenience. The Mortgage in
Principle result screens invite the participant toward a property ABOVE the cap and say nothing about
it, so frame 09b's banner was the second of only two places the cap is stated. With it gone from the
opening session, the cap is stated exactly once - frame 06's Lifetime ISA account caption - and never
again in the flow that contradicts it.

---

**G71. The seeded income does not support the borrowing the Mortgage in Principle screens show.**
Raised in the D60 pass, and **not caused by it** - D60 improved the ratio and did not come close to
fixing it.

**Two income figures exist and only one of them is the affordability one.** `MOCK_POSITION.moneyIn`
is £2,500, monthly income AFTER tax (D57), and it drives `left-over` and frame 10's slider ceiling.
The Mortgage in Principle flow reads a different figure - `MOCK_MIP_DATA.annualSalaryBeforeTax`,
£38,000 - which is what frames 19 and 31 show and what any affordability multiple has to be taken
against. Against £38,000:

| Seed | `loan-amount` | Multiple of salary before tax |
|---|---|---|
| D45, £240,000 | £216,000 | 5.7x |
| D55, £650,000 | £585,000 | 15.4x |
| D60, £450,000 | £405,000 | **10.7x** |

Mainstream affordability sits around 4 to 4.5x, so every seed this prototype has held is outside it,
and the current one is roughly two and a half times over. D45's was the closest and still exceeded it.

**Nothing errors, and no screen contradicts itself on this axis.** Frame 20's "likely to be
considered" outcome is set by the facilitator through `resultOutcome` on frame 33, not computed from
affordability, and `borrowRange` is D2's range rule applied to `loan-amount` rather than to income.
So the flow runs, the figures are internally consistent with each other, and the only thing wrong is
that a participant who knows what they could borrow may not recognise the picture as theirs - the
same objection D60 raised about the property value, one layer down.

**Why it is not fixed here.** Fixing it means either lowering `loan-amount` (i.e. lowering the
property again, which reopens G70 and undoes D60's own reason) or making `borrowRange` income-derived
- and income-derived `borrowRange` is precisely one of the three unsettled readings **G69** is
already waiting on. Choosing it here would answer G69 silently, from a different pass, on a different
question. Raising the mock salary instead would move `money-in`, `left-over` and D57's whole slider
argument, and £2,500 was itself a decision (D57).

*Status: open, and coupled to G69.* Whichever reading settles G69 settles this. **Asked rather than
guessed** - it moves figures on frames 20 and 21 and changes what the flow tells a participant.

---

**G72. Frames 20 and 21 invite the participant toward a property above the Lifetime ISA cap, and no
screen in the flow reconciles the two.** Raised in the D60 follow-up. **Coupled to G70**, which
records that the cap banner is no longer an opening state - that is what leaves this without a
counterweight.

**The figures, and where they come from.** `maxProperty()` in `src/model/model.js` is
`borrow-high + saved-toward-deposit`, and `borrow-high` is D2's range rule on `loan-amount`, so at a
10% deposit the whole expression is `1.1 x 0.9 x P + S` = `0.99P + S`. Committed to state by
`/mip/running` and read back by both result screens:

| Screen | Row | Opening session | Ready to check |
|---|---|---|---|
| **20** likely | "With your {deposit} deposit, that's a property up to" | - | **£479,250** |
| **21** not yet | "Look at a property target closer to {amount}" | **£454,450** | - |

Both exceed `LISA_CAP_PROPERTY_VALUE` (£450,000). Both also exceed the participant's own £450,000
target, which is G69's separate finding about the same relationship - `0.99P + S > P` whenever
`P < 100 x S`, and S is the fixed £8,950 mock balance.

**No cap check applies to either.** `LISA_CAP_PROPERTY_VALUE` is imported in exactly two screens:
`calculator-property.js`, for frame 09b's banner, and `position-summary.js`, for frame 06's account
caption. Neither `mip-result-likely.js` nor `mip-result-not-yet.js` imports it, reads
`lisaCapBreached`, or compares `max-property` to anything. The figure is rendered as a plain
`figureRowHTML` trailing value on 20 and as a next-step title on 21.

**And no copy reconciles them.** Every string on frames 20 and 21 was read: neither screen mentions
the Lifetime ISA, a cap, a ceiling or a withdrawal charge. Frame 20's captions attribute the figure
("Worked out from the most you could borrow and what you have saved so far") without qualifying it.

**Why this is a finding and not just an unlucky number.** The participant holds a Lifetime ISA - it
is £2,750 of the £8,950 that `saved-toward-deposit` sums, drawn on frames 03, 06 and 32 - and the app
tells them what that means on **frame 06**, in `lisaCaption`: "Usable for a home costing £450,000 or
less, once the account has been open 12 months." So within one session the app states the cap against
their own account, then later invites them toward £454,450 or £479,250 with nothing said. Frame 09b's
banner is the screen that would have restated it, and G70 records that it no longer renders on an
opening session - so in the D60 seed the participant meets the cap ONCE, early, on an account
caption, and never again.

**Not caused by D60, and made harder to notice by it.** The relationship is structural: `0.99P + S`
exceeds the cap for every P above about £445,500, so D55's £650,000 produced £652,450 and had the
same defect. What D60 changed is the counterweight - at £650,000 the cap banner was on screen from
the first tap, and at £450,000 it is not on screen at all unless the participant types a higher value.

*Status: open, reported not fixed, and the figures deliberately left alone.* At least four readings,
and the spec settles none: frames 20/21 could carry the cap warning when `max-property` exceeds it;
`max-property` could be clamped to the cap for a participant holding a Lifetime ISA; frame 21's step 2
could stop naming a higher property than the one already set (which is G69's territory, not this
one); or the whole thing is out of scope because these screens are about borrowing rather than about
which account funds the deposit. **Asked rather than guessed** - the first two add a regulated-product
statement to a result screen, which is an FCA copy question and not a layout one, and the third is
already waiting on G69.

---

**G73. The target year on frame 10b has no maximum, and typing it is a faster route to a nonsense
one than stepping to it was.** Raised while making the year editable (D61), and mitigated by that
change rather than closed by it.

**What is enforced now, and what is not.** `targetYear` has exactly one guard, and it is a minimum:
`monthsFromNow()` in `src/screens/calculator-saving.js` returns a negative number for a date in the
past, which raises `errorPastDate` ("Pick a date in the future.") and disables Continue. There is no
maximum anywhere. Both stepper chevrons are unbounded arithmetic (`targetYear + 1` /
`targetYear - 1`), and the typed field deliberately adds no bound they do not have, so the two routes
to a value cannot accept different years.

**Why it did not surface before.** Reaching an absurd year through the chevrons needed one tap per
year, so nothing beyond a plausible horizon was reachable in a session. A keyboard reaches 9999 in
four keystrokes.

**What `maxlength="4"` does and does not do.** It is a format constraint, not a validation rule: a
year is four digits, so the field holds four. It makes five-digit years **unreachable by typing**,
which removes the worst of the range, and it introduces no error string, no new content rule and no
new bound. It does not constrain the four-digit years that remain, and it does not apply to the
stepper at all - a participant can still step past 9999 if they have the patience.

**What a four-digit year beyond a plausible range does.** Nothing errors. `monthlyAmountFromDate()`
solves the annuity for the months implied by the date and returns a correspondingly tiny monthly
figure, so frames 11 and 12 render pennies rather than fail; frame 12's own `beyondWindowNote` ("This
could take more than 5 years at your current rate") already covers the far end of the chart. The
result is legible and wrong-looking rather than broken, which is why it degrades rather than needing
a guard to be usable.

*Status: open, mitigated for typing and not closed.* **Asked rather than guessed** before the field
was built, and the answer was to enforce only the existing minimum: a maximum is a content rule about
how far ahead this feature lets someone plan, it is not derivable from anything in the spec or from
the Bank Rate the other figures anchor to, and inventing one would have put a figure in the codebase
that no source backs. Settling it needs a stated horizon; whatever is chosen must be applied to the
stepper handlers as well as the field, or the two routes start disagreeing.

---

**G74. Frame 11's monthly range clamps a typed value away without saying so.** Raised while building
D62's in-place editing. Typing a lower amount above the upper one, or an upper amount above what is
left over each month, does not error: the value snaps to the bound and the field re-renders holding a
number the participant did not type.

**This is frame 10's behaviour, not a new one.** `calculator-saving.js`'s own figure inputs already
clamp with the identical expressions - `clamp(Number(figureLow.value) || 0, 0, Number(figureHigh.value))`
and its upper twin - and have since the slider was built. Frame 11 reuses them verbatim rather than
raising an error, which is what keeps the same edit behaving the same way on both screens and is why
no new error string was written. Confirmed as the preferred option before it was applied.

**What it costs.** A silent correction is a silent correction wherever it happens, and frame 11 makes
it more likely to be noticed because the row sits in a list of figures a participant is being asked to
check. Two mitigations are already in place and neither is a fix: the snapped value is visible in the
field immediately, and it snaps to **a bound the participant themselves set** - the other end of their
own range, or their own left-over figure - rather than to a seeded constant, so the number it lands on
is one they have seen before.

*Status: open, matching frame 10 deliberately.* Closing it means giving both screens the same
explanation, not giving frame 11 one of its own.

---

**G75. A typed "Saved so far" is reverted by opening frame 06, whether or not the accounts changed.**
Raised while building D62. The rule D62 implements is that a typed figure holds until the participant
returns to account assignment and changes which accounts count. The code is broader than the rule.

`position-summary.js` re-derives the account totals on **every render** and writes them back whenever
they differ from what is stored:

```js
if (startingSavedTowardDeposit(state).value !== totals.deposit || ...) {
  state = setState(accountFiguresPatch(state, {
    'saved-toward-deposit': { value: totals.deposit, provenance: 'read' }, ...
  }));
}
```

A typed £20,000 differs from the £8,950 the seeded accounts total, so **merely opening "Where you
stand" reverts it**, with no account having been touched. `consent.js` does the same on a checkbox
change, which is the case the rule describes and is correct.

**What holds and what does not.** The typed figure survives the calculator, the back navigation to
frame 10, a reload, and the result screen - none of those render frame 06. It dies on the next tap of
the journey spine that lands on frame 06, **and its caption dies with it**: the row returns to "Read
from the accounts you assigned to your deposit", which is correct for the figure now showing but
gives the participant no account of where their own number went. `skip-ahead.js`'s own comment states the assumption the
whole arrangement rests on: "`saved-toward-deposit` is a sum of account balances".

*Status: open, flagged rather than fixed on instruction.* Closing it means deciding which of the two
owns the figure when they disagree - a typed override that survives frame 06 needs a key saying it was
typed, and frame 06 needs to consult it before recomputing.

---

**G76. Frame 11's "Saved so far" field has no bound, because there is none to reuse.** Raised with
D62. The other three editable rows each reuse a bound that already existed - the model's own rejection
of a non-positive property value, the chip set's 5-25% range, and frame 10's left-over ceiling. Saved
so far has none: the figure is ordinarily a sum of account balances, which cannot be out of range, so
no screen in this build has ever had to check it.

The field therefore accepts any non-negative number a participant types. Negatives are unreachable -
the strip is `[^0-9.]`, a format constraint following frame 10b's year field, not a validation rule -
and the empty-value draft state applies as it does everywhere else, so the field cannot write a null.
A very large figure produces a `gap()` of zero and a `months-to-target` of zero rather than an error,
so the screens downstream stay legible.

*Status: open, not guessed.* A bound here is a content rule about the largest deposit this feature
entertains. Nothing in the spec, in `rates.js` or in the Bank Rate the other figures anchor to implies
one, so none was invented.


---

**G77. `fca-copy-check` rule 8 and D5's refinement now disagree, and the skill has not been
narrowed to match.** Raised by the copy check re-run D62 required, 29 August 2026. **Open, and
deliberately not resolved here.**

D5 was refined with D62 to say that a provenance caption is required where the figure did not
originate with the participant, and omitted where the figure sits in a permanently editable field
they typed into directly. `.claude/skills/fca-copy-check/SKILL.md` rule 8 still reads, verbatim and
without qualification:

> Any figure missing a provenance caption (`provenanceCaptionHTML()`; this repo carries provenance as
> a caption, never as a Source badge), or carrying the wrong provenance value in `src/state.js` ...

Applied literally, that reports four FIX-class breaches on frame 11: the property value, the deposit
%age, and both ends of the monthly saving range. Applied to D5 as refined, it reports none. The two
documents cannot both be followed.

**The evidence that the refinement describes existing practice rather than creating an exemption.**
Rule 8 taken literally already flags two screens that predate D62 and have never been reported:
frame 09's property-value field carries a `hint` ("Likely property value"), not a provenance caption
- its one `provenanceCaptionHTML()` call describes the AREA AVERAGE beside the field, not the
participant's own figure - and frame 10b's date stepper carries a hint too. Every editable figure in
this build has carried a hint rather than a provenance caption since it was built. Frame 11's fields
join that class; they do not create it.

**What is NOT in doubt.** Provenance itself is untouched: all four values are still carried and still
propagate, which is what D5's Decision governs. "Saved so far" still renders its caption and still
switches it on a typed edit. The two explanatory rows still render theirs. This gap is about one
sentence in an audit skill, not about the interface.

*Status: open, referred rather than resolved.* Resolving it means either narrowing rule 8's wording
to match D5's refinement, or reversing the refinement and restoring the two captions. Both are
decisions about the audit standard itself, so neither was taken here. Until it is settled, a
`fca-copy-check` run over `/calculator/review` will report those four rows, and the report should be
read against this entry.

---

**G78. Frame 05 now states what the figure is before it states where it came from, and nothing on
screen sources it above the fold.** Raised while applying D63, 29 August 2026. **Open: an
observation for the first session, not a resolved point.**

D63 replaced frame 05's body. The sentence that went was `'This all comes from your accounts. Change
anything that looks wrong.'`, and its first half was the only statement of SOURCING a participant met
before the figure. The replacement spends its three sentences on what the figure IS and on the fact
they can change it, which is what the screen was failing to say quickly enough, so sourcing moved
down rather than being reworded.

What a participant now reads, in render order:

1. `What's left over each month` - the heading
2. `This is roughly what you have left after your usual spending. Anything you save comes out of
   this. You can change any of it below.`
3. `640` - the editable figure
4. `Each month` - the figure's own caption
5. `Worked out from your salary and your regular spending` - the provenance caption, and the first
   thing on the screen that says where the number came from

So the first three things read are a definition, a number and a period. Sourcing is fourth, one
element below the figure and in footnote type.

**Why this was accepted rather than fixed.** Nothing REQUIRED is missing. `shared.leftOverCaption`
still renders directly under the figure, and rule 8 asks for a provenance caption, not for it to
precede the figure. `'Where these figures come from'` still routes to frame 32 and the disclosure
still routes to frame 29. The replaced half-sentence was also the vaguer of the two statements - "This
all comes from your accounts" against a caption that names the salary and the regular spending
specifically - so what moved down the screen is weaker than what stayed put. Adding a fourth sentence
to restore it would undo the change D63 was made for.

**What to watch in the first session.** Whether a participant asks where the 640 came from, or
challenges it, BEFORE their eye reaches the provenance caption. The think-aloud will show it: a
participant reading the heading and body and then querying the number's origin unprompted is the
signal that sourcing is now too low. If it appears, the fix is a sourcing clause in the body or a
caption promoted above the figure, and both are copy changes, not layout ones.

*Status: open, recorded for observation. No change made.*

---

**G79. Six plain-language terms are left in place on purpose, and two more were found while doing
it.** Raised with D65's jargon pass, 29 August 2026. **Open by decision, not by oversight.** Logged
so a later reader finds a reasoned position rather than rediscovering the words and assuming nobody
looked.

A scan of all 615 user-facing strings in `content.js` produced eleven candidates. Five were rewritten
under D65. The six below were not, each for its own reason, and each is recorded here with the
alternative that was considered and rejected so the trade is visible.

| Term | Where | Why it stays | Alternative considered |
|---|---|---|---|
| `ISA` | `accounts.js` account names: "Stocks and shares ISA", "Cash ISA", "Lifetime ISA"; and `'/calculator/property'.lisaCapBannerText` | **Expanding it would misrepresent the statement.** These are the names a real bank shows, and a participant matching the prototype against their own accounts needs the string they would actually see. "Individual Savings Account" appears on no statement. | Gloss it once on frame 03 rather than expanding the names |
| `valuation` | `'/assumptions/deposit'.assumptionsRowsBeforeInterest[0]` and `.exclusionsRows[2]` | Used in two different senses one list apart - a lender's valuation of the property, and the fee for a survey. One replacement cannot serve both, and splitting them is a content change rather than a wording one. | "what a lender thinks it is worth" / "a survey" |
| `repayment mortgage` | `'/learn/ltv'.comparisonCaptionTemplate` | It names the mortgage TYPE the illustrative figures assume. Removing the term would leave the figures unqualified as to type, which is a loss of precision on a comparison, not a gain in plainness. | "a mortgage you pay off in full over {years} years" |
| `affordability model` | `'/assumptions/borrowing'.exclusionsRows[1]` | **Describes a lender's own process.** Rewording it risks changing what the line claims a lender does, and the line's job is to say their method differs from ours. Precision here outranks plainness. | "A lender works out what you can afford in their own way, which differs from ours" |
| `underwriting` | `'/assumptions/borrowing'.borrowingEstimateWarning` | **Found during this pass, not previously flagged.** Rendered through `riskWarningHTML()` and required by `fca-copy-check` rule 2 as the not-an-offer statement on frame 31. Rewording a required line is a separate decision from a plain-wording pass. | "the checks a lender runs before they agree" |
| `indicative` | `'/assumptions/deposit'.rateVariabilityWarning` | **Found during this pass, not previously flagged.** Same reason: it is the rates-indicative risk warning rule 2 requires on frame 30, rendered through `riskWarningHTML()`. | "Mortgage rates shown here follow the market and change often" |

**The line between the five that changed and the six that did not.** Every term rewritten under D65
sat in an ordinary explanatory row and carried no regulatory weight. Every term left here either
names something precisely (a product, a mortgage type, a lender's process) or sits inside a required
statement. None was left because it was hard.

*Status: open by decision. The last two rows are the ones most worth revisiting, because both are
required lines that a lower-literacy participant is least likely to parse, and both would need a
copy-check decision rather than an edit.*

---

**G80. The 60-month window is asserted in three places that agree by value, not by reference.**
Raised with D68, 30 August 2026. **Open: reported, not fixed, because fixing it is a change to the
model's API surface rather than to this row.**

`CHART_WINDOW_MONTHS = 60` lives in `src/model/rates.js`. Three things depend on it and only one
reads it:

| Place | How it expresses the window |
|---|---|
| `model.js`, `monthsToTarget()` | `if (months > 60)` - a **hardcoded literal**. `model.js` does not import `CHART_WINDOW_MONTHS` at all. |
| `calculator-result.js` (frame 12) | Imports and uses the constant for the chart's x-axis. |
| Frame 12's `beyondWindowNote` | The words **"5 years"**, twice, in prose. |
| The tracker's `onTrackBeyondWindowValue` and `onTrackBeyondWindowNote` (D68) | The words **"5 years"**, twice more, in prose. |

**What breaks if the constant moves.** Changing `CHART_WINDOW_MONTHS` to, say, 84 would move frame
12's chart to seven years while `monthsToTarget()` carried on returning `beyond-window` at 60. The
model and the chart would disagree about where the window is, and **no test would catch it** -
`stage.test.mjs` asserts `months-to-target > CHART_WINDOW_MONTHS`, which stays true at 107.6 months
against either value. Both screens would then also keep saying "5 years" in copy while the chart drew
seven.

So three kinds of thing would have to move together: the literal in the model, the constant, and four
prose strings across two screens.

**Why it is not fixed here.** The literal is a one-word change; the prose is not. Deriving "5 years"
from the constant means a template and a duration formatter in copy that is currently plain prose on
frame 12 as well, so doing it properly touches a screen D68 was not asked to change. Doing it by
halves - fixing the model and leaving the copy - would leave the desynchronisation in the words
instead of the code, which is worse, because copy is what a participant reads.

*Status: open. The smallest honest fix is all four at once: import the constant into `model.js`, and
template the "5 years" in both screens' copy from a duration formatter over it.*

---

**G81. `on-track-for` can still be committed as a null, and nothing reads it.** Raised with D68, 30
August 2026. **Open, and narrower than it was this morning.**

`calculator-review.js` (frame 11) commits `'on-track-for': { value: onTrack.value, provenance }` when
the participant presses Continue. Where `onTrackFor()` fails, `onTrack.value` is null, so the store
takes a null under a real provenance - the `formatCurrency(null)` renders as £0 class of defect
`CLAUDE.md`'s state rules and D46 exist to prevent.

**D68 narrowed it.** Before, the opening session's own state was a producer: every session sat at
`beyond-window`, so the value written was null on the path every participant takes. `onTrackFor()`
now returns the range there, so that producer is gone.

**What remains.** Three error codes still return a null value, and frame 11's Continue guard
(`anyError = propertyError || pctError || monthlyError`) catches two of them:

| Code | Blocked at frame 11? |
|---|---|
| `non-numeric` / `not-positive` target | Yes - `propertyError` and `pctError` |
| `exceeds-left-over` | Yes - `monthlyError` tests `monthlyHigh > savingCeiling` |
| `unreachable` (`savings-rate` is 0) | **No.** `monthlyError` tests only the UPPER bound. Nothing tests for zero. |

So a participant who types 0 into frame 11's monthly range commits `on-track-for: null`. This is the
same absent-lower-bound shape as **G76** on the neighbouring "Saved so far" field.

**Confirmed unread, after D68 as before it.** Every reference to `'on-track-for'` in `src/` and
`scripts/` is a writer (`calculator-review.js`, `skip-ahead.js`, `stage.js`), a key-list declaration
(`state.js`, `stage.js`'s `STAGE_KEYS`, `skip-ahead.js`'s `DERIVED_STORED_KEYS`), a comment, or the
harness seed. **No screen reads it** - the tracker calls `onTrackFor(state)` live on every render.
So the null is latent rather than rendered: it is carried, persisted and restored, and nothing looks
at it.

*Status: open. Latent, not visible. It becomes a defect the moment any screen starts reading the
stored key instead of re-deriving, which is exactly the change someone would make to save a
recomputation.*

---

**G82. The tracker shows a projected figure and carries no estimate disclosure, and its endpoints are
more precise than the projection is.** Raised with D68's amendment, 30 August 2026. **Open: reported
inside a task scoped to reporting it, and a one-line fix that was not taken unilaterally.**

Two separate things about the same row, both pre-existing and both made more consequential by showing
a date nine years out rather than a threshold string.

**1. A rule 2 breach.** `fca-copy-check` rule 2: "Shows a projected figure -> must carry the estimate
note, `shared.regulatory.estimateDisclosure`, directly beneath it." The tracker's "On track for" row
IS a projected figure. `tracker.js`'s anchors are `['guidanceNotAdvice',
'mcob3aRepossessionWarning']` and it renders no `estimateDisclosure`; only frames 12, 20 and 21 do.
The only "estimate" strings in the `/tracker` block describe the Mortgage in Principle, a different
figure.

This did not begin with D68's amendment. The in-window range at `ready-to-check` ("October 2028 to
April 2029") has shipped unqualified since the screen was built. What changed is the size of what
goes unqualified.

`onTrackBeyondWindowNote` supplies estimate framing in the **beyond-window case only**. The in-window
case still has none.

**2. Endpoints more precise than the band.** The range is `rangeFromCentral` at 0.9 and 1.1, each end
`Math.ceil`'d to a whole month, then rendered by `formatMonthYear`, which resolves to a calendar
month. So two month-precise endpoints bracket a **22-month-wide** band, over a projection that holds
the Bank Rate, the participant's income and their outgoings constant for nine years - the assumptions
frame 29 lists. The width of the range signals imprecision honestly; the month-level endpoints work
against it.

Also pre-existing, and the same shape at every distance: it is simply more visible at nine years than
at two and a half.

**The fix for the first is one line** - `estimateDisclosure` beneath the "This month" card, adding
`estimateDisclosure` to `tracker.js`'s anchors. It was not applied because the task that found it
scoped this to reporting, and adding a required regulatory line to a screen is not a change to make
as a side effect of a copy tweak. **The second has no one-line fix**: rendering the endpoints less
precisely (a year, or a season) is a change to `formatMonthYearRange`, which frames 11, 12 and the
tracker all share, so it is a decision about every on-track figure in the build rather than this one.

*Status: open. The rule 2 half should be closed deliberately and soon; the precision half needs a
decision about the shared formatter before anything is worth doing.*

