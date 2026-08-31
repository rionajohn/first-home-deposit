# Durations become dates, and saved amounts become figures

*Implementation plan, 31 August 2026. Written from the 31 August 2026 pilot session. **Plan only -
nothing in this document has been implemented.** Frame 10 is frozen and stays frozen; see "The frame
10 boundary" below, which is the one section that must be read before any file is opened.*

Working branch `build`, tree clean at `db7445c`.

---

## 1. What the pilot found, and what these two rules are

The results screen (frame 12, `/calculator/result`) draws a growth chart and a comparison card. The
participant liked the chart on sight and could not read a number off it.

| Time | What they said | What it points at |
| --- | --- | --- |
| 21:42 | "I don't have a y-axis to know what the value is. I can't hover and see what the values are either." | The chart has two y labels (`yTop`, `yBottom`) and no interaction |
| 22:04 | "even if I had to choose between one or the other, I'd have no clue as to how much this actually would be... assuming I did the minimum, how much would I then have?" | The two plotted series are `monthly-low` and `monthly-high` and neither has a figure |
| 23:28 | "I still don't know whether I would choose to have it at 200 pounds a month or 400 quid." | The chart's purpose - choosing a contribution - is unserved |
| 24:27 | (asked for a footnote marker) | `compareProvenanceCaption` floats free of the figures it describes |
| 24:48 | (objected to being shown options they had not chosen) | The comparison card's three rows read as rejected alternatives |
| 26:20 | "how long, like max should be, how long it will take me to get to that amount of money." | On `/learn/ltv`, which shows three deposit amounts and no time figure at all |
| 18:39 | "Just see the diagram first of which you can then switch to a table." | Asked in a different context; adopted here |

**Rule 1.** A projection expressed as an elapsed duration becomes a calendar month and year. "26 yr
4 m" becomes "March 2029". The participant does not add a duration to today's date in their head.

**Rule 2.** The amount saved at a given point is shown as a figure, not inferred from a bar height.

Both rules are calculator-wide. A chart showing "March 2029" above a comparison row showing "26 yr
4 m" contradicts itself and has not been fixed.

---

## 2. The duration audit - every surface, and what happens to it

This is the complete sweep. It was taken by following `formatMonthsDuration` (the only duration
formatter in `format.js`), every `{months}` and `{years}` slot in `content.js`, and every screen that
imports `monthsToTarget`, `monthsToReachAmount` or `monthsToGoalUnaided`.

### 2.1 In scope - converted

| # | File | Line | What renders | Becomes |
| --- | --- | --- | --- | --- |
| 1 | `src/screens/calculator-result.js` | 179 | Comparison card value, `compareWithinTemplate` -> `formatMonthsDuration(Math.ceil(monthsLater), { abbreviated: true })`. **This is the "26yr 4m" string from the transcript.** | The calendar month the goal at that deposit percentage is reached |
| 2 | `src/screens/calculator-result.js` | 219 | Each bar group's `aria-label`, `formatMonthsDuration(p.months)` | The calendar month that mark stands for |
| 3 | `src/screens/calculator-result.js` | 223 | `xAxisLabels` - three of the four are `formatMonthsDuration(..., { abbreviated: true })`; the fourth is `c.xAxisNow` | Calendar months; see section 6.4 for how many and where they sit |
| 4 | `src/screens/calculator-result.js` | 260 | `chartRangeAnnouncementTemplate`'s `{range}` slot, `formatMonthsDuration(rangeMonths)` | The calendar month the window ends at |
| 5 | `src/content.js` | 955 | `beyondWindowNote`, "This could take more than 5 years at your current rate." | Retired. It exists because the model stops projecting in detail at 60 months and the screen could then say nothing more. Once the endpoint line (requirement 3) names the attainment month unconditionally, the note restates a limit the participant can no longer observe. See 6.7 |
| 6 | `src/screens/mip-result-not-yet.js` | 111 | Frame 21 step 1, `step1CaptionTemplate` "Around {months} at what you're putting aside each month", unabbreviated | "By {date} at what you're putting aside each month" |

### 2.2 In scope - added, not converted

| # | File | What is missing | Why it is here |
| --- | --- | --- | --- |
| 7 | `src/screens/learn-ltv.js`, lines 127-160 | The comparison table has five rows - Deposit, Loan-to-Value, Typical rate, Monthly, Interest - and **no time row at all**. There is no duration on this screen to convert | The 26:20 quote was asked on this screen. What the participant wanted is a figure that does not exist, so this is an addition. See 8.3 |

### 2.3 In scope - already correct, and the format to match

| # | File | Line | What renders |
| --- | --- | --- | --- |
| 8 | `src/screens/tracker.js` | 403 | `formatMonthYearRange(onTrack.value.low, onTrack.value.high, RATES.asAt)` - "On track for: March 2029 to June 2029". The Insights projection. **Its anchor is wrong and section 4 fixes it** |

### 2.4 Out of scope - a duration that is correct

| File | What | Why it stays |
| --- | --- | --- |
| `content.js` 925-929 | The window chips, `6 m` / `1 yr` / **`2 yr`** / `5 yr` / `Max`, and their `ariaLabel`s (see 6.1 - "2 yr" replaces "3 yr" and becomes the default) | **Confirmed in scope to stay, 31 August 2026.** A window is a length by nature: "show me the next six months" is not a projection and has no arrival date. **The distinction, stated so it is not relitigated: the chip says how much you are looking at; the axis and the figures say what you are looking at.** The chip names the span in view, which is a control setting; every other duration on this screen named an arrival, which is a claim. That is why one duration survives a screen-wide conversion. And because the chip is a span while the axis beneath it reads calendar years, **the two do not compete** - "2 yr" over an axis marked "Now, 2027, 2028" reads as the length of what is drawn, not as a second, contradictory date format |
| `content.js` 1009, 1011, 1014 | `tableInterestRowLabelTemplate` "Interest, {years} yrs", `bannerTextTemplate`, `comparisonCaptionTemplate` - all `MORTGAGE_TERM_YEARS` | A mortgage term. Not a projection to an arrival |
| `content.js` 1622 | `inflationExclusionTemplate`, "will not buy the same in five years as it does today" | An illustrative horizon in an exclusions list, with no arrival |
| `content.js` 1280 comment | The retired `onTrackBeyondWindowValue` ("More than 5 years") | Already deleted by D68's amendment |
| `src/format.js` 93-115 | `formatMonthsDuration` itself | See 9.2 - it ends this pass with **zero callers** and is kept anyway |

### 2.5 Screens checked and carrying no duration

`calculator-review.js` (frame 11) calls `monthsToTarget` only to commit `months-to-target` on "Work
it out" (line 381); it displays no duration. `calculator-property.js`, `position.js`,
`position-summary.js`, `goal-check.js`, `goals.js`, `journey.js`, `assumptions-*.js`,
`mip-result-likely.js` and `settings.js` render no elapsed duration.

---

## 3. The frame 10 boundary - reported, not touched

**Frame 10 (`/calculator/saving`) is frozen at `1c44d75` until the G107 measurement has run.** It has
taken four changes since D93: D94's heading, D95's caption, D96's list direction, and D84's revision
moving the moved-date disclosure below the controls. G107's own record states that nothing further
lands on it until the next moderated session. This plan does not change it.

### 3.1 Every time-shaped string on frame 10, reported

**Frame 10 renders no elapsed duration anywhere.** The sweep in section 2 does not reach a single
string on this screen. That is the finding, and it is the reason the freeze costs this pass almost
nothing. For completeness, everything time-shaped on the screen, all unchanged:

| Key in `content['/calculator/saving']` | String | Form |
| --- | --- | --- |
| `segmentDateLabel` | "Set a target date" | Names a date, no duration |
| `pickOneCaption` | "Set an amount and we'll show you the date. Set a date and we'll show you the amount." | Names a date, no duration. D95, and inside G107's measurement |
| `dateStepperHint` | "Change the date to see what you'd need to put aside each month." | No duration |
| `dateStepperMonthAriaLabel` / `dateStepperYearAriaLabel` | "target month" / "target year" | Control names |
| `dateMovedToEarliest` | "We've moved your date. {earliest} is the earliest you could save your deposit." | `{earliest}` is already a month and year |
| `dateMovedToCap` | "Good news - you'll get there sooner than that now. We've moved your date to {earliest}." | Already a month and year (D86) |
| `errorDateNeedsMoreThanLeftOver` | "...the earliest you could reach your goal is {earliest}." | Already a month and year. Superseded by D82, not rendered |
| `errorPastDate` | "Pick a date in the future." | Superseded by D83, not rendered |
| `sliderCaption`, `sliderRangeCaptionTemplate` | "Put aside each month", "{max} is what's left each month..." | A rate, not a duration |
| `dateGoalAlreadyMet` | `[AWAITING COPY]` (D85) | Not yet written; outside this pass |

The month and year the two lists offer are built in code, not copy:
`dateAtMonths()` at `calculator-saving.js:201`, from `earliestWorkableMonths()` at 182 and
`monthsToGoalUnaided()` at 274.

### 3.2 Where the sweep WOULD reach frame 10, and where it stops

**It reaches it once, through the anchor.** `calculator-saving.js` reads the wall clock in three
places:

| Line | Call | What it decides |
| --- | --- | --- |
| 144 | `const now = new Date()` inside `monthsFromNow()` | Months from today to the selected date |
| 202-203 | `new Date()` inside `dateAtMonths()` | The month and year both lists are built from |
| 238-243 | `new Date()` in the seeding block and the two `??` fallbacks | The initially selected date |

Section 4 introduces a stamped session anchor and moves every other screen onto it. Moving these
three onto it is the correct end state. **It is a change to a frozen file, so the sweep stops here.**
Frame 10 keeps `new Date()` until the G107 session has run.

### 3.3 The transitional state, recorded

Frame 10 will anchor on the wall clock while frames 12, 21, 13 and the tracker anchor on
`state.sessionAnchor`. **Record this as a known transitional state in `GAPS.md`, with the three line
numbers above, so the sweep can be completed in one pass after the session.** Do not resolve it by
changing frame 10.

**It is provably unobservable at month granularity, and this is worth stating because it bounds the
cost.** Section 4's discard rule retires a session whose anchor month is not the current month. So
inside any live session `new Date()` and `state.sessionAnchor` fall in the same calendar month, and
`dateAtMonths()` and `formatMonthYear()` both floor to the first of a month. The two cannot name
different months while a participant is looking at them. The only way to see a disagreement is to
hold a session open across midnight on the last day of a month, which the discard closes on the next
load. **The freeze therefore costs nothing that a session can observe**, which is the whole reason
this plan can be built with frame 10 untouched.

---

## 4. The anchor, and D59

### 4.1 The problem, and the two anchors that already exist

Calendar dates need a "today". Durations did not. A stale anchor produces wrong years with nothing on
screen to reveal it, so a screenshot taken during a session cannot be interpreted afterwards.

**Two different anchors are already in the codebase and they already disagree.**

| Screen | Anchor | Value today (31 August 2026) |
| --- | --- | --- |
| `tracker.js:403` | `RATES.asAt` (D3 - "everything in this prototype is dated from the pinned rate") | `2026-07-30` |
| `calculator-saving.js` 144, 202, 238 | `new Date()` | 2026-08-31 |

The tracker's "On track for" dates are therefore **one calendar month early**, today, in the running
build. D3's reasoning was that the rate must not drift between sessions; it was applied to the
*rendering date* as well, which is a different fact. A rate is pinned so figures do not move. A
"today" must be current or every date derived from it is wrong.

### 4.2 The decision

**A session anchor, stamped once at session start, beside the build version, discarded under an
extension of D59's rule, and surfaced on frame 33.**

| | |
| --- | --- |
| **Key** | `sessionAnchor`, an ISO `YYYY-MM-DD` string. Written by `defaultState()` in `src/state.js`, beside `buildVersion` and for the same reason - it lives inside the store so everything that already reads the stored object keeps working on the same shape |
| **Written** | Once, at session start. Never rewritten by a screen. It is not a section 6 figure, not a scenario control, and no screen may derive it |
| **Read** | By every screen that renders a date, passed into `formatMonthYear`, `formatMonthYearRange` and `formatFullDate` as the `fromDate` parameter those functions already take |
| **Discarded** | In `load()`, alongside the existing `buildVersion` check: if `stored.sessionAnchor`'s **month** is not the current month, the session is discarded whole and a fresh one written back - exactly the branch D59 already built, with a second reason to take it |

