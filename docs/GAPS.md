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

*Amended 31 August 2026 by **D92** / G105. (a) is now stated the other way round: the transform sits
on `.device-bezel` and `#app-frame` is the layout box, sized to the frame's rendered dimensions, so a
frame drawn ABOVE its natural size still has a box the page reserved for it. The page scrolls at
framed widths on a window too short to hold the frame, and the page's own scrollbar - outside the
bezel - is no longer hidden, because it is the only sign the bottom of the phone is below the fold.
Every scrollbar inside the bezel stays hidden, which is what this entry was about. (b) stands
unchanged.*

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
what is left over. CLOSED 30 August 2026 - DECISIONS.md D80.**

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

**CLOSED 30 AUGUST 2026. DECISIONS.md D80.** The decision the entry above said was needed - which of
the two paths owns the ceiling rule - was taken: **both do, and they measure against the same
figure.** `calculator-saving.js`'s date branch now compares the amount `monthlyAmountFromDate` solves
against `savingCeiling`, in the same `else if (!yearCleared)` branch that already raised
`errorPastDate`. One comparison, no new state key, no new component.

**Option C of the three that were put forward, and the two declined were declined on D46.** Clamping
the values on entering monthly-amount mode, and resetting them to the seeded range, both replace a
figure the participant set without saying so - the first landing on a bound they never chose, the
second on a seeded constant. This option discards nothing: the date stands, the figure stands,
Continue is disabled and the participant is told why. **Nothing is written on this path** -
`savings-rate`, `monthly-low` and `monthly-high` are untouched while the error stands, asserted by
`date-ceiling.test.mjs`.

**And it names the earliest date that works,** rather than only refusing the one chosen.
`monthsToReachAmount` at the ceiling is `monthlyAmountFromDate`'s own inverse, so the date it returns
is exactly the point at which the solved amount stops exceeding the ceiling. Closed together with G65
for the reason G65 gives: a bound the participant cannot see is a bound they cannot act on, so the
error and the readout had to land in one pass.

`monthsToTarget()`'s `exceeds-left-over` guard is untouched and stays where it is. It is now
unreachable through this screen - which is the correct relationship between a screen's validation and
a model's, not a redundancy to remove: the guard exists so no caller can produce a projection from an
impossible rate, and this screen is one caller.

**The copy was outstanding when this closed, and landed on 30 August 2026 - DECISIONS.md D81.** The
banner renders `content.js`'s `['/calculator/saving'].errorDateNeedsMoreThanLeftOver`, which stood at
`[AWAITING COPY]` for one build (v89) and now reads "That date needs more than the {max} you have left
over each month. Even putting all of it aside, the earliest you could reach your goal is {earliest}."
It is deliberately NOT `errorExceedsLeftOver`, which ends "Choose a smaller range" on a screen that has
no range control.

---

**G65. Frame 10b computes the monthly amount and never shows it, so a participant commits to a
figure they have not seen. CLOSED 30 August 2026 - DECISIONS.md D80.**

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

---

**CLOSED 30 AUGUST 2026. DECISIONS.md D80.** The "Confirm" above was put to the frame owner and the
readout was approved. `previewAmount` is now rendered, so the screen shows the figure it solves
instead of deferring it to frame 11.

**Placement: below the stepper, above the banner.** The slider variant puts its figures ABOVE its
track because the participant sets them there; this one puts the figure BELOW the stepper because the
stepper produces it. Reading order matches causality on both, and on both the error banner sits
immediately under the figure it is about - which is what Continue's `aria-describedby` points at
(D78).

**Drawn with `figureDisplayHTML`, which already existed** - the static counterpart to frame 05's
figure input, already rendering a single large figure with a caption on frames 06 and 21. It gained
an optional `live` flag here so the block is a polite live region: the figure moves on every press of
the date stepper, and without it a participant using a screen reader hears the month change but never
the amount the press was for.

**The deviation from reference PNG 10b is deliberate and recorded.** The frame draws no readout, and
the entry above is right that the build was faithful to it. What changed is that the frame predates
the ceiling check existing, so its silence on the readout was not a decision about a screen that
refuses dates - it was a decision about a screen that refused nothing. See D80.

**No copy was invented for it.** The caption reuses `sliderCaption` ("Put aside each month"), which
names the same figure on the same screen. The key name now under-describes its use; flagged for the
copy pass rather than renamed here, because renaming it touches the slider path too.

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
| **20** likely | "With your {deposit} deposit, that's a property up to" | - | **£484,875** |
| **21** not yet | "Look at a property target closer to {amount}" | **£454,450** | - |

Both exceed `LISA_CAP_PROPERTY_VALUE` (£450,000). **The ready-to-check figure was £479,250 when this
was raised and is £484,875 since D70** moved the checkpoint from £33,750 to £39,375, which raises
`saved-toward-deposit` at that stage and so raises `0.99P + S` with it. Corrected 30 August 2026. Both also exceed the participant's own £450,000
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

**Amended 30 August 2026 (D73). The count moved in both directions and is now FIVE places, not
three.** Frame 12's chart gained a range control, which adds a fifth assertion of the same number: the
`5 yr` chip in `chartRangeLabels` carries `months: 60` as its value and "5 yr" as its label, so
changing `CHART_WINDOW_MONTHS` to 84 would now also leave a chip offering five years on a chart whose
model boundary sits elsewhere. Against that, frame 12's `beyondWindowNote` lost one of its two "5
years" - its second clause went, for D73's own reasons - so the prose count fell by one as the
control's count rose by one.

**What it would take, unchanged in shape and now slightly larger.** `model.js` importing the constant
is still a one-word change and still the easy third. The prose is still the hard part, and the chip
set is now part of it: the range options would have to be derived from the window rather than written
out, so that a shorter window offers fewer chips and a longer one offers more. That is a real design
question - at an 84-month window, is the top chip "7 yr", or do the chips stay at 5 and stop matching
the axis - and it is not answerable by a refactor.

*Status: open, and deliberately not fixed by D73. Fixing the model's literal alone would leave the
desynchronisation in the words and now also in a control, which is worse than leaving it in one place
where it is written down.*

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


---

## G83. `/assumptions/costs` has no Figma frame, and is the only screen in the build that does not

*Raised 30 August 2026. `DECISIONS.md` D70.*

**The gap.** `CLAUDE.md` names Figma frame names as the system of record and forbids inventing a
screen: "If the spec is silent or says 'Confirm', 'Gap' or 'No frame drawn', add it to
`docs/GAPS.md` and ask." `build-spec.md` is silent on a screen for the upfront costs of buying, and
no Figma node or `reference/frames/` PNG exists for one. Every other route in this build traces to a
frame; this one traces to a decision.

**Why it was built anyway.** It was directed explicitly, with its contents, its sources and its
routing specified, after the alternative (five cost ranges on `/tracker`) was considered and
rejected for the reason D70 records. The screen invents no figure and no rule: the five ranges and
their two sources were supplied, and the pattern it follows is frames 29 to 32's, unchanged.

**What that leaves unresolved.** The spec-to-code mapping `CLAUDE.md` protects has one entry with no
frame behind it. If the Figma file gains a frame for this screen later, its name is authoritative and
this module's heading, route and `content.js` key should be reconciled to it rather than the other
way round. Until then `assumptions-costs.js`'s header is the only record of what the screen is.

**Also unresolved: it has no frame NUMBER**, so the three browser-driven fixtures that key on one
(`overlap.test.mjs`, `action-bar.test.mjs`, `sheet-drag.test.mjs`) carry it as the string `costs`,
and `ROUTES.md`'s frame column carries a dash. Any pass that assumes those columns are numeric will
need to handle it.

*Status: open, deliberately. Recorded so the absence is a known deviation rather than a silent one.*

---

## G84. `/learn/stamp-duty` has no Figma frame either

*Raised 30 August 2026. `DECISIONS.md` D70.*

The second frame-less screen in this build, after G83's `/assumptions/costs`, and raised on the same
terms. `build-spec.md` is silent on an explainer for stamp duty and no Figma node or
`reference/frames/` PNG exists for one. It was directed explicitly, with its content and its source
specified, and it invents no figure: the bands it states are `SDLT` in `rates.js`, the same constant
the model calculates from, and the attribution is that constant's own.

**It is a sheet on frames 29 to 32's pattern but sits under `/learn`, not `/assumptions`**, and that
split is deliberate rather than an oversight. `/assumptions/*` means "how we derived YOUR numbers" -
every screen in that family reads participant state. This one reads none. `/learn/ltv/video` already
puts a sheet in the `/learn` namespace, so the precedent existed.

Same unresolved consequences as G83: no frame number, so the three browser-driven fixtures carry it
as the string `stamp-duty` and `ROUTES.md`'s frame column carries a dash. If the Figma file gains a
frame later, its name is authoritative and this module should be reconciled to it.

*Status: open, deliberately. Recorded so the absence is a known deviation rather than a silent one.*

---

## G85. Frame 12 and the tracker use the same phrase for two different figures

*Raised 30 August 2026. Opened by `DECISIONS.md` D70; not fixed by it.*

**The defect.** `/calculator/result` (frame 12) renders `goalTrackLabelTemplate` - **"Your goal -
{target}"** - filled from `deposit-target`. Two screens later `/tracker` states the goal is
`combined-goal`. At the seeded property value a participant is told:

| Screen | What it says |
|---|---|
| 12 | Your goal - **£45,000** |
| 15/16 | of your **£52,500** goal, which includes an estimated £7,500 of stamp duty |

Neither figure is wrong for what it measures. **The phrase is wrong on one of them**, because "your
goal" now names a specific figure in this build and frame 12 is not using it.

**This is D34's failure mode**, which is why it is raised rather than left as a wording nit: one form
of words carrying different figures on different screens, where the drift is invisible on either
screen taken alone and only shows up to someone who sees both. A participant runs the calculator,
reads "Your goal - £45,000" on frame 12, taps through to the tracker and is told the goal is £52,500,
with no screen in between explaining the change. The most likely reading is that the app changed its
mind.

**Why it was not fixed in the pass that found it.** It was found while tracing where stamp duty is
first introduced, in a task scoped to the tracker's goal area and a new explainer sheet. Frame 12 is a
different screen with its own range chart, threshold rows and timing copy all sized against
`deposit-target`, and the fix is a decision about what that whole screen is about rather than a
string swap - see below.

**It is not obvious which way it should go**, which is the other reason it needs a decision rather
than a patch:

- **Relabel frame 12** ("Your deposit - £45,000"). Cheapest, and true - the screen IS about the
  deposit, and its chart plots deposit thresholds at 5/10/15%. Costs nothing elsewhere. But it leaves
  the participant meeting the combined goal for the first time on the tracker, with the step from
  £45,000 to £52,500 still unexplained at the moment it happens.
- **Show the combined goal on frame 12 too.** Consistent, and introduces the tax before the tracker
  does. But frame 12's chart, its `thresholdLabelTemplate` rows and its timing copy are all sized
  against `deposit-target`, so either they move with it - which is a much larger change, and wrong
  for the threshold rows, since those are genuinely about deposit percentages - or the screen shows
  two goals and has to distinguish them.

**Resolve before participant sessions.** A participant who notices the change and asks about it is
the good case; one who does not notice and simply loses confidence in the figures is the bad one, and
this prototype is an instrument for measuring exactly that kind of confidence.

*Status: **closed** 30 August 2026 by `DECISIONS.md` D72, which took the first of the two options
above. Frame 12 leads with the deposit for the chosen percentage; the phrase "Your goal - {target}"
is deleted rather than reworded, along with the range figure it labelled. The goal appears on the
screen under "What you would save toward", carrying `combined-goal` - the same key and therefore the
same figure `/tracker` states. D72 records the phrase-by-phrase check confirming no wording renders
on both screens against different figures.*

---

## G86. Two screens still name the checkpoint, and the participant can no longer see it

*Raised 30 August 2026. `DECISIONS.md` D51's second amendment. Copy only - the checkpoint itself is
unchanged and still live in the model.*

The progress bar's 75% marker and its "Checkpoint" label are gone. The checkpoint still decides which
tracker variant renders and what the Mortgage in Principle flow returns, but **nothing on any screen
draws it any more**. Two pieces of participant-facing copy still refer to it, and both now arrive
without an antecedent.

### 1. Frame 16, `/tracker` `checkpointReachedBodyTemplate`

> "You've passed the {pct} checkpoint. You can now check whether a Mortgage in Principle is likely to
> be approved."

Rendered as "You've passed the 75% checkpoint." A participant crossing that line is congratulated on
passing a threshold **they were never shown**. Before the marker was removed, the bar had been
carrying it since the goal was set, so the sentence landed on something already on screen.

It is not false - they have passed it - but it announces a milestone the interface never established,
which is the weaker half of the same problem D42 was written about.

### 2. Frame 17, `/mip` `body`

> "You've saved three quarters of your deposit, so this is now open to you."

Same antecedent problem, **and a second, separate defect that predates this change**: the sentence is
now arithmetically wrong.

D70 moved the checkpoint to 0.75 x `combined-goal`. At the seeded figures the checkpoint is £39,375
and the deposit is £45,000, so a participant at the checkpoint has saved **87.5% of their deposit**,
not three quarters of it. Three quarters of the deposit is £33,750, which is £5,625 below the point
this sentence claims to describe.

**This one is a factual error in participant-facing copy, not a comprehension risk.** It was
introduced by D70 and missed there.

### Why neither was fixed here

The task that removed the marker scoped itself to presentation and said explicitly not to change the
checkpoint's value, the variant it triggers, or anything in the Mortgage in Principle flow. Frame 17
is in that flow. Frame 16's line is a copy decision that depends on what replaces it - a rewording, a
different milestone, or restoring some visible antecedent - and that is a design question rather than
a correction.

### What resolving it needs

- **Frame 17's arithmetic is the urgent half** and should be fixed before any participant session.
  The narrowest correct fix is to stop describing the threshold as a share of the deposit, since it
  is a share of the goal: it could name the goal instead, or drop the fraction and state the fact
  ("you have saved enough for this to be worth checking").
- **Frame 16's line** needs a decision about whether the checkpoint should be visible anywhere. If it
  should not, the sentence should stop naming a threshold and say what is now true instead. If it
  should, the bar is not the place - D51's second amendment and D71 both record why.

**Do not read the removal as the concept having gone.** `CHECKPOINT_FRACTION`, `checkpointAmount()`
and `gapToCheckpoint()` are all live, the skip-ahead control still lands on the checkpoint exactly,
and `/mip/running` still branches on it.

