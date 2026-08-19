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