**Month granularity, not day.** Day granularity would discard a session overnight in a multi-day
facilitator setup for no gain, since every date derives from a month floor. Session granularity (never
discard) is the failure mode the brief names.

**Discarded whole rather than re-stamped, and that is the load-bearing choice.** Re-stamping keeps the
session and silently moves every projected date, so a screenshot taken before the boundary and one
taken after disagree with nothing on screen to say why. D59's own record gives the reason discarding
whole is safe where merging is not: what comes back is exactly a first load, which every screen
already handles. The cost is a session lost across a month boundary, which no moderated session spans.

**`RATES.asAt` keeps its job and loses this one.** It stays the provenance date on frames 29/30/31 -
"the Bank of England Bank Rate as at 30 July 2026" is a true statement about the rate. It stops being
the argument to `formatMonthYearRange` on the tracker.

**Derived from the stamped anchor at render, never cached.** No module-level `const TODAY`. Every
call site reads `state.sessionAnchor` at render time, so a discard-and-restart is visible immediately
rather than at the next reload.

### 4.3 Frame 33

`settings.js:156` renders `buildCaptionTemplate` with `{version}`. A **new** key -
`anchorCaptionTemplate`, rendered through `formatFullDate(state.sessionAnchor)` - is drawn on the line
beneath it. New key rather than a second slot in the existing one, so the build caption's wording,
which G-numbered work has already been through, is untouched.

### 4.4 D3 is amended, not reversed

`RATES.asAt` still governs every rate figure and every "as at" caption. What changes is that D3's
"everything in this prototype is dated from the pinned rate" no longer covers the date a projection
is measured *from*. Record this as an explicit amendment to D3 inside the new decision entry, because
the tracker's current behaviour is D3 correctly applied to the wrong kind of fact.

---

## 5. The flip point, one bounding rule, and the attained state

*Read `GAPS.md` G98 in full before implementing this section. What follows is built on its measurement
and on D85, which closed the reachable half of it.*

### 5.1 What already exists

D85 capped frame 10b's date list at the month the balance reaches the goal with **no contribution at
all** - `monthsToGoalUnaided()` in `model.js:441`, the closed form
`n = ln(goal / p0) / ln(1 + r)`, rounded **down**. The list's floor is the same question at the
participant's **`left-over`** - `earliestWorkableMonths()` in `calculator-saving.js:182`, through
`monthsToReachAmount()`, rounded **up**.

G98's own recommendation names why these are the same rule: "both are `monthsToReachAmount`-shaped
answers about when the balance meets the goal, one at `left-over` and one at zero."

### 5.2 The one rule

> **The bound is the month at which a balance, growing at the Bank Rate with a given amount added at
> the start of each month, first equals `combined-goal`. Every bound in the calculator is that one
> function evaluated at a different contribution. There is exactly one attained state, and it is
> `saved-toward-deposit >= combined-goal`.**

| Consumer | Contribution | Today |
| --- | --- | --- |
| Frame 10b's list floor | `left-over` | `earliestWorkableMonths()` -> `monthsToReachAmount()` |
| Frame 10b's list cap | zero | `monthsToGoalUnaided()` |
| **Frame 12's projection end** | the contribution being plotted | **does not exist - this is what is built** |
| **Frame 12's comparison rows** | `monthly-low`, against each deposit percentage's own goal | exists (line 175) and is already this shape |
| **Frame 13's new time row** | `savings-rate` | see 8.3 |

**Rounding is per-consumer and each direction is chosen by which error is unsafe there.** D85 already
established this and departed from D2 on exactly this reasoning. The rule is one; the rounding is not.

| Consumer | Direction | Because |
| --- | --- | --- |
| Frame 10b's cap | **down** (D85, unchanged) | Rounding up readmits the first month whose solved payment is negative |
| Frame 10b's floor | **up** (D2, unchanged) | Rounding down offers a date that is not reachable |
| Frame 12's projection end | **up** | Rounding down ends the chart the month before the goal is met, drawing a final bar below the goal beside a label saying it is reached |

### 5.3 What is built in `model.js`, and what is not

**Build one function**, beside the equation it bounds:

```
goalMonths(state, monthlyAmount)   ->  { value, provenance, error }
```

the signed annuity-due crossing to `combinedGoal(state)` from `saved-toward-deposit` at
`monthlyAmount`, with the `monthlyAmount === 0` case falling through to `monthsToGoalUnaided`'s
closed form. Signed: a negative value means the crossing is in the past, which is a real state and not
an error - the contract `monthsToGoalUnaided` already documents.

```
goalAttained(state)   ->  boolean
```

`saved-toward-deposit >= combined-goal`. One predicate, one place.

**Do not change `monthsToGoalUnaided`, `monthsToReachAmount`, `monthsToTarget`, `onTrackFor`,
`rangeFromCentral` or `monthlyAmountFromDate`.** `monthsToGoalUnaided` is called by the frozen file;
its returned values must stay bit-identical, and `date-ceiling.test.mjs` passing unchanged is the
proof. `monthsToReachAmount`'s `Infinity` at a non-positive contribution is deliberate and documented
and is the right answer to the question that function asks.

**Frame 10b is not migrated onto `goalMonths` in this pass.** It already implements the rule by two
routes and cannot be edited. Migrating its floor and cap onto the shared function is the second half
of the post-session pass recorded in 3.3, in the same commit that moves it onto the anchor.

### 5.4 The attained state

`goalAttained(state)` is true. On frame 12 today this is computed inline at line 118 as `goalMet` and
does three things: it drops the "Max" chip, it guards the range resolution, and nothing else. Bounding
the projection at attainment makes it a whole-screen state.

**No past date, no zero-length bar and no negative figure may appear anywhere on the screen.** The
required behaviour, mirroring what D85 built for frame 10b:

| Element | Attained |
| --- | --- |
| The chart | **Not drawn at all.** A projection with no length is a plot with nothing in it, and letting a participant read a flat line as an answer is worse than not drawing one. D85's precedent, for D85's reason |
| The window chips | Not drawn - there is no window to choose |
| The series control and readout | Not drawn - there is no amount still to save |
| The endpoint line | Replaced by a statement that the goal is covered by what is already saved. **`[AWAITING COPY]`** |
| The table view and its toggle | Not drawn |
| **The comparison card** | **Still drawn.** D46 - the discarded values stay visible. Rows whose own goal is already covered take `compareAlreadyLabel` ("already saved"), which exists at line 176; rows still ahead take their date |
| `unreachableHeadline` / the empty-state card | Untouched - a zero savings rate is a different state and keeps its own card |
| Continue ("Save my goal") | Enabled. Unlike frame 10b, this screen's forward action still means something |

**Partial attainment is a real case and already handled.** With a 25% deposit selected the neighbours
are 20% and 30%; a participant can be past the 20% goal and short of the 25% one. The comparison card
resolves each row against its own `goalAtPct` (line 174) and already renders `compareAlreadyLabel`
per row. That behaviour is kept exactly.

**A chip longer than the projection is not offered.** With attainment at 40 months the "5 yr" chip
would draw 20 months of chart past the goal, which requirement 5 forbids. Filter the chip list at
`attainmentMonths`, the same way line 265 already filters the "Max" chip at `goalMet`. Near the goal
the chip row shortens; that is correct and is the same shape as `CHART_MIN_RANGE_MONTHS`'s existing
floor.

---

## 6. The chart

*Amended 31 August 2026, after the four open decisions below it were settled: default window B at 24
months, a years-only x-axis, and a line with plotted points and an interactive point detail in place
of bars. Everything the amendment displaces is marked rather than deleted, because two of the
displaced things were themselves decisions.*

### 6.1 The default window - SETTLED: option B, 24 months, endpoint carried in text

At the seeded session (`STAGE_PROPERTY_VALUE` 450,000, `saved-toward-deposit` 8,950, `left-over` 640)
attainment lands well over a decade out. Measured against `monthsToReachAmount`:

| Deposit % | `combined-goal` | At 200/mo (`monthly-low`) | At 255/mo (`savings-rate`) | At 640/mo (`left-over`) |
| --- | --- | --- | --- | --- |
| 5% | 30,000 | 81 mo (Jun 2033) | 67 mo (Apr 2032) | 30 mo (Mar 2029) |
| 10% | 52,500 | 151 mo (Mar 2039) | 126 mo (Mar 2037) | 59 mo (Aug 2031) |
| 15% | 75,000 | 207 mo (Dec 2043) | 176 mo (May 2041) | 86 mo (Nov 2033) |
| 20% | 97,500 | 256 mo (Dec 2047) | 219 mo (Dec 2044) | 111 mo (Dec 2035) |
| 25% | 120,000 | 298 mo (Jul 2051) | 258 mo (Feb 2048) | 134 mo (Nov 2037) |

