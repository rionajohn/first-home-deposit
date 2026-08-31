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
| `content.js` 925-929 | The window chips, `6 m` / `1 yr` / `3 yr` / `5 yr` / `Max`, and their `ariaLabel`s | A window is a length by nature. "Show me the next six months" is not a projection and has no arrival date. Converting these would make the control name a date the chart then does not end at |
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

**The readout is always visible and is the point detail's home.** One figure, one place:

| State | Readout shows |
| --- | --- |
| At rest (no point active) | The amount at the **window's end** for the selected series |
| A point active (scrub, hover or keyboard) | The amount at **that point**, for the selected series |
| Dismissed (Escape, or release outside the plot) | Back to the window's end |

`figureDisplayHTML({ value, caption, live: true })` (`ui.js:674`). **The caption always names the date
the figure belongs to**, so a scrubbed value cannot be misread as the window-end value: the figure and
its date move together or not at all.

**Why the point detail lives in the readout rather than beside the point.** Two figures on one chart
is the state that produced the confusion being fixed, and a floating tooltip at 393px covers the line
it is describing. This also means the always-visible readout of requirement 1 is not competing with
the interaction - it *is* the interaction's output, and it holds a value whether or not anyone
interacts. See 6.9 on why that distinction is load-bearing.

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
the calendar month it is reached at the selected contribution. The amount at attainment *is*
`combined-goal`, so the line names the goal rather than restating a bar height. `[AWAITING COPY]`,
slots `{amount}` and `{date}`.

It is the element that carries requirement 5 in default window B, so it is not optional and not
collapsible.

**It keeps month and year. Reported, per the check asked for in 6.10.** See 6.10.

### 6.6 The interactive point detail

**On press, hover or keyboard focus of a point:** the amount saved at that point and the date it
falls on, both rendered into the readout (6.2), plus **a guide from the active point to the y-axis**
showing where that value sits on the scale, and the point itself drawn in its active state.

A vertical guide from the point down to the x-axis is **optional and to be judged in layout**. It
would help locate a point within a year, which the years-only axis cannot do; it also adds a second
rule across the plot. Not specified either way here.

#### 6.6.1 The interaction is a scrub, and the measurement is why

At a 24-month window, plot width 305px:

| Points plotted | Interval | Centre-to-centre spacing |
| --- | --- | --- |
| 25 (monthly, including "now") | 1 mo | **12.7px** |
| 24 (monthly) | 1 mo | **13.3px** |
| 9 (quarterly, including "now") | 3 mo | **38.1px** |
| 5 (half-yearly, including "now") | 6 mo | 76.3px |

Against the two thresholds that apply - 44x44px (Apple HIG, the design language this repo is held to)
and 24x24px (WCAG 2.5.8 Target Size (Minimum), AA):

| Option | Measured | Verdict |
| --- | --- | --- |
| **Quarterly points, monthly in the table** | 38.1px | **Fails the 44px HIG target by 6px.** It passes WCAG 2.5.8 and it was proposed on the premise that it clears the touch target; measured, it does not. It also costs two thirds of the line's resolution to buy a target that is still too small |
| **Monthly points, full-height vertical band** | 13.3px wide x 224px tall | **Fails.** Height clears; width does not, in either standard. WCAG 2.5.8's spacing exception needs a 24px-diameter circle centred on the target not to intersect a neighbour's - at 13.3px pitch they intersect, so the exception does not apply either |
| **Scrub** | Target is the plot: **305 x 224px** | **Passes.** There are no discrete targets to hit, so there is no targeting problem to solve. Full monthly resolution is kept, and it is the pattern native charts use on mobile |

**Scrub, on the measurement.** Press and drag anywhere in the plot; the nearest point snaps and the
readout updates continuously. On a pointer device the same mapping runs on hover.

**Plot resolution is fixed at 24 points**, or `rangeMonths` if fewer, replacing
`pointCount = Math.min(12, rangeMonths)`. Spacing is then 13.3px at every window and the snap
resolution never changes with the chip pressed. At the 24-month default each point is exactly one
month; at "Max" (148 months) each is about six, and the table view carries the monthly figures.

#### 6.6.2 Keyboard

The plot is a single focus stop with `aria-activedescendant` pointing at the active point, arrow keys
moving between points, Home and End to the ends, and Escape dismissing. **This is D84's listbox
contract applied to a different control**, not a new pattern: `dateSelectHTML` / `bindDateSelect`
(`ui.js:937`, `1005`) already implement it and `date-ceiling.test.mjs`'s last eleven tests already
read it off the same attributes a screen reader reads. Reuse the pattern; do not reuse the component.

