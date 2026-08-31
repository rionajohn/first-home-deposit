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

### 6.1 The default window - options, not a pick

At the seeded session (`STAGE_PROPERTY_VALUE` 450,000, `left-over` 640) attainment lands well over a
decade out. Measured against `monthsToReachAmount` from a zero balance:

| Deposit % | `combined-goal` | At 255/mo (seeded rate) | At 640/mo (`left-over`) |
| --- | --- | --- | --- |
| 5% | 30,000 | 100 mo (8.4 yr) | 44 mo (3.6 yr) |
| 10% | 52,500 | 159 mo (13.3 yr) | 73 mo (6.1 yr) |
| 20% | 97,500 | 253 mo (21.1 yr) | 125 mo (10.4 yr) |
| 25% | **120,000** | 291 mo (24.2 yr) | **148 mo (12.3 yr)** |

A chart bounded at attainment is 12 to 24 years wide, mostly flat, and the first two years - the part
that discriminates 200 a month from 400 a month - occupy under a sixth of it. **This is not resolved
here. Four options, with a recommendation, to be decided before the build session starts.**

**A. Open at attainment (keep today's "Max" default).** The chart is the whole projection. Cheapest -
no change to the default. It is what the pilot ran against and what failed; the participant could see
the shape and not the near term.

**B. Open at a near-term window (24 months), endpoint carried in text. RECOMMENDED.** The chart shows
the two years the choice turns on. Requirement 3's endpoint - the amount at attainment and the month
it is reached - is a labelled line beneath the chart, always drawn, at every window. Requirement 5 is
satisfied by the *projection*, which still ends at attainment and which the chips still reach; it is
not a claim about the default *window*. Cost: the default view no longer shows the goal being met,
and the endpoint line has to carry that alone.

**C. A non-linear x-axis** - dense marks in the first 24 months, sparse after. Rejected. A time axis a
participant has to be taught is the wrong instrument in a comprehension study, and P10 is a finding
about an axis that already could not be read.

**D. Chart to attainment, near-term detail delegated to the table.** The chart answers "will I get
there"; the table (requirement 6) answers "how much at month N". Cheaper than B on the chart and
worse on requirement 1, since the primary fix would then live behind a toggle.

**Why B.** The undecided question at 23:28 was 200 against 400 in the near term, and B is the only
option that puts that in the default view. The endpoint as text is also the one form that survives a
390px viewport unconditionally.

**What B costs against a standing decision, stated.** D73's amendment moved the default from five
years to "Max" so "a participant sees the shape of the thing before they narrow it". B reverses that
clause. It needs its own decision entry saying so, with the reason: the shape was legible and the
numbers were not, which is evidence D73 did not have.

**And it is spec-silent.** `build-spec.md` row 121 specifies a chart "plotted to 5 years" with
thresholds at 5/10/15%, all of which D73 removed. No default window is specified. Whichever option is
taken is a decision this repo owns, and is recorded as one.

### 6.2 Requirement 1 - the readout. This is the primary fix

**The screen has no selection between contributions today.** The chart plots `monthly-low` and
`monthly-high` as a stacked band with a legend and nothing to select. "200 pounds a month or 400
quid" is a choice the screen never offered.

**Add a series selection**, `chartSeries: 'low' | 'high'`, and hang the readout off it:

- Rendered through the existing `pillSegmentsHTML` (`ui.js:1835`), above the chart, labelled from the
  two contributions - the existing `legendTemplate` ("At {amount} a month") already carries the right
  words and is reused rather than duplicated.
- **A view setting, exactly like `chartRangeMonths`.** It is added to `state.js`'s defaults, is **not**
  added to `STAGE_KEYS`, and **never writes a section 6 figure**. It changes what the chart draws and
  never what the model projects - D73's own words for the range control, and the standing state rule.
- The readout is `figureDisplayHTML({ value, caption, live: true })` (`ui.js:674`): the amount saved at
  the window's end for the selected series, from `balanceAtMonth()`, updating as the selection or the
  window changes. Caption names the contribution in words.
- **Both bands stay drawn.** Selection changes which one the readout reports and which is emphasised;
  it does not hide the other. Hiding it would remove the comparison, which is the screen's job.
- Re-render through `rerenderInPlace` (`ui.js:321`), the same path the range chips already use, so the
  chart redraws under the participant's thumb and focus returns to the pressed control.

### 6.3 Requirement 2 - a labelled y-axis

`growthChartHTML` takes `yTop` and `yBottom` and draws two absolutely-positioned labels. It gains a
`yTicks` array - four or five values with their percentage positions - drawn as labelled gridlines in
the 48px left gutter that already exists (`screens.css:1209`). `yTop` and `yBottom` become the first
and last tick rather than separate parameters.

Tick values come from a rounding helper so the axis reads in round pounds rather than in
`maxScale / 4`. That helper is new and lives in `format.js` beside the other display rules, not in the
screen.

### 6.4 Requirement 4 - labels that reconcile with the marks

**P10, measured.** `.growth-chart__bars` draws `pointCount` (up to 12) groups with
`justify-content: space-between`; `.growth-chart__x-axis` draws 4 labels in a separate flex row, also
`space-between`. The two rows have the same padding and different counts, so **no label sits under the
mark it names**, and the first label ("Now") sits under the first bar, which is at
`rangeMonths / pointCount` months and not at zero. The participant counted 11 bars against 4 labels
and was right.

**The fix is structural, not a count adjustment.** `growthChartHTML` renders the x-axis as **one cell
per point**, in the same flex geometry as `.growth-chart__bar-group` (`flex: 1 1 0; min-width: 0`), so
cell *n* is under mark *n* by construction. A label is emitted on a subset - the first point, the
last point, and evenly spaced points between - and the remaining cells are empty. The count can then
never disagree with the marks, because the axis is drawn from the same array.

**How many labels.** The logical frame is 393px (`shell.css:22`) less the 48px y-gutter and the
screen's own padding: roughly 325px. A footnote-size "Mar 2029" measures about 52px. **Four labels
with clear gaps; five is the ceiling and must be measured, not assumed.** Specify four, and let
`overlap.test.mjs` at Large text decide whether it holds - that harness runs both text sizes and is
the right place for this.

**Format.** Abbreviated month plus year ("Mar 29" or "Mar 2029") is a copy decision to be taken with
the measurement above; the endpoint line and the readout carry the unabbreviated form, so the axis can
afford to abbreviate.

### 6.5 Requirement 3 - the labelled endpoint

A line beneath the chart, drawn at every window and in every non-attained state: the goal amount and
the calendar month it is reached at the selected contribution. The amount at attainment *is*
`combined-goal`, so the line names the goal rather than restating a bar height. `[AWAITING COPY]`,
slots `{amount}` and `{date}`.

It is the element that carries requirement 5 in default window B, so it is not optional and not
collapsible.

### 6.6 Requirement 6 - the table view

A toggle above the chart, `chartView: 'chart' | 'table'`, a view setting on the same terms as
`chartSeries`. A new `chartTableHTML` in `ui.js` renders the **same points array** the chart renders -
one row per mark, columns: month, at the low contribution, at the high contribution, with the selected
column marked in words. A real `<table>` with `<th scope>`, which is what makes it the text
alternative.

Rendering both views from one points array is the constraint that keeps them from disagreeing. Do not
recompute.

### 6.7 Requirement 7 - nothing carried by colour alone

The two bands already clear 3:1 against each other and against the plot in both themes (D73's
amendment) and each legend row already carries the fill of the band it names (G90). What is new is the
**selection**, and it must not be a colour change alone: the pill control carries `aria-pressed` and
visible text, and the readout caption names the selected contribution in words. The same rule
`compareRowSelectedSublabelTemplate` already follows on the comparison card.

### 6.8 What the chart type ends up being

Following the requirements rather than choosing first: a **bar chart with a labelled y-axis, one x
label per labelled mark, a live readout, and a table alternative**. The participant's line-with-labels
suggestion at 22:04 came with its own correct caveat ("On the phone, not sure how much easier that
would be"); labelling every point at 393px collides, and requirement 1's readout answers "how much
exactly" without needing per-point labels at all. The existing bar rendering is kept - it is not what
failed.

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

- **Each line leads with the date reached.** `label` becomes the calendar month; `sublabel` carries
  the percentage and the marker; `value` keeps the deposit amount, so nothing the participant might
  have chosen disappears. Three slots, the existing component, no new geometry.
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
| `src/components/ui.js` | `growthChartHTML`: `yTicks` replaces `yTop`/`yBottom`; the x-axis becomes one cell per point with labels on a subset (6.4). **Add** `chartTableHTML`. `pillSegmentsHTML`, `figureDisplayHTML`, `rateBandRowHTML`, `chipRowHTML`, `rerenderInPlace` are all reused unchanged |
| `src/css/screens.css` | `.growth-chart__x-axis` regeometried to match `.growth-chart__bars` (both `flex: 1 1 0; min-width: 0`); gridline rules for the y ticks; a `.growth-chart__table` block. `shell.css` is not touched |

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
| D100 | Frame 12's chart rebuilt to the seven requirements. **Reverses D73's amendment on the default window**, with the reason |
| D101 | The comparison card reframed as an interval, and the footnote marker. The trade against D46, per 7.4 |

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
| `readoutCaptionTemplate` | New - `[AWAITING COPY]`, slots `{date}`, `{amount}` |
| `endpointTemplate` | New - `[AWAITING COPY]`, slots `{amount}`, `{date}` |
| `chartViewChartLabel`, `chartViewTableLabel` | New - the view toggle |
| `chartTableCaption`, `chartTableMonthHeader`, `chartTableLowHeader`, `chartTableHighHeader` | New - the table's own labels |
| `goalAttainedHeadline`, `goalAttainedBody` | New - `[AWAITING COPY]`, slots `{saved}`, `{goal}`. Not an error and must not read as one (D78) |
| `xAxisNow` | Kept or replaced by the anchor month - decided with 6.4's measurement |
| `chartRangeAnnouncementTemplate` | Reworded - `{range}` becomes a date |
| `compareHeading` | Reworded - `[AWAITING COPY]`, names an interval |
| `compareRowSublabelTemplate`, `compareRowSelectedSublabelTemplate` | Reworded for the inverted row |
| `compareFootnoteMarker` | New - a literal character |
| `compareProvenanceCaption` | Reworded to open with the marker |
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
   defect): the last mark never exceeds `combined-goal`; the endpoint month equals `goalMonths`
   rounded up; the number of x labels equals the number of labelled marks and each sits in its own
   mark's cell; the readout figure equals `balanceAtMonth` for the selected series at the window's
   end; switching series changes the readout and not the projection; the attained state draws no
   chart, no zero-length bar and no negative figure anywhere on the screen; no chip is offered beyond
   attainment.
7. **Reintroduce each defect and confirm the new tests fail.** D85's precedent, and the reason
   `chart-range.test.mjs` exists at all - it passed against an inverted chart. Specifically: round the
   projection endpoint down; re-stamp the anchor instead of discarding; restore the 4-label x-axis
   against 12 marks.
8. `node --test scripts/overlap.test.mjs` - all 37 rows, both text sizes. Rows `12` and `13` are the
   ones this pass touches: the readout, the endpoint line, the series control, the view toggle, the
   table, and the LTV table's sixth row. This is also where 6.4's "four labels, five is the ceiling"
   is settled at Large text rather than assumed.
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

## 12. Open decisions, to be settled before the build session

1. **The default window** - 6.1, options A to D, B recommended. Do not start without this.
2. **Four x labels or five** - 6.4. Measured in step 8, not assumed.
3. **Abbreviated or full month on the axis** - 6.4, taken with the measurement.
4. **The attained-state copy** and the four other `[AWAITING COPY]` strings - section 10. D85 shipped
   `dateGoalAlreadyMet` as a placeholder on a live screen; that should not happen twice.