**The window opens at 24 months.** The projection still ends at goal attainment (requirement 5, and
section 5's bounding rule); the chips still reach it; what changes is where the chart opens.

**Why this reverses D73's amendment, restated.** D73 moved the default from five years to "Max" so
"a participant sees the shape of the thing before they narrow it" - which assumes the barrier was
**not seeing the whole projection**. The pilot showed the barrier was **being unable to read any
value off it**: at 21:42, "I don't have a y-axis to know what the value is"; at 23:28, "I still don't
know whether I would choose to have it at 200 pounds a month or 400 quid". **Widening a window cannot
fix an unreadable chart, and narrowing one cannot break a readable one.** Requirement 1 now puts a
figure on screen unconditionally, so the window is free to serve the question the participant could
not answer, which is a near-term one. That is the reason, and it is not "the shape was legible and
the numbers were not" - the shape was never the thing that failed or the thing being traded away.

**A consequence that must be built with it: the chip set changes.** `chartRangeMonths` would default
to 24, which is not one of the five chips (6, 12, 36, 60, null), leaving the group with nothing
pressed - the state D73 explicitly rejected because there is then no way back to the default once a
chip is pressed. A **sixth** chip does not fit: `components.css:1952` records the measured row as
"334px of a 350px column", 16px of slack at five chips. So **the "3 yr" chip is replaced by "2 yr",
the count stays at five, and "2 yr" is the default.** Chips become 6 m / 1 yr / 2 yr / 5 yr / Max.
Measured again in `overlap.test.mjs` at both text sizes, since "2 yr" is one character wider than
"3 yr" is not - the widths are identical - but the row has not been re-measured since D75.

### 6.2 Requirement 1 - the readout. This is the primary fix

**The screen has no selection between contributions today.** The chart plots `monthly-low` and
`monthly-high` as a stacked band with a legend and nothing to select. "200 pounds a month or 400
quid" is a choice the screen never offered.

**Add a series selection**, `chartSeries: 'low' | 'high'`:

- Rendered through the existing `pillSegmentsHTML` (`ui.js:1835`), above the chart, labelled from the
  two contributions - the existing `legendTemplate` ("At {amount} a month") already carries the right
  words and is reused rather than duplicated.
- **A view setting, exactly like `chartRangeMonths`.** Added to `state.js`'s defaults, **not** added
  to `STAGE_KEYS`, and it **never writes a section 6 figure**. It changes what the chart draws and
  never what the model projects - D73's own words for the range control, and the standing state rule.
- Re-render through `rerenderInPlace` (`ui.js:321`), the path the range chips already use, so the
  chart redraws under the participant's thumb and focus returns to the pressed control.

**The readout is always visible, and it always reports the active point.** Two states, not three -
6.6.2b collapsed the third:

| State | Readout shows |
| --- | --- |
| **At rest** - the last point in the window is active (6.6.2b) | The amount at the **window's end** for the selected series |
| A point activated by scrub, hover, click or keyboard | The amount at **that point**, for the selected series |
| Escape | Returns to the last point in the window - **the at-rest state, not an empty one** |

`figureDisplayHTML({ value, caption, live: true })` (`ui.js:674`). **The caption always names the date
the figure belongs to**, so a scrubbed value cannot be misread as the window-end value: the figure and
its date move together or not at all.

> **"At rest" and "the window's end" are the same state, and that is why this is two rules rather than
> four.** The previous draft specified an at-rest readout of the window's end *and*, separately, an
> active point that could be anywhere. 6.6.2b makes the at-rest active point the last one, so the two
> definitions coincide and there is one rule: **the readout reports the active point, always.**

**The readout and the in-plot labels are the same figure, never two.** 6.6.0 draws the value at the
y-axis edge and the date above the point, because on touch the participant's eye is at the finger and
the readout may be under their hand. Both are rendered from the **same active index**, so they cannot
disagree - and if in layout they read as two answers rather than one fact in two places, **the in-plot
label is the one to drop, not the readout**: 6.9 makes the readout load-bearing for every participant
who does not interact, and the in-plot label is an enhancement for the one who does.

### 6.3 Requirement 2 - a labelled y-axis

`growthChartHTML` takes `yTop` and `yBottom` and draws two absolutely-positioned labels. It gains a
`yTicks` array - four or five values with their percentage positions - drawn as labelled gridlines in
the 48px left gutter that already exists (`screens.css:1209`). `yTop` and `yBottom` become the first
and last tick rather than separate parameters.

Tick values come from a rounding helper so the axis reads in round pounds rather than in
`maxScale / 4`. That helper is new and lives in `format.js` beside the other display rules, not in
the screen.

The y-axis is also what the point detail's guide (6.6) terminates on, so its labels are load-bearing
twice over: they are the static reading of requirement 2 and the destination of the interactive one.

### 6.4 Requirement 4 - the x-axis carries years only, positioned as a scale

**P10, measured.** `.growth-chart__bars` draws `pointCount` (up to 12) groups with
`justify-content: space-between`; `.growth-chart__x-axis` draws 4 labels in a separate flex row, also
`space-between`. Same padding, different counts, so **no label sits under the mark it names**, and
the first label ("Now") sits under the first bar, which is at `rangeMonths / pointCount` months and
not at zero. The participant counted 11 bars against 4 axis labels and was right.

**The fix is now stronger than the one this section originally proposed, and supersedes it.** The
first version made the axis one flex cell per point, so a label sat under its own mark. With a
years-only axis a label no longer names a *mark* - it names a *moment*, and there may be no mark
there at all. So:

> **The x-axis becomes a scale, not a row of captions.** Each label is absolutely positioned at
> `(monthsFromAnchorTo(1 January of that year) / rangeMonths) * 100` percent of the plot width, in the
> same coordinate space the line is drawn in. A label at x% names the moment at x%, whether or not a
> point falls there.

That closes P10 by a property rather than by an adjustment: labels and marks can no longer disagree
about position, because both are placed by the same linear time mapping instead of by two independent
flexbox distributions.

**The origin carries "Now", not a year.** At a window opening in August 2026, a "2026" label at x=0
would name January 2026, which is behind the participant. `c.xAxisNow` is kept and is the only
non-year label on the axis.

**How many year labels, and the thinning rule.** Measured against the real geometry:

| | |
| --- | --- |
| Frame width | **393px** logical (`shell.css:22`, `--frame-width`) |
| `.screen-content` padding | 20px each side (`--screen-inset-x`) -> content 353px |
| Plot gutter | 48px (`.growth-chart__plot` padding-left; `.growth-chart__bars` is `left: 48px; right: 0`) |
| **Plot width** | **305px** |
| Label width, "2027" at footnote 13px | ~26px default, ~30px at Large (`--text-scale: 1.15`, `tokens.css:268`) |
| Minimum pitch with an 8px gap | ~34px default, ~38px Large |
| **Ceiling** | **8 year labels**, at both text sizes |

Year labels available per window, from an August anchor:

| Window | January boundaries inside it | Labels (with "Now") |
| --- | --- | --- |
| 6 m | 1 | 2 |
| 1 yr | 1 | 2 |
| **2 yr (default)** | **2** | **3** |
| 5 yr | 5 | 6 |
| Max, 148 mo at the seeded persona | 12 | 13 - **over the ceiling** |

So a thinning rule is required and is not optional at the long windows: **emit a year label only if
its position clears the previously emitted one by the minimum pitch.** Deterministic, derived from
measured text width rather than a magic number, and it degrades a 13-year window to every second year
(7 labels) rather than to an unreadable smear. `overlap.test.mjs` at Large text is where the pitch is
confirmed rather than assumed.

### 6.5 Requirement 3 - the labelled endpoint

A line beneath the chart, drawn at every window and in every non-attained state: the goal amount and
**the calendar year** it is reached in at the selected contribution. The amount at attainment *is*
`combined-goal`, so the line names the goal rather than restating a point's height. `[AWAITING COPY]`,
slots `{amount}` and `{year}`.

It is the element that carries requirement 5 in default window B, so it is not optional and not
collapsible.

**Year, not month and year. The previous draft's recommendation is overruled** - see 6.10, which now
records year-only as a claim about what the model can honestly assert rather than as a formatting
choice. **The cost of that is measured in 6.10.1 and it is not small at short horizons.** It is
reported there and left to be decided rather than resolved by quietly reintroducing a month.

### 6.6 The interactive point detail - SETTLED

*Amended 31 August 2026. The interaction model, the guide, the four touch decisions and the pointer
path are all settled below. The previous draft left the vertical guide open and treated the at-rest
state and the active state as separate things; both are resolved, and the second turns out to
simplify 6.2 rather than add to it.*

#### 6.6.0 The model, in one place

> **One point is always active.** Its value is drawn at the **y-axis edge**, at the end of a
> **horizontal guide** running from the point to the axis. Its date is drawn **above** the point. The
> whole plot area is the target: a press or a hover anywhere in it activates the nearest point
> horizontally, and a horizontal drag tracks it. **There is no hit testing on the circles.**

**The guide is horizontal and nothing else. Settled.** A vertical guide down to the x-axis would land
between year ticks and point at nothing readable - the axis carries years (6.4), so there is no mark
for a vertical drop to meet. The date is carried by the point detail, not by the axis. This closes the
"optional, to be judged in layout" the previous draft left open, and it closes it on the axis decision
rather than on taste.

#### 6.6.1 Why the target is the plot and not the points - the measurement

At the 24-month default window, plot width 305px (derivation in 6.4):

| Points plotted | Interval | Centre-to-centre |
| --- | --- | --- |
| 25 (monthly, including "now") | 1 mo | **12.7px** |
| 24 (monthly) | 1 mo | 13.3px |
| 9 (quarterly) | 3 mo | **38.1px** |
| 5 (half-yearly) | 6 mo | 76.3px |

Against 44x44px (Apple HIG, the design language this repo is held to) and 24x24px (WCAG 2.5.8 Target
Size (Minimum), AA):

| Option | Measured | Verdict |
| --- | --- | --- |
| Monthly points as targets | 12.7px | Fails both |
| **Quarterly points as targets** | **38.1px** | **Fails the 44px HIG target by 6px.** Proposed on the premise that it clears it; measured, it does not - and it costs two thirds of the line's resolution to buy a target that is still too small |
| Per-point full-height hit band | 13.3px wide | Fails in width in both standards. WCAG 2.5.8's spacing exception needs a 24px circle centred on the target not to intersect a neighbour's; at a 13.3px pitch they intersect |
| **The plot area** | **305 x 224px** | **Passes.** There is nothing to aim at, so there is no targeting problem to solve |

**The resolution is to remove aiming from the interaction**, not to enlarge what is aimed at. Full
monthly resolution is kept because nothing depends on hitting a circle.

**Plot resolution stays at 24 points**, or `rangeMonths` if fewer, replacing
`pointCount = Math.min(12, rangeMonths)`. Spacing is then constant at every window, so the snap
granularity does not change with the chip pressed. At the default window each point is one month; at
"Max" (148 months at the seeded persona) each is about six, and the table carries the monthly figures.

**Nearest-point activation is by ratio, never by pixel offset.** D92 draws the frame at a CSS scale,
so `getBoundingClientRect()` returns visual pixels while layout is in logical ones. The index is
`round(((clientX - rect.left) / rect.width) * (pointCount - 1))`, clamped - a ratio, which is
scale-invariant and correct at 1280x720 and 2560x1440 without the handler knowing the scale exists.
A handler written against a pixel offset works at one window size and silently mis-aims at the other,
which is the class of defect `frame-scale.test.mjs` exists for.

#### 6.6.2 The four things that make this work on touch

**a. The active state persists on release.** While a finger is on the screen it covers what is being
read; a detail that clears on lift can never be read. **The last activated point stays active - guide,
value and date all drawn - until another point is activated.** Nothing is cleared by lifting.

**b. A point is active at rest, on load: the last point in the window.** On touch there is no hover,
so nothing hints the chart is interactive; the mechanism has to be visible before anyone tries it.
With a point already active, scrubbing reads as **moving something that is there** rather than
discovering something hidden.

> **This collapses a redundancy in 6.2 rather than adding to it.** 6.2's at-rest readout was
> specified as "the amount at the window's end", and the at-rest active point **is** the window's end
> - so the readout at rest and the active point's value are the same figure arrived at two ways. They
> become one: the readout always reports the active point, and at rest the active point is the last
> one. 6.2's three-state table (at rest / active / dismissed) becomes two, and **Escape returns to
> the last point rather than clearing to nothing.**

**c. Nothing renders under the thumb.** The value sits at the **y-axis edge**, left of the plot. The
date sits **above** the active point. A label beneath the point is under the finger on every single
interaction, so below is not available.

**d. Vertical scroll must keep working.** `touch-action: pan-y` on the plot area: vertical gestures
scroll, horizontal gestures scrub. Reported in 6.6.4.

#### 6.6.3 The topmost-point collision, measured - and it is real

*2.2c requires the date label above the point. The check asked for is whether that holds at the top of
the window, and it does not, as things stand.*

| | |
| --- | --- |
| Line area height (`.growth-chart__plot` 240px less the 16px baseline offset) | **224px** |
| D73's headroom rule, `maxScale = max x 1.05` | Topmost point at 1/1.05 = **95.24%** of the plot |
| Headroom above the topmost point | **10.7px** |
| Space a date label needs: active-point radius ~6px + 4px gap + `--text-footnote-line` 18px | **28px** default |
| At Large text (`--text-scale: 1.15`, footnote line 20.7px) | **30.7px** |

**It collides by 17.3px at default text and 20px at Large**, at the top of every window - which is not
an edge case, because the last point in the window is the highest point and 6.6.2b makes it the
at-rest active one. **The default state of the screen is the colliding state.**

**Recommended fix: reserve the headroom in the scale.** `maxScale` goes from `max x 1.05` to
**`max x 1.20`**, which puts the topmost point at 83.3% and leaves **37.3px** - 6.6px of slack over
the Large-text requirement. One code path, no flipping, deterministic, and testable.

**What it costs, stated, because it edits a D73 rule.** D73 set the 5% headroom so "the axis follows
the curve", moving the curve from 44% of the plot to 95%. This gives back 12 points of that: the curve
tops out at 83%. **Against D73's own starting point of 44% that is still nearly double**, and the
headroom is not waste - it is the space the date label occupies. Record it as an amendment to D73's
headroom figure, not as a new rule.

**The alternative, recorded and not recommended.** Pin the date label to the **top edge of the plot**,
tracking the point horizontally and clamping at the ends. It costs no curve height and removes the
collision class outright rather than sizing around it. It is not recommended because it separates the
two halves of the detail - the value at the point's height on the left, the date at a constant height
above - so neither is adjacent to the point, and adjacency is what associates them. **If the 12 points
of curve height are judged too expensive in layout, this is the fallback**, and it is a layout call
with both numbers already measured.

**Flipping the label below the point when it would collide is rejected outright**, by 6.6.2c: below is
under the thumb, and a rule that puts it there in exactly the default state is worse than either.

#### 6.6.4 `touch-action: pan-y`, and how it behaves in the framed view

`touch-action: pan-y` on the plot area. The browser handles the direction lock: a vertical-ish gesture
pans and never reaches the handler; a horizontal-ish one is delivered as pointer events.

**In the framed view (D92):**

- The nearest scrollable ancestor is `.screen-content` (`overflow-y: auto`), so a vertical gesture
  starting on the plot scrolls the screen exactly as it does from any other element.
- At short window heights D92 lets **the page outside the frame** scroll too, so the frame's bottom is
  reachable (`shell.css:105`). A vertical gesture that exhausts `.screen-content` chains to the
  document by ordinary scroll chaining. `pan-y` permits both; neither needs special handling.
- **Horizontal panning is not being stolen from anything**: `overflow-x` is hidden in both views
  (`shell.css:109`), so there is no horizontal scroll for the plot to compete with.
- **When the browser commits to a vertical pan it fires `pointercancel`.** The handler must **leave
  the active point where it is** rather than clearing it - which 6.6.2a already requires for a
  different reason, so the scroll case is handled for free.

**If this is not handled the chart either traps the scroll or never receives the gesture.** Both are
unrecoverable by a participant mid-session, which is why it is specified here rather than left to the
build.

#### 6.6.5 The pointer path is the one that will actually be observed

**State this plainly, because it sets the priority order.** Sessions run the prototype in a phone
frame in a desktop browser over Teams. **Participants will use a mouse, not touch.** The touch design
has to be right for the artefact to be credible and for the write-up, but **the interaction observed
in the study is hover and click.**

| | |
| --- | --- |
| **Hover** | The guide follows the pointer across the plot area, **without requiring a click**. Same nearest-point ratio as the scrub |
| **At rest** | 6.6.2b's active point applies equally with a pointer. **It is the discoverability affordance in both modes** - with a mouse there is at least a cursor to move, but nothing says the chart responds until something visibly does |
| **Click** | Pins the active point, so it survives the pointer leaving the chart |
| **Keyboard** | Arrow keys traverse points, the guide follows **focus**, per 6.6.6 |

**One consequence for the touch work.** `touch-action` never fires on the observed path - a mouse
wheel over the plot scrolls `.screen-content` normally, and a mouse drag does not scroll. 6.6.4 is
therefore correctness for the artefact rather than a risk to the study, and it should be built and
tested but not prioritised over the hover path if the two ever compete for time.

#### 6.6.6 Keyboard

The plot is a single focus stop with `aria-activedescendant` pointing at the active point, arrow keys
moving between points, Home and End to the ends, and Escape returning to the last point (6.6.2b).
**This is D84's listbox contract applied to a different control**, not a new pattern: `dateSelectHTML`
/ `bindDateSelect` (`ui.js:937`, `1005`) already implement it, and `date-ceiling.test.mjs`'s last
eleven tests already read it off the same attributes a screen reader reads. Reuse the pattern; do not
reuse the component.

The guide draws on **focus**, not only on pointer events.

#### 6.6.7 WCAG 1.4.13, and why 6.6.2b changes the answer

The previous draft satisfied 1.4.13 by construction, with the detail rendered into a fixed readout.
**6.6.2b gives a stronger answer: 1.4.13 does not bind here at all**, because no content is *revealed*
by hover or focus. A point, a guide, a value and a date are on screen before anything is touched;
hovering moves an element that is already there rather than producing one that was not.

The three criteria are met anyway, and are worth stating so the claim is checkable rather than
asserted:

| Criterion | How |
| --- | --- |
| **Dismissible** without moving the pointer | Escape returns to the last point in the window - the at-rest state, not an empty one |
| **Hoverable** | The value and date are in the plot, on the pointer's own path; moving within the plot moves them rather than dismissing them |
| **Persistent** | The active point is state. It survives release on touch (6.6.2a), pointer-leave once clicked (6.6.5), and `pointercancel` from a scroll (6.6.4) |

#### 6.6.8 The remaining accessibility requirements

- **1.4.1, no colour alone.** The active point is distinguished by **size and shape** - a larger radius
  with a ring - never by a fill change alone.
- **prefers-reduced-motion.** The line's draw-in and any transition on the guide or the point drop to
  an instant state change under `@media (prefers-reduced-motion: reduce)`. The repo has the pattern in
  three places already (`components.css:642`, `2970`; `sheet-drag.js` handles the script-driven case,
  `screens.css:427`). **Nothing in the interaction depends on motion**: the snap is a state change,
  not an animation, so the reduced-motion path is the same interaction with no tweening.
- **The table is the equivalent, not the fallback**, and it must expose every value the guide can
  reveal - guaranteed by construction, since both render the same points array (6.7). Under 6.10 it is
  also the only finer-than-year date resolution on the screen at rest, which is why 6.9 makes its
  toggle a hard condition.

#### 6.6.9 What the detail carries, and why month and year is consistent with 6.10

**The scrub detail carries month and year.** So does the table (6.7). Every other date on the screen
is a year (6.10). That is a distinction in kind, not an exception:

| | What it is | Granularity |
| --- | --- | --- |
| Endpoint line, comparison rows, axis | **A claim the screen makes at rest**, unprompted, about when the participant arrives | **Year** |
| Scrub detail, table row | **An answer to a question the participant asked**, about a position they are touching or a row they opened | **Month and year** |

**The month in a scrub result is a coordinate, not a prediction.** It says *where on this line your
pointer is* and *what the curve reads there* - the same fact the x-axis would carry if it were fine
enough to. It is not an assertion that the participant will hold that amount in that month; it is a
readout of a plotted position. The endpoint line, by contrast, is the screen volunteering a date for
an event, which is exactly the claim 6.10 says the model cannot make to the month.

**6.6.2b sharpens this rather than weakening it.** A point is active at rest, so a month is on screen
before anyone interacts - which looks like a claim at rest until you see which month it is: the
window's end, a position on the drawn line, not the arrival. The arrival is the endpoint line, and
that is a year.

That distinction is also what keeps the interaction an enhancement rather than a second, contradictory
set of figures: the scrub can be finer than the claims because it is not making one.

### 6.7 Requirement 6 - the table view

A toggle above the chart, `chartView: 'chart' | 'table'`, a view setting on the same terms as
`chartSeries`. A new `chartTableHTML` in `ui.js` renders the **same points array** the chart renders -
one row per point, columns: date, at the low contribution, at the high contribution, with the selected
column marked in words. A real `<table>` with `<th scope>`, which is what makes it the text
alternative.

**It must expose every value the point detail can reveal**, which the shared points array guarantees
by construction: both views render the same array, and neither recomputes.

**Its date column carries month and year**, not years only - consistent with 6.10 for 6.6.9's reason:
a table row is an answer to a question the participant opened, and a column of repeating years would
not identify its own rows. **Under 6.10 this column is the only finer-than-year date resolution
anywhere on the screen at rest.**

**The toggle is a peer control, not a hidden affordance**, and 6.10 makes that a hard condition rather
than a matter of emphasis: it is asserted in `overlap.test.mjs`, and if it cannot be made to pass, the
year-only decision goes back. See 6.9.

### 6.8 Requirement 7 - nothing carried by colour alone

The two series already clear 3:1 against each other and against the plot in both themes (D73's
amendment) and each legend row already carries the fill of the series it names (G90). Two things are
new and neither may be carried by colour:

- **The series selection** - the pill control carries `aria-pressed` and visible text, and the
  readout caption names the selected contribution in words.
- **The active point** - size and shape, per 6.6.4.

### 6.9 What the point detail must not become

**The always-visible readout (6.2) and the endpoint line (6.5) both stay. The point detail is
additional.** This is load-bearing and not a style note.

The pilot failure at 21:42 was two failures in one sentence: "I don't have a y-axis to know what the
value is" **and** "I can't hover and see what the values are either." Making the interaction the only
route to a value fixes the second half and **reintroduces the first** for every participant who does
not think to interact, cannot interact, or is reading a screenshot.

So: at rest, with nothing touched and nothing focused, the screen shows a labelled y-axis (6.3), a
figure in the readout (6.2), and the endpoint amount and month (6.5). The interaction adds the values
in between. It never becomes the only route to any of the three.

**Where the axis/detail division does and does not hold up, stated.** The division is: the axis gives
orientation, the point detail gives the value and its date. At the 24-month default the axis reads
"Now, 2027, 2028", so a point at 60% is somewhere in 2028 and the axis cannot say where - the detail
says "March 2028". For a participant who interacts, that is a clean division and it holds.

**For a participant who does not interact, it holds only because the table is a first-class view - and
6.10 tightens that from a condition into the load-bearing one.** Under year-only everywhere, the dates
on screen at rest are "Now", the year labels, the endpoint's **year**, and the comparison rows'
**years**. **The table is now the only place on the screen where date resolution finer than a year
exists at all.** The endpoint line no longer carries a month, so it can no longer stand in for one.

**The condition, restated and hardened.** The table toggle must be a **visible peer of the chart in
the default state**: not behind a menu, not in an overflow, not a secondary or tertiary control, and
**not below the fold at 390x844**. This is not a preference about emphasis. Year-only removes every
other route to a monthly date at rest, so a buried toggle does not merely de-emphasise the table - it
removes month resolution from the screen entirely for anyone who does not scrub.

**Asserted, not inspected.** `overlap.test.mjs` carries it as a real assertion on row `12` at both
text sizes: the toggle is present in the default render, is not inside a disclosure or an overflow
container, and its bounding box sits within the first viewport at 390x844 without scrolling. Step 8
and step 14. **If it cannot be made to pass, the years-only decision goes back** - that is what makes
this a condition rather than a note.

### 6.10 Year-only granularity, everywhere, at rest - SETTLED

*Amended 31 August 2026. The previous draft made years-only an axis decision and kept month and year
on the endpoint line. **That is overruled.** Year-only is now the rule for every date the screen
states at rest, and the reason below is the decision rather than a justification for a formatting
preference.*

> **No month appears anywhere on the results screen at rest.** The feature addresses a long-term goal;
> the projection is not accurate to the month; and stating it to the month invites a participant to
> read it as a commitment. **Year-only is the honest granularity for what the model can claim.** That
> is the same reasoning that sits behind MCOB 4.8A's guidance-versus-advice boundary and the Consumer
> Duty consumer understanding outcome - not a consequence of them, but the same thought.

**What it applies to:** the x-axis (6.4), the endpoint line (6.5), the comparison rows (7.5), and the
attained state if it ever renders a date (5.4 - today it renders none).

**What it does not apply to, and why that is not an exception:** the scrub detail and the table row.
Both are answers to a question the participant asked rather than claims the screen volunteers, and the
month in them is a coordinate on a curve rather than a predicted arrival. See 6.6.9.

**Why this is stronger than the argument it replaces.** The previous draft treated precision as
something to be *disclosed* - a caption beside a monthly figure saying it is an estimate, which is how
`/tracker`'s `onTrackBeyondWindowNote` handles it. That works where the figure is defensible and needs
qualifying. It does not work where the figure asserts a resolution the model never had: a caption
cannot un-state "March 2039". The honest move is not to state it.

### 6.10.1 What year-only costs the endpoint line - MEASURED, AND REPORTED FOR DECISION

*The objection to year-only on the endpoint was that it stops discriminating where the near-term
choice is live. That was measured rather than assumed, and **the objection is substantially correct at
short horizons**. Reported here. **Not resolved.** Reintroducing a month would be a reversal of the
decision above and is not done silently.*

**What was measured.** The screen presents exactly two contribution levels - `monthly-low` and
`monthly-high` - so there is one adjacent pair. A **collision** is both producing the same endpoint
year, which is the state where pressing the series control leaves the endpoint line unchanged.

Two pair shapes, because the pair arises two ways in the running app:

- **D2's derived pair**, `rangeFromCentral(central, 0.10)` -> x0.9 / x1.1, ratio **1.222**. What frame
  10b's date mode commits.
- **The slider pair**, `MOCK_POSITION` 200 / 310, ratio **1.55**. What frame 10's default path commits.

**At the seeded persona** (property 450,000, saved 8,950), all five deposit percentages, three pair
shapes - 15 configurations, **no collision**:

| Deposit % | Slider pair 200/310 | D2 pair from 255 | D2 pair from 640 |
| --- | --- | --- | --- |
| 5% | 2033 / 2031 | 2032 / 2031 | **2029 / 2028** |
| 10% | 2039 / 2035 | 2038 / 2036 | **2032 / 2031** |
| 15% | 2043 / 2039 | 2042 / 2040 | **2034 / 2033** |
| 20% | 2047 / 2042 | 2046 / 2043 | **2036 / 2035** |
| 25% | 2051 / 2045 | 2049 / 2046 | **2038 / 2037** |

The bold column is one year apart at every percentage - Jun 2029 against Dec 2028 at 5% - which is a
**six-month separation landing either side of a year boundary**. It discriminates by luck, not by
margin.

**Swept** over property 150,000 to 600,000 in 10,000s x seven balances x five percentages x eight
central rates to `left-over`, excluding configurations where the goal is already met:

| Pair shape | Collisions | |
| --- | --- | --- |
| D2 pair (x0.9 / x1.1) | 1,848 / 10,536 | **17.5%** |
| Slider-shaped pair (ratio 1.55) | 669 / 10,536 | **6.3%** |

Median separation hidden by a collision: **6 months**. Maximum: **12**.

**And it concentrates exactly where the objection said it would.** By attainment horizon, D2 pair:

| Attainment | Collisions | Rate |
| --- | --- | --- |
| **Under 2 years** | 927 / 1,095 | **84.7%** |
| **2 to 5 years** | 774 / 2,029 | **38.1%** |
| 5 to 10 years | 138 / 2,946 | 4.7% |
| 10 to 20 years | 9 / 3,142 | 0.3% |
| Over 20 years | 0 / 1,324 | **0.0%** |

**How to read this.** For a participant more than five years from their goal - which is the seeded
persona at every deposit percentage, and the case the pilot ran - year-only costs 4.7% and falling.
For a participant close to their goal it costs 85%: the endpoint line says the same year whichever
contribution they choose, and the control appears not to work on it.

**What is still true in a collision.** The line is not wrong. At both contributions the participant
genuinely does arrive in that year, and "the difference between these two amounts is not a difference
in when you arrive" is a real and useful finding rather than a rendering failure. The readout (6.2),
the plotted line and the comparison rows all still move with the selection; the endpoint is the one
element that does not.

**The options, named and not chosen.** This is reported for decision, per the instruction:

| | Consistent with 6.10? | |
| --- | --- | --- |
| **A. Accept it.** The collision is a true statement about a short horizon, and three other elements carry the discrimination | **Yes** | Costs nothing to build. Leaves a control that visibly does nothing to one line in 85% of short-horizon sessions |
| **B. A comparative fact instead of a finer date.** The line adds which contribution is sooner, or by how many months, without naming a month | **Yes** | New copy, and it must clear MCOB 4.8A - "sooner" is comparative, not a recommendation, but the wording has to stay that way |
| **C. Name the collision.** Where both land in the same year, the line says so rather than repeating a year that looks static | **Yes** | Makes the non-discrimination visible instead of silent. New copy, and a second variant of the line |
| **D. Reintroduce the month below some horizon** | **No - reverses 6.10** | Would have to be recorded as a reversal, not as a tweak. Named here so it cannot arrive unlabelled |

**No recommendation is made.** Open decision 1 in section 12 carries it, and it must return a result
before the build session starts.

### 6.11 What the chart type ends up being, re-derived

Following the amended requirements rather than choosing first: **a line with plotted points, a
labelled y-axis, a years-only x-axis positioned as a scale, a scrub-driven point detail feeding an
always-visible readout, a labelled endpoint, and a table view.**

**The participant proposed this shape at 22:04 and caveated it in the same breath** - "Again, depends.
On the phone, not sure how much easier that would be." **The caveat was about labelling density, and
measured, it was correct.** Labelling every point at the default window would need 24 labels of ~26px
each in 305px of plot - 12.7px per label against 26px of text. It collides by a factor of two, which
is what they suspected and is why "label every point" was never the answer.

**What answers it is that no per-point label is drawn at all.** The axis carries years, positioned as
a scale; per-point values come from the scrub and from the table. So the shape they asked for is
buildable at 393px, and the reason is measurement rather than assumption - which is the check this
section was asked to make rather than to skip.

**The bar rendering is retired.** It was not what failed and it is not being blamed; it is simply not
the shape that supports a continuous scrub across a two-year window, and two stacked bands are harder
to compare at a point than two lines. `growth-chart__bar`, `__bar-group` and `__bars` go with it.

---

## 7. The comparison row, and D46

### 7.1 What is there

Three `rateBandRowHTML` rows (`ui.js:1587`), windowed on the selection by `neighbourPcts`:

```
£45,000      10% deposit - your choice      within 26 yr 4 m
```

`label` is the deposit amount, `sublabel` the percentage, `value` the duration. Beneath:
`compareProvenanceCaption`, "Time to save each one, at what you are putting away now."

### 7.2 The objection is to framing, not presence

At 24:48 the participant objected to being shown options they had not chosen. **The comparison is not
removed.** D46 requires a discarded participant value to stay visible, and D72's amendment already
narrowed this card from five rows to three for the adjacent reason.

**Reframe as an interval around the selection**, not a menu of rejected alternatives:

- **Each line leads with the date reached.** `label` becomes the date; `sublabel` carries the
  percentage and the marker; `value` keeps the deposit amount, so nothing the participant might have
  chosen disappears. Three slots, the existing component, no new geometry.
- **The date is the attainment year**, per 6.10's rule and the measurement in 7.5. **The card-wide
  fallback to month and year is withdrawn** - 6.10 makes year-only a claim about what the model can
  honestly assert at rest, and a fallback that reintroduces months on 0.06% of sessions would be a
  granularity that varies with the arithmetic. What the six collision states get instead is 7.5's
  amended treatment.
- **The rows project at the selected series**, not at `monthly-low`. Settled; see 7.6.
- **The heading names an interval.** `compareHeading` is "How this compares" - a comparison of
  alternatives. It becomes a line naming the band around the participant's own choice.
  `[AWAITING COPY]`.
- `compareRowSelectedSublabelTemplate`'s "- your choice" stays. It is the row's non-colour carrier
  (WCAG 1.4.1) and it is what makes the other two read as a neighbourhood rather than a menu.
- `compareWithinTemplate` ("within {months}") is retired; the value it filled is now a date in the
  `label` slot.

### 7.3 The footnote marker (24:27)

`compareProvenanceCaption` describes the dates and sits below the card with nothing binding it to
them. Bind it both ways:

- A visible marker after each row's date - `March 2039*` - and the same marker opening the caption.
  A literal character in `content.js` (`compareFootnoteMarker`), not an icon and not an emoji.
- `aria-describedby` from each row to the caption's `id`, so the binding is real for assistive
  technology and does not depend on a glyph being announced.

### 7.4 The decision entry this needs

This is a trade against a standing decision, so it takes a `DECISIONS.md` entry rather than a fix.
What it must record:

- D46 requires the discarded value visible; the interval framing keeps every neighbour and its amount
  on screen, and removes only the reading that they are offers.
- **What is given up:** the card no longer reads as a set of choices, so a participant who wants to
  *change* their deposit percentage gets a weaker prompt to do so. The route back to frame 09 is
  unchanged and is where that decision belongs. Stating this is the point of the entry.
- The 24:48 quote, and the fact that it is a framing objection rather than a request for removal.

---

### 7.5 Does years-only extend to the comparison rows? Measured, 31 August 2026

*The axis decision in 6.4 was not assumed to generalise. This is the measurement it was held to.*

**Method.** For every `neighbourPcts` window, the attainment year of all three rows, from
`monthsToReachAmount` against each row's own `combined-goal` (deposit plus stamp duty at that
percentage), at a range of contributions. A row whose goal is already covered resolves to
`compareAlreadyLabel` and is excluded from the comparison, since it carries no year. **A collision is
two or more live rows resolving to the same year**, at which point the card stops comparing anything.