The detail appears on **focus**, not only on pointer events.

#### 6.6.3 WCAG 1.4.13, satisfied by construction

| Requirement | How |
| --- | --- |
| **Dismissible** without moving the pointer | Escape returns the readout to the window's end. The same gesture doubles as the reset, so there is one way back rather than a hidden one |
| **Hoverable** - stays while the pointer is over it | The detail renders into the readout, which is a fixed element outside the plot. The pointer never has to travel to it, and moving within the plot updates it rather than dismissing it |
| **Persistent** until dismissed | The active point is state, not a transient tooltip. It survives until Escape, a re-selection, or a chip press |

A tooltip that vanished on any movement would fail all three, which is the second reason 6.2 puts the
detail in the readout rather than beside the point.

#### 6.6.4 The remaining accessibility requirements

- **1.4.1, no colour alone.** The active point is distinguished by **size and shape** - a larger
  radius with a ring - not by a colour change. The same rule the comparison card's "- your choice"
  already follows.
- **prefers-reduced-motion.** The line's draw-in, the guide's transition and the point's grow are all
  dropped to an instant state change under `@media (prefers-reduced-motion: reduce)`. The repo has
  the pattern in three places already (`components.css:642`, `2970`; `sheet-drag.js` handles it in JS
  where the motion is script-driven, `screens.css:427`), and the scrub's own snap is a state change
  rather than an animation, so it is unaffected.
- **The table is the equivalent, not the fallback.** Requirement 6, and 6.9.

### 6.7 Requirement 6 - the table view

A toggle above the chart, `chartView: 'chart' | 'table'`, a view setting on the same terms as
`chartSeries`. A new `chartTableHTML` in `ui.js` renders the **same points array** the chart renders -
one row per point, columns: date, at the low contribution, at the high contribution, with the selected
column marked in words. A real `<table>` with `<th scope>`, which is what makes it the text
alternative.

**It must expose every value the point detail can reveal**, which the shared points array guarantees
by construction: both views render the same array, and neither recomputes.

**Its date column carries month and year**, not years only. The axis is a scale and can be coarse; a
table row is a value and its date, and a column of repeating years would not identify its own rows.

**The toggle is a peer control, not a hidden affordance.** 6.9 explains why that is a requirement
rather than a preference.

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

**For a participant who does not interact, it holds only because the table is a first-class view.**
Without interacting, the dates on screen are "Now", the year labels, and the endpoint's month - so no
intermediate point's date is readable, and the table is where it lives. That is an acceptable
division **provided the table toggle is a visible peer of the chart rather than a de-emphasised
fallback.** If the toggle ends up buried in layout, the division fails and the axis has to carry
months after all. Recorded here as a condition on the layout, not as a risk to be watched: it is
checkable in `overlap.test.mjs` and by eye in step 14, and it is the one thing that would send the
years-only decision back.

### 6.10 Year-only granularity as an honesty claim, and where it stops

**Recorded as a reason for the axis decision, not only as a consequence of it.** A projection stated
to a named month twelve years out - "March 2039" - implies a precision the model does not have. The
model is an annuity-due solve at a pinned Bank Rate against a contribution the participant may change
next month; the month is an artefact of the arithmetic, not a finding. **Year-only is the more honest
claim**, and it sits more comfortably against the Consumer Duty consumer-understanding outcome, and
against MCOB 4.8A's guidance boundary, than a named month does. This belongs in the decision entry as
a reason.

**Checked against the endpoint line (6.5): it keeps month and year. Reported, with the reasoning.**

- The endpoint is the answer to the question the participant asked - when do I get there - and it is
  the only place on the screen that answers it at rest.
- Year-only stops discriminating at exactly the horizons where the choice is live. At the seeded
  persona a 5% deposit is reached in March 2029 at `left-over` and in June 2031 at `monthly-high`;
  coarsen both and two contributions three years apart still read as different years, but two a few
  months apart - which is the near-term comparison window B exists to serve - would collapse into one.
- **Coarsening the endpoint would leave no month anywhere on the screen at rest**, and the 26:20
  complaint was that the participant could not find out when they arrive.
- The precision concern is answered the way this build already answers it everywhere else: with a
  disclosure beside the figure, not by truncating the figure. `shared.regulatory.estimateDisclosure`
  and `chartCaptionTemplate` are already on this screen, and `/tracker`'s `onTrackBeyondWindowNote`
  ("These dates are an estimate based on what you're putting aside now. They move if that changes.")
  is the established wording for exactly this.

