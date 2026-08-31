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
  pillSegmentsHTML,
  rateBandRowHTML,
  figureRowHTML,
  figureDisplayHTML,
  infoLinkHTML,
  howThisWorksCardHTML,
  emptyStateCardHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency, formatPercent, formatMonthYear, formatYear, axisTicks } from '../format.js';
import { balanceAtMonth, monthsToReachAmount, checkpointAmount, goalMonths, goalAttained, stampDuty, combinedGoal } from '../model/model.js';
import { RATES, CHART_DEPOSIT_PCTS, CHART_WINDOW_MONTHS, CHART_MIN_RANGE_MONTHS, neighbourPcts } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

/** Twenty-four plotted points, or one per month where the window is shorter.
 *  Constant across every window so the scrub's snap granularity does not
 *  change with the chip pressed (the plan's 6.6.1). */
const MAX_POINTS = 24;

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

  const pointCount = Math.max(1, Math.min(MAX_POINTS, Math.ceil(rangeMonths)));

  // The points array. RENDERED BY BOTH THE CHART AND THE TABLE and recomputed
  // by neither, which is what guarantees the table exposes every value the
  // guide can reveal rather than a second derivation that could drift.
  const points = [];
  for (let i = 1; i <= pointCount; i += 1) {
    // NOT rounded to a whole month: at the "Max" window the last point must
    // land exactly on the crossing, and `balanceAtMonth` is continuous.
    const months = (i * rangeMonths) / pointCount;
    points.push({
      months,
      date: formatMonthYear(months, anchor),
      low: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyLow, months }),
      high: balanceAtMonth({ startingBalance: savedTowardDeposit, monthlyAmount: monthlyHigh, months }),
    });
  }
  const maxScale = Math.max(...points.map((p) => Math.max(p.low, p.high))) * CHART_HEADROOM;
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

  // ONE DERIVED ARRAY, HOISTED ABOVE THE TEMPLATE (the plan's 10.3). The rows
  // used to compute `monthsToReachAmount` inside the `.map()` callback and
  // discard it, so the collision predicate and the note below the card — which
  // render outside that closure — had nothing to read. Deriving it once means
  // the rows, the predicate and the note read ONE array rather than three
  // derivations that could disagree, and `monthsToReachAmount` is called once
  // per row rather than twice.
  const compareRows = neighbourPcts(depositPctValue).map((pct) => {
    const amount = propertyValue * pct;
    const goalAtPct = amount + stampDutyValue;
    const alreadySaved = savedTowardDeposit >= goalAtPct;
    const months = alreadySaved
      ? 0
      : monthsToReachAmount({ startingBalance: savedTowardDeposit, targetAmount: goalAtPct, monthlyAmount: selectedRate });
    return {
      pct,
      pctLabel: formatPercent(pct, 0),
      amount,
      alreadySaved,
      months,
      year: alreadySaved || !Number.isFinite(months) ? null : formatYear(Math.ceil(months), anchor),
      selected: pct === depositPctValue,
    };
  });

  // THE COLLISION, READ OFF THE SAME ARRAY. Rows carrying `compareAlreadyLabel`
  // have no year and are excluded — 7.5's "live rows". Two slots and not three:
  // a three-way collision is unreachable at every rate the app can commit.
  const liveYears = compareRows.filter((r) => r.year !== null).map((r) => r.year);
  const collidingYear = liveYears.find((y, i) => liveYears.indexOf(y) !== i) ?? null;
  const colliding = collidingYear === null ? [] : compareRows.filter((r) => r.year === collidingYear);

  const marker = c.compareFootnoteMarker;
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

      <!-- THE COMPARISON CARD IS DRAWN IN EVERY STATE INCLUDING THE ATTAINED
           ONE (D46, D101): a discarded participant value stays visible. What
           changed is the framing, not the presence — the participant objected
           at 24:48 to being shown options they had not chosen, and each row now
           LEADS WITH THE YEAR REACHED rather than with the deposit amount, so
           the set reads as a neighbourhood around their own choice. -->
      <h3 class="section-heading">${c.compareHeading}</h3>
      <div class="card comparison-card">
        ${compareRows.map((row, i) => `
          ${rateBandRowHTML({
            label: row.alreadySaved ? c.compareAlreadyLabel : row.year === null ? '—' : `${row.year}${marker}`,
            sublabel: fill(row.selected ? c.compareRowSelectedSublabelTemplate : c.compareRowSublabelTemplate, { pct: row.pctLabel }),
            value: formatCurrency(row.amount),
            highlighted: row.selected,
            describedBy: 'compare-provenance',
          })}
          ${i < compareRows.length - 1 ? '<hr class="divider" />' : ''}
        `).join('')}
      </div>
      ${colliding.length >= 2 ? `<p class="provenance-caption">${fill(c.compareSameYearNoteTemplate, { a: colliding[0].pctLabel, b: colliding[1].pctLabel })}</p>` : ''}
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
          ${pillSegmentsHTML({
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
          ${pillSegmentsHTML({ options: seriesOptions, selected: series, action: 'select-chart-series' })}
        </div>

        ${showTable ? chartTableHTML({
          points,
          series,
          headers: { month: c.chartTableMonthHeader, low: seriesOptions[0].label, high: seriesOptions[1].label },
          caption: c.chartTableCaption,
          selectedSuffix: c.chartTableSelectedSuffix,
          valueFormatter: formatCurrency,
        }) : growthChartHTML({
          points,
          yTicks: axisTicks(maxScale),
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
          caption: fill(c.readoutCaptionTemplate, { date: activePoint.date, amount: formatCurrency(activeAmount) }),
          live: true,
        })}

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
        <p class="provenance-caption">${c.chartRangeNoteText}</p>
        <p class="visually-hidden" role="status" aria-live="polite">${fill(c.chartRangeAnnouncementTemplate, {
          range: formatYear(rangeMonths, anchor),
          amount: formatCurrency(points[points.length - 1][series]),
        })}</p>

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
      onActivate: (index) => {
        if (index === activeIndex) return;
        const next = setState({ chartActiveIndex: index });
        rerenderInPlace(container, render, { ...ctx, state: next });
        container.querySelector('[data-chart-area]')?.focus({ preventScroll: true });
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