**At the seeded persona** (property 450,000, `saved-toward-deposit` 8,950), all five windows at all
four contributions - 20 configurations, 60 rows:

| Selected | @200/mo (`monthly-low`) | @255/mo (`savings-rate`) | @310/mo (`monthly-high`) | @640/mo (`left-over`) |
| --- | --- | --- | --- | --- |
| 5% or 10% (rows 5/10/15) | 2033, 2039, 2043 | 2032, 2037, 2041 | 2031, 2035, 2039 | 2029, 2031, 2033 |
| 15% (rows 10/15/20) | 2039, 2043, 2047 | 2037, 2041, 2044 | 2035, 2039, 2042 | 2031, 2033, 2035 |
| 20% or 25% (rows 15/20/25) | 2043, 2047, 2051 | 2041, 2044, 2048 | 2039, 2042, 2045 | 2033, 2035, 2037 |

**No collision in any of the 20. Narrowest separation is two years.**

**Swept wider**, over property 150,000 to 600,000 in 10,000s x seven balances (0 to 80,000) x all five
selections:

| Contribution range | Configurations | Collisions | |
| --- | --- | --- | --- |
| The three seeded rates (200 / 255 / 310) | 4,830 | **0** | **0.00%** |
| Everything up to `left-over` (100 to 640) | 9,660 | **6** | **0.06%** |
| Including rates above `left-over` (to 1,500) | 12,880 | 480 | 3.7% |