**Checked against the attained state (5.4): the question does not arise.** In that state the endpoint
line is replaced by a statement that the goal is already covered by what is saved, and no date is
rendered at all - no past date, no zero-length bar, no negative figure. There is nothing to coarsen.

**Checked against the comparison card: measured, and it extends. See 7.5.**

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
- **The date is the attainment year**, per 6.4's decision extended on the measurement in 7.5, falling
  back **card-wide** to month and year whenever two live rows would collide on a year.
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

**The fallback, and it is a card-wide one.** When any two live rows would resolve to the same year,
**all three rows fall back to month and year together.** Never one row in one format beside two in
another: a card whose three values are formatted differently has stopped being a comparison twice
over. One predicate, computed once per render, over the three years the card is about to draw.

**Why not simply keep month and year in the card always.** Because 6.10's honesty argument applies to
the card more strongly than anywhere else on the screen - these are the longest projections it
carries, out to 2051 at the seeded persona - and because the collision rate that would justify it is
0.06%. The fallback buys the 0.06% without spending the 99.94%.

**A consequence that needs its own decision: should the card follow the series selection?**

The card projects at `monthly-low` today (`calculator-result.js:175`, "the SLOWER end, deliberately"),
while the endpoint line (6.5) projects at the **selected** series. So with the series set to low, the
selected row and the endpoint line name the same projection in two granularities - "2039" in the card
and "March 2039" on the line - and with it set to high they name different ones. **A coincidence that
holds in one state and not the other is worse than either, because a participant cannot tell which
they are looking at.**

**Recommended: the card follows the series selection**, so one control governs the whole screen and
the selected row and the endpoint line always describe the same projection. It costs a reword of
`compareProvenanceCaption`, which currently says "at what you are putting away now" and silently means
`monthly-low`; it would have to name the selected rate. The card already recomputes on every render
and `rerenderInPlace` already redraws on a chip press, so there is no new mechanism.

**What is given up:** D72's "conservative end cannot disappoint" reasoning, which is why
`monthly-low` was hard-wired. Under the recommendation a participant on the high series sees the
optimistic dates in the card as well as on the line. That is a real trade and belongs in the D101
entry rather than in a comment.

**If the card and the line still read as two different figures in the browser**, the fix is to give
the **selected row** its month - matching the line - and not to coarsen the line. Judged by eye in
verification step 14, not decided here.

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
| `src/components/ui.js` | `growthChartHTML` is rebuilt as a **line** (6.11): `yTicks` replaces `yTop`/`yBottom`; the x-axis becomes absolutely-positioned year labels at computed percentages, with the thinning rule (6.4); plotted points with an active state; the y-guide. **Add** `chartTableHTML`, and `bindGrowthChart` for the scrub and keyboard contract (6.6.2), modelled on `bindDateSelect`. `pillSegmentsHTML`, `figureDisplayHTML`, `rateBandRowHTML`, `chipRowHTML`, `rerenderInPlace` are all reused unchanged |
| `src/css/screens.css` | `.growth-chart__bar`, `__bar-group` and `__bars` are **retired** with the bar rendering; `.growth-chart__x-axis` becomes a positioned scale rather than a flex row; new rules for the line, the points and their active state (size and shape, never colour), the y-guide, the y-tick gridlines, and a `.growth-chart__table` block. A `prefers-reduced-motion` block for the draw-in and the guide (6.6.4). `shell.css` is not touched |
| `src/content.js` | `chartRangeLabels`: **"3 yr" (36) is replaced by "2 yr" (24)**, which becomes the default. Five chips, not six - the row has 16px of slack (6.1) |

### 8.5 Docs

| File | Change |
| --- | --- |
| `docs/DECISIONS.md` | Five entries. **Read the last number in the file and take the next** - it stands at D96 as this plan is written, so D97 onward unless something has landed in between |
| `docs/GAPS.md` | Three entries, from G111 onward on the same rule |
| `docs/build-spec.md` | Row 121's chart specification is already superseded by D73; annotate it with the new default window rather than leaving a third stale reading |
| `docs/README.md` | **No version-log row from this plan.** A row is written as part of a merge to `main`, with a reason supplied by Riona, never retrospectively |

**Decision entries:**

