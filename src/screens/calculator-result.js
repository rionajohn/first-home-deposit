/**
 * Frame 12 — Your deposit range. Figma node 66:887. Reference:
 * reference/frames/12 Deposit calculator - your deposit range.png.
 *
 * Variants built (build-spec.md section 2):
 *   - the ordinary case: a projection with length, chart drawn
 *   - attained: `goalAttained(state)` — no chart, no chips, no series control,
 *     no readout, no table; the comparison card stays (D46). D99
 *   - unreachable: savings-rate (here, both monthly-low and monthly-high)
 *     = 0 — no wireframe drawn (D7 fallback); the growth chart and timing
 *     rows are replaced with the shared empty-state-card pattern
 *
 * THE CHART IS A LINE WITH AN INTERACTIVE POINT (DECISIONS.md D100), rebuilt
 * from bars after the 31 August 2026 pilot. The participant liked it on sight
 * and could not extract a single number from it: "I don't have a y-axis to
 * know what the value is. I can't hover and see what the values are either"
 * (21:42), and "I still don't know whether I would choose to have it at 200
 * pounds a month or 400 quid" (23:28). The chart existed to support choosing a
 * contribution and did not support that choice.
 *
 * What answers it, in the order the requirements are numbered in the plan:
 *   1. a readout naming the exact amount, always visible, reporting the active
 *      point — the primary fix, and it must never become interaction-only
 *   2. a labelled y-axis, so the chart is readable without interacting
 *   3. an endpoint line naming the goal and the year it is reached
 *   4. an x-axis that is a SCALE, closing pilot finding P10
 *   5. a projection bounded at goal attainment, never overshooting
 *   6. a table view of the same points array
 *   7. nothing carried by colour alone
 *
 * EVERY DATE THIS SCREEN CLAIMS IS A YEAR (D102). The projection is not
 * accurate to the month and stating it to the month invites a participant to
 * read it as a commitment. The two exceptions report a COORDINATE on a plotted
 * curve rather than an arrival — the readout under the chart and the table's
 * own column — and they are named exceptions rather than oversights. The
 * boundary: nothing that says a goal WOULD BE REACHED names a month.
 *
 * ALL DATES DERIVE FROM `state.sessionAnchor` (D97), stamped once at session
 * start and discarded whole on a month mismatch, never from a render-time
 * `new Date()`. A stale anchor would produce wrong years with nothing on
 * screen to reveal it.
 *
 * `CHART_DEPOSIT_PCTS` still supplies the "Why a bigger deposit helps" card's
 * low and mid figures, which is why it is still imported.
 *
 * Two "how did we work this out" links are wired to their build-spec.md
 * section 1 destinations: the one directly under the range figure goes to
 * frame 30 (deposit and rates); the one inside the How-this-works card
 * (which repeats frame 06's own money-in/essential-spending card verbatim)
 * goes to frame 29 (saving amount), matching how position-summary.js wires
 * the same card. A THIRD now sits under the endpoint line — see below.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  infoBannerHTML,
  flagRowHTML,
  growthChartHTML,
  chartTableHTML,
  bindGrowthChart,
  chipRowHTML,
  segmentedControlHTML,
  rateBandRowHTML,
  figureRowHTML,
  figureDisplayHTML,
  infoLinkHTML,
  howThisWorksCardHTML,
  emptyStateCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatYear, axisScale } from '../format.js';
import { balanceAtMonth, monthsToReachAmount, checkpointAmount, goalMonths, goalAttained, stampDuty, combinedGoal } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHART_WINDOW_MONTHS, CHART_MIN_RANGE_MONTHS } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

/** ONE POINT PER YEAR (D105, reversing the plan's 10.6 exception). Monthly
 *  points forced the readout to name a month, because twelve of them shared one
 *  year - on the "1 yr" chip, one caption for the whole window. Plotting yearly
 *  removes that ambiguity at source rather than working around it, so every date
 *  on this screen is a year again and the exception is gone. */
const MONTHS_PER_POINT = 12;

/** D100's headroom, moved from D73's 1.05. The date label sits ABOVE the
 *  active point and the active point at rest is the highest one, so at 1.05 the
 *  screen's DEFAULT state was the colliding state — measured, by 17.3px at
 *  default text and 20px at Large. This is the space that label occupies. */