**Years-only extends to the card.** At every contribution the running app can produce - the slider is
bounded at `left-over` and frame 11's field is bounded the same way - the collision rate is 6 in
9,660. The third row is there for completeness: it is only reachable with a `left-over` far above
`MOCK_POSITION`'s 640, and every collision in it is a fast projection against a cheap property, which
is the same corner the six are in.

**The six, in full**, so the fallback is written against real cases rather than a hypothesis:

| Property | Saved | Selected | Rate | Rows |
| --- | --- | --- | --- | --- |
| 160,000 | 5,000 | 5% or 10% | 640 | 5%: 2027, 10%: **2028**, 15%: **2028** |
| 160,000 | 5,000 | 15% | 640 | 10%: **2028**, 15%: **2028**, 20%: 2029 |
| 160,000 | 21,000 | 15% | 640 | 10%: already saved, 15%: **2027**, 20%: **2027** |
| 160,000 | 21,000 | 20% or 25% | 640 | 15%: **2027**, 20%: **2027**, 25%: 2028 |

All six are the fastest corner of the space: the cheapest property the sweep covers, the highest
contribution the app allows, and a balance already close to the goal. The projections are one to three
years long, so the three goals fall inside two calendar years.

**The card-wide fallback to month and year is WITHDRAWN, 31 August 2026.** The previous draft resolved
the six by reformatting the whole card. 6.10 now makes year-only a claim about what the model can
honestly assert at rest rather than a formatting choice, and a fallback that reintroduces months on
0.06% of sessions makes the screen's granularity a function of its own arithmetic - the participant
cannot know which rule they are looking at, and the six sessions that trip it get a claim the other
9,654 are told the model cannot make.

**What the six get instead.** The collision is real and must not be silent, so it is named rather than
formatted around: where two live rows resolve to the same year, the card says so - the two deposits it
affects are reached in the same year at this contribution. **The string is approved and recorded in
10.2**, with its two slots confirmed available in 10.3.

**This is NOT the same question as the endpoint line's, and the previous draft was wrong to bind them.**
The card's is a **within-render** collision: two of the three rows are on screen at once and say the
same year, so a string can name both. The endpoint line renders **one** figure and cannot collide with
itself; its case is a **cross-state** one, where switching series leaves the line unchanged. Section 12
item 1 now separates them - 1b is settled here, 1a stays open.

### 7.6 The card follows the series selection - SETTLED, and the D72 condition is met

**Settled: the card projects at the selected series**, not hard-wired at `monthly-low`
(`calculator-result.js:175`, "the SLOWER end, deliberately").

**Why.** Two figures on one screen naming different projections is worse than either alone. The card
projects at `monthly-low` today while the endpoint line projects at the **selected** series, so the
selected row and the endpoint agree when the series is low and disagree when it is high - a
coincidence that holds in one state and not the other, which a participant cannot tell apart. And it
lands on exactly the rows the pilot found unanchored at 23:41.