| | |
| --- | --- |
| D97 | The session anchor: stamped at session start, discarded on a month mismatch under D59's rule, surfaced on frame 33. **Amends D3** - the pinned rate dates figures, not the render |
| D98 | Durations become calendar dates calculator-wide. Carries the section 2 audit, the frame 10 boundary, and the transitional state |
| D99 | One bounding rule at goal attainment, serving the date listbox and the projection; the attained state; per-consumer rounding, with D85's precedent for why the directions differ |
| D100 | Frame 12's chart rebuilt to the seven requirements: a line with a scrub-driven point detail, a years-only axis positioned as a scale, and a 24-month default. **Reverses D73's amendment on the default window** on the restated reason in 6.1, retires the bar rendering, and swaps "3 yr" for "2 yr" in the chip row. Carries 6.10's honesty argument as a **reason** for years-only, not only as its consequence, and 6.9's condition that the table stays a first-class view |
| D101 | The comparison card reframed as an interval, the footnote marker, and years-only extended to the rows with a card-wide collision fallback (7.5, measured). The trade against D46 per 7.4, and - if open decision 4 lands - the trade against D72's hard-wired `monthly-low` |

**Gap entries:**

| | |
| --- | --- |
| G111 | Frame 21 projects to `deposit-target`, not `combined-goal` (`mip-result-not-yet.js:80`), against D70. It is now a *date* that disagrees with the tracker's, which is more visible than a duration was. **Report only - do not fix in this pass** |
| G112 | `formatMonthsDuration` has no callers after this pass. Recorded, kept, not deleted |
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

**`content['/calculator/result']`**

| Key | Status |
| --- | --- |
| `chartSeriesLegend` | New - visually-hidden group label for the series control |
| `chartSeriesCaptionTemplate` | New - the readout caption, naming the selected contribution in words |
| `readoutCaptionTemplate` | New - `[AWAITING COPY]`, slots `{date}`, `{amount}`. **It always names the date the figure belongs to** (6.2), so a scrubbed value cannot be read as the window-end value |
| `chartPlotAriaLabel`, `chartPointAriaLabelTemplate` | New - the scrub target's accessible name and each point's, slots `{date}`, `{amount}`. Read by `aria-activedescendant` (6.6.2) |
| `chartRangeLabels` | **"3 yr" replaced by "2 yr"** (24 months), which becomes the default. `ariaLabel` follows the WCAG 2.5.3 rule the existing five already keep: it opens with the visible label |
| `endpointTemplate` | New - `[AWAITING COPY]`, slots `{amount}`, `{date}` |
| `chartViewChartLabel`, `chartViewTableLabel` | New - the view toggle |
| `chartTableCaption`, `chartTableMonthHeader`, `chartTableLowHeader`, `chartTableHighHeader` | New - the table's own labels |
| `goalAttainedHeadline`, `goalAttainedBody` | New - `[AWAITING COPY]`, slots `{saved}`, `{goal}`. Not an error and must not read as one (D78) |
| `xAxisNow` | Kept or replaced by the anchor month - decided with 6.4's measurement |
| `chartRangeAnnouncementTemplate` | Reworded - `{range}` becomes a date |
| `compareHeading` | Reworded - `[AWAITING COPY]`, names an interval |
| `compareRowSublabelTemplate`, `compareRowSelectedSublabelTemplate` | Reworded for the inverted row |
| `compareFootnoteMarker` | New - a literal character |
| `compareProvenanceCaption` | Reworded to open with the marker, and - if open decision 4 lands - to **name which rate**, since "at what you are putting away now" silently means `monthly-low` today (7.5) |
| `compareWithinTemplate` | **Retired** |
| `beyondWindowNote` | **Retired** (2.1 item 5) |
| `compareAlreadyLabel` | Unchanged - already the attained-row label |
| `legendTemplate` | Unchanged - reused by the series control |

**`content['/mip/result/not-yet']`** - `step1CaptionTemplate` reworded, `{months}` becomes `{date}`.

**`content['/learn/ltv']`** - `tableReachedRowLabel` new ("Reached by").

**`content['/settings']`** - `anchorCaptionTemplate` new, slot `{anchor}`. `buildCaptionTemplate`
untouched.

`shared.regulatory` is untouched. No line under it is reworded, shortened, removed, or dropped from a
screen that carries it.

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
   existing harnesses drives a pointer across a plot. Assert: a scrub updates the readout and its
   date together; the readout returns to the window's end on Escape **without the pointer moving**
   (WCAG 1.4.13 dismissible); the detail persists while the pointer moves within the plot rather than
   vanishing (hoverable, persistent); arrow keys traverse points on focus alone and
   `aria-activedescendant` follows, read off the same attributes `date-ceiling.test.mjs` reads; the
   active point differs from the rest in **radius**, not only in fill (1.4.1); the table view exposes
   a row for **every** point the scrub can reach, compared array-to-DOM rather than by count alone;
   and under `prefers-reduced-motion: reduce` no transition duration is applied to the line, the
   guide or the point.