*Status: **half closed** 30 August 2026. `DECISIONS.md` D51's third amendment resolved the frame 16
half: `checkpointReachedBodyTemplate` was moved into the Mortgage in Principle milestone row and
rewritten as `mipRowCheckpointReached`, which names no figure at all. It also removed the last
reference to 75% anywhere on screen - `CHECKPOINT_FRACTION` is no longer imported by `tracker.js`.*

***Frame 17 remains open, and it is the half that matters.*** `/mip`'s `body` still reads "You've
saved three quarters of your deposit, so this is now open to you.", which is arithmetically wrong -
at the checkpoint a participant has saved 87.5% of their deposit - and now also asserts a gate D51
removed. It is untouched because it is inside the Mortgage in Principle flow, which both tasks that
came near it were scoped out of. **Fix before participant sessions.***

---

## G87. A typed deposit percentage outside the chip set has no row of its own on frame 12

*Raised 30 August 2026. `DECISIONS.md` D72's amendment.*

Frame 12's comparison shows three percentages windowed on the participant's selection. The window is
`neighbourPcts()` in `rates.js`, which finds the selection in `DEPOSIT_PCT_OPTIONS` and takes its
neighbours, and the selected row is marked by **exact match**.

**Frame 11's deposit-%age field accepts any whole number from 5 to 25**, not only the five chip
values (`ROUTES.md`'s field table, D62). So a participant can commit **12%**, and then:

- `neighbourPcts(0.12)` windows around the nearest option and returns 5/10/15
- none of the three matches 12%, so **no row is highlighted and none says "your choice"**
- the participant's own percentage is not represented on a screen whose headline states it

The headline and the goal block above are still correct - they read `deposit-target` directly, so
they say £54,000 and a 12% basis. It is only the comparison that cannot show it.

**This is not new, and the window made it narrower rather than causing it.** Before the window the
screen listed all five chip values, so a typed 12% was equally unrepresented - it simply sat among
five rows instead of three, and none of those was highlighted either.

**Why it was not fixed with the window.** Inserting the typed value as a sixth (or fourth) row changes
what the comparison *is*: today it compares the options the calculator offers, and every row is a
percentage the participant could select on frame 09. A row at 12% would be a percentage no control
offers, sitting in a list whose other entries are all selectable. That is a design question about
whether the comparison represents the offered set or the participant's actual figure, and it wants
answering rather than assuming.

**Options, none chosen:**

- Show the typed value as a fourth row, marked as theirs, and accept that one row of the comparison
  is not a chip.
- Snap the comparison to the nearest chip and say so, which means telling the participant their 12%
  is being compared as 10% - honest but likely to confuse.
- Constrain frame 11's field to the chip set, which closes this but removes a freedom D62 gave
  deliberately.

*Status: open. Low frequency - it needs a participant to reach frame 11 and type a non-chip value -
but the failure is silent, and a facilitator seeing an unhighlighted comparison should know why.*

---

## G88. Frame 21 says "your deposit goal" for a figure that includes stamp duty

*Raised 30 August 2026. Found during D51's third amendment; not caused by it.*

`/mip/result/not-yet`'s `gapProvenanceCaption` reads:

> "Worked out from your deposit goal and what you have saved so far"

It captions the `gap` figure, and `gap()` has been `combined-goal - saved-toward-deposit` since D70.
So it is worked out from the goal **including stamp duty**, not from the deposit goal. Same class of
error as `goalMetBody`, which D51's third amendment corrected on the tracker; this one is on a
different screen and was missed at the time.

**The caption directly beneath it must NOT change**, and that is the trap here.
`lenderOfferCaption` reads "Worked out from the property value you set and your deposit goal", and it
captions `borrowRange.high`, which derives from `loan-amount` - property value less
**`deposit-target`**. That one is correct as written. The two captions sit adjacent on the same
screen, one needing "goal" and one needing "deposit goal", which is D70's split working exactly as
intended.

Not fixed because frame 21 is inside the Mortgage in Principle flow, which the tasks that came near
it were scoped out of.

*Status: **closed** 30 August 2026. `gapProvenanceCaption` now reads "Worked out from your goal,
including stamp duty, and what you have saved so far" - it names the goal rather than the deposit
goal, and the "including stamp duty" clause is what distinguishes it from the caption four rows
below. `lenderOfferCaption` is unchanged and still says "your deposit goal", correctly: it captions a
borrowing figure sized against `deposit-target`. A comment above the pair in `content.js` records why
a consistency sweep across the two would break the second one.*

---

## G89. Frame 12's chart range chips sit below the fold

*Raised 30 August 2026. `DECISIONS.md` D73. **A known cost, not a defect.***

The growth chart's range chips are the first thing a participant must find to use the control at all,
and they are not visible on arrival:

| | Chips at | Visible viewport |
|---|---|---|
| Default text | 837px | 732px |
| Large text | 1006px | 732px |

The chart itself was already below the fold before the chips existed (795px and 930px for its
heading), so this is not a regression the control introduced - it is a position the control inherits.

**It was not solved by moving things.** The chips belong under the heading of the thing they control;
above it they would be a chart control appearing before the chart. Reordering the screen to lift the
chart would mean demoting the comparison card, which is the block D72 made the subject of the screen.
Neither trade is worth making on a guess.

**What would settle it is a session.** If participants scroll to the chart at all, the chips are
directly above it and hard to miss. If they never reach the chart, the chips are the least of what is
being missed, and the question becomes whether the chart earns its position rather than whether the
chips do.

**Amended 30 August 2026 (D73's amendment): the chips moved below the chart and are therefore further
down, not nearer.** The substance is unchanged - they were below the fold above the chart and still
are beneath it - and so is the reasoning: a control belongs with the thing it changes, and the
alternative is demoting the comparison card D72 made the subject of the screen.

*Status: open, deliberately unresolved. Watch for it in testing rather than pre-empting it.*

---

## G90. The growth chart's legend swatches were identical, and carried no information

*Raised and **closed** 30 August 2026. `DECISIONS.md` D73. Recorded separately because it shipped, was
live on the build, and had nothing to do with the work that found it.*

`growthChartHTML` rendered both legend rows as `<span class="growth-chart__swatch"></span>` - one
class, one background, **no modifier**. So the legend showed two identical dark squares beside "At
£310 a month" and "At £200 a month", and nothing connected either row to either bar.

This is worse than a contrast failure. The bars at least differed by opacity, so a sighted participant
could see two bands and guess the order; the legend gave them no way to check the guess. A legend that
distinguishes nothing is not a weak legend - it is decoration in the shape of a key.

**How it survived.** Nothing tests it. `overlap.test.mjs` asserts nothing crosses text, which two
identical squares satisfy; `action-bar.test.mjs` never looks at the chart. It was found by measuring
the bar colours for a different reason and reading the markup that renders them.

*Status: closed. Both swatches now carry a modifier matching the band they name, taking its fill
directly - `--color-label` for the lower, `--color-border-control` for the upper. Fixed first
alongside D73's hatch and then again when D73's amendment replaced the hatch with a measured grey
pair; the swatches follow the bands either way. It was a defect in its own right and would have needed
fixing whether or not the range control was ever built.*

---

## G91. `inline-edit.test.mjs`'s "an edited value reaches the result screen" fails intermittently in a full-file run

*Raised 30 August 2026. `DECISIONS.md` D76. **A harness defect, not an app defect**, and the evidence
for that is below.*

**It is not the app.** The exact sequence the test performs - open frame 11, type 400000 into the
property field, wait for the commit, press "Work it out" - was driven four times in isolation and
navigated to `/calculator/result` **4 times out of 4**, with the field, the state, the cleared flag
and the button's disabled state all correct at every step.

**It is not the timing, any more.** The `waitForTimeout(50)` that made it load-sensitive is gone,
replaced by a condition on the re-render actually having happened. That removed one cause and left
this one.

**It is not the new tests added in D76.** With those removed the file still fails 3 runs in 4.

**What it looks like when it fails.** The result screen assertion reports frame 11 with **every field
empty** - the state the test above it leaves behind, which clears each field in turn to prove a
cleared field disables the button. With the fields empty the button is disabled and the click is a
no-op, so the screen never changes.

**Which should be impossible**, and that is the unresolved part. `beforeEach` closes the previous
browser context and opens a fresh one per test, and the seed is written on init when
`sessionStorage` is empty - so each test should start from the shared seed with every field
populated. Something is carrying the cleared state across that boundary and it has not been proven
what. Three hypotheses were tried and each was wrong: shared page state (there is none - the context
is fresh), a same-document navigation defeating the re-seed (forcing a reload did not fix it), and
the newly added tests (removing them did not fix it).

**Why it is recorded rather than fixed.** The next step is instrumenting `beforeEach` itself, and
guessing a fourth time is what this entry exists to stop. It has been carried for a dozen sessions
described as a stale assertion, which it is not.

### The fourth investigation, scoped but not started

The three eliminated hypotheses all assumed state was crossing a boundary. The next one asks whether
the boundary is reached at all: **instrument `beforeEach` rather than the test.**

Concretely, log for every test - not only the failing one - (i) whether the init script found
`sessionStorage` empty and therefore seeded, (ii) the stored state immediately after its `goto`
resolves, and (iii) the five field values at the moment `beforeEach` returns. Then run the file until
it fails and read the log for the test that failed and the one before it.

**The hypothesis it would test first** is that `beforeEach` is returning early rather than that state
is leaking. It waits on `.review-rows-stack`, which is present on frame 11 whether or not the fields
hold figures - so a `beforeEach` that resolves against a partly-settled screen would hand the test
exactly what the failure shows: the right screen with empty fields. That would also explain the load
dependence, which a storage-isolation fault would not: contexts do not become less isolated when the
machine is busy.

If that is it, the fix is one line - wait on a field holding its seeded value rather than on the
container existing - and it is the same class of error as D76's `waitForTimeout(50)`, one layer up.

**Cost.** Roughly half an hour: the instrumentation is a few lines, but the file takes about 90
seconds a run and the failure needs catching two or three times to be sure the log shows a pattern
rather than one bad run. Call it four to eight runs plus the reading, then a one-line fix and three
confirming runs.

### The test is skipped deliberately, and the skip says so

`test('an edited value reaches the result screen', { skip: '...' })`, and the reason string names this
entry so the line cannot be read as a passing test or as one more stale assertion.

**Skipped rather than left red on purpose.** A red line in a suite everybody runs before a session is
how this file's three genuine stale assertions survived a dozen sessions being described as something
they were not: people learn to scroll past the failure, and the next real one hides behind it. A skip
carrying its reason is legible; a permanent failure is noise.

**Nothing is left uncovered by the skip.** What this test was accidentally guarding - that a committed
edit survives into the result screen - is asserted deterministically by the five
"navigates on the first press" tests at the foot of the same file (D76). Those drive the interaction a
participant actually performs, typing and then pressing with no intervening tap, and they pass on
every run. The skipped test asserted the same reachability through a sequence no participant follows.

**Deferred until after sessions, and the reasoning is a cost one rather than a shrug.** The
investigation above is scoped and costed at roughly half an hour. Nothing participant-facing depends
on it: the identical sequence passes 4 of 4 in isolation with the field, the state, the cleared flag
and the button's disabled state all correct at every step, so the fault is in this file's own
isolation and not in the app. Sessions are the constraint on the calendar; this is not.

*Status: **open, skipped**. It fails roughly 3 runs in 4 in a full-file run and passes cleanly in
isolation. Do not describe it as a stale assertion - the three genuine stale assertions in this file
were fixed in D76 and this is not one of them. Un-skip it when the fourth investigation runs.*

---

## G92. Nudging the low slider handle silently rewrites the high figure the participant set

*Raised 30 August 2026, in the pass that reported on G64. **Not an amendment to G64** - G64 is about a
figure being produced without a bound; this is about a second figure being destroyed while the
participant looks at the first. **Not G74 either**, and the difference is the whole point of a separate
entry: G74 is a value the participant just typed snapping to a bound in the field they typed it in,
visible immediately and landing on a bound they set themselves. This is a field they did not touch,
changing to a figure they were never shown, on a screen that then reports the problem solved.*

### The mechanism

`calculator-saving.js`'s slider path draws four controls over one pair of figures: two
`input[type=range]` and two `input[type=number]`, all four carrying `max="${savingCeiling}"`. **The two
kinds of input honour `max` differently, and nothing in the screen accounts for that.**

- `input[type=range]` **clamps its DOM value to `max`**. Written `value="1861.22"` against
  `max="640"`, `rangeHigh.value` reads `"640"`.
- `input[type=number]` treats `max` as **validation only** and does not clamp. The same figure written
  to `figureHigh` leaves `figureHigh.value` reading `"1861"`, which is what the participant reads.

So after a ceiling breach the screen holds the participant's figure in one control and the ceiling in
the other. The low handle's `change` handler then reads across:

    rangeLow.addEventListener('change', () => {
      commit(clamp(Number(rangeLow.value), 0, Number(rangeHigh.value)), Number(rangeHigh.value));
    });

`Number(rangeHigh.value)` is the **clamped ceiling**, not the committed high. The handler commits it as
though the participant had moved that handle too.

### What it does, driven in a browser

Reached by G64's own path: target-date mode, a date requiring more than `left-over`, Continue, back to
step 2, switch to "Set a monthly amount". Session at `left-over` £640, holding `savings-rate`
£1,692.02 with a £1,522.82-£1,861.22 range.

Nudging **only the low handle** to £300 committed:

- `monthly-low` £300 - asked for
- `monthly-high` **£1,861.22 -> £640** - not asked for, on a control the participant did not touch, and
  with no affordance saying anything had been replaced

**And the banner then cleared.** `monthlyHigh.value > savingCeiling` is false at £640, so
`errorExceedsLeftOver` stopped rendering and Continue re-enabled. The screen reported the problem
solved, having solved it by discarding the participant's figure.

### The store consequence

`savings-rate` is written by Continue, not by `commit()`, so it was left standing at **£1,692.02 while
the range beneath it read £300 to £640** - a midpoint of £470. The store held a state no screen
expects, and `formatCurrency` renders every part of it without complaint. This is the class of defect
`CLAUDE.md`'s state rules name and that D46 and D38's third amendment were each written for.

### It is a D46 breach on its own terms

D46's rule is that a value the participant set is not silently replaced, and that a discarded value
must be visible to them. Both halves fail here. It is **independent of which ceiling option is chosen
for G64**: the collateral read across two controls with different clamping behaviour is in the slider
path itself, and would still be there if the date path never produced an out-of-range figure at all.

### D80 makes this UNREACHABLE, not fixed

Bounding the date path (G64) removes the only route by which `monthly-high` can be above the ceiling
while the screen is drawn, so the divergence between the two controls' values never arises and the
handler never reads the wrong number. **The handler is unchanged, and it is still wrong.**

That distinction is worth stating plainly, because this file already records what happens when it is
not. G64's 29 August amendment: D57's re-seeding moved the seeded date's range inside the new £640
ceiling, so G64 stopped reproducing on the screen's own default - "**this makes the gap harder to
find, not smaller**". The same is now true here, and one step further removed: after D80 there is no
participant-reachable route to it at all, so nothing will surface it again. If a later change gives
`monthly-high` another way past the ceiling - a new entry point, a relaxed bound, a general mode - this
returns with no warning and no test naming it.

*Status: **open, unreachable**. **Do not close it on the strength of D80.** Closing it means making
the two control kinds agree - reading the committed figures rather than the DOM values, or clamping
both kinds the same way - so that the handler cannot read a number the participant never set.*

---

## G93. The slider's fill has no upper bound, so an out-of-range range scrolls the screen sideways

*Raised 30 August 2026, measured in the pass that reported on G64, and recorded in `DECISIONS.md` D80's
footnote rather than here. Moved to this file for G92's reason: **a decision record is where a decision
lives, not where a live defect lives.** Promoted on instruction, 30 August 2026.*

### The mechanism

`calculator-saving.js` positions the filled section of the monthly-saving track from the two figures
directly, as percentages of the ceiling:

    const fillLeft = (monthlyLow.value / savingCeiling) * 100;
    const fillRight = (monthlyHigh.value / savingCeiling) * 100;

written straight into `style.left` and `style.width`. **Neither is clamped.** Both are correct for any
figure at or under `savingCeiling` and unbounded above it - the calculation has no `Math.min`, no
`clamp`, and no awareness that a figure above the ceiling is possible at all.

Nothing downstream catches it either. `.value-slider__track` is `position: relative` with **no
`overflow: hidden`**, so the fill is laid out where the percentages put it rather than clipped at the
track's edge.

This is the one part of the control that does not clamp. Both `input[type=range]` clamp their DOM
value to `max` (which is its own problem - G92), and the number inputs at least hold a figure a
participant can read (G94). The fill just leaves the box.

### The measured figures

Driven in a browser at `left-over` £640, holding a £1,522.82-£1,861.22 range:

| | |
| --- | --- |
| Computed style | `left: 237.941%; width: 52.876%` |
| Track | 350px wide, starting at x=20 |
| Fill | starts at x=852.78, **483px past the right edge of its own track** |
| `.screen-content` `scrollWidth` | **1,038px** against a 390px viewport |

### It is horizontal overflow inside a screen

`CLAUDE.md`'s design rules: "All text must fit via auto layout. **Nothing truncates or overflows.**"
A `.screen-content` whose scroll width is nearly three times the viewport is exactly that, and it is
the kind that is worst to meet in a session - the participant's thumb finds a sideways scroll on a
screen that has no sideways content, with the thing causing it drawn far off to the right where they
cannot see it.

**Nothing existing covers it.** Checked rather than assumed:

- **G27** is the 393x852 device frame overflowing a 1366x768 laptop viewport. Resolved; the framed
  view scales to fit.
- **G32** is the page behind the device frame scrolling, and the frame outgrowing its bezel. Resolved
  under D14.

Both are about the SHELL - the mock phone and the page it sits on. Neither is about a screen's own
content overflowing its own viewport, and there is no third entry that is.

**Nothing tests it either**, which is worth stating beside D77's finding. `overlap.test.mjs` detects a
rule crossing text and a box squashed below its content; a fill drawn 483px to the right of everything
satisfies both perfectly. `action-bar.test.mjs` measures vertical clearance. The screen renders, so
`smoke.test.mjs` passes. This was found by reading a computed style, not by a suite.

### Unreachable after D80, not fixed

The date path was the only participant-reachable route to a range above the ceiling: the slider path
clamps every commit through `clamp(..., savingCeiling)` and the seed falls back to
`Math.min(seed, ceiling)`. D80 bounded the date path, so `monthly-high` can no longer be above the
ceiling while this screen is drawn, and the percentages can no longer exceed 100.

**The code is unchanged.** `fillLeft` and `fillRight` are computed exactly as they were, with no
bound; `.value-slider__track` still declares no `overflow: hidden`. Nothing about this defect was
repaired - the input that triggers it was removed.

*Status: **open, unreachable**. **Do not close it on the strength of D80.** G64's own 29 August
amendment is the standing precedent: D57's re-seeding moved the seeded range inside the new ceiling,
G64 stopped reproducing on the screen's own default, and "**this makes the gap harder to find, not
smaller**" - nothing surfaced it again until it was looked for deliberately. This is the same, one
step further removed. Closing it means clamping the two percentages, or clipping the track, or both -
so that no figure the screen can hold puts the fill outside its own box.*

---

## G94. The slider's number inputs carry `max` and hold values above it

*Raised 30 August 2026 in the same measurement as G93, and recorded in `DECISIONS.md` D80's footnote
rather than here. Promoted on instruction, 30 August 2026. **It is the other half of G92's mechanism,
stated as a defect in its own right**: G92 is what the divergence between the two input kinds DOES to a
committed figure, this is the divergence itself.*

### The mechanism

`calculator-saving.js` renders the two figure readouts as
`<input type="number" ... max="${savingCeiling}">`. **`max` on a number input is validation, not a
bound.** It sets `validity.rangeOverflow` and it fails constraint validation; it does not clamp the
value, and this screen never calls `checkValidity()`, never styles `:invalid`, and never reads
`validity`. So the attribute is present, is honoured by nothing, and is doing no work.

Measured at `left-over` £640, holding a £1,522.82-£1,861.22 range: both inputs carry `max="640"` and
read `1523` and `1861`. Those are the figures the participant sees, because the number inputs are the
readout - the range inputs beside them are the handles.

### Neither G64 nor G74 covers it

Checked rather than assumed, because both are adjacent and neither fits:

- **G64** names `max` on the inputs, but as EVIDENCE that the slider path is bounded - "Both range
  inputs carry `max="${savingCeiling}"`, every `commit()` re-clamps through `clamp(...,
  savingCeiling)`" - in the course of showing that the date path had nothing equivalent. It cites the
  attribute as a bound that works. It is not one on the number inputs, and G64 does not say so.
- **G74** is the opposite behaviour. There, a typed value SNAPS to a bound and the field re-renders
  holding a number the participant did not type - a clamp that is too silent. Here the field holds a
  number well past its own stated maximum and nothing happens at all. A defect about over-clamping
  cannot also record one about not clamping.

### Unreachable after D80, not fixed

As G93: the date path was the only route by which a figure above the ceiling could reach these
inputs, and D80 bounded it. Every remaining writer on the slider path clamps.

**The code is unchanged.** The inputs still carry `max`, still treat it as validation only, and the
screen still never reads that validation. The attribute is as inert as it was.

*Status: **open, unreachable**. **Do not close it on the strength of D80**, for G64's 29 August
amendment's reason. Closing it means deciding what `max` is for on these two fields: either the screen
reads the validity it already sets, or the fields clamp the way the range inputs do, or the attribute
comes off and the bound is stated somewhere that enforces it. Leaving an attribute that looks like a
bound and is not is the part that misleads - it is what made G64 read as though the slider path were
fully bounded.*

---

## G95. The MCOB risk warning's icon is invisible in the dark palette, on eight screens

*Raised 30 August 2026 in D79's icon audit, which found thirteen contexts inheriting `--color-label`
from `body`. Twelve stay recorded in D79. **This one is promoted because it is not only a contrast
failure**, and the difference is regulatory rather than technical. Promoted on instruction, 30 August
2026.*

### The measurement

`.risk-warning-card__icon` declares no colour. Every icon in this build is stroked in `currentColor`,
so it takes the computed colour of the nearest ancestor that declares one - and that ancestor is
`body`, whose `color: var(--color-label)` sits OUTSIDE `.screen`, where `.theme-dark` applies its
palette. The property resolves to the light value there and the glyph inherits the literal `#17171c`.

The card's own background is `--color-surface`, `#1c1c1e` in the dark palette.

| | |
| --- | --- |
| Icon | `exclamationTriangle`, `#17171c` |
| Ground | `--color-surface`, `#1c1c1e` |
| Ratio | **1.05:1**, against WCAG 1.4.11's 3:1 for non-text content |

The card's TEXT is unaffected - `.risk-warning-card__text` declares `color: var(--color-label)` itself,
inside `.screen`, so it resolves white and reads correctly. The warning triangle beside it does not
appear at all.

### The eight screens

Every `riskWarningHTML` call site:

| Frame | Route | What it warns |
| --- | --- | --- |
| 13 | `/learn/ltv` | rate caution, and the MCOB 3A repossession warning |
| 15 / 16 | `/tracker` | rate caution, and the MCOB 3A repossession warning |
| 18 | `/mip/about` | an agreement in principle is not an offer |
| 19 | `/mip/pre-check` | the soft search, and the MCOB 3A repossession warning |
| 20 | `/mip/result/likely` | MCOB 3A, and not an offer |
| 21 | `/mip/result/not-yet` | MCOB 3A, and not an offer |
| 30 | `/assumptions/deposit` | MCOB 3A, and rate variability |
| 31 | `/assumptions/borrowing` | MCOB 3A, and the borrowing estimate's limits |

Seven of the eight carry `shared.regulatory.mcob3aRepossessionWarning`, which `CLAUDE.md` marks as
fixed wording that may not be reworded, shortened or removed from a screen that carries it.

### The same glyph and the same mechanism already fixed twice

This is not a new class of defect. It is the third instance of one:

- **D78** gave the ERROR banner this exact glyph and coloured it `--color-warning`, because the icon
  was inheriting `--color-label` and drawing at 1.05:1 on `#1c1c1e`.
- **D79** gave the INFORMATIONAL banner's `infoCircle` an explicit `--color-label`, for the same
  inherited-token reason, taking it from 1.18:1 to 21.00:1.
- This card is the same `exclamationTriangle` on the same ground at the same ratio, and its context
  class declares no colour either.

### Why it is its own entry and not a row in D79's list

The other twelve are WCAG 1.4.11 failures on non-text content - chevrons, tick marks, milestone stars,
a media placeholder. Each matters; none of them is the only marker on a regulatory warning.

**This one is a risk warning the participant cannot see.** The triangle is what marks the card as a
warning at a glance, before the text is read - and on seven of these eight screens the text it marks is
the MCOB 3A repossession warning. A warning that does not read as a warning is a **Consumer Duty
consumer understanding** problem: the outcome requires that communications support informed decisions
and are likely to be understood, and a regulatory warning stripped of the one visual cue that
identifies it as one does not meet that. That is the dimension the other twelve do not have, and it is
why this is a gap of its own rather than a row in a table.

D79 keeps the other twelve. They are not being promoted and this entry does not supersede that list.

### The dark palette is not currently selectable, and that is not the point

Frame 33 offers Greyscale and Brand only; no Dark option is drawn anywhere in the reference set, so the
`.theme-dark` palette is defined but unreachable (`tokens.css`). **No participant can meet this in a
session.**

That is why it is **not urgent**. It is not why it is not a gap. The palette is defined and its
contrast measured deliberately so those measurements are not lost, and a token left resolving outside
its own theme ships the moment the palette becomes selectable - which is the same reasoning D79 used to
justify fixing the informational banner while it was equally unreachable.

**Not fixed here, on instruction.** The code is unchanged: `.risk-warning-card__icon` still declares
`flex: 0 0 auto` and nothing else.

*Status: **open, unreachable in the current build**. **Do not close it on the strength of the palette
being unselectable**, and do not close it on D80 - D80 has nothing to do with it. Closing it means one
declaration, `color: var(--color-warning)` or `var(--color-label)` depending on whether the card is
meant to read as neutral (its component note says neutral, so `--color-label` matches its own text) -
the same one-line fix D78 and D79 each made. Decide it with the other twelve in D79, or ahead of them
because of the regulatory dimension above.*

---

## G96. Frame 10b's ceiling error is below the fold on first paint, so a disabled Continue has no visible explanation

> **30 AUGUST 2026: THE FRAME 10b CASE IS CLOSED - `DECISIONS.md` D82, and again under D83. THE ENTRY
> STAYS OPEN FOR FRAMES 10 AND 11.** D82 bounded the date stepper at the earliest reachable date, so the
> banner measured below cannot be raised at all: a banner that cannot exist cannot fall below the fold.
> D83 then replaced the steppers with dropdowns floored at the same date, which closes it a second and
> stronger time - the floor is now the list's first entry, so the impossible date is not merely refused
> but never offered. **The layout was not fixed either time** - the space above the dock is unchanged
> and the readout still sits where it did. That distinction is the same one G92 to G95 carry, and it
> matters for the same reason: if the floor is ever removed the measurement below is true again,
> unchanged.
>
> D83 did put a banner on this screen - `dateMovedToEarliest`, above the dropdowns - and its placement
> was measured against this entry's finding rather than guessed: it is fully visible at both text sizes,
> and sits 116px (default) / 122px (Large) higher than it would below the control.
>
> The two other screens this entry records are **untouched by D82 and remain open** - frame 10's slider
> ceiling error, cut 14px at Large, and frame 11's third stacked banner, cut 110px and 200px. Frame 11's
> is the worst measured anywhere in the build and never had anything to do with D80's readout. **Do not
> close this entry on D82.**
>
> D82 also removed the case for its own screen in the strongest available way, and that is worth naming
> for whoever fixes the other two: the best fix for an error below the fold turned out to be not needing
> the error. It is not available on frames 10 and 11, where the errors are raised by figures the
> participant types rather than by a control that can be bounded.

*Raised 30 August 2026. Measured during D81's copy pass and recorded there as a measurement of that
change rather than as the record of a defect; opened here on instruction. **The first of G92 to G96
that is REACHABLE.** G92, G93 and G94 need a state the build can no longer produce, and G95 needs a
palette frame 33 does not offer. This one happens on first paint, in the shipped build, at a text size
frame 33 does offer.*

### The measurement

`/calculator/saving` in target-date mode (`solveFor: 'amount'`), at a date requiring more than
`left-over`. 390x844 viewport, first paint, before any scroll:

| Text size | Banner top | Banner height | Banner bottom | Dock top | **Cut by** |
| --- | --- | --- | --- | --- | --- |
| Default | 575px | 114px (4 lines) | 689px | 651px | **38px** |
| Large | 606px | 152px (5 lines) | 758px | 651px | **107px** |

Both figures are FIRST-PAINT positions with `scrollTop` at 0. They are also where a participant who
steps the date into the error lands, and that is not a separate case: `rerenderInPlace` preserves
`scrollTop` across a re-render on purpose (so a field commit does not jump the screen under the
participant's fingers), so a banner raised by a stepper press appears below the fold and the screen
does not move to it. Nothing anywhere in this build scrolls to a raised banner - the only two scroll
writes in `src/` are that preservation.

Geometry is identical in both palettes; the dark palette changes no size.

### What is between the stepper and the banner, and what put it there

Measured, so the space is accounted for rather than guessed at:

| Block | Default | Large |
| --- | --- | --- |
| Date stepper (including its hint) | top 299px, height 178px | top 311px, height 187px |
| stack gap | 16px | 16px |
| **Solved-amount readout** (figure + caption) | top 493px, height 66px | top 514px, height 75px |
| stack gap | 16px | 16px |
| Ceiling banner | top 575px | top 606px |

There is nothing else between them. **The readout and its two gaps are 98px of that space at default
text and 107px at Large** - and 107px is exactly the amount by which the banner is cut at Large.

**D80's readout is what pushed the banner down, and it is load-bearing.** Say it plainly here so that
whoever fixes this does not reach for it first: that readout is what closed **G65**. Before it, frame
10b solved a monthly amount from the chosen date, read it in exactly one place - the Continue handler -
and showed the participant nothing until frame 11. An error saying "not this date" above a figure the
participant cannot see is what G64 and G65 were closed together to avoid. **The readout is not a
candidate for removal.**

**And removing it would not buy enough anyway.** Subtracting its 98px / 107px footprint from the
measured positions puts the banner's bottom at 591px (default, 60px of headroom) and **651px at Large -
flush with the dock, zero headroom.** So even with the readout gone, the banner at Large text only just
fits. The copy is five lines at Large; the space above the dock is what it is. This is a layout
problem, not a readout problem and not a copy-length problem.

### Why the two mitigations do not settle it

Both are real and neither closes this:

- **It reads in full once the screen is scrolled.** True - the banner is not clipped, truncated or
  overflowing; `.screen-content` scrolls and the whole thing is legible about a thumb-flick down. That
  makes it a first-paint problem rather than a permanent one, which is a smaller defect than truncation
  would be. It is not smaller in the case below, because the case below is about the moment before the
  participant knows there is anything to scroll to.
- **`role="alert"` announces it regardless (D78).** True, and it is why this is not an accessibility
  failure: a participant using a screen reader is told the error the moment it is raised. That covers
  the participant who is NOT looking at the screen. It does nothing for the participant who is.

### The research consequence, which is why this is urgent rather than filed

This is an instrument for moderated think-aloud usability sessions, and this defect damages the
instrument rather than only the experience.

**What the participant does:** presses Continue. Nothing happens. The button is grey. The sentence
explaining why is off the bottom of the screen.

**What that looks like on the recording:** a participant who pressed a disabled control, paused, and
did not say why - which is *indistinguishable from* a participant who read the constraint and did not
understand it. Those are two completely different findings. One is a layout defect in the prototype;
the other is a comprehension failure in the copy, and the copy is what several of these sessions exist
to test. **The data cannot be told apart after the fact**, and a moderator prompt ("what do you think
is happening there?") changes the participant's behaviour at exactly the moment being measured.

That is the difference between this and a defect that merely degrades the experience: **it contaminates
the data**. A finding drawn from a contaminated trial is worse than a missing one, because it is
counted - which is D77's finding about tests, applied to sessions.

**107px at Large is the worse case, for the obvious reason.** A participant who has set the text size
to Large has already told the study they need larger text. They meet a *larger* blank space where the
explanation should be, and they are the participant least able to spot a partially-visible line at the
screen's edge. The build's own accessibility setting makes its own error message harder to find.

### Frame 10b is not the only one

Found by sweeping every banner-raising state in the build at both text sizes, first paint. Two more
ERROR banners are cut, and neither was recorded anywhere:

| Screen | State | Default | Large |
| --- | --- | --- | --- |
| **10b** `/calculator/saving` | date above the ceiling | **cut 38px** | **cut 107px** |
| **10** `/calculator/saving` | slider above the ceiling | visible | **cut 14px** |
| **11** `/calculator/review` | all three row errors at once (the third banner) | **cut 110px** | **cut 200px** |

The other seven error states - frame 05's two, frame 09's, frame 10b's past date, and frame 11's three
rows raised singly - are fully visible at both text sizes.

**They are recorded here rather than given numbers of their own**, because they are one defect in three
places and splitting them would invite fixing one screen and calling it closed - which is the
`CLAUDE.md` rule that a correction applies everywhere the pattern appears. Frame 11's case is the worst
measured anywhere in the build (200px at Large) and has nothing to do with D80: it is simply three
banners stacked in one column. Split them into their own entries if the fix turns out to be per-screen
rather than shared.

*Informational banners were swept in the same pass and are deliberately excluded.* Eight routes carry
an `.info-banner` below the fold on first paint, at cuts from 203px to 1,442px. That is ordinary
long-screen content - an informational banner blocks nothing and explains no disabled control - and
treating it as the same defect would bury the three above in a list of eleven.

### G89 is the same shape, and it is open

`GAPS.md` **G89, "Frame 12's chart range chips sit below the fold" - open, deliberately unresolved.**
Nothing fixed it, so there is no fix to borrow. Its status line reads "watch for it in testing rather
than pre-empting it", and D73's amendment moved the chips further down rather than nearer.

**That resolution is available to G89 and is not available here**, which is the distinction worth
carrying: G89 is a *control* the participant has to find in order to use an optional feature, on a
screen they can scroll at leisure, and the argument for leaving it was that a session would settle
whether they reach the chart at all. G96 is the *explanation of a blocked action*, and the thing it
would be watched for in testing is the thing it corrupts. "Watch for it in a session" is not a status
this one can take.

### Cross-references

- **D80** built the readout, and closed G64 and G65 together for the reason quoted above.
- **D81** measured this during the copy pass and stated explicitly that it was recording a measurement
  and not a defect. That note now points here.
- **G89** above, same shape, open.
- **D78** for `role="alert"` and the `aria-describedby` on the disabled primary.

*Status: **open for frames 10 and 11; the frame 10b case in the title is CLOSED - unreachable, not
fixed (D82, 30 August 2026).** What remains is still REACHABLE, unlike G92 to G95: frame 10's slider
ceiling error is cut 14px at Large and frame 11's third stacked banner is cut 110px and 200px, both on
first paint, in the current build, with no facilitator gesture. Do not file the remainder beside the
unreachable entries above it and do not give it G89's "watch for it in testing" resolution: what it
damages is the testing. Fixing it means one of - reserving the error's space above the dock, scrolling a
raised banner into view, or moving the banner above the figure it is about. D82's own fix, bounding the
control so the error cannot arise, is NOT available on either remaining screen: both raise their errors
from figures the participant types.*

---

## G97. The year list's horizon is this build's own figure, and the spec gives none

*Raised 30 August 2026 with `DECISIONS.md` D83. Recorded under `CLAUDE.md`'s standing rule - "Never
invent a figure, a rule or a screen. If the spec is silent or says Confirm, Gap or No frame drawn, add
it to `docs/GAPS.md` and ask." This is a figure, the spec is silent, and it was invented.*

### What was invented

`YEAR_LIST_SPAN = 20` in `calculator-saving.js`. The year dropdown offers the floor's year and the
twenty after it.

**A stepper needed no horizon and a list does.** Under D82 the year chevron was unbounded upward: a
participant could press it as far as they liked and no number anywhere said where "far enough" was. A
`<select>` has to be handed a finite set of options, so the moment the control changed, a figure that
had never existed had to be chosen.

### Why twenty, and what it is not

- Well past anything the model reports in detail. `monthsToTarget` stops projecting at 60 months and
  returns `beyond-window` after that, so every year past the fifth already renders the same way.
- Past any deposit horizon a participant in this study is likely to name out loud, without making the
  list long enough to become a scroll in a platform picker.
- **Deliberately NOT `MORTGAGE_TERM_YEARS`** (25, `rates.js`). A mortgage term is not a saving horizon,
  and borrowing one figure for the other is how two unrelated things end up moving together - the
  mistake `CLAUDE.md`'s rule about not inventing figures is the same shape as.

**The selected year is always included even if it is past the span**, so a restored session holding a
far-future date renders its own value rather than silently showing a different one. The span therefore
bounds what can be *chosen*, not what can be *displayed*.

### What it costs, and what it does not

It costs a participant who wants a target more than twenty years out, which in a deposit-saving context
is not a case this study is designed to observe. It costs nothing at the other end: the floor is
computed, not invented, and is the half of the range that matters.

### AMENDED 31 AUGUST 2026: DEMOTED FROM THE RULE TO THE FALLBACK - `DECISIONS.md` D85

D85 caps the year list at the month the balance reaches the goal unaided, which is a horizon **derived
from the model** rather than invented. For any session with something saved, that cap is what ends the
list and this constant is not consulted at all.

**It survives for one case, and cannot be removed.** With `saved-toward-deposit` at zero - a participant
who assigned no accounts to their deposit - nothing compounds from nothing, `monthsToGoalUnaided`
returns `Infinity`, and there is no crossing to cap at. That session still needs a horizon, and this is
what is left. `date-ceiling.test.mjs` asserts the fallback is reached and is 21 years of options.

**One consequence measured and worth knowing: the cap usually makes the list LONGER, not shorter.** At
the real opening balance (8,950 saved against a 28,000 goal) the crossing is 372 months out, so the year
list runs 32 years where the constant gave 21. It shortens only for participants who have saved a good
deal - at 27,000 saved the list is 2 years. Every date in the longer list is valid, which is the point,
but a session with very little saved gets a long scroll: at 1,000 saved the crossing is 1,086 months and
the list would be 90 years.

**If that is not wanted, the fix is one line** - end the list at whichever of the cap and the span comes
first. That was deliberately NOT done here, because it would make this constant a co-bound again rather
than the fallback D85 records it as. Raised so the choice is visible.

### AMENDED AGAIN 31 AUGUST 2026: PROMOTED FROM FALLBACK TO CO-BOUND - `DECISIONS.md` D87

The demotion above rested on an assumption that the measurement contradicts. **The cap is usually the
LOOSER bound, not the tighter one**, so the constant is not a rare fallback - it is what ends the list
in the common case:

| Session | Cap year | Span end | Which wins |
| --- | --- | --- | --- |
| Shared seed (saved 21,000) | 2034 | 2047 | cap |
| A real session (saved 8,950, 280k at 10%) | 2057 | 2048 | **span** |
| The same, saved 1,000 | 2117 | 2049 | **span** |
| The same, saved 25,000 | 2029 | 2047 | cap |
| Nothing saved | none | 2050 | span |

The list now ends at whichever comes first. Both bounds stay: the cap is correctness (past it the solve
is negative), the span is proportion (a ninety-year list is absurd whatever the model says).

**THIS ENTRY HAS NOW NARROWED TWICE AND THE FIGURE HAS NOT CHANGED ONCE**, which is the thing to hold on
to. Its standing has gone the rule (D83) -> the fallback (D85) -> a co-bound (D87), and at each step it
looked smaller than it is. `YEAR_LIST_SPAN = 20` is still invented, still absent from `build-spec.md`,
and still the horizon a participant actually meets on most sessions.

*Status: **open - a figure awaiting confirmation, not a defect, and doing more work than either previous
amendment implied.** Nothing is wrong with 20; it is simply not the spec's number, because the spec has
none. Confirm it, replace it, or record it as intentionally this build's own. If it is replaced, the
constant is the only place it lives.*

---

## G98. Far enough out, the date path shows a NEGATIVE monthly amount

*Raised 30 August 2026 while verifying `DECISIONS.md` D84, and not caused by it. Recorded here rather
than left in a report, which is the principle G92 to G96 were promoted on: a decision record is where a
decision lives, not where a live defect lives.*

### What is on screen

`/calculator/saving` in target-date mode, at a date far enough ahead:

> **-£39**
> Put aside each month

Reproduced in a browser on the shared seed at December 2042, which the year list offers.

### The arithmetic is right and the screen is wrong

`monthlyAmountFromDate` solves the annuity-due equation for the payment needed to reach the goal by a
given month. With £21,000 already saved at the Bank Rate against a £28,000 combined goal, compound
interest alone passes the goal at about **94 months** - so from there the "required" payment is
negative, and grows more negative the further out the date goes.

| Months out | Solved amount |
| --- | --- |
| 6 (the floor) | £1,089.87 |
| 60 | £41.77 |
| **94** | **first negative** |
| 120 | -£16.15 |
| 240 | -£44.62 |

The model is not wrong: a negative payment is the correct answer to "what must I add each month", when
the answer is "nothing, and you could take some out". **The screen is wrong**, because it renders that
answer under the caption "Put aside each month", which no participant can read as anything but an
instruction to save a negative amount.

### It is reachable, and D84's control is not what made it so

Three decisions compound into it and none of them is a defect on its own:

- **D80** rendered `previewAmount`, which closed G65 - before that the figure was never shown at all.
- **D83** replaced an unbounded year stepper with a LIST, which needed a horizon; `YEAR_LIST_SPAN = 20`
  is the invented figure that gives it one (G97).
- **D84** changed how the list is drawn and nothing about what it contains.

So the reachable range is twenty years and the sign flips at under eight. **Roughly twelve of the
twenty years the control offers produce a negative figure on this seed** - it is not an edge of the
range, it is most of it.

### It moves with the session, which is why no fixed cut-off answers it

The flip point is a function of `saved-toward-deposit`, `combined-goal` and the Bank Rate, all of which
differ per session. A participant with less saved may never reach it inside twenty years; one with more
reaches it sooner. Shortening `YEAR_LIST_SPAN` would hide it on some sessions and not others, which is
worse than either extreme.

### Not fixed here, and the options are not equivalent

This pass was scoped to the control and told explicitly to leave the floor, the horizon and the readout
alone. Sketching what closing it would mean, so the next pass does not start cold:

- **A ceiling on the date**, the mirror of the floor - stop the list where the solved amount reaches
  zero. Symmetrical with what is already there, and it removes the state rather than explaining it.
  Costs a participant a date they might have wanted, and needs the inverse solve.
- **Clamp the figure at zero and say what it means** - the goal is already reached by interest. Honest,
  keeps every date, and needs copy that stays the guidance side of MCOB 4.8A.
- **Leave it.** Not recommended: a research instrument showing "-£39 put aside each month" in a
  think-aloud session produces a participant reaction to a defect, which is data about the prototype
  rather than about the design.

---

## AMENDED 30 AUGUST 2026: MEASURED, AND IT IS NOT A DISPLAY DEFECT

*Report-only pass. Nothing was changed. The three closes sketched above are costed at the foot of this
amendment, with a recommendation.*

### The negative is COMMITTED and carried forward

This is the finding that reclassifies the entry. Driven in a browser at a date 150 months out on the
shared seed:

| | |
| --- | --- |
| Frame 10b readout | **-£28**, Continue **enabled** |
| Continue commits | `savings-rate` **-27.63**, `monthly-low` **-24.87**, `monthly-high` **-30.40** |
| D2's range invariant | **BROKEN** - `monthly-low` is GREATER than `monthly-high`. `rangeFromCentral` documents its guarantee as holding "for any central > 0", and nothing enforces the precondition |
| Frame 11 | shows "-25" and "-30" in its editable fields, raises **no error**, "Work it out" **enabled** |
| Frame 11 commits | `months-to-target` 150, `on-track-for` {low 135, high 165}, `checkpoint-amount` 21,000 |
| Frame 12 | renders, no page errors |
| The tracker | renders from those figures, no page errors |

**`monthsToTarget`'s two guards both miss it.** It rejects a savings-rate of exactly zero
(`unreachable`) and one above `left-over` (`exceeds-left-over`); a negative is neither, so it proceeds
and returns the participant's own date back to them (150 -> 150.000) flagged `beyond-window`. The model
is internally consistent throughout - it is answering a question that stopped applying, correctly, at
every step.

**Frame 12's growth chart draws inverted bands.** With `monthly-low` above `monthly-high`, the series
named "low" plots above the series named "high" at every point:

| Months | "low" band | "high" band |
| --- | --- | --- |
| 12 | £21,483 | £21,415 |
| 60 | £23,603 | £23,239 |

Both series still RISE, because interest outpaces the small negative contribution - so
`chart-range.test.mjs`, which asserts bars are "distinct and rising", **passes**. That is D77's finding
again: an assertion that holds for a reason unrelated to what it claims to test.

**One consumer is saved by accident.** Frame 21 (`mip-result-not-yet.js`) does
`savingsRate ? monthsToReachAmount(...) : Infinity`; a negative is truthy, so it calls through - and
`monthsToReachAmount`'s own `monthlyAmount <= 0` guard returns `Infinity`. Frame 21 therefore behaves
as it does for a zero rate. It is caught by a guard written for a different reason, not by anything on
this path.

**So this is a state defect, not a display defect**, and it is larger than the entry above describes.

### 1.1 The flip point has a closed form, and no function to call

`monthlyAmountFromDate` returns `pmt = ((goal - p0 x g) x r) / ((1+r)(g-1))` where `g = (1+r)^n`. That
is zero exactly when `goal = p0 x g`, so:

    flipMonths = ln(goal / p0) / ln(1 + r)

Checked against a search: closed form **93.7738**, first month whose solve is negative **94**. The solve
at 94 months is -0.18 and at 93 months is +0.62, so the two agree.

**`monthsToReachAmount` cannot supply it.** It returns `Infinity` for `monthlyAmount <= 0`, deliberately
and with a comment saying so. The flip point would need its own function; three lines, and it belongs in
`model.js` beside the equation it inverts rather than in the screen.

### 1.2 It moves with the participant, and NOT with the same inputs as the floor

| Edit | Goal | Floor | Flip | Flip shift |
| --- | --- | --- | --- | --- |
| baseline (shared seed) | 28,000 | 6 | 93.8 | - |
| saved so far 21,000 -> 15,000 | 28,000 | 11 | 203.5 | **+109.7 months** |
| saved so far 21,000 -> 26,000 | 28,000 | 2 | 24.2 | **-69.6** |
| property 280,000 -> 350,000 | 37,500 | 14 | 189.0 | **+95.2** |
| property 280,000 -> 220,000 | 22,000 | 1 | 15.2 | **-78.6** |
| deposit % 10 -> 15 | 42,000 | 17 | 225.9 | **+132.2** |
| deposit % 10 -> 5 | 14,000 | 0 | **-132.2** | -225.9 |
| **left-over 1,150 -> 400** | 28,000 | 15 | **93.8** | **0.0** |

Bank Rate sensitivity, for completeness (it is a dated constant, not a participant input): 2% -> 174
months, 3.75% -> 94, 5% -> 71.

**The last row is the structural point.** `left-over` moves the FLOOR and does not move the flip at all
- the flip is the date the balance reaches the goal with no contribution, so what the participant could
afford is irrelevant to it. The two bounds are functions of overlapping but different inputs, which is
worth knowing before either is described as "the other end of the floor".

### 1.3 It can be absent, and it can be already passed

Three regimes, all reachable:

| Saved so far | Floor | Flip | What the cap would have to do |
| --- | --- | --- | --- |
| **0** (no accounts assigned) | 24 | **Infinity** | nothing to cap - fall back to a constant |
| 1,000 | 23 | 1,086 | cap far past any list |
| 21,000 (the seed) | 6 | 93.8 | cap inside the list |
| 28,000 (= the goal) | 0 | 0.0 | floor and cap coincide |
| **30,000 (> the goal)** | 0 | **-22.5** | **cap BEFORE the floor** |

`saved-toward-deposit` of zero is not hypothetical: a participant who assigns no accounts to their
deposit on frame 03/06 has it, and then the balance never grows unaided and there is no flip point at
all.

### 2.1 Floor and cap in the same list

Options offered as the two close, taking the floor at 6 months:

| Separation | Valid dates | Year options | Month options in the floor year |
| --- | --- | --- | --- |
| 24 months | 25 | 3 | 11 |
| 12 months | 13 | 2 | 11 |
| 6 months | 7 | **1** | 7 - **both bounds in ONE year** |
| 3 months | 4 | 1 | 4 |
| 1 month | 2 | 1 | 2 |
| 0 months | **1** | 1 | **1** |

When both bounds fall in one year the year list has a single option and the month list is bounded at
BOTH ends - the pair rule D83 built handles the bottom and would need the same at the top. At zero
separation the control offers one date, which is a listbox with nothing to choose: it still works, but
"pick a target date" has stopped being a question.

### 2.2 They cannot cross while the goal is unmet - and they DO cross once it is met

**Not while the goal is ahead.** `monthsToReachAmount` is monotonically decreasing in the monthly
amount; the floor is taken at `left-over` and the flip is the same target at zero, so for any positive
`left-over` the floor is at or below the flip. Swept over `saved-toward-deposit` from 500 to 27,900 in
100s: never crossed, narrowest separation **1.09 months** at 27,900.

**But they cross the moment the goal is already met.** At saved 30,000 against a 28,000 goal the floor
is 0 and the flip is -22.5. Reachable on the shared seed by choosing a 5% deposit on frame 09: goal
14,000 against 21,000 saved. Driven in a browser - **the readout reads -£248 on arrival**, the year list
starts at the current year, and Continue is enabled.

**That is the state with no valid dates at all, and the screen has no behaviour for it.** It is not
created by a cap - it exists now - but a cap is what would surface it, because a cap earlier than the
floor is an empty list. Any close has to answer it.

### 2.3 A moved cap needs D83's pattern, mirrored

An upstream edit that moves the flip point PAST a selected date is the same shape as the one D83
already handles at the bottom: raise the deposit percentage, and a date that was fine becomes one where
the answer is trivial. `dateMovedToEarliest` moves the date to the new floor and discloses it, per D46.
The mirror would need a second flag and a second string ("we've moved your date back to..."), or one
generalised pair. It would also need the empty-list case above, since an edit can move the cap past the
floor as well as past the selection.

---

## THE THREE CLOSES, COSTED

### A. Cap the horizon at the flip point - **RECOMMENDED**

| | |
| --- | --- |
| Participant cost | Loses dates past the flip. Those are exactly the dates where the answer is "nothing", which the readout cannot express anyway |
| Build cost | One model function (the closed form above), the pair rule extended to bound the month list at the top as well as the bottom, and an answer for the empty-list case in 2.2 |
| Copy cost | **None.** It removes the state rather than explaining it |

**It is symmetrical with what is already there.** The floor declines dates that do not work; this
declines dates where the question does not apply. One rule, both ends, and the same derivation - both
are `monthsToReachAmount`-shaped answers about when the balance meets the goal, one at `left-over` and
one at zero.

**It closes the downstream defect for free**, because a date that cannot be picked cannot be committed:
the negative `savings-rate`, the inverted `monthly-low`/`monthly-high`, and frame 12's inverted bands
all become unreachable. **Unreachable, not fixed** - the same distinction G92 to G95 carry, and it
should be recorded that way rather than as a repair. `rangeFromCentral` would still invert on a negative
input and `monthsToTarget` would still miss it.

**It does NOT fully close G97, and that should not be claimed.** `YEAR_LIST_SPAN = 20` was invented
because `build-spec.md` gives no horizon, and a flip-point cap is a horizon derived from the model - so
for the ordinary session the constant is gone and G97 closes. But **`saved-toward-deposit` of zero has
no flip point**, and that session still needs a horizon from somewhere. The constant survives as the
fallback for that case: demoted from the rule to the exception, which is a real improvement and a
smaller claim than "closed".

### B. Keep the dates, change what the readout says past the flip

| | |
| --- | --- |
| Participant cost | None on the dates; they keep every year |
| Build cost | The commit still has to be guarded separately - **this option does not stop the negative reaching `savings-rate`**, so the state defect above survives it |
| Copy cost | A new string, and the space for it is the binding constraint |

**Where it would sit and what it displaces.** The readout is the natural place - replacing the figure,
not sitting beside it, since the figure is the thing that is wrong. Sitting beneath it instead would
land in the same band D83's disclosure uses, where G96's measurement gives **92px at default text and
61px at Large** between the readout and the dock, so **two lines at Large** is the budget. D81's
superseded banner was five lines at Large, for scale.

**Not recommended as a sole close**, for the reason in the build-cost row: it makes the screen honest
and leaves the store wrong.

### C. Clamp to zero

**"£0 / Put aside each month" reads as a bug, not an answer** - a calculator that has produced no
number. And it is worse than it looks: `monthsToTarget` rejects a savings-rate of exactly zero as
**`unreachable`**, so frame 12 would render its "you will not get there" variant for a participant whose
goal is already met by interest alone. It converts a nonsensical figure into a confident wrong
statement. Recorded for completeness; not recommended.

---

*Status: **open, and REACHABLE** - on first paint if a session's stored date is far enough out, and
within a few taps otherwise. No facilitator gesture, no seeded state, both text sizes, both palettes. Do
not file it beside the unreachable entries above it.*

***And it is a STATE defect, not a display defect.*** The negative is committed to `savings-rate`,
`monthly-low` and `monthly-high`, breaks D2's low-below-high invariant, passes both of
`monthsToTarget`'s guards, reaches `months-to-target`, `on-track-for` and `checkpoint-amount`, and draws
frame 12's growth chart with its two named bands swapped - with no error raised on any screen and
nothing in the suite failing. **Recommendation: close A**, with the empty-list case in 2.2 answered in
the same pass, and with what it makes unreachable recorded as unreachable rather than fixed.


### The list this is measured in got shorter, 31 August 2026 (DECISIONS.md D96)

**Whoever measures this needs to know the list length moved under it.** D96 pinned the year list's
direction downward on an ordinary visit, and paid for it out of the height clamp rather than out of
the layout above the control. The list is therefore SHORTER on an ordinary visit than it was when
this entry was written:

| Viewport | State | Before D96 | After D96 | After D84's revision |
| --- | --- | --- | --- | --- |
| Framed (1280x720 to 2560x1440) | Ordinary | 5 rows, upward | **3 rows, downward** (181 / 165.4px) | unchanged |
| Framed | Moved-date disclosure | 5 rows, upward | 5 rows, upward | **3 rows, downward** (181 / 165.4px) |
| 390x844 | Ordinary | 5 rows, downward | 5 rows, downward | unchanged |
| 390x844 | Moved-date disclosure | 5 rows, upward | 5 rows, upward | **3 rows, downward** |

**The clamp moved a second time, 31 August 2026 (DECISIONS.md D84 as revised).** The disclosure now
renders BELOW the date controls, so the space beneath the trigger is the same whether it is showing or
not, and the list hangs downward in every state at 181px (default) / 165.4px (Large). The moved-date
states are the ones that changed this time: they were five rows opening upward and are now three
opening down, at every viewport including 390x844.

**So both list lengths are now three rows at framed sizes, in every state.** If this entry is
reproduced by scrolling the year list to a far year, that takes more scrolling than either the
original report or the D96 note implies - in the moved-date states as well now. A reproduction that
fails to reach the year is a shorter list, not a fixed defect. Which options EXIST is still untouched:
the floor, the cap and the year span are built by the caller and neither pass went near them.

**Nothing about which options EXIST changed**, which is the part this entry turns on: the floor, the
cap and the year span are built by the caller and D96 did not touch them. December 2042 is still
offered wherever it was offered before, and the negative is still reachable by selecting it. All
eight options remain reachable by keyboard in every state, verified at both frame scales.

What changed is how many are visible without scrolling. If this entry is reproduced by scrolling the
list to a far year, that now takes more scrolling on an ordinary visit than the original report
implies - so a reproduction that fails to reach the year is a shorter list, not a fixed defect.

---

## G99. `rangeFromCentral` inverts on a negative central, and nothing enforces its own precondition

*Raised 31 August 2026 with `DECISIONS.md` D85, which made it unreachable. **Unreachable is not fixed**
- the form G92 to G95 use, and for their reason.*

### The mechanism

`model.js`:

    export function rangeFromCentral(central, spread = RATES.rangeSpread) {
      return { low: central * (1 - spread), high: central * (1 + spread) };
    }

Its own doc comment states the guarantee exactly: *"For any central > 0 this guarantees low < central <
high"* (D2). **Nothing checks that `central > 0`.** For a negative central the multipliers swap the
ends: 0.9 of a negative is nearer zero than 1.1 of it, so `low` comes out GREATER than `high`.

Measured at a solve of -27.63: `low` **-24.87**, `high` **-30.40**.

### What it did

Committed by frame 10b's Continue as `monthly-low` and `monthly-high`, which are section 6 figures. From
there:

- **Frame 11** rendered them as "-25" and "-30" in its editable rows, in that order, raising no error -
  its `monthlyHigh.value > savingCeiling` check does not fire on a negative.
- **Frame 12's growth chart** plotted the series named "low" ABOVE the series named "high" at every
  point (£21,483 against £21,415 at 12 months). Both still rose, so `chart-range.test.mjs` passed - see
  G101.

### Unreachable after D85, not fixed

D85 caps the date list at the month the solve reaches zero, so frame 10b can no longer produce a
negative central. The slider path clamps at zero and above. **The function is unchanged and still
inverts** on any negative it is handed.

*Status: **open, unreachable.** **Do not close it on the strength of D85.** G64's 29 August amendment is
the standing precedent: a defect that stops reproducing is harder to find, not smaller. Closing it means
the function enforcing the precondition its own comment states - returning an error for a non-positive
central, the way the rest of `model.js` does, rather than silently returning a range that is the wrong
way round.*

---

## G100. `monthsToTarget`'s guards do not consider a negative savings-rate

*Raised 31 August 2026 with `DECISIONS.md` D85, which made it unreachable. Unreachable is not fixed.*

### The mechanism

`monthsToTarget` guards two cases and neither catches a negative:

    if (savingsRate.value === 0) return fail('unreachable', provenance);
    if (leftOverFigure && leftOverFigure.value !== null && savingsRate.value > leftOverFigure.value) {
      return fail('exceeds-left-over', provenance);
    }

A negative is not exactly zero and is not above `left-over`, so it passes both and the annuity
arithmetic runs on it.

**And it returns a plausible answer**, which is what makes it dangerous rather than merely wrong: fed a
rate solved from a 150-month date, it returns **150.000** flagged `beyond-window`. The function is
internally consistent - it is inverting its own inverse - so nothing downstream has any reason to doubt
it. `on-track-for`, `months-to-target` and `checkpoint-amount` were all committed from it.

### A second, separate hole in the same function

`monthsToTarget` has **no `startingBalance >= targetAmount` guard**, which its sibling
`monthsToReachAmount` does have as its first line. So on a session whose goal is already met it returns
**negative months** with `error: null` - measured at -27.58, -12.63 and -6.63 for slider rates of 200,
500 and 1000 a month - and `onTrackFor` hands back `{ low: -24, high: -30 }`, itself inverted.

**That half is NOT made unreachable by D85.** D85 removes the date path's negative rate; it does not
touch the slider path, and a participant whose goal is already met can still set a monthly amount and
commit it. See G101.

*Status: **open. The negative-rate half is unreachable after D85; the already-met half is REACHABLE.**
Do not close either on the strength of D85. Closing it means the guards covering the cases the function
can actually be handed - a non-positive rate, and a balance already at or past the target - rather than
the two it happens to name.*

---

## G101. `chart-range.test.mjs` passed while frame 12 drew its two named bands swapped

*Raised 31 August 2026 with `DECISIONS.md` D85. **A gap in the suite, not in the build**, which is why
it is its own entry: nothing about frame 12's chart was wrong in the state the tests cover, and nothing
about the tests would have told anyone about the state they do not.*

### What happened

With `monthly-low` above `monthly-high` (G99), the growth chart plotted the series named "low" above the
series named "high" at every point:

| Months | "low" band | "high" band |
| --- | --- | --- |
| 12 | £21,483 | £21,415 |
| 60 | £23,603 | £23,239 |

`chart-range.test.mjs` asserts, in its own words, that the bars are "distinct and rising". **Both hold**
- interest outpaced the small negative contribution, so the series rose, and the two bands differed, so
they were distinct. The suite was green throughout.

### It is D77's finding, in the file D77's finding created

`chart-range.test.mjs` exists because D73's chart "drew a descending series and announced a balance
lower than the participant's own" while every other suite passed. D77 then generalised the lesson:
**an assertion that passes for a reason unrelated to what it claims to test is worse than none, because
it is counted.** This is the same file, one property later. "Distinct and rising" was chosen against a
chart that descended; it says nothing about which of two named series is on top.

### Worth an entry of its own - yes

The build defect is G99's and is unreachable now. What is left is a **test that cannot detect an
inversion**, and that outlives the defect that revealed it: any future change putting the bands the
wrong way round would ship green. That is a property of the suite, and G99 closing would not touch it.

**What closing it means.** One assertion, and the shape matters more than the wording: for every plotted
point, the series named "high" must be at or above the series named "low". It is a shape assertion,
survives a re-scale, and is the kind D73's third amendment already argues for.

*Status: **open.** The state that exposed it is unreachable (G99); the blind spot is not. Do not close
it when G99 closes - they are different things in different files.*

---

## G102. A date moved DOWN to the cap is not disclosed, where one moved UP to the floor is. CLOSED 31 August 2026 - DECISIONS.md D86

*Raised 31 August 2026 with `DECISIONS.md` D85. **A D46 gap, and a knowingly incomplete one** - the
missing half is copy, and copy was not this pass's to write.*

### The asymmetry

D83 handles a selection below the floor: the date is moved to the floor and the move is DISCLOSED
(`dateMovedToEarliest`), which is D46's rule - a value the participant set may be replaced only if the
replacement is visible to them.

D85 introduced the same case at the other end. Raise the saved total, lower the property value or lower
the deposit percentage, and the cap moves behind a date already chosen. **The date is moved to the cap
and nothing says so.**

Driven in a browser: pick 2034 (the last year offered), go to frame 11, raise "Saved so far" to 26,000,
press back. The cap is now August 2028, the year list ends 2028, and the selection reads 2028. **No
disclosure of any kind.**

### Why it was left

The mirrored disclosure needs its own string - `dateMovedToEarliest`'s words are wrong for it ("the
soonest you could get there" is not what happened) - and D85's brief was explicit that the copy is the
project owner's. Moving the date silently was chosen over the alternatives: leaving it standing would
put a value in the trigger that its own list does not contain, and refusing the upstream edit was
rejected in G98's own reasoning.

**CLOSED 31 AUGUST 2026. `DECISIONS.md` D86.** One string (`dateMovedToCap`) and one flag
(`dateMovedToCap` in `state.js`), mirroring D83 exactly - above the dropdowns, from a stored flag,
cleared on the next pick, `infoBannerHTML` with `role="status"` polite. The key name landed as
`dateMovedToCap` rather than the `dateMovedToLatest` guessed at above.

**The copy deliberately does NOT mirror the floor's shape**, and D86 records why: at the floor the
participant met a limit, so the change leads and the reason follows; here their position improved, so
the reason leads and the move follows. Two situations, two shapes.

**One defect was found by closing it.** Picking the cap's own year while holding a later month left a
date past the cap, which the render corrected and then announced - a disclosure saying the app had moved
the date when the participant had just moved it themselves. The year pick now clamps the month at both
ends, mirroring the floor clamp D83 already had.

*Status: **closed.** The two disclosures are mutually exclusive by construction - each move clears the
other's flag - and that is asserted rather than assumed.*

---

## G103. The earliest date the list offers is the one date frame 11 refuses

*Raised 31 August 2026 while building `DECISIONS.md` D90, and not caused by it. Recorded here rather
than left in a report.*

### The incoherence

Frame 10b's floor (D85) is the earliest month at which the solved monthly amount is **at or under**
`left-over`. Frame 11's check is `monthly-high > left-over`. **They test different quantities.**
`monthly-high` is `1.1x` the solved rate (D2's range spread), so a rate just under the ceiling produces
a high just over it.

Driven end to end on the shared seed: pick the earliest date the list offers, press Continue, land on
frame 11 with the range **£980.88 to £1,198.85** against a £1,150 ceiling, `errorExceedsLeftOver`
showing and Work it out disabled - **having typed nothing**.

### It is exactly one date, and it is the first one

Measured across the 41 months from the floor:

| Month | Solved rate | `monthly-high` | Frame 11 |
| --- | --- | --- | --- |
| **6 (the floor)** | **£1,089.87** | **£1,198.85** | **blocked** |
| 7 | £923.46 | £1,015.81 | passes |
| 8 | £798.66 | £878.52 | passes |

Only the floor month itself. The high clears the ceiling from the next month on, because the solve falls
away steeply just past the floor.

**That it is one date does not make it small.** It is the FIRST option in the list, it is the date the
floor exists to make reachable, and "as soon as possible" is an obvious thing for a participant to pick.
The screen offers it, solves it, shows a figure under the ceiling, and the next screen refuses it.

### Not fixed here

D90 was one label. Sketching the options so the next pass does not start cold:

- **Floor on the HIGH rather than the rate** - the two screens would then test the same quantity. It
  moves the floor out by a month or so and is the smallest change that makes them agree.
- **Frame 11 tests the rate rather than the high** - the mirror. Weaker: the high is what the
  participant is shown and what the tracker projects from.
- **Leave it and let D90's label carry it.** The participant now at least sees the number. But they are
  refused for a choice the previous screen presented as valid, which is the part the label cannot fix.

*Status: **open, and REACHABLE** - the first option in the list, no facilitator gesture, no seeded state,
both text sizes and palettes.*


---

## G104. Five production deployments, four supplied reasons: `394565a` is unassigned

*Raised 31 August 2026 while building `DECISIONS.md` D91's backfill. Needs Riona to close it; it
cannot be closed from the history.*

### The count does not match

`main` moved five times carrying a change to prototype code. Four deployment reasons were supplied
for the backfill. Three of the four map onto a deployment on content with no ambiguity, and v1 is
corroborated by the `v1.0` tag. That leaves one deployment with no reason against it:

| Commit | Merged | Contents |
| --- | --- | --- |
| `394565a` | 2026-08-28 20:41 | One commit: "Seed the opening session at £650,000 so it meets the Lifetime ISA cap" |

It landed 31 minutes after v2 (`ce2b482`, 20:10 the same evening) and changed `src/stage.js`,
`sw.js` and three scripts. It is a change to what a participant is shown, so it cannot simply be
dropped from the log.

### The two readings, and why neither was chosen here

**A hotfix inside v2.** A seed figure was wrong, it was corrected the same evening, and Riona never
thought of it as a separate version. The row is then deleted and v2's commit becomes `394565a`.

**A deployment in its own right.** Production served `ce2b482` for 31 minutes and `394565a`
thereafter, so a session run inside that window saw a different build from one run after it. The
row then takes v3 and every row below it moves up by one.

The history cannot distinguish these, and D91's own rule is that a deployment reason is Riona's and
is never inferred from the diff. So the row sits in the log with `[UNKNOWN]` in the Version and
Deployment reason cells rather than being guessed into either shape.

### To close

Confirm which reading is right. If any participant session was run on the evening of 28 August
2026, check its start time against 20:41 first, because that is the only case where the answer
changes what a session should be reported against.

---

## G105. The prototype was unreadable at 100% browser zoom, and the pilot session was run at 150%. CLOSED 31 August 2026 - DECISIONS.md D92

*Raised and closed 31 August 2026. The finding is the pilot session's; the defect was in the shell.*

### What was found

At 32:32 of the pilot session on 31 August 2026, after the tasks were finished, the participant
disclosed that they had viewed the whole session magnified:

> "I have been viewing this entire page in 150 and I didn't realise that 100% is this small one
> around that this might be an issue for people."

They had found the prototype unreadable at 100% and changed the browser zoom before starting, and
said so only at the end.

### Why it is a gap and not a preference

Every judgement that session produced about type size, colour weight, axis legibility and reading
effort was made at a magnification the next participant has no reason to reproduce. The instrument
was not the same instrument between that session and the next one, which makes the two sets of
findings uncomparable on exactly the dimensions the study is measuring. It blocked further sessions
rather than sitting in a backlog.

### The cause

`shell.css` scaled the frame to FIT: `min(1, ...)`, shrinking on a short window and never growing on
a tall one. The largest the phone was ever drawn was its natural 393x852 - on a 2560x1440 desktop as
much as on a laptop, where it occupies 15% of the display's width.

*Status: **closed** (D92) - the logical viewport stays fixed at 393x852 and the rendered frame is
scaled, from available height, never below 1.0 and capped at 1.5. The layout inside the frame is
asserted identical at 1280x720 and 2560x1440 by `scripts/frame-scale.test.mjs`, which is the property
that makes findings from before and after this change comparable with each other.*

### Two numbers in the brief that this repository does not have, and Riona needs to settle

The brief for this change asked for **G99** to be closed and for **G111** (flat visual hierarchy) to
be noted as unblocked. Neither is what those numbers hold here, and nothing was renumbered to make
them fit:

| Asked for | What this file actually has |
| --- | --- |
| G99, the zoom finding | **G99 is `rangeFromCentral` inverts on a negative central** - a model defect, open, unrelated |
| G111, flat visual hierarchy | **There is no G111.** This file ends at G104 |

So the finding is recorded here as **G105**, the next free number, per `CLAUDE.md`'s rule that the
last number in the file is what the next one follows. G99 is untouched and stays open.

**To close.** Confirm where the other numbering comes from - most likely a separate session-findings
document that numbers its own observations - and either say which entry here corresponds to "flat
visual hierarchy", or raise it as a gap in its own right so it has a number in this file. It cannot
be inferred: no open entry here is about visual hierarchy, and guessing one would attach a pilot
finding to the wrong defect.

**What is true regardless of the numbering:** whatever entry records the flat visual hierarchy
finding, it was raised by a participant reading the prototype at 150%, so the observation behind it
was made at the wrong magnification. **It must be reassessed at 100% zoom against this build before
it is actioned.** Type weight and contrast that read as flat at 150% may not at 100%, and a
treatment applied on the strength of the 150% reading would be a change made for a state no
participant will now see.

---

## G106. Frame 10's heading names the mechanism, not the goal. CLOSED 31 August 2026 - DECISIONS.md D94

*Raised 31 August 2026 from the pilot session of the same date (pilot finding **P2**), with
`DECISIONS.md` D93, which wired the key and rendered `[AWAITING COPY]` rather than writing a string
in a build session. **Closed by D94**, which landed the approved copy: "How would you like to save
for your deposit?" - the participant's own phrasing, offered unprompted at 20:17. The string was
supplied and approved; it was not written here.*

### The numbering, first, because the brief asked for a number this file already holds

The brief for this change asked that **G100** be noted as wired but blocked pending copy, and
explicitly not closed. **G100 is not this finding.** It is `monthsToTarget`'s guards do not consider
a negative savings-rate - a model defect, open, unrelated to any heading. Nothing was renumbered to
make the brief fit, for the reason G105 gives at the same fork:

| Asked for | What this file actually has |
| --- | --- |
| G100, the step 2 heading | **G100 is `monthsToTarget`'s negative savings-rate guards** - open, untouched, unrelated |

So the finding is recorded here as **G106**, the next free number. G100 is untouched and stays open.
This is the second brief in two sessions to number a pilot finding against this file and miss - see
G105's closing note, which asks the same question and is still the way to settle it.

### The finding

Frame 10 asks "How would you like to work this out?" above two options, "Set a monthly amount" and
"Set a target date".

The heading names **the app's mechanism** - what it is about to compute - and never names **the
participant's goal**. Nothing on the line says what is being worked out, so the choice beneath it has
no subject. The participant stopped here and could not proceed. At 19:48:

> "Yeah, what does the screen mean? How would you like to work this out? What am I working out
> exactly?"

And at 20:17, after the moderator explained the choice aloud:

> "Yeah, how would you like to work this out? I don't understand what that means. Like, it would be
> better off just saying, you know, how would you like to save for your deposit? Set a monthly amount
> or set a target date? That makes a bit more sense."

**The options themselves were understood once read aloud.** The participant repeats them back
correctly and immediately in the second quote. What failed is the framing above them, and only that -
this is not a layout, control or interaction finding, and it must not be actioned as one.

### Why it is not merely one participant's confusion

The moderator had to intervene **twice** for the participant to continue. Every subsequent
observation on frame 10 in that session - the segmented control, the slider, the date path, frame 11
downstream of it - is taken after a verbal explanation no participant will get in a later session,
and is contaminated accordingly. The same contamination recurs in every session run against this
build until the heading is fixed, which is what makes it blocking rather than cosmetic: it is not a
finding about the prototype so much as a defect in the instrument.

### What was done, and what is left

`content['/calculator/saving'].headline` is `[AWAITING COPY]`. The placeholder renders literally in
the `<h2>` the real heading occupies, verified in a browser, so a build cannot ship the missing
string silently. Nothing else on the screen changed: the option labels, the supporting caption, the
control, the option order and both variants beneath are untouched.

**To close.** Supply the heading. It has to name what the participant is doing rather than what the
app is doing - the participant's own "how would you like to save for your deposit?" is the shape of
it, and is a participant's words rather than approved copy, so it goes through the copy check
(`fca-copy-check`) before it lands. Two constraints from the screen it sits on: the two options
answer it directly, so it has to be a question they are answers to; and it must not recommend either
option, which is the guidance-versus-advice line D81 already holds this screen to.

`content['/calculator/saving'].pickOneCaption` ("Pick one and we'll work out the other.") sits
directly beneath the options and is already keyed. It was **left standing rather than blanked** - it
was not part of what failed, and emptying a line that worked would widen a copy pass that has one
line to write. It is named here so the copy pass can judge it against the new heading rather than
discover it afterwards.

### How it closed, 31 August 2026

The heading is `How would you like to save for your deposit?`, landed by `DECISIONS.md` D94 and
verified character for character in a browser. It was **supplied and approved, not written here** -
which is the whole reason D93 left a placeholder rather than filling the gap itself, and the reason
this entry stayed open through a build that rendered `[AWAITING COPY]` on a live screen.

**No supporting line was added.** The copy brief was explicit that the screen carries a reading-effort
finding and that adding text works against it. `pickOneCaption` was neither added to nor removed - see
G108, which records why the "work out" inside it was not rewritten in the same pass.

**What this entry does NOT close.** The heading was one half of P2. The option labels still name
inputs rather than outcomes, and the participant's 19:48 question - "what am I working out exactly?" -
was about the result, not the input. That half is **G107**, opened as a measurement rather than a
fix. Closing G106 is not evidence that P2 is resolved, and the next session is what settles it.

**One thing this answers for G105.** That entry closed asking where the other numbering comes from,
after a brief asserted G99 and G111 against numbers this file holds for unrelated defects. The copy
brief supplied **P2** as the pilot finding reference and asked that the number be located by reading
this file rather than assumed. That is the convention G105 asked for, arrived at from the other
direction: pilot findings are P-numbered in the session document and gaps are G-numbered here, and
the two are cross-referenced rather than conflated. G105's question can be marked answered if that is
confirmed as the standing scheme.

---

## G107. The heading now names an outcome and both option labels still name inputs. REPORT ONLY - MEASURE, DO NOT FIX

*Opened 31 August 2026 with `DECISIONS.md` D94, as the untested half of pilot finding **P2**. This
entry is a **measurement**, not a defect with a known fix. **Do not change the option labels against
it.** Nothing here is to be implemented; the next moderated session is what decides whether anything
should be.*

### The asymmetry D94 leaves behind

D94 rewrote the heading from the calculation to the participant's goal: "How would you like to save
for your deposit?" The two options beneath it did not move, and they are still written the other way
round:

| | Names | |
| --- | --- | --- |
| Heading | the participant's **goal** | "How would you like to save for your deposit?" |
| `segmentMonthlyLabel` | an **input** they supply | "Set a monthly amount" |
| `segmentDateLabel` | an **input** they supply | "Set a target date" |

So the screen now asks a question about an outcome and offers two answers about inputs.

### Why that might still be the defect

The quote D94 was written from is the 20:17 one, where the participant describes what would have
worked. **The 19:48 one is the question they actually asked**, and it is not the same question:

> "Yeah, what does the screen mean? How would you like to work this out? What am I working out
> exactly?"

"What am I working out **exactly**" is a question about the **result** - what comes out of this - not
about what they are being asked to type in. The heading fix answers "why am I here"; it does not
necessarily answer "what will I get". If the labels are what carried the confusion, the heading alone
moves the participant one step and stops them at the next.

Against that: at 20:17 the participant read both labels back correctly and unprompted - "Set a
monthly amount or set a target date? That makes a bit more sense" - which is evidence the labels were
legible *once the heading gave them a subject*. Both readings fit the transcript, and that is exactly
why this is a measurement and not a change.

### The prediction to test, stated before the session

In the next moderated session, on frame 10, with no moderator intervention:

- **If the participant reads the heading cleanly and then hesitates on the two options** - re-reads
  them, asks what either one gives them, or asks a variant of "what do I get" - then the labels are
  the remaining half of P2 and should be reframed as **outcomes** rather than inputs. The shape, for
  the copy pass that would follow and not to be written now: "when I could have my deposit" and "how
  much to save each month".
- **If they move straight through**, the heading fix was sufficient and no further change is needed.
  Record that and close this entry.

**Stated in advance on purpose.** Written after the session, either outcome can be read as confirming
whichever change was already wanted. The two branches above are the whole value of this entry, and
they are worth nothing if they are decided retrospectively.

### Why not just fix it now

Two reasons, and the second is the load-bearing one.

The labels are approved copy that a participant has read back correctly, so rewriting them on a
prediction trades a known-legible string for an untested one.

And the prototype is a research instrument. P2 cost a session: every observation on frame 10 after
19:53 is downstream of a moderator explanation. Changing two more strings on the same screen in the
same pass means the next session tests **heading plus labels** as one lump, and a clean run tells us
nothing about which of the three strings did the work. One change, one session, one answer.


### The caption changed before the measurement ran, 31 August 2026 (DECISIONS.md D95)

`pickOneCaption` now reads "Set an amount and we'll show you the date. Set a date and we'll show you
the amount." It names **both outcomes**, which is part of the work a label reframe would have done.

**What that costs this measurement, stated plainly.** If the next participant moves straight through,
the heading and the caption cannot be separated as causes. The clean two-branch reading in the
prediction above survives only for the hesitation branch: a participant who reads the heading, reads
the caption, and still hesitates on the two labels is evidence about the labels, because the outcome
naming they would supply is already on screen above them.

**Accepted deliberately.** G107 tests whether the screen is comprehensible, not whether the heading
alone is. What the measurement could not have survived is the failing vocabulary sitting above the
fold throughout it - "we'll work out the other" one line beneath the heading written to replace that
exact phrase. A contaminated cause is recoverable by a later isolation pass; a session run against
copy known to fail is not.

**Fourth change on this screen since D94, and the screen is frozen on landing.** In order: D94's
heading, D95's caption, D96 pinning the list's direction on the ordinary visit, and D84's revision
pinning it in every state by moving the moved-date disclosure below the controls.

**All four moved in the same direction - toward less variance, not more.** The last two removed
interaction variance rather than adding any: the list now answers the same way at every window size,
both text sizes, and whether or not the participant tripped a disclosure. Where D96 left this entry
able to separate causes only on the hesitation branch, nothing since has narrowed that further, and
the date branch is now geometrically identical for every participant who reaches it.

**Nothing further lands on frame 10 until this measurement has run.** The next change waits for the
G107 session.

---

## G108. `pickOneCaption` framed the decision in the vocabulary that failed. CLOSED 31 August 2026 - DECISIONS.md D95

*Opened 31 August 2026 with `DECISIONS.md` D94, originally over three strings. **Rescoped to
`pickOneCaption` alone and closed on that**, 31 August 2026. The two provenance strings are not a
defect and were removed from this entry rather than carried as outstanding work - see below, because
this will otherwise be relitigated.*

### What it was

`content['/calculator/saving'].pickOneCaption` read "Pick one and we'll work out the other." It sat
directly beneath the heading D94 had just written to replace that exact vocabulary, above the fold,
on the screen the pilot participant could not get past. It also asked them to infer what "the other"
was - a second inference on a screen whose first inference had already failed.

### How it closed

D95 replaced it with "Set an amount and we'll show you the date. Set a date and we'll show you the
amount." Two symmetrical sentences, one per option, naming **both outcomes**. It was not deleted and
not cut to one clause: on the slider variant - the default, and the one a participant lands on -
nothing else on the screen says a date is coming, because the solved date is deferred to frame 11.

### Why the other two strings are NOT in this entry any more

`taxRateCaption` ("Worked out from your salary") and `provenanceKeyLabel` ("How we worked these out")
were listed here when the entry was opened, on the reasoning that D94 banned the phrase screen-wide.
**That reasoning was wrong, and the correction matters more than the strings do.**

**The pilot defect was never the phrase "work out".** It was that phrase used to frame *a decision the
participant was being asked to make*. These two are provenance strings: they say where a figure came
from. That is a different job, and it is a job the same participant explicitly asked for at 13:36,
wanting somewhere "where I can actually see where this money is calculated has come from".

So rewording them would be a regression against a stated participant need. And it would not stop at
this screen: `provenanceKeyLabel` carries the identical string on `/position` and `/calculator/review`,
with a sibling on `/tracker`, so synchronising the reword - which `CLAUDE.md`'s "any correction applies
everywhere the same pattern appears" would require - is a four-screen change made off a single-screen
finding. That is a larger regression than the first.

**What there is no evidence about.** Both strings sit below the fold at 390x844, and Continue is in
the pinned action bar (D39), so a participant can complete step 2 without seeing either. There is no
pilot evidence on them in either direction. **That is absence of evidence, not evidence that they
work** - if a later session scrolls the card and stumbles, that is a finding and it gets its own entry.

The wider question of "work out" across the roughly twenty user-facing strings in the app is real but
is not this entry's, and was kept here only because this entry was where it was noticed. It is now
**G109**, so this one stops proposing app-wide changes off the back of a single-screen finding.

---

## G109. "work out" appears in roughly twenty user-facing strings across the app. REPORT ONLY - LOW PRIORITY

*Opened 31 August 2026, split out of G108 when that entry was rescoped. **Low priority, and not to be
actioned as a batch.** Nothing here is a known defect.*

### What it is

"work out", "worked out" and "working out" appear in around twenty strings across `content.js`,
spanning `/position`, `/calculator/*`, `/tracker`, `/mip/*` and several `/assumptions/*` sheets. Two
shapes dominate:

- **Provenance and derivation** - "How we worked these out", "Worked out from your salary", "Stamp
  duty is worked out at first-time buyer rates", "Deposit amounts worked out from the property value
  you set". These say where a figure came from.
- **Framing and invitation** - "Next: work out your deposit", "We'll work out what you'd need and how
  long it could take".

### Why it is open, and why it is low priority

One participant, on one screen, could not parse the phrase when it framed a decision they were being
asked to make (G106, closed). That is a real finding about **that use**. It is not evidence that the
phrase fails when it describes derivation, and D95's rule is deliberately scoped to decision-framing
copy on frame 10 rather than to the vocabulary everywhere.

**The failure mode to avoid here is a batch reword.** Twenty strings changed at once, across nine
routes, on one participant's difficulty with one of them, would be a large uncontrolled change to a
research instrument mid-study - and it would make every subsequent session incomparable with the ones
already run.

### To close

Evidence, not judgement. If a later moderated session shows a participant stumbling on one of these in
its own context, reword **that** string and record which shape it belonged to. If several sessions
pass with no difficulty on the derivation shape, close this entry saying so. Either way it is findings
that settle it, and the two shapes above are settled separately.

---

## G110. The open date list covers the moved-date disclosure, and hides the date it names. OPEN

*Raised 31 August 2026, correcting `DECISIONS.md` D84's revision, which claimed this was harmless on
the strength of too narrow a measurement. **Open, unfixed, and in the build the next moderated session
will run unless it is fixed first.** Both candidate fixes were measured; neither works. The numbers
are below so the next reader does not have to re-derive them.*

### Read this first: direction is not the cause, and twice it was assumed to be

Two briefs in a row proposed a fix premised on the list's opening direction, and both premises were
wrong:

| Premised | Measured |
| --- | --- |
| Moving the disclosure below the controls so the list opens downward "resolves the overlap" | It did not. 48.3% before, 48.3% after. |
| "After the relocation the list opens downward in every state, so the overlap should be gone" | It is not gone. 48.3% in all 24 combinations. |

**The overlap is horizontal.** The popover spans its own field's width - 48.3% of the banner's width -
and covers that column whichever way it opens. Direction, which D96 and D84's revision spent two
passes pinning, is irrelevant to it. Any further proposal resting on direction can be rejected without
measuring.

### What is on screen

Frame 10b in the moved-date state, with either date list open. The disclosure is `#date-moved`,
carrying D46's requirement that a value the app replaced stays visible to the participant:

> Good news - you'll get there sooner than that now. We've moved your date to May 2034.

With the **month** list open, what the participant can read is:

> Good news - you'll get there sooner
> We've moved your date

The sentence promises a date and the date is gone.

### The measurement, 24 combinations

Both disclosure states (moved-to-floor, moved-to-cap) x both lists (month, year) x three viewports
(390x844, 1280x720, 2560x1440) x both text sizes:

- Overlap occurs in **24 of 24**, at **48.3%** every time.
- The moved date is **fully covered in 16 of 24**.
- **Month list: covered in 12 of 12.** The month popover holds the left column, where the banner's
  short last line sits.
- **Year list: covered at Large text** in the moved-to-cap state at all three viewports; uncovered at
  default text, which is the single case D84's revision measured and generalised from.

### What does NOT make it worse

The banner renders through `infoBannerHTML(..., { live: true })`, so it carries `role="status"` and
`aria-live="polite"` and is **announced when it appears**, whatever is drawn over it. A non-sighted
participant is unaffected. The coverage is also transient and participant-controlled: the banner is
fully visible before the list is opened and again as soon as it closes.

That is why this is a defect about a **sighted participant mid-interaction**, and not a total D46
failure. It should not be inflated past that, and it should not be dismissed either: the participant
reading a truncated sentence is reading it at exactly the moment they are choosing the date it is
about.

### Candidate fixes, both measured, neither viable

**Candidate A, move the disclosure further down.** Gap is the distance from the field bottom to the
banner top; the popover must be shorter than the gap to clear it.

| Placement | gap (default / Large) | popover height | clears? | disclosure still visible? |
| --- | --- | --- | --- | --- |
| Current, below the controls | 8 / 8 | 183 / 167.4 framed, 244 / 227.1 at 390x844 | no | yes |
| A1, below the hint | 52 / 57.4 | same | no | yes |
| A2, below the readout | 142 / 156.7 | same | **no** - still short by 41 / 10.7 | **NO - below the fold in 5 of 6** |

A2 gets closest and fails on both counts: it still does not clear, and it pushes the banner past the
fold or the action bar at every framed viewport and at 390x844 Large. **That is the constraint that
killed the above-the-controls position in the first place**, so A2 trades a partial, transient overlap
for a permanent visibility failure. It reduces coverage to 25.7% and puts more of the readout and hint
under the list instead.

**Candidate B, a banner row clear of both popover columns.** Refuted. At 1280x720 the banner spans
463.5 to 816.5 (353px wide); the month popover column is 463.5 to 634 and the year column 646 to
816.5. Clear strip **left of month: 0px. Right of year: 0px. Between the two columns: 12px**, which is
3.4% of the banner width and cannot hold text. There is no horizontal region clear of both.

**Candidate C, keep the disclosure above the controls and still open downward.** Measured for
completeness, because it is the only arrangement that does clear:

| | clears the banner | popover height | rows |
| --- | --- | --- | --- |
| 1280x720 / 2560x1440, default | **yes** | 83px | 1.73 |
| 1280x720 / 2560x1440, Large | **yes** | 57.5px | 1.20 |
| 390x844, default | **yes** | 168px | 3.50 |
| 390x844, Large | **yes** | 117.2px | 2.44 |

It clears completely and the banner stays visible - but the list collapses to between one and two rows
at every framed viewport, far under D96's three-row minimum, on the date branch G107 is measuring.

### The shape of it: any two of three

The three properties cannot be held at once, and this is the useful way to hold the problem:

| Arrangement | Downward | 3-row minimum | No overlap |
| --- | --- | --- | --- |
| Disclosure below controls (current) | yes | yes | **no** |
| Disclosure above controls, list down (C) | yes | **no** (1.2-1.7 rows) | yes |
| Disclosure above controls, list up (pre-D84 revision) | **no** | yes | **no** - it covered 48.3% too |

Note the third row: the arrangement before D84's revision did **not** avoid the overlap either. There
has never been a version of this screen without it.

### To close

Not by moving the disclosure - that is measured out. What is left is a change to the control rather
than to the layout, and none of it is in scope for a frozen screen: a single full-width list rather
than two column-width popovers; or a list that renders as a sheet; or a disclosure that is not a
full-width banner beneath the row. Each is a real component change and each needs its own decision.

**Frame 10 is frozen pending the G107 measurement**, so the live question is not which fix to build
but whether this defect blocks that session. The judgement recorded with this entry is that it does
not: the payload is announced to assistive technology, the banner is fully readable whenever no list
is open, and the moved date is also shown outright in the month and year controls directly above the
list. A moderator note is the proportionate mitigation for the next session, and the fix belongs after
it rather than before.

---

## G111. `/tracker`'s "On track for" dates were a full calendar month early. CLOSED 31 August 2026 - DECISIONS.md D97

*Found incidentally while planning the date conversion, 31 August 2026. **It was live**, on a screen
participants see, and it had nothing to do with the work that found it. Recorded as its own entry for
that reason rather than folded into D97's record.*

### What was on screen

`/tracker` rendered `formatMonthYearRange(onTrack.value.low, onTrack.value.high, RATES.asAt)`.
`RATES.asAt` is `2026-07-30`. On 31 August 2026 every date in that row was therefore measured from a
day **a full calendar month in the past**, so the whole "On track for" range read one month early.

### Why it was not a typo

It is D3 applied correctly to the wrong kind of fact. D3 pins the Bank Rate so figures cannot drift
between sessions and a screenshot keeps matching the running build - and its wording, "everything in
this prototype is dated from the pinned rate", was followed. **A rate is pinned so figures hold still;
a "today" must be current or every date derived from it is wrong.** The two are different facts and
the entry that conflated them was the decision, not the code.

### Why it survived

Nothing on screen could reveal it. A date range is not obviously wrong by inspection, the figures it
derives from were right, and every test asserted the range's SHAPE rather than its position on the
calendar. It would have gone into a session unnoticed.

### Closed by

D97's `sessionAnchor`. `stale-session.test.mjs` now asserts the anchor is stamped once, does not move
across a navigation, and is discarded on a month mismatch.

---

## G112. Frame 21 projects to `deposit-target`, not `combined-goal`. REPORT ONLY

*Raised 31 August 2026 with D98. **Not fixed in that pass**, which was scoped to the date conversion.*

`mip-result-not-yet.js` computes its step-1 caption from
`monthsToReachAmount({ targetAmount: state['deposit-target'].value })`. D70 established that the
stamp duty has to be in the account too, so a projection to the deposit alone reports a date the
participant reaches with the tax still unsaved - which is exactly the reasoning `monthsToTarget` was
moved onto `combinedGoal` for.

**D98 made it more visible rather than less.** It was a duration and is now a YEAR, so it can be read
directly against the tracker's and frame 12's, which both project to `combined-goal`. The three can
now be compared by eye and one of them disagrees.

**Not fixed here** because it changes a figure on a screen this pass was not scoped to, and the fix
is one word in one call. Whoever takes it should check whether frame 20 has the same shape.

---

## G113. `formatMonthsDuration` has no callers. KEPT, NOT DELETED

*Recorded 31 August 2026 with D98.*

The date sweep left `format.js`'s `formatMonthsDuration` with zero call sites. **It is deliberately
kept.** It is the right function if a duration is ever the correct thing to render again, it carries
its own history in a comment block that took several passes to settle ('mo' to 'mon' to 'mo' to 'm'),
and deleting it is a separate decision that should be taken on its own evidence rather than as a
side effect of a conversion. Recorded so its zero-caller state reads as a decision rather than as an
oversight the next reader should tidy.

---

## G114. Frame 10 anchors on the wall clock while every other screen anchors on the session stamp. OPEN - TRANSITIONAL

*Opened 31 August 2026 with D97. **Closes in one pass after the G107 measurement**, not before.*

`/calculator/saving` reads `new Date()` in three places: `monthsFromNow`, `dateAtMonths`, and the
seeding block with its two `??` fallbacks. Moving them onto `state.sessionAnchor` is the correct end
state and was deliberately not done: **the screen is frozen pending G107** and a sweep is not an
exemption.

**It is unobservable at month granularity, and that is what bounds the cost.** D97 discards a session
whose anchor month is not the current month, so inside any live session the wall clock and the anchor
fall in the same calendar month, and both `dateAtMonths` and `formatMonthYear` floor to the 1st. The
two cannot name different months while a participant is looking at them. The only way to see a
disagreement is to hold a session open across midnight on the last day of a month, which the discard
closes on the next load.

**The second half of the same pass.** Frame 10b's floor and cap should also move onto `goalMonths`
(D99) - it already implements that rule by two routes. Both changes belong in one commit after the
G107 session.

---

## G115. A three-way same-year collision would break `compareSameYearNote`'s two slots. UNREACHABLE, NOT FIXED

*Recorded 31 August 2026 with D101, in the G92-to-G95 form: **unreachable is not fixed**, and this
should not be closed on the strength of the measurement below.*

The card's collision note takes `{a}` and `{b}`. If all THREE visible rows resolved to one year it
would have no slot for the third.

**Swept over property 100,000 to 800,000 in 10,000s x ten balances x five selections:**

| Contribution range | Configurations | Two-way | Three-way |
| --- | --- | --- | --- |
| Every rate the app can commit (to `left-over` 640) | 28,400 | 100 | **0** |
| Rates above any reachable `left-over` (800 to 3,000) | 21,300 | 3,790 | **382** |

**Zero at every rate the running app can produce.** The 382 sit above `MOCK_POSITION`'s ceiling and
are reachable only if that constant changes or a facilitator seeds a higher `left-over`. A third slot
was deliberately not bought for a state no session can reach; the detection is one line and this
entry records where it would go.

---

## G116. The endpoint line does not change when the series does. OPEN - REPORT ONLY, MEASURE, DO NOT FIX

*Opened 31 August 2026 with D102, in G110's form: stated, unfixed, with the trigger conditions written
**in advance of the session**, which is the whole value of the entry. **Do not resolve this before the
next moderated session.***

### The measurement

Endpoint year at `monthly-low` equals endpoint year at `monthly-high`, so pressing the series control
leaves that line unchanged:

| Attainment horizon | Collisions | Rate |
| --- | --- | --- |
| **Under 2 years** | 927 / 1,095 | **84.7%** |
| **2 to 5 years** | 774 / 2,029 | **38.1%** |
| 5 to 10 years | 138 / 2,946 | 4.7% |
| 10 to 20 years | 9 / 3,142 | 0.3% |
| Over 20 years | 0 / 1,324 | 0.0% |

So for a participant more than five years from their goal - the seeded persona at every deposit
percentage, and the case the pilot ran - it costs 4.7% and falling. Near the goal it costs 85%.

### Stated in advance

| | |
| --- | --- |
| **The concern** | A participant may read the control as having done nothing |
| **Why it may not matter** | The readout, the plotted line and all three comparison rows move at the same moment, so the control is visibly doing something elsewhere. The line is also not wrong: at both contributions they genuinely do arrive in that year |
| **What would trigger a fix** | A participant pressing the control, looking at the endpoint line, and saying or implying nothing happened; or pressing it repeatedly as though it were unresponsive |
| **What would close it as a non-issue** | No participant showing any sign of it across the session |
| **The fix, if triggered** | The line acknowledging the unselected series - both values are in state. It needs words nobody has drafted, and those are written after the session, not before |

**Written in advance for G107's reason:** after the session, either outcome can be read as confirming
whichever change was already wanted.

### It is not the other same-year case

The comparison card's collision is a WITHIN-RENDER one - two of three visible rows say the same year,
so a string can name both, and that is `compareSameYearNoteTemplate`, settled. This one is
CROSS-STATE: one figure compared against what it would have been. It cannot collide with itself, so it
needs no copy variant - only different words, if triggered.

---

## G117. `/calculator/result` shows an interest rate and carries no rate-variability warning. OPEN

*Raised 31 August 2026 by the `fca-copy-check` pass recorded in D104. **Pre-existing** - not
introduced by that pass, and moved here rather than fixed because the fix is not a copy edit.*

The screen renders `chartCaptionTemplate`, "With interest at 3.75% a year", which is an interest rate
on screen. The copy check's rule 2 requires a route showing one to carry the rates-indicative risk
warning through `riskWarningHTML()`.

**The only such key does not fit.** `rateVariabilityWarning` exists on `/assumptions/borrowing` alone
and reads "Mortgage rates are indicative of the current market and are subject to change. Your final
rate will depend on your specific details." Frame 12's rate is a **savings** rate - the Bank Rate used
as a declared growth proxy (D3) - not a mortgage rate being offered. Rendering that wording here would
state something false.

**`projectionAssumptions` partially discharges it in plain words**, and that should be weighed before
a new string is written: "It assumes nothing changes: what you save, **interest rates**, or the
deposit you need" tells the participant the rate can move, which is the substance of the requirement.
What it does not do is carry the warning through `riskWarningHTML()`'s visual treatment.

**Whoever takes this should decide first whether rule 2's rates-indicative clause is meant to reach a
savings-growth assumption at all**, or only a rate a lender might offer. If the latter, this closes as
not-applicable and the rule's wording should say so.

---

## G118. "toward" and "towards" are both in participant copy, in thirteen places. OPEN - LOW PRIORITY

*Raised 31 August 2026 by the `fca-copy-check` pass (D104). **The brief that raised it expected eight
instances; there are thirteen**, so the standardisation sweep was not taken and the single string that
prompted it was matched to its own screen instead.*

Thirteen instances of "toward" in participant-facing copy, across `/consent`, `/consent/move-account`,
`/position/summary` (four), `/goal-check`, `/calculator/result`, `/tracker`, `/mip/result/not-yet` and
`/assumptions/sources`. Both forms are valid British English; the inconsistency is the finding, and
"towards" is the more common British form of the two.

**What was done instead.** `goalAttainedBody` was drafted with "towards" and would have put both forms
on one screen beside `goalHeading`'s "What you would save toward". It now reads "toward", matching its
own screen. **No screen currently carries both forms.**

**None of the thirteen is on frame 10**, so the freeze was never at issue - checked rather than
assumed.

**Low priority.** No participant has remarked on it, both forms are correct, and a thirteen-string
sweep touching eight routes is a copy pass of its own rather than a tail on someone else's.