**The D72 condition, verified.** D72 hard-wired the conservative end so the screen would not lead with
the optimistic case. That intent survives this change only if a participant who touches nothing still
meets the conservative picture and reaches the optimistic one by choosing it - which means the default
series must be `low`.

> **Checked: the plan did not specify a default.** `chartSeries` is introduced in 6.2 and listed in
> 8.2 as a new `state.js` view setting, with no initial value stated anywhere. So there was nothing to
> verify against, and nothing to contradict. **This amendment sets it: `chartSeries` defaults to
> `'low'`.** Recording it as a finding rather than as a confirmation, because a default that was never
> written down is not the same as one that was already right.

With that default, D72's intent survives intact and is arguably better served than before: a
participant who touches nothing meets the conservative dates exactly as they do today, and the
optimistic ones now require a deliberate press rather than being drawn beside them unpressed.

**A consequence for the control's own ordering.** `pillSegmentsHTML` must list **low first, high
second**, with low pressed. The existing legend runs high-then-low (`calculator-result.js:230-231`,
"the order is high then low, matching the stack read top down") - but that order was a consequence of
the stacked bands, and 6.11 retires the stacking. With bars gone there is nothing to read top down,
so reading order is free to follow the conservative-first intent, and it costs nothing.

**What is given up, stated for the D101 entry.** A participant who presses the high series sees the
optimistic dates in the card as well as on the endpoint line, where today the card would have held
the conservative ones beside them. D72's protection becomes a **default** rather than a **floor**.
That is the trade, it is deliberate, and it is the reason this needed a decision rather than an
implementation choice.

---

## 8. Files and functions that change

### 8.1 Model and formatting

| File | Change |
| --- | --- |
| `src/model/model.js` | **Add** `goalMonths(state, monthlyAmount)` and `goalAttained(state)`. **Change nothing else.** `monthsToGoalUnaided`, `monthsToReachAmount`, `monthsToTarget`, `onTrackFor`, `rangeFromCentral`, `monthlyAmountFromDate` all keep their exact behaviour |
| `src/format.js` | **Add** a y-axis tick-rounding helper. `formatMonthYear`, `formatMonthYearRange` and `formatFullDate` are unchanged - they already take the anchor as a parameter, which is what makes this pass cheap. `formatMonthsDuration` is unchanged and kept (9.2) |
| `src/model/rates.js` | Unchanged. `RATES.asAt` keeps its provenance job |

### 8.2 State, shell and settings

| File | Change |
| --- | --- |
| `src/state.js` | **Add** `sessionAnchor` to `defaultState()`, beside `buildVersion`. **Add** the month-mismatch branch to `load()`, sharing D59's existing discard path. **Add** `chartSeries` and `chartView` as view settings. None of the three goes into `SECTION_6_KEYS`; `chartSeries` and `chartView` do not go into `STAGE_KEYS` |
| `src/stage.js` | Unchanged - it writes figures, not view settings, and `baseline()` picks up new defaults through `defaultState()` |
| `src/screens/settings.js` | **Add** the anchor caption line beneath the build caption, through `formatFullDate(state.sessionAnchor)` |

### 8.3 Screens

| File | Change |
| --- | --- |
| `src/screens/calculator-result.js` | The bulk of the work. `render()`: the four duration conversions (2.1 items 1-4); the projection bounded at `goalMonths`; `goalMet` replaced by `goalAttained(state)`; the attained state (5.4); the default window (6.1); the series control, readout and its listener (6.2); the endpoint line (6.5); the table toggle and its listener (6.6); the chip filter at `attainmentMonths` (5.4); the comparison rows inverted and marked (7.2, 7.3). Every date call takes `state.sessionAnchor` |
| `src/screens/tracker.js` | One line, 403: `RATES.asAt` -> `state.sessionAnchor`. Drop the now-unused `RATES` import if nothing else on the screen uses it |
| `src/screens/mip-result-not-yet.js` | Line 111: `formatMonthsDuration(monthsToClose)` -> `formatMonthYear(monthsToClose, state.sessionAnchor)`, and the `Infinity` branch keeps its em-dash fallback |
| `src/screens/learn-ltv.js` | **Add** one table row, "Reached by", one cell per column, from the same `monthsToReachAmount` call the comparison card makes against each column's own deposit amount. This is 2.2 - the 26:20 addition. **Layout risk:** a sixth row in a table already inside `.ltv-comparison-table-wrap`; `overlap.test.mjs` row `13` at both text sizes decides whether it holds |
| `src/screens/calculator-saving.js` | **NO CHANGE. Frozen.** `git diff` against it must be empty (11, step 11) |

### 8.4 Components and CSS

| File | Change |
| --- | --- |
| `src/components/ui.js` | `growthChartHTML` is rebuilt as a **line** (6.11): `yTicks` replaces `yTop`/`yBottom`; the x-axis becomes absolutely-positioned year labels at computed percentages, with the thinning rule (6.4); plotted points with an active state; the horizontal guide, the value label at the y-axis edge and the date label above the point (6.6.0); **`maxScale`'s headroom multiplier moves from 1.05 to 1.20** to hold that date label (6.6.3). **Add** `chartTableHTML`, and `bindGrowthChart` for the scrub, hover, click-to-pin, `pointercancel` and keyboard contract (6.6), modelled on `bindDateSelect` - activation by **ratio**, never a pixel offset (6.6.1). `pillSegmentsHTML`, `figureDisplayHTML`, `rateBandRowHTML`, `chipRowHTML`, `rerenderInPlace` are all reused unchanged |
| `src/css/screens.css` | **`touch-action: pan-y` on the plot area** (6.6.4). `.growth-chart__bar`, `__bar-group` and `__bars` are **retired** with the bar rendering; `.growth-chart__x-axis` becomes a positioned scale rather than a flex row; new rules for the line, the points and their active state (size and shape, never colour), the y-guide, the y-tick gridlines, and a `.growth-chart__table` block. A `prefers-reduced-motion` block for the draw-in and the guide (6.6.4). `shell.css` is not touched |
| `src/content.js` | `chartRangeLabels`: **"3 yr" (36) is replaced by "2 yr" (24)**, which becomes the default. Five chips, not six - the row has 16px of slack (6.1) |

### 8.5 Docs

| File | Change |
| --- | --- |
| `docs/DECISIONS.md` | Six entries. **Read the last number in the file and take the next** - it stands at D96 as this plan is written, so D97 onward unless something has landed in between |
| `docs/GAPS.md` | Four entries, from G111 onward on the same rule |
| `docs/build-spec.md` | Row 121's chart specification is already superseded by D73; annotate it with the new default window rather than leaving a third stale reading |
| `docs/README.md` | **No version-log row from this plan.** A row is written as part of a merge to `main`, with a reason supplied by Riona, never retrospectively |

**Decision entries:**

| | |
| --- | --- |
| D97 | The session anchor: stamped at session start, discarded on a month mismatch under D59's rule, surfaced on frame 33. **Amends D3** - the pinned rate dates figures, not the render |
| D98 | Durations become calendar dates calculator-wide. Carries the section 2 audit, the frame 10 boundary, and the transitional state |
| D99 | One bounding rule at goal attainment, serving the date listbox and the projection; the attained state; per-consumer rounding, with D85's precedent for why the directions differ |
| D100 | Frame 12's chart rebuilt to the seven requirements: a line with a scrub-driven point detail, a years-only axis positioned as a scale, and a 24-month default. **Reverses D73's amendment on the default window** on the restated reason in 6.1, retires the bar rendering, and swaps "3 yr" for "2 yr" in the chip row. **It amends D73 twice**: the default window, and the headroom multiplier from 1.05 to 1.20 (6.6.3, measured). Carries the interaction model in full - scrub over the plot, horizontal guide only, a point active at rest, persistence on release, `touch-action: pan-y` - and 6.6.5's note that the observed path is hover and click. **Splits into two entries if 6.10 is judged to stand on its own** - see D102 |
| D101 | The comparison card reframed as an interval, the footnote marker, years-only in the rows, and the card following the series selection with `chartSeries` defaulting to `'low'`. The trade against D46 per 7.4, and the trade against D72's hard-wired `monthly-low` per 7.6: its conservative-first intent becomes a **default** rather than a **floor** |
| D102 | **Year-only granularity for every date the screen states at rest** (6.10), recorded as a claim about what the model can honestly assert - the same thought behind MCOB 4.8A and the Consumer Duty understanding outcome. Carries 6.10.1's measured cost on the endpoint line (84.7% collision under two years, 4.7% past five), the option taken for it, 7.5's withdrawal of the card-wide fallback, 6.6.9's coordinate-versus-claim distinction for the scrub and the table, and 6.9's condition on the table toggle - **which is what this entry can be reversed by** |

**Gap entries:**

| | |
| --- | --- |
| G111 | Frame 21 projects to `deposit-target`, not `combined-goal` (`mip-result-not-yet.js:80`), against D70. It is now a *date* that disagrees with the tracker's, which is more visible than a duration was. **Report only - do not fix in this pass** |
| G112 | `formatMonthsDuration` has no callers after this pass. Recorded, kept, not deleted |
| G114 | A **three-way** same-year collision in the comparison card would break `compareSameYearNote`'s two slots. **Zero in 28,400 configurations at every rate the app can commit**; 382 only above `MOCK_POSITION`'s `left-over` ceiling (10.3). **Unreachable, not impossible** - the G92-to-G95 form. Records where the one-line detection would go if that constant ever changes |
| G113 | The transitional state of 3.3: frame 10 anchors on the wall clock while every other screen anchors on `sessionAnchor`. Lists `calculator-saving.js` lines 144, 202-203, 238-243. Closed in one pass after the G107 session, together with migrating frame 10b's floor and cap onto `goalMonths` |

---

## 9. Out of scope, stated

1. **Frame 10 / 10b, `src/screens/calculator-saving.js`, entirely.** Frozen at `1c44d75` until the
   G107 measurement has run. Reported in section 3, unchanged.
2. **`formatMonthsDuration` is not deleted**, even at zero callers. It is the right function if a
   duration is ever correct again, and removing it is a separate decision on its own evidence.
3. **D85's cap, its rounding direction, `monthsToGoalUnaided`, `earliestWorkableMonths`, the listbox
   and its keyboard contract.** Untouched.
4. **G99, G100, G101, G110** and the `dateGoalAlreadyMet` copy gap. All open, none reachable through
   anything in this plan.
5. **Mortgage terms and illustrative horizons** - `MORTGAGE_TERM_YEARS` on frame 13,
   `inflationExclusionTemplate`'s "five years". Not projections.
6. **The window chips' own labels.** A window is a length. Section 2.4.
7. **No chart library, no framework, no bundler, no state management library.** Vanilla ES modules,
   the existing components, the existing CSS.
8. **No financial figures are invented or changed.** Every date derives from the annuity-due model
   already anchored to `RATES.bankRate`.
9. **The version log.** Written at merge, with a reason supplied.

---

## 10. Copy keys

All new participant-facing copy goes through the `fca-copy-check` skill before it is written into
`content.js`. The MCOB 4.8A boundary is live here: a date is a projection, so the wording is "you'd
reach", never "you should aim for". British English, hyphens not em dashes.

### 10.1 Register: friendly and transparent, not formal

**Participant-facing copy on this screen uses contractions, active voice and plain verbs, and where a
figure might look wrong to a participant the string says why rather than only stating it.**

**The reason, stated so this does not read as a style preference.** Formality is not what keeps copy on
the guidance side of MCOB 4.8A. **The conditional mood and the absence of a recommendation are**, and
both survive contractions intact. "You'd reach" is exactly as conditional as "would be reached" and is
easier to read; what would cross the boundary is "you should aim for", and that is a change of mood and
a recommendation, not a change of register. A formal register bought no regulatory safety and cost
comprehension, which is the thing this whole pass exists to repair.

The second clause is the one the pilot argues for directly. A participant who meets a figure that looks
wrong to them - a date further out than they expected, an amount that did not move when they expected
it to - needs the reason beside it, not a bare restatement. `compareSameYearNote` below is the first
string written to that rule: it does not say "these are the same", it says why they are.

This register is already the house style in the strings that survived the pilot - `dateMovedToCap`'s
"Good news - you'll get there sooner than that now", `pickOneCaption`'s "Set an amount and we'll show
you the date" - so this records an existing practice rather than introducing one. `shared.regulatory`
is the exception and is untouched: those are fixed wording.