7. **Reintroduce each defect and confirm the new tests fail.** D85's precedent, and the reason
   `chart-range.test.mjs` exists at all - it passed against an inverted chart. Specifically: round the
   projection endpoint down; re-stamp the anchor instead of discarding; restore the 4-label x-axis
   against 12 marks; remove the year-label thinning rule; drop the always-visible readout so the
   value is only reachable by interacting (6.9).
8. `node --test scripts/overlap.test.mjs` - all 37 rows, both text sizes. Rows `12` and `13` are the
   ones this pass touches: the readout, the endpoint line, the series control, the view toggle, the
   table, and the LTV table's sixth row. Three things are **settled here rather than assumed**:
   6.4's year-label pitch at Large text (open decision 1); the five-chip row with "2 yr" in it, which
   has 16px of slack and has not been re-measured since D75; and whether the table toggle reads as a
   peer of the chart rather than a buried fallback, which 6.9 makes a condition on the years-only
   decision rather than a preference.
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
16. Docs written in the same commits: D97-D101 (numbers confirmed against the file at the time),
    G111-G113. No `README.md` version row until the merge, with a reason supplied.

---

## 12. Open decisions

*Re-recorded 31 August 2026. Three of the original four are settled; the two that were about axis
labelling are superseded rather than answered, because a years-only axis asks a different question.*

### Settled

| | Decision | Where it landed |
| --- | --- | --- |
| 1 | **Default window: option B, 24 months, endpoint carried in text.** | 6.1, with D73's clause reversed on the restated reason: the barrier was reading a value, not seeing the whole projection |
| 2 | **The x-axis carries years only. No months anywhere on the axis.** | 6.4, and the axis becomes an absolutely-positioned scale rather than a row of captions |
| 3 | **A line with plotted points, with the value revealed on press or hover and a guide to the y-axis.** | 6.6, with the interaction settled as a **scrub** on the measurement in 6.6.1 |
| - | **Years-only extends to the comparison card**, with a card-wide fallback to month and year on a collision | 7.5, measured: 0 collisions in 4,830 configurations at the seeded rates, 6 in 9,660 across everything the app can produce |
| - | **The endpoint line keeps month and year**, and the attained state renders no date at all | 6.10, reported against the same honesty reasoning that settled the axis |

### Superseded

**Old 2, "four x labels or five".** There is no fixed label count now. The axis emits one label per
January boundary inside the window, so the count follows the window: 2 at six months, 3 at the
24-month default, 13 at "Max" on the seeded persona.

**Old 3, "abbreviated or full month on the axis".** Gone entirely - there are no months on the axis.

### Open

1. **The year-label thinning rule, confirmed against measured text rather than the estimate in 6.4.**
   The ceiling is calculated at 8 labels from a ~26px "2027" at footnote size (~30px at Large,
   `--text-scale: 1.15`) against a 305px plot. A 13-label "Max" window is over it and must thin.
   Settled in `overlap.test.mjs` at both text sizes, not by eye.
2. **Where the year label sits relative to its boundary** - centred on the January position, or
   left-aligned from it. Centring puts the first label half outside the plot when a boundary falls
   near x=0; left-aligning reads as "this year starts here", which is what the label means. Leaning
   left-aligned, to be confirmed with 1.
3. **The vertical guide from the active point to the x-axis** - optional in 6.6. It locates a point
   within a year, which the axis cannot do, at the cost of a second rule across the plot. Judged in
   layout.
4. **Does the comparison card follow the series selection?** 7.5 recommends yes, so one control
   governs the screen and the selected row and the endpoint line cannot describe different
   projections. It trades away D72's hard-wired `monthly-low`, so it needs a decision rather than an
   implementation choice.
5. **The five `[AWAITING COPY]` strings** - section 10. D85 shipped `dateGoalAlreadyMet` as a
   placeholder on a live screen; that should not happen twice.

### Confirmed by measurement, and recorded so they are not relitigated

- **Quarterly points do not clear the 44px touch target.** Measured at 38.1px. The option was proposed
  on the premise that they would. 6.6.1.
- **A per-point hit band does not clear it either**, in width, in either standard, and WCAG 2.5.8's
  spacing exception does not apply at a 13.3px pitch. 6.6.1.
- **A sixth range chip does not fit.** `components.css:1952` records the row as "334px of a 350px
  column" at five chips, so "2 yr" replaces "3 yr" rather than joining it. 6.1.
- **Labelling every point at the default window collides by a factor of two** - 12.7px per label
  against ~26px of text - which is the participant's own 22:04 caveat, confirmed rather than assumed.
  6.11.