const CHART_HEADROOM = 1.20;

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

/** Months from the anchor to 1 January of each year the window spans, as a
 *  percentage of the window. The x-axis is a scale: a label at x% names the
 *  moment at x%, whether or not a point falls there. */
function yearLabelsFor(anchorDate, rangeMonths) {
  const base = new Date(anchorDate);
  const labels = [];
  for (let m = 1; m <= rangeMonths; m += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + m, 1);
    if (d.getMonth() !== 0) continue;
    labels.push({ label: String(d.getFullYear()), pct: (m / rangeMonths) * 100 });
  }
  return labels;
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/result'];
  const summaryContent = content['/position/summary'];
  const reg = content.shared.regulatory;

  // `combined-goal` AND `stamp-duty` JOIN THE GUARD because this screen now
  // displays both (D72). Same rule as /tracker's: a screen may only show a
  // figure derived from a key its own guard tested.
  if (
    state['deposit-target'].value === null
    || state['combined-goal'].value === null
    || state['stamp-duty'].value === null
    || state['months-to-target'].provenance === null
  ) {
    window.location.replace('#/calculator/review');
    return;
  }

  const anchor = state.sessionAnchor;
  const propertyValue = state['property-value'].value;
  const savedTowardDeposit = state['saved-toward-deposit'].value;
  const monthlyLow = state['monthly-low'].value;
  const monthlyHigh = state['monthly-high'].value;
  const depositTargetValue = state['deposit-target'].value;
  const essentialSpending = state['essential-spending'].value;
  const leftOverValue = state['left-over'].value;

  // ONLY THE BENEFIT CARD READS THESE (D73).
  const [lowPctValue, midPctValue] = CHART_DEPOSIT_PCTS;

  const depositPctValue = state['deposit-pct'].value;
  const stampDutyValue = state['stamp-duty'].value;
  const combinedGoalValue = state['combined-goal'].value;

  // THE SELECTED CONTRIBUTION, and one control now governs the whole screen
  // (the plan's 7.6): the chart, the readout, the endpoint line AND the
  // comparison card all project at it. Defaults to 'low' in state.js, which is
  // what keeps D72's "the conservative end cannot disappoint" intent alive as a
  // default rather than as a floor.
  const series = state.chartSeries === 'high' ? 'high' : 'low';
  const selectedRate = series === 'high' ? monthlyHigh : monthlyLow;

  // ONE PREDICATE, ONE PLACE (D99). This was computed inline as `goalMet`.
  const attained = goalAttained(state);
  const unreachable = monthlyLow <= 0 && monthlyHigh <= 0;

  // THE PROJECTION ENDS AT GOAL ATTAINMENT (D99), never at a fixed horizon and
  // never past the goal. Rounded UP: rounding down ends the chart the month
  // before the goal is met, drawing a final point below the goal beside a line
  // saying it is reached. D85's cap rounds the other way because the unsafe
  // direction there is the other one — the rule is one, the rounding is not.
  //
  // TWO FIGURES, NOT ONE, AND THE DIFFERENCE IS THE WHOLE POINT. `attainExact`
  // is the crossing itself and is what the "Max" WINDOW runs to, so the last
  // plotted point lands ON the goal rather than a fraction of a month past it -
  // rounding the window up carried it to 52,777 against a 52,500 goal, which
  // requirement 5 forbids. `attainmentMonths` is that crossing rounded UP and
  // is what the endpoint line's YEAR and the chip filter read, because a
  // participant must never be told they arrive a fraction of a month early.
  const endpoint = goalMonths(state, selectedRate);
  const attainExact = !attained && endpoint.value !== null && Number.isFinite(endpoint.value) && endpoint.value > 0
    ? endpoint.value
    : null;
  const attainmentMonths = attainExact === null ? null : Math.ceil(attainExact);

  // THE WINDOW OPENS AT 24 MONTHS (D100, reversing D73's amendment). D73 moved
  // the default to "Max" so a participant would see the whole shape first,
  // which assumes the barrier was not seeing the projection. The pilot showed
  // the barrier was being unable to read any value off it. Widening a window
  // cannot fix an unreadable chart; requirement 1 now puts a figure on screen
  // unconditionally, so the window is free to serve the near-term question.
  const rangeMonths = attained
    ? CHART_WINDOW_MONTHS
    : state.chartRangeMonths
      ?? (attainExact !== null ? Math.max(CHART_MIN_RANGE_MONTHS, attainExact) : CHART_WINDOW_MONTHS);

  // THE YEARLY GRID IS ANCHORED TO THE END OF THE WINDOW, NOT TO TODAY, and
  // that is what keeps every point in a different calendar year. Counting
  // forward from today would put the "Max" window's final point - the exact
  // crossing, which is rarely a whole number of years out - in the same year as
  // the one before it, and two points sharing a year is the ambiguity yearly
  // plotting exists to remove. Counting back from the end makes the FIRST
  // interval the partial one instead, where it costs nothing.
  const monthsList = [];
  for (let m = rangeMonths; m >= MONTHS_PER_POINT; m -= MONTHS_PER_POINT) monthsList.push(m);
  // A window shorter than a year still has to draw a line rather than a dot.
  if (monthsList.length === 0) monthsList.push(rangeMonths);
  monthsList.push(0);
  monthsList.reverse();

  // RENDERED BY BOTH THE CHART AND THE TABLE and recomputed by neither, which
  // is what guarantees the table exposes every value the guide can reveal
  // rather than a second derivation that could drift.
  const points = monthsList.map((months) => ({
    months,
    date: formatYear(months, anchor),
    low: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyLow, months }),
    high: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months }),
  }));
  const pointCount = points.length;

  // The axis top is a ROUND number and the data is plotted against it, so the
  // two share one scale rather than the axis being fitted to the data after the
  // fact. It also carries D100's headroom for the date label above the point.
  const { top: maxScale, ticks } = axisScale(
    Math.max(...points.map((p) => Math.max(p.low, p.high))),
    CHART_HEADROOM,
  );
  for (const p of points) {
    p.lowPct = (p.low / maxScale) * 100;
    p.highPct = (p.high / maxScale) * 100;
  }

  // A POINT IS ACTIVE AT REST — the last in the window (the plan's 6.6.2b). On
  // touch there is no hover, so nothing would hint the chart is interactive;
  // with a point already active, scrubbing reads as moving something that is
  // there rather than discovering something hidden. It also collapses a
  // redundancy: the at-rest readout and the window's end are one state, so the
  // readout has one rule — it reports the active point, always.
  const activeIndex = Math.max(0, Math.min(pointCount - 1, state.chartActiveIndex ?? pointCount - 1));
  const activePoint = points[activeIndex];
  const activeAmount = series === 'high' ? activePoint.high : activePoint.low;

  // ONE ROW, THE PARTICIPANT'S OWN (D113). The card showed their deposit and
  // the two either side of it; the pilot objected to both of the others - "I'm
  // not sure why I'm comparing this to the other options that I didn't pick"
  // (24:48) and "I didn't really ask for the other ones" (25:27). The YEAR is
  // what they wanted and is why the row survives at all.
  //
  // STILL DERIVED ONCE, ABOVE THE TEMPLATE, and that is not left over from the
  // three-row version. The reason for the hoist was that a consumer which
  // recomputes its own inputs will eventually disagree with what it describes,
  // and that holds with one row exactly as it did with three - the row's year
  // and the caption beneath it read one derivation.
  const ownGoal = depositTargetValue + stampDutyValue;
  const ownAlreadySaved = savedTowardDeposit >= ownGoal;
  const ownMonths = ownAlreadySaved
    ? 0
    : monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount: ownGoal, monthlyAmount: selectedRate });
  const ownRow = {
    pctLabel: formatPercent(depositPctValue, 0),
    amount: depositTargetValue,
    alreadySaved: ownAlreadySaved,
    year: ownAlreadySaved || !Number.isFinite(ownMonths) ? null : formatYear(Math.ceil(ownMonths), anchor),
  };

  const chartVisible = !unreachable && !attained;
  const showTable = state.chartView === 'table';

  const seriesOptions = [
    { value: 'low', label: fill(c.legendTemplate, { amount: formatCurrency(monthlyLow) }) },
    { value: 'high', label: fill(c.legendTemplate, { amount: formatCurrency(monthlyHigh) }) },
  ];

  const yearLabels = yearLabelsFor(anchor, rangeMonths);

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${fill(c.headlineTemplate, { amount: formatCurrency(depositTargetValue) })}</h2>
      <p class="provenance-caption">${fill(c.depositBasisCaptionTemplate, { pct: formatPercent(depositPctValue, 0), property: formatCurrency(propertyValue) })}</p>
      ${infoLinkHTML({ label: c.assumptionsLinkLabel, action: 'open-assumptions-deposit' })}

      <h3 class="section-heading">${c.goalHeading}</h3>
      <div class="assumptions-list">
        ${figureRowHTML({ label: c.goalDepositLabel, trailing: formatCurrency(depositTargetValue) })}
        ${figureRowHTML({ label: c.goalStampDutyLabel, trailing: formatCurrency(stampDutyValue), caption: c.goalStampDutyCaption })}
        ${figureRowHTML({ label: c.goalTotalLabel, trailing: formatCurrency(combinedGoalValue) })}
      </div>

      <!-- ONE STANDALONE BOX, NO SELECTION HIGHLIGHT (D113). There is nothing
           left to be selected AGAINST, so highlighted would mark a row as
           chosen from a set of one. The card is drawn in every state including
           the attained one, where the row reads compareAlreadyLabel instead
           of a year.

           aria-describedby KEEPS ITS BINDING even though the visible asterisk
           is gone: with one row the caption sits directly beneath the figure it
           describes and needs no marker to say which figure that is, but the
           relationship still has to be programmatic for anyone not reading by
           position. -->
      <h3 class="section-heading">${c.compareHeading}</h3>
      <div class="card comparison-card">
        ${rateBandRowHTML({
          label: ownRow.alreadySaved ? c.compareAlreadyLabel : ownRow.year === null ? '—' : ownRow.year,
          sublabel: fill(c.compareRowSublabelTemplate, { pct: ownRow.pctLabel }),
          value: formatCurrency(ownRow.amount),
          highlighted: false,
          describedBy: 'compare-provenance',
        })}
      </div>
      <p class="provenance-caption" id="compare-provenance">${c.compareProvenanceCaption}</p>

      ${unreachable ? emptyStateCardHTML({ title: c.unreachableHeadline, body: c.unreachableBody, ctaLabel: c.unreachableCta, ctaAction: 'set-amount' }) : ''}

      <p class="legal-text">${reg.estimateDisclosure}</p>

      ${attained ? `
        ${infoBannerHTML(`${c.goalAttainedHeadline} ${fill(c.goalAttainedBody, { saved: formatCurrency(savedTowardDeposit) })}`, { live: true })}
      ` : ''}

      ${chartVisible ? `
        <h3 class="section-heading">${c.chartHeading}</h3>

        <!-- THE VIEW TOGGLE IS A VISIBLE PEER OF THE CHART, not a hidden
             affordance (D102). Under year-only the table is the ONLY place on
             this screen carrying date resolution finer than a year at rest, so
             burying it would remove month resolution from the screen entirely
             for anyone who does not scrub. -->
        <p class="visually-hidden" id="chart-view-legend">${c.chartViewLegend}</p>
        <div role="group" aria-labelledby="chart-view-legend">
          ${segmentedControlHTML({
            options: [
              { value: 'chart', label: c.chartViewChartLabel },
              { value: 'table', label: c.chartViewTableLabel },
            ],
            selected: showTable ? 'table' : 'chart',
            action: 'select-chart-view',
          })}
        </div>

        <p class="visually-hidden" id="chart-series-legend">${c.chartSeriesLegend}</p>
        <div role="group" aria-labelledby="chart-series-legend">
          ${segmentedControlHTML({ options: seriesOptions, selected: series, action: 'select-chart-series' })}
        </div>

        ${showTable ? chartTableHTML({
          points,
          series,
          headers: {
            month: c.chartTableYearHeader,
            low: fill(c.chartTableSeriesHeaderTemplate, { amount: formatCurrency(monthlyLow) }),
            high: fill(c.chartTableSeriesHeaderTemplate, { amount: formatCurrency(monthlyHigh) }),
          },
          caption: c.chartTableCaption,
          selectedSuffix: c.chartTableSelectedSuffix,
          valueFormatter: formatCurrency,
        }) : growthChartHTML({
          points,
          yTicks: ticks,
          yearLabels,
          nowLabel: c.xAxisNow,
          legend: [
            { label: seriesOptions[1].label, shade: 'high' },
            { label: seriesOptions[0].label, shade: 'low' },
          ],
          series,
          activeIndex,
          plotLabel: c.chartPlotAriaLabel,
          pointLabelTemplate: (p) => fill(c.chartPointAriaLabelTemplate, {
            date: p.date,
            amount: formatCurrency(series === 'high' ? p.high : p.low),
          }),
          valueFormatter: formatCurrency,
        })}

        <!-- REQUIREMENT 1, AND IT IS THE PRIMARY FIX. Always visible, and it
             reports the ACTIVE POINT rather than a fixed figure — at rest that
             is the window's end, because the at-rest active point is the last
             one. It must never become interaction-only: making the scrub the
             only route to a value would fix the second half of the 21:42 quote
             and reintroduce the first. -->
        ${figureDisplayHTML({
          value: formatCurrency(activeAmount),
          caption: fill(c.readoutCaptionTemplate, { date: activePoint.date }),
          live: true,
        })}

        <!-- HIDDEN, NOT DISABLED, WHEN THE TABLE IS SHOWING. The chips window
             the chart, and the table renders the SAME points array (6.7) - so
             they window the table too. Hiding them therefore FREEZES the
             table's window at whatever the chart was last showing, and the only
             way to change it is to switch back. That is a real cost and it is
             recorded rather than hidden: see D107. -->
        ${showTable ? '' : `
        <p class="visually-hidden" id="chart-range-legend">${c.chartRangeLegend}</p>
        <div role="group" aria-labelledby="chart-range-legend">
          ${chipRowHTML({
            // A chip longer than the projection would draw chart past the
            // goal, which requirement 5 forbids.
            chips: c.chartRangeLabels
              .filter((r) => r.months === null || attainmentMonths === null || r.months <= attainmentMonths)
              .map((r) => ({ value: r.months, label: r.label, ariaLabel: r.ariaLabel })),
            selected: state.chartRangeMonths,
            action: 'select-chart-range',
          })}
        </div>
        `}

        <!-- REQUIREMENT 3. Drawn at every window and in every non-attained
             state, and it carries requirement 5 at the default window: the
             projection ends at attainment even when the chart is showing two
             years of it. YEAR ONLY (D102). -->
        ${attainmentMonths !== null ? `<p class="body-text-lg-primary">${fill(c.endpointTemplate, {
          amount: formatCurrency(combinedGoalValue),
          year: formatYear(attainmentMonths, anchor),
        })}</p>` : ''}

        <!-- ALWAYS VISIBLE, DIRECTLY BENEATH THE ENDPOINT LINE, NEVER BEHIND A
             DISCLOSURE (D103). A participant who does not open a disclosure
             gets nothing from it, and the endpoint is the strongest claim on
             the screen. The link answers rule 3A: it is the only projection on
             the screen that had no route to the sheet behind it. -->
        <p class="provenance-caption">${c.projectionAssumptions}</p>
        ${infoLinkHTML({ label: c.projectionAssumptionsLinkLabel, action: 'open-assumptions-saving-endpoint' })}

        <p class="legal-text">${fill(c.chartCaptionTemplate, { aer: formatPercent(RATES.bankRate) })}</p>
      ` : ''}

      <div class="card why-bigger-deposit-card">
        <h3 class="section-heading">${c.whyBiggerHeading}</h3>
        ${c.benefitRows.map((row) => `
          <div class="benefit-row">
            <p class="benefit-row__label">${row.label}</p>
            <p class="benefit-row__body">${row.bodyTemplate ? fill(row.bodyTemplate, { amount: formatCurrency(propertyValue * (midPctValue - lowPctValue)), highPct: formatPercent(midPctValue, 0), lowPct: formatPercent(lowPctValue, 0) }) : row.body}</p>
            <p class="benefit-row__caption">${row.caption}</p>
          </div>
        `).join('')}
        ${infoLinkHTML({ label: c.ltvInfoLinkLabel, action: 'open-ltv-info' })}
      </div>

      <button type="button" class="button button--primary" data-action="save-goal">${c.primaryCta}</button>

      ${infoBannerHTML(c.assumptionsBannerText)}

      ${howThisWorksCardHTML({
        id: 'result-how-we-worked',
        open: state.resultHowWeWorkedOpen,
        title: c.howWeWorkedTitle,
        intro: c.howWeWorkedIntro,
        rows: [
          summaryContent.whatWeRead,
          { ...summaryContent.whatWeWorkedOut, value: fill(summaryContent.whatWeWorkedOut.value, { essential: formatCurrency(essentialSpending), leftOver: formatCurrency(leftOverValue) }) },
          summaryContent.whatWeAssumed,
        ],
        navLabel: c.seeHowWeWorkedLabel,
        navAction: 'open-assumptions-saving',
      })}

      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
  `;

  bindAppBarLeading(container);

  const redraw = (patch) => {
    const next = setState(patch);
    rerenderInPlace(container, render, { ...ctx, state: next });
  };

  // THE ACTIVE INDEX IS THE CALLER'S, and `bindGrowthChart` only reports moves
  // — so the readout, the guide and the in-plot labels all render from ONE
  // number rather than from three listeners that could disagree.
  if (chartVisible && !showTable) {
    bindGrowthChart(container, {
      pointCount,
      // PERSISTED, NOT RE-RENDERED. The chart repaints itself in place, so the
      // element holding the pointer capture survives a drag and the whole
      // screen is not rebuilt on every `pointermove`. The write is still here
      // because the index has to outlive a chip press or a navigation.
      onActivate: (index) => setState({ chartActiveIndex: index }),
      // The readout is outside the chart, so the chart cannot repaint it - but
      // it must move with the guide or the two would state different figures.
      // Rendered from the point's own accessible name, so there is one source.
      onPaint: ({ date, amount }) => {
        const figure = container.querySelector('.figure-display');
        const caption = container.querySelector('.figure-input__caption');
        if (figure) figure.textContent = amount;
        if (caption) caption.textContent = fill(c.readoutCaptionTemplate, { date });
      },
    });
  }

  container.querySelectorAll('[data-action="select-chart-range"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.value;
      // The active index is reset with the window: an index into a 24-point
      // array means a different month once the window changes, and carrying it
      // over would move the readout without the participant touching it.
      redraw({ chartRangeMonths: raw === 'null' ? null : Number(raw), chartActiveIndex: null });
    });
  });

  container.querySelectorAll('[data-action="select-chart-series"]').forEach((btn) => {
    btn.addEventListener('click', () => redraw({ chartSeries: btn.dataset.value }));
  });

  container.querySelectorAll('[data-action="select-chart-view"]').forEach((btn) => {
    btn.addEventListener('click', () => redraw({ chartView: btn.dataset.value }));
  });

  container.querySelectorAll('[data-action="toggle-disclosure"]').forEach((btn) => {
    btn.addEventListener('click', () => redraw({ resultHowWeWorkedOpen: !state.resultHowWeWorkedOpen }));
  });

  container.querySelector('[data-action="open-assumptions-deposit"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/assumptions/deposit';
  });

  container.querySelectorAll('[data-action="open-assumptions-saving"], [data-action="open-assumptions-saving-endpoint"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ returnFrame: '/calculator/result' });
      window.location.hash = '#/assumptions/saving';
    });
  });

  container.querySelector('[data-action="open-ltv-info"]').addEventListener('click', () => {
    setState({ returnFrame: '/calculator/result' });
    window.location.hash = '#/learn/ltv';
  });

  const setAmountBtn = container.querySelector('[data-action="set-amount"]');
  if (setAmountBtn) {
    setAmountBtn.addEventListener('click', () => {
      window.location.hash = '#/calculator/saving';
    });
  }

  container.querySelector('[data-action="save-goal"]').addEventListener('click', () => {
    const checkpoint = checkpointAmount(state);
    setState({
      goalSaved: true,
      'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
    });
    window.location.hash = '#/tracker';
  });
}