### 10.2 `content['/calculator/result']`

| Key | Status |
| --- | --- |
| `chartSeriesLegend` | New - visually-hidden group label for the series control |
| `chartSeriesCaptionTemplate` | New - the readout caption, naming the selected contribution in words |
| `readoutCaptionTemplate` | New - `[AWAITING COPY]`, slots `{date}`, `{amount}`. **It always names the date the figure belongs to** (6.2). **Its granularity is not settled** - section 12, item 1c |
| `chartPlotAriaLabel`, `chartPointAriaLabelTemplate` | New - the scrub target's accessible name and each point's, slots `{date}`, `{amount}`. Read by `aria-activedescendant` (6.6.6). Same granularity question as the readout |
| `chartRangeLabels` | **"3 yr" replaced by "2 yr"** (24 months), which becomes the default. `ariaLabel` follows the WCAG 2.5.3 rule the existing five already keep: it opens with the visible label |
| `endpointTemplate` | New - `[AWAITING COPY]`, slots `{amount}`, `{year}`. **Year, not month** (6.10). **No same-year variant is needed** - see section 12, item 1a |
| **`compareSameYearNote`** | **New - APPROVED, 31 August 2026. Slots `{a}` and `{b}`**, the two colliding deposit percentages in row order, so `{a}` is the lower. Renders below the comparison card when two live rows resolve to the same year (7.5)<br><br>> The {a} and {b} deposits are close enough that you'd reach them in the same year.<br><br>Conditional ("you'd"), no recommendation, and it gives the reason rather than restating the coincidence - 10.1's rule, and the first string written to it. Still to go through `fca-copy-check` |
| `chartViewChartLabel`, `chartViewTableLabel` | New - the view toggle |
| `chartTableCaption`, `chartTableMonthHeader`, `chartTableLowHeader`, `chartTableHighHeader` | New - the table's own labels |
| `goalAttainedHeadline`, `goalAttainedBody` | New - `[AWAITING COPY]`, slots `{saved}`, `{goal}`. Not an error and must not read as one (D78) |
| `xAxisNow` | Kept or replaced by the anchor month - decided with 6.4's measurement |
| `chartRangeAnnouncementTemplate` | Reworded - `{range}` becomes a date |
| `compareHeading` | Reworded - `[AWAITING COPY]`, names an interval |
| `compareRowSublabelTemplate`, `compareRowSelectedSublabelTemplate` | Reworded for the inverted row |
| `compareFootnoteMarker` | New - a literal character |
| `compareProvenanceCaption` | Reworded to open with the marker, and to **name which rate** - "at what you are putting away now" silently means `monthly-low` today, and the card now follows the selection (7.6, settled) |
| `compareWithinTemplate` | **Retired** |
| `beyondWindowNote` | **Retired** (2.1 item 5) |
| `compareAlreadyLabel` | Unchanged - already the attained-row label |
| `legendTemplate` | Unchanged - reused by the series control |

### 10.3 `compareSameYearNote`'s two slots: confirmed available, after one hoist

*Confirmed rather than assumed, per the instruction. The answer is yes, with a structural condition
that has to be specified or it will be discovered during the build.*

**The values exist. They are not in scope where the note renders.** `calculator-result.js:170-190`
builds the three rows inside an IIFE in the template literal, and computes `monthsLater` **inside the
`.map()` callback**, where it is used for that row's value and then discarded. The note renders below
the card, outside that closure, so as the code stands the years the collision is detected from are
gone by the time the note needs to name them.

**The fix is a hoist, not new data.** Derive `[{ pct, goal, months, year, alreadySaved }]` once, above
the template literal; the rows map over it and the collision predicate and the note read the same
array. That also removes a duplicate `monthsToReachAmount` call, since the predicate would otherwise
recompute what the rows already worked out - and a predicate that recomputes its own inputs is D46's
"the two will eventually disagree" in miniature.

**`{a}` and `{b}` are the two colliding percentages in row order**, `neighbourPcts` being ascending, so
`{a}` is the lower. Formatted with `formatPercent(pct, 0)` for "5%" and "10%", matching
`compareRowSublabelTemplate`. **Rows resolving to `compareAlreadyLabel` carry no year and are excluded
from the pair**, which 7.5's "live rows" already requires.

**A three-way collision would break a two-slot string, and it is unreachable. Recorded rather than
guarded.** Swept over property 100,000 to 800,000 in 10,000s x ten balances x five selections:

| Contribution range | Configurations | Two-way | **Three-way** |
| --- | --- | --- | --- |
| Every rate the app can commit (to `left-over` 640) | 28,400 | 100 | **0** |
| Rates above any reachable `left-over` (800 to 3,000) | 21,300 | 3,790 | **382** |

**Zero three-way collisions at any rate the running app can produce**, so the approved two-slot string
is correct for every reachable state. The 382 sit above `MOCK_POSITION`'s 640 ceiling and are reachable
only if that constant changes or a facilitator seeds a higher `left-over`. **Unreachable, not
impossible** - the G92-to-G95 form - and it goes in `GAPS.md` on that basis rather than buying a
three-slot string for a state no session can reach. It is one line to detect if it ever becomes
reachable, and the entry says where.

### 10.4 The other screens

**`content['/mip/result/not-yet']`** - `step1CaptionTemplate` reworded, `{months}` becomes `{date}`.

**`content['/learn/ltv']`** - `tableReachedRowLabel` new ("Reached by").

**`content['/settings']`** - `anchorCaptionTemplate` new, slot `{anchor}`. `buildCaptionTemplate`
untouched.

`shared.regulatory` is untouched. No line under it is reworded, shortened, removed, or dropped from a
screen that carries it.

### 10.5 The five outstanding drafts - NOT RECEIVED

**`readoutCaptionTemplate`, `endpointTemplate`, `goalAttainedHeadline`, `goalAttainedBody` and
`compareHeading` remain `[AWAITING COPY]`.** They were to be recorded from a brief accompanying the
31 August amendment; **that brief did not arrive with it, and the drafts are not in hand.** Nothing has
been written in their place - inventing participant-facing copy is what D93 and D94 exist to prevent,
and `compareSameYearNote` above shows the form an approved string is recorded in when there is one.

Two of the five are also **blocked on decisions, not only on drafting**: `readoutCaptionTemplate`'s
granularity is section 12 item 1c, and `endpointTemplate`'s wording depends on which of 6.10.1's four
options is taken. Those two should be drafted after their decisions, not before.

---

## 11. Verification, end to end

Run in this order. Steps 3 and 11 are the two that decide whether the plan was followed.

1. `git status` clean, on `build`.
2. `node --test src/model/*.test.js` - existing model behaviour unchanged; new cases for `goalMonths`
   at a positive, a zero and a negative contribution, and for `goalAttained` at, above and below the
   goal.
3. **`node --test scripts/date-ceiling.test.mjs` passes unchanged, all 36.** It derives every expected
   value from `model.js` at run time, so it is the proof that `monthsToGoalUnaided` still returns what
   frame 10b's cap was built on. **If this moves, the model change was not behaviour-preserving.**
4. `node --test scripts/smoke.test.mjs` first among the browser tests - three temporal-dead-zone
   defects have blanked a screen while the rest of the suite passed, and this pass adds new
   module-scope code to `calculator-result.js`.
5. `node --test scripts/stale-session.test.mjs` - extended for the anchor, since it owns D59: a
   session whose `sessionAnchor` month is not the current month is discarded **whole** and comes back
   as a first load; a same-month, same-build session restores untouched; the anchor is written once
   and does not move across a re-render or a back navigation; frame 33 renders it.
6. `node --test scripts/chart-range.test.mjs` - extended. Assert **shape, derived from the model at
   run time, never written into the file** (D77, and D85's own record of that test file growing a D77
   defect): the last point never exceeds `combined-goal`; the endpoint month equals `goalMonths`
   rounded up; **every x-axis label sits at the computed position of its own January boundary**, and
   the label set is exactly the thinning rule's output at that window; the readout figure equals
   `balanceAtMonth` for the selected series at the window's end; switching series changes the readout
   and not the projection; the attained state draws no chart, no zero-length segment and no negative
   figure anywhere on the screen; no chip is offered beyond attainment; **the default chip is "2 yr"
   and exactly one chip is pressed in every state** (D73's no-selection failure).
6b. **A new `scripts/chart-detail.test.mjs`** (Chromium) for the interaction, because none of the
   existing harnesses drives a pointer across a plot. Eight assertions, one per requirement in 6.6:
   1. **Nearest-point activation is correct at both ends and outside the first and last points.**
      Press at x=0, at x=width, and beyond each end; the activated index is 0 and `pointCount - 1`
      respectively, never `undefined` and never clamped to the wrong end. Run at **1280x720 and
      2560x1440**, because 6.6.1's ratio is the thing being tested and a pixel-offset handler passes
      at one scale and fails at the other (D92).
   2. **The active state survives release and pointer-leave once pinned.** `pointerup` inside the plot
      leaves the point active (6.6.2a); a click then a `pointerleave` leaves it active (6.6.5); a
      synthesised `pointercancel` leaves it active rather than clearing (6.6.4).
   3. **A point is active on load - the last in the window - in every window and every series.** All
      five chips x both series, on first paint, with no interaction at all (6.6.2b). This is also what
      proves the readout at rest and the active point are one state rather than two.
   4. **No label renders below the active point.** For every point in the window, the date label's
      bounding box is above the point's centre; and at the topmost point the label is fully inside the
      plot, at **both text sizes** (6.6.2c, 6.6.3). Reintroducing `maxScale = max x 1.05` must fail
      this - that is the test that holds 6.6.3's headroom change in place.
   5. **Vertical page scroll works from a gesture starting on the plot area.** Drive a vertical touch
      drag from inside the plot in the **framed view at a short viewport height**, where D92 lets the
      page outside the frame scroll as well; assert the scroll position moved and the active point did
      not (6.6.4).
   6. **Keyboard reaches every point and the guide follows focus.** Arrow keys from either end traverse
      all `pointCount` points, Home and End reach the ends, Escape returns to the last point, and
      `aria-activedescendant` follows throughout - read off the same attributes
      `date-ceiling.test.mjs` reads, and off focus alone with no pointer event fired (6.6.6).
   7. **Nothing depends on motion.** Under `prefers-reduced-motion: reduce` no transition duration is
      applied to the line, the guide or the point, **and every one of assertions 1 to 6 still passes**
      - which is the actual claim, rather than the absence of a CSS property (6.6.8).
   8. **The table exposes every value the guide can reveal.** Compared array-to-DOM, not by row count:
      scrub to each point in turn, and assert its amount and date appear in the table's corresponding
      row (6.7).

   Two more, from the requirements this file inherits: the active point differs from the rest in
   **radius**, not only in fill (1.4.1, 6.6.8); and the readout and the in-plot value label render the
   **same figure** at every point, never two (6.2).
7. **Reintroduce each defect and confirm the new tests fail.** D85's precedent, and the reason
   `chart-range.test.mjs` exists at all - it passed against an inverted chart. Specifically: round the
   projection endpoint down; re-stamp the anchor instead of discarding; restore the 4-label x-axis
   against 12 marks; remove the year-label thinning rule; drop the always-visible readout so the
   value is only reachable by interacting (6.9).
8. `node --test scripts/overlap.test.mjs` - all 37 rows, both text sizes. Rows `12` and `13` are the
   ones this pass touches: the readout, the endpoint line, the series control, the view toggle, the
   table, and the LTV table's sixth row. Three things are **settled here rather than assumed**:
   6.4's year-label pitch at Large text (section 12, item 2); the five-chip row with "2 yr" in it,
   which has 16px of slack and has not been re-measured since D75; and **the table-toggle condition,
   as a real assertion rather than an eye check** - present in the default render, not inside a
   disclosure or an overflow container, and its bounding box inside the first viewport at 390x844
   without scrolling. That last one is a condition on decision 2, not a preference: under year-only
   the table is the only place on the screen with finer-than-year resolution, so **if it cannot be
   made to pass, year-only goes back** (6.9).
9. `node --test scripts/action-bar.test.mjs` - frame 12 gains height; the bar must stay hittable
   without scrolling at all four viewports.
10. `node --test scripts/frame-scale.test.mjs` - `shell.css` is not touched, but the chart's geometry
    is, and this is the test that holds the layout fingerprint identical between window sizes, which
    is what keeps findings comparable between sessions.
11. **`git diff --stat -- src/screens/calculator-saving.js` returns nothing.** The mechanical proof of
    the freeze. If it returns a line, the change is out of scope regardless of what it does.
12. The remaining suite: `bottom-nav`, `sheet-drag`, `skip-ahead`, `g62`, `stage`, `inline-edit`.
    Whole-suite count recorded in the decision entry, in D85's form.
13. `node scripts/shots.mjs` - **the script, extended if it cannot reach a state; never a harness
    written inline.** States: default window, "Max", a near-goal balance, at the goal, past the goal,
    the table view, both series, and frame 33 showing the anchor. Both themes, both text sizes.
14. Manual, `python -m http.server 8080`: frame 09 -> 10 -> 11 -> 12 at the seeded persona. Confirm
    frame 10's date lists and frame 12's dates name the same calendar months - the 3.3 check, done by
    eye once rather than trusted.
15. `fca-copy-check` over every new and reworded string before it lands.
16. Docs written in the same commits: D97-D102 (numbers confirmed against the file at the time),
    G111-G113. No `README.md` version row until the merge, with a reason supplied.

---

## 12. Open decisions

*Re-recorded 31 August 2026, second pass. Everything about the chart's shape, window and granularity
is now settled. What is left is one copy decision that must return a result before the build session,
one measurement to confirm, and three layout judgements.*

### Settled

| | Decision | Where it landed |
| --- | --- | --- |
| 1 | **Default window: option B, 24 months, endpoint carried in text.** | 6.1, with D73's clause reversed on the restated reason: the barrier was reading a value, not seeing the whole projection |
| 2 | **Year-only granularity, everywhere the screen states a date at rest** - axis, endpoint line, comparison rows, and the attained state if it ever renders one. | 6.10, recorded as a claim about what the model can honestly assert, which is the same thought behind MCOB 4.8A and the Consumer Duty understanding outcome - not a consequence of them |
| 3 | **A line with plotted points, and a scrub over the whole plot area** - no hit testing on the circles, nearest point by ratio. | 6.6, on the measurement in 6.6.1 |
| 3a | **A horizontal guide to the y-axis and nothing else**, value at the axis edge, date above the point. | 6.6.0 - a vertical guide would land between year ticks and point at nothing readable |
| 3b | **A point is active at rest, on load: the last in the window**, and the active state persists on release. | 6.6.2 - the discoverability affordance in both modes, and it collapses 6.2's three readout states to two |
| 3c | **`maxScale` goes from `max x 1.05` to `max x 1.20`**, to hold the date label above the topmost point. | 6.6.3 - measured: the label collides by 17.3px at default text and 20px at Large in the screen's own default state. An amendment to D73's headroom figure |
| 3d | **`touch-action: pan-y` on the plot**, and `pointercancel` leaves the active point standing. | 6.6.4 |
| 3e | **The pointer path is the one that will be observed** - hover without click, click to pin - and the touch path is correctness for the artefact rather than a risk to the study. | 6.6.5 |
| 4 | **The scrub detail and the table carry month and year.** | 6.6.9 - a coordinate on a curve the participant is touching, not a claim the screen volunteers. The distinction is in kind, not an exception to 2 |
| 5 | **The comparison card follows the series selection**, and **`chartSeries` defaults to `'low'`**. | 7.6. The D72 condition is met: the plan had never specified a default, so this amendment sets it, and D72's conservative-first intent survives as a default rather than a floor |
| 6 | **The range chips keep a duration**, with "2 yr" replacing "3 yr" as the default. | 2.4 - the chip says how much you are looking at; the axis and the figures say what you are looking at. A span in view is a control setting, not a claim, so it does not compete with a calendar-year axis |
| 7 | **The card-wide fallback to month and year is withdrawn.** | 7.5 - a granularity that varies with the arithmetic is worse than one that holds |
| 8 | **`compareSameYearNote` is approved**, with slots `{a}` and `{b}` - the two colliding percentages in row order. | 10.2, and 10.3 confirms both are available after one hoist. Closes what was open decision 1's "second half" |
| 9 | **Register: friendly and transparent, not formal** - contractions, active voice, plain verbs, and the reason beside a figure that might look wrong. | 10.1 - the conditional mood and the absence of a recommendation are what hold the MCOB 4.8A line, and both survive contractions |

### Must return a result before the build session starts

1. **The three same-year questions, which the previous draft wrongly treated as one.** It recorded
   "7.5's identical question for the comparison card is the second half of this" - they are **not the
   same question**, and separating them is what this item now does.

   **1a. The endpoint line across a series change. Real, measured, open.** Endpoint year at
   `monthly-low` equals endpoint year at `monthly-high`, so pressing the series control leaves the
   line unchanged: **84.7% of configurations under two years out, 38.1% at two to five, 4.7% at five
   to ten, 0.0% past twenty** (6.10.1). Four options are named there and **none is recommended**;
   three keep 6.10 and option D reverses it and must be recorded as a reversal if taken.

   > **The line does not need a same-year *variant*, and that is now corrected.** It renders **one**
   > figure for the selected series and cannot collide with itself in a single render. What 6.10.1's
   > option C actually proposed was for the line to acknowledge the **unselected** series - both
   > values are in state, so it can - and that is a cross-state comparison, not a within-render
   > collision. `endpointTemplate` therefore needs no second variant on this ground; if option C is
   > taken it needs *different words*, not a collision case. Section 10 is corrected to match.

   **1b. The comparison card within one render. Real, measured, and its string is approved.** Two of
   the three simultaneously visible rows resolve to the same year: **0 in 4,830 at the seeded rates,
   6 in 9,660 across everything the app can commit** (7.5), and **0 three-way in 28,400** (10.3).
   This is a genuine within-render collision because both values are on screen at once.
   `compareSameYearNote` is approved and recorded in 10.2. **Not blocked** - it is settled.

   **1c. The readout caption across a scrub. Not previously identified, and it is the sharpest of the
   three.** See item 2 below; it is listed separately because it is the one that appears during the
   interaction the redesign exists to support.

   **The fourth case, endpoint year against a comparison row's year, is a non-case.** After 7.6 the
   card projects at the selected series, and the **selected** row's goal is `deposit at that pct +
   stamp duty`, which **is** `combined-goal` - the same goal the endpoint line uses, at the same rate.
   **They are the same figure by construction and always agree.** The two unselected rows name
   different goals, so agreeing with the endpoint is not a meaningful property of them. Nothing to
   specify. *Worth noting in passing: the selected row and the endpoint line therefore state one fact
   twice, each in its own context. That is a duplication to look at in layout (step 14), not a
   collision to write copy for.*

2. **`readoutCaptionTemplate`'s granularity. Not settled, and it must be before the build session.**

   Points are monthly, so within the 24-month default window several fall in the same calendar year.
   If `{date}` renders year-only per 6.10, scrubbing between them shows **a changing amount against an
   unchanging date** - which reads as a fault rather than as a limitation, during the one interaction
   the chart redesign exists to support. **The same question governs the in-plot date label above the
   active point (6.6.0) and `chartPointAriaLabelTemplate`**, since all three render the same date from
   the same active index; it is one decision, not three.

   **Measured, at 24 plotted points per window (6.6.1):**

   | Window | Distinct year captions | Longest run of identical captions |
   | --- | --- | --- |
   | **24 mo (default), anchor August** | **3 of 24 points** | **12** |
   | 24 mo, across all 12 anchor months | 2 to 3 | 12 |
   | 6 m chip | 1 to 2 of 6 | up to **6 - the whole window** |
   | 1 yr chip | 1 to 2 of 12 | up to **12 - the whole window** |
   | 5 yr chip | 5 to 6 of 24 | 5 |
   | Max (148 mo, seeded persona) | 12 to 13 of 24 | 2 |

   **A. Month and year in the readout only.** The distinction that makes it principled rather than an
   oversight: **year-only governs claims about reaching the goal**, which is what the model cannot
   honestly assert to the month; **the readout describes where a point sits on a plotted curve**,
   which is an observation about the data rather than a claim about the future. That is 6.6.9's
   coordinate-versus-claim argument, which the plan has already accepted for the table. It softens
   6.10 and **must be recorded as a deliberate exception carrying that reasoning**, in D102, not left
   to look like a slip.

   **B. Year-only throughout.** Consistent, holds the line that no month appears anywhere, and accepts
   that the caption cannot distinguish two points in the same year.

   **What the numbers say, stated without settling it.** At the default window B gives 3 captions
   across 24 points and a 12-point run where the amount moves and the date does not. On the "1 yr"
   chip it can give **one caption for the entire window**. The cost is not confined to a boundary
   case; it is the ordinary behaviour of the shortest two windows. Against that, A is a real softening
   of a decision taken one amendment ago and the exception has to be written down, not assumed.
   **Decide before the build session; `readoutCaptionTemplate` is blocked on it (10.5).**
3. **The year-label thinning rule, confirmed against measured text.** The ceiling is calculated at 8
   labels from a ~26px "2027" at footnote size (~30px at Large, `--text-scale: 1.15`) against a 305px
   plot. A 13-label "Max" window is over it. Settled in `overlap.test.mjs` at both text sizes, not by
   eye.

### Layout judgements, taken during the build

4. **Where the year label sits relative to its boundary** - centred on the January position, or
   left-aligned from it. Centring puts the first label half outside the plot when a boundary falls
   near x=0; left-aligning reads as "this year starts here", which is what the label means. Leaning
   left-aligned, to be confirmed with item 2.
5. **Whether the date label sits above the point or pinned to the plot's top edge.** 6.6.3 recommends
   above the point, bought with 12 points of curve height; the fallback pins it to the top edge at no
   cost in height but separates the two halves of the detail. Both are measured, so this is a layout
   call with numbers rather than an open question.
6. **The five outstanding strings.** They are **not drafting work that can start now**: the brief
   carrying them did not arrive (10.5), and two of the five are blocked on decisions above -
   `readoutCaptionTemplate` on item 2, `endpointTemplate` on item 1a. D85 shipped
   `dateGoalAlreadyMet` as a placeholder on a live screen; that should not happen twice, and the way
   to avoid it is to land the two decisions first and draft against them.

### Conditions, not preferences - if one fails, a settled decision goes back

- **The table toggle is a visible peer of the chart in the default state**: not behind a menu, an
  overflow or a secondary control, and not below the fold at 390x844. Under decision 2 the table is
  the **only** place on the screen with date resolution finer than a year, so a buried toggle removes
  month resolution entirely for anyone who does not scrub. Asserted in `overlap.test.mjs`, both text
  sizes, step 8. **If it cannot be made to pass, decision 2 goes back** (6.9).
- **The always-visible readout and the endpoint line both survive the interaction.** Making the scrub
  the only route to a value fixes the second half of the 21:42 quote and reintroduces the first
  (6.9). Asserted by reintroduction in step 7.

### Confirmed by measurement, and recorded so they are not relitigated

- **Quarterly points do not clear the 44px touch target.** Measured at 38.1px. The option was proposed
  on the premise that they would. 6.6.1.
- **A per-point hit band does not clear it either**, in width, in either standard, and WCAG 2.5.8's
  spacing exception does not apply at a 13.3px pitch. 6.6.1.
- **A sixth range chip does not fit.** `components.css:1952` records the row as "334px of a 350px
  column" at five chips. 6.1.
- **Labelling every point at the default window collides by a factor of two** - 12.7px per label
  against ~26px of text - which is the participant's own 22:04 caveat, confirmed rather than assumed.
  6.11.
- **Year-only does not break the comparison card at any realistic contribution**: 0 collisions in
  4,830 configurations at the seeded rates, 6 in 9,660 across everything the app can produce. 7.5.
- **Year-only does break the endpoint line at short horizons**, at the rates and rate-pairs the app
  actually commits. 6.10.1, and item 1 above.
